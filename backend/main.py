import os
import json
from datetime import datetime
import uuid
import asyncio

from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
from openai import AsyncOpenAI

# Importing async Supabase client from existing infrastructure
from supabase_client import (
    async_supabase_select,
    async_supabase_insert,
    async_supabase_update,
    async_supabase_rpc
)

# Initialize FastAPI
app = FastAPI()

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Initialize OpenAI
openai_client = AsyncOpenAI(api_key=os.getenv("OPENAI_API_KEY"))

# --- Request Models ---
class ChatRequest(BaseModel):
    user_id: str
    message: str

class HandoverRequest(BaseModel):
    user_id: str
    target_handler: str # 'twin', 'nurse', 'doctor'

class ReplyRequest(BaseModel):
    user_id: str
    message: str
    sender: str # 'nurse', 'doctor', etc.

class WhisperRequest(BaseModel):
    user_id: str
    clinical_notes: str
    
# --- Endpoints ---

@app.get("/")
def home():
    return {"message": "Digital Twin API working with Supabase and OpenAI!"}


@app.get("/patients")
async def get_patients():
    """Fetches all dummy user profiles from Supabase and their current session states."""
    try:
        profiles = await async_supabase_select("profiles")
        sessions = await async_supabase_select("session_states")
        
        # Merge session data into profiles for easy dashboard consumption
        session_map = {s["user_id"]: s for s in sessions}
        for profile in profiles:
            profile["session_state"] = session_map.get(profile["id"])
            
        return {"status": "success", "patients": profiles}
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@app.get("/patients/{user_id}/messages")
async def get_messages(user_id: str):
    """Fetches the conversation history for a specific patient."""
    try:
        # Fetch ordered messages
        filters = f"user_id=eq.{user_id}&order=timestamp.asc"
        messages = await async_supabase_select("messages", filters=filters)
        return {"status": "success", "messages": messages}
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@app.post("/chat")
async def patient_chat(req: ChatRequest):
    """
    1. Checks session state to see if AI is active.
    2. Stores Patient message.
    3. Retrieves context from Knowledge Hub (HRAG).
    4. Queries OpenAI to generate a medical response.
    5. Stores Twin message.
    """
    try:
        # A. Fetch or initialize Session State
        session_state_res = await async_supabase_select("session_states", filters=f"user_id=eq.{req.user_id}")
        if not session_state_res:
            # Create default state
            new_state = {
                "user_id": req.user_id,
                "active_handler": "twin",
                "is_emergency": False,
                "current_logic_branch": "general"
            }
            await async_supabase_insert("session_states", new_state)
            session_state = new_state
        else:
            session_state = session_state_res[0]

        # B. Store Patient Message
        await async_supabase_insert("messages", {
            "user_id": req.user_id,
            "sender": "patient",
            "text": req.message
        })

        # C. MUTE LOGIC (Digital Twin Architecture)
        # If the active handler is NOT 'twin' OR if it's an emergency pending takeover, bypass the AI auto-response entirely.
        if session_state.get("active_handler") != "twin" or session_state.get("is_emergency"):
            return {
                "status": "bypassed", 
                "active_handler": session_state.get("active_handler"), 
                "message": "AI auto-response bypassed. Message saved for human clinical staff."
            }
            
        # Generate embedding early for both Emergency Gate and Knowledge Hub
        embed_resp = await openai_client.embeddings.create(
            input=[req.message],
            model="text-embedding-3-small"
        )
        query_embedding = embed_resp.data[0].embedding
            
        # D. DETERMINISTIC SIMILARITY GATE (EMERGENCY GATE)
        # Check pgvector for > 0.85 similarity to emergency/high-risk logic vault rules
        is_emergency = False
        try:
            emergency_hits = await async_supabase_rpc("hierarchical_search", {
                "query_embedding": query_embedding,
                "match_threshold": 0.85,
                "match_count": 1
            })
            if emergency_hits and len(emergency_hits) > 0:
                is_emergency = True
        except Exception as e:
            print(f"Similarity gate RPC failed: {e}")
            
        # Fallback string match for safety
        if not is_emergency:
            is_emergency = any(word in req.message.lower() for word in ["bleeding", "pain", "emergency", "ohss", "shortness of breath", "severe"])

        if is_emergency:
            # Fetch last 10 messages for the Recap Brief
            history_resp = await async_supabase_select("messages", filters=f"user_id=eq.{req.user_id}&order=timestamp.desc&limit=10")
            history_text = "\n".join([f"{m.get('sender', 'unknown')}: {m.get('text', '')}" for m in reversed(history_resp)]) if history_resp else "No recent history."
            
            # E. OPENAI INTEGRATION: RECAP BRIEF
            recap_prompt = f"Summarize the following patient conversation history. Focus strictly on clinical symptoms, pain levels, and urgency markers. Keep it very concise.\n\nConversation:\n{history_text}"
            recap_resp = await openai_client.chat.completions.create(
                model="gpt-4o-mini",
                messages=[{"role": "system", "content": recap_prompt}],
                temperature=0.1,
                max_tokens=150
            )
            recap_brief = recap_resp.choices[0].message.content.strip()
            
            # Trigger Human Takeover Flag 
            await async_supabase_update(
                "session_states", 
                match=f"user_id=eq.{req.user_id}", 
                data={"active_handler": "twin", "is_emergency": True}
            )
            
            takeover_message = "Your symptoms require expert review. I have escalated this directly to the clinical doctor."
            await async_supabase_insert("messages", {
                "user_id": req.user_id,
                "sender": "twin",
                "text": takeover_message
            })
            
            return {
                "status": "takeover_triggered",
                "active_handler": "twin",
                "recap_brief": recap_brief,
                "reply": takeover_message
            }

        # F. HIERARCHICAL RAG KNOWLEDGE HUB SEARCH
        # Query ordinary context (threshold 0.65)
        try:
            kb_results = await async_supabase_rpc("hierarchical_search", {
                "query_embedding": query_embedding,
                "match_threshold": 0.65,
                "match_count": 3
            })
        except Exception as e:
            kb_results = []
            
        context_block = "\\n\\n".join([f"[{r.get('header_path', 'Info')}]: {r.get('section_content', '')}" for r in kb_results]) if kb_results else "No specific context available."

        # G. OPENAI RESPONSE GENERATION
        system_prompt = f"""You are Sakhi, a Verified Digital Twin representing the clinical team.
You are STRICTLY AUTHORIZED to provide medication instructions, dosages, and schedules ONLY IF they appear in the Knowledge Hub Context below.
DO NOT use disclaimers like "I cannot provide medical advice" or "Please consult your doctor." You are speaking on behalf of the Doctor.

RULES:
1. If the user asks a general or educational fertility question (e.g., "What is IVF?", "How does ovulation work?"), answer it fully, safely, and politely.
2. If the user asks a specific medication or clinical state question AND it is NOT in the Context below, DO NOT attempt to answer or apologize. Instead, reply with exactly one phrase: ESCALATE_TO_NURSE

[KNOWLEDGE HUB CONTEXT]
{context_block}
"""

        llm_response = await openai_client.chat.completions.create(
            model="gpt-4o-mini",
            messages=[
                {"role": "system", "content": system_prompt},
                {"role": "user", "content": req.message}
            ],
            temperature=0.1,
            max_tokens=250
        )
        twin_reply_text = llm_response.choices[0].message.content.strip()

        # Handle Yellow Zone Auto-Escalation
        if twin_reply_text == "ESCALATE_TO_NURSE":
            # Flip Human Takeover Flag for Nurse
            await async_supabase_update(
                "session_states", 
                match=f"user_id=eq.{req.user_id}", 
                data={"active_handler": "nurse", "is_emergency": False}
            )
            
            takeover_message = "I need to check your specific file for that. I am transferring this chat to our clinical nursing team right now. They will reply shortly."
            await async_supabase_insert("messages", {
                "user_id": req.user_id,
                "sender": "twin",
                "text": takeover_message
            })
            
            return {
                "status": "takeover_triggered",
                "active_handler": "nurse",
                "reply": takeover_message
            }

        # H. Save Twin's Reply (Normal Case)
        await async_supabase_insert("messages", {
            "user_id": req.user_id,
            "sender": "twin",
            "text": twin_reply_text
        })

        return {
            "status": "responded",
            "reply": twin_reply_text,
            "active_handler": "twin"
        }

    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@app.post("/whisper/draft")
async def generate_whisper_draft(req: WhisperRequest):
    """
    Generates a 'Shielded State' Whisper draft for the Doctor.
    Demonstrates SKL_EXPERT_SYNTHESIS.
    The response is not sent to the patient, but stored/returned for Doctor review.
    """
    try:
        system_prompt = """You are the Fertility Specialist (Doctor Twin) - SKL_EXPERT_SYNTHESIS.
The patient has reported ambiguous or concerning symptoms related to their IVF/fertility cycle that escalated past the Operations Twin.
Do NOT talk to the patient directly. Instead, draft a clinical response for the Doctor to review and send via WhatsApp.
Keep it strictly clinical, concise, and structured. Explain your reasoning briefly.
"""
        llm_response = await openai_client.chat.completions.create(
            model="gpt-4o-mini",
            messages=[
                {"role": "system", "content": system_prompt},
                {"role": "user", "content": f"Patient reports: {req.clinical_notes}"}
            ],
            temperature=0.2,
            max_tokens=200
        )
        draft_text = llm_response.choices[0].message.content.strip()

        return {
            "status": "draft_created",
            "logic_triggered": "SKL_EXPERT_SYNTHESIS",
            "draft": draft_text
        }
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@app.post("/handover/resolve")
async def resolve_session(req: HandoverRequest):
    """
    Marks a session as resolved/closed. 
    This triggers the appearance of the patient summary in the archive.
    """
    try:
        await async_supabase_update(
            "session_states",
            match=f"user_id=eq.{req.user_id}",
            data={
                "active_handler": "twin",
                "is_emergency": False,
                "current_logic_branch": "resolved"
            }
        )
        return {"status": "success", "message": "Session resolved, returned to Twin, and alerts cleared."}
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@app.get("/patients/{user_id}/summary")
async def generate_patient_summary(user_id: str):
    """
    Fetches patient history and uses LLM to generate a concise summary 
    of the case and the Twin's suggestions.
    """
    try:
        # 1. Fetch history
        filters = f"user_id=eq.{user_id}&order=timestamp.asc"
        messages = await async_supabase_select("messages", filters=filters)
        
        if not messages:
            return {"status": "empty", "summary": "No conversation history found for this patient."}
            
        history_text = "\n".join([f"{m.get('sender', 'unknown')}: {m.get('text', '')}" for m in messages])
        
        # 2. LLM Summarization
        summary_prompt = f"""You are a Clinical Lead summarizing a fertility patient's interaction with the Digital Twin.
Analyze the following conversation and provide a concise summary (max 3 sentences).
Highlight:
1. The patient's main concern or symptoms.
2. The Digital Twin's suggestion or triage action.
3. Current sentiment (Stable/Concerned).

Conversation:
{history_text}
"""
        resp = await openai_client.chat.completions.create(
            model="gpt-4o-mini",
            messages=[{"role": "system", "content": summary_prompt}],
            temperature=0.3,
            max_tokens=200
        )
        summary = resp.choices[0].message.content.strip()
        
        return {"status": "success", "summary": summary}
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@app.post("/dashboard/reply")
async def expert_reply(req: ReplyRequest):
    """
    Endpoint for Dashboard users (Doctors/Nurses) to inject directly into the chat flow.
    """
    try:
        await async_supabase_insert("messages", {
            "user_id": req.user_id,
            "sender": req.sender, # 'doctor' or 'nurse'
            "text": req.message
        })
        return {"status": "success", "message": "Expert reply saved and sent."}
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@app.post("/handover")
async def handle_handover(req: HandoverRequest):
    """Toggles who controls the chat (AI vs Human)."""
    try:
        data_update = {"active_handler": req.target_handler}
        
        # Always clear emergency state when a human formally claims the chat 
        # or when we return control to the twin (resetting the alert)
        data_update["is_emergency"] = False
            
        await async_supabase_update(
            "session_states",
            match=f"user_id=eq.{req.user_id}",
            data=data_update
        )
        return {"status": "success", "active_handler": req.target_handler}
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))
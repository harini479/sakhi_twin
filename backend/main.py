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

        # C. Check Who is Processing This
        if session_state.get("active_handler") != "twin":
            return {
                "status": "forwarded_to_human", 
                "active_handler": session_state["active_handler"], 
                "message": "Message saved for human expert."
            }
            
        # D. Simple Emergency Rule (Bypassing heavy determinist classifier for this implementation)
        is_emergency = any(word in req.message.lower() for word in ["pain", "blood", "emergency", "help"])
        if is_emergency:
            await async_supabase_update(
                "session_states", 
                match=f"user_id=eq.{req.user_id}", 
                data={"active_handler": "nurse", "is_emergency": True}
            )
            reply_text = "I've detected potential urgency in your message. I am immediately alerting the Nurse to review your case."
            
            # Save the emergency handover notice
            await async_supabase_insert("messages", {
                "user_id": req.user_id,
                "sender": "twin",
                "text": reply_text
            })
            
            return {
                "status": "responded",
                "reply": reply_text,
                "active_handler": "nurse"
            }

        # E. HIERARCHICAL RAG KNOWLEDGE HUB SEARCH
        # 1. Generate text embedding for user's message
        embed_resp = await openai_client.embeddings.create(
            input=[req.message],
            model="text-embedding-3-small"
        )
        query_embedding = embed_resp.data[0].embedding
        
        # 2. Query Knowledge Hub via RPC
        try:
            kb_results = await async_supabase_rpc("hierarchical_search", {
                "query_embedding": query_embedding,
                "match_threshold": 0.65,
                "match_count": 3
            })
        except Exception as e:
            print(f"Warning: HRAG search failed or not configured: {e}")
            kb_results = []
            
        # 3. Format Context
        context_block = "\\n\\n".join([f"[{r.get('header_path', 'Info')}]: {r.get('section_content', '')}" for r in kb_results]) if kb_results else "No specific context available."

        # F. OPENAI RESPONSE GENERATION
        system_prompt = f"""You are Sakhi, a Verified Digital Twin and friendly medical assistant for fertility and pregnancy health.
Use the Context Provided below from our Knowledge Hub to answer the user's question accurately.
If the context doesn't have the answer, decline politely and state you will transfer them to a nurse.
Do NOT give definitive medical diagnosis, only triage and guidance.

[KNOWLEDGE HUB CONTEXT]
{context_block}
"""

        llm_response = await openai_client.chat.completions.create(
            model="gpt-4o-mini",
            messages=[
                {"role": "system", "content": system_prompt},
                {"role": "user", "content": req.message}
            ],
            temperature=0.3,
            max_tokens=250
        )
        twin_reply_text = llm_response.choices[0].message.content.strip()

        # G. Save Twin's Reply
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
        
        # Reset emergency state if handing back to the AI twin
        if req.target_handler == "twin":
            data_update["is_emergency"] = False
            
        await async_supabase_update(
            "session_states",
            match=f"user_id=eq.{req.user_id}",
            data=data_update
        )
        return {"status": "success", "active_handler": req.target_handler}
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))
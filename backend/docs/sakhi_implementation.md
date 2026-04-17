# Sakhi Technical Implementation Document

## 1. Overview
Sakhi is a conversational AI companion designed for fertility and pregnancy context, integrated via a FastAPI backend. It serves users coming primarily from WhatsApp. The system processes incoming messages, intelligently classifies them, and routes them to appropriate Language Models (either a lightweight SLM or a heavier OpenAI model) along with Retrieval-Augmented Generation (RAG) when medical context is required. Finally, it formats the responses into the user's preferred language natively—like Telugu, Tinglish (Telugu in Roman Script), or English—along with multimedia attachments.

## 2. Core Architecture

The architecture relies on several main components:
*   **FastAPI Application Server (`main.py`)**: The entry point exposing the `/sakhi/chat` endpoint to handle incoming WhatsApp messages.
*   **State Management & User Onboarding**: Manages user creation, profile building, and state-machine flows (like Lead Collection).
*   **Parallel Pre-processing**: Translates queries to English, classifies intent/language, and generates intent labels concurrently to reduce latency.
*   **Semantic Router (`modules/model_gateway.py`)**: Routes queries based on embedding similarity to predefined anchor categories.
*   **Retrieval-Augmented Generation (`modules/search_hierarchical.py`)**: A hierarchical RAG system pulling context from Supabase vector databases (Documents and FAQs).
*   **Model Clients**: Interacts with different AI models.
    *   **OpenAI (`modules/response_builder.py`)**: For complex medical queries and language translation tasks (GPT-4o-mini).
    *   **SLM (`modules/slm_client.py`)**: A Small Language Model client for fast, deterministic small-talk and simple questions.
*   **Background Processing**: Pre-computes answers for generated follow-up questions to provide instantaneous replies later.

### Architecture Diagram

```mermaid
flowchart TD
    %% API Entry Point
    API(FastAPI: /sakhi/chat) --> UserResolve{Resolve User}

    %% Authentication
    UserResolve -- New User --> Onboard[Onboarding Flow]
    UserResolve -- Existing --> LeadCheck{Check Lead State}

    %% Lead Check
    LeadCheck -- /newlead --> LeadManager[Lead Manager Flow]
    LeadCheck -- Normal Chat --> PreProcess[Parallel Pre-processing]

    %% Pre-processing
    subasync
    PreProcess --> Trans[Translation to English]
    PreProcess --> Class[Intent & language Classification]
    PreProcess --> Label[Intent Label Generation]
    end

    %% Model Gateway
    Trans --> Gateway{Model Gateway Semantic Router}
    
    %% Routing Paths
    Gateway -- Route.SLM_DIRECT --> SLMDirect[SLM: Generate Chat directly]
    Gateway -- Route.SLM_RAG --> RAGFetch1[RAG: Fetch Context]
    Gateway -- Route.OPENAI_RAG --> RAGFetch2[RAG: Fetch Context]

    %% RAG Retrieval
    RAGFetch1 --> DB[(Supabase Vector DB\nDocs & FAQs)]
    RAGFetch2 --> DB

    DB --> SLMRag[SLM: Generate Response w/ Context]
    DB --> OpenAIRag[OpenAI: Generate Response w/ Context]

    %% Generation
    SLMDirect --> LangCheck{Language Enforcement}
    SLMRag --> LangCheck
    OpenAIRag --> LangCheck

    %% Enforcement
    LangCheck -- English --> Packager[Response Packager]
    LangCheck -- Tinglish --> ForceTinglish[Force Rewrite to Tinglish]
    LangCheck -- Telugu --> ForceTelugu[Force Rewrite to Telugu]

    ForceTinglish --> Packager
    ForceTelugu --> Packager

    %% Post Process
    Packager --> Send[Send Response to User]
    Packager -.-> BackgroundTask[Background: Follow-up Generation\nvia Middleware callback]
```

## 3. Request Processing Workflow

When a user sends a message, it is processed via the `/sakhi/chat` endpoint in the following lifecycle:

### Phase 1: Authentication & Onboarding
1.  **User Resolution:** The system looks up the user via `user_id` or `phone_number` in the Supabase database. If it's a new user, a partial profile is created.
2.  **Onboarding State Machine:** 
    *   Sakhi prompts for basic details sequentially: **Name -> Gender -> Location**.
    *   Once complete, it delivers a welcome message explaining Sakhi's safe space and capabilities.
3.  **Lead Management Flow:** If the user triggers `/newlead` or is in progress with adding a patient, the system handles an interactive 5-step flow to collect Lead details (Name, Phone, Age, Gender, Problem) handled by `modules/lead_manager.py`.

### Phase 2: Pre-Processing & Classification
To minimize latency, the backend executes three tasks asynchronously using `asyncio.gather`:
1.  **Translation (`translate_query`)**: Translates the user's message to English for better semantic routing and RAG retrieval.
2.  **Classification (`classify_message`)**: Detects the target language (English, Telugu, Tinglish) and the general signal intent (`MEDICAL`, `SMALLTALK`, `OUT_OF_SCOPE`).
3.  **Intent Labeling (`slm_client.generate_intent_label`)**: Generates a single-sentence summary of the user's intent to display as a header or preview.

If the user query is clearly out of scope (e.g., about movies/sports), a polite redirect is enforced by the **Guardrails** module immediately.

### Phase 3: Semantic Routing
The **Model Gateway** analyzes the translated English query to decide the optimal execution path. It generates an embedding for the query and computes cosine similarities against predefined anchor vectors:
*   `SMALL_TALK_EXAMPLES`
*   `MEDICAL_SIMPLE_EXAMPLES`
*   `MEDICAL_COMPLEX_EXAMPLES`
*   `FACILITY_INFO_EXAMPLES`

Based on thresholds and highest similarity, it assigns one of three routes:
1.  **`Route.SLM_DIRECT`**: For simple greetings and small talk.
2.  **`Route.SLM_RAG`**: For generic medical questions (e.g., "What is IVF?") and facility inquiries.
3.  **`Route.OPENAI_RAG`**: For complex, nuanced medical queries (ambiguous or severe symptoms).

### Phase 4: Execution & Generation
*   **SLM Direct:** Calls `slm_client.generate_chat`. Bypasses RAG to quickly generate cordial, standard responses.
*   **SLM RAG & OpenAI RAG:**
    1.  **Retrieval:** Calls `hierarchical_rag_query` to fetch related embeddings from Supabase via RPC. It queries hierarchical document chunks and an FAQ table (specifically aiming for YouTube Links/Infographics).
    2.  **Generation:** The context is formatted and fed alongside the user's prompt to either the SLM (`slm_client.generate_rag_response`) or OpenAI (`generate_medical_response`). 
    3.  **Strict Prompting:** Both models are rigorously prompted to provide balanced, hopeful, yet strictly factual information.

### Phase 5: Formatting & Enforcement
Sakhi enforces strict language rules. For complex dialects like **Tinglish** (Telugu in Roman Script) or **Telugu Unicode**:
1.  The primary engine might struggle with maintaining natural grammatical nuances.
2.  The backend employs a **Force Rewrite** mechanism (`force_rewrite_to_tinglish` or `force_rewrite_to_telugu`). It strips down the first-pass English response and restructures the sentences using colloquial phrasing while maintaining core medical terminology in English.

### Phase 6: Post-Processing & Background Tasks
1.  **Payload Structuring:** The final response is packaged with helpful metadata like `mode`, `intent`, and dynamically extracted `infographic_url` and `youtube_link`.
2.  **Reward System:** Based on the type of query and RAG similarity score, users are awarded points asynchronously (`award_points`).
3.  **Follow-up Pre-computation:** Sakhi predicts what the user might ask next. `extract_followup_questions` parses 3 suggested follow-ups from the LLM's response. A background task (`process_background_followups`) iterates over these follow-ups, queries OpenAI to solve them proactively, and posts the compiled answers directly to an external middleware. This enables near-instantaneous replies if the user taps a follow-up button on WhatsApp.

## 4. Database Setup
The architecture relies entirely on **Supabase** (PostgreSQL) for:
*   `sakhi_users` / profiles
*   `sakhi_conversations` for chat history tracking.
*   `sakhi_chat_states` for stateful conversational features like lead gathering.
*   Vector embeddings matching using custom pgvector RPC functions (`hierarchical_search`, `match_faq`).

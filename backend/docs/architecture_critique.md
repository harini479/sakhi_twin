# System Architecture Critique

This document identifies areas of **Tight Coupling**, **Separation of Concerns violations**, and **System Design Flaws** within the current codebase.

## 1. Critical Design Flaws

### 1.1 The "God Object" Pattern in `main.py`
`main.py` violates the Single Responsibility Principle (SRP). It is doing too much:
-   **Routing Logic:** It manually inspects messages and overrides routing decisions (e.g., checking `/rewards`, `/newlead`).
-   **Business Logic:** It contains hardcoded rules for "Tinglish" and "Telugu" handling (e.g., `if target_lang == "Tinglish": ...`).
-   **State Management:** It directly manipulates user profiles during the onboarding flow (lines 216-236).
-   **Task Dispatch:** It launches fire-and-forget async tasks for rewards without supervision.

**Impact:** Hard to test, hard to maintain. Adding a new language or flow requires modifying the core API file.

### 1.2 Duplicate Prompts & Logic (DRY Violation)
There is a massive duplication of "System Prompts" and "Language Rules" across modules:
-   **`modules/response_builder.py`**: Contains `LANGUAGE_LOCK_PROMPT`, `CLASSIFIER_SYS_PROMPT` (lines 25-72).
-   **`modules/slm_client.py`**: Contains `SLM_LANGUAGE_LOCK`, `SLM_SYSTEM_PROMPT_DIRECT` (lines 20-158).
-   **`modules/sakhi_prompt.py`** (likely): Probably contains more prompts.

**Impact:** Changing the "Tinglish" rules requires updating multiple files. Inconsistent behavior between "Direct" (SLM) and "Medical" (OpenAI) modes.

### 1.3 Latency-Inducing "Patch" Logic
The system uses a "Generate then Fix" pattern which doubles latency and cost:
-   **Mechanism:** `force_rewrite_to_tinglish` (in `response_builder.py`) is called *after* an initial response is generated if the strict language check fails.
-   **Flaw:** The underlying model (SLM or GPT) should be prompted correctly *first*. Post-processing rewrites are expensive patches for poor initial prompting or weak models.

## 2. Tight Coupling Areas

### 2.1 Prompt Engineering Coupled with Client Code
`slm_client.py` and `response_builder.py` are **tightly coupled** to the specific *content* of the application.
-   **Issue:** The "Client" class contains hardcoded strings like "You are Sakhi...", "Do not say Aayi/Avunu", and specific vocabulary mappings.
-   **Ideal Design:** Prompts should be injected from a configuration file, database, or a dedicated `PromptManager` class. The Client should only handle network transport.

### 2.2 UI Text in Logic Layers
`modules/lead_manager.py` contains hardcoded English strings for user interaction:
-   `reply_text = "Thanks. Could you share {message}'s phone number..."`
-   **Issue:** This makes localization impossible. You cannot easily switch the lead flow to Telugu without rewriting the code.
-   **Ideal Design:** Use a content key system (e.g., `get_message("ask_phone_number", lang)`).

### 2.3 Data Access Leakage
While `supabase_client.py` exists, business modules construct their own queries:
-   **`lead_manager.py`**: Manually calls `supabase_select` with string filters like `f"user_id=eq.{user_id}"`.
-   **Issue:** If the DB schema changes (e.g., column rename), you must hunt down every string filter in the codebase.
-   **Ideal Design:** A Repository pattern (e.g., `UserRepository`, `LeadRepository`) that encapsulates SQL/Filter logic.

## 3. Implementation Risks

### 3.1 Unsupervised Async Tasks
`main.py` uses `asyncio.create_task(award_points(...))` without awaiting or storing the task reference.
-   **Risk:** If the server crashes or restarts, these tasks are killed instantly. There is no retry mechanism or error reporting for these background tasks.

### 3.2 Hardcoded Language Logic
The system hardcodes rules for "English", "Telugu", and "Tinglish".
-   **Risk:** Adding "Hindi" or "Kannada" would require searching and patching multiple `if/else` blocks across `main.py`, `response_builder.py`, and `slm_client.py`.

## 4. Recommendations Summary

1.  **Refactor `main.py`:** Move Onboarding, Rewards, and Lead triggers into a `ConversationHandler` or `FlowManager` service.
2.  **Centralize Prompts:** Create a `prompts/` directory (YAML/JSON) or a `PromptService` to host all system instructions. Remove them from Python files.
3.  **Repository Pattern:** Create `modules/repositories/` to handle specific table interactions, removing raw Supabase calls from business logic.
4.  **Decouple UI Text:** Move all user-facing strings to a `content` dictionary or JSON file key-values.

# System Design Patterns in Sakhi-Whatsapp-Backend

This document outlines the major system design patterns identified in the codebase. The application follows a **Layered Architecture** using **FastAPI**, with distinct separation between controllers, services, and data access layers.

## 1. Architectural Patterns

### Layered Architecture
The codebase is organized into logical layers, promoting separation of concerns:
- **Presentation/Controller Layer:** `main.py` handles HTTP requests, input validation (Pydantic models), and route definition.
- **Service Layer:** `modules/` contains core business logic (e.g., `lead_manager.py`, `response_builder.py`).
- **Data Access Layer:** Modules like `conversation.py` and `user_profile.py` encapsulate database interactions.

### Asynchronous Event Handling (Fire-and-Forget)
- **Implementation:** `FastAPI.BackgroundTasks` is used in `main.py` to handle non-critical tasks like generating follow-up questions (`process_background_followups`) and awarding points (`award_points`).
- **Benefit:** Improves API response latency by offloading heavy processing from the main request-response cycle.

## 2. Creational Patterns

### Singleton Pattern
- **Implementation:** `get_model_gateway()`, `get_slm_client()`, and `get_guardrails()` ensure that heavy objects (which load models or vectors) are instantiated only once and reused throughout the application lifecycle.
- **File:** `modules/model_gateway.py`, `modules/slm_client.py`, `modules/guardrails.py`

## 3. Structural Patterns

### Facade Pattern
- **Implementation:** `ModelGateway` provides a simplified interface (`decide_route`) to a complex subsystem involving embedding generation, vector similarity comparisons across multiple anchor sets, and threshold logic.
- **Benefit:** Clients (like `main.py`) don't need to know about vectors or cosine similarity; they just ask for a route.
- **File:** `modules/model_gateway.py`

### Adapter / Proxy Pattern
- **Implementation:** `SLMClient` acts as an adapter/proxy for the external SLM (Small Language Model) API. It handles authentication, request formatting, headers, and error handling. It also provides a **Mock** implementation when the endpoint is not configured.
- **File:** `modules/slm_client.py`

### Repository / DAO (Data Access Object) Pattern
- **Implementation:** Functions in `modules/conversation.py` (e.g., `save_user_message`, `get_last_messages`) act as a repository, abstracting the raw `supabase_client` calls. The rest of the app interacts with "messages" and "history" rather than SQL/Supabase queries directly.
- **File:** `modules/conversation.py`

## 4. Behavioral Patterns

### Strategy Pattern
- **Implementation:** The `Route` enum (`SLM_DIRECT`, `SLM_RAG`, `OPENAI_RAG`) in `ModelGateway` defines different strategies for handling user queries.
    - `main.py` selects and executes the specific strategy based on the route determined by the Gateway.
- **Benefit:** Allows easy addition of new handling strategies (e.g., a new "Complex Medical" route) without modifying the routing logic itself.

### Chain of Responsibility / Interceptor Pattern
- **Implementation:** `SakhiGuardrails` acts as an interceptor. It analyzes the intent *before* the main logic processes the message.
    - If `OUT_OF_SCOPE` is detected, it intercepts the request and provides a redirect response, bypassing the expensive RAG/LLM flow.
    - It also has a post-processing step (`clean_output`) that acts as the final link in the chain.
- **File:** `modules/guardrails.py`

### Template Method / Pipeline
- **Implementation:** `response_builder.py` functions (like `generate_medical_response`) follow a strict sequence of steps:
    1. Retrieve Context (RAG)
    2. Build System Prompt (with dynamic blocks for Name, History, Language)
    3. Call LLM
    4. Post-process (Tinglish rewrite, truncation)
- **File:** `modules/response_builder.py`

## Summary Table

| Pattern | Component | Purpose |
| :--- | :--- | :--- |
| **Singleton** | `ModelGateway`, `SLMClient` | Resource efficiency for heavy objects. |
| **Facade** | `ModelGateway` | Hides complexity of semantic routing. |
| **Strategy** | `Route` Enum in `main.py` | Dynamic selection of response generation logic. |
| **Adapter** | `SLMClient` | Standardizes interface for external SLM API. |
| **Repository** | `conversation.py` | Abstracts database operations. |
| **Interceptor** | `SakhiGuardrails` | Pre-checks intent to filter out-of-scope queries. |
| **Async Worker**| `BackgroundTasks` | Offloads follow-up question generation. |

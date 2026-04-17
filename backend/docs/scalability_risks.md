# Scalability Risks & Performance Vulnerabilities

This document outlines the potential performance bottlenecks and scalability risks in the Sakhi backend architecture as user load increases.

## 1. Latency Amplification (The "Double-Gen" Problem)

### Vulnerability
The system currently employs a **"Generate-then-Rewrite"** pattern for handling Tinglish and Telugu responses.
-   **Code Path:** `response_builder.py` -> `generate_medical_response` -> LLM Generate -> `force_rewrite_to_tinglish` -> LLM Generate.
-   **Impact:** This **doubles** the latency and **doubles** the API cost for every non-English interaction.
-   **Scale Risk:** As user base grows, the increased latency (often 10s+) will cause timeouts in the WhatsApp middleware (which typically times out after 10-20s) and higher concurrency on the backend.

### Mitigation
-   **Prompt Engineering:** Invest heavily in prompt engineering to get the correct output in the *first* pass.
-   **Fine-tuning:** Fine-tune a small model (SLM) specifically for Tinglish to avoid the need for GPT-4 rewrites.

## 2. Database Connection Exhaustion

### Vulnerability
The application uses `supabase-py` (via `gotrue` and `postgrest`) which makes HTTP requests, but under high load, managing direct database connections (if switching to direct Postgres access) or even the HTTP throughput can be a bottleneck.
-   **Issue:** The `lead_manager.py` and `user_profile.py` modules make multiple sequential DB calls per user message (Check User -> Get Profile -> Update State -> Save Message).
-   **Scale Risk:** With 10k+ concurrent users, the number of round-trips to Supabase will saturate the connection pool or rate limits, causing 500 errors.

### Mitigation
-   **Caching (Redis):** Implement a Redis layer to cache `UserProfile` and `ChatState`. This reduces DB hits by ~80%.
-   **Batching:** Batch updates (like logging messages) instead of writing them synchronously one by one.

## 3. Sequential Processing Pipeline

### Vulnerability
The request handling pipeline in `main.py` is highly sequential:
1.  Identify User (DB Call)
2.  Translate (LLM/API Call)
3.  Classify (LLM Call)
4.  Routing Logic (Vector Math)
5.  Search (Vector DB Call)
6.  Generate (LLM Call)
7.  Rewrite (Optional LLM Call)
8.  Save Message (DB Call)

### Scale Risk
-   **Latency Stacking:** Each step adds latency. The total time-to-first-byte (TTFB) is the sum of all these steps.
-   **Concurrency Limits:** Long-running requests hold open connections on the FastAPI server, exhausting the worker pool (uVicorn workers).

### Mitigation
-   **Parallelization:** Run Classification and Translation in parallel (already partially implemented but needs optimization).
-   **Optimistic UI:** Return an acknowledgment immediately ("Thinking...") to keep the WhatsApp session alive, then send the answer asynchronously.

## 4. "Fire-and-Forget" Task Failure

### Vulnerability
Background tasks like `award_points` and `save_message` are launched using `asyncio.create_task` without tracking or error handling.
-   **Code:** `asyncio.create_task(award_points(user_id, ...))`
-   **Scale Risk:** Under high load, if the server restarts (e.g., auto-scaling event or crash), all in-flight tasks are lost. Data inconsistency (e.g., missing points, lost logs) will occur.

### Mitigation
-   **Task Queue (Celery/Bull):** Move background tasks to a reliable queue system backed by Redis/RabbitMQ.

## 5. Vector Search Bottlenecks

### Vulnerability
The hierarchical search performs a vector similarity search on `sakhi_section_chunks`.
-   **Scale Risk:** As the Knowledge Base grows (thousands of documents), a brute-force vector search (IVFFlat or HNSW) without metadata filtering can become slow.
-   **Context Stuffing:** Retrieving too many chunks and stuffing them into the LLM context window increases token costs and latency linearly.

### Mitigation
-   **Metadata Filtering:** Ensure searches are filtered by category/tags where possible to reduce the search space.
-   **Hybrid Search:** Combine keyword search (BM25) with vector search for faster, more relevant retrieval.

## 6. Single Point of Failure (State)

### Vulnerability
The system relies heavily on `sakhi_chat_states` in Postgres for conversation flow.
-   **Scale Risk:** High frequency reads/writes to this table for every single message.
-   **Mitigation:** This is the perfect candidate for Redis (Key-Value store) instead of a relational DB.

---

## Summary of Priority Actions

1.  **Cache User Profiles:** Add Redis to stop fetching `sakhi_users` on every message.
2.  **Optimize Pipeline:** Remove the "Force Rewrite" step by improving standard prompts.
3.  **Task Queue:** Implement a proper background worker for non-critical tasks (logging, rewards).

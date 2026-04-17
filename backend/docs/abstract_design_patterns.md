# Abstract System Design Patterns

This document provides abstract versions of the specific solutions implemented in the Sakhi-Whatsapp-Backend. These "blueprints" can be applied to other LLM-powered applications.

## 1. Semantic Model Router (Gateway Pattern)
**Problem:** Balancing cost, latency, and quality across different LLM models (SLM vs. GPT-4).
**Solution:** A gateway that embeds the query and calculates similarity to "anchor vectors" to decide the route *before* calling the primary LLM.

### Abstract Version
```python
class SemanticRouter:
    def __init__(self, anchors: Dict[str, List[str]]):
        self.anchor_vectors = self.precompute(anchors)
        
    async def get_route(self, query: str) -> str:
        q_vec = await self.embed(query)
        scores = {route: self.cosine_similarity(q_vec, vec) 
                  for route, vec in self.anchor_vectors.items()}
        return max(scores, key=scores.get)
```

## 2. Conversational State Machine (Lead Flow Pattern)
**Problem:** Managing multi-step data collection (e.g., Name -> Age -> Location) in a stateless environment like WhatsApp.
**Solution:** An external state store (Supabase/Redis) that tracks the `current_step` and `context_data` for each user ID.

### Abstract Version
```python
class ConversationalFlow:
    STEPS = {
        "init": {"next": "ask_details", "prompt": "Hello! What is your name?"},
        "ask_details": {"next": "complete", "prompt": "Got it. Your age?"}
    }

    async def handle_message(self, user_id, message):
        state = await state_store.get(user_id) or {"step": "init"}
        # 1. Update data from message
        state["data"][state["step"]] = message
        # 2. Transition
        state["step"] = self.STEPS[state["step"]]["next"]
        await state_store.save(user_id, state)
        # 3. Return next prompt
        return self.STEPS[state["step"]]["prompt"]
```

## 3. Pre-flight Guardrail Filter (Pre-Processor Pattern)
**Problem:** Preventing LLMs from hallucinating on off-topic queries without wasting high-tier tokens on classification.
**Solution:** Using regex-based or keyword-based "pre-flight" checks to immediately reject or redirect out-of-scope queries.

### Abstract Version
```python
class DomainGuardrail:
    def __init__(self, blacklist_patterns: List[str], redirect_msg: str):
        self.patterns = [re.compile(p) for p in blacklist_patterns]
        self.redirect = redirect_msg

    def check(self, input_text: str) -> Optional[str]:
        if any(p.search(input_text) for p in self.patterns):
            return self.redirect
        return None
```

## 4. Async Enrichment Pipeline (Background Enrichment Pattern)
**Problem:** Generating complex follow-up data (like answers to suggested questions) increases latency.
**Solution:** Return the primary answer immediately and spawn a background task to push additional "enrichment" data to a client via a callback/webhook.

### Abstract Version
```python
@app.post("/chat")
async def chat(request, background_tasks):
    # 1. Generate Fast Response
    answer = await fast_llm.generate(request.query)
    # 2. Schedule Deep Processing
    background_tasks.add_task(generate_and_push_details, answer, request.callback_url)
    # 3. Return Instant Answer
    return {"reply": answer}
```

## 5. Constraint Enforcer (System Prompt Decorator)
**Problem:** Ensuring strict output formats (script, tone, language) across different LLMs.
**Solution:** A standardized `LANGUAGE_LOCK` system prompt injected regardless of specific model instructions.

### Abstract Version
```python
class PromptDecorator:
    LOCKS = {
        "tinglish": "Use ONLY Roman characters. No Unicode.",
        "json": "Return ONLY valid JSON. No markdown."
    }

    def decorate(self, system_prompt, mode):
        return f"{self.LOCKS[mode]}\n\n{system_prompt}"
```

## 6. Semantic Reward Dispatcher (Engagement Pattern)
**Problem:** Determining user rewards/engagement points based on the quality or novelty of their interaction without tight coupling.
**Solution:** A dispatcher that takes signals (model route, semantic similarity, UI flags) and translates them into discrete reward events.

### Abstract Version
```python
class RewardDispatcher:
    RULES = {
        "novel": {"threshold": 0.4, "points": 5},
        "standard": {"threshold": 1.0, "points": 1}
    }

    def get_reward(self, similarity):
        if similarity < self.RULES["novel"]["threshold"]:
            return self.RULES["novel"]["points"]
        return self.RULES["standard"]["points"]

# Usage in pipeline
points = reward_dispatcher.get_reward(rag_result.similarity)
await wallet_service.award(user_id, points)
```

# Deep Dive: Conversational State Machine

A **Conversational State Machine (CSM)** is a structural pattern used to handle multi-step interactions in asynchronous, stateless environments (like WhatsApp, SMS, or Telegram webhooks). 

In these systems, the backend "forgets" the user between messages. The CSM solves this by externalizing the "brain" (state) into a database and using a transition engine to decide what happens next.

---

## 1. The Design Architecture

The Sakhi implementation follows a three-pillar structure:

### A. The State Store (Persistence)
Instead of relying on in-memory variables, the system persists the "conversation context" in a table (`sakhi_chat_states`).

**Code Snippet (State Retrieval):**
```python
async def _get_chat_state(user_id: str) -> dict:
    rows = await async_supabase_select("sakhi_chat_states", select="context", filters=f"user_id=eq.{user_id}")
    return rows[0].get("context") if rows else {}
```

### B. The Step Registry (Definitions)
Constants define the available states, making the flow easy to read and modify.
```python
STEP_NAME = "ask_name"
STEP_PHONE = "ask_phone"
STEP_AGE = "ask_age"
STEP_COMPLETE = "complete"
```

### C. The Transition Engine (Logic)
A central function acts as the "dispatcher," interpreting the current state and the user's input to move to the `next_step`.

---

## 2. Process Flow Analysis

Let's look at how the `lead_manager.py` handles the logic of moving from "Asking for Name" to "Asking for Phone":

```python
# 1. IDENTIFY CURRENT STATE
context = await _get_chat_state(user_id)
current_step = lead_state.get("step") # e.g., "ask_name"

# 2. PROCESS INPUT & DETERMINE NEXT STEP
if current_step == STEP_NAME:
    temp_data["name"] = message  # Store input
    next_step = STEP_PHONE       # Logic transition
    reply_text = f"Thanks. Could you share {message}'s phone number?"

# 3. COMMIT STATE
await _update_chat_state(user_id, {
    "lead_flow": {"step": next_step, "data": temp_data}
})
```

---

## 3. Abstract Formulation (Plug-and-Play)

To use this pattern in a different project (e.g., a customer support bot or a survey tool), we can abstract it into a **Generic State Machine Engine**.

### The "Base Engine"
```python
class StateMachineEngine:
    def __init__(self, flow_definition, state_provider):
        self.flow = flow_definition
        self.state_provider = state_provider

    async def process(self, user_id, user_input):
        # 1. Fetch current context
        context = await self.state_provider.load(user_id)
        current_step = context.get("step", "START")

        # 2. Get step configuration
        step_config = self.flow.get(current_step)
        
        # 3. Handle data saving
        context["data"][current_step] = user_input
        
        # 4. Determine next step
        next_step = step_config["next"]
        
        # 5. Persist and return response
        context["step"] = next_step
        await self.state_provider.save(user_id, context)
        
        return self.flow[next_step]["prompt"]
```

### The "Plugin" Configuration
Now, you can define *any* flow just by passing a dictionary:

```python
SURVEY_FLOW = {
    "START": {"next": "ASK_RATING", "prompt": "Welcome! Rate us 1-5?"},
    "ASK_RATING": {"next": "ASK_FEEDBACK", "prompt": "Why that rating?"},
    "ASK_FEEDBACK": {"next": "END", "prompt": "Thank you!"}
}

# Implementation
engine = StateMachineEngine(SURVEY_FLOW, RedisStateProvider())
reply = await engine.process("user123", "5")
```

---

## 4. Why This Works
1. **Resilience**: If the server restarts mid-conversation, the user doesn't lose progress.
2. **Infinite Scaling**: Since the state is in a database (Supabase/Redis), any number of identical backend instances can handle the next message.
3. **Traceability**: You can audit exact user progress for drop-off analysis (e.g., "Users always drop off at the 'Ask Problem' step").

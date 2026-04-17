# Janmasethu System Design Challenges

This document outlines the critical scalability and performance bottlenecks currently identified in the Janmasethu backend. We need to address these before scaling to 10k+ concurrent users.

## 1. Latency Amplification (The "Double-Generation" Problem)
**Issue:**  
Currently, every time a user asks a question in Tinglish (Telugu in English script), the system generates an answer twice:
1.  First, it generates a medical answer in English.
2.  Second, it calls the AI again to rewrite that answer into Tinglish.

**Impact:**  
This **doubles the cost** and **doubles the wait time** (latency) for the user. A response that should take 3 seconds currently takes 6-8 seconds.

**Proposed Solution:**  
Invest in "Prompt Engineering" to force the AI to generate the correct Tinglish response in the *first* pass, eliminating the need for the second rewrite step.

---

## 2. Database Bottleneck (Connection Exhaustion)
**Issue:**  
For every single message a user sends, the backend currently makes 3-4 separate calls to the database (Check User -> Fetch Profile -> Update State -> Save Message).

**Impact:**  
If we scale to 10,000 concurrent users, this behavior will flood our database with 30,000+ requests per second, causing it to slow down or crash (Connection Exhaustion).

**Proposed Solution:**  
Implement **Caching (Redis)**. Instead of hitting the main database every time, we store active user profiles and conversation states in a fast, temporary cache. This reduces the load on the main database by ~80%.

---

## 3. Slow Knowledge Retrieval (Vector Search)
**Issue:**  
As our medical knowledge base grows to thousands of documents, searching through all of them using a simple "brute-force" method becomes slow and inefficient.

**Impact:**  
The AI takes longer to find the relevant answer, increasing the overall response time. It might also retrieve irrelevant information if the search isn't specific enough.

**Proposed Solution:**  
Implement **Metadata Filtering**. Instead of searching the *entire* database, we first filter by category (e.g., "IVF", "Pregnancy", "Costs") and then search only within that smaller, relevant subset. This makes retrieval much faster and more accurate.

---

## 4. Single Point of Failure (Conversation State)
**Issue:**  
We currently store the temporary state of a conversation (e.g., "Waiting for user's age") in the main PostgreSQL database (`sahki_chat_states`).

**Impact:**  
Writing ephemeral, temporary data to a permanent hard-disk database is slow and unnecessary. If this database locks up or slows down, the entire chat flow freezes.

**Proposed Solution:**  
Move this temporary conversation state to **Redis** (In-Memory Key-Value Store). Redis is designed exactly for this kind of fast, temporary data and will ensure the chat remains snappy even under heavy load.

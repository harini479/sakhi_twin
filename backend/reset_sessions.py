import asyncio
import os
from supabase_client import async_supabase_update, async_supabase_select

async def reset():
    sessions = await async_supabase_select("session_states")
    if sessions:
        count = 0
        for s in sessions:
            if s.get("active_handler") != "twin":
                await async_supabase_update("session_states", match=f"user_id=eq.{s['user_id']}", data={"active_handler": "twin", "is_emergency": False})
                count += 1
        print(f"Reset {count} sessions.")
    else:
        print("No sessions found.")

if __name__ == "__main__":
    asyncio.run(reset())

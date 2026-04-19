# supabase_client.py

import os
import uuid
from typing import Any, Dict, Optional

import requests
from dotenv import load_dotenv
from supabase import create_client, Client

# Ensure .env is loaded exactly once from this module
_ENV_LOADED = False


def _ensure_env_loaded() -> None:
    global _ENV_LOADED
    if _ENV_LOADED:
        return
    load_dotenv(override=True)
    _ENV_LOADED = True


_ensure_env_loaded()

SUPABASE_URL = os.getenv("SUPABASE_URL")
SUPABASE_SERVICE_ROLE_KEY = os.getenv("SUPABASE_SERVICE_ROLE_KEY") or os.getenv("SUPABASE_SERVICE_ROLE")

if not SUPABASE_URL or not SUPABASE_SERVICE_ROLE_KEY:
    raise Exception("Supabase environment variables missing")

HEADERS = {
    "apikey": SUPABASE_SERVICE_ROLE_KEY,
    "Authorization": f"Bearer {SUPABASE_SERVICE_ROLE_KEY}",
    "Content-Type": "application/json",
    "Prefer": "return=representation",
    "Cache-Control": "no-cache",
    "Pragma": "no-cache"
}

supabase: Client = create_client(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY)


def supabase_insert(table: str, data: Dict[str, Any]):
    url = f"{SUPABASE_URL}/rest/v1/{table}"
    resp = requests.post(url, headers=HEADERS, json=data)
    if resp.status_code >= 300:
        raise Exception(f"Supabase insert failed: {resp.status_code} - {resp.text}")
    return resp.json()


def supabase_select(
    table: str,
    select: str = "*",
    filters: str = "",
    limit: Optional[int] = None,
    rpc: Optional[str] = None,
    payload: Optional[Dict[str, Any]] = None,
):
    """
    Fetch rows from a table or call an RPC when rpc is provided.
    """
    if rpc:
        url = f"{SUPABASE_URL}/rest/v1/rpc/{rpc}"
        resp = requests.post(url, headers=HEADERS, json=payload or {})
    else:
        base_query = f"{SUPABASE_URL}/rest/v1/{table}?select={select}"
        if filters:
            base_query = f"{base_query}&{filters}"
        if limit:
            base_query = f"{base_query}&limit={limit}"
        resp = requests.get(base_query, headers=HEADERS)

    if resp.status_code >= 300:
        raise Exception(f"Supabase select failed: {resp.status_code} - {resp.text}")
    return resp.json()


def supabase_update(table: str, match: str, data: Dict[str, Any]):
    """
    match example: \"user_id=eq.<id>\"
    """
    url = f"{SUPABASE_URL}/rest/v1/{table}?{match}"
    resp = requests.patch(url, headers=HEADERS, json=data)
    if resp.status_code >= 300:
        raise Exception(f"Supabase update failed: {resp.status_code} - {resp.text}")
    return resp.json()


def generate_user_id() -> str:
    return str(uuid.uuid4())


def supabase_rpc(function_name: str, params: Dict[str, Any]):
    """
    Call a Postgres function via Supabase RPC.
    """
    res = supabase.rpc(function_name, params=params).execute()

    # supabase-py returns data and possibly error on the response object
    if hasattr(res, "error") and res.error:
        raise Exception(f"Supabase RPC error: {res.error}")

    if hasattr(res, "data"):
        return res.data

    return res

import httpx

# ---------------------------------------------------------------------------
# Shared async HTTP client (connection-pooled, reused across all requests)
# ---------------------------------------------------------------------------
_async_http_client: Optional[httpx.AsyncClient] = None


def _get_async_client() -> httpx.AsyncClient:
    """Get or create the module-level async HTTP client."""
    global _async_http_client
    if _async_http_client is None or _async_http_client.is_closed:
        _async_http_client = httpx.AsyncClient(timeout=30.0)
    return _async_http_client


# ---------------------------------------------------------------------------
# Native async Supabase functions (non-blocking, no thread pool)
# ---------------------------------------------------------------------------

async def async_supabase_insert(table: str, data: Dict[str, Any]):
    """Insert a row via Supabase REST API (native async)."""
    client = _get_async_client()
    url = f"{SUPABASE_URL}/rest/v1/{table}"
    resp = await client.post(url, headers=HEADERS, json=data)
    if resp.status_code >= 300:
        raise Exception(f"Supabase insert failed: {resp.status_code} - {resp.text}")
    return resp.json()


async def async_supabase_select(
    table: str,
    select: str = "*",
    filters: str = "",
    limit: Optional[int] = None,
    rpc: Optional[str] = None,
    payload: Optional[Dict[str, Any]] = None,
):
    """Fetch rows or call RPC via Supabase REST API (native async)."""
    client = _get_async_client()
    if rpc:
        url = f"{SUPABASE_URL}/rest/v1/rpc/{rpc}"
        resp = await client.post(url, headers=HEADERS, json=payload or {})
    else:
        base_query = f"{SUPABASE_URL}/rest/v1/{table}?select={select}"
        if filters:
            base_query = f"{base_query}&{filters}"
        if limit:
            base_query = f"{base_query}&limit={limit}"
        resp = await client.get(base_query, headers=HEADERS)

    if resp.status_code >= 300:
        raise Exception(f"Supabase select failed: {resp.status_code} - {resp.text}")
    return resp.json()


async def async_supabase_update(table: str, match: str, data: Dict[str, Any]):
    """Update rows via Supabase REST API (native async)."""
    client = _get_async_client()
    url = f"{SUPABASE_URL}/rest/v1/{table}?{match}"
    resp = await client.patch(url, headers=HEADERS, json=data)
    if resp.status_code >= 300:
        raise Exception(f"Supabase update failed: {resp.status_code} - {resp.text}")
    return resp.json()


async def async_supabase_rpc(function_name: str, params: Dict[str, Any]):
    """Call a Postgres RPC function via Supabase REST API (native async)."""
    client = _get_async_client()
    url = f"{SUPABASE_URL}/rest/v1/rpc/{function_name}"
    resp = await client.post(url, headers=HEADERS, json=params)
    if resp.status_code >= 300:
        raise Exception(f"Supabase RPC failed: {resp.status_code} - {resp.text}")
    return resp.json()

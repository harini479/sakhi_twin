import requests
import time
import sys

BASE_URL = "http://127.0.0.1:8000"

def run_tests():
    print(f"Connecting to {BASE_URL}...")
    try:
        # Check Health
        res = requests.get(f"{BASE_URL}/")
        print("API Health:", res.json())
        
        # Check Patients
        print("\n--- Fetching Patients ---")
        p_res = requests.get(f"{BASE_URL}/patients")
        if p_res.status_code != 200:
            print("Failed to fetch patients:", p_res.json())
            return
            
        data = p_res.json()
        print(f"Loaded {len(data.get('patients', []))} patients.")
        for p in data.get('patients', []):
            print(f" - {p.get('name')} (ID: {p.get('id')})")
            
        if not data.get('patients'):
            print("No patients found in your Supabase DB. Make sure you run the SQL schema and insert dummy data.")
            return

    except requests.exceptions.ConnectionError:
        print("\n[ERROR] Could not connect to API. Is FastAPI running?")
        print("Run it with: uvicorn main:app --reload")

if __name__ == "__main__":
    run_tests()

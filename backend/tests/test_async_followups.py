
import asyncio
import os
import unittest
from fastapi.testclient import TestClient
from unittest.mock import AsyncMock, patch, MagicMock

import sys
sys.path.append(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

# Set env var for testing
os.environ["MIDDLEWARE_CALLBACK_URL"] = "http://mock-middleware.com/webhook"
os.environ["OPENAI_API_KEY"] = "sk-test-dummy-key"


# Import app after setting env var
from main import app

client = TestClient(app)

class TestDeferredFollowups(unittest.TestCase):
    def test_deferred_followups(self):
        # We need to run async code inside the test method?
        # unittest doesn't support async naturally, but TestClient handles background tasks synchronously?
        # Actually, FastAPI TestClient executes background tasks synchronously AFTER the response is returned.
        # So we don't need async test method for TestClient itself, but we need AsyncMock for the patched functions.
        
        # Patch generate_followup_answers_payload
        with patch("modules.response_builder.generate_followup_answers_payload", new_callable=AsyncMock) as mock_gen:
            mock_gen.return_value = [
                {"question": "Q1", "answer": "A1"},
                {"question": "Q2", "answer": "A2"}
            ]
            
            # Patch httpx.AsyncClient.post
            with patch("httpx.AsyncClient.post", new_callable=AsyncMock) as mock_post:
                mock_post.return_value.status_code = 200
                mock_post.return_value.raise_for_status = MagicMock()
                 
                # Mock generate_medical_response to return text with follow-ups so extraction works
                with patch("modules.response_builder.generate_medical_response", new_callable=AsyncMock) as mock_med:
                    mock_med.return_value = ("Here is the answer.\n\n Follow ups :\n1. What is cost?\n2. Is it safe?", [])
                     
                    # Mock model_gateway to force OPENAI_RAG route
                    with patch("modules.model_gateway.ModelGateway.decide_route", new_callable=AsyncMock) as mock_route:
                        from modules.model_gateway import Route
                        mock_route.return_value = Route.OPENAI_RAG
                         
                        # 1. Send Request
                        print("Sending request to /sakhi/chat...")
                        response = client.post("/sakhi/chat", json={
                            "message": "Tell me about IVF",
                            "phone_number": "1234567890"
                        })
                        
                        print(f"Response Status: {response.status_code}")
                        if response.status_code != 200:
                            print(f"Response Error: {response.text}")
                        
                        self.assertEqual(response.status_code, 200)
                        data = response.json()
                        print("Main Response:", data)
                        self.assertIn("Follow ups", data["reply"])
                        
                        # 2. Verify Background Task execution
                        # With TestClient, background tasks run immediately after the response.
                        
                        if mock_gen.called:
                            print("✅ generate_followup_answers_payload called!")
                        else:
                            print("❌ generate_followup_answers_payload NOT called")
                            
                        if mock_post.called:
                            print("✅ HTTP Post to Middleware called!")
                            print("Call args:", mock_post.call_args)
                        else:
                            print("❌ HTTP Post to Middleware NOT called")
                            
                        self.assertTrue(mock_gen.called)
                        self.assertTrue(mock_post.called)

if __name__ == "__main__":
    unittest.main()

import requests
import uuid

url = "http://127.0.0.1:8000/chat"
phone = f"91{uuid.uuid4().int % 10000000000}@s.whatsapp.net"
data = {
    "remote_jid": phone,
    "message": "Hi I am Laya, 31 years old and going through an egg freezing cycle."
}
print(f"Testing with remote_jid: {phone}")
res = requests.post(url, json=data)
print(res.status_code)
print(res.json())

# Fetch patients to verify
print("Fetching patients to verify...")
patients = requests.get("http://127.0.0.1:8000/patients").json()
for p in patients.get("patients", []):
    if p.get("remote_jid") == phone:
        print("Successfully found newly registered patient:")
        print(p)

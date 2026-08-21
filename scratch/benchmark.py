import urllib.request
import json
import time
import sys

if hasattr(sys.stdout, 'reconfigure'):
    sys.stdout.reconfigure(encoding='utf-8', errors='replace')

BASE_URL = 'http://127.0.0.1:8005'

def time_request(name, req_fn):
    t0 = time.perf_counter()
    res = req_fn()
    elapsed_ms = (time.perf_counter() - t0) * 1000
    print(f"  ⚡ {name:<48} : {elapsed_ms:>7.2f} ms")
    return res, elapsed_ms

print("=" * 70)
print("  MEMORAI END-TO-END SPEED & SMOOTHNESS BENCHMARK REPORT")
print("=" * 70)

# 1. Health check latency
time_request("1. Health Check (GET /health)", lambda: urllib.request.urlopen(f"{BASE_URL}/health").read())

# 2. Registration latency
test_user = {"name": "Speed Tester", "email": f"speed_{int(time.time())}@memorai.ai", "password": "Password123!"}
reg_data = json.dumps(test_user).encode()
reg_req = urllib.request.Request(f"{BASE_URL}/auth/register", data=reg_data, headers={"Content-Type": "application/json"}, method="POST")
reg_res, _ = time_request("2. User Registration & JWT Issuance (POST /auth)", lambda: json.loads(urllib.request.urlopen(reg_req).read()))

token = reg_res["access_token"]
headers = {"Content-Type": "application/json", "Authorization": f"Bearer {token}"}

# 3. Auth Profile latency
me_req = urllib.request.Request(f"{BASE_URL}/auth/me", headers=headers, method="GET")
time_request("3. Protected User Profile (GET /auth/me)", lambda: urllib.request.urlopen(me_req).read())

# 4. Chat Turn 1 latency (LLM generation + context search)
msg1 = {"message": "I am building an AI agent in Python and Next.js."}
chat_req1 = urllib.request.Request(f"{BASE_URL}/api/chat", data=json.dumps(msg1).encode(), headers=headers, method="POST")
chat_res1, _ = time_request("4. Full Chat Response Turn 1 (POST /api/chat)", lambda: json.loads(urllib.request.urlopen(chat_req1).read()))
convo_id = chat_res1["conversation_id"]

# 5. List conversations latency
convos_req = urllib.request.Request(f"{BASE_URL}/api/chat/conversations", headers=headers, method="GET")
time_request("5. Fetch Conversations List (GET /conversations)", lambda: urllib.request.urlopen(convos_req).read())

# 6. Fetch conversation messages history
msgs_req = urllib.request.Request(f"{BASE_URL}/api/chat/conversations/{convo_id}/messages", headers=headers, method="GET")
time_request("6. Fetch Message History (GET /messages)", lambda: urllib.request.urlopen(msgs_req).read())

# 7. Fetch memory list latency
mems_req = urllib.request.Request(f"{BASE_URL}/api/memories", headers=headers, method="GET")
time_request("7. Query Vector Memories (GET /api/memories)", lambda: urllib.request.urlopen(mems_req).read())

# 8. Chat Turn 2 latency (Contextual Memory Recall)
msg2 = {"message": "What programming languages and frameworks do I use?", "conversation_id": convo_id}
chat_req2 = urllib.request.Request(f"{BASE_URL}/api/chat", data=json.dumps(msg2).encode(), headers=headers, method="POST")
time_request("8. Context-Grounded Recall Turn 2 (POST /api/chat)", lambda: urllib.request.urlopen(chat_req2).read())

print("=" * 70)
print("  ✨ BENCHMARK COMPLETE: All API & Database layers operating smoothly!")
print("=" * 70)

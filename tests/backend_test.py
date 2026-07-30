import requests
import uuid
import time
import json

BASE = "https://zodiac-portal-39.preview.emergentagent.com/api"

results = {"passed": [], "failed": []}

def rec(name, ok, evidence=""):
    if ok:
        results["passed"].append(name)
        print(f"PASS: {name}")
    else:
        results["failed"].append({"area": name, "evidence": evidence})
        print(f"FAIL: {name} :: {evidence}")

# 1. Health
try:
    r = requests.get(f"{BASE}/", timeout=15)
    rec("health", r.status_code == 200 and "Acharya Akash" in r.text, f"{r.status_code} {r.text[:200]}")
except Exception as e:
    rec("health", False, str(e))

# 2. Signup fresh user
email = f"test_{uuid.uuid4().hex[:8]}@astro.com"
token = None
user_id = None
try:
    r = requests.post(f"{BASE}/auth/signup", json={"name":"Tester","email":email,"password":"secret123"}, timeout=15)
    ok = r.status_code == 200 and "token" in r.json()
    if ok:
        token = r.json()["token"]
        user_id = r.json()["user"]["id"]
    rec("signup", ok, f"{r.status_code} {r.text[:200]}")
except Exception as e:
    rec("signup", False, str(e))

# 3. Duplicate signup
try:
    r = requests.post(f"{BASE}/auth/signup", json={"name":"Tester","email":email,"password":"secret123"}, timeout=15)
    rec("signup_duplicate_400", r.status_code == 400, f"{r.status_code} {r.text[:200]}")
except Exception as e:
    rec("signup_duplicate_400", False, str(e))

# 4. Login existing test1
try:
    r = requests.post(f"{BASE}/auth/login", json={"email":"test1@astro.com","password":"secret123"}, timeout=15)
    if r.status_code == 200:
        rec("login_valid", True, "")
    else:
        # fallback to newly created user
        r2 = requests.post(f"{BASE}/auth/login", json={"email":email,"password":"secret123"}, timeout=15)
        rec("login_valid", r2.status_code == 200, f"test1 {r.status_code}; new {r2.status_code} {r2.text[:120]}")
except Exception as e:
    rec("login_valid", False, str(e))

# 5. Login invalid
try:
    r = requests.post(f"{BASE}/auth/login", json={"email":email,"password":"wrongpass"}, timeout=15)
    rec("login_invalid_401", r.status_code == 401, f"{r.status_code}")
except Exception as e:
    rec("login_invalid_401", False, str(e))

H = {"Authorization": f"Bearer {token}"}

# 6. Auth me
try:
    r = requests.get(f"{BASE}/auth/me", headers=H, timeout=15)
    rec("auth_me_valid", r.status_code == 200 and r.json().get("email") == email, f"{r.status_code} {r.text[:200]}")
except Exception as e:
    rec("auth_me_valid", False, str(e))

try:
    r = requests.get(f"{BASE}/auth/me", timeout=15)
    rec("auth_me_missing_401", r.status_code == 401, f"{r.status_code}")
except Exception as e:
    rec("auth_me_missing_401", False, str(e))

try:
    r = requests.get(f"{BASE}/auth/me", headers={"Authorization":"Bearer garbage"}, timeout=15)
    rec("auth_me_invalid_401", r.status_code == 401, f"{r.status_code}")
except Exception as e:
    rec("auth_me_invalid_401", False, str(e))

# 7. Signs list
try:
    r = requests.get(f"{BASE}/horoscopes/signs", timeout=15)
    signs = r.json().get("signs", [])
    rec("horoscopes_signs_12", r.status_code == 200 and len(signs) == 12, f"{r.status_code} count={len(signs)}")
except Exception as e:
    rec("horoscopes_signs_12", False, str(e))

# 8. Horoscope daily + cache
try:
    r = requests.get(f"{BASE}/horoscopes/Leo?period=daily", timeout=60)
    ok = r.status_code == 200 and len(r.json().get("text","")) > 20
    text1 = r.json().get("text","") if ok else ""
    rec("horoscope_daily_leo", ok, f"{r.status_code} {r.text[:200]}")
    if ok:
        r2 = requests.get(f"{BASE}/horoscopes/Leo?period=daily", timeout=60)
        text2 = r2.json().get("text","")
        rec("horoscope_daily_cached", text1 == text2, f"cached_match={text1==text2}")
except Exception as e:
    rec("horoscope_daily_leo", False, str(e))

# 9. Horoscope invalid sign
try:
    r = requests.get(f"{BASE}/horoscopes/Dragon?period=daily", timeout=15)
    rec("horoscope_invalid_400", r.status_code == 400, f"{r.status_code}")
except Exception as e:
    rec("horoscope_invalid_400", False, str(e))

# 10. Birth chart
try:
    body = {"name":"Tester","date_of_birth":"1995-08-15","time_of_birth":"10:30","place_of_birth":"New Delhi, India"}
    r = requests.post(f"{BASE}/birth-chart", json=body, headers=H, timeout=90)
    ok = r.status_code == 200 and r.json().get("sun_sign") == "Leo" and len(r.json().get("reading","")) > 50
    rec("birth_chart_valid", ok, f"{r.status_code} sun={r.json().get('sun_sign') if r.status_code==200 else ''} {r.text[:150]}")
except Exception as e:
    rec("birth_chart_valid", False, str(e))

# birth chart requires auth
try:
    r = requests.post(f"{BASE}/birth-chart", json=body, timeout=15)
    rec("birth_chart_requires_auth", r.status_code == 401, f"{r.status_code}")
except Exception as e:
    rec("birth_chart_requires_auth", False, str(e))

# History
try:
    r = requests.get(f"{BASE}/birth-chart/history", headers=H, timeout=15)
    rec("birth_chart_history", r.status_code == 200 and len(r.json().get("items",[])) >= 1, f"{r.status_code} count={len(r.json().get('items',[]))}")
except Exception as e:
    rec("birth_chart_history", False, str(e))

# 11. Compatibility
try:
    r = requests.post(f"{BASE}/compatibility", json={"sign_a":"Leo","sign_b":"Aquarius"}, timeout=90)
    rec("compatibility_valid", r.status_code == 200 and len(r.json().get("analysis","")) > 50, f"{r.status_code} {r.text[:150]}")
except Exception as e:
    rec("compatibility_valid", False, str(e))

try:
    r = requests.post(f"{BASE}/compatibility", json={"sign_a":"Dragon","sign_b":"Leo"}, timeout=15)
    rec("compatibility_invalid_400", r.status_code == 400, f"{r.status_code}")
except Exception as e:
    rec("compatibility_invalid_400", False, str(e))

# 12. Chat
session_id = None
try:
    r = requests.post(f"{BASE}/chat", json={"message":"Namaste Acharya ji, tell me about my nakshatra"}, headers=H, timeout=90)
    ok = r.status_code == 200 and r.json().get("session_id") and r.json().get("reply")
    if ok: session_id = r.json()["session_id"]
    rec("chat_create", ok, f"{r.status_code} {r.text[:150]}")
except Exception as e:
    rec("chat_create", False, str(e))

if session_id:
    try:
        r = requests.post(f"{BASE}/chat", json={"session_id":session_id,"message":"What about my career?"}, headers=H, timeout=90)
        rec("chat_followup", r.status_code == 200, f"{r.status_code}")
    except Exception as e:
        rec("chat_followup", False, str(e))

    try:
        r = requests.get(f"{BASE}/chat/sessions", headers=H, timeout=15)
        sessions = r.json().get("sessions",[])
        rec("chat_sessions_list", r.status_code == 200 and any(s["session_id"]==session_id for s in sessions), f"{r.status_code} n={len(sessions)}")
    except Exception as e:
        rec("chat_sessions_list", False, str(e))

    try:
        r = requests.get(f"{BASE}/chat/{session_id}/messages", headers=H, timeout=15)
        msgs = r.json().get("messages",[])
        rec("chat_messages_ordered", r.status_code == 200 and len(msgs) >= 4, f"{r.status_code} n={len(msgs)}")
    except Exception as e:
        rec("chat_messages_ordered", False, str(e))

# 13. Payments packages
try:
    r = requests.get(f"{BASE}/payments/packages", timeout=15)
    pkgs = r.json().get("packages", [])
    subs = [p for p in pkgs if p.get("mode") == "subscription"]
    onet = [p for p in pkgs if p.get("mode") == "payment"]
    rec("payments_packages_5", r.status_code == 200 and len(pkgs) == 5 and len(subs) == 1 and len(onet) == 4, f"{r.status_code} total={len(pkgs)} sub={len(subs)} onetime={len(onet)}")
except Exception as e:
    rec("payments_packages_5", False, str(e))

# 14. Payments checkout
sess_id = None
try:
    r = requests.post(f"{BASE}/payments/checkout", json={"package_id":"basic_reading","origin_url":"https://zodiac-portal-39.preview.emergentagent.com"}, headers=H, timeout=30)
    ok = r.status_code == 200 and "checkout_url" in r.json() and "stripe.com" in r.json().get("checkout_url","")
    if ok: sess_id = r.json()["session_id"]
    rec("payments_checkout", ok, f"{r.status_code} {r.text[:250]}")
except Exception as e:
    rec("payments_checkout", False, str(e))

try:
    r = requests.post(f"{BASE}/payments/checkout", json={"package_id":"bogus","origin_url":"https://x"}, headers=H, timeout=15)
    rec("payments_checkout_invalid_400", r.status_code == 400, f"{r.status_code}")
except Exception as e:
    rec("payments_checkout_invalid_400", False, str(e))

# 15. Payment status (no auth)
if sess_id:
    try:
        r = requests.get(f"{BASE}/payments/status/{sess_id}", timeout=30)
        j = r.json()
        rec("payments_status_no_auth", r.status_code == 200 and j.get("session_id") == sess_id and "status" in j and "payment_status" in j, f"{r.status_code} {r.text[:200]}")
    except Exception as e:
        rec("payments_status_no_auth", False, str(e))

print("\n=== SUMMARY ===")
print(f"Passed: {len(results['passed'])}")
print(f"Failed: {len(results['failed'])}")
print(json.dumps(results["failed"], indent=2))

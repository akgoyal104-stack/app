from fastapi import FastAPI, APIRouter, HTTPException, Depends, Request
from fastapi.security import HTTPBearer, HTTPAuthorizationCredentials
from fastapi.responses import StreamingResponse, Response
from dotenv import load_dotenv
from starlette.middleware.cors import CORSMiddleware
from motor.motor_asyncio import AsyncIOMotorClient
import os
import logging
import io
import json as _json
from pathlib import Path
from pydantic import BaseModel, Field, EmailStr
from typing import List, Optional, Dict, Any
import uuid
from datetime import datetime, timezone, timedelta, date
import bcrypt
import jwt as pyjwt
from emergentintegrations.llm.chat import LlmChat, UserMessage
from emergentintegrations.payments.stripe.checkout import (
    StripeCheckout, CheckoutSessionRequest,
)
from reportlab.lib.pagesizes import A4
from reportlab.lib.styles import getSampleStyleSheet, ParagraphStyle
from reportlab.lib.units import inch
from reportlab.lib.colors import HexColor
from reportlab.platypus import SimpleDocTemplate, Paragraph, Spacer, Table, TableStyle
from reportlab.lib import colors as _colors
from astro import compute_chart, chart_summary_for_llm

ROOT_DIR = Path(__file__).parent
load_dotenv(ROOT_DIR / '.env')

mongo_url = os.environ['MONGO_URL']
client = AsyncIOMotorClient(mongo_url)
db = client[os.environ['DB_NAME']]

JWT_SECRET = os.environ['JWT_SECRET']
JWT_ALGO = "HS256"
EMERGENT_LLM_KEY = os.environ['EMERGENT_LLM_KEY']
STRIPE_API_KEY = os.environ['STRIPE_API_KEY']

app = FastAPI()
api_router = APIRouter(prefix="/api")
security = HTTPBearer(auto_error=False)

# ================= Server-side Packages =================
PACKAGES: Dict[str, Dict[str, Any]] = {
    "basic_questions": {
        "name": "Basic Questions",
        "amount": 499.0,
        "currency": "inr",
        "mode": "payment",
        "description": "A focused consultation with Acharya Akash. Both chat and call options available.",
    },
    "detailed_reading": {
        "name": "Detailed Reading",
        "amount": 999.0,
        "currency": "inr",
        "mode": "payment",
        "description": "An in-depth Vedic reading with Acharya Akash. Both chat and call options available.",
    },
}

# ================= Practitioner Profile =================
PRACTITIONER = {
    "name": "Acharya Akash",
    "credentials": [
        "Gold Medalist — KN Rao Institute of Astrology, Bhartiya Vidya Bhavan, New Delhi",
        "Graduate — NIT Jaipur",
        "Appeared in UPSC Civil Services Interview (IAS)",
    ],
    "experience_years": 7,
    "specialization": "Vedic Astrology",
    "contact": {
        "phone": "9528563305",
        "whatsapp": "7417025485",
        "email": "akgoyal104@gmail.com",
    },
    "about": (
        "Acharya Akash brings a rare blend of rigour and reverence to Vedic astrology. "
        "A graduate of NIT Jaipur and a UPSC Civil Services (IAS) interview candidate, "
        "he trained in classical Parashari astrology at KN Rao's institute at Bhartiya Vidya Bhavan, "
        "New Delhi — where he was awarded the Gold Medal. With 7 years of dedicated practice, "
        "his readings pair traditional technique with the analytical clarity of a scientist and the "
        "empathy of a counsellor."
    ),
}

ZODIAC_SIGNS = [
    "Aries", "Taurus", "Gemini", "Cancer", "Leo", "Virgo",
    "Libra", "Scorpio", "Sagittarius", "Capricorn", "Aquarius", "Pisces"
]

# ================= Models =================
class SignupReq(BaseModel):
    name: str
    email: EmailStr
    password: str = Field(min_length=6)

class LoginReq(BaseModel):
    email: EmailStr
    password: str

class BirthDetails(BaseModel):
    name: Optional[str] = None
    date_of_birth: str  # YYYY-MM-DD
    time_of_birth: str  # HH:MM
    place_of_birth: str

class CompatibilityReq(BaseModel):
    sign_a: str
    sign_b: str

class ChatReq(BaseModel):
    session_id: Optional[str] = None
    message: str

class CheckoutReq(BaseModel):
    package_id: str
    origin_url: str

# ================= Helpers =================
def hash_password(p: str) -> str:
    return bcrypt.hashpw(p.encode(), bcrypt.gensalt()).decode()

def verify_password(p: str, h: str) -> bool:
    return bcrypt.checkpw(p.encode(), h.encode())

def make_token(user_id: str, email: str) -> str:
    payload = {
        "sub": user_id,
        "email": email,
        "exp": datetime.now(timezone.utc) + timedelta(days=30),
    }
    return pyjwt.encode(payload, JWT_SECRET, algorithm=JWT_ALGO)

async def get_current_user(
    creds: Optional[HTTPAuthorizationCredentials] = Depends(security)
) -> Dict[str, Any]:
    if not creds:
        raise HTTPException(401, "Missing auth token")
    try:
        payload = pyjwt.decode(creds.credentials, JWT_SECRET, algorithms=[JWT_ALGO])
    except pyjwt.InvalidTokenError:
        raise HTTPException(401, "Invalid token")
    user = await db.users.find_one({"id": payload["sub"]}, {"_id": 0, "password_hash": 0})
    if not user:
        raise HTTPException(401, "User not found")
    return user

def sun_sign_from_date(dob: str) -> str:
    """Compute Western sun sign from YYYY-MM-DD."""
    d = datetime.strptime(dob, "%Y-%m-%d").date()
    m, day = d.month, d.day
    ranges = [
        ("Capricorn", (12, 22), (1, 19)),
        ("Aquarius",  (1, 20),  (2, 18)),
        ("Pisces",    (2, 19),  (3, 20)),
        ("Aries",     (3, 21),  (4, 19)),
        ("Taurus",    (4, 20),  (5, 20)),
        ("Gemini",    (5, 21),  (6, 20)),
        ("Cancer",    (6, 21),  (7, 22)),
        ("Leo",       (7, 23),  (8, 22)),
        ("Virgo",     (8, 23),  (9, 22)),
        ("Libra",     (9, 23),  (10, 22)),
        ("Scorpio",   (10, 23), (11, 21)),
        ("Sagittarius",(11, 22),(12, 21)),
    ]
    for name, (sm, sd), (em, ed) in ranges:
        if (m == sm and day >= sd) or (m == em and day <= ed):
            return name
    return "Capricorn"

async def call_llm(system: str, user_msg: str, session_id: str) -> str:
    chat = LlmChat(
        api_key=EMERGENT_LLM_KEY,
        session_id=session_id,
        system_message=system,
    ).with_model("anthropic", "claude-sonnet-4-5-20250929")
    resp = await chat.send_message(UserMessage(text=user_msg))
    return resp

# ================= Auth =================
@api_router.post("/auth/signup")
async def signup(req: SignupReq):
    existing = await db.users.find_one({"email": req.email.lower()})
    if existing:
        raise HTTPException(400, "Email already registered")
    user_id = str(uuid.uuid4())
    doc = {
        "id": user_id,
        "name": req.name,
        "email": req.email.lower(),
        "password_hash": hash_password(req.password),
        "created_at": datetime.now(timezone.utc).isoformat(),
        "is_premium": False,
    }
    await db.users.insert_one(doc)
    token = make_token(user_id, req.email.lower())
    return {"token": token, "user": {"id": user_id, "name": req.name, "email": req.email.lower(), "is_premium": False}}

@api_router.post("/auth/login")
async def login(req: LoginReq):
    user = await db.users.find_one({"email": req.email.lower()})
    if not user or not verify_password(req.password, user["password_hash"]):
        raise HTTPException(401, "Invalid credentials")
    token = make_token(user["id"], user["email"])
    return {"token": token, "user": {"id": user["id"], "name": user["name"], "email": user["email"], "is_premium": user.get("is_premium", False)}}

@api_router.get("/auth/me")
async def me(user=Depends(get_current_user)):
    return user

# ================= Horoscopes =================
@api_router.get("/horoscopes/signs")
async def list_signs():
    return {"signs": ZODIAC_SIGNS}

@api_router.get("/horoscopes/{sign}")
async def get_horoscope(sign: str, period: str = "daily"):
    sign_norm = sign.capitalize()
    if sign_norm not in ZODIAC_SIGNS:
        raise HTTPException(400, "Invalid zodiac sign")
    if period not in {"daily", "weekly", "monthly"}:
        raise HTTPException(400, "Invalid period")
    today = date.today().isoformat()
    # cache key by day for daily, week-start for weekly, month for monthly
    if period == "weekly":
        d = date.today()
        cache_key = (d - timedelta(days=d.weekday())).isoformat()
    elif period == "monthly":
        cache_key = date.today().strftime("%Y-%m")
    else:
        cache_key = today
    cached = await db.horoscopes.find_one(
        {"sign": sign_norm, "period": period, "cache_key": cache_key},
        {"_id": 0},
    )
    if cached:
        return cached
    system = (
        "You are Acharya Akash, a Gold Medalist Vedic astrologer from KN Rao's institute "
        "at Bhartiya Vidya Bhavan, New Delhi. Write authentic, warm, insightful Vedic horoscopes. "
        "Blend traditional Vedic wisdom (nakshatras, dashas, planetary influences) with practical guidance. "
        "Return ONLY the reading text, 4-6 sentences, no preamble."
    )
    prompt = f"Write a {period} horoscope for {sign_norm} for {today}. Include a lucky color and a lucky number."
    text = await call_llm(system, prompt, session_id=f"horo-{sign_norm}-{period}-{cache_key}")
    doc = {
        "sign": sign_norm,
        "period": period,
        "cache_key": cache_key,
        "text": text,
        "generated_at": datetime.now(timezone.utc).isoformat(),
    }
    await db.horoscopes.insert_one(doc.copy())
    doc.pop("_id", None)
    return doc

# ================= Birth Chart =================
@api_router.post("/birth-chart")
async def birth_chart(req: BirthDetails, user=Depends(get_current_user)):
    # Compute accurate Vedic chart via Swiss Ephemeris (Lahiri sidereal, Whole Sign houses)
    try:
        chart = compute_chart(req.date_of_birth, req.time_of_birth, req.place_of_birth)
    except ValueError as e:
        raise HTTPException(400, str(e))
    except Exception as e:
        logging.exception("chart compute failed")
        raise HTTPException(500, f"Chart computation failed: {e}")

    chart_facts = chart_summary_for_llm(chart)
    system = (
        "You are Acharya Akash, Gold Medalist Vedic astrologer from KN Rao's institute (BVB, New Delhi). "
        "You are given the ACCURATE computed Vedic chart data (Lahiri ayanamsa, Whole Sign houses). "
        "Interpret ONLY from these exact placements — do not invent different positions. "
        "Structure the response in clear sections using markdown headings: "
        "## Lagna & Personality, ## Moon Nakshatra & Mind, ## Key Planetary Yogas, "
        "## Career & Purpose, ## Relationships & Family, ## Wealth & Health, "
        "## Current Vimshottari Mahadasha, ## Remedies & Guidance. "
        "Keep each section 2-4 sentences. Be specific, cite the actual houses/signs from the data."
    )
    prompt = (
        f"Native: {req.name or 'Seeker'}\n"
        f"Birth: {req.date_of_birth} {req.time_of_birth} at {req.place_of_birth}\n\n"
        f"COMPUTED CHART DATA (interpret this):\n{chart_facts}\n\n"
        "Write a detailed Vedic natal chart reading grounded strictly in these placements."
    )
    reading = await call_llm(system, prompt, session_id=f"chart-{user['id']}-{uuid.uuid4()}")
    chart_id = str(uuid.uuid4())
    doc = {
        "id": chart_id,
        "user_id": user["id"],
        "name": req.name,
        "date_of_birth": req.date_of_birth,
        "time_of_birth": req.time_of_birth,
        "place_of_birth": req.place_of_birth,
        "sun_sign": chart["sun_sign"],
        "moon_sign": chart["moon_sign"],
        "ascendant": chart["ascendant"],
        "chart_data": chart,
        "reading": reading,
        "created_at": datetime.now(timezone.utc).isoformat(),
    }
    await db.birth_charts.insert_one(doc.copy())
    doc.pop("_id", None)
    return doc

@api_router.get("/birth-chart/history")
async def chart_history(user=Depends(get_current_user)):
    items = await db.birth_charts.find(
        {"user_id": user["id"]}, {"_id": 0}
    ).sort("created_at", -1).to_list(50)
    return {"items": items}

@api_router.get("/birth-chart/{chart_id}/pdf")
async def chart_pdf(chart_id: str, user=Depends(get_current_user)):
    chart = await db.birth_charts.find_one({"id": chart_id, "user_id": user["id"]}, {"_id": 0})
    if not chart:
        raise HTTPException(404, "Chart not found")
    buf = io.BytesIO()
    doc = SimpleDocTemplate(buf, pagesize=A4, leftMargin=0.9*inch, rightMargin=0.9*inch, topMargin=1*inch, bottomMargin=1*inch)
    styles = getSampleStyleSheet()
    title_style = ParagraphStyle("t", parent=styles["Title"], textColor=HexColor("#8B6A1D"), fontName="Times-Roman", fontSize=26, spaceAfter=6)
    sub_style = ParagraphStyle("s", parent=styles["Normal"], textColor=HexColor("#555555"), fontSize=10, spaceAfter=18)
    h2_style = ParagraphStyle("h", parent=styles["Heading2"], textColor=HexColor("#8B6A1D"), fontName="Times-Bold", fontSize=14, spaceBefore=14, spaceAfter=6)
    body_style = ParagraphStyle("b", parent=styles["BodyText"], fontSize=11, leading=16, spaceAfter=6)
    meta_style = ParagraphStyle("m", parent=styles["Normal"], fontSize=10, textColor=HexColor("#333"), spaceAfter=4)

    story: List[Any] = []
    story.append(Paragraph("Vedic Kundali Reading", title_style))
    story.append(Paragraph("Acharya Akash • Gold Medalist, KN Rao Institute • BVB, New Delhi", sub_style))
    story.append(Paragraph(f"<b>Native:</b> {chart.get('name') or 'Seeker'}", meta_style))
    story.append(Paragraph(f"<b>Date of Birth:</b> {chart['date_of_birth']}", meta_style))
    story.append(Paragraph(f"<b>Time of Birth:</b> {chart['time_of_birth']}", meta_style))
    story.append(Paragraph(f"<b>Place of Birth:</b> {chart['place_of_birth']}", meta_style))
    story.append(Paragraph(f"<b>Ayanamsa:</b> Lahiri • <b>Houses:</b> Whole Sign", meta_style))
    story.append(Spacer(1, 8))

    cdata = chart.get("chart_data")
    if cdata:
        asc = cdata["ascendant"]
        story.append(Paragraph(
            f"<b>Lagna (Ascendant):</b> {asc['sign']} {asc['degrees']}° — {asc['nakshatra']} pada {asc['pada']}",
            meta_style))
        story.append(Paragraph(
            f"<b>Moon Rashi:</b> {cdata['moon_sign']} ({cdata['moon_nakshatra']})   "
            f"<b>Sun Rashi:</b> {cdata['sun_sign']}",
            meta_style))
        cd = cdata.get("current_mahadasha")
        if cd:
            story.append(Paragraph(
                f"<b>Current Mahadasha:</b> {cd['lord']}   ({cd['start']} → {cd['end']})",
                meta_style))
        story.append(Spacer(1, 12))
        # Planet table
        story.append(Paragraph("Planetary Positions", h2_style))
        tbl = [["Planet", "Sign", "Degrees", "House", "Nakshatra", "Pada"]]
        for p in cdata["planets"]:
            name = p["name"] + (" ℞" if p.get("retrograde") else "")
            tbl.append([name, p["sign"], f"{p['degrees']}°", str(p["house"]), p["nakshatra"], str(p["pada"])])
        t = Table(tbl, hAlign="LEFT", colWidths=[70, 65, 55, 45, 95, 40])
        t.setStyle(TableStyle([
            ("BACKGROUND", (0, 0), (-1, 0), HexColor("#8B6A1D")),
            ("TEXTCOLOR", (0, 0), (-1, 0), _colors.white),
            ("FONTNAME", (0, 0), (-1, 0), "Times-Bold"),
            ("FONTSIZE", (0, 0), (-1, -1), 9),
            ("GRID", (0, 0), (-1, -1), 0.25, HexColor("#CCCCCC")),
            ("VALIGN", (0, 0), (-1, -1), "MIDDLE"),
            ("ROWBACKGROUNDS", (0, 1), (-1, -1), [_colors.white, HexColor("#F7F1E1")]),
        ]))
        story.append(t)
        story.append(Spacer(1, 14))
        # Houses
        story.append(Paragraph("Houses (Bhavas)", h2_style))
        htbl = [["House", "Sign", "Occupants"]]
        for h in cdata["houses"]:
            htbl.append([f"H{h['house']}", h["sign"], ", ".join(h["planets"]) or "—"])
        t2 = Table(htbl, hAlign="LEFT", colWidths=[50, 90, 240])
        t2.setStyle(TableStyle([
            ("BACKGROUND", (0, 0), (-1, 0), HexColor("#8B6A1D")),
            ("TEXTCOLOR", (0, 0), (-1, 0), _colors.white),
            ("FONTNAME", (0, 0), (-1, 0), "Times-Bold"),
            ("FONTSIZE", (0, 0), (-1, -1), 9),
            ("GRID", (0, 0), (-1, -1), 0.25, HexColor("#CCCCCC")),
            ("ROWBACKGROUNDS", (0, 1), (-1, -1), [_colors.white, HexColor("#F7F1E1")]),
        ]))
        story.append(t2)
        story.append(Spacer(1, 14))
    else:
        story.append(Paragraph(f"<b>Sun Sign:</b> {chart.get('sun_sign','')}", meta_style))
        story.append(Spacer(1, 12))

    # Simple markdown → PDF: split by ## headings
    text = chart.get("reading", "")
    for block in text.split("\n\n"):
        block = block.strip()
        if not block:
            continue
        if block.startswith("## "):
            story.append(Paragraph(block.replace("## ", ""), h2_style))
        else:
            # bold **text**
            block_html = block.replace("**", "<b>", 1)
            while "**" in block_html:
                block_html = block_html.replace("**", "</b>", 1).replace("**", "<b>", 1)
            block_html = block_html.replace("\n", "<br/>")
            story.append(Paragraph(block_html, body_style))
    story.append(Spacer(1, 20))
    story.append(Paragraph("— With reverence, Acharya Akash", sub_style))

    doc.build(story)
    buf.seek(0)
    filename = f"kundali-{(chart.get('name') or 'seeker').replace(' ','_').lower()}-{chart_id[:8]}.pdf"
    return Response(
        content=buf.read(),
        media_type="application/pdf",
        headers={"Content-Disposition": f'attachment; filename="{filename}"'},
    )

# ================= Compatibility =================
@api_router.post("/compatibility")
async def compatibility(req: CompatibilityReq):
    a = req.sign_a.capitalize()
    b = req.sign_b.capitalize()
    if a not in ZODIAC_SIGNS or b not in ZODIAC_SIGNS:
        raise HTTPException(400, "Invalid zodiac signs")
    system = (
        "You are Acharya Akash, Vedic astrology Gold Medalist. Analyse compatibility between two "
        "zodiac signs using Vedic principles (Guna Milan concepts, elemental harmony, planetary rulers). "
        "Return JSON-like sections: ## Overall Score (out of 36), ## Emotional Bond, ## Communication, "
        "## Long-term Prospects, ## Challenges, ## Advice. Be honest and warm."
    )
    prompt = f"Analyse Vedic compatibility between {a} and {b}."
    text = await call_llm(system, prompt, session_id=f"compat-{a}-{b}-{uuid.uuid4()}")
    return {"sign_a": a, "sign_b": b, "analysis": text}

# ================= AI Chat =================
@api_router.post("/chat/stream")
async def chat_stream(req: ChatReq, user=Depends(get_current_user)):
    """Server-Sent Events stream of Claude's reply, token by token."""
    from emergentintegrations.llm.chat import TextDelta, StreamDone
    session_id = req.session_id or str(uuid.uuid4())
    history = await db.chat_messages.find(
        {"user_id": user["id"], "session_id": session_id}, {"_id": 0}
    ).sort("created_at", 1).to_list(50)
    system = (
        "You are Acharya Akash, a Gold Medalist Vedic astrologer from KN Rao's institute at "
        "Bhartiya Vidya Bhavan, New Delhi. Guide seekers with warmth, wisdom, and Vedic insight. "
        "Reference nakshatras, dashas, planetary periods when relevant. Keep answers focused and helpful. "
        "If asked for a full chart, gently request birth date, time, and place."
    )
    await db.chat_messages.insert_one({
        "user_id": user["id"],
        "session_id": session_id,
        "role": "user",
        "content": req.message,
        "created_at": datetime.now(timezone.utc).isoformat(),
    })
    context_prompt = req.message
    if history:
        past = "\n".join([f"{m['role'].upper()}: {m['content']}" for m in history[-10:]])
        context_prompt = f"Previous conversation:\n{past}\n\nCurrent question: {req.message}"

    async def event_gen():
        yield f"event: session\ndata: {_json.dumps({'session_id': session_id})}\n\n"
        chat = LlmChat(
            api_key=EMERGENT_LLM_KEY,
            session_id=session_id,
            system_message=system,
        ).with_model("anthropic", "claude-sonnet-4-5-20250929")
        collected: List[str] = []
        try:
            async for ev in chat.stream_message(UserMessage(text=context_prompt)):
                if isinstance(ev, TextDelta):
                    collected.append(ev.content)
                    yield f"event: delta\ndata: {_json.dumps({'content': ev.content})}\n\n"
                elif isinstance(ev, StreamDone):
                    break
        except Exception as e:
            yield f"event: error\ndata: {_json.dumps({'error': str(e)})}\n\n"
        full = "".join(collected)
        if full:
            await db.chat_messages.insert_one({
                "user_id": user["id"],
                "session_id": session_id,
                "role": "assistant",
                "content": full,
                "created_at": datetime.now(timezone.utc).isoformat(),
            })
        yield f"event: done\ndata: {_json.dumps({'ok': True})}\n\n"

    return StreamingResponse(
        event_gen(),
        media_type="text/event-stream",
        headers={"Cache-Control": "no-cache", "X-Accel-Buffering": "no"},
    )

@api_router.post("/chat")
async def chat(req: ChatReq, user=Depends(get_current_user)):
    session_id = req.session_id or str(uuid.uuid4())
    # Load history for context
    history = await db.chat_messages.find(
        {"user_id": user["id"], "session_id": session_id}, {"_id": 0}
    ).sort("created_at", 1).to_list(50)
    system = (
        "You are Acharya Akash, a Gold Medalist Vedic astrologer from KN Rao's institute at "
        "Bhartiya Vidya Bhavan, New Delhi. Guide seekers with warmth, wisdom, and Vedic insight. "
        "Reference nakshatras, dashas, planetary periods when relevant. Keep answers focused and helpful. "
        "If asked for a full chart, gently request birth date, time, and place."
    )
    # Save user message
    await db.chat_messages.insert_one({
        "user_id": user["id"],
        "session_id": session_id,
        "role": "user",
        "content": req.message,
        "created_at": datetime.now(timezone.utc).isoformat(),
    })
    # Build conversational context
    context_prompt = req.message
    if history:
        past = "\n".join([f"{m['role'].upper()}: {m['content']}" for m in history[-10:]])
        context_prompt = f"Previous conversation:\n{past}\n\nCurrent question: {req.message}"
    reply = await call_llm(system, context_prompt, session_id=session_id)
    await db.chat_messages.insert_one({
        "user_id": user["id"],
        "session_id": session_id,
        "role": "assistant",
        "content": reply,
        "created_at": datetime.now(timezone.utc).isoformat(),
    })
    return {"session_id": session_id, "reply": reply}

@api_router.get("/chat/sessions")
async def chat_sessions(user=Depends(get_current_user)):
    pipeline = [
        {"$match": {"user_id": user["id"]}},
        {"$sort": {"created_at": -1}},
        {"$group": {
            "_id": "$session_id",
            "last_message": {"$first": "$content"},
            "last_at": {"$first": "$created_at"},
        }},
        {"$sort": {"last_at": -1}},
        {"$limit": 30},
    ]
    items = await db.chat_messages.aggregate(pipeline).to_list(30)
    return {"sessions": [{"session_id": i["_id"], "last_message": i["last_message"], "last_at": i["last_at"]} for i in items]}

@api_router.get("/chat/{session_id}/messages")
async def chat_messages(session_id: str, user=Depends(get_current_user)):
    msgs = await db.chat_messages.find(
        {"user_id": user["id"], "session_id": session_id}, {"_id": 0}
    ).sort("created_at", 1).to_list(200)
    return {"messages": msgs}

# ================= Payments =================
@api_router.get("/payments/packages")
async def get_packages():
    return {"packages": [{"id": k, **v} for k, v in PACKAGES.items()]}

@api_router.post("/payments/checkout")
async def create_checkout(req: CheckoutReq, request: Request, user=Depends(get_current_user)):
    if req.package_id not in PACKAGES:
        raise HTTPException(400, "Invalid package")
    pkg = PACKAGES[req.package_id]
    host_url = str(request.base_url)
    webhook_url = f"{host_url.rstrip('/')}/api/webhook/stripe"
    stripe_checkout = StripeCheckout(api_key=STRIPE_API_KEY, webhook_url=webhook_url)
    success_url = f"{req.origin_url}/payment/success?session_id={{CHECKOUT_SESSION_ID}}"
    cancel_url = f"{req.origin_url}/payment/cancel"
    session_req = CheckoutSessionRequest(
        amount=float(pkg["amount"]),
        currency=pkg["currency"],
        success_url=success_url,
        cancel_url=cancel_url,
        metadata={
            "user_id": user["id"],
            "package_id": req.package_id,
            "mode": pkg["mode"],
        },
    )
    session = await stripe_checkout.create_checkout_session(session_req)
    await db.payment_transactions.insert_one({
        "session_id": session.session_id,
        "user_id": user["id"],
        "package_id": req.package_id,
        "amount": float(pkg["amount"]),
        "currency": pkg["currency"],
        "mode": pkg["mode"],
        "status": "initiated",
        "payment_status": "pending",
        "created_at": datetime.now(timezone.utc).isoformat(),
        "updated_at": datetime.now(timezone.utc).isoformat(),
    })
    return {"checkout_url": session.url, "session_id": session.session_id}

@api_router.get("/payments/status/{session_id}")
async def payment_status(session_id: str):
    record = await db.payment_transactions.find_one({"session_id": session_id}, {"_id": 0})
    if not record:
        raise HTTPException(404, "Transaction not found")
    if record.get("payment_status") != "paid":
        try:
            stripe_checkout = StripeCheckout(api_key=STRIPE_API_KEY, webhook_url="https://placeholder/api/webhook/stripe")
            status = await stripe_checkout.get_checkout_status(session_id)
            if status.payment_status == "paid" or status.status == "complete":
                await db.payment_transactions.update_one(
                    {"session_id": session_id, "payment_status": {"$ne": "paid"}},
                    {"$set": {
                        "status": "completed",
                        "payment_status": "paid",
                        "updated_at": datetime.now(timezone.utc).isoformat(),
                    }},
                )
                # If subscription, mark user premium
                if record.get("mode") == "subscription":
                    await db.users.update_one({"id": record["user_id"]}, {"$set": {"is_premium": True}})
                record = await db.payment_transactions.find_one({"session_id": session_id}, {"_id": 0})
        except Exception as e:
            logging.exception("stripe status poll failed: %s", e)
    return {
        "session_id": record["session_id"],
        "status": record["status"],
        "payment_status": record["payment_status"],
        "amount": record.get("amount"),
        "currency": record.get("currency"),
        "package_id": record.get("package_id"),
    }

@api_router.post("/webhook/stripe")
async def stripe_webhook(request: Request):
    body = await request.body()
    sig = request.headers.get("Stripe-Signature", "")
    stripe_checkout = StripeCheckout(api_key=STRIPE_API_KEY, webhook_url="https://placeholder/api/webhook/stripe")
    try:
        resp = await stripe_checkout.handle_webhook(body, sig)
    except Exception as e:
        logging.exception("webhook err: %s", e)
        raise HTTPException(400, "Invalid webhook")
    if resp and resp.session_id:
        record = await db.payment_transactions.find_one({"session_id": resp.session_id})
        if record and record.get("payment_status") != "paid":
            await db.payment_transactions.update_one(
                {"session_id": resp.session_id},
                {"$set": {
                    "status": "completed" if resp.payment_status == "paid" else record["status"],
                    "payment_status": resp.payment_status,
                    "updated_at": datetime.now(timezone.utc).isoformat(),
                }},
            )
            if resp.payment_status == "paid" and record.get("mode") == "subscription":
                await db.users.update_one({"id": record["user_id"]}, {"$set": {"is_premium": True}})
    return {"status": "ok"}

# Health
@api_router.get("/")
async def root():
    return {"message": "Acharya Akash Vedic Astrology API"}

@api_router.get("/profile")
async def practitioner_profile():
    return PRACTITIONER

app.include_router(api_router)

app.add_middleware(
    CORSMiddleware,
    allow_credentials=True,
    allow_origins=os.environ.get('CORS_ORIGINS', '*').split(','),
    allow_methods=["*"],
    allow_headers=["*"],
)

logging.basicConfig(level=logging.INFO, format='%(asctime)s - %(name)s - %(levelname)s - %(message)s')
logger = logging.getLogger(__name__)

@app.on_event("shutdown")
async def shutdown_db_client():
    client.close()

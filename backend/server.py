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
#from emergentintegrations.llm.chat import LlmChat, UserMessage
#from emergentintegrations.payments.stripe.checkout import (
    #StripeCheckout, CheckoutSessionRequest,
#)
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
#EMERGENT_LLM_KEY = os.environ['EMERGENT_LLM_KEY']
#STRIPE_API_KEY = os.environ['STRIPE_API_KEY']

app = FastAPI()
api_router = APIRouter(prefix="/api")
security = HTTPBearer(auto_error=False)

# ================= Server-side Packages =================
PACKAGES: Dict[str, Dict[str, Any]] = {
    "basic_questions": {
        "name": "Marriage, Relationship, Career, Health",
        "amount": 299.0,
        "currency": "inr",
        "mode": "payment",
        "description": "A focused consultation with Acharya Akash. Both chat and call options available.",
    },
    "detailed_reading": {
        "name": "Detailed Reading",
        "amount": 499.0,
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
HOROSCOPE_TEXT = {
  "Aries": {
        "daily": (
            "With Aries as your Moon sign, feelings may rise quickly and push you toward immediate action. "
            "Move your body, speak plainly, and pause before reacting; patience will protect your peace today."
        ),
        "weekly": (
            "This week favors initiative, but emotional reactions may move faster than the facts. "
            "Start the task you have been postponing, while allowing other people their own pace and perspective."
        ),
        "monthly": (
            "This month asks you to turn courage into emotional steadiness. "
            "Choose one priority, repair conversations quickly, and treat rest as part of your strength."
        ),
    },
    "Taurus": {
        "daily": (
            "With Taurus Moon, you seek emotional security through familiar people, routines, and tangible results. "
            "Enjoy stability today, but stay open to a small change that makes life lighter."
        ),
        "weekly": (
            "A steady week is ahead when you keep practical promises to yourself. "
            "Review spending, home responsibilities, and health routines without allowing stubbornness to create distance."
        ),
        "monthly": (
            "This month supports rebuilding inner security from the inside out. "
            "Simplify your surroundings, make a realistic financial choice, and practise flexibility with people close to you."
        ),
    },
    "Gemini": {
        "daily": (
            "With Gemini Moon, your mind may seek conversation, variety, and constant new input. "
            "Capture your ideas, but protect your attention by finishing one important task before starting another."
        ),
        "weekly": (
            "This week brings useful messages and opportunities to learn, though scattered thinking could drain you. "
            "Ask clear questions, avoid incomplete information, and give important conversations a calm second look."
        ),
        "monthly": (
            "This month is favourable for study, writing, networking, and refreshing your perspective. "
            "Your emotional balance will improve when you limit distractions and create quiet time for focused thinking."
        ),
    },
    "Cancer": {
        "daily": (
            "With Cancer Moon, your emotional world is sensitive to tone, memory, and the atmosphere around you. "
            "Care for yourself as thoughtfully as you care for others, and do not assume every mood is yours to fix."
        ),
        "weekly": (
            "Home and family matters deserve attention this week, but healthy boundaries matter just as much. "
            "Offer support without absorbing everyone else's anxiety, and express your needs before resentment builds."
        ),
        "monthly": (
            "This month encourages emotional renewal and a stronger sense of belonging. "
            "Reconnect with a trusted person, improve your home routine, and allow old worries to soften."
        ),
    },
    "Leo": {
        "daily": (
            "With Leo Moon, you need warmth, appreciation, and room to express your heart. "
            "Let your creativity lead today, while remembering that your self-worth does not depend on immediate praise."
        ),
        "weekly": (
            "This week favours visibility, creative work, and generous leadership. "
            "Invite others into the conversation, because listening will make your confidence feel supportive rather than overwhelming."
        ),
        "monthly": (
            "This month asks you to balance personal radiance with emotional humility. "
            "Celebrate your progress, share credit freely, and choose relationships where you can be sincere."
        ),
    },
    "Virgo": {
        "daily": (
            "With Virgo Moon, your mind may look for problems to solve before it allows you to relax. "
            "Use your practical judgment today, but replace harsh self-criticism with one measurable improvement."
        ),
        "weekly": (
            "Organization will reduce emotional noise this week. "
            "Sort priorities, delegate where possible, and resist turning a minor mistake into a judgment about your ability."
        ),
        "monthly": (
            "This month is about creating systems that support wellbeing rather than pursuing exhausting perfection. "
            "Improve sleep, work, and money routines gradually, and make time for activities with no productive outcome."
        ),
    },
    "Libra": {
        "daily": (
            "With Libra Moon, peace and fairness are important to your emotional wellbeing. "
            "Keep the atmosphere pleasant today, but do not hide your real preference merely to avoid disagreement."
        ),
        "weekly": (
            "Relationship conversations can become more balanced this week when you speak directly and listen carefully. "
            "Make decisions from your priorities rather than waiting for everyone to approve."
        ),
        "monthly": (
            "This month highlights partnership, cooperation, and the need for clear boundaries. "
            "You can preserve harmony without carrying the full emotional workload; choose honest agreements over uncertainty."
        ),
    },
    "Scorpio": {
        "daily": (
            "With Scorpio Moon, emotions may run deep even when your words remain measured. "
            "Trust your perception, but check assumptions before assigning motives to someone who seems quiet or distant."
        ),
        "weekly": (
            "This week supports honest reflection and releasing stored resentment. "
            "Protect your privacy, verify important information, and choose a direct conversation instead of testing trust indirectly."
        ),
        "monthly": (
            "This month brings an opportunity for emotional transformation through simpler, steadier habits. "
            "Release an outdated attachment, strengthen your boundaries, and allow trusted people to see your softer side."
        ),
    },
    "Sagittarius": {
        "daily": (
            "With Sagittarius Moon, emotional wellbeing grows through freedom, truth, learning, and possibility. "
            "Follow your curiosity today, but do not promise more than your time and energy can deliver."
        ),
        "weekly": (
            "A lively week favours travel planning, study, and fresh ideas. "
            "Keep your enthusiasm grounded by completing existing commitments before adding another exciting project."
        ),
        "monthly": (
            "This month broadens your outlook and helps you recover optimism after pressure. "
            "Seek meaningful experiences, speak honestly without being careless, and turn inspiration into a practical next step."
        ),
    },
    "Capricorn": {
        "daily": (
            "With Capricorn Moon, you may process feelings by becoming useful, responsible, or quietly self-controlled. "
            "Meet your duties today, but share the load and acknowledge your emotions before they become exhaustion."
        ),
        "weekly": (
            "Career and long-term responsibilities require focus this week, yet rest is not a distraction from progress. "
            "Set a boundary around recovery time and ask for concrete support where you need it."
        ),
        "monthly": (
            "This month rewards sustainable progress rather than constant pressure. "
            "Review your goals, simplify obligations, and recognize your achievements before moving to the next demand."
        ),
    },
    "Aquarius": {
        "daily": (
            "With Aquarius Moon, you value independence, ideas, and emotional space. "
            "Give yourself room to think today, but explain your feelings clearly so distance is not mistaken for indifference."
        ),
        "weekly": (
            "This week is productive for group projects, community connections, and unconventional solutions. "
            "Stay present in personal conversations, because a thoughtful explanation is better than disappearing to process alone."
        ),
        "monthly": (
            "This month supports new networks and a more authentic approach to relationships. "
            "Keep your individuality while practising consistent check-ins with people who need emotional reliability from you."
        ),
    },
    "Pisces": {
        "daily": (
            "With Pisces Moon, you may absorb moods easily and need quiet time to separate your feelings from the surrounding atmosphere. "
            "Trust your intuition today, but ground decisions in facts, timing, and clear boundaries."
        ),
        "weekly": (
            "A reflective week favours rest, creativity, spiritual practice, and compassionate conversations. "
            "Protect your energy, check whether worry is being mistaken for intuition, and keep your routine simple."
        ),
        "monthly": (
            "This month invites emotional healing through creativity, sleep, and kinder self-talk. "
            "Help others from a position of steadiness rather than guilt, and give your imagination a practical channel."
        ),
    },
}
       
# ================= Models =================
class SignupReq(BaseModel):
    name: str
    email: EmailStr
    password: str = Field(min_length=6)

class LoginReq(BaseModel):
    email: EmailStr
    password: str

class PhoneOtpReq(BaseModel):
    phone: str = Field(min_length=10, max_length=15)

class PhoneVerifyReq(BaseModel):
    phone: str
    otp: str
    name: Optional[str] = None

class UpiConfirmReq(BaseModel):
    package_id: str
    utr: str = Field(min_length=6, max_length=30)
    amount: float
    consultation_mode: Optional[str] = None
    screenshot_base64: Optional[str] = None  # data URL or raw base64
    note: Optional[str] = None

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
    consultation_mode: Optional[str] = None  # "chat" | "call"

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

#async def call_llm(system: str, user_msg: str, session_id: str) -> str:
    #chat = LlmChat(
        #api_key=EMERGENT_LLM_KEY,
        #session_id=session_id,
        #system_message=system,
   # ).with_model("anthropic", "claude-sonnet-4-5-20250929")
   # resp = await chat.send_message(UserMessage(text=user_msg))
   # return resp

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

# ================= Phone OTP (demo — see note in finish summary) =================
import random as _random

def _normalize_phone(p: str) -> str:
    return "".join(ch for ch in p if ch.isdigit())[-10:]

@api_router.post("/auth/phone/send-otp")
async def phone_send_otp(req: PhoneOtpReq):
    phone = _normalize_phone(req.phone)
    if len(phone) != 10:
        raise HTTPException(400, "Enter a valid 10-digit mobile number")
    otp = f"{_random.randint(100000, 999999)}"
    expires_at = datetime.now(timezone.utc) + timedelta(minutes=5)
    await db.phone_otps.update_one(
        {"phone": phone},
        {"$set": {
            "phone": phone,
            "otp": otp,
            "expires_at": expires_at.isoformat(),
            "attempts": 0,
            "created_at": datetime.now(timezone.utc).isoformat(),
        }},
        upsert=True,
    )
    logger.info(f"[DEMO OTP] phone={phone} otp={otp}")
    # In production this would be sent via Twilio/MSG91.
    # For demo, we return the OTP so the seeker can complete the flow.
    return {"sent": True, "phone": phone, "demo_otp": otp,
            "note": "Demo mode — OTP shown here. Plug in Twilio/MSG91 for real SMS."}

@api_router.post("/auth/phone/verify")
async def phone_verify(req: PhoneVerifyReq):
    phone = _normalize_phone(req.phone)
    rec = await db.phone_otps.find_one({"phone": phone})
    if not rec:
        raise HTTPException(400, "Request an OTP first")
    exp = datetime.fromisoformat(rec["expires_at"])
    if datetime.now(timezone.utc) > exp:
        raise HTTPException(400, "OTP expired. Request a new one.")
    if rec.get("attempts", 0) >= 5:
        raise HTTPException(400, "Too many attempts. Request a new OTP.")
    if req.otp.strip() != rec["otp"]:
        await db.phone_otps.update_one({"phone": phone}, {"$inc": {"attempts": 1}})
        raise HTTPException(400, "Invalid OTP")
    # Find or create user by phone
    user = await db.users.find_one({"phone": phone})
    if not user:
        user_id = str(uuid.uuid4())
        user = {
            "id": user_id,
            "name": req.name or f"Seeker {phone[-4:]}",
            "phone": phone,
            "email": None,
            "password_hash": None,
            "created_at": datetime.now(timezone.utc).isoformat(),
            "is_premium": False,
        }
        await db.users.insert_one(user)
    await db.phone_otps.delete_one({"phone": phone})
    token = make_token(user["id"], user.get("email") or f"{phone}@phone.local")
    return {
        "token": token,
        "user": {"id": user["id"], "name": user["name"], "email": user.get("email"),
                 "phone": user.get("phone"), "is_premium": user.get("is_premium", False)},
    }


# ================= Horoscopes =================
@api_router.get("/horoscopes/signs")
async def list_signs():
    return {"signs": ZODIAC_SIGNS}


@api_router.get("/horoscopes/{sign}")
async def get_horoscope(sign: str, period: str = "daily"):
    sign_norm = sign.strip().capitalize()

    if sign_norm not in ZODIAC_SIGNS:
        raise HTTPException(400, "Invalid zodiac sign")

    period_norm = period.strip().lower()

    if period_norm not in {"daily", "weekly", "monthly"}:
        raise HTTPException(400, "Invalid period")

    horoscope_text = HOROSCOPE_TEXT[sign_norm][period_norm]

    return {
        "sign": sign_norm,
        "period": period_norm,
        "text": horoscope_text,
        "source": "static",
    }

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
        "You are given the ACCURATE computed Vedic chart data (Lahiri ayanamsa, Whole Sign houses, "
        "including Navamsa D9 and current Antardasha). "
        "Interpret ONLY from these exact placements — do not invent different positions. "
        "Structure the response in clear sections using markdown headings: "
        "## Lagna & Personality, ## Moon Nakshatra & Mind, ## Key Planetary Yogas, "
        "## Navamsa (D9) — Marriage & Dharma, "
        "## Career & Purpose, ## Relationships & Family, ## Wealth & Health, "
        "## Current Mahadasha–Antardasha Guidance, ## Remedies. "
        "Keep each section 2-4 sentences. Be specific, cite the actual houses/signs from the data."
    )
    prompt = (
        f"Native: {req.name or 'Seeker'}\n"
        f"Birth: {req.date_of_birth} {req.time_of_birth} at {req.place_of_birth}\n\n"
        f"COMPUTED CHART DATA (interpret this):\n{chart_facts}\n\n"
        "Write a detailed Vedic natal chart reading grounded strictly in these placements."
    )
    reading = "This feature is not available right now, consult the Acharya for indepth analysis of your Kundali"
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
    text = "This feauture is not available right now, please consult Acharya for indepth Kundali Milan"
    return {"sign_a": a, "sign_b": b, "analysis": text}

# ================= AI Chat =================
#@api_router.post("/chat/stream")
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

#@api_router.post("/chat")
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
    reply = "AI option has been disabled"
    await db.chat_messages.insert_one({
        "user_id": user["id"],
        "session_id": session_id,
        "role": "assistant",
        "content": reply,
        "created_at": datetime.now(timezone.utc).isoformat(),
    })
    return {"session_id": session_id, "reply": reply}

#@api_router.get("/chat/sessions")
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

#@api_router.get("/chat/{session_id}/messages")
async def chat_messages(session_id: str, user=Depends(get_current_user)):
    msgs = await db.chat_messages.find(
        {"user_id": user["id"], "session_id": session_id}, {"_id": 0}
    ).sort("created_at", 1).to_list(200)
    return {"messages": msgs}

# ================= Payments =================
UPI_ID = "akgoyal104@okicici"
UPI_PAYEE_NAME = "Akash Goyal"

@api_router.get("/payments/upi")
async def upi_info(package_id: Optional[str] = None):
    amount = None
    if package_id and package_id in PACKAGES:
        amount = PACKAGES[package_id]["amount"]
    # Build UPI intent link (upi://pay?...) — opens directly in any UPI app on mobile
    from urllib.parse import quote
    params = f"pa={UPI_ID}&pn={quote(UPI_PAYEE_NAME)}&cu=INR"
    if amount:
        params += f"&am={amount:.2f}"
        params += f"&tn={quote(PACKAGES[package_id]['name'])}"
    upi_url = f"upi://pay?{params}"
    # Free QR generator (no dependency, no API key needed)
    qr_url = f"https://api.qrserver.com/v1/create-qr-code/?size=280x280&margin=10&data={quote(upi_url)}"
    return {
        "upi_id": UPI_ID,
        "payee_name": UPI_PAYEE_NAME,
        "amount": amount,
        "upi_url": upi_url,
        "qr_url": qr_url,
    }

@api_router.get("/payments/packages")
async def get_packages():
    return {"packages": [{"id": k, **v} for k, v in PACKAGES.items()]}

@api_router.post("/payments/upi-confirm")
async def upi_confirm(req: UpiConfirmReq, user=Depends(get_current_user)):
    if req.package_id not in PACKAGES:
        raise HTTPException(400, "Invalid package")
    pkg = PACKAGES[req.package_id]
    consultation_mode = req.consultation_mode if req.consultation_mode in {"chat", "call"} else "chat"
    shot = req.screenshot_base64 or ""
    if shot and len(shot) > 6 * 1024 * 1024:
        raise HTTPException(413, "Screenshot too large (max ~4MB)")
    conf_id = str(uuid.uuid4())
    doc = {
        "id": conf_id,
        "user_id": user["id"],
        "user_name": user.get("name"),
        "user_email": user.get("email"),
        "user_phone": user.get("phone"),
        "package_id": req.package_id,
        "package_name": pkg["name"],
        "amount": float(req.amount or pkg["amount"]),
        "currency": "inr",
        "utr": req.utr.strip(),
        "consultation_mode": consultation_mode,
        "note": req.note,
        "screenshot_base64": shot,
        "method": "upi",
        "status": "reported",
        "created_at": datetime.now(timezone.utc).isoformat(),
    }
    await db.upi_payments.insert_one(doc.copy())
    logger.info(f"[UPI CONFIRM] user={user['id']} pkg={req.package_id} utr={req.utr}")
    return {"id": conf_id, "status": "reported"}

#@api_router.post("/payments/checkout")
async def create_checkout(req: CheckoutReq, request: Request, user=Depends(get_current_user)):
    if req.package_id not in PACKAGES:
        raise HTTPException(400, "Invalid package")
    pkg = PACKAGES[req.package_id]
    consultation_mode = req.consultation_mode if req.consultation_mode in {"chat", "call"} else "chat"
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
            "consultation_mode": consultation_mode,
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
        "consultation_mode": consultation_mode,
        "status": "initiated",
        "payment_status": "pending",
        "created_at": datetime.now(timezone.utc).isoformat(),
        "updated_at": datetime.now(timezone.utc).isoformat(),
    })
    return {"checkout_url": session.url, "session_id": session.session_id}

#@api_router.get("/payments/status/{session_id}")
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

#@api_router.post("/webhook/stripe")
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

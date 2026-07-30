"""
Vedic astrology chart computation using Swiss Ephemeris.
Uses Lahiri ayanamsa (standard in India) and Whole Sign houses (traditional Vedic).
"""
import swisseph as swe
from datetime import datetime, timedelta
from typing import Dict, Any, Tuple, Optional, List
import pytz
from geopy.geocoders import Nominatim
from timezonefinder import TimezoneFinder

swe.set_sid_mode(swe.SIDM_LAHIRI)

SIGNS = ["Aries", "Taurus", "Gemini", "Cancer", "Leo", "Virgo",
         "Libra", "Scorpio", "Sagittarius", "Capricorn", "Aquarius", "Pisces"]

NAKSHATRAS = [
    "Ashwini", "Bharani", "Krittika", "Rohini", "Mrigashira", "Ardra",
    "Punarvasu", "Pushya", "Ashlesha", "Magha", "Purva Phalguni", "Uttara Phalguni",
    "Hasta", "Chitra", "Swati", "Vishakha", "Anuradha", "Jyeshtha",
    "Mula", "Purva Ashadha", "Uttara Ashadha", "Shravana", "Dhanishta",
    "Shatabhisha", "Purva Bhadrapada", "Uttara Bhadrapada", "Revati"
]

# Vimshottari Dasha lords, one per nakshatra, repeating 3x
NAK_LORD = ["Ketu", "Venus", "Sun", "Moon", "Mars", "Rahu", "Jupiter", "Saturn", "Mercury"] * 3
DASHA_YEARS = {"Ketu": 7, "Venus": 20, "Sun": 6, "Moon": 10, "Mars": 7,
               "Rahu": 18, "Jupiter": 16, "Saturn": 19, "Mercury": 17}
DASHA_ORDER = ["Ketu", "Venus", "Sun", "Moon", "Mars", "Rahu", "Jupiter", "Saturn", "Mercury"]

NAK_SIZE = 360.0 / 27.0    # 13°20'
PADA_SIZE = NAK_SIZE / 4   # 3°20'
NAVAMSA_SIZE = 30.0 / 9.0  # 3°20'

_geocoder = Nominatim(user_agent="acharya_akash_astro/1.0", timeout=10)
_tzf = TimezoneFinder()


def geocode_place(place: str) -> Tuple[float, float]:
    loc = _geocoder.geocode(place)
    if not loc:
        raise ValueError(f"Could not find place: {place}. Try 'City, Country'.")
    return loc.latitude, loc.longitude


def get_timezone_name(lat: float, lon: float) -> str:
    return _tzf.timezone_at(lat=lat, lng=lon) or "UTC"


def _sign_details(long_deg: float) -> Tuple[int, float, int, int]:
    """Return (sign_index 0-11, deg_in_sign, nakshatra_index 0-26, pada 1-4)."""
    long_deg = long_deg % 360
    sign_idx = int(long_deg // 30)
    deg_in_sign = long_deg - sign_idx * 30
    nak_idx = int(long_deg // NAK_SIZE)
    nak_pos = long_deg - nak_idx * NAK_SIZE
    pada = int(nak_pos // PADA_SIZE) + 1
    return sign_idx, deg_in_sign, nak_idx, pada


def _navamsa_sign(long_deg: float) -> int:
    """Return Navamsa (D9) sign index 0..11 for a planet at longitude."""
    return int((long_deg % 360) // NAVAMSA_SIZE) % 12


def _compute_antardasha(mahadasha: Dict[str, Any]) -> List[Dict[str, Any]]:
    """Given the running Mahadasha, split into 9 Antardashas in classic order."""
    lord = mahadasha["lord"]
    lord_years = mahadasha["years"]
    start = datetime.fromisoformat(mahadasha["start"]).replace(tzinfo=pytz.UTC)
    start_idx = DASHA_ORDER.index(lord)
    antar_list: List[Dict[str, Any]] = []
    cursor = start
    for i in range(9):
        sub = DASHA_ORDER[(start_idx + i) % 9]
        duration_years = (lord_years * DASHA_YEARS[sub]) / 120.0
        end = cursor + timedelta(days=duration_years * 365.25)
        antar_list.append({
            "lord": sub,
            "start": cursor.date().isoformat(),
            "end": end.date().isoformat(),
            "years": round(duration_years, 2),
        })
        cursor = end
    return antar_list


def compute_chart(date_str: str, time_str: str, place: str) -> Dict[str, Any]:
    lat, lon = geocode_place(place)
    tz_name = get_timezone_name(lat, lon)
    tz = pytz.timezone(tz_name)
    local_dt = tz.localize(datetime.strptime(f"{date_str} {time_str}", "%Y-%m-%d %H:%M"))
    ut_dt = local_dt.astimezone(pytz.UTC)
    jd = swe.julday(ut_dt.year, ut_dt.month, ut_dt.day,
                    ut_dt.hour + ut_dt.minute / 60 + ut_dt.second / 3600)

    flg = swe.FLG_SIDEREAL | swe.FLG_SPEED

    planet_ids = {
        "Sun": swe.SUN, "Moon": swe.MOON, "Mercury": swe.MERCURY, "Venus": swe.VENUS,
        "Mars": swe.MARS, "Jupiter": swe.JUPITER, "Saturn": swe.SATURN, "Rahu": swe.MEAN_NODE,
    }
    raw_pos: Dict[str, Dict[str, float]] = {}
    for name, pid in planet_ids.items():
        result, _ = swe.calc_ut(jd, pid, flg)
        raw_pos[name] = {"longitude": result[0], "speed": result[3]}
    # Ketu = Rahu + 180°
    raw_pos["Ketu"] = {"longitude": (raw_pos["Rahu"]["longitude"] + 180) % 360,
                       "speed": raw_pos["Rahu"]["speed"]}

    # Ascendant (Lagna) — Whole Sign houses
    _cusps, ascmc = swe.houses_ex(jd, lat, lon, b'W', flg)
    asc_lon = ascmc[0]
    asc_sign_idx, asc_deg, asc_nak_idx, asc_pada = _sign_details(asc_lon)

    planet_data: List[Dict[str, Any]] = []
    for name in ["Sun", "Moon", "Mercury", "Venus", "Mars", "Jupiter", "Saturn", "Rahu", "Ketu"]:
        p = raw_pos[name]
        s_idx, d_in_s, n_idx, pada = _sign_details(p["longitude"])
        house = ((s_idx - asc_sign_idx) % 12) + 1
        navamsa_idx = _navamsa_sign(p["longitude"])
        planet_data.append({
            "name": name,
            "sign": SIGNS[s_idx],
            "degrees": round(d_in_s, 2),
            "house": house,
            "nakshatra": NAKSHATRAS[n_idx],
            "pada": pada,
            "navamsa_sign": SIGNS[navamsa_idx],
            "retrograde": (name not in {"Rahu", "Ketu"}) and (p["speed"] < 0),
        })

    # Navamsa (D9) chart — Ascendant navamsa becomes the D9 lagna
    d9_asc_idx = _navamsa_sign(asc_lon)
    d9_planets = []
    for pd in planet_data:
        p_navamsa_idx = SIGNS.index(pd["navamsa_sign"])
        d9_house = ((p_navamsa_idx - d9_asc_idx) % 12) + 1
        d9_planets.append({"name": pd["name"], "sign": pd["navamsa_sign"], "house": d9_house})
    d9_houses = []
    for h in range(1, 13):
        s_idx = (d9_asc_idx + h - 1) % 12
        d9_houses.append({
            "house": h,
            "sign": SIGNS[s_idx],
            "planets": [p["name"] for p in d9_planets if p["house"] == h],
        })
    navamsa_chart = {
        "ascendant_sign": SIGNS[d9_asc_idx],
        "planets": d9_planets,
        "houses": d9_houses,
    }

    houses: List[Dict[str, Any]] = []
    for h in range(1, 13):
        s_idx = (asc_sign_idx + h - 1) % 12
        planets_in_house = [pd["name"] for pd in planet_data if pd["house"] == h]
        houses.append({"house": h, "sign": SIGNS[s_idx], "planets": planets_in_house})

    # Vimshottari Dasha timeline (Mahadasha only)
    moon_lon = raw_pos["Moon"]["longitude"] % 360
    moon_nak_idx = int(moon_lon // NAK_SIZE)
    moon_nak_pos = moon_lon - moon_nak_idx * NAK_SIZE
    portion_used = moon_nak_pos / NAK_SIZE
    birth_lord = NAK_LORD[moon_nak_idx]
    balance_years = (1 - portion_used) * DASHA_YEARS[birth_lord]

    timeline: List[Dict[str, Any]] = []
    cursor_dt = ut_dt
    lord = birth_lord
    lord_years = balance_years
    for i in range(10):
        end_dt = cursor_dt + timedelta(days=lord_years * 365.25)
        timeline.append({
            "lord": lord,
            "start": cursor_dt.date().isoformat(),
            "end": end_dt.date().isoformat(),
            "years": round(lord_years, 2),
        })
        cursor_dt = end_dt
        next_idx = (DASHA_ORDER.index(lord) + 1) % 9
        lord = DASHA_ORDER[next_idx]
        lord_years = DASHA_YEARS[lord]

    now_utc = datetime.now(pytz.UTC)
    current_dasha: Optional[Dict[str, Any]] = None
    for d in timeline:
        start = datetime.fromisoformat(d["start"]).replace(tzinfo=pytz.UTC)
        end = datetime.fromisoformat(d["end"]).replace(tzinfo=pytz.UTC)
        if start <= now_utc < end:
            current_dasha = d
            break

    # Antardasha (sub-period) within current Mahadasha
    antardashas: List[Dict[str, Any]] = []
    current_antar: Optional[Dict[str, Any]] = None
    if current_dasha:
        antardashas = _compute_antardasha(current_dasha)
        for a in antardashas:
            a_start = datetime.fromisoformat(a["start"]).replace(tzinfo=pytz.UTC)
            a_end = datetime.fromisoformat(a["end"]).replace(tzinfo=pytz.UTC)
            if a_start <= now_utc < a_end:
                current_antar = a
                break

    return {
        "birth_details": {
            "date": date_str, "time": time_str, "place": place,
            "latitude": round(lat, 4), "longitude": round(lon, 4),
            "timezone": tz_name,
        },
        "ascendant": {
            "sign": SIGNS[asc_sign_idx],
            "degrees": round(asc_deg, 2),
            "nakshatra": NAKSHATRAS[asc_nak_idx],
            "pada": asc_pada,
        },
        "moon_sign": next(p["sign"] for p in planet_data if p["name"] == "Moon"),
        "moon_nakshatra": next(p["nakshatra"] for p in planet_data if p["name"] == "Moon"),
        "sun_sign": next(p["sign"] for p in planet_data if p["name"] == "Sun"),
        "planets": planet_data,
        "houses": houses,
        "navamsa": navamsa_chart,
        "current_mahadasha": current_dasha,
        "current_antardasha": current_antar,
        "antardashas": antardashas,
        "dasha_timeline": timeline[:6],
        "ayanamsa": "Lahiri",
        "house_system": "Whole Sign",
    }


def chart_summary_for_llm(chart: Dict[str, Any]) -> str:
    lines = [
        f"Ayanamsa: {chart['ayanamsa']}, House system: {chart['house_system']}",
        f"Ascendant (Lagna): {chart['ascendant']['sign']} {chart['ascendant']['degrees']}° "
        f"— Nakshatra {chart['ascendant']['nakshatra']} pada {chart['ascendant']['pada']}",
        f"Moon Rashi: {chart['moon_sign']} (Nakshatra {chart['moon_nakshatra']})",
        f"Sun Rashi: {chart['sun_sign']}",
        "",
        "Planetary positions:",
    ]
    for p in chart["planets"]:
        retro = " (R)" if p.get("retrograde") else ""
        lines.append(f"  • {p['name']}: {p['sign']} {p['degrees']}° — House {p['house']} — {p['nakshatra']} pada {p['pada']}{retro}")
    lines.append("")
    lines.append("Houses (Bhavas):")
    for h in chart["houses"]:
        occ = ", ".join(h["planets"]) or "empty"
        lines.append(f"  H{h['house']} {h['sign']}: {occ}")
    if chart.get("current_mahadasha"):
        d = chart["current_mahadasha"]
        lines.append("")
        lines.append(f"Current Vimshottari Mahadasha: {d['lord']} ({d['start']} → {d['end']})")
    if chart.get("current_antardasha"):
        a = chart["current_antardasha"]
        lines.append(f"Current Antardasha (sub-period): {a['lord']} ({a['start']} → {a['end']})")
    if chart.get("navamsa"):
        nv = chart["navamsa"]
        lines.append("")
        lines.append(f"Navamsa (D9) Lagna: {nv['ascendant_sign']}")
        for p in nv["planets"]:
            lines.append(f"  D9 · {p['name']}: {p['sign']} (D9 House {p['house']})")
    return "\n".join(lines)

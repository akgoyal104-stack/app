import { useState, useEffect } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { api, API } from "@/lib/api";
import { toast } from "sonner";
import { Loader2, Compass, Clock, MapPin, User, Download } from "lucide-react";
import React from "react";

const SIGN_SYMBOL = {
  Aries: "♈", Taurus: "♉", Gemini: "♊", Cancer: "♋", Leo: "♌", Virgo: "♍",
  Libra: "♎", Scorpio: "♏", Sagittarius: "♐", Capricorn: "♑", Aquarius: "♒", Pisces: "♓",
};
 
function renderMarkdown(text = "") {
  const html = text
    .replace(/^## (.*)$/gm, '<h2>$1</h2>')
    .replace(/^# (.*)$/gm, '<h2>$1</h2>')
    .replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>')
    .split(/\n{2,}/).map(p => p.startsWith("<h2>") ? p : `<p>${p.replace(/\n/g,"<br/>")}</p>`).join("");
  return { __html: html };
}


const CHART_SIZE = 400;
const BORDER = 20;
const PLANET_FONT_SIZE = 10;
const PLANET_LINE_HEIGHT = 12;
const RASHI_FONT_SIZE = 20;

const NORTH_INDIAN_HOUSES = {
  1: {
    points: "200,20 290,110 200,200 110,110",
    box: { x: 132, y: 136, width: 136, height: 42 },
    columns: 4,
  },
  2: {
    points: "20,20 200,20 110,110",
    box: { x: 48, y: 70, width: 124, height: 34 },
    columns: 3,
  },
  3: {
    points: "20,20 110,110 20,200",
    box: { x: 28, y: 116, width: 72, height: 76 },
    columns: 1,
  },
  4: {
    points: "20,200 110,110 200,200 110,290",
    box: { x: 48, y: 218, width: 124, height: 52 },
    columns: 3,
  },
  5: {
    points: "20,200 110,290 20,380",
    box: { x: 28, y: 300, width: 72, height: 76 },
    columns: 1,
  },
  6: {
    points: "20,380 200,380 110,290",
    box: { x: 48, y: 346, width: 124, height: 28 },
    columns: 3,
  },
  7: {
    points: "110,290 200,200 290,290 200,380",
    box: { x: 132, y: 344, width: 136, height: 28 },
    columns: 4,
  },
  8: {
    points: "200,380 380,380 290,290",
    box: { x: 228, y: 346, width: 124, height: 28 },
    columns: 3,
  },
  9: {
    points: "380,200 380,380 290,290",
    box: { x: 300, y: 300, width: 72, height: 76 },
    columns: 1,
  },
  10: {
    points: "380,200 290,110 200,200 290,290",
    box: { x: 228, y: 218, width: 124, height: 52 },
    columns: 3,
  },
  11: {
    points: "380,20 380,200 290,110",
    box: { x: 318, y: 108, width: 48, height: 84 },
    columns: 1,
  },
  12: {
    points: "200,20 380,20 290,110",
    box: { x: 228, y: 70, width: 124, height: 34 },
    columns: 3,
  },
};

const NORTH_INDIAN_LINES = `
  M20 20 L110 110 L200 20
  M20 200 L110 110 L200 200 L110 290 L20 200
  M20 380 L110 290 L200 380
  M200 380 L290 290 L380 380
  M380 380 L290 290 L380 200
  M380 20 L290 110 L380 200
  M200 20 L290 110 L200 200
  M200 200 L290 290
`;

const RASHI_NUMBERS = {
  mesha: 1,
  aries: 1,
  vrishabha: 2,
  vrishabh: 2,
  taurus: 2,
  mithuna: 3,
  mithun: 3,
  gemini: 3,
  karka: 4,
  kark: 4,
  cancer: 4,
  simha: 5,
  leo: 5,
  kanya: 6,
  virgo: 6,
  tula: 7,
  libra: 7,
  vrishchika: 8,
  vrischika: 8,
  scorpio: 8,
  dhanu: 9,
  sagittarius: 9,
  makara: 10,
  capricorn: 10,
  kumbha: 11,
  aquarius: 11,
  meena: 12,
  pisces: 12,
};

const PLANET_ABBREVIATIONS = {
  sun: "Su",
  surya: "Su",
  moon: "Mo",
  chandra: "Mo",
  mars: "Ma",
  mangal: "Ma",
  kuja: "Ma",
  mercury: "Me",
  budha: "Me",
  jupiter: "Ju",
  guru: "Ju",
  brihaspati: "Ju",
  venus: "Ve",
  shukra: "Ve",
  saturn: "Sa",
  shani: "Sa",
  rahu: "Ra",
  ketu: "Ke",
  pluto: "Pl",
  uranus: "Ur",
  neptune: "Ne",
  ascendant: "As",
  lagna: "As",
};

function normalizeText(value) {
  return String(value ?? "")
    .trim()
    .toLowerCase()
    .replace(/[\s_-]+/g, "");
}

function getNumberFromValue(value) {
  if (typeof value === "number") {
    return Number.isFinite(value) ? value : "";
  }

  const text = String(value ?? "").trim();

  if (!text) {
    return "";
  }

  const directNumber = Number(text);

  if (Number.isFinite(directNumber)) {
    return directNumber;
  }

  const match = text.match(/\d+/);

  return match ? Number(match[0]) : "";
}

function getRashiNumber(value) {
  const numericValue = getNumberFromValue(value);

  if (numericValue >= 1 && numericValue <= 12) {
    return numericValue;
  }

  return RASHI_NUMBERS[normalizeText(value)] || "";
}

function getPlanetAbbreviation(planet, fallback = "") {
  if (planet === null || planet === undefined) {
    return fallback;
  }

  if (typeof planet === "object") {
    const value =
      planet.abbreviation ??
      planet.abbr ??
      planet.shortName ??
      planet.name ??
      planet.planet ??
      planet.graha ??
      planet.body ??
      fallback;

    return getPlanetAbbreviation(value, fallback);
  }

  const text = String(planet).trim();

  if (!text) {
    return fallback;
  }

  const normalized = normalizeText(text);

  if (PLANET_ABBREVIATIONS[normalized]) {
    return PLANET_ABBREVIATIONS[normalized];
  }

  const abbreviationMatch = text.match(/\(([A-Za-z]{1,3})\)/);

  if (abbreviationMatch) {
    return abbreviationMatch[1];
  }

  return text;
}

function getHouseNumber(house, fallbackNumber) {
  if (!house || typeof house !== "object") {
    return fallbackNumber;
  }

  const possibleValues = [
    house.house,
    house.houseNumber,
    house.house_number,
    house.houseNo,
    house.house_no,
    house.bhava,
    house.bhavaNumber,
    house.number,
  ];

  for (const value of possibleValues) {
    const number = getNumberFromValue(value);

    if (number >= 1 && number <= 12) {
      return number;
    }
  }

  return fallbackNumber;
}

function getHouseSign(house) {
  if (!house || typeof house !== "object") {
    return "";
  }

  return (
    house.sign ??
    house.rashi ??
    house.signNumber ??
    house.sign_number ??
    house.rashiNumber ??
    house.rashi_number ??
    house.signNo ??
    house.rashiNo ??
    ""
  );
}

function getHousePlanets(house) {
  if (!house || typeof house !== "object") {
    return [];
  }

  const source =
    house.planets ??
    house.planet ??
    house.grahas ??
    house.occupants ??
    house.bodies ??
    house.planetNames ??
    house.planet_names ??
    house.planetaryPositions ??
    [];

  if (Array.isArray(source)) {
    return source.map((planet, index) =>
      getPlanetAbbreviation(planet, `P${index + 1}`)
    );
  }

  if (typeof source === "string") {
    return source
      .split(/[,\s]+/)
      .map((planet, index) =>
        getPlanetAbbreviation(planet, `P${index + 1}`)
      );
  }

  if (source && typeof source === "object") {
    return Object.entries(source).map(([key, value], index) =>
      getPlanetAbbreviation(value, getPlanetAbbreviation(key, `P${index + 1}`))
    );
  }

  return [];
}

function normalizeHouses(data) {
  const source =
    data?.houses ??
    data?.chart?.houses ??
    data?.birthChart?.houses ??
    [];

  const result = [];

  if (Array.isArray(source)) {
    source.forEach((house, index) => {
      const normalizedHouse =
        house && typeof house === "object" ? house : { sign: house };

      result.push({
        ...normalizedHouse,
        house: getHouseNumber(normalizedHouse, index + 1),
      });
    });

    return result;
  }

  if (source && typeof source === "object") {
    Object.entries(source).forEach(([key, value]) => {
      const fallbackNumber = getNumberFromValue(key);
      const normalizedHouse =
        value && typeof value === "object" ? value : { sign: value };

      const houseNumber = getHouseNumber(
        normalizedHouse,
        fallbackNumber
      );

      if (houseNumber >= 1 && houseNumber <= 12) {
        result.push({
          ...normalizedHouse,
          house: houseNumber,
        });
      }
    });
  }

  return result;
}

function parsePoints(points) {
  return points.split(/\s+/).map((point) => {
    const [x, y] = point.split(",").map(Number);
    return { x, y };
  });
}

function getPolygonCenter(points) {
  const total = points.reduce(
    (sum, point) => ({
      x: sum.x + point.x,
      y: sum.y + point.y,
    }),
    { x: 0, y: 0 }
  );

  return {
    x: total.x / points.length,
    y: total.y / points.length,
  };
}

function getRashiPosition(layout) {
  const center = getPolygonCenter(parsePoints(layout.points));
  const direction = {
    x: 200 - center.x,
    y: 200 - center.y,
  };

  const length = Math.hypot(direction.x, direction.y);

  if (length === 0) {
    return center;
  }

  const inwardDistance = 10;

  return {
    x: center.x + (direction.x / length) * inwardDistance,
    y: center.y + (direction.y / length) * inwardDistance,
  };
}

function estimatePlanetWidth(label) {
  return Math.max(
    PLANET_FONT_SIZE * 1.2,
    String(label).length * PLANET_FONT_SIZE * 0.62
  );
}

function getPlanetRows(planets, layout) {
  const preferredColumns = Math.max(
    1,
    Math.min(layout.columns || 1, planets.length)
  );

  const availableWidth = layout.box.width - 4;

  for (
    let columns = preferredColumns;
    columns >= 1;
    columns -= 1
  ) {
    const rows = [];

    for (let index = 0; index < planets.length; index += columns) {
      rows.push(planets.slice(index, index + columns));
    }

    const fits = rows.every((row) => {
      const width = row.reduce(
        (total, planet, index) =>
          total +
          estimatePlanetWidth(planet) +
          (index === 0 ? 0 : 3),
        0
      );

      return width <= availableWidth;
    });

    if (fits) {
      return rows;
    }
  }

  return planets.map((planet) => [planet]);
}

function renderPlanets({ planets, layout, houseNumber }) {
  if (!planets.length) {
    return null;
  }

  const rows = getPlanetRows(planets, layout);
  const box = layout.box;
  const totalHeight = rows.length * PLANET_LINE_HEIGHT;
  const firstY =
    box.y +
    (box.height - totalHeight) / 2 +
    PLANET_LINE_HEIGHT / 2;

  return (
    <g
      key={`planets-${houseNumber}`}
      aria-label={`Planets in house ${houseNumber}`}
      pointerEvents="none"
    >
      {rows.map((row, rowIndex) => {
        const rowWidth = row.reduce(
          (total, planet, index) =>
            total +
            estimatePlanetWidth(planet) +
            (index === 0 ? 0 : 3),
          0
        );

        let currentX = box.x + box.width / 2 - rowWidth / 2;

        return (
          <g
            key={`planet-row-${houseNumber}-${rowIndex}`}
            transform={`translate(0 ${
              firstY + rowIndex * PLANET_LINE_HEIGHT
            })`}
          >
            {row.map((planet, planetIndex) => {
              const width = estimatePlanetWidth(planet);
              const x = currentX + width / 2;

              currentX += width + 3;

              return (
                <text
                  key={`planet-${houseNumber}-${rowIndex}-${planetIndex}`}
                  x={x}
                  y="0"
                  textAnchor="middle"
                  dominantBaseline="middle"
                  fill="#e2e8f0"
                  fontSize={PLANET_FONT_SIZE}
                  fontFamily="monospace"
                  fontWeight="500"
                >
                  {planet}
                </text>
              );
            })}
          </g>
        );
      })}
    </g>
  );
}

export default function BirthChart({ data }) {
  const houses = normalizeHouses(data);

  const houseByNumber = new Map(
    houses.map((house) => [Number(house.house), house])
  );

  return (
    <div className="relative mx-auto aspect-square w-full max-w-md">
      <svg
        viewBox={`0 0 ${CHART_SIZE} ${CHART_SIZE}`}
        className="h-full w-full rounded-xl"
        role="img"
        aria-label="North Indian Vedic birth chart"
        overflow="visible"
      >
        <rect
          x={BORDER}
          y={BORDER}
          width={CHART_SIZE - BORDER * 2}
          height={CHART_SIZE - BORDER * 2}
          fill="rgba(0,0,0,0.4)"
        />

        <rect
          x={BORDER}
          y={BORDER}
          width={CHART_SIZE - BORDER * 2}
          height={CHART_SIZE - BORDER * 2}
          fill="none"
          stroke="rgba(251,191,36,0.7)"
          strokeWidth="2"
          vectorEffect="non-scaling-stroke"
          shapeRendering="geometricPrecision"
        />

        <path
          d={NORTH_INDIAN_LINES}
          fill="none"
          stroke="rgba(251,191,36,0.7)"
          strokeWidth="2"
          strokeLinecap="butt"
          strokeLinejoin="miter"
          vectorEffect="non-scaling-stroke"
          shapeRendering="geometricPrecision"
        />

        {Object.entries(NORTH_INDIAN_HOUSES).map(
          ([houseKey, layout]) => {
            const houseNumber = Number(houseKey);
            const house = houseByNumber.get(houseNumber);
            const signNumber = house
              ? getRashiNumber(getHouseSign(house))
              : "";
            const planets = house ? getHousePlanets(house) : [];
            const rashiPosition = getRashiPosition(layout);

            return (
              <g key={`house-${houseNumber}`}>
                {signNumber !== "" && (
                  <text
                    x={rashiPosition.x}
                    y={rashiPosition.y}
                    textAnchor="middle"
                    dominantBaseline="middle"
                    fill="#fcd34d"
                    fontSize={RASHI_FONT_SIZE}
                    fontWeight="700"
                    fontFamily="sans-serif"
                    pointerEvents="none"
                  >
                    {signNumber}
                  </text>
                )}

                {renderPlanets({
                  planets,
                  layout,
                  houseNumber,
                })}
              </g>
            );
          }
        )}

        <text
          x="200"
          y="184"
          textAnchor="middle"
          dominantBaseline="middle"
          fill="rgba(251,191,36,0.7)"
          fontSize="10"
          fontFamily="sans-serif"
          fontStyle="italic"
          pointerEvents="none"
        >
          Lagna
        </text>

        <circle
          cx="200"
          cy="200"
          r="4"
          fill="#fbbf24"
          stroke="#78350f"
          strokeWidth="1"
        />
      </svg>
    </div>
  );
}

function PlanetsTable({ planets }) {
  return (
    <div className="overflow-x-auto rounded-xl border border-white/10">
      <table className="w-full text-sm">
        <thead className="bg-amber-500/10 text-amber-300 text-xs uppercase tracking-wider">
          <tr>
            <th className="px-3 py-2 text-left">Planet</th>
            <th className="px-3 py-2 text-left">Sign</th>
            <th className="px-3 py-2 text-left">Deg</th>
            <th className="px-3 py-2 text-left">House</th>
            <th className="px-3 py-2 text-left">Nakshatra</th>
            <th className="px-3 py-2 text-left">Pada</th>
          </tr>
        </thead>
        <tbody className="text-slate-200">
          {planets.map(p => (
            <tr key={p.name} className="border-t border-white/5 hover:bg-white/5">
              <td className="px-3 py-2 font-medium">
                {p.name}{p.retrograde && <span className="text-red-400 ml-1">℞</span>}
              </td>
              <td className="px-3 py-2">{SIGN_SYMBOL[p.sign]} {p.sign}</td>
              <td className="px-3 py-2 font-mono text-xs">{p.degrees}°</td>
              <td className="px-3 py-2 text-gold">H{p.house}</td>
              <td className="px-3 py-2">{p.nakshatra}</td>
              <td className="px-3 py-2">{p.pada}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

export default function BirthChart() {
  const [form, setForm] = useState({ name: "", date_of_birth: "", time_of_birth: "", place_of_birth: "" });
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState(null);
  const [history, setHistory] = useState([]);

  const loadHistory = () => api.get("/birth-chart/history").then(r => setHistory(r.data.items || [])).catch(() => {});
  useEffect(() => { loadHistory(); }, []);

  const downloadPdf = async (chartId) => {
    try {
      const token = localStorage.getItem("aa_token");
      const res = await fetch(`${API}/birth-chart/${chartId}/pdf`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (!res.ok) throw new Error("failed");
      const blob = await res.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `kundali-${chartId.slice(0, 8)}.pdf`;
      document.body.appendChild(a);
      a.click();
      a.remove();
      window.URL.revokeObjectURL(url);
    } catch {
      toast.error("Could not download PDF");
    }
  };

  const submit = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
      const r = await api.post("/birth-chart", form);
      setResult(r.data);
      loadHistory();
      toast.success("Chart cast. Read below.");
    } catch (err) {
      toast.error(err.response?.data?.detail || "Could not generate chart");
    } finally {
      setLoading(false);
    }
  };

  const cdata = result?.chart_data;

  return (
    <div className="max-w-6xl mx-auto px-6 py-16">
      <p className="text-xs uppercase tracking-[0.3em] font-mono text-amber-500/80 mb-3">Kundali</p>
      <h1 className="text-4xl md:text-5xl font-serif-display font-light text-white tracking-tight mb-3">
        Your Vedic <span className="text-gold italic">birth chart</span>.
      </h1>
      <p className="text-sm text-slate-500 mb-10">
        Calculated with the Swiss Ephemeris • Lahiri Ayanamsa • Whole Sign houses.
      </p>

      <div className="grid md:grid-cols-2 gap-8">
        <Card className="glass border-white/10 h-fit">
          <CardContent className="p-8">
            <div className="flex items-center gap-2 mb-6">
              <Compass className="w-5 h-5 text-gold" />
              <h2 className="text-xl font-serif-display text-white">Enter birth details</h2>
            </div>
            <form onSubmit={submit} className="space-y-5">
              <div>
                <Label className="text-slate-300"><User className="w-3 h-3 inline mr-1" /> Native's name</Label>
                <Input data-testid="chart-name" value={form.name} onChange={e => setForm({ ...form, name: e.target.value })} className="bg-black/40 border-white/10 mt-2" placeholder="e.g. Meera" />
              </div>
              <div>
                <Label className="text-slate-300">Date of birth</Label>
                <Input data-testid="chart-dob" type="date" required value={form.date_of_birth} onChange={e => setForm({ ...form, date_of_birth: e.target.value })} className="bg-black/40 border-white/10 mt-2" />
              </div>
              <div>
                <Label className="text-slate-300"><Clock className="w-3 h-3 inline mr-1" /> Time of birth</Label>
                <Input data-testid="chart-tob" type="time" required value={form.time_of_birth} onChange={e => setForm({ ...form, time_of_birth: e.target.value })} className="bg-black/40 border-white/10 mt-2" />
                <p className="text-[11px] text-slate-500 mt-1">Local time at place of birth. Accuracy matters — even 5 minutes can shift the Lagna.</p>
              </div>
              <div>
                <Label className="text-slate-300"><MapPin className="w-3 h-3 inline mr-1" /> Place of birth</Label>
                <Input data-testid="chart-pob" required value={form.place_of_birth} onChange={e => setForm({ ...form, place_of_birth: e.target.value })} className="bg-black/40 border-white/10 mt-2" placeholder="City, Country" />
              </div>
              <Button data-testid="chart-submit" type="submit" disabled={loading} className="w-full bg-gold text-black hover:bg-amber-300 rounded-full py-6 gold-glow">
                {loading ? <><Loader2 className="w-4 h-4 mr-2 animate-spin" /> Casting the chart…</> : "Generate Kundali"}
              </Button>
            </form>
          </CardContent>
        </Card>

        <div className="space-y-6">
          {!result && !loading && (
            <Card className="glass border-white/10 min-h-[500px]">
              <CardContent className="p-8 h-full">
                <div className="text-center text-slate-500 h-full flex flex-col items-center justify-center py-20">
                  <div className="w-24 h-24 rounded-full border border-amber-400/30 flex items-center justify-center mb-6">
                    <Compass className="w-10 h-10 text-gold" strokeWidth={1} />
                  </div>
                  <p className="font-serif-display text-xl text-slate-300">Your reading appears here</p>
                  <p className="text-sm mt-2">Fill your birth details to begin.</p>
                </div>
              </CardContent>
            </Card>
          )}

          {loading && (
            <Card className="glass border-white/10 min-h-[500px]">
              <CardContent className="p-8 h-full flex flex-col items-center justify-center py-20 text-slate-400">
                <Loader2 className="w-8 h-8 text-gold animate-spin mb-4" />
                <p>Casting your Kundali with Swiss Ephemeris…</p>
                <p className="text-xs text-slate-500 mt-1">Geocoding place, computing planetary positions…</p>
              </CardContent>
            </Card>
          )}

          {result && cdata && (
            <>
              <Card className="glass border-amber-400/20 relative overflow-hidden">
                <CardContent className="p-6">
                  <div className="flex items-start justify-between gap-3 flex-wrap mb-4">
                    <div>
                      <p className="text-xs uppercase tracking-[0.3em] font-mono text-amber-500/80">
                        {result.name || "Seeker"} • {result.date_of_birth} {result.time_of_birth}
                      </p>
                      <p className="text-xs text-slate-500 mt-0.5">{result.place_of_birth} • {cdata.birth_details.timezone}</p>
                    </div>
                   {false && (
                    <Button
                      data-testid="chart-pdf-download"
                      size="sm"
                      onClick={() => downloadPdf(result.id)}
                      className="bg-gold text-black hover:bg-amber-300 rounded-full text-xs"
                    >
                      <Download className="w-3 h-3 mr-1" /> Download PDF
                    </Button>
              )}
                  </div>

                  <div className="grid grid-cols-3 gap-3 mb-6">
                    <div className="bg-black/40 rounded-xl p-3 border border-white/5">
                      <p className="text-[10px] uppercase tracking-widest text-amber-500/70">Lagna</p>
                      <p className="font-serif-display text-lg text-white mt-1" data-testid="chart-lagna">
                        {SIGN_SYMBOL[cdata.ascendant.sign]} {cdata.ascendant.sign}
                      </p>
                      <p className="text-[11px] text-slate-500">{cdata.ascendant.degrees}° · {cdata.ascendant.nakshatra}</p>
                    </div>
                    <div className="bg-black/40 rounded-xl p-3 border border-white/5">
                      <p className="text-[10px] uppercase tracking-widest text-amber-500/70">Moon</p>
                      <p className="font-serif-display text-lg text-white mt-1" data-testid="chart-moon">
                        {SIGN_SYMBOL[cdata.moon_sign]} {cdata.moon_sign}
                      </p>
                      <p className="text-[11px] text-slate-500">{cdata.moon_nakshatra}</p>
                    </div>
                    <div className="bg-black/40 rounded-xl p-3 border border-white/5">
                      <p className="text-[10px] uppercase tracking-widest text-amber-500/70">Sun</p>
                      <p className="font-serif-display text-lg text-white mt-1" data-testid="chart-sun">
                        {SIGN_SYMBOL[cdata.sun_sign]} {cdata.sun_sign}
                      </p>
                      <p className="text-[11px] text-slate-500">Sidereal</p>
                    </div>
                  </div>

                  {cdata.current_mahadasha && (
                    <div className="bg-gradient-to-br from-amber-500/10 to-transparent rounded-xl p-4 border border-amber-400/20 mb-6">
                      <div className="flex flex-wrap gap-6">
                        <div className="flex-1 min-w-[180px]">
                          <p className="text-[10px] uppercase tracking-widest text-amber-500/70">Mahadasha</p>
                          <p className="font-serif-display text-xl text-gold mt-1" data-testid="chart-dasha">{cdata.current_mahadasha.lord}</p>
                          <p className="text-xs text-slate-400 mt-1">
                            {cdata.current_mahadasha.start} → {cdata.current_mahadasha.end} · {cdata.current_mahadasha.years} yrs
                          </p>
                        </div>
                        {cdata.current_antardasha && (
                          <div className="flex-1 min-w-[180px] border-l border-white/10 pl-6">
                            <p className="text-[10px] uppercase tracking-widest text-amber-500/70">Antardasha</p>
                            <p className="font-serif-display text-xl text-white mt-1" data-testid="chart-antardasha">
                              {cdata.current_mahadasha.lord}–{cdata.current_antardasha.lord}
                            </p>
                            <p className="text-xs text-slate-400 mt-1">
                              {cdata.current_antardasha.start} → {cdata.current_antardasha.end}
                            </p>
                          </div>
                        )}
                      </div>
                    </div>
                  )}

                  <ChartVisual data={cdata} />
                </CardContent>
              </Card>

              {cdata.navamsa && (
                <Card className="glass border-white/10">
                  <CardContent className="p-6">
                    <div className="flex items-center justify-between flex-wrap mb-3">
                      <h3 className="text-lg font-serif-display text-white">Navamsa (D9) Chart</h3>
                      <p className="text-[11px] text-slate-500">D9 Lagna: <span className="text-gold">{cdata.navamsa.ascendant_sign}</span></p>
                    </div>
                    <p className="text-xs text-slate-500 mb-4">
                      The divisional chart for marriage, dharma and the inner soul. Read alongside the D1.
                    </p>
                    <ChartVisual data={cdata.navamsa} />
                  </CardContent>
                </Card>
              )}

              <Card className="glass border-white/10">
                <CardContent className="p-6">
                  <h3 className="text-lg font-serif-display text-white mb-4">Planetary Positions</h3>
                  <PlanetsTable planets={cdata.planets} />
                </CardContent>
              </Card>

              <Card className="glass border-white/10">
                <CardContent className="p-6">
                  <h3 className="text-lg font-serif-display text-white mb-4">Acharya's Interpretation</h3>
                  <div data-testid="chart-reading" className="reading-prose" dangerouslySetInnerHTML={renderMarkdown(result.reading)} />
                </CardContent>
              </Card>
            </>
          )}
        </div>
      </div>

      {history.length > 0 && (
        <div className="mt-16">
          <h3 className="text-xl font-serif-display text-white mb-6">Your saved charts</h3>
          <div className="grid md:grid-cols-3 gap-4">
            {history.map(h => (
              <button
                key={h.id}
                data-testid={`history-${h.id}`}
                onClick={() => setResult(h)}
                className="text-left p-6 rounded-2xl border border-white/10 bg-card hover:border-amber-400/40 transition"
              >
                <p className="text-gold font-serif-display text-lg">{h.name || "Seeker"}</p>
                <p className="text-xs text-slate-400 mt-1">{h.date_of_birth} • {h.place_of_birth}</p>
                <p className="text-xs text-slate-500 mt-3">
                  {h.ascendant?.sign ? `Lagna ${h.ascendant.sign}` : `Sun ${h.sun_sign}`}
                </p>
              </button>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

import { useState, useEffect } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { api, API } from "@/lib/api";
import { toast } from "sonner";
import { Loader2, Compass, Clock, MapPin, User, Download } from "lucide-react";

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

const NORTH_INDIAN_HOUSES = {
  1: {
    points: "200,20 290,110 200,200 110,110",
    label: {
      house: { x: 200, y: 62 },
      rashi: { x: 200, y: 105 },
    },
    planetBox: {
      x: 132,
      y: 132,
      width: 136,
      height: 34,
    },
    direction: "horizontal",
  },

  2: {
    points: "20,20 200,20 110,110",
    label: {
      house: { x: 110, y: 43 },
      rashi: { x: 110, y: 74 },
    },
    planetBox: {
      x: 58,
      y: 91,
      width: 104,
      height: 24,
    },
    direction: "horizontal",
  },

  3: {
    points: "20,20 110,110 20,200",
    label: {
      house: { x: 54, y: 105 },
      rashi: { x: 54, y: 137 },
    },
    planetBox: {
      x: 28,
      y: 153,
      width: 48,
      height: 40,
    },
    direction: "vertical",
  },

  4: {
    points: "20,200 110,110 200,200 110,290",
    label: {
      house: { x: 110, y: 168 },
      rashi: { x: 110, y: 205 },
    },
    planetBox: {
      x: 58,
      y: 223,
      width: 104,
      height: 28,
    },
    direction: "horizontal",
  },

  5: {
    points: "20,200 110,290 20,380",
    label: {
      house: { x: 54, y: 253 },
      rashi: { x: 54, y: 285 },
    },
    planetBox: {
      x: 28,
      y: 304,
      width: 48,
      height: 62,
    },
    direction: "vertical",
  },

  6: {
    points: "20,380 200,380 110,290",
    label: {
      house: { x: 110, y: 315 },
      rashi: { x: 110, y: 345 },
    },
    planetBox: {
      x: 58,
      y: 357,
      width: 104,
      height: 18,
    },
    direction: "horizontal",
  },

  7: {
    points: "110,290 200,200 290,290 200,380",
    label: {
      house: { x: 200, y: 315 },
      rashi: { x: 200, y: 345 },
    },
    planetBox: {
      x: 132,
      y: 357,
      width: 136,
      height: 18,
    },
    direction: "horizontal",
  },

  8: {
    points: "200,380 380,380 290,290",
    label: {
      house: { x: 290, y: 315 },
      rashi: { x: 290, y: 345 },
    },
    planetBox: {
      x: 238,
      y: 357,
      width: 104,
      height: 18,
    },
    direction: "horizontal",
  },

  9: {
    points: "380,200 380,380 290,290",
    label: {
      house: { x: 346, y: 253 },
      rashi: { x: 346, y: 285 },
    },
    planetBox: {
      x: 324,
      y: 304,
      width: 48,
      height: 62,
    },
    direction: "vertical",
  },

  10: {
    points: "380,200 290,110 200,200 290,290",
    label: {
      house: { x: 290, y: 168 },
      rashi: { x: 290, y: 205 },
    },
    planetBox: {
      x: 238,
      y: 223,
      width: 104,
      height: 28,
    },
    direction: "horizontal",
  },

  11: {
    points: "380,20 380,200 290,110",
    label: {
      house: { x: 346, y: 105 },
      rashi: { x: 346, y: 137 },
    },
    planetBox: {
      x: 324,
      y: 153,
      width: 48,
      height: 40,
    },
    direction: "vertical",
  },

  12: {
    points: "200,20 380,20 290,110",
    label: {
      house: { x: 290, y: 43 },
      rashi: { x: 290, y: 74 },
    },
    planetBox: {
      x: 238,
      y: 91,
      width: 104,
      height: 24,
    },
    direction: "horizontal",
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

function getRashiNumber(sign) {
  const numericSign = getNumberFromValue(sign);

  if (
    numericSign !== "" &&
    numericSign >= 1 &&
    numericSign <= 12
  ) {
    return numericSign;
  }

  return RASHI_NUMBERS[normalizeText(sign)] || "";
}

function getPlanetAbbreviation(planet) {
  let value = planet;

  if (planet && typeof planet === "object") {
    value =
      planet.abbreviation ??
      planet.abbr ??
      planet.shortName ??
      planet.name ??
      planet.planet ??
      planet.graha ??
      planet.body ??
      "";
  }

  const text = String(value ?? "").trim();

  if (!text) {
    return "";
  }

  const normalized = normalizeText(text);

  if (PLANET_ABBREVIATIONS[normalized]) {
    return PLANET_ABBREVIATIONS[normalized];
  }

  const abbreviationMatch = text.match(/\(([A-Za-z]{1,3})\)/);

  if (abbreviationMatch) {
    return abbreviationMatch[1];
  }

  return text.slice(0, 2);
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

function getHousePlanets(house) {
  if (!house || typeof house !== "object") {
    return [];
  }

  const value =
    house.planets ??
    house.planet ??
    house.grahas ??
    house.occupants ??
    house.bodies ??
    house.planetNames ??
    house.planet_names ??
    house.planetaryPositions ??
    [];

  if (Array.isArray(value)) {
    return value.map(getPlanetAbbreviation).filter(Boolean);
  }

  if (typeof value === "string") {
    return value
      .split(/[,\s]+/)
      .map(getPlanetAbbreviation)
      .filter(Boolean);
  }

  if (value && typeof value === "object") {
    return Object.values(value)
      .map(getPlanetAbbreviation)
      .filter(Boolean);
  }

  return [];
}

function normalizeHouses(data) {
  const source =
    data?.houses ??
    data?.chart?.houses ??
    data?.birthChart?.houses ??
    [];

  const normalized = [];

  if (Array.isArray(source)) {
    source.forEach((house, index) => {
      const number = getHouseNumber(house, index + 1);

      if (number >= 1 && number <= 12) {
        normalized.push({
          ...house,
          house: number,
        });
      }
    });
  } else if (source && typeof source === "object") {
    Object.entries(source).forEach(([key, value]) => {
      const fallbackNumber = getNumberFromValue(key);

      const house =
        value && typeof value === "object"
          ? value
          : { sign: value };

      const number = getHouseNumber(house, fallbackNumber);

      if (number >= 1 && number <= 12) {
        normalized.push({
          ...house,
          house: number,
        });
      }
    });
  }

  return normalized;
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

function getTextWidth(text, fontSize) {
  return Math.max(
    fontSize * 1.3,
    String(text).length * fontSize * 0.62
  );
}

function getHorizontalPlanetPacking(planets, box) {
  const fontSizes = [10, 9, 8];

  for (const fontSize of fontSizes) {
    const gap = fontSize >= 10 ? 5 : 4;
    const availableWidth = Math.max(20, box.width - 6);

    const totalWidth = planets.reduce(
      (total, planet, index) =>
        total +
        getTextWidth(planet, fontSize) +
        (index === 0 ? 0 : gap),
      0
    );

    if (totalWidth <= availableWidth) {
      return {
        rows: [planets],
        fontSize,
        gap,
        lineHeight: fontSize + 2,
      };
    }
  }

  const fontSize = 8;
  const gap = 3;
  const availableWidth = Math.max(20, box.width - 6);
  const rows = [];
  let currentRow = [];
  let currentWidth = 0;

  planets.forEach((planet) => {
    const planetWidth = getTextWidth(planet, fontSize);
    const nextWidth =
      currentWidth +
      planetWidth +
      (currentRow.length ? gap : 0);

    if (
      currentRow.length > 0 &&
      nextWidth > availableWidth
    ) {
      rows.push(currentRow);
      currentRow = [planet];
      currentWidth = planetWidth;
    } else {
      currentRow.push(planet);
      currentWidth = nextWidth;
    }
  });

  if (currentRow.length > 0) {
    rows.push(currentRow);
  }

  return {
    rows,
    fontSize,
    gap,
    lineHeight: 10,
  };
}

function getVerticalPlanetPacking(planets, box) {
  const options = [
    { fontSize: 10, lineHeight: 12 },
    { fontSize: 9, lineHeight: 11 },
    { fontSize: 8, lineHeight: 10 },
  ];

  for (const option of options) {
    const totalHeight = planets.length * option.lineHeight;

    if (totalHeight <= box.height - 2) {
      return option;
    }
  }

  return {
    fontSize: 7,
    lineHeight: 8,
  };
}

function renderHorizontalPlanets(planets, box, houseNumber) {
  const packing = getHorizontalPlanetPacking(planets, box);
  const totalHeight =
    packing.rows.length * packing.lineHeight;

  const firstY =
    box.y +
    (box.height - totalHeight) / 2 +
    packing.lineHeight / 2;

  const centerX = box.x + box.width / 2;

  return (
    <g
      key={`horizontal-planets-${houseNumber}`}
      aria-label={`Planets in house ${houseNumber}`}
      pointerEvents="none"
    >
      {packing.rows.map((row, rowIndex) => {
        const rowWidth = row.reduce(
          (total, planet, planetIndex) =>
            total +
            getTextWidth(planet, packing.fontSize) +
            (planetIndex === 0 ? 0 : packing.gap),
          0
        );

        let currentX = centerX - rowWidth / 2;

        return (
          <g
            key={`house-${houseNumber}-row-${rowIndex}`}
            transform={`translate(0 ${
              firstY + rowIndex * packing.lineHeight
            })`}
          >
            {row.map((planet, planetIndex) => {
              const planetWidth = getTextWidth(
                planet,
                packing.fontSize
              );

              const x = currentX + planetWidth / 2;

              currentX += planetWidth + packing.gap;

              return (
                <text
                  key={`house-${houseNumber}-planet-${rowIndex}-${planetIndex}`}
                  x={x}
                  y="0"
                  textAnchor="middle"
                  dominantBaseline="middle"
                  fill="#e2e8f0"
                  fontSize={packing.fontSize}
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

function renderVerticalPlanets(planets, box, houseNumber) {
  const packing = getVerticalPlanetPacking(planets, box);
  const totalHeight = planets.length * packing.lineHeight;

  const firstY =
    box.y +
    (box.height - totalHeight) / 2 +
    packing.lineHeight / 2;

  const centerX = box.x + box.width / 2;

  return (
    <g
      key={`vertical-planets-${houseNumber}`}
      aria-label={`Planets in house ${houseNumber}`}
      pointerEvents="none"
    >
      {planets.map((planet, index) => (
        <text
          key={`house-${houseNumber}-vertical-planet-${index}`}
          x={centerX}
          y={firstY + index * packing.lineHeight}
          textAnchor="middle"
          dominantBaseline="middle"
          fill="#e2e8f0"
          fontSize={packing.fontSize}
          fontFamily="monospace"
          fontWeight="500"
        >
          {planet}
        </text>
      ))}
    </g>
  );
}

function renderPlanets(planets, layout, houseNumber) {
  if (!planets.length) {
    return null;
  }

  if (layout.direction === "vertical") {
    return renderVerticalPlanets(
      planets,
      layout.planetBox,
      houseNumber
    );
  }

  return renderHorizontalPlanets(
    planets,
    layout.planetBox,
    houseNumber
  );
}

function ChartVisual({ data }) {
  const houses = normalizeHouses(data);

  const houseByNumber = new Map(
    houses.map((house) => [
      Number(house.house),
      house,
    ])
  );

  return (
    <div className="relative w-full aspect-square max-w-md mx-auto">
      <svg
        viewBox="0 0 400 400"
        className="w-full h-full rounded-xl"
        role="img"
        aria-label="North Indian Vedic birth chart"
        overflow="visible"
      >
        <rect
          x="20"
          y="20"
          width="360"
          height="360"
          fill="rgba(0,0,0,0.4)"
        />

        <rect
          x="20"
          y="20"
          width="360"
          height="360"
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
          ([houseNumber, layout]) => {
            const number = Number(houseNumber);
            const house = houseByNumber.get(number);

            const signNumber = house
              ? getRashiNumber(getHouseSign(house))
              : "";

            const planets = house
              ? getHousePlanets(house)
              : [];

            const housePosition = layout.label.house;
            const rashiPosition = layout.label.rashi;

            return (
              <g key={`house-content-${number}`}>
                <text
                  x={housePosition.x}
                  y={housePosition.y}
                  textAnchor="middle"
                  dominantBaseline="middle"
                  fill="rgba(251,191,36,0.8)"
                  fontSize="10"
                  fontFamily="monospace"
                  fontWeight="500"
                >
                  H{number}
                </text>

                {signNumber !== "" && (
                  <text
                    x={rashiPosition.x}
                    y={rashiPosition.y}
                    textAnchor="middle"
                    dominantBaseline="middle"
                    fill="#fcd34d"
                    fontSize="24"
                    fontWeight="700"
                    fontFamily="sans-serif"
                  >
                    {signNumber}
                  </text>
                )}

                {renderPlanets(
                  planets,
                  layout,
                  number
                )}

                {number === 1 && (
                  <text
                    x="200"
                    y="184"
                    textAnchor="middle"
                    dominantBaseline="middle"
                    fill="rgba(251,191,36,0.7)"
                    fontSize="10"
                    fontStyle="italic"
                  >
                    Lagna
                  </text>
                )}
              </g>
            );
          }
        )}

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

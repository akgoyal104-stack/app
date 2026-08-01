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
    box: { x: 125, y: 32, width: 150, height: 145 },
    columns: 3,
  },
  2: {
    points: "20,20 200,20 110,110",
    box: { x: 65, y: 30, width: 90, height: 76 },
    columns: 2,
  },
  3: {
    points: "20,20 110,110 20,200",
    box: { x: 28, y: 96, width: 94, height: 78 },
    columns: 2,
  },
  4: {
    points: "20,200 110,110 200,200 110,290",
    box: { x: 55, y: 145, width: 110, height: 110 },
    columns: 3,
  },
  5: {
    points: "20,200 110,290 20,380",
    box: { x: 28, y: 238, width: 94, height: 82 },
    columns: 2,
  },
  6: {
    points: "20,380 200,380 110,290",
    box: { x: 65, y: 306, width: 90, height: 64 },
    columns: 2,
  },
  7: {
    points: "110,290 200,200 290,290 200,380",
    box: { x: 125, y: 278, width: 150, height: 92 },
    columns: 3,
  },
  8: {
    points: "200,380 380,380 290,290",
    box: { x: 245, y: 306, width: 90, height: 64 },
    columns: 2,
  },
  9: {
    points: "380,200 380,380 290,290",
    box: { x: 278, y: 238, width: 94, height: 82 },
    columns: 2,
  },
  10: {
    points: "380,200 290,110 200,200 290,290",
    box: { x: 235, y: 145, width: 110, height: 110 },
    columns: 3,
  },
  11: {
    points: "380,20 380,200 290,110",
    box: { x: 278, y: 96, width: 94, height: 78 },
    columns: 2,
  },
  12: {
    points: "200,20 380,20 290,110",
    box: { x: 245, y: 30, width: 90, height: 76 },
    columns: 2,
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
  ascendant: "As",
  lagna: "As",
};

function normalizeText(value) {
  return String(value || "")
    .trim()
    .toLowerCase()
    .replace(/[\s_-]+/g, "");
}

function getRashiNumber(sign) {
  if (typeof sign === "object" && sign !== null) {
    sign = sign.number || sign.value || sign.name || sign.sign;
  }

  if (typeof sign === "number") {
    return sign >= 1 && sign <= 12 ? sign : "";
  }

  const numericSign = Number(sign);

  if (
    String(sign).trim() !== "" &&
    Number.isFinite(numericSign) &&
    numericSign >= 1 &&
    numericSign <= 12
  ) {
    return numericSign;
  }

  return RASHI_NUMBERS[normalizeText(sign)] || "";
}

function getPlanetAbbreviation(planet) {
  const value =
    typeof planet === "object"
      ? planet?.abbreviation || planet?.abbr || planet?.name || planet?.planet
      : planet;

  const normalized = normalizeText(value);

  return (
    PLANET_ABBREVIATIONS[normalized] ||
    String(value || "").trim().slice(0, 2)
  );
}

function getHouseNumber(house, fallbackNumber) {
  const value =
    house?.house ??
    house?.houseNumber ??
    house?.house_number ??
    house?.number ??
    fallbackNumber;

  const number = Number(value);

  return Number.isFinite(number) ? number : fallbackNumber;
}

function getHousePlanets(house) {
  const source =
    house?.planets ??
    house?.planet ??
    house?.occupants ??
    house?.bodies ??
    [];

  if (Array.isArray(source)) {
    return source.map(getPlanetAbbreviation).filter(Boolean);
  }

  if (typeof source === "string") {
    return source
      .split(/[,\s]+/)
      .map(getPlanetAbbreviation)
      .filter(Boolean);
  }

  if (source && typeof source === "object") {
    return Object.values(source)
      .map(getPlanetAbbreviation)
      .filter(Boolean);
  }

  return [];
}

function parsePoints(points) {
  return points.split(/\s+/).map((point) => {
    const [x, y] = point.split(",").map(Number);
    return { x, y };
  });
}

function getPolygonCenter(points) {
  const total = points.reduce(
    (result, point) => ({
      x: result.x + point.x,
      y: result.y + point.y,
    }),
    { x: 0, y: 0 }
  );

  return {
    x: total.x / points.length,
    y: total.y / points.length,
  };
}

function getInwardDirection(layout) {
  const center = getPolygonCenter(parsePoints(layout.points));

  const direction = {
    x: 200 - center.x,
    y: 200 - center.y,
  };

  const length = Math.hypot(direction.x, direction.y);

  return {
    center,
    inward: {
      x: length ? direction.x / length : 0,
      y: length ? direction.y / length : -1,
    },
  };
}

function getHouseLabelPositions(layout) {
  const { center, inward } = getInwardDirection(layout);

  return {
    houseNumber: {
      x: center.x - inward.x * 18,
      y: center.y - inward.y * 18,
    },
    rashi: {
      x: center.x + inward.x * 12,
      y: center.y + inward.y * 12,
    },
  };
}

function makePlanetRows(planets, preferredColumns) {
  const columns = Math.max(
    1,
    Math.min(preferredColumns || 2, planets.length)
  );

  const rows = [];

  for (let index = 0; index < planets.length; index += columns) {
    rows.push(planets.slice(index, index + columns));
  }

  return rows;
}

function estimatePlanetWidth(label, fontSize) {
  return Math.max(
    fontSize * 1.25,
    String(label).length * fontSize * 0.62
  );
}

function getAstroSagePlanetPacking(planets, layout) {
  const box = layout.box;
  const maximumWidth = Math.max(36, box.width - 18);
  const maximumHeight = Math.max(20, box.height - 18);
  const preferredColumns = Math.min(layout.columns || 2, planets.length);
  const fontSizes = [11, 10, 9, 8];

  for (const fontSize of fontSizes) {
    for (
      let columns = preferredColumns;
      columns >= 1;
      columns -= 1
    ) {
      const rows = makePlanetRows(planets, columns);
      const gap = fontSize >= 10 ? 7 : 5;
      const lineHeight = fontSize + 3;

      const rowWidths = rows.map((row) =>
        row.reduce(
          (width, planet, index) =>
            width +
            estimatePlanetWidth(planet, fontSize) +
            (index === 0 ? 0 : gap),
          0
        )
      );

      const widestRow = Math.max(...rowWidths);
      const totalHeight = rows.length * lineHeight;

      if (
        widestRow <= maximumWidth &&
        totalHeight <= maximumHeight
      ) {
        return {
          rows,
          fontSize,
          gap,
          lineHeight,
          totalHeight,
        };
      }
    }
  }

  const fontSize = 8;
  const rows = makePlanetRows(planets, preferredColumns);

  return {
    rows,
    fontSize,
    gap: 4,
    lineHeight: 11,
    totalHeight: rows.length * 11,
  };
}

function renderAstroSagePlanets({ planets, layout, houseNumber }) {
  if (!planets.length) {
    return null;
  }

  const triangleHouses = [2, 3, 5, 6, 8, 9, 11, 12];
  const isTriangleHouse = triangleHouses.includes(houseNumber);

  const packingLayout = isTriangleHouse
    ? { ...layout, columns: 1 }
    : layout;

  const packing = getAstroSagePlanetPacking(
    planets,
    packingLayout
  );

  const { center, inward } = getInwardDirection(layout);

  const centerX = center.x;
  const centerY = center.y;

  const inwardDistance = isTriangleHouse ? 48 : 30;
  const rowStep = packing.lineHeight + 2;
  const totalRowsHeight =
    (packing.rows.length - 1) * rowStep;

  return (
    <g
      aria-label={`Planets in house ${houseNumber}`}
      pointerEvents="none"
    >
      {packing.rows.map((row, rowIndex) => {
        const rowWidth = row.reduce(
          (width, planet, planetIndex) =>
            width +
            estimatePlanetWidth(planet, packing.fontSize) +
            (planetIndex === 0 ? 0 : packing.gap),
          0
        );

        const rowOffset =
          rowIndex * rowStep - totalRowsHeight / 2;

        const rowCenterX =
          centerX + inward.x * inwardDistance -
          inward.y * rowOffset;

        const rowCenterY =
          centerY + inward.y * inwardDistance +
          inward.x * rowOffset;

        let currentX = rowCenterX - rowWidth / 2;

        return (
          <g
            key={`${houseNumber}-planet-row-${rowIndex}`}
            transform={`translate(0, ${rowCenterY})`}
          >
            {row.map((planet, planetIndex) => {
              const planetWidth = estimatePlanetWidth(
                planet,
                packing.fontSize
              );

              const planetX = currentX + planetWidth / 2;
              currentX += planetWidth + packing.gap;

              return (
                <text
                  key={`${houseNumber}-${rowIndex}-${planetIndex}`}
                  x={planetX}
                  y={0}
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

function ChartVisual({ data }) {
  const rawHouses = data?.houses;

  const houses = Array.isArray(rawHouses)
    ? rawHouses
    : rawHouses && typeof rawHouses === "object"
      ? Object.values(rawHouses)
      : [];

  const houseByNumber = new Map(
    houses.map((house, index) => [
      getHouseNumber(house, index + 1),
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
      >
        <defs>
          {Object.entries(NORTH_INDIAN_HOUSES).map(
            ([houseNumber, house]) => (
              <clipPath
                key={houseNumber}
                id={`north-indian-house-${houseNumber}`}
                clipPathUnits="userSpaceOnUse"
              >
                <polygon points={house.points} />
              </clipPath>
            )
          )}
        </defs>

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
            const labelPositions = getHouseLabelPositions(layout);

            if (!house) {
              return (
                <text
                  key={number}
                  x={labelPositions.houseNumber.x}
                  y={labelPositions.houseNumber.y}
                  textAnchor="middle"
                  dominantBaseline="middle"
                  fill="rgba(251,191,36,0.75)"
                  fontSize="10"
                  fontFamily="monospace"
                >
                  H{number}
                </text>
              );
            }

            const signNumber = getRashiNumber(
              house.sign ??
                house.rashi ??
                house.signNumber ??
                house.sign_number
            );

            const planets = getHousePlanets(house);

            return (
              <g key={number}>
                <g clipPath={`url(#north-indian-house-${number})`}>
                  <text
                    x={labelPositions.houseNumber.x}
                    y={labelPositions.houseNumber.y}
                    textAnchor="middle"
                    dominantBaseline="middle"
                    fill="rgba(251,191,36,0.8)"
                    fontSize="10"
                    fontFamily="monospace"
                  >
                    H{number}
                  </text>

                  <text
                    x={labelPositions.rashi.x}
                    y={labelPositions.rashi.y}
                    textAnchor="middle"
                    dominantBaseline="middle"
                    fill="#fcd34d"
                    fontSize="24"
                    fontWeight="700"
                    fontFamily="sans-serif"
                  >
                    {signNumber}
                  </text>

                  {number === 1 && (
                    <text
                      x="200"
                      y="184"
                      textAnchor="middle"
                      dominantBaseline="middle"
                      fill="rgba(251,191,36,0.65)"
                      fontSize="10"
                      fontStyle="italic"
                    >
                      Lagna
                    </text>
                  )}
                </g>

                {renderAstroSagePlanets({
                  planets,
                  layout,
                  houseNumber: number,
                })}
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

        <text
          x="200"
          y="196"
          textAnchor="middle"
          dominantBaseline="middle"
          fill="rgba(251,191,36,0.3)"
          fontSize="9"
          fontStyle="italic"
        >
          Kundali
        </text>
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

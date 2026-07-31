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

const RASHI_NUMBERS = {
  Aries: 1,
  Taurus: 2,
  Gemini: 3,
  Cancer: 4,
  Leo: 5,
  Virgo: 6,
  Libra: 7,
  Scorpio: 8,
  Sagittarius: 9,
  Capricorn: 10,
  Aquarius: 11,
  Pisces: 12,
};

const PLANET_ABBREVIATIONS = {
  Sun: "Su",
  Moon: "Mo",
  Mars: "Ma",
  Mercury: "Me",
  Jupiter: "Ju",
  Venus: "Ve",
  Saturn: "Sa",
  Rahu: "Ra",
  Ketu: "Ke",
};

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

function getPlanetAbbreviation(planet) {
  const name = String(planet || "").trim();
  return PLANET_ABBREVIATIONS[name] || name.slice(0, 2);
}

function makePlanetLines(planets, columns) {
  const lines = [];

  for (let index = 0; index < planets.length; index += columns) {
    lines.push(planets.slice(index, index + columns).join("  "));
  }

  return lines;
}

function ChartVisual({ data }) {
  const houses = data?.houses || [];

  const houseByNumber = new Map(
    houses.map((house) => [Number(house.house), house])
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
          {Object.entries(NORTH_INDIAN_HOUSES).map(([houseNumber, house]) => (
            <clipPath
              key={houseNumber}
              id={`north-indian-house-${houseNumber}`}
              clipPathUnits="userSpaceOnUse"
            >
              <polygon points={house.points} />
            </clipPath>
          ))}
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
            const box = layout.box;

            if (!house) {
              return (
                <text
                  key={number}
                  x={box.x + box.width / 2}
                  y={box.y + 15}
                  textAnchor="middle"
                  fill="rgba(251,191,36,0.75)"
                  fontSize="10"
                  fontFamily="monospace"
                >
                  H{number}
                </text>
              );
            }

            const signNumber = RASHI_NUMBERS[house.sign] || "";

            const planets = (house.planets || [])
              .map(getPlanetAbbreviation)
              .filter(Boolean);

            const planetLines = makePlanetLines(planets, layout.columns);
            const planetFontSize = planets.length >= 5 ? 10 : 11;
            const lineHeight = planetFontSize + 3;
            const contentHeight = 15 + 27 + planetLines.length * lineHeight;
            const startY =
              box.y + Math.max(14, (box.height - contentHeight) / 2);

            return (
              <g
                key={number}
                clipPath={`url(#north-indian-house-${number})`}
              >
                <text
                  x={box.x + box.width / 2}
                  y={startY}
                  textAnchor="middle"
                  fill="rgba(251,191,36,0.8)"
                  fontSize="10"
                  fontFamily="monospace"
                >
                  H{number}
                </text>

                <text
                  x={box.x + box.width / 2}
                  y={startY + 26}
                  textAnchor="middle"
                  fill="#fcd34d"
                  fontSize="24"
                  fontWeight="700"
                  fontFamily="sans-serif"
                >
                  {signNumber}
                </text>

                {planetLines.length > 0 && (
                  <text
                    x={box.x + box.width / 2}
                    y={startY + 47}
                    textAnchor="middle"
                    fill="#e2e8f0"
                    fontSize={planetFontSize}
                    fontFamily="monospace"
                  >
                    {planetLines.map((line, index) => (
                      <tspan
                        key={`${number}-planet-line-${index}`}
                        x={box.x + box.width / 2}
                        dy={index === 0 ? 0 : lineHeight}
                      >
                        {line}
                      </tspan>
                    ))}
                  </text>
                )}

                {number === 1 && (
                  <text
                    x="200"
                    y="184"
                    textAnchor="middle"
                    fill="rgba(251,191,36,0.65)"
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

        <text
          x="200"
          y="196"
          textAnchor="middle"
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

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

const NORTH_INDIAN_INTERNAL_LINES = [
  "M20 20 L110 110 L200 20",
  "M200 20 L290 110 L380 20",
  "M20 200 L110 110 L200 200 L110 290 L20 200",
  "M380 200 L290 110 L200 200 L290 290 L380 200",
  "M20 380 L110 290 L200 380",
  "M200 380 L290 290 L380 380",
].join(" ");

const NORTH_INDIAN_HOUSE_LAYOUT = {
  1: {
    headerX: 200,
    headerY: 75,
    numberX: 200,
    numberY: 104,
    planetsX: 200,
    planetsY: 136,
    maxPerRow: 3,
    lineHeight: 14,
    planetFontSize: 11,
    lagnaX: 200,
    lagnaY: 184,
  },
  2: {
    headerX: 110,
    headerY: 55,
    numberX: 110,
    numberY: 82,
    planetsX: 110,
    planetsY: 108,
    maxPerRow: 3,
    lineHeight: 13,
    planetFontSize: 10,
  },
  3: {
    headerX: 52,
    headerY: 104,
    numberX: 52,
    numberY: 130,
    planetsX: 52,
    planetsY: 154,
    maxPerRow: 2,
    lineHeight: 13,
    planetFontSize: 10,
  },
  4: {
    headerX: 110,
    headerY: 190,
    numberX: 110,
    numberY: 218,
    planetsX: 110,
    planetsY: 248,
    maxPerRow: 3,
    lineHeight: 14,
    planetFontSize: 11,
  },
  5: {
    headerX: 43,
    headerY: 278,
    numberX: 43,
    numberY: 305,
    planetsX: 43,
    planetsY: 329,
    maxPerRow: 2,
    lineHeight: 12,
    planetFontSize: 9,
  },
  6: {
    headerX: 110,
    headerY: 306,
    numberX: 110,
    numberY: 337,
    planetsX: 110,
    planetsY: 364,
    maxPerRow: 3,
    lineHeight: 12,
    planetFontSize: 10,
  },
  7: {
    headerX: 200,
    headerY: 290,
    numberX: 200,
    numberY: 320,
    planetsX: 200,
    planetsY: 349,
    maxPerRow: 3,
    lineHeight: 14,
    planetFontSize: 11,
  },
  8: {
    headerX: 290,
    headerY: 306,
    numberX: 290,
    numberY: 337,
    planetsX: 290,
    planetsY: 364,
    maxPerRow: 3,
    lineHeight: 12,
    planetFontSize: 10,
  },
  9: {
    headerX: 357,
    headerY: 278,
    numberX: 357,
    numberY: 305,
    planetsX: 357,
    planetsY: 329,
    maxPerRow: 2,
    lineHeight: 12,
    planetFontSize: 9,
  },
  10: {
    headerX: 290,
    headerY: 190,
    numberX: 290,
    numberY: 218,
    planetsX: 290,
    planetsY: 248,
    maxPerRow: 3,
    lineHeight: 14,
    planetFontSize: 11,
  },
  11: {
    headerX: 348,
    headerY: 104,
    numberX: 348,
    numberY: 130,
    planetsX: 348,
    planetsY: 154,
    maxPerRow: 2,
    lineHeight: 13,
    planetFontSize: 10,
  },
  12: {
    headerX: 290,
    headerY: 55,
    numberX: 290,
    numberY: 82,
    planetsX: 290,
    planetsY: 108,
    maxPerRow: 3,
    lineHeight: 13,
    planetFontSize: 10,
  },
};

function getRashiNumber(sign) {
  const normalizedSign =
    String(sign || "").charAt(0).toUpperCase() +
    String(sign || "").slice(1).toLowerCase();

  return RASHI_NUMBERS[normalizedSign] || "";
}

function getPlanetAbbreviation(planet) {
  const planetName = String(planet || "").trim();

  return (
    PLANET_ABBREVIATIONS[planetName] ||
    planetName.slice(0, 2)
  );
}

function splitPlanetsIntoRows(planets, maxPerRow) {
  const rows = [];

  for (let index = 0; index < planets.length; index += maxPerRow) {
    rows.push(planets.slice(index, index + maxPerRow));
  }

  return rows;
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
        preserveAspectRatio="xMidYMid meet"
      >
        <rect
          x="20"
          y="20"
          width="360"
          height="360"
          fill="rgba(0,0,0,0.35)"
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
        />

        <path
          d={NORTH_INDIAN_INTERNAL_LINES}
          fill="none"
          stroke="rgba(251,191,36,0.7)"
          strokeWidth="2"
          strokeLinecap="butt"
          strokeLinejoin="miter"
          vectorEffect="non-scaling-stroke"
        />

        {Object.entries(NORTH_INDIAN_HOUSE_LAYOUT).map(
          ([houseNumber, layout]) => {
            const number = Number(houseNumber);
            const house = houseByNumber.get(number);
            const rashiNumber = getRashiNumber(house?.sign);
            const planets = (house?.planets || []).map(
              getPlanetAbbreviation
            );
            const planetRows = splitPlanetsIntoRows(
              planets,
              layout.maxPerRow
            );

            return (
              <g key={number}>
                <text
                  x={layout.headerX}
                  y={layout.headerY}
                  textAnchor="middle"
                  fill="rgba(251,191,36,0.8)"
                  fontSize="10"
                  fontFamily="monospace"
                >
                  H{number}
                </text>

                {house && (
                  <>
                    <text
                      x={layout.numberX}
                      y={layout.numberY}
                      textAnchor="middle"
                      dominantBaseline="middle"
                      fill="#fcd34d"
                      fontSize="23"
                      fontWeight="700"
                      fontFamily="Arial, sans-serif"
                    >
                      {rashiNumber}
                    </text>

                    {planetRows.length > 0 && (
                      <text
                        x={layout.planetsX}
                        y={layout.planetsY}
                        textAnchor="middle"
                        fill="#e2e8f0"
                        fontSize={layout.planetFontSize}
                        fontWeight="500"
                        fontFamily="Arial, sans-serif"
                      >
                        {planetRows.map((row, index) => (
                          <tspan
                            key={`${number}-planets-${index}`}
                            x={layout.planetsX}
                            dy={index === 0 ? 0 : layout.lineHeight}
                          >
                            {row.join("   ")}
                          </tspan>
                        ))}
                      </text>
                    )}
                  </>
                )}

                {number === 1 && (
                  <text
                    x={layout.lagnaX}
                    y={layout.lagnaY}
                    textAnchor="middle"
                    fill="rgba(251,191,36,0.65)"
                    fontSize="10"
                    fontStyle="italic"
                    fontFamily="Arial, sans-serif"
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
          fill="rgba(251,191,36,0.35)"
          fontSize="10"
          fontStyle="italic"
          fontFamily="Arial, sans-serif"
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
        Calculated with the Swiss Ephemeris • Lahiri Ayanamsa • Whole Sign houses — the same standard AstroSage uses.
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

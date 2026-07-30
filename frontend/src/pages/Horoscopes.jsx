import { useState, useEffect } from "react";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { Card, CardContent } from "@/components/ui/card";
import { api } from "@/lib/api";
import { toast } from "sonner";
import { Loader2 } from "lucide-react";

const SIGNS = ["Aries","Taurus","Gemini","Cancer","Leo","Virgo","Libra","Scorpio","Sagittarius","Capricorn","Aquarius","Pisces"];
const SIGN_SYMBOL = {
  Aries:"♈", Taurus:"♉", Gemini:"♊", Cancer:"♋", Leo:"♌", Virgo:"♍",
  Libra:"♎", Scorpio:"♏", Sagittarius:"♐", Capricorn:"♑", Aquarius:"♒", Pisces:"♓",
};

export default function Horoscopes() {
  const [selected, setSelected] = useState("Aries");
  const [period, setPeriod] = useState("daily");
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    let cancelled = false;
    setLoading(true); setData(null);
    api.get(`/horoscopes/${selected}`, { params: { period } })
      .then(r => { if (!cancelled) setData(r.data); })
      .catch(() => toast.error("Could not fetch horoscope"))
      .finally(() => { if (!cancelled) setLoading(false); });
    return () => { cancelled = true; };
  }, [selected, period]);

  return (
    <div className="max-w-6xl mx-auto px-6 py-16">
      <p className="text-xs uppercase tracking-[0.3em] font-mono text-amber-500/80 mb-3">Horoscopes</p>
      <h1 className="text-4xl md:text-5xl font-serif-display font-light text-white tracking-tight mb-10">
        Your <span className="text-gold italic">stars</span> today, this week, this month.
      </h1>

      {/* Sign chips */}
      <div className="flex flex-wrap gap-2 mb-10">
        {SIGNS.map(s => (
          <button
            key={s}
            data-testid={`sign-${s.toLowerCase()}`}
            onClick={() => setSelected(s)}
            className={`px-4 py-2 rounded-full text-sm border transition ${
              selected === s
                ? "bg-gold text-black border-gold"
                : "border-white/10 text-slate-300 hover:border-amber-400/40 hover:text-white"
            }`}
          >
            <span className="mr-1.5">{SIGN_SYMBOL[s]}</span>{s}
          </button>
        ))}
      </div>

      <Tabs value={period} onValueChange={setPeriod}>
        <TabsList data-testid="period-tabs" className="bg-black/40 border border-white/10 rounded-full p-1 mb-8">
          <TabsTrigger value="daily" data-testid="tab-daily" className="rounded-full data-[state=active]:bg-gold data-[state=active]:text-black px-6">Daily</TabsTrigger>
          <TabsTrigger value="weekly" data-testid="tab-weekly" className="rounded-full data-[state=active]:bg-gold data-[state=active]:text-black px-6">Weekly</TabsTrigger>
          <TabsTrigger value="monthly" data-testid="tab-monthly" className="rounded-full data-[state=active]:bg-gold data-[state=active]:text-black px-6">Monthly</TabsTrigger>
        </TabsList>

        <TabsContent value={period}>
          <Card className="glass border-white/10">
            <CardContent className="p-10">
              <div className="flex items-center gap-4 mb-6">
                <div className="w-16 h-16 rounded-full bg-gradient-to-br from-amber-400/20 to-amber-700/10 border border-amber-400/30 flex items-center justify-center text-3xl">
                  {SIGN_SYMBOL[selected]}
                </div>
                <div>
                  <h2 className="text-3xl font-serif-display text-white">{selected}</h2>
                  <p className="text-xs uppercase tracking-[0.3em] font-mono text-amber-500/80">{period}</p>
                </div>
              </div>
              {loading ? (
                <div className="flex items-center gap-3 text-slate-400 py-8">
                  <Loader2 className="w-4 h-4 animate-spin text-gold" /> Consulting the stars…
                </div>
              ) : data ? (
                <p data-testid="horoscope-text" className="text-slate-200 leading-relaxed text-lg">{data.text}</p>
              ) : null}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}

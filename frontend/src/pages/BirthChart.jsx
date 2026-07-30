import { useState, useEffect } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { api, API } from "@/lib/api";
import { toast } from "sonner";
import { Loader2, Compass, Clock, MapPin, User, Download } from "lucide-react";

function renderMarkdown(text = "") {
  const html = text
    .replace(/^## (.*)$/gm, '<h2>$1</h2>')
    .replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>')
    .split(/\n{2,}/).map(p => p.startsWith("<h2>") ? p : `<p>${p.replace(/\n/g,"<br/>")}</p>`).join("");
  return { __html: html };
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
      a.download = `kundali-${chartId.slice(0,8)}.pdf`;
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

  return (
    <div className="max-w-6xl mx-auto px-6 py-16">
      <p className="text-xs uppercase tracking-[0.3em] font-mono text-amber-500/80 mb-3">Kundali</p>
      <h1 className="text-4xl md:text-5xl font-serif-display font-light text-white tracking-tight mb-10">
        Your Vedic <span className="text-gold italic">birth chart</span>.
      </h1>

      <div className="grid md:grid-cols-2 gap-8">
        <Card className="glass border-white/10">
          <CardContent className="p-8">
            <div className="flex items-center gap-2 mb-6">
              <Compass className="w-5 h-5 text-gold" />
              <h2 className="text-xl font-serif-display text-white">Enter birth details</h2>
            </div>
            <form onSubmit={submit} className="space-y-5">
              <div>
                <Label className="text-slate-300"><User className="w-3 h-3 inline mr-1" /> Native's name</Label>
                <Input data-testid="chart-name" value={form.name} onChange={e => setForm({...form, name: e.target.value})} className="bg-black/40 border-white/10 mt-2" placeholder="e.g. Meera" />
              </div>
              <div>
                <Label className="text-slate-300">Date of birth</Label>
                <Input data-testid="chart-dob" type="date" required value={form.date_of_birth} onChange={e => setForm({...form, date_of_birth: e.target.value})} className="bg-black/40 border-white/10 mt-2" />
              </div>
              <div>
                <Label className="text-slate-300"><Clock className="w-3 h-3 inline mr-1" /> Time of birth</Label>
                <Input data-testid="chart-tob" type="time" required value={form.time_of_birth} onChange={e => setForm({...form, time_of_birth: e.target.value})} className="bg-black/40 border-white/10 mt-2" />
              </div>
              <div>
                <Label className="text-slate-300"><MapPin className="w-3 h-3 inline mr-1" /> Place of birth</Label>
                <Input data-testid="chart-pob" required value={form.place_of_birth} onChange={e => setForm({...form, place_of_birth: e.target.value})} className="bg-black/40 border-white/10 mt-2" placeholder="City, Country" />
              </div>
              <Button data-testid="chart-submit" type="submit" disabled={loading} className="w-full bg-gold text-black hover:bg-amber-300 rounded-full py-6 gold-glow">
                {loading ? <><Loader2 className="w-4 h-4 mr-2 animate-spin" /> Casting the chart…</> : "Generate Kundali"}
              </Button>
            </form>
          </CardContent>
        </Card>

        <Card className="glass border-white/10 min-h-[500px]">
          <CardContent className="p-8">
            {!result && !loading && (
              <div className="text-center text-slate-500 h-full flex flex-col items-center justify-center py-20">
                <div className="w-24 h-24 rounded-full border border-amber-400/30 flex items-center justify-center mb-6">
                  <Compass className="w-10 h-10 text-gold" strokeWidth={1} />
                </div>
                <p className="font-serif-display text-xl text-slate-300">Your reading appears here</p>
                <p className="text-sm mt-2">Fill your birth details to begin.</p>
              </div>
            )}
            {result && (
              <div>
                <div className="flex items-start justify-between gap-3 flex-wrap mb-4">
                  <p className="text-xs uppercase tracking-[0.3em] font-mono text-amber-500/80">
                    Sun sign: {result.sun_sign} • Native: {result.name || "Seeker"}
                  </p>
                  <Button
                    data-testid="chart-pdf-download"
                    size="sm"
                    onClick={() => downloadPdf(result.id)}
                    className="bg-gold text-black hover:bg-amber-300 rounded-full text-xs"
                  >
                    <Download className="w-3 h-3 mr-1" /> Download PDF
                  </Button>
                </div>
                <div data-testid="chart-reading" className="reading-prose" dangerouslySetInnerHTML={renderMarkdown(result.reading)} />
              </div>
            )}
          </CardContent>
        </Card>
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
                <p className="text-xs text-slate-500 mt-3">Sun: {h.sun_sign}</p>
              </button>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

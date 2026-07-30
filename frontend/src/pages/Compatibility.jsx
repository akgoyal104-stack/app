import { useState } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Select, SelectTrigger, SelectContent, SelectItem, SelectValue } from "@/components/ui/select";
import { api } from "@/lib/api";
import { toast } from "sonner";
import { Loader2, Heart } from "lucide-react";

const SIGNS = ["Aries","Taurus","Gemini","Cancer","Leo","Virgo","Libra","Scorpio","Sagittarius","Capricorn","Aquarius","Pisces"];

function renderMarkdown(text = "") {
  const html = text
    .replace(/^## (.*)$/gm, '<h2>$1</h2>')
    .replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>')
    .split(/\n{2,}/).map(p => p.startsWith("<h2>") ? p : `<p>${p.replace(/\n/g,"<br/>")}</p>`).join("");
  return { __html: html };
}

export default function Compatibility() {
  const [a, setA] = useState("Leo");
  const [b, setB] = useState("Aquarius");
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState(null);

  const submit = async () => {
    setLoading(true);
    try {
      const r = await api.post("/compatibility", { sign_a: a, sign_b: b });
      setResult(r.data);
    } catch {
      toast.error("Could not fetch compatibility");
    } finally { setLoading(false); }
  };

  return (
    <div className="max-w-4xl mx-auto px-6 py-16">
      <p className="text-xs uppercase tracking-[0.3em] font-mono text-amber-500/80 mb-3">Guna Milan</p>
      <h1 className="text-4xl md:text-5xl font-serif-display font-light text-white tracking-tight mb-10">
        Do your <span className="text-gold italic">stars align</span>?
      </h1>

      <Card className="glass border-white/10">
        <CardContent className="p-8">
          <div className="grid grid-cols-1 md:grid-cols-[1fr_auto_1fr_auto] items-end gap-4">
            <div>
              <label className="text-xs uppercase tracking-[0.2em] font-mono text-amber-500/80">Partner 1</label>
              <Select value={a} onValueChange={setA}>
                <SelectTrigger data-testid="compat-sign-a" className="bg-black/40 border-white/10 mt-2">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {SIGNS.map(s => <SelectItem key={s} value={s}>{s}</SelectItem>)}
                </SelectContent>
              </Select>
            </div>
            <div className="text-center pb-2 hidden md:block">
              <Heart className="w-6 h-6 text-gold mx-auto" />
            </div>
            <div>
              <label className="text-xs uppercase tracking-[0.2em] font-mono text-amber-500/80">Partner 2</label>
              <Select value={b} onValueChange={setB}>
                <SelectTrigger data-testid="compat-sign-b" className="bg-black/40 border-white/10 mt-2">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {SIGNS.map(s => <SelectItem key={s} value={s}>{s}</SelectItem>)}
                </SelectContent>
              </Select>
            </div>
            <Button data-testid="compat-submit" onClick={submit} disabled={loading} className="bg-gold text-black hover:bg-amber-300 rounded-full py-6 px-8 gold-glow">
              {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : "Check"}
            </Button>
          </div>
        </CardContent>
      </Card>

      {result && (
        <Card className="glass border-white/10 mt-8">
          <CardContent className="p-8">
            <p className="text-xs uppercase tracking-[0.3em] font-mono text-amber-500/80">
              {result.sign_a} × {result.sign_b}
            </p>
            <div data-testid="compat-result" className="reading-prose mt-4" dangerouslySetInnerHTML={renderMarkdown(result.analysis)} />
          </CardContent>
        </Card>
      )}
    </div>
  );
}

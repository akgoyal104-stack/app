import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { api } from "@/lib/api";
import { useAuth } from "@/context/AuthContext";
import { toast } from "sonner";
import { Loader2, Check } from "lucide-react";

export default function Pricing() {
  const [packages, setPackages] = useState([]);
  const [loading, setLoading] = useState(null);
  const { user } = useAuth();
  const nav = useNavigate();

  useEffect(() => {
    api.get("/payments/packages").then(r => setPackages(r.data.packages));
  }, []);

  const buy = async (pkgId) => {
    if (!user) { nav("/auth?mode=signup"); return; }
    setLoading(pkgId);
    try {
      const r = await api.post("/payments/checkout", {
        package_id: pkgId,
        origin_url: window.location.origin,
      });
      window.location.href = r.data.checkout_url;
    } catch (e) {
      toast.error(e.response?.data?.detail || "Checkout failed");
      setLoading(null);
    }
  };

  const features = {
    basic_questions: [
      "Up to 3 focused questions",
      "Written response within 24 hrs",
      "Vedic (Parashari) analysis",
      "Follow-up clarifications by email",
    ],
    detailed_reading: [
      "Full Kundali (natal chart) PDF",
      "Dashas & planetary periods",
      "Career • love • health analysis",
      "30-min live call with Acharya Akash",
      "Remedies rooted in tradition",
    ],
  };

  return (
    <div className="max-w-6xl mx-auto px-6 py-16">
      <p className="text-xs uppercase tracking-[0.3em] font-mono text-amber-500/80 mb-3">Consultations</p>
      <h1 className="text-4xl md:text-5xl font-serif-display font-light text-white tracking-tight mb-6">
        Personal readings with <span className="text-gold italic">Acharya Akash</span>.
      </h1>
      <p className="text-slate-400 max-w-2xl mb-14">
        Choose the reading that fits your moment. Secure payments through Stripe — Acharya Akash follows up personally on WhatsApp after every purchase.
      </p>

      <div className="grid md:grid-cols-2 gap-8">
        {packages.map((p, idx) => {
          const highlight = p.id === "detailed_reading";
          return (
            <Card
              key={p.id}
              className={`glass relative overflow-hidden transition ${
                highlight ? "border-amber-400/40" : "border-white/10 hover:border-amber-400/30"
              }`}
            >
              <CardContent className="p-10">
                <div className={`absolute -top-24 -right-24 w-72 h-72 rounded-full blur-3xl ${highlight ? "bg-amber-500/15" : "bg-amber-500/5"}`} />
                {highlight && (
                  <p className="text-xs uppercase tracking-[0.3em] font-mono text-gold mb-4">Most recommended</p>
                )}
                {!highlight && (
                  <p className="text-xs uppercase tracking-[0.3em] font-mono text-amber-500/70 mb-4">Quick guidance</p>
                )}
                <h3 className="text-3xl font-serif-display text-white mb-3">{p.name}</h3>
                <p className="text-sm text-slate-400 mb-6 min-h-[60px]">{p.description}</p>
                <div className="flex items-baseline gap-2 mb-6">
                  <span className="text-5xl font-serif-display text-gold">₹{p.amount.toLocaleString('en-IN')}</span>
                  <span className="text-sm text-slate-500">one-time</span>
                </div>
                <ul className="space-y-2 mb-8 text-sm text-slate-300">
                  {(features[p.id] || []).map(f => (
                    <li key={f} className="flex items-start gap-2">
                      <Check className="w-4 h-4 text-gold shrink-0 mt-0.5" />
                      <span>{f}</span>
                    </li>
                  ))}
                </ul>
                <Button
                  data-testid={`buy-${p.id}`}
                  onClick={() => buy(p.id)}
                  disabled={loading === p.id}
                  className={`w-full rounded-full py-6 ${highlight ? "bg-gold text-black hover:bg-amber-300 gold-glow" : "bg-white/10 hover:bg-white/20 text-white"}`}
                >
                  {loading === p.id ? <Loader2 className="w-4 h-4 animate-spin" /> : `Book — ₹${p.amount.toLocaleString('en-IN')}`}
                </Button>
              </CardContent>
            </Card>
          );
        })}
      </div>

      <p className="text-xs text-slate-500 mt-10 text-center">
        Payments processed securely by Stripe. Use test card 4242 4242 4242 4242 with any future expiry.
      </p>
    </div>
  );
}

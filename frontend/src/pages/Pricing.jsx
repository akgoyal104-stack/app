import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { api } from "@/lib/api";
import { useAuth } from "@/context/AuthContext"; 
import { toast } from "sonner";
import { PROFILE, whatsappLink } from "@/components/Footer";
import { Loader2, Check, MessageCircle, Phone, Copy, QrCode, CheckCircle2, Upload, X } from "lucide-react";

export default function Pricing() {
  const [packages, setPackages] = useState([]);
  const [loading, setLoading] = useState(null);
  const [modes, setModes] = useState({});   // per-package: chat|call
  const [upi, setUpi] = useState(null);
  const [upiPkg, setUpiPkg] = useState("detailed_reading");
  const [confirmOpen, setConfirmOpen] = useState(false);
  const [confirm, setConfirm] = useState({ utr: "", screenshot: "", filename: "", note: "" });
  const [submitting, setSubmitting] = useState(false);
  const [confirmedId, setConfirmedId] = useState(null);
  const { user } = useAuth();
  const nav = useNavigate();

  useEffect(() => {
    api.get("/payments/packages").then(r => {
      setPackages(r.data.packages);
      const initial = {};
      r.data.packages.forEach(p => { initial[p.id] = "chat"; });
      setModes(initial);
    });
  }, []);

  useEffect(() => {
    api.get(`/payments/upi?package_id=${upiPkg}`).then(r => setUpi(r.data));
  }, [upiPkg]);

  const buy = async (pkgId) => {
    if (!user) { nav("/auth?mode=signup"); return; }
    setLoading(pkgId);
    try {
      const r = await api.post("/payments/checkout", {
        package_id: pkgId,
        origin_url: window.location.origin,
        consultation_mode: modes[pkgId] || "chat",
      });
      window.location.href = r.data.checkout_url;
    } catch (e) {
      toast.error(e.response?.data?.detail || "Checkout failed");
      setLoading(null);
    }
  };

  const features = {
    basic_questions: [
      "Chat option available",
      "Call option available",
      "Quick Response within 24 hours",
      "Vedic (Parashari) analysis",
    ],
    detailed_reading: [
      "Chat option available",
      "Call option available",
      "In-depth planetary analysis",
      "In depth • Marriage • Career • love • health guidance",
      "Remedies rooted in tradition",
    ],
  };

  const copy = (v) => {
    navigator.clipboard.writeText(v);
    toast.success("Copied to clipboard");
  };

  const openConfirm = () => {
    if (!user) { nav("/auth?mode=signup"); return; }
    setConfirm({ utr: "", screenshot: "", filename: "", note: "" });
    setConfirmedId(null);
    setConfirmOpen(true);
  };

  const handleFile = (e) => {
    const f = e.target.files?.[0];
    if (!f) return;
    if (f.size > 4 * 1024 * 1024) { toast.error("Screenshot too large (max 4MB)"); return; }
    const reader = new FileReader();
    reader.onload = () => setConfirm(c => ({ ...c, screenshot: reader.result, filename: f.name }));
    reader.readAsDataURL(f);
  };

  const submitConfirm = async () => {
    if (!confirm.utr || confirm.utr.trim().length < 6) {
      toast.error("Enter a valid UTR / reference number");
      return;
    }
    setSubmitting(true);
    try {
      const pkg = packages.find(p => p.id === upiPkg);
      const r = await api.post("/payments/upi-confirm", {
        package_id: upiPkg,
        utr: confirm.utr.trim(),
        amount: pkg?.amount || 0,
        consultation_mode: modes[upiPkg] || "chat",
        screenshot_base64: confirm.screenshot,
        note: confirm.note,
      });
      setConfirmedId(r.data.id);
      toast.success("Payment reported. Acharya will confirm shortly.");
    } catch (e) {
      toast.error(e.response?.data?.detail || "Could not submit");
    } finally {
      setSubmitting(false);
    }
  };

  const confirmWhatsapp = () => {
    const pkg = packages.find(p => p.id === upiPkg);
    return whatsappLink(
      `Namaste Acharya Akash — I've paid ₹${pkg?.amount} for "${pkg?.name}" via UPI (${modes[upiPkg] || 'chat'} mode). UTR: ${confirm.utr}. Please confirm and schedule.`
    );
  };

  return (
    <div className="max-w-6xl mx-auto px-6 py-16">
      <p className="text-xs uppercase tracking-[0.3em] font-mono text-amber-500/80 mb-3">Consultations</p>
      <h1 className="text-4xl md:text-5xl font-serif-display font-light text-white tracking-tight mb-6">
        Personal readings with <span className="text-gold italic">Acharya Akash</span>.
      </h1>
      <p className="text-slate-400 max-w-2xl mb-14">
        Choose the reading that fits your moment. Pay directly via UPI.
      </p>

      <div className="grid md:grid-cols-2 gap-8">
        {packages.map((p) => {
          const highlight = p.id === "detailed_reading";
          const mode = modes[p.id] || "chat";
          return (
            <Card
              key={p.id}
              className={`glass relative overflow-hidden transition ${
                highlight ? "border-amber-400/40" : "border-white/10 hover:border-amber-400/30"
              }`}
            >
              <CardContent className="p-10">
                <div className={`absolute -top-24 -right-24 w-72 h-72 rounded-full blur-3xl ${highlight ? "bg-amber-500/15" : "bg-amber-500/5"}`} />
                <p className="text-xs uppercase tracking-[0.3em] font-mono text-amber-500/70 mb-4">
                  {highlight ? "Most recommended" : "Quick guidance"}
                </p>
                <h3 className="text-3xl font-serif-display text-white mb-3">{p.name}</h3>
                <p className="text-sm text-slate-400 mb-6 min-h-[48px]">{p.description}</p>
                <div className="flex items-baseline gap-2 mb-6">
                  <span className="text-5xl font-serif-display text-gold">₹{p.amount.toLocaleString('en-IN')}</span>
                  <span className="text-sm text-slate-500">one-time</span>
                </div>

                {/* Mode toggle */}
                <div className="mb-6">
                  <p className="text-[10px] uppercase tracking-[0.2em] font-mono text-amber-500/70 mb-2">Preferred mode</p>
                  <div className="grid grid-cols-2 gap-2 bg-black/40 rounded-full p-1 border border-white/10">
                    <button
                      data-testid={`mode-chat-${p.id}`}
                      onClick={() => setModes({ ...modes, [p.id]: "chat" })}
                      className={`py-2 rounded-full text-sm flex items-center justify-center gap-2 transition ${
                        mode === "chat" ? "bg-gold text-black" : "text-slate-300 hover:text-white"
                      }`}
                    >
                      <MessageCircle className="w-4 h-4" /> Chat
                    </button>
                    <button
                      data-testid={`mode-call-${p.id}`}
                      onClick={() => setModes({ ...modes, [p.id]: "call" })}
                      className={`py-2 rounded-full text-sm flex items-center justify-center gap-2 transition ${
                        mode === "call" ? "bg-gold text-black" : "text-slate-300 hover:text-white"
                      }`}
                    >
                      <Phone className="w-4 h-4" /> Call
                    </button>
                  </div>
                </div>

                <ul className="space-y-2 mb-8 text-sm text-slate-300">
                  {(features[p.id] || []).map(f => (
                    <li key={f} className="flex items-start gap-2">
                      <Check className="w-4 h-4 text-gold shrink-0 mt-0.5" />
                      <span>{f}</span>
                    </li>
                  ))}
                </ul>
               {false && (
                <Button
                  data-testid={`buy-${p.id}`}
                  onClick={() => buy(p.id)}
                  disabled={loading === p.id}
                  className={`w-full rounded-full py-6 ${highlight ? "bg-gold text-black hover:bg-amber-300 gold-glow" : "bg-white/10 hover:bg-white/20 text-white"}`}
                >
                  {loading === p.id ? <Loader2 className="w-4 h-4 animate-spin" /> : `Book — ₹${p.amount.toLocaleString('en-IN')}`}
                </Button>
              )
               }
              </CardContent>
            </Card>
          );
        })}
      </div>

      {/* UPI direct payment */}
      <div className="mt-16">
        <p className="text-xs uppercase tracking-[0.3em] font-mono text-amber-500/80 mb-3"></p>
        <h2 className="text-3xl md:text-4xl font-serif-display font-light text-white tracking-tight mb-8">
          Pay via <span className="text-gold italic">UPI</span>.
        </h2>
        <Card className="glass border-amber-400/20">
          <CardContent className="p-8 grid md:grid-cols-[280px_1fr] gap-10 items-center">
            <div className="bg-white p-4 rounded-2xl mx-auto md:mx-0 max-w-[280px]">
              {upi ? (
                <img data-testid="upi-qr" src={upi.qr_url} alt="UPI QR code" className="w-full h-auto" />
              ) : (
                <div className="aspect-square flex items-center justify-center text-slate-500">
                  <Loader2 className="w-6 h-6 animate-spin" />
                </div>
              )}
            </div>
            <div>
              <div className="flex items-center gap-2 mb-3">
                <QrCode className="w-4 h-4 text-gold" />
                <p className="text-xs uppercase tracking-[0.3em] font-mono text-amber-500/80">Scan or send to</p>
              </div>
              <p className="text-2xl font-serif-display text-white mb-1" data-testid="upi-id-display">
                {upi?.upi_id || "—"}
              </p>
              <p className="text-sm text-slate-400 mb-6">Payee: {upi?.payee_name}</p>

              <div className="mb-6">
                <p className="text-[10px] uppercase tracking-[0.2em] font-mono text-amber-500/70 mb-2">Amount</p>
                <div className="flex gap-2 flex-wrap">
                  {packages.map(p => (
                    <button
                      key={p.id}
                      data-testid={`upi-amt-${p.id}`}
                      onClick={() => setUpiPkg(p.id)}
                      className={`px-4 py-2 rounded-full text-sm border transition ${
                        upiPkg === p.id
                          ? "bg-gold text-black border-gold"
                          : "border-white/10 text-slate-300 hover:border-amber-400/40"
                      }`}
                    >
                      ₹{p.amount.toLocaleString('en-IN')} · {p.name}
                    </button>
                  ))}
                </div>
              </div>

              <div className="flex gap-2 flex-wrap">
                <Button
                  data-testid="upi-copy-btn"
                  onClick={() => copy(upi?.upi_id || "")}
                  variant="outline"
                  className="rounded-full border-white/20 bg-transparent text-slate-100 hover:bg-white/5"
                >
                  <Copy className="w-4 h-4 mr-2" /> Copy UPI ID
                </Button>
                {false && (<a
                  data-testid="upi-open-btn"
                  href={upi?.upi_url || "#"}
                  className="inline-flex items-center px-6 py-2 rounded-full bg-gold text-black hover:bg-amber-300 transition"
                >
                  Open in UPI app
                </a>
                )}
                <Button
                  data-testid="upi-confirm-btn"
                  onClick={openConfirm}
                  className="rounded-full bg-emerald-500/90 text-white hover:bg-emerald-500"
                >
                  <CheckCircle2 className="w-4 h-4 mr-2" /> I paid via UPI
                </Button>
              </div>

              <p className="text-xs text-slate-500 mt-6 leading-relaxed">
                After payment, tap <span className="text-emerald-400">"I paid via UPI"</span> to submit your UTR and screenshot — Acharya will confirm and schedule your session directly.
              </p>
            </div>
          </CardContent>
        </Card>
      </div>

      <p className="text-xs text-slate-500 mt-10 text-center">
        UPI payments processed securely.
      </p>

      {/* UPI Confirmation Dialog */}
      <Dialog open={confirmOpen} onOpenChange={setConfirmOpen}>
        <DialogContent className="bg-[#1B1655] border-white/10 text-white max-w-md">
          <DialogHeader>
            <DialogTitle className="font-serif-display text-2xl">
              {confirmedId ? "Payment reported ✨" : "Confirm your UPI payment"}
            </DialogTitle>
          </DialogHeader>
          {confirmedId ? (
            <div className="space-y-5 py-4">
              <div className="flex items-center gap-3">
                <div className="w-12 h-12 rounded-full bg-emerald-500/20 flex items-center justify-center">
                  <CheckCircle2 className="w-6 h-6 text-emerald-400" />
                </div>
                <div>
                  <p className="text-white font-medium">Received</p>
                  <p className="text-xs text-slate-400">Ref: {confirmedId.slice(0, 8)}</p>
                </div>
              </div>
              <p className="text-sm text-slate-300 leading-relaxed">
                Acharya Akash will verify your payment and reach out to schedule your session. To speed it up, share the details on WhatsApp too.
              </p>
              <a
                data-testid="confirm-whatsapp"
                href={confirmWhatsapp()}
                target="_blank"
                rel="noreferrer"
                className="w-full inline-flex justify-center items-center gap-2 py-3 rounded-full bg-gold text-black hover:bg-amber-300 transition"
              >
                <MessageCircle className="w-4 h-4" /> Notify on WhatsApp
              </a>
              <Button
                variant="outline"
                onClick={() => setConfirmOpen(false)}
                className="w-full rounded-full border-white/20 bg-transparent text-slate-100 hover:bg-white/5"
              >
                Close
              </Button>
            </div>
          ) : (
            <div className="space-y-4 py-2">
              <div>
                <Label className="text-slate-300 text-xs uppercase tracking-widest">Package</Label>
                <p className="text-white mt-1">
                  {packages.find(p => p.id === upiPkg)?.name} · ₹{packages.find(p => p.id === upiPkg)?.amount?.toLocaleString('en-IN')}
                  <span className="text-slate-500 ml-2">· {modes[upiPkg] || "chat"} mode</span>
                </p>
              </div>
              <div>
                <Label className="text-slate-300">UTR / Reference number</Label>
                <Input
                  data-testid="confirm-utr"
                  required
                  value={confirm.utr}
                  onChange={e => setConfirm({ ...confirm, utr: e.target.value })}
                  placeholder="e.g. 424212345678"
                  className="bg-black/40 border-white/10 mt-2 font-mono"
                />
                <p className="text-[11px] text-slate-500 mt-1">Find it in your bank app or the UPI success screen.</p>
              </div>
              <div>
                <Label className="text-slate-300">Screenshot <span className="text-slate-500">(optional)</span></Label>
                {confirm.screenshot ? (
                  <div className="mt-2 flex items-center gap-3 p-3 rounded-xl bg-black/30 border border-white/10">
                    <img src={confirm.screenshot} alt="preview" className="w-16 h-16 object-cover rounded-md" />
                    <div className="flex-1 min-w-0">
                      <p className="text-xs text-slate-300 truncate">{confirm.filename}</p>
                      <p className="text-[11px] text-emerald-400">Ready to upload</p>
                    </div>
                    <button onClick={() => setConfirm(c => ({ ...c, screenshot: "", filename: "" }))} className="text-slate-400 hover:text-white">
                      <X className="w-4 h-4" />
                    </button>
                  </div>
                ) : (
                  <label className="mt-2 block cursor-pointer">
                    <input type="file" accept="image/*" onChange={handleFile} className="hidden" data-testid="confirm-screenshot" />
                    <div className="rounded-xl border-2 border-dashed border-white/10 hover:border-amber-400/40 p-6 text-center text-slate-400 transition">
                      <Upload className="w-5 h-5 mx-auto mb-2 text-amber-400/70" />
                      <p className="text-sm">Tap to attach payment screenshot</p>
                      <p className="text-[11px] text-slate-500 mt-1">JPG or PNG, up to 4MB</p>
                    </div>
                  </label>
                )}
              </div>
              <div>
                <Label className="text-slate-300">Note <span className="text-slate-500">(optional)</span></Label>
                <Input
                  data-testid="confirm-note"
                  value={confirm.note}
                  onChange={e => setConfirm({ ...confirm, note: e.target.value })}
                  placeholder="Anything you'd like to add"
                  className="bg-black/40 border-white/10 mt-2"
                />
              </div>
              <DialogFooter>
                <Button
                  data-testid="confirm-submit"
                  onClick={submitConfirm}
                  disabled={submitting || !confirm.utr}
                  className="w-full bg-gold text-black hover:bg-amber-300 rounded-full py-6 gold-glow"
                >
                  {submitting ? <Loader2 className="w-4 h-4 animate-spin" /> : "Submit for confirmation"}
                </Button>
              </DialogFooter>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}

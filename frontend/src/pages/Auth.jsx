import { useState } from "react";
import { useNavigate, useSearchParams, Link } from "react-router-dom";
import { useAuth } from "@/context/AuthContext";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { api } from "@/lib/api";
import { toast } from "sonner";
import { Sparkles, Mail, Smartphone, ArrowLeft } from "lucide-react";

function EmailAuthForm({ mode, setMode, done }) {
  const { login, signup } = useAuth();
  const [form, setForm] = useState({ name: "", email: "", password: "" });
  const [loading, setLoading] = useState(false);

  const submit = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
      if (mode === "signup") await signup(form.name, form.email, form.password);
      else await login(form.email, form.password);
      toast.success(mode === "signup" ? "Welcome to the practice." : "Signed in.");
      done();
    } catch (err) {
      toast.error(err.response?.data?.detail || "Something went wrong");
    } finally { setLoading(false); }
  };

  return (
    <form onSubmit={submit} className="space-y-5 mt-4">
      {mode === "signup" && (
        <div>
          <Label htmlFor="name" className="text-slate-300">Full name</Label>
          <Input id="name" data-testid="auth-name-input" required value={form.name}
            onChange={(e) => setForm({ ...form, name: e.target.value })}
            className="bg-black/30 border-white/10 mt-2" />
        </div>
      )}
      <div>
        <Label htmlFor="email" className="text-slate-300">Email</Label>
        <Input id="email" type="email" data-testid="auth-email-input" required value={form.email}
          onChange={(e) => setForm({ ...form, email: e.target.value })}
          className="bg-black/30 border-white/10 mt-2" />
      </div>
      <div>
        <Label htmlFor="password" className="text-slate-300">Password</Label>
        <Input id="password" type="password" data-testid="auth-password-input" required minLength={6}
          value={form.password} onChange={(e) => setForm({ ...form, password: e.target.value })}
          className="bg-black/30 border-white/10 mt-2" />
      </div>
      <Button data-testid="auth-submit-btn" type="submit" disabled={loading}
        className="w-full bg-gold text-black hover:bg-amber-300 rounded-full py-6 gold-glow">
        {loading ? "Please wait…" : mode === "signup" ? "Create account" : "Sign in"}
      </Button>
      <div className="text-center text-sm text-slate-400">
        {mode === "signup" ? "Already have an account?" : "New here?"}{" "}
        <button data-testid="auth-toggle-mode" type="button" className="text-gold hover:underline"
          onClick={() => setMode(mode === "signup" ? "login" : "signup")}>
          {mode === "signup" ? "Sign in" : "Create one"}
        </button>
      </div>
    </form>
  );
}

function PhoneAuthForm({ done }) {
  const { setUser } = useAuth();
  const [step, setStep] = useState("phone");   // phone → otp
  const [phone, setPhone] = useState("");
  const [name, setName] = useState("");
  const [otp, setOtp] = useState("");
  const [loading, setLoading] = useState(false);

  const sendOtp = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
      const r = await api.post("/auth/phone/send-otp", { phone });
      toast.success(`Demo OTP: ${r.data.demo_otp}`, { duration: 8000 });
      setOtp(r.data.demo_otp);   // pre-fill for demo convenience
      setStep("otp");
    } catch (err) {
      toast.error(err.response?.data?.detail || "Could not send OTP");
    } finally { setLoading(false); }
  };

  const verify = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
      const r = await api.post("/auth/phone/verify", { phone, otp, name });
      localStorage.setItem("aa_token", r.data.token);
      setUser(r.data.user);
      toast.success("Verified. Welcome!");
      done();
    } catch (err) {
      toast.error(err.response?.data?.detail || "Invalid OTP");
    } finally { setLoading(false); }
  };

  if (step === "phone") {
    return (
      <form onSubmit={sendOtp} className="space-y-5 mt-4">
        <div>
          <Label className="text-slate-300">Your name <span className="text-slate-500">(optional)</span></Label>
          <Input data-testid="phone-name" value={name} onChange={e => setName(e.target.value)}
            placeholder="Meera" className="bg-black/30 border-white/10 mt-2" />
        </div>
        <div>
          <Label className="text-slate-300">Mobile number</Label>
          <div className="flex gap-2 mt-2">
            <div className="px-4 py-2 rounded-md bg-black/40 border border-white/10 text-slate-300 text-sm flex items-center">+91</div>
            <Input data-testid="phone-input" required inputMode="numeric" pattern="[0-9]{10}"
              placeholder="10-digit mobile" value={phone}
              onChange={e => setPhone(e.target.value.replace(/\D/g, "").slice(0, 10))}
              className="bg-black/30 border-white/10 flex-1" />
          </div>
        </div>
        <Button data-testid="phone-send-otp" type="submit" disabled={loading || phone.length !== 10}
          className="w-full bg-gold text-black hover:bg-amber-300 rounded-full py-6 gold-glow">
          {loading ? "Sending…" : "Send OTP"}
        </Button>
        <p className="text-[11px] text-slate-500 text-center">
          The OTP will be autopopulated on the screen.
        </p>
      </form>
    );
  }
  return (
    <form onSubmit={verify} className="space-y-5 mt-4">
      <button type="button" onClick={() => setStep("phone")} className="text-xs text-slate-400 hover:text-white flex items-center gap-1">
        <ArrowLeft className="w-3 h-3" /> Change number
      </button>
      <div>
        <Label className="text-slate-300">Enter the 6-digit OTP sent to +91 {phone}</Label>
        <Input data-testid="phone-otp-input" required inputMode="numeric" maxLength={6}
          value={otp} onChange={e => setOtp(e.target.value.replace(/\D/g, "").slice(0, 6))}
          className="bg-black/30 border-white/10 mt-2 text-2xl tracking-[0.4em] text-center font-mono" />
      </div>
      <Button data-testid="phone-verify-btn" type="submit" disabled={loading || otp.length !== 6}
        className="w-full bg-gold text-black hover:bg-amber-300 rounded-full py-6 gold-glow">
        {loading ? "Verifying…" : "Verify & continue"}
      </Button>
    </form>
  );
}

export default function Auth() {
  const nav = useNavigate();
  const [params] = useSearchParams();
  const [tab, setTab] = useState("email");
  const [mode, setMode] = useState(params.get("mode") === "signup" ? "signup" : "login");
  const done = () => nav("/dashboard");

  return (
    <div className="min-h-[calc(100vh-80px)] flex items-center justify-center px-6 py-16">
      <Card className="w-full max-w-md glass border-white/10">
        <CardHeader className="text-center pb-2">
          <Sparkles className="w-6 h-6 text-gold mx-auto mb-4" />
          <h1 className="text-3xl font-serif-display text-white tracking-tight">
            {tab === "phone" ? "Sign in with mobile" : (mode === "signup" ? "Begin your journey" : "Welcome back")}
          </h1>
          <p className="text-sm text-slate-400 mt-2">
            Save your chart, track readings, chat any time.
          </p>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 gap-2 bg-black/30 rounded-full p-1 border border-white/10 mt-4">
            <button
              data-testid="tab-email"
              onClick={() => setTab("email")}
              className={`py-2 rounded-full text-sm flex items-center justify-center gap-2 transition ${
                tab === "email" ? "bg-gold text-black" : "text-slate-300 hover:text-white"
              }`}
            >
              <Mail className="w-4 h-4" /> Email
            </button>
            <button
              data-testid="tab-phone"
              onClick={() => setTab("phone")}
              className={`py-2 rounded-full text-sm flex items-center justify-center gap-2 transition ${
                tab === "phone" ? "bg-gold text-black" : "text-slate-300 hover:text-white"
              }`}
            >
              <Smartphone className="w-4 h-4" /> Mobile OTP
            </button>
          </div>

          {tab === "email" ? <EmailAuthForm mode={mode} setMode={setMode} done={done} /> : <PhoneAuthForm done={done} />}

          <div className="mt-4 text-center">
            <Link to="/" className="text-xs text-slate-500 hover:text-slate-300">← Back to home</Link>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

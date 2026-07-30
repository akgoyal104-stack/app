import { useState } from "react";
import { useNavigate, useSearchParams, Link } from "react-router-dom";
import { useAuth } from "@/context/AuthContext";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { toast } from "sonner";
import { Sparkles } from "lucide-react";

export default function Auth() {
  const nav = useNavigate();
  const [params] = useSearchParams();
  const [mode, setMode] = useState(params.get("mode") === "signup" ? "signup" : "login");
  const { login, signup } = useAuth();
  const [form, setForm] = useState({ name: "", email: "", password: "" });
  const [loading, setLoading] = useState(false);

  const submit = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
      if (mode === "signup") {
        await signup(form.name, form.email, form.password);
        toast.success("Welcome to the practice.");
      } else {
        await login(form.email, form.password);
        toast.success("Signed in.");
      }
      nav("/dashboard");
    } catch (err) {
      toast.error(err.response?.data?.detail || "Something went wrong");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-[calc(100vh-80px)] flex items-center justify-center px-6 py-16">
      <Card className="w-full max-w-md glass border-white/10">
        <CardHeader className="text-center pb-2">
          <Sparkles className="w-6 h-6 text-gold mx-auto mb-4" />
          <h1 className="text-3xl font-serif-display text-white tracking-tight">
            {mode === "signup" ? "Begin your journey" : "Welcome back"}
          </h1>
          <p className="text-sm text-slate-400 mt-2">
            {mode === "signup" ? "Save your chart, track readings, chat any time." : "Sign in to your dashboard."}
          </p>
        </CardHeader>
        <CardContent>
          <form onSubmit={submit} className="space-y-5 mt-4">
            {mode === "signup" && (
              <div>
                <Label htmlFor="name" className="text-slate-300">Full name</Label>
                <Input
                  id="name"
                  data-testid="auth-name-input"
                  required
                  value={form.name}
                  onChange={(e) => setForm({ ...form, name: e.target.value })}
                  className="bg-black/40 border-white/10 mt-2"
                />
              </div>
            )}
            <div>
              <Label htmlFor="email" className="text-slate-300">Email</Label>
              <Input
                id="email"
                type="email"
                data-testid="auth-email-input"
                required
                value={form.email}
                onChange={(e) => setForm({ ...form, email: e.target.value })}
                className="bg-black/40 border-white/10 mt-2"
              />
            </div>
            <div>
              <Label htmlFor="password" className="text-slate-300">Password</Label>
              <Input
                id="password"
                type="password"
                data-testid="auth-password-input"
                required
                minLength={6}
                value={form.password}
                onChange={(e) => setForm({ ...form, password: e.target.value })}
                className="bg-black/40 border-white/10 mt-2"
              />
            </div>
            <Button
              data-testid="auth-submit-btn"
              type="submit"
              disabled={loading}
              className="w-full bg-gold text-black hover:bg-amber-300 rounded-full py-6 gold-glow"
            >
              {loading ? "Please wait…" : mode === "signup" ? "Create account" : "Sign in"}
            </Button>
          </form>
          <div className="mt-6 text-center text-sm text-slate-400">
            {mode === "signup" ? "Already have an account?" : "New here?"}{" "}
            <button
              data-testid="auth-toggle-mode"
              type="button"
              className="text-gold hover:underline"
              onClick={() => setMode(mode === "signup" ? "login" : "signup")}
            >
              {mode === "signup" ? "Sign in" : "Create one"}
            </button>
          </div>
          <div className="mt-2 text-center">
            <Link to="/" className="text-xs text-slate-500 hover:text-slate-300">← Back to home</Link>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

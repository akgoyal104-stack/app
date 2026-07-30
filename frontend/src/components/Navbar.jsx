import { Link, useNavigate, useLocation } from "react-router-dom";
import { useAuth } from "@/context/AuthContext";
import { Button } from "@/components/ui/button";
import { Sparkles, LogOut, User } from "lucide-react";

const links = [
  { to: "/horoscopes", label: "Horoscopes" },
  { to: "/birth-chart", label: "Birth Chart" },
  { to: "/compatibility", label: "Compatibility" },
  { to: "/ai-astrologer", label: "AI Astrologer" },
  { to: "/pricing", label: "Consultations" },
];

export default function Navbar() {
  const { user, logout } = useAuth();
  const nav = useNavigate();
  const loc = useLocation();

  return (
    <nav className="sticky top-0 z-40 glass border-b border-white/10">
      <div className="max-w-7xl mx-auto px-6 py-4 flex items-center justify-between">
        <Link to="/" data-testid="nav-logo" className="flex items-center gap-2 group">
          <Sparkles className="w-5 h-5 text-gold group-hover:rotate-12 transition-transform" />
          <span className="font-serif-display text-xl tracking-tight text-white">
            Acharya <span className="text-gold">Akash</span>
          </span>
        </Link>
        <div className="hidden md:flex items-center gap-1">
          {links.map(l => (
            <Link
              key={l.to}
              to={l.to}
              data-testid={`nav-${l.to.replace('/', '')}`}
              className={`px-3 py-2 rounded-full text-sm font-medium transition-colors ${
                loc.pathname.startsWith(l.to) ? "text-gold bg-white/5" : "text-slate-300 hover:text-white hover:bg-white/5"
              }`}
            >
              {l.label}
            </Link>
          ))}
        </div>
        <div className="flex items-center gap-2">
          {user ? (
            <>
              <Link to="/dashboard" data-testid="nav-dashboard" className="hidden sm:flex items-center gap-2 px-3 py-2 rounded-full text-sm hover:bg-white/5">
                <User className="w-4 h-4 text-gold" />
                <span className="text-slate-200">{user.name}</span>
              </Link>
              <Button
                data-testid="nav-logout"
                variant="ghost"
                size="sm"
                onClick={() => { logout(); nav("/"); }}
                className="text-slate-300 hover:text-white"
              >
                <LogOut className="w-4 h-4" />
              </Button>
            </>
          ) : (
            <>
              <Button data-testid="nav-login" variant="ghost" onClick={() => nav("/auth")} className="text-slate-200 rounded-full">
                Sign in
              </Button>
              <Button data-testid="nav-signup" onClick={() => nav("/auth?mode=signup")} className="bg-gold text-black hover:bg-amber-300 rounded-full">
                Begin Journey
              </Button>
            </>
          )}
        </div>
      </div>
    </nav>
  );
}

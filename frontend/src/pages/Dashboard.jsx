import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { useAuth } from "@/context/AuthContext";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { api } from "@/lib/api";
import { Compass, MessageCircle, Sparkles, TrendingUp, Star } from "lucide-react";

export default function Dashboard() {
  const { user } = useAuth();
  const [charts, setCharts] = useState([]);
  const [sessions, setSessions] = useState([]);
  const [todayHoro, setTodayHoro] = useState(null);

  useEffect(() => {
    api.get("/birth-chart/history").then(r => setCharts(r.data.items || [])).catch(() => {});
    api.get("/chat/sessions").then(r => setSessions(r.data.sessions || [])).catch(() => {});
  }, []);

  useEffect(() => {
    if (charts.length > 0) {
      const sun = charts[0].sun_sign;
      api.get(`/horoscopes/${sun}`, { params: { period: "daily" } }).then(r => setTodayHoro({ sign: sun, ...r.data }));
    }
  }, [charts]);

  return (
    <div className="max-w-7xl mx-auto px-6 py-12">
      <p className="text-xs uppercase tracking-[0.3em] font-mono text-amber-500/80 mb-3">Namaste</p>
      <h1 className="text-4xl md:text-5xl font-serif-display font-light text-white tracking-tight mb-2">
        Welcome, <span className="text-gold italic">{user?.name}</span>
      </h1>
      <p className="text-slate-400 mb-10">
        Your personal Vedic dashboard. Explore your chart, ask a question, or book a consultation.
      </p>

      <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6">
        {/* Today's horoscope */}
        <Card className="glass border-white/10 md:col-span-2 lg:col-span-2 row-span-2">
          <CardContent className="p-8">
            <div className="flex items-center gap-2 mb-4">
              <Star className="w-4 h-4 text-gold" />
              <p className="text-xs uppercase tracking-[0.3em] font-mono text-amber-500/80">Today's reading</p>
            </div>
            {todayHoro ? (
              <>
                <h2 className="text-3xl font-serif-display text-white mb-4">{todayHoro.sign}</h2>
                <p className="text-slate-300 leading-relaxed">{todayHoro.text}</p>
              </>
            ) : (
              <>
                <h2 className="text-2xl font-serif-display text-white mb-2">Cast your chart first</h2>
                <p className="text-slate-400 mb-6">Generate a birth chart to receive your daily reading here.</p>
                <Link to="/birth-chart"><Button data-testid="dash-cast-chart" className="bg-gold text-black hover:bg-amber-300 rounded-full">Cast birth chart</Button></Link>
              </>
            )}
          </CardContent>
        </Card>

        <Card className="glass border-white/10">
          <CardContent className="p-6">
            <Compass className="w-6 h-6 text-gold mb-3" strokeWidth={1.4} />
            <p className="text-3xl font-serif-display text-white">{charts.length}</p>
            <p className="text-xs text-slate-400 mt-1">Saved birth charts</p>
            <Link to="/birth-chart" className="text-xs text-gold hover:underline mt-3 inline-block">New chart →</Link>
          </CardContent>
        </Card>

        <Card className="glass border-white/10">
          <CardContent className="p-6">
            <MessageCircle className="w-6 h-6 text-gold mb-3" strokeWidth={1.4} />
            <p className="text-3xl font-serif-display text-white">{sessions.length}</p>
            <p className="text-xs text-slate-400 mt-1">Chat conversations</p>
            <Link to="/ai-astrologer" className="text-xs text-gold hover:underline mt-3 inline-block">Ask a question →</Link>
          </CardContent>
        </Card>

        {(
          <Card className="glass border-amber-400/30 lg:col-span-2 relative overflow-hidden">
            <CardContent className="p-8">
              <div className="absolute -top-20 -right-20 w-60 h-60 rounded-full bg-amber-500/10 blur-3xl" />
              <Sparkles className="w-6 h-6 text-gold mb-3" />
              <h3 className="text-2xl font-serif-display text-white">Personal consultation</h3>
              <p className="text-slate-400 mt-2 mb-4">
                Basic questions to Detailed reading 
              </p>
              <Link to="/pricing"><Button data-testid="dash-book" className="bg-gold text-black hover:bg-amber-300 rounded-full">Book a consulation with Acharya Akash</Button></Link>
            </CardContent>
          </Card>
        )}

        <Card className="glass border-white/10 lg:col-span-2">
          <CardContent className="p-8">
            <TrendingUp className="w-6 h-6 text-gold mb-3" strokeWidth={1.4} />
            <h3 className="text-xl font-serif-display text-white mb-4">Recent conversations</h3>
            {sessions.length === 0 ? (
              <p className="text-slate-500 text-sm">No chats yet. Ask Acharya Akash a question →</p>
            ) : (
              <div className="space-y-2">
                {sessions.slice(0, 4).map(s => (
                  <Link key={s.session_id} to="/ai-astrologer" className="block p-3 rounded-xl bg-white/5 hover:bg-white/10 text-sm text-slate-300 line-clamp-1">
                    {s.last_message}
                  </Link>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}

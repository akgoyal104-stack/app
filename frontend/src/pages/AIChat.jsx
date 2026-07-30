import { useEffect, useRef, useState } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { api, API } from "@/lib/api";
import { toast } from "sonner";
import { Send, Loader2, MessageCircle, Plus } from "lucide-react";

export default function AIChat() {
  const [sessions, setSessions] = useState([]);
  const [sessionId, setSessionId] = useState(null);
  const [messages, setMessages] = useState([]);
  const [text, setText] = useState("");
  const [sending, setSending] = useState(false);
  const [streamed, setStreamed] = useState("");
  const bottomRef = useRef(null);
  const abortRef = useRef(null);

  const loadSessions = () => api.get("/chat/sessions").then(r => setSessions(r.data.sessions || []));
  const loadMessages = (sid) => api.get(`/chat/${sid}/messages`).then(r => setMessages(r.data.messages || []));

  useEffect(() => { loadSessions(); }, []);
  useEffect(() => {
    if (sessionId) loadMessages(sessionId);
    else setMessages([]);
  }, [sessionId]);
  useEffect(() => { bottomRef.current?.scrollIntoView({ behavior: "smooth" }); }, [messages, streamed]);

  const send = async (e) => {
    e.preventDefault();
    if (!text.trim() || sending) return;
    const userMsg = text;
    setText("");
    setMessages(prev => [...prev, { role: "user", content: userMsg }]);
    setSending(true);
    setStreamed("");

    let currentSessionId = sessionId;
    let assistantText = "";

    try {
      const token = localStorage.getItem("aa_token");
      const ac = new AbortController();
      abortRef.current = ac;
      const res = await fetch(`${API}/chat/stream`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ session_id: sessionId, message: userMsg }),
        signal: ac.signal,
      });
      if (!res.ok || !res.body) throw new Error("stream failed");
      const reader = res.body.getReader();
      const decoder = new TextDecoder();
      let buffer = "";
      while (true) {
        const { done, value } = await reader.read();
        if (done) break;
        buffer += decoder.decode(value, { stream: true });
        // parse SSE events
        const parts = buffer.split("\n\n");
        buffer = parts.pop() || "";
        for (const p of parts) {
          const lines = p.split("\n");
          let event = "message", data = "";
          for (const l of lines) {
            if (l.startsWith("event: ")) event = l.slice(7).trim();
            else if (l.startsWith("data: ")) data += l.slice(6);
          }
          if (!data) continue;
          try {
            const parsed = JSON.parse(data);
            if (event === "session") currentSessionId = parsed.session_id;
            else if (event === "delta") {
              assistantText += parsed.content;
              setStreamed(assistantText);
            } else if (event === "error") {
              toast.error(parsed.error || "Stream error");
            }
          } catch { /* ignore */ }
        }
      }
      if (!sessionId && currentSessionId) setSessionId(currentSessionId);
      setMessages(prev => [...prev, { role: "assistant", content: assistantText }]);
      setStreamed("");
      loadSessions();
    } catch (err) {
      toast.error("Could not send message");
      setMessages(prev => prev.slice(0, -1));
    } finally {
      setSending(false);
      abortRef.current = null;
    }
  };

  return (
    <div className="max-w-7xl mx-auto px-6 py-10">
      <p className="text-xs uppercase tracking-[0.3em] font-mono text-amber-500/80 mb-3">AI Astrologer</p>
      <h1 className="text-4xl md:text-5xl font-serif-display font-light text-white tracking-tight mb-8">
        Ask <span className="text-gold italic">Acharya Akash</span> anything.
      </h1>

      <div className="grid md:grid-cols-[280px_1fr] gap-6">
        <div>
          <Button data-testid="new-chat-btn" onClick={() => { setSessionId(null); setMessages([]); }} className="w-full bg-gold text-black hover:bg-amber-300 rounded-full mb-4">
            <Plus className="w-4 h-4 mr-2" /> New conversation
          </Button>
          <div className="space-y-2 max-h-[70vh] overflow-y-auto pr-1">
            {sessions.map(s => (
              <button
                key={s.session_id}
                data-testid={`session-${s.session_id}`}
                onClick={() => setSessionId(s.session_id)}
                className={`w-full text-left p-4 rounded-xl border transition ${
                  sessionId === s.session_id
                    ? "border-amber-400/40 bg-amber-500/5"
                    : "border-white/10 bg-card hover:border-white/20"
                }`}
              >
                <p className="text-sm text-slate-200 line-clamp-2">{s.last_message}</p>
              </button>
            ))}
          </div>
        </div>

        <Card className="glass border-white/10 min-h-[600px] flex flex-col">
          <CardContent className="p-6 flex-1 flex flex-col">
            <div className="flex-1 overflow-y-auto space-y-4 pr-2" style={{ maxHeight: "60vh" }}>
              {messages.length === 0 && !streamed && (
                <div className="h-full flex flex-col items-center justify-center text-center py-16">
                  <MessageCircle className="w-10 h-10 text-gold mb-4" strokeWidth={1.2} />
                  <p className="font-serif-display text-xl text-slate-200">A blank scroll awaits your question.</p>
                  <p className="text-sm text-slate-500 mt-2">Try: "What does my current dasha say about career?"</p>
                </div>
              )}
              {messages.map((m, i) => (
                <div key={i} className={`flex ${m.role === "user" ? "justify-end" : "justify-start"}`}>
                  <div
                    data-testid={`msg-${m.role}-${i}`}
                    className={`max-w-[80%] p-4 rounded-2xl ${
                      m.role === "user"
                        ? "bg-white/10 text-slate-100 border border-white/10"
                        : "bg-gradient-to-br from-amber-500/10 to-amber-900/5 text-slate-100 border border-amber-400/20"
                    }`}
                  >
                    <p className="whitespace-pre-wrap leading-relaxed">{m.content}</p>
                  </div>
                </div>
              ))}
              {streamed && (
                <div className="flex justify-start">
                  <div className="max-w-[80%] p-4 rounded-2xl bg-gradient-to-br from-amber-500/10 to-amber-900/5 text-slate-100 border border-amber-400/20">
                    <p className="whitespace-pre-wrap leading-relaxed">{streamed}<span className="animate-pulse text-gold">▊</span></p>
                  </div>
                </div>
              )}
              {sending && !streamed && (
                <div className="flex justify-start">
                  <div className="p-4 rounded-2xl border border-amber-400/20 bg-amber-500/5 text-slate-400 flex items-center gap-2">
                    <Loader2 className="w-4 h-4 animate-spin text-gold" /> Consulting the stars…
                  </div>
                </div>
              )}
              <div ref={bottomRef} />
            </div>

            <form onSubmit={send} className="mt-4 flex gap-2 border-t border-white/5 pt-4">
              <Input
                data-testid="chat-input"
                value={text}
                onChange={e => setText(e.target.value)}
                placeholder="Ask about your dasha, karma, career, love…"
                className="bg-black/40 border-white/10"
                disabled={sending}
              />
              <Button data-testid="chat-send-btn" type="submit" disabled={sending || !text.trim()} className="bg-gold text-black hover:bg-amber-300 rounded-full px-6">
                <Send className="w-4 h-4" />
              </Button>
            </form>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}

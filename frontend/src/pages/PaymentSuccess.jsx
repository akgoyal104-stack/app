import { useEffect, useState } from "react";
import { useSearchParams, Link } from "react-router-dom";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { api } from "@/lib/api";
import { PROFILE, whatsappLink } from "@/components/Footer";
import { CheckCircle2, Loader2, XCircle, MessageCircle, Phone } from "lucide-react";

export default function PaymentSuccess() {
  const [params] = useSearchParams();
  const sessionId = params.get("session_id");
  const [status, setStatus] = useState({ loading: true });

  useEffect(() => {
    if (!sessionId) { setStatus({ error: "No session" }); return; }
    let tries = 0;
    const poll = async () => {
      try {
        const r = await api.get(`/payments/status/${sessionId}`);
        if (r.data.payment_status === "paid") {
          setStatus({ paid: true, ...r.data });
          return;
        }
        if (r.data.payment_status === "failed" || r.data.payment_status === "expired") {
          setStatus({ error: r.data.payment_status });
          return;
        }
      } catch { /* keep polling */ }
      if (tries++ > 20) { setStatus({ timeout: true }); return; }
      setTimeout(poll, 2000);
    };
    poll();
  }, [sessionId]);

  const waLink = whatsappLink(
    `Namaste Acharya Akash — I just booked "${status.package_id || 'a consultation'}" (session ${sessionId?.slice(0, 12)}). Please help me schedule my reading.`
  );

  return (
    <div className="min-h-[calc(100vh-80px)] flex items-center justify-center px-6 py-16">
      <Card className="glass border-white/10 max-w-md w-full">
        <CardContent className="p-10 text-center">
          {status.loading || (!status.paid && !status.error && !status.timeout) ? (
            <>
              <Loader2 className="w-10 h-10 text-gold animate-spin mx-auto mb-4" />
              <p className="text-slate-300">Confirming your payment…</p>
            </>
          ) : status.paid ? (
            <>
              <CheckCircle2 className="w-14 h-14 text-gold mx-auto mb-4" strokeWidth={1.2} />
              <h1 className="text-3xl font-serif-display text-white mb-2">Payment received</h1>
              <p className="text-slate-400 mb-2">₹{status.amount?.toLocaleString('en-IN')} • {status.package_id}</p>
              <p className="text-slate-400 mb-6">
                Send a quick message on WhatsApp to schedule your reading — Acharya Akash typically responds within a few hours.
              </p>
              <a
                data-testid="success-whatsapp-btn"
                href={waLink}
                target="_blank"
                rel="noreferrer"
                className="inline-flex items-center justify-center gap-2 w-full bg-gold text-black hover:bg-amber-300 rounded-full py-3 font-medium mb-3 transition"
              >
                <MessageCircle className="w-4 h-4" /> Message on WhatsApp
              </a>
              <a
                data-testid="success-call-btn"
                href={`tel:+91${PROFILE.phone}`}
                className="inline-flex items-center justify-center gap-2 w-full border border-white/20 text-slate-100 hover:bg-white/5 rounded-full py-3 mb-3 transition"
              >
                <Phone className="w-4 h-4" /> Call +91 {PROFILE.phone}
              </a>
              <Link to="/dashboard">
                <Button data-testid="success-dashboard-btn" variant="ghost" className="w-full text-slate-300 hover:text-white rounded-full">
                  Go to dashboard
                </Button>
              </Link>
            </>
          ) : (
            <>
              <XCircle className="w-14 h-14 text-red-400 mx-auto mb-4" strokeWidth={1.2} />
              <h1 className="text-3xl font-serif-display text-white mb-2">Something went wrong</h1>
              <p className="text-slate-400 mb-8">We couldn't confirm your payment. If money was deducted, message on WhatsApp.</p>
              <a href={waLink} target="_blank" rel="noreferrer" className="inline-block bg-gold text-black hover:bg-amber-300 rounded-full px-6 py-2">Message on WhatsApp</a>
            </>
          )}
        </CardContent>
      </Card>
    </div>
  );
}

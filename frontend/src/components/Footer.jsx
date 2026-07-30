import { Phone, MessageCircle, Mail, Sparkles } from "lucide-react";

// Contact block — used in Footer and Contact section
export const PROFILE = {
  phone: "9528563305",
  whatsapp: "7417025485",
  email: "akgoyal104@gmail.com",
};

export function whatsappLink(prefill = "Namaste Acharya Akash, I would like to book a Vedic astrology consultation.") {
  return `https://wa.me/91${PROFILE.whatsapp}?text=${encodeURIComponent(prefill)}`;
}

export default function Footer() {
  return (
    <footer className="border-t border-white/5 mt-24 bg-black/30">
      <div className="max-w-7xl mx-auto px-6 py-14 grid md:grid-cols-4 gap-8">
        <div className="md:col-span-2">
          <div className="flex items-center gap-2 mb-3">
            <Sparkles className="w-5 h-5 text-gold" />
            <span className="font-serif-display text-2xl text-white">Acharya <span className="text-gold">Akash</span></span>
          </div>
          <p className="text-sm text-slate-400 max-w-md leading-relaxed">
            Vedic Astrology • Gold Medalist, KN Rao Institute (BVB, New Delhi) • Graduate, NIT Jaipur • 7 years of practice.
          </p>
        </div>
        <div>
          <p className="text-xs uppercase tracking-[0.3em] font-mono text-amber-500/80 mb-4">Reach out</p>
          <ul className="space-y-3 text-sm text-slate-300">
            <li className="flex items-center gap-2">
              <Phone className="w-4 h-4 text-gold" />
              <a data-testid="footer-phone" href={`tel:+91${PROFILE.phone}`} className="hover:text-gold">+91 {PROFILE.phone}</a>
            </li>
            <li className="flex items-center gap-2">
              <MessageCircle className="w-4 h-4 text-gold" />
              <a data-testid="footer-whatsapp" href={whatsappLink()} target="_blank" rel="noreferrer" className="hover:text-gold">WhatsApp +91 {PROFILE.whatsapp}</a>
            </li>
            <li className="flex items-center gap-2">
              <Mail className="w-4 h-4 text-gold" />
              <a data-testid="footer-email" href={`mailto:${PROFILE.email}`} className="hover:text-gold break-all">{PROFILE.email}</a>
            </li>
          </ul>
        </div>
        <div>
          <p className="text-xs uppercase tracking-[0.3em] font-mono text-amber-500/80 mb-4">Practice</p>
          <ul className="space-y-2 text-sm text-slate-400">
            <li>Daily / weekly / monthly horoscopes</li>
            <li>Personal Kundali readings</li>
            <li>Guna Milan compatibility</li>
            <li>AI astrologer chat</li>
          </ul>
        </div>
      </div>
      <div className="border-t border-white/5 py-6 text-center text-xs text-slate-500">
        © {new Date().getFullYear()} Acharya Akash • Vedic Astrology • Made with reverence.
      </div>
    </footer>
  );
}

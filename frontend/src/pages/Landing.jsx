import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Sparkles, Star, Moon, Sun, Compass, Award, GraduationCap, MessageCircle, Phone, Mail, Landmark } from "lucide-react";
import Footer, { PROFILE, whatsappLink } from "@/components/Footer";
import ZodiacWheel from "@/components/ZodiacWheel";

const ZODIACS = [
  { en: "Aries", sa: "Mesha" },
  { en: "Taurus", sa: "Vrishabha" },
  { en: "Gemini", sa: "Mithuna" },
  { en: "Cancer", sa: "Karka" },
  { en: "Leo", sa: "Simha" },
  { en: "Virgo", sa: "Kanya" },
  { en: "Libra", sa: "Tula" },
  { en: "Scorpio", sa: "Vrishchika" },
  { en: "Sagittarius", sa: "Dhanu" },
  { en: "Capricorn", sa: "Makara" },
  { en: "Aquarius", sa: "Kumbha" },
  { en: "Pisces", sa: "Meena" },
];

export default function Landing() {
  return (
    <div className="text-slate-200">
      {/* Hero */}
      <section className="relative overflow-hidden">
        <div
          className="absolute inset-0 -z-10 opacity-40"
          style={{
            backgroundImage: 'url("https://images.unsplash.com/photo-1462332420958-a05d1e002413?crop=entropy&cs=srgb&fm=jpg&ixid=M3w4NjA2ODl8MHwxfHNlYXJjaHwxfHxteXN0aWNhbCUyMG5lYnVsYSUyMGRlZXAlMjBzcGFjZXxlbnwwfHx8fDE3ODM2NTI5OTF8MA&ixlib=rb-4.1.0&q=85")',
            backgroundSize: "cover",
            backgroundPosition: "center",
          }}
        />
        <div className="absolute inset-0 -z-10 bg-gradient-to-b from-[#05050A]/50 via-[#05050A]/80 to-[#05050A]" />
        <div className="max-w-7xl mx-auto px-6 py-24 md:py-32 grid md:grid-cols-2 gap-16 items-center">
          <div>
            <p className="text-xs uppercase tracking-[0.3em] font-mono text-amber-500/80 mb-6" data-testid="hero-eyebrow">
              Vedic Astrology
            </p>
            <h1 className="text-5xl sm:text-6xl lg:text-7xl font-serif-display font-light tracking-tighter text-white leading-[1.05]">
              Ancient stars,
              <br />
              <span className="text-gold italic font-medium">modern clarity.</span>
            </h1>
            <p className="mt-8 text-lg leading-relaxed text-slate-300 max-w-lg">
              Consultations with <span className="text-gold">Acharya Akash</span> — Gold Medalist from KN Rao's Institute of Astrology
              , Bhartiya Vidya Bhavan, New Delhi. Graduate of NIT Jaipur. UPSC IAS interview candidate.
              A rare blend of tradition and rigour.
            </p>
            <div className="mt-10 flex flex-wrap gap-3">
              <Link to="/pricing">
                <Button data-testid="hero-book-btn" size="lg" className="bg-gold text-black hover:bg-amber-300 rounded-full px-8 gold-glow">
                  Book a Reading
                </Button>
              </Link>
              <Link to="/horoscopes">
                <Button data-testid="hero-horoscope-btn" variant="outline" size="lg" className="rounded-full px-8 border-white/20 bg-transparent text-slate-100 hover:bg-white/5">
                  Today's Horoscope
                </Button>
              </Link>
            </div>
            <div className="mt-12 flex flex-wrap gap-x-8 gap-y-3 text-sm text-slate-400">
              <div className="flex items-center gap-2"><Award className="w-4 h-4 text-gold" /> Gold Medalist</div>
              <div className="flex items-center gap-2"><GraduationCap className="w-4 h-4 text-gold" /> NIT Jaipur • BVB Delhi</div>
              <div className="flex items-center gap-2"><Landmark className="w-4 h-4 text-gold" /> UPSC IAS interviewed</div>
              <div className="flex items-center gap-2"><Star className="w-4 h-4 text-gold" /> 7 yrs practice</div>
            </div>
          </div>
    <div className="relative">
  <div className="absolute -inset-8 bg-gradient-to-br from-amber-500/25 via-transparent to-violet-500/15 blur-3xl -z-10" />

  {/* Zodiac wheel behind portrait */}
  <div className="absolute -top-16 -right-10 opacity-70 pointer-events-none hidden md:block">
    <ZodiacWheel size={420} />
  </div>

  <div className="relative mt-8 md:mt-16 md:ml-16 max-w-md">
    <div className="rounded-3xl overflow-hidden border border-white/10 glass">
      <div
        className="flex w-full snap-x snap-mandatory overflow-x-auto"
        aria-label="Acharya Akash image slider"
      >
        <div className="relative min-w-full shrink-0 snap-center">
          <img
            src="https://customer-assets-39nsmqrw.emergentagent.net/job_zodiac-portal-39/artifacts/2ah3y0f1_325274ac-8ed9-489d-9a14-d48ccf4e95f2.jpeg"
            alt="Acharya Akash portrait"
            className="h-[440px] w-full object-cover object-top"
          />

          <div className="absolute inset-x-0 bottom-0 bg-gradient-to-t from-black/85 via-black/40 to-transparent p-6">
            <p className="text-xs uppercase tracking-[0.3em] font-mono text-amber-400/90">
              Acharya Akash
            </p>
            <p className="mt-1 text-lg text-white font-serif-display">
              Vedic Astrologer • Gold Medalist
            </p>
          </div>
        </div>

        <div className="relative min-w-full shrink-0 snap-center">
          <img
            src="https://res.cloudinary.com/tby6thdx/image/upload/v1785525582/IMG_0664_ailxkm.jpg"
            alt="Acharya Akash additional image"
            className="h-[440px] w-full object-cover object-top"
          />

          <div className="absolute inset-x-0 bottom-0 bg-gradient-to-t from-black/85 via-black/40 to-transparent p-6">
            <p className="text-xs uppercase tracking-[0.3em] font-mono text-amber-400/90">
              Acharya Akash
            </p>
            <p className="mt-1 text-lg text-white font-serif-display">
            </p>
          </div>
        </div>
      </div>
    </div>

    <p className="mt-3 text-center text-xs text-white/50">
      Swipe left or right to view images
     </p>
            </div>
          </div>
        </div>
      </section>
      
      {/* Marquee */}
      <div className="border-y border-white/10 py-6 overflow-hidden bg-black/20 backdrop-blur-sm">
        <div className="marquee-track">
          {[...ZODIACS, ...ZODIACS].map((z, i) => (
            <span key={i} className="mx-10 whitespace-nowrap flex items-baseline gap-2">
              <span className="text-2xl font-serif-display text-gold">✧ {z.sa}</span>
              <span className="text-sm font-mono uppercase tracking-widest text-amber-300/50">{z.en}</span>
            </span>
          ))}
        </div>
      </div>

      {/* Feature grid */}
      <section className="max-w-7xl mx-auto px-6 py-24">
        <div className="mb-16 max-w-2xl">
          <p className="text-xs uppercase tracking-[0.3em] font-mono text-amber-500/80 mb-4">What we offer</p>
          <h2 className="text-4xl md:text-5xl font-serif-display font-light text-white tracking-tight">
            A complete Vedic <span className="text-gold italic">practice</span>, on your phone.
          </h2>
        </div>
        <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6">
          {[
            { icon: Sun, title: "Daily Horoscopes", desc: "Predictions based on Moon sign", to: "/horoscopes" },
            { icon: Compass, title: "Birth Chart", desc: "Casting birth chart as per Lahiri Ayanamsha", to: "/birth-chart" },
            { icon: Moon, title: "Compatibility", desc: "Guna Milan", to: "/compatibility" },
            { icon: MessageCircle, title: "AI Astrologer", desc: "Ask anything", to: "/ai-astrologer" },
          ].map(({ icon: Icon, title, desc, to }, i) => (
            <Link
              key={i}
              to={to}
              data-testid={`feature-${title.toLowerCase().replace(/\s+/g,'-')}`}
              className="group relative rounded-2xl p-8 bg-card border border-border/60 hover:border-amber-400/40 transition-colors overflow-hidden"
            >
              <div className="absolute -top-16 -right-16 w-40 h-40 rounded-full bg-amber-500/5 group-hover:bg-amber-500/10 blur-2xl transition" />
              <Icon className="w-8 h-8 text-gold mb-6" strokeWidth={1.4} />
              <h3 className="text-xl font-serif-display text-white mb-2">{title}</h3>
              <p className="text-sm text-slate-400 leading-relaxed">{desc}</p>
              <span className="mt-6 inline-block text-xs uppercase tracking-[0.2em] text-amber-500/70 group-hover:text-gold transition">Explore →</span>
            </Link>
          ))}
        </div>
      </section>

      {/* About */}
      <section id="about" className="max-w-7xl mx-auto px-6 py-24 grid md:grid-cols-5 gap-16 items-center">
        <div className="md:col-span-2 flex justify-center">
          <ZodiacWheel size={360} />
        </div>
        <div className="md:col-span-3">
          <p className="text-xs uppercase tracking-[0.3em] font-mono text-amber-500/80 mb-4">About Acharya Akash</p>
          <h2 className="text-4xl md:text-5xl font-serif-display font-light text-white tracking-tight leading-tight">
            Where the <span className="text-gold italic">Vedas</span> meet the sharpened mind.
          </h2>
          <p className="mt-8 text-slate-300 leading-relaxed">
            Traditional astrology background with a modern engineer's discipline. Acharya Akash is a graduate of
            <span className="text-gold"> NIT Jaipur</span>, a candidate who reached the
            <span className="text-gold"> UPSC Civil Services (IAS) interview</span>, and a
            <span className="text-gold"> Gold Medalist</span> from KN Rao's institute at Bhartiya Vidya Bhavan, New Delhi.
          </p>
          <p className="mt-4 text-slate-400 leading-relaxed">
            Over 7 years of practice have shaped a reading style that pairs classical Parashari technique
            (dashas, nakshatras, divisional charts) with the honest, considered counsel modern seekers deserve.
          </p>
          <div className="mt-10 grid grid-cols-3 gap-6 max-w-md">
            <div>
              <div className="text-3xl font-serif-display text-gold">7</div>
              <div className="text-xs text-slate-400 mt-1">Years practising</div>
            </div>
            <div>
              <div className="text-3xl font-serif-display text-gold">1st</div>
              <div className="text-xs text-slate-400 mt-1">Class Gold Medal</div>
            </div>
            <div>
              <div className="text-3xl font-serif-display text-gold">IAS</div>
              <div className="text-xs text-slate-400 mt-1">UPSC Interviewed</div>
            </div>
          </div>
        </div>
      </section>

      {/* Testimonials */}
      <section className="max-w-7xl mx-auto px-6 py-24 border-t border-white/5">
        <p className="text-xs uppercase tracking-[0.3em] font-mono text-amber-500/80 mb-4">Voices of seekers</p>
        <h2 className="text-4xl md:text-5xl font-serif-display font-light text-white tracking-tight mb-14">
          What people <span className="text-gold italic">say</span>.
        </h2>
        <div className="grid md:grid-cols-3 gap-6">
          {[
            {
              q: "Acharya Akash didn't just read my chart — he explained the exact Mahadasha shift that had turned my career upside down. Two weeks later I made the decision he'd guided me toward, and it worked.",
              name: "Priya Ramesh",
              role: "Product Manager, Bangalore",
            },
            {
              q: "I was sceptical of astrology till I met an engineer who took it seriously. He walked me through my Navamsa placements with the precision of a mathematician and the care of a family elder.",
              name: "Aditya Verma",
              role: "UPSC aspirant, Delhi",
            },
            {
              q: "The consultation felt less like a prediction and more like a conversation with a wise friend. His remedies were simple, practical, and rooted in tradition — not commercial.",
              name: "Meera Iyer",
              role: "Doctor, Pune",
            },
          ].map((t, i) => (
            <div
              key={i}
              className="glass border border-white/10 rounded-2xl p-8 hover:border-amber-400/30 transition"
            >
              <div className="text-4xl font-serif-display text-gold leading-none mb-4">"</div>
              <p className="text-slate-200 leading-relaxed text-sm">{t.q}</p>
              <div className="mt-6 pt-6 border-t border-white/5">
                <p className="text-white font-serif-display text-base">{t.name}</p>
                <p className="text-xs text-slate-500 mt-0.5">{t.role}</p>
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* Contact */}
      <section id="contact" className="max-w-6xl mx-auto px-6 py-24">
        <p className="text-xs uppercase tracking-[0.3em] font-mono text-amber-500/80 mb-4">Speak to Acharya</p>
        <h2 className="text-4xl md:text-5xl font-serif-display font-light text-white tracking-tight mb-12">
          Three ways to <span className="text-gold italic">connect</span>.
        </h2>
        <div className="grid md:grid-cols-3 gap-6">
          {[
            { icon: Phone, label: "Call", value: `+91 ${PROFILE.phone}`, href: `tel:+91${PROFILE.phone}`, testid: "contact-phone" },
            { icon: MessageCircle, label: "WhatsApp", value: `+91 ${PROFILE.whatsapp}`, href: whatsappLink(), testid: "contact-whatsapp" },
            { icon: Mail, label: "Email", value: PROFILE.email, href: `mailto:${PROFILE.email}`, testid: "contact-email" },
          ].map(({ icon: Icon, label, value, href, testid }) => (
            <a
              key={label}
              href={href}
              target={label === "WhatsApp" ? "_blank" : undefined}
              rel="noreferrer"
              data-testid={testid}
              className="group glass border border-white/10 rounded-2xl p-8 hover:border-amber-400/40 transition"
            >
              <Icon className="w-6 h-6 text-gold mb-4" strokeWidth={1.4} />
              <p className="text-xs uppercase tracking-[0.3em] font-mono text-amber-500/70 mb-2">{label}</p>
              <p className="text-xl font-serif-display text-white break-all">{value}</p>
              <span className="mt-6 inline-block text-xs uppercase tracking-[0.2em] text-slate-500 group-hover:text-gold transition">Reach out →</span>
            </a>
          ))}
        </div>
      </section>

      {/* CTA */}
      <section className="max-w-5xl mx-auto px-6 py-24 text-center">
        <Sparkles className="w-8 h-8 text-gold mx-auto mb-6" />
        <h2 className="text-4xl md:text-6xl font-serif-display font-light text-white tracking-tighter">
          Ready to read your <span className="text-gold italic">stars</span>?
        </h2>
        <p className="mt-6 text-slate-400 max-w-xl mx-auto">
          Create a free account to save your birth chart and pick up conversations with the AI astrologer any time.
        </p>
        <div className="mt-10 flex justify-center gap-3 flex-wrap">
          <Link to="/auth?mode=signup">
            <Button data-testid="cta-signup" size="lg" className="bg-gold text-black hover:bg-amber-300 rounded-full px-10 gold-glow">Create free account</Button>
          </Link>
          <Link to="/pricing">
            <Button data-testid="cta-pricing" variant="outline" size="lg" className="rounded-full px-10 border-white/20 bg-transparent text-slate-100 hover:bg-white/5">See consultations</Button>
          </Link>
        </div>
      </section>

      <Footer />
    </div>
  );
}

// Rotating Vedic zodiac wheel — 12 rashis around a central sun
export default function ZodiacWheel({ size = 340, className = "" }) {
  const signs = [
    { name: "Aries",   glyph: "♈" },
    { name: "Taurus",  glyph: "♉" },
    { name: "Gemini",  glyph: "♊" },
    { name: "Cancer",  glyph: "♋" },
    { name: "Leo",     glyph: "♌" },
    { name: "Virgo",   glyph: "♍" },
    { name: "Libra",   glyph: "♎" },
    { name: "Scorpio", glyph: "♏" },
    { name: "Sagittarius", glyph: "♐" },
    { name: "Capricorn",   glyph: "♑" },
    { name: "Aquarius",    glyph: "♒" },
    { name: "Pisces",      glyph: "♓" },
  ];
  const r = size / 2;
  const ring = r - 26;
  const inner = r - 74;
  return (
    <div className={`relative ${className}`} style={{ width: size, height: size }}>
      {/* outer glow */}
      <div className="absolute inset-0 rounded-full bg-gradient-to-br from-amber-500/25 via-transparent to-violet-500/15 blur-3xl" />

      <svg viewBox={`0 0 ${size} ${size}`} className="absolute inset-0 spin-slow" aria-hidden="true">
        <defs>
          <radialGradient id="sun" cx="50%" cy="50%" r="50%">
            <stop offset="0%" stopColor="#FFF3C4" />
            <stop offset="60%" stopColor="#D4AF37" />
            <stop offset="100%" stopColor="#5a3a10" />
          </radialGradient>
        </defs>
        <circle cx={r} cy={r} r={ring} fill="none" stroke="#D4AF37" strokeOpacity="0.35" strokeDasharray="2 6" />
        <circle cx={r} cy={r} r={ring - 24} fill="none" stroke="#F5D061" strokeOpacity="0.15" />
        <circle cx={r} cy={r} r={inner} fill="none" stroke="#D4AF37" strokeOpacity="0.25" />
        {signs.map((s, i) => {
          const angle = (i * 30 - 90) * (Math.PI / 180);
          const x = r + ring * Math.cos(angle);
          const y = r + ring * Math.sin(angle);
          return (
            <g key={s.name}>
              <text
                x={x} y={y}
                textAnchor="middle" dominantBaseline="middle"
                fontSize={size / 14}
                fill="#F5D061"
                style={{ fontFamily: "'Cormorant Garamond', serif" }}
              >{s.glyph}</text>
            </g>
          );
        })}
        {/* divisions */}
        {signs.map((_, i) => {
          const a = (i * 30 - 90) * (Math.PI / 180);
          return (
            <line
              key={i}
              x1={r + inner * Math.cos(a)} y1={r + inner * Math.sin(a)}
              x2={r + (ring - 8) * Math.cos(a)} y2={r + (ring - 8) * Math.sin(a)}
              stroke="#D4AF37" strokeOpacity="0.2"
            />
          );
        })}
      </svg>

      {/* Center sun */}
      <div className="absolute inset-0 flex items-center justify-center">
        <div
          className="rounded-full"
          style={{
            width: inner * 1.05,
            height: inner * 1.05,
            background: "radial-gradient(circle at 40% 40%, #FFF3C4 0%, #E8B93E 40%, #7a5416 90%)",
            boxShadow: "0 0 60px 8px rgba(245, 208, 97, 0.35)",
          }}
        />
      </div>

      {/* Counter-rotating outer ring of dots (planets) */}
      <svg viewBox={`0 0 ${size} ${size}`} className="absolute inset-0 spin-slow-r" aria-hidden="true">
        {Array.from({ length: 24 }).map((_, i) => {
          const a = (i * 15 - 90) * (Math.PI / 180);
          const rr = r - 8;
          const cx = r + rr * Math.cos(a);
          const cy = r + rr * Math.sin(a);
          return (
            <circle key={i} cx={cx} cy={cy} r={i % 3 === 0 ? 2 : 1} fill="#F5D061" opacity={i % 3 === 0 ? 0.9 : 0.4} />
          );
        })}
      </svg>
    </div>
  );
}

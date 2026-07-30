import { useEffect, useRef } from "react";

export default function CosmicBackground({ density = 140 }) {
  const starRef = useRef(null);
  const shootRef = useRef(null);

  useEffect(() => {
    const el = starRef.current;
    if (!el) return;
    el.innerHTML = "";
    for (let i = 0; i < density; i++) {
      const s = document.createElement("div");
      s.className = "star";
      const size = Math.random() * 2 + 0.4;
      s.style.width = `${size}px`;
      s.style.height = `${size}px`;
      s.style.left = `${Math.random() * 100}%`;
      s.style.top = `${Math.random() * 100}%`;
      s.style.setProperty("--dur", `${2 + Math.random() * 5}s`);
      s.style.animationDelay = `${Math.random() * 5}s`;
      if (Math.random() > 0.9) {
        s.style.background = "#F5D061";
        s.style.boxShadow = "0 0 6px 1px rgba(245, 208, 97, 0.5)";
      }
      el.appendChild(s);
    }
  }, [density]);

  useEffect(() => {
    const layer = shootRef.current;
    if (!layer) return;
    let cancelled = false;
    const spawn = () => {
      if (cancelled) return;
      const s = document.createElement("div");
      s.className = "shooting-star";
      s.style.top = `${Math.random() * 60}%`;
      s.style.left = `${Math.random() * 40 + 60}%`;
      s.style.animationDuration = `${2 + Math.random() * 1.5}s`;
      layer.appendChild(s);
      setTimeout(() => s.remove(), 4000);
      const next = 8000 + Math.random() * 12000;
      setTimeout(spawn, next);
    };
    const t = setTimeout(spawn, 4000);
    return () => { cancelled = true; clearTimeout(t); };
  }, []);

  return (
    <>
      <div ref={starRef} className="starfield" aria-hidden="true" />
      <div ref={shootRef} className="shooting-layer" aria-hidden="true" />
      {/* orbit accents */}
      <div className="orbit-accent orbit-1" aria-hidden="true">
        <div className="orbit-body" />
      </div>
      <div className="orbit-accent orbit-2" aria-hidden="true">
        <div className="orbit-body" style={{ background: "#D4AF37" }} />
      </div>
    </>
  );
}

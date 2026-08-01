import { useState, useEffect } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { api, API } from "@/lib/api";
import { toast } from "sonner";
import { Loader2, Compass, Clock, MapPin, User, Download } from "lucide-react";
import React, { useMemo } from "react";

const SIGN_SYMBOL = {
  Aries: "♈", Taurus: "♉", Gemini: "♊", Cancer: "♋", Leo: "♌", Virgo: "♍",
  Libra: "♎", Scorpio: "♏", Sagittarius: "♐", Capricorn: "♑", Aquarius: "♒", Pisces: "♓",
};
 
function renderMarkdown(text = "") {
  const html = text
    .replace(/^## (.*)$/gm, '<h2>$1</h2>')
    .replace(/^# (.*)$/gm, '<h2>$1</h2>')
    .replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>')
    .split(/\n{2,}/).map(p => p.startsWith("<h2>") ? p : `<p>${p.replace(/\n/g,"<br/>")}</p>`).join("");
  return { __html: html };
}


const SIZE = 400;
const BORDER = 20;
const EDGE_GAP = 4;
const LABEL_GAP = 3;
const PLANET_FONT_SIZE = 10;
const HOUSE_FONT_SIZE = 10;
const LAGNA_BOX = { x: 156, y: 171, width: 88, height: 38 };

const RASHI_NUMBERS = {
  mesha: 1,
  aries: 1,
  vrishabha: 2,
  vrishabh: 2,
  taurus: 2,
  mithuna: 3,
  mithun: 3,
  gemini: 3,
  karka: 4,
  kark: 4,
  cancer: 4,
  simha: 5,
  leo: 5,
  kanya: 6,
  virgo: 6,
  tula: 7,
  libra: 7,
  vrishchika: 8,
  vrischika: 8,
  scorpio: 8,
  dhanu: 9,
  sagittarius: 9,
  makara: 10,
  capricorn: 10,
  kumbha: 11,
  aquarius: 11,
  meena: 12,
  pisces: 12,
};

const PLANET_ABBREVIATIONS = {
  sun: "Su",
  surya: "Su",
  moon: "Mo",
  chandra: "Mo",
  mars: "Ma",
  mangal: "Ma",
  kuja: "Ma",
  mercury: "Me",
  budha: "Me",
  jupiter: "Ju",
  guru: "Ju",
  brihaspati: "Ju",
  venus: "Ve",
  shukra: "Ve",
  saturn: "Sa",
  shani: "Sa",
  rahu: "Ra",
  ketu: "Ke",
  pluto: "Pl",
  uranus: "Ur",
  neptune: "Ne",
  ascendant: "As",
  lagna: "As",
};

const HOUSES = {
  1: {
    polygon: [
      [200, 20],
      [290, 110],
      [200, 200],
      [110, 110],
    ],
    type: "diamond",
  },
  2: {
    polygon: [
      [20, 20],
      [200, 20],
      [110, 110],
    ],
    type: "triangle",
    inner: [110, 110],
  },
  3: {
    polygon: [
      [20, 20],
      [110, 110],
      [20, 200],
    ],
    type: "triangle",
    inner: [110, 110],
  },
  4: {
    polygon: [
      [20, 200],
      [110, 110],
      [200, 200],
      [110, 290],
    ],
    type: "diamond",
  },
  5: {
    polygon: [
      [20, 200],
      [110, 290],
      [20, 380],
    ],
    type: "triangle",
    inner: [110, 290],
  },
  6: {
    polygon: [
      [20, 380],
      [200, 380],
      [110, 290],
    ],
    type: "triangle",
    inner: [110, 290],
  },
  7: {
    polygon: [
      [110, 290],
      [200, 200],
      [290, 290],
      [200, 380],
    ],
    type: "diamond",
  },
  8: {
    polygon: [
      [200, 380],
      [380, 380],
      [290, 290],
    ],
    type: "triangle",
    inner: [290, 290],
  },
  9: {
    polygon: [
      [380, 200],
      [380, 380],
      [290, 290],
    ],
    type: "triangle",
    inner: [290, 290],
  },
  10: {
    polygon: [
      [380, 200],
      [290, 110],
      [200, 200],
      [290, 290],
    ],
    type: "diamond",
  },
  11: {
    polygon: [
      [380, 20],
      [380, 200],
      [290, 110],
    ],
    type: "triangle",
    inner: [290, 110],
  },
  12: {
    polygon: [
      [200, 20],
      [380, 20],
      [290, 110],
    ],
    type: "triangle",
    inner: [290, 110],
  },
};

const NORTH_INDIAN_LINES = `
  M20 20 L110 110 L200 20
  M20 200 L110 110 L200 200 L110 290 L20 200
  M20 380 L110 290 L200 380
  M200 380 L290 290 L380 380
  M380 380 L290 290 L380 200
  M380 20 L290 110 L380 200
  M200 20 L290 110 L200 200
  M200 200 L290 290
`;

function normalizeText(value) {
  return String(value ?? "")
    .trim()
    .toLowerCase()
    .replace(/[\s_-]+/g, "");
}

function numberFrom(value) {
  if (typeof value === "number") {
    return Number.isFinite(value) ? value : "";
  }

  const text = String(value ?? "").trim();
  if (!text) return "";

  const direct = Number(text);
  if (Number.isFinite(direct)) return direct;

  const match = text.match(/\d+/);
  return match ? Number(match[0]) : "";
}

function getRashiNumber(value) {
  const numeric = numberFrom(value);
  if (numeric >= 1 && numeric <= 12) return numeric;
  return RASHI_NUMBERS[normalizeText(value)] || "";
}

function getPlanetAbbreviation(value) {
  let source = value;

  if (value && typeof value === "object") {
    source =
      value.abbreviation ??
      value.abbr ??
      value.shortName ??
      value.name ??
      value.planet ??
      value.graha ??
      value.body ??
      "";
  }

  const text = String(source ?? "").trim();
  if (!text) return "";

  const normalized = normalizeText(text);
  if (PLANET_ABBREVIATIONS[normalized]) {
    return PLANET_ABBREVIATIONS[normalized];
  }

  const explicit = text.match(/\(([A-Za-z]{1,3})\)/);
  if (explicit) return explicit[1];

  return text.slice(0, 2);
}

function getHouseNumber(value, fallback) {
  if (!value || typeof value !== "object") return fallback;

  const possibleValues = [
    value.house,
    value.houseNumber,
    value.house_number,
    value.houseNo,
    value.house_no,
    value.bhava,
    value.bhavaNumber,
    value.number,
  ];

  for (const item of possibleValues) {
    const number = numberFrom(item);
    if (number >= 1 && number <= 12) return number;
  }

  return fallback;
}

function getHouseSign(house) {
  return (
    house?.sign ??
    house?.rashi ??
    house?.signNumber ??
    house?.sign_number ??
    house?.rashiNumber ??
    house?.rashi_number ??
    house?.signNo ??
    house?.rashiNo ??
    ""
  );
}

function getHousePlanets(house) {
  const value =
    house?.planets ??
    house?.planet ??
    house?.grahas ??
    house?.occupants ??
    house?.bodies ??
    house?.planetNames ??
    house?.planet_names ??
    house?.planetaryPositions ??
    [];

  if (Array.isArray(value)) {
    return value.map(getPlanetAbbreviation).filter(Boolean);
  }

  if (typeof value === "string") {
    return value
      .split(/[,\s]+/)
      .map(getPlanetAbbreviation)
      .filter(Boolean);
  }

  if (value && typeof value === "object") {
    return Object.values(value)
      .map(getPlanetAbbreviation)
      .filter(Boolean);
  }

  return [];
}

function normalizeHouses(data) {
  const source =
    data?.houses ??
    data?.chart?.houses ??
    data?.birthChart?.houses ??
    [];

  const result = [];

  if (Array.isArray(source)) {
    source.forEach((house, index) => {
      const number = getHouseNumber(house, index + 1);
      if (number >= 1 && number <= 12) {
        result.push({ ...house, house: number });
      }
    });
  } else if (source && typeof source === "object") {
    Object.entries(source).forEach(([key, value]) => {
      const fallback = numberFrom(key);
      const house = value && typeof value === "object" ? value : { sign: value };
      const number = getHouseNumber(house, fallback);

      if (number >= 1 && number <= 12) {
        result.push({ ...house, house: number });
      }
    });
  }

  return result;
}

function centerOf(polygon) {
  const total = polygon.reduce(
    (result, [x, y]) => ({
      x: result.x + x,
      y: result.y + y,
    }),
    { x: 0, y: 0 }
  );

  return {
    x: total.x / polygon.length,
    y: total.y / polygon.length,
  };
}

function interpolate(a, b, amount) {
  return {
    x: a.x + (b.x - a.x) * amount,
    y: a.y + (b.y - a.y) * amount,
  };
}

function pointInside(point, polygon) {
  let inside = false;

  for (let index = 0, previous = polygon.length - 1; index < polygon.length; previous = index++) {
    const [xi, yi] = polygon[index];
    const [xj, yj] = polygon[previous];

    const intersects =
      yi > point.y !== yj > point.y &&
      point.x < ((xj - xi) * (point.y - yi)) / (yj - yi) + xi;

    if (intersects) inside = !inside;
  }

  return inside;
}

function horizontalSpan(y, polygon) {
  const intersections = [];

  for (let index = 0; index < polygon.length; index += 1) {
    const [x1, y1] = polygon[index];
    const [x2, y2] = polygon[(index + 1) % polygon.length];

    if ((y1 <= y && y < y2) || (y2 <= y && y < y1)) {
      const x = x1 + ((y - y1) * (x2 - x1)) / (y2 - y1);
      intersections.push(x);
    }
  }

  if (intersections.length < 2) return null;

  return {
    left: Math.min(...intersections),
    right: Math.max(...intersections),
  };
}

function textWidth(text, fontSize) {
  return Math.max(fontSize * 1.5, String(text).length * fontSize * 0.63);
}

function rectanglesOverlap(first, second, gap = 0) {
  return !(
    first.x + first.width + gap <= second.x ||
    second.x + second.width + gap <= first.x ||
    first.y + first.height + gap <= second.y ||
    second.y + second.height + gap <= first.y
  );
}

function rectangleInsidePolygon(rectangle, polygon) {
  const expanded = {
    x: rectangle.x - EDGE_GAP,
    y: rectangle.y - EDGE_GAP,
    width: rectangle.width + EDGE_GAP * 2,
    height: rectangle.height + EDGE_GAP * 2,
  };

  const corners = [
    { x: expanded.x, y: expanded.y },
    { x: expanded.x + expanded.width, y: expanded.y },
    { x: expanded.x, y: expanded.y + expanded.height },
    {
      x: expanded.x + expanded.width,
      y: expanded.y + expanded.height,
    },
  ];

  return corners.every((corner) => pointInside(corner, polygon));
}

function createTextPlacement(text, x, y, fontSize, polygon) {
  const width = textWidth(text, fontSize);
  const height = fontSize * 1.35;

  const spans = [
    horizontalSpan(y - height / 2, polygon),
    horizontalSpan(y, polygon),
    horizontalSpan(y + height / 2, polygon),
  ];

  if (spans.some((span) => !span)) return null;

  const left = Math.max(...spans.map((span) => span.left));
  const right = Math.min(...spans.map((span) => span.right));
  const minimumWidth = width + EDGE_GAP * 2;

  if (right - left < minimumWidth) return null;

  const safeX = Math.min(
    right - width / 2 - EDGE_GAP,
    Math.max(left + width / 2 + EDGE_GAP, x)
  );

  const rectangle = {
    x: safeX - width / 2,
    y: y - height / 2,
    width,
    height,
  };

  if (!rectangleInsidePolygon(rectangle, polygon)) return null;

  return {
    text,
    x: safeX,
    y,
    fontSize,
    rectangle,
  };
}

function isPlacementAvailable(placement, occupied) {
  if (!placement) return false;

  if (
    placement.rectangle &&
    rectanglesOverlap(placement.rectangle, LAGNA_BOX, LABEL_GAP)
  ) {
    return false;
  }

  return occupied.every(
    (item) =>
      !rectanglesOverlap(placement.rectangle, item.rectangle, LABEL_GAP)
  );
}

function labelAnchors(layout) {
  const center = centerOf(layout.polygon);

  if (layout.type === "diamond") {
    const amounts = [0.62, 0.52, 0.42, 0.32];

    return amounts.flatMap((amount, index) => {
      const target = interpolate(center, { x: 200, y: 200 }, amount);
      const offset = index % 2 === 0 ? 8 : -8;

      return [
        { x: target.x + offset, y: target.y - 15 },
        { x: target.x - offset, y: target.y - 15 },
        { x: target.x + offset, y: target.y + 15 },
        { x: target.x - offset, y: target.y + 15 },
      ];
    });
  }

  const centerTarget = layout.inner;
  const amounts = [0.72, 0.62, 0.52, 0.42];

  return amounts.flatMap((amount, index) => {
    const target = interpolate(center, {
      x: centerTarget[0],
      y: centerTarget[1],
    }, amount);

    const offset = index % 2 === 0 ? 7 : -7;

    return [
      { x: target.x + offset, y: target.y - 14 },
      { x: target.x - offset, y: target.y - 14 },
      { x: target.x + offset, y: target.y + 14 },
      { x: target.x - offset, y: target.y + 14 },
    ];
  });
}

function placeHouseLabels(number, layout, signNumber, occupied) {
  const anchors = labelAnchors(layout);

  for (const anchor of anchors) {
    const houseLabel = createTextPlacement(
      `H${number}`,
      anchor.x,
      anchor.y,
      HOUSE_FONT_SIZE,
      layout.polygon
    );

    if (!isPlacementAvailable(houseLabel, occupied)) continue;

    if (signNumber === "") {
      return {
        labels: [houseLabel],
        occupied: [...occupied, houseLabel],
        rashiFontSize: null,
      };
    }

    const rashiSizes = [20, 18, 16, 14, 12, 10, 8];

    for (const rashiFontSize of rashiSizes) {
      const rashiLabel = createTextPlacement(
        String(signNumber),
        anchor.x,
        anchor.y + 30,
        rashiFontSize,
        layout.polygon
      );

      if (!isPlacementAvailable(rashiLabel, [...occupied, houseLabel])) {
        continue;
      }

      return {
        labels: [houseLabel, rashiLabel],
        occupied: [...occupied, houseLabel, rashiLabel],
        rashiFontSize,
      };
    }
  }

  return null;
}

function planetRows(planets, layout) {
  if (layout.type === "triangle") {
    return planets.map((planet) => [planet]);
  }

  return [planets];
}

function placePlanets(planets, layout, occupied) {
  if (!planets.length) {
    return { labels: [], unresolved: [], occupied };
  }

  const rows = planetRows(planets, layout);
  const polygonCenter = centerOf(layout.polygon);
  const candidates = [];

  for (let y = 28; y <= 372; y += 4) {
    for (let x = 28; x <= 372; x += 4) {
      candidates.push({
        x,
        y,
        distance:
          Math.abs(x - polygonCenter.x) +
          Math.abs(y - polygonCenter.y),
      });
    }
  }

  candidates.sort((a, b) => a.distance - b.distance);

  for (const candidate of candidates) {
    const labels = [];
    let valid = true;

    rows.forEach((row, rowIndex) => {
      const text = row.join(" ");
      const placement = createTextPlacement(
        text,
        candidate.x,
        candidate.y + rowIndex * 14,
        PLANET_FONT_SIZE,
        layout.polygon
      );

      if (!isPlacementAvailable(placement, [...occupied, ...labels])) {
        valid = false;
      } else if (placement) {
        labels.push(placement);
      }
    });

    if (valid && labels.length === rows.length) {
      return {
        labels,
        unresolved: [],
        occupied: [...occupied, ...labels],
      };
    }
  }

  return {
    labels: [],
    unresolved: planets,
    occupied,
  };
}

function renderText(placement, color, weight = 500, family = "monospace") {
  return (
    <text
      key={`${placement.text}-${placement.x}-${placement.y}`}
      x={placement.x}
      y={placement.y}
      textAnchor="middle"
      dominantBaseline="middle"
      fill={color}
      fontSize={placement.fontSize}
      fontFamily={family}
      fontWeight={weight}
      pointerEvents="none"
    >
      {placement.text}
    </text>
  );
}

export default function ChartVisual({ data }) {
  const { elements, overflow } = useMemo(() => {
    const houses = normalizeHouses(data);
    const houseByNumber = new Map(
      houses.map((house) => [Number(house.house), house])
    );

    const nextElements = [];
    const unresolved = [];
    let occupied = [];

    Object.entries(HOUSES).forEach(([key, layout]) => {
      const number = Number(key);
      const house = houseByNumber.get(number);
      const signNumber = house ? getRashiNumber(getHouseSign(house)) : "";
      const planets = house ? getHousePlanets(house) : [];

      const placedLabels = placeHouseLabels(
        number,
        layout,
        signNumber,
        occupied
      );

      if (!placedLabels) {
        unresolved.push({
          house: number,
          text: `H${number}${signNumber !== "" ? ` / Rashi ${signNumber}` : ""}`,
        });

        if (planets.length) {
          unresolved.push({
            house: number,
            text: `Planets: ${planets.join(", ")}`,
          });
        }

        return;
      }

      occupied = placedLabels.occupied;

      placedLabels.labels.forEach((label) => {
        nextElements.push({
          type: label.text.startsWith("H") ? "house" : "rashi",
          label,
        });
      });

      const planetResult = placePlanets(planets, layout, occupied);
      occupied = planetResult.occupied;

      planetResult.labels.forEach((label) => {
        nextElements.push({
          type: "planet",
          label,
        });
      });

      if (planetResult.unresolved.length) {
        unresolved.push({
          house: number,
          text: `Planets: ${planetResult.unresolved.join(", ")}`,
        });
      }
    });

    return {
      elements: nextElements,
      overflow: unresolved,
    };
  }, [data]);

  return (
    <div className="mx-auto w-full max-w-md">
      <svg
        viewBox="0 0 400 400"
        className="h-auto w-full rounded-xl"
        role="img"
        aria-label="North Indian Vedic birth chart"
      >
        <rect
          x="20"
          y="20"
          width="360"
          height="360"
          fill="#0b0922"
        />

        <rect
          x="20"
          y="20"
          width="360"
          height="360"
          fill="none"
          stroke="#c69200"
          strokeWidth="2"
          vectorEffect="non-scaling-stroke"
        />

        <path
          d={NORTH_INDIAN_LINES}
          fill="none"
          stroke="#c69200"
          strokeWidth="2"
          strokeLinecap="butt"
          strokeLinejoin="miter"
          vectorEffect="non-scaling-stroke"
        />

        {elements.map((item) => {
          const { label } = item;

          if (item.type === "house") {
            return renderText(label, "#d6a900", 500);
          }

          if (item.type === "rashi") {
            return renderText(label, "#ffd84d", 700, "sans-serif");
          }

          return renderText(label, "#e2e8f0", 500);
        })}

        <text
          x="200"
          y="184"
          textAnchor="middle"
          dominantBaseline="middle"
          fill="#c69200"
          fontSize="10"
          fontFamily="sans-serif"
          fontStyle="italic"
          pointerEvents="none"
        >
          Lagna
        </text>

        <circle
          cx="200"
          cy="200"
          r="4"
          fill="#fbbf24"
          stroke="#78350f"
          strokeWidth="1"
        />
      </svg>

      {overflow.length > 0 && (
        <div className="mt-3 rounded-lg border border-amber-300/40 bg-amber-50 p-3 text-sm text-amber-950">
          <div className="font-semibold">
            Content moved outside the chart to prevent collisions
          </div>

          <ul className="mt-2 list-disc space-y-1 pl-5">
            {overflow.map((item, index) => (
              <li key={`${item.house}-${item.text}-${index}`}>
                House {item.house}: {item.text}
              </li>
            ))}
          </ul>
        </div>
      )}
    </div>
  );
}

function PlanetsTable({ planets }) {
  return (
    <div className="overflow-x-auto rounded-xl border border-white/10">
      <table className="w-full text-sm">
        <thead className="bg-amber-500/10 text-amber-300 text-xs uppercase tracking-wider">
          <tr>
            <th className="px-3 py-2 text-left">Planet</th>
            <th className="px-3 py-2 text-left">Sign</th>
            <th className="px-3 py-2 text-left">Deg</th>
            <th className="px-3 py-2 text-left">House</th>
            <th className="px-3 py-2 text-left">Nakshatra</th>
            <th className="px-3 py-2 text-left">Pada</th>
          </tr>
        </thead>
        <tbody className="text-slate-200">
          {planets.map(p => (
            <tr key={p.name} className="border-t border-white/5 hover:bg-white/5">
              <td className="px-3 py-2 font-medium">
                {p.name}{p.retrograde && <span className="text-red-400 ml-1">℞</span>}
              </td>
              <td className="px-3 py-2">{SIGN_SYMBOL[p.sign]} {p.sign}</td>
              <td className="px-3 py-2 font-mono text-xs">{p.degrees}°</td>
              <td className="px-3 py-2 text-gold">H{p.house}</td>
              <td className="px-3 py-2">{p.nakshatra}</td>
              <td className="px-3 py-2">{p.pada}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

export default function BirthChart() {
  const [form, setForm] = useState({ name: "", date_of_birth: "", time_of_birth: "", place_of_birth: "" });
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState(null);
  const [history, setHistory] = useState([]);

  const loadHistory = () => api.get("/birth-chart/history").then(r => setHistory(r.data.items || [])).catch(() => {});
  useEffect(() => { loadHistory(); }, []);

  const downloadPdf = async (chartId) => {
    try {
      const token = localStorage.getItem("aa_token");
      const res = await fetch(`${API}/birth-chart/${chartId}/pdf`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (!res.ok) throw new Error("failed");
      const blob = await res.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `kundali-${chartId.slice(0, 8)}.pdf`;
      document.body.appendChild(a);
      a.click();
      a.remove();
      window.URL.revokeObjectURL(url);
    } catch {
      toast.error("Could not download PDF");
    }
  };

  const submit = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
      const r = await api.post("/birth-chart", form);
      setResult(r.data);
      loadHistory();
      toast.success("Chart cast. Read below.");
    } catch (err) {
      toast.error(err.response?.data?.detail || "Could not generate chart");
    } finally {
      setLoading(false);
    }
  };

  const cdata = result?.chart_data;

  return (
    <div className="max-w-6xl mx-auto px-6 py-16">
      <p className="text-xs uppercase tracking-[0.3em] font-mono text-amber-500/80 mb-3">Kundali</p>
      <h1 className="text-4xl md:text-5xl font-serif-display font-light text-white tracking-tight mb-3">
        Your Vedic <span className="text-gold italic">birth chart</span>.
      </h1>
      <p className="text-sm text-slate-500 mb-10">
        Calculated with the Swiss Ephemeris • Lahiri Ayanamsa • Whole Sign houses.
      </p>

      <div className="grid md:grid-cols-2 gap-8">
        <Card className="glass border-white/10 h-fit">
          <CardContent className="p-8">
            <div className="flex items-center gap-2 mb-6">
              <Compass className="w-5 h-5 text-gold" />
              <h2 className="text-xl font-serif-display text-white">Enter birth details</h2>
            </div>
            <form onSubmit={submit} className="space-y-5">
              <div>
                <Label className="text-slate-300"><User className="w-3 h-3 inline mr-1" /> Native's name</Label>
                <Input data-testid="chart-name" value={form.name} onChange={e => setForm({ ...form, name: e.target.value })} className="bg-black/40 border-white/10 mt-2" placeholder="e.g. Meera" />
              </div>
              <div>
                <Label className="text-slate-300">Date of birth</Label>
                <Input data-testid="chart-dob" type="date" required value={form.date_of_birth} onChange={e => setForm({ ...form, date_of_birth: e.target.value })} className="bg-black/40 border-white/10 mt-2" />
              </div>
              <div>
                <Label className="text-slate-300"><Clock className="w-3 h-3 inline mr-1" /> Time of birth</Label>
                <Input data-testid="chart-tob" type="time" required value={form.time_of_birth} onChange={e => setForm({ ...form, time_of_birth: e.target.value })} className="bg-black/40 border-white/10 mt-2" />
                <p className="text-[11px] text-slate-500 mt-1">Local time at place of birth. Accuracy matters — even 5 minutes can shift the Lagna.</p>
              </div>
              <div>
                <Label className="text-slate-300"><MapPin className="w-3 h-3 inline mr-1" /> Place of birth</Label>
                <Input data-testid="chart-pob" required value={form.place_of_birth} onChange={e => setForm({ ...form, place_of_birth: e.target.value })} className="bg-black/40 border-white/10 mt-2" placeholder="City, Country" />
              </div>
              <Button data-testid="chart-submit" type="submit" disabled={loading} className="w-full bg-gold text-black hover:bg-amber-300 rounded-full py-6 gold-glow">
                {loading ? <><Loader2 className="w-4 h-4 mr-2 animate-spin" /> Casting the chart…</> : "Generate Kundali"}
              </Button>
            </form>
          </CardContent>
        </Card>

        <div className="space-y-6">
          {!result && !loading && (
            <Card className="glass border-white/10 min-h-[500px]">
              <CardContent className="p-8 h-full">
                <div className="text-center text-slate-500 h-full flex flex-col items-center justify-center py-20">
                  <div className="w-24 h-24 rounded-full border border-amber-400/30 flex items-center justify-center mb-6">
                    <Compass className="w-10 h-10 text-gold" strokeWidth={1} />
                  </div>
                  <p className="font-serif-display text-xl text-slate-300">Your reading appears here</p>
                  <p className="text-sm mt-2">Fill your birth details to begin.</p>
                </div>
              </CardContent>
            </Card>
          )}

          {loading && (
            <Card className="glass border-white/10 min-h-[500px]">
              <CardContent className="p-8 h-full flex flex-col items-center justify-center py-20 text-slate-400">
                <Loader2 className="w-8 h-8 text-gold animate-spin mb-4" />
                <p>Casting your Kundali with Swiss Ephemeris…</p>
                <p className="text-xs text-slate-500 mt-1">Geocoding place, computing planetary positions…</p>
              </CardContent>
            </Card>
          )}

          {result && cdata && (
            <>
              <Card className="glass border-amber-400/20 relative overflow-hidden">
                <CardContent className="p-6">
                  <div className="flex items-start justify-between gap-3 flex-wrap mb-4">
                    <div>
                      <p className="text-xs uppercase tracking-[0.3em] font-mono text-amber-500/80">
                        {result.name || "Seeker"} • {result.date_of_birth} {result.time_of_birth}
                      </p>
                      <p className="text-xs text-slate-500 mt-0.5">{result.place_of_birth} • {cdata.birth_details.timezone}</p>
                    </div>
                   {false && (
                    <Button
                      data-testid="chart-pdf-download"
                      size="sm"
                      onClick={() => downloadPdf(result.id)}
                      className="bg-gold text-black hover:bg-amber-300 rounded-full text-xs"
                    >
                      <Download className="w-3 h-3 mr-1" /> Download PDF
                    </Button>
              )}
                  </div>

                  <div className="grid grid-cols-3 gap-3 mb-6">
                    <div className="bg-black/40 rounded-xl p-3 border border-white/5">
                      <p className="text-[10px] uppercase tracking-widest text-amber-500/70">Lagna</p>
                      <p className="font-serif-display text-lg text-white mt-1" data-testid="chart-lagna">
                        {SIGN_SYMBOL[cdata.ascendant.sign]} {cdata.ascendant.sign}
                      </p>
                      <p className="text-[11px] text-slate-500">{cdata.ascendant.degrees}° · {cdata.ascendant.nakshatra}</p>
                    </div>
                    <div className="bg-black/40 rounded-xl p-3 border border-white/5">
                      <p className="text-[10px] uppercase tracking-widest text-amber-500/70">Moon</p>
                      <p className="font-serif-display text-lg text-white mt-1" data-testid="chart-moon">
                        {SIGN_SYMBOL[cdata.moon_sign]} {cdata.moon_sign}
                      </p>
                      <p className="text-[11px] text-slate-500">{cdata.moon_nakshatra}</p>
                    </div>
                    <div className="bg-black/40 rounded-xl p-3 border border-white/5">
                      <p className="text-[10px] uppercase tracking-widest text-amber-500/70">Sun</p>
                      <p className="font-serif-display text-lg text-white mt-1" data-testid="chart-sun">
                        {SIGN_SYMBOL[cdata.sun_sign]} {cdata.sun_sign}
                      </p>
                      <p className="text-[11px] text-slate-500">Sidereal</p>
                    </div>
                  </div>

                  {cdata.current_mahadasha && (
                    <div className="bg-gradient-to-br from-amber-500/10 to-transparent rounded-xl p-4 border border-amber-400/20 mb-6">
                      <div className="flex flex-wrap gap-6">
                        <div className="flex-1 min-w-[180px]">
                          <p className="text-[10px] uppercase tracking-widest text-amber-500/70">Mahadasha</p>
                          <p className="font-serif-display text-xl text-gold mt-1" data-testid="chart-dasha">{cdata.current_mahadasha.lord}</p>
                          <p className="text-xs text-slate-400 mt-1">
                            {cdata.current_mahadasha.start} → {cdata.current_mahadasha.end} · {cdata.current_mahadasha.years} yrs
                          </p>
                        </div>
                        {cdata.current_antardasha && (
                          <div className="flex-1 min-w-[180px] border-l border-white/10 pl-6">
                            <p className="text-[10px] uppercase tracking-widest text-amber-500/70">Antardasha</p>
                            <p className="font-serif-display text-xl text-white mt-1" data-testid="chart-antardasha">
                              {cdata.current_mahadasha.lord}–{cdata.current_antardasha.lord}
                            </p>
                            <p className="text-xs text-slate-400 mt-1">
                              {cdata.current_antardasha.start} → {cdata.current_antardasha.end}
                            </p>
                          </div>
                        )}
                      </div>
                    </div>
                  )}

                  <ChartVisual data={cdata} />
                </CardContent>
              </Card>

              {cdata.navamsa && (
                <Card className="glass border-white/10">
                  <CardContent className="p-6">
                    <div className="flex items-center justify-between flex-wrap mb-3">
                      <h3 className="text-lg font-serif-display text-white">Navamsa (D9) Chart</h3>
                      <p className="text-[11px] text-slate-500">D9 Lagna: <span className="text-gold">{cdata.navamsa.ascendant_sign}</span></p>
                    </div>
                    <p className="text-xs text-slate-500 mb-4">
                      The divisional chart for marriage, dharma and the inner soul. Read alongside the D1.
                    </p>
                    <ChartVisual data={cdata.navamsa} />
                  </CardContent>
                </Card>
              )}

              <Card className="glass border-white/10">
                <CardContent className="p-6">
                  <h3 className="text-lg font-serif-display text-white mb-4">Planetary Positions</h3>
                  <PlanetsTable planets={cdata.planets} />
                </CardContent>
              </Card>

              <Card className="glass border-white/10">
                <CardContent className="p-6">
                  <h3 className="text-lg font-serif-display text-white mb-4">Acharya's Interpretation</h3>
                  <div data-testid="chart-reading" className="reading-prose" dangerouslySetInnerHTML={renderMarkdown(result.reading)} />
                </CardContent>
              </Card>
            </>
          )}
        </div>
      </div>

      {history.length > 0 && (
        <div className="mt-16">
          <h3 className="text-xl font-serif-display text-white mb-6">Your saved charts</h3>
          <div className="grid md:grid-cols-3 gap-4">
            {history.map(h => (
              <button
                key={h.id}
                data-testid={`history-${h.id}`}
                onClick={() => setResult(h)}
                className="text-left p-6 rounded-2xl border border-white/10 bg-card hover:border-amber-400/40 transition"
              >
                <p className="text-gold font-serif-display text-lg">{h.name || "Seeker"}</p>
                <p className="text-xs text-slate-400 mt-1">{h.date_of_birth} • {h.place_of_birth}</p>
                <p className="text-xs text-slate-500 mt-3">
                  {h.ascendant?.sign ? `Lagna ${h.ascendant.sign}` : `Sun ${h.sun_sign}`}
                </p>
              </button>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

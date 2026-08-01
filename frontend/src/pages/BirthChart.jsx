import { useState, useEffect } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { api, API } from "@/lib/api";
import { toast } from "sonner";
import { Loader2, Compass, Clock, MapPin, User, Download } from "lucide-react";
import React from "react";

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


const CHART_SIZE = 400;
const BORDER = 20;
const PLANET_FONT_SIZE = 10;
const RASHI_FONT_SIZES = [20, 18, 16, 14, 12];

const HOUSE_LAYOUTS = {
  1: {
    points: "200,20 290,110 200,200 110,110",
    headerCandidates: [
      { x: 200, houseY: 94, rashiY: 124 },
      { x: 200, houseY: 88, rashiY: 118 },
    ],
    planetZones: [
      { x: 126, y: 134, width: 148, height: 44, direction: "horizontal" },
    ],
  },
  2: {
    points: "20,20 200,20 110,110",
    headerCandidates: [
      { x: 110, houseY: 48, rashiY: 76 },
      { x: 110, houseY: 44, rashiY: 70 },
    ],
    planetZones: [
      { x: 34, y: 82, width: 152, height: 24, direction: "horizontal" },
      { x: 44, y: 74, width: 132, height: 32, direction: "horizontal" },
    ],
  },
  3: {
    points: "20,20 110,110 20,200",
    headerCandidates: [
      { x: 62, houseY: 82, rashiY: 108 },
      { x: 58, houseY: 78, rashiY: 104 },
    ],
    planetZones: [
      { x: 28, y: 126, width: 48, height: 66, direction: "vertical" },
    ],
  },
  4: {
    points: "20,200 110,110 200,200 110,290",
    headerCandidates: [
      { x: 110, houseY: 166, rashiY: 194 },
      { x: 110, houseY: 160, rashiY: 188 },
    ],
    planetZones: [
      { x: 42, y: 212, width: 136, height: 62, direction: "horizontal" },
    ],
  },
  5: {
    points: "20,200 110,290 20,380",
    headerCandidates: [
      { x: 62, houseY: 272, rashiY: 298 },
      { x: 58, houseY: 268, rashiY: 294 },
    ],
    planetZones: [
      { x: 28, y: 310, width: 48, height: 62, direction: "vertical" },
    ],
  },
  6: {
    points: "20,380 200,380 110,290",
    headerCandidates: [
      { x: 110, houseY: 316, rashiY: 342 },
      { x: 110, houseY: 310, rashiY: 336 },
    ],
    planetZones: [
      { x: 42, y: 350, width: 136, height: 24, direction: "horizontal" },
    ],
  },
  7: {
    points: "110,290 200,200 290,290 200,380",
    headerCandidates: [
      { x: 200, houseY: 286, rashiY: 316 },
      { x: 200, houseY: 280, rashiY: 310 },
    ],
    planetZones: [
      { x: 132, y: 334, width: 136, height: 34, direction: "horizontal" },
    ],
  },
  8: {
    points: "200,380 380,380 290,290",
    headerCandidates: [
      { x: 290, houseY: 316, rashiY: 342 },
      { x: 290, houseY: 310, rashiY: 336 },
    ],
    planetZones: [
      { x: 222, y: 350, width: 136, height: 24, direction: "horizontal" },
    ],
  },
  9: {
    points: "380,200 380,380 290,290",
    headerCandidates: [
      { x: 338, houseY: 272, rashiY: 298 },
      { x: 342, houseY: 268, rashiY: 294 },
    ],
    planetZones: [
      { x: 324, y: 310, width: 48, height: 62, direction: "vertical" },
    ],
  },
  10: {
    points: "380,200 290,110 200,200 290,290",
    headerCandidates: [
      { x: 290, houseY: 166, rashiY: 194 },
      { x: 290, houseY: 160, rashiY: 188 },
    ],
    planetZones: [
      { x: 222, y: 212, width: 136, height: 62, direction: "horizontal" },
    ],
  },
  11: {
    points: "380,20 380,200 290,110",
    headerCandidates: [
      { x: 338, houseY: 82, rashiY: 108 },
      { x: 342, houseY: 78, rashiY: 104 },
    ],
    planetZones: [
      { x: 324, y: 126, width: 48, height: 66, direction: "vertical" },
    ],
  },
  12: {
    points: "200,20 380,20 290,110",
    headerCandidates: [
      { x: 290, houseY: 48, rashiY: 76 },
      { x: 290, houseY: 44, rashiY: 70 },
    ],
    planetZones: [
      { x: 214, y: 82, width: 152, height: 24, direction: "horizontal" },
      { x: 224, y: 74, width: 132, height: 32, direction: "horizontal" },
    ],
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

function normalizeText(value) {
  return String(value ?? "")
    .trim()
    .toLowerCase()
    .replace(/[\s_-]+/g, "");
}

function getNumberFromValue(value) {
  if (typeof value === "number") {
    return Number.isFinite(value) ? value : "";
  }

  const text = String(value ?? "").trim();

  if (!text) {
    return "";
  }

  const directNumber = Number(text);

  if (Number.isFinite(directNumber)) {
    return directNumber;
  }

  const match = text.match(/\d+/);

  return match ? Number(match[0]) : "";
}

function getRashiNumber(value) {
  const numericValue = getNumberFromValue(value);

  if (numericValue >= 1 && numericValue <= 12) {
    return numericValue;
  }

  return RASHI_NUMBERS[normalizeText(value)] || "";
}

function getPlanetAbbreviation(planet) {
  let value = planet;

  if (planet && typeof planet === "object") {
    value =
      planet.abbreviation ??
      planet.abbr ??
      planet.shortName ??
      planet.name ??
      planet.planet ??
      planet.graha ??
      planet.body ??
      "";
  }

  const text = String(value ?? "").trim();

  if (!text) {
    return "";
  }

  const normalized = normalizeText(text);

  if (PLANET_ABBREVIATIONS[normalized]) {
    return PLANET_ABBREVIATIONS[normalized];
  }

  const abbreviationMatch = text.match(/\(([A-Za-z]{1,3})\)/);

  if (abbreviationMatch) {
    return abbreviationMatch[1];
  }

  return text.slice(0, 2);
}

function getHouseNumber(house, fallbackNumber) {
  if (!house || typeof house !== "object") {
    return fallbackNumber;
  }

  const values = [
    house.house,
    house.houseNumber,
    house.house_number,
    house.houseNo,
    house.house_no,
    house.bhava,
    house.bhavaNumber,
    house.number,
  ];

  for (const value of values) {
    const number = getNumberFromValue(value);

    if (number >= 1 && number <= 12) {
      return number;
    }
  }

  return fallbackNumber;
}

function getHousePlanets(house) {
  if (!house || typeof house !== "object") {
    return [];
  }

  const value =
    house.planets ??
    house.planet ??
    house.grahas ??
    house.occupants ??
    house.bodies ??
    house.planetNames ??
    house.planet_names ??
    house.planetaryPositions ??
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
        result.push({
          ...house,
          house: number,
        });
      }
    });

    return result;
  }

  if (source && typeof source === "object") {
    Object.entries(source).forEach(([key, value]) => {
      const fallbackNumber = getNumberFromValue(key);
      const house =
        value && typeof value === "object" ? value : { sign: value };
      const number = getHouseNumber(house, fallbackNumber);

      if (number >= 1 && number <= 12) {
        result.push({
          ...house,
          house: number,
        });
      }
    });
  }

  return result;
}

function getHouseSign(house) {
  if (!house || typeof house !== "object") {
    return "";
  }

  return (
    house.sign ??
    house.rashi ??
    house.signNumber ??
    house.sign_number ??
    house.rashiNumber ??
    house.rashi_number ??
    house.signNo ??
    house.rashiNo ??
    ""
  );
}

function parsePoints(points) {
  return points.split(/\s+/).map((point) => {
    const [x, y] = point.split(",").map(Number);
    return { x, y };
  });
}

function pointInPolygon(point, polygon) {
  let inside = false;

  for (
    let current = 0, previous = polygon.length - 1;
    current < polygon.length;
    previous = current++
  ) {
    const currentPoint = polygon[current];
    const previousPoint = polygon[previous];

    const intersects =
      currentPoint.y > point.y !== previousPoint.y > point.y &&
      point.x <
        ((previousPoint.x - currentPoint.x) *
          (point.y - currentPoint.y)) /
          (previousPoint.y - currentPoint.y) +
          currentPoint.x;

    if (intersects) {
      inside = !inside;
    }
  }

  return inside;
}

function rectInsidePolygon(rect, polygon, padding = 2) {
  const points = [
    { x: rect.x + padding, y: rect.y + padding },
    { x: rect.x + rect.width - padding, y: rect.y + padding },
    {
      x: rect.x + rect.width - padding,
      y: rect.y + rect.height - padding,
    },
    { x: rect.x + padding, y: rect.y + rect.height - padding },
  ];

  return points.every((point) => pointInPolygon(point, polygon));
}

function rectsOverlap(first, second, gap = 1) {
  return !(
    first.x + first.width + gap <= second.x ||
    second.x + second.width + gap <= first.x ||
    first.y + first.height + gap <= second.y ||
    second.y + second.height + gap <= first.y
  );
}

function textWidth(text, fontSize) {
  return Math.max(fontSize * 1.2, String(text).length * fontSize * 0.62);
}

function makeTextRect(x, baselineY, text, fontSize, fontFamily = "monospace") {
  const width = textWidth(text, fontSize);
  const height = fontSize * (fontFamily === "sans-serif" ? 1.15 : 1.1);

  return {
    x: x - width / 2,
    y: baselineY - height * 0.78,
    width,
    height,
  };
}

function createHeader(number, signNumber, layout) {
  if (signNumber === "") {
    return {
      items: [
        {
          type: "house",
          x: layout.headerCandidates[0].x,
          y: layout.headerCandidates[0].houseY,
          fontSize: 10,
        },
      ],
      rects: [],
      rashiFontSize: 20,
    };
  }

  const polygon = parsePoints(layout.points);

  for (const candidate of layout.headerCandidates) {
    for (const rashiFontSize of RASHI_FONT_SIZES) {
      const houseText = `H${number}`;
      const houseRect = makeTextRect(
        candidate.x,
        candidate.houseY,
        houseText,
        10
      );
      const rashiRect = makeTextRect(
        candidate.x,
        candidate.rashiY,
        String(signNumber),
        rashiFontSize,
        "sans-serif"
      );

      const separated =
        !rectsOverlap(houseRect, rashiRect, 2) &&
        rectInsidePolygon(houseRect, polygon, 2) &&
        rectInsidePolygon(rashiRect, polygon, 2);

      if (separated) {
        return {
          items: [
            {
              type: "house",
              x: candidate.x,
              y: candidate.houseY,
              fontSize: 10,
            },
            {
              type: "rashi",
              x: candidate.x,
              y: candidate.rashiY,
              fontSize: rashiFontSize,
            },
          ],
          rects: [houseRect, rashiRect],
          rashiFontSize,
        };
      }
    }
  }

  return {
    items: [],
    rects: [],
    rashiFontSize: 12,
  };
}

function getPackedRows(planets, box, fontSize) {
  const gap = 3;
  const rows = [];
  let row = [];
  let rowWidth = 0;
  const availableWidth = box.width - 4;

  planets.forEach((planet) => {
    const width = textWidth(planet, fontSize);
    const requiredWidth = rowWidth + (row.length ? gap : 0) + width;

    if (row.length && requiredWidth > availableWidth) {
      rows.push(row);
      row = [planet];
      rowWidth = width;
    } else {
      row.push(planet);
      rowWidth = requiredWidth;
    }
  });

  if (row.length) {
    rows.push(row);
  }

  return { rows, gap };
}

function createHorizontalPlanetItems(planets, box, polygon, blockedRects) {
  const packing = getPackedRows(planets, box, PLANET_FONT_SIZE);
  const lineHeight = PLANET_FONT_SIZE + 2;
  const totalHeight = packing.rows.length * lineHeight;
  const firstY = box.y + (box.height - totalHeight) / 2 + lineHeight / 2;
  const items = [];
  const rects = [...blockedRects];

  packing.rows.forEach((row, rowIndex) => {
    const rowWidth = row.reduce(
      (total, planet, index) =>
        total +
        textWidth(planet, PLANET_FONT_SIZE) +
        (index ? packing.gap : 0),
      0
    );

    let currentX = box.x + box.width / 2 - rowWidth / 2;

    row.forEach((planet) => {
      const width = textWidth(planet, PLANET_FONT_SIZE);
      const centerX = currentX + width / 2;
      const baselineY = firstY + rowIndex * lineHeight;
      const rect = makeTextRect(
        centerX,
        baselineY,
        planet,
        PLANET_FONT_SIZE
      );

      const valid =
        rectInsidePolygon(rect, polygon, 2) &&
        rects.every((existing) => !rectsOverlap(rect, existing, 1));

      if (valid) {
        items.push({
          type: "planet",
          text: planet,
          x: centerX,
          y: baselineY,
          fontSize: PLANET_FONT_SIZE,
        });
        rects.push(rect);
      }

      currentX += width + packing.gap;
    });
  });

  return items.length === planets.length ? { items, rects } : null;
}

function createVerticalPlanetItems(planets, box, polygon, blockedRects) {
  const lineHeight = PLANET_FONT_SIZE + 2;
  const totalHeight = planets.length * lineHeight;
  const firstY = box.y + (box.height - totalHeight) / 2 + lineHeight / 2;
  const centerX = box.x + box.width / 2;
  const items = [];
  const rects = [...blockedRects];

  planets.forEach((planet, index) => {
    const baselineY = firstY + index * lineHeight;
    const rect = makeTextRect(
      centerX,
      baselineY,
      planet,
      PLANET_FONT_SIZE
    );

    const valid =
      rectInsidePolygon(rect, polygon, 2) &&
      rects.every((existing) => !rectsOverlap(rect, existing, 1));

    if (valid) {
      items.push({
        type: "planet",
        text: planet,
        x: centerX,
        y: baselineY,
        fontSize: PLANET_FONT_SIZE,
      });
      rects.push(rect);
    }
  });

  return items.length === planets.length ? { items, rects } : null;
}

function createPlanetItems(planets, layout, headerRects) {
  if (!planets.length) {
    return [];
  }

  const polygon = parsePoints(layout.points);

  for (const zone of layout.planetZones) {
    const result =
      zone.direction === "vertical"
        ? createVerticalPlanetItems(
            planets,
            zone,
            polygon,
            headerRects
          )
        : createHorizontalPlanetItems(
            planets,
            zone,
            polygon,
            headerRects
          );

    if (result) {
      return result.items;
    }
  }

  return [];
}

function ChartVisual({ data }) {
  const houses = normalizeHouses(data);
  const houseByNumber = new Map(
    houses.map((house) => [Number(house.house), house])
  );

  return (
    <div className="relative mx-auto aspect-square w-full max-w-md">
      <svg
        viewBox={`0 0 ${CHART_SIZE} ${CHART_SIZE}`}
        className="h-full w-full rounded-xl"
        role="img"
        aria-label="North Indian Vedic birth chart"
        overflow="hidden"
      >
        <rect
          x={BORDER}
          y={BORDER}
          width={CHART_SIZE - BORDER * 2}
          height={CHART_SIZE - BORDER * 2}
          fill="rgba(0,0,0,0.4)"
        />

        <rect
          x={BORDER}
          y={BORDER}
          width={CHART_SIZE - BORDER * 2}
          height={CHART_SIZE - BORDER * 2}
          fill="none"
          stroke="rgba(251,191,36,0.7)"
          strokeWidth="2"
          vectorEffect="non-scaling-stroke"
        />

        <path
          d={NORTH_INDIAN_LINES}
          fill="none"
          stroke="rgba(251,191,36,0.7)"
          strokeWidth="2"
          strokeLinecap="butt"
          strokeLinejoin="miter"
          vectorEffect="non-scaling-stroke"
        />

        {Object.entries(HOUSE_LAYOUTS).map(([houseKey, layout]) => {
          const houseNumber = Number(houseKey);
          const house = houseByNumber.get(houseNumber);
          const signNumber = house
            ? getRashiNumber(getHouseSign(house))
            : "";
          const planets = house ? getHousePlanets(house) : [];
          const header = createHeader(
            houseNumber,
            signNumber,
            layout
          );
          const planetItems = createPlanetItems(
            planets,
            layout,
            header.rects
          );

          return (
            <g key={`house-${houseNumber}`}>
              {header.items.map((item, index) => (
                <text
                  key={`header-${houseNumber}-${index}`}
                  x={item.x}
                  y={item.y}
                  textAnchor="middle"
                  dominantBaseline="middle"
                  fill={
                    item.type === "rashi"
                      ? "#fcd34d"
                      : "rgba(251,191,36,0.8)"
                  }
                  fontSize={item.fontSize}
                  fontFamily={
                    item.type === "rashi"
                      ? "sans-serif"
                      : "monospace"
                  }
                  fontWeight={item.type === "rashi" ? "700" : "500"}
                  pointerEvents="none"
                >
                  {item.type === "house"
                    ? `H${houseNumber}`
                    : signNumber}
                </text>
              ))}

              {planetItems.map((item, index) => (
                <text
                  key={`planet-${houseNumber}-${index}`}
                  x={item.x}
                  y={item.y}
                  textAnchor="middle"
                  dominantBaseline="middle"
                  fill="#e2e8f0"
                  fontSize={PLANET_FONT_SIZE}
                  fontFamily="monospace"
                  fontWeight="500"
                  pointerEvents="none"
                >
                  {item.text}
                </text>
              ))}
            </g>
          );
        })}

        <text
          x="200"
          y="184"
          textAnchor="middle"
          dominantBaseline="middle"
          fill="rgba(251,191,36,0.7)"
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

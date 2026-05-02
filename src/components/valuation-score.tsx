"use client";

import { useState, useRef, useEffect, useCallback } from "react";
import { createPortal } from "react-dom";
import { ValuationResult } from "@/lib/valuation-score";

interface ValuationScoreProps {
  result: ValuationResult;
  compact?: boolean;
}

// Maps color name to Tailwind/CSS values used in the component
const COLOR_MAP: Record<
  string,
  { hex: string; bg: string; text: string; border: string; bar: string }
> = {
  emerald: {
    hex: "#10b981",
    bg: "bg-emerald-500/10",
    text: "text-emerald-400",
    border: "border-emerald-500/30",
    bar: "bg-emerald-500",
  },
  teal: {
    hex: "#14b8a6",
    bg: "bg-teal-500/10",
    text: "text-teal-400",
    border: "border-teal-500/30",
    bar: "bg-teal-500",
  },
  yellow: {
    hex: "#eab308",
    bg: "bg-yellow-500/10",
    text: "text-yellow-400",
    border: "border-yellow-500/30",
    bar: "bg-yellow-500",
  },
  orange: {
    hex: "#f97316",
    bg: "bg-orange-500/10",
    text: "text-orange-400",
    border: "border-orange-500/30",
    bar: "bg-orange-500",
  },
  red: {
    hex: "#ef4444",
    bg: "bg-red-500/10",
    text: "text-red-400",
    border: "border-red-500/30",
    bar: "bg-red-500",
  },
};

// ─── Semicircular Gauge ───────────────────────────────────────────────────

function Gauge({ score, colorHex }: { score: number; colorHex: string }) {
  // Gauge arc: half-circle from -180° to 0° (left to right on top)
  // SVG viewBox: 0 0 200 110
  const cx = 100;
  const cy = 100;
  const r = 80;

  // Arc endpoints for a semicircle
  const startX = cx - r; // leftmost point
  const startY = cy;
  const endX = cx + r;  // rightmost point
  const endY = cy;

  // Background arc path (full semicircle)
  const bgPath = `M ${startX} ${startY} A ${r} ${r} 0 0 1 ${endX} ${endY}`;

  // Score arc (fraction of the semicircle)
  const fraction = Math.max(0, Math.min(1, score / 100));
  const angle = Math.PI * fraction; // 0 to π
  const needleX = cx + r * Math.cos(Math.PI - angle);
  const needleY = cy - r * Math.sin(Math.PI - angle);
  const largeArc = fraction > 0.5 ? 1 : 0;
  const scorePath =
    fraction === 0
      ? ""
      : fraction >= 1
      ? `M ${startX} ${startY} A ${r} ${r} 0 1 1 ${endX} ${endY}`
      : `M ${startX} ${startY} A ${r} ${r} 0 ${largeArc} 1 ${needleX} ${needleY}`;

  // Needle
  const needleLength = r - 10;
  const needleAngle = Math.PI - angle; // angle from positive x-axis
  const needleEndX = cx + needleLength * Math.cos(needleAngle);
  const needleEndY = cy - needleLength * Math.sin(needleAngle);

  return (
    <svg
      viewBox="0 0 200 110"
      className="w-full max-w-[220px]"
      aria-hidden="true"
    >
      {/* Gradient definition */}
      <defs>
        <linearGradient id="gaugeGradient" x1="0%" y1="0%" x2="100%" y2="0%">
          <stop offset="0%" stopColor="#ef4444" />
          <stop offset="33%" stopColor="#f97316" />
          <stop offset="66%" stopColor="#eab308" />
          <stop offset="100%" stopColor="#10b981" />
        </linearGradient>
      </defs>

      {/* Background track */}
      <path
        d={bgPath}
        fill="none"
        stroke="rgba(255,255,255,0.08)"
        strokeWidth="14"
        strokeLinecap="round"
      />

      {/* Colored progress arc */}
      {scorePath && (
        <path
          d={scorePath}
          fill="none"
          stroke="url(#gaugeGradient)"
          strokeWidth="14"
          strokeLinecap="round"
        />
      )}

      {/* Needle */}
      <line
        x1={cx}
        y1={cy}
        x2={needleEndX}
        y2={needleEndY}
        stroke={colorHex}
        strokeWidth="3"
        strokeLinecap="round"
      />
      {/* Needle pivot */}
      <circle cx={cx} cy={cy} r="5" fill={colorHex} />

      {/* Score number */}
      <text
        x={cx}
        y={cy - 20}
        textAnchor="middle"
        fill={colorHex}
        fontSize="28"
        fontWeight="bold"
        fontFamily="sans-serif"
      >
        {score}
      </text>

      {/* Min / Max labels */}
      <text
        x={startX + 4}
        y={cy + 18}
        fill="rgba(255,255,255,0.3)"
        fontSize="10"
        fontFamily="sans-serif"
      >
        0
      </text>
      <text
        x={endX - 14}
        y={cy + 18}
        fill="rgba(255,255,255,0.3)"
        fontSize="10"
        fontFamily="sans-serif"
      >
        100
      </text>
    </svg>
  );
}

// ─── Factor row ───────────────────────────────────────────────────────────

function FactorRow({
  name,
  score,
  maxScore,
  description,
}: {
  name: string;
  score: number;
  maxScore: number;
  description: string;
}) {
  const pct = maxScore > 0 ? Math.round((score / maxScore) * 100) : 0;

  let barColor = "bg-emerald-500";
  if (pct < 40) barColor = "bg-red-500";
  else if (pct < 60) barColor = "bg-orange-500";
  else if (pct < 80) barColor = "bg-yellow-500";

  return (
    <div className="space-y-1 min-w-0">
      <div className="flex items-center justify-between text-xs gap-2">
        <span className="font-medium text-foreground truncate">{name}</span>
        <span className="text-muted-foreground shrink-0">
          {score}/{maxScore}
        </span>
      </div>
      <div className="h-2 rounded-full bg-white/10 overflow-hidden w-full">
        <div
          className={`h-full rounded-full transition-all duration-500 ${barColor}`}
          style={{ width: `${pct}%` }}
        />
      </div>
      <p className="text-[11px] text-muted-foreground leading-tight">
        {description}
      </p>
    </div>
  );
}

// ─── Compact badge with hover tooltip (portal-based, never clipped) ──────

export function ValuationScoreBadge({ result }: { result: ValuationResult }) {
  const [open, setOpen] = useState(false);
  const [pos, setPos] = useState<{ top: number; left: number } | null>(null);
  const badgeRef = useRef<HTMLDivElement>(null);
  const colors = COLOR_MAP[result.color] ?? COLOR_MAP.emerald;

  const updatePos = useCallback(() => {
    if (!badgeRef.current) return;
    const rect = badgeRef.current.getBoundingClientRect();
    let left = rect.left;
    // Keep tooltip within viewport (w-72 = 288px)
    if (left + 288 > window.innerWidth) left = window.innerWidth - 296;
    if (left < 8) left = 8;
    setPos({ top: rect.bottom + 8, left });
  }, []);

  useEffect(() => {
    if (!open) return;
    updatePos();
    window.addEventListener("scroll", updatePos, true);
    window.addEventListener("resize", updatePos);
    return () => {
      window.removeEventListener("scroll", updatePos, true);
      window.removeEventListener("resize", updatePos);
    };
  }, [open, updatePos]);

  return (
    <div
      className="inline-block"
      ref={badgeRef}
      onMouseEnter={() => setOpen(true)}
      onMouseLeave={() => setOpen(false)}
    >
      <div
        className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[11px] font-bold cursor-help ${colors.bg} ${colors.text} border ${colors.border}`}
      >
        <span>{result.score}</span>
        <span className="font-normal opacity-70">/ 100</span>
      </div>

      {open && pos && createPortal(
        <div
          className="fixed z-[9999] w-72 bg-zinc-900 border border-border/60 rounded-lg shadow-2xl p-3 space-y-2"
          style={{ top: pos.top, left: pos.left }}
          onMouseEnter={() => setOpen(true)}
          onMouseLeave={() => setOpen(false)}
        >
          {/* Header */}
          <div className="flex items-center justify-between pb-1 border-b border-border/30">
            <span className="text-xs font-semibold text-white">Índice de Valorização</span>
            <span className={`text-xs font-bold ${colors.text}`}>
              {result.score}/100 — {result.classification}
            </span>
          </div>

          {/* Factor breakdown */}
          {result.factors.map((f) => {
            const pct = f.maxScore > 0 ? Math.round((f.score / f.maxScore) * 100) : 0;
            let barColor = "bg-emerald-500";
            if (pct < 40) barColor = "bg-red-500";
            else if (pct < 60) barColor = "bg-orange-500";
            else if (pct < 80) barColor = "bg-yellow-500";

            return (
              <div key={f.name} className="space-y-0.5">
                <div className="flex items-center justify-between">
                  <span className="text-[10px] font-medium text-zinc-300">{f.name}</span>
                  <span className="text-[10px] text-zinc-400 font-mono">{f.score}/{f.maxScore}</span>
                </div>
                <div className="h-1 rounded-full bg-white/10 overflow-hidden">
                  <div
                    className={`h-full rounded-full ${barColor}`}
                    style={{ width: `${pct}%` }}
                  />
                </div>
                <p className="text-[9px] text-zinc-500 leading-tight">{f.description}</p>
              </div>
            );
          })}

          {/* Disclaimer */}
          <p className="text-[8px] text-zinc-600 pt-1 border-t border-border/20">
            Score estimado. Não constitui avaliação profissional.{result.dataSource ? ` ${result.dataSource}.` : ""}
          </p>
        </div>,
        document.body
      )}
    </div>
  );
}

// ─── Full component ───────────────────────────────────────────────────────

export function ValuationScore({ result, compact = false }: ValuationScoreProps) {
  const colors = COLOR_MAP[result.color] ?? COLOR_MAP.emerald;

  if (compact) {
    return <ValuationScoreBadge result={result} />;
  }

  return (
    <div className="space-y-6 overflow-hidden">
      {/* Gauge + classification */}
      <div className="flex flex-col items-center gap-2 px-4">
        <div className="w-full max-w-[200px] sm:max-w-[220px]">
          <Gauge score={result.score} colorHex={colors.hex} />
        </div>
        <div className="text-center">
          <span
            className={`inline-block px-3 py-1 rounded-full text-sm font-semibold ${colors.bg} ${colors.text} border ${colors.border}`}
          >
            {result.classification}
          </span>
          <p className="text-xs text-muted-foreground mt-1">
            Score {result.score} / 100
          </p>
        </div>
      </div>

      {/* Factor breakdown */}
      <div className="space-y-4 px-1">
        <div>
          <h3 className="text-sm font-semibold text-muted-foreground uppercase tracking-wide">
            Composição do Score
          </h3>
          <p className="text-xs text-muted-foreground/80 mt-1 leading-relaxed">
            Este índice avalia a completude e atratividade do seu anúncio. Quanto mais informações e mídia, maior a nota.
          </p>
        </div>
        {result.factors.map((f) => (
          <FactorRow key={f.name} {...f} />
        ))}
      </div>

      {/* Disclaimer */}
      <p className="text-[11px] text-muted-foreground/60 leading-relaxed border-t border-border/30 pt-3">
        Índice estimado. Não constitui avaliação profissional.{result.dataSource ? ` ${result.dataSource}.` : ""}
      </p>
    </div>
  );
}

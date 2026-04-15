"use client";

import { getSolarInfo, FACADE_ORIENTATION_LABELS, type FacadeOrientation } from "@/lib/solar";

interface SolarCompassProps {
  latitude: number;
  longitude: number;
  facadeOrientation: string;
}

// Convert azimuth degrees to SVG x,y on a circle of given radius centered at cx,cy
function aziToXY(azimuth: number, radius: number, cx: number, cy: number) {
  // azimuth 0 = North = top = -90° in standard math angle
  const rad = ((azimuth - 90) * Math.PI) / 180;
  return {
    x: cx + radius * Math.cos(rad),
    y: cy + radius * Math.sin(rad),
  };
}

// Build an SVG arc path between two azimuths (always going clockwise through the solar arc)
function arcPath(
  startAzi: number,
  endAzi: number,
  radius: number,
  cx: number,
  cy: number
) {
  const start = aziToXY(startAzi, radius, cx, cy);
  const end = aziToXY(endAzi, radius, cx, cy);
  // For Brazil (south hemisphere) the sun goes E (80°) → N (0°/360°) → W (280°)
  // That means we go clockwise from 80 → 280 passing through 0/360 (north).
  // large-arc-flag: 1 means take the longer arc
  // We need the shorter arc from 80 to 280 going through north — that is 200° < 180°... actually 200° > 180°
  // so large-arc-flag = 1, sweep-direction = 0 (counter-clockwise) would give us the north arc.
  // Let's compute angular distance clockwise from start to end.
  let cw = (endAzi - startAzi + 360) % 360; // clockwise span from start to end
  // Sun arc in south hemisphere is the northern arc: E(80) → W(280) passing through N(0)
  // Clockwise from 80 → 280 = 200°.  Counter-clockwise from 80 → 280 = 160°.
  // The northern arc is the counter-clockwise one (160°).
  // SVG: sweep-flag=0 means counter-clockwise
  const largeArc = cw > 180 ? 0 : 1; // counter-clockwise path; large if span > 180
  return `M ${start.x} ${start.y} A ${radius} ${radius} 0 ${largeArc} 0 ${end.x} ${end.y}`;
}

const ORIENTATION_COLORS: Record<string, string> = {
  norte: "#10b981",       // emerald – lots of sun
  nordeste: "#34d399",    // emerald lighter
  leste: "#fbbf24",       // amber – morning sun
  sudeste: "#fcd34d",     // amber lighter
  sul: "#6b7280",         // gray – little sun
  sudoeste: "#9ca3af",    // gray lighter
  oeste: "#f97316",       // orange – afternoon sun
  noroeste: "#fb923c",    // orange lighter
};

export function SolarCompass({ latitude, longitude, facadeOrientation }: SolarCompassProps) {
  const solarInfo = getSolarInfo(latitude, longitude, facadeOrientation);
  if (!solarInfo) return null;

  const { facadeAzimuth, sunriseAzimuth, sunsetAzimuth, facadeSunExposure, recommendation } = solarInfo;

  const cx = 80;
  const cy = 80;
  const outerR = 68;
  const innerR = 52;
  const arcR = 60;

  // Facade arrow tip and base
  const facadeTip = aziToXY(facadeAzimuth, outerR - 4, cx, cy);
  const facadeBase = aziToXY(facadeAzimuth + 180, 18, cx, cy);

  // Sunrise/sunset dots
  const sunriseDot = aziToXY(sunriseAzimuth, arcR, cx, cy);
  const sunsetDot = aziToXY(sunsetAzimuth, arcR, cx, cy);

  const facadeColor = ORIENTATION_COLORS[facadeOrientation] || "#10b981";
  const label = FACADE_ORIENTATION_LABELS[facadeOrientation as FacadeOrientation] || facadeOrientation;

  const sunArcPath = arcPath(sunriseAzimuth, sunsetAzimuth, arcR, cx, cy);

  return (
    <div className="rounded-xl border border-border/50 bg-card/60 p-5 space-y-4">
      {/* Title */}
      <div className="flex items-center gap-2">
        <svg viewBox="0 0 24 24" className="w-5 h-5 text-amber-400 shrink-0" fill="currentColor">
          <circle cx="12" cy="12" r="5" />
          <line x1="12" y1="2" x2="12" y2="4" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
          <line x1="12" y1="20" x2="12" y2="22" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
          <line x1="2" y1="12" x2="4" y2="12" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
          <line x1="20" y1="12" x2="22" y2="12" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
          <line x1="4.9" y1="4.9" x2="6.3" y2="6.3" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
          <line x1="17.7" y1="17.7" x2="19.1" y2="19.1" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
          <line x1="4.9" y1="19.1" x2="6.3" y2="17.7" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
          <line x1="17.7" y1="6.3" x2="19.1" y2="4.9" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
        </svg>
        <h2 className="text-base font-semibold">Orientação Solar</h2>
      </div>

      <div className="flex flex-col sm:flex-row items-center gap-6">
        {/* SVG Compass */}
        <div className="shrink-0">
          <svg
            viewBox="0 0 160 160"
            width="160"
            height="160"
            aria-label={`Bússola solar — fachada voltada para ${label}`}
          >
            {/* Outer circle */}
            <circle cx={cx} cy={cy} r={outerR} fill="none" stroke="currentColor" strokeOpacity="0.15" strokeWidth="1" />
            {/* Inner circle */}
            <circle cx={cx} cy={cy} r={innerR} fill="none" stroke="currentColor" strokeOpacity="0.08" strokeWidth="1" />

            {/* Cardinal tick marks */}
            {[0, 45, 90, 135, 180, 225, 270, 315].map((azi) => {
              const inner = aziToXY(azi, innerR + 2, cx, cy);
              const outer2 = aziToXY(azi, outerR - 2, cx, cy);
              return (
                <line
                  key={azi}
                  x1={inner.x}
                  y1={inner.y}
                  x2={outer2.x}
                  y2={outer2.y}
                  stroke="currentColor"
                  strokeOpacity={[0, 90, 180, 270].includes(azi) ? 0.4 : 0.15}
                  strokeWidth={[0, 90, 180, 270].includes(azi) ? 1.5 : 1}
                />
              );
            })}

            {/* Cardinal labels */}
            {(
              [
                { azi: 0, label: "N" },
                { azi: 90, label: "L" },
                { azi: 180, label: "S" },
                { azi: 270, label: "O" },
              ] as const
            ).map(({ azi, label: cardLabel }) => {
              const pos = aziToXY(azi, outerR + 10, cx, cy);
              return (
                <text
                  key={azi}
                  x={pos.x}
                  y={pos.y}
                  textAnchor="middle"
                  dominantBaseline="central"
                  fontSize="9"
                  fontWeight="600"
                  fill={azi === 0 ? "#10b981" : "currentColor"}
                  fillOpacity={azi === 0 ? 1 : 0.6}
                >
                  {cardLabel}
                </text>
              );
            })}

            {/* Sun arc — the path the sun travels (E → N → W for Brazil) */}
            <path
              d={sunArcPath}
              fill="none"
              stroke="#fbbf24"
              strokeOpacity="0.5"
              strokeWidth="3"
              strokeLinecap="round"
            />

            {/* Sunrise dot */}
            <circle cx={sunriseDot.x} cy={sunriseDot.y} r="4" fill="#fbbf24" fillOpacity="0.9" />
            <text
              x={aziToXY(sunriseAzimuth, arcR + 13, cx, cy).x}
              y={aziToXY(sunriseAzimuth, arcR + 13, cx, cy).y}
              textAnchor="middle"
              dominantBaseline="central"
              fontSize="6"
              fill="#fbbf24"
              fillOpacity="0.8"
            >
              ↑sol
            </text>

            {/* Sunset dot */}
            <circle cx={sunsetDot.x} cy={sunsetDot.y} r="4" fill="#f97316" fillOpacity="0.9" />
            <text
              x={aziToXY(sunsetAzimuth, arcR + 13, cx, cy).x}
              y={aziToXY(sunsetAzimuth, arcR + 13, cx, cy).y}
              textAnchor="middle"
              dominantBaseline="central"
              fontSize="6"
              fill="#f97316"
              fillOpacity="0.8"
            >
              sol↓
            </text>

            {/* Facade arrow */}
            <line
              x1={facadeBase.x}
              y1={facadeBase.y}
              x2={facadeTip.x}
              y2={facadeTip.y}
              stroke={facadeColor}
              strokeWidth="3"
              strokeLinecap="round"
            />
            {/* Arrow head using a small polygon at the tip */}
            {(() => {
              const tip = aziToXY(facadeAzimuth, outerR - 4, cx, cy);
              const left = aziToXY(facadeAzimuth - 25, outerR - 14, cx, cy);
              const right = aziToXY(facadeAzimuth + 25, outerR - 14, cx, cy);
              return (
                <polygon
                  points={`${tip.x},${tip.y} ${left.x},${left.y} ${right.x},${right.y}`}
                  fill={facadeColor}
                  fillOpacity="0.9"
                />
              );
            })()}

            {/* Center label */}
            <text
              x={cx}
              y={cy - 5}
              textAnchor="middle"
              dominantBaseline="central"
              fontSize="7.5"
              fontWeight="700"
              fill={facadeColor}
            >
              {label.toUpperCase()}
            </text>
            <text
              x={cx}
              y={cy + 7}
              textAnchor="middle"
              dominantBaseline="central"
              fontSize="5.5"
              fill="currentColor"
              fillOpacity="0.45"
            >
              fachada
            </text>
          </svg>
        </div>

        {/* Text info */}
        <div className="space-y-3 text-sm flex-1">
          <div>
            <p className="text-xs text-muted-foreground mb-0.5">Fachada voltada para</p>
            <p className="font-semibold" style={{ color: facadeColor }}>
              {label}
            </p>
          </div>

          <div>
            <p className="text-xs text-muted-foreground mb-0.5">Exposição solar</p>
            <p className="text-foreground leading-snug">{facadeSunExposure}</p>
          </div>

          <div className="rounded-lg bg-amber-500/8 border border-amber-500/20 px-3 py-2">
            <p className="text-xs text-amber-400/80 mb-0.5 font-medium">Dica</p>
            <p className="text-xs text-muted-foreground leading-relaxed">{recommendation}</p>
          </div>

          {/* Legend */}
          <div className="flex flex-wrap gap-x-4 gap-y-1 pt-1">
            <span className="flex items-center gap-1 text-xs text-muted-foreground">
              <span className="inline-block w-3 h-0.5 bg-amber-400 rounded" />
              Trajetória do sol
            </span>
            <span className="flex items-center gap-1 text-xs text-muted-foreground">
              <span className="inline-block w-2.5 h-2.5 rounded-full bg-amber-400" />
              Nascer do sol
            </span>
            <span className="flex items-center gap-1 text-xs text-muted-foreground">
              <span className="inline-block w-2.5 h-2.5 rounded-full bg-orange-400" />
              Pôr do sol
            </span>
          </div>
        </div>
      </div>
    </div>
  );
}

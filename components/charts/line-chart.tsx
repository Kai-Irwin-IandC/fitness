"use client";
import { useEffect, useRef, useState } from "react";
import { daysBetween, formatShort, addDays } from "@/lib/date";

export type Series = {
  key: string;
  label: string;
  color: string;
  kind: "line" | "dashed" | "dots";
  points: { date: string; value: number }[];
};

const M = { top: 12, right: 64, bottom: 24, left: 40 };
const HEIGHT = 240;

function useWidth<T extends HTMLElement>() {
  const ref = useRef<T>(null);
  const [width, setWidth] = useState(0);
  useEffect(() => {
    if (!ref.current) return;
    const ro = new ResizeObserver(([e]) => setWidth(e.contentRect.width));
    ro.observe(ref.current);
    return () => ro.disconnect();
  }, []);
  return [ref, width] as const;
}

function niceTicks(lo: number, hi: number, count = 4) {
  const span = hi - lo || 1;
  const raw = span / count;
  const mag = 10 ** Math.floor(Math.log10(raw));
  const step = [1, 2, 2.5, 5, 10].map((m) => m * mag).find((s) => s >= raw) ?? raw;
  const ticks: number[] = [];
  for (let v = Math.ceil(lo / step) * step; v <= hi + 1e-9; v += step) ticks.push(Number(v.toFixed(6)));
  return ticks;
}

/** Date-axis line chart: one y-scale, thin lines, crosshair + one tooltip listing every series. */
export function LineChart({
  series,
  unit,
  from,
  to,
  digits = 1,
  ariaLabel,
}: {
  series: Series[];
  unit: string;
  from: string;
  to: string;
  digits?: number;
  ariaLabel: string;
}) {
  const [ref, width] = useWidth<HTMLDivElement>();
  const [hover, setHover] = useState<string | null>(null);
  const all = series.flatMap((s) => s.points.map((p) => p.value));
  if (!all.length) {
    return <p className="py-10 text-center text-sm text-[var(--text-muted)]">まだデータがありません</p>;
  }

  const lo = Math.min(...all);
  const hi = Math.max(...all);
  const pad = Math.max((hi - lo) * 0.12, hi * 0.005, 0.5);
  const yTicks = niceTicks(lo - pad, hi + pad);
  const yMin = Math.min(lo - pad, yTicks[0]);
  const yMax = Math.max(hi + pad, yTicks[yTicks.length - 1]);
  const days = Math.max(1, daysBetween(from, to));
  const innerW = Math.max(10, width - M.left - M.right);
  const innerH = HEIGHT - M.top - M.bottom;
  const x = (date: string) => M.left + (daysBetween(from, date) / days) * innerW;
  const y = (v: number) => M.top + (1 - (v - yMin) / (yMax - yMin)) * innerH;
  const xTickCount = Math.min(6, Math.max(2, Math.floor(innerW / 80)));
  const xTicks = Array.from({ length: xTickCount }, (_, i) => addDays(from, Math.round((days * i) / (xTickCount - 1))));
  const path = (pts: Series["points"]) =>
    pts.map((p, i) => `${i ? "L" : "M"}${x(p.date).toFixed(1)},${y(p.value).toFixed(1)}`).join("");
  const fmt = (v: number) => `${v.toFixed(digits)}${unit}`;

  const onMove = (e: React.PointerEvent<SVGRectElement>) => {
    const box = e.currentTarget.getBoundingClientRect();
    const ratio = Math.min(1, Math.max(0, (e.clientX - box.left) / box.width));
    setHover(addDays(from, Math.round(ratio * days)));
  };
  const hoverRows = hover
    ? series
        .map((s) => ({ s, p: s.points.find((p) => p.date === hover) }))
        .filter((r): r is { s: Series; p: Series["points"][number] } => Boolean(r.p))
    : [];
  const tooltipLeft = hover ? Math.min(Math.max(x(hover) - 70, 0), Math.max(0, width - 150)) : 0;

  return (
    <div>
      {series.length >= 2 ? (
        <ul className="mb-2 flex flex-wrap gap-x-4 gap-y-1 text-xs text-[var(--text-muted)]">
          {series.map((s) => (
            <li key={s.key} className="flex items-center gap-1.5">
              <svg width="18" height="8" aria-hidden="true">
                {s.kind === "dots" ? (
                  <circle cx="9" cy="4" r="3.5" fill={s.color} />
                ) : (
                  <line x1="0" x2="18" y1="4" y2="4" stroke={s.color} strokeWidth="2" strokeDasharray={s.kind === "dashed" ? "4 3" : undefined} />
                )}
              </svg>
              {s.label}
            </li>
          ))}
        </ul>
      ) : null}
      <div ref={ref} className="relative w-full select-none">
        {width > 0 ? (
          <svg width={width} height={HEIGHT} role="img" aria-label={ariaLabel} className="block">
            {yTicks.map((t) => (
              <g key={t}>
                <line x1={M.left} x2={M.left + innerW} y1={y(t)} y2={y(t)} stroke="var(--chart-grid)" strokeWidth="1" />
                <text x={M.left - 6} y={y(t)} dy="0.32em" textAnchor="end" fontSize="11" fill="var(--text-muted)" className="tabular">
                  {t}
                </text>
              </g>
            ))}
            {xTicks.map((t) => (
              <text key={t} x={x(t)} y={HEIGHT - 6} textAnchor="middle" fontSize="11" fill="var(--text-muted)">
                {formatShort(t)}
              </text>
            ))}
            {series.map((s) =>
              s.kind === "dots" ? (
                <g key={s.key}>
                  {s.points.map((p) => (
                    <circle key={p.date} cx={x(p.date)} cy={y(p.value)} r="4" fill={s.color} stroke="var(--card)" strokeWidth="2" />
                  ))}
                </g>
              ) : (
                <path
                  key={s.key}
                  d={path(s.points)}
                  fill="none"
                  stroke={s.color}
                  strokeWidth="2"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeDasharray={s.kind === "dashed" ? "6 4" : undefined}
                />
              ),
            )}
            {/* direct labels at the end of each line */}
            {series
              .filter((s) => s.kind !== "dots" && s.points.length)
              .map((s) => {
                const last = s.points[s.points.length - 1];
                return (
                  <text key={s.key} x={x(last.date) + 6} y={y(last.value)} dy="0.32em" fontSize="11" fontWeight="600" fill="var(--text-body)" className="tabular">
                    {last.value.toFixed(digits)}
                  </text>
                );
              })}
            {hover ? (
              <line x1={x(hover)} x2={x(hover)} y1={M.top} y2={M.top + innerH} stroke="var(--text-muted)" strokeWidth="1" />
            ) : null}
            {hoverRows.map(({ s, p }) => (
              <circle key={s.key} cx={x(p.date)} cy={y(p.value)} r="5" fill={s.color} stroke="var(--card)" strokeWidth="2" />
            ))}
            <rect
              x={M.left}
              y={M.top}
              width={innerW}
              height={innerH}
              fill="transparent"
              onPointerMove={onMove}
              onPointerDown={onMove}
              onPointerLeave={() => setHover(null)}
            />
          </svg>
        ) : (
          <div style={{ height: HEIGHT }} />
        )}
        {hover && hoverRows.length ? (
          <div
            className="glass-panel pointer-events-none absolute top-0 w-[150px] rounded-lg px-2.5 py-2 text-xs"
            style={{ left: tooltipLeft }}
          >
            <p className="mb-1 font-semibold text-[var(--text-muted)]">{formatShort(hover)}</p>
            {hoverRows.map(({ s, p }) => (
              <p key={s.key} className="flex items-center gap-1.5">
                <svg width="12" height="6" aria-hidden="true">
                  <line x1="0" x2="12" y1="3" y2="3" stroke={s.color} strokeWidth="2" />
                </svg>
                <strong className="tabular text-[var(--text-title)]">{fmt(p.value)}</strong>
                <span className="text-[var(--text-muted)]">{s.label}</span>
              </p>
            ))}
          </div>
        ) : null}
      </div>
    </div>
  );
}

"use client";
import { useEffect, useRef, useState } from "react";
import { formatShort } from "@/lib/date";

const M = { top: 12, right: 12, bottom: 24, left: 44 };
const HEIGHT = 200;

/**
 * One bar per day, with an optional labeled reference line (e.g. the sleep target).
 * `signed` bars grow from zero both ways: below zero in series-1, above in series-2.
 */
export function DayBarChart({
  bars,
  reference,
  unit,
  ariaLabel,
  signed = false,
  digits = 1,
}: {
  bars: { date: string; value: number; detail?: string }[];
  reference?: { value: number; label: string };
  unit: string;
  ariaLabel: string;
  signed?: boolean;
  digits?: number;
}) {
  const ref = useRef<HTMLDivElement>(null);
  const [width, setWidth] = useState(0);
  const [hover, setHover] = useState<number | null>(null);
  useEffect(() => {
    if (!ref.current) return;
    const ro = new ResizeObserver(([e]) => setWidth(e.contentRect.width));
    ro.observe(ref.current);
    return () => ro.disconnect();
  }, []);

  if (!bars.length) {
    return <p className="py-10 text-center text-sm text-[var(--text-muted)]">まだデータがありません</p>;
  }

  const values = bars.map((b) => b.value);
  const max = Math.max(0, ...values, reference?.value ?? 0) * 1.15 || 1;
  const min = Math.min(0, ...values) * 1.15;
  const innerW = Math.max(10, width - M.left - M.right);
  const innerH = HEIGHT - M.top - M.bottom;
  const slot = innerW / bars.length;
  const barW = Math.max(3, Math.min(28, slot - 2));
  const y = (v: number) => M.top + (1 - (v - min) / (max - min)) * innerH;
  const y0 = y(0);
  const labelEvery = Math.ceil(bars.length / Math.max(2, Math.floor(innerW / 48)));
  const ticks = [...new Set([min < 0 ? Math.ceil(min) : null, 0, Math.round(max / 2), Math.floor(max)].filter((t): t is number => t !== null))];
  const active = hover !== null ? bars[hover] : null;
  const fmt = (v: number) =>
    `${signed ? (v > 0 ? "+" : v < 0 ? "−" : "") : ""}${(signed ? Math.abs(v) : v).toLocaleString(undefined, { maximumFractionDigits: digits })}${unit}`;

  /** Bar with 4px rounding on the data end only, anchored flat at zero. */
  const barPath = (cx: number, v: number) => {
    const x0 = cx - barW / 2;
    const x1 = cx + barW / 2;
    const end = y(v);
    const h = Math.abs(y0 - end);
    const r = Math.min(4, barW / 2, h);
    if (v >= 0) {
      return `M${x0},${y0} V${end + r} Q${x0},${end} ${x0 + r},${end} H${x1 - r} Q${x1},${end} ${x1},${end + r} V${y0} Z`;
    }
    return `M${x0},${y0} V${end - r} Q${x0},${end} ${x0 + r},${end} H${x1 - r} Q${x1},${end} ${x1},${end - r} V${y0} Z`;
  };

  return (
    <div ref={ref} className="relative w-full select-none">
      {width > 0 ? (
        <svg width={width} height={HEIGHT} role="img" aria-label={ariaLabel} className="block">
          {ticks.map((t) => (
            <g key={t}>
              <line x1={M.left} x2={M.left + innerW} y1={y(t)} y2={y(t)} stroke={t === 0 && signed ? "var(--text-muted)" : "var(--chart-grid)"} />
              <text x={M.left - 6} y={y(t)} dy="0.32em" textAnchor="end" fontSize="11" fill="var(--text-muted)" className="tabular">
                {t < 0 ? `−${Math.abs(t).toLocaleString()}` : t.toLocaleString()}
              </text>
            </g>
          ))}
          {bars.map((b, i) => {
            const cx = M.left + slot * i + slot / 2;
            return (
              <g key={b.date}>
                <path
                  d={barPath(cx, b.value)}
                  fill={signed && b.value > 0 ? "var(--series-2)" : "var(--series-1)"}
                  opacity={hover === null || hover === i ? 1 : 0.55}
                />
                {i % labelEvery === 0 ? (
                  <text x={cx} y={HEIGHT - 6} textAnchor="middle" fontSize="11" fill="var(--text-muted)">
                    {formatShort(b.date)}
                  </text>
                ) : null}
                <rect
                  x={M.left + slot * i}
                  y={M.top}
                  width={slot}
                  height={innerH}
                  fill="transparent"
                  onPointerEnter={() => setHover(i)}
                  onPointerDown={() => setHover(i)}
                  onPointerLeave={() => setHover(null)}
                />
              </g>
            );
          })}
          {reference ? (
            <g pointerEvents="none">
              <line x1={M.left} x2={M.left + innerW} y1={y(reference.value)} y2={y(reference.value)} stroke="var(--series-2)" strokeWidth="2" strokeDasharray="6 4" />
              <text x={M.left + innerW} y={y(reference.value) - 6} textAnchor="end" fontSize="11" fontWeight="600" fill="var(--text-body)">
                {reference.label}
              </text>
            </g>
          ) : null}
        </svg>
      ) : (
        <div style={{ height: HEIGHT }} />
      )}
      {active && hover !== null ? (
        <div
          className="glass-panel pointer-events-none absolute top-0 rounded-lg px-2.5 py-2 text-xs"
          style={{ left: Math.min(Math.max(M.left + slot * hover - 50, 0), Math.max(0, width - 170)) }}
        >
          <p className="font-semibold text-[var(--text-muted)]">{formatShort(active.date)}</p>
          <p>
            <strong className="tabular text-[var(--text-title)]">{fmt(active.value)}</strong>
            {active.detail ? <span className="ml-1 text-[var(--text-muted)]">{active.detail}</span> : null}
          </p>
        </div>
      ) : null}
    </div>
  );
}

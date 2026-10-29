"use client";
import { useEffect, useRef, useState } from "react";
import { formatShort } from "@/lib/date";

const M = { top: 12, right: 12, bottom: 24, left: 32 };
const HEIGHT = 200;

/** One bar per day, with an optional labeled reference line (e.g. the sleep target). */
export function DayBarChart({
  bars,
  reference,
  unit,
  ariaLabel,
}: {
  bars: { date: string; value: number; detail?: string }[];
  reference?: { value: number; label: string };
  unit: string;
  ariaLabel: string;
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

  const max = Math.max(...bars.map((b) => b.value), reference?.value ?? 0) * 1.15;
  const innerW = Math.max(10, width - M.left - M.right);
  const innerH = HEIGHT - M.top - M.bottom;
  const slot = innerW / bars.length;
  const barW = Math.max(3, Math.min(28, slot - 2));
  const y = (v: number) => M.top + (1 - v / max) * innerH;
  const labelEvery = Math.ceil(bars.length / Math.max(2, Math.floor(innerW / 48)));
  const ticks = [0, Math.round(max / 2), Math.floor(max)];
  const active = hover !== null ? bars[hover] : null;

  return (
    <div ref={ref} className="relative w-full select-none">
      {width > 0 ? (
        <svg width={width} height={HEIGHT} role="img" aria-label={ariaLabel} className="block">
          {ticks.map((t) => (
            <g key={t}>
              <line x1={M.left} x2={M.left + innerW} y1={y(t)} y2={y(t)} stroke="var(--chart-grid)" />
              <text x={M.left - 6} y={y(t)} dy="0.32em" textAnchor="end" fontSize="11" fill="var(--text-muted)">
                {t}
              </text>
            </g>
          ))}
          {bars.map((b, i) => {
            const cx = M.left + slot * i + slot / 2;
            const top = y(b.value);
            const h = M.top + innerH - top;
            const r = Math.min(4, barW / 2, h);
            return (
              <g key={b.date}>
                <path
                  d={`M${cx - barW / 2},${M.top + innerH} V${top + r} Q${cx - barW / 2},${top} ${cx - barW / 2 + r},${top} H${cx + barW / 2 - r} Q${cx + barW / 2},${top} ${cx + barW / 2},${top + r} V${M.top + innerH} Z`}
                  fill="var(--series-1)"
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
          style={{ left: Math.min(Math.max(M.left + slot * hover - 50, 0), Math.max(0, width - 160)) }}
        >
          <p className="font-semibold text-[var(--text-muted)]">{formatShort(active.date)}</p>
          <p>
            <strong className="tabular text-[var(--text-title)]">
              {active.value.toFixed(1)}
              {unit}
            </strong>
            {active.detail ? <span className="ml-1 text-[var(--text-muted)]">{active.detail}</span> : null}
          </p>
        </div>
      ) : null}
    </div>
  );
}

"use client";
import Link from "next/link";
import { Check, CircleDashed, Minus, MoonStar, Plus } from "lucide-react";
import type { GoalState } from "@/lib/calc";

export function Card({
  title,
  action,
  children,
  className = "",
}: {
  title?: React.ReactNode;
  action?: React.ReactNode;
  children: React.ReactNode;
  className?: string;
}) {
  return (
    <section className={`glass-panel rounded-xl p-4 lg:p-5 ${className}`}>
      {title || action ? (
        <div className="mb-3 flex items-center justify-between gap-2">
          {title ? <h2 className="ui-title text-base">{title}</h2> : <span />}
          {action}
        </div>
      ) : null}
      {children}
    </section>
  );
}

const STATE_STYLE: Record<GoalState, { color: string; bg: string; label: string; Icon: typeof Check }> = {
  done: { color: "var(--status-good)", bg: "var(--status-good-soft)", label: "達成", Icon: Check },
  partial: { color: "var(--status-warn)", bg: "var(--status-warn-soft)", label: "あと少し", Icon: CircleDashed },
  todo: { color: "var(--status-todo)", bg: "var(--status-todo-soft)", label: "未入力", Icon: CircleDashed },
  rest: { color: "var(--status-todo)", bg: "var(--status-todo-soft)", label: "休養", Icon: MoonStar },
};

export function StatusChip({ state }: { state: GoalState }) {
  const s = STATE_STYLE[state];
  return (
    <span
      className="inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-[11px] font-semibold"
      style={{ color: s.color, background: s.bg }}
    >
      <s.Icon size={12} />
      {s.label}
    </span>
  );
}

export function Stepper({
  label,
  value,
  step,
  unit,
  min = 0,
  onChange,
}: {
  label: string;
  value: number;
  step: number;
  unit: string;
  min?: number;
  onChange: (v: number) => void;
}) {
  const set = (v: number) => onChange(Math.max(min, Math.round(v * 100) / 100));
  return (
    <div>
      <span className="ui-label">{label}</span>
      <div className="flex items-stretch gap-1.5">
        <button type="button" aria-label={`${label}を減らす`} className="ui-icon-button h-12 w-12 shrink-0" onClick={() => set(value - step)}>
          <Minus size={18} />
        </button>
        <label className="relative flex-1">
          <input
            className="ui-input tabular h-12 text-center text-lg font-semibold"
            inputMode="decimal"
            value={value}
            aria-label={label}
            onChange={(e) => {
              const n = Number(e.target.value);
              if (!Number.isNaN(n)) set(n);
            }}
          />
          <span className="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 text-xs text-[var(--text-muted)]">{unit}</span>
        </label>
        <button type="button" aria-label={`${label}を増やす`} className="ui-icon-button h-12 w-12 shrink-0" onClick={() => set(value + step)}>
          <Plus size={18} />
        </button>
      </div>
    </div>
  );
}

export function SetupNotice() {
  return (
    <Card>
      <p className="text-sm text-[var(--text-body)]">
        まず設定で身長・体重・目標を入れてください。カロリーとたんぱく質の目標、体重のペース線がそこから決まります。
      </p>
      <Link href="/settings" className="ui-button mt-3 inline-flex items-center">
        設定を開く
      </Link>
    </Card>
  );
}

export function Loading() {
  return <p className="text-sm text-[var(--text-muted)]">読み込み中…</p>;
}

/** `overIsGood`: going past the target is fine (e.g. protein), so it stays in the accent colour. */
export function Meter({ value, max, label, overIsGood = false }: { value: number; max: number; label: string; overIsGood?: boolean }) {
  const pct = max > 0 ? Math.min(100, (value / max) * 100) : 0;
  const over = value > max && !overIsGood;
  return (
    <div>
      <div className="mb-1 flex items-baseline justify-between text-xs">
        <span className="font-semibold text-[var(--text-muted)]">{label}</span>
        <span className="tabular font-semibold text-[var(--text-body)]">
          {Math.round(value)} / {Math.round(max)}
        </span>
      </div>
      <div className="h-2 overflow-hidden rounded-full bg-[var(--status-todo-soft)]" role="presentation">
        <div
          className="h-full rounded-full"
          style={{ width: `${pct}%`, background: over ? "var(--status-warn)" : "var(--accent)" }}
        />
      </div>
    </div>
  );
}

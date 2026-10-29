"use client";
import type { Nutrients } from "@/lib/types";
import { Meter } from "@/components/ui";

const MACROS = [
  { key: "protein", label: "P たんぱく質", kcalPerG: 4, color: "var(--series-1)" },
  { key: "fat", label: "F 脂質", kcalPerG: 9, color: "var(--series-2)" },
  { key: "carbs", label: "C 炭水化物", kcalPerG: 4, color: "var(--series-3)" },
] as const;

function shares(n: Nutrients) {
  const kcal = MACROS.map((m) => n[m.key] * m.kcalPerG);
  const total = kcal.reduce((a, b) => a + b, 0);
  return MACROS.map((m, i) => ({ ...m, pct: total > 0 ? (kcal[i] / total) * 100 : 0 }));
}

/** One stacked bar of P/F/C calorie shares, with a 2px surface gap between segments. */
function BalanceBar({ n, label }: { n: Nutrients; label: string }) {
  const parts = shares(n);
  return (
    <div>
      <div className="mb-1 flex items-baseline justify-between text-xs">
        <span className="font-semibold text-[var(--text-muted)]">{label}</span>
        <span className="tabular text-[var(--text-body)]">{parts.map((p) => `${p.label[0]} ${Math.round(p.pct)}%`).join("・")}</span>
      </div>
      <div className="flex h-3 gap-[2px] overflow-hidden rounded-full bg-[var(--status-todo-soft)]" role="img" aria-label={`${label}: ${parts.map((p) => `${p.label} ${Math.round(p.pct)}%`).join("、")}`}>
        {parts.map((p) => (p.pct > 0 ? <div key={p.key} style={{ width: `${p.pct}%`, background: p.color }} /> : null))}
      </div>
    </div>
  );
}

export function MacroSummary({ eaten, target }: { eaten: Nutrients; target: Nutrients }) {
  return (
    <div className="space-y-3">
      <Meter label="カロリー (kcal)" value={eaten.kcal} max={target.kcal} />
      <div className="grid gap-3 sm:grid-cols-3">
        {MACROS.map((m) => (
          <Meter key={m.key} label={`${m.label} (g)`} value={eaten[m.key]} max={target[m.key]} />
        ))}
      </div>
      <div className="space-y-2 rounded-lg bg-[var(--surface-control)] p-3">
        <BalanceBar n={eaten} label="今日のバランス" />
        <BalanceBar n={target} label="目標のバランス" />
        <ul className="flex flex-wrap gap-x-4 gap-y-1 text-xs text-[var(--text-muted)]">
          {MACROS.map((m) => (
            <li key={m.key} className="flex items-center gap-1.5">
              <span className="inline-block h-2.5 w-2.5 rounded-sm" style={{ background: m.color }} />
              {m.label}
            </li>
          ))}
        </ul>
      </div>
    </div>
  );
}

"use client";
import { useState } from "react";
import { Check, Clock, Plus, Store, Utensils } from "lucide-react";
import { newId, update } from "@/lib/store";
import { timeKey } from "@/lib/date";
import { MEAL_TEMPLATES, templateTotals, type MealTemplate, type MealTiming } from "@/lib/meal-templates";
import type { Meal, Nutrients } from "@/lib/types";
import { Card } from "@/components/ui";

const TABS: ("おすすめ" | MealTiming)[] = ["おすすめ", "朝", "昼", "夜", "間食"];

function timingNow(): MealTiming {
  const h = new Date().getHours();
  if (h < 10) return "朝";
  if (h < 15) return "昼";
  if (h < 17) return "間食";
  return "夜";
}

export function MealTemplatesCard({ today, remaining }: { today: string; remaining: Nutrients | null }) {
  const [tab, setTab] = useState<(typeof TABS)[number]>("おすすめ");
  const [added, setAdded] = useState<string | null>(null);

  const fits = (t: MealTemplate) => !remaining || templateTotals(t).kcal <= Math.max(remaining.kcal, 0) + 50;
  const proteinPerKcal = (t: MealTemplate) => templateTotals(t).protein / templateTotals(t).kcal;
  const now = timingNow();
  const list =
    tab === "おすすめ"
      ? MEAL_TEMPLATES.filter((t) => t.timing.includes(now)).sort(
          (a, b) => Number(fits(b)) - Number(fits(a)) || proteinPerKcal(b) - proteinPerKcal(a),
        )
      : MEAL_TEMPLATES.filter((t) => t.timing.includes(tab)).sort((a, b) => proteinPerKcal(b) - proteinPerKcal(a));

  const eat = (t: MealTemplate) => {
    const n = templateTotals(t);
    const meal: Meal = { id: newId(), date: today, time: timeKey(), name: t.name, kcal: n.kcal, protein: n.protein, fat: n.fat, carbs: n.carbs };
    update((d) => ({ ...d, meals: [...d.meals, meal] }));
    setAdded(t.id);
    setTimeout(() => setAdded((cur) => (cur === t.id ? null : cur)), 2000);
  };

  return (
    <Card title="テンプレートから追加">
      <div className="mb-3 flex gap-1 overflow-x-auto rounded-xl bg-[var(--accent-soft)] p-1">
        {TABS.map((t) => (
          <button
            key={t}
            type="button"
            aria-pressed={tab === t}
            onClick={() => setTab(t)}
            className={`min-h-10 flex-1 shrink-0 whitespace-nowrap rounded-lg px-3 text-sm font-semibold ${
              tab === t ? "bg-white text-[var(--text-active)] shadow-sm" : "text-[var(--text-muted)]"
            }`}
          >
            {t === "おすすめ" ? "今" : t}
          </button>
        ))}
      </div>
      {tab === "おすすめ" ? (
        <p className="mb-2 text-xs text-[var(--text-muted)]">{now}のおすすめ。残りカロリーに収まり、たんぱく質の多い順。</p>
      ) : null}
      <ul className="space-y-2">
        {list.map((t) => {
          const n = templateTotals(t);
          const ok = fits(t);
          return (
            <li key={t.id} className="rounded-xl border border-[var(--border-soft)] bg-[var(--surface-control)] p-3">
              <div className="flex items-start justify-between gap-3">
                <div className="min-w-0">
                  <p className="text-sm font-bold text-[var(--text-title)]">{t.name}</p>
                  <p className="mt-0.5 flex flex-wrap items-center gap-x-3 gap-y-0.5 text-xs text-[var(--text-muted)]">
                    <span className="inline-flex items-center gap-1">
                      <Clock size={12} />
                      {t.minutes === 0 ? "買うだけ" : `${t.minutes} 分`}
                    </span>
                    <span className="tabular">約 ¥{Math.round(n.yen / 10) * 10}</span>
                    <span className="inline-flex items-center gap-1">
                      {t.source === "コンビニ" ? <Store size={12} /> : <Utensils size={12} />}
                      {t.source}
                    </span>
                  </p>
                  <p className="tabular mt-1.5 text-sm">
                    <strong className="text-[var(--text-title)]">{Math.round(n.kcal)}kcal</strong>
                    <span className="ml-2 text-xs text-[var(--text-body)]">
                      P{Math.round(n.protein)} F{Math.round(n.fat)} C{Math.round(n.carbs)}
                    </span>
                  </p>
                  {remaining && !ok ? <p className="mt-1 text-xs text-[var(--status-warn)]">今日の残りカロリーを超えます</p> : null}
                </div>
                <button
                  type="button"
                  onClick={() => eat(t)}
                  className="ui-button inline-flex h-12 shrink-0 items-center gap-1 px-4"
                  aria-label={`${t.name}を食べたとして追加`}
                >
                  {added === t.id ? <Check size={18} /> : <Plus size={18} />}
                  {added === t.id ? "追加済み" : "食べた"}
                </button>
              </div>
              <details className="mt-2 text-xs">
                <summary className="cursor-pointer font-semibold text-[var(--text-nav)]">材料と作り方</summary>
                <ul className="mt-2 space-y-0.5 text-[var(--text-body)]">
                  {t.ingredients.map((i, idx) => (
                    <li key={`${i.name}-${idx}`} className="tabular flex justify-between gap-2">
                      <span>
                        {i.name} {i.amount}
                      </span>
                      <span className="text-[var(--text-muted)]">¥{i.yen}</span>
                    </li>
                  ))}
                </ul>
                <ol className="mt-2 list-decimal space-y-0.5 pl-4 text-[var(--text-body)]">
                  {t.steps.map((s) => (
                    <li key={s}>{s}</li>
                  ))}
                </ol>
              </details>
            </li>
          );
        })}
      </ul>
      <p className="mt-3 text-xs text-[var(--text-muted)]">カロリー・PFC・値段は一般的な食品の値から出した目安です。</p>
    </Card>
  );
}

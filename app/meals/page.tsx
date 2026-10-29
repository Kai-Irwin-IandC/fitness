"use client";
import { useState } from "react";
import { Trash2 } from "lucide-react";
import { newId, update, useAppData } from "@/lib/store";
import { kcalFromMacros, macroTargets, sumNutrients } from "@/lib/calc";
import { dateKey, timeKey } from "@/lib/date";
import type { Meal } from "@/lib/types";
import { Card, Loading, SetupNotice } from "@/components/ui";
import { MacroSummary } from "@/components/macro-summary";
import { MealTemplatesCard } from "@/components/meal-templates-card";

type Form = { kcal: string; protein: string; fat: string; carbs: string };
const EMPTY: Form = { kcal: "", protein: "", fat: "", carbs: "" };

export default function MealsPage() {
  const data = useAppData();
  const today = dateKey();
  if (!data) return <Loading />;

  const todayMeals = data.meals.filter((m) => m.date === today).sort((a, b) => a.time.localeCompare(b.time));
  const eaten = sumNutrients(todayMeals);
  // targets need the profile; logging does not, so the rest of the page works before setup
  const target = macroTargets(data, today);

  return (
    <div className="space-y-4">
      {target ? (
        <Card title="今日の PFC">
          <MacroSummary eaten={eaten} target={target} />
        </Card>
      ) : (
        <SetupNotice />
      )}
      <MealTemplatesCard
        today={today}
        remaining={
          target
            ? { kcal: target.kcal - eaten.kcal, protein: target.protein - eaten.protein, fat: target.fat - eaten.fat, carbs: target.carbs - eaten.carbs }
            : null
        }
      />
      <EntryCard today={today} />
      <Card title="今日の記録">
        {todayMeals.length ? (
          <ul className="divide-y divide-[var(--border-soft)]">
            {todayMeals.map((m) => (
              <MealRow key={m.id} meal={m} />
            ))}
          </ul>
        ) : (
          <p className="text-sm text-[var(--text-muted)]">まだ記録がありません。</p>
        )}
      </Card>
    </div>
  );
}

function EntryCard({ today }: { today: string }) {
  const [form, setForm] = useState<Form>(EMPTY);
  const n = (v: string) => Number(v) || 0;
  const autoKcal = kcalFromMacros(n(form.protein), n(form.fat), n(form.carbs));
  const kcal = form.kcal ? n(form.kcal) : autoKcal;
  const canSave = kcal > 0;

  const save = (e: React.FormEvent) => {
    e.preventDefault();
    if (!canSave) return;
    const meal: Meal = { id: newId(), date: today, time: timeKey(), kcal, protein: n(form.protein), fat: n(form.fat), carbs: n(form.carbs) };
    update((d) => ({ ...d, meals: [...d.meals, meal] }));
    setForm(EMPTY);
  };

  const field = (key: keyof Form, label: string, unit: string, placeholder = "0") => (
    <label>
      <span className="ui-label">{label}</span>
      <span className="relative block">
        <input
          className="ui-input tabular pr-12 text-lg font-semibold"
          inputMode="decimal"
          placeholder={placeholder}
          value={form[key]}
          onChange={(e) => setForm({ ...form, [key]: e.target.value })}
        />
        <span className="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 text-xs text-[var(--text-muted)]">{unit}</span>
      </span>
    </label>
  );

  return (
    <Card title="数字で追加">
      <form onSubmit={save}>
        <div className="grid grid-cols-3 gap-2">
          {field("protein", "P たんぱく質", "g")}
          {field("fat", "F 脂質", "g")}
          {field("carbs", "C 炭水化物", "g")}
        </div>
        <div className="mt-3">{field("kcal", "カロリー（空欄なら PFC から計算）", "kcal", autoKcal ? String(autoKcal) : "0")}</div>
        <button type="submit" className="ui-button mt-3 h-12 w-full" disabled={!canSave}>
          {kcal > 0 ? `${Math.round(kcal)}kcal を追加` : "追加"}
        </button>
      </form>
    </Card>
  );
}

function MealRow({ meal }: { meal: Meal }) {
  return (
    <li className="flex items-center justify-between gap-2 py-2">
      <p className="tabular text-sm text-[var(--text-body)]">
        <span className="mr-3 text-xs text-[var(--text-muted)]">{meal.time}</span>
        {meal.name ? <span className="mr-2 font-semibold text-[var(--text-title)]">{meal.name}</span> : null}
        <strong className="text-[var(--text-title)]">{Math.round(meal.kcal)}kcal</strong>
        <span className="ml-2 text-xs">
          P{Math.round(meal.protein)} F{Math.round(meal.fat)} C{Math.round(meal.carbs)}
        </span>
      </p>
      <button
        type="button"
        aria-label="この記録を削除"
        className="ui-icon-button h-9 w-9 shrink-0"
        onClick={() => update((d) => ({ ...d, meals: d.meals.filter((m) => m.id !== meal.id) }))}
      >
        <Trash2 size={16} />
      </button>
    </li>
  );
}

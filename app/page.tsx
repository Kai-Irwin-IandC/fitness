"use client";
import { useEffect, useState } from "react";
import Link from "next/link";
import { Moon } from "lucide-react";
import { update, useAppData } from "@/lib/store";
import { calorieTarget, dailyGoals, dayReport, macroTargets, sleepStats, sumNutrients, weeklyAdjustment, type Goal } from "@/lib/calc";
import { dateKey, weekStart } from "@/lib/date";
import type { AppData, SleepEntry } from "@/lib/types";
import { Card, Loading, SetupNotice, StatusChip } from "@/components/ui";
import { MacroSummary } from "@/components/macro-summary";

const GOAL_HREF: Record<Goal["key"], string> = { weight: "/weight", sleep: "#sleep", food: "/meals", muscle: "/gym" };

export default function TodayPage() {
  const data = useAppData();
  const today = dateKey();

  useEffect(() => {
    if (!data) return;
    const adj = weeklyAdjustment(data, today);
    if (adj) update((d) => ({ ...d, calorieAdjustments: [...d.calorieAdjustments, adj] }));
  }, [data, today]);

  if (!data) return <Loading />;
  if (!data.profile) return <SetupNotice />;

  const goals = dailyGoals(data, today);
  const target = calorieTarget(data, today);
  const eaten = sumNutrients(data.meals.filter((m) => m.date === today));
  const macros = macroTargets(data, today);
  const report = dayReport(data, today);
  const thisWeekAdj = data.calorieAdjustments.find((a) => a.weekStart === weekStart(today));

  return (
    <div className="space-y-4">
      <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
        {goals.map((g) => (
          <Link key={g.key} href={GOAL_HREF[g.key]} className="glass-panel block rounded-xl p-3 transition hover:border-[var(--accent)]">
            <div className="flex items-center justify-between gap-1">
              <p className="ui-title text-sm">{g.label}</p>
              <StatusChip state={g.state} />
            </div>
            <p className="tabular mt-2 text-xs leading-snug text-[var(--text-body)]">{g.detail}</p>
          </Link>
        ))}
      </div>

      <Card
        title="今日の食事"
        action={
          <Link href="/meals" className="text-sm font-semibold text-[var(--accent-strong)]">
            記録する
          </Link>
        }
      >
        {target && macros ? (
          <div className="space-y-3">
            <MacroSummary eaten={eaten} target={macros} />
            <p className="text-xs text-[var(--text-muted)]">
              目標 {target.kcal}kcal = 消費 {target.tdee} − 減量分 {target.deficit}
              {target.adjustment ? `（週ごとの調整 ${target.adjustment > 0 ? "+" : ""}${target.adjustment}）` : ""}
            </p>
            {thisWeekAdj ? (
              <p className="rounded-lg bg-[var(--accent-soft)] px-3 py-2 text-xs text-[var(--text-active)]">
                今週は {thisWeekAdj.deltaKcal > 0 ? "+" : ""}
                {thisWeekAdj.deltaKcal}kcal 調整しました：{thisWeekAdj.reason}
              </p>
            ) : null}
          </div>
        ) : null}
      </Card>

      <div id="sleep" className="scroll-mt-20">
        <SleepCard data={data} today={today} />
      </div>

      {report ? (
        <Card title="今日のまとめ">
          <ul className="space-y-1 text-sm text-[var(--text-body)]">
            {report.lines.map((l) => (
              <li key={l}>{l}</li>
            ))}
          </ul>
          <p className="mt-3 rounded-lg bg-[var(--accent-soft)] px-3 py-2 text-sm font-semibold text-[var(--text-active)]">
            明日やること：{report.tomorrow}
          </p>
        </Card>
      ) : null}
    </div>
  );
}

function SleepCard({ data, today }: { data: AppData; today: string }) {
  const existing = data.sleeps.find((s) => s.date === today);
  const last = [...data.sleeps].sort((a, b) => b.date.localeCompare(a.date))[0];
  const [form, setForm] = useState<SleepEntry>(
    existing ??
      (last
        ? { ...last, date: today }
        : { date: today, inBed: "23:30", asleep: "23:45", awakenings: 0, awakeMinutes: 0, wake: "06:30", outOfBed: "06:45", quality: 3 }),
  );
  const stats = sleepStats(form);
  const set = <K extends keyof SleepEntry>(key: K, v: SleepEntry[K]) => setForm((f) => ({ ...f, [key]: v }));
  const save = () => update((d) => ({ ...d, sleeps: [...d.sleeps.filter((s) => s.date !== today), { ...form, date: today }] }));

  const time = (key: "inBed" | "asleep" | "wake" | "outOfBed", label: string) => (
    <label>
      <span className="ui-label">{label}</span>
      <input type="time" className="ui-input tabular" value={form[key]} onChange={(e) => set(key, e.target.value)} />
    </label>
  );

  return (
    <Card title={<span className="inline-flex items-center gap-2"><Moon size={16} />昨夜の睡眠</span>}>
      <p className="mb-3 text-xs text-[var(--text-muted)]">前日の値が入っています。違うところだけ直してください。</p>
      <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
        {time("inBed", "布団に入った")}
        {time("asleep", "眠りについた")}
        {time("wake", "目が覚めた")}
        {time("outOfBed", "布団を出た")}
        <label>
          <span className="ui-label">夜中に起きた回数</span>
          <input type="number" min={0} className="ui-input tabular" value={form.awakenings} onChange={(e) => set("awakenings", Number(e.target.value))} />
        </label>
        <label>
          <span className="ui-label">起きていた合計（分）</span>
          <input type="number" min={0} className="ui-input tabular" value={form.awakeMinutes} onChange={(e) => set("awakeMinutes", Number(e.target.value))} />
        </label>
        <div className="col-span-2">
          <span className="ui-label">眠りの質</span>
          <div className="grid grid-cols-5 gap-1.5">
            {[1, 2, 3, 4, 5].map((q) => (
              <button
                key={q}
                type="button"
                aria-pressed={form.quality === q}
                onClick={() => set("quality", q)}
                className={`min-h-11 rounded-lg border text-sm font-semibold ${
                  form.quality === q
                    ? "border-[var(--accent-strong)] bg-[var(--accent-soft)] text-[var(--text-active)]"
                    : "border-[var(--border-control)] bg-[var(--surface-control)] text-[var(--text-muted)]"
                }`}
              >
                {q}
              </button>
            ))}
          </div>
        </div>
      </div>
      <div className="mt-3 flex flex-wrap items-center justify-between gap-2">
        <p className="tabular text-sm text-[var(--text-body)]">
          睡眠 <strong>{stats.hours.toFixed(1)}</strong> 時間・睡眠効率 <strong>{Math.round(stats.efficiency * 100)}%</strong>
          <span className="ml-1 text-xs text-[var(--text-muted)]">（85% 以上が目安）</span>
        </p>
        <button type="button" className="ui-button" onClick={save}>
          {existing ? "更新" : "記録"}
        </button>
      </div>
      <p className="mt-3 text-xs text-[var(--text-muted)]">
        いびきを指摘される・日中に強い眠気がある場合は、記録で直そうとせず睡眠外来に相談してください。
      </p>
    </Card>
  );
}

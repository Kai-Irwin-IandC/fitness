"use client";
import { useState } from "react";
import { useAppData } from "@/lib/store";
import { e1rm, sessionsFor, sleepStats } from "@/lib/calc";
import { formatEntry, isCardio } from "@/lib/exercises";
import { addDays, dateKey } from "@/lib/date";
import type { AppData } from "@/lib/types";
import { Card, Loading, SetupNotice } from "@/components/ui";
import { LineChart } from "@/components/charts/line-chart";
import { DayBarChart } from "@/components/charts/bar-chart";

const RANGES = [
  { days: 30, label: "30日" },
  { days: 90, label: "90日" },
  { days: 365, label: "1年" },
];

export default function TrendsPage() {
  const data = useAppData();
  const [range, setRange] = useState(30);
  if (!data) return <Loading />;
  if (!data.profile) return <SetupNotice />;

  const today = dateKey();
  const from = addDays(today, -(range - 1));

  return (
    <div className="space-y-4">
      <div className="flex gap-1 rounded-xl bg-[var(--accent-soft)] p-1 sm:w-fit">
        {RANGES.map((r) => (
          <button
            key={r.days}
            type="button"
            aria-pressed={range === r.days}
            onClick={() => setRange(r.days)}
            className={`min-h-10 flex-1 rounded-lg px-4 text-sm font-semibold sm:flex-none ${
              range === r.days ? "bg-white text-[var(--text-active)] shadow-sm" : "text-[var(--text-muted)]"
            }`}
          >
            {r.label}
          </button>
        ))}
      </div>
      <StrengthTrend data={data} from={from} today={today} />
      <SleepTrend data={data} from={from} />
    </div>
  );
}

function DataTable({ head, rows }: { head: string[]; rows: (string | number)[][] }) {
  if (!rows.length) return null;
  return (
    <details className="mt-3 text-sm">
      <summary className="cursor-pointer text-xs font-semibold text-[var(--text-nav)]">表で見る</summary>
      <div className="mt-2 max-h-64 overflow-auto">
        <table className="tabular w-full text-left text-xs">
          <thead>
            <tr className="text-[var(--text-muted)]">
              {head.map((h) => (
                <th key={h} className="py-1 pr-3 font-semibold">
                  {h}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {rows.map((r, i) => (
              <tr key={i} className="border-t border-[var(--border-soft)]">
                {r.map((c, j) => (
                  <td key={j} className="py-1 pr-3">
                    {c}
                  </td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </details>
  );
}

function StrengthTrend({ data, from, today }: { data: AppData; from: string; today: string }) {
  const trained = data.exercises.filter((e) => data.sets.some((s) => s.exerciseId === e.id));
  const [exerciseId, setExerciseId] = useState(trained[0]?.id ?? "");
  const exercise = trained.find((e) => e.id === exerciseId) ?? trained[0];
  if (!exercise) {
    return (
      <Card title="筋力">
        <p className="text-sm text-[var(--text-muted)]">ジムで記録すると、種目ごとの伸びがここに出ます。</p>
      </Card>
    );
  }
  const cardio = isCardio(exercise);
  const repsOnly = !cardio && data.sets.filter((s) => s.exerciseId === exercise.id).every((s) => s.weight === 0);
  const metric = cardio ? "時間" : repsOnly ? (exercise.timed ? "最長秒数" : "最高回数") : "推定 1RM";
  const unit = cardio ? "分" : repsOnly ? (exercise.timed ? "秒" : "回") : "kg";
  const sessions = sessionsFor(data.sets, exercise.id)
    .filter((s) => s.date >= from)
    .reverse()
    .map((s) => ({
      date: s.date,
      // bodyweight sets without added load have no 1RM, so track the best rep count instead
      best: cardio
        ? s.sets.reduce((m, x) => m + (x.minutes ?? 0), 0)
        : Math.max(...s.sets.map((x) => (repsOnly ? x.reps : e1rm(x.weight, x.reps)))),
      volume: s.sets.reduce((v, x) => v + x.weight * x.reps, 0),
      sets: s.sets,
    }));
  return (
    <Card
      title={`種目の伸び（${metric}）`}
      action={
        <select className="ui-input w-44 max-w-[55%] py-1.5" value={exercise.id} onChange={(e) => setExerciseId(e.target.value)} aria-label="種目">
          {trained.map((e) => (
            <option key={e.id} value={e.id}>
              {e.name}
            </option>
          ))}
        </select>
      }
    >
      <LineChart
        series={[{ key: "best", label: metric, color: "var(--series-1)", kind: "line", points: sessions.map((s) => ({ date: s.date, value: s.best })) }]}
        unit={unit}
        digits={unit === "kg" ? 1 : 0}
        from={from}
        to={today}
        ariaLabel={`${exercise.name}の${metric}の推移`}
      />
      <DataTable
        head={["日付", metric, "総挙上量", "セット"]}
        rows={[...sessions].reverse().map((s) => [s.date, s.best.toFixed(unit === "kg" ? 1 : 0), Math.round(s.volume), s.sets.map((x) => formatEntry(exercise, x)).join(" ")])}
      />
    </Card>
  );
}

function SleepTrend({ data, from }: { data: AppData; from: string }) {
  const profile = data.profile!;
  const entries = [...data.sleeps].filter((s) => s.date >= from).sort((a, b) => a.date.localeCompare(b.date));
  const stats = entries.map((s) => ({ s, st: sleepStats(s) }));
  const avgHours = stats.length ? stats.reduce((t, x) => t + x.st.hours, 0) / stats.length : null;
  const avgEff = stats.length ? stats.reduce((t, x) => t + x.st.efficiency, 0) / stats.length : null;
  return (
    <Card title="睡眠">
      {avgHours !== null && avgEff !== null ? (
        <div className="mb-3 grid grid-cols-2 gap-2 text-center">
          <Stat label="平均睡眠" value={`${avgHours.toFixed(1)}時間`} />
          <Stat label="平均睡眠効率" value={`${Math.round(avgEff * 100)}%`} />
        </div>
      ) : null}
      <DayBarChart
        bars={stats.map(({ s, st }) => ({ date: s.date, value: st.hours, detail: `効率 ${Math.round(st.efficiency * 100)}%・質 ${s.quality}` }))}
        reference={{ value: profile.sleepTargetHours, label: `目標 ${profile.sleepTargetHours}時間` }}
        unit="時間"
        ariaLabel="睡眠時間の推移"
      />
      <DataTable
        head={["日付", "睡眠", "効率", "質", "布団"]}
        rows={[...stats].reverse().map(({ s, st }) => [s.date, `${st.hours.toFixed(1)}h`, `${Math.round(st.efficiency * 100)}%`, s.quality, `${s.inBed}–${s.outOfBed}`])}
      />
    </Card>
  );
}

function Stat({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-lg bg-[var(--surface-control)] px-2 py-2">
      <p className="text-[11px] font-semibold text-[var(--text-muted)]">{label}</p>
      <p className="tabular text-sm font-bold text-[var(--text-title)]">{value}</p>
    </div>
  );
}

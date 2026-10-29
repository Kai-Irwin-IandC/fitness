"use client";
import { useState } from "react";
import { Minus, Plus, Trash2 } from "lucide-react";
import { update, useAppData } from "@/lib/store";
import { avg7, latestWeight, sortedWeights } from "@/lib/calc";
import { addDays, dateKey, formatShort } from "@/lib/date";
import type { AppData } from "@/lib/types";
import { Card, Loading } from "@/components/ui";
import { LineChart, type Series } from "@/components/charts/line-chart";

const RANGES = [
  { days: 30, label: "30日" },
  { days: 90, label: "90日" },
  { days: 365, label: "1年" },
];

export default function WeightPage() {
  const data = useAppData();
  if (!data) return <Loading />;
  return (
    <div className="space-y-4">
      <EntryCard data={data} />
      <TrendCard data={data} />
      <HistoryCard data={data} />
    </div>
  );
}

function EntryCard({ data }: { data: AppData }) {
  const today = dateKey();
  const [date, setDate] = useState(today);
  const existing = data.weights.find((w) => w.date === date);
  const [kg, setKg] = useState(existing?.kg ?? latestWeight(data.weights) ?? data.profile?.startWeightKg ?? 70);
  const [saved, setSaved] = useState(false);
  const step = (d: number) => {
    setKg((v) => Math.round((v + d) * 10) / 10);
    setSaved(false);
  };

  const save = () => {
    if (!(kg >= 20 && kg <= 300)) return;
    update((d) => ({ ...d, weights: [...d.weights.filter((w) => w.date !== date), { date, kg }] }));
    setSaved(true);
  };

  return (
    <Card>
      <div className="mb-3 flex items-center justify-between gap-2">
        <h2 className="ui-title text-base">体重を記録</h2>
        <input
          type="date"
          className="ui-input tabular w-auto py-1.5"
          value={date}
          max={today}
          onChange={(e) => {
            setDate(e.target.value);
            const w = data.weights.find((x) => x.date === e.target.value);
            if (w) setKg(w.kg);
            setSaved(false);
          }}
          aria-label="日付"
        />
      </div>
      <div className="flex items-center justify-center gap-3">
        <button type="button" aria-label="0.1kg 減らす" className="ui-icon-button h-14 w-14 shrink-0" onClick={() => step(-0.1)}>
          <Minus size={22} />
        </button>
        <label className="relative">
          <input
            className="ui-input tabular h-20 w-44 text-center text-4xl font-bold"
            inputMode="decimal"
            value={kg}
            onChange={(e) => {
              const n = Number(e.target.value);
              if (!Number.isNaN(n)) setKg(n);
              setSaved(false);
            }}
            aria-label="体重 (kg)"
          />
          <span className="pointer-events-none absolute bottom-3 right-3 text-sm text-[var(--text-muted)]">kg</span>
        </label>
        <button type="button" aria-label="0.1kg 増やす" className="ui-icon-button h-14 w-14 shrink-0" onClick={() => step(0.1)}>
          <Plus size={22} />
        </button>
      </div>
      <button type="button" className="ui-button mt-4 h-14 w-full text-base" onClick={save}>
        {saved ? "記録しました" : existing ? "更新する" : "記録する"}
      </button>
    </Card>
  );
}

function TrendCard({ data }: { data: AppData }) {
  const [range, setRange] = useState(30);
  const today = dateKey();
  const from = addDays(today, -(range - 1));
  const weights = sortedWeights(data.weights).filter((w) => w.date >= from);
  const averages = weights
    .map((w) => ({ date: w.date, value: avg7(data.weights, w.date) }))
    .filter((p): p is { date: string; value: number } => p.value !== null);
  const series: Series[] = [
    { key: "daily", label: "毎朝の体重", color: "var(--chart-dot)", kind: "dots", points: weights.map((w) => ({ date: w.date, value: w.kg })) },
    { key: "avg", label: "7 日平均", color: "var(--series-1)", kind: "line", points: averages },
  ];

  const all = sortedWeights(data.weights);
  const nowAvg = avg7(data.weights, today) ?? latestWeight(data.weights);
  const first = all[0]?.kg ?? null;
  const target = data.profile?.targetWeightKg ?? null;

  return (
    <Card
      title="推移"
      action={
        <div className="flex gap-1 rounded-lg bg-[var(--accent-soft)] p-0.5">
          {RANGES.map((r) => (
            <button
              key={r.days}
              type="button"
              aria-pressed={range === r.days}
              onClick={() => setRange(r.days)}
              className={`min-h-9 rounded-md px-3 text-xs font-semibold ${range === r.days ? "bg-white text-[var(--text-active)] shadow-sm" : "text-[var(--text-muted)]"}`}
            >
              {r.label}
            </button>
          ))}
        </div>
      }
    >
      {nowAvg !== null ? (
        <div className="mb-3 grid grid-cols-3 gap-2 text-center">
          <Stat label="いま（7日平均）" value={`${nowAvg.toFixed(1)}kg`} />
          <Stat label="始めてから" value={first !== null ? `${nowAvg - first >= 0 ? "+" : ""}${(nowAvg - first).toFixed(1)}kg` : "—"} />
          <Stat label="目標まで" value={target !== null ? `${Math.max(0, nowAvg - target).toFixed(1)}kg` : "—"} />
        </div>
      ) : null}
      <LineChart series={series} unit="kg" from={from} to={today} ariaLabel="体重の推移" />
    </Card>
  );
}

function HistoryCard({ data }: { data: AppData }) {
  const [limit, setLimit] = useState(14);
  const all = sortedWeights(data.weights).reverse();
  const list = all.slice(0, limit);
  if (!list.length) return null;
  return (
    <Card title="記録">
      <ul className="divide-y divide-[var(--border-soft)]">
        {list.map((w, i) => {
          const prev = all[i + 1];
          const diff = prev ? w.kg - prev.kg : null;
          return (
            <li key={w.date} className="flex items-center justify-between gap-2 py-2 text-sm">
              <span className="tabular w-14 text-[var(--text-muted)]">{formatShort(w.date)}</span>
              <span className="tabular flex-1 font-semibold text-[var(--text-title)]">{w.kg.toFixed(1)}kg</span>
              <span className="tabular w-16 text-right text-xs text-[var(--text-muted)]">
                {diff === null ? "" : `${diff >= 0 ? "+" : ""}${diff.toFixed(1)}`}
              </span>
              <button
                type="button"
                aria-label={`${formatShort(w.date)} の記録を削除`}
                className="ui-icon-button h-9 w-9"
                onClick={() => update((d) => ({ ...d, weights: d.weights.filter((x) => x.date !== w.date) }))}
              >
                <Trash2 size={14} />
              </button>
            </li>
          );
        })}
      </ul>
      {all.length > limit ? (
        <button type="button" className="ui-button-secondary mt-3 w-full" onClick={() => setLimit((l) => l + 30)}>
          もっと見る（残り {all.length - limit} 件）
        </button>
      ) : null}
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

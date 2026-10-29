"use client";
import { useState } from "react";
import { Footprints } from "lucide-react";
import { update, useRemoteRevision } from "@/lib/store";
import { KCAL_PER_KG, dailyExpenditure } from "@/lib/calc";
import { addDays } from "@/lib/date";
import type { AppData } from "@/lib/types";
import { Card } from "@/components/ui";

const n = (v: number) => Math.round(v).toLocaleString();

/** Steps entry plus today's burn (BMR + walking + gym + digestion) against what was eaten. */
export function EnergyCard({ data, today }: { data: AppData; today: string }) {
  const [day, setDay] = useState(today);
  const revision = useRemoteRevision();
  const ex = dailyExpenditure(data, day);
  if (!ex) return null;

  const rows: { label: string; detail?: string; kcal: number }[] = [
    { label: "基礎代謝", kcal: ex.bmr },
    { label: "歩いた分", detail: ex.steps === null ? "歩数未入力" : `${n(ex.steps)} 歩`, kcal: ex.stepsKcal },
    { label: "筋トレ", detail: ex.strengthSets ? `${ex.strengthSets} セット・約 ${ex.strengthMinutes} 分` : "なし", kcal: ex.strengthKcal },
    { label: "有酸素", detail: ex.cardioMinutes ? `${ex.cardioMinutes} 分` : "なし", kcal: ex.cardioKcal },
    { label: "食事の消化", detail: "食べた量の約 10%", kcal: ex.tef },
  ];
  const deficit = ex.balance < 0;

  return (
    <Card
      title={day === today ? "今日の消費と収支" : "昨日の消費と収支"}
      action={
        <div className="flex gap-1 rounded-lg bg-[var(--accent-soft)] p-0.5">
          {[
            { key: today, label: "今日" },
            { key: addDays(today, -1), label: "昨日" },
          ].map((d) => (
            <button
              key={d.key}
              type="button"
              aria-pressed={day === d.key}
              onClick={() => setDay(d.key)}
              className={`min-h-9 rounded-md px-3 text-xs font-semibold ${day === d.key ? "bg-white text-[var(--text-active)] shadow-sm" : "text-[var(--text-muted)]"}`}
            >
              {d.label}
            </button>
          ))}
        </div>
      }
    >
      <StepsForm key={`${day}-${revision}`} data={data} day={day} />

      <div className="mt-4 grid gap-4 lg:grid-cols-[1fr_1.2fr]">
        <div className="rounded-xl bg-[var(--surface-control)] p-4 text-center">
          <p className="text-xs font-semibold text-[var(--text-muted)]">収支（食べた − 消費）</p>
          {ex.hasMeals ? (
            <>
              <p className="tabular mt-1 text-4xl font-bold" style={{ color: deficit ? "var(--status-good)" : "var(--status-warn)" }}>
                {ex.balance > 0 ? "+" : "−"}
                {n(Math.abs(ex.balance))}
                <span className="ml-1 text-base font-semibold">kcal</span>
              </p>
              <p className="mt-1 text-xs text-[var(--text-body)]">
                {deficit ? `脂肪 約 ${(Math.abs(ex.balance) / KCAL_PER_KG).toFixed(2)}kg 分のマイナス` : "消費より多く食べています"}
              </p>
            </>
          ) : (
            <p className="mt-2 text-sm text-[var(--text-muted)]">食事を記録すると出ます</p>
          )}
          <p className="tabular mt-3 text-xs text-[var(--text-muted)]">
            食べた {n(ex.intake)}kcal ／ 消費 {n(ex.total)}kcal
          </p>
        </div>

        <table className="tabular w-full text-sm">
          <tbody>
            {rows.map((r) => (
              <tr key={r.label} className="border-b border-[var(--border-soft)]">
                <td className="py-1.5 text-[var(--text-body)]">
                  {r.label}
                  {r.detail ? <span className="ml-2 text-xs text-[var(--text-muted)]">{r.detail}</span> : null}
                </td>
                <td className="py-1.5 text-right">{n(r.kcal)}</td>
              </tr>
            ))}
            <tr>
              <td className="pt-2 font-bold text-[var(--text-title)]">消費の合計</td>
              <td className="pt-2 text-right font-bold text-[var(--text-title)]">{n(ex.total)}kcal</td>
            </tr>
          </tbody>
        </table>
      </div>
      <p className="mt-3 text-xs text-[var(--text-muted)]">
        すべて目安です。歩数・運動は基礎代謝に上乗せされる分だけを足しています（筋トレは 1 セット＝休憩込み 3 分で計算）。
      </p>
    </Card>
  );
}

function StepsForm({ data, day }: { data: AppData; day: string }) {
  const existing = data.steps.find((s) => s.date === day);
  const [value, setValue] = useState(existing ? String(existing.count) : "");
  const [saved, setSaved] = useState(false);
  const save = (e: React.FormEvent) => {
    e.preventDefault();
    const count = Math.round(Number(value.replace(/[,，]/g, "")));
    if (!Number.isFinite(count) || count < 0 || count > 100000) return;
    update((d) => ({ ...d, steps: [...d.steps.filter((s) => s.date !== day), { date: day, count }] }));
    setSaved(true);
  };
  return (
    <form className="flex items-end gap-2" onSubmit={save}>
      <label className="flex-1">
        <span className="ui-label inline-flex items-center gap-1">
          <Footprints size={12} />
          歩数（iPhone のヘルスケアの数字）
        </span>
        <span className="relative block">
          <input
            className="ui-input tabular pr-10 text-lg font-semibold"
            inputMode="numeric"
            placeholder="0"
            value={value}
            onChange={(e) => {
              setValue(e.target.value);
              setSaved(false);
            }}
            aria-label="歩数"
          />
          <span className="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 text-xs text-[var(--text-muted)]">歩</span>
        </span>
      </label>
      <button type="submit" className="ui-button shrink-0">
        {saved ? "記録済み" : existing ? "更新" : "記録"}
      </button>
    </form>
  );
}

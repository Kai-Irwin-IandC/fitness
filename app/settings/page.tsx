"use client";
import { useState } from "react";
import { Download, Plus, Trash2, Upload } from "lucide-react";
import { exportJson, importJson, newId, resetAll, update, useAppData } from "@/lib/store";
import { addDays, dateKey } from "@/lib/date";
import type { AppData, Category, Equipment, Exercise, Profile } from "@/lib/types";
import { CATEGORIES, EQUIPMENT_LABEL } from "@/lib/exercises";
import { Card, Loading } from "@/components/ui";

const ACTIVITY = [
  { value: 1.2, label: "ほぼ座り仕事・運動なし" },
  { value: 1.375, label: "週 1〜3 回運動" },
  { value: 1.55, label: "週 3〜5 回運動" },
  { value: 1.725, label: "ほぼ毎日ハードに運動" },
];

export default function SettingsPage() {
  const data = useAppData();
  if (!data) return <Loading />;
  return (
    <div className="space-y-4">
      <ProfileCard key={data.profile ? "edit" : "new"} data={data} />
      <ExercisesCard data={data} />
      <BackupCard />
    </div>
  );
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <label className="block">
      <span className="ui-label">{label}</span>
      {children}
    </label>
  );
}

function ProfileCard({ data }: { data: AppData }) {
  const [p, setP] = useState<Profile>(
    data.profile ?? {
      sex: "male",
      birthYear: 1990,
      heightCm: 175,
      startWeightKg: 80,
      targetWeightKg: 72,
      targetDate: addDays(dateKey(), 120),
      activity: 1.375,
      proteinPerKg: 2,
      sleepTargetHours: 7.5,
      restSeconds: 90,
    },
  );
  const [saved, setSaved] = useState(false);
  const num = (key: keyof Profile) => (e: React.ChangeEvent<HTMLInputElement>) => setP({ ...p, [key]: Number(e.target.value) });

  const save = (e: React.FormEvent) => {
    e.preventDefault();
    update((d) => ({
      ...d,
      profile: p,
      // the first save seeds the weight line with the starting weight
      weights: d.weights.length ? d.weights : [{ date: dateKey(), kg: p.startWeightKg }],
    }));
    setSaved(true);
  };

  return (
    <Card title="自分と目標">
      <form className="grid grid-cols-2 gap-3 lg:grid-cols-4" onSubmit={save}>
        <Field label="性別">
          <select className="ui-input" value={p.sex} onChange={(e) => setP({ ...p, sex: e.target.value as Profile["sex"] })}>
            <option value="male">男性</option>
            <option value="female">女性</option>
          </select>
        </Field>
        <Field label="生まれ年">
          <input className="ui-input tabular" inputMode="numeric" value={p.birthYear} onChange={num("birthYear")} />
        </Field>
        <Field label="身長 (cm)">
          <input className="ui-input tabular" inputMode="decimal" value={p.heightCm} onChange={num("heightCm")} />
        </Field>
        <Field label="開始時の体重 (kg)">
          <input className="ui-input tabular" inputMode="decimal" value={p.startWeightKg} onChange={num("startWeightKg")} />
        </Field>
        <Field label="目標体重 (kg)">
          <input className="ui-input tabular" inputMode="decimal" value={p.targetWeightKg} onChange={num("targetWeightKg")} />
        </Field>
        <Field label="期限">
          <input type="date" className="ui-input tabular" value={p.targetDate} onChange={(e) => setP({ ...p, targetDate: e.target.value })} />
        </Field>
        <div className="col-span-2">
          <Field label="活動量">
            <select className="ui-input" value={p.activity} onChange={(e) => setP({ ...p, activity: Number(e.target.value) })}>
              {ACTIVITY.map((a) => (
                <option key={a.value} value={a.value}>
                  {a.label}
                </option>
              ))}
            </select>
          </Field>
        </div>
        <Field label="たんぱく質 (g / 体重 kg)">
          <input className="ui-input tabular" inputMode="decimal" value={p.proteinPerKg} onChange={num("proteinPerKg")} />
        </Field>
        <Field label="睡眠の目標 (時間)">
          <input className="ui-input tabular" inputMode="decimal" value={p.sleepTargetHours} onChange={num("sleepTargetHours")} />
        </Field>
        <Field label="セット間の休憩 (秒)">
          <input className="ui-input tabular" inputMode="numeric" value={p.restSeconds} onChange={num("restSeconds")} />
        </Field>
        <div className="col-span-2 flex items-end gap-3 lg:col-span-4">
          <button type="submit" className="ui-button">
            保存
          </button>
          {saved ? <span className="text-sm text-[var(--status-good)]">保存しました</span> : null}
        </div>
      </form>
      <p className="mt-3 text-xs text-[var(--text-muted)]">
        減量ペースは筋肉を残しやすい「体重の 0.25〜1%/週」の範囲に収めます。たんぱく質は筋肉を残すため 1.6〜2.2g/kg が目安です。
      </p>
    </Card>
  );
}

function ExercisesCard({ data }: { data: AppData }) {
  const patch = (id: string, change: Partial<Exercise>) =>
    update((d) => ({ ...d, exercises: d.exercises.map((e) => (e.id === id ? { ...e, ...change } : e)) }));
  const [cat, setCat] = useState<Category>("chest");
  const list = data.exercises.filter((e) => e.category === cat);
  return (
    <Card
      title="種目"
      action={
        <button
          type="button"
          className="ui-button-secondary inline-flex items-center gap-1 px-3"
          onClick={() =>
            update((d) => ({
              ...d,
              exercises: [
                ...d.exercises,
                { id: newId(), name: "新しい種目", aliases: [], category: cat, equipment: "machine", increment: 2.5, targetReps: 10, targetSets: 3 },
              ],
            }))
          }
        >
          <Plus size={16} />
          追加
        </button>
      }
    >
      <p className="mb-3 text-xs text-[var(--text-muted)]">
        全セットで目標回数を達成すると、次回は「上げ幅」だけ重くした目標が出ます。ダンベルが 1kg 刻みのジムなら上げ幅を 1 に。自重の種目は 0（回数を伸ばす）。
      </p>
      <div className="mb-3 flex gap-1 overflow-x-auto rounded-xl bg-[var(--accent-soft)] p-1">
        {CATEGORIES.map((c) => (
          <button
            key={c.key}
            type="button"
            aria-pressed={cat === c.key}
            onClick={() => setCat(c.key)}
            className={`min-h-10 shrink-0 rounded-lg px-3 text-sm font-semibold ${
              cat === c.key ? "bg-white text-[var(--text-active)] shadow-sm" : "text-[var(--text-muted)]"
            }`}
          >
            {c.label}
            <span className="ml-1 text-xs font-medium">{data.exercises.filter((e) => e.category === c.key).length}</span>
          </button>
        ))}
      </div>
      <ul className="space-y-3">
        {list.map((ex) => (
          <li key={ex.id} className="grid grid-cols-[1fr_auto] gap-2 rounded-lg bg-[var(--surface-control)] p-2">
            <input className="ui-input" value={ex.name} aria-label="種目名" onChange={(e) => patch(ex.id, { name: e.target.value })} />
            <button
              type="button"
              aria-label={`${ex.name}を削除`}
              className="ui-icon-button h-11 w-11"
              onClick={() => {
                if (confirm(`「${ex.name}」を削除しますか？（記録は残ります）`)) update((d) => ({ ...d, exercises: d.exercises.filter((e) => e.id !== ex.id) }));
              }}
            >
              <Trash2 size={16} />
            </button>
            <div className="col-span-2 grid grid-cols-2 gap-2 sm:grid-cols-5">
              <Field label="部位">
                <select className="ui-input" value={ex.category} onChange={(e) => patch(ex.id, { category: e.target.value as Category })}>
                  {CATEGORIES.map((c) => (
                    <option key={c.key} value={c.key}>
                      {c.label}
                    </option>
                  ))}
                </select>
              </Field>
              <Field label="器具">
                <select className="ui-input" value={ex.equipment} onChange={(e) => patch(ex.id, { equipment: e.target.value as Equipment })}>
                  {(Object.keys(EQUIPMENT_LABEL) as Equipment[]).map((k) => (
                    <option key={k} value={k}>
                      {EQUIPMENT_LABEL[k]}
                    </option>
                  ))}
                </select>
              </Field>
              <Field label="上げ幅 kg">
                <input className="ui-input tabular" inputMode="decimal" value={ex.increment} onChange={(e) => patch(ex.id, { increment: Number(e.target.value) || 0 })} />
              </Field>
              <Field label="目標回数">
                <input className="ui-input tabular" inputMode="numeric" value={ex.targetReps} onChange={(e) => patch(ex.id, { targetReps: Number(e.target.value) || 1 })} />
              </Field>
              <Field label="セット数">
                <input className="ui-input tabular" inputMode="numeric" value={ex.targetSets} onChange={(e) => patch(ex.id, { targetSets: Number(e.target.value) || 1 })} />
              </Field>
            </div>
          </li>
        ))}
        {!list.length ? <li className="text-sm text-[var(--text-muted)]">この部位の種目はありません。</li> : null}
      </ul>
    </Card>
  );
}

function BackupCard() {
  const [message, setMessage] = useState("");
  const download = () => {
    const blob = new Blob([exportJson()], { type: "application/json" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `kai-health-${dateKey()}.json`;
    a.click();
    URL.revokeObjectURL(url);
  };
  return (
    <Card title="データ">
      <p className="mb-3 text-xs text-[var(--text-muted)]">
        データはこの端末のブラウザだけに保存されます。iPhone と PC の間で移すときや、機種変更の前にバックアップを書き出してください。
      </p>
      <div className="flex flex-wrap gap-2">
        <button type="button" className="ui-button-secondary inline-flex items-center gap-2" onClick={download}>
          <Download size={16} />
          バックアップを書き出す
        </button>
        <label className="ui-button-secondary inline-flex cursor-pointer items-center gap-2">
          <Upload size={16} />
          バックアップを読み込む
          <input
            type="file"
            accept="application/json,.json"
            className="sr-only"
            onChange={async (e) => {
              const file = e.target.files?.[0];
              if (!file) return;
              if (!confirm("今の端末のデータを、このバックアップで置き換えますか？")) return;
              try {
                importJson(await file.text());
                setMessage("読み込みました");
              } catch (err) {
                setMessage(err instanceof Error ? err.message : "読み込めませんでした");
              }
            }}
          />
        </label>
        <button
          type="button"
          className="ui-button-secondary text-[var(--danger)]"
          onClick={() => {
            if (confirm("すべての記録を消去します。元に戻せません。よろしいですか？")) resetAll();
          }}
        >
          すべて消去
        </button>
      </div>
      {message ? <p className="mt-2 text-sm text-[var(--text-nav)]">{message}</p> : null}
    </Card>
  );
}

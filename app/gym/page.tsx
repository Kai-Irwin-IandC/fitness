"use client";
import { useEffect, useRef, useState } from "react";
import { Check, Timer, Trash2, X } from "lucide-react";
import { newId, update, useAppData } from "@/lib/store";
import { e1rm, nextSplitDay, nextTarget, parseSetShorthand, sessionsFor } from "@/lib/calc";
import { CATEGORIES, EQUIPMENT_LABEL, SPLITS } from "@/lib/exercises";
import { dateKey, formatShort } from "@/lib/date";
import type { AppData, Category, Exercise, SetEntry } from "@/lib/types";
import { Card, Loading, Stepper } from "@/components/ui";

const fmtSet = (weight: number, reps: number) => (weight === 0 ? `自重×${reps}` : `${weight}kg×${reps}`);

const chipClass = (active: boolean) =>
  `min-h-11 rounded-full border px-4 text-sm font-semibold ${
    active
      ? "border-[var(--accent-strong)] bg-[var(--accent)] text-white"
      : "border-[var(--border-control)] bg-[var(--surface-control)] text-[var(--text-nav)]"
  }`;

const tabClass = (active: boolean) =>
  `min-h-10 rounded-lg px-3 text-sm font-semibold transition ${
    active ? "bg-white text-[var(--text-active)] shadow-sm" : "text-[var(--text-muted)]"
  }`;

export default function GymPage() {
  const data = useAppData();
  const today = dateKey();
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [restUntil, setRestUntil] = useState<number | null>(null);
  const panelRef = useRef<HTMLDivElement>(null);

  if (!data) return <Loading />;

  const selected = data.exercises.find((e) => e.id === selectedId) ?? null;
  const restSeconds = data.profile?.restSeconds ?? 90;

  const select = (id: string) => {
    setSelectedId(id);
    requestAnimationFrame(() => panelRef.current?.scrollIntoView({ behavior: "smooth", block: "start" }));
  };

  const logSets = (exerciseId: string, weight: number, reps: number, count = 1) => {
    const base = Date.now();
    const entries: SetEntry[] = Array.from({ length: count }, (_, i) => ({
      id: newId(),
      date: today,
      exerciseId,
      weight,
      reps,
      at: new Date(base + i).toISOString(),
    }));
    update((d) => ({ ...d, sets: [...d.sets, ...entries] }));
    setRestUntil(Date.now() + restSeconds * 1000);
  };

  return (
    <div className="space-y-4">
      <TemplateCard data={data} today={today} selectedId={selectedId} onSelect={select} />

      <div ref={panelRef} className="scroll-mt-20">
        {selected ? <ExercisePanel key={selected.id} data={data} exercise={selected} today={today} onLog={logSets} /> : null}
      </div>

      <CategoryCard data={data} selectedId={selectedId} onSelect={select} />

      <ShorthandCard data={data} onLog={logSets} onSelect={select} />

      <TodaySession data={data} today={today} />

      {restUntil ? <RestTimer until={restUntil} onDone={() => setRestUntil(null)} /> : null}
    </div>
  );
}

function TemplateCard({
  data,
  today,
  selectedId,
  onSelect,
}: {
  data: AppData;
  today: string;
  selectedId: string | null;
  onSelect: (id: string) => void;
}) {
  const { split, index, trainedToday } = nextSplitDay(data, today);
  return (
    <Card title="メニューのテンプレート">
      <div className="-mx-1 mb-3 flex gap-2 overflow-x-auto px-1 pb-1">
        {SPLITS.map((s) => (
          <button
            key={s.id}
            type="button"
            aria-pressed={split.id === s.id}
            onClick={() => update((d) => ({ ...d, splitId: s.id }))}
            className={`${chipClass(split.id === s.id)} shrink-0`}
          >
            {s.name}
          </button>
        ))}
      </div>
      <p className="mb-3 text-xs text-[var(--text-muted)]">
        <span className="font-semibold text-[var(--text-nav)]">{split.frequency}</span>・{split.summary}
      </p>
      <SplitDays key={`${split.id}-${index}`} data={data} today={today} nextIndex={index} trainedToday={trainedToday} selectedId={selectedId} onSelect={onSelect} />
    </Card>
  );
}

function SplitDays({
  data,
  today,
  nextIndex,
  trainedToday,
  selectedId,
  onSelect,
}: {
  data: AppData;
  today: string;
  nextIndex: number;
  trainedToday: boolean;
  selectedId: string | null;
  onSelect: (id: string) => void;
}) {
  const { split } = nextSplitDay(data, today);
  const [view, setView] = useState(nextIndex);
  const day = split.days[view] ?? split.days[0];
  const byName = new Map(data.exercises.map((e) => [e.name, e]));
  const exercises = day.exercises.map((n) => byName.get(n)).filter((e): e is Exercise => Boolean(e));

  return (
    <>
      <div className="mb-3 flex gap-1 overflow-x-auto rounded-xl bg-[var(--accent-soft)] p-1">
        {split.days.map((d, i) => (
          <button key={d.key} type="button" aria-pressed={view === i} onClick={() => setView(i)} className={`${tabClass(view === i)} flex-1 shrink-0`}>
            {d.name}
            {i === nextIndex ? (
              <span className="ml-1 rounded-full bg-[var(--accent)] px-1.5 py-0.5 text-[10px] text-white">{trainedToday ? "今日" : "次"}</span>
            ) : null}
          </button>
        ))}
      </div>
      <p className="mb-2 text-xs font-semibold text-[var(--text-muted)]">{day.focus}</p>
      <ul className="space-y-1.5">
        {exercises.map((ex) => {
          const previous = sessionsFor(data.sets, ex.id).find((s) => s.date < today);
          const doneToday = data.sets.filter((s) => s.date === today && s.exerciseId === ex.id).length;
          const top = previous ? previous.sets.reduce((a, b) => (b.weight > a.weight ? b : a)) : null;
          return (
            <li key={ex.id}>
              <button
                type="button"
                onClick={() => onSelect(ex.id)}
                aria-pressed={selectedId === ex.id}
                className={`flex min-h-12 w-full items-center justify-between gap-2 rounded-lg border px-3 py-2 text-left ${
                  selectedId === ex.id ? "border-[var(--accent-strong)] bg-[var(--accent-soft)]" : "border-[var(--border-soft)] bg-[var(--surface-control)]"
                }`}
              >
                <span className="min-w-0">
                  <span className="block text-sm font-semibold text-[var(--text-title)]">{ex.name}</span>
                  <span className="tabular block text-xs text-[var(--text-muted)]">
                    {EQUIPMENT_LABEL[ex.equipment]}・{top ? `前回 ${fmtSet(top.weight, top.reps)}` : "未実施"}
                  </span>
                </span>
                {doneToday ? (
                  <span className="inline-flex shrink-0 items-center gap-1 text-xs font-semibold text-[var(--status-good)]">
                    <Check size={14} />
                    {doneToday} セット
                  </span>
                ) : (
                  <span className="shrink-0 text-xs text-[var(--text-muted)]">{ex.targetSets}×{ex.targetReps}</span>
                )}
              </button>
            </li>
          );
        })}
      </ul>
    </>
  );
}

function CategoryCard({ data, selectedId, onSelect }: { data: AppData; selectedId: string | null; onSelect: (id: string) => void }) {
  const selectedCat = data.exercises.find((e) => e.id === selectedId)?.category;
  const [cat, setCat] = useState<Category>(selectedCat ?? "chest");
  const present = CATEGORIES.filter((c) => data.exercises.some((e) => e.category === c.key));
  const list = data.exercises.filter((e) => e.category === cat);
  return (
    <Card title="部位から選ぶ">
      <div className="mb-3 flex gap-1 overflow-x-auto rounded-xl bg-[var(--accent-soft)] p-1">
        {present.map((c) => (
          <button key={c.key} type="button" aria-pressed={cat === c.key} onClick={() => setCat(c.key)} className={`${tabClass(cat === c.key)} shrink-0`}>
            {c.label}
          </button>
        ))}
      </div>
      <div className="flex flex-wrap gap-2">
        {list.map((ex) => (
          <button key={ex.id} type="button" aria-pressed={selectedId === ex.id} onClick={() => onSelect(ex.id)} className={chipClass(selectedId === ex.id)}>
            {ex.name}
            <span className={`ml-1.5 text-[11px] font-medium ${selectedId === ex.id ? "text-white/80" : "text-[var(--text-muted)]"}`}>
              {EQUIPMENT_LABEL[ex.equipment]}
            </span>
          </button>
        ))}
      </div>
    </Card>
  );
}

function ShorthandCard({
  data,
  onLog,
  onSelect,
}: {
  data: AppData;
  onLog: (exerciseId: string, weight: number, reps: number, count: number) => void;
  onSelect: (id: string) => void;
}) {
  const [text, setText] = useState("");
  const [error, setError] = useState("");

  const submit = (e: React.FormEvent) => {
    e.preventDefault();
    const parsed = parseSetShorthand(text, data.exercises);
    if (!parsed) {
      setError("「ベンチ 80 8×3」の形で入れてください（種目 重量 回数×セット）");
      return;
    }
    let exercise = parsed.exercise;
    if (!exercise) {
      exercise = {
        id: newId(),
        name: parsed.name,
        aliases: [],
        category: "other",
        equipment: "machine",
        increment: 2.5,
        targetReps: parsed.reps,
        targetSets: Math.max(3, parsed.sets),
      };
      const created = exercise;
      update((d) => ({ ...d, exercises: [...d.exercises, created] }));
    }
    onLog(exercise.id, parsed.weight, parsed.reps, parsed.sets);
    onSelect(exercise.id);
    setText("");
    setError("");
  };

  return (
    <Card title="まとめて記録">
      <form className="flex gap-2" onSubmit={submit}>
        <input
          className="ui-input"
          placeholder="ベンチ 80 8×3"
          value={text}
          onChange={(e) => setText(e.target.value)}
          aria-label="種目 重量 回数×セット"
          enterKeyHint="done"
        />
        <button type="submit" className="ui-button shrink-0">
          記録
        </button>
      </form>
      {error ? <p className="mt-2 text-xs text-[var(--danger)]">{error}</p> : null}
    </Card>
  );
}

function ExercisePanel({
  data,
  exercise,
  today,
  onLog,
}: {
  data: AppData;
  exercise: Exercise;
  today: string;
  onLog: (exerciseId: string, weight: number, reps: number) => void;
}) {
  const sessions = sessionsFor(data.sets, exercise.id);
  const previous = sessions.find((s) => s.date < today);
  const todays = sessions.find((s) => s.date === today)?.sets ?? [];
  const target = nextTarget(exercise, data.sets, today);
  const lastToday = todays[todays.length - 1];
  const bodyweight = exercise.equipment === "bodyweight";
  const [weight, setWeight] = useState(lastToday?.weight ?? target?.weight ?? (bodyweight ? 0 : 20));
  const [reps, setReps] = useState(lastToday?.reps ?? target?.reps ?? exercise.targetReps);

  return (
    <Card
      title={exercise.name}
      action={<span className="text-xs font-semibold text-[var(--text-muted)]">{EQUIPMENT_LABEL[exercise.equipment]}</span>}
    >
      <div className="mb-3 space-y-1 text-sm">
        {previous ? (
          <p className="tabular text-[var(--text-body)]">
            <span className="text-xs font-semibold text-[var(--text-muted)]">前回 {formatShort(previous.date)}：</span>
            {previous.sets.map((s) => fmtSet(s.weight, s.reps)).join("、")}
          </p>
        ) : (
          <p className="text-xs text-[var(--text-muted)]">初めての種目です。無理のない重量から始めてください。</p>
        )}
        {target ? (
          <p className="rounded-lg bg-[var(--accent-soft)] px-3 py-2 text-xs font-semibold text-[var(--text-active)]">
            今日の目標 {fmtSet(target.weight, target.reps)} × {exercise.targetSets} セット — {target.reason}
          </p>
        ) : null}
      </div>
      <div className="grid gap-3 sm:grid-cols-2">
        <Stepper
          label={bodyweight ? "加重（自重のみは 0）" : "重量"}
          unit="kg"
          value={weight}
          step={exercise.increment || 2.5}
          onChange={setWeight}
        />
        <Stepper label="回数" unit="回" value={reps} step={1} min={1} onChange={setReps} />
      </div>
      <button type="button" className="ui-button mt-3 h-14 w-full text-base" onClick={() => onLog(exercise.id, weight, reps)}>
        {todays.length + 1} セット目を記録
      </button>
      {todays.length ? (
        <ol className="mt-3 space-y-1">
          {todays.map((s, i) => (
            <SetRow key={s.id} set={s} index={i} />
          ))}
        </ol>
      ) : null}
    </Card>
  );
}

function SetRow({ set, index }: { set: SetEntry; index: number }) {
  return (
    <li className="flex items-center justify-between rounded-lg bg-[var(--surface-control)] px-3 py-2 text-sm">
      <span className="tabular">
        <span className="mr-2 text-xs text-[var(--text-muted)]">{index + 1}</span>
        {fmtSet(set.weight, set.reps)} 回
        {set.weight > 0 ? (
          <span className="ml-2 text-xs text-[var(--text-muted)]">推定1RM {e1rm(set.weight, set.reps).toFixed(1)}kg</span>
        ) : null}
      </span>
      <button
        type="button"
        aria-label="このセットを削除"
        className="ui-icon-button h-9 w-9"
        onClick={() => update((d) => ({ ...d, sets: d.sets.filter((x) => x.id !== set.id) }))}
      >
        <Trash2 size={16} />
      </button>
    </li>
  );
}

function TodaySession({ data, today }: { data: AppData; today: string }) {
  const sets = data.sets.filter((s) => s.date === today);
  if (!sets.length) return null;
  const byExercise = new Map<string, SetEntry[]>();
  for (const s of sets) byExercise.set(s.exerciseId, [...(byExercise.get(s.exerciseId) ?? []), s]);
  const volume = sets.reduce((v, s) => v + s.weight * s.reps, 0);
  return (
    <Card title="今日のセッション" action={<span className="tabular text-xs text-[var(--text-muted)]">総挙上量 {Math.round(volume).toLocaleString()}kg</span>}>
      <ul className="space-y-2 text-sm">
        {[...byExercise.entries()].map(([id, list]) => (
          <li key={id}>
            <p className="font-semibold text-[var(--text-title)]">{data.exercises.find((e) => e.id === id)?.name ?? "削除された種目"}</p>
            <p className="tabular text-[var(--text-body)]">{list.map((s) => fmtSet(s.weight, s.reps)).join("、")}</p>
          </li>
        ))}
      </ul>
    </Card>
  );
}

function RestTimer({ until, onDone }: { until: number; onDone: () => void }) {
  const [now, setNow] = useState(() => Date.now());
  useEffect(() => {
    const t = setInterval(() => setNow(Date.now()), 250);
    return () => clearInterval(t);
  }, []);
  const left = Math.max(0, Math.ceil((until - now) / 1000));
  const finished = left === 0;
  return (
    // top on mobile so it never covers the record button under the thumb
    <div className="fixed inset-x-4 top-[calc(3.75rem+env(safe-area-inset-top))] z-30 lg:bottom-6 lg:left-auto lg:right-6 lg:top-auto lg:w-72" role="status">
      <div
        className={`flex items-center justify-between rounded-xl px-4 py-3 text-white shadow-[var(--shadow-drawer)] ${
          finished ? "bg-[var(--status-good)]" : "bg-[var(--accent-deep)]"
        }`}
      >
        <span className="inline-flex items-center gap-2 text-sm font-semibold">
          <Timer size={18} />
          {finished ? "休憩終了。次のセットへ" : "休憩中"}
        </span>
        <span className="tabular text-xl font-bold">
          {Math.floor(left / 60)}:{String(left % 60).padStart(2, "0")}
        </span>
        <button type="button" aria-label="タイマーを閉じる" onClick={onDone} className="ml-2 rounded-md p-1 hover:bg-white/10">
          <X size={18} />
        </button>
      </div>
    </div>
  );
}

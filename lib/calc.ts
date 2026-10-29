import { addDays, clockDiff, daysBetween, weekStart } from "./date";
import { getSplit, type Split } from "./exercises";
import type {
  AppData,
  CalorieAdjustment,
  Exercise,
  Meal,
  Nutrients,
  Profile,
  SetEntry,
  SleepEntry,
  WeightEntry,
} from "./types";

/** ~7,200 kcal per kg of body fat. */
export const KCAL_PER_KG = 7200;

const round = (n: number, step = 1) => Math.round(n / step) * step;
const clamp = (n: number, lo: number, hi: number) => Math.min(hi, Math.max(lo, n));

// ---------- weight ----------

export function sortedWeights(weights: WeightEntry[]) {
  return [...weights].sort((a, b) => a.date.localeCompare(b.date));
}

/** Average of the entries in the 7 days ending on `date`; null if fewer than 3 entries. */
export function avg7(weights: WeightEntry[], date: string): number | null {
  const from = addDays(date, -6);
  const inWindow = weights.filter((w) => w.date >= from && w.date <= date);
  if (inWindow.length < 3) return null;
  return inWindow.reduce((s, w) => s + w.kg, 0) / inWindow.length;
}

export function latestWeight(weights: WeightEntry[]): number | null {
  const s = sortedWeights(weights);
  return s.length ? s[s.length - 1].kg : null;
}

/** Planned loss per week, kept inside 0.25–1% of body weight so muscle is spared. */
export function plannedKgPerWeek(profile: Profile, currentKg: number, today: string): number {
  const toLose = currentKg - profile.targetWeightKg;
  if (toLose <= 0) return 0;
  const weeks = Math.max(1, daysBetween(today, profile.targetDate) / 7);
  return clamp(toLose / weeks, currentKg * 0.0025, currentKg * 0.01);
}

/** Straight line from the start weight to the target on the target date. */
export function pacePoint(profile: Profile, startDate: string, date: string): number {
  const total = Math.max(1, daysBetween(startDate, profile.targetDate));
  const t = clamp(daysBetween(startDate, date) / total, 0, 1);
  return profile.startWeightKg + (profile.targetWeightKg - profile.startWeightKg) * t;
}

// ---------- calories & protein ----------

export function bmr(profile: Profile, kg: number, today: string): number {
  const age = Number(today.slice(0, 4)) - profile.birthYear;
  const base = 10 * kg + 6.25 * profile.heightCm - 5 * age;
  return profile.sex === "male" ? base + 5 : base - 161;
}

export function proteinTarget(profile: Profile, kg: number): number {
  return round(profile.proteinPerKg * kg);
}

export type CalorieTarget = {
  kcal: number;
  tdee: number;
  deficit: number;
  adjustment: number;
  floor: number;
};

export function calorieTarget(data: AppData, today: string): CalorieTarget | null {
  const profile = data.profile;
  if (!profile) return null;
  const kg = avg7(data.weights, today) ?? latestWeight(data.weights) ?? profile.startWeightKg;
  const tdee = bmr(profile, kg, today) * profile.activity;
  const deficit = Math.min(750, (plannedKgPerWeek(profile, kg, today) * KCAL_PER_KG) / 7);
  const adjustment = data.calorieAdjustments.reduce((s, a) => s + a.deltaKcal, 0);
  const floor = bmr(profile, kg, today);
  return {
    kcal: round(Math.max(floor, tdee - deficit + adjustment), 10),
    tdee: round(tdee, 10),
    deficit: round(deficit, 10),
    adjustment,
    floor: round(floor, 10),
  };
}

/**
 * Weekly self-correcting target (the Fitia idea): compare the real 7-day-average trend
 * with the planned pace and correct half the gap. Returns null when there is nothing to do.
 */
export function weeklyAdjustment(data: AppData, today: string): CalorieAdjustment | null {
  const profile = data.profile;
  if (!profile) return null;
  const week = weekStart(today);
  if (data.calorieAdjustments.some((a) => a.weekStart === week)) return null;
  const lastWeekEnd = addDays(week, -1);
  const now = avg7(data.weights, lastWeekEnd);
  const before = avg7(data.weights, addDays(lastWeekEnd, -7));
  if (now === null || before === null) return null;
  const actualLoss = before - now;
  const planned = plannedKgPerWeek(profile, now, today);
  const gapKg = planned - actualLoss;
  const delta = clamp(round((-gapKg * KCAL_PER_KG) / 7 / 2, 10), -200, 200);
  if (Math.abs(delta) < 30) return null;
  const reason =
    delta < 0
      ? `先週の減り ${actualLoss.toFixed(2)}kg が予定 ${planned.toFixed(2)}kg より少ないため`
      : `先週の減り ${actualLoss.toFixed(2)}kg が予定 ${planned.toFixed(2)}kg より速く、筋肉を守るため`;
  return { weekStart: week, deltaKcal: delta, reason };
}

export function sumNutrients(meals: Meal[]): Nutrients {
  return meals.reduce(
    (t, m) => ({ kcal: t.kcal + m.kcal, protein: t.protein + m.protein, fat: t.fat + m.fat, carbs: t.carbs + m.carbs }),
    { kcal: 0, protein: 0, fat: 0, carbs: 0 },
  );
}

/** Daily macro targets: protein from body weight, fat at 25% of calories, carbs fill the rest. */
export function macroTargets(data: AppData, today: string): Nutrients | null {
  const target = calorieTarget(data, today);
  if (!target || !data.profile) return null;
  const kg = avg7(data.weights, today) ?? latestWeight(data.weights) ?? data.profile.startWeightKg;
  const protein = proteinTarget(data.profile, kg);
  const fat = round((target.kcal * 0.25) / 9);
  const carbs = Math.max(0, round((target.kcal - protein * 4 - fat * 9) / 4));
  return { kcal: target.kcal, protein, fat, carbs };
}

/** kcal from grams, for when only P/F/C are entered. */
export function kcalFromMacros(protein: number, fat: number, carbs: number): number {
  return round(protein * 4 + fat * 9 + carbs * 4);
}

// ---------- sleep ----------

export type SleepStats = { hours: number; efficiency: number; inBedHours: number };

export function sleepStats(s: SleepEntry): SleepStats {
  const inBed = clockDiff(s.inBed, s.outOfBed);
  const asleep = Math.max(0, clockDiff(s.asleep, s.wake) - s.awakeMinutes);
  return {
    hours: asleep / 60,
    inBedHours: inBed / 60,
    efficiency: inBed > 0 ? asleep / inBed : 0,
  };
}

// ---------- training ----------

/** Epley estimated one-rep max. */
export function e1rm(weight: number, reps: number): number {
  return reps <= 1 ? weight : weight * (1 + reps / 30);
}

export function sessionsFor(sets: SetEntry[], exerciseId: string) {
  const byDate = new Map<string, SetEntry[]>();
  for (const s of sets) {
    if (s.exerciseId !== exerciseId) continue;
    byDate.set(s.date, [...(byDate.get(s.date) ?? []), s]);
  }
  return [...byDate.entries()]
    .sort(([a], [b]) => b.localeCompare(a))
    .map(([date, list]) => ({ date, sets: list.sort((a, b) => a.at.localeCompare(b.at)) }));
}

export type NextTarget = { weight: number; reps: number; reason: string };

/** Progressive overload (the Cora idea): +increment when every set hit target reps, else chase one more rep. */
export function nextTarget(ex: Exercise, sets: SetEntry[], today: string): NextTarget | null {
  const sessions = sessionsFor(sets, ex.id).filter((s) => s.date < today);
  const last = sessions[0];
  if (!last) return null;
  const top = Math.max(...last.sets.map((s) => s.weight));
  const work = last.sets.filter((s) => s.weight === top);
  const allHit = work.length >= ex.targetSets && work.every((s) => s.reps >= ex.targetReps);
  if (allHit && ex.increment === 0) {
    const best = Math.max(...work.map((s) => s.reps));
    return { weight: top, reps: best + 1, reason: `前回 全セット ${ex.targetReps} 回達成 → 回数を 1 回伸ばす` };
  }
  if (allHit) {
    return { weight: top + ex.increment, reps: ex.targetReps, reason: `前回 全セット ${ex.targetReps} 回達成 → +${ex.increment}kg` };
  }
  const best = Math.max(...work.map((s) => s.reps));
  return {
    weight: top,
    reps: Math.min(ex.targetReps, best + 1),
    reason: `前回は ${ex.targetReps} 回×${ex.targetSets} セット未達 → 同じ重量で回数を伸ばす`,
  };
}

/**
 * Which day of the chosen split comes next. "No debt" (the HYBRD idea): it simply follows the
 * last day trained, however long ago, never a backlog of missed days.
 */
export function nextSplitDay(data: AppData, today: string): { split: Split; index: number; trainedToday: boolean } {
  const split = getSplit(data.splitId);
  const nameOf = new Map(data.exercises.map((e) => [e.id, e.name]));
  const dayMatching = (date: string) => {
    const names = new Set(data.sets.filter((s) => s.date === date).map((s) => nameOf.get(s.exerciseId)));
    let best = -1;
    let bestScore = 0;
    split.days.forEach((d, i) => {
      const score = d.exercises.filter((n) => names.has(n)).length;
      if (score > bestScore) [best, bestScore] = [i, score];
    });
    return best;
  };
  const todayDay = dayMatching(today);
  if (todayDay >= 0) return { split, index: todayDay, trainedToday: true };
  const pastDates = [...new Set(data.sets.filter((s) => s.date < today).map((s) => s.date))].sort().reverse();
  for (const date of pastDates) {
    const i = dayMatching(date);
    if (i >= 0) return { split, index: (i + 1) % split.days.length, trainedToday: false };
  }
  return { split, index: 0, trainedToday: false };
}

/** Parses shorthand like "ベンチ 80kg 8×3", "squat 100 5x5", "カール 12.5 10". */
export function parseSetShorthand(
  text: string,
  exercises: Exercise[],
): { exercise: Exercise | null; name: string; weight: number; reps: number; sets: number } | null {
  const m = text
    .trim()
    .replace(/[　]/g, " ")
    .match(/^(.+?)\s+([\d.]+)\s*(?:kg)?\s+(\d+)\s*(?:[x×*]\s*(\d+))?\s*$/i);
  if (!m) return null;
  const name = m[1].trim();
  const key = name.toLowerCase();
  const exercise =
    exercises.find((e) => e.name.toLowerCase() === key || e.aliases.some((a) => a.toLowerCase() === key)) ??
    exercises.find((e) => e.name.toLowerCase().startsWith(key)) ??
    null;
  return { exercise, name, weight: Number(m[2]), reps: Number(m[3]), sets: m[4] ? Number(m[4]) : 1 };
}

// ---------- the four goals ----------

export type GoalState = "done" | "partial" | "todo" | "rest";
export type Goal = { key: "weight" | "sleep" | "food" | "muscle"; label: string; state: GoalState; detail: string };

export function dailyGoals(data: AppData, day: string): Goal[] {
  const profile = data.profile;
  const weight = data.weights.find((w) => w.date === day);
  const sleep = data.sleeps.find((s) => s.date === day);
  const meals = data.meals.filter((m) => m.date === day);
  const eaten = sumNutrients(meals);
  const target = calorieTarget(data, day);
  const kg = avg7(data.weights, day) ?? latestWeight(data.weights) ?? profile?.startWeightKg ?? 0;
  const protein = profile ? proteinTarget(profile, kg) : 0;
  const trained = data.sets.some((s) => s.date === day);

  const goals: Goal[] = [];
  goals.push({
    key: "weight",
    label: "体重",
    state: weight ? "done" : "todo",
    detail: weight ? `${weight.kg.toFixed(1)}kg` : "朝の体重が未入力",
  });

  if (sleep && profile) {
    const st = sleepStats(sleep);
    const ok = st.hours >= profile.sleepTargetHours - 0.5 && st.efficiency >= 0.85;
    goals.push({
      key: "sleep",
      label: "睡眠",
      state: ok ? "done" : "partial",
      detail: `${st.hours.toFixed(1)}時間・効率 ${Math.round(st.efficiency * 100)}%`,
    });
  } else {
    goals.push({ key: "sleep", label: "睡眠", state: "todo", detail: "昨夜の睡眠が未入力" });
  }

  if (meals.length && target) {
    const kcalOk = eaten.kcal <= target.kcal + 100;
    const proteinOk = eaten.protein >= protein * 0.9;
    goals.push({
      key: "food",
      label: "食事",
      state: kcalOk && proteinOk ? "done" : "partial",
      detail: `${round(eaten.kcal)} / ${target.kcal}kcal・たんぱく質 ${round(eaten.protein)} / ${protein}g`,
    });
  } else {
    goals.push({ key: "food", label: "食事", state: "todo", detail: "食事が未記録" });
  }

  goals.push({
    key: "muscle",
    label: "筋トレ",
    state: trained ? "done" : "rest",
    detail: trained
      ? `${data.sets.filter((s) => s.date === day).length} セット記録`
      : "休養日（遅れにはなりません）",
  });
  return goals;
}

/** End-of-day 3-line report plus one action for tomorrow (the rex.fit idea). Rule-based, no API call. */
export function dayReport(data: AppData, day: string): { lines: string[]; tomorrow: string } | null {
  const profile = data.profile;
  if (!profile) return null;
  const meals = data.meals.filter((m) => m.date === day);
  const eaten = sumNutrients(meals);
  const target = calorieTarget(data, day);
  const kg = avg7(data.weights, day) ?? latestWeight(data.weights) ?? profile.startWeightKg;
  const protein = proteinTarget(profile, kg);
  const sleep = data.sleeps.find((s) => s.date === day);
  const daySets = data.sets.filter((s) => s.date === day);

  const lines: string[] = [];
  if (meals.length && target) {
    const diff = round(eaten.kcal - target.kcal);
    lines.push(
      `食事：${round(eaten.kcal)}kcal（目標${diff >= 0 ? "より +" : "まで "}${Math.abs(diff)}kcal）、P ${round(eaten.protein)} / ${protein}g・F ${round(eaten.fat)}g・C ${round(eaten.carbs)}g`,
    );
  } else {
    lines.push("食事：記録なし");
  }
  if (daySets.length) {
    const names = [...new Set(daySets.map((s) => data.exercises.find((e) => e.id === s.exerciseId)?.name ?? "?"))];
    lines.push(`筋トレ：${names.join("・")}（${daySets.length} セット）`);
  } else {
    lines.push("筋トレ：休養日");
  }
  if (sleep) {
    const st = sleepStats(sleep);
    lines.push(`睡眠：${st.hours.toFixed(1)}時間・効率 ${Math.round(st.efficiency * 100)}%`);
  } else {
    lines.push("睡眠：記録なし");
  }

  let tomorrow: string;
  if (meals.length && eaten.protein < protein * 0.9) {
    tomorrow = `たんぱく質があと ${round(protein - eaten.protein)}g 足りません。明日は朝にサラダチキンかゆで卵を足す`;
  } else if (sleep && sleepStats(sleep).hours < profile.sleepTargetHours - 0.5) {
    tomorrow = `今夜は ${profile.sleepTargetHours} 時間眠れるよう、30 分早く布団に入る`;
  } else if (target && meals.length && eaten.kcal > target.kcal + 100) {
    tomorrow = "明日は夜の炭水化物を半分にして調整する";
  } else if (!daySets.length) {
    const { split, index } = nextSplitDay(data, addDays(day, 1));
    const next = split.days[index];
    tomorrow = `ジムに行くなら ${next.name}（${next.focus}）の日`;
  } else {
    tomorrow = "この調子で、明日の朝も体重を測る";
  }
  return { lines, tomorrow };
}

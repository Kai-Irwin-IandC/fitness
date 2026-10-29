export type Sex = "male" | "female";

export type Profile = {
  sex: Sex;
  birthYear: number;
  heightCm: number;
  startWeightKg: number;
  targetWeightKg: number;
  /** YYYY-MM-DD */
  targetDate: string;
  /** TDEE multiplier (1.2 = desk job, 1.55 = trains 3-5x/week) */
  activity: number;
  proteinPerKg: number;
  sleepTargetHours: number;
  restSeconds: number;
};

export type WeightEntry = { date: string; kg: number };

/** CBT-I style sleep diary, keyed by the morning (wake) date. Times are "HH:MM". */
export type SleepEntry = {
  date: string;
  inBed: string;
  asleep: string;
  awakenings: number;
  /** total minutes awake after first falling asleep */
  awakeMinutes: number;
  wake: string;
  outOfBed: string;
  quality: number;
};

export type Nutrients = { kcal: number; protein: number; fat: number; carbs: number };

export type Meal = Nutrients & { id: string; date: string; time: string };

export type Category = "chest" | "back" | "shoulders" | "legs" | "arms" | "core" | "other";

export type Equipment = "barbell" | "dumbbell" | "machine" | "cable" | "bodyweight";

export type Exercise = {
  id: string;
  name: string;
  aliases: string[];
  category: Category;
  equipment: Equipment;
  /** kg added when every set hit the target reps last session; 0 = progress by reps (bodyweight) */
  increment: number;
  targetReps: number;
  targetSets: number;
};

export type SetEntry = {
  id: string;
  date: string;
  exerciseId: string;
  weight: number;
  reps: number;
  at: string;
};

export type CalorieAdjustment = {
  /** Monday of the week the adjustment applies to */
  weekStart: string;
  deltaKcal: number;
  reason: string;
};

export type AppData = {
  version: 1;
  libraryVersion: number;
  profile: Profile | null;
  weights: WeightEntry[];
  sleeps: SleepEntry[];
  meals: Meal[];
  exercises: Exercise[];
  sets: SetEntry[];
  calorieAdjustments: CalorieAdjustment[];
  splitId: string;
};

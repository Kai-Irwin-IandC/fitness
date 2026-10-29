"use client";

import { useSyncExternalStore } from "react";
import type { AppData, Exercise, Meal } from "./types";
import { LIBRARY, LIBRARY_VERSION, exerciseFromLibrary, libraryMeta } from "./exercises";

const STORAGE_KEY = "kai-health:v1";

const id = () => crypto.randomUUID();

function emptyData(): AppData {
  return {
    version: 1,
    libraryVersion: LIBRARY_VERSION,
    profile: null,
    weights: [],
    sleeps: [],
    meals: [],
    exercises: LIBRARY.map((e) => exerciseFromLibrary(e, id())),
    sets: [],
    calorieAdjustments: [],
    splitId: "ppl",
  };
}

type LegacyMeal = Partial<Meal> & { id: string; date: string; time: string; items?: Meal[] };

/** Upgrades data saved by older versions: categorised exercises, new library entries, flat meals. */
function normalize(raw: Partial<AppData>): AppData {
  const d = { ...emptyData(), ...raw } as AppData;
  let exercises: Exercise[] = (raw.exercises ?? d.exercises).map((e) =>
    e.category && e.equipment ? e : { ...e, ...libraryMeta(e.name) },
  );
  if ((raw.libraryVersion ?? 1) < LIBRARY_VERSION) {
    const have = new Set(exercises.map((e) => e.name));
    exercises = [...exercises, ...LIBRARY.filter((e) => !have.has(e.name)).map((e) => exerciseFromLibrary(e, id()))];
  }
  const meals: Meal[] = (d.meals as LegacyMeal[]).map((m) => {
    if (!m.items) return m as Meal;
    const sum = (k: "kcal" | "protein" | "fat" | "carbs") => m.items!.reduce((s, i) => s + (i[k] ?? 0), 0);
    return { id: m.id, date: m.date, time: m.time, kcal: sum("kcal"), protein: sum("protein"), fat: sum("fat"), carbs: sum("carbs") };
  });
  return { ...d, exercises, meals, libraryVersion: LIBRARY_VERSION };
}

export { normalize as normalizeData };

let cache: AppData | null = null;
const listeners = new Set<() => void>();
const localChangeListeners = new Set<() => void>();

function load(): AppData {
  if (cache) return cache;
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    cache = raw ? normalize(JSON.parse(raw)) : emptyData();
  } catch {
    cache = emptyData();
  }
  return cache;
}

/** `local` is false when the data came from the cloud, so it isn't pushed straight back. */
function persist(next: AppData, local = true) {
  cache = next;
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(next));
  } catch {
    // Storage full or blocked: keep the in-memory copy so the session still works.
  }
  listeners.forEach((l) => l());
  if (local) localChangeListeners.forEach((l) => l());
}

export function onLocalChange(listener: () => void) {
  localChangeListeners.add(listener);
  return () => {
    localChangeListeners.delete(listener);
  };
}

export function getData(): AppData {
  return load();
}

export function replaceFromRemote(next: AppData) {
  persist(next, false);
}

function subscribe(listener: () => void) {
  listeners.add(listener);
  const onStorage = (e: StorageEvent) => {
    if (e.key === STORAGE_KEY) {
      cache = null;
      listener();
    }
  };
  window.addEventListener("storage", onStorage);
  return () => {
    listeners.delete(listener);
    window.removeEventListener("storage", onStorage);
  };
}

const SERVER_SNAPSHOT = emptyData();

/** Returns null until the browser store has been read (avoids a hydration mismatch). */
export function useAppData(): AppData | null {
  const data = useSyncExternalStore(subscribe, load, () => SERVER_SNAPSHOT);
  return data === SERVER_SNAPSHOT ? null : data;
}

export function update(fn: (draft: AppData) => AppData) {
  persist(fn(load()));
}

export function newId() {
  return id();
}

export function exportJson(): string {
  return JSON.stringify(load(), null, 2);
}

export function importJson(text: string) {
  const parsed = JSON.parse(text) as AppData;
  if (parsed.version !== 1 || !Array.isArray(parsed.weights)) {
    throw new Error("このファイルは Kai Health のバックアップではありません");
  }
  persist(normalize(parsed));
}

export function resetAll() {
  persist(emptyData());
}

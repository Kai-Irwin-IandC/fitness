"use client";

import { useSyncExternalStore } from "react";
import { getData, normalizeData, onLocalChange, replaceFromRemote } from "./store";
import type { AppData } from "./types";

const PASSCODE_KEY = "kai-health:passcode";
const ETAG_KEY = "kai-health:etag";
/** "1" while this device has edits the cloud copy doesn't have yet (survives reloads/offline). */
const DIRTY_KEY = "kai-health:dirty";
const PUSH_DELAY_MS = 1500;

export type SyncState =
  | { status: "off"; detail: string }
  | { status: "syncing" }
  | { status: "synced"; at: number }
  | { status: "error"; detail: string };

let state: SyncState = { status: "off", detail: "" };
const listeners = new Set<() => void>();
const setState = (next: SyncState) => {
  state = next;
  listeners.forEach((l) => l());
};

export function useSyncState(): SyncState {
  return useSyncExternalStore(
    (l) => {
      listeners.add(l);
      return () => listeners.delete(l);
    },
    () => state,
    () => state,
  );
}

const ls = {
  get: (k: string) => {
    try {
      return localStorage.getItem(k);
    } catch {
      return null;
    }
  },
  set: (k: string, v: string) => {
    try {
      localStorage.setItem(k, v);
    } catch {
      // storage blocked: sync still works for this session
    }
  },
};

export const getPasscode = () => ls.get(PASSCODE_KEY) ?? "";

export function setPasscode(passcode: string) {
  ls.set(PASSCODE_KEY, passcode);
  void syncNow();
}

class SyncError extends Error {
  constructor(
    readonly code: "not_configured" | "unauthorized" | "conflict" | "network" | "server",
    message: string,
  ) {
    super(message);
  }
}

async function call<T>(method: "GET" | "PUT", body?: object): Promise<T> {
  let res: Response;
  try {
    res = await fetch("/api/sync", {
      method,
      cache: "no-store",
      headers: { "Content-Type": "application/json", "x-app-passcode": getPasscode() },
      body: body ? JSON.stringify(body) : undefined,
    });
  } catch {
    throw new SyncError("network", "オフラインです。この端末には保存済みで、つながったら同期します");
  }
  if (res.ok) return res.json() as Promise<T>;
  if (res.status === 503) throw new SyncError("not_configured", "サーバーで Vercel Blob と APP_PASSCODE が未設定です");
  if (res.status === 401) throw new SyncError("unauthorized", "パスコードが違います");
  if (res.status === 409) throw new SyncError("conflict", "conflict");
  throw new SyncError("server", `同期に失敗しました（${res.status}）`);
}

const hasRecords = (d: AppData) =>
  Boolean(d.profile || d.weights.length || d.steps.length || d.meals.length || d.sets.length || d.sleeps.length);

function unionBy<T>(local: T[], remote: T[], key: (x: T) => string): T[] {
  const map = new Map(remote.map((x) => [key(x), x]));
  for (const x of local) map.set(key(x), x);
  return [...map.values()];
}

/**
 * Both devices changed since they last agreed: keep every record from both, local wins on the
 * same key. Exercises match by name because each device seeded the library with its own ids.
 * (A record deleted on one device can come back here; that is the price of not having a DB.)
 */
function merge(local: AppData, remote: AppData): AppData {
  const localIdByName = new Map(local.exercises.map((e) => [e.name, e.id]));
  const remap = new Map(remote.exercises.map((e) => [e.id, localIdByName.get(e.name) ?? e.id]));
  const remoteSets = remote.sets.map((s) => ({ ...s, exerciseId: remap.get(s.exerciseId) ?? s.exerciseId }));
  return {
    ...remote,
    ...local,
    profile: local.profile ?? remote.profile,
    weights: unionBy(local.weights, remote.weights, (w) => w.date),
    steps: unionBy(local.steps, remote.steps, (st) => st.date),
    sleeps: unionBy(local.sleeps, remote.sleeps, (s) => s.date),
    meals: unionBy(local.meals, remote.meals, (m) => m.id),
    sets: unionBy(local.sets, remoteSets, (s) => s.id),
    exercises: unionBy(local.exercises, remote.exercises, (e) => e.name),
    calorieAdjustments: unionBy(local.calorieAdjustments, remote.calorieAdjustments, (a) => a.weekStart),
  };
}

let running = false;
let rerun = false;

/** Pull, reconcile, push. Safe to call any time; overlapping calls collapse into one more run. */
export async function syncNow(): Promise<void> {
  if (!getPasscode()) {
    setState({ status: "off", detail: "パスコード未入力（この端末だけに保存）" });
    return;
  }
  if (running) {
    rerun = true;
    return;
  }
  running = true;
  setState({ status: "syncing" });
  try {
    for (let attempt = 0; ; attempt++) {
      const remote = await call<{ data: AppData | null; etag: string | null }>("GET");
      const local = getData();
      const dirty = ls.get(DIRTY_KEY) === "1";
      const seen = ls.get(ETAG_KEY);
      let next = local;
      let push = dirty || (!remote.data && hasRecords(local));

      if (remote.data && remote.etag !== seen) {
        const incoming = normalizeData(remote.data);
        if (dirty || (!seen && hasRecords(local))) {
          next = merge(local, incoming);
          push = true;
        } else {
          next = incoming;
        }
        replaceFromRemote(next);
      }

      let etag = remote.etag;
      if (push) {
        try {
          etag = (await call<{ etag: string }>("PUT", { data: next, etag: remote.etag })).etag;
        } catch (e) {
          // someone saved in between: go round again with their version
          if (e instanceof SyncError && e.code === "conflict" && attempt < 3) continue;
          throw e;
        }
      }
      if (etag) ls.set(ETAG_KEY, etag);
      if (!rerun) ls.set(DIRTY_KEY, "0");
      break;
    }
    setState({ status: "synced", at: Date.now() });
  } catch (e) {
    const detail = e instanceof Error ? e.message : "同期に失敗しました";
    setState(e instanceof SyncError && e.code === "not_configured" ? { status: "off", detail } : { status: "error", detail });
  } finally {
    running = false;
    if (rerun) {
      rerun = false;
      void syncNow();
    }
  }
}

let timer: ReturnType<typeof setTimeout> | null = null;

/** Wires sync into the app: pull on open and on return to the tab, push shortly after each edit. */
export function startSync(): () => void {
  const stopLocal = onLocalChange(() => {
    ls.set(DIRTY_KEY, "1");
    if (running) rerun = true;
    if (timer) clearTimeout(timer);
    timer = setTimeout(() => void syncNow(), PUSH_DELAY_MS);
  });
  const onVisible = () => {
    if (document.visibilityState === "visible") void syncNow();
  };
  const onOnline = () => void syncNow();
  document.addEventListener("visibilitychange", onVisible);
  window.addEventListener("online", onOnline);
  void syncNow();
  return () => {
    stopLocal();
    document.removeEventListener("visibilitychange", onVisible);
    window.removeEventListener("online", onOnline);
    if (timer) clearTimeout(timer);
  };
}

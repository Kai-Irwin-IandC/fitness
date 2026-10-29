const pad = (n: number) => String(n).padStart(2, "0");

/** Local-time YYYY-MM-DD (not UTC, so late-night entries land on the right day in Japan). */
export function dateKey(d: Date = new Date()): string {
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`;
}

export function timeKey(d: Date = new Date()): string {
  return `${pad(d.getHours())}:${pad(d.getMinutes())}`;
}

export function parseKey(key: string): Date {
  const [y, m, d] = key.split("-").map(Number);
  return new Date(y, m - 1, d);
}

export function addDays(key: string, days: number): string {
  const d = parseKey(key);
  d.setDate(d.getDate() + days);
  return dateKey(d);
}

export function daysBetween(from: string, to: string): number {
  return Math.round((parseKey(to).getTime() - parseKey(from).getTime()) / 86_400_000);
}

export function weekStart(key: string): string {
  const d = parseKey(key);
  const offset = (d.getDay() + 6) % 7;
  return addDays(key, -offset);
}

export function formatShort(key: string): string {
  const d = parseKey(key);
  return `${d.getMonth() + 1}/${d.getDate()}`;
}

/** Minutes between two "HH:MM" clock times, wrapping past midnight. */
export function clockDiff(from: string, to: string): number {
  const toMin = (t: string) => {
    const [h, m] = t.split(":").map(Number);
    return h * 60 + m;
  };
  const diff = toMin(to) - toMin(from);
  return diff < 0 ? diff + 24 * 60 : diff;
}

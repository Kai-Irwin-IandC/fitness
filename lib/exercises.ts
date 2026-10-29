import type { Category, Equipment, Exercise } from "./types";

export const CATEGORIES: { key: Category; label: string }[] = [
  { key: "chest", label: "胸" },
  { key: "back", label: "背中" },
  { key: "shoulders", label: "肩" },
  { key: "legs", label: "脚・お尻" },
  { key: "arms", label: "腕" },
  { key: "core", label: "腹" },
  { key: "other", label: "その他" },
];

export const EQUIPMENT_LABEL: Record<Equipment, string> = {
  barbell: "バーベル",
  dumbbell: "ダンベル",
  machine: "マシン",
  cable: "ケーブル",
  bodyweight: "自重",
};

/** kg added after a session where every set hit the target reps. Bodyweight progresses by reps instead. */
const INCREMENT: Record<Equipment, number> = { barbell: 2.5, dumbbell: 1, machine: 2.5, cable: 2.5, bodyweight: 0 };

type LibraryEntry = { name: string; category: Category; equipment: Equipment; reps: number; aliases?: string[] };

/** Bump when entries are added so existing users receive the new exercises once. */
export const LIBRARY_VERSION = 2;

export const LIBRARY: LibraryEntry[] = [
  // 胸
  { name: "ベンチプレス", category: "chest", equipment: "barbell", reps: 8, aliases: ["ベンチ", "bench", "bp"] },
  { name: "インクラインベンチプレス", category: "chest", equipment: "barbell", reps: 8, aliases: ["インクラインベンチ", "incline"] },
  { name: "ダンベルプレス", category: "chest", equipment: "dumbbell", reps: 10, aliases: ["dbプレス"] },
  { name: "インクラインダンベルプレス", category: "chest", equipment: "dumbbell", reps: 10, aliases: ["インクラインdb"] },
  { name: "ダンベルフライ", category: "chest", equipment: "dumbbell", reps: 12, aliases: ["フライ"] },
  { name: "チェストプレス", category: "chest", equipment: "machine", reps: 10 },
  { name: "ペックフライ", category: "chest", equipment: "machine", reps: 12, aliases: ["ペック", "pec"] },
  { name: "ケーブルクロスオーバー", category: "chest", equipment: "cable", reps: 12, aliases: ["クロスオーバー"] },
  { name: "ディップス", category: "chest", equipment: "bodyweight", reps: 10, aliases: ["dips"] },
  { name: "腕立て伏せ", category: "chest", equipment: "bodyweight", reps: 15, aliases: ["腕立て", "pushup"] },
  // 背中
  { name: "デッドリフト", category: "back", equipment: "barbell", reps: 5, aliases: ["デッド", "deadlift", "dl"] },
  { name: "懸垂", category: "back", equipment: "bodyweight", reps: 8, aliases: ["チンニング", "pullup"] },
  { name: "ラットプルダウン", category: "back", equipment: "machine", reps: 10, aliases: ["ラット", "lat", "pulldown"] },
  { name: "ベントオーバーロウ", category: "back", equipment: "barbell", reps: 8, aliases: ["ベントオーバー", "ロウ", "row"] },
  { name: "ワンハンドダンベルロウ", category: "back", equipment: "dumbbell", reps: 10, aliases: ["ワンハンドロウ", "dbロウ"] },
  { name: "シーテッドロウ", category: "back", equipment: "cable", reps: 10, aliases: ["シーテッド"] },
  { name: "Tバーロウ", category: "back", equipment: "barbell", reps: 8, aliases: ["tバー"] },
  { name: "バックエクステンション", category: "back", equipment: "bodyweight", reps: 15, aliases: ["バックエクステ"] },
  // 肩
  { name: "ショルダープレス", category: "shoulders", equipment: "dumbbell", reps: 10, aliases: ["ショルダー", "shoulder"] },
  { name: "オーバーヘッドプレス", category: "shoulders", equipment: "barbell", reps: 8, aliases: ["ohp", "ミリタリープレス"] },
  { name: "サイドレイズ", category: "shoulders", equipment: "dumbbell", reps: 15, aliases: ["サイド", "lateral"] },
  { name: "フロントレイズ", category: "shoulders", equipment: "dumbbell", reps: 12, aliases: ["フロント"] },
  { name: "リアレイズ", category: "shoulders", equipment: "dumbbell", reps: 15, aliases: ["リア", "リアデルト"] },
  { name: "フェイスプル", category: "shoulders", equipment: "cable", reps: 15, aliases: ["facepull"] },
  { name: "アップライトロウ", category: "shoulders", equipment: "barbell", reps: 12, aliases: ["アップライト"] },
  { name: "シュラッグ", category: "shoulders", equipment: "dumbbell", reps: 12, aliases: ["shrug"] },
  // 脚・お尻
  { name: "スクワット", category: "legs", equipment: "barbell", reps: 8, aliases: ["squat", "sq"] },
  { name: "フロントスクワット", category: "legs", equipment: "barbell", reps: 8, aliases: ["フロントsq"] },
  { name: "レッグプレス", category: "legs", equipment: "machine", reps: 10, aliases: ["legpress"] },
  { name: "ブルガリアンスクワット", category: "legs", equipment: "dumbbell", reps: 10, aliases: ["ブルガリアン"] },
  { name: "ルーマニアンデッドリフト", category: "legs", equipment: "barbell", reps: 8, aliases: ["ルーマニアン", "rdl"] },
  { name: "ランジ", category: "legs", equipment: "dumbbell", reps: 10, aliases: ["lunge"] },
  { name: "レッグエクステンション", category: "legs", equipment: "machine", reps: 12, aliases: ["レッグエクステ"] },
  { name: "レッグカール", category: "legs", equipment: "machine", reps: 12, aliases: ["legcurl"] },
  { name: "ヒップスラスト", category: "legs", equipment: "barbell", reps: 10, aliases: ["ヒップ", "hipthrust"] },
  { name: "カーフレイズ", category: "legs", equipment: "machine", reps: 15, aliases: ["カーフ", "calf"] },
  // 腕
  { name: "バーベルカール", category: "arms", equipment: "barbell", reps: 10, aliases: ["bbカール"] },
  { name: "ダンベルカール", category: "arms", equipment: "dumbbell", reps: 10, aliases: ["カール", "curl"] },
  { name: "ハンマーカール", category: "arms", equipment: "dumbbell", reps: 12, aliases: ["ハンマー"] },
  { name: "プリーチャーカール", category: "arms", equipment: "machine", reps: 12, aliases: ["プリーチャー"] },
  { name: "ケーブルプレスダウン", category: "arms", equipment: "cable", reps: 12, aliases: ["プレスダウン", "pushdown"] },
  { name: "スカルクラッシャー", category: "arms", equipment: "barbell", reps: 10, aliases: ["スカル", "ライイングエクステンション"] },
  { name: "フレンチプレス", category: "arms", equipment: "dumbbell", reps: 12, aliases: ["フレンチ"] },
  { name: "ナローベンチプレス", category: "arms", equipment: "barbell", reps: 8, aliases: ["ナロー", "クローズグリップ"] },
  // 腹
  { name: "クランチ", category: "core", equipment: "bodyweight", reps: 15, aliases: ["crunch"] },
  { name: "レッグレイズ", category: "core", equipment: "bodyweight", reps: 12, aliases: ["legraise"] },
  { name: "アブローラー", category: "core", equipment: "bodyweight", reps: 10, aliases: ["腹ローラー", "abroller"] },
  { name: "ケーブルクランチ", category: "core", equipment: "cable", reps: 15 },
  { name: "ロシアンツイスト", category: "core", equipment: "bodyweight", reps: 20, aliases: ["ツイスト"] },
];

export function exerciseFromLibrary(entry: LibraryEntry, id: string): Exercise {
  return {
    id,
    name: entry.name,
    aliases: entry.aliases ?? [],
    category: entry.category,
    equipment: entry.equipment,
    increment: INCREMENT[entry.equipment],
    targetReps: entry.reps,
    targetSets: 3,
  };
}

export function libraryMeta(name: string): { category: Category; equipment: Equipment } {
  const hit = LIBRARY.find((e) => e.name === name);
  return hit ? { category: hit.category, equipment: hit.equipment } : { category: "other", equipment: "machine" };
}

// ---------- split templates ----------

export type SplitDay = { key: string; name: string; focus: string; exercises: string[] };
export type Split = { id: string; name: string; frequency: string; summary: string; days: SplitDay[] };

export const SPLITS: Split[] = [
  {
    id: "ppl",
    name: "プッシュ / プル / レッグ",
    frequency: "週 3〜6 回",
    summary: "押す・引く・脚の 3 日で回す定番。週 6 回なら各部位を週 2 回鍛えられる。",
    days: [
      { key: "push", name: "Push", focus: "胸・肩・三頭", exercises: ["ベンチプレス", "インクラインダンベルプレス", "ショルダープレス", "サイドレイズ", "ケーブルプレスダウン"] },
      { key: "pull", name: "Pull", focus: "背中・二頭", exercises: ["懸垂", "ラットプルダウン", "ベントオーバーロウ", "フェイスプル", "ダンベルカール"] },
      { key: "legs", name: "Legs", focus: "脚・お尻・腹", exercises: ["スクワット", "ルーマニアンデッドリフト", "レッグプレス", "レッグカール", "カーフレイズ"] },
    ],
  },
  {
    id: "upper-lower",
    name: "上半身 / 下半身",
    frequency: "週 4 回",
    summary: "上半身と下半身を交互に。各部位を週 2 回鍛えられ、1 回の時間も短め。",
    days: [
      { key: "upper", name: "上半身", focus: "胸・背中・肩・腕", exercises: ["ベンチプレス", "ベントオーバーロウ", "ショルダープレス", "ラットプルダウン", "ダンベルカール", "ケーブルプレスダウン"] },
      { key: "lower", name: "下半身", focus: "脚・お尻・腹", exercises: ["スクワット", "ルーマニアンデッドリフト", "レッグプレス", "レッグカール", "カーフレイズ", "クランチ"] },
    ],
  },
  {
    id: "full-body",
    name: "全身",
    frequency: "週 2〜3 回",
    summary: "毎回全身を鍛える。ジムに行ける日が少ない週でも各部位を外さない。",
    days: [
      { key: "a", name: "全身 A", focus: "スクワット中心", exercises: ["スクワット", "ベンチプレス", "ベントオーバーロウ", "サイドレイズ", "クランチ"] },
      { key: "b", name: "全身 B", focus: "デッドリフト中心", exercises: ["デッドリフト", "ショルダープレス", "ラットプルダウン", "ブルガリアンスクワット", "ディップス"] },
    ],
  },
  {
    id: "bro",
    name: "部位別 5 分割",
    frequency: "週 5 回",
    summary: "1 日 1 部位を集中して追い込む。各部位は週 1 回。",
    days: [
      { key: "chest", name: "胸", focus: "胸", exercises: ["ベンチプレス", "インクラインダンベルプレス", "チェストプレス", "ダンベルフライ", "ケーブルクロスオーバー"] },
      { key: "back", name: "背中", focus: "背中", exercises: ["デッドリフト", "懸垂", "ラットプルダウン", "シーテッドロウ", "ワンハンドダンベルロウ"] },
      { key: "shoulders", name: "肩", focus: "肩", exercises: ["オーバーヘッドプレス", "サイドレイズ", "リアレイズ", "フェイスプル", "シュラッグ"] },
      { key: "legs", name: "脚", focus: "脚・お尻", exercises: ["スクワット", "レッグプレス", "ルーマニアンデッドリフト", "レッグエクステンション", "レッグカール", "カーフレイズ"] },
      { key: "arms", name: "腕", focus: "腕・腹", exercises: ["バーベルカール", "ハンマーカール", "ナローベンチプレス", "ケーブルプレスダウン", "アブローラー"] },
    ],
  },
];

export function getSplit(id: string): Split {
  return SPLITS.find((s) => s.id === id) ?? SPLITS[0];
}

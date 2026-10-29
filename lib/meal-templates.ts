import type { Nutrients } from "./types";

/**
 * Ready-made meals tuned for cutting while building muscle: cheap, quick, high protein, low fat.
 * Nutrition per ingredient follows typical Japanese food-composition / product-label values;
 * prices are rough supermarket (or konbini where noted) prices. Both are estimates.
 */
type Ingredient = { name: string; amount: string; yen: number; n: Nutrients };

const ing = (name: string, amount: string, yen: number, kcal: number, protein: number, fat: number, carbs: number): Ingredient => ({
  name,
  amount,
  yen,
  n: { kcal, protein, fat, carbs },
});

const I = {
  saladChicken: ing("サラダチキン", "1 個（110g）", 250, 121, 26, 1.5, 0.5),
  chickenBreast150: ing("鶏むね肉（皮なし）", "150g", 120, 158, 35, 2.9, 0.2),
  sasami100: ing("鶏ささみ", "100g（2 本）", 100, 98, 23.9, 0.8, 0.1),
  egg: ing("卵", "1 個", 25, 71, 6.1, 5.1, 0.2),
  tuna: ing("ツナ缶（水煮・ノンオイル）", "1 缶（70g）", 110, 50, 11, 0.5, 0.1),
  natto: ing("納豆", "1 パック", 30, 86, 7.4, 4.5, 5.4),
  tofu: ing("絹ごし豆腐", "150g", 40, 84, 8, 5.3, 3),
  greek: ing("ギリシャヨーグルト（無脂肪）", "1 個（113g）", 150, 92, 12.2, 0, 11.1),
  protein: ing("プロテイン（ホエイ）", "1 杯（30g）", 70, 115, 22, 1.5, 3),
  lowfatMilk: ing("低脂肪牛乳", "200ml", 40, 92, 7.6, 2, 11),
  rice150: ing("ご飯", "150g（茶碗 1 杯）", 40, 234, 3.8, 0.5, 55.7),
  rice100: ing("ご飯", "100g（小盛り）", 27, 156, 2.5, 0.3, 37.1),
  oatmeal: ing("オートミール", "30g", 20, 105, 4.1, 1.7, 20.7),
  broccoli: ing("冷凍ブロッコリー", "100g", 40, 34, 4, 0.5, 5),
  salad: ing("カット野菜", "1 袋（150g）", 100, 30, 1.5, 0.2, 6),
  kimchi50: ing("キムチ", "50g", 40, 14, 1.4, 0.2, 2.7),
  kimchi100: ing("キムチ", "100g", 80, 28, 2.8, 0.4, 5.4),
  banana: ing("バナナ", "1 本", 30, 93, 1.1, 0.2, 22.5),
  miso: ing("インスタント味噌汁", "1 杯", 30, 30, 2, 1, 4),
  onigiri: ing("おにぎり（鮭）", "1 個", 160, 180, 5, 1.5, 38),
  konbiniTofu: ing("豆腐（コンビニ）", "1 パック（150g）", 100, 84, 8, 5.3, 3),
  konbiniMiso: ing("味噌汁（コンビニ）", "1 杯", 150, 30, 2, 1, 4),
};

export type MealTiming = "朝" | "昼" | "夜" | "間食";

export type MealTemplate = {
  id: string;
  name: string;
  timing: MealTiming[];
  source: "コンビニ" | "自炊";
  minutes: number;
  ingredients: Ingredient[];
  steps: string[];
};

export const MEAL_TEMPLATES: MealTemplate[] = [
  {
    id: "konbini-chicken-set",
    name: "コンビニ高たんぱく定食",
    timing: ["昼"],
    source: "コンビニ",
    minutes: 0,
    ingredients: [I.saladChicken, I.salad, I.onigiri],
    steps: ["サラダチキン・カット野菜（サラダ）・鮭おにぎりを買う", "サラダチキンを手でほぐしてサラダに乗せる"],
  },
  {
    id: "konbini-tofu-night",
    name: "コンビニ夜（炭水化物なし）",
    timing: ["夜"],
    source: "コンビニ",
    minutes: 0,
    ingredients: [I.saladChicken, I.konbiniTofu, I.konbiniMiso],
    steps: ["サラダチキン・豆腐・味噌汁を買う", "豆腐は醤油を少しだけ。夜の炭水化物を抜いてカロリーを大きく削る"],
  },
  {
    id: "chicken-microwave-bowl",
    name: "鶏むねレンジ蒸し丼",
    timing: ["昼", "夜"],
    source: "自炊",
    minutes: 10,
    ingredients: [I.chickenBreast150, I.rice150, I.broccoli],
    steps: [
      "鶏むねを薄くそぎ切りにして耐熱皿に並べ、酒と塩をひとつまみ",
      "冷凍ブロッコリーも乗せ、ふんわりラップして 600W で 3 分 → 裏返して 2 分",
      "ご飯に乗せてポン酢をかける（5 食分まとめて作り置きも可）",
    ],
  },
  {
    id: "chicken-kimchi",
    name: "鶏むねキムチ炒め＋ご飯小盛り",
    timing: ["夜"],
    source: "自炊",
    minutes: 10,
    ingredients: [I.chickenBreast150, I.kimchi100, I.rice100],
    steps: ["鶏むねを一口大に切る", "テフロンのフライパンで油なしで焼き、火が通ったらキムチを入れて 1 分炒める", "ご飯は小盛り 100g"],
  },
  {
    id: "tuna-natto-kimchi",
    name: "ツナ納豆キムチ卵丼",
    timing: ["昼", "夜"],
    source: "自炊",
    minutes: 3,
    ingredients: [I.tuna, I.natto, I.kimchi50, I.egg, I.rice150],
    steps: ["ツナ缶の汁を切る", "ご飯にツナ・納豆・キムチ・卵を全部乗せて混ぜる。火も包丁も使わない"],
  },
  {
    id: "tofu-sasami-salad",
    name: "豆腐ささみサラダ",
    timing: ["夜"],
    source: "自炊",
    minutes: 5,
    ingredients: [I.tofu, I.sasami100, I.salad],
    steps: ["ささみを耐熱皿に乗せ、酒少々・ラップで 600W 2 分 → 裏返して 1 分、手でさく", "カット野菜に豆腐とささみを乗せてポン酢"],
  },
  {
    id: "oatmeal-tuna-zosui",
    name: "オートミール卵ツナ雑炊",
    timing: ["朝", "夜"],
    source: "自炊",
    minutes: 5,
    ingredients: [I.oatmeal, I.egg, I.tuna, I.miso],
    steps: ["丼にオートミール・味噌汁の素・水 150ml を入れて 600W で 1 分半", "ツナと溶き卵を入れて混ぜ、さらに 1 分"],
  },
  {
    id: "protein-oats",
    name: "プロテインオーツ＋バナナ",
    timing: ["朝"],
    source: "自炊",
    minutes: 2,
    ingredients: [I.protein, I.oatmeal, I.lowfatMilk, I.banana],
    steps: ["オートミールに低脂肪牛乳を入れて 600W で 1 分", "プロテインを混ぜ、バナナを切って乗せる"],
  },
  {
    id: "egg-natto-breakfast",
    name: "卵納豆ご飯＋味噌汁",
    timing: ["朝"],
    source: "自炊",
    minutes: 2,
    ingredients: [I.rice100, I.natto, I.egg, I.miso],
    steps: ["小盛りご飯に納豆と卵を乗せる", "インスタント味噌汁にお湯を注ぐ"],
  },
  {
    id: "protein-milk",
    name: "プロテイン＋低脂肪牛乳",
    timing: ["間食"],
    source: "自炊",
    minutes: 1,
    ingredients: [I.protein, I.lowfatMilk],
    steps: ["シェイカーで振るだけ。ジムの後や小腹がすいたときに"],
  },
  {
    id: "chicken-egg-snack",
    name: "サラダチキン＋ゆで卵",
    timing: ["間食"],
    source: "コンビニ",
    minutes: 0,
    ingredients: [I.saladChicken, I.egg],
    steps: ["コンビニで買うだけ。炭水化物ほぼゼロで夜食にも"],
  },
  {
    id: "greek-banana",
    name: "ギリシャヨーグルト＋バナナ",
    timing: ["朝", "間食"],
    source: "自炊",
    minutes: 1,
    ingredients: [I.greek, I.banana],
    steps: ["ヨーグルトにバナナを切って乗せる。甘いものが欲しいときの置き換えに"],
  },
];

export function templateTotals(t: MealTemplate): Nutrients & { yen: number } {
  return t.ingredients.reduce(
    (s, i) => ({
      kcal: s.kcal + i.n.kcal,
      protein: s.protein + i.n.protein,
      fat: s.fat + i.n.fat,
      carbs: s.carbs + i.n.carbs,
      yen: s.yen + i.yen,
    }),
    { kcal: 0, protein: 0, fat: 0, carbs: 0, yen: 0 },
  );
}

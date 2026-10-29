import type { Nutrients } from "./types";

/**
 * Ready-made meals built only from the staples Kai buys: chicken breast, beef+pork mince, eggs,
 * protein shake with milk and cheese, with carbs coming from fruit — banana, kiwi, berries (no rice or bread).
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
  // protein staples
  chicken150: ing("鶏むね肉（皮なし）", "150g", 120, 158, 35, 2.9, 0.2),
  chicken75: ing("鶏むね肉（皮なし・細かく刻む）", "75g", 60, 79, 17.5, 1.4, 0.1),
  saladChicken: ing("サラダチキン（コンビニ）", "1 個（110g）", 250, 121, 26, 1.5, 0.5),
  mince75: ing("合いびき肉（牛＋豚）", "75g", 110, 176, 13, 14.6, 0.2),
  egg: ing("卵", "1 個", 25, 71, 6.1, 5.1, 0.2),
  egg2: ing("卵", "2 個", 50, 142, 12.2, 10.2, 0.4),
  protein: ing("プロテイン（ホエイ）", "1 杯（30g）", 70, 115, 22, 1.5, 3),
  milk: ing("牛乳", "200ml", 45, 126, 6.8, 7.8, 9.9),
  cheeseSlice: ing("とろけるスライスチーズ", "1 枚（18g）", 30, 56, 4.1, 4.7, 0.2),
  cottage: ing("カッテージチーズ", "100g", 120, 99, 13.3, 4.5, 1.9),
  // fruit for carbs
  banana: ing("バナナ", "1 本", 30, 93, 1.1, 0.2, 22.5),
  kiwi2: ing("キウイ", "2 個", 120, 86, 1.8, 0.4, 22),
  berries: ing("冷凍ミックスベリー", "100g", 80, 50, 0.7, 0.1, 12),
  cutFruit: ing("カットフルーツ（コンビニ）", "1 パック（120g）", 250, 65, 0.7, 0.1, 16),
  // volume
  broccoli: ing("冷凍ブロッコリー", "100g", 40, 34, 4, 0.5, 5),
  salad: ing("カット野菜", "1 袋（150g）", 100, 30, 1.5, 0.2, 6),
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
    id: "shake-banana",
    name: "プロテインシェイク＋バナナ",
    timing: ["朝", "間食"],
    source: "自炊",
    minutes: 1,
    ingredients: [I.protein, I.milk, I.banana],
    steps: ["シェイカーにプロテインと牛乳を入れて振る", "バナナと一緒に。ジムの前後にも"],
  },
  {
    id: "cheese-omelette-kiwi",
    name: "チーズオムレツ＋キウイ",
    timing: ["朝"],
    source: "自炊",
    minutes: 5,
    ingredients: [I.egg2, I.cheeseSlice, I.kiwi2],
    steps: ["卵 2 個を溶いてテフロンのフライパンで焼き、チーズを乗せて半分に折る", "キウイは半分に切ってスプーンで"],
  },
  {
    id: "shake-omelette",
    name: "卵 2 個＋プロテインシェイク＋バナナ",
    timing: ["朝"],
    source: "自炊",
    minutes: 5,
    ingredients: [I.egg2, I.protein, I.milk, I.banana],
    steps: ["卵はゆで卵か目玉焼き（油なし）", "プロテインを牛乳で割る。バナナで炭水化物を足す"],
  },
  {
    id: "chicken-steam-banana",
    name: "鶏むねレンジ蒸し＋バナナ",
    timing: ["昼", "夜"],
    source: "自炊",
    minutes: 10,
    ingredients: [I.chicken150, I.broccoli, I.banana],
    steps: [
      "鶏むねを薄くそぎ切りにして耐熱皿に並べ、酒と塩をひとつまみ",
      "冷凍ブロッコリーも乗せ、ふんわりラップして 600W で 3 分 → 裏返して 2 分。ポン酢で",
      "5 食分まとめて作って冷蔵しておくと、毎回チンするだけ",
    ],
  },
  {
    id: "chicken-cheese",
    name: "鶏むねチーズ焼き＋ブロッコリー",
    timing: ["夜"],
    source: "自炊",
    minutes: 12,
    ingredients: [I.chicken150, I.cheeseSlice, I.broccoli],
    steps: ["鶏むねを観音開きにして塩こしょう", "テフロンのフライパンで両面焼き、最後にチーズを乗せてフタ", "ブロッコリーはレンジで。夜は果物なしで炭水化物を抑える"],
  },
  {
    id: "half-hamburg",
    name: "鶏むねハーフハンバーグ＋キウイ",
    timing: ["昼", "夜"],
    source: "自炊",
    minutes: 15,
    ingredients: [I.mince75, I.chicken75, I.egg, I.salad, I.kiwi2],
    steps: [
      "鶏むねを包丁で細かく刻み、合いびき肉・卵・塩こしょうと混ぜる（合いびきだけより脂質が半分近くになる）",
      "2 つに丸めてフライパンで焼き、フタをして中まで火を通す",
      "カット野菜と、デザートにキウイ",
    ],
  },
  {
    id: "mince-cheese-bowl",
    name: "合いびき＋鶏むねチーズそぼろ（ご飯なし）＋キウイ",
    timing: ["昼"],
    source: "自炊",
    minutes: 10,
    ingredients: [I.mince75, I.chicken75, I.cheeseSlice, I.salad, I.kiwi2],
    steps: [
      "鶏むねを細かく刻み、合いびき肉と一緒に炒める。出た脂はキッチンペーパーで吸い取る",
      "醤油・みりん少々で味付け、チーズを乗せて溶かす",
      "カット野菜の上に乗せてタコライス風に。炭水化物はキウイで",
    ],
  },
  {
    id: "mince-egg-scramble",
    name: "合いびき卵炒め＋ベリー",
    timing: ["朝", "昼"],
    source: "自炊",
    minutes: 7,
    ingredients: [I.mince75, I.egg2, I.berries],
    steps: ["合いびき肉を炒めて脂を拭き取り、溶き卵を入れて大きく混ぜる", "冷凍ベリーは解凍してそのまま"],
  },
  {
    id: "konbini-chicken-fruit",
    name: "コンビニ：サラダチキン＋ゆで卵＋カットフルーツ",
    timing: ["昼", "夜"],
    source: "コンビニ",
    minutes: 0,
    ingredients: [I.saladChicken, I.egg, I.cutFruit],
    steps: ["サラダチキン・ゆで卵・カットフルーツを買うだけ"],
  },
  {
    id: "shake-only",
    name: "プロテインシェイク（牛乳）",
    timing: ["間食"],
    source: "自炊",
    minutes: 1,
    ingredients: [I.protein, I.milk],
    steps: ["シェイカーで振るだけ。たんぱく質が足りない日の夜にも"],
  },
  {
    id: "cottage-berries",
    name: "カッテージチーズ＋ベリー",
    timing: ["朝", "間食"],
    source: "自炊",
    minutes: 1,
    ingredients: [I.cottage, I.berries],
    steps: ["カッテージチーズに冷凍ベリーを乗せる。甘いものが欲しいときの置き換えに"],
  },
  {
    id: "egg-berries-snack",
    name: "ゆで卵 2 個＋ベリー",
    timing: ["間食"],
    source: "自炊",
    minutes: 0,
    ingredients: [I.egg2, I.berries],
    steps: ["ゆで卵はまとめて 6 個ゆでて冷蔵しておく"],
  },
  {
    id: "preworkout-fruit",
    name: "ジム前のフルーツ（バナナ＋キウイ）",
    timing: ["間食"],
    source: "自炊",
    minutes: 0,
    ingredients: [I.banana, I.kiwi2],
    steps: ["ジムの 30〜60 分前に。脂質ほぼゼロで、トレーニングのエネルギーになる"],
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

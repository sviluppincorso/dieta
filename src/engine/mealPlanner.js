import { findFood } from './foodDatabase';

export const DEFAULT_MACROS = { kcal: 2150, pro: 160, carb: 220, fat: 60 };

const MEAL_DISTRIBUTION = [
  { key: 'colazione', ratio: 0.22, name: '🌅 Colazione' },
  { key: 'spuntino1', ratio: 0.08, name: '🥜 Spuntino mattina' },
  { key: 'pranzo', ratio: 0.32, name: '🍝 Pranzo' },
  { key: 'spuntino2', ratio: 0.08, name: '🍌 Spuntino pomeriggio' },
  { key: 'cena', ratio: 0.30, name: '🥗 Cena' },
];

export function parseIngredients(text) {
  if (!text.trim()) return [];
  const lines = text.split(/[,\n;]+/).map(l => l.trim().toLowerCase()).filter(Boolean);
  const found = [];
  const seen = new Set();
  for (const line of lines) {
    const food = findFood(line);
    if (food && !seen.has(food.name)) {
      seen.add(food.name);
      found.push(food);
    } else if (!food) {
      found.push({ name: line, kcal: 0, pro: 0, carb: 0, fat: 0, category: 'unknown', notFound: true });
    }
  }
  return found;
}

export function generateDayPlan(ingredients, macros = DEFAULT_MACROS) {
  const available = ingredients.filter(i => !i.notFound);
  if (available.length === 0) return null;

  const proteins = available.filter(f => f.category === 'protein');
  const carbs = available.filter(f => f.category === 'carb');
  const fats = available.filter(f => f.category === 'fat');
  const veggies = available.filter(f => f.category === 'veggie');

  const meals = [];
  let usedMacros = { kcal: 0, pro: 0, carb: 0, fat: 0 };

  for (let i = 0; i < MEAL_DISTRIBUTION.length; i++) {
    const config = MEAL_DISTRIBUTION[i];
    const isSnack = config.key.startsWith('spuntino');
    const targetMacros = {
      kcal: Math.round(macros.kcal * config.ratio),
      pro: Math.round(macros.pro * config.ratio),
      carb: Math.round(macros.carb * config.ratio),
      fat: Math.round(macros.fat * config.ratio),
    };

    const mealItems = isSnack
      ? buildSnack({ proteins, carbs, fats, veggies }, targetMacros, i)
      : buildMainMeal({ proteins, carbs, fats, veggies }, targetMacros, i);

    const mealMacros = calcMacros(mealItems);
    usedMacros = sumMacros(usedMacros, mealMacros);
    meals.push({ name: config.name, items: mealItems, macros: mealMacros });
  }

  const remaining = diffMacros(macros, usedMacros);
  return { meals, totalMacros: usedMacros, remaining, targetMacros: macros };
}

export function generateSingleMeal(ingredients, remainingMacros) {
  const available = ingredients.filter(i => !i.notFound);
  if (available.length === 0) return null;

  const proteins = available.filter(f => f.category === 'protein');
  const carbs = available.filter(f => f.category === 'carb');
  const fats = available.filter(f => f.category === 'fat');
  const veggies = available.filter(f => f.category === 'veggie');

  const mealItems = buildOptimizedMeal({ proteins, carbs, fats, veggies }, remainingMacros);
  const mealMacros = calcMacros(mealItems);
  const newRemaining = diffMacros(remainingMacros, mealMacros);

  return {
    meal: { name: '🍽️ Pasto suggerito', items: mealItems, macros: mealMacros },
    remaining: newRemaining,
  };
}

/**
 * Genera pranzo e cena separatamente con ingredienti diversi.
 * Aggiunge anche spuntini (yogurt/whey) e colazione suggerita.
 */
export function generateLunchDinner(lunchIngredients, dinnerIngredients, macros = DEFAULT_MACROS) {
  const lunchAvailable = lunchIngredients.filter(i => !i.notFound);
  const dinnerAvailable = dinnerIngredients.filter(i => !i.notFound);

  if (lunchAvailable.length === 0 || dinnerAvailable.length === 0) return null;

  // Pranzo: 32% dei macro
  const lunchTarget = {
    kcal: Math.round(macros.kcal * 0.32),
    pro: Math.round(macros.pro * 0.32),
    carb: Math.round(macros.carb * 0.32),
    fat: Math.round(macros.fat * 0.32),
  };

  const lunchProteins = lunchAvailable.filter(f => f.category === 'protein');
  const lunchCarbs = lunchAvailable.filter(f => f.category === 'carb');
  const lunchFats = lunchAvailable.filter(f => f.category === 'fat');
  const lunchVeggies = lunchAvailable.filter(f => f.category === 'veggie');

  const lunchItems = buildMainMeal({ proteins: lunchProteins, carbs: lunchCarbs, fats: lunchFats, veggies: lunchVeggies }, lunchTarget, 2);
  const lunchMacros = calcMacros(lunchItems);

  // Cena: 30% dei macro
  const dinnerTarget = {
    kcal: Math.round(macros.kcal * 0.30),
    pro: Math.round(macros.pro * 0.30),
    carb: Math.round(macros.carb * 0.30),
    fat: Math.round(macros.fat * 0.30),
  };

  const dinnerProteins = dinnerAvailable.filter(f => f.category === 'protein');
  const dinnerCarbs = dinnerAvailable.filter(f => f.category === 'carb');
  const dinnerFats = dinnerAvailable.filter(f => f.category === 'fat');
  const dinnerVeggies = dinnerAvailable.filter(f => f.category === 'veggie');

  const dinnerItems = buildMainMeal({ proteins: dinnerProteins, carbs: dinnerCarbs, fats: dinnerFats, veggies: dinnerVeggies }, dinnerTarget, 4);
  const dinnerMacros = calcMacros(dinnerItems);

  // Spuntini: SEMPRE presenti con 30g whey OPPURE yogurt greco/skyr
  // Sono fissi, non dipendono dall'input utente
  const snack1Items = buildFixedSnack();
  const snack1Rounded = roundGrams(snack1Items);
  const snack1Macros = calcMacros(snack1Rounded);

  const snack2Items = buildFixedSnack();
  const snack2Rounded = roundGrams(snack2Items);
  const snack2Macros = calcMacros(snack2Rounded);

  const totalMacros = [lunchMacros, dinnerMacros, snack1Macros, snack2Macros].reduce(sumMacros, { kcal: 0, pro: 0, carb: 0, fat: 0 });
  const remaining = diffMacros(macros, totalMacros);

  return {
    lunch: { name: '🍝 Pranzo', items: lunchItems, macros: lunchMacros },
    dinner: { name: '🥗 Cena', items: dinnerItems, macros: dinnerMacros },
    snack1: { name: '🥜 Spuntino mattina', items: snack1Rounded, macros: snack1Macros },
    snack2: { name: '🍌 Spuntino pomeriggio', items: snack2Rounded, macros: snack2Macros },
    totalMacros,
    remaining,
  };
}

function buildMainMeal(groups, target, seed) {
  const items = [];

  // Escludi yogurt/whey dai pasti principali (sono riservati agli spuntini)
  const mainProteins = groups.proteins.filter(f => !SNACK_ONLY_PROTEINS.includes(f.name));

  if (mainProteins.length > 0) {
    const p = pickByIndex(mainProteins, seed);
    const grams = p.pro > 0 ? Math.round((target.pro / p.pro) * 100) : 150;
    items.push({ ...p, grams: clamp(grams, 50, 250) });
  }

  if (groups.carbs.length > 0) {
    const c = pickByIndex(groups.carbs, seed + 1);
    const currentCarb = items.reduce((s, i) => s + (i.carb * i.grams / 100), 0);
    const neededCarb = Math.max(0, target.carb - currentCarb);
    const grams = c.carb > 0 ? Math.round((neededCarb / c.carb) * 100) : 80;
    items.push({ ...c, grams: clamp(grams, 30, 200) });
  }

  if (groups.veggies.length > 0) {
    const v = pickByIndex(groups.veggies, seed + 2);
    items.push({ ...v, grams: 150 });
  }

  if (groups.fats.length > 0) {
    const currentFat = items.reduce((s, i) => s + (i.fat * i.grams / 100), 0);
    const neededFat = target.fat - currentFat;
    if (neededFat > 3) {
      const f = pickByIndex(groups.fats, seed);
      const grams = f.fat > 0 ? Math.round((neededFat / f.fat) * 100) : 10;
      items.push({ ...f, grams: clamp(grams, 5, 30) });
    }
  }

  return roundGrams(items);
}

// Alimenti ESCLUSIVI per spuntini — non usarli nei pasti principali
const SNACK_ONLY_PROTEINS = ['yogurt greco', 'whey'];

/**
 * Spuntino FISSO: 30g whey OPPURE yogurt greco/skyr (~330g per 30g pro)
 * Sempre presente in ogni piano, indipendentemente dall'input utente.
 */
function buildFixedSnack() {
  // Default: 30g whey (= 24g pro) oppure yogurt greco 330g (= ~30g pro)
  // Usiamo yogurt greco come default (più saziante, più realistico)
  const yogurt = { name: 'yogurt greco', kcal: 97, pro: 9, carb: 3.6, fat: 5, category: 'protein', aliases: ['greek yogurt', 'skyr'] };
  // 30g di proteine da yogurt greco: 30 / 9 * 100 = 333g
  const grams = Math.round((30 / yogurt.pro) * 100);
  return [{ ...yogurt, grams: clamp(grams, 150, 400) }];
}

function buildSnack(groups, target, seed) {
  // Spuntino FISSO: sempre yogurt greco o whey per 30g di proteine
  return buildFixedSnack();
}

function buildOptimizedMeal(groups, remaining) {
  const items = [];

  if (groups.proteins.length > 0 && remaining.pro > 5) {
    const p = pickBest(groups.proteins, 'pro', remaining.pro);
    const grams = p.pro > 0 ? Math.round((remaining.pro / p.pro) * 100) : 150;
    items.push({ ...p, grams: clamp(grams, 80, 300) });
  }

  if (groups.carbs.length > 0 && remaining.carb > 10) {
    const currentCarb = items.reduce((s, i) => s + (i.carb * i.grams / 100), 0);
    const neededCarb = Math.max(0, remaining.carb - currentCarb);
    if (neededCarb > 10) {
      const c = pickBest(groups.carbs, 'carb', neededCarb);
      const grams = c.carb > 0 ? Math.round((neededCarb / c.carb) * 100) : 80;
      items.push({ ...c, grams: clamp(grams, 40, 250) });
    }
  }

  if (groups.veggies.length > 0) {
    items.push({ ...groups.veggies[0], grams: 150 });
  }

  if (groups.fats.length > 0 && remaining.fat > 5) {
    const currentFat = items.reduce((s, i) => s + (i.fat * i.grams / 100), 0);
    const neededFat = Math.max(0, remaining.fat - currentFat);
    if (neededFat > 3) {
      const f = groups.fats[0];
      const grams = f.fat > 0 ? Math.round((neededFat / f.fat) * 100) : 10;
      items.push({ ...f, grams: clamp(grams, 5, 40) });
    }
  }

  return roundGrams(items);
}

function calcMacros(items) {
  return items.reduce((acc, item) => {
    const r = (item.grams || 0) / 100;
    return {
      kcal: Math.round(acc.kcal + item.kcal * r),
      pro: Math.round(acc.pro + item.pro * r),
      carb: Math.round(acc.carb + item.carb * r),
      fat: Math.round(acc.fat + item.fat * r),
    };
  }, { kcal: 0, pro: 0, carb: 0, fat: 0 });
}

function sumMacros(a, b) {
  return { kcal: a.kcal + b.kcal, pro: a.pro + b.pro, carb: a.carb + b.carb, fat: a.fat + b.fat };
}

function diffMacros(target, used) {
  return {
    kcal: Math.max(0, target.kcal - used.kcal),
    pro: Math.max(0, target.pro - used.pro),
    carb: Math.max(0, target.carb - used.carb),
    fat: Math.max(0, target.fat - used.fat),
  };
}

function pickByIndex(arr, seed) { return arr[seed % arr.length]; }

function pickBest(arr, macro, targetAmount) {
  return arr.reduce((best, item) => {
    const gramsNeeded = item[macro] > 0 ? (targetAmount / item[macro]) * 100 : Infinity;
    const bestGrams = best[macro] > 0 ? (targetAmount / best[macro]) * 100 : Infinity;
    return gramsNeeded < bestGrams ? item : best;
  }, arr[0]);
}

function clamp(g, min, max) { return Math.max(min, Math.min(max, g)); }

// Peso medio di 1 uovo intero ≈ 60g
const EGG_WEIGHT = 60;

function roundGrams(items) {
  return items.map(item => {
    const grams = Math.round(item.grams / 5) * 5;

    // Per le uova, mostra il numero
    if (item.name === 'uova' || item.name === 'albume') {
      const count = Math.round(grams / EGG_WEIGHT);
      const displayName = item.name === 'uova'
        ? `uova (${count} ${count === 1 ? 'uovo' : 'uova'})`
        : `albume (${count} ${count === 1 ? 'albume' : 'albumi'})`;
      return { ...item, grams, displayName };
    }

    return { ...item, grams };
  });
}

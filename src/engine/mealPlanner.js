import { findFood } from './foodDatabase';

/**
 * Macro target di default (177cm, 76kg, 10k passi + corsa, fat loss)
 */
export const DEFAULT_MACROS = {
  kcal: 2150,
  pro: 160,
  carb: 220,
  fat: 60,
};

/**
 * Distribuzione pasti nella giornata (% dei macro totali)
 */
const MEAL_DISTRIBUTION = [
  { key: 'colazione', ratio: 0.22, name: '🌅 Colazione' },
  { key: 'spuntino1', ratio: 0.08, name: '🥜 Spuntino mattina' },
  { key: 'pranzo', ratio: 0.32, name: '🍝 Pranzo' },
  { key: 'spuntino2', ratio: 0.08, name: '🍌 Spuntino pomeriggio' },
  { key: 'cena', ratio: 0.30, name: '🥗 Cena' },
];

/**
 * Parsa l'input utente e restituisce gli alimenti riconosciuti
 */
export function parseIngredients(text) {
  if (!text.trim()) return [];

  const lines = text
    .split(/[,\n;]+/)
    .map(l => l.trim().toLowerCase())
    .filter(Boolean);

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

/**
 * Genera un piano giornaliero completo usando SOLO gli alimenti disponibili
 */
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

    // Calcola macro target per questo pasto
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

    meals.push({
      name: config.name,
      items: mealItems,
      macros: mealMacros,
    });
  }

  const remaining = diffMacros(macros, usedMacros);

  return { meals, totalMacros: usedMacros, remaining, targetMacros: macros };
}

/**
 * Genera un singolo pasto ottimizzato per chiudere i macro rimanenti
 */
export function generateSingleMeal(ingredients, remainingMacros) {
  const available = ingredients.filter(i => !i.notFound);
  if (available.length === 0) return null;

  const proteins = available.filter(f => f.category === 'protein');
  const carbs = available.filter(f => f.category === 'carb');
  const fats = available.filter(f => f.category === 'fat');
  const veggies = available.filter(f => f.category === 'veggie');

  // Per il pasto singolo, usiamo un approccio greedy ottimizzato
  const mealItems = buildOptimizedMeal({ proteins, carbs, fats, veggies }, remainingMacros);

  const mealMacros = calcMacros(mealItems);
  const newRemaining = diffMacros(remainingMacros, mealMacros);

  return {
    meal: { name: '🍽️ Pasto suggerito', items: mealItems, macros: mealMacros },
    remaining: newRemaining,
  };
}

/**
 * Costruisce un pasto principale (pranzo/cena/colazione)
 */
function buildMainMeal(groups, target, seed) {
  const items = [];

  // 1. Proteina principale
  if (groups.proteins.length > 0) {
    const p = pickByIndex(groups.proteins, seed);
    // Calcola grammi per raggiungere target proteine
    const gramsForPro = p.pro > 0 ? Math.round((target.pro / p.pro) * 100) : 150;
    items.push({ ...p, grams: clamp(gramsForPro, 50, 250) });
  }

  // 2. Fonte di carboidrati
  if (groups.carbs.length > 0) {
    const c = pickByIndex(groups.carbs, seed + 1);
    const currentCarb = items.reduce((s, i) => s + (i.carb * i.grams / 100), 0);
    const neededCarb = Math.max(0, target.carb - currentCarb);
    const gramsForCarb = c.carb > 0 ? Math.round((neededCarb / c.carb) * 100) : 80;
    items.push({ ...c, grams: clamp(gramsForCarb, 30, 200) });
  }

  // 3. Verdura (sempre ~150g se disponibile)
  if (groups.veggies.length > 0) {
    const v = pickByIndex(groups.veggies, seed + 2);
    items.push({ ...v, grams: 150 });
  }

  // 4. Grasso — solo se serve per raggiungere target
  if (groups.fats.length > 0) {
    const currentFat = items.reduce((s, i) => s + (i.fat * i.grams / 100), 0);
    const neededFat = target.fat - currentFat;
    if (neededFat > 3) {
      const f = pickByIndex(groups.fats, seed);
      const gramsForFat = f.fat > 0 ? Math.round((neededFat / f.fat) * 100) : 10;
      items.push({ ...f, grams: clamp(gramsForFat, 5, 30) });
    }
  }

  return roundGrams(items);
}

/**
 * Costruisce uno spuntino leggero
 */
function buildSnack(groups, target, seed) {
  const items = [];

  // Proteina leggera (yogurt, whey, bresaola, ecc.)
  if (groups.proteins.length > 0) {
    const p = pickByIndex(groups.proteins, seed + 3);
    const gramsForPro = p.pro > 0 ? Math.round((target.pro / p.pro) * 100) : 100;
    items.push({ ...p, grams: clamp(gramsForPro, 20, 200) });
  }

  // Carb leggero (frutta, fette, ecc.)
  if (groups.carbs.length > 0) {
    const c = pickByIndex(groups.carbs, seed + 4);
    const currentCarb = items.reduce((s, i) => s + (i.carb * i.grams / 100), 0);
    const neededCarb = Math.max(0, target.carb - currentCarb);
    if (neededCarb > 5) {
      const gramsForCarb = c.carb > 0 ? Math.round((neededCarb / c.carb) * 100) : 50;
      items.push({ ...c, grams: clamp(gramsForCarb, 20, 120) });
    }
  }

  return roundGrams(items);
}

/**
 * Pasto singolo ottimizzato — cerca di chiudere i macro rimanenti
 */
function buildOptimizedMeal(groups, remaining) {
  const items = [];

  // Priorità: proteine > carb > fat (per fat loss)
  if (groups.proteins.length > 0 && remaining.pro > 5) {
    const p = pickBest(groups.proteins, 'pro', remaining.pro);
    const gramsForPro = p.pro > 0 ? Math.round((remaining.pro / p.pro) * 100) : 150;
    items.push({ ...p, grams: clamp(gramsForPro, 80, 300) });
  }

  if (groups.carbs.length > 0 && remaining.carb > 10) {
    const currentCarb = items.reduce((s, i) => s + (i.carb * i.grams / 100), 0);
    const neededCarb = Math.max(0, remaining.carb - currentCarb);
    if (neededCarb > 10) {
      const c = pickBest(groups.carbs, 'carb', neededCarb);
      const gramsForCarb = c.carb > 0 ? Math.round((neededCarb / c.carb) * 100) : 80;
      items.push({ ...c, grams: clamp(gramsForCarb, 40, 250) });
    }
  }

  if (groups.veggies.length > 0) {
    const v = groups.veggies[0];
    items.push({ ...v, grams: 150 });
  }

  if (groups.fats.length > 0 && remaining.fat > 5) {
    const currentFat = items.reduce((s, i) => s + (i.fat * i.grams / 100), 0);
    const neededFat = Math.max(0, remaining.fat - currentFat);
    if (neededFat > 3) {
      const f = groups.fats[0];
      const gramsForFat = f.fat > 0 ? Math.round((neededFat / f.fat) * 100) : 10;
      items.push({ ...f, grams: clamp(gramsForFat, 5, 40) });
    }
  }

  return roundGrams(items);
}

// --- Utility ---

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

function pickByIndex(arr, seed) {
  return arr[seed % arr.length];
}

function pickBest(arr, macro, targetAmount) {
  // Scegli l'alimento che richiede meno grammi per raggiungere il target
  return arr.reduce((best, item) => {
    const gramsNeeded = item[macro] > 0 ? (targetAmount / item[macro]) * 100 : Infinity;
    const bestGrams = best[macro] > 0 ? (targetAmount / best[macro]) * 100 : Infinity;
    return gramsNeeded < bestGrams ? item : best;
  }, arr[0]);
}

function clamp(g, min, max) {
  return Math.max(min, Math.min(max, g));
}

function roundGrams(items) {
  return items.map(item => ({
    ...item,
    grams: Math.round(item.grams / 5) * 5, // Arrotonda a multipli di 5g
  }));
}

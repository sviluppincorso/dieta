// Database nutrizionale per 100g di alimento
const FOOD_DB = {
  // Proteine
  'pollo': { kcal: 165, pro: 31, carb: 0, fat: 3.6, category: 'protein', aliases: ['petto di pollo', 'chicken'] },
  'tacchino': { kcal: 135, pro: 30, carb: 0, fat: 1.5, category: 'protein', aliases: ['petto di tacchino'] },
  'manzo': { kcal: 250, pro: 26, carb: 0, fat: 15, category: 'protein', aliases: ['carne rossa', 'bistecca', 'vitello'] },
  'maiale': { kcal: 242, pro: 27, carb: 0, fat: 14, category: 'protein', aliases: ['lonza', 'braciola'] },
  'salmone': { kcal: 208, pro: 20, carb: 0, fat: 13, category: 'protein', aliases: ['salmon'] },
  'tonno': { kcal: 130, pro: 29, carb: 0, fat: 1, category: 'protein', aliases: ['tonno in scatola', 'tuna'] },
  'merluzzo': { kcal: 82, pro: 18, carb: 0, fat: 0.7, category: 'protein', aliases: ['pesce bianco', 'cod'] },
  'gamberi': { kcal: 99, pro: 24, carb: 0, fat: 0.3, category: 'protein', aliases: ['gamberetti'] },
  'uova': { kcal: 155, pro: 13, carb: 1.1, fat: 11, category: 'protein', aliases: ['uovo'] },
  'albume': { kcal: 52, pro: 11, carb: 0.7, fat: 0.2, category: 'protein', aliases: ['albumi'] },
  'ricotta': { kcal: 174, pro: 11, carb: 3, fat: 13, category: 'protein', aliases: ['ricotta vaccina'] },
  'mozzarella': { kcal: 280, pro: 22, carb: 2, fat: 20, category: 'protein', aliases: ['mozzarella di bufala'] },
  'parmigiano': { kcal: 431, pro: 38, carb: 0, fat: 29, category: 'protein', aliases: ['grana', 'grana padano'] },
  'yogurt greco': { kcal: 97, pro: 9, carb: 3.6, fat: 5, category: 'protein', aliases: ['greek yogurt', 'skyr'] },
  'tofu': { kcal: 76, pro: 8, carb: 1.9, fat: 4.8, category: 'protein', aliases: [] },
  'lenticchie': { kcal: 116, pro: 9, carb: 20, fat: 0.4, category: 'protein', aliases: ['lenticchie cotte'] },
  'ceci': { kcal: 164, pro: 9, carb: 27, fat: 2.6, category: 'protein', aliases: ['ceci cotti'] },
  'fagioli': { kcal: 127, pro: 9, carb: 21, fat: 0.5, category: 'protein', aliases: ['fagioli cotti', 'cannellini', 'borlotti'] },
  'prosciutto cotto': { kcal: 145, pro: 22, carb: 1, fat: 5, category: 'protein', aliases: ['prosciutto'] },
  'bresaola': { kcal: 151, pro: 33, carb: 0, fat: 2, category: 'protein', aliases: [] },
  'whey': { kcal: 400, pro: 80, carb: 8, fat: 6, category: 'protein', aliases: ['proteine in polvere', 'protein powder', 'shake'] },

  // Carboidrati
  'riso': { kcal: 130, pro: 2.7, carb: 28, fat: 0.3, category: 'carb', aliases: ['riso basmati', 'riso integrale', 'rice'] },
  'pasta': { kcal: 131, pro: 5, carb: 25, fat: 1.1, category: 'carb', aliases: ['spaghetti', 'penne', 'fusilli', 'rigatoni'] },
  'pane': { kcal: 265, pro: 9, carb: 49, fat: 3.2, category: 'carb', aliases: ['pane integrale', 'bread'] },
  'patate': { kcal: 77, pro: 2, carb: 17, fat: 0.1, category: 'carb', aliases: ['patata', 'potato'] },
  'avena': { kcal: 389, pro: 17, carb: 66, fat: 7, category: 'carb', aliases: ['fiocchi di avena', 'oats', 'porridge'] },
  'fette biscottate': { kcal: 408, pro: 11, carb: 75, fat: 6, category: 'carb', aliases: ['fette'] },
  'quinoa': { kcal: 120, pro: 4.4, carb: 21, fat: 1.9, category: 'carb', aliases: [] },
  'cous cous': { kcal: 112, pro: 3.8, carb: 23, fat: 0.2, category: 'carb', aliases: ['couscous'] },
  'banana': { kcal: 89, pro: 1.1, carb: 23, fat: 0.3, category: 'carb', aliases: ['banane'] },
  'mela': { kcal: 52, pro: 0.3, carb: 14, fat: 0.2, category: 'carb', aliases: ['mele', 'apple'] },
  'miele': { kcal: 304, pro: 0.3, carb: 82, fat: 0, category: 'carb', aliases: [] },
  'marmellata': { kcal: 250, pro: 0.4, carb: 60, fat: 0.1, category: 'carb', aliases: ['confettura'] },

  // Grassi
  'olio evo': { kcal: 884, pro: 0, carb: 0, fat: 100, category: 'fat', aliases: ['olio', 'olio di oliva', 'olive oil'] },
  'burro di arachidi': { kcal: 588, pro: 25, carb: 20, fat: 50, category: 'fat', aliases: ['peanut butter'] },
  'avocado': { kcal: 160, pro: 2, carb: 9, fat: 15, category: 'fat', aliases: [] },
  'noci': { kcal: 654, pro: 15, carb: 14, fat: 65, category: 'fat', aliases: ['walnut'] },
  'mandorle': { kcal: 579, pro: 21, carb: 22, fat: 49, category: 'fat', aliases: ['almonds'] },
  'burro': { kcal: 717, pro: 0.9, carb: 0.1, fat: 81, category: 'fat', aliases: [] },
  'cioccolato fondente': { kcal: 546, pro: 5, carb: 60, fat: 31, category: 'fat', aliases: ['cioccolato', 'dark chocolate'] },

  // Verdure
  'zucchine': { kcal: 17, pro: 1.2, carb: 3.1, fat: 0.3, category: 'veggie', aliases: ['zucchina'] },
  'spinaci': { kcal: 23, pro: 2.9, carb: 3.6, fat: 0.4, category: 'veggie', aliases: ['spinach'] },
  'broccoli': { kcal: 34, pro: 2.8, carb: 7, fat: 0.4, category: 'veggie', aliases: ['broccolo'] },
  'pomodori': { kcal: 18, pro: 0.9, carb: 3.9, fat: 0.2, category: 'veggie', aliases: ['pomodoro', 'tomato'] },
  'insalata': { kcal: 15, pro: 1.4, carb: 2.9, fat: 0.2, category: 'veggie', aliases: ['lattuga', 'rucola', 'misticanza'] },
  'peperoni': { kcal: 31, pro: 1, carb: 6, fat: 0.3, category: 'veggie', aliases: ['peperone'] },
  'funghi': { kcal: 22, pro: 3.1, carb: 3.3, fat: 0.3, category: 'veggie', aliases: ['champignon'] },
  'carote': { kcal: 41, pro: 0.9, carb: 10, fat: 0.2, category: 'veggie', aliases: ['carota'] },
  'melanzane': { kcal: 25, pro: 1, carb: 6, fat: 0.2, category: 'veggie', aliases: ['melanzana'] },
  'cavolfiore': { kcal: 25, pro: 1.9, carb: 5, fat: 0.3, category: 'veggie', aliases: [] },
  'asparagi': { kcal: 20, pro: 2.2, carb: 3.9, fat: 0.1, category: 'veggie', aliases: [] },
};

export function findFood(input) {
  const term = input.toLowerCase().trim();
  if (FOOD_DB[term]) return { name: term, ...FOOD_DB[term] };
  for (const [name, data] of Object.entries(FOOD_DB)) {
    if (data.aliases.some(a => a === term)) return { name, ...data };
  }
  for (const [name, data] of Object.entries(FOOD_DB)) {
    if (name.includes(term) || term.includes(name)) return { name, ...data };
    if (data.aliases.some(a => a.includes(term) || term.includes(a))) return { name, ...data };
  }
  return null;
}

export function getAllFoods() {
  return Object.entries(FOOD_DB).map(([name, data]) => ({ name, ...data }));
}

export default FOOD_DB;

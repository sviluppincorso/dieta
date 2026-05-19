import React, { useState } from 'react';
import { DEFAULT_MACROS, parseIngredients, generateDayPlan, generateSingleMeal } from './engine/mealPlanner';
import { getAllFoods } from './engine/foodDatabase';

function App() {
  const [mode, setMode] = useState('day');
  const [fridgeInput, setFridgeInput] = useState('');
  const [macros, setMacros] = useState({ ...DEFAULT_MACROS });
  const [consumed, setConsumed] = useState({ kcal: 0, pro: 0, carb: 0, fat: 0 });
  const [result, setResult] = useState(null);
  const [loading, setLoading] = useState(false);
  const [showFoodList, setShowFoodList] = useState(false);

  const handleGenerate = () => {
    setLoading(true);
    setResult(null);
    setTimeout(() => {
      const ingredients = parseIngredients(fridgeInput);
      const recognized = ingredients.filter(i => !i.notFound);

      if (recognized.length === 0) {
        setResult({ error: 'Nessun alimento riconosciuto. Prova con: pollo, riso, uova, pasta, olio evo, zucchine...' });
        setLoading(false);
        return;
      }

      if (mode === 'day') {
        const plan = generateDayPlan(ingredients, macros);
        setResult({ type: 'day', plan, unrecognized: ingredients.filter(i => i.notFound) });
      } else {
        const remaining = {
          kcal: Math.max(0, macros.kcal - consumed.kcal),
          pro: Math.max(0, macros.pro - consumed.pro),
          carb: Math.max(0, macros.carb - consumed.carb),
          fat: Math.max(0, macros.fat - consumed.fat),
        };
        const plan = generateSingleMeal(ingredients, remaining);
        setResult({ type: 'single', plan, unrecognized: ingredients.filter(i => i.notFound) });
      }
      setLoading(false);
    }, 500);
  };

  const allFoods = getAllFoods();
  const foodsByCategory = {
    protein: allFoods.filter(f => f.category === 'protein'),
    carb: allFoods.filter(f => f.category === 'carb'),
    fat: allFoods.filter(f => f.category === 'fat'),
    veggie: allFoods.filter(f => f.category === 'veggie'),
  };

  function addToFridge(name) {
    setFridgeInput(prev => {
      if (!prev.trim()) return name;
      return prev + ', ' + name;
    });
  }

  return (
    <div className="app">
      <header className="header">
        <h1>🍽️ MealDecider</h1>
        <p>Dimmi cosa hai in frigo. Decido io.</p>
      </header>

      <div className="mode-selector">
        <button className={`mode-btn ${mode === 'day' ? 'active' : ''}`} onClick={() => { setMode('day'); setResult(null); }}>
          📅 Cosa mangio oggi?
        </button>
        <button className={`mode-btn ${mode === 'single' ? 'active' : ''}`} onClick={() => { setMode('single'); setResult(null); }}>
          🍴 Cosa mangio adesso?
        </button>
      </div>

      <div className="section">
        <div className="section-title">🧊 Cosa hai in frigo?</div>
        <textarea
          className="input-area"
          placeholder={"Scrivi gli alimenti separati da virgola o a capo\nEs: pollo, riso, zucchine, uova, olio evo, banana"}
          value={fridgeInput}
          onChange={e => setFridgeInput(e.target.value)}
        />
        <button className="food-list-toggle" onClick={() => setShowFoodList(!showFoodList)}>
          {showFoodList ? '▲ Nascondi alimenti' : '▼ Mostra alimenti disponibili'}
        </button>
        {showFoodList && (
          <div className="food-list">
            <FoodCategory title="🥩 Proteine" foods={foodsByCategory.protein} onAdd={addToFridge} />
            <FoodCategory title="🍚 Carboidrati" foods={foodsByCategory.carb} onAdd={addToFridge} />
            <FoodCategory title="🥑 Grassi" foods={foodsByCategory.fat} onAdd={addToFridge} />
            <FoodCategory title="🥬 Verdure" foods={foodsByCategory.veggie} onAdd={addToFridge} />
          </div>
        )}
      </div>

      <div className="section">
        <div className="section-title">🎯 Macro giornalieri target</div>
        <div className="macro-grid">
          <MacroInput label="Kcal" value={macros.kcal} onChange={v => setMacros({ ...macros, kcal: v })} />
          <MacroInput label="Pro (g)" value={macros.pro} onChange={v => setMacros({ ...macros, pro: v })} />
          <MacroInput label="Carb (g)" value={macros.carb} onChange={v => setMacros({ ...macros, carb: v })} />
          <MacroInput label="Fat (g)" value={macros.fat} onChange={v => setMacros({ ...macros, fat: v })} />
        </div>
      </div>

      {mode === 'single' && (
        <div className="section">
          <div className="section-title">✅ Macro già consumati oggi</div>
          <div className="macro-grid">
            <MacroInput label="Kcal" value={consumed.kcal} onChange={v => setConsumed({ ...consumed, kcal: v })} />
            <MacroInput label="Pro (g)" value={consumed.pro} onChange={v => setConsumed({ ...consumed, pro: v })} />
            <MacroInput label="Carb (g)" value={consumed.carb} onChange={v => setConsumed({ ...consumed, carb: v })} />
            <MacroInput label="Fat (g)" value={consumed.fat} onChange={v => setConsumed({ ...consumed, fat: v })} />
          </div>
          <div className="remaining-preview">
            <span>Rimanenti: </span>
            <strong>{Math.max(0, macros.kcal - consumed.kcal)}</strong> kcal ·
            <strong> {Math.max(0, macros.pro - consumed.pro)}</strong>g pro ·
            <strong> {Math.max(0, macros.carb - consumed.carb)}</strong>g carb ·
            <strong> {Math.max(0, macros.fat - consumed.fat)}</strong>g fat
          </div>
        </div>
      )}

      <button className="generate-btn" onClick={handleGenerate} disabled={!fridgeInput.trim() || loading}>
        {loading ? '⏳ Calcolo...' : '⚡ Genera pasto'}
      </button>

      {loading && <div className="loading"><div className="spinner" /><p>Sto decidendo per te...</p></div>}

      {result && result.error && (
        <div className="result-card"><h3>⚠️ Attenzione</h3><p>{result.error}</p></div>
      )}

      {result && result.type === 'day' && result.plan && (
        <DayPlanResult plan={result.plan} unrecognized={result.unrecognized} />
      )}

      {result && result.type === 'single' && result.plan && (
        <SingleMealResult plan={result.plan} unrecognized={result.unrecognized} />
      )}
    </div>
  );
}

function FoodCategory({ title, foods, onAdd }) {
  return (
    <div className="food-category">
      <div className="food-category-title">{title}</div>
      <div className="food-chips">
        {foods.map(f => (
          <button key={f.name} className="food-chip" onClick={() => onAdd(f.name)}>{f.name}</button>
        ))}
      </div>
    </div>
  );
}

function MacroInput({ label, value, onChange }) {
  return (
    <div className="macro-input">
      <label>{label}</label>
      <input type="number" inputMode="numeric" value={value} onChange={e => onChange(Number(e.target.value) || 0)} min="0" />
    </div>
  );
}

function MealCard({ meal }) {
  return (
    <div className="result-card">
      <h3>{meal.name}</h3>
      {meal.items.map((item, i) => (
        <div key={i} className="meal-item">
          <span className="food">{item.name}</span>
          <span className="grams">{item.grams}g</span>
        </div>
      ))}
      <MacroSummary macros={meal.macros} />
    </div>
  );
}

function MacroSummary({ macros }) {
  return (
    <div className="macro-summary">
      <div className="macro-pill kcal"><div className="value">{macros.kcal}</div><div className="label">kcal</div></div>
      <div className="macro-pill pro"><div className="value">{macros.pro}g</div><div className="label">pro</div></div>
      <div className="macro-pill carb"><div className="value">{macros.carb}g</div><div className="label">carb</div></div>
      <div className="macro-pill fat"><div className="value">{macros.fat}g</div><div className="label">fat</div></div>
    </div>
  );
}

function DayPlanResult({ plan, unrecognized }) {
  return (
    <>
      {unrecognized.length > 0 && (
        <div className="result-card" style={{ borderLeftColor: 'var(--warning)' }}>
          <h3>❓ Non riconosciuti</h3>
          <p style={{ fontSize: '0.85rem', color: 'var(--text-muted)' }}>{unrecognized.map(u => u.name).join(', ')}</p>
        </div>
      )}
      {plan.meals.map((meal, i) => <MealCard key={i} meal={meal} />)}
      <div className="remaining-banner">
        <h4>📊 Totale giornata</h4>
        <MacroSummary macros={plan.totalMacros} />
      </div>
      {(plan.remaining.kcal > 50 || plan.remaining.pro > 5) && (
        <div className="remaining-banner" style={{ marginTop: '8px', opacity: 0.8 }}>
          <h4>Macro rimanenti</h4>
          <MacroSummary macros={plan.remaining} />
        </div>
      )}
    </>
  );
}

function SingleMealResult({ plan, unrecognized }) {
  return (
    <>
      {unrecognized.length > 0 && (
        <div className="result-card" style={{ borderLeftColor: 'var(--warning)' }}>
          <h3>❓ Non riconosciuti</h3>
          <p style={{ fontSize: '0.85rem', color: 'var(--text-muted)' }}>{unrecognized.map(u => u.name).join(', ')}</p>
        </div>
      )}
      <MealCard meal={plan.meal} />
      <div className="remaining-banner">
        <h4>📊 Macro rimanenti dopo questo pasto</h4>
        <MacroSummary macros={plan.remaining} />
      </div>
    </>
  );
}

export default App;

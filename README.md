# 🍽️ MealDecider

**"Dimmi cosa hai in frigo. Decido io cosa mangi."**

Web app PWA (mobile-friendly) che genera pasti ottimizzati in base a:
- Alimenti disponibili in frigo
- Macro giornalieri target (kcal, proteine, carbo, grassi)

## Come funziona

1. Inserisci cosa hai in frigo (es: pollo, riso, uova, zucchine)
2. Scegli la modalità:
   - **"Cosa mangio oggi?"** → piano completo (colazione, pranzo, cena, spuntini)
   - **"Cosa mangio adesso?"** → singolo pasto ottimizzato
3. Premi "Genera pasto"
4. L'app decide per te con quantità precise in grammi

## Macro default

- 2150 kcal
- 160g proteine
- 220g carboidrati
- 60g grassi

(Personalizzabili dall'interfaccia)

## Deploy su Vercel (gratis)

1. Pusha questo repo su GitHub
2. Vai su [vercel.com](https://vercel.com)
3. Importa il repo
4. Deploy automatico — ricevi un link tipo `meal-decider.vercel.app`

## Dev locale

```bash
npm install
npm run dev
```

## Tech stack

- React 18
- Vite 6
- CSS custom (no framework)
- Zero backend — logica tutta client-side
- PWA ready (installabile su mobile)

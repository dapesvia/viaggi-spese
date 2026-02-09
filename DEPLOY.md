# 🚀 Guida al Deploy

## Opzione 1: Vercel (Consigliato)

1. Vai su [vercel.com](https://vercel.com)
2. Clicca "New Project"
3. Importa il repository: `https://github.com/dapesvia/viaggi-spese`
4. Configura le variabili d'ambiente:
   - `VITE_SUPABASE_URL`: `https://ovdmyqhzqzfaryzqfkzf.supabase.co`
   - `VITE_SUPABASE_ANON_KEY`: (la chiave già configurata)
5. Clicca "Deploy"

✅ L'app sarà online in 2-3 minuti!

## Opzione 2: Netlify

1. Vai su [netlify.com](https://netlify.com)
2. Clicca "Add new site" → "Import an existing project"
3. Connetti GitHub e seleziona `viaggi-spese`
4. Build settings:
   - Build command: `npm run build`
   - Publish directory: `dist`
5. Aggiungi le variabili d'ambiente (come sopra)
6. Clicca "Deploy"

## Opzione 3: GitHub Pages

```bash
# Installa gh-pages
npm install -D gh-pages

# Aggiungi al package.json:
"scripts": {
  "deploy": "vite build && gh-pages -d dist"
}

# Deploy
npm run deploy
```

## 📱 Installazione come PWA

Una volta deployata, l'app può essere installata sul telefono:

### iOS (Safari)
1. Apri l'app nel browser
2. Tocca il pulsante "Condividi"
3. Scorri e tocca "Aggiungi a Home"

### Android (Chrome)
1. Apri l'app nel browser
2. Tocca i tre puntini in alto
3. Tocca "Installa app" o "Aggiungi a Home"

## 🔐 Sicurezza

Le credenziali Supabase sono già configurate nel file `.env.local` (che NON è su GitHub).

Per il deploy, dovrai configurare le variabili d'ambiente sulla piattaforma di hosting.

## 🔄 Aggiornamenti

Ogni volta che fai push su GitHub, l'app si aggiornerà automaticamente su Vercel/Netlify.

```bash
git add .
git commit -m "Descrizione modifiche"
git push
```

# 🌍 TravelMate - Viaggi e Spese

App per gestire viaggi e spese condivise tra Alex e Valentina.

## 🚀 Caratteristiche

- ✈️ Gestione viaggi
- 💰 Tracciamento spese condivise
- 📊 Bilancio automatico tra utenti
- 📱 Ottimizzato per mobile
- 🌙 Tema chiaro/scuro
- 🔄 Sincronizzazione real-time con Supabase

## 🛠️ Tecnologie

- **React 18** + **Vite** - Framework e build tool
- **TypeScript** - Type safety
- **Tailwind CSS** - Styling
- **Framer Motion** - Animazioni
- **Supabase** - Database e backend
- **React Router** - Routing

## 📦 Installazione

```bash
# Clona il repository
git clone https://github.com/dapesvia/viaggi-spese.git
cd viaggi-spese

# Installa le dipendenze
npm install

# Copia il file .env.local.example in .env.local
# e configura le tue credenziali Supabase

# Avvia il server di sviluppo
npm run dev
```

## 🗄️ Database Setup

Il database Supabase è già configurato. Lo schema include:

- **trips** - Viaggi
- **expenses** - Spese
- **profiles** - Profili utenti
- **itinerary_items** - Elementi itinerario

## 🌐 Deploy

L'app può essere deployata su:
- Vercel
- Netlify
- GitHub Pages
- Qualsiasi hosting statico

```bash
# Build per produzione
npm run build

# Preview build
npm run preview
```

## 👥 Utenti

L'app supporta due utenti:
- 👨 **Alex**
- 👩 **Valentina**

All'avvio viene richiesto di selezionare l'utente corrente.

## 📱 Mobile First

L'app è ottimizzata per dispositivi mobile con:
- Touch gestures ottimizzati
- Tastierino numerico per inserimento rapido
- Safe area support per iOS
- PWA ready

## 📄 Licenza

Uso privato - Alex & Valentina

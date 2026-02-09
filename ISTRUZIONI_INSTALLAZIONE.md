# 🚨 Problema con il nome della cartella

Il carattere `&` nel nome della cartella "viaggi&spese" causa problemi su Windows con npm.

## Soluzione Rapida

### Opzione 1: Rinomina la cartella (CONSIGLIATO)

1. Chiudi VSCode/Kiro
2. Rinomina la cartella da `viaggi&spese` a `viaggi-spese` o `travelmate`
3. Riapri la cartella rinominata in Kiro
4. Esegui:
   ```bash
   npm install
   npm run dev
   ```

### Opzione 2: Sposta il progetto

1. Copia tutti i file in una nuova cartella senza caratteri speciali:
   ```bash
   C:\Users\Alex\Desktop\travelmate
   ```
2. Apri la nuova cartella in Kiro
3. Esegui:
   ```bash
   npm install
   npm run dev
   ```

## Dopo l'installazione

1. L'app sarà disponibile su: http://localhost:3000
2. Configura Supabase nel file `.env.local` (opzionale per ora)

## Note

- Il progetto è già completo e pronto all'uso
- Puoi testare l'UI anche senza Supabase configurato
- I dati di esempio sono già presenti per vedere l'interfaccia

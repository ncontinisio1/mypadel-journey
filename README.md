# Iron Log

Tracker di allenamento in un singolo file HTML + PWA. Nessuna dipendenza di
rete: CSS e JS sono inline, i font sono quelli di sistema.

## Contenuto della cartella

```
index.html                 app completa (CSS + JS inline)
sw.js                      service worker — offline + aggiornamenti
manifest.json              metadati PWA (nome, icone, standalone)
apple-touch-icon.png       180x180, icona Home iOS
icon-192.png               192x192
icon-512.png               512x512
icon-512-maskable.png      512x512, icona adattiva Android
.nojekyll                  disattiva Jekyll su GitHub Pages
README.md                  questo file
```

## Deploy su GitHub Pages

1. Copia tutti i file nella **root** del repo.
2. Settings -> Pages -> Source: `Deploy from a branch` -> `main` / `root`.
3. Apri l'URL HTTPS dal telefono.
   - iOS/Safari: Condividi -> **Aggiungi a schermata Home**
   - Android/Chrome: menu -> **Installa app**

I percorsi sono tutti relativi (`./`), quindi funziona identico su
`utente.github.io` e su `utente.github.io/nome-repo/`.

## A ogni aggiornamento: bump di BUILD

Apri `sw.js`, prima riga utile:

```js
const BUILD = '2026-09-21-1';   // <-- cambiala SEMPRE prima del push
```

Se non la cambi, il telefono continua a servire la versione in cache e non
vedrai mai le modifiche. Con la bump, al rientro nell'app compare il banner
arancione "Nuova versione disponibile -> Aggiorna".

## Modificare il programma

Tutto in `index.html`, due strutture:

**`EX`** — catalogo nome esercizio -> etichetta:
```js
const EX = { panca: "Panca Piana", ... };
```

**`D`** — i quattro giorni. Un esercizio:
```js
{ k:"panca", rec:180,
  s:{ W1:"4x4", W2:"4x4", W3:"5x3", W4:"3x3 + 2x5", W5:"2x5" },
  w:{ W1:kg(82.5), ..., W4:kg(90,75), W5:kg(60) } }
```

- `k`   chiave del catalogo `EX`
- `rec` recupero in secondi
- `s`   schema serie x reps per settimana
- `w`   carico per settimana:
  - `kg(100)` carico unico
  - `kg(90,75)` un valore per blocco (per schemi come `3x3 + 2x5`)
  - `bw()` / `bw(5)` peso corporeo, eventualmente zavorrato
  - `nt("leggero")` carico non numerico

Il numero di serie e' **derivato dallo schema**, non dichiarato a parte: se
scrivi `"3x3 + 2x5"` l'app genera 5 bottoni e sa che gli ultimi due sono a 5
reps col secondo carico. In un superset con esercizi di lunghezza diversa,
quello piu' corto viene escluso dalle serie in eccesso.

Un superset e' un gruppo con `sup:true` e due esercizi in `exs`.

## Dati

Salvataggio in `localStorage`, chiavi prefissate `ironlog.v10.*`.
Ogni serie completata scrive una riga nel log:

```json
{ "ts": 1758..., "day":"LUN", "week":"W1", "ex":"panca",
  "set":1, "reps":"4", "kg":82.5, "bw":false, "rpe":8 }
```

Da li' esce l'e1RM (formula di Epley: `kg * (1 + reps/30)`), mostrato sotto
ogni esercizio e nello Storico.

**Fai i backup.** `localStorage` e' storage di sito, non un archivio: si perde
con "cancella dati di navigazione", non migra al cambio telefono, e su iOS puo'
essere rimosso dalle policy di storage di Safari dopo periodi di inutilizzo.
Usa Dati -> Esporta JSON. Dopo 14 giorni senza export l'app te lo ricorda.
Il file si reimporta da Dati -> Importa.

## Limiti noti

- **Service worker solo su HTTPS o localhost.** GitHub Pages va bene. In locale
  serve `python -m http.server`, non `file://`.
- **Wake Lock**: Chrome Android e Safari iOS 16.4+. Sotto, lo schermo si spegne
  normalmente e l'app funziona comunque.
- **Audio a schermo bloccato**: il beep puo' non partire. La vibrazione su
  Android e' piu' affidabile. Garantire una notifica a telefono bloccato
  richiederebbe push server-side.
- **Nessun cloud sync.** E' deliberato: zero backend, zero account, zero costi.

## Test in locale

```bash
cd ironlog
python -m http.server 8000
# poi apri http://localhost:8000
```

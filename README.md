# Iron Log

Tracker di allenamento: un singolo HTML + PWA installabile.
Nessuna dipendenza di rete — CSS e JS inline, font di sistema.

## Contenuto

```
index.html                 app completa (CSS + JS inline)
sw.js                      service worker — offline + aggiornamenti
manifest.json              metadati PWA
apple-touch-icon.png       180x180, icona Home iOS
icon-192.png / icon-512.png
icon-512-maskable.png      icona adattiva Android
.nojekyll                  disattiva Jekyll su GitHub Pages
```

## Deploy su GitHub Pages

1. Copia i file nella **root** del repo.
2. Settings -> Pages -> Source: `Deploy from a branch` -> `main` / `root`.
3. Apri l'URL HTTPS dal telefono.
   - iOS/Safari: Condividi -> **Aggiungi a schermata Home**
   - Android/Chrome: menu -> **Installa app**

Percorsi tutti relativi (`./`): funziona identico su `utente.github.io`
e su `utente.github.io/nome-repo/`.

## A ogni aggiornamento: bump di BUILD

In cima a `sw.js`:

```js
const BUILD = '2026-09-21-4';   // <-- cambiala SEMPRE prima del push
```

Senza la bump il telefono continua a servire la versione in cache.
Con la bump, al rientro nell'app compare il banner "Nuova versione -> Aggiorna".

## Modificare il programma

**`EX`** — catalogo chiave -> nome visualizzato.

**`D`** — i quattro giorni. Un esercizio:

```js
{ k:"panca", rec:180,
  s:{ W1:"4x4", W4:"3x3 + 2x5", ... },
  w:{ W1:kg(82.5), W4:kg(90,75), ... } }
```

- `k`   chiave del catalogo `EX`
- `rec` recupero in secondi
- `s`   schema per settimana. A schermo la card mostra **solo le reps**
        (`8 rip`), perche' il numero di serie e' gia' dato dai pallini.
        Schemi misti come `"3x3 + 2x5"` diventano `3·3·3·5·5 rip`,
        che si legge posizionalmente sui cinque pallini.
- `w`   carico per settimana:
  - `kg(100)` carico unico
  - `kg(90,75)` un valore per blocco dello schema
  - `bw()` / `bw(5)` peso corporeo, eventualmente zavorrato
  - `nt("leggero")` carico non numerico

Il numero di serie e' **derivato dallo schema**: `"3x3 + 2x5"` genera 5 bottoni
e le ultime due serie usano il secondo carico. In un superset con esercizi di
lunghezza diversa, quello piu' corto esce dalle serie in eccesso.

Superset = gruppo con `sup:true` e due esercizi in `exs`.

## Font

L'app usa il **font di sistema**: SF Pro su iOS, Roboto su Android,
Segoe UI Variable su Windows. Nessun download, nessuna dipendenza di rete,
resa nativa su ogni piattaforma.

Le variabili `--f-sans` e `--f-disp` in `:root` controllano i due stack.
Per sostituirli con un font tuo, vedi `fonts/LEGGIMI.txt`.

## Dati

`localStorage`, chiavi `ironlog.v10.*`. Ogni serie completata scrive:

```json
{ "ts":1758…, "day":"LUN", "week":"W1", "ex":"panca",
  "set":1, "reps":"4", "kg":82.5, "bw":false, "rpe":8 }
```

Da li' esce l'e1RM (Epley: `kg * (1 + reps/30)`), in card e nello Storico.

**Fai i backup.** `localStorage` e' storage di sito, non un archivio: si perde
con "cancella dati di navigazione", non migra al cambio telefono, e su iOS puo'
essere rimosso dalle policy di storage di Safari dopo periodi di inutilizzo.
Dati -> Esporta JSON. Dopo 14 giorni senza export l'app te lo ricorda.

## Limiti noti

- **Service worker solo su HTTPS o localhost.** In locale: `python -m http.server`.
- **Wake Lock**: Chrome Android e Safari iOS 16.4+. Sotto, lo schermo si spegne
  normalmente e l'app funziona comunque.
- **Audio a schermo bloccato**: il beep puo' non partire; la vibrazione su
  Android e' piu' affidabile.
- **Nessun cloud sync.** Deliberato: zero backend, zero account.

---
type: guida
tags: [sistema, jarvis, frontend]
created: 2026-07-18
updated: 2026-07-18
---

# 🤖 Jarvis — Guida al frontend

Frontend in `90 Sistema/Jarvis/`: `index.html` (interfaccia) + `server.js` (ponte con gli agenti) + `avvia-jarvis.bat`.

## Come si avvia (ogni volta)

**Doppio click su `avvia-jarvis.bat`** → parte il server e si apre http://127.0.0.1:8765 nel browser. Tutto qui.

## Setup una tantum (5 minuti)

1. **Login Claude CLI** (serve per la chat con gli agenti):
   apri un terminale (PowerShell) nella cartella del vault ed esegui `claude` → segui il login nel browser → poi chiudi pure. Da quel momento la chat di Jarvis funziona.
2. **Collega il vault** (serve per dashboard/clienti/task/note vocali):
   - Obsidian → Impostazioni → **Local REST API**: copia la **API Key** e attiva **"Enable Non-encrypted (HTTP) Server"** (porta 27123)
   - In Jarvis → **CONFIG**: URL `http://127.0.0.1:27123` + API Key → SALVA E CONNETTI
   - Obsidian deve restare aperto.

## Cosa fa

| Sezione | Funzione |
|---|---|
| **DASHBOARD** | Contatori, pipeline, briefing + 🔊 lettura vocale |
| **CHAT AGENTI** | Parli col team (testo o 🎙 voce): scegli l'agente (o "Automatico"), lui lavora DAVVERO sul vault e ti risponde. Risposte lette ad alta voce se attivi 🔊. Le risposte lunghe richiedono 1-3 minuti. |
| **CLIENTI / PROGETTI / TASK** | Letti in tempo reale dal frontmatter delle note |
| **AGENTI** | Rubrica del team, click = copia comando per Claudian |
| **NOTA VOCALE** | Detti una nota → salvata in `00 Inbox/` |
| **CONFIG** | URL + API key della Local REST API |

## Agenti disponibili nella chat

I 12 del team (ceo, dev, design, marketing, cmo, social, sales, finance, ops, legal, research, data-analyst) + 3 di manutenzione vault installati da aitmpl.com: `moc-agent` (mappe di navigazione), `connection-agent` (wikilink e note orfane), `metadata-agent` (frontmatter coerente).

## Note tecniche

- **Voce neurale (Voicebox)** ✔ INSTALLATO E CONFIGURATO il 19/07/2026: Voicebox 0.5.0 (`AppData\Local\Voicebox`), motore **Kokoro 82M** (ottimo su CPU), profili vocali italiani **"Jarvis"** (Nicola, maschile — predefinito) e **"Sara"** (femminile). Jarvis usa Voicebox quando è aperto, altrimenti la voce del browser. Cambio voce: CONFIG → 🎙 Voce. IMPORTANTE: **Voicebox deve essere aperto** (icona nel tray) perché la voce neurale funzioni — aprilo dal menu Start insieme a Obsidian.
- La chat lancia `claude -p` headless nella root del vault con `--permission-mode acceptEdits` (può creare/modificare note; i comandi di sistema restano bloccati).
- "NUOVA CONVERSAZIONE" azzera il contesto; altrimenti la chat continua l'ultima conversazione (`--continue`).
- STT/TTS usano la Web Speech API del browser (Chrome/Edge), voce italiana, gratis.

## Voce 2.0 (19/07/2026)

- **Dettatura Whisper locale**: quando Voicebox è aperto, i bottoni 🎙 DETTA registrano l'audio e lo trascrivono con Whisper (`whisper-small`, molto più preciso in italiano del browser). Il modello **si scarica da solo** al primo avvio del server con Voicebox aperto (~500 MB); finché non è pronto si usa automaticamente il riconoscimento del browser. Quando vedi il toast "Trascritto ✔ (Whisper)" è attivo.
- **Hey Jarvis (mani libere)**: clic su "HEY JARVIS: OFF" nella sidebar → diventa ON e ascolta in continuo. Di' *"Hey Jarvis"* → risponde "Dimmi", apre la chat, registra la tua frase e la **invia da sola** agli agenti. Riclicca per spegnere. (Richiede Chrome/Edge e permesso microfono.)
- `avvia-jarvis.bat` ora chiude da solo eventuali server vecchi rimasti appesi: un doppio click risolve sempre.

## Modalità Jarvis vera (19/07, notte)

Il flusso vocale ora è da film:
1. Dici **"Hey Jarvis"** → *ta-din* 🎧 (segnale acustico, il reattore diventa ambra e pulsa veloce, la riga in alto dice "Ti ascolto… parla pure."). **Non parla** — ascolta e basta. Hai 15 secondi.
2. Parli. Quando finisci la frase → *din-ta* ⚙ (il reattore pulsa velocissimo: sta elaborando).
3. **Appena la prima frase della risposta è pronta (pochi secondi), inizia a dirla a voce** — e nella modalità vocale **la voce guida: il testo compare sullo schermo man mano che viene pronunciato** (stile sottotitoli), non prima. Se gli agenti impiegano più di 8 secondi, dice "Un attimo, sto controllando" invece di stare in silenzio.
4. Quando ha finito di parlare, torna in ascolto da solo.

Puoi anche dire tutto in un colpo: "Hey Jarvis, che task ho aperti?" → salta il passo 1 e va dritto all'elaborazione.

## Novità 19/07 (sera)

- **Chat in streaming** ✔ — le risposte compaiono parola per parola mentre Claude lavora (con indicatore ⚙ quando usa uno strumento). Fallback automatico alla modalità classica.
- **Hey Jarvis migliorato** ✔ — ora: (1) chiede subito il permesso microfono quando lo attivi, (2) capisce anche "Gervis/Jervis/Giarvis" ecc. (il riconoscimento italiano storpia il nome), (3) mostra in alto **quello che sente** (`👂 "…"`) così vedi se ti ascolta.
- **PIPELINE (kanban)** ✔ — nuova sezione: trascina le schede cliente tra le colonne (da-qualificare → contattato → proposta → attivo → in-pausa → perso); lo stato viene scritto nel frontmatter della nota nel vault.
- **Grafici in dashboard** ✔ — barre "Progetti per stato" e "Task aperti per fronte", zero librerie.

## Roadmap (fase 3)

- [x] ~~Chat integrata con gli agenti~~ ✔
- [x] ~~STT/TTS~~ ✔ (Voicebox + Whisper)
- [x] ~~Voce sempre attiva ("Hey Jarvis")~~ ✔
- [x] ~~Viste CRM native (Bases)~~ ✔ (`Clienti.base`, `Progetti.base`, `Idee.base` nella Home)
- [x] ~~Streaming delle risposte in tempo reale~~ ✔
- [x] ~~Grafici e kanban pipeline~~ ✔ (sezione PIPELINE + grafici dashboard)

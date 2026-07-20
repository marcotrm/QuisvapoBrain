---
type: conversazione
agent: claude
tags: [conversazione, setup]
created: 2026-07-20
---

# 2026-07-20 — Setup del vault QuisvapoBrain

## Cosa è stato chiesto

Marco ha chiesto di replicare il sistema "SecondBrainME" (kit `SETUP-KIT-SecondBrain.md`) dentro la cartella del repo SvaPro, creando un assistente che tiene traccia del gestionale **solo per Quisvapo**, da dare al titolare (il "capo") per domande tipo *"quanto ha fatturato Marano in questi giorni?"*.

## Cosa è stato fatto / deciso

- Creata la struttura vault (00→90) **dentro la root del repo SvaPro**: le cartelle del vault sono escluse da git via `.git/info/exclude` (non verranno mai committate/deployate).
- Cartella di dominio: `60 Negozi/` (una nota per punto vendita, `Negozi.base`, `Template Negozio`). Prima scheda: [[Marano]].
- `CLAUDE.md` riscritto per il contesto Quisvapo: ambito SOLO insegna Quisvapo, fonti dati (export in Inbox → API report → DB sola lettura), divieto assoluto di scritture su DB/deploy, cattura totale, log conversazioni, sicurezza.
- 12 agenti adattati al retail svapo (`data-analyst` è l'agente principale per i numeri; endpoint fatturato: `/api/reports/store-revenue*`), + 3 agenti manutenzione vault copiati identici.
- Jarvis copiato e messo su porta **8766** (il Jarvis di SecondBrainME resta su 8765); `launch.json` aggiornato.
- Skills, template e Bases copiati; `Home.md` nuova con domande tipiche e tabella agenti.

## Contesto utile per il futuro (tono, preferenze, vincoli)

- L'utente finale (il capo) NON è tecnico: risposte semplici, numeri in evidenza, italiano.
- Mai inventare cifre di fatturato: se manca la fonte, dire come ottenerla.
- Il codice SvaPro condivide la cartella col vault: si tocca solo su richiesta esplicita di Marco.

## Aggiornamento (stessa sessione): dati dal gestionale + server Railway

- `server.js` esteso: proxy **`/api/gestionale/<endpoint>`** in SOLA LETTURA verso le API SvaPro (token in env `SVAPRO_API_TOKEN`, whitelist `reports/*`, `daily-reports`, `stores`, `dashboard`, solo GET), **password** via `JARVIS_PASSWORD` (HTTP Basic, loopback esente), ascolto su `0.0.0.0` con `JARVIS_PUBLIC`/Railway, avvio CLI cross-platform (Windows/Linux).
- `data-analyst` e `CLAUDE.md` aggiornati: la fonte principale dei numeri ora è il proxy (`curl http://127.0.0.1:${PORT:-8766}/api/gestionale/...`); permesso `Bash(curl:*)` aggiunto in settings.
- Kit deploy in `90 Sistema/Deploy Railway/`: Dockerfile (node + CLI claude), `railway-start.sh` (vault persistente su Volume), `prepara-deploy.ps1` → crea `C:\Users\Utente\Desktop\QuisvapoBrain-deploy` (repo git separato, già committato).
- Test superati: auth 401/200, proxy inoltra a quisvapo.app, whitelist 403, POST 405.

## Aggiornamento 2: repo online e scelta del motore

- Repo di deploy pushata su **https://github.com/marcotrm/QuisvapoBrain** (branch `main`, remote già configurato nella cartella di deploy).
- Scelta dell'utente: gli agenti sul server girano col **token dell'abbonamento Claude** (`CLAUDE_CODE_OAUTH_TOKEN` da `claude setup-token`), NON con API key né Groq (Groq non può eseguire il CLI Claude Code). Guida deploy aggiornata.

## Aggiornamento 3: fix post-primo-test sul server

Il primo test reale ("quanto ha fatturato Marano?") ha rivelato 3 problemi, tutti corretti e rideployati:
1. **Permessi**: sul server il CLI negava il curl al proxy. Ora il container gira con `JARVIS_SKIP_PERMISSIONS=1` + `IS_SANDBOX=1` (nel Dockerfile) e il server passa `--dangerously-skip-permissions` al posto di `acceptEdits`. In locale nulla cambia.
2. **Voce sul server**: aggiunto supporto **ElevenLabs** (`ELEVENLABS_API_KEY`, opzionale `ELEVENLABS_VOICE_ID`): il server genera l'audio, il browser lo riproduce (`ttsOnly`). Senza chiave, fallback browser migliorato (preferite voci Natural/Google).
3. **Niente cronaca**: `buildPrompt` ora impone lo stile "indaga in silenzio, poi SOLO la risposta"; regola aggiunta anche in CLAUDE.md ("Stile delle risposte").
Inoltre `railway-start.sh` ora aggiorna le parti di sistema (.claude, 90 Sistema, CLAUDE.md, Home.md) nel volume a ogni deploy, preservando le note.

## Aggiornamento 4: UI mobile-first per il capo + indagine "incongruenza"

- Niente ElevenLabs (scelta utente): voce = browser.
- **Nuova UI di questo Jarvis** (`index.html`, la versione completa è salvata come `index-completa.html`): solo **Dashboard** (incassato oggi/ieri/7gg/mese + classifica negozi da `store-revenue`) e **Chat** (streaming, suggerimenti, dettatura browser, toggle voce), mobile-first con bottom nav. Verificata in viewport mobile.
- **Indagine incongruenza Afragola 13/07 (€524,50 vs €885,00)**: NON sono dati corrotti — l'agente aveva confrontato `store-revenue` con `revenue-trend`, che misurano cose diverse: revenue-trend conta solo ordini `paid` (store-revenue tutti i non annullati), raggruppa i giorni in **UTC** (vendite serali slittano al giorno dopo) e senza `store_id` somma tutti i negozi. Fix: guida endpoint nel prompt del `data-analyst` (store-revenue = fonte di verità; revenue-trend vietato per fatturato; una chiamata sola → più veloce).
- **Voce "da assistente"**: STYLE impone la prima riga come frase discorsiva naturale; il frontend legge SOLO quella, senza centesimi ("848,50 €" → "848 euro e 50") e con "per cento".

## Prossimi passi

- [ ] Marco: aprire la cartella SvaPro come vault in Obsidian + plugin (Local REST API porta 27124, Claudian, Homepage → `Home`)
- [ ] Marco: `claude setup-token` sul PC → variabile `CLAUDE_CODE_OAUTH_TOKEN` su Railway
- [ ] Marco: generare `SVAPRO_API_TOKEN` (Sanctum, utente con accesso ai report) → variabile su Railway
- [ ] Railway: Deploy from GitHub → QuisvapoBrain, Variables (+ `JARVIS_PASSWORD`), Volume su `/data`, Generate Domain
- [ ] Aggiungere le schede degli altri negozi in `60 Negozi/`

---
type: guida
status: attivo
tags: [sistema, deploy, railway, jarvis]
created: 2026-07-20
---

# 🚂 QuisvapoBrain su Railway (server d'appoggio)

Obiettivo: il capo apre un **link** (es. `https://quisvapo-brain.up.railway.app`), mette la password e parla con gli agenti — senza PC di Marco acceso. I dati dei negozi arrivano **direttamente dal gestionale** tramite il proxy `/api/gestionale/*` del server Jarvis.

## Come funziona

- Il container contiene: **vault** (note markdown) + **Jarvis** (server.js) + **CLI `claude`**.
- `server.js` su Railway ascolta su `0.0.0.0` (automatico), chiede la **password** (`JARVIS_PASSWORD`, HTTP Basic) a chi arriva da fuori, e inoltra le chiamate `/api/gestionale/<endpoint>` alle API di SvaPro su quisvapo.app con il token `SVAPRO_API_TOKEN`.
- Con un **Volume** montato, le note scritte dagli agenti sul server sopravvivono ai redeploy (lo script `railway-start.sh` copia il vault nel volume al primo avvio).

## Passi (una volta sola)

1. **Prepara la cartella di deploy** (dal PC di Marco):
   ```powershell
   powershell -ExecutionPolicy Bypass -File "90 Sistema\Deploy Railway\prepara-deploy.ps1"
   ```
   Crea `C:\Users\Utente\Desktop\QuisvapoBrain-deploy` (solo vault, niente codice SvaPro).
2. **Repo GitHub privato**: `https://github.com/marcotrm/QuisvapoBrain` (già collegata come `origin` della cartella di deploy).
3. **Railway**: New Project → Deploy from GitHub repo → `quisvapo-brain` (rileva il Dockerfile da solo).
4. **Variabili d'ambiente** sul servizio (Settings → Variables):
   | Variabile | Valore |
   |---|---|
   | `CLAUDE_CODE_OAUTH_TOKEN` | token dell'abbonamento Claude: sul PC esegui una volta `claude setup-token` e incolla qui il risultato — gli agenti consumano l'abbonamento, non pay-per-use |
   | `JARVIS_PASSWORD` | la password che darai al capo |
   | `SVAPRO_API_TOKEN` | token API (Sanctum) di un utente SvaPro con accesso ai report |
   | `SVAPRO_API_URL` | `https://quisvapo.app` (solo se diverso dal default) |

   (Alternativa pay-per-use: `ANTHROPIC_API_KEY` da console.anthropic.com, eventualmente con `ANTHROPIC_MODEL=claude-haiku-4-5-20251001` per contenere i costi.)
5. **Volume**: sul servizio → Attach Volume (es. mount `/data`, 1 GB basta). Senza volume funziona lo stesso, ma le note scritte sul server si perdono a ogni redeploy.
6. **Dominio**: Settings → Networking → Generate Domain. Quel link + password è ciò che dai al capo.

## Aggiornare il vault sul server

Rilancia `prepara-deploy.ps1` e poi `git -C "C:\Users\Utente\Desktop\QuisvapoBrain-deploy" push`: Railway rideploya da solo. ⚠️ Se c'è il Volume, il vault "vivo" è quello nel volume: il redeploy aggiorna solo l'immagine (nuovi agenti/Jarvis arrivano, le note nel volume restano). Per forzare un re-seed completo cancella il contenuto del volume.

## Note e limiti

- **Voce (Voicebox/Whisper)**: solo in locale — sul server la UI funziona senza voce (gli endpoint rispondono "non disponibile").
- **Obsidian/REST API**: non esiste sul server; il badge "VAULT" della UI può restare offline — le note le scrivono comunque gli agenti sul filesystem.
- **Costi**: con `CLAUDE_CODE_OAUTH_TOKEN` gli agenti consumano i limiti dell'abbonamento Claude di Marco (se il capo chiede molto, i limiti orari/settimanali sono condivisi). Il token va rigenerato se viene revocato o scade (`claude setup-token`).
- **Sicurezza**: mai committare token/password nel repo di deploy; vivono solo nelle Variables di Railway. Il proxy gestionale è GET-only con whitelist (`reports/*`, `daily-reports`, `stores`, `dashboard`).

## In locale cambia qualcosa?

No: `avvia-jarvis.bat` continua a funzionare come prima (porta 8766, nessuna password). Se vuoi il proxy gestionale anche in locale, imposta prima la variabile: `set SVAPRO_API_TOKEN=...` e avvia il server dallo stesso terminale.

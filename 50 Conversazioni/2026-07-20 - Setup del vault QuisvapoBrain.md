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

## Prossimi passi

- [ ] Marco: installare plugin Obsidian (Local REST API porta dedicata, Claudian, Homepage → `Home`)
- [ ] Definire l'accesso dati per `data-analyst` (token API o utenza DB read-only)
- [ ] Aggiungere le schede degli altri negozi in `60 Negozi/`

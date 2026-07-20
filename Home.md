---
type: dashboard
tags: [dashboard, home]
created: 2026-07-20
---

# 🏠 Home — QuisvapoBrain

L'assistente della catena **Quisvapo**: tiene traccia del gestionale SvaPro (fatturati, negozi, magazzino) e della conoscenza dell'azienda.

> [!tip] Avvio rapido (ogni giorno)
> 1. Apri **Obsidian** (questo vault)
> 2. Doppio click su `90 Sistema\Jarvis\avvia-jarvis.bat` → si apre Jarvis nel browser, già connesso
> Fine. Per parlare con gli agenti usa la CHAT di Jarvis o Claudian (icona Claude qui in Obsidian).

> [!example] Domande tipiche da fare agli agenti
> - *"Quanto ha fatturato Marano in questi giorni?"* → agente `data-analyst`
> - *"Confronta gli incassi dei negozi a luglio"* → `data-analyst`
> - *"Che promo facciamo sui prodotti fermi?"* → `marketing`
> - *"Novità sulle accise?"* → `legal` / `research`

## 🚀 Accessi rapidi

- 📥 [[00 Inbox/Inbox|Inbox]] — appunti veloci ed export del gestionale da elaborare
- 🏪 [[60 Negozi/60 Negozi|Negozi]] — le schede dei punti vendita
- 💡 [[70 Idee/70 Idee|Idee]] — il serbatoio di TUTTE le idee
- 🤖 [[90 Sistema/Jarvis - Guida|Jarvis (dashboard)]] — il frontend in stile Jarvis
- 💬 [[50 Conversazioni/50 Conversazioni|Conversazioni AI]] — storico sessioni

## 🏪 Negozi Quisvapo

![[Negozi.base#Tutti i negozi]]

- [[Marano]] — punto di partenza; aggiungi una nota per ogni altro punto vendita con `Template Negozio`

## 📁 Progetti

- [[SvaPro (Gestionale)]] — il gestionale della catena — 🟢 ONLINE su quisvapo.app

## 📊 CRM live (Bases)

![[Clienti.base#Tutti i clienti]]

![[Idee.base#Vive]]

## 🧭 Aree

[[30 Aree/Vendite/Vendite|Vendite]] · [[Magazzino]] · [[Personale]] · [[Marketing]] · [[Finanza]] · [[Legale e Accise]] · [[Operations]] · [[Ricerca]]

## 🤖 Il team di agenti

Definiti in `.claude/agents/`. Si usano da Claudian o Claude Code: *"usa l'agente data-analyst per…"*

| Agente | Ruolo |
|---|---|
| `data-analyst` | **I numeri del gestionale**: fatturati, confronti negozi, top prodotti |
| `ceo` | Strategia, priorità, decisioni sulla catena |
| `dev` | Il gestionale SvaPro dentro (spiega da dove escono i numeri) |
| `finance` | Incassi, margini, break-even, spese |
| `legal` | Accise ADM, normative svapo, privacy |
| `marketing` / `cmo` | Promo nei negozi, loyalty, strategia |
| `social` | Contenuti social dell'insegna |
| `sales` | Clienti B2B, fornitori, trattative |
| `ops` | Checklist punto vendita, processi, automazioni |
| `research` | Ricerche di mercato e normative |
| `design` | Volantini, cartelli, materiali negozio |

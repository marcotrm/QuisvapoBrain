---
type: progetto
status: go-live
cliente: "[[Quisvapo]]"
path: "C:/Users/Utente/Desktop/LAVORO E PROGETTI/Caruso/SvaPro"
tags: [progetto, gestionale, laravel, react]
created: 2026-07-20
---

# SvaPro (Gestionale)

Il gestionale della catena **Quisvapo**: retail multi-tenant, **Laravel 11** + **React/Vite**, Postgres in produzione. 🟢 **ONLINE** su quisvapo.app (VPS Hostinger + Coolify, deploy automatico dal branch `main`).

Il codice vive in QUESTA stessa cartella (la root del vault coincide con la root del repo). Sviluppo e manutenzione: Marco (NIA Marketing).

## Moduli principali

Catalogo, ordini, magazzino, clienti, dipendenti (turni, timbrature, KPI), loyalty, fatture, report (Riepilogo Vendite, Fatturato Negozi, report giornalieri), smart reorder, export ADM/accise.

## Dove guardare per i numeri

- Endpoint report: `routes/api.php` → `/api/reports/store-revenue`, `store-revenue-history`, `store-revenue-analytics`, `summary`, `revenue-trend`, `top-products`, `breakeven`, `/api/daily-reports`
- Logica report: `app/Http/Controllers/Api/ReportController.php`
- Accise: `app/Services/ExciseService.php` + `docs/ACCISA_GIACENZE_LEGALE_STATUS.md`

## Stato attuale

- 2026-07-20 — Online e in uso, sviluppo attivo su `main`.

## Prossimi passi

- [ ] Definire con Marco l'accesso in sola lettura ai dati per l'agente `data-analyst` (token API dedicato o utenza DB read-only)

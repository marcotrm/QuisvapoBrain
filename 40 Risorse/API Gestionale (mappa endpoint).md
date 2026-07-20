---
type: riferimento
status: attivo
tags: [risorsa, api, gestionale]
created: 2026-07-20
---

# 🗺️ API Gestionale — mappa endpoint (per gli agenti)

Tutti gli endpoint si chiamano in sola lettura via proxy Jarvis:
`curl -s "http://127.0.0.1:${PORT:-8766}/api/gestionale/<endpoint>?<parametri>"`
Il proxy consente QUALSIASI GET del gestionale tranne quelli che eseguono azioni (run-*, fix-*, cleanup*, wipe*, delete*, set-stock*, migrate*: bloccati). Parametri data: `date_from`/`date_to` (YYYY-MM-DD) oppure `days=N`; quasi ovunque `store_id` filtra il negozio.

## 💶 Vendite e fatturato (fonte di verità: `reports/store-revenue`)

| Endpoint | Cosa dà |
|---|---|
| `reports/store-revenue?date_from&date_to` | **Fatturato/incassato per negozio** (= Riepilogo Vendite POS): `collected`, `revenue`, `orders`, `avg_ticket`, `profit`, `margin_pct` |
| `reports/store-revenue-history?months=N` | Serie mensile per negozio |
| `reports/store-revenue-analytics?date_from&date_to&compare_period=previous\|yoy` | Confronti col periodo precedente/anno scorso, contanti vs carta |
| `reports/summary` | KPI generali |
| `reports/top-products?days&sort=revenue\|qty&limit` | Prodotti più venduti (solo ordini `paid`) |
| `reports/breakeven` | Break-even per negozio |
| `reports/customer-acquisition` | Nuovi clienti |
| ⚠️ `reports/revenue-trend` | NON usare per il fatturato: solo ordini `paid`, giorni in UTC, senza `store_id` somma tutti i negozi |

## ⏰ Presenze, ritardi, turni

| Endpoint | Cosa dà |
|---|---|
| `attendance/lateness-summary` | **Riepilogo ritardi dipendenti** (la risposta a "chi ha fatto ritardo?") |
| `attendance/live` | Chi è timbrato ADESSO, in tempo reale |
| `attendance/history` | Storico timbrature |
| `shifts` · `shifts/absences` · `shifts/templates` | Turni pianificati, assenze |
| `employees/unavailability` | Indisponibilità dichiarate |

## 👥 Dipendenti

| Endpoint | Cosa dà |
|---|---|
| `employees` · `employees/global-list` | Anagrafica dipendenti |
| `employees/kpi-dashboard` · `employees/kpi-trend/{id}` | KPI vendita per dipendente |
| `employees/analytics/top-performers` | Migliori venditori |
| `employees/costs` · `employees/cost-periods` | Costo del personale |
| `daily-reports` · `daily-reports/stats` · `daily-reports/team-status` | Report giornalieri dei responsabili |

## 🏪 Negozi, magazzino, catalogo

| Endpoint | Cosa dà |
|---|---|
| `stores` · `stores/online-status` · `stores/{id}` | Elenco e stato negozi (gli `id` servono per `store_id`) |
| `warehouse/dashboard` | Quadro magazzino |
| `orders/stock-alerts` | Prodotti sotto scorta |
| `stock-transfers` | Trasferimenti merce tra negozi |
| `catalog/products?search=` · `catalog/brands` · `catalog/categories` | Catalogo |
| `purchase-orders` · `suppliers` | Ordini fornitore e fornitori |

## 🧾 Clienti, fedeltà, fatture

| Endpoint | Cosa dà |
|---|---|
| `customers?search=` · `customers/{id}` · `customers/{id}/pos-history` | Clienti e storico acquisti |
| `customers/analytics/dashboard` | Analytics clienti |
| `loyalty/tiers` · `loyalty/redemptions` · `loyalty/rewards` | Programma fedeltà |
| `invoices` | Fatture |
| `orders?date_from&date_to&store_id` · `orders/{id}` | Ordini di vendita (dettaglio scontrini) |
| `b2b-clients` | Clienti B2B |

## Come procedere se l'endpoint non basta

1. Prova prima l'endpoint più specifico con i parametri giusti (una chiamata sola).
2. Se un endpoint risponde 403/404/422, leggi il messaggio: spesso manca un parametro (`store_id`, `date_from`).
3. Se il dato proprio non esiste via API, dillo in una frase e suggerisci l'export da mettere in `00 Inbox/`.

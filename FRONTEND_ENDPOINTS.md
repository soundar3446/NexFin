# Which page uses which endpoint

A map from each frontend page/route to the backend endpoint(s) it calls. For what each endpoint actually does, see [ENDPOINTS.md](ENDPOINTS.md); for request/response shapes, see the root [README.md](README.md).

## Quick reference

| Page / Route | Component | Endpoint(s) called |
|---|---|---|
| Login | `LoginPage.jsx` | `POST /auth/login` |
| `/` (Overview) | `OverviewPage.jsx` | *(via shared context — see below)* |
| `/accounts` | `AccountsPage.jsx` | *(via shared context — see below)* |
| `/accounts/:accountId` | `AccountLayout.jsx` | `GET /accounts/{id}` |
| `/transactions` | `TransactionsPage.jsx` | *(via shared context — see below)* |
| `/insights` (layout) | `InsightsLayout.jsx` | `POST /sync/accounts` |
| `/insights` (index) | `InsightsOverviewPage.jsx` | `GET /analysis/monthly-spending`, `GET /analysis/financial-health` |
| `/insights/categories` | `InsightsCategoriesPage.jsx` | `GET /insights/category-breakdown` |
| `/insights/trends` | `InsightsTrendsPage.jsx` | `GET /insights/income-expense-trend` |
| `/insights/unusual` | `InsightsUnusualPage.jsx` | `GET /insights/unusual-spending` |

## Overview, Accounts, Transactions — the shared "live" data source

`OverviewPage`, `AccountsPage`, and `TransactionsPage` don't call the backend directly — they all read from `DashboardDataContext.jsx`, which fetches once and shares the result across all three pages:

- `GET /accounts` — the account list
- `GET /accounts/{id}/balances` — one call per account, for the current balance shown on each
- `GET /accounts/{id}/transactions` — one call per account (via `getAllTransactions`, which pages through core-api's 50-row-per-request cap to get the full history), merged into one combined transaction feed

This is a **live** read — every one of these hits core-api directly, no local database involved. Revisiting any of these three pages re-fetches from the bank again.

`TopBar.jsx` and `AccountLayout.jsx` (the shell for the per-account detail pages) also call `GET /accounts/{id}` directly, to show the account's nickname in the page title/breadcrumb.

## Insights — the "synced" data source

Everything under `/insights` reads from the local database instead of the bank directly. `InsightsLayout.jsx` calls `POST /sync/accounts` **once**, when the section is entered — none of its four child pages sync again on their own, so navigating between Overview/Categories/Trends/Unusual doesn't re-hit the bank each time, only the first entry into `/insights` does.

| Sub-page | Endpoint | What it shows |
|---|---|---|
| Overview (index) | `GET /analysis/monthly-spending` + `GET /analysis/financial-health` | Per-month totals, breakdowns, and the three health observations |
| Categories | `GET /insights/category-breakdown` | AI-categorized spend by category, with a plain-English summary |
| Trends | `GET /insights/income-expense-trend` | Income/expense/net trend over time, with averages and savings rate |
| Unusual | `GET /insights/unusual-spending` | Flagged outlier/duplicate transactions, with a plain-English summary |

## Not called from the frontend at all

- **`POST /auth/refresh`** — implemented on the backend (see [ENDPOINTS.md](ENDPOINTS.md) for the token-expiry fallback flow), but `api.js`'s request logic doesn't catch a `401` and retry with it yet. Right now, once the 5-minute access token expires, the user has to log in again rather than being silently refreshed.
- **`GET /me/notice`, `POST /me/notice/ack`, `DELETE /me/notice/ack`** — the first-login data-usage notice flow was removed from the UI at some point; nothing calls these anymore.
- **`GET /items/`, `POST /items/`, `GET /items/{id}`** — never had a frontend to begin with; leftover scaffold from initial project setup.

## Two separate data sources, worth knowing about

Overview/Accounts/Transactions and the whole `/insights` tree get their numbers from two genuinely different places — one live from the bank, one from whatever was last synced into Postgres. They can disagree with each other (e.g. a transaction that posted in the last few minutes shows up on the Transactions page but not yet in Insights, until `/insights` is next visited and re-syncs). Not a bug, just a real architectural split worth keeping in mind when comparing numbers between the two sections.

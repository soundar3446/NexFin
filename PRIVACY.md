# Data Handling & Privacy Plan

NexFin pulls account, balance, and transaction data from an Open Banking (AISP) provider on behalf of a customer (PSU — Payment Services User) in order to analyse it. This document is the plan for doing that legally and sets the shape of what gets stored in the database. It's the reference point before we write the actual SQLAlchemy models — nothing here is implemented yet.

## Legal basis

Two frameworks apply, and both have to be satisfied independently:

- **PSD2 / Open Banking (UK)** — gives NexFin the right to *access* the data, but only as an AISP acting on explicit PSU consent, scoped to specific accounts and a specific purpose. Consent is time-limited: it must be re-confirmed with the PSU at least every 90 days, and the PSU can revoke it at any time.
- **UK GDPR** — governs what NexFin does with the data once it has it (storage, processing, deletion). Consent under PSD2 does not by itself satisfy GDPR — GDPR's lawful basis here is also consent (Art. 6(1)(a)), and it has to be freely given, specific, and revocable independently of the PSD2 consent.

Practically: a login through the bank's OAuth flow gives us a *token*, not blanket permission to store whatever we want. We need our own consent record that says what was agreed to.

## Data model plan

| Table | Purpose | Notes |
|---|---|---|
| `consents` | Records what a PSU agreed to and when | `user_sub` (from token `sub` claim), `purpose` (e.g. `"spend_analysis"`), `granted_at`, `expires_at` (≤ 90 days out), `revoked_at` (nullable) |
| `accounts` | Cached account metadata | `AccountId`, `nickname`, `currency`, `account_type` — **not** the full OBIE payload |
| `balances` | Point-in-time snapshots for trend analysis | `account_id`, `amount`, `currency`, `as_of` |
| `transactions` | Line items for spend analysis | `transaction_id`, `account_id`, `amount`, `currency`, `credit_debit_indicator`, `booking_datetime`, `merchant_name`, `category` |

Deliberately **not** stored: full `PostalAddress` blocks, `CreditorAgent`/`DebtorAgent`/`UltimateCreditor`/`UltimateDebtor` details, `CardInstrument`, `LEI`, sort code/account number (`Identification`), or anything else in the raw OBIE response that isn't actually used by an analysis feature. If a future feature needs one of these fields, it gets added deliberately, not by storing the whole payload "just in case."

The OAuth access/refresh tokens themselves are never persisted — the backend already only proxies the bearer token per-request (see `app/routers/accounts.py`), and that stays true once storage is added.

## GDPR principles → how they're implemented

- **Purpose limitation** — every stored record traces back to a `consents.purpose`. Data pulled for "spend analysis" isn't reused for anything else without a new consent record.
- **Transparency** — the app must show the PSU, before they connect their bank, what will be stored and why (a short in-app notice, not just this file). This file is the internal reference; the user-facing version is a summary of it.
- **Data minimisation** — only the fields listed in the table above. No raw OBIE JSON blobs get persisted wholesale.
- **Security** — secrets already live in env vars, not code (`.env`, gitignored). Once the DB holds real customer data: enforce TLS to Postgres, restrict the DB role to least privilege, and encrypt the volume at rest in any non-local deployment. Add access logging so it's auditable who/what queried a given customer's records.
- **Storage limitation (retention)** — transactions and balances get a retention window (default proposal: 13 months, in line with typical account-aggregation norms — confirm before implementing). Data is deleted automatically when a consent expires or is revoked, not just left in place.

## Open questions before implementation

- Retention period: 13 months proposed above — confirm or change.
- Should `merchant_name` / `category` be treated as sufficient for analysis, or does a feature need more (e.g. counterparty account details)? Default is no.
- Deletion mechanism: hard delete vs. anonymise-in-place when a consent expires — needs a decision before the `consents` table's `expires_at` job is written.

## Next step

Once the above is confirmed, the next step is adding the `Consent`, `Account`, `Balance`, `Transaction` SQLAlchemy models and a scheduled job (or on-request check) that enforces `expires_at`/`revoked_at` before serving stored data.

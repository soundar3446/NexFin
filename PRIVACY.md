# Data Handling & Privacy Plan

NexFin pulls account, balance, and transaction data from an Open Banking (AISP) provider on behalf of a customer (PSU — Payment Services User) in order to analyse it. This document is the plan for doing that legally and sets the shape of what gets stored in the database. It's the reference point before we write the actual SQLAlchemy models — nothing here is implemented yet.

## Legal basis

Two frameworks apply, and both have to be satisfied independently:

- **PSD2 / Open Banking (UK)** — gives NexFin the right to *access* the data, but only as an AISP acting on explicit PSU consent, scoped to specific accounts and a specific purpose.
- **UK GDPR** — governs what NexFin does with the data once it has it (storage, processing, deletion). Consent under PSD2 does not by itself satisfy GDPR — GDPR's lawful basis here is also consent (Art. 6(1)(a)).

Consent capture/tracking (the PSD2 90-day re-consent cycle, revocation handling, a `consents` table) is **out of scope for this phase** — noted here so it isn't forgotten, but not something we're building right now. What follows covers the part we are building: what gets stored once data is fetched, and how it stays GDPR-compliant while consent management is handled separately (or not yet built).

## Data model plan

| Table | Purpose | Notes |
|---|---|---|
| `accounts` | Cached account metadata | `AccountId`, `nickname`, `currency`, `account_type` — **not** the full OBIE payload |
| `balances` | Point-in-time snapshots for trend analysis | `account_id`, `amount`, `currency`, `as_of` |
| `transactions` | Line items for spend analysis | `transaction_id`, `account_id`, `amount`, `currency`, `credit_debit_indicator`, `booking_datetime`, `merchant_name`, `category` |

Deliberately **not** stored: full `PostalAddress` blocks, `CreditorAgent`/`DebtorAgent`/`UltimateCreditor`/`UltimateDebtor` details, `CardInstrument`, `LEI`, sort code/account number (`Identification`), or anything else in the raw OBIE response that isn't actually used by an analysis feature. If a future feature needs one of these fields, it gets added deliberately, not by storing the whole payload "just in case."

The OAuth access/refresh tokens themselves are never persisted — the backend already only proxies the bearer token per-request (see `app/routers/accounts.py`), and that stays true once storage is added.

## GDPR principles → how they're implemented

- **Purpose limitation** — data fetched via the accounts/balances/transactions endpoints is stored only for the analysis feature it's fetched for. No repurposing it later for something else (e.g. marketing) without revisiting this document.
- **Transparency** — implemented as a one-time notice shown to the PSU the first time they log in, explaining what's stored and why, with an explicit "I understand / agree" confirmation before they proceed. The backend records that the notice was shown and agreed to (`user_sub`, `acknowledged_at`) so it isn't shown again on subsequent logins. This is deliberately lighter than the `consents` table scoped out above — it's a transparency acknowledgement, not a PSD2 consent record with expiry/revocation/scope.
- **Data minimisation** — only the fields listed in the table above. No raw OBIE JSON blobs get persisted wholesale.
- **Security** — secrets already live in env vars, not code (`.env`, gitignored). Once the DB holds real customer data: enforce TLS to Postgres, restrict the DB role to least privilege, and encrypt the volume at rest in any non-local deployment. Add access logging so it's auditable who/what queried a given customer's records.
- **Storage limitation (retention)** — transactions and balances get a retention window (default proposal: 13 months, in line with typical account-aggregation norms — confirm before implementing).

## Open questions before implementation

- Retention period: 13 months proposed above — confirm or change.
- Should `merchant_name` / `category` be treated as sufficient for analysis, or does a feature need more (e.g. counterparty account details)? Default is no.
- Deletion mechanism for expired-retention data: hard delete vs. anonymise-in-place — needs a decision before a cleanup job is written.

## Next step

Once the above is confirmed, the next step is adding the `Account`, `Balance`, `Transaction` SQLAlchemy models and, separately, a retention cleanup job that enforces the retention window decided above.

Consent tracking (the full PSD2 lifecycle), if/when it's needed, is a separate future addition on top of this. The first-login notice/acknowledgement described above is already implemented (see `data_usage_acknowledgements` table and `/me/notice` endpoints) and is independent of that future work.

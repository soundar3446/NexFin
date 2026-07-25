# Calculation Reference

Every endpoint that computes something, with the fields it uses and a worked numeric example. One sample dataset is used throughout so the numbers stay connected from one section to the next — see it once here, then follow it through every endpoint below.

For the plain-language version without worked numbers, see [ENDPOINTS.md](ENDPOINTS.md). For code, see [python-backend/WIKI.md](python-backend/WIKI.md).

## Sample dataset used throughout this document

One account, "Bills" (GBP), two months of synced transactions:

**June 2026**

| Date | Merchant | Category | Amount | Direction | Status |
|---|---|---|---|---|---|
| 06-01 | Employer | — | 2000.00 | Credit | Booked |
| 06-05 | Tesco | Groceries | 40.00 | Debit | Booked |
| 06-10 | British Gas | Utilities & Bills | 80.00 | Debit | Booked |
| 06-15 | Netflix | Subscriptions | 10.00 | Debit | Booked |
| 06-19 | Tesco | Groceries | 40.00 | Debit | Booked |

**July 2026**

| Date | Merchant | MCC | Category | Amount | Direction | Status |
|---|---|---|---|---|---|---|
| 07-01 | Employer | — | — | 2000.00 | Credit | Booked |
| 07-01 | *(none — description: "RENT PAYMENT TO LANDLORD", merchant field literally `"N/A"`)* | none | Rent & Mortgage | 1500.00 | Debit | Booked |
| 07-03 | Tesco | 5411 | Groceries | 40.00 | Debit | Booked |
| 07-10 09:00 | British Gas | 4900 | Utilities & Bills | 85.00 | Debit | Booked |
| 07-10 18:00 | British Gas | 4900 | Utilities & Bills | 85.00 | Debit | Booked |
| 07-15 | Netflix | 5815 | Subscriptions | 10.00 | Debit | Booked |
| 07-17 | Tesco | 5411 | Groceries | 42.00 | Debit | Booked |
| 07-25 | British Gas | 4900 | Utilities & Bills | 480.00 | Debit | **Pending** |

July is deliberately eventful: it has a large one-off rent payment with no merchant-category code and a placeholder `"N/A"` merchant name, an accidental same-day duplicate charge from British Gas, and one unusually large charge — these are what the categorization, merchant-name-cleanup, and anomaly-detection logic below all exist to handle correctly.

---

## `POST /auth/login`

No calculation. Trades `{username, password}` for a token from the bank's login server, and kicks off a background sync of accounts/transactions right after (see [ENDPOINTS.md](ENDPOINTS.md) for the full login → expiry → refresh example).

*Fields:* none of ours — just forwards credentials and returns whatever the bank issues.

## `POST /auth/refresh`

No calculation. Trades a `refresh_token` for a new access/refresh token pair. Full worked example (including what happens when the access token expires mid-session) is in [ENDPOINTS.md](ENDPOINTS.md).

## `GET /accounts`, `/accounts/{id}`, `/accounts/{id}/balances`, `/accounts/{id}/transactions`

No calculation — pure pass-through to the bank's live API. Whatever JSON the bank returns is what you get back, unmodified.

## `GET /me/notice`, `POST /me/notice/ack`, `DELETE /me/notice/ack`

No calculation — a stored yes/no flag.

*Fields:* `user_sub`, `acknowledged_at`.

*Example:* before ack — `{"acknowledged": false, "acknowledged_at": null}`. After `POST /me/notice/ack` — `{"acknowledged": true, "acknowledged_at": "2026-07-25T09:00:00Z"}`. After `DELETE /me/notice/ack` — back to the first response.

## `POST /sync/accounts`

No calculation — fetches and stores the raw data every endpoint below is computed from.

*Fields written per transaction:* `transaction_id`, `account_id`, `amount`, `currency`, `credit_debit_indicator`, `status`, `booking_datetime`, `transaction_information`, `merchant_name`, `merchant_category_code`, `bank_transaction_code`, `bank_transaction_sub_code`.

*Example response:* `{"accounts_synced": 1, "transactions_synced": 13}` (the 5 June + 8 July rows above).

---

## `GET /analysis/monthly-spending`

**Fields used:** `booking_datetime` (month bucket), `credit_debit_indicator` (spend vs. income), `amount` (summed), `category` if already assigned else `transaction_information`/`merchant_name` (keyword match) else `merchant_category_code` (fallback) — see the categorization walkthrough below, `merchant_name` cleaned of bank placeholder text (`"N/A"` → treated as no merchant), `account_id`/`nickname`, `status` (`PDNG` → pending totals).

**Calculation, June:**
- `total_spend` = 40 + 40 (Tesco) + 80 (British Gas) + 10 (Netflix) = **170.00**
- `total_income` = **2000.00**
- `by_category`: Groceries 80.00, Utilities & Bills 80.00, Subscriptions 10.00
- `by_merchant`: Tesco 80.00, British Gas 80.00, Netflix 10.00

**Calculation, July** (this is where the categorization and merchant-cleanup rules matter):
- The rent payment has no `merchant_category_code` at all — but its description contains "mortgage"/"rent payment" keywords, so it's categorized as **Rent & Mortgage** rather than falling through to an uninformative "Uncategorised" bucket.
- Its merchant name is the bank's `"N/A"` placeholder — cleaned to **"Unknown"** rather than showing up as if `"N/A"` were a real business.
- `total_spend` = 40 + 42 (Tesco) + 85 + 85 + 480 (British Gas) + 10 (Netflix) + 1500 (rent) = **2242.00**
- `pending_spend` = **480.00** (only the 07-25 charge is still `PDNG`)
- `total_income` = **2000.00**, `pending_income` = 0
- `transaction_count` = **8** (7 debits + 1 credit)
- `by_category` (sorted by total, descending):
  | Category | Total |
  |---|---|
  | Rent & Mortgage | 1500.00 |
  | Utilities & Bills | 650.00 *(85 + 85 + 480)* |
  | Groceries | 82.00 *(40 + 42)* |
  | Subscriptions | 10.00 |
- `by_merchant` (sorted, descending):
  | Merchant | Total |
  |---|---|
  | Unknown | 1500.00 |
  | British Gas | 650.00 |
  | Tesco | 82.00 |
  | Netflix | 10.00 |
- `by_account`: one entry — `Bills`, `total_spend: 2242.00`, `total_income: 2000.00`, `transaction_count: 8`.

## `GET /analysis/financial-health`

**Fields used:** none directly — reuses the totals computed above.

**Calculation, July** (using `total_spend=2242`, `total_income=2000`, June's `total_spend=170` as the prior month, and the `by_category` table above):

1. **Spend vs. income:** ratio = 2242 / 2000 = **1.121** → over 1 → **warning**: *"Spending exceeded income by 12% this month."* (`round((1.121 − 1) × 100) = 12`)
2. **Trend vs. June:** change = (2242 − 170) / 170 = **12.18** → +1218% → far above the 20% warning threshold → **warning**: *"Spending increased 1218% compared to last month."*
3. **Concentration:** top category is Rent & Mortgage at 1500.00; share = 1500 / 2242 = **0.669** → over 50% → **info**: *"67% of spending this month was in one category (Rent & Mortgage)."*

Result: three observations, all present (a quiet month with nothing to say would instead get a single neutral fallback note).

## `GET /insights/category-breakdown` (`months=1`, July only)

**Fields used:** `booking_datetime` (window), `credit_debit_indicator` (expense-only), `transaction_information`/`merchant_name`/`merchant_category_code` (categorization signals), `amount`.

**Calculation** — same categories as the monthly-spending table above, now with percentages of `total_expense = 2242.00`:

| Category | Total | % of total | Count |
|---|---|---|---|
| Rent & Mortgage | 1500.00 | 66.9% | 1 |
| Utilities & Bills | 650.00 | 29.0% | 3 |
| Groceries | 82.00 | 3.7% | 2 |
| Subscriptions | 10.00 | 0.4% | 1 |

*(percentages sum to 100.0%)*

**Insight (fallback template, if the AI model isn't reachable):** *"Over the last 1 month(s), your top spending category was Rent & Mortgage at 66.9% of total expenses (1500.00)."*

## `GET /insights/income-expense-trend` (`months=2`, June + July)

**Fields used:** `booking_datetime`, `credit_debit_indicator`, `amount`. No category/merchant fields needed.

**Calculation:**

| Month | Income | Expense | Net |
|---|---|---|---|
| 2026-06 | 2000.00 | 170.00 | 1830.00 |
| 2026-07 | 2000.00 | 2242.00 | −242.00 |

- `average_income` = (2000 + 2000) / 2 = **2000.00**
- `average_expense` = (170 + 2242) / 2 = **1206.00**
- `average_savings_rate` = (2000 − 1206) / 2000 × 100 = **39.7%**

**Insight (fallback template):** *"On average you brought in 2000.00 and spent 1206.00 per month, saving at a rate of 39.7% of income."*

## `GET /insights/unusual-spending` (`months=1`, July only)

**Fields used:** `credit_debit_indicator` (spending only), `category` (assigned by the same categorizer as category-breakdown — this endpoint categorizes first, same as that one), `amount`, `booking_datetime` (window + 24-hour duplicate window), `merchant_name` cleaned of placeholders (falls back to `transaction_information` when there's no real merchant) for the duplicate check, `transaction_id`.

**Check 1 — category outliers.** Utilities & Bills has 3 samples in-window (85, 85, 480) — enough to get its own baseline: median = **85.00**, and the spread measure (MAD) is **0** because two of the three values are identical. With a zero spread, the rule is: anything meaningfully above the median (over 30% higher) is flagged automatically, at the maximum severity score. 480 qualifies → **flagged, high severity**: *"480.00 is unusually high for Utilities & Bills (typical spend ~85.00)."* The two 85.00 charges are *at* the median, not above it, so neither is flagged here.

Groceries (40, 42) and Subscriptions (10) each have fewer than 3 samples, so they're compared against the *overall* July spending baseline instead (median **85.00**, spread **45.00**, computed across all 7 debit amounts). Both Groceries amounts are below that overall median, so neither is flagged. The rent payment (1500, also under 3 samples for its category) *is* well above it — modified z-score ≈ 21.2, comfortably past the flagging threshold — but because it's judged against the coarser overall baseline rather than a category-specific one, it's capped at **medium severity**: *"1500.00 is unusually large compared to your typical spending (~85.00)."*

**Check 2 — duplicate charges.** The two British Gas charges for 85.00 on 07-10 (09:00 and 18:00) are the same merchant, same amount, 9 hours apart — both **flagged, medium severity**: *"Same amount (85.00) charged by British Gas within 24 hours of another transaction."*

**Combined result** (sorted high-severity-first, then by amount descending):

| Amount | Merchant | Severity | Reason |
|---|---|---|---|
| 480.00 | British Gas | **high** | Unusually high for Utilities & Bills (typical ~85.00) |
| 1500.00 | Unknown | medium | Unusually large vs. overall typical spending (~85.00) |
| 85.00 | British Gas | medium | Same amount charged twice within 24 hours |
| 85.00 | British Gas | medium | Same amount charged twice within 24 hours |

Note the rent payment's merchant shows as **"Unknown"**, not `"N/A"` — same cleanup rule as monthly-spending's top-merchants list.

**Insight (fallback template):** *"Found 4 unusual transaction(s) in the last 1 month(s). The most notable was 480.00 at British Gas (Utilities & Bills)."*

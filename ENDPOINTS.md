# How the endpoints work

This is a logical walkthrough of what each endpoint actually does — the calculations and reasoning behind them, not the code. For request/response shapes see the root `README.md`; for how the code implements this see `python-backend/WIKI.md`.

## No calculation — just moving data around

- **`POST /auth/login`** — hands your username/password to the bank's login server and passes back whatever token it gives you. No logic of ours involved, other than kicking off an account/transaction sync in the background right after (see below) so the rest of the app has fresh data without an extra round trip.
- **`POST /auth/refresh`** — same idea, but instead of a username/password it hands over the `refresh_token` from a previous login and gets a fresh access token back. This matters because this sandbox's access tokens only last 5 minutes — without this, anyone using the app for more than a few minutes would be forced back to a full login. The bank's login server issues a brand-new access *and* refresh token pair each time (the old refresh token isn't reusable after this), so whoever calls this needs to store the new one it gets back for next time.
- **`GET /accounts`, `/accounts/{id}`, `/accounts/{id}/balances`, `/accounts/{id}/transactions`** — pure pass-through to the bank's live API. Whatever the bank returns is what you get, unmodified.
- **`GET /me/notice`, `POST /me/notice/ack`, `DELETE /me/notice/ack`** — just a yes/no flag per person: "has this person seen and agreed to the data notice." No math.
  *Fields:* `user_sub` (who), `acknowledged_at` (when — present or `null`).
- **`POST /sync/accounts`** — pulls your accounts and every transaction on them from the bank and saves a local copy. Nothing is calculated here — it's the step that makes the calculated endpoints below possible, since they never talk to the bank directly, only to this local copy.
  *Fields written:* for each account — `account_id`, `user_sub`, `nickname`, `currency`, `account_type`, `account_category`, `status`. For each transaction — `transaction_id`, `account_id`, `amount`, `currency`, `credit_debit_indicator`, `status`, `booking_datetime`, `transaction_information`, `merchant_name`, `merchant_category_code`, `bank_transaction_code`, `bank_transaction_sub_code`. This is the complete set of raw material every calculation below draws from — nothing downstream uses any field that isn't saved here.

**What happens when a token expires:** it depends on which endpoint you're calling. `/accounts/*` and `/sync/accounts` actually talk to the bank, so the bank itself rejects an expired token — that surfaces as a clean error, and the fix is `/auth/refresh`. `/me/notice*`, `/analysis/*`, and `/insights/*` never talk to the bank directly — they only need to know *who's asking*, which they get by reading the token's contents without checking whether the bank would still consider it valid. So a token that's technically expired still works fine on those, right up until you need something that actually requires the bank (a fresh sync). This is intentional, not a security gap — no banking data is ever released on the strength of that unchecked read alone.

**The recommended fallback pattern for a caller:** try the request; if it comes back `401`, call `/auth/refresh` with the stored refresh token, then retry the original request once with the new access token. Don't wait for a request to fail before refreshing if you can help it — with a 5-minute access token lifetime, refreshing proactively (e.g. a bit before `expires_in` runs out) gives a smoother experience than always hitting a 401 first.

Worked example:

```
1. Log in
   POST /auth/login
   { "username": "alex@example.com", "password": "••••••••" }

   → 200
   {
     "access_token": "eyJhbGciOi...<snip>",
     "refresh_token": "eyJhbGciOi...<snip>",
     "expires_in": 300,          // access token is only good for 5 minutes
     "refresh_expires_in": 1800  // refresh token is good for 30 minutes
   }

2. Use the access token normally for a while
   GET /accounts?type=domestic
   Authorization: Bearer eyJhbGciOi...<snip>

   → 200  { "Data": { "Account": [ ... ] } }

3. ~6 minutes later, the access token has expired. The same call now fails —
   because /accounts talks to the bank directly, the bank itself rejects it:
   GET /accounts?type=domestic
   Authorization: Bearer eyJhbGciOi...<snip>   (expired)

   → 401  { "detail": "..." }   (whatever the bank's own 401 body says — passed through as-is)

4. Refresh instead of forcing the user to log in again
   POST /auth/refresh
   { "refresh_token": "eyJhbGciOi...<snip>" }   (the one from step 1)

   → 200
   {
     "access_token": "eyJhbGciOi...<new>",
     "refresh_token": "eyJhbGciOi...<new>",     // a new refresh token too — the old one won't work again
     "expires_in": 300,
     "refresh_expires_in": 1800
   }

5. Retry the original request with the new access token — it succeeds again
   GET /accounts?type=domestic
   Authorization: Bearer eyJhbGciOi...<new>

   → 200  { "Data": { "Account": [ ... ] } }
```

Step 4 is the one worth remembering: **both** tokens returned from `/auth/refresh` are new — the refresh token from step 1 is spent after this and can't be reused, so whatever calls this needs to store the pair it just got back before it needs to refresh again.

## `GET /analysis/monthly-spending` — the base arithmetic

1. Take every saved transaction and drop it into a bucket for the calendar month it happened in.
2. Within each month, split transactions into two piles: money going out (spend) and money coming in (income), and add each pile up.
3. Separately, total up spend by category and by merchant, so you can see not just "how much" but "on what" and "where." Getting to a proper category name uses the same logic the AI-insights categorizer does: if the transaction was already categorized (from a visit to the AI insights endpoints), that's used as-is; otherwise it's categorized on the spot — matching the description against known keywords first (e.g. "mortgage", "university", "overdraft fee"), then falling back to the bank's numeric merchant-category code if there's no keyword match, and only labeling it "Other Expense" if neither gives an answer. This matters because some transactions (rent, mortgage, tuition, bank charges) arrive from the bank with *no* merchant-category code at all — only the keyword match catches those; relying on the code alone left them all bucketed as an uninformative "Uncategorised." The same kind of transaction also arrives with the bank's merchant name field literally set to the placeholder text `"N/A"` rather than left blank — that gets treated the same as no merchant name at all (shown as "Unknown"), otherwise it would show up as if "N/A" were a real business, and — because those transactions collectively add up to a lot of money — it would rank at or near the top of "top merchants," which is misleading.
4. Do the same split by account, so a household with several accounts sees "how much came from this particular account" as well as the combined total.
5. Anything still marked "pending" by the bank is counted in the totals but also tracked separately, since a pending transaction could still change or disappear before it settles.

*Fields used:* `booking_datetime` (which month a transaction falls into), `credit_debit_indicator` (spend vs. income split), `amount` (the value summed), `category` (used as-is if already assigned), `transaction_information`/`merchant_name` (keyword matching when it isn't), `merchant_category_code` (fallback when keywords don't match either), `account_id`/`nickname` (per-account breakdown), `status` (detects `PDNG` — pending — for the separate pending totals).

Everything downstream (financial-health, insights) builds on this same monthly grouping rather than recalculating it from scratch.

## `GET /analysis/financial-health` — three independent judgment calls per month

For each month, it asks three separate questions using the numbers from monthly-spending above, and answers each independently as good / neutral / warning — it's three separate lenses, not one combined score:

1. **Did you spend within your income?** Compare that month's spend to that month's income. Spent more than earned → warning. Spent a large share (over 80%) but not more → informational. Spent comfortably less → good. Spending with literally no recorded income that month is also a warning.
2. **Is spending trending up or down?** Compare this month's total spend to the previous month's. A jump of more than 20% → warning. A drop of more than 20% → good. Anywhere in between (normal month-to-month wobble) → nothing is said at all. This question is skipped for the very first month in your history, or if the previous month had zero spending to compare against.
3. **Is spending too concentrated in one place?** Look at the single biggest spending category that month as a share of total spend. More than half of everything spent → informational flag naming that category. Otherwise, nothing is said.

If none of the three produce anything to say (a quiet month with barely any activity), a single neutral "nothing notable this month" note is returned instead of an empty result.

*Fields used:* none directly — this endpoint doesn't touch raw transaction fields at all. It reuses the already-computed `total_spend`/`total_income` (question 1), the previous month's `total_spend` (question 2), and the top entry from `by_category` (question 3) — all of which come from `/analysis/monthly-spending`, which in turn is built from `booking_datetime`, `credit_debit_indicator`, `amount`, and `merchant_category_code` as listed above.

## `GET /insights/category-breakdown` — where the AI comes in

1. Look only at spending (not income) in the requested time window (default: last 3 months).
2. For every transaction that doesn't already have a category assigned, ask an AI model to read its description/merchant and pick the best-fitting category from a fixed list (groceries, dining, transport, etc.). If the AI is unavailable or gives a nonsense answer, fall back to simple rules instead — matching known merchant names/keywords, or the bank's own merchant-category code — so a category always gets assigned one way or another.
3. Once every transaction has a category, add up the total spent per category, and calculate what percentage of overall spending each one represents.
4. Finally, ask the AI to turn those numbers into a short, plain-English sentence pointing out the standout category. If that also fails, fall back to a templated sentence built directly from the numbers instead of leaving it blank.

*Fields used:* `booking_datetime` (time window filter), `credit_debit_indicator` (expense-only filter), `transaction_information`/`merchant_name`/`merchant_category_code` (the signals fed to the AI, or matched against keyword/MCC rules on fallback), `amount` (category totals and percentages). The result is written back onto each transaction as `category` (the assigned label) and `category_source` (`"ai"` or `"fallback"` — which method produced it), so the same transaction isn't re-categorized on every call.

## `GET /insights/income-expense-trend` — the same idea, viewed over time instead of by category

1. For the requested window (default: last 6 months), total income and total expense per month, and the difference between them (net).
2. Average those monthly totals across the whole window, and express the gap between average income and average expense as a percentage — effectively "what share of your income are you keeping," month to month on average.
3. Same AI-with-fallback pattern as category-breakdown: try to get a natural-language summary of the trend from the AI; if that's not available, generate a templated sentence from the same average numbers instead.

*Fields used:* `booking_datetime` (time window + monthly grouping), `credit_debit_indicator` (income vs. expense split), `amount` (monthly totals, averages, net, savings rate). No category or merchant fields are needed here — this endpoint only cares about the money moving in and out, not what it was for.

## `GET /insights/unusual-spending` — flagging what doesn't look normal

Runs two independent checks over your spending in the requested window (default: last 3 months), and combines whatever either one flags:

1. **Is this amount unusually large for what it's spent on?** First, every transaction gets a category (same AI-with-fallback categorizer as category-breakdown, so this only works well once categories are assigned). Then, within each category, work out the "typical" amount (the median) and how much amounts normally vary around it — using a measure that isn't thrown off by the one huge outlier you're trying to catch (a plain average would let a single giant transaction drag the "typical" value up and hide itself; this uses a sturdier measure that barely moves). A transaction is flagged if it's both meaningfully above typical (at least 30% higher) and statistically far outside the normal spread for that category. Categories with too few transactions (fewer than 3) to judge on their own instead get compared against your overall spending as a lower-confidence check.
2. **Is this a duplicate charge?** Look for the same merchant charging you the exact same amount more than once within 24 hours — the signature of an accidental double charge, not a legitimate recurring bill (which repeats on a much longer cycle). A transaction with no real merchant name (or the bank's `"N/A"` placeholder) falls back to matching on its description instead — otherwise unrelated transactions that all lack a merchant name (rent, a bank fee, tuition) could get lumped together as if they were the same "merchant" and wrongly flagged as duplicates of each other.

A transaction can be flagged by both checks at once, in which case the reasons are combined into one message. Severity (`high` vs. `medium`) only ever escalates, never downgrades, as more checks weigh in — a transaction judged unusual with high confidence by one check stays "high" even if another check only flags it as "medium." Results are sorted worst-first (high severity, then largest amount) and capped at the 25 most notable. As with the other insights endpoints, an AI model is asked to summarize the flagged list in plain English, falling back to a templated sentence naming the single most notable one if the AI isn't available.

*Fields used:* `credit_debit_indicator` (spending only — income isn't checked), `category` (the grouping the outlier check compares within — assigned by the same categorizer as category-breakdown, so this runs after categorization), `amount` (the value being compared against its category's typical range), `booking_datetime` (the time window, and the ordering used to detect "within 24 hours"), `merchant_name`/`transaction_information` (identifying "the same merchant" for the duplicate-charge check), `transaction_id` (which transaction is being flagged).

## The common thread across the AI-powered endpoints

The numbers are always calculated the same reliable way regardless of whether the AI is reachable — the AI only ever adds the *sentence describing* the numbers (or picks a category label), it never changes what the numbers themselves are. If the AI fails, you get the same math with a plainer, rule-based sentence instead of a silently broken response.

# How the endpoints work

This is a logical walkthrough of what each endpoint actually does — the calculations and reasoning behind them, not the code. For request/response shapes see the root `README.md`; for how the code implements this see `python-backend/WIKI.md`.

## No calculation — just moving data around

- **`POST /auth/login`** — hands your username/password to the bank's login server and passes back whatever token it gives you. No logic of ours involved.
- **`GET /accounts`, `/accounts/{id}`, `/accounts/{id}/balances`, `/accounts/{id}/transactions`** — pure pass-through to the bank's live API. Whatever the bank returns is what you get, unmodified.
- **`GET /me/notice`, `POST /me/notice/ack`, `DELETE /me/notice/ack`** — just a yes/no flag per person: "has this person seen and agreed to the data notice." No math.
  *Fields:* `user_sub` (who), `acknowledged_at` (when — present or `null`).
- **`POST /sync/accounts`** — pulls your accounts and every transaction on them from the bank and saves a local copy. Nothing is calculated here — it's the step that makes the calculated endpoints below possible, since they never talk to the bank directly, only to this local copy.
  *Fields written:* for each account — `account_id`, `user_sub`, `nickname`, `currency`, `account_type`, `account_category`, `status`. For each transaction — `transaction_id`, `account_id`, `amount`, `currency`, `credit_debit_indicator`, `status`, `booking_datetime`, `transaction_information`, `merchant_name`, `merchant_category_code`, `bank_transaction_code`, `bank_transaction_sub_code`. This is the complete set of raw material every calculation below draws from — nothing downstream uses any field that isn't saved here.

## `GET /analysis/monthly-spending` — the base arithmetic

1. Take every saved transaction and drop it into a bucket for the calendar month it happened in.
2. Within each month, split transactions into two piles: money going out (spend) and money coming in (income), and add each pile up.
3. Separately, total up spend by category and by merchant, so you can see not just "how much" but "on what" and "where." The bank gives each transaction a numeric merchant-category code, not a real category name — that code is translated to a proper category (groceries, dining, transport, etc.) through one shared mapping before anything is totaled up, so two different codes that both mean "groceries" land in the same bucket instead of showing as separate near-duplicate rows.
4. Do the same split by account, so a household with several accounts sees "how much came from this particular account" as well as the combined total.
5. Anything still marked "pending" by the bank is counted in the totals but also tracked separately, since a pending transaction could still change or disappear before it settles.

*Fields used:* `booking_datetime` (which month a transaction falls into), `credit_debit_indicator` (spend vs. income split), `amount` (the value summed), `merchant_category_code` (mapped to a proper category name before being used for the category breakdown), `merchant_name` (merchant breakdown), `account_id`/`nickname` (per-account breakdown), `status` (detects `PDNG` — pending — for the separate pending totals).

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
2. **Is this a duplicate charge?** Look for the same merchant charging you the exact same amount more than once within 24 hours — the signature of an accidental double charge, not a legitimate recurring bill (which repeats on a much longer cycle).

A transaction can be flagged by both checks at once, in which case the reasons are combined into one message. Severity (`high` vs. `medium`) only ever escalates, never downgrades, as more checks weigh in — a transaction judged unusual with high confidence by one check stays "high" even if another check only flags it as "medium." Results are sorted worst-first (high severity, then largest amount) and capped at the 25 most notable. As with the other insights endpoints, an AI model is asked to summarize the flagged list in plain English, falling back to a templated sentence naming the single most notable one if the AI isn't available.

*Fields used:* `credit_debit_indicator` (spending only — income isn't checked), `category` (the grouping the outlier check compares within — assigned by the same categorizer as category-breakdown, so this runs after categorization), `amount` (the value being compared against its category's typical range), `booking_datetime` (the time window, and the ordering used to detect "within 24 hours"), `merchant_name`/`transaction_information` (identifying "the same merchant" for the duplicate-charge check), `transaction_id` (which transaction is being flagged).

## The common thread across the AI-powered endpoints

The numbers are always calculated the same reliable way regardless of whether the AI is reachable — the AI only ever adds the *sentence describing* the numbers (or picks a category label), it never changes what the numbers themselves are. If the AI fails, you get the same math with a plainer, rule-based sentence instead of a silently broken response.

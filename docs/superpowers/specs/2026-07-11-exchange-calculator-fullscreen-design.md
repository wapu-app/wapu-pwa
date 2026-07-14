# Exchange Rate Calculator — Fullscreen redesign + bidirectional + BTC→ARS

**Date:** 2026-07-11
**Branch:** price-calculator
**Scope:** `survivors/` frontend only. Two files rewritten, no backend changes.

## Goal

Redesign the "Estimate a transaction" modal (`ExchangeRateCalculatorModal`) so it:

1. Renders **fullscreen** (edge-to-edge), respecting the current app aesthetic (dark bg, pink accents, Tamagui pills — matching `pages/home`).
2. Lets the user type in **both** amount fields (crypto ↔ fiat), recomputing the other live.
3. Supports **BTC funding → ARS** (today BTC only mapped to USD).
4. Mirrors the backend `POST /transactions/direct-fiat/tentatives` math **client-side** (no API call — that endpoint creates a real tentative with side effects).

## Calculation model (client-side replica of the backend)

Source of truth: `app_backend/app/services/direct_fiat_payment_service.py::calculate_quote` (verified against the example: 25000 ARS → 16.68 USDT funding, 0.83 fee, 17.51 total, 27433 sats).

Inputs come from the `user` object already loaded by `context/userContext.jsx`:
- `user.rates` — array of `{ pair, buy, sell }`. Pairs used: `USDT/ARS` (buy), `USDT/BRL` (buy), `BTC/USD` (buy).
- `user.fiatTransferFee`, `user.fastFiatTransferFee` — fee fractions from settings (e.g. `0.05`).

Everything is denominated through USDT:

```
exchange_rate       = rate(USDT/<fiat>).buy
funding_amount_usdt = round(amount_fiat / exchange_rate, 2)
fee_rate            = isFast ? fastFiatTransferFee : fiatTransferFee
fee_amount_usdt     = round(funding_amount_usdt * fee_rate, 2)
total_amount_usdt   = round(funding_amount_usdt + fee_amount_usdt, 2)

# BTC (Lightning) funding only:
btc_usd             = rate(BTC/USD).buy
funding_amount_sat  = ceil( (funding_amount_usdt / btc_usd) * 1e8 )   # deposit shown pre-fee (see note)
total_amount_sat    = ceil( (total_amount_usdt  / btc_usd) * 1e8 )    # == backend funding_amount_sat
```

**Rounding:** USDT values `round(x, 2)`; sats `Math.ceil` to integer (always up), matching backend.

**Note on the BTC deposit figure:** the backend response only exposes `funding_amount_sat` derived from the **total**. Because we display the deposit as *funding (pre-fee)* plus a separate *Total required* line, we derive a pre-fee `funding_amount_sat` for the deposit field and keep `total_amount_sat` (= backend's `funding_amount_sat`) for the Total line. The Total-in-sats is the backend-faithful number.

**Fee source (corrected during implementation):** `/users/home` returns `settings.fiat_transfer_fee` / `fast_fiat_transfer_fee` via the backend's `get_fee_with_discount(...)` (`app_backend/app/api/users_api.py:856-857`) — i.e. the user's **already-discounted** rate, the *same* `fee_rate` the backend `calculate_quote` uses. So the estimate is accurate on the fee axis (not a "base fee"). The original "may be lower with discounts" caveat was therefore wrong and was replaced with an honest one: **"Estimate — rate and final amount are confirmed when you create the transaction."**

**Rounding divergence (accepted):** `round2()` uses `Math.round(x*100)/100` (half-up); the backend uses Python `round(x,2)` (dtoa-based, ties-to-even). These can differ by **≤0.01 USDT** on some inputs. Exact parity needs a decimal library, and a hand-rolled half-even would add *new* float-scaling error, so for an explicitly-"≈" estimate (authoritative amount = the tentative created at transaction time) the sub-cent drift is accepted and documented in the util. This is the only remaining numeric divergence from the backend.

### Fiat options per crypto
- `USDT` → `["ARS", "BRL"]`
- `BTC`  → `["ARS"]`  (per product decision)

When switching to BTC while `BRL` is selected, fiat auto-resets to `ARS`.

### Bidirectional editing
Fields are linked by the pure rate relationship (funding ↔ fiat), fee/total derived:
- **Type fiat** → `funding = round(fiat / rate, 2)` → fee, total derived.
- **Type crypto (deposit = funding)**:
  - USDT: `funding = parseFloat(input)`; `fiat = round(funding * rate, 2)`.
  - BTC: input is in **sats** → `funding_usdt = (sats / 1e8) * btc_usd`; `fiat = round(funding_usdt * rate, 2)`.
- Reverse is accurate to the cent (rounding is not perfectly invertible); acceptable for an estimator.
- Empty / invalid input (via `isValidAmount`) → other field blank, breakdown shows `---`.

## UI / layout

- **Fullscreen**: full viewport width/height, app dark background (`$neutral2`), safe-area padding. Replaces the current centered bordered card.
- **Top bar**: title "Estimate a transaction" + close **✕** top-right (replaces the floating bottom X).
- **Controls** (top → bottom):
  1. Crypto `SegmentedControl`: `USDT | BTC`.
  2. Deposit field (`TamaguiInput`, editable): USDT → USDT value; BTC → sats, with helper `≈ <btc> BTC · <usdt> USDT`.
  3. Fiat `SegmentedControl`: `ARS | BRL` (BRL hidden/disabled when crypto = BTC).
  4. "To cover" field (`TamaguiInput`, editable, autoFocus).
  5. Speed `SegmentedControl`: `Fiat transfer | Fast fiat transfer`.
  6. Breakdown (read-only): `1 USDT = <rate> <fiat>`, `Fiat transfer fee <fee> USDT ≈`, `Total required <total>` (USDT, or sats + ≈USDT for BTC).
- **Keep `SegmentedControl` pills** (no Tamagui `Select`/`CurrencySelect` inside the overlay — known to render behind it; documented learning).
- Reuse existing tokens: `$pink500`/`$pink400` accents, `$neutral*` surfaces/text, matching `home`.

## Files

| File | Change |
|------|--------|
| `utils/exchangeCalculator.js` | Rewrite: USDT-denominated model, `calculateEstimate` returns `{ funding_usdt, fee_usdt, total_usdt, funding_sat?, total_sat? }`; add inverse helper `fiatFromFunding`; keep pure/guarded (null on missing rate/fee/amount). Update `CRYPTO_TO_FIATS` (BTC→[ARS]). |
| `components/ExchangeRateCalculatorModal/index.jsx` | Fullscreen layout; controlled bidirectional inputs (track which field is "driving"); BTC sats display; "≈ estimado" marker. |

No changes to `home/index.jsx` (already passes `isOpen`/`onClose`) or `userContext.jsx` (already provides `rates` + fee fractions).

## Edge cases / guards
- `user.rates` missing the needed pair (e.g. no `BTC/USD` locally) → estimate `null` → fields/breakdown show `---` (no crash). Follows existing `exchangeCalculator` guard style.
- `feeFraction` undefined → `null` estimate (existing behavior).
- Division by zero / `rate.buy <= 0` → `null`.
- BTC selected + BRL previously chosen → auto-switch to ARS.

## Verification plan
1. Pure unit checks (node) of `exchangeCalculator` against the backend example (25000 ARS → 16.68 / 0.83 / 17.51 / 27433) and inverse round-trips; edge cases (0, empty, missing rate).
2. Drive the app headless (Playwright) logged in, open the modal from `home`, confirm: fullscreen render, both fields editable, BTC→ARS collapses BRL, no console errors, aesthetic matches. Screenshot at 375px.

## Non-goals (YAGNI)
- No funding-network picker (Ethereum/Polygon/Liquid) — crypto choice is the proxy.
- No live tentative creation / API calls.
- No replication of personal discount tags.
- No changes to other pages or the pre-existing app-wide RN-web `<View>` text-node warnings.

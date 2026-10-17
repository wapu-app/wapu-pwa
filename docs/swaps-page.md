# Swaps page (`/swaps`)

Public, mobile-first crypto swap flow. It works logged out and logged in, and it
is the first page in the app that ships its own bilingual (ES/EN) dictionary.

## Route and access

- Route: `pages/swaps/index.jsx` (Pages Router).
- Public: `/swaps` is listed in `noAuthRequiredPaths` (`utils/validations.jsx`),
  so the layout session gate does not redirect anonymous visitors.
- Chrome-free: `/swaps` is in the `hiddenPath` array of `components/Header`, so
  the burger header does not paint over the card.

## Supported legs

| Code            | Ticker | Network  | Decimals | Address family |
| --------------- | ------ | -------- | -------- | -------------- |
| `BTC`           | BTC    | Bitcoin  | 8        | bitcoin        |
| `LBTC`          | L-BTC  | Liquid   | 8        | liquid         |
| `USDT_LIQUID`   | USDT   | Liquid   | 8        | liquid         |
| `USDT_ETHEREUM` | USDT   | Ethereum | 6        | evm            |
| `USDT_POLYGON`  | USDT   | Polygon  | 6        | evm            |
| `BTC_LIGHTNING` | BTC    | Lightning| 8 (sats) | lightning (`user@domain`) |
| `ARS`           | ARS    | P2P      | 2 (centavos) | fiat       |

Amounts travel over the wire as **integer base units**. The UI shows human
units; `toBaseUnits` / `fromBaseUnits` in `components/Swaps/primitives.jsx` are
the only place that converts between the two. Extra fractional digits are
floored, never rounded up.

## Phases

The page is a single card with three phases plus a language pill at the very top.

1. **Quote** (`components/Swaps/QuoteCard.jsx`) — asset selectors for both legs,
   **two editable amount fields**, a direction switch, and the live quote
   breakdown (amount out, rate, fee %, minimum, validity, required
   confirmations). The backend also returns `spread_bps`, but the page never
   shows it: the spread is already reflected in the quoted rate and is not
   user-facing. The quote request is debounced ~500 ms.
   `liquidity_ok: false` still renders the quote but shows an amber banner and
   disables the CTA.

   **Either side can be pinned.** Typing in *you send* prices forward; typing in
   *you get* ("I want to receive 1 BTC") sends `amount_out` instead and the
   backend solves for the input — see `app_backend/docs/2026-09-10-swaps.md` in the `wapu-app/survivors` repo. Page state
   keeps `side` (`"in"`/`"out"`) and mirrors the answer into the other field;
   only the pinned text is a dependency of the fetch, so mirroring never
   triggers a second round trip.

   **The rate row is the effective one.** `quote.rate` is the *base* rate,
   before fee and spread — printing it next to the payout reads as a lie (1
   L-BTC "at rate 1" that pays out 0.9801 BTC). `effectiveRate()` derives
   `amount_out / amount_in` from the quote's own amounts with BigInt (float
   division surfaces as `0.98009999…` once truncated), so the row can never
   disagree with the *you get* figure, and `formatRate()` then caps it at the
   destination's precision — 8 decimals into bitcoin, 2 into USDT. Because it
   is all-in, the labels say so: "Tasa efectiva" / "Comisión (ya incluida)".
   The row uses `asset.ticker` (`L-BTC`, `USDT Ethereum`, …) rather than
   `asset.symbol`, since "1 BTC ≈ 1 BTC" would be nonsense.

   **BTC / SAT.** Both bitcoin legs (Bitcoin *and* Liquid) carry the ticker
   `BTC` inside the amount box — the network is already named in the selector
   right above it — and that ticker is a button flipping the whole card between
   BTC and sats. It is one preference for both fields, persisted in
   `localStorage` under `wapu.swaps.btcUnit`; `convertUnitText` rewrites what is
   typed so the value never changes under the user. Since both legs then read
   "BTC", anywhere the selector is not on screen (summaries, status) formats
   amounts with `{ network: true }` → `0.9801 BTC · Liquid`.
2. **Addresses** (`components/Swaps/AddressForm.jsx`) — payout address on the
   `to` network and refund address on the `from` network, validated client-side
   against loose mirrors of the backend patterns (EVM `0x…40 hex`, Bitcoin
   `bc1|tb1|bcrt1…`, Liquid `lq1|el1|ert1|VJL|VT|AZ` prefix). Submitting posts
   the swap and, on `201`, pushes `/swaps?id=<uuid>` shallowly.
3. **Status** (`components/Swaps/SwapStatus.jsx`) — deposit address with QR
   (`QRCodeSVG`) and copy button, the exact amount to send, a countdown to
   `expires_at`, and a four-step progress bar (deposit → confirming → sending →
   done) showing `x/N` confirmations. Terminal failure states render the refund
   notice, `refund_txid` and `error_note`.

   **Hashes are shortened on screen but whole underneath.** Every txid and the
   swap id itself carry a `CopyButton` that copies the full string — the swap
   id is what a user quotes back to support when a swap goes wrong, and a
   truncated one is worthless there. Each txid is also a link to its chain's
   explorer, from `explorerTxUrl()` and the `explorer` prefix in `ASSETS`
   (`blockstream.info/tx`, `blockstream.info/liquid/tx`, `etherscan.io/tx`,
   `polygonscan.com/tx`). The prefix is per-asset, not per-`family`: the two
   USDT legs validate addresses identically but settle on different chains.
   Which chain a hash is on is not in the hash, so the caller passes the leg —
   `deposit_txid` on `swap.from`, `payout_txid` on `swap.to`, `refund_txid`
   back out on `swap.from`. **The explorers are mainnet-only**, while
   `ADDRESS_PATTERNS` still accepts `tb1|bcrt1|ert1`; a testnet deployment
   would need its own prefixes.

   Five copy buttons can share this card, so each one passes `copyLabel` to
   `CopyButton` (`"Copiar TXID del depósito"`, …) instead of all being called
   "Copy", and `copiedLabel` so the confirmation is in the page's language.

The swap id lives in the URL, so refreshing or sharing the link restores phase 3
directly. "Start a new swap" resets state and pushes `/swaps`.

## ARS legs (logged in only)

`ARS` and `BTC_LIGHTNING` as an input need a session. The page resolves the
gate after mount with `resolveLoggedIn()`: cookie `isLoggedIn` +
`!isAuthExpired()` (same test as the layout), plus one refresh when a session
cookie is present but the token expired, because the layout does not restore
sessions on this public route. Anonymous visitors trigger no request. The page
then filters both selectors through `sendOptions` / `receiveOptions`.
The authenticated page also requests `GET /users/user-settings` through
`getUserSettings`. ARS is offered as an input only after a successful response
with `beta_version: true`; loading, absent settings and failed requests keep
ARS purchases unavailable. Once beta is confirmed, a fresh form defaults to
ARS → BTC Lightning. If the user has already selected a pair or entered an
amount while settings load, their input is preserved. Other visitors keep
the L-BTC → BTC default. Pair selection, reversal, quote and creation use
the same permission. This does not restrict crypto sales to ARS or crypto
swaps, and existing purchase links keep showing their issued instructions and
polling regardless of beta. The backend remains responsible for enforcing
beta and the global `ramp_on` flag on new ramp-on operations.

"You send" never offers USDT Ethereum/Polygon. Every pair
change goes through `normalizePair`, so the form never sits on an unoffered
pair. With a session, an X at the top right leaves the page (`router.back()`,
or `/home` when there is no history).

`flowOf(from, to)` picks one of three flows:

| Flow | Pairs | Backend |
|------|-------|---------|
| `swap` | crypto <-> crypto | `/swaps` as above |
| `arsBuy` | `ARS` -> BTC Lightning, BTC, L-BTC, USDT Liquid/Ethereum/Polygon | direct-fiat tentatives with `type: "crypto_purchase"` (P2P ramp-on) |
| `arsSell` | BTC Lightning, L-BTC, USDT Liquid -> `ARS` | direct-fiat tentatives, always `fast_fiat_transfer` |

- **`arsBuy`** is a direct-fiat purchase: the buyer transfers ARS to another
  Wapu user (the receiver) and the backend sends the crypto out. It never uses
  `/swaps`. Each target maps to a `(payout_currency, payout_network)` pair in
  `PURCHASE_TARGETS` (`components/Swaps/primitives.jsx`):

  | Target | `payout_currency` | `payout_network` | `amount_out` unit |
  |---|---|---|---|
  | `BTC` | `SAT` | `BITCOIN` | sats |
  | `BTC_LIGHTNING` | `SAT` | `LIGHTNING` | sats |
  | `LBTC` | `LBTC` | `LIQUID` | sats |
  | `USDT_LIQUID` / `USDT_ETHEREUM` / `USDT_POLYGON` | `USDT` | `LIQUID` / `ETHEREUM` / `POLYGON` | USDT cents |

  The quote and the creation send exactly one of `amount_ars_cents` or
  `amount_out` (the pinned side); creation adds `payout_address` (a Lightning
  **address** for `BTC_LIGHTNING`, never an invoice). The page converts USDT
  cents to the chain's base units for display (`purchaseAmountToBaseUnits`)
  and adapts the quote to the swap-quote shape `QuoteCard` reads. Submitting
  creates the tentative and calls `/funding`, like `arsSell`; a failed
  `/funding` keeps the order in `CREATED` and the status screen retries it
  without recreating it. Funding a purchase needs a session.
- The purchase status screen picks `PurchaseStatus` by the tentative's
  `type`/`direction` (`isPurchaseTentative`), never by the mere presence of
  `?tentative=`. `purchaseOrderOf` maps the payload onto the order
  `PurchaseStatus` and `ArsPaymentInstructions` render. Alias and CVU appear
  only after funding, and the amount shown is `amount_ars_cents` from the
  funded order, not the quote: the backend may bump it a few cents to make the
  transfer unique. The amount always has two decimals (`formatArsCents`), with
  a warning that a different amount is not detected. Copy: waiting for the
  ARS transfer (`FUNDING_ISSUED`), sending crypto (`EXECUTED`), under review
  (`payout_status: "review"`), completed, and `SETTLED_TO_BALANCE`, worded as
  credited to the Wapu balance, never as crypto delivered. An `EXPIRED`
  purchase keeps polling while `watch_pending` is true: the bank may still
  report a payment made in time.
- Legacy ARS purchase swaps (`?id=<uuid>` with `from: "ARS"`) still render
  read-only through `PurchaseStatus`: "under review" is
  `error_code: "under_review"` (or `FAILED` with a `deposit_txid`), and an
  `EXPIRED` one polls until `late_watch_until` (60 minutes after `expires_at`
  when absent).
- **`arsSell`** prices only from the ARS amount (direct-fiat quote, pesos), so
  "you send" is read-only. Phase 2 asks for the alias/CBU/CVU and an optional
  holder name; the backend validates the alias/CBU/CVU (optionally against
  Fiwind), so the client only checks that it is not empty. Submitting creates
  the tentative and calls `/funding` before the status screen starts polling,
  so a stale `CREATED` read cannot land after the `201` of `/funding`. Tentative
  statuses are not swap statuses: `EXECUTED` is not final, the fiat transfer is
  still going out. The
  order lives at `/swaps?tentative=<id>` (`FiatPayoutStatus`). A tentative
  still in `CREATED` offers to issue the instructions again. Direct-fiat polling
  stops at a terminal status unless the payload says `watch_pending: true`.
- A `401` or `404` from `GET /swaps/<uuid>` or the tentative endpoint stops
  polling until the user acts (retry or new order): these do not fix
  themselves, and the tentative endpoint would refresh the session every tick.

## Polling

`GET /swaps/<uuid>` is polled every 10 s with `setInterval`. The effect depends
on a derived `isTerminal` flag, so reaching `COMPLETED`, `EXPIRED`, `REFUNDED`
or `FAILED` tears the interval down through the effect cleanup. The countdown
runs on its own 1 s interval and stops once the swap leaves `WAITING_DEPOSIT`.

## API

All calls go through `api/api.js` — no raw `fetch` in the page or components.

| Function                         | Endpoint                                   | Auth       |
| -------------------------------- | ------------------------------------------ | ---------- |
| `getSwapQuote(from, to, amount)` | `GET /swaps/quote?from=&to=&amount=`       | none       |
| `createSwap(body)`               | `POST /swaps`                              | optional   |
| `getSwap(uuid)`                  | `GET /swaps/<uuid>`                        | none       |
| `getMySwaps()`                   | `GET /swaps`                               | required   |
| `getUserSettings()`              | `GET /users/user-settings`                 | required   |
| `getCryptoPurchaseQuote(params)` | `GET /transactions/direct-fiat/quote?type=crypto_purchase` | required |
| `createCryptoPurchaseTentative(body)` | `POST /transactions/direct-fiat/tentatives` (`type: "crypto_purchase"`) | required |
| `getDirectFiatQuote(args)`       | `GET /transactions/direct-fiat/quote`      | required   |
| `createDirectFiatTentative(body)`| `POST /transactions/direct-fiat/tentatives`| required   |
| `requestDirectFiatFunding(id)`   | `POST /transactions/direct-fiat/tentatives/<id>/funding` | required |
| `getDirectFiatTentative(id)`     | `GET /transactions/direct-fiat/tentatives/<id>` | required |

`apiRequest` gained a third value for `requiresAuth`: `"optional"`. It tries
`getAccessToken()` and attaches `Authorization` only when a token comes back;
unlike `requiresAuth: true` it never short-circuits with a 401, so an anonymous
visitor can still create a swap.

Error handling in the page: `400` surfaces the backend `error` string, `409` the
no-liquidity message, `429` a translated rate-limit message, and the
feature-flag-off `400` message is shown verbatim.

## i18n

`components/Swaps/i18n.js` exports `TRANSLATIONS` (`{ es, en }`) and
`useSwapsLang()`. The hook keeps the language in state, reads/writes
`localStorage` under `wapu-swaps-lang` inside `try/catch`, and defaults to `es`.
The stored value is read after mount so the server HTML and the first client
render agree. Errors are held as an i18n key or a raw backend message — never as
already-translated text — so switching language retranslates the screen without
refetching.

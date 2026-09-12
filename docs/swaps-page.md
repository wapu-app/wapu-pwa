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
   backend solves for the input — see `docs/swaps.md` in survivors. Page state
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

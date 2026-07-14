# Price Calculator — Brand manual (v1.0) application

**Date:** 2026-07-11
**Branch:** price-calculator
**Scope:** `survivors/` frontend only. Presentational; the money math is untouched.
**Follow-up to:** `2026-07-11-exchange-calculator-fullscreen-design.md`

## Goal

Apply the Wapu brand manual (`survivors/docs/Wapu - Manual de Marca.html`, v1.0) to the
price-calculator screen (`ExchangeRateCalculatorModal`). Per the request:

1. Restyle the screen to the brand system (color, typography, graphic codes).
2. Replace the segmented-pill controls for the **currencies** with **small selectors** like the
   home balance card's `CurrencySelect`.
3. Use a small selector for the **transfer type** too (or a more aesthetic option).

## Brand system extracted from the manual

Source: rendered the JS-packed manual headless and read section 05 (Color), 06 (Typography),
07 (Graphic system), 08 (UI components).

- **Color** — Ink `#0A0712` base (≈70% of the surface); Surface `#1D1A24`; Off White `#F3F4F6`
  (AAA on Ink). Signature **Wapu Pink `#E7357C`** (action); secondary Deep Purple `#7309B6`,
  Electric Blue `#504DE7`; accents **Volt Yellow `#F8F46B`** and **Mint `#7CFFD8`**
  ("el amarillo puntúa, nunca invade"). Brand gradient pink→purple @120° is **reserved for
  CTAs / key accents** — must not wash the screen.
- **Typography** — **Geist** single family: Geist Sans (titles/body/CTAs), **Geist Mono**
  (labels, data, overline — uppercase, tracking ~0.12–0.14em). Primary buttons: white on
  gradient, weight 800.
- **Graphic codes** — subtle technical grid, **reactive glow** (color halos on dark), electric
  "rayo" connecting steps, overline **pills** and attribute **chips**.
- **UI components** — "radios chicos, bordes sutiles, hover con vida".

`pink500` (#E7357C) and `blue500` (#504DE7) already match the manual, so they are reused. The
Ink/Surface/Off-White neutrals and the Volt/Mint/Deep-Purple accents were **added** as tokens.

## Decisions

| Question | Decision | Rationale |
|----------|----------|-----------|
| Selector style | New `CalcSelect` (compact Tamagui `Select`, styled after home `CurrencySelect`) for all three choices | Literal match to the home "small selector" the user asked for; used for crypto, fiat, and transfer speed |
| Select-in-Dialog trap | `zIndex: 100000` on `Select.Content` | A prior learning said the dropdown paints *behind* the fullscreen Dialog overlay (z 10). Verified in the render that the high z-index makes it paint above, so the built-in Select works — no custom popover needed |
| Component form | Kept a fullscreen `Dialog` (not a route) | Out of scope to convert to a page; the render confirms the Dialog approach is sound |
| Copy language | English (unchanged) | The manual's Argentine voseo is *marketing* voice; the product UI is English everywhere else |
| Fonts | Added Geist + Geist Mono via a Google Fonts `<link>` in `_app.js`; applied to the calculator via inline `fontFamily` | No CSP in `next.config.js` blocks it. Verified the webfonts *actually download and render* (not just that the CSS stack applies): `fonts.gstatic.com/.../geist*.woff2` → 200, and `document.fonts` reports the used weights `loaded` (Geist w800 for the title, Geist w400, Geist Mono w400/500/600 for data + overlines); `document.fonts.check` passes for the weights in use. So a raw CDN `<link>` is sufficient — no `next/font` migration needed |
| Gradient | **Not** used as a screen wash or a manufactured CTA; brand pink→purple presence comes from a low-opacity **reactive glow** only | The screen has no submit action; "nunca invade" |

## Layout (top → bottom, fullscreen, Ink bg + glow)

- Header: overline **pill** ("● PRICE CALCULATOR", mint dot, Geist Mono) + Geist Sans 800 title
  + muted caveat subtitle + pink close button.
- "YOU DEPOSIT" overline + crypto `CalcSelect` (USDT | BTC); big Geist-Mono amount field with unit
  suffix; BTC helper line (`≈ <btc> BTC · <usdt> USDT`).
- Subtle mint "↓" connector.
- "TO COVER" overline + fiat `CalcSelect` (ARS | BRL; BTC collapses to ARS); amount field.
- "TRANSFER SPEED" overline + `CalcSelect` (Fiat transfer | Fast fiat transfer).
- Breakdown card (Surface, small radius, subtle border): Exchange rate, fee, hairline, Total
  required (larger mono; sats + ≈USDT for BTC).

## Files

| File | Change |
|------|--------|
| `tamagui.config.ts` | **Additive** brand tokens: `brandInk`, `brandSurface`, `brandSurfaceDeep`, `brandDeepPurple`, `brandVolt`, `brandMint`, `brandOffWhite` |
| `pages/_app.js` | **Additive** Geist + Geist Mono Google Fonts `<link>` |
| `components/CalcSelect/index.jsx` | **New** compact select: `{ value, onChange, options:[{value,label}], label, minWidth }`; auto-width trigger, `zIndex` popover, mono values |
| `components/ExchangeRateCalculatorModal/index.jsx` | Rewritten presentation (Ink/glow/Geist/overlines/CalcSelect). **State + calculation calls unchanged.** |

**Not touched:** `utils/exchangeCalculator.js` (money math, 31/31 tests, accepted rounding
divergence) and `pages/home/index.jsx`.

## Verification

- `npm run build` → `✓ Compiled successfully`, 69/69 static pages, exit 0.
- Headless render (Playwright, 390px, logged-in via route stubs):
  - Computed `font-family` on the amount input = `"Geist Mono", …` (Geist really applied).
  - Each `CalcSelect` opens and its options **paint above** the Dialog overlay; the bottom-most
    (transfer speed) opens downward without clipping; selecting BTC switches to sats.
  - Math parity intact: 25000 ARS → 16.68 funding / 17.01 total (normal) / 17.51 (fast); BTC
    26 133 deposit sats, 26 650 total sats.
  - No new console errors (remaining ones are pre-existing app-wide RN-web `<View>` text-node
    warnings, a pre-existing Tamagui SSR hydration warning, and a `CurrencySelect` missing-alt
    warning on home — none from this diff).

## Adversarial review & fixes

An automated multi-lens review (brand-fidelity, correctness, a11y/UX) with per-finding
verification surfaced 8 confirmed items; all were fixed and re-verified against the production
build:

| # | Sev | Finding | Fix |
|---|-----|---------|-----|
| 1 | med | Fullscreen `Dialog` had no accessible name (missing `Dialog.Title`/`Description`; Radix warns + WCAG 4.1.2) | Title/subtitle now render as `Dialog.Title` / `Dialog.Description` (identical styling). Dev warnings gone; verified 0 in render |
| 2 | med | Amount inputs had only a placeholder, no programmatic label | Added `aria-label` ("Deposit amount in USDT" / "Amount to cover in ARS"); verified on the DOM `<input>`s |
| 3 | med | "Total required" overline `$neutral10` on `$brandSurface` = 4.21:1 (< AA 4.5) | `Overline` default color → `$neutral11` (6.53:1 on surface; still muted) |
| 4 | low | Overline tracking 0.12em contradicted its own "0.14em" comment / manual | Set `letterSpacing` to 0.14em |
| 5 | low | Solid `$pink500` on the *close* control made "dismiss" the loudest element | Quieter translucent-pink close (`rgba(231,53,124,0.16)` + `$pink700` border), matching `TamaguiSendModal`; pink reserved for accents |
| 6 | low | `brandSurfaceDeep #14121A` filed under the "brand manual" comment but isn't a manual color | Relabeled the token comment as a derived UI surface |
| 7 | low | Empty state mixed "—" and "---" across the three breakdown rows | Unified to em dash "—" (verified 3× "—", 0× "---") |
| 8 | low | Single-option destination select (BTC → ARS only) still rendered an interactive dropdown | `CalcSelect` renders a static (non-interactive, chevron-less) pill when `options.length <= 1`; verified clicking opens 0 options |

The correctness lens stalled mid-run and was re-run separately over the final code, which found
one more:

| # | Sev | Finding | Fix |
|---|-----|---------|-----|
| 9 | **critical** | `CalcSelect` called `useMemo` **after** the `options.length <= 1` early return — a conditional hook. The "To cover" select toggles 2 options (USDT) ↔ 1 option (BTC) on the *same* fiber, so the hook count would change (Rules of Hooks violation, risk of a render crash on the BTC flow). The memo was also a no-op (parent rebuilds `options` each render). | Removed the `useMemo`, inlined the `options.map` so `CalcSelect` calls **zero** hooks and the early return is unconditional. Verified: 5× USDT↔BTC toggles produce 0 hook/React errors and the modal never drops |

Remaining console output in the production render is a single unstubbed `401` (test-harness
artifact), no app warnings. `next build` is green; the money math (`exchangeCalculator.js`,
31/31) was confirmed untouched by this diff.

## Non-goals

- No route conversion; stays a Dialog.
- No app-wide font/theme migration (Geist is loaded app-wide but only applied on this screen).
- No copy translation to Spanish; no gradient CTA (no submit action exists here).

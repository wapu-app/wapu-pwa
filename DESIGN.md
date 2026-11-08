# Wapu UI contract

## Scope and references

This contract records the existing Tamagui system used by the email verification
screen. Sources: `tamagui.config.ts`, `components/TamaguiButton`,
`components/TamaguiInput`, and the login and password recovery screens.

## Color and surfaces

Use the existing dark shell, `neutral3` for the status icon surface,
`neutral13` for headings, and `neutral12` for descriptions. Status glyphs use
`brandMint` for success and `pink300` otherwise; inline errors use `pink200`.
No new palette, shadows, or decorative gradients.

## Typography

Headings use Clash Display (`heading`), size 5 (28px), weight 2, 36px line height.
Body copy uses Inter (`body`), size 3 (16px), normal weight, 24px line height.
Use one semantic H1 and centered, short explanatory copy.

## Spacing and responsive layout

Content follows the existing 90% page width with a 440px maximum. Use Tamagui
spacing tokens 3.5 (16px), 5 (24px), 6 (32px), and 8 (46px). The status glyph is
40px inside an 88px surface with radius 8. Keep the message and actions together;
allow the shared main element to scroll at short viewport heights.

## Primitives and interactions

Reuse `TamaguiButton` for primary pink and secondary login actions and
`TamaguiInput` for email entry. Preserve their existing pressed and loading
behavior. No new motion. The existing shell supplies the Wapu logo.

## States and content

Render pending, verified, invalid link, connection error, resend form, and sent
states explicitly. Pending has no actionable verification outcome. Connection
errors offer retry. Resending keeps confirmation on screen, with no redirect.
Use English, matching the app; explain the next action in plain language.

## Accessibility

Announce status changes politely; expose resend errors as alerts associated with
the email field. Decorative icons are hidden from assistive technology. Support
email autocomplete and Enter submission. Preserve component focus behavior.

## Existing constraints

The app uses a dark theme, fixed shell geometry, shared typography, and shared
button/input styling. This scoped update introduces no dependencies or global
theme changes. Changes to shared focus styling or the shell require a separate
cross-screen review.

<!-- Parent: ../AGENTS.md -->
<!-- Generated: 2025-05-24 -->

# survivors — React / Next.js Frontend

## Purpose

Mobile-optimized PWA built with Next.js. Provides the user-facing interface for wallet management, KYC onboarding, deposits, transfers, and payment flows. Communicates exclusively with the Flask backend via `api/api.js`.

## Environment Setup

```bash
cd survivors
npm install
npm run env:qa      # or env:local | env:stg | env:prod

npm run dev         # http://localhost:3000
npm run build       # production build
npm run start       # serve production build
npm run lint        # ESLint
```

Node ≥ 20, npm ≥ 10 required.

## Key Files

| File | Description |
|------|-------------|
| `api/api.js` | **Single API client** — all backend calls go through here |
| `context/userContext.jsx` | Global user state (auth, profile, wallet) via React Context |
| `hooks/userAgent.jsx` | Device/user-agent detection hook |
| `next.config.js` | Next.js config (PWA, image domains, etc.) |
| `tamagui.config.ts` | Tamagui UI theme configuration |
| `tsconfig.json` | TypeScript config |
| `.prettierrc` | Prettier formatting rules |

## Subdirectories

| Directory | Purpose |
|-----------|---------|
| `pages/` | Next.js routes — each subfolder is a page |
| `components/` | Reusable UI components |
| `context/` | React Context providers |
| `hooks/` | Custom React hooks |
| `styles/` | Global CSS / SCSS |
| `config/` | Environment-specific configuration |
| `utils/` | Shared utility functions |
| `public/` | Static assets (icons, images) |
| `landing/` | Landing page assets |

## Pages (`pages/`)

**Hot path** — `newDepositChoice` is frequently modified.

| Route | Purpose |
|-------|---------|
| `index.jsx` | Entry / redirect logic |
| `home/` | Main dashboard |
| `login/` | Email/password login |
| `newSignUp/` | Registration flow |
| `newVerifyEmail/` | Email verification |
| `deposit/` | Legacy deposit |
| `newDepositChoice/` | New deposit method selector |
| `newAlternativeDeposit/` | Alternative deposit methods |
| `newBlockchainDeposit/` | On-chain deposit |
| `bitcoinDeposit/` | Bitcoin-specific deposit |
| `newSend/` | Send crypto flow |
| `newWithdrawal/` | Withdrawal flow |
| `innerTransfer/` | Internal transfer |
| `qrPayment/` | QR code payment scanner |
| `pix/` | PIX (Brazil) payment |
| `newMovements/` | Transaction history |
| `newTransactionDetail/` | Transaction detail view |
| `newTransactionComplete/` | Post-transaction confirmation |
| `newTransactionPending/` | Pending transaction state |
| `kycIntro/` | KYC onboarding intro |
| `kycPersonData/` | KYC personal information |
| `kycResidenceData/` | KYC address information |
| `kycIDFrontPhoto/` | KYC ID front capture |
| `kycIDBackPhoto/` | KYC ID back capture |
| `kycFacePhoto/` | KYC selfie capture |
| `kycCompleted/` | KYC completion screen |
| `profile/` | User profile / settings |
| `processing/` | Generic processing state |

## Components (`components/`)

UI building blocks. Naming convention: `PascalCase` directories, each containing an `index.jsx` or `index.tsx`.

| Group | Components |
|-------|-----------|
| **Tamagui (new)** | `TamaguiButton`, `TamaguiInput`, `TamaguiSelect`, `TamaguiCheckbox`, `TamaguiLink`, `TamaguiIconButton`, `TamaguiProgressBar`, `TamaguiSendModal`, `TamaguiGuide` |
| **Forms** | `Input`, `InputReadOnly`, `Select`, `FileUpload` |
| **Layout** | `Header`, `Navbar`, `Navigation`, `NewFooterNavigation`, `layout/` |
| **Modals** | `ErrorModal`, `HelpModal`, `MessageModal`, `ModalWithButton` |
| **Auth** | `SignUp`, `login/`, `loginMagicLink/`, `logout/` |
| **Transactions** | `Movement`, `NewSendConfirmationModal`, `transactionChoice/` |
| **UI utilities** | `Button`, `ButtonRequest`, `CustomSpinner`, `ProcessBar`, `ExchangeRateCard`, `NewInfoCard`, `CurrencySelect`, `ContactsList`, `Referral`, `AddToHomeScreen`, `WeHaveAProblem` |

## State Management

- **Global state**: `context/userContext.jsx` — wraps the app in `_app.js`; provides user, wallet, and auth data
- **No Redux** — context + local state only
- **Auth**: JWT stored in cookies (`js-cookie`); decoded with `jwt-decode`

## API Client

`api/api.js` is the **single point of contact** with the backend. It is one of the most-read files in the project.

- All fetch calls go through this file — do not make raw `fetch`/`axios` calls from pages or components
- Environment base URL comes from `config/environment/`

## For AI Agents

### Working Here
- Add new routes as subdirectories under `pages/` following the existing pattern.
- New reusable UI → `components/`, preferring Tamagui components for new work.
- All API calls must go through `api/api.js` — never call the backend directly from a component.
- Check `context/userContext.jsx` before adding new global state; extend it rather than creating parallel contexts.
- This is a PWA — test mobile viewport behavior (375px width) for any UI change.

### Styling
- Legacy pages use `styled-components` + SCSS
- New components should use **Tamagui** (`tamagui.config.ts` for theme tokens)
- Do not mix styling systems within the same component

### Testing Requirements
- No automated frontend test suite currently
- Manually test on mobile viewport (Chrome DevTools device simulation)
- Run `npm run lint` and `npm run build` before considering work complete

### Common Patterns
- Pages import from `context/userContext.jsx` via `useContext(UserContext)`
- Conditional rendering based on `user` object from context
- Navigation via Next.js `useRouter()`

## Dependencies

### Key External Packages
- `next` 15.x — framework + routing
- `react` 18.x — UI library
- `tamagui` 1.x — new component system
- `styled-components` 5.x — legacy styling
- `jwt-decode` — token parsing
- `js-cookie` — cookie management
- `qrcode.react` — QR code display
- `react-webcam` — camera access for KYC
- `rsuite` — supplementary UI components
- `moment` — date formatting

### Internal
- `app_backend/` — all data comes from the Flask API

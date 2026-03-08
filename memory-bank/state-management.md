# Frontend State Management

This document describes the global state management approach in the survivors frontend application.

## Primary Technology

The application utilizes **React's Context API** for its global state management. A central context, `UserContext`, is provided at the top level of the application.

## `UserContextProvider`

This provider, located in `survivors/context/userContext.jsx`, wraps the entire application within `survivors/pages/_app.js`. It is responsible for holding and distributing global state.

### State Details

The context manages several key pieces of state:

-   **`user`**: A comprehensive object that stores all information related to the currently logged-in user. This includes:
    -   Account balances (`usdtBalance`, `combinedBalance`).
    -   Personal details (`email`, `username`).
    -   Verification and KYC status (`verified`, `kycStatus`).
    -   Application settings and feature flags (`pixDepositFee`, `fiatTransfer`, `pwaPopUp`, etc.).
    -   Exchange rates.
-   **UI State**: Several boolean flags are held in the context to manage the visibility of UI elements, primarily modals (e.g., `helpModalState`, `isOpen`, `transactionChoiceIsOpen`).

### Core Logic: `getUser` function

-   The `getUser` function is the primary mechanism for fetching user data from the backend via the `fetchUserData` API call.
-   It is invoked on pages that require user authentication.
-   It includes logic to handle invalid tokens, redirecting the user to a sign-up page if authentication fails.
-   An interesting feature is **design versioning**: the redirect path (`/newSignUp` vs. `/signup`) depends on a `webapp_design` setting, indicating an ongoing UI migration or A/B testing.

## Accessing State

The context provides a custom hook, `useUserContext`, which allows any component in the tree to easily access the global user state and associated functions without prop drilling.

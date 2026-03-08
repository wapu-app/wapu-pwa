# Frontend Routing

This document outlines the routing mechanism used in the survivors frontend application.

## Primary Technology

The application primarily uses the **Next.js Pages Router**. The file system within the `survivors/pages/` directory dictates the application's routes.

-   **`survivors/pages/_app.js`**: This is the main application wrapper. It injects global providers like `UserContextProvider` and `TamaguiProvider`, a global `Layout` component, and manages the HTML `<head>`.
-   **`survivors/pages/_document.js`**: Provides customization for the server-rendered document shell.
-   **`survivors/pages/index.jsx`**: The application's entry route (`/`), which renders the `Starting` component.

## App Router

A minimal **Next.js App Router** is set up, indicated by the presence of `survivors/app/layout.js`. As of now, it seems the bulk of the application is still using the Pages Router.

## Routing Configuration (`next.config.cjs`)

The `next.config.cjs` file contains important routing logic:

### Rewrites

-   The root path `/` is internally rewritten to serve the `/home` page. The user still sees the `/` URL in their browser.

### Redirects

-   Several permanent redirects are in place, mostly for the KYC (Know Your Customer) process to guide users to the appropriate step. For example, `/kycFacePhoto` redirects to `/kycPersonData`.

## Progressive Web App (PWA)

The application is configured as a PWA using `next-pwa`, enhancing its capabilities for offline use and providing a more native-app-like experience. This feature is disabled in the local development environment.

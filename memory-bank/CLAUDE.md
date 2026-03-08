# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

WapuPay is a mobile application that allows users to pay in local currency through local QR payment systems or send money to local bank accounts using cryptocurrency. The company acts as an intermediary, handling the cryptocurrency-to-fiat conversion for the customer, while the receiver gets the transaction in their local currency.

## Environment Setup and Commands

### Frontend (NextJS)

```bash
# Install dependencies
cd survivors
npm install
npm i sass
npm install web3

# Set environment (qa, local, stg, or prod)
npm run env:qa  # or env:local, env:stg, env:prod

# Start development server
npm run dev  # Available at http://localhost:3000

# Build for production
npm run build

# Start production server
npm run start

# Run linter
npm run lint
```

## Architecture

### Frontend Architecture

- Built with React and Next.js
- Uses styled-components for styling with some SCSS
- Beginning to adopt Tamagui for UI components
- Authentication via JWT
- State management through React Context (userContext)
- Progressive Web App (PWA) features for mobile optimization

Key directories:
- `/components`: Reusable UI components
- `/pages`: Next.js pages and routes
- `/api`: API client for backend communication
- `/context`: React context for state management
- `/config/environment`: Environment-specific configurations
- `/public`: Static assets

# Contributing and Local Setup

This document provides instructions for setting up the Vouch development environment and contributing to the project.

## Prerequisites

- Node.js (v18 or higher)
- pnpm (package manager)
- PostgreSQL database (or Neon account)
- Upstash Redis account (optional for local dev)

## Initial Setup

1. Clone the repository:
   ```bash
   git clone https://github.com/talhadevelopes/vouch-copilot.git
   cd vouch
   ```

2. Install dependencies from the root:
   ```bash
   pnpm install
   ```

## Environment Configuration

Create the following .env files based on the provided examples:

### Backend (apps/api/.env)
- DATABASE_URL: Your PostgreSQL connection string.
- GEMINI_API_KEY: API key from Google AI Studio.
- JWT_SECRET: A secure string for signing tokens.
- RESEND_API_KEY: For sending OTP emails.
- REDIS_URL: (Optional) For rate limiting.

### Web Dashboard (apps/web/.env.local)
- NEXT_PUBLIC_API_URL: Usually http://localhost:4000
- NEXT_PUBLIC_GOOGLE_CLIENT_ID: For social login testing.

### Sidebar (apps/sidebar/.env)
- VITE_API_URL: Usually http://localhost:4000

## Running the Application

Vouch uses Turborepo to manage all services simultaneously.

### Development Mode
```bash
pnpm dev
```
This command will start the API (port 4000), the Web Dashboard (port 3000), and the Sidebar build watcher.

### Database Management
- Generate Prisma Client: `pnpm --filter @vouch/api prisma:generate`
- Push Schema Changes: `pnpm --filter @vouch/api prisma:push`
- Open Prisma Studio: `pnpm --filter @vouch/api db:studio`

## Sidebar Setup

1. Build the sidebar: `pnpm --filter @vouch/sidebar build`
2. Open Chrome and navigate to `chrome://extensions/`
3. Enable "Developer mode" in the top right.
4. Click "Load unpacked" and select the `apps/sidebar/dist` directory.

## Project Standards

- All new features should include Zod schema validation in the apps/api/src/validators directory.
- Shared logic between the sidebar and web should be placed in packages/sdk.
- Maintain strict TypeScript typing across all packages.

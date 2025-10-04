# Wallet Manager

Production-ready multi-branch cash & wallet management platform built with Next.js (App Router), Prisma, and PostgreSQL.

## Features

- **Role aware dashboards**: Owners see company-wide KPIs, branch/account breakdowns, and quick actions (transfer, withdraw, order payments). Staff see branch balances and guided deposit workflow.
- **Secure authentication**: NextAuth credentials provider with Argon2 password hashing and role/branch context in the session.
- **Immutable ledger**: Prisma models enforce append-only transactions with paired transfer links and derived balances view.
- **Robust API**: Zod-validated Next.js route handlers for accounts, transactions, metrics, and profile endpoints with branch-level authorization.
- **Reporting**: Metrics endpoint groups totals by day/month/year/custom range and surfaces real-time highlights (today, month to date).
- **Developer ergonomics**: Type-safe services, reusable UI building blocks, Vitest unit tests for sensitive business logic, and seed script for instant demo data.

## Getting started

### 1. Install dependencies

```bash
npm install
```

### 2. Configure environment

Create a `.env.local` file using the template:

```bash
cp .env.example .env.local
```

Update the secrets:

- `DATABASE_URL=postgresql://markvn:<PASSWORD>@14.161.33.99:5432/main`
- `NEXTAUTH_SECRET=` generate a long random string (e.g. `openssl rand -base64 32`)
- `NEXTAUTH_URL=http://localhost:3000` for local development

> ?? Never commit real credentials. `.env.example` contains placeholders only.

### 3. Apply migrations

```bash
npm run prisma migrate dev
```

This bootstraps the database schema (enums, tables, and balances view).

### 4. Seed demo data (optional but recommended)

```bash
npm run prisma db seed
```

Seeds create:

- Owner: `owner@example.com` / `Owner123!`
- Staff: `staff@example.com` / `Staff123!`
- "Main Branch" with Cash & Bank Transfer accounts and opening balances.

### 5. Start the dev server

```bash
npm run dev
```

Visit `http://localhost:3000`. The app auto-redirects to the correct dashboard based on role.

## Testing

Run the unit suite:

```bash
npm test
```

Coverage focuses on critical guards and transaction services:

- Role/branch authorization helpers
- Staff deposit branch restrictions
- Transfer atomicity (paired entries + net-zero validation)

## Project structure

```
src/
  app/                 # Next.js app router (auth pages, dashboards, APIs)
  components/          # UI, forms, and navigation primitives
  lib/
    auth.ts            # NextAuth config + guard utilities
    services/          # Reusable domain services (metrics, transactions)
    schema.ts          # Zod DTOs & coercions
    money.ts           # BigInt helpers + VND formatting
  types/               # Type augmentations (NextAuth session)
prisma/
  schema.prisma        # Database schema (UUIDs, enums, view)
  migrations/          # SQL migration scripts
  seed.ts              # Local bootstrap data
```

## Key workflows

- **Staff deposit**: restricted to own branch server-side, ledger auto-updates balances.
- **Owner transfer**: wraps debit/credit + link in a single SQL transaction, optional cross-branch flag.
- **Reporting**: `/api/metrics/summary` consolidates totals, highlights, and period slices for dashboards.

## Next steps

- Connect to the production Postgres instance with a dedicated password.
- Configure HTTPS + production `NEXTAUTH_URL` before deploying.
- Extend tests with end-to-end coverage once a staging environment is available.

Enjoy managing cash flows with confidence!

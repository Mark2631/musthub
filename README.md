# MUST Hub

Production-ready Vite + React + TypeScript + Supabase community marketplace for MUST students.

## Tech Stack

- React 18 + TypeScript + Vite
- Supabase Auth, Database, Storage, RLS
- Tailwind CSS + shadcn/ui components
- React Router + React Query

## Authentication

- Email/password only (no OAuth)
- Restricted to `@students.must.ac.ke` emails
- Email confirmation enabled
- Password reset flow via `/auth/forgot-password` and `/auth/callback`
- Protected routes preserve intended destination for QR/deep links

## Environment Variables

Use only:

- `VITE_SUPABASE_URL`
- `VITE_SUPABASE_ANON_KEY`

## Local Development

```bash
npm install
npm run dev
```

## Build

```bash
npm run build
```

Build output is generated in `dist/`.

## Vercel

- Keep SPA rewrite in `vercel.json`:
  - `/(.*) -> /index.html`
- Set Project Environment Variables:
  - `VITE_SUPABASE_URL`
  - `VITE_SUPABASE_ANON_KEY`

## Supabase Project Settings

- Site URL: `https://musthub-68rp.vercel.app`
- Auth providers: Email enabled, Confirm email enabled
- Run migrations in `supabase/migrations` to apply schema and RLS updates

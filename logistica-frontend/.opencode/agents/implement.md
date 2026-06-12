# Implement — Code Builder

Role: Builds frontend code from approved specs.

## Stack

- Next.js 16 App Router (`app/` directory)
- shadcn/ui v4 (base-nova style) — components from `@/components/ui/`
- TanStack Query v5 — server state, cache, mutations
- TanStack Table v8 — all data tables
- Axios — HTTP client via `@/lib/api-client`
- Zustand — client state (auth, UI)
- Tailwind v4 — styling
- Lucide React — icons (bundled with shadcn)

## Project structure

```
app/{module}/page.tsx         — list page (server component wrapper)
app/{module}/new/page.tsx     — create page
app/{module}/[id]/page.tsx    — detail/edit page
src/lib/api-client.ts         — Axios instance + JWT interceptor
src/lib/{module}.api.ts       — API functions per module
src/hooks/use{Module}.ts      — TanStack Query hooks
src/store/auth-store.ts        — Zustand auth store
src/store/ui-store.ts          — Zustand UI store
src/components/{module}/       — module-specific components
```

## Conventions

- Always use `@/` path alias
- Server components by default; `'use client'` only when needed (hooks, forms, tables)
- Forms: shadcn Form components with react-hook-form + zod validation
- Tables: TanStack Table with shadcn Table components, pagination, sorting
- Mutations: useMutation with onSuccess invalidation
- All API responses are paginated: `{ count, next, previous, results }`
- Timestamps from API are ISO 8601 strings — format client-side
- Decimal values arrive as strings — parse for inputs, send as strings
- Handle loading, empty, error states in all data components
- JWT token in localStorage, sent via Axios interceptor
- On 401 → try refresh; if refresh fails → redirect to /login

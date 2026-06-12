# AGENTS.md

Monorepo with 4 independent sub-projects (no shared workspace):

| Dir | Stack | State |
|-----|-------|-------|
| `task-manager-backend/` | Node.js ESM + Express 4 + Prisma 7 → Neon (cloud PG) | Active |
| `task-manager-frontend/` | React 19 + Vite 8 + Tailwind 4 + React Router 7 | Active |
| `logistica-api/` | Django 6.0.5 + DRF 3.17 + SimpleJWT + PostgreSQL/SQLite | Active |
| `logistica-frontend/` | Next.js 16 App Router + shadcn + TanStack Query/Table + Axios + Zustand | Active |

- No root `package.json`, no workspaces — `cd` into each project to work
- Each frontend runs on its own port (task-manager:5173, logistica:3000)

## Per-project instructions

**Read these files first — they contain project-specific commands, architecture, and known gaps:**

- `CLAUDE.md` — extensive detail for task-manager-backend + task-manager-frontend
- `logistica-api/CLAUDE.md` — detailed instructions for the Django project
- `logistica-api/spec/*.md` — module specs (Spec-Driven Development workflow)
- `logistica-frontend/CLAUDE.md` — full frontend project guide (SDD agents, stack, conventions, commands)
- `logistica-frontend/docs/backend-api-reference.md` — full REST API reference for `logistica-api` (auth, 8 modules, entities, conventions)
- `logistica-frontend/docs/backend-structure.md` — project map, phase order, module patterns
- `logistica-frontend/docs/mvp.md` — module status tracker

## What the existing instruction files don't cover

### `logistica-frontend/` — Next.js 16 + shadcn + TanStack

- Entrypoint: `app/layout.tsx`, routes via App Router (`app/` directory)
- Has `@/*` path alias → maps to project root
- Tailwind v4 via PostCSS plugin (`@tailwindcss/postcss`), shadcn v4 (base-nova)
- Commands: `npm run dev` (port 3000), `npm run build`, `npm run lint`
- No test runner yet
- Uses SDD methodology: `.opencode/agents/` (Orchestrator → Spec → Implement → Validator)
- Agent flow: Spec → human approval → Implement → Validator; one module at a time

### Django subtlety

- Always run `.venv\Scripts\activate` before any Python command in `logistica-api/`
- DB auto-selects PostgreSQL if `DB_NAME` env var is set, else SQLite (via `python-decouple`)

### Task Manager backend

- Prisma schema to Prisma Client flow uses `prisma.config.ts` (Prisma 7 config file format), not the traditional `prisma generate` — see `prisma.config.ts` for datasource
- Backend has no hot reload (`npm run dev` = `node src/index.js`)
- `"type": "module"` — ESM imports (`import`/`export`, no `require`)

### `logistica-api` backend modules

8 apps under `apps/`, all follow same pattern: `models.py` → `serializers.py` → `views.py` (ModelViewSet) → `urls.py` (DefaultRouter).

| Phase | Apps | Routes |
|-------|------|--------|
| P0 | customers, suppliers, warehouses | `api/v1/{customers,suppliers,warehouses}/` |
| P1 | products, drivers | `api/v1/{products,drivers}/` |
| P2 | transport (vehicles), routes (+ route-stops) | `api/v1/{vehicles,routes,route-stops}/` |
| P3 | shipments (+ shipment-items) | `api/v1/{shipments,shipment-items}/` + `{id}/transition/` |

- All endpoints require JWT Bearer token (SimpleJWT). Token at `api/auth/token/`, refresh at `api/auth/token/refresh/`.
- All use soft-delete (is_active=false) except Shipment and RouteStop.
- Pagination: 20 items/page via PageNumberPagination.
- Only Shipment has custom business logic (state machine, cost calc in services.py).

### No shared tooling

Each project has independent lint/build/test — no repo-wide orchestration. No CI workflows found.

## General conventions

- Code identifiers in English; docs/comments can be in Spanish
- When creating features that touch both frontend and backend → start with schema/data model, then API, then UI

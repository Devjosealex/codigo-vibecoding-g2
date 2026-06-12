# MVP — Logistica Frontend

> Frontend para `logistica-api`. Stack: Next.js 16 + shadcn + TanStack Query + TanStack Table + Axios + Zustand.

## Orden de módulos

| # | Módulo | Fase | Dependencias | Estado |
|---|--------|------|-------------|--------|
| 1 | Auth | Base | — | ✅ Completado |
| 2 | Customers | P0 | Auth | Pendiente |
| 3 | Suppliers | P0 | Auth | Pendiente |
| 4 | Warehouses | P0 | Auth | Pendiente |
| 5 | Products | P1 | Auth, Suppliers, Warehouses | Pendiente |
| 6 | Drivers | P1 | Auth | Pendiente |
| 7 | Vehicles | P2 | Auth, Drivers | Pendiente |
| 8 | Routes + Stops | P2 | Auth, Warehouses | Pendiente |
| 9 | Shipments + Items | P3 | Auth, todo lo anterior | Pendiente |

## Estructura base (pre-módulos)

- [x] Stack instalado (TanStack Query, Table, Axios, Zustand, shadcn)
- [x] Axios client con JWT interceptor
- [x] Zustand stores (auth, ui)
- [x] QueryClientProvider en layout
- [x] Agentes SDD configurados
- [x] Login page + auth flow completo
- [x] Layout protegido con sidebar/nav

## Convenciones

- Cada módulo sigue SDD: **Spec → [aprobación] → Implement → Validator**
- Los specs viven en `docs/specs/{module}.md`
- Un módulo a la vez, en el orden de la tabla
- Mark completado con ✅ cuando Validator confirma OK

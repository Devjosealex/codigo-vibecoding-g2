# CLAUDE.md — logistica-frontend

Frontend para `logistica-api`. Stack: Next.js 16 App Router + shadcn v4 (base-nova) + TanStack Query v5 + TanStack Table v8 + Axios + Zustand.

## SDD Flow — siempre leer antes de empezar

Este proyecto usa Spec-Driven Development con 4 agentes en `.opencode/agents/`:

1. **Orchestrator** — coordina; nunca escribe código
2. **Spec** — analiza módulo backend, crea `docs/specs/{module}.md`
3. **Implement** — implementa código del spec aprobado
4. **Validator** — verifica código contra el spec

**Flujo obligatorio por módulo:**
```
Spec → [APROBACIÓN HUMANA] → Implement → Validator
  ↑                |                        |
  └── mejoras ─────┘     errores ───────────┘
```

**Un módulo a la vez**, en orden: Auth → Customers → Suppliers → Warehouses → Products → Drivers → Vehicles → Routes → Shipments.

## Documentación de referencia

- `docs/backend-api-reference.md` — endpoints, schemas, JWT
- `docs/backend-structure.md` — proyecto Django, fases, patrones
- `docs/mvp.md` — estado de módulos completados

## Comandos

```bash
npm run dev       # Next.js dev server (puerto 3000)
npm run build     # next build
npm run lint      # ESLint
```

## Convenciones de código

- `@/` alias → raíz del proyecto
- Server components por defecto; `"use client"` solo con hooks/interactividad
- Forms: shadcn Form + react-hook-form + zod
- Tablas: TanStack Table + shadcn Table, con paginación server-side
- Mutaciones: TanStack Query con invalidación en `onSuccess`
- Timestamps ISO 8601 → formatear cliente
- Decimales llegan como string de la API
- JWT en localStorage, interceptor Axios maneja refresh automático
- 401 → refresh; si falla → redirect a `/login`

## Stack técnico

| Librería | Uso |
|----------|-----|
| shadcn/ui (base-nova) | Componentes base (botones, inputs, diálogos) |
| TanStack Query | Server state, cache, mutaciones |
| TanStack Table | Tablas con sort, paginación, filtros |
| Axios | HTTP + JWT interceptor |
| Zustand | Client state (auth, UI) |
| Tailwind v4 | Estilos |
| Lucide React | Iconos |

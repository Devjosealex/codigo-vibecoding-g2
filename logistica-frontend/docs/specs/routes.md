# Spec: Routes

> Module P2 — Rutas + RouteStops. CRUD completo (sin soft-delete). FK a Warehouse, stops anidados.

## Endpoints to consume

### Routes
| Method | Path | Description |
|--------|------|-------------|
| GET | `/api/v1/routes/` | List (paginated, 20/page), search |
| POST | `/api/v1/routes/` | Create |
| GET | `/api/v1/routes/{id}/` | Detail (incluye stops array) |
| PUT | `/api/v1/routes/{id}/` | Full update |
| PATCH | `/api/v1/routes/{id}/` | Partial update |
| DELETE | `/api/v1/routes/{id}/` | Delete (NOT soft-delete) |

### RouteStops (gestionados por separado)
| Method | Path | Description |
|--------|------|-------------|
| GET | `/api/v1/route-stops/` | List all stops |
| POST | `/api/v1/route-stops/` | Create stop |
| GET | `/api/v1/route-stops/{id}/` | Detail |
| PUT | `/api/v1/route-stops/{id}/` | Full update |
| DELETE | `/api/v1/route-stops/{id}/` | Delete |

Also need warehouses for FK select:
| GET | `/api/v1/warehouses/` | List for select |

## Frontend pages/routes needed (inside `(protected)`)

| Route | Component | Description |
|-------|-----------|-------------|
| `/routes` | RoutesPage | List with TanStack Table, search |
| `/routes/new` | RouteNewPage | Create form |
| `/routes/{id}` | RouteEditPage | Edit form + stops management |

## Components needed

- `components/routes/routes-table.tsx` — TanStack Table with columns: name, origin warehouse, distance, actions
- `components/routes/route-form.tsx` — Create/Edit form with origin_warehouse select
- `components/routes/route-stops.tsx` — Sub-component to list/add/remove stops on edit page

## Data layer

### TypeScript interfaces
```typescript
interface RouteStop {
  id: number
  route: number
  stop_order: number
  address: string
  city: string
  latitude: number | null
  longitude: number | null
}

interface Route {
  id: number
  name: string
  origin_warehouse: number | null
  distance_km: string | null
  estimated_duration_h: string | null
  is_active: boolean
  created_at: string
  updated_at: string
  stops: RouteStop[]
}

interface RouteFormData {
  name: string
  origin_warehouse?: number | null
  distance_km?: string
  estimated_duration_h?: string
}

interface RouteStopFormData {
  route: number
  stop_order: number
  address: string
  city: string
  latitude?: string | null
  longitude?: string | null
}
```

### API functions (`lib/routes.api.ts`)
- `getRoutes(params)` → paginated list
- `getRoute(id)` → single (incluye stops)
- `createRoute(data)` → POST
- `updateRoute(id, data)` → PUT
- `deleteRoute(id)` → DELETE
- `createRouteStop(data)` → POST
- `deleteRouteStop(id)` → DELETE
- `getRouteWarehouses()` → list of warehouses for select

### TanStack Query hooks (`hooks/use-routes.ts`)
- `useRoutes(params)` → useQuery with pagination + search
- `useRoute(id)` → useQuery for single (con stops)
- `useCreateRoute()` → useMutation, invalidates `["routes"]`
- `useUpdateRoute()` → useMutation, invalidates `["routes"]`
- `useDeleteRoute()` → useMutation, invalidates `["routes"]`
- `useCreateRouteStop()` → useMutation, invalidates route detail
- `useDeleteRouteStop()` → useMutation, invalidates route detail
- `useRouteWarehouses()` → useQuery for warehouse list (select)

## Validation rules (form)

| Field | Rules |
|-------|-------|
| name | required, max 200 |
| origin_warehouse | optional, integer FK |
| distance_km | optional, decimal string |
| estimated_duration_h | optional, decimal string |

## Acceptance criteria

- [ ] List page with TanStack Table, pagination, search
- [ ] Create page with form — warehouse select
- [ ] Edit page pre-filled with route data
- [ ] Edit page shows stops list + add/remove inline
- [ ] Delete with confirmation dialog (NOT soft-delete)
- [ ] Toast notifications on success/error (sonner)
- [ ] Loading and empty states handled
- [ ] Backend validation errors shown in form
- [ ] Build passes without TS errors

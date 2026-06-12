# Spec: Warehouses

> Module P0 — Almacenes. CRUD completo con soft-delete.

## Endpoints to consume

| Method | Path | Description |
|--------|------|-------------|
| GET | `/api/v1/warehouses/` | List (paginated, 20/page), search, filter |
| POST | `/api/v1/warehouses/` | Create |
| GET | `/api/v1/warehouses/{id}/` | Detail |
| PUT | `/api/v1/warehouses/{id}/` | Full update |
| PATCH | `/api/v1/warehouses/{id}/` | Partial update |
| DELETE | `/api/v1/warehouses/{id}/` | Soft-delete (is_active=false) |

## Frontend pages/routes needed (inside `(protected)`)

| Route | Component | Description |
|-------|-----------|-------------|
| `/warehouses` | WarehousesPage | List with TanStack Table, search, filters |
| `/warehouses/new` | WarehouseNewPage | Create form |
| `/warehouses/{id}` | WarehouseEditPage | Edit form |

## Components needed

- `components/warehouses/warehouses-table.tsx` — TanStack Table with columns: name, city, country, capacity, actions
- `components/warehouses/warehouse-form.tsx` — Create/Edit form (shared)

## Data layer

### TypeScript interface
```typescript
interface Warehouse {
  id: number
  name: string
  address: string | null
  city: string | null
  country: string
  latitude: number | null
  longitude: number | null
  capacity_m3: string | null
  is_active: boolean
  created_at: string
  updated_at: string
}

interface WarehouseFormData {
  name: string
  address?: string
  city?: string
  country?: string
  latitude?: number | null
  longitude?: number | null
  capacity_m3?: string
}
```

### API functions (`lib/warehouses.api.ts`)
- `getWarehouses(params)` → paginated list
- `getWarehouse(id)` → single
- `createWarehouse(data)` → POST
- `updateWarehouse(id, data)` → PUT
- `deleteWarehouse(id)` → DELETE (soft-delete)

### TanStack Query hooks (`hooks/use-warehouses.ts`)
- `useWarehouses(params)` → useQuery with pagination + filters
- `useWarehouse(id)` → useQuery for single item
- `useCreateWarehouse()` → useMutation, invalidates `["warehouses"]`
- `useUpdateWarehouse()` → useMutation, invalidates `["warehouses"]`
- `useDeleteWarehouse()` → useMutation, invalidates `["warehouses"]`

## Validation rules (form)

| Field | Rules |
|-------|-------|
| name | required, max 200 |
| address | optional |
| city | optional, max 100 |
| country | optional, default "Peru" |
| latitude | optional, number |
| longitude | optional, number |
| capacity_m3 | optional, number string (decimal) |

## Acceptance criteria

- [ ] List page with TanStack Table, pagination, search
- [ ] Create page with form, validates on submit
- [ ] Edit page pre-filled with warehouse data
- [ ] Soft-delete with confirmation dialog
- [ ] Toast notifications on success/error (sonner)
- [ ] Loading and empty states handled
- [ ] Backend validation errors shown in form
- [ ] Build passes without TS errors

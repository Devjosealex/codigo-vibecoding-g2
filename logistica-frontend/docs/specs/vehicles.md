# Spec: Vehicles

> Module P2 — Transporte (Vehículos). CRUD completo con soft-delete y FK a Driver.

## Endpoints to consume

| Method | Path | Description |
|--------|------|-------------|
| GET | `/api/v1/vehicles/` | List (paginated, 20/page), search, filter |
| POST | `/api/v1/vehicles/` | Create |
| GET | `/api/v1/vehicles/{id}/` | Detail |
| PUT | `/api/v1/vehicles/{id}/` | Full update |
| PATCH | `/api/v1/vehicles/{id}/` | Partial update |
| DELETE | `/api/v1/vehicles/{id}/` | Soft-delete (is_active=false) |

Also need drivers for FK select:
| GET | `/api/v1/drivers/` | List (no pagination needed for select) |

## Frontend pages/routes needed (inside `(protected)`)

| Route | Component | Description |
|-------|-----------|-------------|
| `/vehicles` | VehiclesPage | List with TanStack Table, search, filters |
| `/vehicles/new` | VehicleNewPage | Create form |
| `/vehicles/{id}` | VehicleEditPage | Edit form |

## Components needed

- `components/vehicles/vehicles-table.tsx` — TanStack Table with columns: name, plate, type, driver, capacity, actions
- `components/vehicles/vehicle-form.tsx` — Create/Edit form (shared) with FK select + type enum

## Data layer

### TypeScript interface
```typescript
interface Vehicle {
  id: number
  driver: number | null
  name: string
  plate_number: string
  vehicle_type: "truck" | "van" | "motorcycle" | "other"
  capacity_kg: string | null
  capacity_m3: string | null
  is_active: boolean
  created_at: string
  updated_at: string
}

interface VehicleFormData {
  driver?: number | null
  name: string
  plate_number: string
  vehicle_type: "truck" | "van" | "motorcycle" | "other"
  capacity_kg?: string
  capacity_m3?: string
}
```

### API functions (`lib/vehicles.api.ts`)
- `getVehicles(params)` → paginated list
- `getVehicle(id)` → single
- `createVehicle(data)` → POST
- `updateVehicle(id, data)` → PUT
- `deleteVehicle(id)` → DELETE (soft-delete)
- `getVehicleDrivers()` → list of drivers for select

### TanStack Query hooks (`hooks/use-vehicles.ts`)
- `useVehicles(params)` → useQuery with pagination + filters
- `useVehicle(id)` → useQuery for single item
- `useCreateVehicle()` → useMutation, invalidates `["vehicles"]`
- `useUpdateVehicle()` → useMutation, invalidates `["vehicles"]`
- `useDeleteVehicle()` → useMutation, invalidates `["vehicles"]`
- `useVehicleDrivers()` → useQuery for driver list (select)

## Validation rules (form)

| Field | Rules |
|-------|-------|
| name | required, max 200 |
| plate_number | required, max 20 |
| vehicle_type | required, one of: truck, van, motorcycle, other |
| driver | optional, integer FK |
| capacity_kg | optional, decimal string |
| capacity_m3 | optional, decimal string |

## Acceptance criteria

- [ ] List page with TanStack Table, pagination, search, vehicle_type filter
- [ ] Create page with form — driver select + type enum
- [ ] Edit page pre-filled with vehicle data
- [ ] Soft-delete with confirmation dialog
- [ ] Toast notifications on success/error (sonner)
- [ ] Loading and empty states handled
- [ ] Backend validation errors shown in form
- [ ] Build passes without TS errors

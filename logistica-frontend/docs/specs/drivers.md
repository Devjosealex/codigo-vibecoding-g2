# Spec: Drivers

> Module P1 — Conductores. CRUD completo con soft-delete.

## Endpoints to consume

| Method | Path | Description |
|--------|------|-------------|
| GET | `/api/v1/drivers/` | List (paginated, 20/page), search |
| POST | `/api/v1/drivers/` | Create |
| GET | `/api/v1/drivers/{id}/` | Detail |
| PUT | `/api/v1/drivers/{id}/` | Full update |
| PATCH | `/api/v1/drivers/{id}/` | Partial update |
| DELETE | `/api/v1/drivers/{id}/` | Soft-delete (is_active=false) |

## Frontend pages/routes needed (inside `(protected)`)

| Route | Component | Description |
|-------|-----------|-------------|
| `/drivers` | DriversPage | List with TanStack Table, search |
| `/drivers/new` | DriverNewPage | Create form |
| `/drivers/{id}` | DriverEditPage | Edit form |

## Components needed

- `components/drivers/drivers-table.tsx` — TanStack Table with columns: full name, document, license, phone, email, actions
- `components/drivers/driver-form.tsx` — Create/Edit form (shared)

## Data layer

### TypeScript interface
```typescript
interface Driver {
  id: number
  first_name: string
  last_name: string
  document_number: string | null
  license_number: string | null
  license_expiry: string | null
  phone: string | null
  email: string
  is_active: boolean
  created_at: string
  updated_at: string
}

interface DriverFormData {
  first_name: string
  last_name: string
  document_number?: string
  license_number?: string
  license_expiry?: string
  phone?: string
  email: string
}
```

### API functions (`lib/drivers.api.ts`)
- `getDrivers(params)` → paginated list
- `getDriver(id)` → single
- `createDriver(data)` → POST
- `updateDriver(id, data)` → PUT
- `deleteDriver(id)` → DELETE (soft-delete)

### TanStack Query hooks (`hooks/use-drivers.ts`)
- `useDrivers(params)` → useQuery with pagination + search
- `useDriver(id)` → useQuery for single item
- `useCreateDriver()` → useMutation, invalidates `["drivers"]`
- `useUpdateDriver()` → useMutation, invalidates `["drivers"]`
- `useDeleteDriver()` → useMutation, invalidates `["drivers"]`

## Validation rules (form)

| Field | Rules |
|-------|-------|
| first_name | required, max 100 |
| last_name | required, max 100 |
| email | required, valid email |
| document_number | optional, max 20, unique (backend) |
| license_number | optional, max 50, unique (backend) |
| license_expiry | optional, date string (ISO) |
| phone | optional, max 20 |

## Acceptance criteria

- [ ] List page with TanStack Table, pagination, search
- [ ] Create page with form, validates on submit
- [ ] Edit page pre-filled with driver data
- [ ] Soft-delete with confirmation dialog
- [ ] Toast notifications on success/error (sonner)
- [ ] Loading and empty states handled
- [ ] Backend validation errors shown in form
- [ ] Build passes without TS errors

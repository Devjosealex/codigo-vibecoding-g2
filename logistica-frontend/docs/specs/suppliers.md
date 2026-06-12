# Spec: Suppliers

> Module P0 — Proveedores. CRUD completo con soft-delete.

## Endpoints to consume

| Method | Path | Description |
|--------|------|-------------|
| GET | `/api/v1/suppliers/` | List (paginated, 20/page), search, filter |
| POST | `/api/v1/suppliers/` | Create |
| GET | `/api/v1/suppliers/{id}/` | Detail |
| PUT | `/api/v1/suppliers/{id}/` | Full update |
| PATCH | `/api/v1/suppliers/{id}/` | Partial update |
| DELETE | `/api/v1/suppliers/{id}/` | Soft-delete (is_active=false) |

## Frontend pages/routes needed (inside `(protected)`)

| Route | Component | Description |
|-------|-----------|-------------|
| `/suppliers` | SuppliersPage | List with TanStack Table, search, filters |
| `/suppliers/new` | SupplierNewPage | Create form |
| `/suppliers/{id}` | SupplierEditPage | Edit form |

## Components needed

- `components/suppliers/suppliers-table.tsx` — TanStack Table with columns: name, contact_name, tax_id, email, city, actions
- `components/suppliers/supplier-form.tsx` — Create/Edit form (shared)
- `components/suppliers/supplier-filters.tsx` — Filter bar (city)

## Data layer

### TypeScript interface
```typescript
interface Supplier {
  id: number
  name: string
  contact_name: string | null
  tax_id: string | null
  email: string
  phone: string | null
  address: string | null
  city: string | null
  country: string
  is_active: boolean
  created_at: string
  updated_at: string
}

interface SupplierFormData {
  name: string
  contact_name?: string
  tax_id?: string
  email: string
  phone?: string
  address?: string
  city?: string
  country?: string
}
```

### API functions (`lib/suppliers.api.ts`)
- `getSuppliers(params)` → paginated list
- `getSupplier(id)` → single
- `createSupplier(data)` → POST
- `updateSupplier(id, data)` → PUT
- `deleteSupplier(id)` → DELETE (soft-delete)

### TanStack Query hooks (`hooks/use-suppliers.ts`)
- `useSuppliers(params)` → useQuery with pagination + filters
- `useSupplier(id)` → useQuery for single item
- `useCreateSupplier()` → useMutation, invalidates `["suppliers"]`
- `useUpdateSupplier()` → useMutation, invalidates `["suppliers"]`
- `useDeleteSupplier()` → useMutation, invalidates `["suppliers"]`

## Validation rules (form)

| Field | Rules |
|-------|-------|
| name | required, max 200 |
| contact_name | optional, max 100 |
| tax_id | optional, max 20 |
| email | required, valid email format |
| phone | optional, max 20 |
| address | optional |
| city | optional, max 100 |
| country | optional, default "Peru" |

## Acceptance criteria

- [ ] List page with TanStack Table, pagination, search, filters
- [ ] Create page with form, validates on submit
- [ ] Edit page pre-filled with supplier data
- [ ] Soft-delete with confirmation dialog
- [ ] Toast notifications on success/error (sonner)
- [ ] Loading and empty states handled
- [ ] Backend validation errors shown in form
- [ ] Build passes without TS errors

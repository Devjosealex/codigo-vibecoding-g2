# Spec: Customers

> Module P0 — Clientes. CRUD completo con soft-delete.

## Endpoints to consume

| Method | Path | Description |
|--------|------|-------------|
| GET | `/api/v1/customers/` | List (paginated, 20/page), search, filter |
| POST | `/api/v1/customers/` | Create |
| GET | `/api/v1/customers/{id}/` | Detail |
| PUT | `/api/v1/customers/{id}/` | Full update |
| PATCH | `/api/v1/customers/{id}/` | Partial update |
| DELETE | `/api/v1/customers/{id}/` | Soft-delete (is_active=false) |

## Frontend pages/routes needed (inside `(protected)`)

| Route | Component | Description |
|-------|-----------|-------------|
| `/customers` | CustomersPage | List with TanStack Table, search, filters |
| `/customers/new` | CustomerNewPage | Create form |
| `/customers/{id}` | CustomerEditPage | Edit form |

## Components needed

- `components/customers/customers-table.tsx` — TanStack Table with columns: name, type, tax_id, email, city, actions
- `components/customers/customer-form.tsx` — Create/Edit form (shared)
- `components/customers/customer-filters.tsx` — Filter bar (customer_type, city)

## Data layer

### TypeScript interface
```typescript
interface Customer {
  id: number
  user: number | null
  name: string
  customer_type: "company" | "individual"
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

interface CustomerFormData {
  name: string
  customer_type: "company" | "individual"
  tax_id?: string
  email: string
  phone?: string
  address?: string
  city?: string
  country?: string
}
```

### API functions (`lib/customers.api.ts`)
- `getCustomers(params)` → paginated list
- `getCustomer(id)` → single
- `createCustomer(data)` → POST
- `updateCustomer(id, data)` → PUT
- `deleteCustomer(id)` → DELETE (soft-delete)

### TanStack Query hooks (`hooks/use-customers.ts`)
- `useCustomers(params)` → useQuery with pagination + filters
- `useCustomer(id)` → useQuery for single item
- `useCreateCustomer()` → useMutation, invalidates `["customers"]`
- `useUpdateCustomer()` → useMutation, invalidates `["customers"]`
- `useDeleteCustomer()` → useMutation, invalidates `["customers"]`

## Validation rules (form)

| Field | Rules |
|-------|-------|
| name | required, max 200 |
| customer_type | required, one of: company, individual |
| tax_id | optional, max 20, unique (backend validates) |
| email | required, valid email format |
| phone | optional, max 20 |
| address | optional |
| city | optional, max 100 |
| country | optional, default "Peru" |

## Acceptance criteria

- [ ] List page with TanStack Table, pagination, search, filters
- [ ] Create page with form, validates on submit
- [ ] Edit page pre-filled with customer data
- [ ] Soft-delete with confirmation dialog
- [ ] Toast notifications on success/error (sonner)
- [ ] Loading and empty states handled
- [ ] Backend validation errors shown in form
- [ ] Build passes without TS errors

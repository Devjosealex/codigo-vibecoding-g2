# Spec: Products

> Module P1 — Productos. CRUD completo con soft-delete y FK a Supplier/Warehouse.

## Endpoints to consume

| Method | Path | Description |
|--------|------|-------------|
| GET | `/api/v1/products/` | List (paginated, 20/page), search, filter |
| POST | `/api/v1/products/` | Create |
| GET | `/api/v1/products/{id}/` | Detail |
| PUT | `/api/v1/products/{id}/` | Full update |
| PATCH | `/api/v1/products/{id}/` | Partial update |
| DELETE | `/api/v1/products/{id}/` | Soft-delete (is_active=false) |

Also need supplier/warehouse lists for FK selects:
| GET | `/api/v1/suppliers/` | List (no pagination needed for select) |
| GET | `/api/v1/warehouses/` | List (no pagination needed for select) |

## Frontend pages/routes needed (inside `(protected)`)

| Route | Component | Description |
|-------|-----------|-------------|
| `/products` | ProductsPage | List with TanStack Table, search, filters |
| `/products/new` | ProductNewPage | Create form |
| `/products/{id}` | ProductEditPage | Edit form |

## Components needed

- `components/products/products-table.tsx` — TanStack Table with columns: name, sku, supplier, warehouse, unit_price, stock, actions
- `components/products/product-form.tsx` — Create/Edit form (shared) with FK selects

## Data layer

### TypeScript interface
```typescript
interface Product {
  id: number
  supplier: number | null
  warehouse: number | null
  name: string
  description: string | null
  sku: string
  weight_kg: string | null
  length_cm: string | null
  width_cm: string | null
  height_cm: string | null
  unit_price: string
  stock_quantity: number
  is_active: boolean
  created_at: string
  updated_at: string
}

interface ProductFormData {
  supplier?: number | null
  warehouse?: number | null
  name: string
  description?: string
  sku: string
  weight_kg?: string
  length_cm?: string
  width_cm?: string
  height_cm?: string
  unit_price: string
  stock_quantity: number
}
```

### API functions (`lib/products.api.ts`)
- `getProducts(params)` → paginated list
- `getProduct(id)` → single
- `createProduct(data)` → POST
- `updateProduct(id, data)` → PUT
- `deleteProduct(id)` → DELETE (soft-delete)
- `getProductSuppliers()` → list of suppliers for select
- `getProductWarehouses()` → list of warehouses for select

### TanStack Query hooks (`hooks/use-products.ts`)
- `useProducts(params)` → useQuery with pagination + filters
- `useProduct(id)` → useQuery for single item
- `useCreateProduct()` → useMutation, invalidates `["products"]`
- `useUpdateProduct()` → useMutation, invalidates `["products"]`
- `useDeleteProduct()` → useMutation, invalidates `["products"]`
- `useProductSuppliers()` → useQuery for supplier list (select)
- `useProductWarehouses()` → useQuery for warehouse list (select)

## Validation rules (form)

| Field | Rules |
|-------|-------|
| name | required, max 200 |
| sku | required, max 50 |
| supplier | optional, integer FK |
| warehouse | optional, integer FK |
| description | optional |
| weight_kg | optional, decimal string |
| length_cm | optional, decimal string |
| width_cm | optional, decimal string |
| height_cm | optional, decimal string |
| unit_price | required, decimal string |
| stock_quantity | required, integer (default 0) |

## Acceptance criteria

- [ ] List page with TanStack Table, pagination, search, supplier/warehouse filters
- [ ] Create page with form — FK selects populate from API
- [ ] Edit page pre-filled with product data
- [ ] Soft-delete with confirmation dialog
- [ ] Toast notifications on success/error (sonner)
- [ ] Loading and empty states handled
- [ ] Backend validation errors shown in form
- [ ] Build passes without TS errors

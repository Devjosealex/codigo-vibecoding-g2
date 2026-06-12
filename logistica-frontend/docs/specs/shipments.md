# Spec: Shipments

> Module P3 — Envíos. CRUD + máquina de estados + ShipmentItems. Módulo central.

## Endpoints to consume

### Shipments
| Method | Path | Description |
|--------|------|-------------|
| GET | `/api/v1/shipments/` | List (paginated, 20/page), search, filter |
| POST | `/api/v1/shipments/` | Create |
| GET | `/api/v1/shipments/{id}/` | Detail (incluye items) |
| PUT | `/api/v1/shipments/{id}/` | Full update |
| PATCH | `/api/v1/shipments/{id}/` | Partial update |
| DELETE | `/api/v1/shipments/{id}/` | Delete |
| POST | `/api/v1/shipments/{id}/transition/` | Status transition |

### ShipmentItems
| Method | Path | Description |
|--------|------|-------------|
| GET | `/api/v1/shipment-items/` | List |
| POST | `/api/v1/shipment-items/` | Create |
| DELETE | `/api/v1/shipment-items/{id}/` | Delete |

### FK lists
| GET | `/api/v1/customers/` | Customers for select |
| GET | `/api/v1/warehouses/` | Warehouses for select |
| GET | `/api/v1/vehicles/` | Vehicles for select |
| GET | `/api/v1/routes/` | Routes for select |
| GET | `/api/v1/products/` | Products for select (items) |

## Frontend pages/routes needed (inside `(protected)`)

| Route | Component | Description |
|-------|-----------|-------------|
| `/shipments` | ShipmentsPage | List with status badge, filters, search |
| `/shipments/new` | ShipmentNewPage | Create form (many FK selects) |
| `/shipments/{id}` | ShipmentEditPage | Edit + transitions + items management |

## Components needed

- `components/shipments/shipments-table.tsx` — List with status badge, customer name, tracking, destination
- `components/shipments/shipment-form.tsx` — Create/Edit form (basic fields, FK selects)
- `components/shipments/shipment-status-badge.tsx` — Status badge with color coding
- `components/shipments/shipment-transitions.tsx` — Transition buttons (current status → next)
- `components/shipments/shipment-items.tsx` — Items sub-table + add/remove
- `components/shipments/shipment-edit-view.tsx` — Combines form + transitions + items

## Data layer

### TypeScript interfaces
```typescript
type ShipmentStatus =
  | "pending"
  | "assigned"
  | "in_transit"
  | "delivered"
  | "returned"
  | "cancelled"

interface ShipmentItem {
  id: number
  shipment: number
  product: number
  quantity: number
  unit_price_at_shipment: string
}

interface Shipment {
  id: number
  tracking_number: string
  customer: number | null
  origin_warehouse: number | null
  vehicle: number | null
  route: number | null
  destination_address: string
  destination_city: string
  destination_country: string
  status: ShipmentStatus
  scheduled_date: string | null
  delivered_at: string | null
  base_cost: string
  calculated_cost: string | null
  notes: string | null
  created_at: string
  updated_at: string
  items: ShipmentItem[]
}

interface ShipmentFormData {
  customer?: number | null
  origin_warehouse?: number | null
  vehicle?: number | null
  route?: number | null
  destination_address: string
  destination_city: string
  destination_country?: string
  scheduled_date?: string
  base_cost: string
  notes?: string
}

interface ShipmentItemFormData {
  shipment: number
  product: number
  quantity: number
}
```

### API functions (`lib/shipments.api.ts`)
- `getShipments(params)` → paginated list (also fetch FK names for display)
- `getShipment(id)` → single (incluye items)
- `createShipment(data)` → POST
- `updateShipment(id, data)` → PUT
- `deleteShipment(id)` → DELETE
- `transitionShipment(id, status)` → POST to transition/
- `createShipmentItem(data)` → POST
- `deleteShipmentItem(id)` → DELETE
- FK list fetchers for: customers, warehouses, vehicles, routes, products

### TanStack Query hooks (`hooks/use-shipments.ts`)
- `useShipments(params)` → useQuery
- `useShipment(id)` → useQuery
- `useCreateShipment()` → useMutation
- `useUpdateShipment()` → useMutation
- `useDeleteShipment()` → useMutation
- `useTransitionShipment()` → useMutation, invalidates shipment detail + list
- `useCreateShipmentItem()` → useMutation, invalidates shipment detail
- `useDeleteShipmentItem()` → useMutation, invalidates shipment detail
- FK hooks for selects: customers, warehouses, vehicles, routes, products

## Status machine

| Current | Allowed transitions |
|---------|-------------------|
| pending | assigned, cancelled |
| assigned | in_transit, cancelled |
| in_transit | delivered, returned |
| delivered | — (terminal) |
| returned | — (terminal) |
| cancelled | — (terminal) |

## Validation rules (form)

| Field | Rules |
|-------|-------|
| destination_address | required, max 255 |
| destination_city | required, max 100 |
| destination_country | optional, default "Peru" |
| base_cost | required, decimal string |
| customer | optional, integer FK |
| origin_warehouse | optional, integer FK |
| vehicle | optional, integer FK (nullable) |
| route | optional, integer FK (nullable) |
| scheduled_date | optional, date string |
| notes | optional |

## Acceptance criteria

- [ ] List page with status badge (color-coded), search, filter by status/customer/warehouse
- [ ] Create page with form — all FK selects from API
- [ ] Edit page pre-filled with shipment data
- [ ] Edit page shows status transition buttons (valid transitions only)
- [ ] Edit page shows items sub-table + add/remove
- [ ] Delete with confirmation dialog
- [ ] Toast notifications on success/error (sonner)
- [ ] Loading and empty states handled
- [ ] Backend validation errors shown in form
- [ ] Build passes without TS errors

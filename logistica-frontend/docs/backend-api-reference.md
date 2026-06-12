# Backend API Reference — logistica-api

> Contexto completo para construir el frontend `logistica-frontend/`.
> Backend: Django 6.0.5 + DRF 3.17 + SimpleJWT. Base URL: `http://localhost:8000`

---

## Autenticación (JWT)

Todos los endpoints bajo `api/v1/` requieren `Authorization: Bearer <access_token>`.

| Método | Ruta | Body | Respuesta |
|--------|------|------|-----------|
| POST | `/api/auth/token/` | `{ username, password }` | `{ access, refresh }` |
| POST | `/api/auth/token/refresh/` | `{ refresh }` | `{ access }` |

- El token `access` expira en **1 hora**.
- El token `refresh` expira en **7 días**, con rotación (`REFRESH_TOKENS=True`).
- Usar el refresh endpoint para obtener un nuevo access sin pedir credenciales otra vez.
- **403 desde frontend → refreshear token; si refresh falla → redirigir a login.**

---

## API Docs (Swagger)

| Método | Ruta | Uso |
|--------|------|-----|
| GET | `/api/schema/` | OpenAPI schema (JSON) |
| GET | `/api/docs/` | Swagger UI interactiva |

---

## Endpoints CRUD (ModelViewSet)

Patrón común para todos los módulos:

- `GET /api/v1/{recurso}/` — Listar (paginado, 20 por página)
- `POST /api/v1/{recurso}/` — Crear
- `GET /api/v1/{recurso}/{id}/` — Detalle
- `PUT /api/v1/{recurso}/{id}/` — Actualizar completa
- `PATCH /api/v1/{recurso}/{id}/` — Actualizar parcial
- `DELETE /api/v1/{recurso}/{id}/` — Soft-delete (`is_active=false`) salvo Shipment y RouteStop

**Soft-delete**: Customers, Suppliers, Warehouses, Products, Drivers, Vehicles, Routes → DELETE marca `is_active=false`. No se borran realmente. El listado GET solo devuelve `is_active=true`.
**Hard-delete**: Shipment, ShipmentItem, RouteStop → DELETE borra el registro.

### Paginación

Respuesta paginada:
```json
{
  "count": 150,
  "next": "http://...?page=2",
  "previous": null,
  "results": [ ... ]
}
```

### Filtros comunes

| Parámetro | Descripción | Ejemplo |
|-----------|-------------|---------|
| `?search=` | Búsqueda textual en `search_fields` | `?search=laptop` |
| `?ordering=` | Orden por campo(s) | `?ordering=-created_at` |
| `?{campo}=` | Filtro exacto por `filterset_fields` | `?city=Lima` |

---

## Módulo 0 — Clientes (customers)
*Router: `api/v1/customers/`*

```json
{
  "id": 1,
  "user": null,
  "name": "Tech Corp SAC",
  "customer_type": "company",
  "tax_id": "20123456789",
  "email": "contacto@techcorp.pe",
  "phone": "+51999000111",
  "address": "Av. Principal 123",
  "city": "Lima",
  "country": "Peru",
  "is_active": true,
  "created_at": "2026-05-27T...",
  "updated_at": "2026-05-27T..."
}
```

**Campos clave**: `customer_type` ∈ {`company`, `individual`}. `tax_id` es unique.
**Filtros**: `?customer_type=`, `?city=`, `?country=`
**Search**: `name`, `email`, `tax_id`

---

## Módulo 1 — Proveedores (suppliers)
*Router: `api/v1/suppliers/`*

```json
{
  "id": 1,
  "name": "Distribuidora XYZ",
  "contact_name": "Carlos López",
  "tax_id": "20987654321",
  "email": "ventas@distxyz.pe",
  "phone": "+51999222111",
  "address": "Av. Industrial 456",
  "city": "Arequipa",
  "country": "Peru",
  "is_active": true,
  "created_at": "2026-05-27T...",
  "updated_at": "2026-05-27T..."
}
```

**Filtros**: `?city=`, `?country=`
**Search**: `name`, `contact_name`, `email`, `tax_id`

---

## Módulo 2 — Almacenes (warehouses)
*Router: `api/v1/warehouses/`*

```json
{
  "id": 1,
  "name": "Almacén Central",
  "address": "Av. Los Olivos 789",
  "city": "Lima",
  "country": "Peru",
  "latitude": -12.046374,
  "longitude": -77.042793,
  "capacity_m3": "5000.00",
  "is_active": true,
  "created_at": "2026-05-27T...",
  "updated_at": "2026-05-27T..."
}
```

**Filtros**: `?city=`, `?country=`
**Search**: `name`, `address`, `city`

---

## Módulo 3 — Productos (products)
*Router: `api/v1/products/`*

```json
{
  "id": 1,
  "supplier": 1,
  "warehouse": 1,
  "name": "Laptop Pro 15\"",
  "description": "Laptop con 16GB RAM, 512GB SSD",
  "sku": "LAP-PRO-001",
  "weight_kg": "2.500",
  "length_cm": "35.00",
  "width_cm": "25.00",
  "height_cm": "2.50",
  "unit_price": "4500.00",
  "stock_quantity": 50,
  "is_active": true,
  "created_at": "2026-05-27T...",
  "updated_at": "2026-05-27T..."
}
```

**FKs**: `supplier` → Supplier, `warehouse` → Warehouse
**Filtros**: `?supplier=`, `?warehouse=`
**Search**: `name`, `sku`, `description`

---

## Módulo 4 — Conductores (drivers)
*Router: `api/v1/drivers/`*

```json
{
  "id": 1,
  "first_name": "Juan",
  "last_name": "Pérez",
  "document_number": "DNI12345678",
  "license_number": "LIC-AB-001",
  "license_expiry": "2027-06-15",
  "phone": "+51999333444",
  "email": "juan.perez@email.com",
  "is_active": true,
  "created_at": "2026-05-27T...",
  "updated_at": "2026-05-27T..."
}
```

**Campos únicos**: `document_number`, `license_number`
**Search**: `first_name`, `last_name`, `document_number`, `license_number`

---

## Módulo 5 — Transporte (transport / vehicles)
*Router: `api/v1/vehicles/`*

```json
{
  "id": 1,
  "driver": 1,
  "name": "Camión Volvo FH16",
  "plate_number": "ABC-123",
  "vehicle_type": "truck",
  "capacity_kg": "18000.00",
  "capacity_m3": "80.00",
  "is_active": true,
  "created_at": "2026-05-27T...",
  "updated_at": "2026-05-27T..."
}
```

**FK**: `driver` → Driver (nullable)
**`vehicle_type`** ∈ {`truck`, `van`, `motorcycle`, `other`}
**Filtros**: `?vehicle_type=`, `?driver=`
**Search**: `name`, `plate_number`

---

## Módulo 6 — Rutas (routes)
*Router: `api/v1/routes/` + `api/v1/route-stops/`*

```json
{
  "id": 1,
  "name": "Ruta Lima - Arequipa",
  "origin_warehouse": 1,
  "distance_km": "1000.00",
  "estimated_duration_h": "16.00",
  "is_active": true,
  "created_at": "2026-05-27T...",
  "updated_at": "2026-05-27T...",
  "stops": [
    {
      "id": 1,
      "route": 1,
      "stop_order": 1,
      "address": "Av. Principal 789",
      "city": "Ica",
      "latitude": -14.067,
      "longitude": -75.728
    },
    {
      "id": 2,
      "route": 1,
      "stop_order": 2,
      "address": "Jr. Comercio 456",
      "city": "Arequipa",
      "latitude": -16.398,
      "longitude": -71.536
    }
  ]
}
```

**FK**: `origin_warehouse` → Warehouse
**Anidado**: `stops` es un array de RouteStop, solo lectura desde Route.
**RouteStop** se gestiona por separado en `api/v1/route-stops/`.

```json
// RouteStop individual
{
  "id": 1,
  "route": 1,
  "stop_order": 1,
  "address": "Av. Principal 789",
  "city": "Ica",
  "latitude": -14.067,
  "longitude": -75.728
}
```

---

## Módulo 7 — Envíos (shipments) — Módulo central
*Router: `api/v1/shipments/` + `api/v1/shipment-items/`*

```json
{
  "id": 1,
  "tracking_number": "LOG-2026-00001",
  "customer": 1,
  "origin_warehouse": 1,
  "vehicle": 1,
  "route": 1,
  "destination_address": "Av. Destino 321",
  "destination_city": "Cusco",
  "destination_country": "Peru",
  "status": "pending",
  "scheduled_date": "2026-06-01",
  "delivered_at": null,
  "base_cost": "500.00",
  "calculated_cost": null,
  "notes": "Mercadería frágil",
  "created_at": "2026-05-27T...",
  "updated_at": "2026-05-27T...",
  "items": [
    {
      "id": 1,
      "shipment": 1,
      "product": 1,
      "quantity": 10,
      "unit_price_at_shipment": "4500.00"
    }
  ]
}
```

**Estados** (`status`): `pending → assigned → in_transit → delivered → returned` (cancelled desde pending/assigned)

**Acción especial**: `POST /api/v1/shipments/{id}/transition/`
```json
// Request body
{ "status": "assigned" }
```
Transiciones válidas desde frontend (el backend valida la máquina de estados).

**tracking_number** se genera automáticamente al crear. No se envía.
**calculated_cost** se calcula en el backend (peso×S/5 + distancia×S/0.50). No se envía.

**ShipmentItem** se gestiona por separado en `api/v1/shipment-items/`:
```json
{
  "id": 1,
  "shipment": 1,
  "product": 1,
  "quantity": 10,
  "unit_price_at_shipment": "4500.00"
}
```

**FKs**: `customer` → Customer, `origin_warehouse` → Warehouse, `vehicle` → Vehicle (nullable), `route` → Route (nullable)
**Filtros**: `?status=`, `?customer=`, `?origin_warehouse=`, `?vehicle=`, `?route=`
**Search**: `tracking_number`, `destination_city`, `destination_address`

---

## Mapa de Relaciones (FKs)

```
           ┌──────────┐
           │ Customer │──────┐
           └──────────┘      │
                             ├─── Shipment
           ┌──────────┐      │    │
           │ Supplier │──┐   │    ├── ShipmentItem
           └──────────┘  │   │    │       │
                         ├── Product   │   │
           ┌──────────┐  │         │   │   │
           │ Warehouse │──┘         │   │   │
           └──────────┘──┬──────────┘   │   │
                         │              │   │
                         ├── Route      │   │
                         │    │         │   │
                         │    └── RouteStop  │
                         │                  │
           ┌──────────┐  │                  │
           │  Driver   │──┐                 │
           └──────────┘  │                 │
                         ├── Vehicle ──────┘
                         │
                         └── Shipment
```

---

## Convenciones para el Frontend

1. **Timestamps**: ISO 8601. Responsabilidad del frontend formatear.
2. **Decimales**: Llegan como string `"4500.00"` desde DRF. Parsear a número para inputs.
3. **Nullables**: Los campos `null, blank=True` pueden venir como `null`. Manejar en UI.
4. **Soft-delete**: No mostrar recursos con `is_active=false`. El frontend no debe exponer reactivación a menos que se diseñe explícitamente.
5. **Paginación**: Implementar carga infinita o paginado tradicional. `PAGE_SIZE=20`.
6. **JWT Flujo**:
   - Login → guardar `access` y `refresh` (localStorage/httpOnly cookie).
   - Cada request: header `Authorization: Bearer <access>`.
   - Si 401/403 → intentar refrescar con `refresh`.
   - Si refresh falla → redirigir a login.
7. **Selects dinámicos**: Para campos FK, el frontend debe cargar la lista de opciones desde el endpoint correspondiente (ej. `/api/v1/customers/` para el campo `customer` en un formulario de Shipment).
8. **Fechas**: `license_expiry`, `scheduled_date` son `Date` — usar date picker.

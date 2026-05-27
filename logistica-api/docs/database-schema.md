# Schema de Base de Datos — Logística API

## Tablas Django (existentes por defecto)

Creadas automáticamente con `python manage.py migrate`. No se modifican.

| Tabla | Uso en el proyecto |
|-------|--------------------|
| `auth_user` | Usuarios del sistema (admin, operadores) |
| `auth_group` | Grupos de permisos (admin, operador) |
| `auth_permission` | Permisos por módulo |
| `django_admin_log` | Auditoría de cambios en el admin |
| `django_session` | Sesiones de usuario |
| `django_content_type` | Requerido por permisos y admin |

---

## Módulo: Clientes — App: `customers`

**Tabla: `customers_customer`**

| Columna | Tipo | Restricciones | Descripción |
|---------|------|--------------|-------------|
| `id` | BigAutoField | PK | Identificador único |
| `user` | FK → `auth_user` | UNIQUE, nullable, SET_NULL | Usuario del portal (opcional) |
| `name` | VARCHAR(200) | NOT NULL | Nombre de empresa o persona |
| `customer_type` | VARCHAR(10) | NOT NULL | `company` / `individual` |
| `tax_id` | VARCHAR(20) | UNIQUE, nullable | RUC o DNI |
| `email` | VARCHAR(254) | NOT NULL | Email de contacto |
| `phone` | VARCHAR(20) | nullable | Teléfono |
| `address` | TEXT | nullable | Dirección |
| `city` | VARCHAR(100) | nullable | Ciudad |
| `country` | VARCHAR(100) | DEFAULT `'Peru'` | País |
| `is_active` | BOOLEAN | DEFAULT `True` | Estado activo |
| `created_at` | TIMESTAMP | auto_now_add | Fecha de creación |
| `updated_at` | TIMESTAMP | auto_now | Última modificación |

---

## Módulo: Proveedores — App: `suppliers`

**Tabla: `suppliers_supplier`**

| Columna | Tipo | Restricciones | Descripción |
|---------|------|--------------|-------------|
| `id` | BigAutoField | PK | Identificador único |
| `name` | VARCHAR(200) | NOT NULL | Nombre de la empresa |
| `contact_name` | VARCHAR(200) | nullable | Nombre del contacto principal |
| `tax_id` | VARCHAR(20) | UNIQUE, nullable | RUC |
| `email` | VARCHAR(254) | nullable | Email de contacto |
| `phone` | VARCHAR(20) | nullable | Teléfono |
| `address` | TEXT | nullable | Dirección |
| `city` | VARCHAR(100) | nullable | Ciudad |
| `country` | VARCHAR(100) | DEFAULT `'Peru'` | País |
| `is_active` | BOOLEAN | DEFAULT `True` | Estado activo |
| `created_at` | TIMESTAMP | auto_now_add | Fecha de creación |
| `updated_at` | TIMESTAMP | auto_now | Última modificación |

---

## Módulo: Almacenes — App: `warehouses`

**Tabla: `warehouses_warehouse`**

| Columna | Tipo | Restricciones | Descripción |
|---------|------|--------------|-------------|
| `id` | BigAutoField | PK | Identificador único |
| `name` | VARCHAR(200) | NOT NULL | Nombre del almacén |
| `address` | TEXT | NOT NULL | Dirección completa |
| `city` | VARCHAR(100) | NOT NULL | Ciudad |
| `country` | VARCHAR(100) | DEFAULT `'Peru'` | País |
| `latitude` | DECIMAL(9,6) | nullable | Coordenada GPS |
| `longitude` | DECIMAL(9,6) | nullable | Coordenada GPS |
| `capacity_m3` | DECIMAL(10,2) | nullable | Capacidad total en m³ |
| `is_active` | BOOLEAN | DEFAULT `True` | Estado activo |
| `created_at` | TIMESTAMP | auto_now_add | Fecha de creación |
| `updated_at` | TIMESTAMP | auto_now | Última modificación |

---

## Módulo: Productos — App: `products`

**Tabla: `products_product`**

| Columna | Tipo | Restricciones | Descripción |
|---------|------|--------------|-------------|
| `id` | BigAutoField | PK | Identificador único |
| `supplier` | FK → `suppliers_supplier` | NOT NULL, PROTECT | Proveedor del producto |
| `warehouse` | FK → `warehouses_warehouse` | nullable, SET_NULL | Almacén donde está almacenado |
| `name` | VARCHAR(200) | NOT NULL | Nombre del producto |
| `description` | TEXT | nullable | Descripción detallada |
| `sku` | VARCHAR(100) | UNIQUE, NOT NULL | Código único de producto |
| `weight_kg` | DECIMAL(8,3) | NOT NULL | Peso en kilogramos |
| `length_cm` | DECIMAL(8,2) | nullable | Largo en centímetros |
| `width_cm` | DECIMAL(8,2) | nullable | Ancho en centímetros |
| `height_cm` | DECIMAL(8,2) | nullable | Alto en centímetros |
| `unit_price` | DECIMAL(12,2) | NOT NULL | Precio unitario actual |
| `stock_quantity` | INTEGER | DEFAULT `0` | Unidades en stock |
| `is_active` | BOOLEAN | DEFAULT `True` | Estado activo |
| `created_at` | TIMESTAMP | auto_now_add | Fecha de creación |
| `updated_at` | TIMESTAMP | auto_now | Última modificación |

---

## Módulo: Conductores — App: `drivers`

> Registro administrativo — no requiere cuenta en `auth_user`.

**Tabla: `drivers_driver`**

| Columna | Tipo | Restricciones | Descripción |
|---------|------|--------------|-------------|
| `id` | BigAutoField | PK | Identificador único |
| `first_name` | VARCHAR(100) | NOT NULL | Nombre |
| `last_name` | VARCHAR(100) | NOT NULL | Apellido |
| `document_number` | VARCHAR(20) | UNIQUE, NOT NULL | DNI u otro documento de identidad |
| `license_number` | VARCHAR(50) | UNIQUE, NOT NULL | Número de licencia de conducir |
| `license_expiry` | DATE | NOT NULL | Fecha de vencimiento de la licencia |
| `phone` | VARCHAR(20) | nullable | Teléfono personal |
| `email` | VARCHAR(254) | nullable | Email de contacto |
| `is_active` | BOOLEAN | DEFAULT `True` | Estado activo |
| `created_at` | TIMESTAMP | auto_now_add | Fecha de creación |
| `updated_at` | TIMESTAMP | auto_now | Última modificación |

---

## Módulo: Transporte — App: `transport`

**Tabla: `transport_vehicle`**

| Columna | Tipo | Restricciones | Descripción |
|---------|------|--------------|-------------|
| `id` | BigAutoField | PK | Identificador único |
| `driver` | FK → `drivers_driver` | nullable, SET_NULL | Conductor asignado actualmente |
| `name` | VARCHAR(200) | NOT NULL | Nombre o descripción del vehículo |
| `plate_number` | VARCHAR(20) | UNIQUE, NOT NULL | Placa del vehículo |
| `vehicle_type` | VARCHAR(20) | NOT NULL | `truck` / `van` / `motorcycle` / `other` |
| `capacity_kg` | DECIMAL(10,2) | nullable | Capacidad máxima de carga en kg |
| `capacity_m3` | DECIMAL(10,2) | nullable | Capacidad máxima de carga en m³ |
| `is_active` | BOOLEAN | DEFAULT `True` | Estado activo |
| `created_at` | TIMESTAMP | auto_now_add | Fecha de creación |
| `updated_at` | TIMESTAMP | auto_now | Última modificación |

---

## Módulo: Rutas — App: `routes`

**Tabla: `routes_route`**

| Columna | Tipo | Restricciones | Descripción |
|---------|------|--------------|-------------|
| `id` | BigAutoField | PK | Identificador único |
| `name` | VARCHAR(200) | NOT NULL | Nombre de la ruta |
| `origin_warehouse` | FK → `warehouses_warehouse` | NOT NULL, PROTECT | Almacén de origen |
| `distance_km` | DECIMAL(10,2) | nullable | Distancia total en kilómetros |
| `estimated_duration_h` | DECIMAL(6,2) | nullable | Duración estimada en horas |
| `is_active` | BOOLEAN | DEFAULT `True` | Estado activo |
| `created_at` | TIMESTAMP | auto_now_add | Fecha de creación |
| `updated_at` | TIMESTAMP | auto_now | Última modificación |

**Tabla: `routes_routestop`** — paradas ordenadas de cada ruta

| Columna | Tipo | Restricciones | Descripción |
|---------|------|--------------|-------------|
| `id` | BigAutoField | PK | Identificador único |
| `route` | FK → `routes_route` | NOT NULL, CASCADE | Ruta a la que pertenece |
| `stop_order` | INTEGER | NOT NULL | Número de orden de la parada (1, 2, 3…) |
| `address` | TEXT | NOT NULL | Dirección de la parada |
| `city` | VARCHAR(100) | NOT NULL | Ciudad |
| `latitude` | DECIMAL(9,6) | nullable | Coordenada GPS |
| `longitude` | DECIMAL(9,6) | nullable | Coordenada GPS |

**Constraint único:** `(route, stop_order)`

---

## Módulo: Envíos — App: `shipments` *(entidad central)*

**Tabla: `shipments_shipment`**

| Columna | Tipo | Restricciones | Descripción |
|---------|------|--------------|-------------|
| `id` | BigAutoField | PK | Identificador único |
| `tracking_number` | VARCHAR(20) | UNIQUE, NOT NULL | Código de rastreo — auto-generado formato `LOG-YYYY-NNNNN` |
| `customer` | FK → `customers_customer` | NOT NULL, PROTECT | Cliente que genera el envío |
| `origin_warehouse` | FK → `warehouses_warehouse` | NOT NULL, PROTECT | Almacén de salida |
| `vehicle` | FK → `transport_vehicle` | nullable, SET_NULL | Vehículo asignado al envío |
| `route` | FK → `routes_route` | nullable, SET_NULL | Ruta asignada al envío |
| `destination_address` | TEXT | NOT NULL | Dirección de entrega |
| `destination_city` | VARCHAR(100) | NOT NULL | Ciudad de destino |
| `destination_country` | VARCHAR(100) | DEFAULT `'Peru'` | País de destino |
| `status` | VARCHAR(20) | NOT NULL | `pending` / `assigned` / `in_transit` / `delivered` / `cancelled` / `returned` |
| `scheduled_date` | DATE | nullable | Fecha programada de entrega |
| `delivered_at` | TIMESTAMP | nullable | Fecha y hora real de entrega |
| `base_cost` | DECIMAL(12,2) | nullable | Costo base del envío |
| `calculated_cost` | DECIMAL(12,2) | nullable | Costo calculado (peso + distancia) |
| `notes` | TEXT | nullable | Observaciones adicionales |
| `created_at` | TIMESTAMP | auto_now_add | Fecha de creación |
| `updated_at` | TIMESTAMP | auto_now | Última modificación |

**Tabla: `shipments_shipmentitem`** — productos incluidos en cada envío

| Columna | Tipo | Restricciones | Descripción |
|---------|------|--------------|-------------|
| `id` | BigAutoField | PK | Identificador único |
| `shipment` | FK → `shipments_shipment` | NOT NULL, CASCADE | Envío al que pertenece |
| `product` | FK → `products_product` | NOT NULL, PROTECT | Producto enviado |
| `quantity` | INTEGER | NOT NULL | Cantidad de unidades |
| `unit_price_at_shipment` | DECIMAL(12,2) | NOT NULL | Precio unitario al momento del envío (histórico) |

**Constraint único:** `(shipment, product)`

---

## Diagrama de Relaciones

```
auth_user
    │
    └── customers_customer (FK, opcional)
    
suppliers_supplier ──► products_product ──► warehouses_warehouse
                              │
                              ▼
                    shipments_shipmentitem
                              │
                              ▼
customers_customer ──► shipments_shipment ◄── warehouses_warehouse (origen)
                              │
                    ┌─────────┴──────────┐
                    ▼                    ▼
          transport_vehicle         routes_route
                    │                    │
                    ▼                    ▼
           drivers_driver        routes_routestop
```

## Flujo de negocio

1. `Supplier` provee `Products` que se almacenan en `Warehouse`
2. `Customer` crea un `Shipment` con origen en `Warehouse`
3. Se agregan `ShipmentItems` al envío (productos + cantidad + precio histórico)
4. Se asigna un `Vehicle` (con `Driver`) y una `Route` al envío
5. El `Shipment` avanza por estados: `pending` → `assigned` → `in_transit` → `delivered`

## Criterios de `on_delete` por FK

| Tipo | Regla | Motivo |
|------|-------|--------|
| PROTECT | `customer`, `origin_warehouse` en Shipment | No se puede borrar si tiene envíos |
| PROTECT | `supplier` en Product | No se puede borrar si tiene productos |
| PROTECT | `product` en ShipmentItem | No borrar producto con historial de envíos |
| CASCADE | `shipment` en ShipmentItem | El item no existe sin el envío |
| CASCADE | `route` en RouteStop | La parada no existe sin la ruta |
| SET_NULL | `vehicle`, `route` en Shipment | El envío existe aunque se desasigne |
| SET_NULL | `driver` en Vehicle | El vehículo existe aunque se desasigne el conductor |
| SET_NULL | `user` en Customer | El cliente existe aunque se elimine su usuario |
| SET_NULL | `warehouse` en Product | El producto existe aunque se elimine el almacén |

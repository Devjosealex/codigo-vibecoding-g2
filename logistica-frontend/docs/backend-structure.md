# Backend Structure — logistica-api

> Vista general del proyecto Django para orientar el desarrollo del frontend.

## Ubicación

```
codigo-vibecoding-g2/
└── logistica-api/           # Django 6.0.5 + DRF 3.17
    ├── manage.py            # Entrypoint
    ├── config/              # Settings, URLs raíz, WSGI/ASGI
    ├── apps/                # 8 módulos de negocio + authentication
    │   ├── authentication/  # (shell) — solo tests; auth por SimpleJWT
    │   ├── customers/       # Phase 0 — Clientes
    │   ├── suppliers/       # Phase 0 — Proveedores
    │   ├── warehouses/      # Phase 0 — Almacenes
    │   ├── products/        # Phase 1 — Productos
    │   ├── drivers/         # Phase 1 — Conductores
    │   ├── transport/       # Phase 2 — Vehículos
    │   ├── routes/          # Phase 2 — Rutas + Paradas
    │   └── shipments/       # Phase 3 — Envíos (módulo central)
    ├── products/            # ⚠️ App vacía/legacy — ignorar
    ├── spec/                # Especificaciones SDD de cada módulo
    └── CLAUDE.md
```

## Fases de desarrollo

El backend se construyó por fases. El frontend puede priorizar en el mismo orden:

| Fase | Módulos | Dependencias | Prioridad frontend |
|------|---------|--------------|-------------------|
| P0 | customers, suppliers, warehouses | Ninguna | CRUD básico |
| P1 | products, drivers | suppliers + warehouses (products) | CRUD con FK selects |
| P2 | transport, routes | drivers + warehouses | CRUD con anidados |
| P3 | shipments | todos los anteriores | Máquina de estados + items |

## Patrón común por módulo

Cada app sigue exactamente la misma estructura:

```
apps/{modulo}/
├── __init__.py
├── admin.py        # Django Admin config
├── apps.py         # App config
├── models.py       # Modelo(s) Django
├── serializers.py  # DRF Serializer(s)
├── urls.py         # DefaultRouter → endpoints
├── views.py        # ModelViewSet(s)
├── filters.py      # (opcional — ninguno usa aún)
├── permissions.py  # (opcional — ninguno usa aún)
├── services.py     # (opcional — solo shipments tiene)
└── tests/          # Tests (si existen)
    ├── __init__.py
    ├── test_models.py
    └── test_views.py
```

## Excepciones al patrón

- **`apps/authentication/`** — no tiene models, serializers, views ni urls. Todo es SimpleJWT desde `config/urls.py`.
- **`apps/shipments/`** — tiene `services.py` con lógica de negocio (estados, tracking number, costos).
- **`apps/routes/`** — tiene 2 modelos (Route + RouteStop) y 2 ViewSets.
- **`apps/shipments/`** — tiene 2 modelos (Shipment + ShipmentItem) y 2 ViewSets + 1 custom action (`/transition/`).

## Settings clave

- **DB**: PostgreSQL si `DB_NAME` está en `.env`, SQLite como fallback.
- **Auth global**: `IsAuthenticated` por defecto en todos los endpoints `api/v1/`.
- **Paginación**: 20 ítems por página, vía `PageNumberPagination`.
- **CORS**: `http://localhost:3000` y `http://localhost:5173` por defecto.

Ver [backend-api-reference.md](./backend-api-reference.md) para detalles completos de endpoints.

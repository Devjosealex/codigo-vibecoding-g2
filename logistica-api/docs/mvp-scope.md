# MVP Scope — Logistica API

## Objetivo

API REST de logística para gestión de envíos de productos tecnológicos. MVP listo para producción en Railway.

## Stack Tecnológico

| Capa | Tecnología |
|------|-----------|
| Backend | Django 6.0.5 + Django REST Framework 3.17.1 |
| Auth | Django auth + `djangorestframework-simplejwt` |
| Base de datos (dev) | SQLite |
| Base de datos (prod) | PostgreSQL (Railway) |
| Config | `python-decouple` + `.env` |
| Deploy | Railway |

## Autenticación

- JWT vía `djangorestframework-simplejwt`
- Endpoints: `POST /api/auth/token/` y `POST /api/auth/token/refresh/`
- Todos los endpoints de la API requieren autenticación (excepto token endpoints)
- Usar `JWTAuthentication` como `DEFAULT_AUTHENTICATION_CLASSES` en DRF settings

## Módulos y Fases de Desarrollo

Orden respeta dependencias de FK — no iniciar una fase hasta completar la anterior.

### Phase 0 — Sin dependencias externas
| Módulo | App | CRUD Endpoints |
|--------|-----|----------------|
| Clientes | `customers` | `/api/customers/` |
| Proveedores | `suppliers` | `/api/suppliers/` |
| Almacenes | `warehouses` | `/api/warehouses/` |

### Phase 1 — Depende de Phase 0
| Módulo | App | CRUD Endpoints | Depende de |
|--------|-----|----------------|-----------|
| Productos | `products` | `/api/products/` | suppliers, warehouses |
| Conductores | `drivers` | `/api/drivers/` | — (sin FK externa) |

### Phase 2 — Depende de Phase 1
| Módulo | App | CRUD Endpoints | Depende de |
|--------|-----|----------------|-----------|
| Transporte | `transport` | `/api/vehicles/` | drivers |
| Rutas | `routes` | `/api/routes/`, `/api/route-stops/` | — |

### Phase 3 — Entidad central
| Módulo | App | CRUD Endpoints | Depende de |
|--------|-----|----------------|-----------|
| Envíos | `shipments` | `/api/shipments/`, `/api/shipment-items/` | customers, warehouses, transport, drivers, routes |

## Alcance por Módulo

Cada módulo implementa:
- [x] Modelo con todos los campos del schema (`docs/database-schema.md`)
- [x] Migraciones
- [x] Serializer completo
- [x] ModelViewSet con CRUD completo (list, retrieve, create, update, partial_update)
- [x] Soft delete: acción `DELETE` setea `is_active=False`, no borra el registro
- [x] DefaultRouter en `apps/{modulo}/urls.py`
- [x] Filtros básicos por campos relevantes (django-filter)
- [x] Registro en `INSTALLED_APPS` y `config/urls.py`

### Módulo shipments — Lógica adicional
- `services.py` con:
  - Generación de `tracking_number` formato `LOG-YYYY-NNNNN`
  - Cálculo de costo de envío
  - State machine de estados: `pending → assigned → in_transit → delivered`
  - Cancelación: `pending/assigned → cancelled`
  - Devolución: `delivered → returned`

## Configuración Global (Phase 0 — antes de módulos)

- [ ] Crear `.env` con `SECRET_KEY`, `DEBUG`, `DB_NAME`, `DB_USER`, `DB_PASSWORD`, `DB_HOST`, `DB_PORT`
- [ ] Migrar `config/settings.py` a `decouple.config()`
- [ ] Configurar PostgreSQL en settings (con fallback SQLite para dev local)
- [ ] Agregar `rest_framework` a `INSTALLED_APPS`
- [ ] Agregar `corsheaders` a `INSTALLED_APPS` y middleware
- [ ] Agregar `drf_spectacular` para documentación automática (`/api/schema/`, `/api/docs/`)
- [ ] Configurar `simplejwt` en DRF `DEFAULT_AUTHENTICATION_CLASSES`
- [ ] Agregar endpoints de token en `config/urls.py`

## Deploy Railway

Variables de entorno requeridas en Railway:
```
SECRET_KEY=...
DEBUG=False
ALLOWED_HOSTS=*.railway.app
DB_NAME=...
DB_USER=...
DB_PASSWORD=...
DB_HOST=...
DB_PORT=5432
```

`Procfile` o `railway.json` con:
```
web: gunicorn config.wsgi:application
```

## Fuera de Scope MVP

- Tests automatizados
- Notificaciones (email, SMS, push)
- Reportes y analytics
- Panel de administración personalizado (solo Django admin por defecto)
- Websockets / tiempo real
- Rate limiting avanzado
- Multi-tenancy

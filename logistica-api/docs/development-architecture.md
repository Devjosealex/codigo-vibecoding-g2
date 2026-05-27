# Arquitectura de Desarrollo — Logística API MVP

> Schema de BD: [`docs/database-schema.md`](database-schema.md)

---

## Estructura de Carpetas

```
logistica-api/
├── config/
│   ├── settings.py
│   ├── urls.py
│   ├── wsgi.py
│   └── asgi.py
├── apps/
│   ├── customers/
│   │   ├── models.py
│   │   ├── serializers.py
│   │   ├── views.py
│   │   ├── urls.py
│   │   ├── admin.py
│   │   └── tests/
│   │       ├── test_models.py
│   │       └── test_views.py
│   ├── suppliers/       (misma estructura)
│   ├── warehouses/      (misma estructura)
│   ├── products/        (misma estructura)
│   ├── drivers/         (misma estructura)
│   ├── transport/       (misma estructura)
│   ├── routes/          (misma estructura)
│   └── shipments/
│       ├── models.py
│       ├── serializers.py
│       ├── views.py
│       ├── urls.py
│       ├── admin.py
│       ├── services.py  ← tracking_number, costo, máquina de estados
│       └── tests/
│           ├── test_models.py
│           └── test_views.py
├── docs/
├── .env
├── manage.py
└── requirements.txt
```

**Regla:** Todas las apps viven bajo `apps/`. Se registran en settings como `apps.customers`, `apps.suppliers`, etc.

---

## Dependencias

### Instaladas (requirements.txt actual)
- `Django==6.0.5`
- `djangorestframework==3.17.1`
- `psycopg2-binary==2.9.12`
- `python-decouple==3.8`

### Agregar
```
django-cors-headers
drf-spectacular
django-filter
```

| Paquete | Motivo |
|---------|--------|
| `django-cors-headers` | CORS para consumo desde frontend |
| `drf-spectacular` | Docs OpenAPI/Swagger auto-generadas |
| `django-filter` | Filtrado declarativo en ViewSets |

---

## Configuración (`config/settings.py`)

### Variables de entorno (`.env`)
```env
SECRET_KEY=django-insecure-cambia-esto-en-produccion
DEBUG=True
ALLOWED_HOSTS=localhost,127.0.0.1
DB_ENGINE=django.db.backends.sqlite3
DB_NAME=db.sqlite3
```

### INSTALLED_APPS
```python
DJANGO_APPS = [
    'django.contrib.admin',
    'django.contrib.auth',
    'django.contrib.contenttypes',
    'django.contrib.sessions',
    'django.contrib.messages',
    'django.contrib.staticfiles',
]
THIRD_PARTY_APPS = [
    'rest_framework',
    'rest_framework.authtoken',
    'corsheaders',
    'django_filters',
    'drf_spectacular',
]
LOCAL_APPS = [
    'apps.customers',
    'apps.suppliers',
    'apps.warehouses',
    'apps.products',
    'apps.drivers',
    'apps.transport',
    'apps.routes',
    'apps.shipments',
]
INSTALLED_APPS = DJANGO_APPS + THIRD_PARTY_APPS + LOCAL_APPS
```

### REST_FRAMEWORK
```python
REST_FRAMEWORK = {
    'DEFAULT_AUTHENTICATION_CLASSES': [
        'rest_framework.authentication.TokenAuthentication',
    ],
    'DEFAULT_PERMISSION_CLASSES': [
        'rest_framework.permissions.IsAuthenticated',
    ],
    'DEFAULT_FILTER_BACKENDS': [
        'django_filters.rest_framework.DjangoFilterBackend',
        'rest_framework.filters.SearchFilter',
        'rest_framework.filters.OrderingFilter',
    ],
    'DEFAULT_PAGINATION_CLASS': 'rest_framework.pagination.PageNumberPagination',
    'PAGE_SIZE': 20,
    'DEFAULT_SCHEMA_CLASS': 'drf_spectacular.openapi.AutoSchema',
}
```

---

## Patrón DRF por Módulo

Cada app sigue el mismo flujo:

```
Model → Serializer → ViewSet → Router URL
```

### Plantilla `views.py`
```python
from rest_framework.viewsets import ModelViewSet
from .models import Customer
from .serializers import CustomerSerializer

class CustomerViewSet(ModelViewSet):
    queryset = Customer.objects.filter(is_active=True)
    serializer_class = CustomerSerializer
    filterset_fields = ['customer_type', 'city', 'country']
    search_fields = ['name', 'email', 'tax_id']
    ordering_fields = ['name', 'created_at']
```

### Plantilla `urls.py` de app
```python
from rest_framework.routers import DefaultRouter
from .views import CustomerViewSet

router = DefaultRouter()
router.register(r'customers', CustomerViewSet)
urlpatterns = router.urls
```

---

## URLs Principales (`config/urls.py`)

```python
from django.contrib import admin
from django.urls import path, include
from drf_spectacular.views import SpectacularAPIView, SpectacularSwaggerUIView

urlpatterns = [
    path('admin/', admin.site.urls),
    path('api/v1/', include([
        path('', include('apps.customers.urls')),
        path('', include('apps.suppliers.urls')),
        path('', include('apps.warehouses.urls')),
        path('', include('apps.products.urls')),
        path('', include('apps.drivers.urls')),
        path('', include('apps.transport.urls')),
        path('', include('apps.routes.urls')),
        path('', include('apps.shipments.urls')),
    ])),
    path('api/schema/', SpectacularAPIView.as_view(), name='schema'),
    path('api/docs/', SpectacularSwaggerUIView.as_view(url_name='schema'), name='swagger-ui'),
]
```

---

## Autenticación

MVP usa **Token Authentication** (DRF built-in — sin dependencias extra).

| Acción | Endpoint |
|--------|----------|
| Obtener token | `POST /api/v1/auth/token/` con `username` y `password` |
| Usar token | Header: `Authorization: Token <token>` |

No se usa JWT en el MVP — agrega complejidad innecesaria para una API interna.

---

## Endpoints del API

**Convención:** `GET /{recurso}/` lista · `POST /{recurso}/` crea · `GET /{recurso}/{id}/` detalle · `PUT/PATCH` actualiza · `DELETE` soft delete (`is_active=False`).

| Módulo | Endpoint base |
|--------|--------------|
| Clientes | `GET/POST /api/v1/customers/` |
| Proveedores | `GET/POST /api/v1/suppliers/` |
| Almacenes | `GET/POST /api/v1/warehouses/` |
| Productos | `GET/POST /api/v1/products/` |
| Conductores | `GET/POST /api/v1/drivers/` |
| Vehículos | `GET/POST /api/v1/vehicles/` |
| Rutas | `GET/POST /api/v1/routes/` |
| Envíos | `GET/POST /api/v1/shipments/` |
| Docs Swagger | `GET /api/docs/` |

---

## Lógica de Negocio — `apps/shipments/services.py`

`shipments` es el único módulo con lógica no-trivial. Toda la lógica va en `services.py`, no en views ni models.

### Funciones
- `generate_tracking_number()` — formato `LOG-YYYY-NNNNN`, auto-incremental por año
- `calculate_shipment_cost(shipment)` — peso total de items × tarifa + distancia de ruta × tarifa km
- `transition_status(shipment, new_status)` — valida y aplica transición de estado

### Máquina de estados

```
pending ──► assigned ──► in_transit ──► delivered
   │            │
   └────────────┴──► cancelled

in_transit ──► returned
```

Transiciones inválidas lanzan `ValidationError`.

---

## Orden de Desarrollo (Fases MVP)

Respetar dependencias entre FK del schema:

| Fase | Apps | Dependencias |
|------|------|-------------|
| **0** | Setup inicial: settings, .env, requirements, carpeta `apps/` | — |
| **1** | `warehouses`, `suppliers` | Sin FK externas |
| **2** | `products`, `drivers` | FK a fase 1 |
| **3** | `transport`, `routes` | FK a fase 1-2 |
| **4** | `customers` | Independiente |
| **5** | `shipments` | FK a todas las anteriores |

**Entregable por fase:** modelo → migración → serializer → viewset → URLs → tests básicos → registro en admin.

---

## Convenciones de Código

| Convención | Regla |
|-----------|-------|
| Soft delete | Nunca `DELETE` real. Setear `is_active=False`. Filtrar queryset con `.filter(is_active=True)` |
| Timestamps | Todos los modelos tienen `created_at` (auto_now_add) y `updated_at` (auto_now) |
| `__str__` | Implementar en todos los modelos (requerido por el admin de Django) |
| Tests | Mínimo: 1 test de creación + 1 de listado por módulo usando `APITestCase` |
| Serializers | Usar `fields = '__all__'` solo en desarrollo. En producción, listar campos explícitamente |
| `read_only_fields` | `['id', 'created_at', 'updated_at', 'tracking_number']` en todos los serializers que aplique |

---

## Verificación del Setup

```bash
# 1. Instalar dependencias
pip install -r requirements.txt

# 2. Verificar configuración Django
python manage.py check

# 3. Crear y aplicar migraciones
python manage.py makemigrations
python manage.py migrate

# 4. Crear superuser para probar token
python manage.py createsuperuser

# 5. Ejecutar tests
python manage.py test apps
```

Swagger disponible en `http://localhost:8000/api/docs/` tras levantar el servidor.

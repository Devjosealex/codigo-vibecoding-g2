# Spec: Drivers

## Contexto
Módulo de conductores — registro administrativo de personas que manejan los vehículos. No requiere cuenta en `auth_user`. Sin dependencias de FK externas. Parte de Phase 1 de módulos.

## Dependencias
- Apps en INSTALLED_APPS antes de este módulo: ninguna (sin FKs externas)
- FK externas: ninguna (pero es referenciado por `transport_vehicle`)

---

## Tareas

### Task 1: Estructura de carpetas
- Crear directorio `apps/drivers/`
- Crear archivos:
  - `apps/drivers/__init__.py`
  - `apps/drivers/models.py`
  - `apps/drivers/serializers.py`
  - `apps/drivers/views.py`
  - `apps/drivers/urls.py`
  - `apps/drivers/admin.py`
  - `apps/drivers/apps.py`

### Task 2: Modelo (`apps/drivers/models.py`)
Crear clase `Driver(models.Model)` con los siguientes campos exactos:

| Campo | Definición Django |
|-------|------------------|
| `first_name` | `models.CharField(max_length=100)` |
| `last_name` | `models.CharField(max_length=100)` |
| `document_number` | `models.CharField(max_length=20, unique=True)` |
| `license_number` | `models.CharField(max_length=50, unique=True)` |
| `license_expiry` | `models.DateField()` |
| `phone` | `models.CharField(max_length=20, null=True, blank=True)` |
| `email` | `models.EmailField(null=True, blank=True)` |
| `is_active` | `models.BooleanField(default=True)` |
| `created_at` | `models.DateTimeField(auto_now_add=True)` |
| `updated_at` | `models.DateTimeField(auto_now=True)` |

```python
class Meta:
    db_table = 'drivers_driver'
    ordering = ['last_name', 'first_name']

def __str__(self):
    return f"{self.first_name} {self.last_name}"
```

### Task 3: AppConfig (`apps/drivers/apps.py`)
```python
from django.apps import AppConfig

class DriversConfig(AppConfig):
    default_auto_field = 'django.db.models.BigAutoField'
    name = 'apps.drivers'
```

### Task 4: Migración
- Ejecutar `python manage.py makemigrations drivers`
- Ejecutar `python manage.py migrate`

### Task 5: Admin (`apps/drivers/admin.py`)
```python
@admin.register(Driver)
class DriverAdmin(admin.ModelAdmin):
    list_display = ['last_name', 'first_name', 'document_number', 'license_number', 'license_expiry', 'is_active']
    list_filter = ['is_active']
    search_fields = ['first_name', 'last_name', 'document_number', 'license_number']
```

### Task 6: Serializer (`apps/drivers/serializers.py`)
- Clase `DriverSerializer(serializers.ModelSerializer)`
- Campos explícitos: `['id', 'first_name', 'last_name', 'document_number', 'license_number', 'license_expiry', 'phone', 'email', 'is_active', 'created_at', 'updated_at']`
- `read_only_fields = ['id', 'created_at', 'updated_at']`

### Task 7: ViewSet (`apps/drivers/views.py`)
- Clase `DriverViewSet(viewsets.ModelViewSet)`
- `queryset = Driver.objects.filter(is_active=True)`
- `serializer_class = DriverSerializer`
- `filterset_fields = []` (sin filtros de FK; filtrado por search)
- `search_fields = ['first_name', 'last_name', 'document_number', 'license_number']`
- `ordering_fields = ['last_name', 'first_name', 'license_expiry', 'created_at']`
- Sobreescribir `destroy()` → soft delete (`is_active=False`)

### Task 8: URLs (`apps/drivers/urls.py`)
```python
router = DefaultRouter()
router.register(r'drivers', DriverViewSet, basename='driver')
urlpatterns = router.urls
```

### Task 9: Configuración global
- Agregar `'apps.drivers'` a `INSTALLED_APPS` en `config/settings.py`
- Agregar `path('api/v1/', include('apps.drivers.urls'))` en `config/urls.py`

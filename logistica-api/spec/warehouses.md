# Spec: Warehouses

## Contexto
Módulo de almacenes — punto de partida y almacenamiento de productos. Sin dependencias de FK externas. Parte de Phase 0 de módulos.

## Dependencias
- Apps en INSTALLED_APPS antes de este módulo: ninguna (Phase 0)
- FK externas: ninguna (pero es referenciada por products, routes y shipments)

---

## Tareas

### Task 1: Estructura de carpetas
- Crear directorio `apps/warehouses/`
- Crear los siguientes archivos vacíos:
  - `apps/warehouses/__init__.py`
  - `apps/warehouses/models.py`
  - `apps/warehouses/serializers.py`
  - `apps/warehouses/views.py`
  - `apps/warehouses/urls.py`
  - `apps/warehouses/admin.py`
  - `apps/warehouses/apps.py`

### Task 2: Modelo (`apps/warehouses/models.py`)
Crear clase `Warehouse(models.Model)` con los siguientes campos exactos:

| Campo | Definición Django |
|-------|------------------|
| `name` | `models.CharField(max_length=200)` |
| `address` | `models.TextField()` |
| `city` | `models.CharField(max_length=100)` |
| `country` | `models.CharField(max_length=100, default='Peru')` |
| `latitude` | `models.DecimalField(max_digits=9, decimal_places=6, null=True, blank=True)` |
| `longitude` | `models.DecimalField(max_digits=9, decimal_places=6, null=True, blank=True)` |
| `capacity_m3` | `models.DecimalField(max_digits=10, decimal_places=2, null=True, blank=True)` |
| `is_active` | `models.BooleanField(default=True)` |
| `created_at` | `models.DateTimeField(auto_now_add=True)` |
| `updated_at` | `models.DateTimeField(auto_now=True)` |

```python
class Meta:
    db_table = 'warehouses_warehouse'
    ordering = ['-created_at']

def __str__(self):
    return f"{self.name} ({self.city})"
```

### Task 3: AppConfig (`apps/warehouses/apps.py`)
```python
from django.apps import AppConfig

class WarehousesConfig(AppConfig):
    default_auto_field = 'django.db.models.BigAutoField'
    name = 'apps.warehouses'
```

### Task 4: Migración
- Ejecutar `python manage.py makemigrations warehouses`
- Ejecutar `python manage.py migrate`

### Task 5: Admin (`apps/warehouses/admin.py`)
```python
from django.contrib import admin
from .models import Warehouse

@admin.register(Warehouse)
class WarehouseAdmin(admin.ModelAdmin):
    list_display = ['name', 'city', 'country', 'capacity_m3', 'is_active']
    list_filter = ['is_active', 'country', 'city']
    search_fields = ['name', 'address', 'city']
```

### Task 6: Serializer (`apps/warehouses/serializers.py`)
- Clase `WarehouseSerializer(serializers.ModelSerializer)`
- `model = Warehouse`
- Campos explícitos: `['id', 'name', 'address', 'city', 'country', 'latitude', 'longitude', 'capacity_m3', 'is_active', 'created_at', 'updated_at']`
- `read_only_fields = ['id', 'created_at', 'updated_at']`

### Task 7: ViewSet (`apps/warehouses/views.py`)
- Clase `WarehouseViewSet(viewsets.ModelViewSet)`
- `queryset = Warehouse.objects.filter(is_active=True)`
- `serializer_class = WarehouseSerializer`
- `filterset_fields = ['city', 'country']`
- `search_fields = ['name', 'address', 'city']`
- `ordering_fields = ['name', 'city', 'created_at']`
- Sobreescribir `destroy()`:
  ```python
  def destroy(self, request, *args, **kwargs):
      instance = self.get_object()
      instance.is_active = False
      instance.save()
      return Response(status=status.HTTP_204_NO_CONTENT)
  ```

### Task 8: URLs (`apps/warehouses/urls.py`)
```python
from rest_framework.routers import DefaultRouter
from .views import WarehouseViewSet

router = DefaultRouter()
router.register(r'warehouses', WarehouseViewSet, basename='warehouse')
urlpatterns = router.urls
```

### Task 9: Configuración global
- Agregar `'apps.warehouses'` a `INSTALLED_APPS` en `config/settings.py`
- En `config/urls.py`, agregar include bajo el bloque `api/v1/`:
  ```python
  path('api/v1/', include('apps.warehouses.urls')),
  ```

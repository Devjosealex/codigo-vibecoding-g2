# Spec: Suppliers

## Contexto
Módulo de proveedores — empresas que venden los productos. Sin dependencias de FK externas. Parte de Phase 0 de módulos.

## Dependencias
- Apps en INSTALLED_APPS antes de este módulo: ninguna (Phase 0)
- FK externas: ninguna

---

## Tareas

### Task 1: Estructura de carpetas
- Crear directorio `apps/suppliers/`
- Crear los siguientes archivos vacíos:
  - `apps/suppliers/__init__.py`
  - `apps/suppliers/models.py`
  - `apps/suppliers/serializers.py`
  - `apps/suppliers/views.py`
  - `apps/suppliers/urls.py`
  - `apps/suppliers/admin.py`
  - `apps/suppliers/apps.py`

### Task 2: Modelo (`apps/suppliers/models.py`)
Crear clase `Supplier(models.Model)` con los siguientes campos exactos:

| Campo | Definición Django |
|-------|------------------|
| `name` | `models.CharField(max_length=200)` |
| `contact_name` | `models.CharField(max_length=200, null=True, blank=True)` |
| `tax_id` | `models.CharField(max_length=20, unique=True, null=True, blank=True)` |
| `email` | `models.EmailField(null=True, blank=True)` |
| `phone` | `models.CharField(max_length=20, null=True, blank=True)` |
| `address` | `models.TextField(null=True, blank=True)` |
| `city` | `models.CharField(max_length=100, null=True, blank=True)` |
| `country` | `models.CharField(max_length=100, default='Peru')` |
| `is_active` | `models.BooleanField(default=True)` |
| `created_at` | `models.DateTimeField(auto_now_add=True)` |
| `updated_at` | `models.DateTimeField(auto_now=True)` |

```python
class Meta:
    db_table = 'suppliers_supplier'
    ordering = ['-created_at']

def __str__(self):
    return self.name
```

### Task 3: AppConfig (`apps/suppliers/apps.py`)
```python
from django.apps import AppConfig

class SuppliersConfig(AppConfig):
    default_auto_field = 'django.db.models.BigAutoField'
    name = 'apps.suppliers'
```

### Task 4: Migración
- Ejecutar `python manage.py makemigrations suppliers`
- Ejecutar `python manage.py migrate`

### Task 5: Admin (`apps/suppliers/admin.py`)
```python
from django.contrib import admin
from .models import Supplier

@admin.register(Supplier)
class SupplierAdmin(admin.ModelAdmin):
    list_display = ['name', 'contact_name', 'email', 'city', 'is_active']
    list_filter = ['is_active', 'country']
    search_fields = ['name', 'contact_name', 'email', 'tax_id']
```

### Task 6: Serializer (`apps/suppliers/serializers.py`)
- Clase `SupplierSerializer(serializers.ModelSerializer)`
- `model = Supplier`
- Campos explícitos: `['id', 'name', 'contact_name', 'tax_id', 'email', 'phone', 'address', 'city', 'country', 'is_active', 'created_at', 'updated_at']`
- `read_only_fields = ['id', 'created_at', 'updated_at']`

### Task 7: ViewSet (`apps/suppliers/views.py`)
- Clase `SupplierViewSet(viewsets.ModelViewSet)`
- `queryset = Supplier.objects.filter(is_active=True)`
- `serializer_class = SupplierSerializer`
- `filterset_fields = ['city', 'country']`
- `search_fields = ['name', 'contact_name', 'email', 'tax_id']`
- `ordering_fields = ['name', 'created_at']`
- Sobreescribir `destroy()`:
  ```python
  def destroy(self, request, *args, **kwargs):
      instance = self.get_object()
      instance.is_active = False
      instance.save()
      return Response(status=status.HTTP_204_NO_CONTENT)
  ```

### Task 8: URLs (`apps/suppliers/urls.py`)
```python
from rest_framework.routers import DefaultRouter
from .views import SupplierViewSet

router = DefaultRouter()
router.register(r'suppliers', SupplierViewSet, basename='supplier')
urlpatterns = router.urls
```

### Task 9: Configuración global
- Agregar `'apps.suppliers'` a `INSTALLED_APPS` en `config/settings.py`
- En `config/urls.py`, agregar include bajo el bloque `api/v1/`:
  ```python
  path('api/v1/', include('apps.suppliers.urls')),
  ```

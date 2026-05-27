# Spec: Customers

## Contexto
Módulo de clientes — empresa o persona que genera envíos. Sin dependencias externas propias (FK opcional a `auth_user`). Parte de Phase 0 de módulos.

## Dependencias
- Apps en INSTALLED_APPS antes de este módulo: ninguna (Phase 0)
- FK externa: `auth_user` (Django built-in, ya disponible)

---

## Tareas

### Task 1: Estructura de carpetas
- Crear directorio `apps/customers/`
- Crear los siguientes archivos vacíos:
  - `apps/customers/__init__.py`
  - `apps/customers/models.py`
  - `apps/customers/serializers.py`
  - `apps/customers/views.py`
  - `apps/customers/urls.py`
  - `apps/customers/admin.py`
  - `apps/customers/apps.py`

### Task 2: Modelo (`apps/customers/models.py`)
Crear clase `Customer(models.Model)` con los siguientes campos exactos:

| Campo | Definición Django |
|-------|------------------|
| `user` | `models.OneToOneField('auth.User', on_delete=models.SET_NULL, null=True, blank=True, related_name='customer_profile')` |
| `name` | `models.CharField(max_length=200)` |
| `customer_type` | `models.CharField(max_length=10, choices=[('company', 'Empresa'), ('individual', 'Persona natural')])` |
| `tax_id` | `models.CharField(max_length=20, unique=True, null=True, blank=True)` |
| `email` | `models.EmailField()` |
| `phone` | `models.CharField(max_length=20, null=True, blank=True)` |
| `address` | `models.TextField(null=True, blank=True)` |
| `city` | `models.CharField(max_length=100, null=True, blank=True)` |
| `country` | `models.CharField(max_length=100, default='Peru')` |
| `is_active` | `models.BooleanField(default=True)` |
| `created_at` | `models.DateTimeField(auto_now_add=True)` |
| `updated_at` | `models.DateTimeField(auto_now=True)` |

```python
class Meta:
    db_table = 'customers_customer'
    ordering = ['-created_at']

def __str__(self):
    return self.name
```

### Task 3: AppConfig (`apps/customers/apps.py`)
```python
from django.apps import AppConfig

class CustomersConfig(AppConfig):
    default_auto_field = 'django.db.models.BigAutoField'
    name = 'apps.customers'
```

### Task 4: Migración
- Ejecutar `python manage.py makemigrations customers`
- Ejecutar `python manage.py migrate`

### Task 5: Admin (`apps/customers/admin.py`)
```python
from django.contrib import admin
from .models import Customer

@admin.register(Customer)
class CustomerAdmin(admin.ModelAdmin):
    list_display = ['name', 'customer_type', 'email', 'city', 'is_active']
    list_filter = ['customer_type', 'is_active', 'country']
    search_fields = ['name', 'email', 'tax_id']
```

### Task 6: Serializer (`apps/customers/serializers.py`)
- Clase `CustomerSerializer(serializers.ModelSerializer)`
- `model = Customer`
- Campos explícitos: `['id', 'user', 'name', 'customer_type', 'tax_id', 'email', 'phone', 'address', 'city', 'country', 'is_active', 'created_at', 'updated_at']`
- `read_only_fields = ['id', 'created_at', 'updated_at']`

### Task 7: ViewSet (`apps/customers/views.py`)
- Clase `CustomerViewSet(viewsets.ModelViewSet)`
- `queryset = Customer.objects.filter(is_active=True)`
- `serializer_class = CustomerSerializer`
- `filterset_fields = ['customer_type', 'city', 'country']`
- `search_fields = ['name', 'email', 'tax_id']`
- `ordering_fields = ['name', 'created_at']`
- Sobreescribir `destroy()`:
  ```python
  def destroy(self, request, *args, **kwargs):
      instance = self.get_object()
      instance.is_active = False
      instance.save()
      return Response(status=status.HTTP_204_NO_CONTENT)
  ```

### Task 8: URLs (`apps/customers/urls.py`)
```python
from rest_framework.routers import DefaultRouter
from .views import CustomerViewSet

router = DefaultRouter()
router.register(r'customers', CustomerViewSet, basename='customer')
urlpatterns = router.urls
```

### Task 9: Configuración global
- Agregar `'apps.customers'` a `INSTALLED_APPS` en `config/settings.py`
- En `config/urls.py`, dentro del bloque `api/v1/`, incluir:
  ```python
  path('api/v1/', include('apps.customers.urls')),
  ```
  Si el bloque `api/v1/` no existe, crearlo agrupando los includes de módulos.

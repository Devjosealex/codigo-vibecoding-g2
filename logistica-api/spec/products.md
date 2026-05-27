# Spec: Products

## Contexto
Módulo de productos tecnológicos a enviar. Depende de `suppliers` (proveedor dueño del producto) y `warehouses` (almacén donde está almacenado). Parte de Phase 1 de módulos.

## Dependencias
- Apps en INSTALLED_APPS antes de este módulo: `apps.suppliers`, `apps.warehouses`
- FK externas:
  - `supplier` → `suppliers_supplier` — `on_delete=PROTECT` (no se puede borrar proveedor con productos)
  - `warehouse` → `warehouses_warehouse` — `on_delete=SET_NULL, null=True, blank=True` (el producto existe aunque se elimine el almacén)

---

## Tareas

### Task 1: Estructura de carpetas
- Crear directorio `apps/products/`
- Crear archivos:
  - `apps/products/__init__.py`
  - `apps/products/models.py`
  - `apps/products/serializers.py`
  - `apps/products/views.py`
  - `apps/products/urls.py`
  - `apps/products/admin.py`
  - `apps/products/apps.py`

### Task 2: Modelo (`apps/products/models.py`)
Crear clase `Product(models.Model)` con los siguientes campos exactos:

| Campo | Definición Django |
|-------|------------------|
| `supplier` | `models.ForeignKey('suppliers.Supplier', on_delete=models.PROTECT, related_name='products')` |
| `warehouse` | `models.ForeignKey('warehouses.Warehouse', on_delete=models.SET_NULL, null=True, blank=True, related_name='products')` |
| `name` | `models.CharField(max_length=200)` |
| `description` | `models.TextField(null=True, blank=True)` |
| `sku` | `models.CharField(max_length=100, unique=True)` |
| `weight_kg` | `models.DecimalField(max_digits=8, decimal_places=3)` |
| `length_cm` | `models.DecimalField(max_digits=8, decimal_places=2, null=True, blank=True)` |
| `width_cm` | `models.DecimalField(max_digits=8, decimal_places=2, null=True, blank=True)` |
| `height_cm` | `models.DecimalField(max_digits=8, decimal_places=2, null=True, blank=True)` |
| `unit_price` | `models.DecimalField(max_digits=12, decimal_places=2)` |
| `stock_quantity` | `models.IntegerField(default=0)` |
| `is_active` | `models.BooleanField(default=True)` |
| `created_at` | `models.DateTimeField(auto_now_add=True)` |
| `updated_at` | `models.DateTimeField(auto_now=True)` |

```python
class Meta:
    db_table = 'products_product'
    ordering = ['-created_at']

def __str__(self):
    return f"{self.name} ({self.sku})"
```

### Task 3: AppConfig (`apps/products/apps.py`)
```python
from django.apps import AppConfig

class ProductsConfig(AppConfig):
    default_auto_field = 'django.db.models.BigAutoField'
    name = 'apps.products'
```

### Task 4: Migración
- Ejecutar `python manage.py makemigrations products`
- Ejecutar `python manage.py migrate`

### Task 5: Admin (`apps/products/admin.py`)
```python
@admin.register(Product)
class ProductAdmin(admin.ModelAdmin):
    list_display = ['name', 'sku', 'supplier', 'warehouse', 'stock_quantity', 'unit_price', 'is_active']
    list_filter = ['is_active', 'supplier']
    search_fields = ['name', 'sku', 'description']
```

### Task 6: Serializer (`apps/products/serializers.py`)
- Clase `ProductSerializer(serializers.ModelSerializer)`
- Campos explícitos: `['id', 'supplier', 'warehouse', 'name', 'description', 'sku', 'weight_kg', 'length_cm', 'width_cm', 'height_cm', 'unit_price', 'stock_quantity', 'is_active', 'created_at', 'updated_at']`
- `read_only_fields = ['id', 'created_at', 'updated_at']`
- `supplier` y `warehouse` como `PrimaryKeyRelatedField` (escritura por ID)

### Task 7: ViewSet (`apps/products/views.py`)
- Clase `ProductViewSet(viewsets.ModelViewSet)`
- `queryset = Product.objects.filter(is_active=True).select_related('supplier', 'warehouse')`
- `serializer_class = ProductSerializer`
- `filterset_fields = ['supplier', 'warehouse']`
- `search_fields = ['name', 'sku', 'description']`
- `ordering_fields = ['name', 'unit_price', 'stock_quantity', 'created_at']`
- Sobreescribir `destroy()` → soft delete (`is_active=False`)

### Task 8: URLs (`apps/products/urls.py`)
```python
router = DefaultRouter()
router.register(r'products', ProductViewSet, basename='product')
urlpatterns = router.urls
```

### Task 9: Configuración global
- Agregar `'apps.products'` a `INSTALLED_APPS` en `config/settings.py`
- Agregar `path('api/v1/', include('apps.products.urls'))` en `config/urls.py`

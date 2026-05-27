# Spec: Shipments

## Contexto
Módulo central del sistema — conecta todas las entidades. Gestiona el ciclo completo de un envío: creación, asignación de vehículo/ruta, tránsito y entrega. Tiene dos modelos (`Shipment` y `ShipmentItem`) y lógica de negocio en `services.py`. Parte de Phase 3 (última fase).

## Dependencias
- Apps en INSTALLED_APPS antes de este módulo: `apps.customers`, `apps.warehouses`, `apps.transport`, `apps.routes`, `apps.products`
- FK externas en Shipment:
  - `customer` → `customers.Customer` — `on_delete=PROTECT`
  - `origin_warehouse` → `warehouses.Warehouse` — `on_delete=PROTECT`
  - `vehicle` → `transport.Vehicle` — `on_delete=SET_NULL, null=True, blank=True`
  - `route` → `routes.Route` — `on_delete=SET_NULL, null=True, blank=True`
- FK externas en ShipmentItem:
  - `shipment` → `Shipment` — `on_delete=CASCADE`
  - `product` → `products.Product` — `on_delete=PROTECT`

---

## Tareas

### Task 1: Estructura de carpetas
- Crear directorio `apps/shipments/`
- Crear archivos:
  - `apps/shipments/__init__.py`
  - `apps/shipments/models.py`
  - `apps/shipments/serializers.py`
  - `apps/shipments/views.py`
  - `apps/shipments/urls.py`
  - `apps/shipments/admin.py`
  - `apps/shipments/apps.py`
  - `apps/shipments/services.py`

### Task 2: Modelo Shipment (`apps/shipments/models.py`)
Crear clase `Shipment(models.Model)` con los siguientes campos exactos:

| Campo | Definición Django |
|-------|------------------|
| `tracking_number` | `models.CharField(max_length=20, unique=True)` |
| `customer` | `models.ForeignKey('customers.Customer', on_delete=models.PROTECT, related_name='shipments')` |
| `origin_warehouse` | `models.ForeignKey('warehouses.Warehouse', on_delete=models.PROTECT, related_name='shipments')` |
| `vehicle` | `models.ForeignKey('transport.Vehicle', on_delete=models.SET_NULL, null=True, blank=True, related_name='shipments')` |
| `route` | `models.ForeignKey('routes.Route', on_delete=models.SET_NULL, null=True, blank=True, related_name='shipments')` |
| `destination_address` | `models.TextField()` |
| `destination_city` | `models.CharField(max_length=100)` |
| `destination_country` | `models.CharField(max_length=100, default='Peru')` |
| `status` | `models.CharField(max_length=20, choices=STATUS_CHOICES, default='pending')` |
| `scheduled_date` | `models.DateField(null=True, blank=True)` |
| `delivered_at` | `models.DateTimeField(null=True, blank=True)` |
| `base_cost` | `models.DecimalField(max_digits=12, decimal_places=2, null=True, blank=True)` |
| `calculated_cost` | `models.DecimalField(max_digits=12, decimal_places=2, null=True, blank=True)` |
| `notes` | `models.TextField(null=True, blank=True)` |
| `created_at` | `models.DateTimeField(auto_now_add=True)` |
| `updated_at` | `models.DateTimeField(auto_now=True)` |

Choices para `status`:
```python
STATUS_CHOICES = [
    ('pending', 'Pendiente'),
    ('assigned', 'Asignado'),
    ('in_transit', 'En tránsito'),
    ('delivered', 'Entregado'),
    ('cancelled', 'Cancelado'),
    ('returned', 'Devuelto'),
]
```

```python
class Meta:
    db_table = 'shipments_shipment'
    ordering = ['-created_at']

def __str__(self):
    return f"{self.tracking_number} — {self.status}"
```

### Task 3: Modelo ShipmentItem (`apps/shipments/models.py`)
En el mismo archivo, agregar clase `ShipmentItem(models.Model)`:

| Campo | Definición Django |
|-------|------------------|
| `shipment` | `models.ForeignKey(Shipment, on_delete=models.CASCADE, related_name='items')` |
| `product` | `models.ForeignKey('products.Product', on_delete=models.PROTECT, related_name='shipment_items')` |
| `quantity` | `models.IntegerField()` |
| `unit_price_at_shipment` | `models.DecimalField(max_digits=12, decimal_places=2)` |

```python
class Meta:
    db_table = 'shipments_shipmentitem'
    unique_together = [('shipment', 'product')]

def __str__(self):
    return f"{self.product} × {self.quantity}"
```

**Nota:** `ShipmentItem` no tiene `is_active`, `created_at` ni `updated_at`.

### Task 4: AppConfig (`apps/shipments/apps.py`)
```python
from django.apps import AppConfig

class ShipmentsConfig(AppConfig):
    default_auto_field = 'django.db.models.BigAutoField'
    name = 'apps.shipments'
```

### Task 5: Migración
- Ejecutar `python manage.py makemigrations shipments`
- Ejecutar `python manage.py migrate`

### Task 6: Servicios (`apps/shipments/services.py`)
Implementar las 3 funciones de negocio:

#### `generate_tracking_number() -> str`
- Formato: `LOG-{YYYY}-{NNNNN}` donde NNNNN es el conteo de envíos del año actual + 1, con cero-padding a 5 dígitos
- Ejemplo: `LOG-2026-00001`, `LOG-2026-00002`
- Lógica: contar `Shipment.objects.filter(created_at__year=year).count()` y sumar 1
- Debe ser llamado en `ShipmentViewSet.perform_create()`, no en el modelo

#### `calculate_shipment_cost(shipment) -> Decimal`
- Sumar peso total de los items: `sum(item.quantity * item.product.weight_kg for item in shipment.items.all())`
- Costo base por peso: `peso_total_kg * Decimal('5.00')` (tarifa: S/5 por kg)
- Costo por distancia (si la ruta tiene `distance_km`): `shipment.route.distance_km * Decimal('0.50')` (tarifa: S/0.50 por km)
- Si no hay ruta: costo por distancia = 0
- Retornar suma total como `Decimal`
- No guarda en BD, solo retorna el valor calculado

#### `transition_status(shipment, new_status: str) -> None`
- Validar transición según máquina de estados:
  ```
  pending   → assigned, cancelled
  assigned  → in_transit, cancelled
  in_transit → delivered, returned
  delivered → returned
  cancelled → (ninguna)
  returned  → (ninguna)
  ```
- Si la transición es inválida: lanzar `rest_framework.exceptions.ValidationError` con mensaje descriptivo
- Si `new_status == 'delivered'`: setear `shipment.delivered_at = timezone.now()`
- Aplicar `shipment.status = new_status` y `shipment.save()`

### Task 7: Admin (`apps/shipments/admin.py`)
```python
class ShipmentItemInline(admin.TabularInline):
    model = ShipmentItem
    extra = 1

@admin.register(Shipment)
class ShipmentAdmin(admin.ModelAdmin):
    list_display = ['tracking_number', 'customer', 'status', 'destination_city', 'scheduled_date', 'calculated_cost']
    list_filter = ['status', 'destination_city', 'origin_warehouse']
    search_fields = ['tracking_number', 'customer__name', 'destination_address']
    readonly_fields = ['tracking_number', 'created_at', 'updated_at']
    inlines = [ShipmentItemInline]

@admin.register(ShipmentItem)
class ShipmentItemAdmin(admin.ModelAdmin):
    list_display = ['shipment', 'product', 'quantity', 'unit_price_at_shipment']
    list_filter = ['shipment']
```

### Task 8: Serializers (`apps/shipments/serializers.py`)
Tres serializers:

**ShipmentItemSerializer:**
- `model = ShipmentItem`
- Campos: `['id', 'shipment', 'product', 'quantity', 'unit_price_at_shipment']`
- `read_only_fields = ['id']`

**ShipmentSerializer** (lectura/escritura general):
- `model = Shipment`
- Campos: `['id', 'tracking_number', 'customer', 'origin_warehouse', 'vehicle', 'route', 'destination_address', 'destination_city', 'destination_country', 'status', 'scheduled_date', 'delivered_at', 'base_cost', 'calculated_cost', 'notes', 'created_at', 'updated_at', 'items']`
- `read_only_fields = ['id', 'tracking_number', 'delivered_at', 'calculated_cost', 'created_at', 'updated_at']`
- Campo `items` nested: `ShipmentItemSerializer(many=True, read_only=True)`

**ShipmentStatusSerializer** (solo para cambiar estado):
- `model = Shipment`
- Campos: `['status']`
- Usado exclusivamente en la acción `transition_status`

### Task 9: ViewSets (`apps/shipments/views.py`)
Dos ViewSets:

**ShipmentViewSet:**
- `queryset = Shipment.objects.all().select_related('customer', 'origin_warehouse', 'vehicle', 'route').prefetch_related('items__product')`
- `serializer_class = ShipmentSerializer`
- `filterset_fields = ['status', 'customer', 'origin_warehouse', 'vehicle', 'route']`
- `search_fields = ['tracking_number', 'destination_city', 'destination_address']`
- `ordering_fields = ['created_at', 'scheduled_date', 'status']`
- `perform_create()`: generar `tracking_number` llamando a `generate_tracking_number()` y calcular `calculated_cost` si ya tiene items (usualmente vacío al crear)
- Acción custom `@action(detail=True, methods=['post'], url_path='transition')`:
  - Recibir `{'status': 'new_status'}` en el body
  - Llamar `transition_status(shipment, new_status)` de services
  - Retornar el shipment actualizado con `ShipmentSerializer`
- **Sin soft delete** — Shipment no tiene `is_active`. El `destroy()` no aplica; deshabilitar con `http_method_names` o dejar el default (se puede dejar el default de DRF que borra el registro, ya que el ciclo de vida se maneja por estados)

**ShipmentItemViewSet:**
- `queryset = ShipmentItem.objects.all().select_related('shipment', 'product')`
- `serializer_class = ShipmentItemSerializer`
- `filterset_fields = ['shipment', 'product']`
- Sin soft delete (no tiene `is_active`)

### Task 10: URLs (`apps/shipments/urls.py`)
```python
router = DefaultRouter()
router.register(r'shipments', ShipmentViewSet, basename='shipment')
router.register(r'shipment-items', ShipmentItemViewSet, basename='shipmentitem')
urlpatterns = router.urls
```

### Task 11: Configuración global
- Agregar `'apps.shipments'` a `INSTALLED_APPS` en `config/settings.py`
- Agregar `path('api/v1/', include('apps.shipments.urls'))` en `config/urls.py`

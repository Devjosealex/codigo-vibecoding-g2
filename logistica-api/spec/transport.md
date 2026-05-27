# Spec: Transport

## Contexto
Módulo de vehículos — medio de entrega de productos al cliente. Depende de `drivers` (conductor asignado). Parte de Phase 2 de módulos.

## Dependencias
- Apps en INSTALLED_APPS antes de este módulo: `apps.drivers`
- FK externas:
  - `driver` → `drivers_driver` — `on_delete=SET_NULL, null=True, blank=True` (vehículo existe aunque se desasigne conductor)

---

## Tareas

### Task 1: Estructura de carpetas
- Crear directorio `apps/transport/`
- Crear archivos:
  - `apps/transport/__init__.py`
  - `apps/transport/models.py`
  - `apps/transport/serializers.py`
  - `apps/transport/views.py`
  - `apps/transport/urls.py`
  - `apps/transport/admin.py`
  - `apps/transport/apps.py`

### Task 2: Modelo (`apps/transport/models.py`)
Crear clase `Vehicle(models.Model)` con los siguientes campos exactos:

| Campo | Definición Django |
|-------|------------------|
| `driver` | `models.ForeignKey('drivers.Driver', on_delete=models.SET_NULL, null=True, blank=True, related_name='vehicles')` |
| `name` | `models.CharField(max_length=200)` |
| `plate_number` | `models.CharField(max_length=20, unique=True)` |
| `vehicle_type` | `models.CharField(max_length=20, choices=VEHICLE_TYPE_CHOICES)` |
| `capacity_kg` | `models.DecimalField(max_digits=10, decimal_places=2, null=True, blank=True)` |
| `capacity_m3` | `models.DecimalField(max_digits=10, decimal_places=2, null=True, blank=True)` |
| `is_active` | `models.BooleanField(default=True)` |
| `created_at` | `models.DateTimeField(auto_now_add=True)` |
| `updated_at` | `models.DateTimeField(auto_now=True)` |

Choices para `vehicle_type`:
```python
VEHICLE_TYPE_CHOICES = [
    ('truck', 'Camión'),
    ('van', 'Furgoneta'),
    ('motorcycle', 'Motocicleta'),
    ('other', 'Otro'),
]
```

```python
class Meta:
    db_table = 'transport_vehicle'
    ordering = ['-created_at']

def __str__(self):
    return f"{self.name} ({self.plate_number})"
```

### Task 3: AppConfig (`apps/transport/apps.py`)
```python
from django.apps import AppConfig

class TransportConfig(AppConfig):
    default_auto_field = 'django.db.models.BigAutoField'
    name = 'apps.transport'
```

### Task 4: Migración
- Ejecutar `python manage.py makemigrations transport`
- Ejecutar `python manage.py migrate`

### Task 5: Admin (`apps/transport/admin.py`)
```python
@admin.register(Vehicle)
class VehicleAdmin(admin.ModelAdmin):
    list_display = ['name', 'plate_number', 'vehicle_type', 'driver', 'capacity_kg', 'is_active']
    list_filter = ['vehicle_type', 'is_active']
    search_fields = ['name', 'plate_number']
```

### Task 6: Serializer (`apps/transport/serializers.py`)
- Clase `VehicleSerializer(serializers.ModelSerializer)`
- Campos explícitos: `['id', 'driver', 'name', 'plate_number', 'vehicle_type', 'capacity_kg', 'capacity_m3', 'is_active', 'created_at', 'updated_at']`
- `read_only_fields = ['id', 'created_at', 'updated_at']`
- `driver` como `PrimaryKeyRelatedField` (nullable, escritura por ID)

### Task 7: ViewSet (`apps/transport/views.py`)
- Clase `VehicleViewSet(viewsets.ModelViewSet)`
- `queryset = Vehicle.objects.filter(is_active=True).select_related('driver')`
- `serializer_class = VehicleSerializer`
- `filterset_fields = ['vehicle_type', 'driver']`
- `search_fields = ['name', 'plate_number']`
- `ordering_fields = ['name', 'plate_number', 'created_at']`
- Sobreescribir `destroy()` → soft delete (`is_active=False`)

### Task 8: URLs (`apps/transport/urls.py`)
```python
router = DefaultRouter()
router.register(r'vehicles', VehicleViewSet, basename='vehicle')
urlpatterns = router.urls
```

### Task 9: Configuración global
- Agregar `'apps.transport'` a `INSTALLED_APPS` en `config/settings.py`
- Agregar `path('api/v1/', include('apps.transport.urls'))` en `config/urls.py`

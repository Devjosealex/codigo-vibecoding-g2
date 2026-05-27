# Spec: Routes

## Contexto
Módulo de rutas — secuencia de paradas del transporte. Tiene dos modelos: `Route` (cabecera) y `RouteStop` (paradas ordenadas). `Route` depende de `warehouses` como almacén de origen. Parte de Phase 2 de módulos.

## Dependencias
- Apps en INSTALLED_APPS antes de este módulo: `apps.warehouses`
- FK externas:
  - `origin_warehouse` en Route → `warehouses_warehouse` — `on_delete=PROTECT` (no se puede borrar almacén si tiene rutas)
- FK internas:
  - `route` en RouteStop → `routes_route` — `on_delete=CASCADE` (las paradas no existen sin la ruta)

---

## Tareas

### Task 1: Estructura de carpetas
- Crear directorio `apps/routes/`
- Crear archivos:
  - `apps/routes/__init__.py`
  - `apps/routes/models.py`
  - `apps/routes/serializers.py`
  - `apps/routes/views.py`
  - `apps/routes/urls.py`
  - `apps/routes/admin.py`
  - `apps/routes/apps.py`

### Task 2: Modelo Route (`apps/routes/models.py`)
Crear clase `Route(models.Model)` con los siguientes campos exactos:

| Campo | Definición Django |
|-------|------------------|
| `name` | `models.CharField(max_length=200)` |
| `origin_warehouse` | `models.ForeignKey('warehouses.Warehouse', on_delete=models.PROTECT, related_name='routes')` |
| `distance_km` | `models.DecimalField(max_digits=10, decimal_places=2, null=True, blank=True)` |
| `estimated_duration_h` | `models.DecimalField(max_digits=6, decimal_places=2, null=True, blank=True)` |
| `is_active` | `models.BooleanField(default=True)` |
| `created_at` | `models.DateTimeField(auto_now_add=True)` |
| `updated_at` | `models.DateTimeField(auto_now=True)` |

```python
class Meta:
    db_table = 'routes_route'
    ordering = ['-created_at']

def __str__(self):
    return self.name
```

### Task 3: Modelo RouteStop (`apps/routes/models.py`)
En el mismo archivo, agregar clase `RouteStop(models.Model)`:

| Campo | Definición Django |
|-------|------------------|
| `route` | `models.ForeignKey(Route, on_delete=models.CASCADE, related_name='stops')` |
| `stop_order` | `models.IntegerField()` |
| `address` | `models.TextField()` |
| `city` | `models.CharField(max_length=100)` |
| `latitude` | `models.DecimalField(max_digits=9, decimal_places=6, null=True, blank=True)` |
| `longitude` | `models.DecimalField(max_digits=9, decimal_places=6, null=True, blank=True)` |

```python
class Meta:
    db_table = 'routes_routestop'
    ordering = ['stop_order']
    unique_together = [('route', 'stop_order')]

def __str__(self):
    return f"Parada {self.stop_order} — {self.city}"
```

**Nota:** `RouteStop` no tiene `is_active`, `created_at` ni `updated_at` — solo los campos del schema.

### Task 4: AppConfig (`apps/routes/apps.py`)
```python
from django.apps import AppConfig

class RoutesConfig(AppConfig):
    default_auto_field = 'django.db.models.BigAutoField'
    name = 'apps.routes'
```

### Task 5: Migración
- Ejecutar `python manage.py makemigrations routes`
- Ejecutar `python manage.py migrate`

### Task 6: Admin (`apps/routes/admin.py`)
```python
class RouteStopInline(admin.TabularInline):
    model = RouteStop
    extra = 1
    ordering = ['stop_order']

@admin.register(Route)
class RouteAdmin(admin.ModelAdmin):
    list_display = ['name', 'origin_warehouse', 'distance_km', 'estimated_duration_h', 'is_active']
    list_filter = ['is_active', 'origin_warehouse']
    search_fields = ['name']
    inlines = [RouteStopInline]

@admin.register(RouteStop)
class RouteStopAdmin(admin.ModelAdmin):
    list_display = ['route', 'stop_order', 'city', 'address']
    list_filter = ['route']
    ordering = ['route', 'stop_order']
```

### Task 7: Serializers (`apps/routes/serializers.py`)
Dos serializers:

**RouteStopSerializer:**
- `model = RouteStop`
- Campos: `['id', 'route', 'stop_order', 'address', 'city', 'latitude', 'longitude']`
- `read_only_fields = ['id']`

**RouteSerializer:**
- `model = Route`
- Campos: `['id', 'name', 'origin_warehouse', 'distance_km', 'estimated_duration_h', 'is_active', 'created_at', 'updated_at', 'stops']`
- `read_only_fields = ['id', 'created_at', 'updated_at']`
- Campo `stops` nested: `RouteStopSerializer(many=True, read_only=True)` — para lectura, las paradas se crean vía su propio endpoint

### Task 8: ViewSets (`apps/routes/views.py`)
Dos ViewSets:

**RouteViewSet:**
- `queryset = Route.objects.filter(is_active=True).select_related('origin_warehouse').prefetch_related('stops')`
- `serializer_class = RouteSerializer`
- `filterset_fields = ['origin_warehouse']`
- `search_fields = ['name']`
- `ordering_fields = ['name', 'distance_km', 'created_at']`
- Sobreescribir `destroy()` → soft delete (`is_active=False`)

**RouteStopViewSet:**
- `queryset = RouteStop.objects.all().select_related('route')`
- `serializer_class = RouteStopSerializer`
- `filterset_fields = ['route']`
- `ordering_fields = ['route', 'stop_order']`
- **Sin soft delete** — RouteStop no tiene `is_active`. El `destroy()` borra el registro real.

### Task 9: URLs (`apps/routes/urls.py`)
```python
router = DefaultRouter()
router.register(r'routes', RouteViewSet, basename='route')
router.register(r'route-stops', RouteStopViewSet, basename='routestop')
urlpatterns = router.urls
```

### Task 10: Configuración global
- Agregar `'apps.routes'` a `INSTALLED_APPS` en `config/settings.py`
- Agregar `path('api/v1/', include('apps.routes.urls'))` en `config/urls.py`

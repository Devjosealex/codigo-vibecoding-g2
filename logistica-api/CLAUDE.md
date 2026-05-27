# CLAUDE.md

Este archivo provee guía a Claude Code (claude.ai/code) al trabajar con el código de este repositorio.

## Reglas del Proyecto

### Idiomas
- **Documentación y comunicación:** español (comentarios en código, CLAUDE.md, mensajes al usuario)
- **Código y estructura:** inglés (nombres de variables, funciones, clases, carpetas, tablas, columnas, URLs, commits)

### Ejecución de Comandos
- **Siempre activar el entorno virtual** antes de ejecutar cualquier comando dentro del proyecto: `.venv\Scripts\activate`
- **`python manage.py runserver` nunca ejecutarlo** — ese comando siempre lo corre el usuario manualmente. Todos los demás comandos de Django y pip pueden ejecutarse normalmente.

## Contexto y Alcance del Proyecto

API REST de logística construida con Django REST Framework. Gestiona el flujo completo de envíos de productos tecnológicos: desde el proveedor y almacén, pasando por transporte y rutas, hasta la entrega al cliente.

### Módulos del Sistema

| Módulo | App Django | Descripción |
|--------|-----------|-------------|
| Cliente | `customers` | Empresa o persona que genera envíos |
| Envío | `shipments` | Unidad central de negocio — origen, destino, estado, fecha de entrega, costo calculado |
| Productos | `products` | Productos de tecnología a enviar |
| Transporte | `transport` | Medio de entrega de productos al cliente |
| Conductor | `drivers` | Persona asignada al transporte |
| Ruta | `routes` | Secuencia de paradas del transporte |
| Almacén | `warehouses` | Punto de partida y almacenamiento de productos |
| Proveedores | `suppliers` | Empresas que venden los productos |

### Relaciones Clave
- `Shipment` es la entidad central — conecta `Customer`, `Warehouse`, `Transport`, `Driver` y `Route`
- `Products` pertenecen a `Suppliers` y se almacenan en `Warehouses`
- `Transport` tiene un `Driver` asignado y sigue una `Route`

### Referencias Obligatorias

Leer ambos documentos antes de cualquier tarea de desarrollo:

| Documento | Cuándo es crítico |
|-----------|------------------|
| [`docs/database-schema.md`](docs/database-schema.md) | Modelos, migraciones, queries, FKs |
| [`docs/development-architecture.md`](docs/development-architecture.md) | Estructura de apps, settings, endpoints, convenciones |
| [`docs/mvp-scope.md`](docs/mvp-scope.md) | Alcance MVP, fases de desarrollo, módulos incluidos |

## Metodología SDD (Spec Driven Development)

**El agente orquestador gobierna todo el desarrollo.** Antes de implementar cualquier módulo, el orquestador en [`.claude/agents/orchestrator.md`](.claude/agents/orchestrator.md) define el flujo a seguir.

### Flujo obligatorio por módulo

```
SPEC → [APROBACIÓN HUMANA] → IMPLEMENT → VALIDATOR
  ↑           |                               |
  └── mejoras ┘               errores ────────┘
```

### Agentes disponibles

| Agente | Archivo | Rol |
|--------|---------|-----|
| Orquestador | `.claude/agents/orchestrator.md` | Coordina el equipo, nunca escribe código |
| Spec | `.claude/agents/spec.md` | Crea `spec/{modulo}.md` con tareas exactas |
| Implement | `.claude/agents/implement.md` | Implementa código siguiendo el spec |
| Validator | `.claude/agents/validator.md` | Revisa código, reporta errores o confirma OK |

### Carpeta spec/

Los archivos de spec se crean en `spec/` (carpeta en raíz del proyecto):
- `spec/{modulo}.md` — tareas del módulo (creado por agente Spec)
- `spec/{modulo}-validation.md` — errores encontrados (creado por agente Validator, solo si hay errores)

## Skills Disponibles (django-skills)

Usar estas skills para tareas Django — se activan por contexto o invocando el comando directamente:

| Skill | Cuándo usar | Comando |
|-------|-------------|---------|
| `fix-types` | Errores de mypy / type checking | `/fix-types` |
| `upgrade-python-deps` | Actualizar dependencias Python | `/upgrade-python-deps` |
| `upgrade-js-deps` | Actualizar dependencias JS (cuando aplique) | `/upgrade-js-deps` |

## Comandos

```bash
# Activar entorno virtual (Windows)
.venv\Scripts\activate

# Instalar dependencias
pip install -r requirements.txt

# Servidor de desarrollo
python manage.py runserver

# Migraciones
python manage.py makemigrations
python manage.py migrate

# Ejecutar todos los tests
python manage.py test

# Ejecutar tests de una app
python manage.py test products
```

## Arquitectura

API de logística con Django 6.0.5 + Django REST Framework 3.17.1. La configuración del proyecto vive en `config/` (no es una app).

**Estado actual — esqueleto:**
- `products/` existe pero sin modelos, vistas ni URLs
- `products` NO está en `INSTALLED_APPS` — agregar al definir modelos
- DRF (`rest_framework`) NO está en `INSTALLED_APPS` — agregar al construir vistas API
- `config/urls.py` solo tiene la ruta del admin — conectar URLs de apps via `include()`

**Configuración pendiente:**
- `python-decouple` instalado pero `config/settings.py` aún usa valores hardcodeados. Usar `decouple.config()` para `SECRET_KEY`, `DEBUG`, `ALLOWED_HOSTS` y `DATABASES`
- `psycopg2-binary` instalado — la DB migrará de SQLite a PostgreSQL. Usar decouple para credenciales
- No existe `.env` aún — crear con `SECRET_KEY`, `DEBUG` y variables `DB_*`

**Flujo para agregar endpoints DRF:**
1. Definir modelo en `products/models.py`
2. Crear serializer en `products/serializers.py`
3. Crear viewset/APIView en `products/views.py`
4. Agregar `products/urls.py` con router o paths
5. Incluir en `config/urls.py` via `include('products.urls')`

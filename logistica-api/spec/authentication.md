# authentication — Spec de Implementación (Backend Django)

> **Para agentes de implementación:** Leer `docs/database-schema.md` y `docs/development-architecture.md` antes de empezar.

**Goal:** Extender `apps/authentication` con JWT customizado que inyecta `is_superuser`, y CRUD de usuarios/grupos/permisos restringido a superadmin.

**Architecture:** Un solo módulo Django (`apps/authentication`) sin modelos propios — opera sobre `django.contrib.auth.models.User`, `Group` y `Permission`. El JWT custom agrega `is_superuser` al payload en el token de acceso. Todos los endpoints de gestión exigen `IsSuperAdmin`.

**Tech Stack:** Django 6.0.5, DRF 3.17.1, djangorestframework-simplejwt (ya instalado), Django built-in User/Group/Permission.

---

## Mapa de archivos

| Archivo | Acción | Responsabilidad |
|---------|--------|-----------------|
| `apps/authentication/serializers.py` | CREAR | CustomTokenObtainPairSerializer + UserSerializer + GroupSerializer + PermissionSerializer |
| `apps/authentication/permissions.py` | CREAR | IsSuperAdmin permission class |
| `apps/authentication/views.py` | CREAR | CustomTokenObtainPairView, UserViewSet, GroupViewSet, PermissionListView |
| `apps/authentication/urls.py` | CREAR | Router para users/groups + path para permissions + token view |
| `config/urls.py` | MODIFICAR | Reemplazar TokenObtainPairView por CustomTokenObtainPairView; agregar `api/v1/auth/` |

---

## Tarea 1 — Serializer custom para JWT con `is_superuser`

**Archivo:** `apps/authentication/serializers.py`

### Paso 1: Crear el archivo con CustomTokenObtainPairSerializer

```python
# apps/authentication/serializers.py
from django.contrib.auth.models import User, Group, Permission
from rest_framework import serializers
from rest_framework_simplejwt.serializers import TokenObtainPairSerializer


class CustomTokenObtainPairSerializer(TokenObtainPairSerializer):
    @classmethod
    def get_token(cls, user):
        token = super().get_token(user)
        token['is_superuser'] = user.is_superuser
        return token


class PermissionSerializer(serializers.ModelSerializer):
    class Meta:
        model = Permission
        fields = ['id', 'name', 'codename', 'content_type']


class GroupSerializer(serializers.ModelSerializer):
    permissions = PermissionSerializer(many=True, read_only=True)
    permission_ids = serializers.PrimaryKeyRelatedField(
        many=True,
        queryset=Permission.objects.all(),
        source='permissions',
        write_only=True,
        required=False,
    )

    class Meta:
        model = Group
        fields = ['id', 'name', 'permissions', 'permission_ids']


class UserSerializer(serializers.ModelSerializer):
    groups = GroupSerializer(many=True, read_only=True)
    password = serializers.CharField(write_only=True, required=False, allow_blank=True)

    class Meta:
        model = User
        fields = [
            'id', 'username', 'email', 'first_name', 'last_name',
            'is_active', 'is_staff', 'is_superuser',
            'groups', 'password',
            'date_joined', 'last_login',
        ]
        read_only_fields = ['id', 'date_joined', 'last_login']

    def create(self, validated_data):
        password = validated_data.pop('password', None)
        user = User(**validated_data)
        if password:
            user.set_password(password)
        else:
            user.set_unusable_password()
        user.save()
        return user

    def update(self, instance, validated_data):
        password = validated_data.pop('password', None)
        for attr, value in validated_data.items():
            setattr(instance, attr, value)
        if password:
            instance.set_password(password)
        instance.save()
        return instance
```

### Paso 2: Verificar que no hay errores de importación

```bash
cd C:\Users\User\dev\codigo-vibecoding-g2\logistica-api
.venv\Scripts\activate
python -c "from apps.authentication.serializers import CustomTokenObtainPairSerializer, UserSerializer, GroupSerializer, PermissionSerializer; print('OK')"
```

Resultado esperado: `OK`

---

## Tarea 2 — IsSuperAdmin permission class

**Archivo:** `apps/authentication/permissions.py`

### Paso 1: Crear el archivo

```python
# apps/authentication/permissions.py
from rest_framework.permissions import BasePermission


class IsSuperAdmin(BasePermission):
    """Permite acceso solo a usuarios con is_superuser=True."""

    message = 'Se requieren privilegios de superadmin.'

    def has_permission(self, request, view):
        return bool(
            request.user and
            request.user.is_authenticated and
            request.user.is_superuser
        )
```

### Paso 2: Verificar importación

```bash
python -c "from apps.authentication.permissions import IsSuperAdmin; print('OK')"
```

Resultado esperado: `OK`

---

## Tarea 3 — Views: CustomTokenObtainPairView, UserViewSet, GroupViewSet, PermissionListView

**Archivo:** `apps/authentication/views.py`

### Paso 1: Crear el archivo

```python
# apps/authentication/views.py
from django.contrib.auth.models import User, Group, Permission
from rest_framework import viewsets, status
from rest_framework.decorators import action
from rest_framework.response import Response
from rest_framework.views import APIView
from rest_framework_simplejwt.views import TokenObtainPairView

from .permissions import IsSuperAdmin
from .serializers import (
    CustomTokenObtainPairSerializer,
    UserSerializer,
    GroupSerializer,
    PermissionSerializer,
)


class CustomTokenObtainPairView(TokenObtainPairView):
    serializer_class = CustomTokenObtainPairSerializer


class UserViewSet(viewsets.ModelViewSet):
    queryset = User.objects.all().order_by('id')
    serializer_class = UserSerializer
    permission_classes = [IsSuperAdmin]
    search_fields = ['username', 'email', 'first_name', 'last_name']
    ordering_fields = ['username', 'date_joined']

    def destroy(self, request, *args, **kwargs):
        """Soft delete — desactiva el usuario en lugar de eliminarlo."""
        user = self.get_object()
        user.is_active = False
        user.save()
        return Response(status=status.HTTP_204_NO_CONTENT)

    @action(detail=True, methods=['post'], url_path='set_groups')
    def set_groups(self, request, pk=None):
        """
        Asigna grupos a un usuario. Reemplaza todos los grupos actuales.

        Body: { "group_ids": [1, 2, 3] }
        """
        user = self.get_object()
        group_ids = request.data.get('group_ids', [])

        if not isinstance(group_ids, list):
            return Response(
                {'detail': 'group_ids debe ser una lista de enteros.'},
                status=status.HTTP_400_BAD_REQUEST,
            )

        groups = Group.objects.filter(id__in=group_ids)
        if len(groups) != len(group_ids):
            return Response(
                {'detail': 'Uno o más group_ids no existen.'},
                status=status.HTTP_400_BAD_REQUEST,
            )

        user.groups.set(groups)
        serializer = self.get_serializer(user)
        return Response(serializer.data)


class GroupViewSet(viewsets.ModelViewSet):
    queryset = Group.objects.all().order_by('id')
    serializer_class = GroupSerializer
    permission_classes = [IsSuperAdmin]
    search_fields = ['name']
    ordering_fields = ['name']


class PermissionListView(APIView):
    permission_classes = [IsSuperAdmin]

    def get(self, request):
        permissions = Permission.objects.select_related('content_type').all().order_by('content_type', 'codename')
        serializer = PermissionSerializer(permissions, many=True)
        return Response(serializer.data)
```

### Paso 2: Verificar importación

```bash
python -c "from apps.authentication.views import CustomTokenObtainPairView, UserViewSet, GroupViewSet, PermissionListView; print('OK')"
```

Resultado esperado: `OK`

---

## Tarea 4 — URLs de la app authentication

**Archivo:** `apps/authentication/urls.py`

### Paso 1: Crear el archivo

```python
# apps/authentication/urls.py
from django.urls import path
from rest_framework.routers import DefaultRouter
from .views import UserViewSet, GroupViewSet, PermissionListView

router = DefaultRouter()
router.register(r'users', UserViewSet, basename='auth-user')
router.register(r'groups', GroupViewSet, basename='auth-group')

urlpatterns = router.urls + [
    path('permissions/', PermissionListView.as_view(), name='auth-permissions'),
]
```

### Paso 2: Verificar importación

```bash
python -c "from apps.authentication.urls import urlpatterns; print(f'OK — {len(urlpatterns)} patterns')"
```

Resultado esperado: `OK — N patterns` (N >= 1)

---

## Tarea 5 — Actualizar config/urls.py

**Archivo:** `config/urls.py`

### Paso 1: Reemplazar el contenido con las rutas actualizadas

Estado actual del archivo:
```python
from django.contrib import admin
from django.urls import path, include
from rest_framework_simplejwt.views import TokenObtainPairView, TokenRefreshView
from drf_spectacular.views import SpectacularAPIView, SpectacularSwaggerView

urlpatterns = [
    path('admin/', admin.site.urls),
    path('api/auth/token/', TokenObtainPairView.as_view(), name='token_obtain_pair'),
    path('api/auth/token/refresh/', TokenRefreshView.as_view(), name='token_refresh'),
    ...
]
```

Reemplazar por:
```python
# config/urls.py
from django.contrib import admin
from django.urls import path, include
from rest_framework_simplejwt.views import TokenRefreshView
from drf_spectacular.views import SpectacularAPIView, SpectacularSwaggerView
from apps.authentication.views import CustomTokenObtainPairView

urlpatterns = [
    path('admin/', admin.site.urls),
    # Auth JWT — custom view que inyecta is_superuser en el token
    path('api/auth/token/', CustomTokenObtainPairView.as_view(), name='token_obtain_pair'),
    path('api/auth/token/refresh/', TokenRefreshView.as_view(), name='token_refresh'),
    # API Docs
    path('api/schema/', SpectacularAPIView.as_view(), name='schema'),
    path('api/docs/', SpectacularSwaggerView.as_view(url_name='schema'), name='swagger-ui'),
    # Phase 0 modules
    path('api/v1/', include('apps.customers.urls')),
    path('api/v1/', include('apps.suppliers.urls')),
    path('api/v1/', include('apps.warehouses.urls')),
    # Phase 1 modules
    path('api/v1/', include('apps.products.urls')),
    path('api/v1/', include('apps.drivers.urls')),
    # Phase 2 modules
    path('api/v1/', include('apps.transport.urls')),
    path('api/v1/', include('apps.routes.urls')),
    # Phase 3 modules
    path('api/v1/', include('apps.shipments.urls')),
    # Authentication management (superadmin only)
    path('api/v1/auth/', include('apps.authentication.urls')),
]
```

### Paso 2: Verificar que Django acepta la configuración

```bash
python manage.py check
```

Resultado esperado: `System check identified no issues (0 silenced).`

---

## Tarea 6 — Tests para el módulo authentication

**Archivo:** `apps/authentication/tests/test_auth.py` (ya existe — agregar tests nuevos al final del archivo existente)

### Paso 1: Agregar los nuevos tests al archivo existente

Los tests a agregar al final de `apps/authentication/tests/test_auth.py`:

```python
# ------------------------------------------------------------------ #
# Tests para JWT custom con is_superuser                              #
# ------------------------------------------------------------------ #

class CustomJWTPayloadTest(APITestCase):
    """Verifica que is_superuser se inyecta en el payload del JWT."""

    TOKEN_URL = '/api/auth/token/'

    def setUp(self):
        self.regular_user = User.objects.create_user(
            username='regular', password='Pass123!', is_superuser=False
        )
        self.super_user = User.objects.create_user(
            username='superadmin', password='Pass123!', is_superuser=True
        )

    def _decode_payload(self, token):
        import base64
        import json
        payload_b64 = token.split('.')[1]
        # Agregar padding necesario para base64
        padding = 4 - len(payload_b64) % 4
        if padding != 4:
            payload_b64 += '=' * padding
        return json.loads(base64.b64decode(payload_b64))

    def test_token_contains_is_superuser_false_for_regular_user(self):
        resp = self.client.post(self.TOKEN_URL, {'username': 'regular', 'password': 'Pass123!'}, format='json')
        self.assertEqual(resp.status_code, 200)
        payload = self._decode_payload(resp.data['access'])
        self.assertIn('is_superuser', payload)
        self.assertFalse(payload['is_superuser'])

    def test_token_contains_is_superuser_true_for_superadmin(self):
        resp = self.client.post(self.TOKEN_URL, {'username': 'superadmin', 'password': 'Pass123!'}, format='json')
        self.assertEqual(resp.status_code, 200)
        payload = self._decode_payload(resp.data['access'])
        self.assertIn('is_superuser', payload)
        self.assertTrue(payload['is_superuser'])


# ------------------------------------------------------------------ #
# Tests para IsSuperAdmin permission                                   #
# ------------------------------------------------------------------ #

class UserViewSetSuperAdminTest(APITestCase):
    """Verifica que UserViewSet es inaccesible a usuarios no-superadmin."""

    USERS_URL = '/api/v1/auth/users/'

    def setUp(self):
        self.regular_user = User.objects.create_user(username='regular2', password='Pass123!')
        self.super_user = User.objects.create_user(
            username='superadmin2', password='Pass123!', is_superuser=True
        )

    def _get_token(self, username, password):
        from rest_framework_simplejwt.tokens import RefreshToken
        user = User.objects.get(username=username)
        return str(RefreshToken.for_user(user).access_token)

    def test_unauthenticated_returns_401(self):
        resp = self.client.get(self.USERS_URL)
        self.assertEqual(resp.status_code, 401)

    def test_regular_user_returns_403(self):
        token = self._get_token('regular2', 'Pass123!')
        self.client.credentials(HTTP_AUTHORIZATION=f'Bearer {token}')
        resp = self.client.get(self.USERS_URL)
        self.assertEqual(resp.status_code, 403)

    def test_superadmin_can_list_users(self):
        token = self._get_token('superadmin2', 'Pass123!')
        self.client.credentials(HTTP_AUTHORIZATION=f'Bearer {token}')
        resp = self.client.get(self.USERS_URL)
        self.assertEqual(resp.status_code, 200)
        self.assertIn('results', resp.data)

    def test_superadmin_can_create_user(self):
        token = self._get_token('superadmin2', 'Pass123!')
        self.client.credentials(HTTP_AUTHORIZATION=f'Bearer {token}')
        resp = self.client.post(self.USERS_URL, {
            'username': 'newuser',
            'password': 'NewPass123!',
            'email': 'new@test.com',
        }, format='json')
        self.assertEqual(resp.status_code, 201)
        self.assertEqual(resp.data['username'], 'newuser')

    def test_set_groups_assigns_groups_to_user(self):
        from django.contrib.auth.models import Group
        group = Group.objects.create(name='Operadores')
        target_user = User.objects.create_user(username='target', password='Pass123!')
        token = self._get_token('superadmin2', 'Pass123!')
        self.client.credentials(HTTP_AUTHORIZATION=f'Bearer {token}')
        resp = self.client.post(
            f'/api/v1/auth/users/{target_user.id}/set_groups/',
            {'group_ids': [group.id]},
            format='json',
        )
        self.assertEqual(resp.status_code, 200)
        target_user.refresh_from_db()
        self.assertIn(group, target_user.groups.all())


class GroupViewSetTest(APITestCase):
    """Verifica CRUD de grupos para superadmin."""

    GROUPS_URL = '/api/v1/auth/groups/'

    def setUp(self):
        self.super_user = User.objects.create_user(
            username='superadmin3', password='Pass123!', is_superuser=True
        )
        from rest_framework_simplejwt.tokens import RefreshToken
        token = str(RefreshToken.for_user(self.super_user).access_token)
        self.client.credentials(HTTP_AUTHORIZATION=f'Bearer {token}')

    def test_superadmin_can_list_groups(self):
        resp = self.client.get(self.GROUPS_URL)
        self.assertEqual(resp.status_code, 200)

    def test_superadmin_can_create_group(self):
        resp = self.client.post(self.GROUPS_URL, {'name': 'Supervisores'}, format='json')
        self.assertEqual(resp.status_code, 201)
        self.assertEqual(resp.data['name'], 'Supervisores')

    def test_superadmin_can_delete_group(self):
        from django.contrib.auth.models import Group
        group = Group.objects.create(name='ToDelete')
        resp = self.client.delete(f'{self.GROUPS_URL}{group.id}/')
        self.assertEqual(resp.status_code, 204)


class PermissionListViewTest(APITestCase):
    """Verifica que PermissionListView lista permisos solo para superadmin."""

    PERMS_URL = '/api/v1/auth/permissions/'

    def setUp(self):
        self.regular_user = User.objects.create_user(username='regular3', password='Pass123!')
        self.super_user = User.objects.create_user(
            username='superadmin4', password='Pass123!', is_superuser=True
        )

    def _get_token(self, user):
        from rest_framework_simplejwt.tokens import RefreshToken
        return str(RefreshToken.for_user(user).access_token)

    def test_regular_user_cannot_list_permissions(self):
        self.client.credentials(HTTP_AUTHORIZATION=f'Bearer {self._get_token(self.regular_user)}')
        resp = self.client.get(self.PERMS_URL)
        self.assertEqual(resp.status_code, 403)

    def test_superadmin_can_list_permissions(self):
        self.client.credentials(HTTP_AUTHORIZATION=f'Bearer {self._get_token(self.super_user)}')
        resp = self.client.get(self.PERMS_URL)
        self.assertEqual(resp.status_code, 200)
        self.assertIsInstance(resp.data, list)
        if resp.data:
            self.assertIn('id', resp.data[0])
            self.assertIn('codename', resp.data[0])
```

### Paso 2: Ejecutar todos los tests del módulo authentication

```bash
python manage.py test apps.authentication --verbosity=2
```

Resultado esperado: todos los tests pasan (los 6 originales + los nuevos).

---

## Rutas finales expuestas

| Método | URL | Descripción |
|--------|-----|-------------|
| POST | `/api/auth/token/` | Login JWT — devuelve `access` + `refresh` con `is_superuser` en payload |
| POST | `/api/auth/token/refresh/` | Renovar access token |
| GET | `/api/v1/auth/users/` | Listar usuarios (superadmin) |
| POST | `/api/v1/auth/users/` | Crear usuario (superadmin) |
| GET | `/api/v1/auth/users/{id}/` | Detalle usuario (superadmin) |
| PUT | `/api/v1/auth/users/{id}/` | Actualizar usuario (superadmin) |
| PATCH | `/api/v1/auth/users/{id}/` | Actualizar parcial usuario (superadmin) |
| DELETE | `/api/v1/auth/users/{id}/` | Eliminar usuario (superadmin) |
| POST | `/api/v1/auth/users/{id}/set_groups/` | Asignar grupos a usuario (superadmin) |
| GET | `/api/v1/auth/groups/` | Listar grupos (superadmin) |
| POST | `/api/v1/auth/groups/` | Crear grupo (superadmin) |
| GET | `/api/v1/auth/groups/{id}/` | Detalle grupo (superadmin) |
| PUT | `/api/v1/auth/groups/{id}/` | Actualizar grupo (superadmin) |
| PATCH | `/api/v1/auth/groups/{id}/` | Actualizar parcial grupo (superadmin) |
| DELETE | `/api/v1/auth/groups/{id}/` | Eliminar grupo (superadmin) |
| GET | `/api/v1/auth/permissions/` | Listar todos los permisos disponibles (superadmin) |

## Notas importantes

- No se crean migraciones — el módulo opera sobre tablas de `django.contrib.auth` que ya existen.
- El test `test_auth.py` existente no se modifica; los nuevos tests se agregan al final del mismo archivo.
- `IsSuperAdmin` verifica tanto `is_authenticated` como `is_superuser` — no confiar en que JWT Authentication ya validó al usuario.
- `UserSerializer.update` no cambia el password si `password` viene vacío o ausente — comportamiento seguro por defecto.
- `set_groups` reemplaza todos los grupos del usuario (no acumula) — semántica de "set" completo.

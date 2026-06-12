"""
Tests para los endpoints de autenticación JWT (simplejwt).

Endpoints cubiertos:
  POST /api/auth/token/          — obtener access + refresh token
  POST /api/auth/token/refresh/  — renovar access token
  GET  /api/v1/customers/        — endpoint protegido para validar JWT
"""

from django.contrib.auth.models import User
from rest_framework import status
from rest_framework.test import APITestCase
from rest_framework_simplejwt.tokens import RefreshToken


class AuthEndpointTest(APITestCase):
    """Tests para los endpoints JWT de simplejwt."""

    TOKEN_URL = '/api/auth/token/'
    REFRESH_URL = '/api/auth/token/refresh/'
    PROTECTED_URL = '/api/v1/customers/'

    def setUp(self):
        """Crear usuario de prueba para todos los tests."""
        self.username = 'testuser'
        self.password = 'SecurePass123!'
        self.user = User.objects.create_user(
            username=self.username,
            password=self.password,
            email='testuser@logistica.pe',
        )

    # ------------------------------------------------------------------ #
    # Happy path                                                           #
    # ------------------------------------------------------------------ #

    def test_obtain_token_with_valid_credentials_returns_200(self):
        """POST /api/auth/token/ con credenciales válidas → 200 + access + refresh."""
        response = self.client.post(
            self.TOKEN_URL,
            {'username': self.username, 'password': self.password},
            format='json',
        )
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertIn('access', response.data)
        self.assertIn('refresh', response.data)

    def test_refresh_token_with_valid_refresh_returns_200(self):
        """POST /api/auth/token/refresh/ con refresh válido → 200 + nuevo access."""
        # Primero obtenemos tokens reales desde la vista
        obtain_response = self.client.post(
            self.TOKEN_URL,
            {'username': self.username, 'password': self.password},
            format='json',
        )
        refresh_token = obtain_response.data['refresh']

        # Ahora usamos el refresh token para obtener un nuevo access token
        response = self.client.post(
            self.REFRESH_URL,
            {'refresh': refresh_token},
            format='json',
        )
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertIn('access', response.data)

    def test_jwt_access_token_works_on_protected_endpoint(self):
        """JWT obtenido funciona en endpoint protegido GET /api/v1/customers/ → 200."""
        # Generamos un access token directamente con simplejwt
        refresh = RefreshToken.for_user(self.user)
        access_token = str(refresh.access_token)

        self.client.credentials(HTTP_AUTHORIZATION=f'Bearer {access_token}')
        response = self.client.get(self.PROTECTED_URL)
        self.assertEqual(response.status_code, status.HTTP_200_OK)

    # ------------------------------------------------------------------ #
    # Unhappy path                                                         #
    # ------------------------------------------------------------------ #

    def test_obtain_token_with_wrong_password_returns_401(self):
        """POST /api/auth/token/ con password incorrecto → 401."""
        response = self.client.post(
            self.TOKEN_URL,
            {'username': self.username, 'password': 'WrongPassword!'},
            format='json',
        )
        self.assertEqual(response.status_code, status.HTTP_401_UNAUTHORIZED)

    def test_obtain_token_with_empty_fields_returns_400(self):
        """POST /api/auth/token/ con campos vacíos → 400."""
        response = self.client.post(
            self.TOKEN_URL,
            {'username': '', 'password': ''},
            format='json',
        )
        self.assertEqual(response.status_code, status.HTTP_400_BAD_REQUEST)

    def test_refresh_with_invalid_token_returns_401(self):
        """POST /api/auth/token/refresh/ con token inválido → 401."""
        response = self.client.post(
            self.REFRESH_URL,
            {'refresh': 'esto.no.es.un.jwt.valido'},
            format='json',
        )
        self.assertEqual(response.status_code, status.HTTP_401_UNAUTHORIZED)

    # ------------------------------------------------------------------ #
    # Edge cases — autenticación en endpoints protegidos                   #
    # ------------------------------------------------------------------ #

    def test_modified_jwt_on_protected_endpoint_returns_401(self):
        """JWT inválido/modificado en endpoint protegido → 401."""
        # Generamos un token válido y lo modificamos
        refresh = RefreshToken.for_user(self.user)
        valid_token = str(refresh.access_token)
        # Modificar el payload del token para invalidarlo
        parts = valid_token.split('.')
        tampered_token = parts[0] + '.' + parts[1] + 'TAMPERED' + '.' + parts[2]

        self.client.credentials(HTTP_AUTHORIZATION=f'Bearer {tampered_token}')
        response = self.client.get(self.PROTECTED_URL)
        self.assertEqual(response.status_code, status.HTTP_401_UNAUTHORIZED)

    def test_no_authorization_header_on_protected_endpoint_returns_401(self):
        """Sin Authorization header en endpoint protegido → 401."""
        # Aseguramos que no hay credenciales configuradas
        self.client.credentials()
        response = self.client.get(self.PROTECTED_URL)
        self.assertEqual(response.status_code, status.HTTP_401_UNAUTHORIZED)


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

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

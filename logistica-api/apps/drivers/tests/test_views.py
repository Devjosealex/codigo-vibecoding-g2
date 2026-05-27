from rest_framework.test import APITestCase
from rest_framework import status
from rest_framework_simplejwt.tokens import RefreshToken
from django.contrib.auth.models import User
from apps.drivers.models import Driver


class DriverViewTest(APITestCase):
    def setUp(self):
        # Usuario con JWT — proyecto usa JWTAuthentication (simplejwt)
        self.user = User.objects.create_user(
            username='testuser', password='testpass123'
        )
        refresh = RefreshToken.for_user(self.user)
        self.client.credentials(HTTP_AUTHORIZATION=f'Bearer {refresh.access_token}')

        # Instancia principal de prueba
        self.driver = Driver.objects.create(
            first_name='Ricardo',
            last_name='Villalobos',
            document_number='44455566',
            license_number='R12-2024',
            license_expiry='2027-11-30',
            phone='976543210',
            email='ricardo.v@transporteslima.pe',
        )
        self.url_list = '/api/v1/drivers/'
        self.url_detail = f'/api/v1/drivers/{self.driver.pk}/'

    # Happy path — CRUD completo

    def test_list_drivers_returns_200(self):
        """GET lista retorna 200 con resultados paginados."""
        response = self.client.get(self.url_list)
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertIn('results', response.data)

    def test_list_drivers_contains_driver(self):
        """GET lista incluye el conductor creado en setUp."""
        response = self.client.get(self.url_list)
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        ids = [item['id'] for item in response.data['results']]
        self.assertIn(self.driver.pk, ids)

    def test_create_driver_returns_201(self):
        """POST con datos válidos crea objeto y retorna 201."""
        data = {
            'first_name': 'Lucía',
            'last_name': 'Ccari',
            'document_number': '88899900',
            'license_number': 'L05-2025',
            'license_expiry': '2029-04-20',
            'phone': '965432100',
            'email': 'lucia.ccari@logistica.pe',
        }
        response = self.client.post(self.url_list, data, format='json')
        self.assertEqual(response.status_code, status.HTTP_201_CREATED)
        self.assertEqual(Driver.objects.count(), 2)

    def test_create_driver_data_persisted(self):
        """POST crea el conductor con los datos correctos en DB."""
        data = {
            'first_name': 'Roberto',
            'last_name': 'Pinto',
            'document_number': '77700011',
            'license_number': 'R99-2026',
            'license_expiry': '2030-07-15',
        }
        response = self.client.post(self.url_list, data, format='json')
        self.assertEqual(response.status_code, status.HTTP_201_CREATED)
        driver = Driver.objects.get(pk=response.data['id'])
        self.assertEqual(driver.first_name, 'Roberto')
        self.assertEqual(driver.last_name, 'Pinto')

    def test_retrieve_driver_returns_200(self):
        """GET detalle retorna 200 con datos del objeto."""
        response = self.client.get(self.url_detail)
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertEqual(response.data['id'], self.driver.pk)
        self.assertEqual(response.data['first_name'], 'Ricardo')

    def test_partial_update_driver_returns_200(self):
        """PATCH actualiza campo y retorna 200."""
        data = {'phone': '911222333'}
        response = self.client.patch(self.url_detail, data, format='json')
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.driver.refresh_from_db()
        self.assertEqual(self.driver.phone, '911222333')

    def test_full_update_driver_returns_200(self):
        """PUT actualiza todos los campos y retorna 200."""
        data = {
            'first_name': 'Ricardo',
            'last_name': 'Villalobos',
            'document_number': '44455566',
            'license_number': 'R12-2024',
            'license_expiry': '2028-03-01',
            'phone': '900111222',
            'email': 'nuevo.email@logistica.pe',
        }
        response = self.client.put(self.url_detail, data, format='json')
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.driver.refresh_from_db()
        self.assertEqual(self.driver.license_expiry.isoformat(), '2028-03-01')

    def test_soft_delete_driver_returns_204(self):
        """DELETE retorna 204 y marca is_active=False sin borrar de DB."""
        response = self.client.delete(self.url_detail)
        self.assertEqual(response.status_code, status.HTTP_204_NO_CONTENT)
        self.driver.refresh_from_db()
        self.assertFalse(self.driver.is_active)
        # Registro persiste en DB
        self.assertTrue(Driver.objects.filter(pk=self.driver.pk).exists())

    def test_list_excludes_inactive_drivers(self):
        """Objetos con is_active=False no aparecen en GET lista."""
        self.driver.is_active = False
        self.driver.save()
        response = self.client.get(self.url_list)
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        ids = [item['id'] for item in response.data['results']]
        self.assertNotIn(self.driver.pk, ids)

    # Unhappy path

    def test_create_driver_missing_required_fields_returns_400(self):
        """POST sin campos requeridos retorna 400."""
        data = {}
        response = self.client.post(self.url_list, data, format='json')
        self.assertEqual(response.status_code, status.HTTP_400_BAD_REQUEST)

    def test_create_driver_missing_first_name_returns_400(self):
        """POST sin first_name retorna 400."""
        data = {
            'last_name': 'Sinombre',
            'document_number': '00011122',
            'license_number': 'X00-2025',
            'license_expiry': '2027-01-01',
        }
        response = self.client.post(self.url_list, data, format='json')
        self.assertEqual(response.status_code, status.HTTP_400_BAD_REQUEST)
        self.assertIn('first_name', response.data)

    def test_create_driver_duplicate_document_returns_400(self):
        """POST con document_number duplicado retorna 400."""
        data = {
            'first_name': 'Duplicado',
            'last_name': 'Doc',
            'document_number': '44455566',  # mismo que setUp
            'license_number': 'D99-2025',
            'license_expiry': '2026-06-01',
        }
        response = self.client.post(self.url_list, data, format='json')
        self.assertEqual(response.status_code, status.HTTP_400_BAD_REQUEST)

    def test_retrieve_nonexistent_driver_returns_404(self):
        """GET con id inexistente retorna 404."""
        response = self.client.get('/api/v1/drivers/99999/')
        self.assertEqual(response.status_code, status.HTTP_404_NOT_FOUND)

    def test_update_nonexistent_driver_returns_404(self):
        """PATCH con id inexistente retorna 404."""
        response = self.client.patch('/api/v1/drivers/99999/', {'phone': '000'}, format='json')
        self.assertEqual(response.status_code, status.HTTP_404_NOT_FOUND)

    def test_delete_nonexistent_driver_returns_404(self):
        """DELETE con id inexistente retorna 404."""
        response = self.client.delete('/api/v1/drivers/99999/')
        self.assertEqual(response.status_code, status.HTTP_404_NOT_FOUND)

    # Edge cases — autenticación

    def test_unauthenticated_list_returns_401(self):
        """GET sin JWT retorna 401."""
        self.client.credentials()  # quitar Bearer token
        response = self.client.get(self.url_list)
        self.assertEqual(response.status_code, status.HTTP_401_UNAUTHORIZED)

    def test_unauthenticated_create_returns_401(self):
        """POST sin JWT retorna 401."""
        self.client.credentials()
        response = self.client.post(self.url_list, {}, format='json')
        self.assertEqual(response.status_code, status.HTTP_401_UNAUTHORIZED)

    def test_unauthenticated_retrieve_returns_401(self):
        """GET detalle sin JWT retorna 401."""
        self.client.credentials()
        response = self.client.get(self.url_detail)
        self.assertEqual(response.status_code, status.HTTP_401_UNAUTHORIZED)

    def test_unauthenticated_delete_returns_401(self):
        """DELETE sin JWT retorna 401."""
        self.client.credentials()
        response = self.client.delete(self.url_detail)
        self.assertEqual(response.status_code, status.HTTP_401_UNAUTHORIZED)

    # Soft-deleted driver no aparece en detalle

    def test_retrieve_inactive_driver_returns_404(self):
        """GET detalle de conductor inactivo (soft-deleted) retorna 404 (queryset filtra activos)."""
        self.driver.is_active = False
        self.driver.save()
        response = self.client.get(self.url_detail)
        self.assertEqual(response.status_code, status.HTTP_404_NOT_FOUND)

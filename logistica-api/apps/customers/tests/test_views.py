from rest_framework.test import APITestCase
from rest_framework import status
from rest_framework_simplejwt.tokens import RefreshToken
from django.contrib.auth.models import User
from apps.customers.models import Customer


class CustomerViewTest(APITestCase):
    def setUp(self):
        # Usuario con JWT — proyecto usa JWTAuthentication (simplejwt)
        self.user = User.objects.create_user(
            username='testuser', password='testpass123'
        )
        refresh = RefreshToken.for_user(self.user)
        self.client.credentials(HTTP_AUTHORIZATION=f'Bearer {refresh.access_token}')

        # Instancia de prueba
        self.customer = Customer.objects.create(
            name='Transportes Lima SAC',
            customer_type='company',
            tax_id='20123456789',
            email='contacto@transporteslima.pe',
            phone='01-4567890',
            address='Av. Industrial 456, Lima',
            city='Lima',
            country='Peru',
        )
        self.url_list = '/api/v1/customers/'
        self.url_detail = f'/api/v1/customers/{self.customer.pk}/'

    # ── Happy path — CRUD completo ──────────────────────────────────────

    def test_list_customers_returns_200(self):
        """GET lista retorna 200 con resultados paginados."""
        response = self.client.get(self.url_list)
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertIn('results', response.data)

    def test_list_customers_contains_created_customer(self):
        """GET lista incluye el cliente creado en setUp."""
        response = self.client.get(self.url_list)
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        ids = [item['id'] for item in response.data['results']]
        self.assertIn(self.customer.pk, ids)

    def test_create_customer_returns_201(self):
        """POST con datos válidos crea objeto y retorna 201."""
        data = {
            'name': 'Almacenes Trujillo SRL',
            'customer_type': 'company',
            'tax_id': '20555666777',
            'email': 'info@trujillosrl.pe',
            'city': 'Trujillo',
        }
        response = self.client.post(self.url_list, data, format='json')
        self.assertEqual(response.status_code, status.HTTP_201_CREATED)
        self.assertEqual(Customer.objects.count(), 2)

    def test_create_customer_persists_data(self):
        """POST crea cliente con los datos correctos en DB."""
        data = {
            'name': 'Distribuidora Cusco SAC',
            'customer_type': 'company',
            'tax_id': '20888999000',
            'email': 'ventas@cusco.pe',
            'city': 'Cusco',
        }
        response = self.client.post(self.url_list, data, format='json')
        self.assertEqual(response.status_code, status.HTTP_201_CREATED)
        customer = Customer.objects.get(pk=response.data['id'])
        self.assertEqual(customer.name, 'Distribuidora Cusco SAC')
        self.assertEqual(customer.city, 'Cusco')

    def test_retrieve_customer_returns_200(self):
        """GET detalle retorna 200 con datos del objeto."""
        response = self.client.get(self.url_detail)
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertEqual(response.data['id'], self.customer.pk)
        self.assertEqual(response.data['name'], 'Transportes Lima SAC')

    def test_partial_update_customer_returns_200(self):
        """PATCH actualiza campo y retorna 200."""
        data = {'name': 'Transportes Lima SAC Actualizada'}
        response = self.client.patch(self.url_detail, data, format='json')
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.customer.refresh_from_db()
        self.assertEqual(self.customer.name, 'Transportes Lima SAC Actualizada')

    def test_full_update_customer_returns_200(self):
        """PUT actualiza todos los campos y retorna 200."""
        data = {
            'name': 'Empresa Modificada SAC',
            'customer_type': 'company',
            'tax_id': '20123456789',
            'email': 'nuevo@empresa.pe',
            'phone': '01-9999999',
            'address': 'Nueva Dirección 789',
            'city': 'Arequipa',
            'country': 'Peru',
            'is_active': True,
        }
        response = self.client.put(self.url_detail, data, format='json')
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.customer.refresh_from_db()
        self.assertEqual(self.customer.email, 'nuevo@empresa.pe')
        self.assertEqual(self.customer.city, 'Arequipa')

    def test_soft_delete_customer_returns_204(self):
        """DELETE retorna 204 y marca is_active=False sin borrar de DB."""
        response = self.client.delete(self.url_detail)
        self.assertEqual(response.status_code, status.HTTP_204_NO_CONTENT)
        self.customer.refresh_from_db()
        self.assertFalse(self.customer.is_active)

    def test_soft_delete_record_persists(self):
        """Registro con is_active=False permanece en DB después del DELETE."""
        self.client.delete(self.url_detail)
        self.assertTrue(Customer.objects.filter(pk=self.customer.pk).exists())

    def test_list_excludes_inactive_customers(self):
        """Objetos con is_active=False no aparecen en GET lista."""
        self.customer.is_active = False
        self.customer.save()
        response = self.client.get(self.url_list)
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        ids = [item['id'] for item in response.data['results']]
        self.assertNotIn(self.customer.pk, ids)

    def test_deleted_customer_not_in_list(self):
        """Cliente eliminado (soft delete) no aparece en el listado."""
        self.client.delete(self.url_detail)
        response = self.client.get(self.url_list)
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        ids = [item['id'] for item in response.data['results']]
        self.assertNotIn(self.customer.pk, ids)

    # ── Unhappy path ────────────────────────────────────────────────────

    def test_create_customer_missing_name_returns_400(self):
        """POST sin name retorna 400."""
        data = {
            'customer_type': 'company',
            'email': 'sin@nombre.pe',
        }
        response = self.client.post(self.url_list, data, format='json')
        self.assertEqual(response.status_code, status.HTTP_400_BAD_REQUEST)
        self.assertIn('name', response.data)

    def test_create_customer_missing_email_returns_400(self):
        """POST sin email retorna 400."""
        data = {
            'name': 'Sin Email SAC',
            'customer_type': 'company',
        }
        response = self.client.post(self.url_list, data, format='json')
        self.assertEqual(response.status_code, status.HTTP_400_BAD_REQUEST)

    def test_create_customer_missing_customer_type_returns_400(self):
        """POST sin customer_type retorna 400."""
        data = {
            'name': 'Sin Tipo SAC',
            'email': 'sintipo@empresa.pe',
        }
        response = self.client.post(self.url_list, data, format='json')
        self.assertEqual(response.status_code, status.HTTP_400_BAD_REQUEST)

    def test_create_customer_invalid_email_returns_400(self):
        """POST con email inválido retorna 400."""
        data = {
            'name': 'Email Inválido SAC',
            'customer_type': 'company',
            'email': 'no-es-email',
        }
        response = self.client.post(self.url_list, data, format='json')
        self.assertEqual(response.status_code, status.HTTP_400_BAD_REQUEST)

    def test_retrieve_nonexistent_customer_returns_404(self):
        """GET con id inexistente retorna 404."""
        response = self.client.get('/api/v1/customers/99999/')
        self.assertEqual(response.status_code, status.HTTP_404_NOT_FOUND)

    def test_update_nonexistent_customer_returns_404(self):
        """PATCH con id inexistente retorna 404."""
        response = self.client.patch('/api/v1/customers/99999/', {'name': 'X'}, format='json')
        self.assertEqual(response.status_code, status.HTTP_404_NOT_FOUND)

    def test_delete_nonexistent_customer_returns_404(self):
        """DELETE con id inexistente retorna 404."""
        response = self.client.delete('/api/v1/customers/99999/')
        self.assertEqual(response.status_code, status.HTTP_404_NOT_FOUND)

    def test_create_customer_empty_payload_returns_400(self):
        """POST con payload vacío retorna 400."""
        response = self.client.post(self.url_list, {}, format='json')
        self.assertEqual(response.status_code, status.HTTP_400_BAD_REQUEST)

    # ── Edge cases — autenticación ──────────────────────────────────────

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

    # ── Edge cases — filtros ────────────────────────────────────────────

    def test_filter_by_customer_type(self):
        """Filtro ?customer_type=company retorna solo empresas."""
        Customer.objects.create(
            name='Juan Quispe',
            customer_type='individual',
            email='juan@natural.pe',
        )
        response = self.client.get(self.url_list + '?customer_type=company')
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        for item in response.data['results']:
            self.assertEqual(item['customer_type'], 'company')

    def test_filter_by_city(self):
        """Filtro ?city=Lima retorna solo clientes de Lima."""
        Customer.objects.create(
            name='Empresa Arequipa SAC',
            customer_type='company',
            email='empresa@arequipa.pe',
            city='Arequipa',
        )
        response = self.client.get(self.url_list + '?city=Lima')
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        for item in response.data['results']:
            self.assertEqual(item['city'], 'Lima')

    def test_search_by_name(self):
        """Búsqueda ?search=Lima encuentra clientes por nombre."""
        response = self.client.get(self.url_list + '?search=Lima')
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        names = [item['name'] for item in response.data['results']]
        self.assertIn('Transportes Lima SAC', names)

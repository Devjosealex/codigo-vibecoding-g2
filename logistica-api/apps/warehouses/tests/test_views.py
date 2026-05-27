from rest_framework.test import APITestCase
from rest_framework import status
from rest_framework_simplejwt.tokens import RefreshToken
from django.contrib.auth.models import User
from apps.warehouses.models import Warehouse


class WarehouseViewTest(APITestCase):
    def setUp(self):
        # Usuario con JWT
        self.user = User.objects.create_user(
            username='testuser', password='testpass123'
        )
        refresh = RefreshToken.for_user(self.user)
        self.client.credentials(HTTP_AUTHORIZATION=f'Bearer {refresh.access_token}')

        # Instancia de prueba
        self.warehouse = Warehouse.objects.create(
            name='Almacenes Lima Norte SAC',
            address='Av. Túpac Amaru 2500, Independencia',
            city='Lima',
            country='Peru',
            latitude=-11.993500,
            longitude=-77.043200,
            capacity_m3=800.00,
        )
        self.url_list = '/api/v1/warehouses/'
        self.url_detail = f'/api/v1/warehouses/{self.warehouse.pk}/'

    # ── Happy path: CRUD completo ──────────────────────────────────────────

    def test_list_warehouses_returns_200(self):
        """GET lista retorna 200 con resultados paginados."""
        response = self.client.get(self.url_list)
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertIn('results', response.data)

    def test_list_warehouses_contains_active_warehouse(self):
        """GET lista incluye el almacén activo creado en setUp."""
        response = self.client.get(self.url_list)
        ids = [item['id'] for item in response.data['results']]
        self.assertIn(self.warehouse.pk, ids)

    def test_create_warehouse_returns_201(self):
        """POST con datos válidos crea objeto y retorna 201."""
        data = {
            'name': 'Almacén Sur Arequipa EIRL',
            'address': 'Av. Independencia 1200, Arequipa',
            'city': 'Arequipa',
            'country': 'Peru',
            'capacity_m3': '600.00',
        }
        response = self.client.post(self.url_list, data, format='json')
        self.assertEqual(response.status_code, status.HTTP_201_CREATED)
        self.assertEqual(Warehouse.objects.filter(is_active=True).count(), 2)

    def test_create_warehouse_persists_in_db(self):
        """POST crea el objeto correctamente con los datos enviados."""
        data = {
            'name': 'Almacén Trujillo Centro SAC',
            'address': 'Jr. Bolívar 345, Trujillo',
            'city': 'Trujillo',
        }
        response = self.client.post(self.url_list, data, format='json')
        self.assertEqual(response.status_code, status.HTTP_201_CREATED)
        self.assertTrue(Warehouse.objects.filter(name='Almacén Trujillo Centro SAC').exists())

    def test_retrieve_warehouse_returns_200(self):
        """GET detalle retorna 200 con datos del objeto."""
        response = self.client.get(self.url_detail)
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertEqual(response.data['id'], self.warehouse.pk)
        self.assertEqual(response.data['name'], 'Almacenes Lima Norte SAC')

    def test_partial_update_warehouse_returns_200(self):
        """PATCH actualiza campo y retorna 200."""
        data = {'city': 'San Juan de Lurigancho'}
        response = self.client.patch(self.url_detail, data, format='json')
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.warehouse.refresh_from_db()
        self.assertEqual(self.warehouse.city, 'San Juan de Lurigancho')

    def test_full_update_warehouse_returns_200(self):
        """PUT actualiza todos los campos y retorna 200."""
        data = {
            'name': 'Almacenes Lima Norte SAC Actualizado',
            'address': 'Av. Túpac Amaru 3000, Independencia',
            'city': 'Lima',
            'country': 'Peru',
        }
        response = self.client.put(self.url_detail, data, format='json')
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.warehouse.refresh_from_db()
        self.assertEqual(self.warehouse.name, 'Almacenes Lima Norte SAC Actualizado')

    def test_soft_delete_warehouse_returns_204(self):
        """DELETE retorna 204 y marca is_active=False sin borrar de DB."""
        response = self.client.delete(self.url_detail)
        self.assertEqual(response.status_code, status.HTTP_204_NO_CONTENT)
        self.warehouse.refresh_from_db()
        self.assertFalse(self.warehouse.is_active)
        # Registro persiste en DB
        self.assertTrue(Warehouse.objects.filter(pk=self.warehouse.pk).exists())

    def test_list_excludes_inactive_warehouses(self):
        """Objetos con is_active=False no aparecen en GET lista."""
        self.warehouse.is_active = False
        self.warehouse.save()
        response = self.client.get(self.url_list)
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        ids = [item['id'] for item in response.data['results']]
        self.assertNotIn(self.warehouse.pk, ids)

    # ── Unhappy path ────────────────────────────────────────────────────────

    def test_create_warehouse_missing_name_returns_400(self):
        """POST sin name retorna 400."""
        data = {
            'address': 'Av. Principal 100',
            'city': 'Lima',
        }
        response = self.client.post(self.url_list, data, format='json')
        self.assertEqual(response.status_code, status.HTTP_400_BAD_REQUEST)
        self.assertIn('name', response.data)

    def test_create_warehouse_missing_address_returns_400(self):
        """POST sin address retorna 400."""
        data = {
            'name': 'Almacén Sin Dirección SAC',
            'city': 'Lima',
        }
        response = self.client.post(self.url_list, data, format='json')
        self.assertEqual(response.status_code, status.HTTP_400_BAD_REQUEST)
        self.assertIn('address', response.data)

    def test_create_warehouse_missing_city_returns_400(self):
        """POST sin city retorna 400."""
        data = {
            'name': 'Almacén Sin Ciudad SAC',
            'address': 'Av. Principal 200',
        }
        response = self.client.post(self.url_list, data, format='json')
        self.assertEqual(response.status_code, status.HTTP_400_BAD_REQUEST)
        self.assertIn('city', response.data)

    def test_create_warehouse_empty_payload_returns_400(self):
        """POST con payload vacío retorna 400."""
        response = self.client.post(self.url_list, {}, format='json')
        self.assertEqual(response.status_code, status.HTTP_400_BAD_REQUEST)

    def test_retrieve_nonexistent_warehouse_returns_404(self):
        """GET con id inexistente retorna 404."""
        response = self.client.get('/api/v1/warehouses/99999/')
        self.assertEqual(response.status_code, status.HTTP_404_NOT_FOUND)

    def test_update_nonexistent_warehouse_returns_404(self):
        """PATCH con id inexistente retorna 404."""
        response = self.client.patch('/api/v1/warehouses/99999/', {'city': 'Lima'}, format='json')
        self.assertEqual(response.status_code, status.HTTP_404_NOT_FOUND)

    def test_delete_nonexistent_warehouse_returns_404(self):
        """DELETE con id inexistente retorna 404."""
        response = self.client.delete('/api/v1/warehouses/99999/')
        self.assertEqual(response.status_code, status.HTTP_404_NOT_FOUND)

    # ── Edge cases: autenticación ───────────────────────────────────────────

    def test_unauthenticated_list_returns_401(self):
        """GET sin JWT retorna 401."""
        self.client.credentials()
        response = self.client.get(self.url_list)
        self.assertEqual(response.status_code, status.HTTP_401_UNAUTHORIZED)

    def test_unauthenticated_create_returns_401(self):
        """POST sin JWT retorna 401."""
        self.client.credentials()
        data = {
            'name': 'Almacén No Auth SAC',
            'address': 'Jr. Test 100',
            'city': 'Lima',
        }
        response = self.client.post(self.url_list, data, format='json')
        self.assertEqual(response.status_code, status.HTTP_401_UNAUTHORIZED)

    def test_unauthenticated_retrieve_returns_401(self):
        """GET detalle sin JWT retorna 401."""
        self.client.credentials()
        response = self.client.get(self.url_detail)
        self.assertEqual(response.status_code, status.HTTP_401_UNAUTHORIZED)

    def test_unauthenticated_update_returns_401(self):
        """PATCH sin JWT retorna 401."""
        self.client.credentials()
        response = self.client.patch(self.url_detail, {'city': 'Arequipa'}, format='json')
        self.assertEqual(response.status_code, status.HTTP_401_UNAUTHORIZED)

    def test_unauthenticated_delete_returns_401(self):
        """DELETE sin JWT retorna 401."""
        self.client.credentials()
        response = self.client.delete(self.url_detail)
        self.assertEqual(response.status_code, status.HTTP_401_UNAUTHORIZED)

    # ── Edge cases: filtros ─────────────────────────────────────────────────

    def test_filter_by_city(self):
        """GET ?city=Arequipa retorna solo almacenes de Arequipa."""
        Warehouse.objects.create(
            name='Almacén Arequipa Sur EIRL',
            address='Av. Ejército 900, Arequipa',
            city='Arequipa',
        )
        response = self.client.get(self.url_list + '?city=Arequipa')
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        for item in response.data['results']:
            self.assertEqual(item['city'], 'Arequipa')

    def test_filter_by_country(self):
        """GET ?country=Peru retorna solo almacenes de Perú."""
        response = self.client.get(self.url_list + '?country=Peru')
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        for item in response.data['results']:
            self.assertEqual(item['country'], 'Peru')

    def test_response_contains_all_fields(self):
        """GET detalle retorna todos los campos esperados del schema."""
        response = self.client.get(self.url_detail)
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        expected_fields = [
            'id', 'name', 'address', 'city', 'country',
            'latitude', 'longitude', 'capacity_m3',
            'is_active', 'created_at', 'updated_at'
        ]
        for field in expected_fields:
            self.assertIn(field, response.data)

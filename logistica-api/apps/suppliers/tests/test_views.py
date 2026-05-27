from rest_framework.test import APITestCase
from rest_framework import status
from rest_framework_simplejwt.tokens import RefreshToken
from django.contrib.auth.models import User
from apps.suppliers.models import Supplier


class SupplierViewTest(APITestCase):
    def setUp(self):
        # Usuario con JWT — proyecto usa JWTAuthentication (simplejwt)
        self.user = User.objects.create_user(
            username='testuser', password='testpass123'
        )
        refresh = RefreshToken.for_user(self.user)
        self.client.credentials(HTTP_AUTHORIZATION=f'Bearer {refresh.access_token}')

        # Crear instancia de prueba
        self.supplier = Supplier.objects.create(
            name='Transportes Lima SAC',
            contact_name='Pedro Flores',
            tax_id='20111222333',
            email='info@transporteslima.pe',
            phone='01-3334455',
            address='Av. Industrial 789, Ate',
            city='Lima',
            country='Peru',
        )
        self.url_list = '/api/v1/suppliers/'
        self.url_detail = f'/api/v1/suppliers/{self.supplier.pk}/'

    # Happy path — CRUD completo
    def test_list_suppliers_returns_200(self):
        """GET lista retorna 200 con resultados paginados."""
        response = self.client.get(self.url_list)
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertIn('results', response.data)

    def test_list_suppliers_contains_created_supplier(self):
        """GET lista incluye el proveedor creado en setUp."""
        response = self.client.get(self.url_list)
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        ids = [item['id'] for item in response.data['results']]
        self.assertIn(self.supplier.pk, ids)

    def test_create_supplier_returns_201(self):
        """POST con datos válidos crea objeto y retorna 201."""
        data = {
            'name': 'Distribuidora Trujillo EIRL',
            'contact_name': 'Ana Torres',
            'tax_id': '20444555666',
            'email': 'ventas@disttrujillo.pe',
            'phone': '044-123456',
            'address': 'Jr. Bolívar 321, Trujillo',
            'city': 'Trujillo',
            'country': 'Peru',
        }
        response = self.client.post(self.url_list, data, format='json')
        self.assertEqual(response.status_code, status.HTTP_201_CREATED)
        self.assertEqual(Supplier.objects.count(), 2)
        self.assertEqual(response.data['name'], 'Distribuidora Trujillo EIRL')

    def test_create_supplier_only_name_returns_201(self):
        """POST solo con name (campo mínimo) retorna 201."""
        data = {'name': 'Proveedor Mínimo Cusco SRL'}
        response = self.client.post(self.url_list, data, format='json')
        self.assertEqual(response.status_code, status.HTTP_201_CREATED)
        self.assertEqual(response.data['name'], 'Proveedor Mínimo Cusco SRL')

    def test_retrieve_supplier_returns_200(self):
        """GET detalle retorna 200 con datos del objeto."""
        response = self.client.get(self.url_detail)
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertEqual(response.data['id'], self.supplier.pk)
        self.assertEqual(response.data['name'], 'Transportes Lima SAC')

    def test_update_supplier_returns_200(self):
        """PUT actualiza todos los campos y retorna 200."""
        data = {
            'name': 'Transportes Lima SAC Actualizado',
            'contact_name': 'Pedro Flores',
            'tax_id': '20111222333',
            'email': 'nuevo@transporteslima.pe',
            'phone': '01-3334455',
            'address': 'Av. Industrial 789, Ate',
            'city': 'Lima',
            'country': 'Peru',
        }
        response = self.client.put(self.url_detail, data, format='json')
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.supplier.refresh_from_db()
        self.assertEqual(self.supplier.name, 'Transportes Lima SAC Actualizado')

    def test_partial_update_supplier_returns_200(self):
        """PATCH actualiza campo y retorna 200."""
        data = {'city': 'Arequipa'}
        response = self.client.patch(self.url_detail, data, format='json')
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.supplier.refresh_from_db()
        self.assertEqual(self.supplier.city, 'Arequipa')

    def test_partial_update_contact_name(self):
        """PATCH actualiza contact_name y retorna 200."""
        data = {'contact_name': 'María García'}
        response = self.client.patch(self.url_detail, data, format='json')
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.supplier.refresh_from_db()
        self.assertEqual(self.supplier.contact_name, 'María García')

    def test_soft_delete_supplier_returns_204(self):
        """DELETE retorna 204 y marca is_active=False sin borrar de DB."""
        response = self.client.delete(self.url_detail)
        self.assertEqual(response.status_code, status.HTTP_204_NO_CONTENT)
        self.supplier.refresh_from_db()
        self.assertFalse(self.supplier.is_active)
        # Registro persiste en DB
        self.assertTrue(Supplier.objects.filter(pk=self.supplier.pk).exists())

    def test_list_excludes_inactive_suppliers(self):
        """Objetos con is_active=False no aparecen en GET lista."""
        self.supplier.is_active = False
        self.supplier.save()
        response = self.client.get(self.url_list)
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        ids = [item['id'] for item in response.data['results']]
        self.assertNotIn(self.supplier.pk, ids)

    def test_list_count_after_soft_delete(self):
        """Lista no cuenta proveedores inactivos."""
        Supplier.objects.create(name='Proveedor Activo Arequipa SAC')
        self.supplier.is_active = False
        self.supplier.save()
        response = self.client.get(self.url_list)
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertEqual(response.data['count'], 1)

    # Filtros
    def test_filter_by_city(self):
        """Filtrar por city retorna solo proveedores de esa ciudad."""
        Supplier.objects.create(
            name='Proveedor Arequipa SAC',
            city='Arequipa',
        )
        response = self.client.get(self.url_list, {'city': 'Lima'})
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        for item in response.data['results']:
            self.assertEqual(item['city'], 'Lima')

    def test_filter_by_country(self):
        """Filtrar por country retorna solo proveedores de ese país."""
        response = self.client.get(self.url_list, {'country': 'Peru'})
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        for item in response.data['results']:
            self.assertEqual(item['country'], 'Peru')

    # Unhappy path
    def test_create_supplier_missing_name_returns_400(self):
        """POST sin campo name requerido retorna 400."""
        data = {
            'contact_name': 'Sin Nombre',
            'email': 'test@test.com',
        }
        response = self.client.post(self.url_list, data, format='json')
        self.assertEqual(response.status_code, status.HTTP_400_BAD_REQUEST)
        self.assertIn('name', response.data)

    def test_create_supplier_empty_payload_returns_400(self):
        """POST con payload vacío retorna 400."""
        response = self.client.post(self.url_list, {}, format='json')
        self.assertEqual(response.status_code, status.HTTP_400_BAD_REQUEST)

    def test_create_supplier_duplicate_tax_id_returns_400(self):
        """POST con tax_id duplicado retorna 400."""
        data = {
            'name': 'Otro Proveedor Lima SAC',
            'tax_id': '20111222333',  # mismo que setUp
        }
        response = self.client.post(self.url_list, data, format='json')
        self.assertEqual(response.status_code, status.HTTP_400_BAD_REQUEST)

    def test_retrieve_nonexistent_supplier_returns_404(self):
        """GET con id inexistente retorna 404."""
        response = self.client.get('/api/v1/suppliers/99999/')
        self.assertEqual(response.status_code, status.HTTP_404_NOT_FOUND)

    def test_update_nonexistent_supplier_returns_404(self):
        """PATCH con id inexistente retorna 404."""
        response = self.client.patch('/api/v1/suppliers/99999/', {'name': 'X'}, format='json')
        self.assertEqual(response.status_code, status.HTTP_404_NOT_FOUND)

    def test_delete_nonexistent_supplier_returns_404(self):
        """DELETE con id inexistente retorna 404."""
        response = self.client.delete('/api/v1/suppliers/99999/')
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
        response = self.client.post(self.url_list, {'name': 'Test'}, format='json')
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

    # Verificar campos de respuesta
    def test_response_contains_expected_fields(self):
        """La respuesta de detalle contiene todos los campos esperados."""
        response = self.client.get(self.url_detail)
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        expected_fields = [
            'id', 'name', 'contact_name', 'tax_id', 'email',
            'phone', 'address', 'city', 'country',
            'is_active', 'created_at', 'updated_at',
        ]
        for field in expected_fields:
            self.assertIn(field, response.data)

    def test_created_supplier_has_correct_default_country(self):
        """Proveedor creado sin country tiene Peru por defecto."""
        data = {'name': 'Proveedor Default Country SAC'}
        response = self.client.post(self.url_list, data, format='json')
        self.assertEqual(response.status_code, status.HTTP_201_CREATED)
        self.assertEqual(response.data['country'], 'Peru')

    def test_created_supplier_is_active_by_default(self):
        """Proveedor creado aparece como activo por defecto."""
        data = {'name': 'Proveedor Activo Default SAC'}
        response = self.client.post(self.url_list, data, format='json')
        self.assertEqual(response.status_code, status.HTTP_201_CREATED)
        self.assertTrue(response.data['is_active'])

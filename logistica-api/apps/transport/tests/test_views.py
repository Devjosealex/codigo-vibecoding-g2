from rest_framework.test import APITestCase
from rest_framework import status
from rest_framework_simplejwt.tokens import RefreshToken
from django.contrib.auth.models import User
from datetime import date
from apps.transport.models import Vehicle
from apps.drivers.models import Driver


class VehicleViewTest(APITestCase):
    def setUp(self):
        # Usuario con JWT
        self.user = User.objects.create_user(
            username='testuser', password='testpass123'
        )
        refresh = RefreshToken.for_user(self.user)
        self.client.credentials(HTTP_AUTHORIZATION=f'Bearer {refresh.access_token}')

        # Crear driver como dependencia FK
        self.driver = Driver.objects.create(
            first_name='Pedro',
            last_name='Mamani',
            document_number='11223344',
            license_number='LIC-003',
            license_expiry=date(2028, 3, 15),
            phone='976543210',
            email='pmamani@transporteslima.com',
        )

        # Crear vehículo de prueba
        self.vehicle = Vehicle.objects.create(
            driver=self.driver,
            name='Camión Cusco Express',
            plate_number='CUS-001',
            vehicle_type='truck',
            capacity_kg='6000.00',
            capacity_m3='25.00',
        )

        self.url_list = '/api/v1/vehicles/'
        self.url_detail = f'/api/v1/vehicles/{self.vehicle.pk}/'

    # Happy path — CRUD completo

    def test_list_vehicles_returns_200(self):
        """GET lista retorna 200 con resultados paginados."""
        response = self.client.get(self.url_list)
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertIn('results', response.data)

    def test_list_vehicles_contains_created_vehicle(self):
        """GET lista contiene el vehículo creado en setUp."""
        response = self.client.get(self.url_list)
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        ids = [item['id'] for item in response.data['results']]
        self.assertIn(self.vehicle.pk, ids)

    def test_create_vehicle_returns_201(self):
        """POST con datos válidos crea objeto y retorna 201."""
        data = {
            'name': 'Furgoneta Lima Sur',
            'plate_number': 'LIM-002',
            'vehicle_type': 'van',
            'capacity_kg': '1500.00',
            'capacity_m3': '8.00',
        }
        response = self.client.post(self.url_list, data, format='json')
        self.assertEqual(response.status_code, status.HTTP_201_CREATED)
        self.assertEqual(Vehicle.objects.count(), 2)

    def test_create_vehicle_with_driver_returns_201(self):
        """POST con driver FK crea vehículo correctamente."""
        data = {
            'driver': self.driver.pk,
            'name': 'Motocicleta Delivery Arequipa',
            'plate_number': 'AQP-MT1',
            'vehicle_type': 'motorcycle',
        }
        response = self.client.post(self.url_list, data, format='json')
        self.assertEqual(response.status_code, status.HTTP_201_CREATED)
        self.assertEqual(response.data['driver'], self.driver.pk)

    def test_retrieve_vehicle_returns_200(self):
        """GET detalle retorna 200 con datos del objeto."""
        response = self.client.get(self.url_detail)
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertEqual(response.data['id'], self.vehicle.pk)
        self.assertEqual(response.data['name'], 'Camión Cusco Express')
        self.assertEqual(response.data['plate_number'], 'CUS-001')

    def test_partial_update_vehicle_name_returns_200(self):
        """PATCH actualiza nombre y retorna 200."""
        data = {'name': 'Camión Cusco Actualizado'}
        response = self.client.patch(self.url_detail, data, format='json')
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.vehicle.refresh_from_db()
        self.assertEqual(self.vehicle.name, 'Camión Cusco Actualizado')

    def test_partial_update_vehicle_type_returns_200(self):
        """PATCH actualiza vehicle_type y retorna 200."""
        data = {'vehicle_type': 'van'}
        response = self.client.patch(self.url_detail, data, format='json')
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.vehicle.refresh_from_db()
        self.assertEqual(self.vehicle.vehicle_type, 'van')

    def test_full_update_vehicle_returns_200(self):
        """PUT actualiza todos los campos y retorna 200."""
        data = {
            'name': 'Camión Lima Norte Nuevo',
            'plate_number': 'CUS-001',
            'vehicle_type': 'truck',
            'capacity_kg': '7000.00',
            'capacity_m3': '30.00',
        }
        response = self.client.put(self.url_detail, data, format='json')
        self.assertEqual(response.status_code, status.HTTP_200_OK)

    def test_soft_delete_vehicle_returns_204(self):
        """DELETE retorna 204 y marca is_active=False sin borrar de DB."""
        response = self.client.delete(self.url_detail)
        self.assertEqual(response.status_code, status.HTTP_204_NO_CONTENT)
        self.vehicle.refresh_from_db()
        self.assertFalse(self.vehicle.is_active)

    def test_soft_delete_record_persists_in_db(self):
        """DELETE marca is_active=False pero el registro persiste en DB."""
        self.client.delete(self.url_detail)
        self.assertTrue(Vehicle.objects.filter(pk=self.vehicle.pk).exists())

    def test_list_excludes_inactive_vehicles(self):
        """Vehículos con is_active=False no aparecen en GET lista."""
        self.vehicle.is_active = False
        self.vehicle.save()
        response = self.client.get(self.url_list)
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        ids = [item['id'] for item in response.data['results']]
        self.assertNotIn(self.vehicle.pk, ids)

    def test_filter_by_vehicle_type(self):
        """GET con filtro vehicle_type solo retorna vehículos de ese tipo."""
        Vehicle.objects.create(
            name='Furgoneta Trujillo',
            plate_number='TRU-001',
            vehicle_type='van',
        )
        response = self.client.get(self.url_list + '?vehicle_type=truck')
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        for item in response.data['results']:
            self.assertEqual(item['vehicle_type'], 'truck')

    def test_filter_by_driver(self):
        """GET con filtro driver retorna solo vehículos de ese conductor."""
        response = self.client.get(self.url_list + f'?driver={self.driver.pk}')
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        for item in response.data['results']:
            self.assertEqual(item['driver'], self.driver.pk)

    # Unhappy path

    def test_create_vehicle_missing_name_returns_400(self):
        """POST sin name retorna 400."""
        data = {
            'plate_number': 'BAD-001',
            'vehicle_type': 'truck',
        }
        response = self.client.post(self.url_list, data, format='json')
        self.assertEqual(response.status_code, status.HTTP_400_BAD_REQUEST)
        self.assertIn('name', response.data)

    def test_create_vehicle_missing_plate_number_returns_400(self):
        """POST sin plate_number retorna 400."""
        data = {
            'name': 'Vehículo Sin Placa',
            'vehicle_type': 'truck',
        }
        response = self.client.post(self.url_list, data, format='json')
        self.assertEqual(response.status_code, status.HTTP_400_BAD_REQUEST)
        self.assertIn('plate_number', response.data)

    def test_create_vehicle_missing_vehicle_type_returns_400(self):
        """POST sin vehicle_type retorna 400."""
        data = {
            'name': 'Vehículo Sin Tipo',
            'plate_number': 'SIN-001',
        }
        response = self.client.post(self.url_list, data, format='json')
        self.assertEqual(response.status_code, status.HTTP_400_BAD_REQUEST)
        self.assertIn('vehicle_type', response.data)

    def test_create_vehicle_invalid_vehicle_type_returns_400(self):
        """POST con vehicle_type inválido retorna 400."""
        data = {
            'name': 'Vehículo Tipo Inválido',
            'plate_number': 'INV-001',
            'vehicle_type': 'submarine',
        }
        response = self.client.post(self.url_list, data, format='json')
        self.assertEqual(response.status_code, status.HTTP_400_BAD_REQUEST)

    def test_create_vehicle_duplicate_plate_returns_400(self):
        """POST con plate_number duplicado retorna 400."""
        data = {
            'name': 'Duplicado',
            'plate_number': 'CUS-001',  # misma placa que setUp
            'vehicle_type': 'van',
        }
        response = self.client.post(self.url_list, data, format='json')
        self.assertEqual(response.status_code, status.HTTP_400_BAD_REQUEST)

    def test_retrieve_nonexistent_vehicle_returns_404(self):
        """GET con id inexistente retorna 404."""
        response = self.client.get('/api/v1/vehicles/99999/')
        self.assertEqual(response.status_code, status.HTTP_404_NOT_FOUND)

    def test_update_nonexistent_vehicle_returns_404(self):
        """PATCH con id inexistente retorna 404."""
        response = self.client.patch('/api/v1/vehicles/99999/', {'name': 'x'}, format='json')
        self.assertEqual(response.status_code, status.HTTP_404_NOT_FOUND)

    def test_delete_nonexistent_vehicle_returns_404(self):
        """DELETE con id inexistente retorna 404."""
        response = self.client.delete('/api/v1/vehicles/99999/')
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
        data = {
            'name': 'Vehículo Anon',
            'plate_number': 'ANO-001',
            'vehicle_type': 'van',
        }
        response = self.client.post(self.url_list, data, format='json')
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

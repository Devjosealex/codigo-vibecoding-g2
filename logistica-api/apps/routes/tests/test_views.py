from rest_framework.test import APITestCase
from rest_framework import status
from rest_framework_simplejwt.tokens import RefreshToken
from django.contrib.auth.models import User
from apps.routes.models import Route, RouteStop
from apps.warehouses.models import Warehouse


class RouteViewTest(APITestCase):
    def setUp(self):
        self.user = User.objects.create_user(
            username='testuser', password='testpass123'
        )
        refresh = RefreshToken.for_user(self.user)
        self.client.credentials(HTTP_AUTHORIZATION=f'Bearer {refresh.access_token}')

        self.warehouse = Warehouse.objects.create(
            name='Almacén Transportes Lima SAC',
            address='Av. Argentina 3100, Lima',
            city='Lima',
            country='Peru',
        )
        self.route = Route.objects.create(
            name='Ruta Lima - Arequipa',
            origin_warehouse=self.warehouse,
            distance_km='850.50',
            estimated_duration_h='12.00',
        )
        self.url_list = '/api/v1/routes/'
        self.url_detail = f'/api/v1/routes/{self.route.pk}/'

    # ── Happy path — CRUD completo ────────────────────────────

    def test_list_routes_returns_200(self):
        """GET lista retorna 200 con resultados paginados."""
        response = self.client.get(self.url_list)
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertIn('results', response.data)

    def test_create_route_returns_201(self):
        """POST con datos válidos crea ruta y retorna 201."""
        data = {
            'name': 'Ruta Arequipa - Cusco',
            'origin_warehouse': self.warehouse.pk,
            'distance_km': '300.00',
            'estimated_duration_h': '5.00',
        }
        response = self.client.post(self.url_list, data, format='json')
        self.assertEqual(response.status_code, status.HTTP_201_CREATED)
        self.assertEqual(Route.objects.count(), 2)

    def test_retrieve_route_returns_200(self):
        """GET detalle retorna 200 con datos de la ruta."""
        response = self.client.get(self.url_detail)
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertEqual(response.data['id'], self.route.pk)
        self.assertEqual(response.data['name'], self.route.name)

    def test_partial_update_route_returns_200(self):
        """PATCH actualiza campo y retorna 200."""
        data = {'name': 'Ruta Lima - Arequipa Actualizada'}
        response = self.client.patch(self.url_detail, data, format='json')
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.route.refresh_from_db()
        self.assertEqual(self.route.name, 'Ruta Lima - Arequipa Actualizada')

    def test_full_update_route_returns_200(self):
        """PUT actualiza todos los campos y retorna 200."""
        data = {
            'name': 'Ruta Lima - Trujillo',
            'origin_warehouse': self.warehouse.pk,
            'distance_km': '550.00',
            'estimated_duration_h': '8.00',
            'is_active': True,
        }
        response = self.client.put(self.url_detail, data, format='json')
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.route.refresh_from_db()
        self.assertEqual(self.route.name, 'Ruta Lima - Trujillo')

    def test_soft_delete_route_returns_204(self):
        """DELETE retorna 204 y marca is_active=False sin borrar de DB."""
        response = self.client.delete(self.url_detail)
        self.assertEqual(response.status_code, status.HTTP_204_NO_CONTENT)
        self.route.refresh_from_db()
        self.assertFalse(self.route.is_active)
        self.assertTrue(Route.objects.filter(pk=self.route.pk).exists())

    def test_list_excludes_inactive_routes(self):
        """Rutas con is_active=False no aparecen en GET lista."""
        self.route.is_active = False
        self.route.save()
        response = self.client.get(self.url_list)
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        ids = [item['id'] for item in response.data['results']]
        self.assertNotIn(self.route.pk, ids)

    def test_route_response_includes_stops_field(self):
        """La respuesta de detalle incluye el campo stops."""
        response = self.client.get(self.url_detail)
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertIn('stops', response.data)

    def test_filter_by_origin_warehouse(self):
        """Filtrar por origin_warehouse retorna solo las rutas de ese almacén."""
        warehouse2 = Warehouse.objects.create(
            name='Almacén Arequipa',
            address='Av. La Marina 200, Arequipa',
            city='Arequipa',
            country='Peru',
        )
        Route.objects.create(
            name='Ruta Arequipa - Puno',
            origin_warehouse=warehouse2,
            distance_km='350.00',
        )
        response = self.client.get(f'{self.url_list}?origin_warehouse={self.warehouse.pk}')
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        for item in response.data['results']:
            self.assertEqual(item['origin_warehouse'], self.warehouse.pk)

    # ── Unhappy path ─────────────────────────────────────────

    def test_create_route_missing_name_returns_400(self):
        """POST sin name retorna 400."""
        data = {'origin_warehouse': self.warehouse.pk}
        response = self.client.post(self.url_list, data, format='json')
        self.assertEqual(response.status_code, status.HTTP_400_BAD_REQUEST)

    def test_create_route_missing_warehouse_returns_400(self):
        """POST sin origin_warehouse retorna 400."""
        data = {'name': 'Ruta Sin Almacén'}
        response = self.client.post(self.url_list, data, format='json')
        self.assertEqual(response.status_code, status.HTTP_400_BAD_REQUEST)

    def test_retrieve_nonexistent_route_returns_404(self):
        """GET con id inexistente retorna 404."""
        response = self.client.get('/api/v1/routes/99999/')
        self.assertEqual(response.status_code, status.HTTP_404_NOT_FOUND)

    # ── Edge cases — autenticación ────────────────────────────

    def test_unauthenticated_list_returns_401(self):
        """GET sin JWT retorna 401."""
        self.client.credentials()
        response = self.client.get(self.url_list)
        self.assertEqual(response.status_code, status.HTTP_401_UNAUTHORIZED)

    def test_unauthenticated_create_returns_401(self):
        """POST sin JWT retorna 401."""
        self.client.credentials()
        response = self.client.post(self.url_list, {}, format='json')
        self.assertEqual(response.status_code, status.HTTP_401_UNAUTHORIZED)

    def test_unauthenticated_detail_returns_401(self):
        """GET detalle sin JWT retorna 401."""
        self.client.credentials()
        response = self.client.get(self.url_detail)
        self.assertEqual(response.status_code, status.HTTP_401_UNAUTHORIZED)


class RouteStopViewTest(APITestCase):
    def setUp(self):
        self.user = User.objects.create_user(
            username='testuser2', password='testpass123'
        )
        refresh = RefreshToken.for_user(self.user)
        self.client.credentials(HTTP_AUTHORIZATION=f'Bearer {refresh.access_token}')

        self.warehouse = Warehouse.objects.create(
            name='Almacén Miraflores EIRL',
            address='Av. Pardo 500, Miraflores',
            city='Lima',
            country='Peru',
        )
        self.route = Route.objects.create(
            name='Ruta Lima - Cusco',
            origin_warehouse=self.warehouse,
            distance_km='1100.00',
            estimated_duration_h='18.00',
        )
        self.stop = RouteStop.objects.create(
            route=self.route,
            stop_order=1,
            address='Plaza de Armas s/n, Cusco',
            city='Cusco',
            latitude='-13.531950',
            longitude='-71.967462',
        )
        self.url_list = '/api/v1/route-stops/'
        self.url_detail = f'/api/v1/route-stops/{self.stop.pk}/'

    # ── Happy path — CRUD completo ────────────────────────────

    def test_list_route_stops_returns_200(self):
        """GET lista retorna 200 con resultados paginados."""
        response = self.client.get(self.url_list)
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertIn('results', response.data)

    def test_create_route_stop_returns_201(self):
        """POST con datos válidos crea parada y retorna 201."""
        data = {
            'route': self.route.pk,
            'stop_order': 2,
            'address': 'Av. El Sol 123, Cusco',
            'city': 'Cusco',
        }
        response = self.client.post(self.url_list, data, format='json')
        self.assertEqual(response.status_code, status.HTTP_201_CREATED)
        self.assertEqual(RouteStop.objects.count(), 2)

    def test_retrieve_route_stop_returns_200(self):
        """GET detalle retorna 200 con datos de la parada."""
        response = self.client.get(self.url_detail)
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertEqual(response.data['id'], self.stop.pk)
        self.assertEqual(response.data['city'], 'Cusco')

    def test_partial_update_route_stop_returns_200(self):
        """PATCH actualiza ciudad y retorna 200."""
        data = {'city': 'Arequipa'}
        response = self.client.patch(self.url_detail, data, format='json')
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.stop.refresh_from_db()
        self.assertEqual(self.stop.city, 'Arequipa')

    def test_full_update_route_stop_returns_200(self):
        """PUT actualiza todos los campos y retorna 200."""
        data = {
            'route': self.route.pk,
            'stop_order': 1,
            'address': 'Nuevo Jr. Lima 789, Cusco',
            'city': 'Cusco',
            'latitude': '-13.532000',
            'longitude': '-71.967500',
        }
        response = self.client.put(self.url_detail, data, format='json')
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.stop.refresh_from_db()
        self.assertEqual(self.stop.address, 'Nuevo Jr. Lima 789, Cusco')

    def test_delete_route_stop_returns_204(self):
        """DELETE retorna 204 y elimina la parada de la DB."""
        response = self.client.delete(self.url_detail)
        self.assertEqual(response.status_code, status.HTTP_204_NO_CONTENT)
        self.assertFalse(RouteStop.objects.filter(pk=self.stop.pk).exists())

    def test_filter_by_route(self):
        """Filtrar por route retorna solo las paradas de esa ruta."""
        route2 = Route.objects.create(
            name='Ruta Lima - Piura',
            origin_warehouse=self.warehouse,
            distance_km='1000.00',
        )
        RouteStop.objects.create(
            route=route2,
            stop_order=1,
            address='Av. Loreto 100, Piura',
            city='Piura',
        )
        response = self.client.get(f'{self.url_list}?route={self.route.pk}')
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        for item in response.data['results']:
            self.assertEqual(item['route'], self.route.pk)

    # ── Unhappy path ─────────────────────────────────────────

    def test_create_stop_missing_route_returns_400(self):
        """POST sin route retorna 400."""
        data = {
            'stop_order': 3,
            'address': 'Sin ruta',
            'city': 'Lima',
        }
        response = self.client.post(self.url_list, data, format='json')
        self.assertEqual(response.status_code, status.HTTP_400_BAD_REQUEST)

    def test_create_stop_missing_address_returns_400(self):
        """POST sin address retorna 400."""
        data = {
            'route': self.route.pk,
            'stop_order': 3,
            'city': 'Lima',
        }
        response = self.client.post(self.url_list, data, format='json')
        self.assertEqual(response.status_code, status.HTTP_400_BAD_REQUEST)

    def test_create_stop_missing_city_returns_400(self):
        """POST sin city retorna 400."""
        data = {
            'route': self.route.pk,
            'stop_order': 3,
            'address': 'Av. Lima 100',
        }
        response = self.client.post(self.url_list, data, format='json')
        self.assertEqual(response.status_code, status.HTTP_400_BAD_REQUEST)

    def test_retrieve_nonexistent_stop_returns_404(self):
        """GET con id inexistente retorna 404."""
        response = self.client.get('/api/v1/route-stops/99999/')
        self.assertEqual(response.status_code, status.HTTP_404_NOT_FOUND)

    # ── Edge cases — autenticación ────────────────────────────

    def test_unauthenticated_list_returns_401(self):
        """GET sin JWT retorna 401."""
        self.client.credentials()
        response = self.client.get(self.url_list)
        self.assertEqual(response.status_code, status.HTTP_401_UNAUTHORIZED)

    def test_unauthenticated_create_returns_401(self):
        """POST sin JWT retorna 401."""
        self.client.credentials()
        response = self.client.post(self.url_list, {}, format='json')
        self.assertEqual(response.status_code, status.HTTP_401_UNAUTHORIZED)

    def test_unauthenticated_delete_returns_401(self):
        """DELETE sin JWT retorna 401."""
        self.client.credentials()
        response = self.client.delete(self.url_detail)
        self.assertEqual(response.status_code, status.HTTP_401_UNAUTHORIZED)

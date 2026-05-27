from django.test import TestCase
from django.db import IntegrityError
from apps.routes.models import Route, RouteStop
from apps.routes.serializers import RouteSerializer, RouteStopSerializer
from apps.warehouses.models import Warehouse


class RouteModelTest(TestCase):
    def setUp(self):
        self.warehouse = Warehouse.objects.create(
            name='Almacén Lima Norte',
            address='Av. Industrial 1234, Lima',
            city='Lima',
            country='Peru',
        )
        self.route = Route.objects.create(
            name='Ruta Lima - Arequipa',
            origin_warehouse=self.warehouse,
            distance_km='850.50',
            estimated_duration_h='12.00',
        )

    def test_create_route_success(self):
        """Creación con datos válidos guarda correctamente en DB."""
        self.assertIsNotNone(self.route.pk)
        self.assertEqual(self.route.name, 'Ruta Lima - Arequipa')
        self.assertEqual(self.route.origin_warehouse, self.warehouse)

    def test_str_returns_name(self):
        """__str__ retorna el nombre de la ruta."""
        self.assertEqual(str(self.route), 'Ruta Lima - Arequipa')

    def test_is_active_default_true(self):
        """is_active=True por defecto al crear."""
        self.assertTrue(self.route.is_active)

    def test_created_at_auto_set(self):
        """created_at se asigna automáticamente."""
        self.assertIsNotNone(self.route.created_at)

    def test_updated_at_auto_set(self):
        """updated_at se asigna automáticamente."""
        self.assertIsNotNone(self.route.updated_at)

    def test_distance_km_nullable(self):
        """distance_km puede ser nulo."""
        route = Route.objects.create(
            name='Ruta Lima - Trujillo',
            origin_warehouse=self.warehouse,
        )
        self.assertIsNone(route.distance_km)

    def test_estimated_duration_nullable(self):
        """estimated_duration_h puede ser nulo."""
        route = Route.objects.create(
            name='Ruta Lima - Cusco',
            origin_warehouse=self.warehouse,
        )
        self.assertIsNone(route.estimated_duration_h)

    def test_soft_delete_sets_is_active_false(self):
        """Soft delete marca is_active=False pero el registro persiste en DB."""
        pk = self.route.pk
        self.route.is_active = False
        self.route.save()
        obj = Route.objects.get(pk=pk)
        self.assertFalse(obj.is_active)

    def test_create_route_without_name_fails(self):
        """name requerido vacío lanza error de integridad."""
        with self.assertRaises(Exception):
            Route.objects.create(
                name=None,
                origin_warehouse=self.warehouse,
            )

    def test_create_route_without_warehouse_fails(self):
        """origin_warehouse requerido faltante lanza error."""
        with self.assertRaises((IntegrityError, Exception)):
            Route.objects.create(
                name='Ruta Sin Origen',
                origin_warehouse=None,
            )

    def test_ordering_by_created_at_desc(self):
        """Rutas se ordenan por created_at descendente."""
        route2 = Route.objects.create(
            name='Ruta Secundaria',
            origin_warehouse=self.warehouse,
        )
        routes = list(Route.objects.all())
        # La más reciente debe ser la primera
        self.assertEqual(routes[0].pk, route2.pk)


class RouteStopModelTest(TestCase):
    def setUp(self):
        self.warehouse = Warehouse.objects.create(
            name='Almacén Miraflores',
            address='Av. Larco 500, Miraflores, Lima',
            city='Lima',
            country='Peru',
        )
        self.route = Route.objects.create(
            name='Ruta Lima - Cusco Express',
            origin_warehouse=self.warehouse,
            distance_km='1100.00',
            estimated_duration_h='18.00',
        )
        self.stop = RouteStop.objects.create(
            route=self.route,
            stop_order=1,
            address='Jr. Comercio 123, Cusco',
            city='Cusco',
            latitude='-13.531950',
            longitude='-71.967462',
        )

    def test_create_routestop_success(self):
        """Creación con datos válidos guarda correctamente en DB."""
        self.assertIsNotNone(self.stop.pk)
        self.assertEqual(self.stop.stop_order, 1)
        self.assertEqual(self.stop.city, 'Cusco')

    def test_str_returns_expected(self):
        """__str__ retorna el número de parada y ciudad."""
        self.assertEqual(str(self.stop), 'Parada 1 — Cusco')

    def test_latitude_longitude_nullable(self):
        """latitude y longitude pueden ser nulos."""
        stop = RouteStop.objects.create(
            route=self.route,
            stop_order=2,
            address='Av. Sol 456, Cusco',
            city='Cusco',
        )
        self.assertIsNone(stop.latitude)
        self.assertIsNone(stop.longitude)

    def test_cascade_delete_with_route(self):
        """Al eliminar la ruta, sus paradas se eliminan en cascada."""
        stop_pk = self.stop.pk
        self.route.delete()
        self.assertFalse(RouteStop.objects.filter(pk=stop_pk).exists())

    def test_unique_together_route_stop_order(self):
        """Combinación (route, stop_order) única — duplicado lanza IntegrityError."""
        with self.assertRaises(IntegrityError):
            RouteStop.objects.create(
                route=self.route,
                stop_order=1,  # Ya existe stop_order=1 para esta ruta
                address='Otra Dirección 789',
                city='Cusco',
            )

    def test_ordering_by_stop_order(self):
        """Paradas se ordenan por stop_order ascendente."""
        stop2 = RouteStop.objects.create(
            route=self.route,
            stop_order=2,
            address='Segunda Parada',
            city='Lima',
        )
        stops = list(RouteStop.objects.filter(route=self.route))
        self.assertEqual(stops[0].pk, self.stop.pk)
        self.assertEqual(stops[1].pk, stop2.pk)

    def test_create_stop_without_route_fails(self):
        """route requerido faltante lanza error."""
        with self.assertRaises((IntegrityError, Exception)):
            RouteStop.objects.create(
                route=None,
                stop_order=1,
                address='Sin Ruta',
                city='Lima',
            )


# ──────────────────────────────────────────────
# Serializer Tests
# ──────────────────────────────────────────────

class RouteSerializerTest(TestCase):
    def setUp(self):
        self.warehouse = Warehouse.objects.create(
            name='Almacén San Isidro',
            address='Calle Las Flores 100, San Isidro',
            city='Lima',
            country='Peru',
        )
        self.valid_data = {
            'name': 'Ruta Arequipa - Puno',
            'origin_warehouse': self.warehouse.pk,
            'distance_km': '350.75',
            'estimated_duration_h': '6.50',
            'is_active': True,
        }

    def test_valid_data_is_valid(self):
        """Datos completos y correctos pasan validación."""
        serializer = RouteSerializer(data=self.valid_data)
        self.assertTrue(serializer.is_valid(), serializer.errors)

    def test_serializer_contains_expected_fields(self):
        """Todos los campos del schema están presentes en el serializer."""
        route = Route.objects.create(
            name='Ruta de Prueba',
            origin_warehouse=self.warehouse,
            distance_km='500.00',
            estimated_duration_h='8.00',
        )
        serializer = RouteSerializer(route)
        expected_fields = ['id', 'name', 'origin_warehouse', 'distance_km',
                           'estimated_duration_h', 'is_active', 'created_at', 'updated_at', 'stops']
        for field in expected_fields:
            self.assertIn(field, serializer.data)

    def test_missing_name_invalid(self):
        """name faltante hace el serializer inválido."""
        data = self.valid_data.copy()
        del data['name']
        serializer = RouteSerializer(data=data)
        self.assertFalse(serializer.is_valid())
        self.assertIn('name', serializer.errors)

    def test_empty_name_invalid(self):
        """name vacío hace el serializer inválido."""
        data = self.valid_data.copy()
        data['name'] = ''
        serializer = RouteSerializer(data=data)
        self.assertFalse(serializer.is_valid())

    def test_missing_origin_warehouse_invalid(self):
        """origin_warehouse faltante hace el serializer inválido."""
        data = self.valid_data.copy()
        del data['origin_warehouse']
        serializer = RouteSerializer(data=data)
        self.assertFalse(serializer.is_valid())
        self.assertIn('origin_warehouse', serializer.errors)

    def test_read_only_fields_ignored_on_input(self):
        """id, created_at, updated_at no se aceptan como input (read only)."""
        data = self.valid_data.copy()
        data['id'] = 9999
        data['created_at'] = '2020-01-01T00:00:00Z'
        serializer = RouteSerializer(data=data)
        self.assertTrue(serializer.is_valid(), serializer.errors)
        self.assertNotIn('id', serializer.validated_data)
        self.assertNotIn('created_at', serializer.validated_data)

    def test_stops_field_is_read_only_list(self):
        """stops es read-only y retorna lista vacía cuando no hay paradas."""
        route = Route.objects.create(
            name='Ruta Sin Paradas',
            origin_warehouse=self.warehouse,
        )
        serializer = RouteSerializer(route)
        self.assertEqual(serializer.data['stops'], [])

    def test_optional_fields_can_be_null(self):
        """distance_km y estimated_duration_h son opcionales."""
        data = {
            'name': 'Ruta Mínima',
            'origin_warehouse': self.warehouse.pk,
        }
        serializer = RouteSerializer(data=data)
        self.assertTrue(serializer.is_valid(), serializer.errors)


class RouteStopSerializerTest(TestCase):
    def setUp(self):
        self.warehouse = Warehouse.objects.create(
            name='Almacén Callao',
            address='Av. Néstor Gambetta 2500, Callao',
            city='Callao',
            country='Peru',
        )
        self.route = Route.objects.create(
            name='Ruta Callao - Piura',
            origin_warehouse=self.warehouse,
            distance_km='1000.00',
            estimated_duration_h='14.00',
        )
        self.valid_data = {
            'route': self.route.pk,
            'stop_order': 1,
            'address': 'Av. Grau 100, Trujillo',
            'city': 'Trujillo',
            'latitude': '-8.111556',
            'longitude': '-79.028968',
        }

    def test_valid_data_is_valid(self):
        """Datos completos y correctos pasan validación."""
        serializer = RouteStopSerializer(data=self.valid_data)
        self.assertTrue(serializer.is_valid(), serializer.errors)

    def test_serializer_contains_expected_fields(self):
        """Todos los campos del schema están presentes en el serializer."""
        stop = RouteStop.objects.create(
            route=self.route,
            stop_order=1,
            address='Av. Grau 100, Trujillo',
            city='Trujillo',
        )
        serializer = RouteStopSerializer(stop)
        expected_fields = ['id', 'route', 'stop_order', 'address', 'city', 'latitude', 'longitude']
        for field in expected_fields:
            self.assertIn(field, serializer.data)

    def test_missing_route_invalid(self):
        """route faltante hace el serializer inválido."""
        data = self.valid_data.copy()
        del data['route']
        serializer = RouteStopSerializer(data=data)
        self.assertFalse(serializer.is_valid())
        self.assertIn('route', serializer.errors)

    def test_missing_address_invalid(self):
        """address faltante hace el serializer inválido."""
        data = self.valid_data.copy()
        del data['address']
        serializer = RouteStopSerializer(data=data)
        self.assertFalse(serializer.is_valid())
        self.assertIn('address', serializer.errors)

    def test_missing_city_invalid(self):
        """city faltante hace el serializer inválido."""
        data = self.valid_data.copy()
        del data['city']
        serializer = RouteStopSerializer(data=data)
        self.assertFalse(serializer.is_valid())
        self.assertIn('city', serializer.errors)

    def test_latitude_longitude_optional(self):
        """latitude y longitude son opcionales."""
        data = self.valid_data.copy()
        del data['latitude']
        del data['longitude']
        serializer = RouteStopSerializer(data=data)
        self.assertTrue(serializer.is_valid(), serializer.errors)

    def test_read_only_id_ignored_on_input(self):
        """id no se acepta como input (read only)."""
        data = self.valid_data.copy()
        data['id'] = 9999
        serializer = RouteStopSerializer(data=data)
        self.assertTrue(serializer.is_valid(), serializer.errors)
        self.assertNotIn('id', serializer.validated_data)

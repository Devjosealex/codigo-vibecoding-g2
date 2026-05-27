from django.test import TestCase
from django.db import IntegrityError
from apps.warehouses.models import Warehouse
from apps.warehouses.serializers import WarehouseSerializer


class WarehouseModelTest(TestCase):
    def setUp(self):
        self.warehouse = Warehouse.objects.create(
            name='Almacenes Miraflores EIRL',
            address='Av. Larco 1234, Miraflores',
            city='Lima',
            country='Peru',
            latitude=-12.119900,
            longitude=-77.029700,
            capacity_m3=500.00,
        )

    def test_create_warehouse_success(self):
        """Creación con datos válidos guarda correctamente en DB."""
        self.assertIsNotNone(self.warehouse.pk)
        self.assertEqual(self.warehouse.name, 'Almacenes Miraflores EIRL')
        self.assertEqual(self.warehouse.city, 'Lima')
        self.assertEqual(self.warehouse.country, 'Peru')

    def test_str_returns_expected(self):
        """__str__ retorna nombre y ciudad del almacén."""
        expected = 'Almacenes Miraflores EIRL (Lima)'
        self.assertEqual(str(self.warehouse), expected)

    def test_is_active_default_true(self):
        """is_active=True por defecto al crear."""
        self.assertTrue(self.warehouse.is_active)

    def test_created_at_auto_set(self):
        """created_at se asigna automáticamente."""
        self.assertIsNotNone(self.warehouse.created_at)

    def test_updated_at_auto_set(self):
        """updated_at se asigna automáticamente."""
        self.assertIsNotNone(self.warehouse.updated_at)

    def test_country_default_peru(self):
        """country tiene valor por defecto 'Peru'."""
        warehouse = Warehouse.objects.create(
            name='Almacén Sur SAC',
            address='Calle Los Pinos 456',
            city='Arequipa',
        )
        self.assertEqual(warehouse.country, 'Peru')

    def test_optional_fields_can_be_null(self):
        """latitude, longitude y capacity_m3 pueden ser nulos."""
        warehouse = Warehouse.objects.create(
            name='Almacén Mínimo SRL',
            address='Jr. Lima 789',
            city='Trujillo',
        )
        self.assertIsNone(warehouse.latitude)
        self.assertIsNone(warehouse.longitude)
        self.assertIsNone(warehouse.capacity_m3)

    def test_soft_delete_sets_is_active_false(self):
        """Soft delete marca is_active=False pero el registro persiste en DB."""
        pk = self.warehouse.pk
        self.warehouse.is_active = False
        self.warehouse.save()
        obj = Warehouse.objects.get(pk=pk)
        self.assertFalse(obj.is_active)

    def test_soft_deleted_warehouse_persists_in_db(self):
        """El almacén con is_active=False sigue existiendo en la base de datos."""
        self.warehouse.is_active = False
        self.warehouse.save()
        self.assertTrue(Warehouse.objects.filter(pk=self.warehouse.pk).exists())

    def test_create_without_name_saves_empty_string(self):
        """Django CharField sin blank=False permite cadena vacía en DB;
        la validación de campos requeridos se aplica en el serializer."""
        # El modelo en sí no lanza error al omitir name (CharFields permiten ''),
        # la restricción se aplica a nivel de serializer (blank=False implícito en DRF)
        warehouse = Warehouse.objects.create(
            name='',
            address='Av. Arequipa 500',
            city='Lima',
        )
        self.assertIsNotNone(warehouse.pk)
        self.assertEqual(warehouse.name, '')

    def test_multiple_warehouses_same_city(self):
        """Se pueden crear varios almacenes en la misma ciudad (no hay unique en city)."""
        warehouse2 = Warehouse.objects.create(
            name='Almacén Norte Cusco EIRL',
            address='Av. Sol 1000',
            city='Cusco',
        )
        warehouse3 = Warehouse.objects.create(
            name='Almacén Centro Cusco SAC',
            address='Calle Hatunrumiyoc 200',
            city='Cusco',
        )
        self.assertNotEqual(warehouse2.pk, warehouse3.pk)

    def test_ordering_by_created_at_desc(self):
        """El queryset por defecto ordena por -created_at."""
        warehouse2 = Warehouse.objects.create(
            name='Almacén Nuevo Lima SAC',
            address='Av. Javier Prado 2000',
            city='Lima',
        )
        warehouses = list(Warehouse.objects.all())
        # El más reciente debe ser el primero
        self.assertEqual(warehouses[0].pk, warehouse2.pk)


class WarehouseSerializerTest(TestCase):
    def setUp(self):
        self.valid_data = {
            'name': 'Almacenes Callao SAC',
            'address': 'Av. Néstor Gambetta 3000, Callao',
            'city': 'Callao',
            'country': 'Peru',
            'latitude': '-12.0566',
            'longitude': '-77.1181',
            'capacity_m3': '1200.50',
            'is_active': True,
        }

    def test_valid_data_is_valid(self):
        """Datos completos y correctos pasan validación."""
        serializer = WarehouseSerializer(data=self.valid_data)
        self.assertTrue(serializer.is_valid(), serializer.errors)

    def test_serializer_contains_expected_fields(self):
        """Todos los campos del schema están presentes en el serializer."""
        instance = Warehouse.objects.create(
            name='Almacenes Test Arequipa EIRL',
            address='Av. Ejército 456, Arequipa',
            city='Arequipa',
            country='Peru',
        )
        serializer = WarehouseSerializer(instance)
        expected_fields = [
            'id', 'name', 'address', 'city', 'country',
            'latitude', 'longitude', 'capacity_m3',
            'is_active', 'created_at', 'updated_at'
        ]
        for field in expected_fields:
            self.assertIn(field, serializer.data)

    def test_missing_name_invalid(self):
        """name requerido faltante hace el serializer inválido."""
        data = self.valid_data.copy()
        del data['name']
        serializer = WarehouseSerializer(data=data)
        self.assertFalse(serializer.is_valid())
        self.assertIn('name', serializer.errors)

    def test_missing_address_invalid(self):
        """address requerido faltante hace el serializer inválido."""
        data = self.valid_data.copy()
        del data['address']
        serializer = WarehouseSerializer(data=data)
        self.assertFalse(serializer.is_valid())
        self.assertIn('address', serializer.errors)

    def test_missing_city_invalid(self):
        """city requerido faltante hace el serializer inválido."""
        data = self.valid_data.copy()
        del data['city']
        serializer = WarehouseSerializer(data=data)
        self.assertFalse(serializer.is_valid())
        self.assertIn('city', serializer.errors)

    def test_empty_name_invalid(self):
        """name vacío hace el serializer inválido."""
        data = self.valid_data.copy()
        data['name'] = ''
        serializer = WarehouseSerializer(data=data)
        self.assertFalse(serializer.is_valid())

    def test_empty_address_invalid(self):
        """address vacío hace el serializer inválido."""
        data = self.valid_data.copy()
        data['address'] = ''
        serializer = WarehouseSerializer(data=data)
        self.assertFalse(serializer.is_valid())

    def test_optional_fields_not_required(self):
        """latitude, longitude y capacity_m3 son opcionales."""
        data = {
            'name': 'Almacén Mínimo Lima SAC',
            'address': 'Jr. Carabaya 100, Lima',
            'city': 'Lima',
        }
        serializer = WarehouseSerializer(data=data)
        self.assertTrue(serializer.is_valid(), serializer.errors)

    def test_read_only_fields_ignored_on_input(self):
        """id, created_at, updated_at no se aceptan como input (read only)."""
        data = self.valid_data.copy()
        data['id'] = 9999
        data['created_at'] = '2020-01-01T00:00:00Z'
        data['updated_at'] = '2020-01-01T00:00:00Z'
        serializer = WarehouseSerializer(data=data)
        self.assertTrue(serializer.is_valid(), serializer.errors)
        self.assertNotIn('id', serializer.validated_data)
        self.assertNotIn('created_at', serializer.validated_data)
        self.assertNotIn('updated_at', serializer.validated_data)

    def test_serializer_saves_correctly(self):
        """save() crea correctamente el objeto en la DB."""
        serializer = WarehouseSerializer(data=self.valid_data)
        self.assertTrue(serializer.is_valid(), serializer.errors)
        instance = serializer.save()
        self.assertIsNotNone(instance.pk)
        self.assertEqual(instance.name, 'Almacenes Callao SAC')
        self.assertEqual(instance.city, 'Callao')

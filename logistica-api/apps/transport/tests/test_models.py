from django.test import TestCase
from django.db import IntegrityError
from datetime import date
from apps.transport.models import Vehicle
from apps.transport.serializers import VehicleSerializer
from apps.drivers.models import Driver


class VehicleModelTest(TestCase):
    def setUp(self):
        self.driver = Driver.objects.create(
            first_name='Carlos',
            last_name='Quispe',
            document_number='12345678',
            license_number='LIC-001',
            license_expiry=date(2027, 12, 31),
            phone='987654321',
            email='cquispe@transporteslima.com',
        )
        self.vehicle = Vehicle.objects.create(
            driver=self.driver,
            name='Camión Lima Norte',
            plate_number='ABC-123',
            vehicle_type='truck',
            capacity_kg='5000.00',
            capacity_m3='20.00',
        )

    def test_create_vehicle_success(self):
        """Creación con datos válidos guarda correctamente en DB."""
        self.assertIsNotNone(self.vehicle.pk)
        self.assertEqual(self.vehicle.name, 'Camión Lima Norte')
        self.assertEqual(self.vehicle.plate_number, 'ABC-123')
        self.assertEqual(self.vehicle.vehicle_type, 'truck')

    def test_str_returns_expected(self):
        """__str__ retorna nombre y placa del vehículo."""
        self.assertEqual(str(self.vehicle), 'Camión Lima Norte (ABC-123)')

    def test_is_active_default_true(self):
        """is_active=True por defecto al crear."""
        self.assertTrue(self.vehicle.is_active)

    def test_created_at_auto_set(self):
        """created_at se asigna automáticamente."""
        self.assertIsNotNone(self.vehicle.created_at)

    def test_updated_at_auto_set(self):
        """updated_at se asigna automáticamente."""
        self.assertIsNotNone(self.vehicle.updated_at)

    def test_driver_fk_nullable(self):
        """driver es opcional — puede ser None."""
        vehicle = Vehicle.objects.create(
            name='Furgoneta Sin Conductor',
            plate_number='XYZ-999',
            vehicle_type='van',
        )
        self.assertIsNone(vehicle.driver)

    def test_driver_set_null_on_driver_delete(self):
        """Al borrar el driver, vehicle.driver queda en NULL (SET_NULL)."""
        pk = self.vehicle.pk
        self.driver.delete()
        self.vehicle.refresh_from_db()
        self.assertIsNone(self.vehicle.driver)

    def test_soft_delete_sets_is_active_false(self):
        """Soft delete marca is_active=False pero el registro persiste en DB."""
        pk = self.vehicle.pk
        self.vehicle.is_active = False
        self.vehicle.save()
        obj = Vehicle.objects.get(pk=pk)
        self.assertFalse(obj.is_active)

    def test_soft_delete_record_persists(self):
        """El registro con is_active=False sigue existiendo en la DB."""
        self.vehicle.is_active = False
        self.vehicle.save()
        self.assertTrue(Vehicle.objects.filter(pk=self.vehicle.pk).exists())

    def test_create_without_name_fails(self):
        """Campo name requerido vacío lanza IntegrityError o ValueError."""
        with self.assertRaises(Exception):
            Vehicle.objects.create(
                plate_number='DEF-456',
                vehicle_type='truck',
                name=None,
            )

    def test_duplicate_plate_number_fails(self):
        """plate_number único duplicado lanza IntegrityError."""
        with self.assertRaises(IntegrityError):
            Vehicle.objects.create(
                name='Duplicado',
                plate_number='ABC-123',  # misma placa que setUp
                vehicle_type='van',
            )

    def test_vehicle_type_choices_all_valid(self):
        """Todos los choices de vehicle_type se pueden crear."""
        valid_choices = ['truck', 'van', 'motorcycle', 'other']
        for i, choice in enumerate(valid_choices):
            v = Vehicle.objects.create(
                name=f'Vehículo {choice}',
                plate_number=f'TST-{i:03d}',
                vehicle_type=choice,
            )
            self.assertEqual(v.vehicle_type, choice)

    def test_capacity_fields_optional(self):
        """capacity_kg y capacity_m3 son opcionales (null=True)."""
        vehicle = Vehicle.objects.create(
            name='Motocicleta Delivery',
            plate_number='MTO-001',
            vehicle_type='motorcycle',
        )
        self.assertIsNone(vehicle.capacity_kg)
        self.assertIsNone(vehicle.capacity_m3)


class VehicleSerializerTest(TestCase):
    def setUp(self):
        self.driver = Driver.objects.create(
            first_name='Ana',
            last_name='Torres',
            document_number='87654321',
            license_number='LIC-002',
            license_expiry=date(2026, 6, 30),
            phone='999888777',
            email='atorres@logisticaperu.com',
        )
        self.valid_data = {
            'driver': self.driver.pk,
            'name': 'Camión Arequipa Sur',
            'plate_number': 'AQP-456',
            'vehicle_type': 'truck',
            'capacity_kg': '8000.00',
            'capacity_m3': '35.00',
            'is_active': True,
        }

    def test_valid_data_is_valid(self):
        """Datos completos y correctos pasan validación."""
        serializer = VehicleSerializer(data=self.valid_data)
        self.assertTrue(serializer.is_valid(), serializer.errors)

    def test_valid_data_without_optional_fields(self):
        """Datos sin campos opcionales (driver, capacity) también son válidos."""
        data = {
            'name': 'Furgoneta Trujillo',
            'plate_number': 'TRU-789',
            'vehicle_type': 'van',
        }
        serializer = VehicleSerializer(data=data)
        self.assertTrue(serializer.is_valid(), serializer.errors)

    def test_serializer_contains_expected_fields(self):
        """Todos los campos del schema están presentes en el serializer."""
        instance = Vehicle.objects.create(
            driver=self.driver,
            name='Camión Test',
            plate_number='TST-001',
            vehicle_type='truck',
            capacity_kg='5000.00',
            capacity_m3='20.00',
        )
        serializer = VehicleSerializer(instance)
        expected_fields = [
            'id', 'driver', 'name', 'plate_number', 'vehicle_type',
            'capacity_kg', 'capacity_m3', 'is_active', 'created_at', 'updated_at',
        ]
        for field in expected_fields:
            self.assertIn(field, serializer.data)

    def test_missing_name_invalid(self):
        """Campo name requerido faltante hace el serializer inválido."""
        data = self.valid_data.copy()
        del data['name']
        serializer = VehicleSerializer(data=data)
        self.assertFalse(serializer.is_valid())
        self.assertIn('name', serializer.errors)

    def test_missing_plate_number_invalid(self):
        """Campo plate_number requerido faltante hace el serializer inválido."""
        data = self.valid_data.copy()
        del data['plate_number']
        serializer = VehicleSerializer(data=data)
        self.assertFalse(serializer.is_valid())
        self.assertIn('plate_number', serializer.errors)

    def test_missing_vehicle_type_invalid(self):
        """Campo vehicle_type requerido faltante hace el serializer inválido."""
        data = self.valid_data.copy()
        del data['vehicle_type']
        serializer = VehicleSerializer(data=data)
        self.assertFalse(serializer.is_valid())
        self.assertIn('vehicle_type', serializer.errors)

    def test_empty_name_invalid(self):
        """Campo name vacío hace el serializer inválido."""
        data = self.valid_data.copy()
        data['name'] = ''
        serializer = VehicleSerializer(data=data)
        self.assertFalse(serializer.is_valid())

    def test_invalid_vehicle_type_invalid(self):
        """vehicle_type con valor fuera de choices hace el serializer inválido."""
        data = self.valid_data.copy()
        data['vehicle_type'] = 'helicopter'
        serializer = VehicleSerializer(data=data)
        self.assertFalse(serializer.is_valid())
        self.assertIn('vehicle_type', serializer.errors)

    def test_read_only_fields_ignored_on_input(self):
        """id, created_at, updated_at no se aceptan como input (read only)."""
        data = self.valid_data.copy()
        data['id'] = 9999
        data['created_at'] = '2020-01-01T00:00:00Z'
        data['updated_at'] = '2020-01-01T00:00:00Z'
        serializer = VehicleSerializer(data=data)
        self.assertTrue(serializer.is_valid(), serializer.errors)
        self.assertNotIn('id', serializer.validated_data)
        self.assertNotIn('created_at', serializer.validated_data)
        self.assertNotIn('updated_at', serializer.validated_data)

    def test_duplicate_plate_number_invalid(self):
        """plate_number duplicado hace el serializer inválido (unique constraint)."""
        Vehicle.objects.create(
            name='Primer Vehículo',
            plate_number='AQP-456',
            vehicle_type='truck',
        )
        serializer = VehicleSerializer(data=self.valid_data)
        self.assertFalse(serializer.is_valid())
        self.assertIn('plate_number', serializer.errors)

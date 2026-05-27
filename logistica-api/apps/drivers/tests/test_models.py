from django.test import TestCase
from django.db import IntegrityError
from apps.drivers.models import Driver
from apps.drivers.serializers import DriverSerializer


class DriverModelTest(TestCase):
    def setUp(self):
        self.driver = Driver.objects.create(
            first_name='Carlos',
            last_name='Quispe',
            document_number='12345678',
            license_number='Q15-2023',
            license_expiry='2027-06-30',
            phone='987654321',
            email='carlos.quispe@transporteslima.pe',
        )

    # Happy path
    def test_create_driver_success(self):
        """Creación con datos válidos guarda correctamente en DB."""
        self.assertIsNotNone(self.driver.pk)
        self.assertEqual(self.driver.first_name, 'Carlos')
        self.assertEqual(self.driver.last_name, 'Quispe')
        self.assertEqual(self.driver.document_number, '12345678')
        self.assertEqual(self.driver.license_number, 'Q15-2023')

    def test_str_returns_full_name(self):
        """__str__ retorna first_name + last_name."""
        self.assertEqual(str(self.driver), 'Carlos Quispe')

    def test_is_active_default_true(self):
        """is_active=True por defecto al crear."""
        self.assertTrue(self.driver.is_active)

    def test_created_at_auto_set(self):
        """created_at se asigna automáticamente."""
        self.assertIsNotNone(self.driver.created_at)

    def test_updated_at_auto_set(self):
        """updated_at se asigna automáticamente."""
        self.assertIsNotNone(self.driver.updated_at)

    def test_phone_nullable(self):
        """phone puede ser nulo."""
        driver = Driver.objects.create(
            first_name='Ana',
            last_name='Torres',
            document_number='87654321',
            license_number='A22-2024',
            license_expiry='2026-12-31',
            phone=None,
            email=None,
        )
        self.assertIsNone(driver.phone)
        self.assertIsNone(driver.email)

    # Soft delete
    def test_soft_delete_sets_is_active_false(self):
        """Soft delete marca is_active=False pero el registro persiste en DB."""
        pk = self.driver.pk
        self.driver.is_active = False
        self.driver.save()
        obj = Driver.objects.get(pk=pk)
        self.assertFalse(obj.is_active)

    def test_soft_deleted_driver_persists_in_db(self):
        """El registro permanece en DB tras el soft delete."""
        pk = self.driver.pk
        self.driver.is_active = False
        self.driver.save()
        self.assertTrue(Driver.objects.filter(pk=pk).exists())

    # Unhappy path — campos requeridos
    def test_create_without_first_name_fails(self):
        """first_name requerido — crear sin él lanza error."""
        with self.assertRaises(Exception):
            driver = Driver(
                last_name='Gomez',
                document_number='11111111',
                license_number='X00-0001',
                license_expiry='2028-01-01',
            )
            driver.full_clean()

    def test_create_without_license_expiry_fails(self):
        """license_expiry requerido — crear sin él lanza error."""
        with self.assertRaises(Exception):
            driver = Driver(
                first_name='Pedro',
                last_name='Salas',
                document_number='22222222',
                license_number='P10-2025',
            )
            driver.full_clean()

    # Edge cases — campos unique
    def test_duplicate_document_number_fails(self):
        """document_number único — duplicado lanza IntegrityError."""
        with self.assertRaises(IntegrityError):
            Driver.objects.create(
                first_name='Luis',
                last_name='Ramirez',
                document_number='12345678',  # mismo que setUp
                license_number='L99-2025',
                license_expiry='2026-05-01',
            )

    def test_duplicate_license_number_fails(self):
        """license_number único — duplicado lanza IntegrityError."""
        with self.assertRaises(IntegrityError):
            Driver.objects.create(
                first_name='Maria',
                last_name='Flores',
                document_number='99999999',
                license_number='Q15-2023',  # mismo que setUp
                license_expiry='2025-10-01',
            )

    def test_ordering_by_last_name_then_first_name(self):
        """El queryset está ordenado por last_name, first_name."""
        Driver.objects.create(
            first_name='Beatriz',
            last_name='Aliaga',
            document_number='33333333',
            license_number='B01-2026',
            license_expiry='2029-03-01',
        )
        first = Driver.objects.all().first()
        self.assertEqual(first.last_name, 'Aliaga')


class DriverSerializerTest(TestCase):
    def setUp(self):
        self.valid_data = {
            'first_name': 'Jorge',
            'last_name': 'Medina',
            'document_number': '55566677',
            'license_number': 'J03-2025',
            'license_expiry': '2028-08-15',
            'phone': '956123456',
            'email': 'jorge.medina@logistica.pe',
        }

    # Happy path
    def test_valid_data_is_valid(self):
        """Datos completos y correctos pasan validación."""
        serializer = DriverSerializer(data=self.valid_data)
        self.assertTrue(serializer.is_valid(), serializer.errors)

    def test_serializer_contains_expected_fields(self):
        """Todos los campos del schema están presentes en el serializer."""
        instance = Driver.objects.create(**self.valid_data)
        serializer = DriverSerializer(instance)
        expected_fields = [
            'id', 'first_name', 'last_name', 'document_number',
            'license_number', 'license_expiry', 'phone', 'email',
            'is_active', 'created_at', 'updated_at',
        ]
        for field in expected_fields:
            self.assertIn(field, serializer.data)

    def test_valid_without_optional_fields(self):
        """Datos sin campos opcionales (phone, email) son válidos."""
        data = {
            'first_name': 'Rosa',
            'last_name': 'Chuquihuanga',
            'document_number': '66677788',
            'license_number': 'R07-2026',
            'license_expiry': '2030-01-01',
        }
        serializer = DriverSerializer(data=data)
        self.assertTrue(serializer.is_valid(), serializer.errors)

    # Unhappy path
    def test_missing_first_name_invalid(self):
        """first_name faltante hace el serializer inválido."""
        data = self.valid_data.copy()
        del data['first_name']
        serializer = DriverSerializer(data=data)
        self.assertFalse(serializer.is_valid())
        self.assertIn('first_name', serializer.errors)

    def test_missing_document_number_invalid(self):
        """document_number faltante hace el serializer inválido."""
        data = self.valid_data.copy()
        del data['document_number']
        serializer = DriverSerializer(data=data)
        self.assertFalse(serializer.is_valid())
        self.assertIn('document_number', serializer.errors)

    def test_missing_license_number_invalid(self):
        """license_number faltante hace el serializer inválido."""
        data = self.valid_data.copy()
        del data['license_number']
        serializer = DriverSerializer(data=data)
        self.assertFalse(serializer.is_valid())
        self.assertIn('license_number', serializer.errors)

    def test_missing_license_expiry_invalid(self):
        """license_expiry faltante hace el serializer inválido."""
        data = self.valid_data.copy()
        del data['license_expiry']
        serializer = DriverSerializer(data=data)
        self.assertFalse(serializer.is_valid())
        self.assertIn('license_expiry', serializer.errors)

    def test_empty_first_name_invalid(self):
        """first_name vacío hace el serializer inválido."""
        data = self.valid_data.copy()
        data['first_name'] = ''
        serializer = DriverSerializer(data=data)
        self.assertFalse(serializer.is_valid())

    def test_invalid_email_invalid(self):
        """email con formato incorrecto hace el serializer inválido."""
        data = self.valid_data.copy()
        data['email'] = 'not-an-email'
        serializer = DriverSerializer(data=data)
        self.assertFalse(serializer.is_valid())
        self.assertIn('email', serializer.errors)

    # Edge case
    def test_read_only_fields_ignored_on_input(self):
        """id, created_at, updated_at no se aceptan como input (read only)."""
        data = self.valid_data.copy()
        data['id'] = 9999
        serializer = DriverSerializer(data=data)
        self.assertTrue(serializer.is_valid(), serializer.errors)
        self.assertNotIn('id', serializer.validated_data)

    def test_serializer_saves_driver(self):
        """save() crea el Driver en DB correctamente."""
        serializer = DriverSerializer(data=self.valid_data)
        self.assertTrue(serializer.is_valid())
        driver = serializer.save()
        self.assertIsNotNone(driver.pk)
        self.assertEqual(driver.first_name, 'Jorge')

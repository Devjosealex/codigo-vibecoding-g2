from django.test import TestCase
from django.db import IntegrityError
from apps.suppliers.models import Supplier
from apps.suppliers.serializers import SupplierSerializer


class SupplierModelTest(TestCase):
    def setUp(self):
        self.supplier = Supplier.objects.create(
            name='Tecnología Lima SAC',
            contact_name='Carlos Mendoza',
            tax_id='20123456789',
            email='contacto@tecnologialima.com.pe',
            phone='01-4567890',
            address='Av. Javier Prado Este 1234, San Isidro',
            city='Lima',
            country='Peru',
        )

    # Happy path
    def test_create_supplier_success(self):
        """Creación con datos válidos guarda correctamente en DB."""
        self.assertIsNotNone(self.supplier.pk)
        self.assertEqual(self.supplier.name, 'Tecnología Lima SAC')
        self.assertEqual(self.supplier.contact_name, 'Carlos Mendoza')
        self.assertEqual(self.supplier.tax_id, '20123456789')
        self.assertEqual(self.supplier.email, 'contacto@tecnologialima.com.pe')
        self.assertEqual(self.supplier.city, 'Lima')
        self.assertEqual(self.supplier.country, 'Peru')

    def test_str_returns_expected(self):
        """__str__ retorna el nombre del proveedor."""
        self.assertEqual(str(self.supplier), 'Tecnología Lima SAC')

    def test_is_active_default_true(self):
        """is_active=True por defecto al crear."""
        self.assertTrue(self.supplier.is_active)

    def test_created_at_auto_set(self):
        """created_at se asigna automáticamente."""
        self.assertIsNotNone(self.supplier.created_at)

    def test_updated_at_auto_set(self):
        """updated_at se asigna automáticamente."""
        self.assertIsNotNone(self.supplier.updated_at)

    def test_country_default_peru(self):
        """El país por defecto es Peru."""
        supplier = Supplier.objects.create(name='Proveedor Arequipa EIRL')
        self.assertEqual(supplier.country, 'Peru')

    def test_optional_fields_nullable(self):
        """Campos opcionales pueden ser nulos."""
        supplier = Supplier.objects.create(name='Proveedor Mínimo SRL')
        self.assertIsNone(supplier.contact_name)
        self.assertIsNone(supplier.tax_id)
        self.assertIsNone(supplier.email)
        self.assertIsNone(supplier.phone)
        self.assertIsNone(supplier.address)
        self.assertIsNone(supplier.city)

    # Soft delete
    def test_soft_delete_sets_is_active_false(self):
        """Soft delete marca is_active=False pero el registro persiste en DB."""
        pk = self.supplier.pk
        self.supplier.is_active = False
        self.supplier.save()
        obj = Supplier.objects.get(pk=pk)
        self.assertFalse(obj.is_active)

    def test_soft_delete_record_persists_in_db(self):
        """El registro persiste en DB después del soft delete."""
        pk = self.supplier.pk
        self.supplier.is_active = False
        self.supplier.save()
        self.assertTrue(Supplier.objects.filter(pk=pk).exists())

    # Unhappy path — campos requeridos
    def test_create_without_name_fails(self):
        """Campo name requerido vacío lanza error de integridad."""
        with self.assertRaises(Exception):
            Supplier.objects.create(name=None)

    # Edge cases — campo unique
    def test_duplicate_tax_id_fails(self):
        """tax_id duplicado lanza IntegrityError."""
        with self.assertRaises(IntegrityError):
            Supplier.objects.create(
                name='Otro Proveedor SAC',
                tax_id='20123456789',  # mismo que setUp
            )

    def test_null_tax_id_not_unique_constraint(self):
        """Múltiples proveedores con tax_id=None son permitidos."""
        supplier1 = Supplier.objects.create(name='Proveedor Sin RUC 1')
        supplier2 = Supplier.objects.create(name='Proveedor Sin RUC 2')
        self.assertIsNone(supplier1.tax_id)
        self.assertIsNone(supplier2.tax_id)


class SupplierSerializerTest(TestCase):
    def setUp(self):
        self.valid_data = {
            'name': 'Almacenes Miraflores EIRL',
            'contact_name': 'Rosa Quispe',
            'tax_id': '20987654321',
            'email': 'ventas@almacenesmiraflores.pe',
            'phone': '01-2345678',
            'address': 'Jr. Huallaga 456, Miraflores',
            'city': 'Lima',
            'country': 'Peru',
            'is_active': True,
        }

    # Happy path
    def test_valid_data_is_valid(self):
        """Datos completos y correctos pasan validación."""
        serializer = SupplierSerializer(data=self.valid_data)
        self.assertTrue(serializer.is_valid(), serializer.errors)

    def test_serializer_contains_expected_fields(self):
        """Todos los campos del schema están presentes en el serializer."""
        instance = Supplier.objects.create(**self.valid_data)
        serializer = SupplierSerializer(instance)
        expected_fields = [
            'id', 'name', 'contact_name', 'tax_id', 'email',
            'phone', 'address', 'city', 'country',
            'is_active', 'created_at', 'updated_at',
        ]
        for field in expected_fields:
            self.assertIn(field, serializer.data)

    def test_only_name_required(self):
        """Solo el campo name es requerido para crear un proveedor."""
        serializer = SupplierSerializer(data={'name': 'Proveedor Mínimo SAC'})
        self.assertTrue(serializer.is_valid(), serializer.errors)

    def test_serializer_saves_correct_data(self):
        """El serializer guarda correctamente los datos validados."""
        serializer = SupplierSerializer(data=self.valid_data)
        self.assertTrue(serializer.is_valid())
        instance = serializer.save()
        self.assertEqual(instance.name, 'Almacenes Miraflores EIRL')
        self.assertEqual(instance.tax_id, '20987654321')
        self.assertEqual(instance.city, 'Lima')

    # Unhappy path
    def test_missing_name_invalid(self):
        """Campo name faltante hace el serializer inválido."""
        data = self.valid_data.copy()
        del data['name']
        serializer = SupplierSerializer(data=data)
        self.assertFalse(serializer.is_valid())
        self.assertIn('name', serializer.errors)

    def test_empty_name_invalid(self):
        """Campo name vacío hace el serializer inválido."""
        data = self.valid_data.copy()
        data['name'] = ''
        serializer = SupplierSerializer(data=data)
        self.assertFalse(serializer.is_valid())
        self.assertIn('name', serializer.errors)

    def test_invalid_email_format_invalid(self):
        """Email con formato inválido hace el serializer inválido."""
        data = self.valid_data.copy()
        data['email'] = 'no-es-un-email'
        serializer = SupplierSerializer(data=data)
        self.assertFalse(serializer.is_valid())
        self.assertIn('email', serializer.errors)

    # Edge case — read only fields
    def test_read_only_fields_ignored_on_input(self):
        """id, created_at, updated_at no se aceptan como input (read only)."""
        data = self.valid_data.copy()
        data['id'] = 9999
        data['created_at'] = '2020-01-01T00:00:00Z'
        data['updated_at'] = '2020-01-01T00:00:00Z'
        serializer = SupplierSerializer(data=data)
        self.assertTrue(serializer.is_valid(), serializer.errors)
        self.assertNotIn('id', serializer.validated_data)
        self.assertNotIn('created_at', serializer.validated_data)
        self.assertNotIn('updated_at', serializer.validated_data)

    def test_serializer_partial_update(self):
        """Actualización parcial con partial=True es válida."""
        instance = Supplier.objects.create(**self.valid_data)
        serializer = SupplierSerializer(
            instance,
            data={'name': 'Nombre Actualizado SAC'},
            partial=True,
        )
        self.assertTrue(serializer.is_valid(), serializer.errors)
        updated = serializer.save()
        self.assertEqual(updated.name, 'Nombre Actualizado SAC')

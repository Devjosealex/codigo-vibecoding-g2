from django.test import TestCase
from django.db import IntegrityError
from django.contrib.auth.models import User
from apps.customers.models import Customer
from apps.customers.serializers import CustomerSerializer


class CustomerModelTest(TestCase):
    def setUp(self):
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

    def test_create_customer_success(self):
        """Creación con datos válidos guarda correctamente en DB."""
        self.assertIsNotNone(self.customer.pk)
        self.assertEqual(self.customer.name, 'Transportes Lima SAC')
        self.assertEqual(self.customer.customer_type, 'company')
        self.assertEqual(self.customer.tax_id, '20123456789')
        self.assertEqual(self.customer.email, 'contacto@transporteslima.pe')

    def test_str_returns_name(self):
        """__str__ retorna el nombre del cliente."""
        self.assertEqual(str(self.customer), 'Transportes Lima SAC')

    def test_is_active_default_true(self):
        """is_active=True por defecto al crear."""
        self.assertTrue(self.customer.is_active)

    def test_country_default_peru(self):
        """country='Peru' por defecto."""
        customer = Customer.objects.create(
            name='Cliente Sin País',
            customer_type='individual',
            email='sinpais@example.com',
        )
        self.assertEqual(customer.country, 'Peru')

    def test_created_at_auto_set(self):
        """created_at se asigna automáticamente."""
        self.assertIsNotNone(self.customer.created_at)

    def test_updated_at_auto_set(self):
        """updated_at se asigna automáticamente."""
        self.assertIsNotNone(self.customer.updated_at)

    def test_soft_delete_sets_is_active_false(self):
        """Soft delete marca is_active=False pero el registro persiste en DB."""
        pk = self.customer.pk
        self.customer.is_active = False
        self.customer.save()
        obj = Customer.objects.get(pk=pk)
        self.assertFalse(obj.is_active)

    def test_soft_delete_record_persists(self):
        """Registro con is_active=False sigue existiendo en DB."""
        pk = self.customer.pk
        self.customer.is_active = False
        self.customer.save()
        self.assertTrue(Customer.objects.filter(pk=pk).exists())

    def test_create_without_name_fails(self):
        """name es requerido — Django validation rechaza objeto sin name."""
        from django.core.exceptions import ValidationError
        customer = Customer(
            customer_type='company',
            email='test@example.com',
        )
        with self.assertRaises(ValidationError):
            customer.full_clean()

    def test_duplicate_tax_id_fails(self):
        """tax_id es UNIQUE — duplicado lanza IntegrityError."""
        with self.assertRaises(IntegrityError):
            Customer.objects.create(
                name='Empresa Duplicada SAC',
                customer_type='company',
                tax_id='20123456789',  # mismo que setUp
                email='otro@empresa.pe',
            )

    def test_create_individual_customer(self):
        """Crear cliente tipo individual con DNI."""
        customer = Customer.objects.create(
            name='Juan Pérez García',
            customer_type='individual',
            tax_id='12345678',
            email='juan.perez@gmail.com',
            city='Arequipa',
        )
        self.assertEqual(customer.customer_type, 'individual')
        self.assertEqual(customer.tax_id, '12345678')

    def test_optional_fields_nullable(self):
        """Campos opcionales (phone, address, city) pueden ser nulos."""
        customer = Customer.objects.create(
            name='Cliente Mínimo EIRL',
            customer_type='company',
            email='minimo@eirl.pe',
        )
        self.assertIsNone(customer.phone)
        self.assertIsNone(customer.address)
        self.assertIsNone(customer.city)
        self.assertIsNone(customer.tax_id)

    def test_user_relation_optional(self):
        """El campo user es nullable — cliente sin usuario del portal es válido."""
        customer = Customer.objects.create(
            name='Sin Usuario SAC',
            customer_type='company',
            email='sinusuario@sac.pe',
        )
        self.assertIsNone(customer.user)

    def test_user_relation_set(self):
        """Asociar un User al Customer funciona correctamente."""
        user = User.objects.create_user(username='clienteuser', password='pass1234')
        customer = Customer.objects.create(
            name='Con Usuario SAC',
            customer_type='company',
            email='conusuario@sac.pe',
            user=user,
        )
        self.assertEqual(customer.user.pk, user.pk)

    def test_ordering_by_created_at_desc(self):
        """El queryset por defecto ordena por -created_at."""
        Customer.objects.create(
            name='Empresa Secundaria',
            customer_type='company',
            email='secundaria@empresa.pe',
        )
        customers = list(Customer.objects.all())
        # El más reciente debe ser primero
        self.assertEqual(customers[0].name, 'Empresa Secundaria')


class CustomerSerializerTest(TestCase):
    def setUp(self):
        self.valid_data = {
            'name': 'Almacenes Miraflores EIRL',
            'customer_type': 'company',
            'tax_id': '20987654321',
            'email': 'contacto@miraflores.pe',
            'phone': '01-2345678',
            'address': 'Calle Los Pinos 123, Miraflores',
            'city': 'Lima',
            'country': 'Peru',
            'is_active': True,
        }

    def test_valid_data_is_valid(self):
        """Datos completos y correctos pasan validación."""
        serializer = CustomerSerializer(data=self.valid_data)
        self.assertTrue(serializer.is_valid(), serializer.errors)

    def test_serializer_contains_expected_fields(self):
        """Todos los campos del schema están presentes en el serializer."""
        instance = Customer.objects.create(
            name='Empresa Test',
            customer_type='company',
            email='test@empresa.pe',
        )
        serializer = CustomerSerializer(instance)
        expected_fields = [
            'id', 'user', 'name', 'customer_type', 'tax_id',
            'email', 'phone', 'address', 'city', 'country',
            'is_active', 'created_at', 'updated_at',
        ]
        for field in expected_fields:
            self.assertIn(field, serializer.data)

    def test_missing_name_is_invalid(self):
        """name faltante hace el serializer inválido."""
        data = self.valid_data.copy()
        del data['name']
        serializer = CustomerSerializer(data=data)
        self.assertFalse(serializer.is_valid())
        self.assertIn('name', serializer.errors)

    def test_empty_name_is_invalid(self):
        """name vacío hace el serializer inválido."""
        data = self.valid_data.copy()
        data['name'] = ''
        serializer = CustomerSerializer(data=data)
        self.assertFalse(serializer.is_valid())
        self.assertIn('name', serializer.errors)

    def test_missing_customer_type_is_invalid(self):
        """customer_type faltante hace el serializer inválido."""
        data = self.valid_data.copy()
        del data['customer_type']
        serializer = CustomerSerializer(data=data)
        self.assertFalse(serializer.is_valid())
        self.assertIn('customer_type', serializer.errors)

    def test_missing_email_is_invalid(self):
        """email faltante hace el serializer inválido."""
        data = self.valid_data.copy()
        del data['email']
        serializer = CustomerSerializer(data=data)
        self.assertFalse(serializer.is_valid())
        self.assertIn('email', serializer.errors)

    def test_invalid_email_format(self):
        """Email con formato inválido hace el serializer inválido."""
        data = self.valid_data.copy()
        data['email'] = 'no-es-un-email'
        serializer = CustomerSerializer(data=data)
        self.assertFalse(serializer.is_valid())
        self.assertIn('email', serializer.errors)

    def test_invalid_customer_type_choice(self):
        """customer_type fuera de choices hace el serializer inválido."""
        data = self.valid_data.copy()
        data['customer_type'] = 'unknown_type'
        serializer = CustomerSerializer(data=data)
        self.assertFalse(serializer.is_valid())
        self.assertIn('customer_type', serializer.errors)

    def test_read_only_fields_ignored_on_input(self):
        """id, created_at, updated_at no se aceptan como input (read only)."""
        data = self.valid_data.copy()
        data['id'] = 9999
        serializer = CustomerSerializer(data=data)
        self.assertTrue(serializer.is_valid(), serializer.errors)
        self.assertNotIn('id', serializer.validated_data)

    def test_optional_fields_not_required(self):
        """phone, address, city, tax_id son opcionales."""
        data = {
            'name': 'Mínimo Requerido SAC',
            'customer_type': 'company',
            'email': 'minimo@required.pe',
        }
        serializer = CustomerSerializer(data=data)
        self.assertTrue(serializer.is_valid(), serializer.errors)

    def test_serializer_creates_instance(self):
        """save() en serializer válido crea una instancia en DB."""
        serializer = CustomerSerializer(data=self.valid_data)
        self.assertTrue(serializer.is_valid(), serializer.errors)
        instance = serializer.save()
        self.assertIsNotNone(instance.pk)
        self.assertEqual(instance.name, 'Almacenes Miraflores EIRL')

from django.test import TestCase
from django.db import IntegrityError

from apps.shipments.models import Shipment, ShipmentItem
from apps.shipments.serializers import ShipmentSerializer, ShipmentItemSerializer
from apps.customers.models import Customer
from apps.warehouses.models import Warehouse
from apps.transport.models import Vehicle
from apps.routes.models import Route
from apps.products.models import Product
from apps.suppliers.models import Supplier
from apps.drivers.models import Driver


# ---------------------------------------------------------------------------
# Helpers
# ---------------------------------------------------------------------------

def make_customer():
    return Customer.objects.create(
        name='Transportes Lima SAC',
        customer_type='company',
        tax_id='20123456789',
        email='contacto@transporteslima.com',
        city='Lima',
    )


def make_warehouse():
    return Warehouse.objects.create(
        name='Almacén Central Lima',
        address='Av. Industriales 456, Ate',
        city='Lima',
    )


def make_supplier():
    return Supplier.objects.create(
        name='TechSupply Peru SAC',
        tax_id='20987654321',
        email='ventas@techsupply.pe',
        city='Lima',
    )


def make_product(supplier, warehouse=None):
    return Product.objects.create(
        supplier=supplier,
        warehouse=warehouse,
        name='Laptop HP ProBook',
        sku='HP-PB-001',
        weight_kg='2.500',
        unit_price='2500.00',
        stock_quantity=50,
    )


def make_driver():
    return Driver.objects.create(
        first_name='Juan',
        last_name='Quispe',
        document_number='12345678',
        license_number='LIC-001234',
        license_expiry='2027-12-31',
        phone='999888777',
        email='juan.quispe@logistica.pe',
    )


def make_vehicle(driver=None):
    return Vehicle.objects.create(
        driver=driver,
        name='Camión Principal',
        plate_number='ABC-123',
        vehicle_type='truck',
        capacity_kg='5000.00',
    )


def make_route(warehouse):
    return Route.objects.create(
        name='Ruta Lima–Arequipa',
        origin_warehouse=warehouse,
        distance_km='1000.00',
        estimated_duration_h='14.00',
    )


def make_shipment(customer, warehouse, vehicle=None, route=None, tracking='LOG-2026-00001'):
    return Shipment.objects.create(
        tracking_number=tracking,
        customer=customer,
        origin_warehouse=warehouse,
        vehicle=vehicle,
        route=route,
        destination_address='Jr. Unión 123, Miraflores',
        destination_city='Lima',
        destination_country='Peru',
        status='pending',
    )


# ---------------------------------------------------------------------------
# Clase 1 — ShipmentModelTest
# ---------------------------------------------------------------------------

class ShipmentModelTest(TestCase):
    def setUp(self):
        self.customer = make_customer()
        self.warehouse = make_warehouse()
        self.driver = make_driver()
        self.vehicle = make_vehicle(self.driver)
        self.route = make_route(self.warehouse)
        self.shipment = make_shipment(
            self.customer, self.warehouse, self.vehicle, self.route
        )

    def test_create_shipment_success(self):
        """Creación con datos válidos guarda correctamente en DB."""
        self.assertIsNotNone(self.shipment.pk)
        self.assertEqual(self.shipment.tracking_number, 'LOG-2026-00001')
        self.assertEqual(self.shipment.destination_city, 'Lima')

    def test_str_returns_expected(self):
        """__str__ retorna tracking_number — status."""
        self.assertEqual(str(self.shipment), 'LOG-2026-00001 — pending')

    def test_status_default_pending(self):
        """status='pending' por defecto al crear."""
        self.assertEqual(self.shipment.status, 'pending')

    def test_destination_country_default_peru(self):
        """destination_country='Peru' por defecto."""
        self.assertEqual(self.shipment.destination_country, 'Peru')

    def test_created_at_auto_set(self):
        """created_at se asigna automáticamente."""
        self.assertIsNotNone(self.shipment.created_at)

    def test_updated_at_auto_set(self):
        """updated_at se asigna automáticamente."""
        self.assertIsNotNone(self.shipment.updated_at)

    def test_vehicle_optional(self):
        """vehicle puede ser None (SET_NULL)."""
        shipment = make_shipment(
            self.customer, self.warehouse, vehicle=None, route=None,
            tracking='LOG-2026-00002'
        )
        self.assertIsNone(shipment.vehicle)

    def test_route_optional(self):
        """route puede ser None (SET_NULL)."""
        shipment = make_shipment(
            self.customer, self.warehouse, vehicle=None, route=None,
            tracking='LOG-2026-00003'
        )
        self.assertIsNone(shipment.route)

    def test_duplicate_tracking_number_fails(self):
        """tracking_number único — duplicado lanza IntegrityError."""
        with self.assertRaises(IntegrityError):
            make_shipment(
                self.customer, self.warehouse,
                tracking='LOG-2026-00001'  # mismo número
            )

    def test_create_without_customer_fails(self):
        """customer requerido — sin él lanza error de integridad."""
        with self.assertRaises(Exception):
            Shipment.objects.create(
                tracking_number='LOG-2026-00099',
                origin_warehouse=self.warehouse,
                destination_address='Jr. Unión 123',
                destination_city='Lima',
            )

    def test_create_without_warehouse_fails(self):
        """origin_warehouse requerido — sin él lanza error de integridad."""
        with self.assertRaises(Exception):
            Shipment.objects.create(
                tracking_number='LOG-2026-00099',
                customer=self.customer,
                destination_address='Jr. Unión 123',
                destination_city='Lima',
            )

    def test_status_choices_valid(self):
        """Todos los status válidos se pueden asignar."""
        valid_statuses = ['pending', 'assigned', 'in_transit', 'delivered', 'cancelled', 'returned']
        for s in valid_statuses:
            self.shipment.status = s
            self.shipment.save()
            self.shipment.refresh_from_db()
            self.assertEqual(self.shipment.status, s)

    def test_delivered_at_initially_null(self):
        """delivered_at es null al crear el envío."""
        self.assertIsNone(self.shipment.delivered_at)

    def test_notes_optional(self):
        """notes puede ser None."""
        self.assertIsNone(self.shipment.notes)

    def test_fk_customer_protect(self):
        """Borrar customer con PROTECT lanza ProtectedError."""
        from django.db.models import ProtectedError
        with self.assertRaises(ProtectedError):
            self.customer.delete()


# ---------------------------------------------------------------------------
# Clase 1b — ShipmentItemModelTest
# ---------------------------------------------------------------------------

class ShipmentItemModelTest(TestCase):
    def setUp(self):
        self.customer = make_customer()
        self.warehouse = make_warehouse()
        self.supplier = make_supplier()
        self.product = make_product(self.supplier, self.warehouse)
        self.shipment = make_shipment(self.customer, self.warehouse)
        self.item = ShipmentItem.objects.create(
            shipment=self.shipment,
            product=self.product,
            quantity=3,
            unit_price_at_shipment='2500.00',
        )

    def test_create_item_success(self):
        """Creación de ShipmentItem guarda correctamente en DB."""
        self.assertIsNotNone(self.item.pk)
        self.assertEqual(self.item.quantity, 3)

    def test_str_returns_expected(self):
        """__str__ retorna 'product × quantity'."""
        expected = f"{self.product} × 3"
        self.assertEqual(str(self.item), expected)

    def test_item_cascade_delete_with_shipment(self):
        """ShipmentItem se elimina en cascada cuando se elimina el Shipment."""
        item_pk = self.item.pk
        self.shipment.delete()
        self.assertFalse(ShipmentItem.objects.filter(pk=item_pk).exists())

    def test_unique_together_shipment_product(self):
        """Mismo par (shipment, product) lanza IntegrityError."""
        with self.assertRaises(IntegrityError):
            ShipmentItem.objects.create(
                shipment=self.shipment,
                product=self.product,
                quantity=1,
                unit_price_at_shipment='2500.00',
            )

    def test_create_item_without_shipment_fails(self):
        """shipment requerido — sin él lanza error."""
        with self.assertRaises(Exception):
            ShipmentItem.objects.create(
                product=self.product,
                quantity=2,
                unit_price_at_shipment='2500.00',
            )

    def test_create_item_without_product_fails(self):
        """product requerido — sin él lanza error."""
        with self.assertRaises(Exception):
            ShipmentItem.objects.create(
                shipment=self.shipment,
                quantity=2,
                unit_price_at_shipment='2500.00',
            )

    def test_product_protect_on_delete(self):
        """Borrar product con PROTECT lanza ProtectedError."""
        from django.db.models import ProtectedError
        with self.assertRaises(ProtectedError):
            self.product.delete()

    def test_no_is_active_field(self):
        """ShipmentItem no tiene campo is_active."""
        self.assertFalse(hasattr(self.item, 'is_active'))

    def test_no_created_at_field(self):
        """ShipmentItem no tiene campo created_at."""
        self.assertFalse(hasattr(self.item, 'created_at'))


# ---------------------------------------------------------------------------
# Clase 2 — ShipmentSerializerTest
# ---------------------------------------------------------------------------

class ShipmentSerializerTest(TestCase):
    def setUp(self):
        self.customer = make_customer()
        self.warehouse = make_warehouse()
        self.valid_data = {
            'customer': self.customer.pk,
            'origin_warehouse': self.warehouse.pk,
            'destination_address': 'Jr. Unión 123, Miraflores',
            'destination_city': 'Lima',
            'destination_country': 'Peru',
        }

    def test_valid_data_is_valid(self):
        """Datos mínimos requeridos pasan validación."""
        serializer = ShipmentSerializer(data=self.valid_data)
        self.assertTrue(serializer.is_valid(), serializer.errors)

    def test_serializer_contains_expected_fields(self):
        """Todos los campos del schema están presentes en el serializer."""
        shipment = Shipment.objects.create(
            tracking_number='LOG-2026-00001',
            customer=self.customer,
            origin_warehouse=self.warehouse,
            destination_address='Jr. Unión 123, Miraflores',
            destination_city='Lima',
        )
        serializer = ShipmentSerializer(shipment)
        expected_fields = [
            'id', 'tracking_number', 'customer', 'origin_warehouse',
            'vehicle', 'route', 'destination_address', 'destination_city',
            'destination_country', 'status', 'scheduled_date', 'delivered_at',
            'base_cost', 'calculated_cost', 'notes', 'created_at', 'updated_at',
            'items',
        ]
        for field in expected_fields:
            self.assertIn(field, serializer.data)

    def test_missing_customer_invalid(self):
        """customer requerido — si falta, serializer inválido."""
        data = self.valid_data.copy()
        del data['customer']
        serializer = ShipmentSerializer(data=data)
        self.assertFalse(serializer.is_valid())
        self.assertIn('customer', serializer.errors)

    def test_missing_warehouse_invalid(self):
        """origin_warehouse requerido — si falta, serializer inválido."""
        data = self.valid_data.copy()
        del data['origin_warehouse']
        serializer = ShipmentSerializer(data=data)
        self.assertFalse(serializer.is_valid())
        self.assertIn('origin_warehouse', serializer.errors)

    def test_missing_destination_address_invalid(self):
        """destination_address requerido — si falta, serializer inválido."""
        data = self.valid_data.copy()
        del data['destination_address']
        serializer = ShipmentSerializer(data=data)
        self.assertFalse(serializer.is_valid())
        self.assertIn('destination_address', serializer.errors)

    def test_missing_destination_city_invalid(self):
        """destination_city requerido — si falta, serializer inválido."""
        data = self.valid_data.copy()
        del data['destination_city']
        serializer = ShipmentSerializer(data=data)
        self.assertFalse(serializer.is_valid())
        self.assertIn('destination_city', serializer.errors)

    def test_read_only_fields_ignored_on_input(self):
        """id, tracking_number, calculated_cost, created_at, updated_at son read-only."""
        data = self.valid_data.copy()
        data['id'] = 9999
        data['tracking_number'] = 'LOG-FAKE-00000'
        data['calculated_cost'] = '99999.00'
        serializer = ShipmentSerializer(data=data)
        self.assertTrue(serializer.is_valid(), serializer.errors)
        self.assertNotIn('id', serializer.validated_data)
        self.assertNotIn('tracking_number', serializer.validated_data)
        self.assertNotIn('calculated_cost', serializer.validated_data)

    def test_status_default_pending_in_serialized_output(self):
        """status='pending' por defecto en datos serializados."""
        shipment = Shipment.objects.create(
            tracking_number='LOG-2026-00002',
            customer=self.customer,
            origin_warehouse=self.warehouse,
            destination_address='Jr. Unión 123, Miraflores',
            destination_city='Lima',
        )
        serializer = ShipmentSerializer(shipment)
        self.assertEqual(serializer.data['status'], 'pending')

    def test_items_list_in_output(self):
        """items es una lista (vacía cuando no hay items)."""
        shipment = Shipment.objects.create(
            tracking_number='LOG-2026-00003',
            customer=self.customer,
            origin_warehouse=self.warehouse,
            destination_address='Jr. Unión 123, Miraflores',
            destination_city='Lima',
        )
        serializer = ShipmentSerializer(shipment)
        self.assertIsInstance(serializer.data['items'], list)


# ---------------------------------------------------------------------------
# Clase 2b — ShipmentItemSerializerTest
# ---------------------------------------------------------------------------

class ShipmentItemSerializerTest(TestCase):
    def setUp(self):
        self.customer = make_customer()
        self.warehouse = make_warehouse()
        self.supplier = make_supplier()
        self.product = make_product(self.supplier, self.warehouse)
        self.shipment = make_shipment(self.customer, self.warehouse)
        self.valid_data = {
            'shipment': self.shipment.pk,
            'product': self.product.pk,
            'quantity': 2,
            'unit_price_at_shipment': '2500.00',
        }

    def test_valid_data_is_valid(self):
        """Datos completos pasan validación."""
        serializer = ShipmentItemSerializer(data=self.valid_data)
        self.assertTrue(serializer.is_valid(), serializer.errors)

    def test_serializer_contains_expected_fields(self):
        """Todos los campos están presentes."""
        item = ShipmentItem.objects.create(
            shipment=self.shipment,
            product=self.product,
            quantity=2,
            unit_price_at_shipment='2500.00',
        )
        serializer = ShipmentItemSerializer(item)
        expected_fields = ['id', 'shipment', 'product', 'quantity', 'unit_price_at_shipment']
        for field in expected_fields:
            self.assertIn(field, serializer.data)

    def test_missing_quantity_invalid(self):
        """quantity requerido — si falta, serializer inválido."""
        data = self.valid_data.copy()
        del data['quantity']
        serializer = ShipmentItemSerializer(data=data)
        self.assertFalse(serializer.is_valid())
        self.assertIn('quantity', serializer.errors)

    def test_missing_price_invalid(self):
        """unit_price_at_shipment requerido — si falta, serializer inválido."""
        data = self.valid_data.copy()
        del data['unit_price_at_shipment']
        serializer = ShipmentItemSerializer(data=data)
        self.assertFalse(serializer.is_valid())
        self.assertIn('unit_price_at_shipment', serializer.errors)

    def test_read_only_id_ignored_on_input(self):
        """id es read-only y no se acepta como input."""
        data = self.valid_data.copy()
        data['id'] = 9999
        serializer = ShipmentItemSerializer(data=data)
        self.assertTrue(serializer.is_valid(), serializer.errors)
        self.assertNotIn('id', serializer.validated_data)

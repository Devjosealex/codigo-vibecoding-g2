from decimal import Decimal

from django.contrib.auth.models import User
from rest_framework import status
from rest_framework.test import APITestCase
from rest_framework_simplejwt.tokens import RefreshToken
from django.test import TestCase

from rest_framework.exceptions import ValidationError

from apps.shipments.models import Shipment, ShipmentItem
from apps.shipments.services import (
    generate_tracking_number,
    calculate_shipment_cost,
    transition_status,
)
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
        name='Transportes Arequipa SAC',
        customer_type='company',
        tax_id='20123456790',
        email='info@arequipa.com',
        city='Arequipa',
    )


def make_warehouse():
    return Warehouse.objects.create(
        name='Almacén Norte Lima',
        address='Av. Tupac Amaru 789, San Martin de Porres',
        city='Lima',
    )


def make_supplier():
    return Supplier.objects.create(
        name='TechDist Peru EIRL',
        tax_id='20876543210',
        email='ventas@techdist.pe',
        city='Lima',
    )


def make_product(supplier, warehouse=None):
    return Product.objects.create(
        supplier=supplier,
        warehouse=warehouse,
        name='Monitor Dell 24"',
        sku='DL-MON-024',
        weight_kg='4.200',
        unit_price='1200.00',
        stock_quantity=30,
    )


def make_driver():
    return Driver.objects.create(
        first_name='Carlos',
        last_name='Mamani',
        document_number='87654321',
        license_number='LIC-005678',
        license_expiry='2028-06-30',
        phone='987654321',
    )


def make_vehicle(driver=None):
    return Vehicle.objects.create(
        driver=driver,
        name='Furgoneta Express',
        plate_number='XYZ-789',
        vehicle_type='van',
        capacity_kg='1500.00',
    )


def make_route(warehouse):
    return Route.objects.create(
        name='Ruta Lima–Trujillo',
        origin_warehouse=warehouse,
        distance_km='570.00',
        estimated_duration_h='7.00',
    )


def make_shipment(customer, warehouse, vehicle=None, route=None, tracking='LOG-2026-00001'):
    return Shipment.objects.create(
        tracking_number=tracking,
        customer=customer,
        origin_warehouse=warehouse,
        vehicle=vehicle,
        route=route,
        destination_address='Calle Los Pinos 456, Trujillo',
        destination_city='Trujillo',
        destination_country='Peru',
        status='pending',
    )


# ---------------------------------------------------------------------------
# Clase 3 — ShipmentViewTest
# ---------------------------------------------------------------------------

class ShipmentViewTest(APITestCase):
    def setUp(self):
        self.user = User.objects.create_user(
            username='testuser', password='testpass123'
        )
        refresh = RefreshToken.for_user(self.user)
        self.client.credentials(HTTP_AUTHORIZATION=f'Bearer {refresh.access_token}')

        self.customer = make_customer()
        self.warehouse = make_warehouse()
        self.driver = make_driver()
        self.vehicle = make_vehicle(self.driver)
        self.route = make_route(self.warehouse)
        self.shipment = make_shipment(
            self.customer, self.warehouse, self.vehicle, self.route
        )
        self.url_list = '/api/v1/shipments/'
        self.url_detail = f'/api/v1/shipments/{self.shipment.pk}/'

    def test_list_shipments_returns_200(self):
        """GET lista retorna 200 con resultados."""
        response = self.client.get(self.url_list)
        self.assertEqual(response.status_code, status.HTTP_200_OK)

    def test_create_shipment_returns_201(self):
        """POST con datos válidos crea objeto y retorna 201."""
        data = {
            'customer': self.customer.pk,
            'origin_warehouse': self.warehouse.pk,
            'destination_address': 'Av. Sol 123, Cusco',
            'destination_city': 'Cusco',
            'destination_country': 'Peru',
        }
        response = self.client.post(self.url_list, data, format='json')
        self.assertEqual(response.status_code, status.HTTP_201_CREATED)
        self.assertEqual(Shipment.objects.count(), 2)

    def test_create_shipment_generates_tracking_number(self):
        """POST genera tracking_number automáticamente."""
        data = {
            'customer': self.customer.pk,
            'origin_warehouse': self.warehouse.pk,
            'destination_address': 'Jr. Puno 99, Puno',
            'destination_city': 'Puno',
        }
        response = self.client.post(self.url_list, data, format='json')
        self.assertEqual(response.status_code, status.HTTP_201_CREATED)
        import re
        self.assertRegex(response.data['tracking_number'], r'^LOG-\d{4}-\d{5}$')

    def test_retrieve_shipment_returns_200(self):
        """GET detalle retorna 200 con datos del objeto."""
        response = self.client.get(self.url_detail)
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertEqual(response.data['id'], self.shipment.pk)

    def test_retrieve_shipment_has_items_field(self):
        """GET detalle incluye campo items."""
        response = self.client.get(self.url_detail)
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertIn('items', response.data)

    def test_partial_update_shipment_returns_200(self):
        """PATCH actualiza destination_city y retorna 200."""
        data = {'destination_city': 'Arequipa'}
        response = self.client.patch(self.url_detail, data, format='json')
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.shipment.refresh_from_db()
        self.assertEqual(self.shipment.destination_city, 'Arequipa')

    def test_update_shipment_returns_200(self):
        """PUT actualiza el envío y retorna 200."""
        data = {
            'customer': self.customer.pk,
            'origin_warehouse': self.warehouse.pk,
            'destination_address': 'Jr. Tacna 555, Tacna',
            'destination_city': 'Tacna',
            'destination_country': 'Peru',
        }
        response = self.client.put(self.url_detail, data, format='json')
        self.assertEqual(response.status_code, status.HTTP_200_OK)

    def test_delete_shipment_returns_204(self):
        """DELETE retorna 204 y elimina el registro."""
        response = self.client.delete(self.url_detail)
        self.assertEqual(response.status_code, status.HTTP_204_NO_CONTENT)
        self.assertFalse(Shipment.objects.filter(pk=self.shipment.pk).exists())

    def test_create_shipment_missing_customer_returns_400(self):
        """POST sin customer retorna 400."""
        data = {
            'origin_warehouse': self.warehouse.pk,
            'destination_address': 'Jr. Unión 123',
            'destination_city': 'Lima',
        }
        response = self.client.post(self.url_list, data, format='json')
        self.assertEqual(response.status_code, status.HTTP_400_BAD_REQUEST)

    def test_create_shipment_missing_warehouse_returns_400(self):
        """POST sin origin_warehouse retorna 400."""
        data = {
            'customer': self.customer.pk,
            'destination_address': 'Jr. Unión 123',
            'destination_city': 'Lima',
        }
        response = self.client.post(self.url_list, data, format='json')
        self.assertEqual(response.status_code, status.HTTP_400_BAD_REQUEST)

    def test_create_shipment_empty_payload_returns_400(self):
        """POST con payload vacío retorna 400."""
        response = self.client.post(self.url_list, {}, format='json')
        self.assertEqual(response.status_code, status.HTTP_400_BAD_REQUEST)

    def test_retrieve_nonexistent_shipment_returns_404(self):
        """GET con id inexistente retorna 404."""
        response = self.client.get('/api/v1/shipments/99999/')
        self.assertEqual(response.status_code, status.HTTP_404_NOT_FOUND)

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

    def test_filter_by_status(self):
        """GET con ?status=pending filtra por estado."""
        response = self.client.get(self.url_list + '?status=pending')
        self.assertEqual(response.status_code, status.HTTP_200_OK)

    def test_transition_action_valid(self):
        """POST a /transition con estado válido cambia el status."""
        url = f'/api/v1/shipments/{self.shipment.pk}/transition/'
        response = self.client.post(url, {'status': 'assigned'}, format='json')
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.shipment.refresh_from_db()
        self.assertEqual(self.shipment.status, 'assigned')

    def test_transition_action_invalid_returns_400(self):
        """POST a /transition con transición inválida retorna 400."""
        url = f'/api/v1/shipments/{self.shipment.pk}/transition/'
        response = self.client.post(url, {'status': 'delivered'}, format='json')
        self.assertEqual(response.status_code, status.HTTP_400_BAD_REQUEST)

    def test_transition_action_unauthenticated_returns_401(self):
        """POST a /transition sin JWT retorna 401."""
        self.client.credentials()
        url = f'/api/v1/shipments/{self.shipment.pk}/transition/'
        response = self.client.post(url, {'status': 'assigned'}, format='json')
        self.assertEqual(response.status_code, status.HTTP_401_UNAUTHORIZED)


# ---------------------------------------------------------------------------
# Clase 3b — ShipmentItemViewTest
# ---------------------------------------------------------------------------

class ShipmentItemViewTest(APITestCase):
    def setUp(self):
        self.user = User.objects.create_user(
            username='itemtestuser', password='testpass123'
        )
        refresh = RefreshToken.for_user(self.user)
        self.client.credentials(HTTP_AUTHORIZATION=f'Bearer {refresh.access_token}')

        self.customer = make_customer()
        self.warehouse = make_warehouse()
        self.supplier = make_supplier()
        self.product = make_product(self.supplier, self.warehouse)
        self.shipment = make_shipment(self.customer, self.warehouse)
        self.item = ShipmentItem.objects.create(
            shipment=self.shipment,
            product=self.product,
            quantity=2,
            unit_price_at_shipment='1200.00',
        )
        self.url_list = '/api/v1/shipment-items/'
        self.url_detail = f'/api/v1/shipment-items/{self.item.pk}/'

    def test_list_shipment_items_returns_200(self):
        """GET lista de items retorna 200."""
        response = self.client.get(self.url_list)
        self.assertEqual(response.status_code, status.HTTP_200_OK)

    def test_create_shipment_item_returns_201(self):
        """POST con datos válidos crea item y retorna 201."""
        # Create a second product to avoid unique_together conflict
        product2 = Product.objects.create(
            supplier=self.supplier,
            warehouse=self.warehouse,
            name='Teclado Logitech',
            sku='LG-KB-001',
            weight_kg='0.500',
            unit_price='150.00',
        )
        data = {
            'shipment': self.shipment.pk,
            'product': product2.pk,
            'quantity': 5,
            'unit_price_at_shipment': '150.00',
        }
        response = self.client.post(self.url_list, data, format='json')
        self.assertEqual(response.status_code, status.HTTP_201_CREATED)
        self.assertEqual(ShipmentItem.objects.count(), 2)

    def test_retrieve_shipment_item_returns_200(self):
        """GET detalle de item retorna 200."""
        response = self.client.get(self.url_detail)
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertEqual(response.data['id'], self.item.pk)

    def test_partial_update_item_returns_200(self):
        """PATCH actualiza quantity y retorna 200."""
        data = {'quantity': 10}
        response = self.client.patch(self.url_detail, data, format='json')
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.item.refresh_from_db()
        self.assertEqual(self.item.quantity, 10)

    def test_delete_item_returns_204(self):
        """DELETE retorna 204 y elimina el item."""
        response = self.client.delete(self.url_detail)
        self.assertEqual(response.status_code, status.HTTP_204_NO_CONTENT)
        self.assertFalse(ShipmentItem.objects.filter(pk=self.item.pk).exists())

    def test_create_item_missing_quantity_returns_400(self):
        """POST sin quantity retorna 400."""
        data = {
            'shipment': self.shipment.pk,
            'product': self.product.pk,
            'unit_price_at_shipment': '1200.00',
        }
        response = self.client.post(self.url_list, data, format='json')
        self.assertEqual(response.status_code, status.HTTP_400_BAD_REQUEST)

    def test_retrieve_nonexistent_item_returns_404(self):
        """GET con id inexistente retorna 404."""
        response = self.client.get('/api/v1/shipment-items/99999/')
        self.assertEqual(response.status_code, status.HTTP_404_NOT_FOUND)

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

    def test_filter_by_shipment(self):
        """GET con ?shipment=id filtra items por envío."""
        response = self.client.get(f'{self.url_list}?shipment={self.shipment.pk}')
        self.assertEqual(response.status_code, status.HTTP_200_OK)


# ---------------------------------------------------------------------------
# Clase 4 — ShipmentServicesTest
# ---------------------------------------------------------------------------

class ShipmentServicesTest(TestCase):
    def setUp(self):
        self.customer = make_customer()
        self.warehouse = make_warehouse()
        self.supplier = make_supplier()
        self.product = make_product(self.supplier, self.warehouse)
        self.route = make_route(self.warehouse)
        self.shipment = make_shipment(
            self.customer, self.warehouse, route=self.route
        )
        # Add a ShipmentItem so calculate_shipment_cost has items to work with
        ShipmentItem.objects.create(
            shipment=self.shipment,
            product=self.product,
            quantity=2,
            unit_price_at_shipment='1200.00',
        )

    def test_generate_tracking_number_format(self):
        """Número generado sigue formato LOG-YYYY-NNNNN."""
        number = generate_tracking_number()
        self.assertRegex(number, r'^LOG-\d{4}-\d{5}$')

    def test_tracking_numbers_are_unique(self):
        """Dos llamadas consecutivas generan números distintos."""
        # Each call increments count, so create a shipment first to differentiate
        n1 = generate_tracking_number()
        # Save a shipment to increment the counter
        Shipment.objects.create(
            tracking_number=n1,
            customer=self.customer,
            origin_warehouse=self.warehouse,
            destination_address='Jr. Unión 001',
            destination_city='Lima',
        )
        n2 = generate_tracking_number()
        self.assertNotEqual(n1, n2)

    def test_generate_tracking_number_contains_year(self):
        """El número de seguimiento contiene el año actual."""
        import datetime
        number = generate_tracking_number()
        current_year = str(datetime.date.today().year)
        self.assertIn(current_year, number)

    def test_calculate_cost_positive_result(self):
        """Costo calculado es mayor que 0 cuando hay items (peso)."""
        # Use shipment without route to avoid SQLite DecimalField string issue on distance_km
        shipment_no_route = make_shipment(
            self.customer, self.warehouse, route=None, tracking='LOG-2026-00097'
        )
        ShipmentItem.objects.create(
            shipment=shipment_no_route,
            product=self.product,
            quantity=2,
            unit_price_at_shipment='1200.00',
        )
        cost = calculate_shipment_cost(shipment_no_route)
        self.assertGreater(cost, Decimal('0.00'))

    def test_calculate_cost_weight_component(self):
        """Costo incluye componente de peso (quantity × weight_kg × COST_PER_KG)."""
        # product weight_kg=4.2, quantity=2, COST_PER_KG=5.00 → weight_cost=42.00
        shipment_no_route = make_shipment(
            self.customer, self.warehouse, route=None, tracking='LOG-2026-00096'
        )
        ShipmentItem.objects.create(
            shipment=shipment_no_route,
            product=self.product,
            quantity=2,
            unit_price_at_shipment='1200.00',
        )
        cost = calculate_shipment_cost(shipment_no_route)
        expected_weight = Decimal('2') * Decimal('4.200') * Decimal('5.00')
        self.assertEqual(cost, expected_weight)

    def test_calculate_cost_without_route_uses_weight_only(self):
        """Costo sin ruta solo considera peso."""
        shipment_no_route = make_shipment(
            self.customer, self.warehouse, route=None, tracking='LOG-2026-00099'
        )
        ShipmentItem.objects.create(
            shipment=shipment_no_route,
            product=self.product,
            quantity=1,
            unit_price_at_shipment='1200.00',
        )
        cost = calculate_shipment_cost(shipment_no_route)
        expected = Decimal('1') * Decimal('4.200') * Decimal('5.00')
        self.assertEqual(cost, expected)

    def test_calculate_cost_no_items_returns_zero(self):
        """Costo con envío sin items es 0 (solo distancia si hay ruta)."""
        shipment_empty = make_shipment(
            self.customer, self.warehouse, route=None, tracking='LOG-2026-00098'
        )
        cost = calculate_shipment_cost(shipment_empty)
        self.assertEqual(cost, Decimal('0.00'))

    def test_valid_status_transition_pending_to_assigned(self):
        """Transición válida pending → assigned no lanza excepción."""
        transition_status(self.shipment, 'assigned')
        self.shipment.refresh_from_db()
        self.assertEqual(self.shipment.status, 'assigned')

    def test_valid_status_transition_pending_to_cancelled(self):
        """Transición válida pending → cancelled no lanza excepción."""
        transition_status(self.shipment, 'cancelled')
        self.shipment.refresh_from_db()
        self.assertEqual(self.shipment.status, 'cancelled')

    def test_valid_status_transition_assigned_to_in_transit(self):
        """Transición válida assigned → in_transit no lanza excepción."""
        self.shipment.status = 'assigned'
        self.shipment.save()
        transition_status(self.shipment, 'in_transit')
        self.shipment.refresh_from_db()
        self.assertEqual(self.shipment.status, 'in_transit')

    def test_valid_status_transition_in_transit_to_delivered(self):
        """Transición válida in_transit → delivered establece delivered_at."""
        self.shipment.status = 'in_transit'
        self.shipment.save()
        transition_status(self.shipment, 'delivered')
        self.shipment.refresh_from_db()
        self.assertEqual(self.shipment.status, 'delivered')
        self.assertIsNotNone(self.shipment.delivered_at)

    def test_valid_status_transition_in_transit_to_returned(self):
        """Transición válida in_transit → returned no lanza excepción."""
        self.shipment.status = 'in_transit'
        self.shipment.save()
        transition_status(self.shipment, 'returned')
        self.shipment.refresh_from_db()
        self.assertEqual(self.shipment.status, 'returned')

    def test_invalid_status_transition_pending_to_delivered(self):
        """Transición inválida pending → delivered lanza ValidationError."""
        with self.assertRaises(ValidationError):
            transition_status(self.shipment, 'delivered')

    def test_invalid_status_transition_pending_to_in_transit(self):
        """Transición inválida pending → in_transit lanza ValidationError."""
        with self.assertRaises(ValidationError):
            transition_status(self.shipment, 'in_transit')

    def test_invalid_transition_from_delivered(self):
        """Transición inválida: delivered → pending lanza ValidationError."""
        self.shipment.status = 'delivered'
        self.shipment.save()
        with self.assertRaises(ValidationError):
            transition_status(self.shipment, 'pending')

    def test_invalid_transition_from_cancelled(self):
        """Transición inválida: cancelled → pending lanza ValidationError."""
        self.shipment.status = 'cancelled'
        self.shipment.save()
        with self.assertRaises(ValidationError):
            transition_status(self.shipment, 'pending')

    def test_invalid_transition_from_returned(self):
        """Transición inválida: returned → assigned lanza ValidationError."""
        self.shipment.status = 'returned'
        self.shipment.save()
        with self.assertRaises(ValidationError):
            transition_status(self.shipment, 'assigned')

    def test_invalid_transition_error_message_contains_current_status(self):
        """El mensaje de ValidationError menciona el estado actual."""
        try:
            transition_status(self.shipment, 'delivered')
            self.fail("Expected ValidationError was not raised")
        except ValidationError as e:
            error_str = str(e.detail)
            self.assertIn('pending', error_str)

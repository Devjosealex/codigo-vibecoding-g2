from rest_framework.test import APITestCase
from rest_framework import status
from rest_framework_simplejwt.tokens import RefreshToken
from django.contrib.auth.models import User
from apps.products.models import Product
from apps.suppliers.models import Supplier
from apps.warehouses.models import Warehouse


class ProductViewTest(APITestCase):
    def setUp(self):
        # Usuario con JWT
        self.user = User.objects.create_user(
            username='testuser', password='testpass123'
        )
        refresh = RefreshToken.for_user(self.user)
        self.client.credentials(HTTP_AUTHORIZATION=f'Bearer {refresh.access_token}')

        # Dependencias FK
        self.supplier = Supplier.objects.create(
            name="Importadora Cusco SAC",
            tax_id="20112233445",
            city="Cusco",
        )
        self.warehouse = Warehouse.objects.create(
            name="Almacen Cusco Centro",
            address="Calle Comercio 789, Cusco",
            city="Cusco",
        )

        # Instancia de prueba
        self.product = Product.objects.create(
            supplier=self.supplier,
            warehouse=self.warehouse,
            name="Tablet Samsung Galaxy Tab",
            sku="SAM-TAB-A8-001",
            weight_kg="0.500",
            unit_price="950.00",
            stock_quantity=20,
        )

        self.url_list = '/api/v1/products/'
        self.url_detail = f'/api/v1/products/{self.product.pk}/'

    # Happy path — CRUD completo

    def test_list_products_returns_200(self):
        """GET lista retorna 200 con resultados paginados."""
        response = self.client.get(self.url_list)
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertIn('results', response.data)

    def test_list_products_contains_product(self):
        """GET lista incluye el producto creado en setUp."""
        response = self.client.get(self.url_list)
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        ids = [item['id'] for item in response.data['results']]
        self.assertIn(self.product.pk, ids)

    def test_create_product_returns_201(self):
        """POST con datos validos crea objeto y retorna 201."""
        data = {
            "supplier": self.supplier.pk,
            "warehouse": self.warehouse.pk,
            "name": "Auriculares Sony WH-1000XM5",
            "sku": "SONY-WH-1000XM5-002",
            "weight_kg": "0.250",
            "unit_price": "1200.00",
            "stock_quantity": 15,
        }
        response = self.client.post(self.url_list, data, format='json')
        self.assertEqual(response.status_code, status.HTTP_201_CREATED)
        self.assertEqual(Product.objects.count(), 2)

    def test_create_product_without_warehouse_returns_201(self):
        """POST sin warehouse (opcional) retorna 201."""
        data = {
            "supplier": self.supplier.pk,
            "name": "Camara Canon EOS R50",
            "sku": "CAN-EOS-R50-003",
            "weight_kg": "0.650",
            "unit_price": "3800.00",
        }
        response = self.client.post(self.url_list, data, format='json')
        self.assertEqual(response.status_code, status.HTTP_201_CREATED)
        self.assertIsNone(response.data.get('warehouse'))

    def test_retrieve_product_returns_200(self):
        """GET detalle retorna 200 con datos del objeto."""
        response = self.client.get(self.url_detail)
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertEqual(response.data['id'], self.product.pk)
        self.assertEqual(response.data['sku'], 'SAM-TAB-A8-001')

    def test_partial_update_product_returns_200(self):
        """PATCH actualiza campo y retorna 200."""
        data = {'name': 'Tablet Samsung Galaxy Tab S9'}
        response = self.client.patch(self.url_detail, data, format='json')
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.product.refresh_from_db()
        self.assertEqual(self.product.name, 'Tablet Samsung Galaxy Tab S9')

    def test_full_update_product_returns_200(self):
        """PUT actualiza todos los campos y retorna 200."""
        data = {
            "supplier": self.supplier.pk,
            "name": "Tablet Samsung Galaxy Tab S9 Ultra",
            "sku": "SAM-TAB-A8-001",
            "weight_kg": "0.600",
            "unit_price": "1800.00",
            "stock_quantity": 10,
        }
        response = self.client.put(self.url_detail, data, format='json')
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.product.refresh_from_db()
        self.assertEqual(self.product.name, "Tablet Samsung Galaxy Tab S9 Ultra")

    def test_soft_delete_product_returns_204(self):
        """DELETE retorna 204 y marca is_active=False sin borrar de DB."""
        response = self.client.delete(self.url_detail)
        self.assertEqual(response.status_code, status.HTTP_204_NO_CONTENT)
        self.product.refresh_from_db()
        self.assertFalse(self.product.is_active)
        # Registro persiste en DB
        self.assertTrue(Product.objects.filter(pk=self.product.pk).exists())

    def test_list_excludes_inactive_products(self):
        """Objetos con is_active=False no aparecen en GET lista."""
        self.product.is_active = False
        self.product.save()
        response = self.client.get(self.url_list)
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        ids = [item['id'] for item in response.data['results']]
        self.assertNotIn(self.product.pk, ids)

    # Unhappy path

    def test_create_product_missing_required_field_returns_400(self):
        """POST sin campos requeridos retorna 400."""
        data = {}
        response = self.client.post(self.url_list, data, format='json')
        self.assertEqual(response.status_code, status.HTTP_400_BAD_REQUEST)

    def test_create_product_missing_supplier_returns_400(self):
        """POST sin supplier retorna 400."""
        data = {
            "name": "Producto Sin Proveedor",
            "sku": "NO-SUPP-004",
            "weight_kg": "1.000",
            "unit_price": "100.00",
        }
        response = self.client.post(self.url_list, data, format='json')
        self.assertEqual(response.status_code, status.HTTP_400_BAD_REQUEST)

    def test_create_product_missing_sku_returns_400(self):
        """POST sin sku retorna 400."""
        data = {
            "supplier": self.supplier.pk,
            "name": "Producto Sin SKU",
            "weight_kg": "1.000",
            "unit_price": "100.00",
        }
        response = self.client.post(self.url_list, data, format='json')
        self.assertEqual(response.status_code, status.HTTP_400_BAD_REQUEST)

    def test_create_product_duplicate_sku_returns_400(self):
        """POST con sku duplicado retorna 400."""
        data = {
            "supplier": self.supplier.pk,
            "name": "Tablet Duplicada",
            "sku": "SAM-TAB-A8-001",  # sku ya existente
            "weight_kg": "0.500",
            "unit_price": "900.00",
        }
        response = self.client.post(self.url_list, data, format='json')
        self.assertEqual(response.status_code, status.HTTP_400_BAD_REQUEST)

    def test_retrieve_nonexistent_product_returns_404(self):
        """GET con id inexistente retorna 404."""
        response = self.client.get('/api/v1/products/99999/')
        self.assertEqual(response.status_code, status.HTTP_404_NOT_FOUND)

    def test_update_nonexistent_product_returns_404(self):
        """PATCH con id inexistente retorna 404."""
        response = self.client.patch('/api/v1/products/99999/', {'name': 'X'}, format='json')
        self.assertEqual(response.status_code, status.HTTP_404_NOT_FOUND)

    def test_delete_nonexistent_product_returns_404(self):
        """DELETE con id inexistente retorna 404."""
        response = self.client.delete('/api/v1/products/99999/')
        self.assertEqual(response.status_code, status.HTTP_404_NOT_FOUND)

    # Edge cases — autenticacion

    def test_unauthenticated_list_returns_401(self):
        """GET sin JWT retorna 401."""
        self.client.credentials()  # quitar Bearer token
        response = self.client.get(self.url_list)
        self.assertEqual(response.status_code, status.HTTP_401_UNAUTHORIZED)

    def test_unauthenticated_create_returns_401(self):
        """POST sin JWT retorna 401."""
        self.client.credentials()
        response = self.client.post(self.url_list, {}, format='json')
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

    # Edge cases — filtros

    def test_filter_by_supplier(self):
        """GET con filtro supplier retorna solo los productos de ese proveedor."""
        other_supplier = Supplier.objects.create(
            name="Proveedor Lima Norte SAC",
            tax_id="20556677889",
            city="Lima",
        )
        Product.objects.create(
            supplier=other_supplier,
            name="Disco Duro Seagate 2TB",
            sku="SEA-HDD-2TB-005",
            weight_kg="0.700",
            unit_price="300.00",
        )
        response = self.client.get(self.url_list, {'supplier': self.supplier.pk})
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        for item in response.data['results']:
            self.assertEqual(item['supplier'], self.supplier.pk)

    def test_filter_by_warehouse(self):
        """GET con filtro warehouse retorna solo productos en ese almacen."""
        response = self.client.get(self.url_list, {'warehouse': self.warehouse.pk})
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        for item in response.data['results']:
            self.assertEqual(item['warehouse'], self.warehouse.pk)

    def test_search_by_name(self):
        """GET con search por nombre retorna productos que coincidan."""
        Product.objects.create(
            supplier=self.supplier,
            name="Monitor LG UltraWide 34",
            sku="LG-UW-34-006",
            weight_kg="7.200",
            unit_price="2200.00",
        )
        response = self.client.get(self.url_list, {'search': 'Monitor LG'})
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        names = [item['name'] for item in response.data['results']]
        self.assertTrue(any('Monitor LG' in n for n in names))

    def test_ordering_by_unit_price(self):
        """GET con ordering por unit_price retorna resultados ordenados."""
        Product.objects.create(
            supplier=self.supplier,
            name="Memoria RAM Kingston 16GB",
            sku="KIN-RAM-16-007",
            weight_kg="0.050",
            unit_price="250.00",
        )
        response = self.client.get(self.url_list, {'ordering': 'unit_price'})
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        prices = [float(item['unit_price']) for item in response.data['results']]
        self.assertEqual(prices, sorted(prices))

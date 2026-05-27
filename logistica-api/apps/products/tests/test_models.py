from django.test import TestCase
from django.db import IntegrityError
from apps.products.models import Product
from apps.products.serializers import ProductSerializer
from apps.suppliers.models import Supplier
from apps.warehouses.models import Warehouse


class ProductModelTest(TestCase):
    def setUp(self):
        self.supplier = Supplier.objects.create(
            name="Tecnologia Lima SAC",
            tax_id="20123456789",
            email="contacto@tecnolima.com",
            city="Lima",
        )
        self.warehouse = Warehouse.objects.create(
            name="Almacen Miraflores",
            address="Av. Larco 123, Miraflores",
            city="Lima",
        )
        self.product = Product.objects.create(
            supplier=self.supplier,
            warehouse=self.warehouse,
            name="Laptop Dell XPS 13",
            sku="DELL-XPS-13-001",
            weight_kg="1.250",
            unit_price="4500.00",
            stock_quantity=10,
        )

    def test_create_product_success(self):
        """Creacion con datos validos guarda correctamente en DB."""
        self.assertIsNotNone(self.product.pk)
        self.assertEqual(self.product.name, "Laptop Dell XPS 13")
        self.assertEqual(self.product.sku, "DELL-XPS-13-001")

    def test_str_returns_expected(self):
        """__str__ retorna nombre y sku del producto."""
        expected = "Laptop Dell XPS 13 (DELL-XPS-13-001)"
        self.assertEqual(str(self.product), expected)

    def test_is_active_default_true(self):
        """is_active=True por defecto al crear."""
        self.assertTrue(self.product.is_active)

    def test_created_at_auto_set(self):
        """created_at se asigna automaticamente."""
        self.assertIsNotNone(self.product.created_at)

    def test_updated_at_auto_set(self):
        """updated_at se asigna automaticamente."""
        self.assertIsNotNone(self.product.updated_at)

    def test_stock_quantity_default_zero(self):
        """stock_quantity tiene default 0."""
        product = Product.objects.create(
            supplier=self.supplier,
            name="Monitor LG 24",
            sku="LG-MON-24-002",
            weight_kg="3.500",
            unit_price="800.00",
        )
        self.assertEqual(product.stock_quantity, 0)

    def test_soft_delete_sets_is_active_false(self):
        """Soft delete marca is_active=False pero el registro persiste en DB."""
        pk = self.product.pk
        self.product.is_active = False
        self.product.save()
        obj = Product.objects.get(pk=pk)
        self.assertFalse(obj.is_active)

    def test_warehouse_nullable(self):
        """warehouse puede ser null (SET_NULL)."""
        product = Product.objects.create(
            supplier=self.supplier,
            name="Teclado Logitech",
            sku="LOGI-KBD-003",
            weight_kg="0.500",
            unit_price="150.00",
            warehouse=None,
        )
        self.assertIsNone(product.warehouse)
        self.assertIsNotNone(product.pk)

    def test_supplier_fk_required(self):
        """supplier es FK requerida — no se puede crear sin ella."""
        with self.assertRaises((IntegrityError, Exception)):
            Product.objects.create(
                name="Producto Sin Proveedor",
                sku="NO-SUP-004",
                weight_kg="1.000",
                unit_price="100.00",
                supplier_id=None,
            )

    def test_duplicate_sku_fails(self):
        """sku duplicado lanza IntegrityError."""
        with self.assertRaises(IntegrityError):
            Product.objects.create(
                supplier=self.supplier,
                name="Laptop Dell XPS 13 Duplicada",
                sku="DELL-XPS-13-001",  # mismo sku
                weight_kg="1.250",
                unit_price="4500.00",
            )

    def test_optional_dimension_fields(self):
        """Campos de dimension son opcionales (null/blank)."""
        product = Product.objects.create(
            supplier=self.supplier,
            name="Cable USB",
            sku="USB-CBL-005",
            weight_kg="0.100",
            unit_price="25.00",
            length_cm=None,
            width_cm=None,
            height_cm=None,
        )
        self.assertIsNone(product.length_cm)
        self.assertIsNone(product.width_cm)
        self.assertIsNone(product.height_cm)

    def test_description_optional(self):
        """description es opcional."""
        product = Product.objects.create(
            supplier=self.supplier,
            name="Mouse Inalambrico",
            sku="MOUSE-INL-006",
            weight_kg="0.150",
            unit_price="80.00",
            description=None,
        )
        self.assertIsNone(product.description)

    def test_supplier_protect_on_delete(self):
        """No se puede borrar supplier si tiene productos activos."""
        from django.db.models import ProtectedError
        with self.assertRaises(ProtectedError):
            self.supplier.delete()

    def test_warehouse_set_null_on_delete(self):
        """Al borrar warehouse, product.warehouse queda en NULL."""
        self.warehouse.delete()
        self.product.refresh_from_db()
        self.assertIsNone(self.product.warehouse)


class ProductSerializerTest(TestCase):
    def setUp(self):
        self.supplier = Supplier.objects.create(
            name="Distribuidora Arequipa EIRL",
            tax_id="20987654321",
            city="Arequipa",
        )
        self.warehouse = Warehouse.objects.create(
            name="Almacen Trujillo Norte",
            address="Av. Industrial 456, Trujillo",
            city="Trujillo",
        )
        self.valid_data = {
            "supplier": self.supplier.pk,
            "warehouse": self.warehouse.pk,
            "name": "Impresora HP LaserJet",
            "sku": "HP-LJ-PRO-007",
            "weight_kg": "8.500",
            "unit_price": "1200.00",
            "stock_quantity": 5,
            "description": "Impresora laser monocromatica profesional",
            "length_cm": "40.00",
            "width_cm": "35.00",
            "height_cm": "25.00",
        }

    def test_valid_data_is_valid(self):
        """Datos completos y correctos pasan validacion."""
        serializer = ProductSerializer(data=self.valid_data)
        self.assertTrue(serializer.is_valid(), serializer.errors)

    def test_serializer_contains_expected_fields(self):
        """Todos los campos del schema estan presentes en el serializer."""
        product = Product.objects.create(
            supplier=self.supplier,
            warehouse=self.warehouse,
            name="Servidor Dell PowerEdge",
            sku="DELL-PE-008",
            weight_kg="15.000",
            unit_price="12000.00",
        )
        serializer = ProductSerializer(product)
        expected_fields = [
            'id', 'supplier', 'warehouse', 'name', 'description', 'sku',
            'weight_kg', 'length_cm', 'width_cm', 'height_cm',
            'unit_price', 'stock_quantity', 'is_active', 'created_at', 'updated_at',
        ]
        for field in expected_fields:
            self.assertIn(field, serializer.data)

    def test_missing_supplier_invalid(self):
        """supplier requerido faltante hace el serializer invalido."""
        data = self.valid_data.copy()
        del data['supplier']
        serializer = ProductSerializer(data=data)
        self.assertFalse(serializer.is_valid())
        self.assertIn('supplier', serializer.errors)

    def test_missing_name_invalid(self):
        """name requerido faltante hace el serializer invalido."""
        data = self.valid_data.copy()
        del data['name']
        serializer = ProductSerializer(data=data)
        self.assertFalse(serializer.is_valid())
        self.assertIn('name', serializer.errors)

    def test_missing_sku_invalid(self):
        """sku requerido faltante hace el serializer invalido."""
        data = self.valid_data.copy()
        del data['sku']
        serializer = ProductSerializer(data=data)
        self.assertFalse(serializer.is_valid())
        self.assertIn('sku', serializer.errors)

    def test_missing_weight_kg_invalid(self):
        """weight_kg requerido faltante hace el serializer invalido."""
        data = self.valid_data.copy()
        del data['weight_kg']
        serializer = ProductSerializer(data=data)
        self.assertFalse(serializer.is_valid())
        self.assertIn('weight_kg', serializer.errors)

    def test_missing_unit_price_invalid(self):
        """unit_price requerido faltante hace el serializer invalido."""
        data = self.valid_data.copy()
        del data['unit_price']
        serializer = ProductSerializer(data=data)
        self.assertFalse(serializer.is_valid())
        self.assertIn('unit_price', serializer.errors)

    def test_empty_name_invalid(self):
        """name vacio hace el serializer invalido."""
        data = self.valid_data.copy()
        data['name'] = ''
        serializer = ProductSerializer(data=data)
        self.assertFalse(serializer.is_valid())

    def test_empty_sku_invalid(self):
        """sku vacio hace el serializer invalido."""
        data = self.valid_data.copy()
        data['sku'] = ''
        serializer = ProductSerializer(data=data)
        self.assertFalse(serializer.is_valid())

    def test_warehouse_optional(self):
        """warehouse es opcional — datos sin warehouse son validos."""
        data = self.valid_data.copy()
        data['sku'] = 'NO-WH-SKU-009'
        del data['warehouse']
        serializer = ProductSerializer(data=data)
        self.assertTrue(serializer.is_valid(), serializer.errors)

    def test_read_only_fields_ignored_on_input(self):
        """id, created_at, updated_at no se aceptan como input (read only)."""
        data = self.valid_data.copy()
        data['sku'] = 'READ-ONLY-SKU-010'
        data['id'] = 9999
        serializer = ProductSerializer(data=data)
        self.assertTrue(serializer.is_valid(), serializer.errors)
        self.assertNotIn('id', serializer.validated_data)

    def test_description_optional(self):
        """description es opcional — serializer valido sin ella."""
        data = self.valid_data.copy()
        data['sku'] = 'NO-DESC-SKU-011'
        del data['description']
        serializer = ProductSerializer(data=data)
        self.assertTrue(serializer.is_valid(), serializer.errors)

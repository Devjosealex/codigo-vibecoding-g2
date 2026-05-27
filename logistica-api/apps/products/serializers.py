from rest_framework import serializers
from .models import Product


class ProductSerializer(serializers.ModelSerializer):
    class Meta:
        model = Product
        fields = [
            'id', 'supplier', 'warehouse', 'name', 'description', 'sku',
            'weight_kg', 'length_cm', 'width_cm', 'height_cm',
            'unit_price', 'stock_quantity', 'is_active', 'created_at', 'updated_at',
        ]
        read_only_fields = ['id', 'created_at', 'updated_at']

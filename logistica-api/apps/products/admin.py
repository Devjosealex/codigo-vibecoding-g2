from django.contrib import admin
from .models import Product


@admin.register(Product)
class ProductAdmin(admin.ModelAdmin):
    list_display = ['name', 'sku', 'supplier', 'warehouse', 'stock_quantity', 'unit_price', 'is_active']
    list_filter = ['is_active', 'supplier']
    search_fields = ['name', 'sku', 'description']

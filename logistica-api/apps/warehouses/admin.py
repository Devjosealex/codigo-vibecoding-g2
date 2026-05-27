from django.contrib import admin
from .models import Warehouse


@admin.register(Warehouse)
class WarehouseAdmin(admin.ModelAdmin):
    list_display = ['name', 'city', 'country', 'capacity_m3', 'is_active']
    list_filter = ['is_active', 'country', 'city']
    search_fields = ['name', 'address', 'city']

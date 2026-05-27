from django.contrib import admin
from .models import Shipment, ShipmentItem


class ShipmentItemInline(admin.TabularInline):
    model = ShipmentItem
    extra = 1


@admin.register(Shipment)
class ShipmentAdmin(admin.ModelAdmin):
    list_display = ['tracking_number', 'customer', 'status', 'destination_city', 'scheduled_date', 'calculated_cost']
    list_filter = ['status', 'destination_city', 'origin_warehouse']
    search_fields = ['tracking_number', 'customer__name', 'destination_address']
    readonly_fields = ['tracking_number', 'created_at', 'updated_at']
    inlines = [ShipmentItemInline]


@admin.register(ShipmentItem)
class ShipmentItemAdmin(admin.ModelAdmin):
    list_display = ['shipment', 'product', 'quantity', 'unit_price_at_shipment']
    list_filter = ['shipment']

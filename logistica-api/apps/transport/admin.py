from django.contrib import admin
from .models import Vehicle


@admin.register(Vehicle)
class VehicleAdmin(admin.ModelAdmin):
    list_display = ['name', 'plate_number', 'vehicle_type', 'driver', 'capacity_kg', 'is_active']
    list_filter = ['vehicle_type', 'is_active']
    search_fields = ['name', 'plate_number']

from django.contrib import admin
from .models import Driver


@admin.register(Driver)
class DriverAdmin(admin.ModelAdmin):
    list_display = ['last_name', 'first_name', 'document_number', 'license_number', 'license_expiry', 'is_active']
    list_filter = ['is_active']
    search_fields = ['first_name', 'last_name', 'document_number', 'license_number']

from django.contrib import admin
from .models import Customer


@admin.register(Customer)
class CustomerAdmin(admin.ModelAdmin):
    list_display = ['name', 'customer_type', 'email', 'city', 'is_active']
    list_filter = ['customer_type', 'is_active', 'country']
    search_fields = ['name', 'email', 'tax_id']

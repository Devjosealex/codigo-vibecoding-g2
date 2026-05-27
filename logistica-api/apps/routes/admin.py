from django.contrib import admin
from .models import Route, RouteStop


class RouteStopInline(admin.TabularInline):
    model = RouteStop
    extra = 1
    ordering = ['stop_order']


@admin.register(Route)
class RouteAdmin(admin.ModelAdmin):
    list_display = ['name', 'origin_warehouse', 'distance_km', 'estimated_duration_h', 'is_active']
    list_filter = ['is_active', 'origin_warehouse']
    search_fields = ['name']
    inlines = [RouteStopInline]


@admin.register(RouteStop)
class RouteStopAdmin(admin.ModelAdmin):
    list_display = ['route', 'stop_order', 'city', 'address']
    list_filter = ['route']
    ordering = ['route', 'stop_order']

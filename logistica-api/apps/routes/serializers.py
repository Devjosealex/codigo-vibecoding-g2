from rest_framework import serializers
from .models import Route, RouteStop


class RouteStopSerializer(serializers.ModelSerializer):
    class Meta:
        model = RouteStop
        fields = ['id', 'route', 'stop_order', 'address', 'city', 'latitude', 'longitude']
        read_only_fields = ['id']


class RouteSerializer(serializers.ModelSerializer):
    stops = RouteStopSerializer(many=True, read_only=True)

    class Meta:
        model = Route
        fields = [
            'id', 'name', 'origin_warehouse', 'distance_km',
            'estimated_duration_h', 'is_active', 'created_at', 'updated_at', 'stops',
        ]
        read_only_fields = ['id', 'created_at', 'updated_at']

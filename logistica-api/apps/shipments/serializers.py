from rest_framework import serializers
from .models import Shipment, ShipmentItem


class ShipmentItemSerializer(serializers.ModelSerializer):
    class Meta:
        model = ShipmentItem
        fields = ['id', 'shipment', 'product', 'quantity', 'unit_price_at_shipment']
        read_only_fields = ['id']


class ShipmentSerializer(serializers.ModelSerializer):
    items = ShipmentItemSerializer(many=True, read_only=True)

    class Meta:
        model = Shipment
        fields = [
            'id', 'tracking_number', 'customer', 'origin_warehouse',
            'vehicle', 'route', 'destination_address', 'destination_city',
            'destination_country', 'status', 'scheduled_date', 'delivered_at',
            'base_cost', 'calculated_cost', 'notes', 'created_at', 'updated_at',
            'items',
        ]
        read_only_fields = [
            'id', 'tracking_number', 'delivered_at',
            'calculated_cost', 'created_at', 'updated_at',
        ]


class ShipmentStatusSerializer(serializers.Serializer):
    status = serializers.ChoiceField(choices=Shipment.STATUS_CHOICES)

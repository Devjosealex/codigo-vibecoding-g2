from rest_framework import viewsets, status
from rest_framework.decorators import action
from rest_framework.response import Response

from .models import Shipment, ShipmentItem
from .serializers import ShipmentSerializer, ShipmentItemSerializer, ShipmentStatusSerializer
from .services import generate_tracking_number, calculate_shipment_cost, transition_status


class ShipmentViewSet(viewsets.ModelViewSet):
    queryset = Shipment.objects.all().select_related(
        'customer', 'origin_warehouse', 'vehicle', 'route'
    ).prefetch_related('items__product')
    serializer_class = ShipmentSerializer
    filterset_fields = ['status', 'customer', 'origin_warehouse', 'vehicle', 'route']
    search_fields = ['tracking_number', 'destination_city', 'destination_address']
    ordering_fields = ['created_at', 'scheduled_date', 'status']

    def perform_create(self, serializer):
        serializer.save(tracking_number=generate_tracking_number())

    @action(detail=True, methods=['post'], url_path='transition')
    def transition(self, request, pk=None):
        shipment = self.get_object()
        serializer = ShipmentStatusSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        transition_status(shipment, serializer.validated_data['status'])
        return Response(ShipmentSerializer(shipment).data)


class ShipmentItemViewSet(viewsets.ModelViewSet):
    queryset = ShipmentItem.objects.all().select_related('shipment', 'product')
    serializer_class = ShipmentItemSerializer
    filterset_fields = ['shipment', 'product']

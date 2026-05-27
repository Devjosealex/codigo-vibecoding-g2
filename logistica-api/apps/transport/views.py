from rest_framework import viewsets, status
from rest_framework.response import Response
from .models import Vehicle
from .serializers import VehicleSerializer


class VehicleViewSet(viewsets.ModelViewSet):
    queryset = Vehicle.objects.filter(is_active=True).select_related('driver')
    serializer_class = VehicleSerializer
    filterset_fields = ['vehicle_type', 'driver']
    search_fields = ['name', 'plate_number']
    ordering_fields = ['name', 'plate_number', 'created_at']

    def destroy(self, request, *args, **kwargs):
        instance = self.get_object()
        instance.is_active = False
        instance.save()
        return Response(status=status.HTTP_204_NO_CONTENT)

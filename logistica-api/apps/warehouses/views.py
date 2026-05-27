from rest_framework import viewsets, status
from rest_framework.response import Response
from .models import Warehouse
from .serializers import WarehouseSerializer


class WarehouseViewSet(viewsets.ModelViewSet):
    queryset = Warehouse.objects.filter(is_active=True)
    serializer_class = WarehouseSerializer
    filterset_fields = ['city', 'country']
    search_fields = ['name', 'address', 'city']
    ordering_fields = ['name', 'city', 'created_at']

    def destroy(self, request, *args, **kwargs):
        instance = self.get_object()
        instance.is_active = False
        instance.save()
        return Response(status=status.HTTP_204_NO_CONTENT)

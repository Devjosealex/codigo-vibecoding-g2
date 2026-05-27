from rest_framework import viewsets, status
from rest_framework.response import Response
from .models import Supplier
from .serializers import SupplierSerializer


class SupplierViewSet(viewsets.ModelViewSet):
    queryset = Supplier.objects.filter(is_active=True)
    serializer_class = SupplierSerializer
    filterset_fields = ['city', 'country']
    search_fields = ['name', 'contact_name', 'email', 'tax_id']
    ordering_fields = ['name', 'created_at']

    def destroy(self, request, *args, **kwargs):
        instance = self.get_object()
        instance.is_active = False
        instance.save()
        return Response(status=status.HTTP_204_NO_CONTENT)

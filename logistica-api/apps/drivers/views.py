from rest_framework import viewsets, status
from rest_framework.response import Response
from .models import Driver
from .serializers import DriverSerializer


class DriverViewSet(viewsets.ModelViewSet):
    queryset = Driver.objects.filter(is_active=True)
    serializer_class = DriverSerializer
    filterset_fields = []
    search_fields = ['first_name', 'last_name', 'document_number', 'license_number']
    ordering_fields = ['last_name', 'first_name', 'license_expiry', 'created_at']

    def destroy(self, request, *args, **kwargs):
        instance = self.get_object()
        instance.is_active = False
        instance.save()
        return Response(status=status.HTTP_204_NO_CONTENT)

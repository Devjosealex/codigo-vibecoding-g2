from rest_framework import viewsets, status
from rest_framework.response import Response
from .models import Product
from .serializers import ProductSerializer


class ProductViewSet(viewsets.ModelViewSet):
    queryset = Product.objects.filter(is_active=True).select_related('supplier', 'warehouse')
    serializer_class = ProductSerializer
    filterset_fields = ['supplier', 'warehouse']
    search_fields = ['name', 'sku', 'description']
    ordering_fields = ['name', 'unit_price', 'stock_quantity', 'created_at']

    def destroy(self, request, *args, **kwargs):
        instance = self.get_object()
        instance.is_active = False
        instance.save()
        return Response(status=status.HTTP_204_NO_CONTENT)

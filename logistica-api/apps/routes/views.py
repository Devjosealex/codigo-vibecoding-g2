from rest_framework import viewsets, status
from rest_framework.response import Response
from .models import Route, RouteStop
from .serializers import RouteSerializer, RouteStopSerializer


class RouteViewSet(viewsets.ModelViewSet):
    queryset = Route.objects.filter(is_active=True).select_related('origin_warehouse').prefetch_related('stops')
    serializer_class = RouteSerializer
    filterset_fields = ['origin_warehouse']
    search_fields = ['name']
    ordering_fields = ['name', 'distance_km', 'created_at']

    def destroy(self, request, *args, **kwargs):
        instance = self.get_object()
        instance.is_active = False
        instance.save()
        return Response(status=status.HTTP_204_NO_CONTENT)


class RouteStopViewSet(viewsets.ModelViewSet):
    queryset = RouteStop.objects.all().select_related('route')
    serializer_class = RouteStopSerializer
    filterset_fields = ['route']
    ordering_fields = ['route', 'stop_order']

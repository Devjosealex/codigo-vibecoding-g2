from rest_framework.routers import DefaultRouter
from .views import ShipmentViewSet, ShipmentItemViewSet

router = DefaultRouter()
router.register(r'shipments', ShipmentViewSet, basename='shipment')
router.register(r'shipment-items', ShipmentItemViewSet, basename='shipmentitem')
urlpatterns = router.urls

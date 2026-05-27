from rest_framework.routers import DefaultRouter
from .views import RouteViewSet, RouteStopViewSet

router = DefaultRouter()
router.register(r'routes', RouteViewSet, basename='route')
router.register(r'route-stops', RouteStopViewSet, basename='routestop')
urlpatterns = router.urls

from django.contrib import admin
from django.urls import path, include
from rest_framework_simplejwt.views import TokenObtainPairView, TokenRefreshView
from drf_spectacular.views import SpectacularAPIView, SpectacularSwaggerView

urlpatterns = [
    path('admin/', admin.site.urls),
    # Auth JWT
    path('api/auth/token/', TokenObtainPairView.as_view(), name='token_obtain_pair'),
    path('api/auth/token/refresh/', TokenRefreshView.as_view(), name='token_refresh'),
    # API Docs
    path('api/schema/', SpectacularAPIView.as_view(), name='schema'),
    path('api/docs/', SpectacularSwaggerView.as_view(url_name='schema'), name='swagger-ui'),
    # Phase 0 modules
    path('api/v1/', include('apps.customers.urls')),
    path('api/v1/', include('apps.suppliers.urls')),
    path('api/v1/', include('apps.warehouses.urls')),
    # Phase 1 modules
    path('api/v1/', include('apps.products.urls')),
    path('api/v1/', include('apps.drivers.urls')),
    # Phase 2 modules
    path('api/v1/', include('apps.transport.urls')),
    path('api/v1/', include('apps.routes.urls')),
    # Phase 3 modules
    path('api/v1/', include('apps.shipments.urls')),
]

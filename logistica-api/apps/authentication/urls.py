# apps/authentication/urls.py
from django.urls import path
from rest_framework.routers import DefaultRouter
from .views import UserViewSet, GroupViewSet, PermissionListView, CurrentUserView, ChangePasswordView

router = DefaultRouter()
router.register(r'users', UserViewSet, basename='auth-user')
router.register(r'groups', GroupViewSet, basename='auth-group')

urlpatterns = router.urls + [
    path('permissions/', PermissionListView.as_view(), name='auth-permissions'),
    path('me/', CurrentUserView.as_view(), name='auth-me'),
    path('me/change_password/', ChangePasswordView.as_view(), name='auth-change-password'),
]

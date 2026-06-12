# apps/authentication/permissions.py
from rest_framework.permissions import BasePermission


class IsSuperAdmin(BasePermission):
    """Permite acceso solo a usuarios con is_superuser=True."""

    message = 'Se requieren privilegios de superadmin.'

    def has_permission(self, request, view):
        return bool(
            request.user and
            request.user.is_authenticated and
            request.user.is_superuser
        )

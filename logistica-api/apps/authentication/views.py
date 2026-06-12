# apps/authentication/views.py
from django.contrib.auth.models import User, Group, Permission
from rest_framework import viewsets, status
from rest_framework.decorators import action
from rest_framework.permissions import IsAuthenticated
from rest_framework.response import Response
from rest_framework.views import APIView
from rest_framework_simplejwt.views import TokenObtainPairView

from .permissions import IsSuperAdmin
from .serializers import (
    CustomTokenObtainPairSerializer,
    UserSerializer,
    GroupSerializer,
    PermissionSerializer,
    ProfileSerializer,
    ChangePasswordSerializer,
)


class CustomTokenObtainPairView(TokenObtainPairView):
    serializer_class = CustomTokenObtainPairSerializer


class UserViewSet(viewsets.ModelViewSet):
    queryset = User.objects.all().order_by('id')
    serializer_class = UserSerializer
    permission_classes = [IsSuperAdmin]
    search_fields = ['username', 'email', 'first_name', 'last_name']
    ordering_fields = ['username', 'date_joined']

    def destroy(self, request, *args, **kwargs):
        """Soft delete — desactiva el usuario en lugar de eliminarlo."""
        user = self.get_object()
        user.is_active = False
        user.save()
        return Response(status=status.HTTP_204_NO_CONTENT)

    @action(detail=True, methods=['post'], url_path='set_groups')
    def set_groups(self, request, pk=None):
        """
        Asigna grupos a un usuario. Reemplaza todos los grupos actuales.

        Body: { "group_ids": [1, 2, 3] }
        """
        user = self.get_object()
        group_ids = request.data.get('group_ids', [])

        if not isinstance(group_ids, list):
            return Response(
                {'detail': 'group_ids debe ser una lista de enteros.'},
                status=status.HTTP_400_BAD_REQUEST,
            )

        groups = Group.objects.filter(id__in=group_ids)
        if len(groups) != len(group_ids):
            return Response(
                {'detail': 'Uno o más group_ids no existen.'},
                status=status.HTTP_400_BAD_REQUEST,
            )

        user.groups.set(groups)
        serializer = self.get_serializer(user)
        return Response(serializer.data)


class GroupViewSet(viewsets.ModelViewSet):
    queryset = Group.objects.all().order_by('id')
    serializer_class = GroupSerializer
    permission_classes = [IsSuperAdmin]
    search_fields = ['name']
    ordering_fields = ['name']


class PermissionListView(APIView):
    permission_classes = [IsSuperAdmin]

    def get(self, request):
        permissions = Permission.objects.select_related('content_type').all().order_by('content_type', 'codename')
        serializer = PermissionSerializer(permissions, many=True)
        return Response(serializer.data)


class CurrentUserView(APIView):
    permission_classes = [IsAuthenticated]

    def get(self, request):
        serializer = ProfileSerializer(request.user)
        return Response(serializer.data)

    def patch(self, request):
        serializer = ProfileSerializer(request.user, data=request.data, partial=True)
        serializer.is_valid(raise_exception=True)
        serializer.save()
        return Response(serializer.data)


class ChangePasswordView(APIView):
    permission_classes = [IsAuthenticated]

    def post(self, request):
        serializer = ChangePasswordSerializer(data=request.data, context={'request': request})
        serializer.is_valid(raise_exception=True)
        request.user.set_password(serializer.validated_data['new_password'])
        request.user.save()
        return Response({'detail': 'Contraseña actualizada correctamente.'}, status=status.HTTP_200_OK)

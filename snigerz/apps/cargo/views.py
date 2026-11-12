from rest_framework import viewsets
from rest_framework.decorators import action
from rest_framework.response import Response
from django.utils import timezone
from django.db.models import Q
from .models import Cargo
from .serializers import CargoSerializer
class CargoViewSet(viewsets.ModelViewSet):
    queryset = Cargo.objects.select_related('origin', 'destination').all()
    serializer_class = CargoSerializer
    lookup_field = 'container_number'
    filterset_fields = ['status', 'origin', 'destination']

    def get_queryset(self):
        # Null owner means a public demo cargo. User-created cargo is private.
        return super().get_queryset().filter(Q(owner=self.request.user) | Q(owner__isnull=True))

    def perform_create(self, serializer):
        serializer.save(owner=self.request.user)

    @action(detail=False, methods=['get'])
    def mine(self, request):
        queryset = super().get_queryset().filter(owner=request.user)
        return Response(self.get_serializer(queryset, many=True).data)
    @action(detail=True, methods=['get'])
    def route(self, request, container_number=None):
        cargo = self.get_object()
        from apps.routes.models import Route
        from apps.routes.serializers import RouteSerializer
        route = Route.objects.filter(cargo=cargo).prefetch_related('steps__port').order_by('-created_at').first()
        return Response(RouteSerializer(route).data if route else {'detail': 'Маршрут не найден'})

    @action(detail=True, methods=['get', 'post'])
    def location(self, request, container_number=None):
        cargo = self.get_object()
        if request.method == 'POST':
            try:
                cargo.current_latitude = float(request.data['latitude'])
                cargo.current_longitude = float(request.data['longitude'])
            except (KeyError, TypeError, ValueError):
                return Response({'detail': 'Нужны числовые latitude и longitude.'}, status=400)
            cargo.last_location_update = timezone.now()
            cargo.save(update_fields=['current_latitude', 'current_longitude', 'last_location_update'])
        return Response({'container_number': cargo.container_number, 'latitude': cargo.current_latitude, 'longitude': cargo.current_longitude, 'updated_at': cargo.last_location_update})

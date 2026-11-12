from rest_framework import viewsets
from rest_framework.decorators import action
from rest_framework.response import Response
from .models import Cargo
from .serializers import CargoSerializer
class CargoViewSet(viewsets.ModelViewSet):
    queryset = Cargo.objects.select_related('origin', 'destination').all()
    serializer_class = CargoSerializer
    lookup_field = 'container_number'
    filterset_fields = ['status', 'origin', 'destination']
    @action(detail=True, methods=['get'])
    def route(self, request, container_number=None):
        cargo = self.get_object()
        from apps.routes.models import Route
        from apps.routes.serializers import RouteSerializer
        route = Route.objects.filter(cargo=cargo).prefetch_related('steps__port').order_by('-created_at').first()
        return Response(RouteSerializer(route).data if route else {'detail': 'Маршрут не найден'})

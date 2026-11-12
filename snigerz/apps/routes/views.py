from rest_framework import viewsets
from .models import Route
from .serializers import RouteSerializer
class RouteViewSet(viewsets.ModelViewSet):
    queryset = Route.objects.prefetch_related('steps__port').all()
    serializer_class = RouteSerializer
    filterset_fields = ['cargo', 'is_alternative']

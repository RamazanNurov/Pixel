from rest_framework import viewsets
from django.db.models import Q
from .models import Route
from .serializers import RouteSerializer
class RouteViewSet(viewsets.ModelViewSet):
    queryset = Route.objects.prefetch_related('steps__port').all()
    serializer_class = RouteSerializer
    filterset_fields = ['cargo', 'is_alternative']

    def get_queryset(self):
        return super().get_queryset().filter(Q(cargo__owner=self.request.user) | Q(cargo__owner__isnull=True))

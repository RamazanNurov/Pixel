from django.db.models import Avg, Sum
from django.db.models import Q
from rest_framework.decorators import api_view
from rest_framework.response import Response
from apps.cargo.models import Cargo
from apps.routes.models import Route
@api_view(['GET'])
def analytics(request):
    routes = Route.objects.filter(Q(cargo__owner=request.user) | Q(cargo__owner__isnull=True))
    cargo = Cargo.objects.filter(Q(owner=request.user) | Q(owner__isnull=True))
    return Response({'kpi': {'average_delivery_hours': round(routes.aggregate(v=Avg('estimated_hours'))['v'] or 0, 1), 'total_co2': round(routes.aggregate(v=Sum('co2_emissions'))['v'] or 0, 1), 'delayed_cargo': cargo.filter(status='delayed').count()}, 'cargo_by_status': {status: cargo.filter(status=status).count() for status, _ in Cargo.STATUS_CHOICES}})

from django.http import JsonResponse
from django.db.models import Avg, Sum
from apps.cargo.models import Cargo
from apps.routes.models import Route
def analytics(request):
    routes = Route.objects.all()
    return JsonResponse({'kpi': {'average_delivery_hours': round(routes.aggregate(v=Avg('estimated_hours'))['v'] or 0, 1), 'total_co2': round(routes.aggregate(v=Sum('co2_emissions'))['v'] or 0, 1), 'delayed_cargo': Cargo.objects.filter(status='delayed').count()}, 'cargo_by_status': {status: Cargo.objects.filter(status=status).count() for status, _ in Cargo.STATUS_CHOICES}})

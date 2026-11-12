from django.http import JsonResponse
from apps.cargo.models import Cargo
from apps.ports.models import Port
from apps.customs.models import CustomsDocument
def health(request): return JsonResponse({'status': 'ok', 'service': 'smart-caspian-transit'})
def dashboard(request):
    return JsonResponse({'ports_total': Port.objects.count(), 'active_ports': Port.objects.filter(is_active=True).count(), 'cargo_total': Cargo.objects.count(), 'cargo_in_transit': Cargo.objects.filter(status='in_transit').count(), 'cargo_delayed': Cargo.objects.filter(status='delayed').count(), 'documents_pending': CustomsDocument.objects.filter(is_verified=False).count()})

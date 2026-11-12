from rest_framework.decorators import api_view, permission_classes
from rest_framework.permissions import AllowAny, IsAuthenticated
from rest_framework.response import Response
from django.db.models import Q
from apps.cargo.models import Cargo
from apps.ports.models import Port
from apps.customs.models import CustomsDocument
@api_view(['GET'])
@permission_classes([AllowAny])
def health(request): return Response({'status': 'ok', 'service': 'smart-caspian-transit'})
@api_view(['GET'])
@permission_classes([IsAuthenticated])
def dashboard(request):
    cargo = Cargo.objects.filter(Q(owner=request.user) | Q(owner__isnull=True))
    documents = CustomsDocument.objects.filter(Q(cargo__owner=request.user) | Q(cargo__owner__isnull=True))
    return Response({'ports_total': Port.objects.count(), 'active_ports': Port.objects.filter(is_active=True).count(), 'cargo_total': cargo.count(), 'cargo_in_transit': cargo.filter(status='in_transit').count(), 'cargo_delayed': cargo.filter(status='delayed').count(), 'documents_pending': documents.filter(is_verified=False).count()})

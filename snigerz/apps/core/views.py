from rest_framework.decorators import api_view, permission_classes
from rest_framework.permissions import AllowAny, IsAuthenticated
from rest_framework.response import Response
from apps.cargo.models import Cargo
from apps.ports.models import Port
from apps.customs.models import CustomsDocument
@api_view(['GET'])
@permission_classes([AllowAny])
def health(request): return Response({'status': 'ok', 'service': 'smart-caspian-transit'})
@api_view(['GET'])
@permission_classes([IsAuthenticated])
def dashboard(request):
    return Response({'ports_total': Port.objects.count(), 'active_ports': Port.objects.filter(is_active=True).count(), 'cargo_total': Cargo.objects.count(), 'cargo_in_transit': Cargo.objects.filter(status='in_transit').count(), 'cargo_delayed': Cargo.objects.filter(status='delayed').count(), 'documents_pending': CustomsDocument.objects.filter(is_verified=False).count()})

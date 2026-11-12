from rest_framework.decorators import api_view
from rest_framework.response import Response
from apps.ports.models import Port
@api_view(['GET'])
def graph(request):
    return Response({'nodes': [{'id': p.code, 'name': p.name, 'latitude': p.latitude, 'longitude': p.longitude, 'is_active': p.is_active} for p in Port.objects.all()], 'edges': [], 'source': 'postgres-fallback'})

from rest_framework.decorators import api_view
from rest_framework.response import Response
from django.db.models import Q
from apps.cargo.models import Cargo
from .services import predict_cargo, predict_delay

@api_view(['POST'])
def predict(request):
    return Response(predict_delay(request.data))

@api_view(['POST'])
def predict_cargo_view(request):
    container_number = request.data.get('container_number')
    cargo = Cargo.objects.filter(Q(owner=request.user) | Q(owner__isnull=True), container_number=container_number).first()
    if not cargo:
        return Response({'detail': 'Контейнер не найден.'}, status=404)
    return Response(predict_cargo(cargo, request.data))

@api_view(['GET'])
def health(request):
    return Response({'status': 'ok', 'model': 'RandomForest trained on delay_history.csv', 'features': ['weather_risk', 'port_load', 'distance_km', 'customs_check', 'sea_share']})

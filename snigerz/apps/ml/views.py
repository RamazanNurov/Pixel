from rest_framework.decorators import api_view
from rest_framework.response import Response
from .services import predict_delay

@api_view(['POST'])
def predict(request):
    return Response(predict_delay(request.data))

@api_view(['GET'])
def health(request):
    return Response({'status': 'ok', 'model': 'RandomForest demo v1', 'features': ['weather_risk', 'port_load', 'distance_km', 'customs_check', 'sea_share']})

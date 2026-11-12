from rest_framework.decorators import api_view
from rest_framework.response import Response
from .services import activate_storm, reset_simulation
@api_view(['POST'])
def storm(request):
    port, cargo, event, route = activate_storm(request.data.get('port_code', 'MHK'))
    return Response({'success': True, 'event': 'storm', 'port': port.name, 'port_status': 'closed', 'delay_hours': 12, 'cargo': cargo.container_number if cargo else None, 'cargo_status': cargo.status if cargo else None, 'alternative_route_id': route.id if route else None, 'message': 'Порт закрыт из-за шторма'})
@api_view(['POST'])
def reset(request):
    return Response({'success': reset_simulation(), 'message': 'Симуляция сброшена'})

from django.db import transaction
from apps.ports.models import Port
from apps.cargo.models import Cargo
from apps.routes.models import Route, RouteStep
from .models import SimulationEvent
@transaction.atomic
def activate_storm(port_code='MHK'):
    port = Port.objects.get(code=port_code)
    cargo = Cargo.objects.filter(status__in=['created', 'in_transit'], origin=port).first() or Cargo.objects.filter(status='in_transit').first()
    snapshot = {'port_is_active': port.is_active, 'cargo_id': cargo.id if cargo else None, 'cargo_status': cargo.status if cargo else None}
    port.is_active = False; port.save(update_fields=['is_active'])
    if cargo: cargo.status = 'delayed'; cargo.save(update_fields=['status'])
    event = SimulationEvent.objects.create(event_type='storm', port_code=port.code, snapshot=snapshot)
    alternative = None
    if cargo:
        alternative = Route.objects.create(cargo=cargo, name='Альтернативный маршрут после шторма', estimated_hours=12, co2_emissions=180, is_alternative=True)
        for order, code in enumerate(['ASF', 'BAK', cargo.destination.code], 1):
            node = Port.objects.filter(code=code).first()
            if node: RouteStep.objects.create(route=alternative, port=node, transport_type='sea' if order < 3 else 'rail', order=order, estimated_hours=4)
    return port, cargo, event, alternative
@transaction.atomic
def reset_simulation():
    event = SimulationEvent.objects.filter(event_type='storm', is_active=True).order_by('-created_at').first()
    if not event: return False
    port = Port.objects.get(code=event.port_code); port.is_active = event.snapshot.get('port_is_active', True); port.save(update_fields=['is_active'])
    if event.snapshot.get('cargo_id'):
        cargo = Cargo.objects.get(id=event.snapshot['cargo_id']); cargo.status = event.snapshot.get('cargo_status', 'created'); cargo.save(update_fields=['status'])
        Route.objects.filter(cargo=cargo, is_alternative=True).delete()
    event.is_active = False; event.save(update_fields=['is_active'])
    return True

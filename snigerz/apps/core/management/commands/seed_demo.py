from django.core.management.base import BaseCommand
from apps.ports.models import Port
from apps.cargo.models import Cargo
from apps.routes.models import Route, RouteStep
from apps.customs.models import CustomsDocument
class Command(BaseCommand):
    help = 'Создаёт демонстрационные данные Smart Caspian Transit'
    def handle(self, *args, **options):
        ports = [
            ('Астрахань', 'ASF', 'Россия', 'Астрахань', 46.35, 48.04),
            ('Махачкала', 'MHK', 'Россия', 'Махачкала', 42.98, 47.50),
            ('Баку / Алят', 'BAK', 'Азербайджан', 'Алят', 40.28, 49.75),
            ('Энзели', 'ENZ', 'Иран', 'Энзели', 37.47, 49.46),
            ('Амирбад', 'AMR', 'Иран', 'Амирбад', 36.85, 53.07),
        ]
        created = {code: Port.objects.update_or_create(code=code, defaults={'name': name, 'country': country, 'city': city, 'latitude': lat, 'longitude': lon, 'is_active': True})[0] for name, code, country, city, lat, lon in ports}
        cargo, _ = Cargo.objects.update_or_create(container_number='MSKU1234567', defaults={'origin': created['ASF'], 'destination': created['ENZ'], 'status': 'in_transit', 'weight': 12000, 'description': 'Контейнер с промышленным оборудованием'})
        route, _ = Route.objects.get_or_create(cargo=cargo, name='Север-Юг: Каспийский мультимодальный маршрут', defaults={'estimated_hours': 72, 'co2_emissions': 420})
        if not route.steps.exists():
            for order, code, transport in [(1, 'ASF', 'road'), (2, 'MHK', 'sea'), (3, 'BAK', 'sea'), (4, 'ENZ', 'sea')]: RouteStep.objects.create(route=route, port=created[code], transport_type=transport, order=order, estimated_hours=18)
        for number, kind in [('BL-2026-001', 'bill_of_lading'), ('DEC-2026-001', 'declaration'), ('CERT-2026-001', 'certificate'), ('INV-2026-001', 'invoice')]: CustomsDocument.objects.get_or_create(cargo=cargo, document_number=number, defaults={'document_type': kind})
        self.stdout.write(self.style.SUCCESS('Demo-данные созданы: 5 портов, 1 груз, маршрут и 4 документа.'))

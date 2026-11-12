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
        cargo, _ = Cargo.objects.update_or_create(container_number='MSKU1234567', defaults={'origin': created['ASF'], 'destination': created['ENZ'], 'status': 'in_transit', 'weight': 12000, 'description': 'Контейнер с промышленным оборудованием', 'current_latitude': 42.98, 'current_longitude': 47.50})
        route, _ = Route.objects.get_or_create(cargo=cargo, name='Север-Юг: Каспийский мультимодальный маршрут', defaults={'estimated_hours': 72, 'co2_emissions': 420})
        if not route.steps.exists():
            for order, code, transport in [(1, 'ASF', 'road'), (2, 'MHK', 'sea'), (3, 'BAK', 'sea'), (4, 'ENZ', 'sea')]: RouteStep.objects.create(route=route, port=created[code], transport_type=transport, order=order, estimated_hours=18)
        for number, kind in [('BL-2026-001', 'bill_of_lading'), ('DEC-2026-001', 'declaration'), ('CERT-2026-001', 'certificate'), ('INV-2026-001', 'invoice')]: CustomsDocument.objects.get_or_create(cargo=cargo, document_number=number, defaults={'document_type': kind})
        extra_cargo = [
            ('TGHU7654321', 'MHK', 'AMR', 'in_transit', 18400, 43.65, 48.25, 'Контейнер с комплектующими для промышленности'),
            ('CMAU2468101', 'BAK', 'ENZ', 'in_transit', 9600, 40.05, 49.55, 'Электронное оборудование'),
            ('OOLU1357911', 'ASF', 'BAK', 'created', 22000, 46.35, 48.04, 'Металлопродукция'),
            ('MSCU1122334', 'ENZ', 'AMR', 'delayed', 14800, 37.47, 49.46, 'Продовольственный груз'),
            ('FSCU9988776', 'AMR', 'ASF', 'inspection', 7600, 38.7, 50.4, 'Текстильная продукция'),
        ]
        for number, origin_code, destination_code, status, weight, latitude, longitude, description in extra_cargo:
            extra, _ = Cargo.objects.update_or_create(container_number=number, defaults={'origin': created[origin_code], 'destination': created[destination_code], 'status': status, 'weight': weight, 'description': description, 'current_latitude': latitude, 'current_longitude': longitude})
            extra_route, _ = Route.objects.get_or_create(cargo=extra, name=f'{created[origin_code].city} — {created[destination_code].city}', defaults={'estimated_hours': 48 + weight / 1000, 'co2_emissions': 260 + weight / 100})
            if not extra_route.steps.exists():
                RouteStep.objects.create(route=extra_route, port=created[origin_code], transport_type='sea', order=1, estimated_hours=18)
                RouteStep.objects.create(route=extra_route, port=created[destination_code], transport_type='sea', order=2, estimated_hours=30)
            CustomsDocument.objects.get_or_create(cargo=extra, document_number=f'BL-{number}', defaults={'document_type': 'bill_of_lading'})
        self.stdout.write(self.style.SUCCESS('Demo-данные созданы: 5 портов, 6 грузов, маршруты и документы.'))

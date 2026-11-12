from django.db import models
from apps.cargo.models import Cargo
from apps.ports.models import Port
class Route(models.Model):
    cargo = models.ForeignKey(Cargo, on_delete=models.CASCADE, related_name='routes')
    name = models.CharField(max_length=150)
    estimated_hours = models.FloatField(default=0)
    co2_emissions = models.FloatField(default=0)
    is_alternative = models.BooleanField(default=False)
    created_at = models.DateTimeField(auto_now_add=True)
    class Meta: ordering = ['-created_at']
class RouteStep(models.Model):
    TRANSPORT_CHOICES = [('sea', 'Морской'), ('rail', 'Железнодорожный'), ('road', 'Автомобильный')]
    route = models.ForeignKey(Route, on_delete=models.CASCADE, related_name='steps')
    port = models.ForeignKey(Port, on_delete=models.PROTECT)
    transport_type = models.CharField(max_length=20, choices=TRANSPORT_CHOICES)
    order = models.PositiveIntegerField()
    estimated_hours = models.FloatField(default=0)
    class Meta: ordering = ['order']; unique_together = [('route', 'order')]

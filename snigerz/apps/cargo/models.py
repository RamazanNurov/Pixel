from django.db import models
from apps.ports.models import Port
class Cargo(models.Model):
    STATUS_CHOICES = [('created', 'Создан'), ('in_transit', 'В пути'), ('delayed', 'Задержан'), ('inspection', 'На проверке'), ('delivered', 'Доставлен')]
    container_number = models.CharField(max_length=30, unique=True)
    origin = models.ForeignKey(Port, on_delete=models.PROTECT, related_name='outgoing_cargo')
    destination = models.ForeignKey(Port, on_delete=models.PROTECT, related_name='incoming_cargo')
    status = models.CharField(max_length=20, choices=STATUS_CHOICES, default='created')
    weight = models.FloatField(default=0)
    description = models.TextField(blank=True)
    created_at = models.DateTimeField(auto_now_add=True)
    class Meta:
        ordering = ['-created_at']
    def __str__(self): return self.container_number

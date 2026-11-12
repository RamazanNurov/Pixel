from django.db import models
class SimulationEvent(models.Model):
    EVENT_TYPES = [('storm', 'Шторм'), ('reset', 'Сброс')]
    event_type = models.CharField(max_length=20, choices=EVENT_TYPES)
    port_code = models.CharField(max_length=20, blank=True)
    snapshot = models.JSONField(default=dict)
    is_active = models.BooleanField(default=True)
    created_at = models.DateTimeField(auto_now_add=True)

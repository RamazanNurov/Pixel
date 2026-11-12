from django.db import models
from apps.cargo.models import Cargo
class CustomsDocument(models.Model):
    DOCUMENT_TYPES = [('bill_of_lading', 'Bill of Lading'), ('declaration', 'Таможенная декларация'), ('certificate', 'Фитосанитарный сертификат'), ('invoice', 'Invoice')]
    cargo = models.ForeignKey(Cargo, on_delete=models.CASCADE, related_name='documents')
    document_type = models.CharField(max_length=30, choices=DOCUMENT_TYPES)
    document_number = models.CharField(max_length=100)
    is_verified = models.BooleanField(default=False)
    created_at = models.DateTimeField(auto_now_add=True)
    class Meta:
        ordering = ['-created_at']

from rest_framework import serializers
from .models import CustomsDocument
class CustomsDocumentSerializer(serializers.ModelSerializer):
    class Meta:
        model = CustomsDocument
        fields = '__all__'

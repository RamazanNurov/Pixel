from rest_framework import serializers
from .models import Port
class PortSerializer(serializers.ModelSerializer):
    class Meta:
        model = Port
        fields = '__all__'

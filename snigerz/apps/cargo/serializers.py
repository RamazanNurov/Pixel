from rest_framework import serializers
from .models import Cargo
class CargoSerializer(serializers.ModelSerializer):
    origin_name = serializers.CharField(source='origin.name', read_only=True)
    destination_name = serializers.CharField(source='destination.name', read_only=True)
    class Meta:
        model = Cargo
        fields = ['id', 'container_number', 'origin', 'origin_name', 'destination', 'destination_name', 'status', 'weight', 'description', 'created_at']

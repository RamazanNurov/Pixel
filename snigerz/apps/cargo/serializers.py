from rest_framework import serializers
from .models import Cargo
class CargoSerializer(serializers.ModelSerializer):
    owner_username = serializers.CharField(source='owner.username', read_only=True)
    origin_name = serializers.CharField(source='origin.name', read_only=True)
    destination_name = serializers.CharField(source='destination.name', read_only=True)
    class Meta:
        model = Cargo
        fields = ['id', 'container_number', 'owner_username', 'origin', 'origin_name', 'destination', 'destination_name', 'status', 'weight', 'description', 'current_latitude', 'current_longitude', 'last_location_update', 'created_at']

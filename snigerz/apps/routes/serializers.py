from rest_framework import serializers
from .models import Route, RouteStep
class RouteStepSerializer(serializers.ModelSerializer):
    port_name = serializers.CharField(source='port.name', read_only=True)
    port_code = serializers.CharField(source='port.code', read_only=True)
    class Meta:
        model = RouteStep
        fields = ['id', 'port', 'port_name', 'port_code', 'transport_type', 'order', 'estimated_hours']
class RouteSerializer(serializers.ModelSerializer):
    steps = RouteStepSerializer(many=True, read_only=True)
    class Meta:
        model = Route
        fields = ['id', 'cargo', 'name', 'estimated_hours', 'co2_emissions', 'is_alternative', 'created_at', 'steps']

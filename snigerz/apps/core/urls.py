from django.urls import path
from .views import dashboard, health

urlpatterns = [path('', dashboard), path('health/', health)]

from django.urls import path
from .views import health, predict

urlpatterns = [path('predict/', predict), path('health/', health)]

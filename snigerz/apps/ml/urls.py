from django.urls import path
from .views import health, predict, predict_cargo_view

urlpatterns = [path('predict/', predict), path('predict-cargo/', predict_cargo_view), path('health/', health)]

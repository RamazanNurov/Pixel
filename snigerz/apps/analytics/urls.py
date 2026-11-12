from django.urls import path
from .views import analytics
urlpatterns = [path('', analytics)]

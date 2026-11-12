from django.urls import path
from rest_framework.routers import DefaultRouter
from .views import CustomsViewSet, verify
router = DefaultRouter(); router.register('', CustomsViewSet, basename='customs')
urlpatterns = [path('verify/', verify)] + router.urls

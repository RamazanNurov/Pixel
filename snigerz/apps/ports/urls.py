from rest_framework.routers import DefaultRouter
from .views import PortViewSet
router = DefaultRouter()
router.register('', PortViewSet, basename='port')
urlpatterns = router.urls

from rest_framework.routers import DefaultRouter
from .views import CargoViewSet
router = DefaultRouter()
router.register('', CargoViewSet, basename='cargo')
urlpatterns = router.urls

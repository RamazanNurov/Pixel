from rest_framework.routers import DefaultRouter
from .views import RouteViewSet
router = DefaultRouter(); router.register('', RouteViewSet, basename='route')
urlpatterns = router.urls

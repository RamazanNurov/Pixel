from django.urls import path
from .views import storm, reset
urlpatterns = [path('storm/', storm), path('reset/', reset)]

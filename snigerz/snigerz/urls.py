"""
URL configuration for snigerz project.

The `urlpatterns` list routes URLs to views. For more information please see:
    https://docs.djangoproject.com/en/6.1/topics/http/urls/
Examples:
Function views
    1. Add an import:  from my_app import views
    2. Add a URL to urlpatterns:  path('', views.home, name='home')
Class-based views
    1. Add an import:  from other_app.views import Home
    2. Add a URL to urlpatterns:  path('', Home.as_view(), name='home')
Including another URLconf
    1. Import the include() function: from django.urls import include, path
    2. Add a URL to urlpatterns:  path('blog/', include('blog.urls'))
"""
from django.contrib import admin
from django.urls import include, path

urlpatterns = [
    path('admin/', admin.site.urls),
    path('api/', include('apps.core.urls')),
    path('api/ports/', include('apps.ports.urls')),
    path('api/cargo/', include('apps.cargo.urls')),
    path('api/routes/', include('apps.routes.urls')),
    path('api/analytics/', include('apps.analytics.urls')),
    path('api/simulation/', include('apps.simulation.urls')),
    path('api/customs/', include('apps.customs.urls')),
    path('api/graph/', include('apps.graph.urls')),
    path('api/ml/', include('apps.ml.urls')),
]

from django.contrib import admin
from django.urls import path, include
from mapping import views as mapping_views

urlpatterns = [
    path('admin/', admin.site.urls),
    path('', mapping_views.map_view, name='map'),
    path('spatial/', include('spatial_analysis.urls')),
]
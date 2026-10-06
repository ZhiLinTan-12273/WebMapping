from django.contrib import admin
from django.urls import path, include
from drf_spectacular.views import SpectacularAPIView, SpectacularSwaggerView
from mapping import views as mapping_views

urlpatterns = [
    path('admin/', admin.site.urls),
    path('', mapping_views.map_view, name='map'),  
    path('spatial/', include('spatial_analysis.urls')), 

    # API endpoints
    path('api/cities/', include('cities_api.urls')),

    # API documentation
    path('api/schema/', SpectacularAPIView.as_view(), name='schema'),
    path('api/docs/', SpectacularSwaggerView.as_view(url_name='schema'), name='swagger-ui'),
]
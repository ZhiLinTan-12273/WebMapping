import os
from django.contrib import admin
from django.urls import path, re_path, include
from django.views.generic import TemplateView
from django.views.static import serve
from django.conf import settings

urlpatterns = [
    path('admin/', admin.site.urls),
    path('api/', include('cities_api.urls')),
    path('map/', TemplateView.as_view(template_name='map.html'), name='map'),
    path('', TemplateView.as_view(template_name='map.html'), name='map_home'),

    re_path(r'^static/(?P<path>.*)$', serve, {
        'document_root': settings.STATICFILES_DIRS[0] if settings.STATICFILES_DIRS else settings.STATIC_ROOT,
    }),
]
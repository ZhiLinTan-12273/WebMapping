# dashboard/views.py
from django.db.models import Avg, Count, Max, Min, Sum
from django.shortcuts import render
from cities.models import City
from regions.models import Region


def index(request):
    """Main dashboard view"""
    context = {
        'total_cities': City.objects.count(),
        'total_regions': Region.objects.count(),
        'countries': City.objects.values_list('country', flat=True).distinct().order_by('country'),
        'region_types': Region.objects.values_list('region_type', flat=True).distinct(),
        'city_types': [choice[0] for choice in City._meta.get_field('city_type').choices],
    }
    return render(request, 'dashboard/index.html', context)


def analytics(request):
    """Analytics page with detailed statistics"""
    city_queryset = City.objects.all()
    city_stats = {
        'total_cities': city_queryset.count(),
        'total_population': city_queryset.aggregate(Sum('population'))['population__sum'] or 0,
        'avg_population': city_queryset.aggregate(Avg('population'))['population__avg'] or 0,
        'max_population': city_queryset.aggregate(Max('population'))['population__max'] or 0,
        'min_population': city_queryset.aggregate(Min('population'))['population__min'] or 0,
        'avg_area': city_queryset.aggregate(Avg('urban_area_km2'))['urban_area_km2__avg'] or 0,
    }

    region_queryset = Region.objects.all()
    region_stats = {
        'total_regions': region_queryset.count(),
        'total_population': region_queryset.aggregate(Sum('total_population'))['total_population__sum'] or 0,
        'avg_population': region_queryset.aggregate(Avg('total_population'))['total_population__avg'] or 0,
        'max_population': region_queryset.aggregate(Max('total_population'))['total_population__max'] or 0,
        'min_population': region_queryset.aggregate(Min('total_population'))['total_population__min'] or 0,
        'avg_area': region_queryset.aggregate(Avg('area_km2'))['area_km2__avg'] or 0,
        'avg_gdp_per_capita': region_queryset.aggregate(Avg('gdp_per_capita'))['gdp_per_capita__avg'] or 0,
    }

    context = {
        'city_stats': city_stats,
        'region_stats': region_stats,
    }
    return render(request, 'dashboard/analytics.html', context)
from django.test import TestCase
from rest_framework.test import APIClient
from rest_framework import status
from cities.models import City
from regions.models import Region
from django.contrib.gis.geos import MultiPolygon, Polygon


class EuropeanMappingAPITests(TestCase):
    def setUp(self):
        self.client = APIClient()
        self.city = City.objects.create(
            name='Dublin',
            country='Ireland',
            population=1255963,
            latitude=53.3498,
            longitude=-6.2603,
            city_type='capital',
            urban_area_km2=117.8
        )
        self.region = Region.objects.create(
            name='Ireland East Region',
            country='Ireland',
            region_code='IE-E',
            region_type='county',
            total_population=1900000,
            area_km2=2000.0,
            population_density=950.0,
            geometry=MultiPolygon([
                Polygon([(-6.6, 53.1), (-6.0, 53.1), (-6.0, 53.6), (-6.6, 53.6), (-6.6, 53.1)])
            ])
        )

    def test_cities_list_geojson(self):
        response = self.client.get('/api/cities/')
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertEqual(response.data['type'], 'FeatureCollection')
        self.assertGreaterEqual(len(response.data['features']), 1)

    def test_regions_list_geojson(self):
        response = self.client.get('/api/regions/')
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertEqual(response.data['type'], 'FeatureCollection')

    def test_city_population_filter(self):
        response = self.client.get('/api/cities/?population_min=2000000')
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertEqual(len(response.data['features']), 0)

    def test_dashboard_views(self):
        res_index = self.client.get('/')
        self.assertEqual(res_index.status_code, status.HTTP_200_OK)
        res_analytics = self.client.get('/analytics/')
        self.assertEqual(res_analytics.status_code, status.HTTP_200_OK)
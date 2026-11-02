# cities/management/commands/load_sample_data.py
from django.core.management.base import BaseCommand
from django.contrib.gis.geos import MultiPolygon, Polygon
from cities.models import City
from regions.models import Region


class Command(BaseCommand):
    help = 'Load sample European cities and regions into PostGIS'

    def handle(self, *args, **options):
        self.stdout.write("Loading sample data...")

        # 1. 建立歐洲區域資料 (範例多邊形)
        regions_data = [
            {
                'name': 'Ireland East Region',
                'country': 'Ireland',
                'region_code': 'IE-E',
                'region_type': 'county',
                'total_population': 1900000,
                'population_year': 2023,
                'gdp_per_capita': 65000,
                'unemployment_rate': 4.2,
                'admin_level': 2,
                'geometry': MultiPolygon([
                    Polygon([(-6.6, 53.1), (-6.0, 53.1), (-6.0, 53.6), (-6.6, 53.6), (-6.6, 53.1)])
                ])
            },
            {
                'name': 'Île-de-France',
                'country': 'France',
                'region_code': 'FR-IDF',
                'region_type': 'state',
                'total_population': 12278000,
                'population_year': 2023,
                'gdp_per_capita': 59000,
                'unemployment_rate': 6.8,
                'admin_level': 2,
                'geometry': MultiPolygon([
                    Polygon([(1.8, 48.5), (3.0, 48.5), (3.0, 49.2), (1.8, 49.2), (1.8, 48.5)])
                ])
            },
            {
                'name': 'Berlin-Brandenburg',
                'country': 'Germany',
                'region_code': 'DE-BB',
                'region_type': 'state',
                'total_population': 6200000,
                'population_year': 2023,
                'gdp_per_capita': 48000,
                'unemployment_rate': 7.5,
                'admin_level': 2,
                'geometry': MultiPolygon([
                    Polygon([(12.8, 52.2), (13.8, 52.2), (13.8, 52.8), (12.8, 52.8), (12.8, 52.2)])
                ])
            }
        ]

        for r in regions_data:
            region, created = Region.objects.update_or_create(
                region_code=r['region_code'],
                defaults=r
            )
            self.stdout.write(f"Region: {region.name} ({'Created' if created else 'Updated'})")

        # 2. 建立歐洲主要城市資料
        cities_data = [
            {
                'name': 'Dublin',
                'country': 'Ireland',
                'population': 1255963,
                'latitude': 53.3498,
                'longitude': -6.2603,
                'city_type': 'capital',
                'urban_area_km2': 117.8,
                'gdp_per_capita': 72000,
                'unemployment_rate': 4.1,
                'green_space_percentage': 35.0,
                'region_code': 'IE-E',
            },
            {
                'name': 'Paris',
                'country': 'France',
                'population': 2161000,
                'latitude': 48.8566,
                'longitude': 2.3522,
                'city_type': 'capital',
                'urban_area_km2': 105.4,
                'gdp_per_capita': 62000,
                'unemployment_rate': 6.5,
                'green_space_percentage': 28.5,
                'region_code': 'FR-IDF',
            },
            {
                'name': 'Berlin',
                'country': 'Germany',
                'population': 3645000,
                'latitude': 52.5200,
                'longitude': 13.4050,
                'city_type': 'capital',
                'urban_area_km2': 891.8,
                'gdp_per_capita': 45000,
                'unemployment_rate': 7.9,
                'green_space_percentage': 44.0,
                'region_code': 'DE-BB',
            },
            {
                'name': 'Cork',
                'country': 'Ireland',
                'population': 222333,
                'latitude': 51.8985,
                'longitude': -8.4756,
                'city_type': 'regional',
                'urban_area_km2': 37.3,
                'gdp_per_capita': 54000,
                'unemployment_rate': 4.8,
                'green_space_percentage': 32.0,
                'region_code': 'IE-SW',
            },
            {
                'name': 'Lyon',
                'country': 'France',
                'population': 522969,
                'latitude': 45.7640,
                'longitude': 4.8357,
                'city_type': 'major',
                'urban_area_km2': 47.87,
                'gdp_per_capita': 51000,
                'unemployment_rate': 6.1,
                'green_space_percentage': 31.0,
                'region_code': 'FR-ARA',
            }
        ]

        for c in cities_data:
            city, created = City.objects.update_or_create(
                name=c['name'],
                country=c['country'],
                defaults=c
            )
            self.stdout.write(f"City: {city.name} ({'Created' if created else 'Updated'})")

        self.stdout.write(self.style.SUCCESS("Sample data successfully loaded!"))
// Store cities data and markers
console.log('map.js loaded');
let citiesData = [];
let markers = {};
let cityCount = 0;
let map = null;

// Lab 5 Proximity State & Layers
let proximityMode = null; // 'nearest' | 'radius' | null
let searchMarker = null;
let radiusCircle = null;
let proximityLayer = null;
let radiusLayer = null;
let heatLayer = null;

// API endpoint
const API_URL = '/api/';

// Initialize the map
async function initMap() {
    map = L.map('map').setView([53.3498, -6.2603], 6);

    L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
        attribution: '© OpenStreetMap contributors',
        maxZoom: 19,
        minZoom: 2
    }).addTo(map);

    setupProximitySearch(map);

    showLoading(true);
    try {
        console.log('Fetching from:', API_URL);
        const response = await fetch(API_URL);

        if (!response.ok) {
            const errorText = await response.text();
            console.error('Error response body:', errorText);
            throw new Error(`HTTP error! status: ${response.status}`);
        }

        const data = await response.json();
        citiesData = data.results || data;
        cityCount = citiesData.length;

        document.getElementById('cityCount').textContent = cityCount;
        addMarkersToMap(citiesData);

        const allCityHeat = citiesData
            .map(city => [parseFloat(city.latitude), parseFloat(city.longitude), 0.8])
            .filter(([lat, lng]) => Number.isFinite(lat) && Number.isFinite(lng));
        replaceHeatmap(allCityHeat, 'default');

    } catch (error) {
        console.error('Error fetching cities:', error);
        alert('Failed to load cities data. Check console for details.');
    } finally {
        showLoading(false);
    }
}

// Add markers for each city
function addMarkersToMap(cities) {
    Object.values(markers).forEach(marker => map.removeLayer(marker));
    markers = {};

    cities.forEach(city => {
        const lat = parseFloat(city.latitude);
        const lng = parseFloat(city.longitude);

        if (isNaN(lat) || isNaN(lng)) {
            console.warn(`Invalid coordinates for ${city.name}`);
            return;
        }

        const marker = L.circleMarker([lat, lng], {
            radius: 6,
            fillColor: '#007bff',
            color: '#0056b3',
            weight: 2,
            opacity: 1,
            fillOpacity: 0.8
        }).addTo(map);

        const popupContent = createPopupContent(city);
        marker.bindPopup(popupContent);

        // Lab 5 Part 3.1: Trigger proximity search if mode is active
        marker.on('click', () => {
            if (proximityMode) {
                marker.closePopup();
                runProximitySearch(city);
            }
        });

        markers[city.id] = marker;
    });
}

function createPopupContent(city) {
    return `
        <div class="city-popup">
            <h3>${city.name}</h3>
            <p><strong>Country:</strong> ${city.country}</p>
            ${city.region ? `<p><strong>Region:</strong> ${city.region}</p>` : ''}
            <p><strong>Population:</strong> ${formatNumber(city.population)}</p>
            <p><strong>Coordinates:</strong> ${parseFloat(city.latitude).toFixed(4)}, ${parseFloat(city.longitude).toFixed(4)}</p>
            ${city.founded_year ? `<p><strong>Founded:</strong> ${city.founded_year}</p>` : ''}
            ${city.timezone ? `<p><strong>Timezone:</strong> ${city.timezone}</p>` : ''}
        </div>
    `;
}

function formatNumber(num) {
    return num.toString().replace(/\B(?=(\d{3})+(?!\d))/g, ',');
}

// Lab 5: Proximity Search Implementation
function setupProximitySearch(mapInstance) {
    proximityLayer = L.layerGroup().addTo(mapInstance);
    radiusLayer = L.layerGroup().addTo(mapInstance);

    document.getElementById('nearest-search-btn').addEventListener('click', () => {
        setProximityMode('nearest');
    });

    document.getElementById('radius-search-btn').addEventListener('click', () => {
        setProximityMode('radius');
    });
}

function setProximityMode(mode) {
    proximityMode = proximityMode === mode ? null : mode;

    document.getElementById('nearest-search-btn').classList.toggle('active', proximityMode === 'nearest');
    document.getElementById('radius-search-btn').classList.toggle('active', proximityMode === 'radius');
    document.getElementById('radius-control').classList.toggle('d-none', proximityMode !== 'radius');

    map.getContainer().style.cursor = proximityMode ? 'crosshair' : '';

    const status = document.getElementById('proximity-status');
    if (proximityMode === 'nearest') {
        status.textContent = 'Nearest mode active: Click a city marker to find 10 nearest cities.';
    } else if (proximityMode === 'radius') {
        status.textContent = 'Radius mode active: Enter radius and click a city marker.';
    } else {
        status.textContent = 'Choose a search mode, then click a city marker.';
    }

    clearProximityResults();
}

async function runProximitySearch(city) {
    if (!proximityMode) return;

    const lat = Number(city.latitude);
    const lng = Number(city.longitude);
    const radiusKm = Number(document.getElementById('radius-input').value);
    const isRadiusSearch = proximityMode === 'radius';
    const status = document.getElementById('proximity-status');

    if (!Number.isFinite(lat) || !Number.isFinite(lng)) {
        status.textContent = `${city.name} has invalid coordinates in the API response.`;
        return;
    }

    if (isRadiusSearch && (!Number.isFinite(radiusKm) || radiusKm <= 0 || radiusKm > 20000)) {
        status.textContent = 'Enter a radius greater than 0 and no more than 20000 km.';
        return;
    }

    status.textContent = `Searching around ${city.name}…`;
    clearProximityResults();

    try {
        const response = await fetch(
            isRadiusSearch ? '/api/cities/radius/' : '/api/cities/nearest/',
            {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(isRadiusSearch
                    ? { lat, lng, radius_km: radiusKm }
                    : { lat, lng })
            }
        );

        const data = await response.json();
        if (!response.ok) throw new Error(data.error || `Search failed (${response.status})`);

        searchMarker = L.circleMarker([lat, lng], {
            radius: 8,
            fillColor: '#dc3545',
            color: '#721c24',
            weight: 3,
            fillOpacity: 1
        }).addTo(map).bindPopup(`<strong>Origin:</strong> ${city.name}`).openPopup();

        const cities = isRadiusSearch ? data.cities : data.nearest_cities;
        const heading = isRadiusSearch
            ? `${data.total_found} cities within ${data.radius_km} km of ${city.name}`
            : `10 nearest cities to ${city.name}`;

        showProximityResults(cities, heading);
        updateHeatmapForResults(cities, isRadiusSearch ? 'radius' : 'nearest');

        if (isRadiusSearch) {
            radiusCircle = L.circle([lat, lng], {
                radius: radiusKm * 1000,
                color: '#198754',
                fillOpacity: 0.08
            }).addTo(map);

            cities.forEach((c) => {
                L.circleMarker([c.coordinates.lat, c.coordinates.lng], {
                    radius: 6,
                    fillColor: '#198754',
                    color: '#0f5132',
                    weight: 2,
                    fillOpacity: 0.8
                }).addTo(radiusLayer).bindPopup(`<b>${c.name}</b><br>${c.distance_km} km away`);
            });

            map.fitBounds(radiusCircle.getBounds(), {
                padding: [30, 30],
                animate: false
            });
            map.setView([lat, lng], map.getZoom(), { animate: false });
        } else {
            cities.forEach((c) => {
                L.circleMarker([c.coordinates.lat, c.coordinates.lng], {
                    radius: 6,
                    fillColor: '#fd7e14',
                    color: '#c95e09',
                    weight: 2,
                    fillOpacity: 0.8
                }).addTo(proximityLayer).bindPopup(`<b>#${c.rank} ${c.name}</b><br>${c.distance_km} km`);
            });

            map.setView([lat, lng], Math.max(map.getZoom(), 6), { animate: false });
        }

        status.textContent = `Search complete for ${city.name}.`;
    } catch (error) {
        status.textContent = error.message;
    }
}

function showProximityResults(cities, heading) {
    const results = document.getElementById('proximity-results');
    results.replaceChildren();

    const title = document.createElement('strong');
    title.textContent = heading;
    results.append(title);

    const list = document.createElement('ol');
    cities.forEach((city) => {
        const item = document.createElement('li');
        item.style.cursor = 'pointer';
        item.textContent = `${city.name}, ${city.country} — ${city.distance_km} km`;
        item.onclick = () => {
            map.setView([city.coordinates.lat, city.coordinates.lng], 9);
        };
        list.append(item);
    });
    results.append(list);
}

function updateHeatmapForResults(cities, mode) {
    const heatData = cities
        .map(c => [c.coordinates.lat, c.coordinates.lng, 1])
        .filter(([lat, lng]) => Number.isFinite(lat) && Number.isFinite(lng));
    replaceHeatmap(heatData, mode);
}

function replaceHeatmap(heatData, mode) {
    if (typeof L.heatLayer !== 'function') return;
    if (heatLayer) map.removeLayer(heatLayer);

    const gradients = {
        default: { 0.2: '#0000ff', 0.5: '#00ffff', 0.75: '#ffff00', 1: '#ff0000' },
        nearest: { 0.2: '#00ffff', 0.5: '#00ff00', 0.75: '#ffff00', 1: '#ff7f00' },
        radius: { 0.2: '#00ff00', 0.5: '#ffff00', 0.75: '#ff7f00', 1: '#ff0000' }
    };

    heatLayer = L.heatLayer(heatData, {
        radius: 25,
        blur: 15,
        maxZoom: 10,
        minOpacity: 0.2,
        gradient: gradients[mode]
    }).addTo(map);
}

function clearProximityResults() {
    if (searchMarker) map.removeLayer(searchMarker);
    if (radiusCircle) map.removeLayer(radiusCircle);
    searchMarker = null;
    radiusCircle = null;

    if (proximityLayer) proximityLayer.clearLayers();
    if (radiusLayer) radiusLayer.clearLayers();

    const resultsDiv = document.getElementById('proximity-results');
    if (resultsDiv) resultsDiv.replaceChildren();

    if (citiesData && citiesData.length > 0) {
        const allCityHeat = citiesData
            .map(city => [parseFloat(city.latitude), parseFloat(city.longitude), 0.8])
            .filter(([lat, lng]) => Number.isFinite(lat) && Number.isFinite(lng));
        replaceHeatmap(allCityHeat, 'default');
    }
}

function setupSearchListener() {
    document.getElementById('searchInput').addEventListener('input', function(e) {
        const query = e.target.value.toLowerCase();
        const resultsDiv = document.getElementById('results');

        if (query.length === 0) {
            resultsDiv.innerHTML = '';
            addMarkersToMap(citiesData);
            return;
        }

        const filtered = citiesData.filter(city => 
            city.name.toLowerCase().includes(query) ||
            city.country.toLowerCase().includes(query)
        );

        if (filtered.length === 0) {
            resultsDiv.innerHTML = '<p style="color: #999;">No cities found</p>';
            Object.values(markers).forEach(marker => map.removeLayer(marker));
            markers = {};
        } else {
            Object.values(markers).forEach(marker => map.removeLayer(marker));
            markers = {};
            addMarkersToMap(filtered);

            resultsDiv.innerHTML = filtered.map(city => `
                <div style="padding: 8px; border-bottom: 1px solid #eee; cursor: pointer;" onclick="goToCity(${city.id})">
                    <strong>${city.name}</strong>, ${city.country}
                </div>
            `).join('');
        }
    });
}

function goToCity(cityId) {
    const city = citiesData.find(c => c.id === cityId);
    if (city) {
        map.setView([city.latitude, city.longitude], 10);
        if (markers[cityId]) {
            markers[cityId].openPopup();
        }
    }
}

function setupResetListener() {
    document.getElementById('resetBtn').addEventListener('click', function() {
        map.setView([53.3498, -6.2603], 6, { animate: false });
        document.getElementById('searchInput').value = '';
        document.getElementById('results').innerHTML = '';

        proximityMode = null;
        document.getElementById('nearest-search-btn').classList.remove('active');
        document.getElementById('radius-search-btn').classList.remove('active');
        document.getElementById('radius-control').classList.add('d-none');
        document.getElementById('proximity-status').textContent = 'Choose a search, then click a city marker.';
        map.getContainer().style.cursor = '';

        clearProximityResults();
        addMarkersToMap(citiesData);
    });
}

function showLoading(show) {
    document.getElementById('loading').style.display = show ? 'block' : 'none';
}

document.addEventListener('DOMContentLoaded', function() {
    console.log('DOM loaded, initializing map...');
    initMap();
    setupSearchListener();
    setupResetListener();
});

<template>
    <div class="relative h-full w-full rounded-lg shadow-lg overflow-hidden">
        <div id="interactive-map" class="h-full w-full"></div>

        <!-- Filter Controls -->
        <div class="absolute top-4 left-4 z-[1000] bg-slate-800 bg-opacity-80 p-3 rounded-lg shadow-lg backdrop-blur-sm">
            <h3 class="text-white font-semibold mb-2 text-lg">Filters</h3>
            <div class="space-y-2">
                <div v-for="type in Object.keys(filters)" :key="type" class="flex items-center">
                    <input :id="`filter-${type}`" v-model="filters[type]"
                        class="h-4 w-4 rounded bg-slate-600 border-slate-500 text-sky-500 focus:ring-sky-500"
                        type="checkbox" />
                    <label :for="`filter-${type}`" class="ml-2 text-white capitalize">{{ type.replace(/([A-Z])/g, ' $1').trim()
                        }}</label>
                </div>
            </div>
            <button @click="toggleHeatmap"
                class="w-full mt-3 bg-slate-700 hover:bg-slate-600 text-white font-semibold py-2 px-3 rounded-lg shadow-md flex items-center justify-center transition-colors duration-200 focus:outline-none focus:ring-2 focus:ring-sky-500">
                <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none"
                    stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"
                    class="lucide lucide-thermometer-sun mr-2">
                    <path d="M12 9a4 4 0 0 0-2 7.5" />
                    <path d="M12 3v2" />
                    <path d="M6.6 18.4 4.5 20.5" />
                    <path d="M18 2a2 2 0 0 1 2 2v10.5a4 4 0 1 1-4 0V4a2 2 0 0 1 2-2Z" />
                    <path d="m2 14 2.1 2.1" />
                    <path d="M22 14h-2" />
                    <path d="M18 6h2" />
                    <path d="M7 4h3" />
                </svg>
                {{ heatmapVisible ? 'Hide' : 'Show' }} Heatmap
            </button>
            <button @click="scanMap"
                class="w-full mt-3 bg-sky-600 hover:bg-sky-500 text-white font-semibold py-2 px-3 rounded-lg shadow-md flex items-center justify-center transition-colors duration-200 focus:outline-none focus:ring-2 focus:ring-sky-500">
                <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none"
                    stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"
                    class="lucide lucide-scan-search mr-2">
                    <path d="M3 7V5a2 2 0 0 1 2-2h2" />
                    <path d="M17 3h2a2 2 0 0 1 2 2v2" />
                    <path d="M21 17v2a2 2 0 0 1-2 2h-2" />
                    <path d="M7 21H5a2 2 0 0 1-2-2v-2" />
                    <path d="M11 12a3 3 0 1 0 0-6 3 3 0 0 0 0 6Z" />
                    <path d="m13.5 13.5 2.5 2.5" />
                </svg>
                Scan Map
            </button>
        </div>
        
        <!-- Legend -->
        <div class="absolute top-4 right-4 z-[1000] bg-slate-800 bg-opacity-80 p-3 rounded-lg shadow-lg backdrop-blur-sm">
            <h3 class="text-white font-semibold mb-2 text-lg">Legend</h3>
            <div class="space-y-3">
                <div v-for="item in legendItems" :key="item.label" class="flex items-center">
                    <div class="icon-base mr-3" :class="item.class">
                        <component :is="item.icon" class="w-5 h-5" />
                    </div>
                    <span class="text-white">{{ item.label }}</span>
                </div>
            </div>
        </div>
    </div>
</template>

<script setup lang="ts">
import { onMounted, ref, watch } from 'vue';
import 'leaflet/dist/leaflet.css';
import L from 'leaflet';
import 'leaflet.heat';
import { Building2, Newspaper, FileText, Home, Sparkles } from 'lucide-vue-next';
import { View } from '@/types';

// --- Hardcoded SVG paths for Lucide icons ---
const icons = {
  Building2: '<path d="M6 22V4a2 2 0 0 1 2-2h8a2 2 0 0 1 2 2v18"/><path d="M6 12H4a2 2 0 0 0-2 2v6a2 2 0 0 0 2 2h2"/><path d="M18 9h2a2 2 0 0 1 2 2v9a2 2 0 0 1-2 2h-2"/><path d="M10 6h4"/><path d="M10 10h4"/><path d="M10 14h4"/><path d="M10 18h4"/>',
  Newspaper: '<path d="M4 22h16a2 2 0 0 0 2-2V4a2 2 0 0 0-2-2H8a2 2 0 0 0-2 2v16a2 2 0 0 1-2 2Zm0 0a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h4"/><path d="M4 9h16"/><path d="M4 15h16"/><path d="M10 9v6"/><path d="M16 9v6"/>',
  FileText: '<path d="M15 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V7Z"/><path d="M14 2v4a2 2 0 0 0 2 2h4"/><path d="M10 9H8"/><path d="M16 13H8"/><path d="M16 17H8"/>',
  Home: '<path d="m3 9 9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z"/><polyline points="9 22 9 12 15 12 15 22"/>',
  Sparkles: '<path d="m12 3-1.912 5.813a2 2 0 0 1-1.275 1.275L3 12l5.813 1.912a2 2 0 0 1 1.275 1.275L12 21l1.912-5.813a2 2 0 0 1 1.275-1.275L21 12l-5.813-1.912a2 2 0 0 1-1.275-1.275L12 3Z"/><path d="M5 3v4"/><path d="M19 17v4"/><path d="M3 5h4"/><path d="M17 19h4"/>',
};

// --- Types ---
interface Prospect {
    id: number;
    coords: [number, number];
    name: string;
    type: string;
    [key: string]: any;
}

// --- Props ---
const props = defineProps<{
    prospects: Prospect[];
    focusedProspectId?: number | null;
}>();

const emit = defineEmits(['setCurrentView']);

// --- Refs ---
const map = ref<L.Map | null>(null);
const markerLayer = ref<L.LayerGroup>(L.layerGroup());
const heatmapLayer = ref<L.HeatLayer | null>(null);
const heatmapVisible = ref(false);
const filters = ref<Record<string, boolean>>({});

// --- Legend Data ---
const legendItems = [
    { label: 'Client', icon: Building2, class: 'icon-client' },
    { label: 'News', icon: Newspaper, class: 'icon-news icon-client-due' },
    { label: 'Permit', icon: FileText, class: 'icon-permit' },
    { label: 'AI Prospect', icon: Sparkles, class: 'icon-bright' },
    { label: 'Residential', icon: Home, class: 'icon-residential-good' },
    { label: 'Tennis Court', icon: Sparkles, class: 'icon-tennis-court-bright' },
];

const initializeFilters = () => {
    const prospectTypes = new Set(props.prospects.map(p => p.type));
    const newFilters: Record<string, boolean> = {};
    prospectTypes.forEach(type => {
        newFilters[type] = true;
    });
    filters.value = newFilters;
};

const getIconForProspect = (prospect: Prospect) => {
    const iconWrapper = document.createElement('div');
    iconWrapper.className = 'icon-base';

    let iconSvgContent = '';
    switch (prospect.type) {
        case 'news':
            iconWrapper.className += ' icon-news icon-client-due';
            iconSvgContent = icons.Newspaper;
            break;
        case 'permit':
            iconWrapper.className += ' icon-permit';
            iconSvgContent = icons.FileText;
            break;
        case 'residential':
             iconWrapper.className += prospect.status === 'good' ? ' icon-residential-good' : ' icon-residential-worn';
             iconSvgContent = icons.Home;
             break;
        case 'tennis_court':
            iconWrapper.className += ` icon-tennis-court-${prospect.status}`;
            iconSvgContent = icons.Sparkles;
            break;
        default:
            if (prospect.isClient) {
                 iconWrapper.className += ' icon-client';
                 iconSvgContent = icons.Building2;
            } else {
                 iconWrapper.className += ' icon-bright';
                 iconSvgContent = icons.Sparkles;
            }
            break;
    }
    
    iconWrapper.innerHTML = `<svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">${iconSvgContent}</svg>`;
    
    return L.divIcon({
        html: iconWrapper.outerHTML,
        className: '',
        iconSize: [32, 32],
        iconAnchor: [16, 16],
    });
};

const createPopupContent = (prospect: Prospect): string => {
    let summary = '';
    if (prospect.aiSummary) {
        summary = `<p class="mt-2 text-xs text-slate-500 leading-snug">${prospect.aiSummary}</p>`;
    } else if (prospect.status) {
        summary = `<p class="mt-2 text-xs text-slate-500">Condition: <span class="font-semibold">${prospect.status}</span></p>`;
    }

    return `
        <div class="w-60 -m-3">
            <div class="p-3">
                <h3 class="text-base font-bold text-slate-800">${prospect.name}</h3>
                <p class="text-sm text-slate-600 capitalize">${prospect.type.replace('_', ' ')}</p>
                ${summary}
            </div>
            <div class="bg-slate-50 p-2 text-center">
                 <button class="view-details-button text-indigo-600 font-semibold text-sm hover:underline" data-prospect-id="${prospect.id}">
                    View Details
                </button>
            </div>
        </div>
    `;
}

const scanMap = () => {
    if (!map.value) return;

    const bounds = map.value.getBounds();
    const southWest = bounds.getSouthWest();
    const northEast = bounds.getNorthEast();
    const newProspects: Prospect[] = [];

    for (let i = 0; i < 20; i++) { // Generate 20 mock data points
        const lat = southWest.lat + Math.random() * (northEast.lat - southWest.lat);
        const lng = southWest.lng + Math.random() * (northEast.lng - southWest.lng);
        const statuses = ['bright', 'medium', 'dim'];
        const status = statuses[Math.floor(Math.random() * statuses.length)];

        newProspects.push({
            id: Date.now() + i,
            coords: [lat, lng],
            name: `Tennis Court ${i + 1}`,
            type: 'tennis_court',
            status: status
        });
    }
    
    props.prospects.length = 0;
    props.prospects.push(...newProspects);

    initializeFilters();
    updateMarkers();
};

const updateMarkers = () => {
    markerLayer.value.clearLayers();
    const activeTypes = Object.entries(filters.value)
        .filter(([, isActive]) => isActive)
        .map(([type]) => type);

    props.prospects
        .filter(prospect => prospect.coords && activeTypes.includes(prospect.type))
        .forEach(prospect => {
            const marker = L.marker(prospect.coords, { icon: getIconForProspect(prospect) })
                .addTo(markerLayer.value)
                .bindPopup(createPopupContent(prospect));

            marker.on('popupopen', (e) => {
                const button = e.popup.getElement()?.querySelector('.view-details-button');
                button?.addEventListener('click', () => {
                    const prospectId = parseInt(button.getAttribute('data-prospect-id') || '0');
                    if(prospectId) {
                        emit('setCurrentView', View.ProjectHub, { prospectId });
                    }
                });
            });

            if (props.focusedProspectId === prospect.id) {
                (marker as any)._icon.classList.add('map-marker-highlight', 'map-marker-ping');
                 setTimeout(() => {
                    (marker as any)?._icon.classList.remove('map-marker-ping');
                }, 500);
            }
        });
};

const toggleHeatmap = () => {
    heatmapVisible.value = !heatmapVisible.value;
    if (!map.value || !heatmapLayer.value) return;

    if (heatmapVisible.value) {
        map.value.addLayer(heatmapLayer.value);
    } else {
        map.value.removeLayer(heatmapLayer.value);
    }
};

onMounted(() => {
    initializeFilters();

    if (document.getElementById('interactive-map')) {
        const initialMap = L.map('interactive-map').setView([33.48, -112.0740], 11);
        map.value = initialMap;

        const osm = L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
            attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
        });

        const satellite = L.tileLayer('https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}', {
            attribution: 'Tiles &copy; Esri'
        });

        const baseMaps = { "Street View": osm, "Satellite View": satellite };
        osm.addTo(initialMap);

        const heatPoints = props.prospects
            .filter(p => p.coords)
            .map(p => p.coords as L.LatLngTuple);
        heatmapLayer.value = L.heatLayer(heatPoints, { radius: 25 });

        markerLayer.value.addTo(initialMap);
        L.control.layers(baseMaps).addTo(initialMap);
        updateMarkers();
    }
});

watch(filters, updateMarkers, { deep: true });
watch(() => props.prospects, () => {
    initializeFilters();
    updateMarkers();
}, { deep: true });
watch(() => props.focusedProspectId, updateMarkers);
</script>

<style>
#interactive-map {
    cursor: grab;
}

.icon-tennis-court-bright {
    background-color: #fde047; /* yellow-300 */
    color: #ca8a04; /* yellow-600 */
}
.icon-tennis-court-medium {
    background-color: #fde047; /* yellow-300 */
    color: #ca8a04; /* yellow-600 */
    opacity: 0.7;
}
.icon-tennis-court-dim {
    background-color: #fde047; /* yellow-300 */
    color: #ca8a04; /* yellow-600 */
    opacity: 0.4;
}
</style>

<script setup lang="ts">
import { ref, onMounted, onUnmounted, nextTick, computed, watch } from 'vue';
import PrimaryButton from '@/components/PrimaryButton.vue';
import { View } from '@/types';
import L from 'leaflet';
import 'leaflet-draw';
import 'leaflet.heat';
import { createIcons, icons } from 'lucide';

// --- PROPS & EMITS ---
const props = defineProps<{
    prospects: any[];
    focusedProspectId?: string | null;
    mode: 'residential' | 'commercial';
}>();

const emit = defineEmits(['setCurrentView', 'addProspect', 'removeProspect', 'updateProspect']);


// --- TYPES ---
type ProspectStatus = 'New' | 'Contacted' | 'Proposal Sent' | 'Not Interested';
type ScanStatus = 'idle' | 'scanning' | 'complete';
type ScanMethod = 'view' | 'draw';

interface Prospect {
  id: string;
  type: string;
  coords: [number, number];
  name: string;
  homeowner: string;
  address: string;
  courtType: string;
  conditionScore: number;
  status: ProspectStatus | 'good' | 'worn';
  aiSummary: string;
  notes?: string;
  isClient?: boolean;
  isDue?: boolean;
}

// --- REFS & STATE ---
const mapContainerRef = ref<HTMLElement | null>(null);
let map: L.Map | null = null;
let markerLayer: L.LayerGroup | null = null;
let heatmapLayer: any | null = null;
let drawnItems: L.FeatureGroup | null = null;
let drawControl: any = null;
let markerRefs: { [key: string]: L.Marker } = {};
let resizeObserver: ResizeObserver | null = null;

const scanStatus = ref<ScanStatus>('idle');
const residentialResults = ref<Prospect[]>([]);
const activeSidebarTab = ref('results');
const selectedProspect = ref<Prospect | null>(null);
const isModalOpen = ref(false);
const isGeneratingEmail = ref(false);
const generatedEmail = ref('');
const highlightedProspectId = ref<string | null>(props.focusedProspectId || null);
const drawnAreaGeoJSON = ref<any>(null);
const scanMethod = ref<ScanMethod>('view');

// Commercial Mode State
const filters = ref<Record<string, boolean>>({});
const isHeatmapVisible = ref(false);

// --- COMPUTED PROPERTIES ---
const currentProspects = computed(() => {
    if (props.mode === 'residential') {
        return activeSidebarTab.value === 'results' ? residentialResults.value : savedProspects.value;
    }
    const activeTypes = Object.keys(filters.value).filter(type => filters.value[type]);
    if (activeTypes.length === 0) return props.prospects.filter(p => p.type !== 'residential');
    return props.prospects.filter(p => p.type !== 'residential' && activeTypes.includes(p.type));
});

const savedProspects = computed(() => props.prospects.filter(p => p.type === props.mode));

const scanButtonLabel = computed(() => {
    if (scanStatus.value === 'scanning') return 'Scanning...';
    if (scanMethod.value === 'draw') return 'Scan Selected Area';
    return 'Scan Map View';
});

const isScanButtonDisabled = computed(() => {
    if (scanStatus.value === 'scanning') return true;
    if (scanMethod.value === 'draw' && !drawnAreaGeoJSON.value) return true;
    return false;
});

const legendItems = computed(() => {
    if (props.mode === 'residential') {
        return [
            { label: 'Good Condition', class: 'icon-residential-good', icon: 'home' },
            { label: 'Worn Condition', class: 'icon-residential-worn', icon: 'home' },
        ];
    }
    return [
        { label: 'Client Project', class: 'icon-client', icon: 'building-2' },
        { label: 'Service Due', class: 'icon-client-due', icon: 'wrench' },
        { label: 'Permit Lead', class: 'icon-permit', icon: 'file-text' },
        { label: 'News Lead', class: 'icon-news', icon: 'newspaper' },
    ];
});

// --- HELPER FUNCTIONS ---
const getStatusClass = (status: string) => {
    const statusMap: { [key: string]: string } = {
        'New': 'bg-blue-100 text-blue-800',
        'Contacted': 'bg-yellow-100 text-yellow-800',
        'Proposal Sent': 'bg-purple-100 text-purple-800',
        'Not Interested': 'bg-gray-100 text-gray-800',
    };
    return statusMap[status] || 'bg-gray-100 text-gray-800';
};

const isSaved = (prospectId: string) => props.prospects.some(p => p.id === prospectId);

const saveProspect = (prospectToSave: Prospect) => {
    if (!isSaved(prospectToSave.id)) {
        emit('addProspect', { ...prospectToSave, status: 'New' as ProspectStatus, notes: '' });
    }
};

const removeProspectFromList = (prospectId: string) => {
    emit('removeProspect', prospectId);
    if (selectedProspect.value?.id === prospectId) isModalOpen.value = false;
};

const onListItemEnter = (prospectId: string) => { highlightedProspectId.value = prospectId; };
const onListItemLeave = () => { highlightedProspectId.value = null; };

const openProspectModal = (prospect: Prospect) => {
    const savedVersion = props.prospects.find(p => p.id === prospect.id);
    selectedProspect.value = { ...(savedVersion || prospect) };
    isModalOpen.value = true;
    generatedEmail.value = '';
    nextTick(() => createIcons({ icons }));
};

const handleSaveProspectUpdates = () => {
  if (selectedProspect.value) {
    emit('updateProspect', JSON.parse(JSON.stringify(selectedProspect.value)));
  }
};

const getIconHtml = (prospect: Prospect) => {
    let iconClass = '', iconName = 'sparkles';
    if (props.mode === 'residential') {
        iconClass = `icon-residential-${prospect.status}`;
        iconName = 'home';
    } else {
        iconClass = `icon-${prospect.type}`;
        if (prospect.isClient) iconClass = 'icon-client';
        if (prospect.isDue) iconClass += ' icon-client-due';
        switch (prospect.type) {
            case 'permit': iconName = 'file-text'; break;
            case 'news': iconName = 'newspaper'; break;
            default: iconName = 'building-2'; break;
        }
    }
    return `<div class="icon-base ${iconClass}"><i data-lucide="${iconName}" class="w-5 h-5"></i></div>`;
};

const createPopupContent = (prospect: Prospect) => `
  <div class="w-60 -m-3 font-sans">
    <div class="p-3">
        <h3 class="text-base font-bold text-slate-800">${prospect.name || prospect.homeowner}</h3>
        <p class="text-sm text-slate-600 capitalize">${(prospect.courtType || prospect.type).replace(/_/g, ' ')}</p>
        <p class="text-xs text-slate-500 mt-1 italic truncate">${prospect.aiSummary || 'No summary available.'}</p>
    </div>
    <div class="bg-slate-50 p-2 text-center border-t border-slate-200">
         <button class="view-details-button text-indigo-600 font-semibold text-sm hover:underline" data-prospect-id="${prospect.id}">View Details</button>
    </div>
  </div>`;

const updateMarkers = () => {
    if (!map || !markerLayer) return;
    markerLayer.clearLayers();
    markerRefs = {};
    const prospectsToDisplay = currentProspects.value;

    prospectsToDisplay.forEach(prospect => {
        if (!prospect.coords) return;
        const icon = L.divIcon({ html: getIconHtml(prospect), className: 'transition-transform duration-200' });
        const marker = L.marker(prospect.coords, { icon }).addTo(markerLayer!);
        marker.bindPopup(createPopupContent(prospect));
        markerRefs[prospect.id] = marker;

        marker.on('popupopen', (e) => {
            const button = e.popup.getElement()?.querySelector('.view-details-button');
            button?.addEventListener('click', () => {
                const prospectId = button.getAttribute('data-prospect-id');
                if (prospectId) {
                   const fullProspect = props.prospects.find(p => p.id === prospectId) || prospectsToDisplay.find(p => p.id === prospectId);
                   if (fullProspect) openProspectModal(fullProspect);
                }
            });
            nextTick(() => createIcons({ icons }));
        });
    });
    nextTick(() => createIcons({ icons }));
};

const toggleHeatmap = () => {
    if (!map) return;
    isHeatmapVisible.value = !isHeatmapVisible.value;

    if (isHeatmapVisible.value) {
        if (map.getSize().y === 0) {
            nextTick(() => toggleHeatmap());
            return;
        }
        const points = props.prospects
            .filter(p => p.type !== 'residential' && p.coords)
            .map(p => [p.coords[0], p.coords[1], 1]);
            
        if (!heatmapLayer) {
            heatmapLayer = (L as any).heatLayer(points, { radius: 25, blur: 15, maxZoom: 17 });
        } else {
            heatmapLayer.setLatLngs(points);
        }
        map.addLayer(heatmapLayer);
    } else if (heatmapLayer) {
        map.removeLayer(heatmapLayer);
    }
};


const clearDrawing = () => {
    if (drawnItems) drawnItems.clearLayers();
    drawnAreaGeoJSON.value = null;
    if (scanMethod.value === 'draw' && drawControl?._toolbars.draw) {
        drawControl._toolbars.draw._modes.polygon.handler.enable();
    }
};

const generateMockProspects = (bounds: any, polygonGeoJSON: any = null): Prospect[] => {
    const prospects: Prospect[] = [];
    const sw = bounds.getSouthWest();
    const ne = bounds.getNorthEast();
    for (let i = 0; i < 10; i++) {
        const lat = sw.lat + Math.random() * (ne.lat - sw.lat);
        const lng = sw.lng + Math.random() * (ne.lng - sw.lng);
        const conditionScore = parseFloat((Math.random() * 5 + 4.5).toFixed(1));
        prospects.push({
            id: `mock_${i}`, type: 'residential', coords: [lat, lng], name: `Mock Residence ${i}`,
            homeowner: 'Mock Homeowner', address: '123 Mockingbird Lane', courtType: 'Tennis',
            conditionScore, status: conditionScore > 7 ? 'good' : 'worn',
            aiSummary: 'This is a mock AI summary.'
        } as Prospect);
    }
    return prospects;
};

const executeScan = (bounds: L.LatLngBounds, geojson: any = null) => {
    scanStatus.value = 'scanning';
    residentialResults.value = [];
    markerLayer?.clearLayers();
    activeSidebarTab.value = 'results';
    setTimeout(() => {
        residentialResults.value = generateMockProspects(bounds, geojson);
        updateMarkers();
        scanStatus.value = 'complete';
    }, 2500);
};

const handleScan = () => executeScan(map!.getBounds());
const handleScanSelection = () => executeScan(L.geoJSON(drawnAreaGeoJSON.value).getBounds(), drawnAreaGeoJSON.value);

const handleGenerateEmail = async () => { 
    isGeneratingEmail.value = true;
    setTimeout(() => {
        generatedEmail.value = `Subject: Regarding your ${selectedProspect.value?.courtType} court...\n\nHello ${selectedProspect.value?.homeowner}, ...`;
        isGeneratingEmail.value = false;
    }, 1500);
};

onMounted(() => {
    nextTick(() => {
        if (mapContainerRef.value && !map) {
            map = L.map(mapContainerRef.value, { zoomControl: false }).setView([33.48, -112.0740], 11);
            L.control.zoom({ position: 'topright' }).addTo(map);
            L.tileLayer('https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}', { attribution: 'Tiles &copy; Esri' }).addTo(map);
            
            markerLayer = L.layerGroup().addTo(map);
            drawnItems = new L.FeatureGroup().addTo(map);
            
            drawControl = new (L.Control as any).Draw({
                draw: { polygon: { shapeOptions: { color: '#4f46e5' } }, polyline: false, rectangle: false, circle: false, marker: false, circlemarker: false },
                edit: { featureGroup: drawnItems }
            });

            map.on(L.Draw.Event.CREATED, (event: any) => {
                if (drawnItems) { drawnItems.clearLayers(); drawnItems.addLayer(event.layer); }
                drawnAreaGeoJSON.value = event.layer.toGeoJSON();
            });

            resizeObserver = new ResizeObserver(() => map?.invalidateSize({ debounceMoveend: true }));
            resizeObserver.observe(mapContainerRef.value);

            if (props.mode === 'commercial') {
                const types = new Set(props.prospects.filter(p => p.type !== 'residential').map(p => p.type));
                types.forEach(type => filters.value[type] = true);
            }
            
            updateMarkers();
            createIcons({ icons });
        }
    });
});

onUnmounted(() => {
    resizeObserver?.disconnect();
    if (map) { map.remove(); map = null; }
});

watch(() => props.prospects, updateMarkers, { deep: true, immediate: true });
watch(filters, updateMarkers, { deep: true });
watch(residentialResults, updateMarkers, {deep: true });
watch(activeSidebarTab, updateMarkers);
watch(highlightedProspectId, (newId, oldId) => {
    if (oldId && markerRefs[oldId]) markerRefs[oldId].getElement()?.classList.remove('map-marker-highlight');
    if (newId && markerRefs[newId]) markerRefs[newId].getElement()?.classList.add('map-marker-highlight');
});
watch(scanMethod, (newMethod) => {
    if (!map) return;
    if (newMethod === 'draw' && props.mode === 'residential') {
        map.addControl(drawControl);
        drawControl._toolbars.draw._modes.polygon.handler.enable();
    } else if (drawControl._map) {
        drawControl.remove();
    }
});
</script>

<template>
  <div class="relative h-full w-full flex-1 flex">
    <div class="relative flex-1 flex flex-col min-h-0">
        <div ref="mapContainerRef" class="flex-1 w-full h-full"></div>
        <div v-if="mode === 'residential' && scanStatus === 'scanning'" class="absolute inset-0 radar-grid z-[440] pointer-events-none"></div>
        <div v-if="mode === 'residential' && scanStatus === 'scanning'" class="absolute inset-0 radar-scanner pointer-events-none"></div>
    </div>
    
    <div class="absolute top-4 left-4 z-[500] bg-white p-3 rounded-lg shadow-lg">
      <h3 class="font-bold mb-2 text-slate-800">{{ mode === 'residential' ? 'Radar Controls' : 'Map Filters' }}</h3>
      <div v-if="mode === 'residential'" class="flex items-center gap-2">
         <div class="bg-white rounded-lg shadow-sm flex p-1 border">
              <button @click="scanMethod = 'view'" :class="['p-2 rounded', scanMethod === 'view' ? 'bg-indigo-100 text-indigo-600' : 'text-slate-500 hover:bg-slate-100']" title="Scan Map View"><i data-lucide="scan-search" class="w-5 h-5"></i></button>
              <button @click="scanMethod = 'draw'" :class="['p-2 rounded', scanMethod === 'draw' ? 'bg-indigo-100 text-indigo-600' : 'text-slate-500 hover:bg-slate-100']" title="Draw Area"><i data-lucide="edit-3" class="w-5 h-5"></i></button>
          </div>
         <PrimaryButton :label="scanButtonLabel" icon="radar" :is-loading="scanStatus === 'scanning'" :disabled="isScanButtonDisabled" @click="scanMethod === 'view' ? handleScan() : handleScanSelection()" />
          <button v-if="drawnAreaGeoJSON" @click="clearDrawing" title="Clear Selection" class="p-2 bg-white text-slate-700 font-semibold border border-slate-300 rounded-lg shadow-sm hover:bg-red-50 hover:text-red-600"><i data-lucide="x" class="w-5 h-5"></i></button>
      </div>
      <div v-else class="space-y-2">
        <div v-for="type in Object.keys(filters)" :key="type" class="flex items-center">
            <input :id="`filter-${type}`" v-model="filters[type]" type="checkbox" class="h-4 w-4 rounded border-gray-300 text-indigo-600 focus:ring-indigo-500">
            <label :for="`filter-${type}`" class="ml-2 text-sm text-gray-700 capitalize">{{ type.replace(/_/g, ' ') }}</label>
        </div>
        <button @click="toggleHeatmap" class="mt-2 text-sm text-indigo-600 font-semibold hover:underline">{{ isHeatmapVisible ? 'Hide Heatmap' : 'Show Heatmap' }}</button>
      </div>
    </div>
    
    <div class="absolute bottom-4 left-4 z-[500] bg-white p-3 rounded-lg shadow-lg">
      <h3 class="font-bold mb-2 text-slate-800">Legend</h3>
      <div class="space-y-2">
        <div v-for="item in legendItems" :key="item.label" class="flex items-center">
          <div v-html="`<div class='icon-base ${item.class}'><i data-lucide='${item.icon}' class='w-4 h-4'></i></div>`" class="mr-2"></div>
          <span class="text-sm text-slate-700">{{ item.label }}</span>
        </div>
      </div>
    </div>

    <aside class="w-96 bg-white border-l border-slate-200 flex-col flex-shrink-0 hidden md:flex">
        <div class="p-4 border-b border-slate-200 flex-shrink-0">
            <h3 class="text-xl font-bold text-slate-800">{{ mode === 'residential' ? 'Prospecting' : 'Map Data' }}</h3>
            <div v-if="mode === 'residential'" class="mt-2 border-b border-slate-200">
                <nav class="-mb-px flex space-x-4">
                    <button @click="activeSidebarTab = 'results'" :class="['px-3 py-2 font-medium text-sm', activeSidebarTab === 'results' ? 'border-b-2 border-indigo-500 text-indigo-600' : 'border-transparent text-slate-500 hover:text-slate-700']">Scan Results <span v-if="residentialResults.length > 0" class="ml-1 px-2 py-0.5 bg-indigo-100 text-indigo-600 rounded-full text-xs">{{ residentialResults.length }}</span></button>
                    <button @click="activeSidebarTab = 'saved'" :class="['px-3 py-2 font-medium text-sm', activeSidebarTab === 'saved' ? 'border-b-2 border-indigo-500 text-indigo-600' : 'border-transparent text-slate-500 hover:text-slate-700']">Saved <span v-if="savedProspects.length > 0" class="ml-1 px-2 py-0.5 bg-slate-200 text-slate-600 rounded-full text-xs">{{ savedProspects.length }}</span></button>
                </nav>
            </div>
        </div>
        <div class="flex-1 overflow-y-auto min-h-0">
            <ul class="divide-y divide-slate-200">
                <li v-for="prospect in currentProspects" :key="prospect.id" @mouseenter="onListItemEnter(prospect.id)" @mouseleave="onListItemLeave" :class="{'bg-indigo-50': prospect.id === highlightedProspectId}" class="p-4 hover:bg-slate-50 cursor-pointer">
                    <div @click="openProspectModal(prospect)">
                        <p class="font-bold text-slate-800">{{ prospect.name || prospect.homeowner }}</p>
                        <p class="text-sm text-slate-600">{{ prospect.address || prospect.type.replace(/_/g, ' ') }}</p>
                    </div>
                </li>
            </ul>
        </div>
    </aside>
    
    <div v-if="isModalOpen && selectedProspect" class="fixed inset-0 bg-black bg-opacity-50 z-[1001] flex items-center justify-center p-4" @click="isModalOpen = false">
      <div @click.stop class="bg-white rounded-lg shadow-xl w-full max-w-lg max-h-[90vh] flex flex-col">
          <header class="p-4 border-b flex justify-between items-center">
              <h2 class="text-lg font-bold">{{ selectedProspect.name || selectedProspect.homeowner }}</h2>
              <button @click="isModalOpen = false" class="p-1"><i data-lucide="x"></i></button>
          </header>
          <div class="p-4 overflow-y-auto space-y-4">
              <p class="italic">{{ selectedProspect.aiSummary }}</p>
              <div v-if="isSaved(selectedProspect.id)">
                  <hr/>
                  <div>
                      <label for="status-select" class="block text-sm font-medium text-gray-700">Status</label>
                      <select id="status-select" v-model="selectedProspect.status" @change="handleSaveProspectUpdates" class="mt-1 block w-full pl-3 pr-10 py-2 text-base border-gray-300 focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm rounded-md">
                          <option>New</option><option>Contacted</option><option>Proposal Sent</option><option>Not Interested</option>
                      </select>
                  </div>
                  <div>
                      <label for="notes" class="block text-sm font-medium text-gray-700">Notes</label>
                      <textarea id="notes" v-model="selectedProspect.notes" @blur="handleSaveProspectUpdates" rows="3" class="mt-1 shadow-sm focus:ring-indigo-500 focus:border-indigo-500 block w-full sm:text-sm border border-gray-300 rounded-md"></textarea>
                  </div>
                  <PrimaryButton
                      :label="isGeneratingEmail ? 'Generating...' : 'Generate Outreach Email'"
                      icon="sparkles" :is-loading="isGeneratingEmail" @click="handleGenerateEmail"
                  />
                  <div v-if="generatedEmail" class="mt-2 p-2 bg-gray-100 rounded-md text-sm whitespace-pre-wrap" v-html="generatedEmail"></div>
              </div>
          </div>
          <footer class="p-4 border-t flex justify-between">
              <button v-if="isSaved(selectedProspect.id)" @click="removeProspectFromList(selectedProspect.id)" class="text-red-600 hover:underline">Remove</button>
              <PrimaryButton v-else @click="saveProspect(selectedProspect)" label="Save Prospect" icon="save"/>
              <button @click="isModalOpen = false" class="px-4 py-2 bg-gray-200 rounded-md">Close</button>
          </footer>
      </div>
    </div>
  </div>
</template>


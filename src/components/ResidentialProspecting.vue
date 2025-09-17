<script setup lang="ts">
import { ref, onMounted, onUnmounted, nextTick, computed, watch } from 'vue';
import { View } from '@/types';
import PrimaryButton from '@/components/PrimaryButton.vue';
import L from 'leaflet';
import 'leaflet-draw';
import { createIcons, icons } from 'lucide';

const props = defineProps<{
  prospects: any[];
}>();

const emit = defineEmits(['setCurrentView', 'addProspect', 'removeProspect', 'updateProspect']);

// --- Types ---
type ProspectStatus = 'New' | 'Contacted' | 'Proposal Sent' | 'Not Interested';
type ScanStatus = 'idle' | 'scanning' | 'complete';
type ScanMethod = 'view' | 'draw';

interface Prospect {
  id: string;
  type: 'residential';
  coords: [number, number];
  name: string;
  homeowner: string;
  address: string;
  courtType: string;
  conditionScore: number;
  status: ProspectStatus | 'good' | 'worn'; // Expanded to handle mock data status
  aiSummary: string;
  notes?: string;
}

// Mock data generation functions
const FIRST_NAMES = ['John', 'Jane', 'Robert', 'Emily', 'Michael', 'Sarah', 'David', 'Jessica'];
const LAST_NAMES = ['Smith', 'Johnson', 'Williams', 'Brown', 'Jones', 'Garcia', 'Miller', 'Davis'];
const STREET_NAMES = ['Ocotillo', 'Mesquite', 'Palo Verde', 'Saguaro', 'Cholla', 'Ironwood', 'Acacia', 'Canyon'];
const STREET_TYPES = ['Rd', 'Ln', 'Dr', 'Ct', 'Ave', 'Way'];
const COURT_TYPES = ['Tennis', 'Pickleball', 'Basketball'];

// Point-in-polygon check
const isPointInPolygon = (point: [number, number], vs: [number, number][]) => {
    const x = point[0], y = point[1];
    let inside = false;
    for (let i = 0, j = vs.length - 1; i < vs.length; j = i++) {
        const xi = vs[i][0], yi = vs[i][1];
        const xj = vs[j][0], yj = vs[j][1];
        const intersect = ((yi > y) !== (yj > y))
            && (x < (xj - xi) * (y - yi) / (yj - yi) + xi);
        if (intersect) inside = !inside;
    }
    return inside;
};

// Generate mock prospects
const generateMockProspects = (bounds: any, polygonGeoJSON: any = null): Prospect[] => {
    const numResults = Math.floor(Math.random() * 8) + 5;
    const prospects: Prospect[] = [];
    const sw = bounds.getSouthWest();
    const ne = bounds.getNorthEast();
    const latRange = ne.lat - sw.lat;
    const lngRange = ne.lng - sw.lng;
    const polygonVertices = polygonGeoJSON ? polygonGeoJSON.geometry.coordinates[0] : null;

    for (let i = 0; i < numResults; i++) {
        let lat, lng;
        let pointInPolygon = !polygonVertices;
        if (polygonVertices) {
            let attempts = 0;
            while (!pointInPolygon && attempts < 100) {
                lat = sw.lat + Math.random() * latRange;
                lng = sw.lng + Math.random() * lngRange;
                if (isPointInPolygon([lng, lat], polygonVertices)) {
                    pointInPolygon = true;
                }
                attempts++;
            }
        } else {
            lat = sw.lat + Math.random() * latRange;
            lng = sw.lng + Math.random() * lngRange;
        }

        if (pointInPolygon) {
            const lastName = LAST_NAMES[Math.floor(Math.random() * LAST_NAMES.length)];
            const streetName = STREET_NAMES[Math.floor(Math.random() * STREET_NAMES.length)];
            const streetType = STREET_TYPES[Math.floor(Math.random() * STREET_TYPES.length)];
            const courtType = COURT_TYPES[Math.floor(Math.random() * COURT_TYPES.length)];
            
            const conditionScore = parseFloat((Math.random() * 5 + 4.5).toFixed(1));
            const status = conditionScore > 7.0 ? 'good' : 'worn';
            const aiSummary = status === 'good'
                ? `Well-maintained ${courtType.toLowerCase()} court on a large property.`
                : `Visible wear and fading on the ${courtType.toLowerCase()} court surface. High potential for a resurfacing lead.`;

            prospects.push({
                id: (500 + i + Math.floor(Math.random() * 1000)).toString(), // Ensure ID is a string
                type: 'residential',
                coords: [lat, lng],
                name: `${lastName} Residence`,
                homeowner: `${FIRST_NAMES[Math.floor(Math.random() * FIRST_NAMES.length)]} ${lastName}`,
                address: `${Math.floor(Math.random() * 9000) + 1000} W ${streetName} ${streetType}, Paradise Valley, AZ`,
                courtType: courtType,
                conditionScore: conditionScore,
                status: status,
                aiSummary: aiSummary,
            });
        }
    }
    return prospects;
};


// --- Refs & State ---
const mapContainerRef = ref(null);
let map: L.Map | null = null;
let markerLayer: L.LayerGroup | null = null;
let drawnItems: L.FeatureGroup | null = null;
let drawControl: any = null;
let markerRefs: { [key: string]: L.Marker } = {};
let resizeObserver: ResizeObserver | null = null;

const scanStatus = ref<ScanStatus>('idle');
const results = ref<Prospect[]>([]);
const activeSidebarTab = ref('results');

const selectedProspect = ref<Prospect | null>(null);
const isModalOpen = ref(false);
const isGeneratingEmail = ref(false);
const generatedEmail = ref('');
const searchQuery = ref('');
const highlightedProspectId = ref<string | null>(null);

const drawnAreaGeoJSON = ref<any>(null);
const scanMethod = ref<ScanMethod>('view');
const isMobilePanelOpen = ref(false);

const savedResidentialProspects = computed(() => props.prospects.filter(p => p.type === 'residential'));

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

const handlePrimaryScan = () => {
    if (scanMethod.value === 'draw') {
        handleScanSelection();
    } else {
        handleScan();
    }
};

watch(scanMethod, (newMethod) => {
    if (!map) return;
    if (newMethod === 'draw' && drawControl) {
        map.addControl(drawControl);
        new (L.Draw as any).Polygon(map, drawControl.options.draw.polygon).enable();
    } else if (drawControl && drawControl._map) {
        drawControl.remove();
        clearDrawing();
    }
});

const isSaved = (prospectId: string) => {
    return props.prospects.some(p => p.id === prospectId);
};

const saveProspect = (prospectToSave: Prospect) => {
    if (!isSaved(prospectToSave.id)) {
        const prospectWithStatus = {
            ...prospectToSave,
            status: 'New' as ProspectStatus,
            notes: ''
        };
        emit('addProspect', prospectWithStatus);
    }
};

const removeProspectFromList = (prospectId: string) => {
    emit('removeProspect', prospectId);
    if(selectedProspect.value && selectedProspect.value.id === prospectId) {
        isModalOpen.value = false;
    }
};

const onListItemEnter = (prospectId: string) => {
    highlightedProspectId.value = prospectId;
};

const onListItemLeave = () => {
    highlightedProspectId.value = null;
};

watch(highlightedProspectId, (newId, oldId) => {
    const oldMarkerEl = oldId ? markerRefs[oldId]?.getElement() : undefined;
    if (oldMarkerEl) {
        L.DomUtil.removeClass(oldMarkerEl, 'map-marker-highlight');
    }

    const newMarkerEl = newId ? markerRefs[newId]?.getElement() : undefined;
    if (newMarkerEl) {
        L.DomUtil.addClass(newMarkerEl, 'map-marker-highlight');
    }
});

watch(isMobilePanelOpen, (isOpen) => {
    if(isOpen) {
        nextTick(() => createIcons({ icons }));
    }
});

const handleAddressSearch = () => {
    const query = searchQuery.value.toLowerCase().trim();
    if (!map) return;
    const targetCoords: [number, number] = query === '85253' ? [33.53, -111.95] : [33.4484, -112.0740];
    const targetZoom = query === '85253' ? 14 : 12;
    map.flyTo(targetCoords, targetZoom);
    searchQuery.value = '';
};

const clearDrawing = () => {
    if (drawnItems) drawnItems.clearLayers();
    drawnAreaGeoJSON.value = null;
    if (scanMethod.value === 'draw' && drawControl?._map && map) {
        new (L.Draw as any).Polygon(map, drawControl.options.draw.polygon).enable();
    }
};

const executeScan = (bounds: L.LatLngBounds, geojson: any = null) => {
    const currentMap = map;
    if (!currentMap) return;
    scanStatus.value = 'scanning';
    results.value = [];
    markerRefs = {};
    markerLayer?.clearLayers();
    activeSidebarTab.value = 'results';

    const scanDuration = 5000;
    const newProspects = generateMockProspects(bounds, geojson);
    const centerPoint = currentMap.latLngToContainerPoint(currentMap.getCenter());

    const prospectsWithAngles = newProspects.map(prospect => {
        const prospectPoint = currentMap.latLngToContainerPoint(prospect.coords);
        const dx = prospectPoint.x - centerPoint.x;
        const dy = prospectPoint.y - centerPoint.y;
        return { ...prospect, angle: (Math.atan2(dy, dx) * (180 / Math.PI) + 450) % 360 };
    }).sort((a, b) => a.angle - b.angle);

    prospectsWithAngles.forEach((prospect) => {
        const revealDelay = (prospect.angle / 360) * scanDuration;
        setTimeout(() => {
            results.value.push(prospect);
            nextTick(() => {
                const iconClass = `icon-base map-marker-ping icon-residential-${prospect.status}`;
                const icon = L.divIcon({ 
                    className: iconClass,
                    html: `<i data-lucide="home" class="w-5 h-5" stroke-width="2"></i>`, 
                    iconSize: [32, 32], iconAnchor: [16, 16]
                });
                const marker = L.marker(prospect.coords, { icon: icon });
                
                if (markerLayer) markerLayer.addLayer(marker);

                markerRefs[prospect.id] = marker;
                marker.on('click', () => openProspectModal(prospect));
                marker.on('mouseover', () => highlightedProspectId.value = prospect.id);
                marker.on('mouseout', () => highlightedProspectId.value = null);
                
                const listEl = document.querySelector(`li[data-prospect-id='${prospect.id}']`);
                if (listEl) {
                    listEl.classList.remove('opacity-0');
                    listEl.classList.add('animate-fade-in');
                }
                createIcons({ icons });
            });
        }, revealDelay);
    });

    setTimeout(() => {
        scanStatus.value = 'complete';
    }, scanDuration + 200);
};

const handleScan = () => {
    if (!map || scanStatus.value === 'scanning') return;
    map.invalidateSize();
    const bounds = map.getBounds();
    if (!bounds?.isValid() || bounds.getSouthWest().equals(bounds.getNorthEast())) {
        // Use a modal-like UI instead of alert()
        alert("Could not determine map area. Please pan the map slightly and try again.");
        return;
    }
    executeScan(bounds);
};

const handleScanSelection = () => {
    if (!map || scanStatus.value === 'scanning' || !drawnAreaGeoJSON.value) return;
    const layer = L.geoJSON(drawnAreaGeoJSON.value);
    executeScan(layer.getBounds(), drawnAreaGeoJSON.value);
};

const openProspectModal = (prospect: Prospect) => {
    const savedVersion = props.prospects.find(p => p.id === prospect.id);
    selectedProspect.value = savedVersion || prospect;
    isModalOpen.value = true;
    generatedEmail.value = '';
};

const handleGenerateEmail = async () => {
    if (!selectedProspect.value) return;
    isGeneratingEmail.value = true;
    generatedEmail.value = '';
    const prospect = selectedProspect.value;
    console.log("Simulating secure API call to backend for:", prospect);
    setTimeout(() => {
        const mockEmail = `Subject: Regarding Your Property's ${prospect.courtType} Court at ${prospect.address}\n\nDear ${prospect.homeowner},\n\nI hope this email finds you well. My name is Mike, and I represent Elite Sports Builders, a leading local specialist in the installation and resurfacing of high-quality sports courts.\n\nWhile reviewing properties in your area, I noticed your beautiful ${prospect.courtType} court. Based on an initial visual assessment, it appears there may be some opportunities for surface rejuvenation to restore its original color and optimal playing condition.\n\nWe would be happy to provide a complimentary, no-obligation consultation to assess its condition and discuss potential resurfacing options that can protect your investment for years to come. Would you be available for a brief chat sometime next week?\n\nBest regards,\nMike Woelfel\nElite Sports Builders`;
        generatedEmail.value = mockEmail.replace(/\n/g, '<br>');
        isGeneratingEmail.value = false;
    }, 1500);
};

const getStatusClass = (status: string) => `status-${status.replace(' Sent', '').replace(' ', '-')}`;

const handleSaveProspectUpdates = () => {
  if (selectedProspect.value) {
    emit('updateProspect', selectedProspect.value);
  }
};

const showMyLocation = () => {
  const currentMap = map;
  if (navigator.geolocation && currentMap) {
    navigator.geolocation.getCurrentPosition(
      (position) => {
        const { latitude, longitude } = position.coords;
        const userLatLng = L.latLng(latitude, longitude);
        currentMap.flyTo(userLatLng, 16);
        L.marker(userLatLng).addTo(currentMap).bindPopup("<b>Your Location</b>").openPopup();
      },
      (error) => {
        console.error("Error getting user location:", error.message);
        // Use a modal-like UI instead of alert()
        alert("Could not retrieve your location.");
      }
    );
  }
};

onMounted(() => {
    if (mapContainerRef.value && !map) {
        map = L.map(mapContainerRef.value, { zoomControl: false }).setView([33.6, -111.95], 13);
        L.control.zoom({ position: 'topright' }).addTo(map);

        const satelliteLayer = L.tileLayer('https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}', {
            attribution: 'Tiles &copy; Esri',
            maxZoom: 19
        });
        const streetLayer = L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
            attribution: '&copy; OpenStreetMap contributors'
        });
        
        const baseMaps = { "Satellite": satelliteLayer, "Street": streetLayer };
        satelliteLayer.addTo(map);
        L.control.layers(baseMaps, undefined, { position: 'topright' }).addTo(map);

        markerLayer = L.layerGroup().addTo(map);
        drawnItems = new L.FeatureGroup().addTo(map);

        drawControl = new (L.Control as any).Draw({
            draw: { polygon: { shapeOptions: { color: '#4f46e5' } }, polyline: false, rectangle: false, circle: false, marker: false, circlemarker: false },
            edit: { featureGroup: drawnItems, remove: false, edit: false }
        });

        map.on(L.Draw.Event.CREATED, (event: any) => {
            if (drawnItems) {
                drawnItems.clearLayers();
                drawnItems.addLayer(event.layer);
            }
            drawnAreaGeoJSON.value = event.layer.toGeoJSON();
        });

        resizeObserver = new ResizeObserver(() => map?.invalidateSize({ debounceMoveend: true }));
        resizeObserver.observe(mapContainerRef.value);

        nextTick(() => {
            createIcons({ icons });
        });
    }
});

onUnmounted(() => {
    resizeObserver?.disconnect();
    if (map) {
        map.remove();
        map = null;
    }
});

</script>

<template>
    <main class="relative flex h-full w-full flex-col md:flex-row overflow-hidden">
        <!-- Map Section -->
        <div class="relative flex-1 flex flex-col min-h-0">
            <div ref="mapContainerRef" class="flex-1 w-full h-full"></div>

            <div v-if="scanStatus === 'scanning'" class="absolute inset-0 radar-grid z-[440]"></div>
            <div v-if="scanStatus === 'scanning'" class="absolute inset-0 bg-black bg-opacity-25 z-[450] pointer-events-none"></div>
            <div v-if="scanStatus === 'scanning'" class="radar-scanner"></div>
            
            <div v-if="scanMethod === 'draw' && !drawnAreaGeoJSON && scanStatus === 'idle'" class="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 z-[1000] bg-white p-4 rounded-lg shadow-2xl text-center">
                <p class="font-bold">Draw a custom scan area</p>
                <p class="text-sm">Click points on the map to create a polygon. Click the first point to finish.</p>
            </div>

             <!-- Top-Right Controls -->
            <div class="absolute top-4 right-4 z-[500] flex items-center gap-2">
                 <button
                    @click="showMyLocation"
                    class="p-3 bg-white border border-slate-300 rounded-lg shadow-lg hover:bg-slate-50"
                    aria-label="Show my location"
                    title="Show my location"
                >
                    <i data-lucide="locate-fixed" class="w-5 h-5 text-slate-600"></i>
                </button>
                <div class="flex items-center">
                    <input 
                        type="text" 
                        v-model="searchQuery"
                        @keyup.enter="handleAddressSearch"
                        placeholder="Search Zip or City..." 
                        class="px-3 py-2 bg-white border border-slate-300 rounded-l-lg shadow-lg focus:outline-none focus:ring-2 focus:ring-indigo-500 w-48"
                    />
                    <button @click="handleAddressSearch" class="p-2 bg-white border-t border-r border-b border-slate-300 rounded-r-lg shadow-lg hover:bg-slate-50">
                        <i data-lucide="search" class="w-5 h-5 text-slate-600"></i>
                    </button>
                </div>
            </div>

            <div class="absolute top-4 left-4 z-[500] flex items-center gap-2">
                <div class="bg-white rounded-lg shadow-lg flex p-1">
                    <button @click="scanMethod = 'view'" :class="['p-2 rounded transition-colors', scanMethod === 'view' ? 'bg-indigo-100 text-indigo-600' : 'text-slate-500 hover:bg-slate-100']" title="Scan Map View">
                        <i data-lucide="scan-search" class="w-5 h-5"></i>
                    </button>
                    <button @click="scanMethod = 'draw'" :class="['p-2 rounded transition-colors', scanMethod === 'draw' ? 'bg-indigo-100 text-indigo-600' : 'text-slate-500 hover:bg-slate-100']" title="Draw Custom Area">
                        <i data-lucide="edit-3" class="w-5 h-5"></i>
                    </button>
                </div>
                <PrimaryButton 
                    :label="scanButtonLabel"
                    icon="radar"
                    :is-loading="scanStatus === 'scanning'"
                    :disabled="isScanButtonDisabled"
                    @click="handlePrimaryScan"
                    class="px-5 py-3"
                />
                <button v-if="drawnAreaGeoJSON" @click="clearDrawing" title="Clear Selection" class="px-3 py-3 bg-white text-slate-700 font-semibold border border-slate-300 rounded-lg shadow-lg hover:bg-red-50 hover:text-red-600 transition-colors">
                    <i data-lucide="x" class="w-5 h-5"></i>
                </button>
            </div>
            
             <!-- Legend -->
            <div v-if="scanStatus === 'complete' && results.length > 0" class="absolute bottom-4 left-4 z-[1000] bg-white p-3 rounded-lg shadow-lg">
                <h3 class="font-bold mb-2 text-sm text-slate-800">Scan Legend</h3>
                <div class="space-y-2">
                    <div class="flex items-center">
                    <div class="icon-base icon-residential-good w-8 h-8 flex items-center justify-center rounded-full mr-2">
                        <i data-lucide="home" class="w-4 h-4 text-white"></i>
                    </div>
                    <span class="text-slate-700 text-xs">Good Condition</span>
                    </div>
                    <div class="flex items-center">
                    <div class="icon-base icon-residential-worn w-8 h-8 flex items-center justify-center rounded-full mr-2">
                        <i data-lucide="home" class="w-4 h-4 text-white"></i>
                    </div>
                    <span class="text-slate-700 text-xs">Worn Condition</span>
                    </div>
                </div>
            </div>

            <!-- Mobile FAB -->
            <div class="md:hidden absolute bottom-4 right-4 z-[500]">
                <button v-if="scanStatus === 'complete' && results.length > 0" @click="isMobilePanelOpen = true" class="relative bg-indigo-600 text-white w-14 h-14 rounded-full shadow-lg flex items-center justify-center hover:bg-indigo-700 active:bg-indigo-800 transition-colors">
                    <i data-lucide="list" class="w-6 h-6"></i>
                    <span class="absolute -top-1 -right-1 bg-red-500 text-white text-xs font-bold rounded-full px-1.5 py-0.5">{{ results.length }}</span>
                </button>
            </div>
        </div>

        <!-- Desktop Sidebar Section -->
        <aside class="hidden md:w-96 md:flex bg-white border-l border-slate-200 flex-col flex-shrink-0">
            <div class="p-4 border-b border-slate-200 flex-shrink-0">
                <h3 class="text-xl font-bold text-slate-800">Prospecting</h3>
                <div class="mt-2 border-b border-slate-200">
                    <nav class="-mb-px flex space-x-4" aria-label="Tabs">
                        <button @click="activeSidebarTab = 'results'" :class="['px-3 py-2 font-medium text-sm rounded-t-md border-b-2', activeSidebarTab === 'results' ? 'border-indigo-500 text-indigo-600' : 'border-transparent text-slate-500 hover:text-slate-700']">
                            Scan Results 
                            <span v-if="results.length > 0" class="ml-1 px-2 py-0.5 bg-indigo-100 text-indigo-600 rounded-full text-xs">{{ results.length }}</span>
                        </button>
                        <button @click="activeSidebarTab = 'saved'" :class="['px-3 py-2 font-medium text-sm rounded-t-md border-b-2', activeSidebarTab === 'saved' ? 'border-indigo-500 text-indigo-600' : 'border-transparent text-slate-500 hover:text-slate-700']">
                            Saved Prospects 
                            <span v-if="savedResidentialProspects.length > 0" class="ml-1 px-2 py-0.5 bg-slate-200 text-slate-600 rounded-full text-xs">{{ savedResidentialProspects.length }}</span>
                        </button>
                    </nav>
                </div>
            </div>
            
            <div class="flex-1 overflow-y-auto min-h-0">
                <div v-if="activeSidebarTab === 'results'">
                    <div v-if="scanStatus === 'idle'" class="flex flex-col items-center justify-center text-center p-6 text-slate-500 h-full">
                        <i data-lucide="mouse-pointer-square" class="w-16 h-16 text-slate-400"></i>
                        <p class="mt-4 font-semibold">Navigate or Select an Area</p>
                        <p>Pan the map and click "Scan", or select a custom area to begin prospecting.</p>
                    </div>
                    
                    <div v-if="scanStatus === 'scanning'" class="p-4 space-y-2">
                        <div v-for="i in 8" :key="i" class="p-4 group">
                            <div class="flex justify-between items-start">
                               <div class="flex-1">
                                    <div class="h-5 w-3/4 bg-slate-200 rounded shimmer-wrapper"></div>
                                    <div class="h-4 w-full bg-slate-200 rounded mt-2 shimmer-wrapper"></div>
                                </div>
                                 <div class="flex flex-col items-end ml-4">
                                    <div class="h-6 w-16 bg-slate-200 rounded-full shimmer-wrapper"></div>
                                </div>
                            </div>
                        </div>
                    </div>

                    <ul v-if="scanStatus === 'complete'" class="divide-y divide-slate-200">
                        <li v-for="prospect in results" :key="prospect.id" :data-prospect-id="prospect.id" @mouseenter="onListItemEnter(prospect.id)" @mouseleave="onListItemLeave" :class="{'bg-indigo-50 ring-1 ring-indigo-200': prospect.id === highlightedProspectId}" class="p-4 group cursor-pointer transition-all duration-150 rounded-l-lg">
                            <div class="flex justify-between items-start">
                                <div @click="openProspectModal(prospect)" class="flex-1">
                                    <p class="font-bold text-slate-800">{{ prospect.homeowner }}</p>
                                    <p class="text-sm text-slate-600">{{ prospect.address }}</p>
                                    <div class="mt-2 flex items-center gap-4 text-xs"><span class="font-semibold text-cyan-800 bg-cyan-100 px-2 py-1 rounded-full">{{ prospect.courtType }}</span><span :class="['font-semibold px-2 py-1 rounded-full', prospect.status === 'good' ? 'bg-green-100 text-green-800' : 'bg-amber-100 text-amber-800']">Score: {{ prospect.conditionScore }}</span></div>
                                    <p class="text-xs text-slate-500 mt-2 italic truncate">{{ prospect.aiSummary }}</p>
                                </div>
                                <div class="flex flex-col items-end">
                                    <button v-if="!isSaved(prospect.id)" @click.stop="saveProspect(prospect)" class="text-slate-400 hover:text-indigo-600 p-1 mt-2 invisible group-hover:visible"><i data-lucide="bookmark-plus" class="w-5 h-5"></i></button>
                                    <span v-else class="text-green-500 p-1 mt-2 flex items-center text-xs font-semibold"><i data-lucide="check-circle-2" class="w-5 h-5"></i></span>
                                </div>
                            </div>
                        </li>
                    </ul>
                </div>
                
                <div v-if="activeSidebarTab === 'saved'">
                     <ul v-if="savedResidentialProspects.length > 0" class="divide-y divide-slate-200">
                        <li v-for="prospect in savedResidentialProspects" :key="prospect.id" :data-prospect-id="prospect.id" @mouseenter="onListItemEnter(prospect.id)" @mouseleave="onListItemLeave" :class="{'bg-indigo-50 ring-1 ring-indigo-200': prospect.id === highlightedProspectId}" class="p-4 group cursor-pointer transition-all duration-150 rounded-l-lg">
                            <div class="flex justify-between items-start">
                                 <div @click="openProspectModal(prospect)" class="flex-1">
                                    <div class="flex items-center justify-between"><p class="font-bold text-slate-800">{{ prospect.homeowner }}</p><span :class="['status-pill', getStatusClass(prospect.status)]">{{ prospect.status }}</span></div>
                                    <p class="text-sm text-slate-600">{{ prospect.address }}</p>
                                </div>
                                <div class="flex flex-col items-end ml-4"><span class="text-xs font-semibold text-cyan-800 bg-cyan-100 px-2 py-1 rounded-full">{{ prospect.courtType }}</span></div>
                            </div>
                        </li>
                    </ul>
                    <div v-else class="flex flex-col items-center justify-center text-center p-6 text-slate-500 h-full">
                        <i data-lucide="bookmark-minus" class="w-16 h-16 text-slate-400"></i>
                        <p class="mt-4 font-semibold">No Saved Prospects</p><p>Save prospects from a scan to build your lead list.</p>
                    </div>
                </div>
            </div>
        </aside>

        <!-- Mobile Panel (Bottom Sheet) -->
        <div v-if="isMobilePanelOpen" class="md:hidden fixed inset-0 bg-black bg-opacity-50 z-[1100]" @click="isMobilePanelOpen = false"></div>
        <div v-if="isMobilePanelOpen" 
             class="md:hidden fixed bottom-0 left-0 right-0 bg-white rounded-t-2xl shadow-2xl z-[1200] max-h-[75vh] flex flex-col" 
             style="animation: slide-in-up 0.3s ease-out;">
            <div class="p-4 border-b border-slate-200 flex-shrink-0 flex justify-between items-center">
                <h3 class="text-xl font-bold text-slate-800">Prospecting</h3>
                <button @click="isMobilePanelOpen = false" class="p-1 text-slate-500 hover:text-slate-800 rounded-full hover:bg-slate-100">
                    <i data-lucide="x" class="w-6 h-6"></i>
                </button>
            </div>
            <div class="border-b border-slate-200 px-4">
                <nav class="-mb-px flex space-x-4" aria-label="Tabs">
                    <button @click="activeSidebarTab = 'results'" :class="['px-3 py-2 font-medium text-sm rounded-t-md border-b-2', activeSidebarTab === 'results' ? 'border-indigo-500 text-indigo-600' : 'border-transparent text-slate-500 hover:text-slate-700']">
                        Scan Results <span v-if="results.length > 0" class="ml-1 px-2 py-0.5 bg-indigo-100 text-indigo-600 rounded-full text-xs">{{ results.length }}</span>
                    </button>
                    <button @click="activeSidebarTab = 'saved'" :class="['px-3 py-2 font-medium text-sm rounded-t-md border-b-2', activeSidebarTab === 'saved' ? 'border-indigo-500 text-indigo-600' : 'border-transparent text-slate-500 hover:text-slate-700']">
                        Saved <span v-if="savedResidentialProspects.length > 0" class="ml-1 px-2 py-0.5 bg-slate-200 text-slate-600 rounded-full text-xs">{{ savedResidentialProspects.length }}</span>
                    </button>
                </nav>
            </div>
             <div class="flex-1 overflow-y-auto min-h-0">
                <!-- Content copied from desktop sidebar -->
                <div v-if="activeSidebarTab === 'results'">
                    <ul v-if="scanStatus === 'complete'" class="divide-y divide-slate-200">
                        <li v-for="prospect in results" :key="prospect.id" :data-prospect-id="prospect.id" @click="openProspectModal(prospect)" class="p-4 group cursor-pointer">
                            <div class="flex justify-between items-start">
                                <div class="flex-1">
                                    <p class="font-bold text-slate-800">{{ prospect.homeowner }}</p>
                                    <p class="text-sm text-slate-600">{{ prospect.address }}</p>
                                    <div class="mt-2 flex items-center gap-4 text-xs"><span class="font-semibold text-cyan-800 bg-cyan-100 px-2 py-1 rounded-full">{{ prospect.courtType }}</span><span :class="['font-semibold px-2 py-1 rounded-full', prospect.status === 'good' ? 'bg-green-100 text-green-800' : 'bg-amber-100 text-amber-800']">Score: {{ prospect.conditionScore }}</span></div>
                                    <p class="text-xs text-slate-500 mt-2 italic truncate">{{ prospect.aiSummary }}</p>
                                </div>
                                <div class="flex flex-col items-end">
                                    <button v-if="!isSaved(prospect.id)" @click.stop="saveProspect(prospect)" class="text-slate-400 hover:text-indigo-600 p-1 mt-2"><i data-lucide="bookmark-plus" class="w-5 h-5"></i></button>
                                    <span v-else class="text-green-500 p-1 mt-2 flex items-center text-xs font-semibold"><i data-lucide="check-circle-2" class="w-5 h-5"></i></span>
                                </div>
                            </div>
                        </li>
                    </ul>
                </div>
                <div v-if="activeSidebarTab === 'saved'">
                     <ul v-if="savedResidentialProspects.length > 0" class="divide-y divide-slate-200">
                        <li v-for="prospect in savedResidentialProspects" :key="prospect.id" :data-prospect-id="prospect.id" @click="openProspectModal(prospect)" class="p-4 group cursor-pointer">
                            <div class="flex justify-between items-start">
                                 <div class="flex-1">
                                    <div class="flex items-center justify-between"><p class="font-bold text-slate-800">{{ prospect.homeowner }}</p><span :class="['status-pill', getStatusClass(prospect.status)]">{{ prospect.status }}</span></div>
                                    <p class="text-sm text-slate-600">{{ prospect.address }}</p>
                                </div>
                                <div class="flex flex-col items-end ml-4"><span class="text-xs font-semibold text-cyan-800 bg-cyan-100 px-2 py-1 rounded-full">{{ prospect.courtType }}</span></div>
                            </div>
                        </li>
                    </ul>
                </div>
            </div>
        </div>

        <!-- Prospect Detail Modal -->
        <div v-if="isModalOpen" class="fixed inset-0 bg-black bg-opacity-60 z-[1000] flex items-center justify-center p-4" @click="isModalOpen = false">
            <div @click.stop class="bg-white rounded-lg shadow-2xl w-full max-w-2xl max-h-[90vh] flex flex-col animate-fade-in-up" v-if="selectedProspect">
                <header class="p-4 border-b flex justify-between items-center flex-shrink-0">
                    <div>
                        <h2 class="text-lg font-bold text-slate-800">{{ selectedProspect.homeowner }}</h2>
                        <p class="text-sm text-slate-500">{{ selectedProspect.address }}</p>
                    </div>
                    <button @click="isModalOpen = false" class="text-slate-500 hover:text-slate-800 p-1 rounded-full"><i data-lucide="x" class="w-6 h-6"></i></button>
                </header>

                <div class="p-6 flex-1 overflow-y-auto space-y-4">
                    <!-- Prospect Details -->
                    <div class="grid grid-cols-3 gap-4 text-sm">
                        <div class="bg-slate-50 p-3 rounded-lg text-center">
                            <p class="text-xs font-semibold text-slate-500 uppercase">Court Type</p>
                            <p class="font-bold text-slate-800 text-base">{{ selectedProspect.courtType }}</p>
                        </div>
                        <div class="bg-slate-50 p-3 rounded-lg text-center">
                            <p class="text-xs font-semibold text-slate-500 uppercase">Condition</p>
                            <p class="font-bold text-base" :class="selectedProspect.status === 'good' ? 'text-green-600' : 'text-amber-600'">{{ selectedProspect.conditionScore }} / 10</p>
                        </div>
                        <div class="bg-slate-50 p-3 rounded-lg text-center">
                            <p class="text-xs font-semibold text-slate-500 uppercase">Status</p>
                            <span v-if="isSaved(selectedProspect.id)" :class="['status-pill', getStatusClass(selectedProspect.status)]">{{ selectedProspect.status }}</span>
                            <span v-else class="status-pill status-Not-Interested">Unsaved</span>
                        </div>
                    </div>

                    <div>
                        <p class="text-sm font-semibold text-slate-600">AI Summary</p>
                        <p class="text-sm text-slate-700 italic bg-slate-50 p-3 mt-1 rounded-lg border border-slate-200">{{ selectedProspect.aiSummary }}</p>
                    </div>

                    <!-- CRM Fields for Saved Prospects -->
                    <div v-if="isSaved(selectedProspect.id)">
                        <hr class="my-4">
                        <div class="space-y-4">
                            <div>
                                <label for="prospect-status" class="block text-sm font-medium text-slate-600">Lead Status</label>
                                <select id="prospect-status" v-model="selectedProspect.status" @change="handleSaveProspectUpdates" class="mt-1 block w-full px-3 py-2 bg-white border border-slate-300 rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm">
                                    <option>New</option>
                                    <option>Contacted</option>
                                    <option>Proposal Sent</option>
                                    <option>Not Interested</option>
                                </select>
                            </div>
                            <div>
                                <label for="prospect-notes" class="block text-sm font-medium text-slate-600">Notes</label>
                                <textarea id="prospect-notes" v-model="selectedProspect.notes" rows="3" @blur="handleSaveProspectUpdates" class="mt-1 block w-full px-3 py-2 bg-white border border-slate-300 rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm" placeholder="Log call notes, follow-up actions, etc."></textarea>
                            </div>
                        </div>
                    </div>
                    
                    <!-- AI Outreach Assistant -->
                    <div v-if="isSaved(selectedProspect.id)">
                         <hr class="my-4">
                         <div>
                            <h4 class="text-sm font-semibold text-slate-600 mb-2">AI Outreach Assistant</h4>
                             <PrimaryButton
                                :label="isGeneratingEmail ? 'Generating...' : 'Generate Outreach Email'"
                                icon="sparkles"
                                :is-loading="isGeneratingEmail"
                                @click="handleGenerateEmail"
                             />
                             <div v-if="generatedEmail" class="mt-3 p-3 bg-slate-50 border border-slate-200 rounded-lg text-sm text-slate-700 whitespace-pre-wrap" v-html="generatedEmail"></div>
                         </div>
                    </div>

                </div>

                <footer class="p-4 bg-slate-50 border-t flex justify-between items-center flex-shrink-0">
                    <div>
                        <button v-if="isSaved(selectedProspect.id)" @click="removeProspectFromList(selectedProspect.id)" class="text-sm font-semibold text-red-600 hover:text-red-800 flex items-center gap-2">
                            <i data-lucide="bookmark-minus" class="w-4 h-4"></i>Remove from Saved
                        </button>
                        <PrimaryButton v-else @click="saveProspect(selectedProspect)" label="Save Prospect" icon="bookmark-plus" />
                    </div>
                    <div class="flex items-center gap-2">
                        <button v-if="isSaved(selectedProspect.id)" @click="emit('setCurrentView', View.Reports, { prospectId: selectedProspect.id, reportTemplate: 'Residential Prospect Report' })" class="px-3 py-2 bg-white text-slate-700 font-semibold border border-slate-300 rounded-lg shadow-sm hover:bg-slate-50 text-sm flex items-center gap-2">
                            <i data-lucide="file-text" class="w-4 h-4"></i>
                            Report
                        </button>
                        <button @click="isModalOpen = false" class="px-4 py-2 bg-slate-600 text-white font-semibold rounded-lg shadow-sm hover:bg-slate-700">Close</button>
                    </div>
                </footer>
            </div>
        </div>
    </main>
</template>

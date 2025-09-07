<script setup lang="ts">
import { ref, onMounted, onUnmounted, watch, reactive, nextTick, createApp, defineComponent, h } from 'vue';
import { collection, onSnapshot, Firestore, Unsubscribe } from 'firebase/firestore';
import L from 'leaflet';
import 'leaflet.heat';
import 'leaflet-draw';
import { ALL_PROSPECTS } from '@/data'; // Import local data as a fallback

// --- LEAFLET CSS IMPORTS ---
import 'leaflet/dist/leaflet.css';
import 'leaflet-draw/dist/leaflet.draw.css';

// --- LUCIDE ICON IMPORTS ---
import {
    Search, SlidersHorizontal, Layers, X, FileText, Newspaper, Home,
    CircleUser, Check, Link as LinkIcon, Building, Shrub, AlertTriangle
} from 'lucide-vue-next';

defineOptions({
    inheritAttrs: false
});

// --- PROPS DEFINITION ---
const props = defineProps<{
  focusedProspectId: number | null;
  db?: Firestore;
  appId?: string;
  prospects?: any[];
}>();

const emit = defineEmits(['setCurrentView', 'syncLead']);

// --- COMPONENT STATE ---
const localProspects = ref<any[]>([]);
const isLoading = ref(true);
let unsubscribe: Unsubscribe | null = null;

// --- TYPE GUARDS & HELPERS ---
function isLead(item: any) { return item.type === 'permit' || item.type === 'news'; }
function isCourt(item: any) { return item.type === 'Tennis' || item.type === 'Pickleball' || item.type === 'Basketball'; }
function isResidential(item: any) { return item.type === 'residential'; }

// --- DYNAMIC POPUP COMPONENT (Using Render Function) ---
const PopupContent = defineComponent({
    props: {
        item: { type: Object, required: true },
        onSyncLead: { type: Function, required: true },
        onSetCurrentView: { type: Function, required: true }
    },
    setup(props) {
        // Return a render function instead of using a template string
        return () => h('div', { class: 'font-sans text-slate-800 bg-white rounded-lg shadow-xl p-4', style: 'width: 280px;' }, [
            h('h3', { class: 'font-bold text-base mb-2 truncate' }, props.item.name),
            
            // Lead-specific Info
            (isLead(props.item))
              ? h('div', { class: 'text-sm space-y-3' }, [
                  h('p', { class: 'flex items-start text-slate-600' }, [
                    props.item.type === 'permit' 
                      ? h(FileText, { class: 'w-4 h-4 mr-2.5 mt-0.5 text-violet-500 flex-shrink-0' }) 
                      : h(Newspaper, { class: 'w-4 h-4 mr-2.5 mt-0.5 text-sky-500 flex-shrink-0' }),
                    h('div', [
                      h('span', { class: 'font-semibold' }, props.item.type === 'permit' ? 'Construction Permit' : 'News Article'),
                      h('span', { class: 'text-xs text-slate-500 block' }, `Source: ${props.item.source || 'Public Records'}`)
                    ])
                  ]),
                  (!props.item.isSynced)
                    ? h('button', { 
                        onClick: () => props.onSyncLead(props.item.id), 
                        class: 'w-full mt-2 text-sm bg-indigo-600 text-white px-3 py-1.5 rounded-md hover:bg-indigo-700 flex items-center justify-center transition-colors font-semibold'
                      }, [h(LinkIcon, { class: 'w-4 h-4 mr-2' }), ' Sync to CRM'])
                    : h('div', { class: 'w-full mt-2 text-sm bg-slate-200 text-slate-600 px-3 py-1.5 rounded-md flex items-center justify-center font-medium' }, 
                      [h(Check, { class: 'w-4 h-4 mr-2 text-slate-500' }), ' Synced'])
                ])
            
            // Prospect/Client Info
            : h('div', { class: 'text-sm space-y-3' }, [
                h('p', { class: 'flex items-center text-slate-600' }, [
                  !props.item.isResidential 
                    ? h(Building, { class: 'w-4 h-4 mr-2.5 text-slate-500 flex-shrink-0' }) 
                    : h(Shrub, { class: 'w-4 h-4 mr-2.5 text-slate-500 flex-shrink-0' }),
                  h('span', props.item.isResidential ? 'Residential' : 'Commercial')
                ]),
                h('div', { class: 'flex items-center justify-between text-xs mt-2 text-slate-600' }, [
                  h('span', { class: ['font-semibold', props.item.isClient ? 'text-blue-600' : 'text-slate-500'] }, props.item.isClient ? 'Client' : 'Prospect'),
                  h('span', { class: ['px-2 py-0.5 rounded-full font-medium', {
                      'bg-teal-100 text-teal-800': props.item.status === 'bright' && !props.item.isDue,
                      'bg-amber-100 text-amber-800': props.item.status === 'faded' && !props.item.isDue,
                      'bg-red-100 text-red-800 flex items-center': props.item.isDue
                  }]}, [
                    props.item.isDue ? h(AlertTriangle, { class: 'w-3 h-3 mr-1' }) : null,
                    props.item.isDue ? 'Service Due' : (props.item.status === 'bright' ? 'Good Condition' : 'Worn Surface')
                  ])
                ]),
                props.item.lastServiced ? h('p', { class: 'text-xs text-slate-500' }, `Last Serviced: ${props.item.lastServiced}`) : null,
                h('button', { 
                  onClick: () => props.onSetCurrentView('MyIntel', { prospectId: props.item.id }),
                  class: 'w-full mt-2 text-sm bg-slate-700 text-white px-3 py-1.5 rounded-md hover:bg-slate-800 flex items-center justify-center transition-colors font-semibold'
                }, [h(CircleUser, { class: 'w-4 h-4 mr-2' }), ' View Full Details'])
              ])
        ]);
    }
});

// --- MAP & UI STATE ---
const mapContainerRef = ref(null);
let map: L.Map | null = null;
let heatLayer: any = null;
let markerLayer: L.LayerGroup | null = null;
let markerRefs: { [key: string]: L.Marker } = {};
let resizeObserver: ResizeObserver | null = null;
let highlightedMarker: L.Marker | null = null;

const isFilterPanelOpen = ref(false);
const isHeatmapPanelOpen = ref(false);
const isMobilePanelOpen = ref(false);

const filters = reactive({
    courts: true, leads: true, residential: true, tennis: true,
    pickleball: true, basketball: true, faded: false, due: false,
});

const activeHeatmap = ref('none');

// --- ICON CREATION ---
const iconSVGs: Record<string, string> = {
    'file-text': `<svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><path d="M14.5 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V7.5L14.5 2z"/><polyline points="14 2 14 8 20 8"/><line x1="16" y1="13" x2="8" y2="13"/><line x1="16" y1="17" x2="8" y2="17"/><line x1="10" y1="9" x2="8" y2="9"/></svg>`,
    'newspaper': `<svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><path d="M4 22h16a2 2 0 0 0 2-2V4a2 2 0 0 0-2-2H8a2 2 0 0 0-2 2v16a2 2 0 0 1-2 2Zm0 0a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h4"/><path d="M4 9h16"/><path d="M4 15h16"/><path d="M10 13v2"/><path d="M16 13v2"/></svg>`,
    'racquet': `<svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="7.5"/><path d="m21.5 21.5-6.5-6.5"/></svg>`,
    'table-tennis-paddle': `<svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><path d="M20.5 16.5.5 16.5"/><path d="m16 11 3 3"/><path d="m15.5 11.5 3 3"/><path d="M15 12c-2.5 2.5-2.5 5-5 5s-5-2.5-5-5 2.5-5 5-5 5 2.5 5 5Z"/></svg>`,
    'basketball': `<svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="10"/><path d="M2 12h20"/><path d="M12 2a15.3 15.3 0 0 1 4 10 15.3 15.3 0 0 1-4 10 15.3 15.3 0 0 1-4-10 15.3 15.3 0 0 1 4-10z"/></svg>`,
    'home': `<svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><path d="m3 9 9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z"/><polyline points="9 22 9 12 15 12 15 22"/></svg>`,
};

const createIcon = (item: any): L.DivIcon => {
    let iconClass = 'icon-base ';
    let iconName: keyof typeof iconSVGs = 'racquet';
    if (isLead(item)) {
        iconClass += item.type === 'permit' ? 'icon-permit' : 'icon-news';
        iconName = item.type === 'permit' ? 'file-text' : 'newspaper';
    } else if (isCourt(item)) {
        if (item.isClient) {
            iconClass += item.isDue ? 'icon-client-due' : 'icon-client';
        } else {
            iconClass += `icon-${item.status}`;
        }
        switch(item.type) {
            case 'Tennis': iconName = 'racquet'; break;
            case 'Pickleball': iconName = 'table-tennis-paddle'; break;
            case 'Basketball': iconName = 'basketball'; break;
        }
    } else if (isResidential(item)) {
        iconClass += `icon-residential-${item.status}`;
        iconName = 'home';
    }
    return L.divIcon({
        className: iconClass,
        html: iconSVGs[iconName] || '',
        iconSize: [32, 32],
        iconAnchor: [16, 32]
    });
};

// --- MAP LOGIC ---
const applyFiltersAndDraw = () => {
    if (!markerLayer || !heatLayer || !map) return;
    
    markerLayer.clearLayers();
    markerRefs = {};
    const heatmapActive = activeHeatmap.value !== 'none';

    // Use local data for heatmap visualization
    if (activeHeatmap.value === 'leads' && map) {
        const leadPoints = ALL_PROSPECTS.filter(isLead).map(p => [...p.coords, 0.8]);
        heatLayer.setLatLngs(leadPoints).addTo(map);
    } else if (activeHeatmap.value === 'clients' && map) {
        const clientPoints = ALL_PROSPECTS.filter((p: any) => p.isClient).map(p => [...p.coords, 0.8]);
        heatLayer.setLatLngs(clientPoints).addTo(map);
    } else if (map && map.hasLayer(heatLayer)) {
        map.removeLayer(heatLayer);
    }
    
    const filteredData = localProspects.value.filter((item) => {
        if (!item.type) return false;
        if (item.id === props.focusedProspectId) return true;
        
        // Hide points that are part of an active heatmap
        if (heatmapActive && activeHeatmap.value === 'leads' && isLead(item)) return false;
        if (heatmapActive && activeHeatmap.value === 'clients' && item.isClient) return false;

        if (isCourt(item)) {
            if (!filters.courts) return false;
            if (!filters.tennis && item.type === 'Tennis') return false;
            if (!filters.pickleball && item.type === 'Pickleball') return false;
            if (!filters.basketball && item.type === 'Basketball') return false;
            if (filters.faded && item.status !== 'faded') return false;
            if (filters.due && !item.isDue) return false;
        } else if (isLead(item)) {
            if (!filters.leads) return false;
        } else if (isResidential(item)) {
            if (!filters.residential) return false;
        } else {
            return false;
        }
        return true;
    });

    filteredData.forEach((item) => {
        const icon = createIcon(item);
        const marker = L.marker(item.coords, { icon }).addTo(markerLayer!);
        markerRefs[item.id] = marker;
        
        marker.on('popupopen', (e: L.PopupEvent) => {
            const container = document.createElement('div');
            e.popup.setContent(container);
            const popupApp = createApp(PopupContent, {
                item,
                onSyncLead: (id: number) => emit('syncLead', id),
                onSetCurrentView: (view: string, payload: any) => emit('setCurrentView', view, payload),
            });
            popupApp.mount(container);
            (marker as any).popupApp = popupApp;
        });

        marker.on('popupclose', (e: L.PopupEvent) => {
            if ((e.target as any).popupApp) {
                (e.target as any).popupApp.unmount();
                (e.target as any).popupApp = null;
            }
        });

        marker.bindPopup(document.createElement('div'), { offset: [0, -20] });
    });
};

const focusOnProspect = (prospectId: number) => {
    if (!prospectId || !map) return;

    if (highlightedMarker) {
        const prevElement = highlightedMarker.getElement();
        if (prevElement) L.DomUtil.removeClass(prevElement, 'map-marker-highlight');
        highlightedMarker = null;
    }

    const prospect = localProspects.value.find(p => p.id === prospectId);
    const marker = markerRefs[prospectId];

    if (prospect && marker) {
        map.flyTo(prospect.coords, 16);
        marker.openPopup();
        
        const markerElement = marker.getElement();
        if (markerElement) {
            L.DomUtil.addClass(markerElement, 'map-marker-highlight');
            highlightedMarker = marker;
        }

        marker.once('popupclose', () => {
            if (markerElement) {
                 L.DomUtil.removeClass(markerElement, 'map-marker-highlight');
            }
            if (highlightedMarker === marker) {
                highlightedMarker = null;
            }
        });
    }
};

// --- VUE LIFECYCLE ---
onMounted(async () => {
    if (mapContainerRef.value) {
        map = L.map(mapContainerRef.value, { zoomControl: false }).setView([33.5, -112.0], 10);
        L.control.zoom({ position: 'topleft' }).addTo(map);
        
        L.tileLayer('https://{s}.basemaps.cartocdn.com/rastertiles/voyager/{z}/{x}/{y}{r}.png', {
            attribution: '&copy; OpenStreetMap & CARTO'
        }).addTo(map);

        heatLayer = (L as any).heatLayer([], { radius: 25, blur: 20, maxZoom: 12 });
        markerLayer = L.layerGroup().addTo(map);

        if (props.db && props.appId) {
            console.log("InteractiveMap: db instance provided. Connecting to Firestore...");
            const prospectsCol = collection(props.db, `artifacts/${props.appId}/public/data/prospects`);
            unsubscribe = onSnapshot(prospectsCol, (querySnapshot) => {
                const fetchedProspects: any[] = [];
                querySnapshot.forEach((doc) => {
                    fetchedProspects.push({ id: doc.id, ...doc.data() });
                });
                localProspects.value = fetchedProspects;
                isLoading.value = false;
            }, (error) => {
                console.error("Error fetching prospects:", error);
                isLoading.value = false;
            });
        } else {
            console.log("InteractiveMap: No db instance provided. Using local fallback data.");
            localProspects.value = props.prospects || ALL_PROSPECTS;
            isLoading.value = false;
        }
        
        resizeObserver = new ResizeObserver(() => map?.invalidateSize({ debounceMoveend: true }));
        resizeObserver.observe(mapContainerRef.value);
    }
});

onUnmounted(() => {
    if (unsubscribe) unsubscribe();
    resizeObserver?.disconnect();
    map?.remove();
});

watch([localProspects, () => props.focusedProspectId, filters, activeHeatmap], () => {
    applyFiltersAndDraw();
    if (props.focusedProspectId) {
        nextTick(() => focusOnProspect(props.focusedProspectId!));
    }
}, { deep: true });
</script>

<template>
    <div v-bind="$attrs" class="flex-1 flex flex-col relative bg-slate-200">
        <div v-if="isLoading" class="absolute inset-0 bg-slate-100/50 backdrop-blur-sm z-[1500] flex items-center justify-center">
            <div class="text-center">
                <svg class="animate-spin h-8 w-8 text-indigo-600 mx-auto" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                    <circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4"></circle>
                    <path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                </svg>
                <p class="mt-2 text-slate-600 font-semibold">Loading Map Data...</p>
            </div>
        </div>

        <div id="map" ref="mapContainerRef" class="flex-1 w-full h-full"></div>
        
        <div class="hidden md:flex absolute top-4 left-4 z-[1000] space-x-2 items-start">
            <div class="relative">
                <input type="text" placeholder="Search by address or client..." class="w-72 pl-10 pr-4 py-2 bg-white border border-slate-300 rounded-lg shadow-lg focus:outline-none focus:ring-2 focus:ring-indigo-500"/>
                <Search class="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400" />
            </div>
            
            <div class="flex flex-col space-y-2">
                <div class="relative">
                    <button @click.stop="isFilterPanelOpen = !isFilterPanelOpen; isHeatmapPanelOpen = false" class="bg-white p-2 rounded-lg shadow-lg hover:bg-slate-50 transition-colors" aria-label="Open Filters">
                       <SlidersHorizontal class="w-6 h-6 text-slate-700" />
                    </button>
                    <div v-if="isFilterPanelOpen" @click.stop class="absolute top-0 left-full ml-2 w-72 bg-white/90 backdrop-blur-sm p-4 rounded-lg shadow-2xl border border-slate-200">
                        <h3 class="text-lg font-bold text-slate-800 mb-3">Filters</h3>
                         <div class="space-y-3">
                            <div>
                                <label class="text-sm font-semibold text-slate-600">Data Type</label>
                                <div class="mt-2 space-y-1">
                                    <div class="flex items-center"><input id="filter-courts-desktop" type="checkbox" v-model="filters.courts" class="h-4 w-4 rounded border-gray-300 text-indigo-600 focus:ring-indigo-500" /><label for="filter-courts-desktop" class="ml-2 block text-sm text-gray-900">Commercial & Projects</label></div>
                                    <div class="flex items-center"><input id="filter-leads-desktop" type="checkbox" v-model="filters.leads" class="h-4 w-4 rounded border-gray-300 text-indigo-600 focus:ring-indigo-500" /><label for="filter-leads-desktop" class="ml-2 block text-sm text-gray-900">Leads</label></div>
                                    <div class="flex items-center"><input id="filter-residential-desktop" type="checkbox" v-model="filters.residential" class="h-4 w-4 rounded border-gray-300 text-indigo-600 focus:ring-indigo-500" /><label for="filter-residential-desktop" class="ml-2 block text-sm text-gray-900">Residential Prospects</label></div>
                                </div>
                            </div>
                            <hr class="border-slate-200/80" />
                            <div>
                                <label class="text-sm font-semibold text-slate-600">Court Type</label>
                                <div class="mt-2 space-y-1">
                                    <div class="flex items-center"><input id="filter-tennis-desktop" type="checkbox" v-model="filters.tennis" class="h-4 w-4 rounded border-gray-300 text-indigo-600 focus:ring-indigo-500" /><label for="filter-tennis-desktop" class="ml-2 block text-sm text-gray-900">Tennis</label></div>
                                    <div class="flex items-center"><input id="filter-pickleball-desktop" type="checkbox" v-model="filters.pickleball" class="h-4 w-4 rounded border-gray-300 text-indigo-600 focus:ring-indigo-500" /><label for="filter-pickleball-desktop" class="ml-2 block text-sm text-gray-900">Pickleball</label></div>
                                    <div class="flex items-center"><input id="filter-basketball-desktop" type="checkbox" v-model="filters.basketball" class="h-4 w-4 rounded border-gray-300 text-indigo-600 focus:ring-indigo-500" /><label for="filter-basketball-desktop" class="ml-2 block text-sm text-gray-900">Basketball</label></div>
                                </div>
                            </div>
                            <hr class="border-slate-200/80" />
                            <div>
                                <label class="text-sm font-semibold text-slate-600">Condition</label>
                                <div class="mt-2 space-y-1">
                                    <div class="flex items-center"><input id="filter-faded-desktop" type="checkbox" v-model="filters.faded" class="h-4 w-4 rounded border-gray-300 text-indigo-600 focus:ring-indigo-500" /><label for="filter-faded-desktop" class="ml-2 block text-sm text-gray-900">Faded / Needs Attention</label></div>
                                    <div class="flex items-center"><input id="filter-due-desktop" type="checkbox" v-model="filters.due" class="h-4 w-4 rounded border-gray-300 text-indigo-600 focus:ring-indigo-500" /><label for="filter-due-desktop" class="ml-2 block text-sm text-gray-900">Client Due for Service</label></div>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>

                <div class="relative">
                    <button @click.stop="isHeatmapPanelOpen = !isHeatmapPanelOpen; isFilterPanelOpen = false" class="bg-white p-2 rounded-lg shadow-lg hover:bg-slate-50 transition-colors" aria-label="Open Heatmap Layers">
                       <Layers class="w-6 h-6 text-slate-700" />
                    </button>
                    <div v-if="isHeatmapPanelOpen" @click.stop class="absolute top-0 left-full ml-2 w-72 bg-white/90 backdrop-blur-sm p-4 rounded-lg shadow-2xl border border-slate-200">
                        <h3 class="text-lg font-bold text-slate-800 mb-3">Heatmap Layers</h3>
                        <div class="space-y-2">
                            <div class="flex items-center"><input id="heatmap-none-desktop" name="heatmap" type="radio" value="none" v-model="activeHeatmap" class="h-4 w-4 border-gray-300 text-indigo-600 focus:ring-indigo-500" /><label for="heatmap-none-desktop" class="ml-2 block text-sm text-gray-900">None</label></div>
                            <div class="flex items-center"><input id="heatmap-leads-desktop" name="heatmap" type="radio" value="leads" v-model="activeHeatmap" class="h-4 w-4 border-gray-300 text-indigo-600 focus:ring-indigo-500" /><label for="heatmap-leads-desktop" class="ml-2 block text-sm text-gray-900">Lead Density</label></div>
                            <div class="flex items-center"><input id="heatmap-clients-desktop" name="heatmap" type="radio" value="clients" v-model="activeHeatmap" class="h-4 w-4 border-gray-300 text-indigo-600 focus:ring-indigo-500" /><label for="heatmap-clients-desktop" class="ml-2 block text-sm text-gray-900">Client Concentration</label></div>
                        </div>
                    </div>
                </div>
            </div>
        </div>

        <div class="hidden md:block absolute bottom-4 left-4 z-[1000] bg-white/90 backdrop-blur-sm p-4 rounded-lg shadow-lg border border-slate-200 w-64">
            <h4 class="font-bold text-sm mb-3">Legend</h4>
            <div class="flex flex-col space-y-3 text-xs text-slate-700">
                <div>
                    <p class="font-semibold mb-2 uppercase text-slate-500 text-[10px] tracking-wider">Projects</p>
                    <ul class="flex flex-col space-y-2">
                        <li class="flex items-center"><span class="legend-icon icon-bright" v-html="iconSVGs.racquet"></span> Court (Good)</li>
                        <li class="flex items-center"><span class="legend-icon icon-faded" v-html="iconSVGs.racquet"></span> Court (Worn)</li>
                        <li class="flex items-center"><span class="legend-icon icon-client" v-html="iconSVGs.racquet"></span> Your Project</li>
                        <li class="flex items-center"><span class="legend-icon icon-client-due" v-html="iconSVGs.racquet"></span> Service Due</li>
                    </ul>
                </div>
                <div class="pt-3 border-t border-slate-200/80">
                    <p class="font-semibold mb-2 uppercase text-slate-500 text-[10px] tracking-wider">Residential</p>
                    <ul class="flex flex-col space-y-2">
                        <li class="flex items-center"><span class="legend-icon icon-residential-good" v-html="iconSVGs.home"></span> Good Condition</li>
                        <li class="flex items-center"><span class="legend-icon icon-residential-worn" v-html="iconSVGs.home"></span> Worn Condition</li>
                    </ul>
                </div>
                <div class="pt-3 border-t border-slate-200/80">
                    <p class="font-semibold mb-2 uppercase text-slate-500 text-[10px] tracking-wider">Leads</p>
                    <ul class="flex flex-col space-y-2">
                        <li class="flex items-center"><span class="legend-icon icon-permit" v-html="iconSVGs['file-text']"></span> Permit Lead</li>
                        <li class="flex items-center"><span class="legend-icon icon-news" v-html="iconSVGs.newspaper"></span> News Lead</li>
                    </ul>
                </div>
            </div>
        </div>
        
    </div>
</template>

<style scoped>
.legend-icon {
    display: inline-flex;
    align-items: center;
    justify-content: center;
    border-radius: 50%;
    width: 24px;
    height: 24px;
    flex-shrink: 0;
    margin-right: 8px;
    border: 2px solid;
    background-color: white;
}
.legend-icon svg {
    width: 14px;
    height: 14px;
}
</style>

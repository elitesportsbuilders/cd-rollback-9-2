<script setup lang="ts">
import { ref, onMounted, onUnmounted, watch, reactive, nextTick, createApp } from 'vue';
import { LEAD_HEATMAP_DATA, CLIENT_HEATMAP_DATA } from '@/data';
import { createIcons } from 'lucide';
import L from 'leaflet';
import 'leaflet.heat';
import 'leaflet-draw';

const props = defineProps<{
  prospects: any[];
  focusedProspectId: number | null;
}>();

const emit = defineEmits(['syncLead']);

// Type guards
function isLead(item: any) {
    return item.type === 'permit' || item.type === 'news';
}

function isCourt(item: any) {
    return item.type === 'Tennis' || item.type === 'Pickleball' || item.type === 'Basketball';
}

function isResidential(item: any) {
    return item.type === 'residential';
}

const PopupContent = {
    props: {
        item: { type: Object, required: true },
        onSyncLead: { type: Function, required: true }
    },
    setup(props: { item: any; onSyncLead: (id: number) => void; }) {
        onMounted(() => {
            createIcons();
        });
        
        return {
            isLead, isCourt,
        };
    },
    template: `
        <div class="bg-white rounded-lg shadow-xl p-3" style="width: 280px">
            <h3 class="font-bold text-lg">{{item.name}}</h3>
            <p>This is a test popup.</p>
        </div>
    `
};

const mapContainerRef = ref(null);
let map: any = null;
let heatLayer: any = null;
let markerLayer: any = null;
let markerRefs: { [key: number]: any } = {};
let resizeObserver: ResizeObserver | null = null;

const isFilterPanelOpen = ref(false);
const isHeatmapPanelOpen = ref(false);
const isMobilePanelOpen = ref(false);

const filters = reactive({
    courts: true,
    leads: true,
    residential: true,
    tennis: true,
    pickleball: true,
    basketball: true,
    faded: false,
    due: false,
});

const activeHeatmap = ref('none');

const createIcon = (item: any) => {
    let iconClass = 'icon-base ';
    let innerHTML = '';
    const iconSizeClass = 'w-5 h-5';
    const strokeWidth = '2';

    if (isLead(item)) {
        iconClass += item.type === 'permit' ? 'icon-permit' : 'icon-news';
        innerHTML = `<i data-lucide="${item.type === 'permit' ? 'file-text' : 'newspaper'}" class="${iconSizeClass}" stroke-width="${strokeWidth}"></i>`;
    } else if (isCourt(item)) {
        if (item.isClient) {
            iconClass += item.isDue ? 'icon-client icon-client-due' : 'icon-client';
        } else {
            iconClass += `icon-${item.status}`;
        }
        
        let lucideIconName = '';
        switch(item.type) {
            case 'Tennis': lucideIconName = 'racquet'; break;
            case 'Pickleball': lucideIconName = 'table-tennis-paddle'; break;
            case 'Basketball': lucideIconName = 'basketball'; break;
        }
        innerHTML = `<i data-lucide="${lucideIconName}" class="${iconSizeClass}" stroke-width="${strokeWidth}"></i>`;
    } else if (isResidential(item)) {
        iconClass += `icon-residential-${item.status}`;
        innerHTML = `<i data-lucide="home" class="${iconSizeClass}" stroke-width="${strokeWidth}"></i>`;
    }
    
    return L.divIcon({ 
        className: iconClass, 
        html: innerHTML, 
        iconSize: [32, 32],
        iconAnchor: [16, 16]
    });
};

const applyFiltersAndDraw = () => {
    if (!markerLayer || !heatLayer || !map) return;
    
    markerLayer.clearLayers();
    markerRefs = {};
    const heatmapActive = activeHeatmap.value !== 'none';

    if (activeHeatmap.value === 'leads') {
        heatLayer.setLatLngs(LEAD_HEATMAP_DATA).addTo(map);
    } else if (activeHeatmap.value === 'clients') {
        heatLayer.setLatLngs(CLIENT_HEATMAP_DATA).addTo(map);
    } else {
        if (map.hasLayer(heatLayer)) {
            map.removeLayer(heatLayer);
        }
    }
    
    const filteredData = props.prospects.filter((item) => {
        if (!item.type) return false;
        if (item.id === props.focusedProspectId) return true;
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
        }
        else {
            return false;
        }
        return true;
    });

    filteredData.forEach((item) => {
        if (heatmapActive && isLead(item) && activeHeatmap.value === 'leads') return;

        const icon = createIcon(item);
        const marker = L.marker(item.coords, { icon: icon }).addTo(markerLayer);
        markerRefs[item.id] = marker;
        
        marker.on('popupopen', (e: any) => {
            const container = document.createElement('div');
            e.popup.setContent(container);
            const popupApp = createApp(PopupContent, {
              item: item,
              onSyncLead: (id: number) => emit('syncLead', id)
            });
            popupApp.mount(container);
            (marker as any).popupApp = popupApp;
        });

        marker.on('popupclose', (e: any) => {
            if ((e.target as any).popupApp) {
                (e.target as any).popupApp.unmount();
                (e.target as any).popupApp = null;
            }
        });

        marker.bindPopup(document.createElement('div'));
    });
     setTimeout(() => {
        createIcons();
    }, 0);
};

const focusOnProspect = (prospectId: number) => {
    if (!prospectId || !map) return;

    const prospect = props.prospects.find(p => p.id === prospectId);
    const marker = markerRefs[prospectId];

    if (prospect && marker) {
        map.flyTo(prospect.coords, 16);
        marker.openPopup();
    }
};

onMounted(() => {
    if (mapContainerRef.value) {
        map = L.map(mapContainerRef.value, { zoomControl: false }).setView([33.5, -112.0], 10);
        L.control.zoom({ position: 'topleft' }).addTo(map);
        
        const satelliteLayer = L.tileLayer('https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}', {
            attribution: 'Tiles &copy; Esri'
        });
        const streetLayer = L.tileLayer('https://{s}.basemaps.cartocdn.com/rastertiles/voyager/{z}/{x}/{y}{r}.png', {
            attribution: '&copy; OpenStreetMap & CARTO'
        });
        
        satelliteLayer.addTo(map);
        L.control.layers({ "Satellite": satelliteLayer, "Street": streetLayer }, undefined, { position: 'topright' }).addTo(map);

        heatLayer = (L as any).heatLayer([], { radius: 25, blur: 20, maxZoom: 12 });
        markerLayer = L.layerGroup().addTo(map);

        map.on('click', () => {
            isFilterPanelOpen.value = false;
            isHeatmapPanelOpen.value = false;
        });

        resizeObserver = new ResizeObserver(() => {
            if (map) {
                map.invalidateSize({ debounceMoveend: true });
            }
        });
        resizeObserver.observe(mapContainerRef.value);

        applyFiltersAndDraw();

        if (props.focusedProspectId) {
            nextTick(() => focusOnProspect(props.focusedProspectId as number));
        }
    }
});

onUnmounted(() => {
    if (resizeObserver) {
        resizeObserver.disconnect();
    }
    if(map) {
        map.remove();
    }
});

watch([() => props.prospects, () => props.focusedProspectId, filters, activeHeatmap], () => {
    applyFiltersAndDraw();
    if (props.focusedProspectId) {
        nextTick(() => focusOnProspect(props.focusedProspectId as number));
    }
}, { deep: true, immediate: true });

watch(isMobilePanelOpen, (isOpen) => {
    if (isOpen) {
        nextTick(() => {
            createIcons();
        });
    }
});
</script>

<template>
        <div class="flex-1 flex flex-col relative">
            <div id="map" ref="mapContainerRef" class="flex-1 w-full"></div>
            
            <!-- Desktop Controls -->
            <div class="hidden md:flex absolute top-4 left-[50px] z-[1000] items-center space-x-2">
                <div class="relative">
                    <input type="text" placeholder="Search by address or client..." class="w-72 pl-10 pr-4 py-2 bg-white border border-slate-300 rounded-lg shadow-lg focus:outline-none focus:ring-2 focus:ring-indigo-500"/>
                    <i data-lucide="search" class="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400"></i>
                </div>
                
                <div class="relative">
                    <button @click.stop="isFilterPanelOpen = !isFilterPanelOpen; isHeatmapPanelOpen = false" class="bg-white p-2 rounded-lg shadow-lg hover:bg-slate-50" aria-label="Open Filters">
                       <i data-lucide="sliders-horizontal" class="w-6 h-6 text-slate-700"></i>
                   </button>
                   <div v-if="isFilterPanelOpen" @click.stop class="absolute top-full left-0 mt-2 w-72 bg-white p-4 rounded-lg shadow-2xl border border-slate-200">
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
                            <hr />
                            <div>
                                <label class="text-sm font-semibold text-slate-600">Court Type</label>
                                <div class="mt-2 space-y-1">
                                    <div class="flex items-center"><input id="filter-tennis-desktop" type="checkbox" v-model="filters.tennis" class="h-4 w-4 rounded border-gray-300 text-indigo-600 focus:ring-indigo-500" /><label for="filter-tennis-desktop" class="ml-2 block text-sm text-gray-900">Tennis</label></div>
                                    <div class="flex items-center"><input id="filter-pickleball-desktop" type="checkbox" v-model="filters.pickleball" class="h-4 w-4 rounded border-gray-300 text-indigo-600 focus:ring-indigo-500" /><label for="filter-pickleball-desktop" class="ml-2 block text-sm text-gray-900">Pickleball</label></div>
                                    <div class="flex items-center"><input id="filter-basketball-desktop" type="checkbox" v-model="filters.basketball" class="h-4 w-4 rounded border-gray-300 text-indigo-600 focus:ring-indigo-500" /><label for="filter-basketball-desktop" class="ml-2 block text-sm text-gray-900">Basketball</label></div>
                                </div>
                            </div>
                            <hr />
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
                    <button @click.stop="isHeatmapPanelOpen = !isHeatmapPanelOpen; isFilterPanelOpen = false" class="bg-white p-2 rounded-lg shadow-lg hover:bg-slate-50" aria-label="Open Heatmap Layers">
                       <i data-lucide="layers" class="w-6 h-6 text-slate-700"></i>
                   </button>
                    <div v-if="isHeatmapPanelOpen" @click.stop class="absolute top-full left-0 mt-2 w-72 bg-white p-4 rounded-lg shadow-2xl border border-slate-200">
                        <h3 class="text-lg font-bold text-slate-800 mb-3">Heatmap Layers</h3>
                        <div class="space-y-2">
                            <div class="flex items-center"><input id="heatmap-none-desktop" name="heatmap" type="radio" value="none" v-model="activeHeatmap" class="h-4 w-4 border-gray-300 text-indigo-600 focus:ring-indigo-500" /><label for="heatmap-none-desktop" class="ml-2 block text-sm text-gray-900">None</label></div>
                            <div class="flex items-center"><input id="heatmap-leads-desktop" name="heatmap" type="radio" value="leads" v-model="activeHeatmap" class="h-4 w-4 border-gray-300 text-indigo-600 focus:ring-indigo-500" /><label for="heatmap-leads-desktop" class="ml-2 block text-sm text-gray-900">Lead Density</label></div>
                            <div class="flex items-center"><input id="heatmap-clients-desktop" name="heatmap" type="radio" value="clients" v-model="activeHeatmap" class="h-4 w-4 border-gray-300 text-indigo-600 focus:ring-indigo-500" /><label for="heatmap-clients-desktop" class="ml-2 block text-sm text-gray-900">Client Concentration</label></div>
                        </div>
                    </div>
                </div>
            </div>

            <div class="hidden md:block absolute bottom-4 left-4 z-[1000] bg-white p-3 rounded-lg shadow-lg border border-slate-200 w-64">
                <h4 class="font-bold text-sm mb-3">Legend</h4>
                <div class="space-y-3 text-xs text-slate-700">
                    <div>
                        <p class="font-semibold mb-1 uppercase text-slate-500 text-[10px]">Commercial & Projects</p>
                        <ul class="space-y-1.5">
                            <li class="flex items-center"><div class="icon-base icon-bright mr-2 !w-6 !h-6"><i data-lucide="racquet" class="w-4 h-4"></i></div> Court (Good)</li>
                            <li class="flex items-center"><div class="icon-base icon-faded mr-2 !w-6 !h-6"><i data-lucide="racquet" class="w-4 h-4"></i></div> Court (Worn)</li>
                            <li class="flex items-center"><div class="icon-base icon-client mr-2 !w-6 !h-6"><i data-lucide="racquet" class="w-4 h-4"></i></div> Your Project</li>
                            <li class="flex items-center"><div class="icon-base icon-client icon-client-due mr-2 !w-6 !h-6"><i data-lucide="racquet" class="w-4 h-4"></i></div> Service Due</li>
                        </ul>
                    </div>
                     <div>
                        <p class="font-semibold mb-1 uppercase text-slate-500 text-[10px]">Residential Prospects</p>
                        <ul class="space-y-1.5">
                            <li class="flex items-center"><div class="icon-base icon-residential-good mr-2 !w-6 !h-6"><i data-lucide="home" class="w-4 h-4"></i></div> Good Condition</li>
                            <li class="flex items-center"><div class="icon-base icon-residential-worn mr-2 !w-6 !h-6"><i data-lucide="home" class="w-4 h-4"></i></div> Worn Condition</li>
                        </ul>
                    </div>
                    <div>
                        <p class="font-semibold mb-1 uppercase text-slate-500 text-[10px]">Leads</p>
                        <ul class="space-y-1.5">
                            <li class="flex items-center"><div class="icon-base icon-permit mr-2 !w-6 !h-6"><i data-lucide="file-text" class="w-4 h-4"></i></div> Permit Lead</li>
                            <li class="flex items-center"><div class="icon-base icon-news mr-2 !w-6 !h-6"><i data-lucide="newspaper" class="w-4 h-4"></i></div> News Lead</li>
                        </ul>
                    </div>
                    <p class="text-center text-[10px] text-slate-400 pt-1 border-t border-slate-200">Inner icons for commercial courts indicate type (Tennis, etc.)</p>
                </div>
            </div>
            
            <!-- Mobile FAB -->
            <div class="md:hidden absolute bottom-4 right-4 z-[1000]">
                <button @click="isMobilePanelOpen = true" class="bg-indigo-600 text-white w-14 h-14 rounded-full shadow-lg flex items-center justify-center hover:bg-indigo-700 active:bg-indigo-800 transition-colors">
                    <i data-lucide="sliders-horizontal" class="w-6 h-6"></i>
                </button>
            </div>

            <!-- Mobile Control Panel (Bottom Sheet) -->
            <div v-if="isMobilePanelOpen" class="md:hidden fixed inset-0 bg-black bg-opacity-50 z-[1100]" @click="isMobilePanelOpen = false"></div>
            <div v-if="isMobilePanelOpen" class="md:hidden fixed bottom-0 left-0 right-0 bg-white rounded-t-2xl shadow-2xl z-[1200] max-h-[85vh] flex flex-col" style="animation: slide-in-up 0.3s ease-out;">
                <header class="p-4 border-b flex justify-between items-center flex-shrink-0">
                    <h3 class="text-lg font-bold text-slate-800">Map Tools</h3>
                    <button @click="isMobilePanelOpen = false" class="p-1 text-slate-500 hover:text-slate-800 rounded-full hover:bg-slate-100">
                        <i data-lucide="x" class="w-6 h-6"></i>
                    </button>
                </header>
                <div class="flex-1 overflow-y-auto p-4 space-y-6">
                    <!-- Search -->
                    <div class="relative">
                        <input type="text" placeholder="Search by address or client..." class="w-full pl-10 pr-4 py-2 bg-slate-100 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500"/>
                        <i data-lucide="search" class="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400"></i>
                    </div>
                    
                    <!-- Filters -->
                    <div>
                         <h3 class="text-lg font-bold text-slate-800 mb-3">Filters</h3>
                         <div class="space-y-3">
                            <div>
                                <label class="text-sm font-semibold text-slate-600">Data Type</label>
                                <div class="mt-2 space-y-1">
                                    <div class="flex items-center"><input id="filter-courts-mobile" type="checkbox" v-model="filters.courts" class="h-4 w-4 rounded border-gray-300 text-indigo-600 focus:ring-indigo-500" /><label for="filter-courts-mobile" class="ml-2 block text-sm text-gray-900">Commercial & Projects</label></div>
                                    <div class="flex items-center"><input id="filter-leads-mobile" type="checkbox" v-model="filters.leads" class="h-4 w-4 rounded border-gray-300 text-indigo-600 focus:ring-indigo-500" /><label for="filter-leads-mobile" class="ml-2 block text-sm text-gray-900">Leads</label></div>
                                    <div class="flex items-center"><input id="filter-residential-mobile" type="checkbox" v-model="filters.residential" class="h-4 w-4 rounded border-gray-300 text-indigo-600 focus:ring-indigo-500" /><label for="filter-residential-mobile" class="ml-2 block text-sm text-gray-900">Residential Prospects</label></div>
                                </div>
                            </div>
                            <hr />
                            <div>
                                <label class="text-sm font-semibold text-slate-600">Court Type</label>
                                <div class="mt-2 space-y-1">
                                    <div class="flex items-center"><input id="filter-tennis-mobile" type="checkbox" v-model="filters.tennis" class="h-4 w-4 rounded border-gray-300 text-indigo-600 focus:ring-indigo-500" /><label for="filter-tennis-mobile" class="ml-2 block text-sm text-gray-900">Tennis</label></div>
                                    <div class="flex items-center"><input id="filter-pickleball-mobile" type="checkbox" v-model="filters.pickleball" class="h-4 w-4 rounded border-gray-300 text-indigo-600 focus:ring-indigo-500" /><label for="filter-pickleball-mobile" class="ml-2 block text-sm text-gray-900">Pickleball</label></div>
                                    <div class="flex items-center"><input id="filter-basketball-mobile" type="checkbox" v-model="filters.basketball" class="h-4 w-4 rounded border-gray-300 text-indigo-600 focus:ring-indigo-500" /><label for="filter-basketball-mobile" class="ml-2 block text-sm text-gray-900">Basketball</label></div>
                                </div>
                            </div>
                            <hr />
                            <div>
                                <label class="text-sm font-semibold text-slate-600">Condition</label>
                                <div class="mt-2 space-y-1">
                                    <div class="flex items-center"><input id="filter-faded-mobile" type="checkbox" v-model="filters.faded" class="h-4 w-4 rounded border-gray-300 text-indigo-600 focus:ring-indigo-500" /><label for="filter-faded-mobile" class="ml-2 block text-sm text-gray-900">Faded / Needs Attention</label></div>
                                    <div class="flex items-center"><input id="filter-due-mobile" type="checkbox" v-model="filters.due" class="h-4 w-4 rounded border-gray-300 text-indigo-600 focus:ring-indigo-500" /><label for="filter-due-mobile" class="ml-2 block text-sm text-gray-900">Client Due for Service</label></div>
                                </div>
                            </div>
                        </div>
                    </div>

                    <!-- Heatmap Layers -->
                    <div>
                        <h3 class="text-lg font-bold text-slate-800 mb-3">Heatmap Layers</h3>
                        <div class="space-y-2">
                            <div class="flex items-center"><input id="heatmap-none-mobile" name="heatmap-mobile" type="radio" value="none" v-model="activeHeatmap" class="h-4 w-4 border-gray-300 text-indigo-600 focus:ring-indigo-500" /><label for="heatmap-none-mobile" class="ml-2 block text-sm text-gray-900">None</label></div>
                            <div class="flex items-center"><input id="heatmap-leads-mobile" name="heatmap-mobile" type="radio" value="leads" v-model="activeHeatmap" class="h-4 w-4 border-gray-300 text-indigo-600 focus:ring-indigo-500" /><label for="heatmap-leads-mobile" class="ml-2 block text-sm text-gray-900">Lead Density</label></div>
                            <div class="flex items-center"><input id="heatmap-clients-mobile" name="heatmap-mobile" type="radio" value="clients" v-model="activeHeatmap" class="h-4 w-4 border-gray-300 text-indigo-600 focus:ring-indigo-500" /><label for="heatmap-clients-mobile" class="ml-2 block text-sm text-gray-900">Client Concentration</label></div>
                        </div>
                    </div>

                    <!-- Legend -->
                    <div>
                        <h4 class="text-lg font-bold text-slate-800 mb-3">Legend</h4>
                         <div class="space-y-3 text-xs text-slate-700">
                            <div>
                                <p class="font-semibold mb-1 uppercase text-slate-500 text-[10px]">Commercial & Projects</p>
                                <ul class="space-y-1.5">
                                    <li class="flex items-center"><div class="icon-base icon-bright mr-2 !w-6 !h-6"><i data-lucide="racquet" class="w-4 h-4"></i></div> Court (Good)</li>
                                    <li class="flex items-center"><div class="icon-base icon-faded mr-2 !w-6 !h-6"><i data-lucide="racquet" class="w-4 h-4"></i></div> Court (Worn)</li>
                                    <li class="flex items-center"><div class="icon-base icon-client mr-2 !w-6 !h-6"><i data-lucide="racquet" class="w-4 h-4"></i></div> Your Project</li>
                                    <li class="flex items-center"><div class="icon-base icon-client icon-client-due mr-2 !w-6 !h-6"><i data-lucide="racquet" class="w-4 h-4"></i></div> Service Due</li>
                                </ul>
                            </div>
                             <div>
                                <p class="font-semibold mb-1 uppercase text-slate-500 text-[10px]">Residential Prospects</p>
                                <ul class="space-y-1.5">
                                    <li class="flex items-center"><div class="icon-base icon-residential-good mr-2 !w-6 !h-6"><i data-lucide="home" class="w-4 h-4"></i></div> Good Condition</li>
                                    <li class="flex items-center"><div class="icon-base icon-residential-worn mr-2 !w-6 !h-6"><i data-lucide="home" class="w-4 h-4"></i></div> Worn Condition</li>
                                </ul>
                            </div>
                            <div>
                                <p class="font-semibold mb-1 uppercase text-slate-500 text-[10px]">Leads</p>
                                <ul class="space-y-1.5">
                                    <li class="flex items-center"><div class="icon-base icon-permit mr-2 !w-6 !h-6"><i data-lucide="file-text" class="w-4 h-4"></i></div> Permit Lead</li>
                                    <li class="flex items-center"><div class="icon-base icon-news mr-2 !w-6 !h-6"><i data-lucide="newspaper" class="w-4 h-4"></i></div> News Lead</li>
                                </ul>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </div>
</template>

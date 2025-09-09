<script setup lang="ts">
import { ref, onMounted, onUnmounted, watch, reactive, nextTick, createApp, defineComponent, h } from 'vue';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';
import 'leaflet-draw/dist/leaflet.draw.css';
import 'leaflet.heat';
import { ALL_PROSPECTS } from '@/data'; // Import local data for heatmaps
import { View } from '@/types';

import { 
    Search, SlidersHorizontal, Layers, X, FileText, Newspaper, Home,
    CircleUser, Check, Link as LinkIcon, Building, Shrub, AlertTriangle, Sparkles, Wrench
} from 'lucide-vue-next';

defineOptions({
    inheritAttrs: false
});

const props = defineProps<{
  focusedProspectId: number | null;
  prospects: any[];
}>();

const emit = defineEmits(['setCurrentView', 'removeProspect', 'acknowledgeLead']);

// --- COMPONENT STATE ---
const localProspects = ref<any[]>(props.prospects || []);
const isLoading = ref(true);

// --- TYPE GUARDS & HELPERS ---
function isLead(item: any) { return item.type === 'permit' || item.type === 'news'; }
function isCourt(item: any) { return item.type === 'Tennis' || item.type === 'Pickleball' || item.type === 'Basketball'; }
function isResidential(item: any) { return item.type === 'residential'; }

// --- BUSINESS LOGIC FOR ALERTS ---
const getClientAlertLevel = (project: any): 'resurface' | 'warranty' | 'none' => {
  if (!project || !project.isClient || !project.completionDate) return 'none';
  
  const today = new Date('2025-09-08T12:00:00Z');
  const completionDate = new Date(project.completionDate);
  const warrantyExpiration = new Date(project.warrantyExpiration);

  const yearsSinceCompletion = (today.getTime() - completionDate.getTime()) / (1000 * 60 * 60 * 24 * 365);
  if (yearsSinceCompletion >= 5) {
    return 'resurface';
  }

  const monthsToWarrantyExpiry = (warrantyExpiration.getTime() - today.getTime()) / (1000 * 60 * 60 * 24 * 30.44);
  if (monthsToWarrantyExpiry <= 6) {
    return 'warranty';
  }

  return 'none';
};

// --- DYNAMIC POPUP COMPONENT ---
const PopupContent = defineComponent({
    props: {
        item: { type: Object, required: true },
        onSetCurrentView: { type: Function, required: true },
        onRemoveProspect: { type: Function, required: true },
        onAcknowledgeLead: { type: Function, required: true }
    },
    setup(props) {
        return () => h('div', { class: 'font-sans text-slate-800' }, [
            'isAcknowledged' in props.item && props.item.isAcknowledged === false 
            ? h('div', { class: 'bg-white rounded-lg shadow-xl p-4', style: 'width: 280px;'}, [
                h('h3', { class: 'font-bold text-base mb-2 flex items-center text-indigo-700' }, [ h(Sparkles, {class: 'w-5 h-5 mr-2'}), 'AI-Discovered Opportunity' ]),
                h('p', { class: 'text-sm text-slate-600 mb-3' }, props.item.aiSummary),
                h('a', { href: props.item.sourceUrl, target: '_blank', class: 'text-xs text-indigo-600 hover:underline' }, `Source: ${props.item.source}`),
                h('div', { class: 'flex space-x-2 mt-4' }, [
                    h('button', { onClick: () => props.onSetCurrentView(View.LeadIntelligence), class: 'flex-1 text-sm bg-indigo-600 text-white px-3 py-1.5 rounded-md hover:bg-indigo-700 font-semibold' }, 'View Full Intel'),
                    h('button', { onClick: () => props.onRemoveProspect(props.item.id), class: 'text-sm bg-slate-200 text-slate-700 px-3 py-1.5 rounded-md hover:bg-slate-300 font-semibold' }, 'Dismiss'),
                ])
            ])
            : h('div', { class: 'bg-white rounded-lg shadow-xl p-4', style: 'width: 280px;' }, [
                h('h3', { class: 'font-bold text-base mb-2 truncate' }, props.item.name),
                 (isLead(props.item))
                    ? h('div', { class: 'text-sm space-y-2' }, [
                        h('p', { class: 'flex items-center text-slate-600' }, [
                            props.item.type === 'permit' ? h(FileText, { class: 'w-4 h-4 mr-2 text-violet-500 flex-shrink-0' }) : h(Newspaper, { class: 'w-4 h-4 mr-2 text-sky-500 flex-shrink-0' }),
                            h('span', `Source: ${props.item.source || 'Unknown'}`)
                        ]),
                        !props.item.isSynced
                            ? h('button', { onClick: () => {}, class: 'w-full mt-2 text-sm bg-indigo-600 text-white px-3 py-1.5 rounded-md hover:bg-indigo-700' }, 'Sync to CRM')
                            : h('div', { class: 'w-full mt-2 text-sm bg-slate-200 text-slate-600 px-3 py-1.5 rounded-md' }, 'Synced')
                    ])
                    : (props.item.isClient)
                    ? h('div', { class: 'text-sm space-y-2' }, [
                        h('p', { class: 'font-semibold' }, 'Client Project'),
                        h('button', { onClick: () => props.onSetCurrentView(View.ProjectHub, { prospectId: props.item.id }), class: 'w-full mt-2 text-sm bg-slate-700 text-white px-3 py-1.5 rounded-md hover:bg-slate-800' }, 'Open Project Hub')
                      ])
                    : h('div', { class: 'text-sm space-y-2' }, [
                        h('p', { class: 'font-semibold' }, 'Prospect'),
                        h('button', { onClick: () => props.onSetCurrentView(View.MyIntel, { prospectId: props.item.id }), class: 'w-full mt-2 text-sm bg-slate-700 text-white px-3 py-1.5 rounded-md hover:bg-slate-800' }, 'View Details')
                      ])
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
const isFilterPanelOpen = ref(false);
const isHeatmapPanelOpen = ref(false);

const filters = reactive({
    courts: true, leads: true, residential: true, aiLeads: true,
    // New Client Alert Filters
    needsResurfacing: false,
    warrantyExpiring: false,
});

const activeHeatmap = ref('none');

// --- ICON CREATION ---
const createIcon = (item: any): L.DivIcon => {
    let iconClass = 'icon-base ';
    if ('isAcknowledged' in item && item.isAcknowledged === false) {
        iconClass += 'icon-ai-lead map-marker-ping';
    } else if (isLead(item)) {
        iconClass += item.type === 'permit' ? 'icon-permit' : 'icon-news';
    } else if (isCourt(item)) {
        if (item.isClient) {
            const alertLevel = getClientAlertLevel(item);
            if (alertLevel === 'resurface') {
                iconClass += 'icon-client icon-client-alert-resurface';
            } else if (alertLevel === 'warranty') {
                iconClass += 'icon-client icon-client-alert-warranty';
            } else {
                 iconClass += item.isDue ? 'icon-client-due' : 'icon-client';
            }
        } else {
            iconClass += `icon-${item.status}`;
        }
    } else if (isResidential(item)) {
        iconClass += `icon-residential-${item.status}`;
    }
    return L.divIcon({ className: iconClass, html: `<div class="icon-inner"></div>`, iconSize: [32, 32], iconAnchor: [16, 16] });
};

// --- MAP LOGIC ---
const applyFiltersAndDraw = () => {
    if (!markerLayer || !map) return;
    markerLayer.clearLayers();
    markerRefs = {};
    const heatmapActive = activeHeatmap.value !== 'none';

    if (activeHeatmap.value === 'leads' && heatLayer) {
        const leadPoints = ALL_PROSPECTS.filter(p => isLead(p) || ('isAcknowledged' in p && p.isAcknowledged === false)).map(p => [...p.coords, 0.8]);
        heatLayer.setLatLngs(leadPoints).addTo(map);
    } else if (activeHeatmap.value === 'clients' && heatLayer) {
        const clientPoints = ALL_PROSPECTS.filter((p: any) => p.isClient).map(p => [...p.coords, 0.8]);
        heatLayer.setLatLngs(clientPoints).addTo(map);
    } else if (heatLayer && map.hasLayer(heatLayer)) {
        map.removeLayer(heatLayer);
    }
    
    const isAlertFilterActive = filters.needsResurfacing || filters.warrantyExpiring;

    const filteredData = localProspects.value.filter((item) => {
        if (!item.type) return false;
        if (item.id === props.focusedProspectId) return true;
        
        const isAiLead = 'isAcknowledged' in item && item.isAcknowledged === false;

        // Client Alert Filtering Logic
        if (item.isClient && isAlertFilterActive) {
            const alertLevel = getClientAlertLevel(item);
            if (filters.needsResurfacing && alertLevel === 'resurface') return true;
            if (filters.warrantyExpiring && alertLevel === 'warranty') return true;
            return false;
        }

        if (heatmapActive && activeHeatmap.value === 'leads' && (isLead(item) || isAiLead)) return false;
        if (heatmapActive && activeHeatmap.value === 'clients' && item.isClient) return false;

        if (isAiLead) {
            if (!filters.aiLeads) return false;
        } else if (isCourt(item)) {
            if (!filters.courts) return false;
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
                onSetCurrentView: (view: string, payload: any) => emit('setCurrentView', view, payload),
                onRemoveProspect: (id: number) => {
                    emit('removeProspect', id);
                    map?.closePopup();
                },
                onAcknowledgeLead: (id: number) => {
                    emit('acknowledgeLead', id);
                    map?.closePopup();
                }
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

        marker.bindPopup(document.createElement('div'));
    });
};

// --- VUE LIFECYCLE ---
watch(() => props.prospects, (newProspects) => {
    localProspects.value = newProspects;
    applyFiltersAndDraw();
}, { deep: true, immediate: true });

watch(filters, () => {
    applyFiltersAndDraw();
}, { deep: true });

watch(activeHeatmap, () => {
    applyFiltersAndDraw();
});


onMounted(() => {
    if (mapContainerRef.value) {
        map = L.map(mapContainerRef.value, { zoomControl: false }).setView([33.5, -112.0], 10);
        
        const satelliteLayer = L.tileLayer('https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}', {
            attribution: 'Tiles &copy; Esri'
        });
        const streetLayer = L.tileLayer('https://{s}.basemaps.cartocdn.com/rastertiles/voyager/{z}/{x}/{y}{r}.png', {
            attribution: '&copy; OpenStreetMap & CARTO'
        });
        
        satelliteLayer.addTo(map);

        const baseLayers = { "Satellite": satelliteLayer, "Street": streetLayer };
        L.control.layers(baseLayers, undefined, { position: 'topright' }).addTo(map);
        L.control.zoom({ position: 'topleft' }).addTo(map);

        markerLayer = L.layerGroup().addTo(map);
        heatLayer = (L as any).heatLayer([], { radius: 25, blur: 20, maxZoom: 12 });
        applyFiltersAndDraw();
        isLoading.value = false;
    }
});
</script>

<template>
    <div v-bind="$attrs" class="flex-1 flex flex-col relative bg-slate-200">
        <div id="map" ref="mapContainerRef" class="flex-1 w-full h-full"></div>
        
        <!-- Desktop Controls -->
        <div class="hidden md:flex absolute top-4 left-4 z-[1000] space-x-2 items-start">
            <div class="relative">
                <input type="text" placeholder="Search..." class="w-72 pl-10 pr-4 py-2 bg-white rounded-lg shadow-lg focus:outline-none focus:ring-2 focus:ring-indigo-500"/>
                <Search class="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400" />
            </div>
            <div class="relative">
                <button @click.stop="isFilterPanelOpen = !isFilterPanelOpen; isHeatmapPanelOpen = false" class="bg-white p-2 rounded-lg shadow-lg hover:bg-slate-50">
                    <SlidersHorizontal class="w-6 h-6 text-slate-700" />
                </button>
                <div v-if="isFilterPanelOpen" @click.stop class="absolute top-full mt-2 w-72 bg-white/90 backdrop-blur-sm p-4 rounded-lg shadow-2xl border">
                    <h3 class="text-lg font-bold text-slate-800 mb-3">Filters</h3>
                    <div class="space-y-4">
                        <div>
                            <label class="text-sm font-semibold text-slate-600">Standard Layers</label>
                            <div class="mt-2 space-y-1">
                                <div class="flex items-center"><input id="filter-ai-leads-desktop" type="checkbox" v-model="filters.aiLeads" class="h-4 w-4 rounded text-indigo-600 focus:ring-indigo-500" /><label for="filter-ai-leads-desktop" class="ml-2 block text-sm">AI-Discovered Leads</label></div>
                                <div class="flex items-center"><input id="filter-courts-desktop" type="checkbox" v-model="filters.courts" class="h-4 w-4 rounded text-indigo-600 focus:ring-indigo-500" /><label for="filter-courts-desktop" class="ml-2 block text-sm">Projects</label></div>
                                <div class="flex items-center"><input id="filter-leads-desktop" type="checkbox" v-model="filters.leads" class="h-4 w-4 rounded text-indigo-600 focus:ring-indigo-500" /><label for="filter-leads-desktop" class="ml-2 block text-sm">Acknowledged Leads</label></div>
                                <div class="flex items-center"><input id="filter-residential-desktop" type="checkbox" v-model="filters.residential" class="h-4 w-4 rounded text-indigo-600 focus:ring-indigo-500" /><label for="filter-residential-desktop" class="ml-2 block text-sm">Residential Prospects</label></div>
                            </div>
                        </div>
                        <div class="pt-3 border-t">
                             <label class="text-sm font-semibold text-slate-600">Client Opportunity Alerts</label>
                             <div class="mt-2 space-y-1">
                                <div class="flex items-center"><input id="filter-resurface-desktop" type="checkbox" v-model="filters.needsResurfacing" class="h-4 w-4 rounded text-red-600 focus:ring-red-500" /><label for="filter-resurface-desktop" class="ml-2 block text-sm">Needs Resurfacing</label></div>
                                <div class="flex items-center"><input id="filter-warranty-desktop" type="checkbox" v-model="filters.warrantyExpiring" class="h-4 w-4 rounded text-amber-600 focus:ring-amber-500" /><label for="filter-warranty-desktop" class="ml-2 block text-sm">Warranty Expiring</label></div>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
            <div class="relative">
                <button @click.stop="isHeatmapPanelOpen = !isHeatmapPanelOpen; isFilterPanelOpen = false" class="bg-white p-2 rounded-lg shadow-lg hover:bg-slate-50">
                    <Layers class="w-6 h-6 text-slate-700" />
                </button>
                 <div v-if="isHeatmapPanelOpen" @click.stop class="absolute top-full mt-2 w-72 bg-white/90 backdrop-blur-sm p-4 rounded-lg shadow-2xl border">
                    <h3 class="text-lg font-bold text-slate-800 mb-3">Heatmap Layers</h3>
                    <div class="space-y-2">
                        <div class="flex items-center"><input id="heatmap-none-desktop" name="heatmap" type="radio" value="none" v-model="activeHeatmap" class="h-4 w-4 text-indigo-600 focus:ring-indigo-500" /><label for="heatmap-none-desktop" class="ml-2 block text-sm">None</label></div>
                        <div class="flex items-center"><input id="heatmap-leads-desktop" name="heatmap" type="radio" value="leads" v-model="activeHeatmap" class="h-4 w-4 text-indigo-600 focus:ring-indigo-500" /><label for="heatmap-leads-desktop" class="ml-2 block text-sm">Lead Density</label></div>
                        <div class="flex items-center"><input id="heatmap-clients-desktop" name="heatmap" type="radio" value="clients" v-model="activeHeatmap" class="h-4 w-4 text-indigo-600 focus:ring-indigo-500" /><label for="heatmap-clients-desktop" class="ml-2 block text-sm">Client Concentration</label></div>
                    </div>
                </div>
            </div>
        </div>

        <div class="hidden md:block absolute bottom-4 left-4 z-[1000] bg-white/90 backdrop-blur-sm p-4 rounded-lg shadow-lg border w-64">
            <h4 class="font-bold text-sm mb-3">Legend</h4>
            <div class="flex flex-col space-y-3 text-xs text-slate-700">
                <div class="pt-3 border-t border-slate-200/80">
                    <p class="font-semibold mb-2 uppercase text-slate-500 text-[10px] tracking-wider">Client Projects</p>
                    <ul class="flex flex-col space-y-2">
                        <li class="flex items-center"><span class="legend-icon icon-client"></span> Standard Client</li>
                        <li class="flex items-center"><span class="legend-icon icon-client-alert-warranty"></span> Warranty Expiring</li>
                        <li class="flex items-center"><span class="legend-icon icon-client-alert-resurface"></span> Resurfacing Due</li>
                    </ul>
                </div>
                <div class="pt-3 border-t border-slate-200/80">
                    <p class="font-semibold mb-2 uppercase text-slate-500 text-[10px] tracking-wider">Prospects & Leads</p>
                    <ul class="flex flex-col space-y-2">
                         <li class="flex items-center"><span class="legend-icon icon-ai-lead"><div class="icon-inner"></div></span> AI Lead</li>
                        <li class="flex items-center"><span class="legend-icon icon-permit"></span> Permit Lead</li>
                        <li class="flex items-center"><span class="legend-icon icon-news"></span> News Lead</li>
                        <li class="flex items-center"><span class="legend-icon icon-faded"></span> Worn Court</li>
                    </ul>
                </div>
            </div>
        </div>
        
    </div>
</template>

<style scoped>
:global(.icon-base.icon-ai-lead) {
    background-color: var(--color-icon-permit);
    border: 3px solid white;
    box-shadow: 0 0 0 2px var(--color-icon-permit);
    display: flex;
    align-items: center;
    justify-content: center;
}
:global(.icon-base.icon-ai-lead .icon-inner) {
    width: 8px;
    height: 8px;
    background-color: white;
    border-radius: 50%;
}
:global(.map-marker-ping) {
    animation: map-ping 1.5s ease-out infinite;
}
@keyframes map-ping {
    0% { transform: scale(0.95); box-shadow: 0 0 0 0 rgba(139, 92, 246, 0.7); }
    70% { transform: scale(1); box-shadow: 0 0 0 12px rgba(139, 92, 246, 0); }
    100% { transform: scale(0.95); box-shadow: 0 0 0 0 rgba(139, 92, 246, 0); }
}

/* New Alert Icon Styles */
:global(.icon-client-alert-resurface) {
    box-shadow: 0 0 0 3px #dc2626; /* Red-600 */
}
:global(.icon-client-alert-warranty) {
    box-shadow: 0 0 0 3px #f59e0b; /* Amber-500 */
}


.legend-icon {
    display: inline-flex;
    align-items: center;
    justify-content: center;
    border-radius: 50%;
    width: 20px;
    height: 20px;
    flex-shrink: 0;
    margin-right: 8px;
    border: 2px solid;
    position: relative;
}
.legend-icon.icon-bright { border-color: var(--color-icon-bright); }
.legend-icon.icon-faded { border-color: var(--color-icon-faded); }
.legend-icon.icon-client { border-color: var(--color-icon-client); }
.legend-icon.icon-client-due { border-color: var(--color-icon-client); background-color: #fee2e2; }
.legend-icon.icon-permit { border-color: var(--color-icon-permit); }
.legend-icon.icon-news { border-color: var(--color-icon-news); }
.legend-icon.icon-ai-lead { background-color: var(--color-icon-permit); border-color: white; }
.legend-icon .icon-inner {
    width: 6px;
    height: 6px;
    background-color: white;
    border-radius: 50%;
}

/* New Legend Alert Styles */
.legend-icon.icon-client-alert-resurface {
    border-color: var(--color-icon-client);
    box-shadow: 0 0 0 2px #dc2626;
}
.legend-icon.icon-client-alert-warranty {
    border-color: var(--color-icon-client);
    box-shadow: 0 0 0 2px #f59e0b;
}

</style>

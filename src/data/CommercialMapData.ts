<template>
    <div class="relative h-full w-full rounded-lg shadow-lg overflow-hidden">
        <div id="combined-map" class="h-full w-full"></div>

        <!-- Dynamic Controls -->
        <div class="absolute top-4 left-4 z-[1000] bg-slate-800 bg-opacity-80 p-3 rounded-lg shadow-lg backdrop-blur-sm">
            <h3 class="text-white font-semibold mb-2 text-lg">
                <template v-if="mode === 'residential'">Residential Prospecting</template>
                <template v-else>Map Filters</template>
            </h3>
            
            <!-- Residential-specific Controls -->
            <div v-if="mode === 'residential'" class="space-y-3">
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

            <!-- Commercial-specific Controls -->
            <div v-else class="space-y-2">
                <div v-for="type in Object.keys(filters)" :key="type" class="flex items-center">
                    <input :id="`filter-${type}`" v-model="filters[type]"
                        class="h-4 w-4 rounded bg-slate-600 border-slate-500 text-sky-500 focus:ring-sky-500"
                        type="checkbox" />
                    <label :for="`filter-${type}`" class="ml-2 text-white capitalize">{{ type.replace(/([A-Z])/g, ' $1').trim()
                        }}</label>
                </div>
                 <button @click="toggleHeatmap"
                    class="w-full mt-3 bg-slate-700 hover:bg-slate-600 text-white font-semibold py-2 px-3 rounded-lg shadow-md flex items-center justify-center transition-colors duration-200 focus:outline-none focus:ring-2 focus:ring-sky-500">
                    <i data-lucide="thermometer-sun" class="lucide lucide-thermometer-sun mr-2"></i>
                    {{ heatmapVisible ? 'Hide' : 'Show' }} Heatmap
                </button>
                <button @click="scanMap"
                    class="w-full mt-3 bg-sky-600 hover:bg-sky-500 text-white font-semibold py-2 px-3 rounded-lg shadow-md flex items-center justify-center transition-colors duration-200 focus:outline-none focus:ring-2 focus:ring-sky-500">
                    <i data-lucide="scan-search" class="lucide lucide-scan-search mr-2"></i>
                    Scan Map
                </button>
            </div>
        </div>
        
        <!-- Dynamic Legend -->
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

        <!-- Dynamic Right Sidebar -->
         <aside class="hidden md:w-96 md:flex bg-white border-l border-slate-200 flex-col flex-shrink-0">
            <div class="p-4 border-b border-slate-200 flex-shrink-0">
                <h3 class="text-xl font-bold text-slate-800">
                    <template v-if="mode === 'residential'">Prospecting</template>
                    <template v-else>Map Data</template>
                </h3>
                <div class="mt-2 border-b border-slate-200" v-if="mode === 'residential'">
                    <nav class="-mb-px flex space-x-4" aria-label="Tabs">
                        <button @click="activeSidebarTab = 'results'" :class="['px-3 py-2 font-medium text-sm rounded-t-md border-b-2', activeSidebarTab === 'results' ? 'border-indigo-500 text-indigo-600' : 'border-transparent text-slate-500 hover:text-slate-700']">
                            Scan Results 
                            <span v-if="residentialResults.length > 0" class="ml-1 px-2 py-0.5 bg-indigo-100 text-indigo-600 rounded-full text-xs">{{ residentialResults.length }}</span>
                        </button>
                        <button @click="activeSidebarTab = 'saved'" :class="['px-3 py-2 font-medium text-sm rounded-t-md border-b-2', activeSidebarTab === 'saved' ? 'border-indigo-500 text-indigo-600' : 'border-transparent text-slate-500 hover:text-slate-700']">
                            Saved Prospects 
                            <span v-if="savedResidentialProspects.length > 0" class="ml-1 px-2 py-0.5 bg-slate-200 text-slate-600 rounded-full text-xs">{{ savedResidentialProspects.length }}</span>
                        </button>
                    </nav>
                </div>
            </div>
            
            <div class="flex-1 overflow-y-auto min-h-0">
                <div v-if="mode === 'residential'">
                    <div v-if="activeSidebarTab === 'results'">
                        <div v-if="scanStatus === 'idle'" class="flex flex-col items-center justify-center text-center p-6 text-slate-500 h-full">
                            <i data-lucide="mouse-pointer-square" class="w-16 h-16 text-slate-400"></i>
                            <p class="mt-4 font-semibold">Navigate or Select an Area</p>
                            <p>Pan the map and click "Scan", or select a custom area to begin prospecting.</p>
                        </div>
                        
                        <ul v-if="scanStatus === 'complete'" class="divide-y divide-slate-200">
                            <li v-for="prospect in residentialResults" :key="prospect.id" :data-prospect-id="prospect.id" @mouseenter="onListItemEnter(prospect.id)" @mouseleave="onListItemLeave" :class="{'bg-indigo-50 ring-1 ring-indigo-200': prospect.id === highlightedProspectId}" class="p-4 group cursor-pointer transition-all duration-150 rounded-l-lg">
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

                <div v-else>
                    <!-- Commercial / InteractiveMap content -->
                    <ul class="divide-y divide-slate-200">
                        <li v-for="prospect in filteredCommercialProspects" :key="prospect.id">
                            <button @click="() => openProspectModal(prospect)" class="w-full text-left p-4 hover:bg-slate-50 transition-colors">
                                <h3 class="font-bold text-slate-800">{{ prospect.name }}</h3>
                                <p class="text-sm text-slate-600 capitalize">{{ prospect.type }}</p>
                                <p class="text-xs text-slate-500 mt-1">{{ prospect.aiSummary || prospect.status }}</p>
                            </button>
                        </li>
                    </ul>
                </div>
            </div>
        </aside>

        <!-- Prospect Detail Modal -->
        <div v-if="isModalOpen" class="fixed inset-0 bg-black bg-opacity-60 z-[1000] flex items-center justify-center p-4" @click="isModalOpen = false">
            <div @click.stop class="bg-white rounded-lg shadow-2xl w-full max-w-2xl max-h-[90vh] flex flex-col animate-fade-in-up" v-if="selectedProspect">
                <header class="p-4 border-b flex justify-between items-center flex-shrink-0">
                    <div>
                        <h2 class="text-lg font-bold text-slate-800">{{ selectedProspect.homeowner || selectedProspect.name }}</h2>
                        <p class="text-sm text-slate-500">{{ selectedProspect.address }}</p>
                    </div>
                    <button @click="isModalOpen = false" class="text-slate-500 hover:text-slate-800 p-1 rounded-full"><i data-lucide="x" class="w-6 h-6"></i></button>
                </header>

                <div class="p-6 flex-1 overflow-y-auto space-y-4">
                    <!-- Prospect Details -->
                    <div class="grid grid-cols-3 gap-4 text-sm">
                        <div class="bg-slate-50 p-3 rounded-lg text-center">
                            <p class="text-xs font-semibold text-slate-500 uppercase">Court Type</p>
                            <p class="font-bold text-slate-800 text-base">{{ selectedProspect.courtType || selectedProspect.type }}</p>
                        </div>
                        <div class="bg-slate-50 p-3 rounded-lg text-center">
                            <p class="text-xs font-semibold text-slate-500 uppercase">Condition</p>
                            <p class="font-bold text-base" :class="selectedProspect.status === 'good' ? 'text-green-600' : 'text-amber-600'">{{ selectedProspect.conditionScore || 'N/A' }} / 10</p>
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
    </div>
</template>

<script setup lang="ts">
import { onMounted, ref, watch, computed, nextTick, onUnmounted } from 'vue';
import PrimaryButton from '@/components/PrimaryButton.vue';
import 'leaflet/dist/leaflet.css';
import L from 'leaflet';
import 'leaflet.heat';
import 'leaflet-draw';
import { createIcons, icons } from 'lucide';
import { View } from '@/types';
import { Building2, Newspaper, FileText, Home, Sparkles, LocateFixed, ScanSearch, Edit3, ThermometerSun, X, MousePointerSquare, BookmarkMinus, CheckCircle2, BookmarkPlus } from 'lucide-vue-next';

// --- Hardcoded SVG paths for Lucide icons ---
const lucideIcons = {
  Building2: '<path d="M6 22V4a2 2 0 0 1 2-2h8a2 2 0 0 1 2 2v18"/><path d="M6 12H4a2 2 0 0 0-2 2v6a2 2 0 0 0 2 2h2"/><path d="M18 9h2a2 2 0 0 1 2 2v9a2 2 0 0 1-2 2h-2"/><path d="M10 6h4"/><path d="M10 10h4"/><path d="M10 14h4"/><path d="M10 18h4"/>',
  Newspaper: '<path d="M4 22h16a2 2 0 0 0 2-2V4a2 2 0 0 0-2-2H8a2 2 0 0 0-2 2v16a2 2 0 0 1-2 2Zm0 0a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h4"/><path d="M4 9h16"/><path d="M4 15h16"/><path d="M10 9v6"/><path d="M16 9v6"/>',
  FileText: '<path d="M15 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V7Z"/><path d="M14 2v4a2 2 0 0 0 2 2h4"/><path d="M10 9H8"/><path d="M16 13H8"/><path d="M16 17H8"/>',
  Home: '<path d="m3 9 9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z"/><polyline points="9 22 9 12 15 12 15 22"/>',
  Sparkles: '<path d="m12 3-1.912 5.813a2 2 0 0 1-1.275 1.275L3 12l5.813 1.912a2 2 0 0 1 1.275 1.275L12 21l1.912-5.813a2 2 0 0 1 1.275-1.275L21 12l-5.813-1.912a2 2 0 0 1-1.275-1.275L12 3Z"/><path d="M5 3v4"/><path d="M19 17v4"/><path d="M3 5h4"/><path d="M17 19h4"/>',
  LocateFixed: '<path d="M2 12s2-3 6-3 6 3 6 3"/><path d="M12 2s-3 2-3 6 3 6 3 6"/><path d="M22 12s-2-3-6-3-6 3-6 3"/><path d="M12 22s3-2 3-6-3-6-3-6"/>',
  ScanSearch: '<path d="M3 7V5a2 2 0 0 1 2-2h2"/><path d="M17 3h2a2 2 0 0 1 2 2v2"/><path d="M21 17v2a2 2 0 0 1-2 2h-2"/><path d="M7 21H5a2 2 0 0 1-2-2v-2"/><path d="M11 12a3 3 0 1 0 0-6 3 3 0 0 0 0 6Z"/><path d="m13.5 13.5 2.5 2.5"/>',
  Edit3: '<path d="M12 20h9"/><path d="M16.5 3.5a2.12 2.12 0 0 1 3 3L7 19l-4 1 1-4Z"/><path d="m15 5 3 3"/>',
  ThermometerSun: '<path d="M12 9a4 4 0 0 0-2 7.5"/><path d="M12 3v2"/><path d="M6.6 18.4 4.5 20.5"/><path d="M18 2a2 2 0 0 1 2 2v10.5a4 4 0 1 1-4 0V4a2 2 0 0 1 2-2Z"/><path d="m2 14 2.1 2.1"/><path d="M22 14h-2"/><path d="M18 6h2"/><path d="M7 4h3"/>',
  X: '<path d="M18 6 6 18"/><path d="m6 6 12 12"/>',
  MousePointerSquare: '<path d="M3 3h18v18H3z"/><path d="m14 14 5-5m0 0v5m0-5h-5"/>',
  BookmarkMinus: '<path d="m19 21-7-4-7 4V5a2 2 0 0 1 2-2h10a2 2 0 0 1 2 2v16z"/><line x1="15" x2="9" y1="10" y2="10"/>',
  CheckCircle2: '<circle cx="12" cy="12" r="10"/><path d="m9 12 2 2 4-4"/>',
  BookmarkPlus: '<path d="m19 21-7-4-7 4V5a2 2 0 0 1 2-2h10a2 2 0 0 1 2 2v16z"/><line x1="12" x2="12" y1="7" y2="15"/><line x1="16" x2="8" y1="11" y2="11"/>',
};

// --- Props ---
const props = defineProps<{
    prospects: any[];
    focusedProspectId?: string | null;
    mode: 'residential' | 'commercial';
}>();

const emit = defineEmits(['setCurrentView', 'addProspect', 'removeProspect', 'updateProspect']);

// --- Refs ---
const mapContainerRef = ref<HTMLElement | null>(null);
const map = ref<L.Map | null>(null);
const markerLayer = ref<L.LayerGroup>(L.layerGroup());
const heatmapLayer = ref<L.HeatLayer | null>(null);
const drawnItems = ref<L.FeatureGroup | null>(null);
const drawControl = ref<any>(null);
let markerRefs: { [key: string]: L.Marker } = {};
let resizeObserver: ResizeObserver | null = null;

const heatmapVisible = ref(false);
const filters = ref<Record<string, boolean>>({});

const scanStatus = ref<'idle' | 'scanning' | 'complete'>('idle');
const residentialResults = ref<any[]>([]);
const activeSidebarTab = ref('results');
const selectedProspect = ref<any | null>(null);
const isModalOpen = ref(false);
const isGeneratingEmail = ref(false);
const generatedEmail = ref('');
const searchQuery = ref('');
const highlightedProspectId = ref<string | null>(null);
const drawnAreaGeoJSON = ref<any>(null);
const scanMethod = ref<'view' | 'draw'>('view');

// --- COMPUTED PROPERTIES ---
const currentProspects = computed(() => props.prospects);
const filteredCommercialProspects = computed(() => {
    const activeTypes = Object.entries(filters.value)
        .filter(([, isActive]) => isActive)
        .map(([type]) => type);
    
    if (activeTypes.length === 0) return currentProspects.value.filter(p => p.type === 'commercial_court');

    return currentProspects.value.filter(p => activeTypes.includes(p.type));
});

const savedResidentialProspects = computed(() => currentProspects.value.filter(p => p.type === 'residential'));

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
            { label: 'Good Condition', icon: Home, class: 'icon-residential-good' },
            { label: 'Worn Condition', icon: Home, class: 'icon-residential-worn' },
        ];
    } else {
        return [
            { label: 'Client', icon: Building2, class: 'icon-client' },
            { label: 'News', icon: Newspaper, class: 'icon-news icon-client-due' },
            { label: 'Permit', icon: FileText, class: 'icon-permit' },
            { label: 'AI Prospect', icon: Sparkles, class: 'icon-bright' },
        ];
    }
});

// --- HELPER FUNCTIONS ---
const initializeFilters = () => {
    if (props.mode === 'commercial') {
        const prospectTypes = new Set(props.prospects.filter(p => p.type !== 'residential').map(p => p.type));
        const newFilters: Record<string, boolean> = {};
        prospectTypes.forEach(type => {
            newFilters[type] = true;
        });
        filters.value = newFilters;
    }
};

const getIconForProspect = (prospect: any) => {
    const iconWrapper = document.createElement('div');
    iconWrapper.className = 'icon-base';

    let iconSvgContent = '';
    let iconComponent = Sparkles;
    switch (prospect.type) {
        case 'news':
            iconWrapper.className += ' icon-news';
            iconSvgContent = lucideIcons.Newspaper;
            iconComponent = Newspaper;
            break;
        case 'permit':
            iconWrapper.className += ' icon-permit';
            iconSvgContent = lucideIcons.FileText;
            iconComponent = FileText;
            break;
        case 'residential':
             iconWrapper.className += prospect.status === 'good' ? ' icon-residential-good' : ' icon-residential-worn';
             iconSvgContent = lucideIcons.Home;
             iconComponent = Home;
             break;
        default:
            if (prospect.isClient) {
                 iconWrapper.className += ' icon-client';
                 iconSvgContent = lucideIcons.Building2;
                 iconComponent = Building2;
            } else {
                 iconWrapper.className += ' icon-bright';
                 iconSvgContent = lucideIcons.Sparkles;
                 iconComponent = Sparkles;
            }
            break;
    }

    if (prospect.isDue) {
      iconWrapper.className += ' icon-client-due';
    }

    // Since we're using lucide-vue-next components, we don't need to manually inject SVG content
    const html = `<div class="icon-base ${iconWrapper.className}"><i data-lucide="${iconComponent.name.toLowerCase()}" class="w-5 h-5"></i></div>`;

    return L.divIcon({
        html,
        className: '',
        iconSize: [32, 32],
        iconAnchor: [16, 16],
    });
};

const createPopupContent = (prospect: any): string => {
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
};

const getStatusClass = (status: string) => `status-${status.replace(' Sent', '').replace(' ', '-')}`;

// --- MAP RENDERING & INTERACTIVITY ---
const updateMarkers = () => {
    if (!map.value || !markerLayer.value) return;

    markerLayer.value.clearLayers();
    
    const relevantProspects = props.mode === 'residential' ? residentialResults.value : filteredCommercialProspects.value;

    relevantProspects
        .filter(p => p.coords)
        .forEach(prospect => {
            const marker = L.marker(prospect.coords, { icon: getIconForProspect(prospect) })
                .addTo(markerLayer.value)
                .bindPopup(createPopupContent(prospect));
            
            markerRefs[prospect.id] = marker;

            marker.on('popupopen', (e) => {
                const button = e.popup.getElement()?.querySelector('.view-details-button');
                button?.addEventListener('click', () => {
                    const prospectId = button.getAttribute('data-prospect-id');
                    if(prospectId) {
                        emit('setCurrentView', View.ProjectHub, { prospectId });
                    }
                });
                nextTick(() => createIcons({ icons }));
            });

            if (props.focusedProspectId === prospect.id) {
                (marker as any)._icon.classList.add('map-marker-highlight', 'map-marker-ping');
                 setTimeout(() => {
                    (marker as any)?._icon.classList.remove('map-marker-ping');
                }, 500);
            }
        });
    nextTick(() => createIcons({ icons }));
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

const handleScan = () => {
    if (!map.value || scanStatus.value === 'scanning') return;
    map.value.invalidateSize();
    const bounds = map.value.getBounds();
    if (!bounds?.isValid() || bounds.getSouthWest().equals(bounds.getNorthEast())) {
        alert("Could not determine map area. Please pan the map slightly and try again.");
        return;
    }
    executeScan(bounds);
};

const handleScanSelection = () => {
    if (!map.value || scanStatus.value === 'scanning' || !drawnAreaGeoJSON.value) return;
    const layer = L.geoJSON(drawnAreaGeoJSON.value);
    executeScan(layer.getBounds(), drawnAreaGeoJSON.value);
};

const handlePrimaryScan = () => {
    if (scanMethod.value === 'draw') {
        handleScanSelection();
    } else {
        handleScan();
    }
};

const openProspectModal = (prospect: any) => {
    const savedVersion = props.prospects.find(p => p.id === prospect.id);
    selectedProspect.value = savedVersion || prospect;
    isModalOpen.value = true;
    generatedEmail.value = '';
};

const saveProspect = (prospectToSave: any) => {
    const prospectWithStatus = {
        ...prospectToSave,
        status: 'New',
        notes: ''
    };
    emit('addProspect', prospectWithStatus);
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

const isSaved = (prospectId: string) => {
    return props.prospects.some(p => p.id === prospectId);
};

// Mock data generation (Moved from ResidentialProspecting.vue)
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

const generateMockProspects = (bounds: any, polygonGeoJSON: any = null): any[] => {
    const FIRST_NAMES = ['John', 'Jane', 'Robert', 'Emily'];
    const LAST_NAMES = ['Smith', 'Johnson', 'Williams', 'Brown'];
    const STREET_NAMES = ['Ocotillo', 'Mesquite', 'Palo Verde', 'Saguaro'];
    const STREET_TYPES = ['Rd', 'Ln', 'Dr', 'Ct'];
    const COURT_TYPES = ['Tennis', 'Pickleball', 'Basketball'];

    const numResults = Math.floor(Math.random() * 8) + 5;
    const prospects: any[] = [];
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

const executeScan = (bounds: L.LatLngBounds, geojson: any = null) => {
    const currentMap = map.value;
    if (!currentMap) return;
    scanStatus.value = 'scanning';
    residentialResults.value = [];
    markerRefs = {};
    markerLayer.value?.clearLayers();
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
            residentialResults.value.push(prospect);
            nextTick(() => {
                const iconClass = `icon-base map-marker-ping icon-residential-${prospect.status}`;
                const icon = L.divIcon({ 
                    className: iconClass,
                    html: `<i data-lucide="home" class="w-5 h-5" stroke-width="2"></i>`, 
                    iconSize: [32, 32], iconAnchor: [16, 16]
                });
                const marker = L.marker(prospect.coords, { icon: icon });
                
                if (markerLayer.value) markerLayer.value.addLayer(marker);

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

const handleSaveProspectUpdates = () => {
    if (selectedProspect.value) {
      emit('updateProspect', selectedProspect.value);
    }
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


// --- LIFECYCLE & WATCHERS ---
onMounted(() => {
    if (mapContainerRef.value && !map.value) {
        map.value = L.map('combined-map').setView([33.48, -112.0740], 11);
        L.control.zoom({ position: 'topright' }).addTo(map.value);

        const satelliteLayer = L.tileLayer('https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}', {
            attribution: 'Tiles &copy; Esri',
            maxZoom: 19
        });
        const streetLayer = L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
            attribution: '&copy; OpenStreetMap contributors'
        });
        
        const baseMaps = { "Satellite": satelliteLayer, "Street": streetLayer };
        satelliteLayer.addTo(map.value);
        L.control.layers(baseMaps, undefined, { position: 'topright' }).addTo(map.value);

        markerLayer.value.addTo(map.value);
        drawnItems.value = new L.FeatureGroup().addTo(map.value);

        drawControl.value = new (L.Control as any).Draw({
            draw: { polygon: { shapeOptions: { color: '#4f46e5' } }, polyline: false, rectangle: false, circle: false, marker: false, circlemarker: false },
            edit: { featureGroup: drawnItems.value, remove: false, edit: false }
        });

        map.value.on(L.Draw.Event.CREATED, (event: any) => {
            if (drawnItems.value) {
                drawnItems.value.clearLayers();
                drawnItems.value.addLayer(event.layer);
            }
            drawnAreaGeoJSON.value = event.layer.toGeoJSON();
        });

        resizeObserver = new ResizeObserver(() => map.value?.invalidateSize({ debounceMoveend: true }));
        resizeObserver.observe(mapContainerRef.value);

        initializeFilters();
        updateMarkers();
        
        nextTick(() => createIcons({ icons: { ...lucideIcons, ...icons } }));
    }
});

onUnmounted(() => {
    resizeObserver?.disconnect();
    if (map.value) {
        map.value.remove();
        map.value = null;
    }
});

watch([() => props.prospects, () => props.mode, filters], updateMarkers, { deep: true });
watch(() => props.focusedProspectId, updateMarkers);
</script>

<style>
#combined-map {
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

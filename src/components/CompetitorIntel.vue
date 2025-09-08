<script setup lang="ts">
import { ref, computed, onMounted, watch, nextTick } from 'vue';
import { 
    Target, 
    TrendingUp,
    ArrowUp,
    ArrowDown,
    Minus,
    Sparkles,
    FileText,
    Megaphone,
    AlertCircle,
    Gavel,
    CheckCircle2,
    XCircle,
    MinusCircle,
    Building2,
    Plus,
    Search,
    Trash2,
    Users
} from 'lucide-vue-next';
import { Chart, registerables } from 'chart.js';

Chart.register(...registerables);

// --- FIX: All necessary data is now moved directly into this component to bypass caching issues ---

const ALL_COMPETITOR_NAMES = ["Ace Resurfacing Co.", "Sunstate Courts", "C&S Sport Surfaces", "Pro Courts Arizona", "Arizona Court Masters"];

const CONTRACTOR_STATUS_DATA = [
    { id: 'comp1', name: "Ace Resurfacing Co.", licenseNumber: "AZ-123456", status: "Active", violations: [], lawsuits: [] },
    { id: 'comp2', name: "Sunstate Courts", licenseNumber: "AZ-654321", status: "Active", violations: [], lawsuits: [] },
    { id: 'comp3', name: "C&S Sport Surfaces", licenseNumber: "AZ-789012", status: "Suspended", violations: [{ date: "07/15/2025", description: "Failure to complete project", resolution: "License suspended pending review" }], lawsuits: [] },
    { id: 'comp4', name: "Pro Courts Arizona", licenseNumber: "AZ-345678", status: "Active", violations: [], lawsuits: [{ caseNumber: "CV-2025-001234", filingDate: "06/20/2025", court: "Maricopa Superior Court", description: "Breach of contract dispute with a supplier.", status: "Active" }] },
    { id: 'comp5', name: "Arizona Court Masters", licenseNumber: "N/A", status: "Pending", violations: [], lawsuits: [] }
];

const COMPETITOR_INTEL_EVENTS = {
  'comp1': [
    { id: 1, type: 'License Update', date: '2025-09-06', summary: 'Contractor license renewed with the AZ ROC.', details: 'ROC #12345 renewed for 2 years, no changes in classification.' },
    { id: 2, type: 'New Ad Campaign', date: '2025-09-04', summary: 'Launched a new Google Ads campaign targeting "pickleball court resurfacing Phoenix".', details: 'Ad copy focuses on a "24-hour quote guarantee". Budget appears to be moderate.' },
  ],
  'comp2': [
    { id: 4, type: 'Permit Filed', date: '2025-09-05', summary: 'Filed a commercial permit with the City of Glendale for a new multi-court facility.', details: 'Permit #GL-2025-08-112 for "athletic court construction". Valuation: $250,000.' },
  ],
  'comp3': [
    { id: 6, type: 'SEO Ranking Change', date: '2025-09-02', summary: 'Lost ranking for "running track repair", dropping off the first page.', details: 'AI Analysis: Their website\'s page on track maintenance has not been updated in over a year.' },
  ],
};

const COMPETITOR_SEO_DATA = {
  keywords: ['tennis court resurfacing phoenix', 'pickleball court construction az', 'running track repair arizona'],
  rankings: [
      { competitor: 'Ace Resurfacing Co.', keyword: 'tennis court resurfacing phoenix', rank: 2, change: 1, url: '/services/tennis-resurfacing' },
      { competitor: 'Sunstate Courts', keyword: 'tennis court resurfacing phoenix', rank: 5, change: -1, url: '/tennis-courts' },
      { competitor: 'C&S Sport Surfaces', keyword: 'tennis court resurfacing phoenix', rank: 6, change: 0, url: '/portfolio/phoenix-courts' },
      { competitor: 'Ace Resurfacing Co.', keyword: 'pickleball court construction az', rank: 3, change: 0, url: '/pickleball' },
      { competitor: 'Sunstate Courts', keyword: 'pickleball court construction az', rank: 1, change: 0, url: '/services/pickleball-construction' },
      { competitor: 'C&S Sport Surfaces', keyword: 'running track repair arizona', rank: 9, change: -2, url: '/services/tracks' },
  ],
  history: {
      'tennis court resurfacing phoenix': {
          labels: ['June', 'July', 'August', 'September'],
          datasets: [ { label: 'Ace Resurfacing Co.', data: [4, 3, 3, 2] }, { label: 'Sunstate Courts', data: [5, 5, 4, 5] }, { label: 'C&S Sport Surfaces', data: [6, 6, 6, 6] }, ]
      },
      'pickleball court construction az': {
          labels: ['June', 'July', 'August', 'September'],
          datasets: [ { label: 'Ace Resurfacing Co.', data: [3, 3, 3, 3] }, { label: 'Sunstate Courts', data: [1, 1, 1, 1] }, ]
      },
       'running track repair arizona': {
          labels: ['June', 'July', 'August', 'September'],
          datasets: [ { label: 'C&S Sport Surfaces', data: [7, 7, 7, 9] }, ]
      }
  }
};


// --- PROPS & EMITS ---
const props = defineProps<{
  trackedCompetitors: string[];
}>();

const emit = defineEmits(['updateTrackedCompetitors']);

// --- STATE ---
const activeTab = ref('Activity');
const selectedCompetitorName = ref(props.trackedCompetitors[0] || null);
const selectedKeyword = ref(COMPETITOR_SEO_DATA.keywords[0]);
const chartCanvas = ref<HTMLCanvasElement | null>(null);
let seoChart: Chart | null = null;
const searchTerm = ref('');

// --- COMPUTED PROPERTIES ---
const selectedCompetitorDetails = computed(() => {
    if (!selectedCompetitorName.value) return null;
    return CONTRACTOR_STATUS_DATA.find(c => c.name === selectedCompetitorName.value);
});
const selectedCompetitorIntel = computed(() => {
    if (!selectedCompetitorDetails.value) return [];
    return (COMPETITOR_INTEL_EVENTS as any)[selectedCompetitorDetails.value.id] || [];
});
const filteredCompetitors = computed(() => {
  if (!searchTerm.value) return [];
  return ALL_COMPETITOR_NAMES.filter(name => 
    !props.trackedCompetitors.includes(name) &&
    name.toLowerCase().includes(searchTerm.value.toLowerCase())
  );
});
const currentRankings = computed(() => {
  return COMPETITOR_SEO_DATA.rankings.filter(r => r.keyword === selectedKeyword.value)
    .sort((a, b) => a.rank - b.rank);
});
const chartData = computed(() => {
    if (!selectedKeyword.value) return null;
    return (COMPETITOR_SEO_DATA.history as any)[selectedKeyword.value];
});
const aiSummary = computed(() => {
    switch(selectedKeyword.value) {
        case 'tennis court resurfacing phoenix':
            return "Ace Resurfacing is showing strong upward momentum. Sunstate Courts' ranking dipped, indicating a potential opening.";
        case 'pickleball court construction az':
            return "Sunstate Courts holds a dominant #1 position. Ace Resurfacing is a consistent contender.";
        case 'running track repair arizona':
            return "C&S Sport Surfaces has lost significant ground. This presents a major opportunity to capture market share.";
        default: return "Select a keyword for AI-powered insights."
    }
});

// --- METHODS ---
const addCompetitor = (competitorName: string) => {
  if (!props.trackedCompetitors.includes(competitorName)) {
    const newList = [...props.trackedCompetitors, competitorName];
    emit('updateTrackedCompetitors', newList);
    searchTerm.value = '';
    if (!selectedCompetitorName.value) {
        selectedCompetitorName.value = competitorName;
    }
  }
};
const removeCompetitor = (competitorName: string) => {
  const newList = props.trackedCompetitors.filter(name => name !== competitorName);
  emit('updateTrackedCompetitors', newList);
  if (selectedCompetitorName.value === competitorName) {
    selectedCompetitorName.value = newList[0] || null;
  }
};
const getStatusIcon = (status: string) => {
    switch(status) {
        case 'Active': return CheckCircle2;
        case 'Suspended': return XCircle;
        case 'Pending': return MinusCircle;
        default: return AlertCircle;
    }
};
const getIntelIcon = (type: string) => {
    switch(type) {
        case 'License Update': case 'Permit Filed': return FileText;
        case 'New Ad Campaign': return Megaphone;
        case 'SEO Ranking Change': return TrendingUp;
        default: return AlertCircle;
    }
};
const renderChart = () => {
    if (!chartCanvas.value || !chartData.value || !chartData.value.datasets) {
        return;
    }
    if (seoChart) seoChart.destroy();
    const colors = ['#4f46e5', '#14B8A6', '#f59e0b', '#3b82f6', '#8b5cf6'];
    seoChart = new Chart(chartCanvas.value, {
            type: 'line', data: { labels: chartData.value.labels, datasets: chartData.value.datasets.map((ds: any, index: number) => ({ label: ds.label, data: ds.data, borderColor: colors[index % colors.length], backgroundColor: colors[index % colors.length] + '1A', tension: 0.2, borderWidth: 2, pointBackgroundColor: colors[index % colors.length], pointRadius: 4, pointHoverRadius: 6, })) },
            options: { responsive: true, maintainAspectRatio: false, scales: { y: { reverse: true, beginAtZero: false, ticks: { stepSize: 1, callback: (value) => `#${value}` }, title: { display: true, text: 'Google Ranking' } }, x: { title: { display: true, text: 'Month (2025)' } } }, plugins: { legend: { position: 'bottom' }, tooltip: { callbacks: { label: (context) => `${context.dataset.label}: Rank #${context.raw}` } } } }
        });
};

onMounted(() => {
    if(activeTab.value === 'SEO') renderChart();
});
watch([selectedKeyword, activeTab], () => {
    if(activeTab.value === 'SEO') {
        nextTick(() => renderChart());
    }
});
</script>

<template>
    <div class="flex h-full bg-slate-50">
        <!-- Left Panel: Shared for both tabs -->
        <div class="w-1/3 border-r border-slate-200 h-full flex flex-col">
            <header class="p-4 border-b border-slate-200 flex-shrink-0">
                <h1 class="text-xl font-bold text-slate-800 flex items-center">
                    <Target class="w-6 h-6 mr-3 text-indigo-600" />
                    Competitor Intel
                </h1>
            </header>
            
            <div class="p-2 bg-slate-100 border-b border-slate-200 flex-shrink-0">
                <div class="flex space-x-2">
                    <button @click="activeTab = 'Activity'" :class="['flex-1 text-sm font-semibold py-1.5 rounded-md', activeTab === 'Activity' ? 'bg-white shadow-sm text-indigo-700' : 'text-slate-600 hover:bg-slate-200']">Activity Feed</button>
                    <button @click="activeTab = 'SEO'" :class="['flex-1 text-sm font-semibold py-1.5 rounded-md', activeTab === 'SEO' ? 'bg-white shadow-sm text-indigo-700' : 'text-slate-600 hover:bg-slate-200']">SEO Analysis</button>
                </div>
            </div>

            <!-- Conditional Left Panel Content -->
            <div v-if="activeTab === 'Activity'" class="flex-1 flex flex-col min-h-0">
                <div class="p-4 flex-shrink-0">
                     <div class="relative">
                        <input v-model="searchTerm" type="text" placeholder="Search to add..." class="w-full pl-10 pr-4 py-2 border border-slate-300 rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500" />
                        <Search class="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400" />
                    </div>
                    <div v-if="searchTerm && filteredCompetitors.length > 0" class="mt-2 bg-white border border-slate-200 rounded-md shadow-lg max-h-48 overflow-y-auto">
                        <div v-for="name in filteredCompetitors" :key="name" class="flex items-center justify-between p-2 hover:bg-slate-50">
                            <span class="text-sm font-medium text-slate-700">{{ name }}</span>
                            <button @click="addCompetitor(name)" class="p-1 rounded-full text-slate-400 hover:bg-indigo-100 hover:text-indigo-600">
                                <Plus class="w-4 h-4" />
                            </button>
                        </div>
                    </div>
                </div>
                <div class="flex-1 overflow-y-auto p-4 pt-0 space-y-2">
                     <p class="px-2 text-xs font-semibold text-slate-400 uppercase tracking-wider">Tracked Companies</p>
                    <div v-if="trackedCompetitors.length > 0">
                        <div v-for="name in trackedCompetitors" :key="name" 
                            @click="selectedCompetitorName = name"
                            :class="['flex items-center justify-between p-3 rounded-lg cursor-pointer transition-colors', selectedCompetitorName === name ? 'bg-indigo-100' : 'hover:bg-slate-100']">
                            <div class="flex items-center">
                                <div class="p-2 bg-slate-200 rounded-full mr-3"><Building2 class="w-5 h-5 text-slate-600" /></div>
                                <div>
                                    <p class="font-semibold text-slate-800">{{ name }}</p>
                                    <p class="text-xs text-slate-500 flex items-center">
                                        <component :is="getStatusIcon(CONTRACTOR_STATUS_DATA.find(c=>c.name === name)?.status || 'Pending')" 
                                            :class="['w-3 h-3 mr-1.5', {'text-green-500': CONTRACTOR_STATUS_DATA.find(c=>c.name === name)?.status === 'Active'}, {'text-red-500': CONTRACTOR_STATUS_DATA.find(c=>c.name === name)?.status === 'Suspended'}]" />
                                        License: {{ CONTRACTOR_STATUS_DATA.find(c=>c.name === name)?.status || 'Pending' }}
                                    </p>
                                </div>
                            </div>
                            <button @click.stop="removeCompetitor(name)" class="p-2 rounded-full text-slate-400 hover:bg-red-100 hover:text-red-600 transition-colors opacity-50 hover:opacity-100"><Trash2 class="w-4 h-4" /></button>
                        </div>
                    </div>
                    <div v-else class="text-center py-8 px-4 border-2 border-dashed border-slate-200 rounded-lg mt-4">
                        <Users class="w-10 h-10 mx-auto text-slate-300 mb-2" />
                        <h3 class="font-semibold text-slate-700">No Competitors Tracked</h3>
                        <p class="text-sm text-slate-500 mt-1">Use the search bar above to add a company.</p>
                    </div>
                </div>
            </div>
             <div v-if="activeTab === 'SEO'" class="p-4">
                <label for="keyword-select" class="block text-sm font-medium text-slate-700 mb-1">Select a Keyword to Analyze:</label>
                <select id="keyword-select" v-model="selectedKeyword" class="w-full rounded-md border-slate-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm">
                    <option v-for="kw in COMPETITOR_SEO_DATA.keywords" :key="kw" :value="kw">{{ kw }}</option>
                </select>
            </div>
        </div>

        <!-- Right Panel: Conditional Content -->
        <div class="w-2/3 h-full overflow-y-auto">
            <!-- Activity Feed View -->
            <div v-if="activeTab === 'Activity'">
                <div v-if="selectedCompetitorDetails" class="p-6 space-y-6">
                    <header>
                        <h2 class="text-2xl font-bold text-slate-800">{{ selectedCompetitorDetails.name }}</h2>
                        <p class="text-slate-500">Comprehensive Intelligence Report</p>
                    </header>
                    <div class="bg-white p-4 rounded-lg shadow-sm border border-slate-200">
                        <h3 class="font-bold text-slate-800 flex items-center mb-3"><FileText class="w-5 h-5 mr-2 text-slate-500"/> License & Legal Status</h3>
                        <div class="text-sm space-y-3">
                            <div class="flex justify-between items-center p-2 bg-slate-50 rounded-md">
                                <span class="font-semibold text-slate-600">License Status</span>
                                <span class="font-bold flex items-center px-2 py-0.5 rounded-full text-xs" :class="{
                                    'bg-green-100 text-green-700': selectedCompetitorDetails.status === 'Active',
                                    'bg-red-100 text-red-700': selectedCompetitorDetails.status === 'Suspended',
                                    'bg-amber-100 text-amber-700': selectedCompetitorDetails.status === 'Pending',
                                }">
                                     <component :is="getStatusIcon(selectedCompetitorDetails.status)" class="w-3 h-3 mr-1.5" />
                                    {{ selectedCompetitorDetails.status }}
                                </span>
                            </div>
                            <div v-if="selectedCompetitorDetails.violations.length > 0" class="p-2 bg-amber-50 border-l-4 border-amber-400">
                               <p class="font-semibold text-amber-800 flex items-center"><AlertCircle class="w-4 h-4 mr-2"/>Active Violations</p>
                               <p v-for="(v, i) in selectedCompetitorDetails.violations" :key="i" class="text-xs text-amber-700 mt-1 pl-6">{{ v.description }} ({{v.date}})</p>
                            </div>
                             <div v-if="selectedCompetitorDetails.lawsuits.length > 0" class="p-2 bg-rose-50 border-l-4 border-rose-400">
                               <p class="font-semibold text-rose-800 flex items-center"><Gavel class="w-4 h-4 mr-2"/>Active Lawsuits</p>
                               <p v-for="(l, i) in selectedCompetitorDetails.lawsuits" :key="i" class="text-xs text-rose-700 mt-1 pl-6">{{ l.description }} (Case: {{l.caseNumber}})</p>
                            </div>
                        </div>
                    </div>
                </div>
                <div v-else class="flex items-center justify-center h-full text-center text-slate-500">
                    <div>
                        <Target class="w-12 h-12 mx-auto text-slate-300 mb-2" />
                        <p>Select a competitor to view their activity feed.</p>
                    </div>
                </div>
            </div>
            <!-- SEO Analysis View -->
            <div v-if="activeTab === 'SEO'" class="p-6">
                 <div class="grid grid-cols-1 lg:grid-cols-5 gap-6">
                    <div class="lg:col-span-3 bg-white p-6 rounded-lg shadow-md border border-slate-200">
                         <h2 class="text-xl font-bold text-slate-800 mb-4">Historical Rankings</h2>
                         <div class="h-80"><canvas ref="chartCanvas"></canvas></div>
                    </div>
                    <div class="lg:col-span-2 space-y-6">
                         <div class="bg-white p-6 rounded-lg shadow-md border border-slate-200">
                            <h2 class="text-xl font-bold text-slate-800 mb-4">Current Rankings</h2>
                            <table class="w-full text-sm">
                                <thead class="text-left text-xs text-slate-500 uppercase border-b border-slate-200">
                                    <tr>
                                        <th class="p-2 text-center">Rank</th><th class="p-2">Company</th><th class="p-2 text-center">Change</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    <tr v-for="seo in currentRankings" :key="seo.competitor" class="border-b border-slate-100 last:border-b-0">
                                        <td class="p-2 text-center font-bold text-lg" :class="{'text-indigo-600': seo.rank <= 3}">{{ seo.rank }}</td>
                                        <td class="p-2 font-medium text-slate-700">
                                            <a :href="`#`" target="_blank" class="hover:underline hover:text-indigo-600">{{ seo.competitor }}</a>
                                        </td>
                                        <td class="p-2 text-center font-semibold flex items-center justify-center" :class="{'text-green-600': seo.change > 0, 'text-red-600': seo.change < 0, 'text-slate-400': seo.change === 0}">
                                            <ArrowUp v-if="seo.change > 0" class="w-4 h-4 mr-1"/><ArrowDown v-if="seo.change < 0" class="w-4 h-4 mr-1"/><Minus v-if="seo.change === 0" class="w-4 h-4 mr-1"/>
                                            <span>{{ seo.change !== 0 ? Math.abs(seo.change) : '' }}</span>
                                        </td>
                                    </tr>
                                </tbody>
                             </table>
                         </div>
                         <div class="bg-indigo-50 border-l-4 border-indigo-400 p-6 rounded-lg">
                            <h2 class="text-xl font-bold text-slate-800 flex items-center mb-2">
                                <Sparkles class="w-5 h-5 mr-2 text-indigo-600" />
                                AI Strategic Insights
                            </h2>
                            <p class="text-sm text-slate-700">{{ aiSummary }}</p>
                         </div>
                    </div>
                </div>
            </div>
        </div>
    </div>
</template>


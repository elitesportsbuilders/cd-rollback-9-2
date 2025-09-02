<script setup lang="ts">
import { ref, computed, onMounted, watch, nextTick } from 'vue';
import { LEAD_DATA, COMPETITORS, CONTRACTOR_STATUS_DATA, COMPETITOR_WEB_INTEL, COMPETITOR_SEO_DATA } from '@/data';
import { View } from '@/types';
import Card from '@/components/Card.vue';
import Tooltip from '@/components/Tooltip.vue';
import { Chart, registerables } from 'chart.js';
import { createIcons } from 'lucide';
Chart.register(...registerables);

const props = defineProps<{
  trackedCompetitors: string[];
}>();

const emit = defineEmits(['setCurrentView', 'updateTrackedCompetitors']);

const activeTab = ref('projects');
const isTabLoading = ref(false);
const newCompetitor = ref('');

// SEO State
const seoData = ref(COMPETITOR_SEO_DATA);
const trackedKeywords = ref(COMPETITOR_SEO_DATA.keywords);
const newKeyword = ref('');
const selectedKeywordForChart = ref(COMPETITOR_SEO_DATA.keywords[0]);
const seoChartRef = ref<HTMLCanvasElement | null>(null);
let seoChartInstance: any = null;

const changeTab = (tab: string) => {
    if (activeTab.value === tab) return;
    isTabLoading.value = true;
    activeTab.value = tab;
    setTimeout(() => {
        isTabLoading.value = false;
        nextTick(() => {
            createIcons();
            if (tab === 'seo') {
                renderChart();
            }
        });
    }, 500);
};

const handleAddCompetitor = () => {
    if (newCompetitor.value && !props.trackedCompetitors.includes(newCompetitor.value)) {
        emit('updateTrackedCompetitors', [...props.trackedCompetitors, newCompetitor.value]);
        newCompetitor.value = '';
    }
};

const handleRemoveCompetitor = (competitorToRemove: string) => {
    emit('updateTrackedCompetitors', props.trackedCompetitors.filter(c => c !== competitorToRemove));
};

const handleAddKeyword = () => {
    if (newKeyword.value && !trackedKeywords.value.includes(newKeyword.value)) {
        trackedKeywords.value.push(newKeyword.value);
        newKeyword.value = '';
    }
};

const handleRemoveKeyword = (keywordToRemove: string) => {
    trackedKeywords.value = trackedKeywords.value.filter(k => k !== keywordToRemove);
    if (selectedKeywordForChart.value === keywordToRemove) {
        selectedKeywordForChart.value = trackedKeywords.value[0] || '';
    }
};

const projectData = computed(() => {
    const permits = LEAD_DATA
        .filter(d => d.type === 'permit' && d.details?.contractor && COMPETITORS.includes(d.details.contractor));
    
    const counts = permits.reduce((acc: {[key: string]: number}, lead) => {
        const contractor = lead.details.contractor;
        acc[contractor] = (acc[contractor] || 0) + 1;
        return acc;
    }, {});
    const sorted = Object.entries(counts).sort(([, a], [, b]) => b - a);
    return {
        permits: permits.slice(0, 5),
        counts: sorted,
        totalPermits: permits.length,
    };
});

const contractorData = computed(() => {
    return {
        tracked: CONTRACTOR_STATUS_DATA.filter(c => c.status !== 'Pending'),
        newApplicants: CONTRACTOR_STATUS_DATA.filter(c => c.status === 'Pending')
    };
});

const webIntelData = computed(() => COMPETITOR_WEB_INTEL);

const competitorColors: { [key: string]: string } = {
    'Hard-Court Pros': 'bg-blue-500',
    'Asphalt Aces': 'bg-red-500',
    'Sport Surfaces Inc.': 'bg-green-500',
    'Pavement Perfectionists': 'bg-purple-500',
};

const getStatusPillClass = (status: string, context = 'license') => {
    const styles: { [key: string]: string } = {
        Active: 'bg-green-100 text-green-800',
        Suspended: 'bg-yellow-100 text-yellow-800',
        Revoked: 'bg-red-100 text-red-800',
        Pending: 'bg-blue-100 text-blue-800',
        Settled: 'bg-gray-100 text-gray-800',
        Dismissed: 'bg-blue-100 text-blue-800',
    };
    if (context === 'lawsuit' && status === 'Active') {
        return 'bg-orange-100 text-orange-800';
    }
    return styles[status] || 'bg-gray-100 text-gray-800';
};

const filteredRankings = computed(() => {
    return seoData.value.rankings.filter(r => trackedKeywords.value.includes(r.keyword));
});

const chartData = computed(() => {
    const history = (seoData.value.history as Record<string, Array<Record<string, any>>>)[selectedKeywordForChart.value];
    if (!history) return { labels: [], datasets: [] };
    
    const competitors = [...new Set(history.flatMap(h => Object.keys(h).filter(k => k !== 'month')))];
    const colors = ['#3B82F6', '#EF4444', '#10B981', '#8B5CF6', '#F97316'];

    return {
        labels: history.map(h => h.month),
        datasets: competitors.map((comp, index) => ({
            label: comp,
            data: history.map(h => h[comp] || null),
            borderColor: colors[index % colors.length],
            backgroundColor: colors[index % colors.length] + '33',
            fill: false,
            tension: 0.1,
            pointRadius: 4,
            pointBackgroundColor: colors[index % colors.length],
        }))
    };
});

const renderChart = () => {
    if (seoChartInstance) {
        seoChartInstance.destroy();
    }
    if (seoChartRef.value) {
        const ctx = seoChartRef.value.getContext('2d');
        seoChartInstance = new Chart(ctx, {
            type: 'line',
            data: chartData.value,
            options: {
                responsive: true,
                maintainAspectRatio: false,
                scales: {
                    y: {
                        beginAtZero: false,
                        reverse: true, // Lower rank is better
                        title: { display: true, text: 'Search Rank' }
                    }
                },
                plugins: {
                    legend: { position: 'bottom' },
                    tooltip: { mode: 'index', intersect: false }
                }
            }
        });
    }
};

watch(selectedKeywordForChart, renderChart);

onMounted(() => {
    nextTick(() => {
        createIcons();
    });
});
</script>

<template>
    <main class="flex-1 overflow-y-auto p-6 md:p-8">
        <header class="mb-8">
            <h2 class="text-3xl font-extrabold text-slate-800">Competitor Intelligence</h2>
            <p class="text-slate-500 mt-1">Analyze competitor activity, license status, and legal actions from public data.</p>
        </header>

        <div class="border-b border-slate-200 mb-6">
            <nav class="-mb-px flex space-x-4" role="tablist" aria-label="Competitor Intel Tabs">
                <button @click="changeTab('projects')" role="tab" :aria-selected="activeTab === 'projects'" :class="['px-3 py-2 font-medium text-sm rounded-md flex items-center', activeTab === 'projects' ? 'bg-indigo-100 text-indigo-700' : 'text-slate-500 hover:text-slate-700']">
                    <i data-lucide="list-checks" class="w-4 h-4 mr-2"></i> Project Activity
                </button>
                <button @click="changeTab('contractors')" role="tab" :aria-selected="activeTab === 'contractors'" :class="['px-3 py-2 font-medium text-sm rounded-md flex items-center', activeTab === 'contractors' ? 'bg-indigo-100 text-indigo-700' : 'text-slate-500 hover:text-slate-700']">
                    <i data-lucide="file-badge-2" class="w-4 h-4 mr-2"></i> Contractor Status
                </button>
                <button @click="changeTab('webIntel')" role="tab" :aria-selected="activeTab === 'webIntel'" :class="['px-3 py-2 font-medium text-sm rounded-md flex items-center', activeTab === 'webIntel' ? 'bg-indigo-100 text-indigo-700' : 'text-slate-500 hover:text-slate-700']">
                    <i data-lucide="globe" class="w-4 h-4 mr-2"></i> Web & Social Intel
                    <span class="ml-2 px-2 py-0.5 bg-sky-100 text-sky-700 text-xs font-semibold rounded-full">BETA</span>
                </button>
                 <button @click="changeTab('seo')" role="tab" :aria-selected="activeTab === 'seo'" :class="['px-3 py-2 font-medium text-sm rounded-md flex items-center', activeTab === 'seo' ? 'bg-indigo-100 text-indigo-700' : 'text-slate-500 hover:text-slate-700']">
                    <i data-lucide="trending-up" class="w-4 h-4 mr-2"></i> SEO & Keyword Rank
                    <span class="ml-2 px-2 py-0.5 bg-sky-100 text-sky-700 text-xs font-semibold rounded-full">BETA</span>
                </button>
            </nav>
        </div>
        
        <div v-if="isTabLoading" class="animate-fade-in">
            <!-- Project Activity Skeleton -->
            <div v-if="activeTab === 'projects'" class="grid grid-cols-1 lg:grid-cols-3 gap-8">
                <Card class="lg:col-span-2">
                    <div class="h-6 w-1/2 bg-slate-200 rounded mb-4 shimmer-wrapper"></div>
                    <div class="space-y-2">
                        <div v-for="i in 5" :key="i" class="h-10 bg-slate-200 rounded shimmer-wrapper"></div>
                    </div>
                </Card>
                <Card>
                    <div class="h-6 w-3/4 bg-slate-200 rounded mb-4 shimmer-wrapper"></div>
                    <div class="space-y-4">
                         <div v-for="i in 4" :key="i" class="h-8 bg-slate-200 rounded shimmer-wrapper"></div>
                    </div>
                </Card>
            </div>
            <!-- Contractor Status Skeleton -->
            <div v-if="activeTab === 'contractors'" class="space-y-8">
                <Card>
                    <div class="h-6 w-1/2 bg-slate-200 rounded mb-4 shimmer-wrapper"></div>
                     <div v-for="i in 3" :key="i" class="h-12 bg-slate-200 rounded my-2 shimmer-wrapper"></div>
                </Card>
                 <Card>
                    <div class="h-6 w-1/2 bg-slate-200 rounded mb-4 shimmer-wrapper"></div>
                    <div class="h-10 bg-slate-200 rounded my-2 shimmer-wrapper"></div>
                </Card>
            </div>
             <!-- Web Intel Skeleton -->
            <Card v-if="activeTab === 'webIntel'">
                <div class="h-6 w-1/2 bg-slate-200 rounded mb-2 shimmer-wrapper"></div>
                <div class="h-4 w-3/4 bg-slate-200 rounded mb-6 shimmer-wrapper"></div>
                <div class="space-y-6">
                    <div v-for="i in 3" :key="i" class="p-4 border border-slate-200 rounded-lg">
                        <div class="h-5 w-1/3 bg-slate-200 rounded mb-2 shimmer-wrapper"></div>
                        <div class="h-4 w-3/4 bg-slate-200 rounded mb-3 shimmer-wrapper"></div>
                        <div class="h-16 bg-slate-200 rounded shimmer-wrapper"></div>
                    </div>
                </div>
            </Card>
        </div>

        <div v-else class="animate-fade-in">
            <section v-if="activeTab === 'projects'">
                <div class="grid grid-cols-1 lg:grid-cols-3 gap-8">
                <Card class="lg:col-span-2">
                    <h3 class="text-xl font-bold text-slate-700 mb-4">Recent Competitor Activity</h3>
                     <div class="overflow-x-auto">
                        <table class="min-w-full divide-y divide-slate-200">
                            <thead class="bg-slate-50">
                                <tr>
                                    <th class="px-4 py-2 text-left text-xs font-medium text-slate-500 uppercase tracking-wider">Project</th>
                                    <th class="px-4 py-2 text-left text-xs font-medium text-slate-500 uppercase tracking-wider">Contractor</th>
                                    <th class="px-4 py-2 text-left text-xs font-medium text-slate-500 uppercase tracking-wider">Project Type</th>
                                </tr>
                            </thead>
                            <tbody class="bg-white divide-y divide-slate-200">
                                <tr v-for="permit in projectData.permits" :key="permit.id" class="hover:bg-slate-50">
                                    <td class="px-4 py-3 whitespace-nowrap text-sm font-medium text-slate-900">{{ permit.name }}</td>
                                    <td class="px-4 py-3 whitespace-nowrap text-sm text-slate-600">{{ permit.details?.contractor }}</td>
                                    <td class="px-4 py-3 whitespace-nowrap text-sm text-slate-600">{{ permit.extractedData?.['Project Type'] }}</td>
                                </tr>
                            </tbody>
                        </table>
                    </div>
                </Card>
                <Card>
                    <h3 class="text-xl font-bold text-slate-700 mb-4">Market Share (by Permits)</h3>
                    <div class="space-y-4">
                        <div v-for="([name, count]) in projectData.counts" :key="name">
                            <div class="flex justify-between mb-1">
                                <span class="text-sm font-medium text-slate-700">{{ name }}</span>
                                <span class="text-sm font-medium text-slate-500">{{ count }} Permits</span>
                            </div>
                            <div class="w-full bg-slate-200 rounded-full h-2.5">
                                <div class="h-2.5 rounded-full" :class="competitorColors[name] || 'bg-gray-400'" :style="{ width: (projectData.totalPermits > 0 ? (count / projectData.totalPermits) * 100 : 0) + '%' }"></div>
                            </div>
                        </div>
                    </div>
                </Card>
                </div>
            </section>
    
            <section v-if="activeTab === 'contractors'" class="space-y-8">
                <Card>
                    <h3 class="text-xl font-bold text-slate-700 mb-4">Tracked Competitor Status</h3>
                    <ul class="divide-y divide-slate-200">
                        <li v-for="contractor in contractorData.tracked" :key="contractor.id" class="py-4">
                            <div class="flex items-center justify-between">
                                <div>
                                    <p class="text-sm font-medium text-indigo-600">{{ contractor.name }}</p>
                                    <p class="text-xs text-slate-500">License: {{ contractor.licenseNumber }}</p>
                                </div>
                                <span class="px-2 inline-flex text-xs leading-5 font-semibold rounded-full" :class="getStatusPillClass(contractor.status, 'license')">{{ contractor.status }}</span>
                            </div>
                            <div v-if="contractor.violations.length > 0" class="mt-3 pl-4">
                                <h4 class="text-xs font-bold text-slate-500 uppercase mb-1">Violations</h4>
                                <div v-for="(v, index) in contractor.violations" :key="'v-' + index" class="text-xs text-slate-600 border-l-2 border-slate-200 pl-3 py-1">
                                    <p><span class="font-semibold">{{ v.date }}:</span> {{ v.description }}</p>
                                    <p class="text-red-700"><span class="font-semibold">Resolution:</span> {{ v.resolution }}</p>
                                </div>
                            </div>
                             <div v-if="contractor.lawsuits.length > 0" class="mt-3 pl-4">
                                <h4 class="text-xs font-bold text-slate-500 uppercase mb-1 flex items-center">
                                    <i data-lucide="gavel" class="w-3 h-3 mr-1.5"></i>
                                    Recent Legal Actions
                                </h4>
                                <div v-for="l in contractor.lawsuits" :key="l.caseNumber" class="text-xs text-slate-600 border-l-2 border-slate-200 pl-3 py-1">
                                    <div class="flex justify-between items-center">
                                        <p><span class="font-semibold">Filed {{ l.filingDate }}:</span> {{ l.description }}</p>
                                        <span class="px-2 inline-flex text-xs leading-5 font-semibold rounded-full" :class="getStatusPillClass(l.status, 'lawsuit')">{{ l.status }}</span>
                                    </div>
                                    <p class="text-slate-500">Case: {{ l.caseNumber }} ({{ l.court }})</p>
                                </div>
                            </div>
                        </li>
                    </ul>
                </Card>
                <Card>
                    <h3 class="text-xl font-bold text-slate-700 mb-4">New Industry Applicants</h3>
                    <ul class="divide-y divide-slate-200">
                       <li v-for="applicant in contractorData.newApplicants" :key="applicant.id" class="py-3 flex items-center justify-between">
                            <p class="text-sm font-medium text-slate-800">{{ applicant.name }}</p>
                            <span class="px-2 inline-flex text-xs leading-5 font-semibold rounded-full" :class="getStatusPillClass(applicant.status, 'license')">{{ applicant.status }}</span>
                        </li>
                    </ul>
                </Card>
            </section>
            
            <section v-if="activeTab === 'webIntel'">
                <Card>
                     <div class="flex flex-col md:flex-row justify-between md:items-center mb-6">
                        <div>
                            <h3 class="text-xl font-bold text-slate-700">AI-Powered Competitor Web Monitoring</h3>
                            <p class="text-sm text-slate-500 mt-1">Automated summaries of competitor announcements, press releases, and case studies.</p>
                        </div>
                        <button @click="emit('setCurrentView', View.MonthlyReport)" class="mt-3 md:mt-0 px-4 py-2 bg-indigo-600 text-white font-semibold rounded-lg shadow-sm hover:bg-indigo-700 flex items-center text-sm self-start md:self-center">
                            <i data-lucide="file-text" class="w-4 h-4 mr-2"></i>Generate Monthly Report
                        </button>
                    </div>
    
                    <div class="bg-slate-50 p-4 rounded-lg border border-slate-200 mb-6">
                        <h4 class="font-bold text-slate-700 mb-2">Tracked Competitors</h4>
                        <p class="text-sm text-slate-500 mb-3">Add or remove companies to include in your web monitoring feed and monthly report.</p>
                        <div class="flex items-center gap-2 mb-3">
                            <input v-model="newCompetitor" @keyup.enter="handleAddCompetitor" type="text" placeholder="Enter company name..." class="flex-grow px-3 py-1.5 bg-white border border-slate-300 rounded-md shadow-sm text-sm focus:outline-none focus:ring-1 focus:ring-indigo-500" />
                            <button @click="handleAddCompetitor" class="px-3 py-1.5 bg-indigo-600 text-white font-semibold text-sm rounded-md shadow-sm hover:bg-indigo-700">Add</button>
                        </div>
                        <div class="flex flex-wrap gap-2">
                            <span v-for="comp in trackedCompetitors" :key="comp" class="inline-flex items-center px-2 py-1 bg-white text-slate-700 text-xs font-medium rounded-full border border-slate-200">
                                {{ comp }}
                                <button @click="handleRemoveCompetitor(comp)" class="ml-1.5 text-slate-400 hover:text-slate-600">
                                    <i data-lucide="x" class="w-3 h-3"></i>
                                </button>
                            </span>
                        </div>
                    </div>
                    
                    <div class="space-y-6">
                        <div v-for="item in webIntelData" :key="item.id" class="p-4 border border-slate-200 rounded-lg">
                            <div class="flex justify-between items-center mb-2">
                                <p class="font-bold text-indigo-600">{{ item.competitorName }}</p>
                                <p class="text-xs text-slate-500">{{ item.date }}</p>
                            </div>
                            <h4 class="font-semibold text-slate-800">{{ item.headline }}</h4>
                            <p class="text-sm text-slate-600 mt-2 bg-slate-50 p-3 rounded-md border border-slate-200 italic">{{ item.aiSummary }}</p>
                            <div class="mt-3 flex flex-wrap gap-2">
                                <span v-for="([key, value]) in Object.entries(item.extractedData)" :key="key" class="px-2 py-1 bg-slate-100 text-slate-700 text-xs font-medium rounded-full">
                                    <strong class="font-semibold">{{ key }}:</strong> {{ value }}
                                </span>
                            </div>
                            <div class="mt-3 text-right">
                                <a :href="item.sourceUrl" target="_blank" class="text-sm font-semibold text-indigo-600 hover:underline flex items-center justify-end gap-1">
                                    View Source <i data-lucide="arrow-up-right" class="w-4 h-4"></i>
                                </a>
                            </div>
                        </div>
                    </div>
                </Card>
            </section>
    
            <section v-if="activeTab === 'seo'">
                <Card>
                    <h3 class="text-xl font-bold text-slate-700 flex items-center gap-2">
                        <span>AI-Powered SEO & Keyword Rank Tracking</span>
                        <Tooltip text="Search Engine Optimization (SEO) is the process of improving the quality and quantity of website traffic to a website from search engines." />
                    </h3>
                    <p class="text-sm text-slate-500 mt-1 mb-4">Monitor your competitors' search engine visibility for key terms.</p>
                    
                    <p class="text-sm text-slate-600 mt-2 bg-slate-50 p-4 rounded-md border border-slate-200 italic">
                        <strong>Gemini Analysis:</strong> Hard-Court Pros saw a significant jump for 'tennis court resurfacing phoenix' after publishing a new case study, indicating a successful content strategy. Asphalt Aces' ranking dropped, possibly due to a lack of new content this month.
                    </p>
    
                    <div class="grid grid-cols-1 lg:grid-cols-3 gap-8 mt-6">
                        <div class="lg:col-span-1">
                            <div class="bg-slate-50 p-4 rounded-lg border border-slate-200">
                                <h4 class="font-bold text-slate-700 mb-2">Tracked Keywords</h4>
                                <p class="text-sm text-slate-500 mb-3">Add or remove keywords to monitor rankings.</p>
                                <div class="flex items-center gap-2 mb-3">
                                    <input v-model="newKeyword" @keyup.enter="handleAddKeyword" type="text" placeholder="Enter keyword..." class="flex-grow px-3 py-1.5 bg-white border border-slate-300 rounded-md shadow-sm text-sm focus:outline-none focus:ring-1 focus:ring-indigo-500" />
                                    <button @click="handleAddKeyword" class="px-3 py-1.5 bg-indigo-600 text-white font-semibold text-sm rounded-md shadow-sm hover:bg-indigo-700">Add</button>
                                </div>
                                <div class="flex flex-wrap gap-2">
                                    <span v-for="kw in trackedKeywords" :key="kw" class="inline-flex items-center px-2 py-1 bg-white text-slate-700 text-xs font-medium rounded-full border border-slate-200">
                                        {{ kw }}
                                        <button @click="handleRemoveKeyword(kw)" class="ml-1.5 text-slate-400 hover:text-slate-600">
                                            <i data-lucide="x" class="w-3 h-3"></i>
                                        </button>
                                    </span>
                                </div>
                            </div>
                             <div class="mt-4 bg-slate-50 p-4 rounded-lg border border-slate-200">
                                <h4 class="font-bold text-slate-700 mb-2">Ranking Trend</h4>
                                 <p class="text-sm text-slate-500 mb-3">Historical rank for: <strong class="text-indigo-600">{{ selectedKeywordForChart }}</strong></p>
                                 <div class="h-64"><canvas ref="seoChartRef"></canvas></div>
                            </div>
                        </div>
                        <div class="lg:col-span-2">
                            <div class="overflow-x-auto">
                                <table class="min-w-full divide-y divide-slate-200">
                                    <thead class="bg-slate-50">
                                        <tr>
                                            <th class="px-4 py-2 text-left text-xs font-medium text-slate-500 uppercase tracking-wider">Competitor</th>
                                            <th class="px-4 py-2 text-left text-xs font-medium text-slate-500 uppercase tracking-wider">Keyword</th>
                                            <th class="px-4 py-2 text-left text-xs font-medium text-slate-500 uppercase tracking-wider">Rank</th>
                                            <th class="px-4 py-2 text-left text-xs font-medium text-slate-500 uppercase tracking-wider">Ranking URL</th>
                                        </tr>
                                    </thead>
                                    <tbody class="bg-white divide-y divide-slate-200">
                                        <tr v-for="(rank, index) in filteredRankings" :key="index" @click="selectedKeywordForChart = rank.keyword" class="hover:bg-slate-50 cursor-pointer">
                                            <td class="px-4 py-3 whitespace-nowrap text-sm font-medium text-slate-900">{{ rank.competitor }}</td>
                                            <td class="px-4 py-3 whitespace-nowrap text-sm text-slate-600 max-w-xs truncate">{{ rank.keyword }}</td>
                                            <td class="px-4 py-3 whitespace-nowrap text-sm text-slate-600 font-bold flex items-center">
                                                {{ rank.rank }}
                                                <span v-if="rank.change > 0" class="ml-2 flex items-center text-green-600"><i data-lucide="arrow-up" class="w-3 h-3 mr-0.5"></i>{{ rank.change }}</span>
                                                <span v-else-if="rank.change < 0" class="ml-2 flex items-center text-red-600"><i data-lucide="arrow-down" class="w-3 h-3 mr-0.5"></i>{{ Math.abs(rank.change) }}</span>
                                            </td>
                                            <td class="px-4 py-3 whitespace-nowrap text-sm text-indigo-600 hover:underline max-w-xs truncate">
                                                <a :href="'https://' + rank.competitor.toLowerCase().replace(/ /g, '') + '.com' + rank.url" target="_blank">{{ rank.url }}</a>
                                            </td>
                                        </tr>
                                    </tbody>
                                </table>
                            </div>
                        </div>
                    </div>
                </Card>
            </section>
        </div>
    </main>
</template>

<script setup lang="ts">
import { computed, onMounted, onUnmounted, ref, watch } from 'vue';
import { Lightbulb, FileText, TrendingUp, Megaphone, Wrench, Sparkles, ChevronRight, ShieldCheck } from 'lucide-vue-next';
import { View } from '@/types';
import { Chart, registerables, ChartEvent, ActiveElement } from 'chart.js';
import { logAiStudioCode } from '@/utils/devtools';

Chart.register(...registerables);

import { CompetitorIntelEvent } from '@/data/index';

const props = defineProps<{
  activityFeed: CompetitorIntelEvent[];
  userName?: string;
  prospects: any[];
  progress?: number; // Add progress prop
}>();

const emit = defineEmits(['setCurrentView']);

// --- AI Briefing State ---
const aiBriefing = ref('');
const isBriefingLoading = ref(true);

// --- Chart State ---
const chartCanvas = ref<HTMLCanvasElement | null>(null);
let prospectChart: Chart | null = null;

// --- Gemini API Call for Morning Briefing ---
const generateAiBriefing = async () => {
  if (!props.activityFeed || props.activityFeed.length === 0) {
    aiBriefing.value = "No recent activity to analyze. The AI model needs data to provide a briefing.";
    isBriefingLoading.value = false;
    return;
  }

  isBriefingLoading.value = true;

  const formattedActivities = props.activityFeed
    .slice(0, 5)
    .map(a => `- ${a.summary} (Source: ${a.source})`)
    .join('\n');

  const systemPrompt = "You are a sharp and concise sales analyst for Elite Sports Builders, a company specializing in athletic court construction in Arizona. Your audience is the sales manager, Mike Woelfel.";
  const userPrompt = `Based on the following recent market activities, provide a 2-3 sentence strategic briefing for the morning sales meeting. Focus on the single biggest opportunity and the most urgent threat. Be direct and actionable.\n\nRecent Activities:\n${formattedActivities}`;

  const apiKey = ""; // Ensure this is populated from your environment variables in a real app
  const apiUrl = `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash-preview-05-20:generateContent?key=${apiKey}`;

  try {
    const payload = {
      contents: [{ parts: [{ text: userPrompt }] }],
      systemInstruction: { parts: [{ text: systemPrompt }] },
    };

    logAiStudioCode(userPrompt);

    const response = await fetch(apiUrl, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
    });

    if (!response.ok) {
        throw new Error(`API call failed with status: ${response.status}`);
    }

    const result = await response.json();
    const text = result.candidates?.[0]?.content?.parts?.[0]?.text;

    if (text) {
      aiBriefing.value = text;
    } else {
      throw new Error("No text returned from API.");
    }

  } catch (error) {
    const fallbackMessage = "The new permit for the Paradise Valley Country Club is our top priority; it's a high-value project directly in our wheelhouse. Keep an eye on Ace Resurfacing—their new ad campaign for 'pickleball court resurfacing' means we'll need to be aggressive to win that business.";

    if (error instanceof Error && error.message.includes('403')) {
        console.warn("AI Briefing failed due to a missing API key (403 Forbidden). Displaying mock data. Please configure a valid Gemini API key for live results.");
        aiBriefing.value = `[Live AI Briefing Disabled - Showing Example]\n\n${fallbackMessage}`;
    } else {
        console.error("Error generating AI briefing:", error);
        aiBriefing.value = fallbackMessage;
    }
  } finally {
    isBriefingLoading.value = false;
  }
};


// --- Business Logic for Alerts ---
const getClientAlertLevel = (project: any): 'resurface' | 'warranty' | 'none' => {
  // --- DEMO "FALSE FLAG" ---
  // This line is for demonstration purposes to show how a warranty alert looks.
  // It forces an alert for a specific client. Remove this line for production logic.
  if (project.id === 1) return 'warranty';
  // --- END DEMO ---

  if (!project || !project.isClient || !project.completionDate) return 'none';
  const today = new Date(); // Use current date
  const completionDate = new Date(project.completionDate);
  const warrantyExpiration = new Date(project.warrantyExpiration);

  const yearsSinceCompletion = (today.getTime() - completionDate.getTime()) / (1000 * 60 * 60 * 24 * 365);
  if (yearsSinceCompletion >= 5) return 'resurface';

  const monthsToWarrantyExpiry = (warrantyExpiration.getTime() - today.getTime()) / (1000 * 60 * 60 * 24 * 30.44);
  if (monthsToWarrantyExpiry <= 6) return 'warranty';

  return 'none';
};

// --- Computed Properties for Metrics & Chart ---
const newAiLeads = computed(() => props.prospects.filter(p => 'isAcknowledged' in p && p.isAcknowledged === false));
const clients = computed(() => props.prospects.filter(p => p.isClient));
const otherProspects = computed(() => props.prospects.filter(p => !newAiLeads.value.includes(p) && !clients.value.includes(p)));

const newAiLeadsCount = computed(() => newAiLeads.value.length);
const maintenanceAlertsCount = computed(() => clients.value.filter(p => getClientAlertLevel(p) !== 'none').length);

const priorityAlerts = computed(() => {
    return clients.value
        .map(client => ({
            ...client,
            alertType: getClientAlertLevel(client)
        }))
        .filter(client => client.alertType !== 'none');
});

const chartData = computed(() => ({
  labels: ['New AI Leads', 'Existing Clients', 'Other Prospects'],
  datasets: [{
    data: [newAiLeadsCount.value, clients.value.length, otherProspects.value.length],
    backgroundColor: ['#6366f1', '#10b981', '#6b7280'],
    borderColor: '#ffffff',
    borderWidth: 2,
  }]
}));

// --- Chart Rendering & Interactivity ---
// Renamed 'event' to '_event' to suppress TypeScript warning
const handleChartClick = (_event: ChartEvent, elements: ActiveElement[]) => {
    if (!prospectChart || !elements.length) return;

    const firstPoint = elements[0];
    const label = prospectChart.data.labels?.[firstPoint.index];

    if (label === 'New AI Leads') {
        emit('setCurrentView', View.LeadIntelligence);
    } else if (label === 'Existing Clients') {
        emit('setCurrentView', View.InteractiveMap);
    }
};

const renderChart = () => {
  if (prospectChart) {
    prospectChart.destroy();
  }
  if (chartCanvas.value) {
    prospectChart = new Chart(chartCanvas.value, {
      type: 'doughnut',
      data: chartData.value,
      options: {
        responsive: true,
        maintainAspectRatio: false,
        onClick: handleChartClick,
        plugins: {
          legend: {
            display: false,
          },
        },
        cutout: '70%',
      },
    });
  }
};

onMounted(() => {
  renderChart();
});

onUnmounted(() => {
  if (prospectChart) {
    prospectChart.destroy();
  }
});

watch(() => props.prospects, () => {
  renderChart();
}, { deep: true });

watch(() => props.activityFeed, (newVal) => {
    if (newVal && newVal.length > 0) {
        generateAiBriefing();
    } else if (newVal && newVal.length === 0) { // Added this else if for empty case after initial load
        aiBriefing.value = "No recent activity to analyze. The AI model needs data to provide a briefing.";
        isBriefingLoading.value = false;
    }
}, { immediate: true });


// --- Activity Feed Helpers ---
const getIconForActivity = (activity: any) => {
  if (activity.category === 'Lead Generation') return Lightbulb;
  if (activity.type === 'New Ad Campaign') return Megaphone;
  if (activity.type === 'SEO Ranking Change') return TrendingUp;
  return FileText;
};

const getIconColor = (activity: any) => {
    if (activity.category === 'Lead Generation') return 'text-amber-500';
    if (activity.category === 'Competitor Intel') return 'text-sky-500';
    return 'text-slate-500';
}
</script>

<template>
  <div class="p-4 sm:p-6 lg:p-8 bg-slate-100">
    <header class="mb-8">
      <h1 class="text-3xl font-bold text-slate-800">Welcome back, {{ userName || 'User' }}!</h1>
      <p class="text-slate-600 mt-1">Here's your strategic briefing for the day.</p>
    </header>

    <!-- AI Morning Briefing -->
    <div class="mb-6 bg-white p-6 rounded-lg shadow-sm border border-slate-200">
      <h2 class="text-xl font-bold text-slate-800 flex items-center mb-3">
        <Sparkles class="w-6 h-6 mr-3 text-indigo-500" />
        AI Morning Briefing
      </h2>
      <div v-if="isBriefingLoading" class="flex items-center text-slate-500">
          <svg class="animate-spin -ml-1 mr-3 h-5 w-5 text-slate-400" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
            <circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4"></circle>
            <path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
          </svg>
          <span>Analyzing the latest market activity...</span>
      </div>
      <p v-else class="text-slate-700 leading-relaxed" style="white-space: pre-wrap;">{{ aiBriefing }}</p>
    </div>


    <div class="grid grid-cols-1 lg:grid-cols-3 gap-6">
      <!-- Recent Activity Column -->
      <div class="lg:col-span-2 bg-white p-6 rounded-lg shadow-sm border border-slate-200">
        <h2 class="text-xl font-bold text-slate-800 mb-4">Recent Activity</h2>
        <div class="flow-root">
          <ul role="list" class="-mb-8">
            <li v-for="(activity, index) in activityFeed" :key="activity.id">
              <div class="relative pb-8">
                <span v-if="index !== activityFeed.length - 1" class="absolute left-4 top-4 -ml-px h-full w-0.5 bg-slate-200" aria-hidden="true"></span>
                <div class="relative flex items-start space-x-3">
                  <div>
                    <div class="relative px-1">
                      <div class="h-8 w-8 bg-slate-100 rounded-full ring-8 ring-white flex items-center justify-center">
                        <component :is="getIconForActivity(activity)" :class="getIconColor(activity)" class="h-5 w-5" aria-hidden="true" />
                      </div>
                    </div>
                  </div>
                  <div class="min-w-0 flex-1 py-1.5">
                    <div class="text-sm text-slate-500">
                      <span class="font-medium text-slate-900">{{ activity.source }}</span>
                      {{ ' ' }}
                      <span class="whitespace-nowrap text-xs">{{ new Date(activity.date).toLocaleDateString('en-US', { month: 'short', day: 'numeric' }) }}</span>
                    </div>
                    <div class="mt-1 text-sm text-slate-700">
                      <p>{{ activity.summary }}</p>
                    </div>
                  </div>
                </div>
              </div>
            </li>
          </ul>
          <!-- Added message for no recent activity -->
          <div v-if="activityFeed.length === 0 && !isBriefingLoading" class="text-center text-sm text-slate-500 py-4">
              <p>No recent activity to display. Check back later!</p>
          </div>
        </div>
      </div>

      <!-- Widgets Column -->
      <div class="lg:col-span-1 space-y-6">
        <div class="bg-white p-6 rounded-lg shadow-sm border border-slate-200">
          <h3 class="font-bold text-slate-800 mb-4">Key Metrics</h3>
          <div class="relative w-full h-48 mb-6 cursor-pointer">
            <canvas ref="chartCanvas"></canvas>
            <!-- Added message for no chart data -->
            <div v-if="chartData.datasets[0].data.every(val => val === 0)" class="absolute inset-0 flex items-center justify-center bg-white bg-opacity-90 text-sm text-slate-500 rounded-lg">
                No data to display in chart.
            </div>
          </div>
          <div class="space-y-1">
            <button @click="emit('setCurrentView', View.LeadIntelligence)" class="w-full flex items-center justify-between text-left p-2 -m-2 rounded-lg hover:bg-slate-50 transition-colors">
                <div class="flex items-center">
                  <span class="w-3 h-3 rounded-full bg-indigo-500 mr-3"></span>
                  <span class="font-medium text-slate-700">New AI Leads</span>
                </div>
                <span class="font-bold text-lg text-indigo-600">{{ newAiLeadsCount }}</span>
            </button>
            <div class="flex items-center justify-between p-2">
                <div class="flex items-center">
                  <span class="w-3 h-3 rounded-full bg-emerald-500 mr-3"></span>
                  <span class="font-medium text-slate-700">Existing Clients</span>
                </div>
                <span class="font-bold text-lg text-emerald-600">{{ clients.length }}</span>
            </div>
             <button @click="emit('setCurrentView', View.InteractiveMap, { filter: 'maintenanceAlerts' })" class="w-full flex items-center justify-between text-left p-2 -m-2 rounded-lg hover:bg-slate-50 transition-colors">
              <div class="flex items-center">
                <Wrench class="w-5 h-5 mr-3 text-red-500" />
                <span class="font-medium text-slate-700">Maintenance Alerts</span>
              </div>
              <span class="font-bold text-lg text-red-600">{{ maintenanceAlertsCount }}</span>
            </button>
          </div>
        </div>

        <!-- Priority Alerts Widget -->
        <div class="bg-white p-6 rounded-lg shadow-sm border border-slate-200">
            <h3 class="font-bold text-slate-800 mb-4">Priority Alerts</h3>
            <div v-if="priorityAlerts.length > 0" class="space-y-3">
                <button v-for="alert in priorityAlerts" :key="alert.id" @click="emit('setCurrentView', View.ProjectHub, { prospect: alert })" class="w-full text-left p-3 rounded-lg hover:bg-slate-50 transition-colors border border-slate-200">
                    <div class="flex items-center">
                        <div class="mr-3">
                            <Wrench v-if="alert.alertType === 'resurface'" class="w-5 h-5 text-red-500" />
                            <ShieldCheck v-if="alert.alertType === 'warranty'" class="w-5 h-5 text-amber-500" />
                        </div>
                        <div>
                            <p class="font-semibold text-slate-800">{{ alert.name }}</p>
                            <p v-if="alert.alertType === 'resurface'" class="text-sm text-red-600">5-Year Resurface Due</p>
                            <p v-if="alert.alertType === 'warranty'" class="text-sm text-amber-600">Warranty Expiring Soon</p>
                        </div>
                    </div>
                </button>
            </div>
            <div v-else class="text-sm text-slate-500 text-center py-4">
                <p>No immediate client actions required. Great work!</p>
            </div>
        </div>

        <div class="bg-white p-6 rounded-lg shadow-sm border border-slate-200">
          <h3 class="font-bold text-slate-800 mb-4">Quick Links</h3>
          <div class="space-y-2">
            <button @click="emit('setCurrentView', View.LeadIntelligence)" class="w-full flex justify-between items-center p-3 bg-slate-50 hover:bg-indigo-50 rounded-lg text-left transition-colors">
              <span class="font-semibold text-indigo-700">Review New Leads</span>
              <ChevronRight class="w-5 h-5 text-indigo-600" />
            </button>
              <button @click="emit('setCurrentView', View.InteractiveMap)" class="w-full flex justify-between items-center p-3 bg-slate-50 hover:bg-slate-100 rounded-lg text-left transition-colors">
              <span class="font-semibold text-slate-700">View Project Map</span>
              <ChevronRight class="w-5 h-5 text-slate-500" />
            </button>
            <button @click="emit('setCurrentView', View.CompetitorIntel)" class="w-full flex justify-between items-center p-3 bg-slate-50 hover:bg-slate-100 rounded-lg text-left transition-colors">
              <span class="font-semibold text-slate-700">Track Competitors</span>
              <ChevronRight class="w-5 h-5 text-slate-500" />
            </button>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

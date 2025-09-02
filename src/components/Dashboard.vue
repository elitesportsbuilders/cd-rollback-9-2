<script setup lang="ts">
import { computed, ref, onMounted, nextTick } from 'vue';
import { View } from '@/types';
import { LEAD_DATA, COMPETITORS, CONTRACTOR_STATUS_DATA, RESIDENTIAL_PROSPECT_DATA, COURT_DATA, ACTIVITY_FEED_DATA } from '@/data';
import PrimaryButton from '@/components/PrimaryButton.vue';
import Card from '@/components/Card.vue';
import { Chart, registerables } from 'chart.js';
Chart.register(...registerables);


const emit = defineEmits(['setCurrentView']);

const isLoading = ref(true);
const weeklyChartRef = ref<HTMLCanvasElement | null>(null);
const leadSourceChartRef = ref<HTMLCanvasElement | null>(null);
const competitorChartRef = ref<HTMLCanvasElement | null>(null);
let weeklyChartInstance: any = null;
let leadSourceChartInstance: any = null;
let competitorChartInstance: any = null;

const renderWeeklyChart = () => {
    if (weeklyChartInstance) weeklyChartInstance.destroy();
    if (weeklyChartRef.value) {
        const ctx = weeklyChartRef.value.getContext('2d');
        const labels = ['Week 1', 'Week 2', 'Week 3', 'This Week'];
        const permitData = [3, 5, 2, 4];
        const newsData = [1, 0, 2, 1];

        weeklyChartInstance = new Chart(ctx, {
            type: 'bar',
            data: { labels, datasets: [ { label: 'Permit Leads', data: permitData, backgroundColor: 'rgba(20, 184, 166, 0.7)', borderColor: 'rgba(15, 118, 110, 1)', borderWidth: 1 }, { label: 'News Leads', data: newsData, backgroundColor: 'rgba(14, 165, 233, 0.7)', borderColor: 'rgba(2, 132, 199, 1)', borderWidth: 1 } ] },
            options: { responsive: true, maintainAspectRatio: false, plugins: { legend: { position: 'bottom', labels: { usePointStyle: true, boxWidth: 8 } }, title: { display: false } }, scales: { x: { stacked: true, grid: { display: false } }, y: { stacked: true, beginAtZero: true, ticks: { stepSize: 1 } } } }
        });
    }
};

const leadSourceData = computed(() => {
    const permitCount = LEAD_DATA.filter(d => d.type === 'permit').length;
    const newsCount = LEAD_DATA.filter(d => d.type === 'news').length;
    const residentialCount = residentialProspectsCount.value;
    return {
        labels: ['Permit Leads', 'News Leads', 'Residential Prospects'],
        data: [permitCount, newsCount, residentialCount],
    };
});

const competitorShareData = computed(() => {
    const competitorPermits = LEAD_DATA.filter(d => d.type === 'permit' && d.details?.contractor);
    const competitorCounts = competitorPermits.reduce((acc: { [key: string]: number }, lead) => {
        const contractor = lead.details.contractor;
        acc[contractor] = (acc[contractor] || 0) + 1;
        return acc;
    }, {});
    const sorted = Object.entries(competitorCounts).sort(([, a], [, b]) => a - b);
    return {
        labels: sorted.map(([name]) => name),
        data: sorted.map(([, count]) => count),
    };
});

const renderLeadSourceChart = () => {
    if (leadSourceChartInstance) leadSourceChartInstance.destroy();
    if (leadSourceChartRef.value) {
        const ctx = leadSourceChartRef.value.getContext('2d');
        leadSourceChartInstance = new Chart(ctx, {
            type: 'doughnut',
            data: { labels: leadSourceData.value.labels, datasets: [{ label: 'Leads', data: leadSourceData.value.data, backgroundColor: ['rgba(20, 184, 166, 0.7)', 'rgba(14, 165, 233, 0.7)', 'rgba(8, 145, 178, 0.7)'], borderColor: ['#FFF'], borderWidth: 2 }] },
            options: { responsive: true, maintainAspectRatio: false, plugins: { legend: { position: 'bottom', labels: { usePointStyle: true, boxWidth: 8, padding: 15 } } } }
        });
    }
};

const renderCompetitorChart = () => {
    if (competitorChartInstance) competitorChartInstance.destroy();
    if (competitorChartRef.value) {
        const ctx = competitorChartRef.value.getContext('2d');
        competitorChartInstance = new Chart(ctx, {
            type: 'bar',
            data: { labels: competitorShareData.value.labels, datasets: [{ label: 'Permits Filed', data: competitorShareData.value.data, backgroundColor: 'rgba(59, 130, 246, 0.6)', borderColor: 'rgba(37, 99, 235, 1)', borderWidth: 1 }] },
            options: { indexAxis: 'y', responsive: true, maintainAspectRatio: false, plugins: { legend: { display: false } }, scales: { x: { beginAtZero: true, ticks: { stepSize: 1 } } } }
        });
    }
};

onMounted(() => {
    setTimeout(() => {
        isLoading.value = false;
        nextTick(() => {
            renderWeeklyChart();
            renderLeadSourceChart();
            renderCompetitorChart();
        });
    }, 1500);
});

const uniqueAlerts = computed(() => {
    const licenseAlerts = CONTRACTOR_STATUS_DATA.filter(c => c.status !== 'Active' && c.status !== 'Pending');
    const lawsuitAlerts = CONTRACTOR_STATUS_DATA.filter(c => c.lawsuits.some(l => l.status === 'Active'));
    const allAlerts = [...licenseAlerts, ...lawsuitAlerts];
    return Array.from(new Set(allAlerts.map(a => a.id))).map(id => allAlerts.find(a => a.id === id));
});

const clientsDueCount = computed(() => COURT_DATA.filter(c => c.isClient && c.isDue).length);
const residentialProspectsCount = computed(() => RESIDENTIAL_PROSPECT_DATA.length);
const activityFeedItems = computed(() => ACTIVITY_FEED_DATA);

const handleActivityClick = (activity: any) => {
    if (activity.view) {
        emit('setCurrentView', activity.view);
    } else if (activity.prospectId) {
        emit('setCurrentView', View.InteractiveMap, { prospectId: activity.prospectId });
    }
};

const setCurrentView = (view: string) => emit('setCurrentView', view);
</script>

<template>
    <main class="flex-1 overflow-y-auto p-6 md:p-8">
      <div v-if="isLoading">
          <!-- Skeleton for Header -->
          <div class="hidden md:flex flex-col md:flex-row justify-between items-start md:items-center mb-8">
              <div>
                  <div class="h-9 w-80 bg-slate-200 rounded shimmer-wrapper"></div>
                  <div class="h-5 w-96 bg-slate-200 rounded mt-2 shimmer-wrapper"></div>
              </div>
              <div class="flex items-center mt-4 md:mt-0">
                  <div class="w-10 h-10 rounded-full bg-slate-200 shimmer-wrapper mr-4"></div>
                  <div class="h-10 w-48 bg-slate-200 rounded-lg shimmer-wrapper"></div>
              </div>
          </div>
          <!-- Skeleton for At a Glance -->
          <div class="mt-4">
              <div class="h-6 w-48 bg-slate-200 rounded mb-4 shimmer-wrapper"></div>
               <div class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
                  <Card class="lg:col-span-2">
                    <div class="h-6 w-1/2 bg-slate-200 rounded mb-4 shimmer-wrapper"></div>
                    <div class="h-40 bg-slate-200 rounded shimmer-wrapper"></div>
                  </Card>
                  <Card class="flex items-center space-x-4">
                      <div class="w-12 h-12 rounded-full bg-slate-200 shimmer-wrapper"></div>
                      <div class="flex-1">
                          <div class="h-4 bg-slate-200 rounded shimmer-wrapper"></div>
                          <div class="h-8 w-1/2 bg-slate-200 rounded mt-2 shimmer-wrapper"></div>
                      </div>
                  </Card>
                   <Card class="flex items-center space-x-4">
                      <div class="w-12 h-12 rounded-full bg-slate-200 shimmer-wrapper"></div>
                      <div class="flex-1">
                          <div class="h-4 bg-slate-200 rounded shimmer-wrapper"></div>
                          <div class="h-8 w-1/2 bg-slate-200 rounded mt-2 shimmer-wrapper"></div>
                      </div>
                  </Card>
              </div>
          </div>
          <!-- Skeleton for Main Content Grid -->
           <section class="mt-10 grid grid-cols-1 lg:grid-cols-3 gap-8">
              <Card class="lg:col-span-2">
                  <div class="h-6 w-48 bg-slate-200 rounded mb-4 shimmer-wrapper"></div>
                  <div class="space-y-2">
                      <div v-for="i in 5" :key="i" class="flex items-center p-2">
                          <div class="w-9 h-9 rounded-full bg-slate-200 shimmer-wrapper mr-4"></div>
                          <div class="flex-grow h-5 bg-slate-200 rounded shimmer-wrapper"></div>
                      </div>
                  </div>
              </Card>
              <div class="space-y-8">
                <Card>
                    <div class="h-6 w-48 bg-slate-200 rounded mb-4 shimmer-wrapper"></div>
                    <div class="h-32 w-32 bg-slate-200 rounded-full mx-auto mt-2 shimmer-wrapper"></div>
                </Card>
                 <Card>
                    <div class="h-6 w-48 bg-slate-200 rounded mb-4 shimmer-wrapper"></div>
                    <div class="space-y-3 mt-4">
                      <div class="h-6 w-full bg-slate-200 rounded shimmer-wrapper"></div>
                      <div class="h-6 w-3/4 bg-slate-200 rounded shimmer-wrapper"></div>
                      <div class="h-6 w-5/6 bg-slate-200 rounded shimmer-wrapper"></div>
                    </div>
                </Card>
              </div>
          </section>
      </div>

      <div v-else class="animate-fade-in">
          <!-- Desktop Header -->
          <header class="hidden md:flex flex-col md:flex-row justify-between items-start md:items-center mb-8">
              <div>
                  <h2 class="text-3xl font-extrabold text-slate-800">Welcome back, Mike!</h2>
                  <p class="text-slate-500 mt-1">Here is your business summary for Thursday, August 14, 2025.</p>
              </div>
              <div class="flex items-center mt-4 md:mt-0">
                  <img src="https://picsum.photos/seed/esblogo/40/40" alt="Elite Sports Builders Logo" class="rounded-full border-2 border-white shadow-sm mr-4" title="Elite Sports Builders" />
                  <PrimaryButton
                    label="Launch Interactive Map"
                    icon="map"
                    @click="setCurrentView(View.InteractiveMap)"
                  />
              </div>
          </header>

          <section v-if="uniqueAlerts.length > 0 && uniqueAlerts[0]" class="mb-8">
              <div class="bg-yellow-50 border-l-4 border-yellow-400 p-4 rounded-r-lg">
                  <div class="flex">
                      <div class="flex-shrink-0">
                          <i data-lucide="alert-triangle" class="h-5 w-5 text-yellow-400"></i>
                      </div>
                      <div class="ml-3">
                          <p class="text-sm text-yellow-700">
                              <span class="font-bold">Urgent Contractor Alert:</span> 
                              <span v-if="uniqueAlerts[0] && uniqueAlerts[0].status !== 'Active'">
                                {{ uniqueAlerts[0].name }} has had their license status changed to {{ uniqueAlerts[0].status }}.
                              </span>
                              <span v-else-if="uniqueAlerts[0]">
                                {{ uniqueAlerts[0].name }} is facing a new, active lawsuit.
                              </span>
                              <button @click="setCurrentView(View.CompetitorIntel)" class="ml-2 font-medium text-yellow-800 underline hover:text-yellow-900">
                                  View Details
                              </button>
                          </p>
                      </div>
                  </div>
              </div>
          </section>

          <section>
              <h3 class="text-xl font-bold text-slate-700 mb-4">At a Glance</h3>
              <div class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
                  <Card class="sm:col-span-2">
                      <h4 class="text-slate-500 text-sm font-medium mb-2">Lead Generation (Last 4 Weeks)</h4>
                      <div class="h-48">
                          <canvas ref="weeklyChartRef"></canvas>
                      </div>
                  </Card>
                  <button @click="setCurrentView(View.Reports)" class="bg-white p-6 rounded-xl shadow-sm border border-slate-200 flex items-center space-x-4 text-left hover:border-indigo-400 hover:shadow-md transition-all">
                      <div class="bg-violet-100 text-violet-600 p-3 rounded-full"><i data-lucide="bell-ring" class="w-6 h-6"></i></div>
                      <div>
                          <p class="text-slate-500 text-sm font-medium">Clients Due for Service</p>
                          <p class="text-3xl font-bold text-slate-800">{{ clientsDueCount }}</p>
                      </div>
                  </button>
                  <button @click="setCurrentView(View.ResidentialProspecting)" class="bg-white p-6 rounded-xl shadow-sm border border-slate-200 flex items-center space-x-4 text-left hover:border-indigo-400 hover:shadow-md transition-all">
                      <div class="bg-sky-100 text-sky-600 p-3 rounded-full"><i data-lucide="home" class="w-6 h-6"></i></div>
                      <div>
                          <p class="text-slate-500 text-sm font-medium">Residential Prospects</p>
                          <p class="text-3xl font-bold text-slate-800">{{ residentialProspectsCount }}</p>
                      </div>
                  </button>
              </div>
          </section>

          <section class="mt-10 grid grid-cols-1 lg:grid-cols-3 gap-8">
              <Card class="lg:col-span-2">
                  <h3 class="text-xl font-bold text-slate-700 mb-4">Live Activity Feed</h3>
                  <ul class="space-y-2">
                      <li v-for="activity in activityFeedItems" :key="activity.id" 
                          @click="handleActivityClick(activity)"
                          class="flex items-center p-2 rounded-lg hover:bg-slate-50 cursor-pointer">
                          <div class="flex-shrink-0 bg-slate-100 rounded-full p-2 mr-4">
                              <i :data-lucide="activity.icon" class="w-5 h-5 text-slate-500"></i>
                          </div>
                          <div class="flex-grow">
                              <p class="text-sm text-slate-700">{{ activity.text }}</p>
                          </div>
                          <div class="flex-shrink-0 text-xs text-slate-400 self-start">
                              {{ activity.time }}
                          </div>
                      </li>
                  </ul>
              </Card>
              <div class="space-y-8">
                <Card>
                    <div class="flex justify-between items-center mb-2">
                        <h3 class="text-xl font-bold text-slate-700">Lead Sources (All Time)</h3>
                         <button class="text-xs font-semibold text-indigo-600 hover:underline" @click="setCurrentView(View.LeadIntelligence)">Details</button>
                    </div>
                    <div class="h-40">
                       <canvas ref="leadSourceChartRef"></canvas>
                    </div>
                </Card>
                 <Card>
                     <div class="flex justify-between items-center mb-2">
                        <h3 class="text-xl font-bold text-slate-700">Competitor Permit Share</h3>
                        <button class="text-xs font-semibold text-indigo-600 hover:underline" @click="setCurrentView(View.CompetitorIntel)">Details</button>
                    </div>
                    <div class="h-32">
                        <canvas ref="competitorChartRef"></canvas>
                    </div>
                </Card>
              </div>
          </section>
        </div>
    </main>
</template>

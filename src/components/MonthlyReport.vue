<script setup lang="ts">
import { ref, onMounted, computed, nextTick } from 'vue';
import { View } from '@/types';
import { COMPETITOR_WEB_INTEL, LEAD_DATA, RESIDENTIAL_PROSPECT_DATA } from '@/data';
import { Chart, registerables } from 'chart.js';
Chart.register(...registerables);

const props = defineProps<{
  trackedCompetitors: string[];
}>();

const emit = defineEmits(['setCurrentView']);

const competitorChartRef = ref<HTMLCanvasElement | null>(null);
const leadSourceChartRef = ref<HTMLCanvasElement | null>(null);

let competitorChartInstance: any = null;
let leadSourceChartInstance: any = null;

const filteredIntel = computed(() => {
    return COMPETITOR_WEB_INTEL.filter(item => props.trackedCompetitors.includes(item.competitorName));
});

const activityCounts = computed(() => {
    return filteredIntel.value.reduce((acc: { [key: string]: number }, item) => {
        acc[item.competitorName] = (acc[item.competitorName] || 0) + 1;
        return acc;
    }, {} as { [key: string]: number });
});

const monthlyLeadData = computed(() => {
    const permitLeads = LEAD_DATA.filter(l => l.type === 'permit').length;
    const newsLeads = LEAD_DATA.filter(l => l.type === 'news').length;
    const residentialLeads = RESIDENTIAL_PROSPECT_DATA.length; 
    
    return {
        permitLeads,
        newsLeads,
        totalLeads: permitLeads + newsLeads,
        residentialLeads
    };
});

onMounted(() => {
    nextTick(() => {
        renderCompetitorChart();
        renderLeadSourceChart();
    });
});

const renderCompetitorChart = () => {
  if (competitorChartRef.value) {
    if (competitorChartInstance) competitorChartInstance.destroy();
    const ctx = competitorChartRef.value.getContext('2d');
    const labels = Object.keys(activityCounts.value);
    const data = Object.values(activityCounts.value);
    
    competitorChartInstance = new Chart(ctx, {
      type: 'bar',
      data: {
        labels: labels,
        datasets: [{
          label: 'Number of Announcements',
          data: data,
          backgroundColor: ['rgba(59, 130, 246, 0.6)','rgba(239, 68, 68, 0.6)','rgba(16, 185, 129, 0.6)','rgba(139, 92, 246, 0.6)'],
          borderColor: ['rgba(59, 130, 246, 1)','rgba(239, 68, 68, 1)','rgba(16, 185, 129, 1)','rgba(139, 92, 246, 1)'],
          borderWidth: 1
        }]
      },
      options: { responsive: true, maintainAspectRatio: false, plugins: { legend: { display: false } }, scales: { y: { beginAtZero: true, ticks: { stepSize: 1 } } } }
    });
  }
};

const renderLeadSourceChart = () => {
     if (leadSourceChartRef.value) {
        if (leadSourceChartInstance) leadSourceChartInstance.destroy();
        const ctx = leadSourceChartRef.value.getContext('2d');
        leadSourceChartInstance = new Chart(ctx, {
            type: 'doughnut',
            data: { 
                labels: ['Permit Leads', 'News Leads'], 
                datasets: [{ 
                    data: [monthlyLeadData.value.permitLeads, monthlyLeadData.value.newsLeads], 
                    backgroundColor: ['rgba(20, 184, 166, 0.7)', 'rgba(14, 165, 233, 0.7)'], 
                    borderColor: ['#FFF'],
                    borderWidth: 2
                }] 
            },
            options: { responsive: true, maintainAspectRatio: false, plugins: { legend: { position: 'bottom', labels: { usePointStyle: true, boxWidth: 8, padding: 15 } } } }
        });
    }
};

const executiveSummary = computed(() => `Gemini Analysis: This month saw significant activity from Hard-Court Pros, who secured a major educational contract, while your pipeline grew by ${monthlyLeadData.value.totalLeads} new commercial leads, primarily from permit filings. Your residential prospecting efforts also identified ${monthlyLeadData.value.residentialLeads} potential leads. The competitive landscape is shifting towards specialized markets, a trend you are well-positioned to capitalize on.`);

</script>

<template>
    <main class="flex-1 bg-slate-200 p-6 md:p-8 overflow-y-auto">
        <header class="max-w-5xl mx-auto mb-4 flex justify-between items-center">
             <button @click="emit('setCurrentView', View.CompetitorIntel)" class="flex items-center text-sm font-semibold text-slate-600 hover:text-slate-800">
                <i data-lucide="arrow-left" class="w-4 h-4 mr-2"></i>
                Back to Competitor Intel
            </button>
            <div class="flex items-center gap-3">
                <button class="px-3 py-1.5 bg-white text-slate-700 font-semibold border border-slate-300 rounded-md shadow-sm hover:bg-slate-50 text-sm flex items-center">
                    <i data-lucide="printer" class="w-4 h-4 mr-2"></i>Print
                </button>
                <button class="px-3 py-1.5 bg-slate-700 text-white font-semibold rounded-md shadow-sm hover:bg-slate-800 text-sm flex items-center">
                    <i data-lucide="download" class="w-4 h-4 mr-2"></i>Download as PDF
                </button>
            </div>
        </header>

        <div class="bg-white p-8 md:p-12 rounded-lg shadow-lg max-w-5xl mx-auto animate-fade-in-up">
            <div class="flex justify-between items-start pb-4 border-b border-slate-200">
                <div>
                    <h1 class="text-3xl font-extrabold text-slate-800">Monthly Intelligence Report</h1>
                    <p class="text-slate-500">August 2025 Summary</p>
                </div>
                <div class="text-right flex-shrink-0">
                    <img src="https://picsum.photos/seed/esblogo/120/40" alt="Elite Sports Builders Logo" class="mb-2 ml-auto" />
                    <p class="text-xs text-slate-600">Generated: {{ new Date().toLocaleDateString() }}</p>
                </div>
            </div>

            <section class="mt-8">
                <h2 class="text-xl font-bold text-slate-700 flex items-center gap-2">
                    <i data-lucide="brain-circuit" class="w-5 h-5 text-indigo-500"></i>
                    Executive Summary
                </h2>
                <p class="mt-2 text-sm text-slate-600 bg-slate-50 p-4 rounded-lg border border-slate-200 italic">
                    {{ executiveSummary }}
                </p>
            </section>

            <section class="mt-8 grid grid-cols-1 md:grid-cols-3 gap-8">
                <div class="md:col-span-1 space-y-4">
                     <div>
                        <h3 class="font-bold text-slate-600">Your Lead Generation</h3>
                        <div class="mt-2 p-4 bg-slate-50 rounded-lg border border-slate-200">
                            <div class="flex justify-between items-center">
                                <p class="text-sm text-slate-700">Commercial Leads</p>
                                <p class="text-2xl font-bold text-indigo-600">{{ monthlyLeadData.totalLeads }}</p>
                            </div>
                             <div class="flex justify-between items-center mt-2">
                                <p class="text-sm text-slate-700">Residential Prospects</p>
                                <p class="text-2xl font-bold text-indigo-600">{{ monthlyLeadData.residentialLeads }}</p>
                            </div>
                        </div>
                    </div>
                    <div>
                        <h3 class="font-bold text-slate-600">Commercial Lead Sources</h3>
                        <div class="mt-2 h-48">
                            <canvas ref="leadSourceChartRef"></canvas>
                        </div>
                    </div>
                </div>
                <div class="md:col-span-2">
                     <h3 class="font-bold text-slate-600">Competitor Web Activity</h3>
                     <div class="mt-2 h-64">
                        <canvas ref="competitorChartRef"></canvas>
                     </div>
                </div>
            </section>
            
            <section class="mt-8">
                <h2 class="text-xl font-bold text-slate-700 flex items-center gap-2">
                    <i data-lucide="swords" class="w-5 h-5 text-indigo-500"></i>
                    Detailed Competitor Intel
                </h2>
                 <div class="mt-4 space-y-4">
                    <div v-for="item in filteredIntel" :key="item.id" class="p-4 border border-slate-200 rounded-lg">
                        <div class="flex justify-between items-center mb-2">
                            <p class="font-bold text-indigo-600">{{ item.competitorName }}</p>
                            <p class="text-xs text-slate-500">{{ item.date }}</p>
                        </div>
                        <h4 class="font-semibold text-slate-800">{{ item.headline }}</h4>
                        <p class="text-sm text-slate-600 mt-2 bg-slate-50 p-3 rounded-md border border-slate-200 italic">{{ item.aiSummary }}</p>
                    </div>
                 </div>
            </section>
            
            <div class="mt-12 pt-4 border-t border-slate-200 text-center text-xs text-slate-500">
                <p>Report generated by Court Detector for Elite Sports Builders</p>
            </div>
        </div>
    </main>
</template>
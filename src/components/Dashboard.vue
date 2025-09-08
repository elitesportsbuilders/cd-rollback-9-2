<script setup lang="ts">
import { ref, onMounted, nextTick } from 'vue';
import { Chart, registerables } from 'chart.js';
import { ACTIVITY_FEED_DATA, COMPETITOR_SEO_DATA } from '@/data';
import { 
    FileText, 
    Home, 
    BellRing, 
    Newspaper, 
    Swords,
    TrendingUp,
    DollarSign,
    ClipboardList
} from 'lucide-vue-next';

Chart.register(...registerables);

const kpiData = {
    newLeads: 12,
    conversionRate: 28,
    activeProjects: 21,
};

const revenueChartCanvas = ref<HTMLCanvasElement | null>(null);
const leadsByTypeCanvas = ref<HTMLCanvasElement | null>(null);
const projectStatusCanvas = ref<HTMLCanvasElement | null>(null);

const getIcon = (iconName: string) => {
    switch(iconName) {
        case 'file-text': return FileText;
        case 'home': return Home;
        case 'bell-ring': return BellRing;
        case 'newspaper': return Newspaper;
        case 'swords': return Swords;
        default: return FileText;
    }
};

onMounted(() => {
  nextTick(() => {
    // --- FIX: Check if canvas elements exist before creating charts ---
    if (revenueChartCanvas.value) {
        new Chart(revenueChartCanvas.value, {
            type: 'bar',
            data: {
                labels: ['May', 'June', 'July', 'August', 'September'],
                datasets: [{
                    label: 'Revenue ($K)',
                    data: [120, 190, 150, 210, 180],
                    backgroundColor: 'rgba(79, 70, 229, 0.8)',
                    borderRadius: 4,
                }]
            },
            options: { responsive: true, maintainAspectRatio: false }
        });
    }

    if (leadsByTypeCanvas.value) {
        new Chart(leadsByTypeCanvas.value, {
            type: 'doughnut',
            data: {
                labels: ['Permit Leads', 'News Leads', 'Referrals'],
                datasets: [{
                    data: [45, 30, 25],
                    backgroundColor: ['#4f46e5', '#14B8A6', '#f59e0b'],
                }]
            },
            options: { responsive: true, maintainAspectRatio: false, plugins: { legend: { position: 'bottom' }} }
        });
    }

    if (projectStatusCanvas.value) {
        new Chart(projectStatusCanvas.value, {
            type: 'pie',
            data: {
                labels: ['New Construction', 'Resurfacing', 'Repair', 'Maintenance'],
                datasets: [{
                    data: [8, 12, 5, 4],
                    backgroundColor: ['#4f46e5', '#14B8A6', '#f59e0b', '#3b82f6'],
                }]
            },
            options: { responsive: true, maintainAspectRatio: false, plugins: { legend: { position: 'bottom' }} }
        });
    }
  });
});
</script>

<template>
    <div class="flex-1 overflow-y-auto bg-slate-50 p-6">
        <h1 class="text-3xl font-bold text-slate-800 mb-6">Dashboard</h1>

        <!-- KPIs -->
        <div class="grid grid-cols-1 md:grid-cols-3 gap-6 mb-6">
            <div class="bg-white p-4 rounded-lg shadow-md border border-slate-200 flex items-center">
                <div class="p-3 bg-indigo-100 rounded-full mr-4"><TrendingUp class="w-6 h-6 text-indigo-600"/></div>
                <div>
                    <p class="text-sm text-slate-500">New Leads This Month</p>
                    <p class="text-2xl font-bold text-slate-800">{{ kpiData.newLeads }}</p>
                </div>
            </div>
            <div class="bg-white p-4 rounded-lg shadow-md border border-slate-200 flex items-center">
                <div class="p-3 bg-teal-100 rounded-full mr-4"><DollarSign class="w-6 h-6 text-teal-600"/></div>
                <div>
                    <p class="text-sm text-slate-500">Lead Conversion Rate</p>
                    <p class="text-2xl font-bold text-slate-800">{{ kpiData.conversionRate }}%</p>
                </div>
            </div>
            <div class="bg-white p-4 rounded-lg shadow-md border border-slate-200 flex items-center">
                <div class="p-3 bg-amber-100 rounded-full mr-4"><ClipboardList class="w-6 h-6 text-amber-600"/></div>
                <div>
                    <p class="text-sm text-slate-500">Active Projects</p>
                    <p class="text-2xl font-bold text-slate-800">{{ kpiData.activeProjects }}</p>
                </div>
            </div>
        </div>

        <!-- Charts -->
        <div class="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-6">
            <div class="lg:col-span-2 bg-white p-6 rounded-lg shadow-md border border-slate-200">
                <h2 class="text-xl font-bold text-slate-800 mb-4">Revenue Overview</h2>
                <div class="h-80"><canvas ref="revenueChartCanvas"></canvas></div>
            </div>
            <div class="bg-white p-6 rounded-lg shadow-md border border-slate-200">
                <h2 class="text-xl font-bold text-slate-800 mb-4">Leads by Type</h2>
                <div class="h-80"><canvas ref="leadsByTypeCanvas"></canvas></div>
            </div>
        </div>
        
        <div class="grid grid-cols-1 lg:grid-cols-3 gap-6">
             <div class="bg-white p-6 rounded-lg shadow-md border border-slate-200">
                <h2 class="text-xl font-bold text-slate-800 mb-4">Projects by Type</h2>
                <div class="h-80"><canvas ref="projectStatusCanvas"></canvas></div>
            </div>
            <div class="lg:col-span-2 bg-white p-6 rounded-lg shadow-md border border-slate-200">
                <h2 class="text-xl font-bold text-slate-800 mb-4">Recent Activity</h2>
                <div class="space-y-4">
                    <div v-for="item in ACTIVITY_FEED_DATA" :key="item.id" class="flex items-center">
                        <div class="p-2 bg-slate-100 rounded-full mr-3">
                            <component :is="getIcon(item.icon)" class="w-5 h-5 text-slate-500" />
                        </div>
                        <div class="flex-1">
                            <p class="text-sm text-slate-700">{{ item.text }}</p>
                        </div>
                        <p class="text-xs text-slate-400">{{ item.time }}</p>
                    </div>
                </div>
            </div>
        </div>
    </div>
</template>

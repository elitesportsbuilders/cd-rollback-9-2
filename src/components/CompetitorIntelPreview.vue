<template>
  <div class="p-8 max-w-6xl mx-auto">
    <!-- Header -->
    <div class="mb-8 flex items-center justify-between">
      <div>
        <h1 class="text-3xl font-bold text-slate-800">Competitor Intelligence (Preview)</h1>
        <p class="text-slate-500 mt-1">Track and analyze your competitors in real time.</p>
      </div>
      <button class="bg-indigo-600 text-white px-4 py-2 rounded-lg font-semibold shadow hover:bg-indigo-700">
        + Add Competitor
      </button>
    </div>

    <!-- Summary Stats -->
    <div class="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
      <div class="bg-white rounded-lg shadow p-4 flex items-center">
        <i data-lucide="users" class="w-6 h-6 text-indigo-600 mr-3"></i>
        <div>
          <div class="text-2xl font-bold">{{ competitors.length }}</div>
          <div class="text-slate-500 text-sm">Tracked Competitors</div>
        </div>
      </div>
      <div class="bg-white rounded-lg shadow p-4 flex items-center">
        <i data-lucide="activity" class="w-6 h-6 text-green-600 mr-3"></i>
        <div>
          <div class="text-2xl font-bold">{{ activeCount }}</div>
          <div class="text-slate-500 text-sm">Active</div>
        </div>
      </div>
      <div class="bg-white rounded-lg shadow p-4 flex items-center">
        <i data-lucide="clock" class="w-6 h-6 text-yellow-600 mr-3"></i>
        <div>
          <div class="text-2xl font-bold">{{ dormantCount }}</div>
          <div class="text-slate-500 text-sm">Dormant</div>
        </div>
      </div>
    </div>

    <!-- Search & Filter -->
    <div class="mb-6 flex flex-col md:flex-row gap-4 items-center">
      <input v-model="search" type="text" placeholder="Search competitors..." class="border rounded-lg px-3 py-2 w-full md:w-1/3" />
      <select v-model="filterStatus" class="border rounded-lg px-3 py-2 w-full md:w-1/4">
        <option value="">All Statuses</option>
        <option value="active">Active</option>
        <option value="watched">Watched</option>
        <option value="dormant">Dormant</option>
      </select>
    </div>

    <!-- Competitor Cards -->
    <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
      <div v-for="competitor in filteredCompetitors" :key="competitor.id" class="bg-white rounded-lg shadow p-6 flex flex-col">
        <div class="flex items-center mb-2">
          <img :src="competitor.logo" alt="Logo" class="w-10 h-10 rounded-full mr-3" v-if="competitor.logo" />
          <div>
            <div class="font-bold text-lg text-slate-800">{{ competitor.name }}</div>
            <span :class="statusClass(competitor.status)" class="px-2 py-1 rounded text-xs font-semibold">{{ competitor.status }}</span>
          </div>
        </div>
        <div class="text-slate-600 text-sm mb-2">{{ competitor.description }}</div>
        <div class="flex gap-2 mt-auto">
          <button @click="viewDetails(competitor)" class="text-indigo-600 hover:underline text-sm">View</button>
          <button class="text-slate-500 hover:underline text-sm">Edit</button>
          <button class="text-red-500 hover:underline text-sm">Remove</button>
        </div>
      </div>
    </div>

    <!-- Details Modal -->
    <div v-if="selectedCompetitor" class="fixed inset-0 bg-black bg-opacity-40 flex items-center justify-center z-50">
      <div class="bg-white rounded-lg shadow-xl p-8 w-full max-w-lg relative">
        <button @click="selectedCompetitor = null" class="absolute top-4 right-4 text-slate-500 hover:text-red-500">
          <i data-lucide="x" class="w-6 h-6"></i>
        </button>
        <div class="flex items-center mb-4">
          <img :src="selectedCompetitor.logo" alt="Logo" class="w-12 h-12 rounded-full mr-4" v-if="selectedCompetitor.logo" />
          <div>
            <h2 class="text-2xl font-bold text-slate-800">{{ selectedCompetitor.name }}</h2>
            <span :class="statusClass(selectedCompetitor.status)" class="px-2 py-1 rounded text-xs font-semibold">{{ selectedCompetitor.status }}</span>
          </div>
        </div>
        <div class="mb-4 text-slate-600">{{ selectedCompetitor.description }}</div>
        <div class="mb-2 text-sm text-slate-500">Last updated: {{ selectedCompetitor.lastUpdate }}</div>
        <div class="mb-2 text-sm text-slate-500">Notes: {{ selectedCompetitor.notes }}</div>
        <!-- Add more details as needed -->
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed } from 'vue';

const competitors = ref([
  { id: 1, name: 'Acme Corp', status: 'active', logo: '', description: 'Leading provider of widgets.', lastUpdate: '2025-09-10', notes: 'Recently launched new product.' },
  { id: 2, name: 'Beta Inc', status: 'watched', logo: '', description: 'Emerging competitor in the market.', lastUpdate: '2025-09-12', notes: 'Aggressive pricing.' },
  { id: 3, name: 'Gamma LLC', status: 'dormant', logo: '', description: 'No major activity in last 6 months.', lastUpdate: '2025-08-01', notes: 'Potential acquisition target.' },
  // ...more competitors
]);

const search = ref('');
const filterStatus = ref('');
const selectedCompetitor = ref(null);

const filteredCompetitors = computed(() => {
  let list = competitors.value;
  if (search.value) {
    list = list.filter(c => c.name.toLowerCase().includes(search.value.toLowerCase()));
  }
  if (filterStatus.value) {
    list = list.filter(c => c.status === filterStatus.value);
  }
  return list;
});

const activeCount = computed(() => competitors.value.filter(c => c.status === 'active').length);
const dormantCount = computed(() => competitors.value.filter(c => c.status === 'dormant').length);

function statusClass(status: string) {
  switch (status) {
    case 'active': return 'bg-green-100 text-green-800';
    case 'watched': return 'bg-yellow-100 text-yellow-800';
    case 'dormant': return 'bg-gray-100 text-gray-800';
    default: return 'bg-slate-100 text-slate-800';
  }
}

function viewDetails(competitor: any) {
  selectedCompetitor.value = competitor;
}
</script>

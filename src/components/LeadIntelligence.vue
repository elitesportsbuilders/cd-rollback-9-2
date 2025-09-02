<script setup lang="ts">
import { computed } from 'vue';
import { View } from '@/types';
import Card from '@/components/Card.vue';

const props = defineProps<{
  leads: any[];
}>();

const emit = defineEmits(['setCurrentView', 'syncLead']);

const sortedLeads = computed(() => [...props.leads].sort((a, b) => (b.aiScore || 0) - (a.aiScore || 0)));

const getScoreColor = (score: number) => {
  if (score >= 8) return 'bg-green-100 text-green-800 border-green-300';
  if (score >= 6) return 'bg-yellow-100 text-yellow-800 border-yellow-300';
  return 'bg-gray-100 text-gray-800 border-gray-300';
};
</script>

<template>
    <main class="flex-1 overflow-y-auto p-6 md:p-8">
        <header class="mb-8">
            <h2 class="text-3xl font-extrabold text-slate-800">AI Lead Intelligence</h2>
            <p class="text-slate-500 mt-1">Automatically scored and qualified leads to prioritize your efforts.</p>
        </header>

        <Card>
            <h3 class="text-xl font-bold text-slate-700 mb-4">Prioritized Leads</h3>
            <div class="space-y-4">
                <div v-for="lead in sortedLeads" :key="lead.id" class="p-4 border border-slate-200 rounded-lg hover:shadow-md hover:border-indigo-300 transition-shadow">
                    <div class="flex justify-between items-start">
                        <div>
                            <div class="flex items-center gap-3">
                                <span class="text-sm font-bold px-3 py-1 rounded-full border" :class="getScoreColor(lead.aiScore || 0)">
                                    Score: {{ lead.aiScore }}/10
                                </span>
                                <h4 class="text-lg font-bold text-slate-800">{{ lead.name }}</h4>
                            </div>
                            <p class="text-sm text-slate-500 mt-1">{{ lead.aiSummary }}</p>
                        </div>
                        <button @click="emit('setCurrentView', View.InteractiveMap, { prospectId: lead.id })" class="text-sm font-semibold text-indigo-600 hover:underline flex items-center gap-1">
                            <i data-lucide="map-pin" class="w-4 h-4"></i>
                            View on Map
                        </button>
                    </div>
                    <div class="mt-3 pt-3 border-t border-slate-200 flex justify-between items-center">
                        <div>
                            <h5 class="text-sm font-semibold text-slate-600 mb-2">Extracted Details</h5>
                            <div class="grid grid-cols-2 md:grid-cols-3 gap-x-4 gap-y-2 text-sm">
                                <div v-for="([key, value]) in Object.entries(lead.extractedData || {})" :key="key">
                                    <span class="text-slate-500">{{ key }}:</span>
                                    <span class="font-medium text-slate-700 ml-1">{{ value }}</span>
                                </div>
                            </div>
                        </div>
                        <div class="flex-shrink-0">
                            <span v-if="lead.isSynced" class="text-sm font-semibold text-slate-500 bg-slate-100 px-3 py-1.5 rounded-full flex items-center">
                                <i data-lucide="check-circle-2" class="w-4 h-4 mr-2 text-green-500"></i>
                                Synced
                            </span>
                            <button v-else @click="emit('syncLead', lead.id)" class="text-sm font-semibold text-white bg-indigo-600 hover:bg-indigo-700 px-3 py-1.5 rounded-md flex items-center gap-2 transition-colors">
                                <i data-lucide="send" class="w-4 h-4"></i>
                                Send to Pipedrive
                            </button>
                        </div>
                    </div>
                </div>
            </div>
        </Card>
    </main>
</template>

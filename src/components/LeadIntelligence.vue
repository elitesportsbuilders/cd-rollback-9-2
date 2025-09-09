<script setup lang="ts">
import { ref, computed } from 'vue';
import { 
  Lightbulb, CheckCircle2, Search, Sparkles, FileText, 
  Newspaper, X, Link as LinkIcon, Check 
} from 'lucide-vue-next';

// --- PROPS & EMITS ---
const props = defineProps<{
  leads: any[];
}>();

const emit = defineEmits(['acknowledgeLead', 'removeProspect', 'syncLead', 'setCurrentView']);

// --- LOCAL STATE ---
const activeTab = ref('ai-discovered');

// --- COMPUTED PROPERTIES ---
const aiDiscoveredLeads = computed(() => {
  return props.leads.filter(lead => lead.isAcknowledged === false).sort((a, b) => (b.aiScore || 0) - (a.aiScore || 0));
});

const acknowledgedLeads = computed(() => {
  return props.leads.filter(lead => lead.isAcknowledged === true);
});

// --- HELPERS ---
const getScoreColor = (score: number) => {
  if (score >= 8) return 'text-green-600 bg-green-100 border-green-200';
  if (score >= 5) return 'text-amber-600 bg-amber-100 border-amber-200';
  return 'text-red-600 bg-red-100 border-red-200';
};

</script>

<template>
  <div class="flex flex-col h-full bg-slate-100">
    <!-- Header -->
    <header class="p-4 sm:p-6 bg-white border-b border-slate-200 flex-shrink-0">
      <div class="flex justify-between items-center">
        <div>
          <h1 class="text-2xl font-bold text-slate-800 flex items-center">
            <Lightbulb class="w-7 h-7 mr-3 text-indigo-600" />
            Lead Intelligence
          </h1>
          <p class="text-sm text-slate-500 mt-1">Review, acknowledge, and manage new opportunities.</p>
        </div>
        <div class="relative hidden sm:block">
          <input type="text" placeholder="Search leads..." class="w-64 pl-10 pr-4 py-2 border border-slate-300 rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500" />
          <Search class="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400" />
        </div>
      </div>
    </header>

    <!-- Tab Navigation -->
    <div class="px-4 sm:px-6 bg-white border-b border-slate-200 flex-shrink-0">
      <nav class="-mb-px flex space-x-6">
        <button 
          @click="activeTab = 'ai-discovered'"
          :class="[
            'flex items-center whitespace-nowrap py-3 px-1 border-b-2 font-semibold text-sm transition-colors',
            activeTab === 'ai-discovered' 
              ? 'border-indigo-500 text-indigo-600' 
              : 'border-transparent text-slate-500 hover:text-slate-700 hover:border-slate-300'
          ]">
          <Sparkles class="w-4 h-4 mr-2"/>
          AI-Discovered
          <span class="ml-2 bg-indigo-100 text-indigo-600 text-xs font-bold px-2 py-0.5 rounded-full">{{ aiDiscoveredLeads.length }}</span>
        </button>
        <button 
          @click="activeTab = 'acknowledged'"
          :class="[
            'flex items-center whitespace-nowrap py-3 px-1 border-b-2 font-semibold text-sm transition-colors',
            activeTab === 'acknowledged' 
              ? 'border-indigo-500 text-indigo-600' 
              : 'border-transparent text-slate-500 hover:text-slate-700 hover:border-slate-300'
          ]">
          <CheckCircle2 class="w-4 h-4 mr-2"/>
          Acknowledged
        </button>
      </nav>
    </div>

    <!-- Tab Content -->
    <div class="flex-1 overflow-y-auto p-4 sm:p-6">
      <!-- AI-Discovered Leads List -->
      <div v-if="activeTab === 'ai-discovered'">
        <TransitionGroup 
          v-if="aiDiscoveredLeads.length > 0" 
          tag="div" 
          name="lead-card" 
          class="space-y-4"
        >
          <!-- Intelligence Briefing Cards -->
          <div v-for="lead in aiDiscoveredLeads" :key="lead.id" class="bg-white rounded-lg shadow-sm border border-slate-200 overflow-hidden">
            <div class="p-5">
              <div class="flex justify-between items-start">
                <div class="flex-1 mr-4">
                  <h3 class="font-bold text-slate-800 text-lg">{{ lead.name }}</h3>
                  <a :href="lead.sourceUrl || '#'" target="_blank" class="text-xs text-slate-500 hover:text-indigo-600 hover:underline flex items-center mt-1">
                    <LinkIcon class="w-3 h-3 mr-1.5"/>
                    Source: {{ lead.source }}
                  </a>
                </div>
                <div class="flex-shrink-0 text-center">
                  <p class="text-xs font-semibold text-slate-500 mb-1">Opportunity Score</p>
                  <div :class="getScoreColor(lead.aiScore)" class="w-16 h-16 rounded-full flex items-center justify-center text-xl font-bold border-2">
                    {{ lead.aiScore }}/10
                  </div>
                </div>
              </div>
              <p class="text-sm text-slate-700 mt-4">{{ lead.aiSummary }}</p>
              <div v-if="lead.extractedData && Object.keys(lead.extractedData).length > 0" class="mt-4 pt-4 border-t border-slate-200/80">
                <h4 class="text-xs font-semibold text-slate-500 uppercase tracking-wider mb-2">Extracted Details</h4>
                <div class="grid grid-cols-1 sm:grid-cols-2 gap-x-4 gap-y-2 text-sm">
                  <div v-for="(value, key) in lead.extractedData" :key="key" class="flex">
                    <span class="font-semibold text-slate-600 w-28 flex-shrink-0">{{ key }}:</span>
                    <span class="text-slate-800">{{ value }}</span>
                  </div>
                </div>
              </div>
            </div>
            <div class="bg-slate-50/70 px-5 py-3 flex justify-end items-center space-x-3 border-t border-slate-200">
                <button @click="emit('removeProspect', lead.id)" class="px-4 py-1.5 text-sm font-semibold text-slate-600 bg-white border border-slate-300 rounded-md hover:bg-slate-100 flex items-center">
                  <X class="w-4 h-4 mr-2"/>
                  Dismiss
                </button>
                <button @click="emit('acknowledgeLead', lead.id)" class="px-4 py-1.5 text-sm font-semibold text-white bg-indigo-600 rounded-md hover:bg-indigo-700 flex items-center">
                  <Check class="w-4 h-4 mr-2"/>
                  Acknowledge
                </button>
            </div>
          </div>
        </TransitionGroup>
        <div v-else class="text-center py-16 px-6 border-2 border-dashed border-slate-200 rounded-lg">
          <Sparkles class="w-10 h-10 mx-auto text-slate-300 mb-2" />
          <h3 class="font-semibold text-slate-700">All Clear!</h3>
          <p class="text-sm text-slate-500 mt-1">There are no new AI-discovered leads to review at this time.</p>
        </div>
      </div>

      <!-- Acknowledged Leads List -->
      <div v-if="activeTab === 'acknowledged'">
         <div v-if="acknowledgedLeads.length > 0" class="bg-white rounded-lg shadow-sm border border-slate-200">
          <ul role="list" class="divide-y divide-slate-200">
            <li v-for="lead in acknowledgedLeads" :key="lead.id" class="flex items-center justify-between px-5 py-4">
              <div class="flex items-center">
                <div class="mr-4 p-2 bg-slate-100 rounded-full">
                  <FileText v-if="lead.type === 'permit'" class="w-5 h-5 text-violet-600" />
                  <Newspaper v-else class="w-5 h-5 text-sky-600" />
                </div>
                <div>
                  <p class="font-semibold text-slate-800">{{ lead.name }}</p>
                  <p class="text-xs text-slate-500">Source: {{ lead.source }}</p>
                </div>
              </div>
              <button v-if="!lead.isSynced" @click="emit('syncLead', lead.id)" class="px-3 py-1 text-sm font-semibold text-white bg-slate-700 rounded-md hover:bg-slate-800">
                Sync to CRM
              </button>
              <div v-else class="px-3 py-1 text-sm font-semibold text-green-700 bg-green-100 rounded-full flex items-center">
                <Check class="w-4 h-4 mr-1.5"/>
                Synced
              </div>
            </li>
          </ul>
        </div>
         <div v-else class="text-center py-16 px-6 border-2 border-dashed border-slate-200 rounded-lg">
          <CheckCircle2 class="w-10 h-10 mx-auto text-slate-300 mb-2" />
          <h3 class="font-semibold text-slate-700">No Acknowledged Leads</h3>
          <p class="text-sm text-slate-500 mt-1">Acknowledge a lead from the "AI-Discovered" tab to see it here.</p>
        </div>
      </div>
    </div>
  </div>
</template>

<style scoped>
/* Transition for lead cards when they are acknowledged or dismissed */
.lead-card-leave-active {
  transition: all 0.4s ease;
}
.lead-card-leave-to {
  opacity: 0;
  transform: translateX(30px);
}
.lead-card-move {
  transition: transform 0.4s ease;
}
</style>

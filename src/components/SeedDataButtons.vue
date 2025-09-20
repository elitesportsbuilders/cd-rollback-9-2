<template>
  <div class="flex flex-col gap-2">
    <button @click="seedCompetitorIntel" :disabled="loadingCompetitor" class="bg-indigo-600 text-white px-4 py-2 rounded shadow hover:bg-indigo-700 font-semibold" :class="{ pulse: loadingCompetitor }">
      <span class="inline-flex items-center">
        <svg v-if="loadingCompetitor" class="animate-spin h-5 w-5 mr-2 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
          <circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4"></circle>
          <path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
        </svg>
        Seed Competitor Intel
      </span>
    </button>
    <button @click="seedLeads" :disabled="loadingLeads" class="bg-green-600 text-white px-4 py-2 rounded shadow hover:bg-green-700 font-semibold" :class="{ pulse: loadingLeads }">
      <span class="inline-flex items-center">
        <svg v-if="loadingLeads" class="animate-spin h-5 w-5 mr-2 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
          <circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4"></circle>
          <path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
        </svg>
        Seed Leads
      </span>
    </button>
    <button @click="seedProspects" :disabled="loadingProspects" class="bg-blue-600 text-white px-4 py-2 rounded shadow hover:bg-blue-700 font-semibold" :class="{ pulse: loadingProspects }">
      <span class="inline-flex items-center">
        <svg v-if="loadingProspects" class="animate-spin h-5 w-5 mr-2 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
          <circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4"></circle>
          <path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
        </svg>
        Seed Prospects
      </span>
    </button>
    <button @click="seedUserIntel" :disabled="loadingUserIntel" class="bg-yellow-500 text-white px-4 py-2 rounded shadow hover:bg-yellow-600 font-semibold" :class="{ pulse: loadingUserIntel }">
      <span class="inline-flex items-center">
        <svg v-if="loadingUserIntel" class="animate-spin h-5 w-5 mr-2 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
          <circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4"></circle>
          <path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
        </svg>
        Seed User Intel
      </span>
    </button>
  </div>
</template>

<script setup lang="ts">
import { ref, defineProps } from 'vue';
import { seedCompetitorIntelGlobal } from '@/utils/seedCompetitorIntel';
import { seedLeadsGlobal } from '@/utils/seedLeads';
import { seedProspectsGlobal } from '@/utils/seedProspects';
import { seedUserIntelGlobal } from '@/utils/seedUserIntel';

const props = defineProps<{ appId: string, userId: string }>();

const loadingCompetitor = ref(false);
const loadingLeads = ref(false);
const loadingProspects = ref(false);
const loadingUserIntel = ref(false);

async function seedCompetitorIntel() {
  loadingCompetitor.value = true;
  await seedCompetitorIntelGlobal(props.appId, props.userId);
  loadingCompetitor.value = false;
}
async function seedLeads() {
  loadingLeads.value = true;
  await seedLeadsGlobal(props.appId, props.userId);
  loadingLeads.value = false;
}
async function seedProspects() {
  loadingProspects.value = true;
  await seedProspectsGlobal(props.appId, props.userId);
  loadingProspects.value = false;
}
async function seedUserIntel() {
  loadingUserIntel.value = true;
  await seedUserIntelGlobal(props.appId, props.userId);
  loadingUserIntel.value = false;
}
</script>

<style scoped>
.pulse {
  animation: pulse 1.5s infinite;
}
@keyframes pulse {
  0% { box-shadow: 0 0 0 0 rgba(99,102,241,0.7); }
  70% { box-shadow: 0 0 0 10px rgba(99,102,241,0); }
  100% { box-shadow: 0 0 0 0 rgba(99,102,241,0); }
}
</style>

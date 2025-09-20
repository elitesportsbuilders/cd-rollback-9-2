<template>
  <button @click="seedIntel" :disabled="loading" class="bg-indigo-600 text-white px-4 py-2 rounded shadow hover:bg-indigo-700 font-semibold" :class="{ 'pulse': !loading, 'opacity-50 cursor-not-allowed': loading }">
    <span class="inline-flex items-center">
      <svg v-if="loading" class="animate-spin h-5 w-5 mr-2 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
        <circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4"></circle>
        <path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
      </svg>
      Seed Competitor Intel (Global)
    </span>
  </button>
</template>

<script setup lang="ts">
import { ref } from 'vue';
import { seedCompetitorIntelGlobal } from '@/utils/seedCompetitorIntel';

const props = defineProps<{
  appId: string;
  userId: string;
}>();

const loading = ref(false);

async function seedIntel() {
  loading.value = true;
  await seedCompetitorIntelGlobal(props.appId, props.userId);
  loading.value = false;
}
</script>

<style scoped>
.pulse {
  animation: pulse 1.5s infinite ease-in-out;
}
@keyframes pulse {
  0% { box-shadow: 0 0 0 0 rgba(99,102,241,0.7); }
  70% { box-shadow: 0 0 0 10px rgba(99,102,241,0); }
  100% { box-shadow: 0 0 0 0 rgba(99,102,241,0); }
}
</style>

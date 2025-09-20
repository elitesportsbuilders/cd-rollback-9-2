
<template>
  <div class="grid grid-cols-1 md:grid-cols-2 gap-8 p-8 w-full">
    <div class="bg-white rounded-lg shadow border p-6 flex flex-col">
      <h2 class="text-xl font-bold mb-4 text-center text-slate-800">Current CompetitorIntel.vue</h2>
      <CompetitorIntel />
    </div>
    <div class="bg-white rounded-lg shadow border p-6 flex flex-col">
      <h2 class="text-xl font-bold mb-4 text-center text-slate-800">Preview Layout</h2>
      <CompetitorIntelPreview />
    </div>
  </div>
</template>

<script setup lang="ts">
import CompetitorIntel from '@/components/CompetitorIntel.vue';
import CompetitorIntelPreview from '@/components/CompetitorIntelPreview.vue';
</script>

<style scoped>
.grid {
  min-height: 80vh;
}
</style>

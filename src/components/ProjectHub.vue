<script setup lang="ts">
import { computed } from 'vue';
import { 
  ArrowLeft, Building2, Calendar, ShieldCheck, Wrench, 
  PaintRoller, AlertTriangle, ExternalLink, Camera
} from 'lucide-vue-next';
import { View } from '@/types';

// --- PROPS & EMITS ---
const props = defineProps<{
  project: any;
}>();

const emit = defineEmits(['setCurrentView']);

// --- BUSINESS LOGIC FOR ALERTS ---
const maintenanceAlerts = computed(() => {
  const alerts = [];
  if (!props.project || !props.project.completionDate) return [];

  // Use a fixed "today" for consistent demo purposes with mock data
  const today = new Date('2025-09-08T12:00:00Z');
  const completionDate = new Date(props.project.completionDate);
  const warrantyExpiration = new Date(props.project.warrantyExpiration);

  // 1. Resurfacing Alert (5+ years)
  const yearsSinceCompletion = (today.getTime() - completionDate.getTime()) / (1000 * 60 * 60 * 24 * 365);
  if (yearsSinceCompletion >= 5) {
    alerts.push({
      type: 'resurface',
      level: 'critical',
      icon: PaintRoller,
      title: 'Resurfacing Recommended',
      message: `Project completed over ${Math.floor(yearsSinceCompletion)} years ago. Recommend evaluation for resurfacing.`
    });
  }

  // 2. Warranty Alert (Expired or expiring in 6 months)
  const monthsToWarrantyExpiry = (warrantyExpiration.getTime() - today.getTime()) / (1000 * 60 * 60 * 24 * 30.44);
  if (monthsToWarrantyExpiry <= 0) {
     alerts.push({
      type: 'warranty',
      level: 'critical',
      icon: AlertTriangle,
      title: 'Warranty Expired',
      message: `The project warranty expired on ${warrantyExpiration.toLocaleDateString()}.`
    });
  } else if (monthsToWarrantyExpiry <= 6) {
    alerts.push({
      type: 'warranty',
      level: 'warning',
      icon: ShieldCheck,
      title: 'Warranty Expiring Soon',
      message: `Project warranty expires in under ${Math.ceil(monthsToWarrantyExpiry)} months. Proactive outreach recommended.`
    });
  }
  
  // 3. Maintenance Alert (1+ year)
  if (yearsSinceCompletion >= 1 && yearsSinceCompletion < 5) {
     alerts.push({
      type: 'maintenance',
      level: 'info',
      icon: Wrench,
      title: 'Routine Maintenance Due',
      message: 'Annual power wash and inspection is recommended to preserve surface integrity.'
    });
  }

  return alerts;
});

const getAlertClasses = (level: string) => {
  switch (level) {
    case 'critical': return 'bg-red-50 border-red-500 text-red-800';
    case 'warning': return 'bg-amber-50 border-amber-500 text-amber-800';
    case 'info': return 'bg-sky-50 border-sky-500 text-sky-800';
    default: return 'bg-slate-50 border-slate-500 text-slate-800';
  }
};
</script>

<template>
  <div class="flex flex-col h-full bg-slate-100">
    <header class="p-4 sm:p-6 bg-white border-b border-slate-200 flex-shrink-0">
      <div class="flex items-center">
        <button @click="emit('setCurrentView', View.InteractiveMap)" class="mr-4 p-2 rounded-full hover:bg-slate-100">
          <ArrowLeft class="w-5 h-5 text-slate-600" />
        </button>
        <div>
          <h1 class="text-2xl font-bold text-slate-800 flex items-center">
            <Building2 class="w-7 h-7 mr-3 text-indigo-600" />
            {{ project?.name || 'Loading Project...' }}
          </h1>
          <p class="text-sm text-slate-500 mt-1">Client Project Hub</p>
        </div>
      </div>
    </header>

    <div v-if="project" class="flex-1 overflow-y-auto p-4 sm:p-6 space-y-6">
      <!-- Maintenance Alerts -->
      <div v-if="maintenanceAlerts.length > 0">
        <h2 class="text-sm font-bold text-slate-600 uppercase tracking-wider mb-3">Actionable Alerts</h2>
        <div class="space-y-3">
          <div v-for="alert in maintenanceAlerts" :key="alert.type" :class="getAlertClasses(alert.level)" class="p-4 rounded-lg border-l-4 flex">
            <component :is="alert.icon" class="w-6 h-6 mr-4 flex-shrink-0 mt-0.5" />
            <div>
              <h3 class="font-bold">{{ alert.title }}</h3>
              <p class="text-sm mt-1">{{ alert.message }}</p>
            </div>
          </div>
        </div>
      </div>

      <!-- Project Details -->
      <div>
        <h2 class="text-sm font-bold text-slate-600 uppercase tracking-wider mb-3">Project Details</h2>
        <div class="bg-white p-6 rounded-lg shadow-sm border border-slate-200 grid grid-cols-1 md:grid-cols-3 gap-6">
          <div class="flex items-start">
            <PaintRoller class="w-7 h-7 mr-4 text-slate-400 mt-1" />
            <div>
              <p class="text-xs text-slate-500">Surface Type</p>
              <p class="font-semibold text-slate-800 text-lg">{{ project.surfaceType }}</p>
            </div>
          </div>
          <div class="flex items-start">
            <Calendar class="w-7 h-7 mr-4 text-slate-400 mt-1" />
            <div>
              <p class="text-xs text-slate-500">Completion Date</p>
              <p class="font-semibold text-slate-800 text-lg">{{ new Date(project.completionDate).toLocaleDateString() }}</p>
            </div>
          </div>
          <div class="flex items-start">
            <ShieldCheck class="w-7 h-7 mr-4 text-slate-400 mt-1" />
            <div>
              <p class="text-xs text-slate-500">Warranty Expiration</p>
              <p class="font-semibold text-slate-800 text-lg">{{ new Date(project.warrantyExpiration).toLocaleDateString() }}</p>
            </div>
          </div>
        </div>
         <div class="mt-4">
            <a :href="project.googleDriveLink" target="_blank" class="inline-flex items-center px-4 py-2 text-sm font-semibold text-indigo-700 bg-indigo-100 rounded-md hover:bg-indigo-200">
              <ExternalLink class="w-4 h-4 mr-2" />
              Open Google Drive Folder
            </a>
          </div>
      </div>

      <!-- Photo Gallery -->
      <div>
        <h2 class="text-sm font-bold text-slate-600 uppercase tracking-wider mb-3">Photo Gallery</h2>
        <div v-if="project.projectPhotos && project.projectPhotos.length > 0" class="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
          <div v-for="(photo, index) in project.projectPhotos" :key="index" class="aspect-w-1 aspect-h-1">
            <img :src="photo" :alt="`${project.name} Photo ${index + 1}`" class="w-full h-full object-cover rounded-lg shadow-md border-2 border-white">
          </div>
        </div>
        <div v-else class="text-center py-10 px-6 bg-white border-2 border-dashed border-slate-200 rounded-lg">
          <Camera class="w-8 h-8 mx-auto text-slate-300 mb-2" />
          <p class="text-sm text-slate-500">No project photos have been uploaded.</p>
        </div>
      </div>
    </div>
    
    <div v-else class="flex items-center justify-center h-full">
        <p class="text-slate-500">No project selected.</p>
    </div>
  </div>
</template>

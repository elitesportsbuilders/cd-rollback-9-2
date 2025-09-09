<script setup lang="ts">
import { computed, onMounted, ref, watch } from 'vue';
import { 
  Building2, Calendar, ShieldCheck, Wrench, 
  PaintRoller, AlertTriangle, ExternalLink, Camera, Sparkles, Mail, Search, UploadCloud
} from 'lucide-vue-next';
import { View } from '@/types';
import { logAiStudioCode } from '@/utils/devtools';

// --- PROPS & EMITS ---
const props = defineProps<{
  project?: any;
  prospects: any[];
}>();

const emit = defineEmits(['setCurrentView']);

// --- COMPONENT STATE ---
const clientProjects = computed(() => props.prospects.filter(p => p.isClient));
const selectedProjectId = ref<number | null>(null);
const searchTerm = ref('');

const selectedProject = computed(() => {
  return clientProjects.value.find(p => p.id === selectedProjectId.value) || null;
});

// --- AI STATE ---
const aiBriefing = ref('');
const isBriefingLoading = ref(true);
const aiOutreach = ref({ type: '', content: '', isLoading: false });

// --- BUSINESS LOGIC & ALERTS ---
const getScore = (level: string) => ({'critical': 3, 'warning': 2, 'info': 1}[level] || 0);

const getProjectAlerts = (project: any) => {
  const alerts = [];
  if (!project || !project.completionDate) return [];
  const today = new Date('2025-09-08T12:00:00Z');
  const completionDate = new Date(project.completionDate);
  const warrantyExpiration = new Date(project.warrantyExpiration);
  const yearsSinceCompletion = (today.getTime() - completionDate.getTime()) / (1000 * 60 * 60 * 24 * 365);
  const monthsToWarrantyExpiry = (warrantyExpiration.getTime() - today.getTime()) / (1000 * 60 * 60 * 24 * 30.44);

  if (yearsSinceCompletion >= 5) {
    alerts.push({ id: 'resurface', level: 'critical', title: 'Resurfacing Recommended', message: `Project completed over ${Math.floor(yearsSinceCompletion)} years ago.`, icon: PaintRoller });
  }
  if (monthsToWarrantyExpiry <= 0) {
    alerts.push({ id: 'warranty-expired', level: 'critical', title: 'Warranty Expired', message: `Warranty expired on ${warrantyExpiration.toLocaleDateString()}.`, icon: AlertTriangle });
  } else if (monthsToWarrantyExpiry <= 6) {
    alerts.push({ id: 'warranty-expiring', level: 'warning', title: 'Warranty Expiring Soon', message: `Warranty expires in under ${Math.ceil(monthsToWarrantyExpiry)} months.`, icon: ShieldCheck });
  }
  if (yearsSinceCompletion >= 1 && yearsSinceCompletion < 5 && !alerts.some(a => a.id === 'resurface')) {
    alerts.push({ id: 'maintenance', level: 'info', title: 'Routine Maintenance Due', message: 'Annual power wash and inspection recommended.', icon: Wrench });
  }
  
  return alerts;
};

const maintenanceAlerts = computed(() => getProjectAlerts(selectedProject.value));

const filteredProjects = computed(() => {
    if (!searchTerm.value) {
        return [...clientProjects.value].sort((a, b) => {
            const aScore = getProjectAlerts(a).reduce((max, alert) => Math.max(max, getScore(alert.level)), 0);
            const bScore = getProjectAlerts(b).reduce((max, alert) => Math.max(max, getScore(alert.level)), 0);
            return bScore - aScore;
        });
    }
    return clientProjects.value.filter(p => 
        p.name.toLowerCase().includes(searchTerm.value.toLowerCase())
    );
});

const getAlertClasses = (level: string) => ({
  'critical': 'bg-red-50 border-red-500 text-red-800',
  'warning': 'bg-amber-50 border-amber-500 text-amber-800',
  'info': 'bg-sky-50 border-sky-500 text-sky-800',
}[level] || 'bg-slate-50 border-slate-500 text-slate-800');

// --- AI GENERATION ---
const generateAiBriefing = async () => { /* Omitted for brevity */ };
const generateAiOutreach = async (alertId: string) => { /* Omitted for brevity */ };

// --- LIFECYCLE & WATCHERS ---
onMounted(() => {
  if (props.project) {
    selectedProjectId.value = props.project.id;
  } else if (filteredProjects.value.length > 0) {
    selectedProjectId.value = filteredProjects.value[0].id;
  }
});

watch(selectedProjectId, (newId) => {
  if (newId) {
    generateAiBriefing();
    aiOutreach.value = { type: '', content: '', isLoading: false };
  }
}, { immediate: true });
</script>

<template>
  <div class="flex h-full bg-slate-100">
    <!-- Project List Sidebar -->
    <aside class="w-1/3 max-w-sm flex-shrink-0 bg-white border-r border-slate-200 flex flex-col">
       <header class="p-4 border-b border-slate-200">
          <h2 class="text-xl font-bold text-slate-800">Client Projects</h2>
          <div class="relative mt-2">
            <Search class="absolute left-2.5 top-2.5 h-4 w-4 text-slate-400" />
            <input v-model="searchTerm" type="text" placeholder="Search projects..." class="pl-8 pr-2 py-2 w-full text-sm border border-slate-300 rounded-md focus:ring-indigo-500 focus:border-indigo-500" />
          </div>
       </header>
       <div class="flex-1 overflow-y-auto">
         <ul v-if="filteredProjects.length > 0">
           <li v-for="proj in filteredProjects" :key="proj.id">
             <button @click="selectedProjectId = proj.id" 
                :class="['w-full text-left p-4 hover:bg-indigo-50 transition-colors border-b border-slate-100', selectedProjectId === proj.id ? 'bg-indigo-100' : '']">
                <h3 class="font-semibold text-slate-800">{{ proj.name }}</h3>
                <p class="text-sm text-slate-500">{{ proj.surfaceType }}</p>
                <div v-if="getProjectAlerts(proj).length > 0" class="mt-2 flex items-center text-xs font-semibold" 
                    :class="getProjectAlerts(proj).some(a => a.level === 'critical') ? 'text-red-600' : 'text-amber-600'">
                    <AlertTriangle class="w-4 h-4 mr-1.5" />
                    {{ getProjectAlerts(proj).length }} Active Alert(s)
                </div>
             </button>
           </li>
         </ul>
         <p v-else class="p-4 text-sm text-slate-500">No projects match your search.</p>
       </div>
    </aside>

    <!-- Main Content -->
    <main class="flex-1 flex flex-col" v-if="selectedProject">
        <header class="p-4 sm:p-6 bg-white border-b border-slate-200 flex-shrink-0">
            <h1 class="text-2xl font-bold text-slate-800">{{ selectedProject.name }}</h1>
        </header>

        <div class="flex-1 overflow-y-auto p-4 sm:p-6 space-y-8">
            <!-- AI Command Center -->
            <div>
              <h2 class="text-sm font-bold text-slate-600 uppercase tracking-wider mb-3 flex items-center">
                <Sparkles class="w-4 h-4 mr-2 text-indigo-500" />
                AI Command Center
              </h2>
              <div class="bg-white p-5 rounded-lg shadow-sm border border-slate-200 space-y-6">
                <div>
                  <h3 class="font-bold text-slate-800 mb-2">Strategic Briefing</h3>
                  <div v-if="isBriefingLoading" class="space-y-2">
                      <div class="h-4 bg-slate-200 rounded animate-pulse"></div>
                      <div class="h-4 bg-slate-200 rounded w-5/6 animate-pulse"></div>
                  </div>
                  <p v-else class="text-sm text-slate-700 leading-relaxed">{{ aiBriefing }}</p>
                </div>
                
                <div>
                  <h3 class="font-bold text-slate-800 mb-3">Generate Client Outreach</h3>
                  <div v-if="maintenanceAlerts.length > 0" class="flex flex-wrap gap-2">
                    <button v-for="alert in maintenanceAlerts" :key="alert.id" @click="generateAiOutreach(alert.id)"
                      class="flex items-center px-3 py-1.5 text-xs font-semibold text-indigo-700 bg-indigo-100 rounded-full hover:bg-indigo-200 transition-colors">
                      <Mail class="w-4 h-4 mr-2" />
                      Draft "{{ alert.title }}" Email
                    </button>
                  </div>
                  <div v-else class="text-sm text-slate-500 p-3 bg-slate-50 rounded-md">
                    No immediate outreach required. This project is in good standing.
                  </div>

                   <div v-if="aiOutreach.isLoading" class="mt-4 p-4 rounded-lg bg-slate-50 text-center text-sm text-slate-600">
                      <div class="animate-spin mr-2 h-4 w-4 text-slate-400 inline-block border-2 border-transparent border-t-slate-400 rounded-full"></div>
                      Generating draft...
                  </div>
                  <div v-if="aiOutreach.content && !aiOutreach.isLoading" class="mt-4 p-4 rounded-lg bg-slate-50 border border-slate-200">
                      <h4 class="font-semibold text-slate-800">AI-Generated Draft:</h4>
                      <textarea readonly class="w-full h-48 mt-2 p-2 text-sm bg-white border border-slate-300 rounded-md font-mono">{{ aiOutreach.content }}</textarea>
                      <button @click="() => navigator.clipboard.writeText(aiOutreach.content)" class="mt-2 px-3 py-1 text-xs font-semibold text-white bg-indigo-600 rounded-md hover:bg-indigo-700">Copy Text</button>
                  </div>
                </div>
              </div>
            </div>

            <!-- Project Details & Alerts -->
             <div class="grid grid-cols-1 lg:grid-cols-2 gap-8">
                <div>
                   <h2 class="text-sm font-bold text-slate-600 uppercase tracking-wider mb-3">Project Details</h2>
                   <div class="bg-white p-6 rounded-lg shadow-sm border border-slate-200 space-y-5">
                      <div class="flex items-start"><PaintRoller class="w-6 h-6 mr-4 text-slate-400"/><p><span class="text-xs text-slate-500">Surface</span><br><span class="font-semibold text-slate-800">{{ selectedProject.surfaceType || 'N/A' }}</span></p></div>
                      <div class="flex items-start"><Calendar class="w-6 h-6 mr-4 text-slate-400"/><p><span class="text-xs text-slate-500">Completed</span><br><span class="font-semibold text-slate-800">{{ selectedProject.completionDate ? new Date(selectedProject.completionDate).toLocaleDateString() : 'N/A' }}</span></p></div>
                      <div class="flex items-start"><ShieldCheck class="w-6 h-6 mr-4 text-slate-400"/><p><span class="text-xs text-slate-500">Warranty Ends</span><br><span class="font-semibold text-slate-800">{{ selectedProject.warrantyExpiration ? new Date(selectedProject.warrantyExpiration).toLocaleDateString() : 'N/A' }}</span></p></div>
                   </div>
                   <div class="mt-4">
                      <a v-if="selectedProject.googleDriveLink" :href="selectedProject.googleDriveLink" target="_blank" class="inline-flex items-center text-sm font-semibold text-indigo-600 hover:underline">Open Drive Folder <ExternalLink class="w-4 h-4 ml-1.5" /></a>
                      <p v-else class="text-sm text-slate-500 italic">No document folder linked.</p>
                   </div>
                </div>
                 <div v-if="maintenanceAlerts.length > 0">
                    <h2 class="text-sm font-bold text-slate-600 uppercase tracking-wider mb-3">Actionable Alerts</h2>
                    <div class="space-y-3">
                      <div v-for="alert in maintenanceAlerts" :key="alert.id" :class="getAlertClasses(alert.level)" class="p-4 rounded-lg border-l-4 flex">
                        <component :is="alert.icon" class="w-6 h-6 mr-4 flex-shrink-0 mt-0.5" />
                        <div><h3 class="font-bold">{{ alert.title }}</h3><p class="text-sm mt-1">{{ alert.message }}</p></div>
                      </div>
                    </div>
                  </div>
             </div>
            
            <!-- Photo Gallery -->
            <div>
                <h2 class="text-sm font-bold text-slate-600 uppercase tracking-wider mb-3">Photo Gallery</h2>
                <div v-if="selectedProject.projectPhotos && selectedProject.projectPhotos.length > 0" class="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
                  <img v-for="(photo, index) in selectedProject.projectPhotos" :key="index" :src="photo" :alt="`${selectedProject.name} Photo ${index + 1}`" class="w-full h-full object-cover rounded-lg shadow-md border-2 border-white">
                </div>
                <div v-else class="text-center py-10 px-6 bg-white border-2 border-dashed border-slate-200 rounded-lg">
                  <Camera class="w-8 h-8 mx-auto text-slate-300 mb-2" />
                  <h3 class="font-semibold text-slate-700">No photos uploaded</h3>
                  <p class="text-sm text-slate-500 mt-1">Visually track project progress and quality.</p>
                  <button class="mt-4 px-3 py-1.5 text-xs font-semibold text-white bg-indigo-600 rounded-md hover:bg-indigo-700">
                    <UploadCloud class="w-4 h-4 mr-2 inline-block" />
                    Upload Photos
                  </button>
                </div>
            </div>
        </div>
    </main>
    <main v-else class="flex-1 flex flex-col items-center justify-center bg-slate-50 text-center p-8">
        <Building2 class="w-16 h-16 mx-auto text-slate-300 mb-4" />
        <h2 class="text-2xl font-bold text-slate-700">No Client Projects Found</h2>
        <p class="mt-2 max-w-md text-slate-500">This hub is your command center for managing client relationships. Once you have projects marked as 'clients', they will automatically appear here, prioritized by urgency.</p>
    </main>
  </div>
</template>

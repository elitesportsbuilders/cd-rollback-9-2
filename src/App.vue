<script setup lang="ts">
import { ref, computed, reactive, watch, onMounted, defineAsyncComponent } from 'vue';
import Sidebar from '@/components/Sidebar.vue';
import { View } from '@/types';
import { ALL_PROSPECTS, COMPETITORS, USER_INTEL_DATA } from '@/data';

// In one of your Vue components
onMounted(() => {
  console.log('API Key:', process.env.API_KEY);
  console.log('All env variables:', import.meta.env);
});

const viewMap: Record<string, any> = {
  [View.Dashboard]: defineAsyncComponent(() => import('@/components/Dashboard.vue')),
  [View.LeadIntelligence]: defineAsyncComponent(() => import('@/components/LeadIntelligence.vue')),
  [View.CompetitorIntel]: defineAsyncComponent(() => import('@/components/CompetitorIntel.vue')),
  [View.MyIntel]: defineAsyncComponent(() => import('@/components/MyIntel.vue')),
  [View.ResidentialProspecting]: defineAsyncComponent(() => import('@/components/ResidentialProspecting.vue')),
  [View.InteractiveMap]: defineAsyncComponent(() => import('@/components/InteractiveMap.vue')),
  [View.Reports]: defineAsyncComponent(() => import('@/components/Reports.vue')),
  [View.Settings]: defineAsyncComponent(() => import('@/components/Settings.vue')),
  [View.AiInspection]: defineAsyncComponent(() => import('@/components/AiInspection.vue')),
  [View.Integrations]: defineAsyncComponent(() => import('@/components/Integrations.vue')),
  [View.PipedriveAuth]: defineAsyncComponent(() => import('@/components/PipedriveAuth.vue')),
  [View.MonthlyReport]: defineAsyncComponent(() => import('@/components/MonthlyReport.vue')),
};

function isLead(item: any) {
    return item.type === 'permit' || item.type === 'news';
}

// --- STATE MANAGEMENT & PERSISTENCE ---
const STORAGE_KEY = 'courtDetectorSaaSData';

const loadInitialState = () => {
  const savedData = localStorage.getItem(STORAGE_KEY);
  if (savedData) {
    try {
      const parsed = JSON.parse(savedData);
      // Basic validation to ensure essential keys exist
      if (parsed.prospects && parsed.trackedCompetitors && parsed.userIntel && parsed.integrationState) {
        return parsed;
      }
    } catch (e) {
      console.error('Error loading saved data, falling back to defaults.', e);
      localStorage.removeItem(STORAGE_KEY);
    }
  }
  // Default state if nothing is saved or data is corrupt
  return {
    currentView: View.Dashboard,
    integrationState: { isPipedriveConnected: false },
    prospects: ALL_PROSPECTS,
    trackedCompetitors: COMPETITORS.slice(0, 3),
    userIntel: USER_INTEL_DATA,
  };
};

const appState = reactive(loadInitialState());

// Persist state to localStorage whenever it changes
watch(appState, (newState) => {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(newState));
  } catch (e) {
    console.error("Failed to save state:", e);
  }
}, { deep: true });
// --- END STATE MANAGEMENT ---

// Non-persistent UI state (resets on reload)
const focusedProspectId = ref<number | null>(null);
const currentViewPayload = ref<any>({});
const isSidebarOpen = ref(false);

const handleSyncLead = (leadId: number) => {
  appState.prospects = appState.prospects.map(prospect => {
    if (isLead(prospect) && prospect.id === leadId) {
      return { ...prospect, isSynced: true };
    }
    return prospect;
  });
};

const addIntel = (newIntel: any) => {
  appState.userIntel.unshift({ ...newIntel, id: Date.now() });
};

const updateTrackedCompetitors = (newList: string[]) => {
    appState.trackedCompetitors = newList;
};

const handleAddProspect = (prospectToAdd: any) => {
    const exists = appState.prospects.some(p => p.id === prospectToAdd.id);
    if (!exists) {
        appState.prospects.push(prospectToAdd);
    }
};

const handleRemoveProspect = (prospectId: number) => {
    appState.prospects = appState.prospects.filter(p => p.id !== prospectId);
};

const setCurrentView = (view: string, payload: any = {}) => {
  appState.currentView = view;
  focusedProspectId.value = payload.prospectId || null;
  currentViewPayload.value = payload;
  isSidebarOpen.value = false; // Close sidebar on navigation
};

const setIntegrationState = (newState: any) => {
    for (const key in newState) {
        if (Object.prototype.hasOwnProperty.call(appState.integrationState, key)) {
            (appState.integrationState as any)[key] = newState[key];
        }
    }
};

const currentComponent = computed(() => {
  return viewMap[appState.currentView] || defineAsyncComponent(() => import('@/components/Dashboard.vue'));
});

const componentProps = computed(() => {
  switch (appState.currentView) {
    case View.LeadIntelligence:
      return { leads: appState.prospects.filter(isLead) };
    case View.ResidentialProspecting:
      return { prospects: appState.prospects };
    case View.InteractiveMap:
      return { prospects: appState.prospects, focusedProspectId: focusedProspectId.value };
    case View.Integrations:
      return { isConnected: appState.integrationState.isPipedriveConnected };
    case View.CompetitorIntel:
        return { trackedCompetitors: appState.trackedCompetitors };
    case View.MyIntel:
        return { userIntel: appState.userIntel };
    case View.MonthlyReport:
        return { trackedCompetitors: appState.trackedCompetitors };
    case View.Reports:
        return { ...currentViewPayload.value };
    default:
      return {};
  }
});

const pageTitle = computed(() => {
    const viewKey = Object.keys(View).find(key => (View as any)[key] === appState.currentView);
    if (!viewKey) return 'Dashboard';
    // Add spaces before capital letters
    return viewKey.replace(/([A-Z])/g, ' $1').trim();
});

const mainContentClass = computed(() => {
    const isFullBleed = [View.InteractiveMap, View.ResidentialProspecting].includes(appState.currentView as any);
    return isFullBleed ? 'flex-1 min-h-0' : 'flex-1 overflow-y-auto';
});
</script>

<template>
    <div class="relative min-h-screen md:flex bg-slate-100">
        <!-- Sidebar -->
        <Sidebar 
            :current-view="appState.currentView" 
            @set-current-view="setCurrentView" 
            :is-open="isSidebarOpen"
        />
        
        <!-- Overlay for mobile -->
        <div v-if="isSidebarOpen" @click="isSidebarOpen = false" class="fixed inset-0 bg-black bg-opacity-50 z-20 md:hidden"></div>
        
        <!-- Main Content -->
        <div class="flex-1 flex flex-col min-w-0">
            <!-- Mobile Header -->
            <header class="md:hidden flex justify-between items-center p-4 bg-white border-b border-slate-200 sticky top-0 z-10">
                <button @click="isSidebarOpen = true" class="text-slate-600 p-1 -ml-1">
                    <i data-lucide="menu" class="w-6 h-6"></i>
                </button>
                <div class="flex items-center">
                    <img src="data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='24' height='24' viewBox='0 0 24 24' fill='none' stroke='%234f46e5' stroke-width='2' stroke-linecap='round' stroke-linejoin='round' class='lucide lucide-radar'%3E%3Cpath d='M19.07 4.93A10 10 0 0 0 6.99 3.34'/%3E%3Cpath d='M4 6h.01'/%3E%3Cpath d='M2.29 9.62A10 10 0 0 0 3.34 17.01'/%3E%3Cpath d='M6 20h.01'/%3E%3Cpath d='M9.62 21.71A10 10 0 0 0 17.01 20.66'/%3E%3Cpath d='M20 18h-.01'/%3E%3Cpath d='M21.71 14.38A10 10 0 0 0 20.66 6.99'/%3E%3Cpath d='M12 12v.01'/%3E%3Cpath d='M12 2a10 10 0 0 0-9.54 13.54'/%3E%3Cpath d='M12 12a5 5 0 1 0 5 5'/%3E%3Cpath d='M12 12a5 5 0 1 0-5-5'/%3E%3C/svg%3E" class="w-6 h-6 mr-2" />
                    <h1 class="text-lg font-bold text-slate-800">{{ pageTitle }}</h1>
                </div>
                <div class="w-6"></div> <!-- Spacer -->
            </header>
            
            <component
                :is="currentComponent"
                v-bind="componentProps"
                @set-current-view="setCurrentView"
                @sync-lead="handleSyncLead"
                @add-intel="addIntel"
                @set-integration-state="setIntegrationState"
                @update-tracked-competitors="updateTrackedCompetitors"
                @add-prospect="handleAddProspect"
                @remove-prospect="handleRemoveProspect"
                :class="mainContentClass"
            />
        </div>
    </div>
</template>
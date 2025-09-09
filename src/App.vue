<script setup lang="ts">
// --- 1. GLOBAL STYLES IMPORT ---
import './styles.css';

import { ref, computed, reactive, watch, onMounted, defineAsyncComponent } from 'vue';
import { Menu, Radar } from 'lucide-vue-next';
import Sidebar from '@/components/Sidebar.vue';
import { View } from '@/types';
import { ALL_PROSPECTS, COMPETITORS, USER_INTEL_DATA, ACTIVITY_FEED_DATA } from '@/data';

// --- 2. FIREBASE IMPORTS ---
import { initializeApp } from 'firebase/app';
import { getFirestore, Firestore } from 'firebase/firestore';
import { getAuth, signInWithCustomToken, signInAnonymously, Auth } from 'firebase/auth';

// --- DECLARE GLOBAL VARIABLES ---
declare const __firebase_config__: string;
declare const __app_id__: string;
declare const __initial_auth_token__: string;

// --- 3. FIREBASE & APP STATE ---
const db = ref<Firestore | null>(null);
const auth = ref<Auth | null>(null);
const appId = ref<string>('default-app-id');
const isFirebaseConnected = ref(false);
const isAuthReady = ref(false);

// --- LIFECYCLE HOOKS ---
onMounted(async () => {
  if (typeof __firebase_config__ !== 'undefined' && __firebase_config__) {
    console.log('Firebase config found. Initializing and authenticating...');
    try {
      const firebaseConfig = JSON.parse(__firebase_config__);
      const firebaseApp = initializeApp(firebaseConfig);
      db.value = getFirestore(firebaseApp);
      auth.value = getAuth(firebaseApp);
      appId.value = typeof __app_id__ !== 'undefined' ? __app_id__ : 'default-app-id';

      if (typeof __initial_auth_token__ !== 'undefined' && __initial_auth_token__) {
        await signInWithCustomToken(auth.value, __initial_auth_token__);
      } else {
        await signInAnonymously(auth.value);
      }
      isFirebaseConnected.value = true;
    } catch (error) {
      console.error('Firebase initialization or authentication failed:', error);
      isFirebaseConnected.value = false; 
    }
  } else {
    console.log('Firebase config not found. Running in local-only mode.');
  }
  isAuthReady.value = true;
});


// --- COMPONENT MAPPING ---
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
  [View.ProjectHub]: defineAsyncComponent(() => import('@/components/ProjectHub.vue')),
};

// --- INTERFACES & HELPERS ---
interface Prospect {
  id: number;
  type: string;
  isSynced?: boolean;
  isAcknowledged?: boolean;
  [key: string]: any;
}

interface AppState {
  currentView: string;
  integrationState: { isPipedriveConnected: boolean };
  prospects: Prospect[];
  trackedCompetitors: any[];
  userIntel: any[];
}
function isLead(item: Prospect) {
    return item.type === 'permit' || item.type === 'news';
}

// --- STATE MANAGEMENT ---
const STORAGE_KEY = 'courtDetectorSaaSData';
const loadInitialState = (): AppState => {
  const savedData = localStorage.getItem(STORAGE_KEY);
  if (savedData) {
    try {
      const parsed = JSON.parse(savedData);
      if (parsed.prospects && parsed.trackedCompetitors && parsed.userIntel && parsed.integrationState) {
        return parsed as AppState;
      }
    } catch (e) {
      console.error('Error loading saved data, falling back to defaults.', e);
      localStorage.removeItem(STORAGE_KEY);
    }
  }
  return {
    currentView: View.Dashboard,
    integrationState: { isPipedriveConnected: false },
    prospects: ALL_PROSPECTS,
    trackedCompetitors: COMPETITORS,
    userIntel: USER_INTEL_DATA,
  };
};
const appState = reactive<AppState>(loadInitialState());

watch(appState, (newState) => {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(newState));
  } catch (e) {
    console.error("Failed to save state:", e);
  }
}, { deep: true });

// --- UI STATE & EVENT HANDLERS ---
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

const handleAddProspect = (prospectToAdd: Prospect) => {
    const exists = appState.prospects.some(p => p.id === prospectToAdd.id);
    if (!exists) {
        appState.prospects.push(prospectToAdd);
    }
};

const handleRemoveProspect = (prospectId: number) => {
    appState.prospects = appState.prospects.filter(p => p.id !== prospectId);
};

const handleAcknowledgeLead = (leadId: number) => {
    appState.prospects = appState.prospects.map(p => {
        if (p.id === leadId) {
            return { ...p, isAcknowledged: true };
        }
        return p;
    });
};

const setCurrentView = (view: string, payload: any = {}) => {
  appState.currentView = view;
  focusedProspectId.value = payload.prospectId || null;
  currentViewPayload.value = payload;
  isSidebarOpen.value = false;
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
    case View.Dashboard:
        return { 
            activityFeed: ACTIVITY_FEED_DATA,
            userName: "Mike Woelfel",
            prospects: appState.prospects, // <-- Pass prospect data
        };
    case View.LeadIntelligence:
      return { leads: appState.prospects.filter(p => isLead(p) || 'isAcknowledged' in p) };
    case View.ResidentialProspecting:
      return { prospects: appState.prospects };
    case View.InteractiveMap:
      return { 
          focusedProspectId: focusedProspectId.value,
          prospects: appState.prospects 
      };
    case View.ProjectHub:
      return { project: appState.prospects.find(p => p.id === focusedProspectId.value) };
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
    return viewKey.replace(/([A-Z])/g, ' $1').trim();
});

const mainContentClass = computed(() => {
    const isFullBleed = [View.InteractiveMap, View.ResidentialProspecting, View.ProjectHub].includes(appState.currentView as any);
    return isFullBleed ? 'flex-1 flex flex-col min-h-0' : 'flex-1 overflow-y-auto';
});
</script>

<template>
    <div v-if="isAuthReady">
        <div :class="{ 'h-screen overflow-hidden md:overflow-auto': isSidebarOpen }" class="relative min-h-screen bg-slate-100 md:flex">
            <Sidebar 
                :current-view="appState.currentView" 
                @set-current-view="setCurrentView" 
                :is-open="isSidebarOpen"
            />
            <div v-if="isSidebarOpen" @click="isSidebarOpen = false" class="fixed inset-0 bg-black bg-opacity-50 z-20 md:hidden"></div>
            <main class="flex-1 flex flex-col min-w-0">
                <header class="md:hidden flex justify-between items-center p-4 bg-white border-b border-slate-200 sticky top-0 z-10">
                    <button @click="isSidebarOpen = true" class="text-slate-600 p-1 -ml-1"><Menu class="w-6 h-6" /></button>
                    <div class="flex items-center">
                        <Radar class="w-6 h-6 mr-2 text-indigo-600" />
                        <h1 class="text-lg font-bold text-slate-800">{{ pageTitle }}</h1>
                    </div>
                    <div class="w-6"></div>
                </header>
                
                <component 
                    :is="currentComponent"
                    :class="mainContentClass"
                    v-bind="componentProps"
                    @set-current-view="setCurrentView"
                    @sync-lead="handleSyncLead"
                    @add-intel="addIntel"
                    @set-integration-state="setIntegrationState"
                    @update-tracked-competitors="updateTrackedCompetitors"
                    @add-prospect="handleAddProspect"
                    @remove-prospect="handleRemoveProspect"
                    @acknowledge-lead="handleAcknowledgeLead"
                />
            </main>
        </div>
    </div>
    
    <div v-else class="flex items-center justify-center min-h-screen bg-slate-100">
        <div class="text-center">
            <svg class="animate-spin h-8 w-8 text-indigo-600 mx-auto" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                <circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4"></circle>
                <path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
            </svg>
            <p class="mt-2 text-slate-600 font-semibold">Authenticating...</p>
        </div>
    </div>
</template>

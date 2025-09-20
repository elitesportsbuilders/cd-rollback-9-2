<script setup lang="ts">
// --- 1. GLOBAL STYLES IMPORT ---
import './styles.css';

import { ref, computed, reactive, onMounted, defineAsyncComponent } from 'vue';
import { Menu, ShieldCheck } from 'lucide-vue-next';
import Sidebar from '@/components/Sidebar.vue';
import { View } from '@/types';
import { ALL_PROSPECTS, ACTIVITY_FEED_DATA, COMPETITORS, USER_INTEL_DATA, COMPETITOR_SEO_DATA } from '@/data';

// --- 2. FIREBASE IMPORTS ---
import { initializeApp } from 'firebase/app';
import { getFirestore, Firestore, collection, onSnapshot, doc, updateDoc, setDoc, addDoc, deleteDoc, getDocs } from 'firebase/firestore';
import { getAuth, signInWithCustomToken, signInAnonymously, Auth, onAuthStateChanged } from 'firebase/auth';
import { setLogLevel } from 'firebase/firestore';
import 'leaflet/dist/leaflet.css';
import 'leaflet-draw/dist/leaflet.draw.css';

// Set Firebase log level for debugging
setLogLevel('debug');

// --- DECLARE GLOBAL VARIABLES ---
declare const __firebase_config__: string;
declare const __app_id__: string;
declare const __initial_auth_token__: string;

// --- 3. FIREBASE & APP STATE ---
const db = ref<Firestore | null>(null);
const auth = ref<Auth | null>(null);
const userId = ref<string | null>(null);
const appId = ref<string>('default-app-id');
const isAuthReady = ref(false);

// --- COMPONENT MAPPING ---
// This now correctly points both map views to our single, unified CombinedMap component.
const viewMap: Record<string, any> = {
  [View.Dashboard]: defineAsyncComponent(() => import('@/components/Dashboard.vue')),
  [View.LeadIntelligence]: defineAsyncComponent(() => import('@/components/LeadIntelligence.vue')),
  [View.CompetitorIntel]: defineAsyncComponent(() => import('@/components/CompetitorIntel.vue')),
  [View.MyIntel]: defineAsyncComponent(() => import('@/components/MyIntel.vue')),
  [View.ResidentialProspecting]: defineAsyncComponent(() => import('@/components/CombinedMap.vue')),
  [View.InteractiveMap]: defineAsyncComponent(() => import('@/components/CombinedMap.vue')),
  [View.Reports]: defineAsyncComponent(() => import('@/components/Reports.vue')),
  [View.Settings]: defineAsyncComponent(() => import('@/components/Settings.vue')),
  [View.AiInspection]: defineAsyncComponent(() => import('@/components/AiInspection.vue')),
  [View.Integrations]: defineAsyncComponent(() => import('@/components/Integrations.vue')),
  [View.PipedriveAuth]: defineAsyncComponent(() => import('@/components/PipedriveAuth.vue')),
  [View.MonthlyReport]: defineAsyncComponent(() => import('@/components/MonthlyReport.vue')),
  [View.ProjectHub]: defineAsyncComponent(() => import('@/components/ProjectHub.vue')),
  [View.SeoDashboard]: defineAsyncComponent(() => import('@/components/SeoDashboard.vue')),
};

// --- INTERFACES & HELPERS ---
interface Prospect {
  id: string;
  type: string;
  isSynced?: boolean;
  isAcknowledged?: boolean;
  [key: string]: any;
}

interface UserIntel {
  id: string;
  type: string;
  note: string;
  date: string;
}

interface AppState {
  currentView: View;
  integrationState: { isPipedriveConnected: boolean };
  prospects: Prospect[];
  trackedCompetitors: string[];
  userIntel: UserIntel[];
}
function isLead(item: Prospect) {
  return item.type === 'permit' || item.type === 'news';
}

const loadInitialState = (): AppState => {
  return {
    currentView: View.Dashboard,
    integrationState: { isPipedriveConnected: false },
    prospects: [], // Start with an empty array
    trackedCompetitors: COMPETITORS,
    userIntel: [], // Start with an empty array
  };
};

const appState = reactive<AppState>(loadInitialState());

// --- FIREBASE INITIALIZATION AND DATA FETCHING ---
onMounted(async () => {
  if (typeof __firebase_config__ !== 'undefined' && __firebase_config__) {
    console.log('Firebase config found. Initializing and authenticating...');
    try {
      const firebaseConfig = JSON.parse(__firebase_config__);
      const firebaseApp = initializeApp(firebaseConfig);
      db.value = getFirestore(firebaseApp);
      auth.value = getAuth(firebaseApp);
      appId.value = typeof __app_id__ !== 'undefined' ? __app_id__ : 'default-app-id';

      onAuthStateChanged(auth.value, async (user) => {
        if (user) {
          userId.value = user.uid;
        } else {
          // Fallback for anonymous users if custom token fails
          if (!auth.value?.currentUser) {
             await signInAnonymously(auth.value!);
             userId.value = auth.value?.currentUser?.uid || crypto.randomUUID();
          }
        }
        isAuthReady.value = true;
        // Start listening to data once authenticated
        fetchInitialData();
      });

      if (typeof __initial_auth_token__ !== 'undefined' && __initial_auth_token__) {
        await signInWithCustomToken(auth.value!, __initial_auth_token__);
      } else {
        await signInAnonymously(auth.value!);
      }
    } catch (error) {
      console.error('Firebase initialization or authentication failed:', error);
      isAuthReady.value = true;
    }
  } else {
    console.log('Firebase config not found. Running in local-only mock data mode.');
    appState.prospects = ALL_PROSPECTS.map(p => {
  const { id, ...rest } = p;
  return { ...rest, id: id.toString() };
    });
    appState.userIntel = USER_INTEL_DATA.map(i => {
    const { id, content, ...rest } = i as any;
    return {
      ...rest,
      id: id.toString(),
      type: (i as any).type || 'General Note', // Use existing type or provide a default
      note: content, // Map 'content' to 'note'
    };
    });
    isAuthReady.value = true;
  }
});

const fetchInitialData = () => {
  if (!db.value || !userId.value) return;

  const prospectsColRef = collection(db.value, `artifacts/${appId.value}/users/${userId.value}/prospects`);
  onSnapshot(prospectsColRef, (snapshot) => {
  const prospectsFromDb: Prospect[] = snapshot.docs.map(doc => ({ ...doc.data(), id: doc.id }));
  appState.prospects = prospectsFromDb;
  }, (error) => {
    console.error("Error fetching prospects:", error);
  });

  const userIntelColRef = collection(db.value, `artifacts/${appId.value}/users/${userId.value}/intel`);
  onSnapshot(userIntelColRef, (snapshot) => {
  const intelFromDb: UserIntel[] = snapshot.docs.map(doc => ({ ...doc.data(), id: doc.id }));
  appState.userIntel = intelFromDb;
  }, (error) => {
    console.error("Error fetching user intel:", error);
  });
};

// --- DATA MUTATION FUNCTIONS (FIRESTORE) ---
const handleAddProspect = async (prospectToAdd: any) => {
  if (!db.value || !userId.value) return;
  
  const { id, ...rest } = prospectToAdd;
  const newId = id || crypto.randomUUID();
  const docData = { ...rest, id: newId };

  try {
      const docRef = doc(db.value, `artifacts/${appId.value}/users/${userId.value}/prospects`, newId);
      await setDoc(docRef, docData);
      console.log("Prospect added/updated successfully.");
  } catch (e) {
      console.error("Error adding prospect: ", e);
  }
};

const handleRemoveProspect = async (prospectId: string) => {
  if (!db.value || !userId.value) return;
  try {
    const docRef = doc(db.value, `artifacts/${appId.value}/users/${userId.value}/prospects`, prospectId);
    await deleteDoc(docRef);
    console.log("Prospect removed successfully.");
  } catch (e) {
    console.error("Error removing prospect: ", e);
  }
};

const handleUpdateProspect = async (prospect: Prospect) => {
  if (!db.value || !userId.value || !prospect.id) return;
  try {
    const docRef = doc(db.value, `artifacts/${appId.value}/users/${userId.value}/prospects`, prospect.id);
    await updateDoc(docRef, prospect);
    console.log("Prospect updated successfully.");
  } catch (e) {
    console.error("Error updating prospect: ", e);
  }
};

const handleAddIntel = async (newIntel: any) => {
  if (!db.value || !userId.value) return;
  try {
    await addDoc(collection(db.value, `artifacts/${appId.value}/users/${userId.value}/intel`), newIntel);
    console.log("User intel added successfully.");
  } catch (e) {
    console.error("Error adding user intel: ", e);
  }
};

// --- UI STATE & EVENT HANDLERS ---
const focusedProspectId = ref<string | null>(null);
const currentViewPayload = ref<any>({});
const isSidebarOpen = ref(false);

const handleSyncLead = async (leadId: string) => {
    const lead = appState.prospects.find(p => p.id === leadId);
    if(lead) {
        console.log(`Syncing lead ${lead.name} to CRM...`);
        await handleUpdateProspect({ ...lead, isSynced: true });
    }
};

const handleAcknowledgeLead = async (leadId: string) => {
  const lead = appState.prospects.find(p => p.id === leadId);
  if(lead) {
      await handleUpdateProspect({ ...lead, isAcknowledged: true });
  }
};

const updateTrackedCompetitors = async (newList: string[]) => {
  if (!db.value || !userId.value) return;
  const competitorsRef = collection(db.value, `artifacts/${appId.value}/users/${userId.value}/trackedCompetitors`);

  try {
      const existingDocs = await getDocs(competitorsRef);
      const deletePromises = existingDocs.docs.map(d => deleteDoc(d.ref));
      await Promise.all(deletePromises);

      const addPromises = newList.map(c => setDoc(doc(competitorsRef, c), { name: c }));
      await Promise.all(addPromises);
      console.log("Tracked competitors updated successfully.");
  } catch (e) {
      console.error("Error updating tracked competitors: ", e);
  }
};

const setCurrentView = (view: View, payload: any = {}) => {
  appState.currentView = view;
  focusedProspectId.value = payload.prospectId ? payload.prospectId.toString() : null;
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
            activityFeed: ACTIVITY_FEED_DATA.slice(0, 5),
            prospects: appState.prospects
        };
    case View.LeadIntelligence:
      return { leads: appState.prospects.filter(p => isLead(p) || 'isAcknowledged' in p) };
    case View.ResidentialProspecting:
      return { 
          prospects: appState.prospects, 
          focusedProspectId: focusedProspectId.value,
          mode: 'residential' 
      };
    case View.InteractiveMap:
      return { 
          focusedProspectId: focusedProspectId.value,
          prospects: appState.prospects,
          mode: 'commercial'
      };
    case View.Integrations:
      return { isConnected: appState.integrationState.isPipedriveConnected };
    case View.CompetitorIntel:
      return { trackedCompetitors: appState.trackedCompetitors };
    case View.MyIntel:
      return { userIntel: appState.userIntel };
    case View.MonthlyReport:
      return { trackedCompetitors: appState.trackedCompetitors };
    case View.ProjectHub:
        return {
            project: appState.prospects.find(p => p.id === focusedProspectId.value),
            prospects: appState.prospects
        };
    case View.SeoDashboard:
        return { seoData: COMPETITOR_SEO_DATA };
    case View.Reports:
      return { 
          ...currentViewPayload.value,
          prospects: appState.prospects,
          leads: appState.prospects.filter(p => isLead(p) || 'isAcknowledged' in p)
      };
    default:
      return {};
  }
});

const pageTitle = computed(() => {
    const viewKey = Object.keys(View).find(key => (View as any)[key] === appState.currentView);
    if (!viewKey) return 'Dashboard';
    
    if (appState.currentView === View.SeoDashboard) return 'SEO & Ads Command Center';
    if (appState.currentView === View.InteractiveMap) return 'Commercial Map';
    if (appState.currentView === View.ResidentialProspecting) return 'Residential Prospecting';

    return viewKey.replace(/([A-Z])/g, ' $1').trim();
});

const mainContentClass = computed(() => {
    const isFullBleed = [View.InteractiveMap, View.ResidentialProspecting, View.ProjectHub].includes(appState.currentView as any);
    return isFullBleed ? 'flex-1 flex flex-col min-h-0' : 'flex-1 overflow-y-auto';
});
</script>

<template>
    <div v-if="isAuthReady">
        <div :class="{ 'h-screen overflow-hidden md:overflow-auto': isSidebarOpen }" class="relative min-h-screen bg-slate-100 md:flex font-sans">
            <Sidebar 
                :current-view="appState.currentView" 
                :current-view-props="currentViewPayload"
                @set-current-view="setCurrentView" 
                :is-open="isSidebarOpen"
            />
            <div v-if="isSidebarOpen" @click="isSidebarOpen = false" class="fixed inset-0 bg-black bg-opacity-50 z-20 md:hidden"></div>
            <main class="flex-1 flex flex-col min-w-0">
                <header class="md:hidden flex justify-between items-center p-4 bg-white border-b border-slate-200 sticky top-0 z-10">
                    <button @click="isSidebarOpen = true" class="text-slate-600 p-1 -ml-1"><Menu class="w-6 h-6" /></button>
                    <div class="flex items-center">
                        <ShieldCheck class="w-6 h-6 mr-2 text-indigo-600" />
                        <h1 class="text-lg font-bold text-slate-800">{{ pageTitle }}</h1>
                    </div>
                    <div class="w-6"></div>
                </header>
                
                <!-- Remove the side-by-side comparison from the dashboard -->
                <component 
                  :is="currentComponent"
                  :class="mainContentClass"
                  v-bind="componentProps"
                  @set-current-view="setCurrentView"
                  @sync-lead="handleSyncLead"
                  @add-intel="handleAddIntel"
                  @set-integration-state="setIntegrationState"
                  @update-tracked-competitors="updateTrackedCompetitors"
                  @add-prospect="handleAddProspect"
                  @remove-prospect="handleRemoveProspect"
                  @acknowledge-lead="handleAcknowledgeLead"
                  @update-prospect="handleUpdateProspect"
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

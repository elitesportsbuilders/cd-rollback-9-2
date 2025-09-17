<template>
  <!-- Main Application Container -->
  <div v-if="isAuthReady">
    <div :class="{ 'h-screen overflow-hidden md:overflow-auto': isSidebarOpen }" class="relative min-h-screen bg-slate-100 md:flex font-inter">
      <!-- Sidebar -->
      <aside :class="isOpenClass" class="fixed inset-y-0 left-0 z-30 w-64 md:w-60 bg-white border-r border-slate-200 transition-transform duration-200 ease-in-out md:translate-x-0 flex flex-col p-4 shadow-lg">
        <div class="flex items-center justify-between h-16 mb-4">
          <div class="flex items-center">
            <Radar class="h-8 w-8 text-indigo-600" />
            <span class="ml-2 text-2xl font-bold text-slate-800">Vue App</span>
          </div>
        </div>
        <nav class="flex-1 overflow-y-auto">
          <ul>
            <li v-for="item in navItems" :key="item.view">
              <a @click.prevent="setCurrentView(item.view)" href="#"
                :class="{ 'bg-indigo-100 text-indigo-700 font-semibold shadow-inner': appState.currentView === item.view }"
                class="flex items-center p-3 text-sm text-slate-700 rounded-xl hover:bg-slate-100 transition-colors duration-200 group">
                <component :is="item.icon" class="w-5 h-5 mr-3 text-slate-500 group-hover:text-indigo-600 transition-colors" />
                {{ item.name }}
              </a>
            </li>
          </ul>
        </nav>
        <div class="flex items-center p-4 border-t border-slate-200 mt-auto">
          <div class="flex-1 text-xs text-center text-slate-500">
            <p>Logged in as: User {{ userId }}</p>
          </div>
        </div>
      </aside>

      <!-- Sidebar Overlay for Mobile -->
      <div v-if="isSidebarOpen" @click="isSidebarOpen = false" class="fixed inset-0 bg-black bg-opacity-50 z-20 md:hidden"></div>

      <!-- Main Content Area -->
      <main class="flex-1 flex flex-col min-w-0">
        <!-- Mobile Header -->
        <header class="md:hidden flex justify-between items-center p-4 bg-white border-b border-slate-200 sticky top-0 z-10">
          <button @click="isSidebarOpen = true" class="text-slate-600 p-1 -ml-1">
            <Menu class="w-6 h-6" />
          </button>
          <div class="flex items-center">
            <Radar class="w-6 h-6 mr-2 text-indigo-600" />
            <h1 class="text-lg font-bold text-slate-800">{{ pageTitle }}</h1>
          </div>
          <div class="w-6"></div>
        </header>

        <!-- Dashboard Template -->
        <div v-if="appState.currentView === View.Dashboard" class="p-6 md:p-8 flex-1 overflow-y-auto">
          <h1 class="text-3xl font-extrabold text-slate-800 mb-6">Dashboard</h1>
          <div class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6 mb-8">
            <div class="bg-white p-6 rounded-xl shadow-lg flex flex-col items-center text-center">
              <span class="text-indigo-600 mb-2">
                <Building2 class="w-12 h-12" />
              </span>
              <p class="text-slate-500">Total Prospects</p>
              <p class="text-4xl font-bold text-slate-800">{{ appState.prospects.length }}</p>
            </div>
          </div>
          <div class="bg-white rounded-xl shadow-lg p-6">
            <div class="flex items-center justify-between mb-4">
              <h2 class="text-xl font-bold text-slate-800">Recent Prospects</h2>
            </div>
            <div v-if="recentProspects.length > 0" class="space-y-4">
              <div v-for="prospect in recentProspects" :key="prospect.id" class="flex items-center space-x-4 p-4 border rounded-lg shadow-sm bg-slate-50">
                <div class="flex-shrink-0">
                  <MapPin class="w-8 h-8 text-indigo-500" />
                </div>
                <div class="flex-1 min-w-0">
                  <h3 class="text-lg font-bold text-slate-800 truncate">{{ prospect.propertyAddress }}</h3>
                  <p class="text-sm text-slate-600 truncate">{{ prospect.permitType }}</p>
                </div>
                <div class="text-xs text-slate-400">
                  <span class="inline-block px-2 py-1 rounded-full text-xs font-semibold" :class="{ 'bg-blue-200 text-blue-800': prospect.type === 'permit', 'bg-purple-200 text-purple-800': prospect.type === 'news' }">
                    {{ prospect.type }}
                  </span>
                </div>
              </div>
            </div>
            <div v-else class="text-center py-8 text-slate-500">
              <p>No prospects found.</p>
            </div>
          </div>
        </div>

        <!-- Combined Map Template -->
        <div v-else-if="[View.ResidentialProspecting, View.InteractiveMap].includes(appState.currentView)" class="flex-1 flex flex-col min-h-0 relative">
          <!-- Map section -->
          <div id="map" class="flex-1 rounded-lg shadow-lg overflow-hidden" />
          
          <!-- Control Panel at the bottom -->
          <div class="absolute bottom-4 left-1/2 -translate-x-1/2 bg-white rounded-xl shadow-lg p-2 flex items-center space-x-2 z-[1000] border border-gray-200">
            
            <!-- Toggle Filter Panel -->
            <button 
              @click="toggleFilterPanel" 
              class="p-2 rounded-lg transition-colors"
              :class="{'bg-indigo-500 text-white': showFilterPanel, 'bg-gray-200 text-gray-700': !showFilterPanel}"
            >
              <component :is="filterIcon" class="w-5 h-5" />
            </button>

            <!-- Toggle Heatmap -->
            <button 
              @click="toggleHeatmap" 
              class="p-2 rounded-lg transition-colors"
              :class="{'bg-indigo-500 text-white': isHeatmapActive, 'bg-gray-200 text-gray-700': !isHeatmapActive}"
            >
              <ThermometerSun class="w-5 h-5" />
            </button>

            <!-- Toggle Radar -->
            <button 
              @click="toggleRadar" 
              class="p-2 rounded-lg transition-colors"
              :class="{'bg-indigo-500 text-white': isRadarActive, 'bg-gray-200 text-gray-700': !isRadarActive}"
            >
              <Target class="w-5 h-5" />
            </button>

            <!-- Search Input and Button -->
            <div class="flex items-center space-x-2">
              <input
                v-model="searchQuery"
                type="text"
                placeholder="Search..."
                class="w-40 px-3 py-2 border rounded-lg text-sm transition-all focus:ring focus:ring-indigo-300"
              />
              <button
                @click="clearSearch"
                class="p-2 rounded-lg bg-gray-200 text-gray-700 hover:bg-gray-300 transition-colors"
              >
                <X class="w-5 h-5" />
              </button>
            </div>
          </div>

          <!-- Right-side Panel for filters and prospects list -->
          <div 
            v-if="showFilterPanel"
            class="absolute right-4 top-4 w-1/4 max-w-sm h-[90%] bg-white rounded-xl shadow-xl p-4 flex flex-col transition-transform duration-300 ease-in-out z-[999] border border-gray-200"
          >
            <div class="flex items-center justify-between mb-4">
              <h3 class="font-bold text-lg text-gray-800">Prospect Filters</h3>
              <button @click="toggleFilterPanel" class="text-gray-500 hover:text-gray-800">
                <X class="w-6 h-6" />
              </button>
            </div>
            
            <div class="flex-1 overflow-y-auto space-y-2">
              <div 
                v-for="prospect in filteredProspects" 
                :key="prospect.id"
                class="p-4 bg-white rounded-md shadow-sm border border-gray-200 cursor-pointer hover:bg-gray-100 transition-colors"
                :class="{ 'bg-blue-100': focusedProspectId === prospect.id }"
                @click="focusOnProspect(prospect)"
              >
                <h3 class="font-bold text-gray-900">{{ prospect.propertyAddress }}</h3>
                <p class="text-sm text-gray-600">{{ prospect.permitType }}</p>
              </div>
            </div>
          </div>
        </div>

        <!-- Placeholder for other views -->
        <div v-else class="p-6 md:p-8 flex-1 overflow-y-auto">
          <h1 class="text-3xl font-extrabold text-slate-800 mb-6">{{ pageTitle }}</h1>
          <p class="text-slate-500">This view is a placeholder for future content.</p>
        </div>
      </main>
    </div>
  </div>

  <!-- Loading state before Firebase authentication -->
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

<script setup lang="ts">
// --- GLOBAL IMPORTS ---
import { ref, computed, reactive, onMounted, watch } from 'vue';
import { Menu, Radar, LayoutDashboard, MapPin, Target, FileText, Settings, Building2, Map, Users, CircleDot, X, ThermometerSun, Filter, FilterX } from 'lucide-vue-next';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';
import 'leaflet.heat';
import 'leaflet-draw/dist/leaflet.draw.css';

// --- FIREBASE IMPORTS ---
import { initializeApp } from 'firebase/app';
import { getFirestore, Firestore, collection, onSnapshot, doc, updateDoc } from 'firebase/firestore';
import { getAuth, signInWithCustomToken, signInAnonymously, Auth, onAuthStateChanged } from 'firebase/auth';

// --- DECLARE GLOBAL VARIABLES ---
declare const __firebase_config__: string;
declare const __app_id__: string;
declare const __initial_auth_token__: string;

// --- DATA AND TYPE DEFINITIONS ---
enum View {
  Dashboard = 'Dashboard',
  ResidentialProspecting = 'ResidentialProspecting',
  InteractiveMap = 'InteractiveMap',
  Reports = 'Reports',
  Settings = 'Settings',
  LeadIntelligence = 'LeadIntelligence',
  CompetitorIntel = 'CompetitorIntel',
  MyIntel = 'MyIntel',
  AiInspection = 'AiInspection',
  Integrations = 'Integrations',
  PipedriveAuth = 'PipedriveAuth',
  MonthlyReport = 'MonthlyReport',
  ProjectHub = 'ProjectHub',
  SeoDashboard = 'SeoDashboard',
}

interface Prospect {
  id: string;
  type: string;
  isSynced?: boolean;
  isAcknowledged?: boolean;
  latitude: number;
  longitude: number;
  [key: string]: any;
}

interface AppState {
  currentView: View;
  prospects: Prospect[];
}

const ALL_PROSPECTS: Prospect[] = [
  { id: '1', type: 'permit', propertyAddress: '123 E Main St, Phoenix, AZ', latitude: 33.4484, longitude: -112.0740, permitType: 'New Construction', isSynced: false },
  { id: '2', type: 'permit', propertyAddress: '456 N 1st Ave, Scottsdale, AZ', latitude: 33.4942, longitude: -111.9261, permitType: 'Renovation', isSynced: false },
  { id: '3', type: 'news', propertyAddress: '789 S 3rd St, Tempe, AZ', latitude: 33.4152, longitude: -111.9056, permitType: 'Expansion', isSynced: false },
  { id: '4', type: 'news', propertyAddress: '101 E Camelback Rd, Phoenix, AZ', latitude: 33.5097, longitude: -112.0673, permitType: 'New Construction', isSynced: false },
  { id: '5', type: 'permit', propertyAddress: '202 W Washington St, Phoenix, AZ', latitude: 33.4484, longitude: -112.0734, permitType: 'Renovation', isSynced: false },
];

// --- APP STATE & FIRESTORE INITIALIZATION ---
const db = ref<Firestore | null>(null);
const auth = ref<Auth | null>(null);
const userId = ref<string | null>(null);
const appId = ref<string>('default-app-id');
const isAuthReady = ref(false);

const loadInitialState = (): AppState => ({
  currentView: View.Dashboard,
  prospects: [],
});
const appState = reactive<AppState>(loadInitialState());

onMounted(async () => {
  if (typeof __firebase_config__ !== 'undefined' && __firebase_config__) {
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
          userId.value = crypto.randomUUID();
          await signInAnonymously(auth.value!);
        }
        isAuthReady.value = true;
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
      appState.prospects = ALL_PROSPECTS;
    }
  } else {
    console.log('Firebase config not found. Running in local-only mock data mode.');
    appState.prospects = ALL_PROSPECTS;
    isAuthReady.value = true;
  }
});

const fetchInitialData = () => {
  if (!db.value || !userId.value) return;
  const prospectsColRef = collection(db.value, `artifacts/${appId.value}/users/${userId.value}/prospects`);
  onSnapshot(prospectsColRef, (snapshot) => {
    const prospectsFromDb: Prospect[] = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() as Prospect }));
    appState.prospects = prospectsFromDb;
  }, (error) => {
    console.error("Error fetching prospects:", error);
  });
};

const handleUpdateProspect = async (prospect: Prospect) => {
  if (!db.value || !userId.value || !prospect.id) return;
  try {
    const docRef = doc(db.value, `artifacts/${appId.value}/users/${userId.value}/prospects`, prospect.id);
    await updateDoc(docRef, prospect);
  } catch (e) {
    console.error("Error updating prospect: ", e);
  }
};

// --- SIDEBAR LOGIC ---
const isSidebarOpen = ref(false);
const navItems = ref([
  { name: 'Dashboard', icon: LayoutDashboard, view: View.Dashboard },
  { name: 'Residential Prospecting', icon: Map, view: View.ResidentialProspecting },
  { name: 'Interactive Map', icon: Users, view: View.InteractiveMap },
  { name: 'Lead Intelligence', icon: CircleDot, view: View.LeadIntelligence },
  { name: 'Reports', icon: FileText, view: View.Reports },
  { name: 'Settings', icon: Settings, view: View.Settings },
]);
const isOpenClass = computed(() => (isSidebarOpen.value ? 'translate-x-0' : '-translate-x-full'));

// --- DASHBOARD LOGIC ---
const recentProspects = computed(() => {
  return appState.prospects.slice().sort(() => -1).slice(0, 5);
});

// --- COMBINED MAP LOGIC ---
const map = ref<L.Map | null>(null);
const focusedProspectId = ref<string | null>(null);
const searchQuery = ref('');
const markers = ref<L.Marker[]>([]);
const isHeatmapActive = ref(false);
const heatmapLayer = ref<any | null>(null); // Fixed: Changed type to `any`
const showFilterPanel = ref(false);
const radarLayer = ref<L.Circle | null>(null);
const isRadarActive = ref(false);

const filterIcon = computed(() => showFilterPanel.value ? FilterX : Filter);

const filteredProspects = computed(() => {
  if (!searchQuery.value) {
    return appState.prospects;
  }
  return appState.prospects.filter(prospect =>
    Object.values(prospect).some(value =>
      String(value).toLowerCase().includes(searchQuery.value.toLowerCase())
    )
  );
});

watch(() => focusedProspectId.value, (newId) => {
  if (newId) {
    const prospect = appState.prospects.find(p => p.id === newId);
    if (prospect && map.value) {
      map.value.flyTo([prospect.latitude, prospect.longitude], 16);
    }
  }
});

const focusOnProspect = (prospect: Prospect) => {
  focusedProspectId.value = prospect.id;
  if (map.value) {
    map.value.flyTo([prospect.latitude, prospect.longitude], 16);
  }
};

const clearSearch = () => {
  searchQuery.value = '';
};

const toggleFilterPanel = () => {
  showFilterPanel.value = !showFilterPanel.value;
};

const toggleHeatmap = () => {
  isHeatmapActive.value = !isHeatmapActive.value;
  if (map.value) {
    if (isHeatmapActive.value) {
      if (radarLayer.value) radarLayer.value.remove();
      markers.value.forEach(marker => marker.remove());
      const points = appState.prospects.map(p => [p.latitude, p.longitude, 1]);
      heatmapLayer.value = (L as any).heatLayer(points, {
        radius: 25, blur: 15, maxZoom: 17, gradient: { 0.4: 'blue', 0.6: 'cyan', 0.8: 'lime', 1.0: 'red' }
      }).addTo(map.value as L.Map);
    } else {
      if (heatmapLayer.value) heatmapLayer.value.remove();
      markers.value.forEach(marker => marker.addTo(map.value as L.Map));
    }
  }
};

const toggleRadar = () => {
  isRadarActive.value = !isRadarActive.value;
  if (map.value) {
    if (isRadarActive.value) {
      if (heatmapLayer.value) heatmapLayer.value.remove();
      markers.value.forEach(marker => marker.remove());
      const center = L.latLng(33.4484, -112.0740); // Center of Phoenix
      radarLayer.value = L.circle(center, {
        color: 'blue', fillColor: '#3080ff', fillOpacity: 0.2, radius: 25000 // 25km radius
      }).addTo(map.value);
    } else {
      if (radarLayer.value) radarLayer.value.remove();
      markers.value.forEach(marker => marker.addTo(map.value as L.Map));
    }
  }
};

const renderMarkers = () => {
  if (!map.value) return;
  markers.value.forEach(marker => marker.remove());
  markers.value = [];
  filteredProspects.value.forEach(prospect => {
    const marker = L.marker([prospect.latitude, prospect.longitude])
      .addTo(map.value as L.Map)
      .bindPopup(`<b>${prospect.propertyAddress}</b><br>${prospect.permitType}`);
    markers.value.push(marker);
  });
};

watch(() => filteredProspects.value, () => {
  if (!isHeatmapActive.value && !isRadarActive.value) {
    renderMarkers();
  }
}, { immediate: true });

onMounted(() => {
  if (document.getElementById('map')) {
    map.value = L.map('map').setView([33.4484, -112.074], 10);
    L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
      attribution: 'Map data &copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors',
    }).addTo(map.value as L.Map);
    renderMarkers();
  }
});

// --- UI STATE & EVENT HANDLERS ---
const currentViewPayload = ref<any>({});
const setCurrentView = (view: View, payload: any = {}) => {
  appState.currentView = view;
  focusedProspectId.value = payload.prospectId ? payload.prospectId.toString() : null;
  currentViewPayload.value = payload;
  isSidebarOpen.value = false;
};

const pageTitle = computed(() => {
  const viewKey = Object.keys(View).find(key => (View as any)[key] === appState.currentView);
  if (!viewKey) return 'Dashboard';
  return viewKey.replace(/([A-Z])/g, ' $1').trim();
});

const mainContentClass = computed(() => {
  const isFullBleed = [View.InteractiveMap, View.ResidentialProspecting].includes(appState.currentView as any);
  return isFullBleed ? 'flex-1 flex flex-col min-h-0' : 'flex-1 overflow-y-auto';
});
</script>

<style>
@import url('https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700;800&display=swap');
/* Tailwind CSS is assumed to be available from the environment. */
.font-inter {
  font-family: 'Inter', sans-serif;
}
#map {
  height: 100%;
}
</style>

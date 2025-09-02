<script setup lang="ts">
import { ref, onMounted, watch, nextTick, computed } from 'vue';
import PrimaryButton from '@/components/PrimaryButton.vue';
import Card from '@/components/Card.vue';
import L from 'leaflet';
import 'leaflet-draw';
import { createIcons } from 'lucide';

// --- COMPANY PROFILE STATE ---
const companyProfile = ref({
    name: 'Elite Sports Builders',
    email: 'mike.woelfel@elitesb.com',
    address: '1622 N Black Canyon Hwy, Suite 200, Phoenix, AZ, 85009',
    phone: '(602) 989-9648',
    logoUrl: 'https://picsum.photos/seed/esblogo/128/128'
});

const originalCompanyProfile = ref(JSON.parse(JSON.stringify(companyProfile.value)));

const isProfileChanged = computed(() => {
    return JSON.stringify(companyProfile.value) !== JSON.stringify(originalCompanyProfile.value);
});

const handleLogoUpload = (event: Event) => {
    const target = event.target as HTMLInputElement;
    if (target.files && target.files[0]) {
        const file = target.files[0];
        const reader = new FileReader();
        reader.onload = (e) => {
            if (e.target?.result) {
                companyProfile.value.logoUrl = e.target.result as string;
            }
        };
        reader.readAsDataURL(file);
    }
};

const saveProfile = () => {
    originalCompanyProfile.value = JSON.parse(JSON.stringify(companyProfile.value));
    // In a real app, this would emit an event or make an API call.
    console.log('Company profile saved:', companyProfile.value);
};
// --- END COMPANY PROFILE STATE ---

const isMapModalOpen = ref(false);
const serviceAreaDisplayMapRef = ref<HTMLElement | null>(null);
const serviceAreaEditMapRef = ref<HTMLElement | null>(null);

let displayMap: any = null;
let editMap: any = null;
let drawnItems: any = null;
let displayLayer: any = null;

const serviceAreaMethod = ref('map'); // 'map' or 'list'
const serviceAreaListInput = ref('85253, 85016, Phoenix, Mesa');
const savedServiceAreaList = ref(['85253', '85016', 'Phoenix', 'Mesa']);

const serviceAreaGeoJSON = ref<any>({
  "type": "Feature",
  "properties": {},
  "geometry": {
    "type": "Polygon",
    "coordinates": [
      [
        [-112.3, 33.4],
        [-112.3, 33.7],
        [-111.8, 33.7],
        [-111.8, 33.4],
        [-112.3, 33.4]
      ]
    ]
  }
});

const customScrapers = ref([
    { id: 1, name: 'City of Phoenix RFPs', url: 'https://www.phoenix.gov/solicitations', keywords: 'tennis court, resurfacing, athletic facility', active: true },
    { id: 2, name: 'Maricopa County Parks', url: 'https://www.maricopacountyparks.net/news/', keywords: 'pickleball, new construction', active: false },
]);
const isScraperModalOpen = ref(false);
const currentScraper = ref<any>({ id: null, name: '', url: '', keywords: '' });

const openScraperModal = (scraper: any = null) => {
    if (scraper) {
        currentScraper.value = { ...scraper };
    } else {
        currentScraper.value = { id: null, name: '', url: '', keywords: '' };
    }
    isScraperModalOpen.value = true;
};

const saveScraper = () => {
    if (currentScraper.value.id) {
        const index = customScrapers.value.findIndex(s => s.id === currentScraper.value.id);
        if (index !== -1) {
            customScrapers.value[index] = { ...customScrapers.value[index], ...currentScraper.value };
        }
    } else {
        customScrapers.value.push({ ...currentScraper.value, id: Date.now(), active: true });
    }
    isScraperModalOpen.value = false;
};

const deleteScraper = (scraperId: number) => {
    customScrapers.value = customScrapers.value.filter(s => s.id !== scraperId);
};

const toggleScraperStatus = (scraper: any) => {
    const index = customScrapers.value.findIndex(s => s.id === scraper.id);
    if (index !== -1) {
        customScrapers.value[index].active = !customScrapers.value[index].active;
    }
};

const formattedServiceAreaList = computed(() => {
    return savedServiceAreaList.value.filter(item => item.trim() !== '');
});

const initDisplayMap = () => {
  if (serviceAreaDisplayMapRef.value && !displayMap) {
    displayMap = L.map(serviceAreaDisplayMapRef.value, {
      zoomControl: false,
      dragging: false,
      scrollWheelZoom: false,
      doubleClickZoom: false,
    }).setView([33.55, -112.05], 9);

    L.tileLayer('https://{s}.basemaps.cartocdn.com/rastertiles/voyager_nolabels/{z}/{x}/{y}{r}.png', {
      attribution: '&copy; CARTO'
    }).addTo(displayMap);
    
    displayLayer = L.geoJSON(undefined, {
      style: { color: '#4f46e5', weight: 2, fillOpacity: 0.2 }
    }).addTo(displayMap);
    
    updateDisplayMap();
  }
};

const updateDisplayMap = () => {
  if (displayLayer && serviceAreaGeoJSON.value) {
    displayLayer.clearLayers();
    displayLayer.addData(serviceAreaGeoJSON.value);
    if (displayMap) {
      displayMap.fitBounds(displayLayer.getBounds());
    }
  }
};

const initEditMap = () => {
  if (serviceAreaEditMapRef.value && !editMap) {
    editMap = L.map(serviceAreaEditMapRef.value).setView([33.55, -112.05], 9);
    L.tileLayer('https://{s}.basemaps.cartocdn.com/rastertiles/voyager/{z}/{x}/{y}{r}.png', {
      attribution: '&copy; OpenStreetMap & CARTO'
    }).addTo(editMap);

    drawnItems = new L.FeatureGroup();
    editMap.addLayer(drawnItems);
    
    if (serviceAreaGeoJSON.value) {
      const previousLayer = L.geoJSON(serviceAreaGeoJSON.value);
      previousLayer.eachLayer((layer: any) => drawnItems.addLayer(layer));
    }

    const drawControl = new (L.Control as any).Draw({
      draw: {
        polygon: true,
        polyline: false,
        rectangle: true,
        circle: true,
        marker: false,
        circlemarker: false
      },
      edit: {
        featureGroup: drawnItems
      }
    });
    editMap.addControl(drawControl);

    editMap.on(L.Draw.Event.CREATED, (event: any) => {
      drawnItems.clearLayers();
      drawnItems.addLayer(event.layer);
    });
  }
};

const openMapModal = () => {
  isMapModalOpen.value = true;
  nextTick(() => {
    initEditMap();
    setTimeout(() => editMap && editMap.invalidateSize(), 100);
  });
};

const saveServiceArea = () => {
    const layers = drawnItems.getLayers();
    if (layers.length > 0) {
        serviceAreaGeoJSON.value = layers[0].toGeoJSON();
    } else {
        serviceAreaGeoJSON.value = null;
    }
    updateDisplayMap();
    isMapModalOpen.value = false;
};

const saveAreaList = () => {
    savedServiceAreaList.value = serviceAreaListInput.value.split(',').map(item => item.trim());
};

onMounted(() => {
    initDisplayMap();
    nextTick(() => {
        createIcons();
    });
});

watch(isMapModalOpen, (isOpen) => {
    if (!isOpen) {
        if (editMap) {
            editMap.remove();
            editMap = null;
        }
    }
});
</script>

<template>
    <main class="flex-1 overflow-y-auto p-6 md:p-8">
        <header class="mb-8">
            <h2 class="text-3xl font-extrabold text-slate-800">Settings</h2>
            <p class="text-slate-500 mt-1">Manage your company profile, users, and subscription.</p>
        </header>

        <div class="space-y-8">
            <Card>
                <h3 class="text-xl font-bold text-slate-700 mb-4">Company Profile</h3>
                <div class="grid grid-cols-1 md:grid-cols-3 gap-8">
                    <!-- Logo Upload Section -->
                    <div class="md:col-span-1 flex flex-col items-center md:items-start">
                        <label class="block text-sm font-medium text-slate-600 mb-2">Company Logo</label>
                        <div class="relative group">
                            <img :src="companyProfile.logoUrl" alt="Company Logo" class="w-32 h-32 rounded-full object-cover border-4 border-slate-200 group-hover:border-indigo-300 transition-colors" />
                            <label for="logo-upload" class="absolute inset-0 bg-black bg-opacity-0 group-hover:bg-opacity-50 flex items-center justify-center rounded-full cursor-pointer transition-opacity">
                                <i data-lucide="camera" class="w-8 h-8 text-white opacity-0 group-hover:opacity-100 transition-opacity"></i>
                            </label>
                        </div>
                        <input id="logo-upload" type="file" class="sr-only" @change="handleLogoUpload" accept="image/*" />
                        <p class="text-xs text-slate-500 mt-2 text-center md:text-left">Click image to upload a new logo.</p>
                    </div>

                    <!-- Company Info Fields -->
                    <div class="md:col-span-2 space-y-4">
                        <div>
                            <label for="company-name" class="block text-sm font-medium text-slate-600">Company Name</label>
                            <input type="text" id="company-name" v-model="companyProfile.name" class="mt-1 block w-full px-3 py-2 bg-white border border-slate-300 rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500" />
                        </div>
                        <div>
                            <label for="contact-email" class="block text-sm font-medium text-slate-600">Contact Email</label>
                            <input type="email" id="contact-email" v-model="companyProfile.email" class="mt-1 block w-full px-3 py-2 bg-white border border-slate-300 rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500" />
                        </div>
                        <div>
                            <label for="company-address" class="block text-sm font-medium text-slate-600">Company Address</label>
                            <input type="text" id="company-address" v-model="companyProfile.address" class="mt-1 block w-full px-3 py-2 bg-white border border-slate-300 rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500" />
                        </div>
                        <div>
                            <label for="contact-phone" class="block text-sm font-medium text-slate-600">Contact Phone</label>
                            <input type="tel" id="contact-phone" v-model="companyProfile.phone" class="mt-1 block w-full px-3 py-2 bg-white border border-slate-300 rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500" />
                        </div>
                    </div>
                </div>
                <!-- Save Button -->
                <div class="mt-6 pt-4 border-t border-slate-200 flex justify-end">
                    <PrimaryButton 
                        label="Save Changes" 
                        :disabled="!isProfileChanged" 
                        @click="saveProfile"
                    />
                </div>
            </Card>

            <Card>
                <h3 class="text-xl font-bold text-slate-700 mb-4">Service Area & Leads</h3>
                <div class="grid grid-cols-1 lg:grid-cols-2 gap-8">
                    <div>
                        <label class="block text-sm font-medium text-slate-600">Lead Scan Service Area</label>
                        <p class="text-sm text-slate-500 mb-3">Define your territory by drawing on a map or listing specific cities/zips.</p>
                        
                        <div class="border-b border-slate-200">
                            <nav class="-mb-px flex space-x-4" role="tablist" aria-label="Service Area Method">
                                <button @click="serviceAreaMethod = 'map'" role="tab" :aria-selected="serviceAreaMethod === 'map'" :class="['px-3 py-2 font-medium text-sm rounded-t-md border-b-2', serviceAreaMethod === 'map' ? 'border-indigo-500 text-indigo-600' : 'border-transparent text-slate-500 hover:text-slate-700 hover:border-slate-300']">
                                    Draw on Map
                                </button>
                                <button @click="serviceAreaMethod = 'list'" role="tab" :aria-selected="serviceAreaMethod === 'list'" :class="['px-3 py-2 font-medium text-sm rounded-t-md border-b-2', serviceAreaMethod === 'list' ? 'border-indigo-500 text-indigo-600' : 'border-transparent text-slate-500 hover:text-slate-700 hover:border-slate-300']">
                                    List Cities/Zips
                                </button>
                            </nav>
                        </div>

                        <div class="mt-4">
                            <div v-if="serviceAreaMethod === 'map'">
                                <div ref="serviceAreaDisplayMapRef" class="aspect-video bg-slate-200 rounded-lg"></div>
                                <button @click="openMapModal" class="mt-2 text-sm font-semibold text-indigo-600 hover:underline">Edit Service Area</button>
                            </div>

                            <div v-if="serviceAreaMethod === 'list'">
                                <label for="area-list-input" class="block text-sm font-medium text-slate-600 mb-1">Enter Zip Codes or Cities (comma-separated)</label>
                                <textarea id="area-list-input" v-model="serviceAreaListInput" rows="3" class="block w-full px-3 py-2 bg-white border border-slate-300 rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500"></textarea>
                                <button @click="saveAreaList" class="mt-2 px-3 py-1.5 bg-indigo-600 text-white font-semibold text-sm rounded-md shadow-sm hover:bg-indigo-700">Save List</button>
                                
                                <div v-if="formattedServiceAreaList.length > 0" class="mt-4">
                                    <p class="text-sm font-semibold text-slate-600">Current Service Locations:</p>
                                    <div class="flex flex-wrap gap-2 mt-2">
                                        <span v-for="item in formattedServiceAreaList" :key="item" class="px-2 py-1 bg-slate-100 text-slate-700 text-xs font-medium rounded-full">{{ item }}</span>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                    <div>
                        <label class="block text-sm font-medium text-slate-600">Lead Notification Settings</label>
                        <p class="text-sm text-slate-500 mb-3">Choose how you want to be notified of new leads.</p>
                        <div class="space-y-2">
                            <div class="flex items-center"><input id="notify-daily" name="notification" type="radio" checked class="h-4 w-4 border-slate-300 text-indigo-600 focus:ring-indigo-500" /><label for="notify-daily" class="ml-3 block text-sm font-medium text-slate-700">Daily Email Summary</label></div>
                            <div class="flex items-center"><input id="notify-weekly" name="notification" type="radio" class="h-4 w-4 border-slate-300 text-indigo-600 focus:ring-indigo-500" /><label for="notify-weekly" class="ml-3 block text-sm font-medium text-slate-700">Weekly Email Summary</label></div>
                            <div class="flex items-center"><input id="notify-never" name="notification" type="radio" class="h-4 w-4 border-slate-300 text-indigo-600 focus:ring-indigo-500" /><label for="notify-never" class="ml-3 block text-sm font-medium text-slate-700">No Email Notifications</label></div>
                        </div>
                    </div>
                </div>
            </Card>

            <Card>
                <div class="flex justify-between items-center mb-4">
                    <h3 class="text-xl font-bold text-slate-700">User Management</h3>
                    <PrimaryButton label="Invite User" icon="plus" class="text-sm" />
                </div>
                <p class="text-sm text-slate-500 mb-4">You are using 2 of 5 available seats on the Pro Plan.</p>
                <ul class="divide-y divide-slate-200">
                    <li class="py-3 flex justify-between items-center">
                        <div>
                            <p class="font-medium text-slate-800">Mike Woelfel</p>
                            <p class="text-sm text-slate-500">mike.woelfel@elitesb.com</p>
                        </div>
                        <div class="flex items-center gap-4">
                            <span class="text-xs font-semibold text-slate-500 bg-slate-100 px-2 py-1 rounded-full flex items-center">
                                <i data-lucide="shield-check" class="w-3 h-3 mr-1.5 text-amber-600"></i>
                                Owner
                            </span>
                        </div>
                    </li>
                     <li class="py-3 flex justify-between items-center">
                        <div>
                            <p class="font-medium text-slate-800">Jane Doe</p>
                            <p class="text-sm text-slate-500">jane.doe@elitesb.com</p>
                        </div>
                        <div class="flex items-center gap-4">
                            <span class="text-xs font-semibold text-slate-500 bg-slate-100 px-2 py-1 rounded-full flex items-center">
                                <i data-lucide="user-cog" class="w-3 h-3 mr-1.5 text-slate-500"></i>
                                Admin
                            </span>
                            <div class="flex items-center">
                                <button title="Edit Permissions" class="text-slate-500 hover:text-indigo-600 p-1"><i data-lucide="edit" class="w-4 h-4"></i></button>
                                <button title="Remove User" class="text-slate-500 hover:text-red-600 p-1 ml-2"><i data-lucide="trash-2" class="w-4 h-4"></i></button>
                            </div>
                        </div>
                    </li>
                </ul>
            </Card>
            
            <Card>
                <div class="flex justify-between items-center mb-4">
                    <h3 class="text-xl font-bold text-slate-700 flex items-center">
                        <span>Advanced: Custom Lead Scrapers</span>
                        <span class="ml-3 px-2 py-0.5 bg-sky-100 text-sky-700 text-xs font-semibold rounded-full">BETA</span>
                    </h3>
                    <PrimaryButton @click="openScraperModal()" label="Add New Scraper" icon="plus" class="text-sm" />
                </div>
                <p class="text-sm text-slate-500 mb-4">Point the AI engine at specific websites (e.g., city procurement portals, county meeting minutes) to find hyper-targeted leads. This is a premium feature.</p>
                
                <!-- Desktop Table -->
                <div class="overflow-x-auto hidden md:block">
                    <table class="min-w-full divide-y divide-slate-200">
                        <thead class="bg-slate-50">
                            <tr>
                                <th class="px-4 py-2 text-left text-xs font-medium text-slate-500 uppercase tracking-wider">Name</th>
                                <th class="px-4 py-2 text-left text-xs font-medium text-slate-500 uppercase tracking-wider">Target URL</th>
                                <th class="px-4 py-2 text-left text-xs font-medium text-slate-500 uppercase tracking-wider">Status</th>
                                <th class="px-4 py-2 text-right text-xs font-medium text-slate-500 uppercase tracking-wider">Actions</th>
                            </tr>
                        </thead>
                        <tbody class="bg-white divide-y divide-slate-200">
                            <tr v-for="scraper in customScrapers" :key="scraper.id" class="hover:bg-slate-50">
                                <td class="px-4 py-3 whitespace-nowrap text-sm font-medium text-slate-900">{{ scraper.name }}</td>
                                <td class="px-4 py-3 whitespace-nowrap text-sm text-slate-600 truncate max-w-xs"><a :href="scraper.url" target="_blank" class="hover:underline">{{ scraper.url }}</a></td>
                                <td class="px-4 py-3 whitespace-nowrap text-sm">
                                    <label class="relative inline-flex items-center cursor-pointer">
                                      <input type="checkbox" :checked="scraper.active" @change="toggleScraperStatus(scraper)" class="sr-only peer">
                                      <div class="w-11 h-6 bg-slate-200 rounded-full peer peer-focus:ring-4 peer-focus:ring-indigo-300 peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-0.5 after:left-[2px] after:bg-white after:border-slate-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-indigo-600"></div>
                                      <span class="ml-3 text-sm font-medium text-slate-600">{{ scraper.active ? 'Active' : 'Paused' }}</span>
                                    </label>
                                </td>
                                <td class="px-4 py-3 whitespace-nowrap text-right text-sm font-medium">
                                    <button @click="openScraperModal(scraper)" class="text-indigo-600 hover:text-indigo-900 inline-flex items-center gap-1">
                                        <i data-lucide="edit-3" class="w-4 h-4"></i> Edit
                                    </button>
                                    <button @click="deleteScraper(scraper.id)" class="text-red-600 hover:text-red-900 ml-4 inline-flex items-center gap-1">
                                        <i data-lucide="trash-2" class="w-4 h-4"></i> Delete
                                    </button>
                                </td>
                            </tr>
                        </tbody>
                    </table>
                </div>

                <!-- Mobile Card View -->
                <div class="md:hidden space-y-4">
                    <div v-for="scraper in customScrapers" :key="scraper.id" class="bg-slate-50 p-4 rounded-lg border border-slate-200">
                        <div class="flex justify-between items-start mb-3">
                            <div>
                                <p class="font-medium text-slate-900">{{ scraper.name }}</p>
                                <a :href="scraper.url" target="_blank" class="text-sm text-indigo-600 hover:underline break-all">{{ scraper.url }}</a>
                            </div>
                             <label class="relative inline-flex items-center cursor-pointer ml-4 flex-shrink-0">
                                <input type="checkbox" :checked="scraper.active" @change="toggleScraperStatus(scraper)" class="sr-only peer">
                                <div class="w-11 h-6 bg-slate-200 rounded-full peer peer-focus:ring-4 peer-focus:ring-indigo-300 peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-0.5 after:left-[2px] after:bg-white after:border-slate-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-indigo-600"></div>
                            </label>
                        </div>
                        <div class="mt-3 pt-3 border-t border-slate-200 flex justify-between items-center">
                            <span class="text-sm font-medium text-slate-600">{{ scraper.active ? 'Active' : 'Paused' }}</span>
                            <div class="flex items-center gap-4">
                                <button @click="openScraperModal(scraper)" class="text-indigo-600 hover:text-indigo-900 inline-flex items-center gap-1 text-sm">
                                    <i data-lucide="edit-3" class="w-4 h-4"></i> Edit
                                </button>
                                <button @click="deleteScraper(scraper.id)" class="text-red-600 hover:text-red-900 inline-flex items-center gap-1 text-sm">
                                    <i data-lucide="trash-2" class="w-4 h-4"></i> Delete
                                </button>
                            </div>
                        </div>
                    </div>
                </div>
            </Card>
            
            <Card>
                <h3 class="text-xl font-bold text-slate-700 mb-4">Subscription & Billing</h3>
                <div class="bg-slate-50 border border-slate-200 rounded-lg p-4 flex flex-col md:flex-row justify-between items-start md:items-center">
                    <div>
                        <p class="font-semibold text-slate-800">Current Plan: <span class="text-indigo-600">Pro</span></p>
                        <p class="text-sm text-slate-500">Your plan renews on September 1, 2025.</p>
                    </div>
                    <div class="mt-4 md:mt-0">
                        <button class="text-sm font-semibold text-indigo-600 hover:underline">Manage Subscription</button>
                        <button class="ml-4 text-sm font-semibold text-slate-600 hover:underline">View Billing History</button>
                    </div>
                </div>
            </Card>
        </div>

        <!-- Map Editor Modal -->
        <div v-if="isMapModalOpen" class="fixed inset-0 bg-black bg-opacity-50 z-[1000] flex items-center justify-center p-4">
            <div class="bg-white rounded-lg shadow-2xl w-full h-full max-w-6xl max-h-[90vh] flex flex-col">
                <header class="p-4 border-b flex justify-between items-center">
                    <h2 class="text-lg font-bold text-slate-800">Edit Service Area</h2>
                    <button @click="isMapModalOpen = false" class="text-slate-500 hover:text-slate-800">
                        <i data-lucide="x" class="w-6 h-6"></i>
                    </button>
                </header>
                <div class="flex-grow relative">
                    <div ref="serviceAreaEditMapRef" class="w-full h-full"></div>
                </div>
                <footer class="p-4 border-t flex justify-end gap-3">
                    <button @click="isMapModalOpen = false" class="px-4 py-2 bg-white text-slate-700 font-semibold border border-slate-300 rounded-lg shadow-sm hover:bg-slate-50">Cancel</button>
                    <PrimaryButton @click="saveServiceArea" label="Save Area" />
                </footer>
            </div>
        </div>
        
        <!-- Scraper Editor Modal -->
        <div v-if="isScraperModalOpen" class="fixed inset-0 bg-black bg-opacity-50 z-[1000] flex items-center justify-center p-4">
            <div class="bg-white rounded-lg shadow-2xl w-full max-w-lg">
                <header class="p-4 border-b flex justify-between items-center">
                    <h2 class="text-lg font-bold text-slate-800">{{ currentScraper.id ? 'Edit' : 'Add' }} Custom Scraper</h2>
                    <button @click="isScraperModalOpen = false" class="text-slate-500 hover:text-slate-800"><i data-lucide="x" class="w-6 h-6"></i></button>
                </header>
                <div class="p-6 space-y-4">
                    <div>
                        <label for="scraper-name" class="block text-sm font-medium text-slate-600">Scraper Name</label>
                        <input type="text" id="scraper-name" v-model="currentScraper.name" placeholder="e.g., City of Phoenix RFPs" class="mt-1 block w-full px-3 py-2 bg-white border border-slate-300 rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500" />
                    </div>
                    <div>
                        <label for="scraper-url" class="block text-sm font-medium text-slate-600">Target URL</label>
                        <input type="url" id="scraper-url" v-model="currentScraper.url" placeholder="https://..." class="mt-1 block w-full px-3 py-2 bg-white border border-slate-300 rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500" />
                    </div>
                    <div>
                        <label for="scraper-keywords" class="block text-sm font-medium text-slate-600">Keywords (comma-separated)</label>
                        <input type="text" id="scraper-keywords" v-model="currentScraper.keywords" placeholder="tennis, resurfacing, athletic facility" class="mt-1 block w-full px-3 py-2 bg-white border border-slate-300 rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500" />
                    </div>
                </div>
                <footer class="p-4 bg-slate-50 border-t flex justify-end gap-3">
                    <button @click="isScraperModalOpen = false" class="px-4 py-2 bg-white text-slate-700 font-semibold border border-slate-300 rounded-lg shadow-sm hover:bg-slate-50">Cancel</button>
                    <PrimaryButton @click="saveScraper" label="Save Scraper" />
                </footer>
            </div>
        </div>
    </main>
</template>
<script setup lang="ts">
import { ref, computed } from 'vue';
import { 
    Users, 
    Target, 
    Plus, 
    Trash2, 
    Search, 
    Building2,
    AlertCircle
} from 'lucide-vue-next';

const props = defineProps<{
  trackedCompetitors: any[];
}>();

const emit = defineEmits(['updateTrackedCompetitors']);

const allCompetitors = [
  { id: 'comp1', name: 'Ace Resurfacing Co.', jobs: 12, region: 'East Valley' },
  { id: 'comp2', name: 'Sunstate Courts', jobs: 8, region: 'West Valley' },
  { id: 'comp3', name: 'C&S Sport Surfaces', jobs: 15, region: 'Statewide' },
  { id: 'comp4', name: 'Pro Courts Arizona', jobs: 5, region: 'Scottsdale' },
  { id: 'comp5', name: 'Arizona Court Masters', jobs: 9, region: 'Tucson' },
];

const searchTerm = ref('');

const filteredCompetitors = computed(() => {
  return allCompetitors.filter(c => 
    !props.trackedCompetitors.some(tc => tc.id === c.id) &&
    c.name.toLowerCase().includes(searchTerm.value.toLowerCase())
  );
});

const addCompetitor = (competitor: any) => {
  if (!props.trackedCompetitors.some(tc => tc.id === competitor.id)) {
    const newList = [...props.trackedCompetitors, competitor];
    emit('updateTrackedCompetitors', newList);
  }
};

const removeCompetitor = (competitorId: string) => {
  const newList = props.trackedCompetitors.filter(c => c.id !== competitorId);
  emit('updateTrackedCompetitors', newList);
};

</script>

<template>
    <div class="flex-1 overflow-y-auto bg-slate-50 p-6">
        <header class="mb-6">
            <h1 class="text-3xl font-bold text-slate-800 flex items-center">
                <Target class="w-8 h-8 mr-3 text-indigo-600" />
                Competitor Intelligence
            </h1>
            <p class="mt-1 text-slate-600">Track competitor activity and market presence in your area.</p>
        </header>

        <div class="grid grid-cols-1 lg:grid-cols-3 gap-6">
            <!-- Your Tracked Competitors -->
            <div class="lg:col-span-2 bg-white p-6 rounded-lg shadow-md border border-slate-200">
                <h2 class="text-xl font-bold text-slate-800 flex items-center mb-4">
                    <Users class="w-6 h-6 mr-2 text-slate-500" />
                    Your Tracked Competitors
                </h2>
                
                <div v-if="trackedCompetitors.length > 0" class="space-y-4">
                    <div v-for="comp in trackedCompetitors" :key="comp.id" class="flex items-center justify-between p-4 bg-slate-50 rounded-lg border border-slate-200 hover:bg-slate-100 transition-colors">
                        <div class="flex items-center">
                            <div class="p-2 bg-slate-200 rounded-full mr-4">
                                <Building2 class="w-5 h-5 text-slate-600" />
                            </div>
                            <div>
                                <p class="font-semibold text-slate-800">{{ comp.name }}</p>
                                <p class="text-xs text-slate-500">{{ comp.jobs }} recent jobs | {{ comp.region }}</p>
                            </div>
                        </div>
                        <button @click="removeCompetitor(comp.id)" class="p-2 rounded-full text-slate-400 hover:bg-red-100 hover:text-red-600 transition-colors">
                            <Trash2 class="w-5 h-5" />
                        </button>
                    </div>
                </div>
                 <div v-else class="text-center py-8 px-4 border-2 border-dashed border-slate-200 rounded-lg">
                    <Users class="w-10 h-10 mx-auto text-slate-300 mb-2" />
                    <h3 class="font-semibold text-slate-700">No Competitors Tracked</h3>
                    <p class="text-sm text-slate-500 mt-1">Add competitors from the list to start tracking.</p>
                </div>
            </div>

            <!-- Add New Competitors -->
            <div class="bg-white p-6 rounded-lg shadow-md border border-slate-200">
                <h2 class="text-xl font-bold text-slate-800 flex items-center mb-4">
                    <Plus class="w-6 h-6 mr-2 text-slate-500" />
                    Add Competitors
                </h2>

                <div class="relative mb-4">
                    <input v-model="searchTerm" type="text" placeholder="Search for a company..." class="w-full pl-10 pr-4 py-2 border border-slate-300 rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500" />
                    <Search class="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400" />
                </div>
                
                <div class="space-y-2 max-h-96 overflow-y-auto">
                    <div v-for="comp in filteredCompetitors" :key="comp.id" class="flex items-center justify-between p-2 rounded-md hover:bg-slate-50 transition-colors">
                        <div>
                           <p class="font-medium text-sm text-slate-700">{{ comp.name }}</p>
                        </div>
                        <button @click="addCompetitor(comp)" class="p-1.5 rounded-full text-slate-400 hover:bg-indigo-100 hover:text-indigo-600 transition-colors">
                            <Plus class="w-5 h-5" />
                        </button>
                    </div>
                     <div v-if="filteredCompetitors.length === 0" class="text-center pt-4 text-sm text-slate-500">
                        <p>No more competitors to add.</p>
                    </div>
                </div>
            </div>
        </div>
    </div>
</template>


<script setup lang="ts">
import { ref } from 'vue';
import { 
    User, 
    Plus, 
    Sparkles,
    Loader,
    Building2,
    Lightbulb
} from 'lucide-vue-next';

const props = defineProps<{
  userIntel: any[];
}>();

const emit = defineEmits(['addIntel']);

const newIntelNote = ref('');
const newIntelType = ref('Site Visit');
const isSummarizing = ref(false);
const summaryError = ref('');

const handleAddIntel = () => {
  if (newIntelNote.value.trim()) {
    emit('addIntel', {
      type: newIntelType.value,
      note: newIntelNote.value.trim(),
      date: new Date().toLocaleDateString(),
    });
    newIntelNote.value = '';
    newIntelType.value = 'Site Visit';
  }
};

const handleSummarize = async () => {
  if (!newIntelNote.value.trim()) {
    summaryError.value = 'Please enter some notes to summarize.';
    return;
  }
  isSummarizing.value = true;
  summaryError.value = '';
  
  const userPrompt = `Summarize the following notes from a sports construction site visit into a concise, professional paragraph:\n\n---\n${newIntelNote.value}\n---`;
  
  // In this environment, the API key is injected at runtime.
  // We leave it as an empty string.
  const apiKey = "";
  const apiUrl = `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash-preview-05-20:generateContent?key=${apiKey}`;

  try {
    const response = await fetch(apiUrl, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        contents: [{ parts: [{ text: userPrompt }] }]
      })
    });

    if (!response.ok) {
      throw new Error(`API Error: ${response.status} ${response.statusText}`);
    }

    const result = await response.json();
    const summary = result.candidates?.[0]?.content?.parts?.[0]?.text;

    if (summary) {
      newIntelNote.value = summary;
    } else {
      throw new Error("No summary was returned from the API.");
    }
  } catch (error) {
    console.error('Gemini API Error:', error);
    summaryError.value = "Could not summarize notes. Please try again.";
  } finally {
    isSummarizing.value = false;
  }
};

</script>

<template>
    <div class="flex-1 overflow-y-auto bg-slate-50 p-6">
        <header class="mb-6">
            <h1 class="text-3xl font-bold text-slate-800 flex items-center">
                <User class="w-8 h-8 mr-3 text-indigo-600" />
                My Intelligence
            </h1>
            <p class="mt-1 text-slate-600">Add your own notes, site visit summaries, and other intel.</p>
        </header>

        <div class="grid grid-cols-1 lg:grid-cols-3 gap-6">
            <!-- Add New Intel Form -->
            <div class="lg:col-span-1 bg-white p-6 rounded-lg shadow-md border border-slate-200">
                <h2 class="text-xl font-bold text-slate-800 flex items-center mb-4">
                    <Plus class="w-6 h-6 mr-2 text-slate-500" />
                    Add New Intel
                </h2>
                <form @submit.prevent="handleAddIntel" class="space-y-4">
                    <div>
                        <label for="intel-type" class="block text-sm font-medium text-slate-700">Intel Type</label>
                        <select id="intel-type" v-model="newIntelType" class="mt-1 block w-full rounded-md border-slate-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm">
                            <option>Site Visit</option>
                            <option>Client Meeting</option>
                            <option>Competitor Sighting</option>
                            <option>General Note</option>
                        </select>
                    </div>
                    <div>
                        <label for="intel-note" class="block text-sm font-medium text-slate-700">Notes</label>
                        <div class="relative">
                            <textarea id="intel-note" v-model="newIntelNote" rows="8" class="mt-1 block w-full rounded-md border-slate-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm" placeholder="e.g., Visited Scottsdale Ranch Park. Court 3 has significant cracking..."></textarea>
                            <button @click.prevent="handleSummarize" :disabled="isSummarizing || !newIntelNote" type="button" class="absolute bottom-2 right-2 flex items-center justify-center text-xs font-semibold bg-indigo-100 text-indigo-700 px-2 py-1 rounded-md hover:bg-indigo-200 disabled:opacity-50 disabled:cursor-not-allowed">
                                <Sparkles v-if="!isSummarizing" class="w-4 h-4 mr-1.5" />
                                <Loader v-else class="w-4 h-4 mr-1.5 animate-spin" />
                                Summarize w/ AI
                            </button>
                        </div>
                         <p v-if="summaryError" class="mt-2 text-xs text-red-600">{{ summaryError }}</p>
                    </div>
                    <div>
                        <button type="submit" class="w-full bg-indigo-600 text-white font-semibold py-2 px-4 rounded-md hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500">
                            Add Intel
                        </button>
                    </div>
                </form>
            </div>
            
            <!-- Intel Feed -->
            <div class="lg:col-span-2 bg-white p-6 rounded-lg shadow-md border border-slate-200">
                <h2 class="text-xl font-bold text-slate-800 mb-4">Your Intel Feed</h2>
                <div class="space-y-4 max-h-[70vh] overflow-y-auto">
                    <div v-for="intel in userIntel" :key="intel.id" class="p-4 bg-slate-50 rounded-lg border border-slate-200">
                        <div class="flex items-center justify-between mb-2">
                            <p class="font-bold text-slate-800 flex items-center">
                                <Building2 v-if="intel.type === 'Site Visit'" class="w-4 h-4 mr-2 text-slate-500" />
                                <Lightbulb v-else class="w-4 h-4 mr-2 text-slate-500" />
                                {{ intel.type }}
                            </p>
                            <p class="text-xs text-slate-500">{{ intel.date }}</p>
                        </div>
                        <p class="text-sm text-slate-600 whitespace-pre-wrap">{{ intel.note }}</p>
                    </div>
                </div>
            </div>
        </div>
    </div>
</template>

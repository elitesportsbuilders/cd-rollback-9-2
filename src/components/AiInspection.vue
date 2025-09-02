<script setup lang="ts">
import { ref, nextTick } from 'vue';
import PrimaryButton from '@/components/PrimaryButton.vue';
import Card from '@/components/Card.vue';
import { createIcons } from 'lucide';

const file = ref<File | null>(null);
const isAnalyzing = ref(false);
const analysisResult = ref<any>(null);
const error = ref<string | null>(null);
const imageUrl = ref("https://storage.googleapis.com/gemini-prod-us-west1-assets/images/court_inspection_before.png");

const handleFileChange = (event: Event) => {
  const target = event.target as HTMLInputElement;
  if (target.files && target.files.length > 0) {
    const selectedFile = target.files[0];
    file.value = selectedFile;
    imageUrl.value = URL.createObjectURL(selectedFile);
    analysisResult.value = null;
    error.value = null;
  }
};

const handleAnalyzeClick = () => {
  if (!file.value && !imageUrl.value.startsWith('https://')) {
    error.value = "Please select a file to analyze.";
    return;
  }

  isAnalyzing.value = true;
  analysisResult.value = null;
  error.value = null;

  // Simulate API call for prototype
  setTimeout(() => {
    const mockResult = {
      summary: "The court surface shows significant fading and multiple structural cracks, indicating it is due for resurfacing.",
      defects: [
        { type: "Structural Cracking", description: "Multiple hairline and wider cracks visible across the playing surface.", severity: "High" },
        { type: "Fading/Discoloration", description: "Significant color fading in high-traffic areas, particularly near baselines.", severity: "Medium" },
        { type: "Surface Wear", description: "Texture appears worn, which may affect ball bounce and player footing.", severity: "Low" }
      ]
    };
    analysisResult.value = mockResult;
    isAnalyzing.value = false;
    nextTick(() => {
        createIcons();
    });
  }, 2000);
};

const getSeverityIcon = (severity: string) => {
    switch (severity) {
        case 'High': return { icon: 'check-circle-2', class: 'text-red-500' };
        case 'Medium': return { icon: 'check-circle-2', class: 'text-amber-500' };
        case 'Low': return { icon: 'check-circle-2', class: 'text-green-500' };
        default: return { icon: 'check-circle-2', class: 'text-slate-500' };
    }
};
</script>

<template>
    <main class="flex-1 overflow-y-auto p-6 md:p-8">
        <header class="mb-8">
            <div class="flex items-center gap-4">
                <h2 class="text-3xl font-extrabold text-slate-800">AI Visual Inspection</h2>
                <span class="px-2 py-0.5 bg-sky-100 text-sky-700 text-xs font-semibold rounded-full mt-1">BETA</span>
            </div>
            <p class="text-slate-500 mt-1">Upload an image of a court surface for instant analysis.</p>
        </header>

        <div class="grid grid-cols-1 lg:grid-cols-2 gap-8">
            <div>
                <Card>
                    <h3 class="text-xl font-bold text-slate-700 mb-4">1. Upload Image</h3>
                    <div class="mt-2 flex justify-center rounded-lg border border-dashed border-slate-900/25 px-6 py-10">
                        <div class="text-center">
                            <i data-lucide="image" class="mx-auto h-12 w-12 text-slate-300"></i>
                            <div class="mt-4 flex text-sm leading-6 text-slate-600">
                                <label for="file-upload" class="relative cursor-pointer rounded-md bg-white font-semibold text-indigo-600 focus-within:outline-none focus-within:ring-2 focus-within:ring-indigo-600 focus-within:ring-offset-2 hover:text-indigo-500">
                                    <span>Upload a file</span>
                                    <input id="file-upload" name="file-upload" type="file" class="sr-only" @change="handleFileChange" accept="image/*" />
                                </label>
                                <p class="pl-1">or drag and drop</p>
                            </div>
                            <p class="text-xs leading-5 text-slate-600">PNG, JPG up to 10MB</p>
                        </div>
                    </div>

                     <div v-if="file" class="mt-4 text-sm text-slate-600 border-t pt-4">
                       <p><strong>Selected:</strong> {{ file.name }}</p>
                     </div>

                    <PrimaryButton
                        class="mt-6 w-full"
                        :label="isAnalyzing ? 'Analyzing...' : 'Analyze Image'"
                        icon="scan-line"
                        :is-loading="isAnalyzing"
                        :disabled="!imageUrl"
                        @click="handleAnalyzeClick"
                    />
                </Card>
            </div>

            <div v-if="imageUrl">
                <Card>
                    <div class="flex justify-between items-center">
                        <h3 class="text-xl font-bold text-slate-700">2. Preview & Analysis</h3>
                        <span v-if="analysisResult" class="text-xs font-semibold text-slate-500 bg-slate-100 px-2 py-1 rounded-full">Mock Analysis</span>
                    </div>
                    
                    <div class="mt-4 relative">
                        <img :src="imageUrl" alt="Court for inspection" class="rounded-lg w-full" />
                    </div>

                    <div class="mt-4">
                        <h4 class="font-bold text-slate-600 mb-2">Generated Summary</h4>
                        
                        <div v-if="isAnalyzing" class="flex items-center justify-center p-4 bg-slate-50 rounded-lg border border-slate-200">
                            <svg class="animate-spin h-5 w-5 text-indigo-600" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                                <circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4"></circle>
                                <path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                            </svg>
                            <span class="ml-2 text-slate-500">Analyzing image...</span>
                        </div>
                        
                        <div v-if="error" class="text-sm text-red-700 bg-red-50 p-4 rounded-lg border border-red-200">
                            <p>{{ error }}</p>
                        </div>
                        
                        <div v-if="analysisResult" class="text-sm text-slate-700 bg-slate-50 p-4 rounded-lg border border-slate-200 space-y-3">
                            <p class="italic">{{ analysisResult.summary }}</p>
                            <hr/>
                            <div v-for="defect in analysisResult.defects" :key="defect.type" class="flex items-start">
                                <i :data-lucide="getSeverityIcon(defect.severity).icon" class="w-4 h-4 mr-2 mt-0.5" :class="getSeverityIcon(defect.severity).class"></i>
                                <div><span class="font-semibold">{{ defect.type }}:</span> {{ defect.description }}</div>
                            </div>
                        </div>

                        <div v-if="!isAnalyzing && !analysisResult && !error" class="text-sm text-slate-500 bg-slate-50 p-4 rounded-lg border border-slate-200">
                          <p>An initial image is provided. Upload your own file or click "Analyze Image" to generate an AI summary of the court's condition.</p>
                        </div>
                    </div>
                </Card>
            </div>
        </div>
    </main>
</template>

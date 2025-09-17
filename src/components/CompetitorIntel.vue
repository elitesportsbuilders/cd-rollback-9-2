<template>
  <div>
    <div class="container mx-auto p-4 sm:p-6 lg:p-10">
      <!-- Header -->
      <header class="mb-10 text-center">
        <h1 class="text-4xl font-extrabold text-white tracking-tight">Competitor Intelligence Dashboard</h1>
        <p class="mt-2 text-lg text-slate-400">Actionable insights to stay ahead in the sports construction market.</p>
        <p class="mt-1 text-sm text-slate-500">Last Updated: {{ lastUpdated }}</p>
      </header>

      <!-- Main Grid Layout -->
      <div class="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-4 gap-8">
        <!-- Column 1: Competitor Selection & Quick View -->
        <div class="lg:col-span-1 md:col-span-1 bg-slate-800 p-6 rounded-3xl shadow-2xl flex flex-col h-fit">
          <h2 class="text-2xl font-bold text-white mb-6 flex items-center">
            <Users class="w-6 h-6 mr-3 text-sky-400"/>
            Competitor Quick View
          </h2>
          <div class="mb-6">
            <label for="competitor-select" class="block text-sm font-medium text-slate-400 mb-2">Select Competitor:</label>
            <div class="relative">
              <select id="competitor-select" v-model="selectedCompetitorId" class="w-full rounded-xl border-slate-700 shadow-sm focus:border-sky-500 focus:ring-sky-500 transition-colors duration-200 pl-4 pr-10 py-2 text-sm appearance-none cursor-pointer bg-slate-700 text-white">
                <option v-for="comp in competitorsData" :key="comp.id" :value="comp.id">{{ comp.name }}</option>
              </select>
              <div class="pointer-events-none absolute inset-y-0 right-0 flex items-center px-2 text-slate-400">
                <svg class="w-4 h-4" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor"><path fill-rule="evenodd" d="M5.293 7.293a1 1 0 011.414 0L10 10.586l3.293-3.293a1 1 0 111.414 1.414l-4 4a1 1 0 01-1.414 0l-4-4a1 1 0 010-1.414z" clip-rule="evenodd" /></svg>
              </div>
            </div>
          </div>
          
          <div v-if="selectedCompetitor" class="space-y-4 text-sm">
            <div>
              <h3 class="font-semibold text-white">Summary</h3>
              <p class="text-sm text-slate-400">{{ selectedCompetitor.summary }}</p>
            </div>
            <div>
              <h4 class="font-semibold text-white">Key Contact</h4>
              <p class="text-sm text-slate-400 flex items-center"><Users class="w-4 h-4 mr-2 text-indigo-400" />{{ selectedCompetitor.keyContact }}</p>
            </div>
            <div>
              <h4 class="font-semibold text-white">Recent News Sentiment</h4>
              <p v-if="quickViewSentiment === 'loading'" class="text-sm text-slate-400 flex items-center">
                <span class="animate-pulse mr-2 h-3 w-3 rounded-full bg-amber-400"></span>
                Analyzing...
              </p>
              <div v-else class="text-sm text-slate-400 flex items-center">
                <span v-if="quickViewSentiment === 'positive'" class="mr-2 h-3 w-3 rounded-full bg-green-400"></span>
                <span v-if="quickViewSentiment === 'negative'" class="mr-2 h-3 w-3 rounded-full bg-red-400"></span>
                <span v-if="quickViewSentiment === 'neutral'" class="mr-2 h-3 w-3 rounded-full bg-yellow-400"></span>
                <span v-if="quickViewSentiment === 'positive'">😊 Positive</span>
                <span v-if="quickViewSentiment === 'negative'">😞 Negative</span>
                <span v-if="quickViewSentiment === 'neutral'">😐 Neutral</span>
              </div>
            </div>
          </div>
        </div>

        <!-- Column 2: News Feed & Project Tracker -->
        <div class="lg:col-span-2 md:col-span-2 space-y-8">
          <!-- Real-Time News & Social Media Feed -->
          <div class="bg-slate-800 p-6 rounded-3xl shadow-2xl">
            <h2 class="text-2xl font-bold text-white mb-6 flex items-center">
              <Sun class="w-6 h-6 mr-3 text-amber-400"/>
              Real-Time News Feed
            </h2>
            <div class="space-y-4 max-h-96 overflow-y-auto pr-2">
              <div v-for="(item, index) in newsFeedData" :key="index" class="flex items-start space-x-3 text-sm p-4 bg-slate-700/50 rounded-xl transition-transform hover:scale-[1.01]">
                <div class="flex-shrink-0 w-4 h-4 mt-1">
                  <TrendingUp v-if="item.sentiment === 'positive'" class="text-green-400 w-4 h-4"/>
                  <TrendingDown v-if="item.sentiment === 'negative'" class="text-red-400 w-4 h-4"/>
                  <Minus v-if="item.sentiment === 'neutral'" class="text-yellow-400 w-4 h-4"/>
                </div>
                <div>
                  <span class="font-semibold text-sky-400">[{{ item.source }}]</span>
                  <p class="text-slate-300">{{ item.text }}</p>
                </div>
              </div>
            </div>
          </div>

          <!-- Competitor Project Tracker -->
          <div class="bg-slate-800 p-6 rounded-3xl shadow-2xl">
            <h2 class="text-2xl font-bold text-white mb-6 flex items-center">
              <Target class="w-6 h-6 mr-3 text-purple-400"/>
              Competitor Project Tracker
            </h2>
            <div class="overflow-x-auto">
              <table class="w-full text-left table-auto">
                <thead class="border-b border-slate-600 sticky top-0 bg-slate-800 z-10">
                  <tr>
                    <th class="py-3 px-2">Competitor</th>
                    <th class="py-3 px-2">Project Name</th>
                    <th class="py-3 px-2">Status</th>
                    <th class="py-3 px-2">Bid (est.)</th>
                  </tr>
                </thead>
                <tbody>
                  <tr v-for="(project, index) in projectTrackerData" :key="index" class="border-b border-slate-700 transition-colors duration-200 hover:bg-slate-700/50">
                    <td class="py-3 px-2">{{ project.competitor }}</td>
                    <td class="py-3 px-2">{{ project.project }}</td>
                    <td class="py-3 px-2 font-semibold" :class="{
                      'text-amber-400': project.status === 'In Progress',
                      'text-green-400': project.status === 'Complete',
                      'text-red-400': project.status === 'Bid Lost',
                      'text-sky-400': project.status === 'Bidding',
                    }">{{ project.status }}</td>
                    <td class="py-3 px-2">${{ project.bid.toLocaleString() }}</td>
                  </tr>
                </tbody>
              </table>
            </div>
          </div>
        </div>

        <!-- Column 3: SWOT & Market Share -->
        <div class="lg:col-span-1 md:col-span-3 lg:col-start-4 space-y-8">
          <!-- Dynamic SWOT Analysis -->
          <div class="bg-slate-800 p-6 rounded-3xl shadow-2xl">
            <h2 class="text-2xl font-bold text-white mb-6 flex items-center">
              <Lightbulb class="w-6 h-6 mr-3 text-lime-400"/>
              Dynamic SWOT Analysis
            </h2>
            <div v-if="selectedCompetitor" class="grid grid-cols-2 gap-6 text-sm">
              <div>
                <h4 class="font-bold text-green-400 mb-2 flex items-center"><Trophy class="w-4 h-4 mr-2"/>Strengths</h4>
                <ul class="list-disc list-inside space-y-1 text-slate-400">
                  <li v-for="s in selectedCompetitor.swot.strengths" :key="s">{{ s }}</li>
                </ul>
              </div>
              <div>
                <h4 class="font-bold text-red-400 mb-2 flex items-center"><AlertCircle class="w-4 h-4 mr-2"/>Weaknesses</h4>
                <ul class="list-disc list-inside space-y-1 text-slate-400">
                  <li v-for="w in selectedCompetitor.swot.weaknesses" :key="w">{{ w }}</li>
                </ul>
              </div>
              <div>
                <h4 class="font-bold text-sky-400 mb-2 flex items-center"><Sparkles class="w-4 h-4 mr-2"/>Opportunities</h4>
                <ul class="list-disc list-inside space-y-1 text-slate-400">
                  <li v-for="o in selectedCompetitor.swot.opportunities" :key="o">{{ o }}</li>
                </ul>
              </div>
              <div>
                <h4 class="font-bold text-orange-400 mb-2 flex items-center"><AlertCircle class="w-4 h-4 mr-2"/>Threats</h4>
                <ul class="list-disc list-inside space-y-1 text-slate-400">
                  <li v-for="t in selectedCompetitor.swot.threats" :key="t">{{ t }}</li>
                </ul>
              </div>
            </div>
          </div>

          <!-- Market Share & Service Trends -->
          <div class="bg-slate-800 p-6 rounded-3xl shadow-2xl">
            <h2 class="text-2xl font-bold text-white mb-6 flex items-center">
              <PieChart class="w-6 h-6 mr-3 text-slate-400"/>
              Market Share (AZ)
            </h2>
            <div class="relative h-[300px] w-full">
              <canvas ref="marketShareChartCanvas"></canvas>
            </div>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
// You will need to install these packages first:
// npm install lucide-vue-next chart.js

import { ref, computed, onMounted, watch } from 'vue';
import { Chart, registerables } from 'chart.js';
import { TrendingUp, TrendingDown, Minus, Trophy, Sparkles, AlertCircle, Users, Sun, Target, Lightbulb, PieChart } from 'lucide-vue-next';

Chart.register(...registerables);

// --- TYPE DEFINITIONS ---
interface Swot {
  strengths: string[];
  weaknesses: string[];
  opportunities: string[];
  threats: string[];
}

interface Competitor {
  id: string;
  name: string;
  summary: string;
  keyContact: string;
  swot: Swot;
}

interface NewsItem {
  source: string;
  text: string;
  sentiment: 'positive' | 'negative' | 'neutral';
}

interface Project {
  competitor: string;
  project: string;
  status: 'In Progress' | 'Complete' | 'Bid Lost' | 'Bidding';
  bid: number;
  notes: string;
}

// --- MOCK DATA ---
// NOTE: In a production app, this data would be fetched from a backend API.
const competitorsData: Competitor[] = [
  {
    id: 'compA',
    name: "Competitor A",
    summary: "Specializes in post-tension concrete courts. Recently expanded into AZ.",
    keyContact: "John Doe (Regional Manager)",
    swot: {
      strengths: ["Strong supplier relationships", "Experienced team"],
      weaknesses: ["Negative review on Google", "Limited track experience"],
      opportunities: ["ASBA spec changes benefit them", "Growth in pickleball"],
      threats: ["New competitor entering market", "Rising material costs"]
    }
  },
  {
    id: 'compB',
    name: "Competitor B",
    summary: "Focuses on high-school and collegiate running tracks.",
    keyContact: "Jane Smith (Sales Director)",
    swot: {
      strengths: ["Proprietary track surfacing material", "Strong public sector contracts"],
      weaknesses: ["Slow to adopt pickleball trend", "Higher price point"],
      opportunities: ["New bond issues for school athletics", "Green building initiatives"],
      threats: ["Supply chain issues for their material", "Aggressive bidding from smaller firms"]
    }
  },
  {
    id: 'compC',
    name: "Competitor C",
    summary: "Aggressive pricing on resurfacing projects. Growing quickly.",
    keyContact: "Sam Wilson (Owner)",
    swot: {
      strengths: ["Low overhead", "Fast project turnaround"],
      weaknesses: ["Smaller team, capacity issues", "Less brand recognition"],
      opportunities: ["HOA resurfacing contracts", "Economic downturn favors lower bids"],
      threats: ["Reputation risk from cutting corners", "Larger competitors can out-bid"]
    }
  }
];

const newsFeedData: NewsItem[] = [
  { source: 'LinkedIn', text: 'Competitor A just announced a new partnership with a large HOA in Scottsdale.', sentiment: 'positive' },
  { source: 'News Article', text: 'Competitor B featured in "Construction Today" for innovative track surfacing.', sentiment: 'positive' },
  { source: 'Gemini Analysis', text: 'Overall industry chatter is positive about new pickleball surfacing materials.', sentiment: 'neutral' },
  { source: 'Google Review', text: 'A customer left a 2-star review for Competitor A regarding project delays.', sentiment: 'negative' },
  { source: 'Press Release', text: 'Competitor C has acquired new line-painting equipment to speed up projects.', sentiment: 'neutral' }
];

const projectTrackerData: Project[] = [
  { competitor: 'Competitor A', project: 'Sun City Grand Courts', status: 'In Progress', bid: 250000, notes: 'Using new acrylic' },
  { competitor: 'Competitor C', project: 'Phoenix High School Track', status: 'Bid Lost', bid: 1200000, notes: 'We were underbid' },
  { competitor: 'Competitor B', project: 'ASU Practice Field', status: 'Complete', bid: 750000, notes: 'High-performance surface' },
  { competitor: 'Competitor A', project: 'Mesa Community Pickleball', status: 'Bidding', bid: 500000, notes: '12 new courts' }
];

// --- STATE ---
const selectedCompetitorId = ref('compA');
const quickViewSentiment = ref<string | null>(null);
const marketShareChartCanvas = ref<HTMLCanvasElement | null>(null);
let marketShareChart: Chart | null = null;

// --- COMPUTED PROPERTIES ---
const selectedCompetitor = computed(() => {
  return competitorsData.find(c => c.id === selectedCompetitorId.value);
});

// A placeholder for the date for a cleaner look.
const lastUpdated = computed(() => {
  const options: Intl.DateTimeFormatOptions = { year: 'numeric', month: 'long', day: 'numeric', hour: '2-digit', minute: '2-digit' };
  return new Date().toLocaleDateString('en-US', options);
});

// --- METHODS ---
// This function simulates a call to the Gemini API for sentiment analysis.
const getSentimentFromGemini = async (text: string): Promise<string> => {
    console.log(`Analyzing sentiment for: "${text}"`);
    quickViewSentiment.value = 'loading';
    const sentiments = ['positive', 'negative', 'neutral'];
    // Simulating a network call delay
    await new Promise(resolve => setTimeout(resolve, 1000));
    const sentiment = sentiments[Math.floor(Math.random() * 3)];
    return sentiment;
};

const updateQuickViewSentiment = async () => {
    if (selectedCompetitor.value) {
        const sentiment = await getSentimentFromGemini(`Overall sentiment for ${selectedCompetitor.value.name}`);
        quickViewSentiment.value = sentiment;
    }
};

const renderMarketShareChart = () => {
    if (!marketShareChartCanvas.value) return;
    if (marketShareChart) marketShareChart.destroy();

    const ctx = marketShareChartCanvas.value.getContext('2d');
    if (!ctx) return;

    marketShareChart = new Chart(ctx, {
        type: 'doughnut',
        data: {
            labels: ['Elite Sports Builders', 'Competitor A', 'Competitor B', 'Competitor C', 'Other'],
            datasets: [{
                label: 'Market Share in AZ',
                data: [40, 25, 15, 15, 5],
                backgroundColor: [
                    '#22d3ee', // Our brand color
                    '#facc15', // Competitor A
                    '#fb923c', // Competitor B
                    '#ef4444', // Competitor C
                    '#6b7280'  // Other
                ],
                borderColor: '#1e293b',
                borderWidth: 3
            }]
        },
        options: {
            responsive: true,
            maintainAspectRatio: false,
            plugins: {
                legend: {
                    position: 'bottom',
                    labels: { color: '#e2e8f0', boxWidth: 12 }
                }
            }
        }
    });
};

// --- LIFECYCLE HOOKS & WATCHERS ---
onMounted(() => {
    updateQuickViewSentiment();
    renderMarketShareChart();
});

watch(selectedCompetitorId, () => {
    updateQuickViewSentiment();
});
</script>

<style scoped>
/* Scoped styles for the dashboard components. */
@media (min-width: 768px) {
  .md\:col-span-2 {
    grid-column: span 2 / span 2;
  }
}
</style>

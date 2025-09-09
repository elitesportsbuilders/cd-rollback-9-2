<script setup lang="ts">
import { ref, computed, onMounted, watch, nextTick } from 'vue';
import { 
  ArrowUp,
  ArrowDown,
  Minus,
  PieChart,
  Sparkles,
  Lightbulb,
  Crosshair
} from 'lucide-vue-next';
import { Chart, registerables } from 'chart.js';

Chart.register(...registerables);

// --- PROPS ---
const props = defineProps<{
  seoData: any;
}>();

// --- STATE ---
const selectedKeyword = ref(props.seoData.keywords[0]);
const lineChartCanvas = ref<HTMLCanvasElement | null>(null);
const pieChartCanvas = ref<HTMLCanvasElement | null>(null);
let seoLineChart: Chart | null = null;
let shareOfVoiceChart: Chart | null = null;

// AI Ad Strategist State
const isLoadingAds = ref(false);
const adVariations = ref<any[]>([]);
const adError = ref<string | null>(null);


// --- COMPUTED PROPERTIES ---
const currentRankings = computed(() => {
  return props.seoData.rankings
    .filter((r: any) => r.keyword === selectedKeyword.value)
    .sort((a: any, b: any) => a.rank - b.rank);
});

const lineChartData = computed(() => {
  if (!selectedKeyword.value) return null;
  return (props.seoData.history as any)[selectedKeyword.value];
});

const shareOfVoiceData = computed(() => {
    const topPositions = props.seoData.rankings.filter((r: any) => r.rank <= 3);
    const competitorCounts = topPositions.reduce((acc: { [key: string]: number }, curr: any) => {
        acc[curr.competitor] = (acc[curr.competitor] || 0) + 1;
        return acc;
    }, {});

    const labels: string[] = Object.keys(competitorCounts);
    const data: number[] = Object.values(competitorCounts);
    
    return {
        labels,
        datasets: [{
            data,
            backgroundColor: ['#4f46e5', '#14B8A6', '#f59e0b', '#3b82f6', '#8b5cf6'],
            borderColor: '#ffffff',
            borderWidth: 2,
        }]
    };
});

const keywordOpportunities = computed(() => {
    const opportunities: any[] = [];

    // 1. Find "Low Hanging Fruit"
    props.seoData.keywords.forEach((kw: string) => {
        const rankingsForKw = props.seoData.rankings.filter((r: any) => r.keyword === kw);
        const hasTop3Rank = rankingsForKw.some((r: any) => r.rank <= 3);
        if (!hasTop3Rank) {
            opportunities.push({
                type: 'lowHangingFruit',
                keyword: kw,
                summary: `No competitor holds a top-3 position for this keyword.`
            });
        }
    });

    // 2. Find "Weak Competitors"
    const weakCompetitors = props.seoData.rankings.filter((r: any) => r.change < 0);
    weakCompetitors.forEach((r: any) => {
        opportunities.push({
            type: 'weakCompetitor',
            keyword: r.keyword,
            summary: `${r.competitor} dropped ${Math.abs(r.change)} spot(s). Good time to target.`
        });
    });

    return opportunities;
});


// --- METHODS ---

const handleOpportunityClick = (keyword: string) => {
    selectedKeyword.value = keyword;
};

const generateAds = async () => {
    isLoadingAds.value = true;
    adError.value = null;
    adVariations.value = [];

    const topCompetitor = currentRankings.value.length > 0 ? currentRankings.value[0] : { competitor: 'the competition', rank: 'N/A' };

    const systemPrompt = "You are an expert Google Ads strategist for Elite Sports Builders, a premier athletic court builder in Phoenix, Arizona. Your tone is professional, confident, and highlights quality and expertise. You are ASBA-certified. Provide your response as a JSON array of objects, where each object has 'headline1', 'headline2', and 'description' properties.";

    const userPrompt = `Analyze the SEO data for the keyword "${selectedKeyword.value}". Our top competitor, ${topCompetitor.competitor}, is rank #${topCompetitor.rank}. Generate 3 distinct Google Ad variations (Headline 1, Headline 2, Description) designed to capture clicks from high-intent customers. Emphasize our local Phoenix expertise and ASBA-certified quality to differentiate us.`;
    
    const apiKey = ""; 
    const apiUrl = `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash-preview-05-20:generateContent?key=${apiKey}`;

    const mockAds = [
        { headline1: "ASBA-Certified Court Builders", headline2: "Phoenix's Trusted Experts", description: "Get a free quote on your new tennis, pickleball, or basketball court. Built to last by Elite Sports Builders." },
        { headline1: "Elite Sports Court Construction", headline2: "Serving Arizona Since 2000", description: "Don't settle for less. We build championship-quality courts with superior materials. Contact us today!" },
        { headline1: "Pickleball Courts by The Pros", headline2: "Local Phoenix Installers", description: "Ready to play? Get a professional-grade pickleball court installed. Quality you can see and feel." }
    ];

    try {
        const response = await fetch(apiUrl, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                contents: [{ parts: [{ text: userPrompt }] }],
                systemInstruction: { parts: [{ text: systemPrompt }] }
            })
        });

        if (!response.ok) {
            if (response.status === 403) {
                 console.warn("AI Ad Strategist: API key is missing or invalid (403). Using mock data.");
                 adError.value = "Live AI is disabled. Showing examples.";
                 adVariations.value = mockAds;
            } else {
                throw new Error(`API call failed with status: ${response.status}`);
            }
        } else {
            const result = await response.json();
            const text = result.candidates?.[0]?.content?.parts?.[0]?.text;
            if (text) {
                // Clean the text to ensure it's valid JSON
                const cleanedText = text.replace(/```json|```/g, '').trim();
                adVariations.value = JSON.parse(cleanedText);
            } else {
                 throw new Error("No content found in API response.");
            }
        }
    } catch (error) {
        console.error("Error generating ads:", error);
        adError.value = "Failed to generate ads. Showing examples.";
        adVariations.value = mockAds;
    } finally {
        isLoadingAds.value = false;
    }
};

const renderLineChart = () => {
  if (!lineChartCanvas.value || !lineChartData.value || !lineChartData.value.datasets) return;
  if (seoLineChart) seoLineChart.destroy();
  const colors = ['#4f46e5', '#14B8A6', '#f59e0b', '#3b82f6', '#8b5cf6'];
  seoLineChart = new Chart(lineChartCanvas.value, {
    type: 'line',
    data: {
      labels: lineChartData.value.labels,
      datasets: lineChartData.value.datasets.map((ds: any, index: number) => ({
        label: ds.label,
        data: ds.data,
        borderColor: colors[index % colors.length],
        backgroundColor: colors[index % colors.length] + '1A',
        tension: 0.2,
        borderWidth: 2,
        pointBackgroundColor: colors[index % colors.length],
        pointRadius: 4,
        pointHoverRadius: 6,
      }))
    },
    options: {
      responsive: true,
      maintainAspectRatio: false,
      scales: {
        y: { reverse: true, beginAtZero: false, ticks: { stepSize: 1, callback: (value) => `#${value}` }, title: { display: true, text: 'Google Ranking' } },
        x: { title: { display: true, text: 'Month (2025)' } }
      },
      plugins: {
        legend: { position: 'bottom' },
        tooltip: { callbacks: { label: (context) => `${context.dataset.label}: Rank #${context.raw}` } }
      }
    }
  });
};

const renderPieChart = () => {
    if (!pieChartCanvas.value || !shareOfVoiceData.value) return;
    if (shareOfVoiceChart) shareOfVoiceChart.destroy();
    shareOfVoiceChart = new Chart(pieChartCanvas.value, {
        type: 'doughnut',
        data: shareOfVoiceData.value,
        options: {
            responsive: true,
            maintainAspectRatio: false,
            plugins: {
                legend: {
                    position: 'bottom',
                    labels: {
                        padding: 15,
                        boxWidth: 12,
                    }
                },
                tooltip: {
                    callbacks: {
                        label: (context) => ` ${context.label}: ${context.raw} Top-3 Rankings`
                    }
                }
            },
            cutout: '60%',
        }
    });
};


onMounted(() => {
  renderLineChart();
  renderPieChart();
  generateAds();
});

watch(selectedKeyword, () => {
  nextTick(() => {
    renderLineChart()
    generateAds();
  });
});
</script>

<template>
  <div class="p-4 sm:p-6 lg:p-8 bg-slate-100 h-full flex flex-col">
    <header class="mb-8">
      <h1 class="text-3xl font-bold text-slate-800">SEO & Ads Command Center</h1>
      <p class="text-slate-600 mt-1">Analyze competitor rankings and generate new ad strategies.</p>
    </header>

    <div class="grid grid-cols-1 lg:grid-cols-5 gap-6 flex-1 min-h-0">
      <!-- Left Column: Rankings & AI -->
      <div class="lg:col-span-2 space-y-6 flex flex-col">
        <div class="bg-white p-6 rounded-lg shadow-sm border border-slate-200 flex flex-col">
            <h2 class="text-xl font-bold text-slate-800 mb-4">Keyword Rankings</h2>
            
            <div class="mb-4">
                <label for="keyword-select" class="block text-sm font-medium text-slate-700 mb-1">Select Keyword:</label>
                <select id="keyword-select" v-model="selectedKeyword" class="w-full rounded-md border-slate-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm">
                    <option v-for="kw in seoData.keywords" :key="kw" :value="kw">{{ kw }}</option>
                </select>
            </div>

            <div class="flex-1 overflow-y-auto -mx-6 px-6">
                <table class="w-full text-sm">
                    <thead class="text-left text-xs text-slate-500 uppercase border-b border-slate-200 sticky top-0 bg-white">
                        <tr>
                            <th class="p-2 text-center">Rank</th>
                            <th class="p-2">Company</th>
                            <th class="p-2 text-center">Change</th>
                        </tr>
                    </thead>
                    <tbody>
                        <tr v-for="seo in currentRankings" :key="seo.competitor" class="border-b border-slate-100 last:border-b-0">
                            <td class="p-2 text-center font-bold text-lg" :class="{'text-indigo-600': seo.rank <= 3}">{{ seo.rank }}</td>
                            <td class="p-2 font-medium text-slate-700">
                                <a :href="seo.url" target="_blank" class="hover:underline hover:text-indigo-600">{{ seo.competitor }}</a>
                            </td>
                            <td class="p-2 text-center font-semibold flex items-center justify-center" :class="{'text-green-600': seo.change > 0, 'text-red-600': seo.change < 0, 'text-slate-400': seo.change === 0}">
                                <ArrowUp v-if="seo.change > 0" class="w-4 h-4 mr-1"/><ArrowDown v-if="seo.change < 0" class="w-4 h-4 mr-1"/><Minus v-if="seo.change === 0" class="w-4 h-4 mr-1"/>
                                <span>{{ seo.change !== 0 ? Math.abs(seo.change) : '' }}</span>
                            </td>
                        </tr>
                    </tbody>
                </table>
            </div>
        </div>

        <div class="bg-white p-6 rounded-lg shadow-sm border border-slate-200">
            <h2 class="text-xl font-bold text-slate-800 mb-4 flex items-center">
                <Sparkles class="w-5 h-5 mr-3 text-indigo-500" />
                AI Ad Strategist
            </h2>
            <div v-if="isLoadingAds" class="flex items-center justify-center h-48">
                <svg class="animate-spin h-8 w-8 text-indigo-600" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                    <circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4"></circle>
                    <path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                </svg>
            </div>
            <div v-else class="space-y-4">
                 <p v-if="adError" class="text-xs text-center font-semibold text-amber-700 bg-amber-100 p-2 rounded-md">{{ adError }}</p>
                <div v-for="(ad, index) in adVariations" :key="index" class="p-4 bg-slate-50 border border-slate-200 rounded-lg">
                    <p class="font-semibold text-blue-700 text-lg">
                        {{ ad.headline1 }} <span class="text-slate-400">|</span> {{ ad.headline2 }}
                    </p>
                    <p class="text-sm text-slate-600 mt-1">{{ ad.description }}</p>
                </div>
            </div>
        </div>
      </div>
      
      <!-- Right Column: Charts & Opportunities -->
      <div class="lg:col-span-3 space-y-6 flex flex-col min-h-0">
          <div class="bg-white p-6 rounded-lg shadow-sm border border-slate-200 flex-1 flex flex-col">
              <h2 class="text-xl font-bold text-slate-800 mb-4">Historical Rankings for "{{ selectedKeyword }}"</h2>
              <div class="relative flex-1 min-h-[250px]"><canvas ref="lineChartCanvas"></canvas></div>
          </div>
          <div class="bg-white p-6 rounded-lg shadow-sm border border-slate-200 flex-1 flex flex-col">
            <div class="grid grid-cols-2 gap-6 h-full">
                <div>
                    <h2 class="text-xl font-bold text-slate-800 mb-4 flex items-center">
                        <PieChart class="w-5 h-5 mr-3 text-slate-500" />
                        Share of Voice (Top 3)
                    </h2>
                    <div class="relative h-[250px]"><canvas ref="pieChartCanvas"></canvas></div>
                </div>
                <div class="flex flex-col">
                    <h2 class="text-xl font-bold text-slate-800 mb-4 flex items-center">
                        <Lightbulb class="w-5 h-5 mr-3 text-amber-500" />
                        Opportunities
                    </h2>
                    <div class="space-y-3 overflow-y-auto pr-2">
                        <div v-if="keywordOpportunities.length === 0" class="text-center p-4 text-sm text-slate-500">
                            <p>No immediate opportunities found. Competitors have strong rankings.</p>
                        </div>
                         <button v-for="(opp, index) in keywordOpportunities" :key="index" @click="handleOpportunityClick(opp.keyword)"
                            class="w-full text-left p-3 rounded-lg border transition-colors hover:bg-slate-100 hover:border-indigo-400">
                            <div class="flex items-center mb-1">
                                <Lightbulb v-if="opp.type === 'lowHangingFruit'" class="w-5 h-5 mr-3 text-amber-500 flex-shrink-0" />
                                <Crosshair v-if="opp.type === 'weakCompetitor'" class="w-5 h-5 mr-3 text-red-500 flex-shrink-0" />
                                <span class="font-semibold text-slate-700 truncate" :title="opp.keyword">{{ opp.keyword }}</span>
                            </div>
                            <p class="text-xs text-slate-500 pl-8">{{ opp.summary }}</p>
                        </button>
                    </div>
                </div>
            </div>
          </div>
      </div>
    </div>
  </div>
</template>

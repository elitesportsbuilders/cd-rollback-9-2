<template>
    <div class="container mx-auto p-4 sm:p-6 lg:p-8">
      <!-- Header -->
      <header class="mb-8">
        <h1 class="text-3xl font-bold text-white">Competitor Intelligence Dashboard</h1>
        <p class="text-slate-400">Last Updated: <span id="last-updated"></span></p>
      </header>
  
      <!-- Main Grid Layout -->
      <div class="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-4 gap-6">
        <!-- Column 1: Competitor Selection & Quick View -->
        <div class="lg:col-span-1 md:col-span-1 bg-slate-800 p-6 rounded-lg shadow-lg">
          <h2 class="text-xl font-semibold text-white mb-4">Competitor Quick View</h2>
          <select id="competitor-select" class="w-full p-2 bg-slate-700 text-white rounded-md mb-4 focus:ring-2 focus:ring-sky-500 focus:outline-none">
            <!-- Options will be populated by JS -->
          </select>
          <div id="quick-view-content">
            <!-- Content will be populated by JS -->
          </div>
        </div>
  
        <!-- Column 2: News Feed & Project Tracker -->
        <div class="lg:col-span-2 md:col-span-2 space-y-6">
          <!-- Real-Time News & Social Media Feed -->
          <div class="bg-slate-800 p-6 rounded-lg shadow-lg">
            <h2 class="text-xl font-semibold text-white mb-4">Real-Time News & Social Media Feed</h2>
            <div id="news-feed-content" class="space-y-4 max-h-96 overflow-y-auto pr-2">
              <!-- News items will be populated by JS -->
            </div>
          </div>
  
          <!-- Competitor Project Tracker -->
          <div class="bg-slate-800 p-6 rounded-lg shadow-lg">
            <h2 class="text-xl font-semibold text-white mb-4">Competitor Project Tracker (ASBA Region)</h2>
            <div class="overflow-x-auto">
              <table class="w-full text-left">
                <thead class="border-b border-slate-600">
                  <tr>
                    <th class="p-2">Competitor</th>
                    <th class="p-2">Project Name</th>
                    <th class="p-2">Status</th>
                    <th class="p-2">Bid (est.)</th>
                  </tr>
                </thead>
                <tbody id="project-tracker-body">
                  <!-- Project rows will be populated by JS -->
                </tbody>
              </table>
            </div>
          </div>
        </div>
  
        <!-- Column 3: SWOT & Market Share -->
        <div class="lg:col-span-1 md:col-span-3 space-y-6">
          <!-- Dynamic SWOT Analysis -->
          <div class="bg-slate-800 p-6 rounded-lg shadow-lg">
            <h2 class="text-xl font-semibold text-white mb-4">Dynamic SWOT Analysis</h2>
            <div id="swot-analysis-content" class="grid grid-cols-2 gap-4 text-sm">
              <!-- SWOT content will be populated by JS -->
            </div>
          </div>
          <!-- Market Share & Service Trends -->
          <div class="bg-slate-800 p-6 rounded-lg shadow-lg">
            <h2 class="text-xl font-semibold text-white mb-4">Market Share (AZ)</h2>
            <div class="chart-container">
              <canvas id="marketShareChart"></canvas>
            </div>
          </div>
        </div>
      </div>
    </div>
  </template>
  
  <script setup lang="ts">
  import { onMounted } from 'vue';
  
  // --- TYPE DEFINITIONS ---
  interface Swot {
    strengths: string[];
    weaknesses: string[];
    opportunities: string[];
    threats: string[];
  }
  
  interface Competitor {
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
  // TODO: Replace this with data fetched from Firebase Data Connect
  const competitorsData: Record<string, Competitor> = {
    'compA': {
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
    'compB': {
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
    'compC': {
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
  };
  
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
  
  // --- GEMINI API INTEGRATION (EXAMPLE) ---
  async function getSentimentFromGemini(text: string): Promise<string> {
    console.log(`Analyzing sentiment for: "${text}"`);
    // This function remains the same as in the HTML mockup.
    // It simulates a call to the Gemini API.
    const sentiments = ['positive', 'negative', 'neutral'];
    return new Promise(resolve => setTimeout(() => resolve(sentiments[Math.floor(Math.random() * 3)]), 500));
  }
  
  // --- RENDERING FUNCTIONS ---
  // These functions directly manipulate the DOM. In a more complex Vue app,
  // you might use refs and computed properties, but for a direct port, this is fine.
  
  function renderQuickView(competitorId: string) {
    const competitor = competitorsData[competitorId];
    const contentEl = document.getElementById('quick-view-content');
    if (!contentEl || !competitor) return;
    
    contentEl.innerHTML = `
      <div class="space-y-3">
        <div>
          <h3 class="font-semibold text-white">${competitor.name}</h3>
          <p class="text-sm text-slate-400">${competitor.summary}</p>
        </div>
        <div>
          <h4 class="font-semibold text-white text-sm">Key Contact</h4>
          <p class="text-sm text-slate-400">${competitor.keyContact}</p>
        </div>
        <div>
          <h4 class="font-semibold text-white text-sm">Recent News Sentiment</h4>
          <p class="text-sm text-slate-400 flex items-center" id="sentiment-indicator">
            <span class="mr-2 h-3 w-3 rounded-full bg-yellow-400"></span>Loading...
          </p>
        </div>
      </div>
    `;
  
    getSentimentFromGemini(`Overall sentiment for ${competitor.name}`).then(sentiment => {
      const indicator = document.getElementById('sentiment-indicator');
      if (!indicator) return;
      const colors = { positive: 'bg-green-400', negative: 'bg-red-400', neutral: 'bg-yellow-400' };
      const text = { positive: '😊 Positive', negative: '😞 Negative', neutral: '😐 Neutral' };
      indicator.innerHTML = `<span class="mr-2 h-3 w-3 rounded-full ${colors[sentiment]}"></span>${text[sentiment]}`;
    });
  }
  
  function renderNewsFeed() {
    const contentEl = document.getElementById('news-feed-content');
    if(!contentEl) return;
    const sentimentIcons = {
      positive: `<i data-lucide="trending-up" class="text-green-400"></i>`,
      negative: `<i data-lucide="trending-down" class="text-red-400"></i>`,
      neutral: `<i data-lucide="minus" class="text-yellow-400"></i>`,
    };
  
    contentEl.innerHTML = newsFeedData.map(item => `
      <div class="flex items-start space-x-3 text-sm p-2 bg-slate-700/50 rounded-md">
        <div class="flex-shrink-0 w-4 h-4">${sentimentIcons[item.sentiment]}</div>
        <div>
          <span class="font-semibold text-sky-400">[${item.source}]</span>
          <p class="text-slate-300">${item.text}</p>
        </div>
      </div>
    `).join('');
    
    // @ts-ignore - lucide is globally available from the CDN script
    lucide.createIcons();
  }
  
  function renderProjectTracker() {
    const bodyEl = document.getElementById('project-tracker-body');
    if(!bodyEl) return;
    const statusColors = {
      'In Progress': 'text-yellow-400',
      'Complete': 'text-green-400',
      'Bid Lost': 'text-red-400',
      'Bidding': 'text-sky-400'
    };
    bodyEl.innerHTML = projectTrackerData.map(p => `
      <tr class="border-b border-slate-700 hover:bg-slate-700/50">
        <td class="p-2">${p.competitor}</td>
        <td class="p-2">${p.project}</td>
        <td class="p-2 font-semibold ${statusColors[p.status] || ''}">${p.status}</td>
        <td class="p-2">$${p.bid.toLocaleString()}</td>
      </tr>
    `).join('');
  }
  
  function renderSwotAnalysis(competitorId: string) {
    const competitor = competitorsData[competitorId];
    const contentEl = document.getElementById('swot-analysis-content');
    if (!contentEl || !competitor) return;
  
    const { strengths, weaknesses, opportunities, threats } = competitor.swot;
    contentEl.innerHTML = `
      <div>
        <h4 class="font-bold text-green-400 mb-1">Strengths</h4>
        <ul class="list-disc list-inside text-slate-400">${strengths.map(s => `<li>${s}</li>`).join('')}</ul>
      </div>
      <div>
        <h4 class="font-bold text-red-400 mb-1">Weaknesses</h4>
        <ul class="list-disc list-inside text-slate-400">${weaknesses.map(w => `<li>${w}</li>`).join('')}</ul>
      </div>
      <div>
        <h4 class="font-bold text-sky-400 mb-1">Opportunities</h4>
        <ul class="list-disc list-inside text-slate-400">${opportunities.map(o => `<li>${o}</li>`).join('')}</ul>
      </div>
      <div>
        <h4 class="font-bold text-orange-400 mb-1">Threats</h4>
        <ul class="list-disc list-inside text-slate-400">${threats.map(t => `<li>${t}</li>`).join('')}</ul>
      </div>
    `;
  }
  
  function renderCharts() {
      const canvas = document.getElementById('marketShareChart') as HTMLCanvasElement;
      if (!canvas) return;
      const ctx = canvas.getContext('2d');
      if (!ctx) return;
  
      // @ts-ignore - Chart is globally available from the CDN script
      new Chart(ctx, {
          type: 'doughnut',
          data: {
              labels: ['Elite Sports Builders', 'Competitor A', 'Competitor B', 'Competitor C', 'Other'],
              datasets: [{
                  label: 'Market Share in AZ',
                  data: [40, 25, 15, 15, 5],
                  backgroundColor: [
                      'rgba(34, 211, 238, 0.7)',
                      'rgba(250, 204, 21, 0.7)',
                      'rgba(249, 115, 22, 0.7)',
                      'rgba(239, 68, 68, 0.7)',
                      'rgba(107, 114, 128, 0.7)'
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
                      labels: { color: '#cbd5e1' }
                  }
              }
          }
      });
  }
  
  // --- INITIALIZATION ---
  onMounted(() => {
    const updatedEl = document.getElementById('last-updated');
    if (updatedEl) {
        updatedEl.innerText = new Date().toLocaleString();
    }
  
    const selectEl = document.getElementById('competitor-select') as HTMLSelectElement;
    if (selectEl) {
        Object.keys(competitorsData).forEach(key => {
          const option = document.createElement('option');
          option.value = key;
          option.innerText = competitorsData[key].name;
          selectEl.appendChild(option);
        });
  
        const initialCompetitor = 'compA';
        selectEl.value = initialCompetitor;
  
        renderQuickView(initialCompetitor);
        renderNewsFeed();
        renderProjectTracker();
        renderSwotAnalysis(initialCompetitor);
        renderCharts();
  
        selectEl.addEventListener('change', (e) => {
          const selectedCompetitorId = (e.target as HTMLSelectElement).value;
          renderQuickView(selectedCompetitorId);
          renderSwotAnalysis(selectedCompetitorId);
        });
    }
  });
  
  </script>
  
  <style>
    .chart-container {
      position: relative;
      height: 300px;
      width: 100%;
    }
  </style>
  
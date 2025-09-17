<script setup lang="ts">
import { ref, watch, nextTick } from 'vue';
import { type CourtData, type ResidentialProspectData, type AiLeadData } from '@/data';
import PrimaryButton from '@/components/PrimaryButton.vue';

const props = defineProps<{
  prospectId?: number,
  reportTemplate?: string,
  prospects: (CourtData | ResidentialProspectData | AiLeadData)[],
  leads: AiLeadData[]
}>();

const template = ref('Court Condition Report');
const selectedId = ref<string>('1'); // Ensure selectedId is always a string
const selectedProspectId = ref<string | null>(null);
const reportContent = ref<any>(null);

// Watch for incoming props to automatically generate a report.
// This replaces onMounted to handle navigation back to this component with new params.
watch(() => [props.reportTemplate, props.prospectId], ([newReportTemplate, newProspectId]) => {
    if (newReportTemplate === 'Residential Prospect Report' && newProspectId) {
        template.value = 'Residential Prospect Report';
        selectedProspectId.value = newProspectId.toString();
        const residentialProspects = props.prospects.filter(p => p.type === 'residential') as ResidentialProspectData[];
        if (!residentialProspects.find(p => p.id.toString() === selectedProspectId.value)) {
            selectedProspectId.value = residentialProspects[0]?.id.toString() || null;
        }
        handleGeneratePreview();
    } else if (newReportTemplate) { // If a reportTemplate is passed without prospectId
        template.value = newReportTemplate;
        handleGeneratePreview(); // Trigger generation for the new template
    } else { // Default initial state
      // Ensure default values are set for initial render if no props passed
      template.value = 'Court Condition Report';
      selectedId.value = (props.prospects.find(p => p.type !== 'residential' && p.type !== 'permit' && p.type !== 'news') as CourtData)?.id.toString() || '1';
      selectedProspectId.value = (props.prospects.find(p => p.type === 'residential') as ResidentialProspectData)?.id.toString() || null;
      handleGeneratePreview(); // Generate initial preview
    }
}, { immediate: true });


watch(template, (newTemplate) => {
  if (newTemplate === 'Court Condition Report') {
    selectedId.value = (props.prospects.find(p => p.type !== 'residential' && p.type !== 'permit' && p.type !== 'news') as CourtData)?.id.toString() || '1';
    selectedProspectId.value = null;
  } else if (newTemplate === 'Residential Prospect Report') {
    selectedId.value = '';
    selectedProspectId.value = (props.prospects.find(p => p.type === 'residential') as ResidentialProspectData)?.id.toString() || null;
  } else { // For 'New Leads Summary' or 'Client Portfolio Review'
    selectedId.value = '';
    selectedProspectId.value = null;
  }
  reportContent.value = null; // Clear content on template change
  nextTick(() => { // Generate new preview after template/id states are updated
    handleGeneratePreview();
  });
});

const handleGeneratePreview = () => {
  if (template.value === 'Court Condition Report') {
    const court = props.prospects.find(p => p.id.toString() === selectedId.value) as CourtData;
    if (court) {
      reportContent.value = { type: 'court', data: court, title: 'Court Condition Report' };
    } else {
      reportContent.value = { type: 'error', message: 'Court not found for this report.' };
    }
  } else if (template.value === 'New Leads Summary') {
    reportContent.value = { type: 'leads', data: props.leads, title: 'New Leads Summary' };
  } else if (template.value === 'Residential Prospect Report') {
      const residentialProspects = props.prospects.filter(p => p.type === 'residential') as ResidentialProspectData[];
      const prospect = residentialProspects.find(p => p.id.toString() === selectedProspectId.value);
      if (prospect) {
          reportContent.value = { type: 'residential', data: prospect, title: 'Residential Prospect Report' };
      } else {
        reportContent.value = { type: 'error', message: 'Residential prospect not found for this report.' };
      }
  } else if (template.value === 'Client Portfolio Review') {
    // Assuming you have CLIENT_PORTFOLIO_DATA
    reportContent.value = { type: 'portfolio', data: [], title: 'Client Portfolio Review' }; // Placeholder
  }
  else {
    reportContent.value = null;
  }

  if (reportContent.value) {
  }
};

const getStatusColor = (status: string) => status === 'faded' || status === 'worn' ? 'red' : 'green';
</script>

<template>
    <div class="flex flex-col">
        <div class="p-6 md:p-8">
            <header class="mb-8">
                <h2 class="text-3xl font-extrabold text-slate-800">Reports</h2>
                <p class="text-slate-500 mt-1">Generate and export professional documents for your business.</p>
            </header>
        </div>

        <div class="flex flex-col md:flex-row">
            <aside class="w-full md:w-1/3 bg-white p-6 border-b md:border-b-0 md:border-r border-slate-200">
                <h3 class="text-xl font-bold text-slate-700 mb-4">Report Generator</h3>

                <div>
                    <label for="report-template" class="block text-sm font-medium text-slate-600 mb-1">1. Select a Template</label>
                    <select id="report-template" v-model="template" class="block w-full px-3 py-2 bg-white border border-slate-300 rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500">
                        <option>Court Condition Report</option>
                        <option>New Leads Summary</option>
                        <option>Residential Prospect Report</option>
                        <option>Client Portfolio Review</option>
                    </select>
                </div>

                <div class="mt-6">
                    <p class="block text-sm font-medium text-slate-600 mb-2">2. Customize Data</p>
                    <div class="space-y-4">
                        <div v-if="template === 'Court Condition Report'">
                            <label for="report-target" class="block text-xs font-medium text-slate-500">Target Court/Client</label>
                            <select id="report-target" v-model="selectedId" class="mt-1 block w-full px-3 py-2 bg-white border border-slate-300 rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500">
                                <option v-for="court in prospects.filter(p => p.type !== 'residential' && p.type !== 'permit' && p.type !== 'news')" :key="court.id" :value="court.id.toString()">{{ court.name }}</option>
                            </select>
                        </div>
                        <div v-else-if="template === 'New Leads Summary'">
                            <label for="date-range" class="block text-xs font-medium text-slate-500">Date Range</label>
                            <select id="date-range" class="mt-1 block w-full px-3 py-2 bg-white border border-slate-300 rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500">
                                <option>All Time</option>
                            </select>
                        </div>
                         <div v-else-if="template === 'Residential Prospect Report'">
                            <label for="report-target-residential" class="block text-xs font-medium text-slate-500">Target Prospect</label>
                            <select id="report-target-residential" v-model="selectedProspectId" class="mt-1 block w-full px-3 py-2 bg-white border border-slate-300 rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500">
                                <option v-for="prospect in prospects.filter(p => p.type === 'residential')" :key="prospect.id" :value="prospect.id.toString()">{{ (prospect as ResidentialProspectData).homeowner }} - {{ (prospect as ResidentialProspectData).address }}</option>
                            </select>
                        </div>
                    </div>
                </div>

                <div class="mt-8">
                     <PrimaryButton
                        class="w-full"
                        label="Generate Preview"
                        icon="refresh-cw"
                        @click="handleGeneratePreview"
                     />
                </div>
            </aside>

            <section class="flex-1 bg-slate-200 p-6">
                <div class="flex justify-between items-center mb-4">
                    <h3 class="text-xl font-bold text-slate-700">Preview</h3>
                     <button class="px-4 py-2 bg-slate-700 text-white font-semibold rounded-lg shadow-sm hover:bg-slate-800 flex items-center text-sm disabled:bg-slate-400 disabled:cursor-not-allowed" :disabled="!reportContent || reportContent.type === 'error'">
                        <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="w-4 h-4 mr-2"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/><polyline points="7 10 12 15 17 10"/><line x1="12" x2="12" y1="15" y2="3"/></svg>Download as PDF
                    </button>
                </div>

                <div v-if="!reportContent" class="flex items-center justify-center h-full text-slate-500 bg-slate-200 p-6">
                    <div class="text-center">
                        <i data-lucide="file-search" class="w-16 h-16 mx-auto text-slate-400"></i>
                        <p class="mt-4">Select a template and click "Generate Preview" to see your report.</p>
                    </div>
                </div>

                <div v-else class="bg-white p-8 rounded-lg shadow-lg max-w-4xl mx-auto animate-fade-in-up">
                    <div v-if="reportContent.type === 'error'" class="text-center text-red-500 p-4">
                      <p class="font-semibold">Error Generating Report:</p>
                      <p>{{ reportContent.message }}</p>
                    </div>
                    <div v-else>
                      <div class="flex justify-between items-start pb-4 border-b border-slate-200">
                          <div>
                              <h1 class="text-2xl font-bold text-slate-800">{{ reportContent.title }}</h1>
                              <p class="text-slate-500">
                                  <template v-if="reportContent.type === 'court'">{{ reportContent.data.name }}</template>
                                  <template v-if="reportContent.type === 'leads'">Summary of all {{ reportContent.data.length }} detected leads</template>
                                  <template v-if="reportContent.type === 'residential'">{{ reportContent.data.homeowner }} - {{ reportContent.data.address }}</template>
                              </p>
                          </div>
                          <div class="text-right flex-shrink-0">
                              <img src="https://picsum.photos/seed/esblogo/120/40" alt="Elite Sports Builders Logo" class="mb-2 ml-auto" />
                              <p class="text-xs text-slate-600">Generated: {{ new Date().toLocaleDateString() }}</p>
                          </div>
                      </div>

                      <div v-if="reportContent.type === 'court'" class="mt-6">
                          <h4 class="font-bold text-slate-700 mb-2 flex items-center"><i data-lucide="activity" class="w-5 h-5 mr-2 text-slate-500"></i>Current Status</h4>
                          <div class="p-4 rounded-lg" :class="['bg-' + getStatusColor(reportContent.data.status) + '-50', 'border', 'border-' + getStatusColor(reportContent.data.status) + '-200', 'text-' + getStatusColor(reportContent.data.status) + '-800']">
                              <p class="font-semibold capitalize">Status: {{ reportContent.data.status }}</p>
                              <ul v-if="reportContent.data.conditions && reportContent.data.conditions.length > 0" class="list-disc list-inside text-sm mt-2">
                                  <li v-for="(cond, i) in reportContent.data.conditions" :key="cond + '-' + i">{{ cond }}</li>
                              </ul>
                          </div>
                          <h4 class="font-bold text-slate-700 mt-6 mb-2 flex items-center"><i data-lucide="list-dashes" class="w-5 h-5 mr-2 text-slate-500"></i>Details</h4>
                          <ul class="text-sm text-slate-600 space-y-1">
                              <li><strong>Type:</strong> {{ reportContent.data.type }}</li>
                              <li><strong>Location:</strong> [{{ reportContent.data.coords.join(', ') }}]</li>
                              <li><strong>Client Status:</strong> {{ reportContent.data.isClient ? ('Client' + (reportContent.data.isDue ? ' (Service Due)' : '')) : 'Prospect' }}</li>
                          </ul>
                          <h4 class="font-bold text-slate-700 mt-6 mb-2 flex items-center"><i data-lucide="lightbulb" class="w-5 h-5 mr-2 text-slate-500"></i>Recommendations</h4>
                          <p class="text-sm text-slate-600">
                              <template v-if="reportContent.data.status === 'faded'">
                                  Based on the observed conditions ({{ (reportContent.data.conditions || []).join(', ') }}), a full evaluation is recommended to determine the scope of necessary repairs prior to resurfacing.
                              </template>
                              <template v-else>
                                  The court appears to be in good condition. Recommend a follow-up inspection in 12-18 months.
                              </template>
                          </p>
                      </div>

                      <div v-if="reportContent.type === 'leads'" class="mt-6 overflow-x-auto">
                          <table class="min-w-full divide-y divide-slate-200">
                              <thead class="bg-slate-50">
                                  <tr>
                                      <th class="px-4 py-2 text-left text-xs font-medium text-slate-500 uppercase tracking-wider">Lead Name</th>
                                      <th class="px-4 py-2 text-left text-xs font-medium text-slate-500 uppercase tracking-wider">Type</th>
                                      <th class="px-4 py-2 text-left text-xs font-medium text-slate-500 uppercase tracking-wider">AI Score</th>
                                      <th class="px-4 py-2 text-left text-xs font-medium text-slate-500 uppercase tracking-wider">Summary</th>
                                  </tr>
                              </thead>
                              <tbody class="bg-white divide-y divide-slate-200">
                                  <tr v-for="lead in reportContent.data" :key="lead.id">
                                      <td class="px-4 py-3 whitespace-nowrap text-sm font-medium text-slate-900">{{ lead.name }}</td>
                                      <td class="px-4 py-3 whitespace-nowrap text-sm text-slate-600 capitalize">{{ lead.type }}</td>
                                      <td class="px-4 py-3 whitespace-nowrap text-sm text-slate-600 font-bold">{{ lead.aiScore }}/10</td>
                                      <td class="px-4 py-3 text-sm text-slate-600 max-w-xs truncate" :title="lead.aiSummary">{{ lead.aiSummary }}</td>
                                  </tr>
                              </tbody>
                          </table>
                      </div>

                      <div v-if="reportContent.type === 'residential'" class="mt-6 space-y-6">
                          <div>
                              <h4 class="font-bold text-slate-700 mb-2 flex items-center"><i data-lucide="user-check" class="w-5 h-5 mr-2 text-slate-500"></i>Prospect Details</h4>
                              <ul class="text-sm text-slate-600 space-y-1 bg-slate-50 p-4 rounded-lg border border-slate-200">
                                  <li><strong>Homeowner:</strong> {{ reportContent.data.homeowner }}</li>
                                  <li><strong>Address:</strong> {{ reportContent.data.address }}</li>
                                  <li><strong>Court Type:</strong> {{ reportContent.data.courtType }}</li>
                              </ul>
                          </div>

                          <div>
                              <h4 class="font-bold text-slate-700 mb-2 flex items-center"><i data-lucide="activity" class="w-5 h-5 mr-2 text-slate-500"></i>AI-Assessed Condition</h4>
                              <div class="p-4 rounded-lg" :class="['bg-' + (reportContent.data.status === 'worn' ? 'amber' : 'green') + '-50', 'border', 'border-' + (reportContent.data.status === 'worn' ? 'amber' : 'green') + '-200', 'text-' + (reportContent.data.status === 'worn' ? 'amber' : 'green') + '-800']">
                                  <p class="font-semibold capitalize">Condition Score: {{ reportContent.data.conditionScore }} / 10</p>
                                  <p class="text-sm mt-2 italic">"{{ reportContent.data.aiSummary }}"</p>
                              </div>
                          </div>

                          <div>
                              <h4 class="font-bold text-slate-700 mb-2 flex items-center"><i data-lucide="lightbulb" class="w-5 h-5 mr-2 text-slate-500"></i>Recommended Action</h4>
                              <p class="text-sm text-slate-600 p-4 bg-slate-50 rounded-lg border border-slate-200">
                                  Based on the analysis, this prospect represents a
                                  <strong v-if="reportContent.data.status === 'worn'">strong</strong>
                                  <strong v-else>potential future</strong>
                                  opportunity for resurfacing or maintenance services. An outreach email is recommended to initiate contact and offer a complimentary on-site evaluation.
                              </p>
                          </div>
                      </div>

                      <div class="mt-8 pt-4 border-t border-slate-200 text-center text-xs text-slate-500">
                          <p>Report generated by Court Detector for Elite Sports Builders</p>
                          <p>1622 N Black Canyon Hwy, Suite 200, Phoenix, AZ, 85009 | (602) 989-9648</p>
                      </div>
                    </div>
                </div>
            </section>
        </div>
    </div>
</template>

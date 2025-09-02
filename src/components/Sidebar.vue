<script setup lang="ts">
import { View } from '@/types';

const props = defineProps<{
  currentView: string;
  isOpen: boolean;
}>();

const emit = defineEmits(['setCurrentView']);

const navItems = [
  { view: View.Dashboard, label: 'Dashboard', icon: 'layout-dashboard' },
  { view: View.LeadIntelligence, label: 'Lead Intelligence', icon: 'brain-circuit' },
  { view: View.CompetitorIntel, label: 'Competitor Intel', icon: 'swords' },
  { view: View.MyIntel, label: 'My Intel', icon: 'lightbulb' },
  { view: View.ResidentialProspecting, label: 'Residential Prospecting', icon: 'home' },
  { view: View.InteractiveMap, label: 'Interactive Map', icon: 'map' },
  { view: View.Reports, label: 'Reports', icon: 'file-text' },
  { view: View.AiInspection, label: 'AI Inspection', icon: 'scan-line' },
  { view: View.Settings, label: 'Settings', icon: 'settings' },
  { view: View.Integrations, label: 'Integrations', icon: 'plug-zap' },
];

const getLinkClass = (view: string) => {
  const baseClass = "flex items-center px-3 py-2 text-slate-300 hover:bg-slate-700 rounded-md font-medium text-left w-full";
  if (view === props.currentView) {
    return `${baseClass} bg-indigo-600 text-white`;
  }
  return baseClass;
};
</script>

<template>
    <aside 
        :class="[
            'w-64 bg-slate-800 text-slate-200 flex flex-col flex-shrink-0 transition-transform duration-300 ease-in-out z-30',
            'fixed inset-y-0 left-0 md:relative md:translate-x-0',
            isOpen ? 'translate-x-0' : '-translate-x-full'
        ]"
    >
      <div class="p-4 border-b border-slate-700 flex items-center">
        <img src="data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='24' height='24' viewBox='0 0 24 24' fill='none' stroke='%234f46e5' stroke-width='2' stroke-linecap='round' stroke-linejoin='round' class='lucide lucide-radar'%3E%3Cpath d='M19.07 4.93A10 10 0 0 0 6.99 3.34'/%3E%3Cpath d='M4 6h.01'/%3E%3Cpath d='M2.29 9.62A10 10 0 0 0 3.34 17.01'/%3E%3Cpath d='M6 20h.01'/%3E%3Cpath d='M9.62 21.71A10 10 0 0 0 17.01 20.66'/%3E%3Cpath d='M20 18h-.01'/%3E%3Cpath d='M21.71 14.38A10 10 0 0 0 20.66 6.99'/%3E%3Cpath d='M12 12v.01'/%3E%3Cpath d='M12 2a10 10 0 0 0-9.54 13.54'/%3E%3Cpath d='M12 12a5 5 0 1 0 5 5'/%3E%3Cpath d='M12 12a5 5 0 1 0-5-5'/%3E%3C/svg%3E" alt="Court Detector Logo" class="w-8 h-8 mr-3" />
        <h1 class="text-xl font-bold">Court Detector</h1>
      </div>
      <nav class="flex-grow p-4 space-y-2">
        <button
          v-for="item in navItems"
          :key="item.view"
          :class="getLinkClass(item.view)"
          @click="emit('setCurrentView', item.view)"
        >
          <i :data-lucide="item.icon" class="w-5 h-5 mr-3"></i>
          {{ item.label }}
        </button>
      </nav>
      <div class="p-4 border-t border-slate-700">
          <button class="flex items-center px-3 py-2 text-slate-300 hover:bg-slate-700 rounded-md font-medium w-full">
              <i data-lucide="log-out" class="w-5 h-5 mr-3"></i>Logout
          </button>
      </div>
    </aside>
</template>

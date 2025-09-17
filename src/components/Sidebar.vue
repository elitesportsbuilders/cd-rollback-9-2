<script setup lang="ts">
import {
  LayoutDashboard,
  Lightbulb,
  Target,
  Users,
  Map,
  Settings,
  ShieldCheck,
  Zap,
  TestTube2,
  PieChart,
  FolderKanban
} from 'lucide-vue-next';
import { View } from '@/types';

defineProps<{
  currentView: string;
  isOpen: boolean;
  currentViewProps: object;
}>();

const emit = defineEmits(['setCurrentView']);

const mainNavItems = [
  { view: View.Dashboard, icon: LayoutDashboard, label: 'Dashboard' },
  { view: View.LeadIntelligence, icon: Lightbulb, label: 'Lead Intelligence' },
  { view: View.CompetitorIntel, icon: Target, label: 'Competitor Intel' },
  { view: View.ProjectHub, icon: FolderKanban, label: 'Project Hub' },
  { view: View.ResidentialProspecting, icon: Users, label: 'Residential Prospecting' },
  { view: View.InteractiveMap, icon: Map, label: 'Interactive Map' },
  { view: View.SeoDashboard, icon: PieChart, label: 'SEO & Ads', highlight: true },
];

const secondaryNavItems = [
    { view: View.AiInspection, icon: Zap, label: 'AI Inspection' },
    { view: View.Integrations, icon: TestTube2, label: 'Integrations'},
    { view: View.Settings, icon: Settings, label: 'Settings' },
];

const handleNavigation = (view: View) => {
  emit('setCurrentView', view);
};
</script>

<template>
  <aside
    :class="[
      'fixed inset-y-0 left-0 bg-slate-800 text-white flex-col z-30 transition-transform duration-300 ease-in-out md:relative md:translate-x-0',
      isOpen ? 'translate-x-0' : '-translate-x-full'
    ]"
    class="w-64 flex"
  >
    <div class="flex flex-col w-full">
      <div class="flex items-center justify-center p-4 border-b border-slate-700 h-16">
        <ShieldCheck class="w-8 h-8 mr-2 text-indigo-400" />
        <h1 class="text-xl font-bold whitespace-nowrap">Court Detector</h1>
      </div>
      <nav class="flex-1 px-2 py-4 space-y-1">
        <a
          v-for="item in mainNavItems"
          :key="item.view"
          @click="handleNavigation(item.view)"
          :class="[
            'flex items-center px-3 py-2.5 text-sm font-medium rounded-md cursor-pointer transition-colors',
            currentView === item.view ? 'bg-slate-900 text-white' : 'text-slate-300 hover:bg-slate-700 hover:text-white'
          ]"
        >
          <component :is="item.icon" class="w-5 h-5 mr-3" :class="{ 'text-indigo-400': item.highlight }" />
          <span>{{ item.label }}</span>
          <span v-if="item.highlight" class="ml-auto bg-indigo-500 text-white text-xs font-semibold px-2 py-0.5 rounded-full">
            AI
          </span>
        </a>
      </nav>
      <div class="px-2 py-4 mt-auto border-t border-slate-700">
         <nav class="space-y-1">
            <a
            v-for="item in secondaryNavItems"
            :key="item.view"
            @click="handleNavigation(item.view)"
            :class="[
                'flex items-center px-3 py-2.5 text-sm font-medium rounded-md cursor-pointer transition-colors',
                currentView === item.view ? 'bg-slate-900 text-white' : 'text-slate-300 hover:bg-slate-700 hover:text-white'
            ]"
            >
            <component :is="item.icon" class="w-5 h-5 mr-3" />
            <span>{{ item.label }}</span>
            </a>
        </nav>
      </div>
    </div>
  </aside>
</template>

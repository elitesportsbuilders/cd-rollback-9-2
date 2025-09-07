<script setup lang="ts">
import { defineProps, defineEmits } from 'vue';
import { View } from '@/types';
import {
    LayoutDashboard,
    Map,
    Lightbulb,
    Users,
    User,
    FileText,
    Bot,
    Settings,
    Plug,
    CalendarClock,
    Home
} from 'lucide-vue-next';

const props = defineProps<{
  currentView: string;
  isOpen: boolean;
}>();

const emit = defineEmits(['setCurrentView']);

const navigate = (view: View) => {
    // This emit will now correctly trigger the setCurrentView function in App.vue
    emit('setCurrentView', view);
};

const menuItems = [
    { view: View.Dashboard, icon: LayoutDashboard, label: 'Dashboard' },
    { view: View.InteractiveMap, icon: Map, label: 'Interactive Map' },
    { view: View.LeadIntelligence, icon: Lightbulb, label: 'Lead Intelligence' },
    { view: View.CompetitorIntel, icon: Users, label: 'Competitor Intel' },
    { view: View.MyIntel, icon: User, label: 'My Intel' },
    { view: View.ResidentialProspecting, icon: Home, label: 'Residential Prospecting'},
    { view: View.Reports, icon: FileText, label: 'Reports' },
    { view: View.AiInspection, icon: Bot, label: 'AI Inspection' },
];

const settingsItems = [
    { view: View.Integrations, icon: Plug, label: 'Integrations' },
    { view: View.Settings, icon: Settings, label: 'Settings' },
];
</script>

<template>
    <!-- Sidebar container -->
    <div
        :class="['fixed inset-y-0 left-0 z-30 w-64 bg-slate-800 text-white transform transition-transform duration-300 ease-in-out md:relative md:translate-x-0', isOpen ? 'translate-x-0' : '-translate-x-full']"
    >
        <div class="flex flex-col h-full">
            <!-- Logo -->
            <div class="flex items-center justify-center h-16 border-b border-slate-700 flex-shrink-0 px-4">
                <img src="https://storage.googleapis.com/sourcegraph-assets/S-logo-light.svg" alt="CourtDetect Logo" class="h-8 w-auto"/>
                <span class="ml-3 text-lg font-semibold">CourtDetect</span>
            </div>

            <!-- Navigation Links -->
            <nav class="flex-1 overflow-y-auto p-4 space-y-2">
                <p class="px-2 text-xs font-semibold text-slate-400 uppercase tracking-wider">Analytics</p>
                <a
                    v-for="item in menuItems"
                    :key="item.view"
                    href="#"
                    @click.prevent="navigate(item.view)"
                    :class="['flex items-center px-3 py-2 text-sm font-medium rounded-md transition-colors', currentView === item.view ? 'bg-indigo-600 text-white' : 'text-slate-300 hover:bg-slate-700 hover:text-white']"
                >
                    <component :is="item.icon" class="h-5 w-5 mr-3" />
                    <span>{{ item.label }}</span>
                </a>

                <p class="px-2 pt-4 text-xs font-semibold text-slate-400 uppercase tracking-wider">Configuration</p>
                <a
                    v-for="item in settingsItems"
                    :key="item.view"
                    href="#"
                    @click.prevent="navigate(item.view)"
                    :class="['flex items-center px-3 py-2 text-sm font-medium rounded-md transition-colors', currentView === item.view ? 'bg-indigo-600 text-white' : 'text-slate-300 hover:bg-slate-700 hover:text-white']"
                >
                    <component :is="item.icon" class="h-5 w-5 mr-3" />
                    <span>{{ item.label }}</span>
                </a>
            </nav>
        </div>
    </div>
</template>


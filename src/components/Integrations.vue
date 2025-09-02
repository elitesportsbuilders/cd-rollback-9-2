<script setup lang="ts">
import { View } from '@/types';
import PrimaryButton from '@/components/PrimaryButton.vue';
import Card from '@/components/Card.vue';

defineProps<{
  isConnected: boolean;
}>();

const emit = defineEmits(['setCurrentView', 'setIntegrationState']);

const handleDisconnect = () => {
  emit('setIntegrationState', { isPipedriveConnected: false });
};

const setCurrentView = (view: string) => emit('setCurrentView', view);
</script>

<template>
    <main class="flex-1 overflow-y-auto p-6 md:p-8">
        <header class="mb-8">
            <h2 class="text-3xl font-extrabold text-slate-800">Integrations</h2>
            <p class="text-slate-500 mt-1">Connect Court Detector to your other business tools to automate your workflow.</p>
        </header>

        <div class="space-y-8">
            <Card>
                <div class="flex items-center">
                    <img src="https://i.imgur.com/b59S4sD.png" alt="Pipedrive Logo" class="w-16 h-16 mr-6"/>
                    <div class="flex-1">
                        <h3 class="text-xl font-bold text-slate-800">Pipedrive</h3>
                        <p class="text-sm text-slate-500">Sync qualified leads from Court Detector directly into your Pipedrive sales pipeline as new deals.</p>
                    </div>
                    <div>
                        <div v-if="isConnected" class="text-right">
                            <span class="inline-flex items-center px-3 py-1 rounded-full text-sm font-medium bg-green-100 text-green-800">
                                <i data-lucide="check-circle" class="w-4 h-4 mr-2"></i>
                                Connected
                            </span>
                            <button @click="handleDisconnect" class="text-xs text-slate-500 hover:underline mt-1">Disconnect</button>
                        </div>
                        <PrimaryButton
                            v-else
                            label="Connect"
                            icon="plug-zap"
                            @click="setCurrentView(View.PipedriveAuth)"
                        />
                    </div>
                </div>
                <div v-if="isConnected" class="mt-4 pt-4 border-t border-slate-200 bg-slate-50 p-4 rounded-lg">
                     <h4 class="text-sm font-bold text-slate-600 mb-2">Sync Settings</h4>
                     <p class="text-xs text-slate-500">Configure how leads are created in Pipedrive.</p>
                     <div class="mt-2 space-y-2">
                        <div class="flex items-center">
                            <label class="text-sm text-slate-700 w-48">Create as Deal Stage:</label>
                            <select class="block w-64 px-3 py-1 bg-white border border-slate-300 rounded-md shadow-sm text-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500">
                                <option>Lead In</option>
                                <option>Contact Made</option>
                                <option>Demo Scheduled</option>
                            </select>
                        </div>
                        <div class="flex items-center">
                            <label class="text-sm text-slate-700 w-48">Assign to User:</label>
                            <select class="block w-64 px-3 py-1 bg-white border border-slate-300 rounded-md shadow-sm text-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500">
                                <option>Mike Woelfel (Me)</option>
                                <option>Jane Doe</option>
                            </select>
                        </div>
                     </div>
                 </div>
            </Card>
        </div>
    </main>
</template>

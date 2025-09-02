<script setup lang="ts">
import { View } from '@/types';
import PrimaryButton from '@/components/PrimaryButton.vue';
import Card from '@/components/Card.vue';

const emit = defineEmits(['setCurrentView', 'setIntegrationState']);

const handleAllow = () => {
  emit('setIntegrationState', { isPipedriveConnected: true });
  emit('setCurrentView', View.Integrations);
};

const handleDeny = () => {
  emit('setCurrentView', View.Integrations);
};
</script>

<template>
    <div class="flex-1 flex items-center justify-center bg-slate-200 p-8">
        <Card class="max-w-md w-full !p-8 text-center">
            <img src="https://i.imgur.com/b59S4sD.png" alt="Pipedrive Logo" class="w-20 h-20 mx-auto mb-4"/>
            <h2 class="text-xl font-bold text-slate-800">Court Detector would like to access your Pipedrive account</h2>
            <p class="text-sm text-slate-500 mt-2">
                This will allow Court Detector to:
            </p>

            <ul class="text-left text-sm text-slate-600 mt-4 space-y-2">
                <li class="flex items-start">
                    <i data-lucide="check" class="w-4 h-4 mr-2 text-green-500 flex-shrink-0 mt-0.5"></i>
                    <span><strong>Read contacts, organizations, and users.</strong> To properly associate new deals with existing records.</span>
                </li>
                <li class="flex items-start">
                    <i data-lucide="check" class="w-4 h-4 mr-2 text-green-500 flex-shrink-0 mt-0.5"></i>
                    <span><strong>Create and update deals, notes, and activities.</strong> To automatically create new leads in your pipeline.</span>
                </li>
            </ul>

            <p class="text-xs text-slate-400 mt-6">
                By clicking "Allow and Install", you agree to Pipedrive's <a href="#" class="underline">Terms of Service</a> and <a href="#" class="underline">Privacy Policy</a>.
            </p>

            <div class="mt-6 flex gap-4">
                 <button @click="handleDeny" class="flex-1 px-4 py-2 bg-white text-slate-700 font-semibold border border-slate-300 rounded-lg shadow-sm hover:bg-slate-50">
                    Cancel
                </button>
                <PrimaryButton
                    @click="handleAllow"
                    label="Allow and Install"
                    color="green"
                    class="flex-1"
                />
            </div>
        </Card>
    </div>
</template>

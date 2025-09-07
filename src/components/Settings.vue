<script setup lang="ts">
import { ref } from 'vue';
import { 
    Settings, 
    User, 
    Bell, 
    CreditCard, 
    Lock,
    Save
} from 'lucide-vue-next';

const user = ref({
  name: 'Mike Woelfel',
  email: 'mike@elitesportsbuilders.com',
  company: 'Elite Sports Builders',
  plan: 'Pro Plan',
});

const notifications = ref({
  newLeads: true,
  weeklySummary: true,
  competitorActivity: false,
});

</script>

<template>
    <div class="flex-1 overflow-y-auto bg-slate-50 p-6">
        <header class="mb-6">
            <h1 class="text-3xl font-bold text-slate-800 flex items-center">
                <Settings class="w-8 h-8 mr-3 text-indigo-600" />
                Settings
            </h1>
            <p class="mt-1 text-slate-600">Manage your account, notifications, and billing.</p>
        </header>

        <div class="max-w-4xl mx-auto space-y-8">
            <!-- Profile Settings -->
            <div class="bg-white p-6 rounded-lg shadow-md border border-slate-200">
                <h2 class="text-xl font-bold text-slate-800 flex items-center mb-4">
                    <User class="w-6 h-6 mr-2 text-slate-500" />
                    Profile
                </h2>
                <div class="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div>
                        <label for="name" class="block text-sm font-medium text-slate-700">Full Name</label>
                        <input type="text" id="name" v-model="user.name" class="mt-1 block w-full rounded-md border-slate-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm">
                    </div>
                    <div>
                        <label for="email" class="block text-sm font-medium text-slate-700">Email Address</label>
                        <input type="email" id="email" v-model="user.email" class="mt-1 block w-full rounded-md border-slate-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm bg-slate-100" disabled>
                    </div>
                     <div>
                        <label for="company" class="block text-sm font-medium text-slate-700">Company</label>
                        <input type="text" id="company" v-model="user.company" class="mt-1 block w-full rounded-md border-slate-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm">
                    </div>
                </div>
            </div>
            
            <!-- Notification Settings -->
            <div class="bg-white p-6 rounded-lg shadow-md border border-slate-200">
                <h2 class="text-xl font-bold text-slate-800 flex items-center mb-4">
                    <Bell class="w-6 h-6 mr-2 text-slate-500" />
                    Notifications
                </h2>
                <div class="space-y-4">
                    <div class="flex items-start">
                        <div class="flex h-5 items-center">
                            <input id="newLeads" v-model="notifications.newLeads" type="checkbox" class="h-4 w-4 rounded border-gray-300 text-indigo-600 focus:ring-indigo-500">
                        </div>
                        <div class="ml-3 text-sm">
                            <label for="newLeads" class="font-medium text-slate-700">New Leads</label>
                            <p class="text-slate-500">Get notified when a new permit or news lead is found in your area.</p>
                        </div>
                    </div>
                    <div class="flex items-start">
                        <div class="flex h-5 items-center">
                            <input id="weeklySummary" v-model="notifications.weeklySummary" type="checkbox" class="h-4 w-4 rounded border-gray-300 text-indigo-600 focus:ring-indigo-500">
                        </div>
                        <div class="ml-3 text-sm">
                            <label for="weeklySummary" class="font-medium text-slate-700">Weekly Summary</label>
                            <p class="text-slate-500">Receive a weekly digest of all activity and new opportunities.</p>
                        </div>
                    </div>
                    <div class="flex items-start">
                        <div class="flex h-5 items-center">
                            <input id="competitorActivity" v-model="notifications.competitorActivity" type="checkbox" class="h-4 w-4 rounded border-gray-300 text-indigo-600 focus:ring-indigo-500">
                        </div>
                        <div class="ml-3 text-sm">
                            <label for="competitorActivity" class="font-medium text-slate-700">Competitor Activity</label>
                            <p class="text-slate-500">Get an alert when one of your tracked competitors starts a new job.</p>
                        </div>
                    </div>
                </div>
            </div>

            <!-- Billing -->
            <div class="bg-white p-6 rounded-lg shadow-md border border-slate-200">
                <h2 class="text-xl font-bold text-slate-800 flex items-center mb-4">
                    <CreditCard class="w-6 h-6 mr-2 text-slate-500" />
                    Billing
                </h2>
                <div class="bg-slate-50 border border-slate-200 rounded-lg p-4 flex items-center justify-between">
                    <div>
                        <p class="font-semibold text-slate-800">{{ user.plan }}</p>
                        <p class="text-sm text-slate-500">Next payment of $249 on Oct 1, 2025</p>
                    </div>
                    <button class="font-semibold text-sm text-indigo-600 hover:text-indigo-800">Manage Plan</button>
                </div>
            </div>

            <div class="flex justify-end pt-4 border-t border-slate-200">
                 <button type="button" class="bg-indigo-600 text-white font-semibold py-2 px-6 rounded-md hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 flex items-center">
                    <Save class="w-4 h-4 mr-2" />
                    Save Changes
                </button>
            </div>
        </div>
    </div>
</template>

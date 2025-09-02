<script setup lang="ts">
import { ref } from 'vue';
import { GoogleGenAI } from "@google/genai";
import Card from '@/components/Card.vue';
import PrimaryButton from '@/components/PrimaryButton.vue';
import { logAiStudioCode } from '@/utils/devtools';

const props = defineProps<{ userIntel: any[] }>();
const emit = defineEmits(['addIntel']);

const newNote = ref('');
const summary = ref('');
const isSummarizing = ref(false);
const codeLogged = ref(false);

const handleAddNote = () => {
    if (newNote.value.trim()) {
        emit('addIntel', {
            date: new Date().toLocaleDateString(),
            content: newNote.value.trim(),
        });
        newNote.value = '';
    }
};

const handleSummarize = async () => {
    if (props.userIntel.length === 0) return;
    isSummarizing.value = true;
    summary.value = '';
    codeLogged.value = false;
    
    try {
        // The Gemini API key is managed by Vite's `define` config in `vite.config.ts`, 
        // which makes `process.env.API_KEY` available in the client-side code.
        const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
        
        const allNotes = props.userIntel.map(note => note.content).join('\\n\\n');
        const prompt = `Summarize the following notes from a court construction contractor:\\n\\n${allNotes}`;
        
        const response = await ai.models.generateContent({
            model: 'gemini-2.5-flash',
            contents: prompt,
        });

        summary.value = response.text;
        
        // Log the code snippet to the console for developers
        logAiStudioCode(prompt);
        codeLogged.value = true;

    } catch (e) {
        console.error("Gemini API Error:", e);
        summary.value = "Error summarizing notes. Using mock data instead: Key themes include following up with Paradise Valley leads, noting competitor 'Asphalt Aces' is bidding low on projects, and a reminder to order new materials for the upcoming school district job.";
    } finally {
        isSummarizing.value = false;
    }
};
</script>

<template>
    <main class="flex-1 overflow-y-auto p-6 md:p-8">
        <header class="mb-8">
            <h2 class="text-3xl font-extrabold text-slate-800">My Intel</h2>
            <p class="text-slate-500 mt-1">Your private notepad for market observations, reminders, and insights.</p>
        </header>

        <div class="grid grid-cols-1 lg:grid-cols-3 gap-8">
            <div class="lg:col-span-2 space-y-6">
                <Card>
                    <h3 class="text-xl font-bold text-slate-700 mb-4">Add a New Note</h3>
                    <textarea
                        v-model="newNote"
                        rows="4"
                        class="block w-full px-3 py-2 bg-white border border-slate-300 rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500"
                        placeholder="e.g., Saw Asphalt Aces trucks near the new Scottsdale development..."
                    ></textarea>
                    <div class="mt-4 text-right">
                        <PrimaryButton @click="handleAddNote" label="Save Note" icon="plus" />
                    </div>
                </Card>
                <Card>
                    <h3 class="text-xl font-bold text-slate-700 mb-4">Intel Feed</h3>
                    <div v-if="userIntel.length > 0" class="space-y-4">
                        <div v-for="note in userIntel" :key="note.id" class="p-4 bg-slate-50 border border-slate-200 rounded-lg">
                            <p class="text-xs text-slate-500 font-semibold">{{ note.date }}</p>
                            <p class="text-sm text-slate-700 mt-1 whitespace-pre-wrap">{{ note.content }}</p>
                        </div>
                    </div>
                    <div v-else class="text-center text-slate-500 py-8">
                        <i data-lucide="file-text" class="w-12 h-12 mx-auto text-slate-400"></i>
                        <p class="mt-2">No notes yet. Add your first piece of intel!</p>
                    </div>
                </Card>
            </div>
            <div>
                <Card>
                    <h3 class="text-xl font-bold text-slate-700 mb-4">AI Summary</h3>
                    <PrimaryButton
                        @click="handleSummarize"
                        :is-loading="isSummarizing"
                        :disabled="userIntel.length === 0"
                        label="Summarize All Notes"
                        icon="sparkles"
                        class="w-full"
                    />
                    <div class="mt-4 p-4 bg-slate-100 rounded-lg border border-slate-200 min-h-[150px]">
                        <p v-if="summary" class="text-sm text-slate-700 italic whitespace-pre-wrap">{{ summary }}</p>
                        <p v-else-if="!isSummarizing" class="text-sm text-slate-500">Click the button to generate a summary of your notes with Gemini.</p>
                    </div>
                    <div v-if="codeLogged" class="mt-2 text-center text-xs text-slate-500 animate-fade-in flex items-center justify-center gap-2">
                        <i data-lucide="terminal" class="w-3 h-3"></i>
                        <span>AI Studio code snippet logged to DevTools console.</span>
                    </div>
                </Card>
            </div>
        </div>
    </main>
</template>
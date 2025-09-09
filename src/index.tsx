import { createApp } from 'vue';
import App from '@/App.vue';

// Import styles - Vite will handle bundling them
import 'leaflet/dist/leaflet.css';
import 'leaflet-draw/dist/leaflet.draw.css';
import '@/styles.css';

const app = createApp(App);

app.mount('#root');

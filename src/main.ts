import { createApp } from 'vue';
import App from './App.vue';
import './styles.css';
import './firebase'; // Import the firebase initialization

const app = createApp(App);
app.mount('#app');

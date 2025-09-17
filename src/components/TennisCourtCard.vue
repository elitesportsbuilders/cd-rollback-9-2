<!--TennisCourtCard.vueA complete, copy-pasteable example of a Vue 3 componentusing the 'lucide-vue-next' library for icons.--><script setup>// 1. Import only the icons you need from 'lucide-vue-next'.// This is great for keeping your app's final size small (tree-shaking).import { TennisBall, MapPin, CalendarDays, Wrench } from 'lucide-vue-next';// You could also define props here if this component needed to be dynamic.// For <!--TennisCourtCard.vueA complete, copy-pasteable example of a Vue 3 componentusing the 'lucide-vue-next' library for icons.--><script setup>// 1. Import only the icons you need from 'lucide-vue-next'.// This is great for keeping your app's final size small (tree-shaking).import { TennisBall, MapPin, CalendarDays, Wrench } from 'lucide-vue-next';// You could also define props here if this component needed to be dynamic.// For example:// const props = defineProps({//   projectName: String,//   location: String,// });</script><template><div class="court-card"><h2 class="card-title"><!-- 2. Use the icon components directly in your template. --><!-- You can pass props like size, color, and stroke-width. --><TennisBall :size="28" color="#86efac" /><span>Project: Scottsdale Ranch Park Resurfacing</span></h2><div class="info-item">
  <!-- You can also apply classes for styling. -->
  <MapPin :size="20" class="info-icon" />
  <p><strong>Location:</strong> 10400 E Vía Linda, Scottsdale, AZ 85258</p>
</div>

<div class="info-item">
  <CalendarDays :size="20" class="info-icon" />
  <p><strong>Scheduled Completion:</strong> October 2025</p>
</div>

<div class="info-item">
  <Wrench :size="20" class="info-icon" stroke-width="2.5" />
  <p><strong>Service Type:</strong> Full Acrylic Resurfacing and Repair</p>
</div>
</div></template><style scoped>/* Scoped styles only apply to this component */.court-card {font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Helvetica, Arial, sans-serif;background-color: #ffffff;border: 1px solid #e2e8f0;border-radius: 12px;padding: 24px;max-width: 500px;margin: 20px;box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.1), 0 2px 4px -2px rgba(0, 0, 0, 0.1);transition: all 0.3s ease-in-out;}.court-card:hover {transform: translateY(-4px);box-shadow: 0 10px 15px -3px rgba(0, 0, 0, 0.1), 0 4px 6px -4px rgba(0, 0, 0, 0.1);}.card-title {display: flex;align-items: center;gap: 12px;font-size: 1.25rem;font-weight: 600;color: #1e293b;margin-top: 0;margin-bottom: 20px;}.info-item {display: flex;align-items: start;gap: 10px;margin-bottom: 12px;color: #475569;}.info-item p {margin: 0;line-height: 1.5;}.info-icon {flex-shrink: 0; /* Prevents icon from shrinking /margin-top: 3px;color: #3b82f6; / A nice blue for the icons */}</style>

  <!-- You can also apply classes for styling. -->
  <MapPin :size="20" class="info-icon" />
  <p><strong>Location:</strong> 10400 E Vía Linda, Scottsdale, AZ 85258</p>
</div>

<div class="info-item">
  <CalendarDays :size="20" class="info-icon" />
  <p><strong>Scheduled Completion:</strong> October 2025</p>
</div>

<div class="info-item">
  <Wrench :size="20" class="info-icon" stroke-width="2.5" />
  <p><strong>Service Type:</strong> Full Acrylic Resurfacing and Repair</p>
</div>
</template>
<style scoped>
/* Scoped styles only apply to this component */
.court-card {font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Helvetica, Arial, sans-serif;background-color: #ffffff;border: 1px solid #e2e8f0;border-radius: 12px;padding: 24px;max-width: 500px;margin: 20px;box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.1), 0 2px 4px -2px rgba(0, 0, 0, 0.1);transition: all 0.3s ease-in-out;}.court-card:hover {transform: translateY(-4px);box-shadow: 0 10px 15px -3px rgba(0, 0, a, 0.1), 0 4px 6px -4px rgba(0, 0, 0, 0.1);}
.card-title {
  display: flex;
  align-items: center;
  gap: 12px;
  font-size: 1.25rem;
  font-weight: 600;
  color: #1e293b;
  margin-top: 0;
  margin-bottom: 20px;
}
.info-item {
  display: flex;
  align-items: start;
  gap: 10px;
  margin-bottom: 12px;
  color: #475569;
}
.info-item p {
  margin: 0;
  line-height: 1.5;
}
.info-icon {
  flex-shrink: 0; /* Prevents icon from shrinking */
  margin-top: 3px;
  color: #3b82f6; /* A nice blue for the icons */
}
</style>
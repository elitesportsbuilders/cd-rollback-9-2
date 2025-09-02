<script setup lang="ts">
defineProps<{
  text: string;
}>();
</script>

<template>
    <div class="relative group inline-flex">
        <slot></slot>
        <div class="absolute bottom-full left-1/2 -translate-x-1/2 mb-2 w-max max-w-xs p-2 bg-slate-800 text-white text-xs rounded-md shadow-lg opacity-0 group-hover:opacity-100 transition-opacity duration-200 pointer-events-none tooltip-box">
            {{ text }}
        </div>
    </div>
</template>

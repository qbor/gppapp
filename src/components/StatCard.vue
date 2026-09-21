<template>
  <div class="card animate-fade-in p-5">
    <div class="flex items-center gap-2 text-sm text-slate-400">
      <span class="flex h-7 w-7 items-center justify-center rounded-lg" :class="iconBg">
        <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round" class="h-4 w-4">
          <path :d="iconPath" />
        </svg>
      </span>
      <span>{{ label }}</span>
    </div>
    <p class="num mt-3 text-xl font-semibold sm:text-2xl" :class="valueClass">{{ value }}</p>
    <p v-if="hint" class="mt-1 text-xs" :class="hintClass">{{ hint }}</p>
  </div>
</template>

<script setup>
defineProps({
  label: { type: String, required: true },
  value: { type: String, default: '0.00' },
  valueClass: { type: String, default: 'text-slate-800' },
  iconPath: { type: String, required: true },
  iconBg: { type: String, default: 'bg-slate-100 text-slate-500' },
  hint: { type: String, default: '' },
  hintClass: { type: String, default: 'text-slate-400' }
})
</script>

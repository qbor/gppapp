<template>
  <div class="card animate-fade-in p-8 text-center">
    <div class="mx-auto flex h-16 w-16 items-center justify-center rounded-2xl bg-slate-50">
      <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round" class="h-8 w-8 text-slate-300">
        <path d="M21 12.79A9 9 0 1 1 11.21 3 7 7 0 0 0 21 12.79z" />
      </svg>
    </div>
    <p class="mt-4 text-sm font-medium text-slate-600">{{ title }}</p>
    <p v-if="description" class="mt-1 text-sm text-slate-400">{{ description }}</p>
    <RouterLink v-if="action" :to="action.to" class="btn-secondary mt-5">
      {{ action.label }}
    </RouterLink>
  </div>
</template>

<script setup>
defineProps({
  title: { type: String, required: true },
  description: { type: String, default: '' },
  action: { type: Object, default: null }
})
</script>

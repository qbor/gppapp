<template>
  <Teleport to="body">
    <div class="pointer-events-none fixed right-5 top-5 z-[60] flex w-80 flex-col gap-2.5">
      <TransitionGroup name="toast">
        <div
          v-for="item in toasts"
          :key="item.id"
          class="pointer-events-auto flex items-center gap-2.5 rounded-xl border bg-white px-4 py-3 shadow-card-hover animate-toast-in"
          :class="borderClass[item.type]"
        >
          <span class="flex h-6 w-6 shrink-0 items-center justify-center rounded-full" :class="iconClass[item.type]">
            <svg v-if="item.type === 'success'" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round" class="h-3.5 w-3.5">
              <path d="M20 6 9 17l-5-5" />
            </svg>
            <svg v-else-if="item.type === 'error'" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" class="h-3.5 w-3.5">
              <path d="M18 6 6 18M6 6l12 12" />
            </svg>
            <svg v-else xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" class="h-3.5 w-3.5">
              <circle cx="12" cy="12" r="9" />
              <path d="M12 8h.01M12 12v4" />
            </svg>
          </span>
          <p class="text-sm text-slate-700">{{ item.message }}</p>
        </div>
      </TransitionGroup>
    </div>
  </Teleport>
</template>

<script setup>
import { useToast } from '@/composables/useToast'

const { toasts } = useToast()

const borderClass = {
  success: 'border-brand-100',
  error: 'border-rose-100',
  info: 'border-ocean-100'
}
const iconClass = {
  success: 'bg-brand-50 text-brand-600',
  error: 'bg-rose-50 text-rose-500',
  info: 'bg-ocean-50 text-ocean-600'
}
</script>

<style scoped>
.toast-enter-active,
.toast-leave-active {
  transition: all 0.25s ease;
}
.toast-enter-from {
  opacity: 0;
  transform: translateX(16px);
}
.toast-leave-to {
  opacity: 0;
  transform: translateX(16px);
}
</style>

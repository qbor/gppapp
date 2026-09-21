<template>
  <Teleport to="body">
    <Transition name="overlay">
      <div
        v-if="visible"
        class="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/40 p-4 backdrop-blur-sm"
        @click.self="handleClose"
      >
        <div class="w-full max-w-md animate-modal-in rounded-2xl bg-white p-6 shadow-card-hover">
          <!-- 标题 -->
          <div class="mb-5 flex items-center justify-between">
            <h3 class="text-lg font-semibold text-slate-800">{{ title }}</h3>
            <button
              class="flex h-8 w-8 items-center justify-center rounded-lg text-slate-400 transition-colors hover:bg-slate-100 hover:text-slate-600"
              @click="handleClose"
            >
              <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" class="h-4 w-4">
                <path d="M18 6 6 18M6 6l12 12" />
              </svg>
            </button>
          </div>

          <!-- 内容插槽 -->
          <slot />

          <!-- 底部操作 -->
          <div v-if="showFooter" class="mt-6 flex justify-end gap-3">
            <button class="btn-secondary" @click="handleClose">取消</button>
            <button class="btn-primary" :disabled="confirmDisabled" @click="emit('confirm')">{{ confirmText }}</button>
          </div>
        </div>
      </div>
    </Transition>
  </Teleport>
</template>

<script setup>
const props = defineProps({
  visible: { type: Boolean, required: true },
  title: { type: String, default: '提示' },
  showFooter: { type: Boolean, default: true },
  confirmText: { type: String, default: '确定' },
  confirmDisabled: { type: Boolean, default: false }
})

const emit = defineEmits(['close', 'confirm'])

function handleClose() {
  emit('close')
}
</script>

<style scoped>
.overlay-enter-active,
.overlay-leave-active {
  transition: opacity 0.2s ease;
}
.overlay-enter-active .animate-modal-in,
.overlay-leave-active .animate-modal-in {
  transition: transform 0.2s ease, opacity 0.2s ease;
}
.overlay-enter-from,
.overlay-leave-to {
  opacity: 0;
}
.overlay-enter-from .animate-modal-in,
.overlay-leave-to .animate-modal-in {
  transform: scale(0.96) translateY(8px);
  opacity: 0;
}
</style>

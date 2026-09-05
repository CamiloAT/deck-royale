<script setup lang="ts">
import { useToast } from '../../composables/useToast'

const { toasts, dismiss, getStyle } = useToast()
</script>

<template>
  <div class="toast-list">
    <TransitionGroup name="toast">
      <div
        v-for="toast in toasts"
        :key="toast.id"
        class="toast-item"
        :style="{
          background: getStyle(toast.variant).bg,
          color: getStyle(toast.variant).text,
          borderColor: getStyle(toast.variant).border,
        }"
        @click="dismiss(toast.id)"
      >
        {{ toast.message }}
      </div>
    </TransitionGroup>
  </div>
</template>

<style scoped>
.toast-list {
  position: fixed;
  top: 200px;
  left: 50%;
  transform: translateX(-50%);
  z-index: 1000;
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 8px;
  pointer-events: none;
  width: 90%;
  max-width: 400px;
}

.toast-item {
  padding: 10px 22px;
  border-radius: 8px;
  font-size: 14px;
  font-weight: 600;
  text-align: center;
  cursor: pointer;
  pointer-events: auto;
  border: 1px solid;
  white-space: nowrap;
  max-width: 100%;
  overflow: hidden;
  text-overflow: ellipsis;
  box-shadow: 0 4px 16px rgba(0, 0, 0, 0.4);
}

/* Transition */
.toast-enter-active {
  transition: all 0.3s cubic-bezier(0.34, 1.56, 0.64, 1);
}
.toast-leave-active {
  transition: all 0.2s ease-in;
}
.toast-enter-from {
  opacity: 0;
  transform: translateY(-20px) scale(0.95);
}
.toast-leave-to {
  opacity: 0;
  transform: translateY(-10px) scale(0.95);
}

@media (max-width: 768px) {
  .toast-list {
    top: 80px;
    max-width: 85%;
  }
  .toast-item {
    font-size: 13px;
    padding: 8px 16px;
  }
}
</style>

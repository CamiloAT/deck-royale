<script setup lang="ts">
import { X, Timer, ScrollText } from '@lucide/vue'
import type { HandLogEntry } from '../../composables/useGame'

const props = defineProps<{
  handLog: HandLogEntry[]
  handNumber: number
  turnStartedAt?: number
  turnTimer?: number
}>()

const emit = defineEmits<{
  (e: 'close'): void
}>()

const timeLeft = ref(0)
const timerColor = computed(() => {
  if (timeLeft.value <= 10) return '#ef4444'
  if (timeLeft.value <= 20) return '#f59e0b'
  return '#22c55e'
})

let interval: ReturnType<typeof setInterval> | null = null

function updateTimer() {
  if (!props.turnStartedAt || !props.turnTimer) {
    timeLeft.value = 0
    return
  }
  const elapsed = Date.now() - props.turnStartedAt
  const remaining = Math.max(0, props.turnTimer * 1000 - elapsed)
  timeLeft.value = Math.ceil(remaining / 1000)
}

onMounted(() => {
  updateTimer()
  interval = setInterval(updateTimer, 200)
})

onUnmounted(() => {
  if (interval) clearInterval(interval)
})

watch(() => props.turnStartedAt, () => { updateTimer() })

const logBody = ref<HTMLElement | null>(null)

watch(() => props.handLog.length, () => {
  nextTick(() => {
    if (logBody.value) {
      logBody.value.scrollTop = logBody.value.scrollHeight
    }
  })
})
</script>

<template>
  <Teleport to="body">
    <div class="history-overlay" @click.self="emit('close')">
      <div class="history-modal">
        <div class="history-modal__header">
          <div class="history-modal__title">Historial de Mano</div>
          <div class="history-modal__hand-num" v-if="handNumber > 0">#{{ handNumber }}</div>
          <div v-if="timeLeft > 0" class="history-modal__timer" :style="{ color: timerColor }">
            <Timer :size="14" />
            {{ timeLeft }}s
          </div>
          <button class="history-modal__close" @click="emit('close')">
            <X :size="18" />
          </button>
        </div>

        <div ref="logBody" class="history-modal__body">
          <div v-if="handLog.length === 0" class="history-empty">
            <ScrollText :size="24" class="history-empty__icon" />
            <span>Esperando acciones...</span>
          </div>
          <div
            v-for="(entry, i) in handLog"
            :key="i"
            class="history-entry"
          >
            <span class="history-entry__bullet">•</span>
            <span class="history-entry__text">{{ entry.message }}</span>
          </div>
        </div>
      </div>
    </div>
  </Teleport>
</template>

<style scoped>
.history-overlay {
  position: fixed;
  inset: 0;
  z-index: 5000;
  display: flex;
  align-items: center;
  justify-content: center;
  background: rgba(0, 0, 0, 0.8);
  backdrop-filter: blur(6px);
}

.history-modal {
  background: #0f1520;
  border: 1px solid rgba(255, 215, 0, 0.2);
  border-radius: 16px;
  width: 92%;
  max-width: 440px;
  max-height: 85vh;
  display: flex;
  flex-direction: column;
  overflow: hidden;
}

.history-modal__header {
  display: flex;
  align-items: center;
  gap: 10px;
  padding: 16px 20px;
  border-bottom: 1px solid rgba(255, 215, 0, 0.1);
}

.history-modal__title {
  color: #ffd700;
  font-size: 18px;
  font-weight: 700;
  flex: 1;
}

.history-modal__hand-num {
  color: rgba(255, 215, 0, 0.5);
  font-size: 13px;
  font-weight: 600;
}

.history-modal__timer {
  display: flex;
  align-items: center;
  gap: 4px;
  font-size: 14px;
  font-weight: 700;
  font-variant-numeric: tabular-nums;
}

.history-modal__close {
  background: rgba(255, 255, 255, 0.05);
  border: 1px solid rgba(255, 255, 255, 0.1);
  border-radius: 8px;
  width: 32px;
  height: 32px;
  display: flex;
  align-items: center;
  justify-content: center;
  color: #888;
  cursor: pointer;
  transition: all 0.2s;
}
.history-modal__close:hover {
  color: #fff;
  background: rgba(255, 255, 255, 0.1);
}

.history-modal__body {
  overflow-y: auto;
  padding: 12px 16px 20px;
  display: flex;
  flex-direction: column;
  gap: 6px;
  max-height: 60vh;
}

.history-empty {
  color: rgba(255, 255, 255, 0.3);
  font-size: 13px;
  text-align: center;
  padding: 24px 0;
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 8px;
}

.history-empty__icon {
  opacity: 0.3;
}

.history-entry {
  display: flex;
  align-items: flex-start;
  gap: 8px;
  padding: 8px 10px;
  background: rgba(255, 255, 255, 0.03);
  border-radius: 8px;
  transition: background 0.2s;
  animation: entrySlide 0.3s ease-out;
}

.history-entry:hover {
  background: rgba(255, 255, 255, 0.06);
}

.history-entry__bullet {
  color: #ffd700;
  font-size: 14px;
  line-height: 1;
  flex-shrink: 0;
  margin-top: 1px;
}

.history-entry__text {
  color: rgba(255, 255, 255, 0.85);
  font-size: 13px;
  line-height: 1.4;
}

@keyframes entrySlide {
  from { opacity: 0; transform: translateY(4px); }
  to { opacity: 1; transform: translateY(0); }
}

@media (max-width: 768px) {
  .history-modal {
    width: 96%;
    max-height: 80vh;
  }
  .history-modal__header {
    padding: 12px 14px;
  }
  .history-modal__title {
    font-size: 15px;
  }
  .history-modal__body {
    padding: 8px 10px 16px;
    gap: 4px;
  }
  .history-entry {
    padding: 6px 8px;
  }
  .history-entry__text {
    font-size: 12px;
  }
}
</style>

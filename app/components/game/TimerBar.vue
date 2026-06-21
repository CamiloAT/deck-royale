<script setup lang="ts">
import { Timer } from '@lucide/vue'

const props = defineProps<{
  turnStartedAt: number
  duration?: number
}>()

const durationMs = computed(() => (props.duration ?? 60) * 1000)
const timeLeft = ref(0)
const percentage = ref(100)

function update() {
  const elapsed = Date.now() - props.turnStartedAt
  const remaining = Math.max(0, durationMs.value - elapsed)
  timeLeft.value = Math.ceil(remaining / 1000)
  percentage.value = Math.max(0, (remaining / durationMs.value) * 100)
}

let interval: ReturnType<typeof setInterval> | null = null

onMounted(() => {
  update()
  interval = setInterval(update, 100)
})

onUnmounted(() => {
  if (interval) clearInterval(interval)
})

watch(() => props.turnStartedAt, () => {
  update()
})

const colorClass = computed(() => {
  if (timeLeft.value <= 10) return 'timer-bar--danger'
  if (timeLeft.value <= 20) return 'timer-bar--warning'
  return 'timer-bar--safe'
})
</script>

<template>
  <div class="timer-bar" :class="colorClass">
    <div class="timer-bar__track">
      <div class="timer-bar__fill" :style="{ width: percentage + '%' }" />
    </div>
    <div class="timer-bar__label">
      <Timer :size="12" />
      <span>{{ timeLeft }}s</span>
    </div>
  </div>
</template>

<style scoped>
.timer-bar {
  display: flex;
  align-items: center;
  gap: 8px;
  width: 100%;
  max-width: 200px;
}

.timer-bar__track {
  flex: 1;
  height: 6px;
  background: rgba(255, 255, 255, 0.1);
  border-radius: 3px;
  overflow: hidden;
}

.timer-bar__fill {
  height: 100%;
  border-radius: 3px;
  transition: width 0.1s linear;
}

.timer-bar--safe .timer-bar__fill {
  background: #22c55e;
  box-shadow: 0 0 8px rgba(34, 197, 94, 0.5);
}

.timer-bar--warning .timer-bar__fill {
  background: #f59e0b;
  box-shadow: 0 0 8px rgba(245, 158, 11, 0.5);
}

.timer-bar--danger .timer-bar__fill {
  background: #ef4444;
  box-shadow: 0 0 8px rgba(239, 68, 68, 0.5);
  animation: timerPulse 0.5s ease-in-out infinite;
}

.timer-bar__label {
  display: flex;
  align-items: center;
  gap: 4px;
  font-size: 12px;
  font-weight: 700;
  font-variant-numeric: tabular-nums;
  min-width: 32px;
}

.timer-bar--safe .timer-bar__label { color: #22c55e; }
.timer-bar--warning .timer-bar__label { color: #f59e0b; }
.timer-bar--danger .timer-bar__label { color: #ef4444; }

@keyframes timerPulse {
  0%, 100% { opacity: 1; }
  50% { opacity: 0.6; }
}

@media (max-width: 768px) {
  .timer-bar { max-width: 140px; }
  .timer-bar__track { height: 4px; }
  .timer-bar__label { font-size: 10px; min-width: 28px; }
}
</style>

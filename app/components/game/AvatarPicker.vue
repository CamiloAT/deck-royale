<script setup lang="ts">
import { X, Timer } from '@lucide/vue'
import type { Player } from '../../types/poker'

const props = defineProps<{
  player: Player
  turnStartedAt?: number
  turnTimer?: number
}>()

const emit = defineEmits<{
  (e: 'select', avatarType: string): void
  (e: 'close'): void
}>()

const avatars = [
  { type: 'classic' as const, name: 'Masculino' },
  { type: 'female' as const, name: 'Femenino' },
  { type: 'frog' as const, name: 'Sapo' },
  { type: 'penguin' as const, name: 'Pengsoo' },
]

const current = computed(() => props.player.avatarType || 'classic')

function select(type: string) {
  emit('select', type)
  emit('close')
}

const timeLeft = ref(0)
const timerColor = computed(() => {
  if (timeLeft.value <= 10) return '#ef4444'
  if (timeLeft.value <= 20) return '#f59e0b'
  return '#22c55e'
})

let interval: ReturnType<typeof setInterval> | null = null

function updateTimer() {
  if (!props.turnStartedAt || !props.turnTimer) { timeLeft.value = 0; return }
  const elapsed = Date.now() - props.turnStartedAt
  timeLeft.value = Math.ceil(Math.max(0, props.turnTimer * 1000 - elapsed) / 1000)
}

onMounted(() => { updateTimer(); interval = setInterval(updateTimer, 200) })
onUnmounted(() => { if (interval) clearInterval(interval) })
watch(() => props.turnStartedAt, () => updateTimer())
</script>

<template>
  <Teleport to="body">
    <div class="picker-overlay" @click.self="emit('close')">
      <div class="picker-modal">
        <div class="picker-modal__header">
          <div class="picker-modal__title">Elige tu avatar</div>
          <div v-if="timeLeft > 0" class="picker-modal__timer" :style="{ color: timerColor }">
            <Timer :size="14" />
            {{ timeLeft }}s
          </div>
          <button class="picker-modal__close" @click="emit('close')">
            <X :size="18" />
          </button>
        </div>

        <div class="picker-modal__body">
          <button
            v-for="avatar in avatars"
            :key="avatar.type"
            class="picker-option"
            :class="{ 'picker-option--active': current === avatar.type }"
            @click="select(avatar.type)"
          >
            <div class="picker-option__preview">
              <GamePlayerAvatar :player="{ ...player, avatarType: avatar.type, isTurn: false, folded: false, allIn: false }" />
            </div>
            <div class="picker-option__name">{{ avatar.name }}</div>
            <div v-if="current === avatar.type" class="picker-option__check">Actual</div>
          </button>
        </div>
      </div>
    </div>
  </Teleport>
</template>

<style scoped>
.picker-overlay {
  position: fixed;
  inset: 0;
  z-index: 5500;
  display: flex;
  align-items: center;
  justify-content: center;
  background: rgba(0, 0, 0, 0.8);
  backdrop-filter: blur(6px);
}

.picker-modal {
  background: #0f1520;
  border: 1px solid rgba(255, 215, 0, 0.2);
  border-radius: 16px;
  width: 90%;
  max-width: 380px;
  overflow: hidden;
}

.picker-modal__header {
  display: flex;
  align-items: center;
  gap: 12px;
  padding: 16px 20px;
  border-bottom: 1px solid rgba(255, 215, 0, 0.1);
}

.picker-modal__title {
  color: #ffd700;
  font-size: 18px;
  font-weight: 700;
  flex: 1;
}

.picker-modal__timer {
  display: flex;
  align-items: center;
  gap: 4px;
  font-size: 14px;
  font-weight: 700;
  font-variant-numeric: tabular-nums;
}

.picker-modal__close {
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
.picker-modal__close:hover {
  color: #fff;
  background: rgba(255, 255, 255, 0.1);
}

.picker-modal__body {
  display: flex;
  gap: 12px;
  padding: 20px;
  justify-content: center;
}

.picker-option {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 8px;
  padding: 16px 12px;
  background: rgba(255, 255, 255, 0.03);
  border: 2px solid rgba(255, 255, 255, 0.08);
  border-radius: 12px;
  cursor: pointer;
  transition: all 0.25s;
  flex: 1;
  max-width: 110px;
}
.picker-option:hover {
  background: rgba(255, 215, 0, 0.06);
  border-color: rgba(255, 215, 0, 0.2);
}
.picker-option--active {
  background: rgba(255, 215, 0, 0.08);
  border-color: #ffd700;
  box-shadow: 0 0 16px rgba(255, 215, 0, 0.15);
}

.picker-option__preview {
  transform: scale(1.4);
  margin: 12px 0 8px;
}

.picker-option__name {
  color: rgba(255, 255, 255, 0.8);
  font-size: 12px;
  font-weight: 600;
}

.picker-option__check {
  color: #ffd700;
  font-size: 10px;
  font-weight: 600;
  background: rgba(255, 215, 0, 0.1);
  padding: 2px 8px;
  border-radius: 6px;
}

@media (max-width: 768px) {
  .picker-modal {
    width: 94%;
  }
  .picker-option {
    padding: 12px 8px;
  }
  .picker-option__preview {
    transform: scale(1.2);
    margin: 8px 0 6px;
  }
}
</style>

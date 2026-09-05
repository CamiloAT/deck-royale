<script setup lang="ts">
import { X, Timer } from '@lucide/vue'
import type { Player } from '../../types/poker'
import { AVATAR_COLORS, AVATAR_DEFAULT_COLORS, getAvatarColorOption } from '../../utils/avatarColors'

const props = defineProps<{
  player: Player
  turnStartedAt?: number
  turnTimer?: number
}>()

const emit = defineEmits<{
  (e: 'select', avatarType: string, avatarColor: string): void
  (e: 'close'): void
}>()

const avatars = [
  { type: 'classic' as const, name: 'Masculino' },
  { type: 'female' as const, name: 'Femenino' },
  { type: 'frog' as const, name: 'Sapo' },
  { type: 'penguin' as const, name: 'Pengsoo' },
]

const currentType = computed(() => props.player.avatarType || 'classic')
const currentColor = computed(() => props.player.avatarColor || AVATAR_DEFAULT_COLORS[currentType.value] || 'blue')

const focusedType = ref<string | null>(null)
const selectedColors = ref<Record<string, string>>({
  classic: currentType.value === 'classic' ? currentColor.value : 'blue',
  female: currentType.value === 'female' ? currentColor.value : 'purple',
  frog: currentType.value === 'frog' ? currentColor.value : 'green',
  penguin: currentType.value === 'penguin' ? currentColor.value : 'orange',
})

function focusAvatar(type: string) {
  focusedType.value = type
}

function pickColor(type: string, colorKey: string) {
  selectedColors.value[type] = colorKey
}

function confirmSelection() {
  if (!focusedType.value) return
  const color = selectedColors.value[focusedType.value] || AVATAR_DEFAULT_COLORS[focusedType.value]
  emit('select', focusedType.value, color)
  emit('close')
}

const previewColor = computed(() => {
  if (!focusedType.value) return undefined
  return selectedColors.value[focusedType.value]
})

function getDotStyle(color: { key: string; main: string; light?: string; spots?: string; bumps?: string }) {
  if (focusedType.value === 'frog' && color.spots) {
    return {
      background: `radial-gradient(circle 2.5px at 30% 35%, ${color.spots} 100%, transparent 100%),
                   radial-gradient(circle 2px at 65% 25%, ${color.spots} 100%, transparent 100%),
                   radial-gradient(circle 1.8px at 50% 65%, ${color.spots} 100%, transparent 100%),
                   radial-gradient(circle 2.2px at 25% 70%, ${color.spots} 100%, transparent 100%),
                   radial-gradient(circle 1.5px at 72% 60%, ${color.spots} 100%, transparent 100%),
                   ${color.main}`,
    }
  }
  return { background: color.main }
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
            :class="{
              'picker-option--active': currentType === avatar.type && focusedType !== avatar.type,
              'picker-option--focused': focusedType === avatar.type,
            }"
            @click="focusAvatar(avatar.type)"
          >
            <div class="picker-option__preview" :key="`${avatar.type}-${selectedColors[avatar.type]}`">
              <GamePlayerAvatar :player="{ ...player, avatarType: avatar.type, avatarColor: selectedColors[avatar.type], isTurn: false, folded: false, allIn: false }" />
            </div>
            <div class="picker-option__name">{{ avatar.name }}</div>
            <div v-if="currentType === avatar.type && focusedType !== avatar.type" class="picker-option__check">Actual</div>
          </button>
        </div>

        <Transition name="picker-details">
          <div v-if="focusedType" class="picker-details">
            <div class="picker-details__colors">
              <button
                v-for="color in AVATAR_COLORS[focusedType]"
                :key="color.key"
                class="color-dot"
                :class="{ 'color-dot--active': selectedColors[focusedType] === color.key }"
                :style="getDotStyle(color)"
                :title="color.label"
                @click="pickColor(focusedType, color.key)"
              />
            </div>
            <button class="picker-confirm" @click="confirmSelection">
              Elegir personaje
            </button>
          </div>
        </Transition>
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
  max-width: 420px;
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
  padding: 20px 20px 16px;
  justify-content: center;
}

.picker-option {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 8px;
  padding: 16px 12px 12px;
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
  border-color: rgba(255, 215, 0, 0.5);
}
.picker-option--focused {
  background: rgba(255, 215, 0, 0.12);
  border-color: #ffd700;
  box-shadow: 0 0 20px rgba(255, 215, 0, 0.2), inset 0 0 20px rgba(255, 215, 0, 0.05);
}

.picker-option__preview {
  transform: scale(1.4);
  margin: 12px 0 4px;
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

/* Details panel (colors + confirm button) */
.picker-details {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 14px;
  padding: 0 20px 20px;
}

.picker-details__colors {
  display: flex;
  gap: 8px;
  justify-content: center;
}

.color-dot {
  width: 28px;
  height: 28px;
  border-radius: 50%;
  border: 3px solid rgba(255, 255, 255, 0.12);
  cursor: pointer;
  transition: all 0.2s;
  padding: 0;
}
.color-dot:hover {
  border-color: rgba(255, 255, 255, 0.5);
  transform: scale(1.15);
}
.color-dot--active {
  border-color: #ffd700;
  box-shadow: 0 0 10px rgba(255, 215, 0, 0.5);
  transform: scale(1.1);
}

.picker-confirm {
  width: 100%;
  padding: 10px 20px;
  background: linear-gradient(135deg, #b8860b 0%, #ffd700 50%, #b8860b 100%);
  border: none;
  border-radius: 10px;
  color: #0a0e14;
  font-size: 14px;
  font-weight: 700;
  letter-spacing: 0.5px;
  cursor: pointer;
  transition: all 0.25s;
  text-transform: uppercase;
}
.picker-confirm:hover {
  transform: translateY(-1px);
  box-shadow: 0 4px 16px rgba(255, 215, 0, 0.4);
}
.picker-confirm:active {
  transform: translateY(0);
}

/* Transition */
.picker-details-enter-active {
  transition: all 0.25s cubic-bezier(0.34, 1.56, 0.64, 1);
}
.picker-details-leave-active {
  transition: all 0.15s ease-in;
}
.picker-details-enter-from {
  opacity: 0;
  transform: translateY(-8px);
}
.picker-details-leave-to {
  opacity: 0;
  transform: translateY(-4px);
}

@media (max-width: 768px) {
  .picker-modal {
    width: 94%;
  }
  .picker-option {
    padding: 12px 8px 10px;
  }
  .picker-option__preview {
    transform: scale(1.2);
    margin: 8px 0 4px;
  }
  .color-dot {
    width: 24px;
    height: 24px;
  }
}
</style>

<script setup lang="ts">
import { Timer } from '@lucide/vue'
import type { Player } from '../../types/poker'

const props = defineProps<{
  player: Player
  isActive?: boolean
  isMyself?: boolean
  isWinner?: boolean
  showCards?: boolean
  turnStartedAt?: number
  turnTimer?: number
}>()

const chipColor = computed(() => {
  const chips = props.player.chips
  if (chips >= 2000) return '#ffd700'
  if (chips >= 1000) return '#000'
  if (chips >= 500) return '#0066cc'
  if (chips >= 100) return '#00aa00'
  return '#cc0000'
})

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
  if (props.isActive && props.turnStartedAt) {
    interval = setInterval(updateTimer, 200)
  }
})

onUnmounted(() => {
  if (interval) clearInterval(interval)
})

watch(() => props.isActive, (active) => {
  if (interval) clearInterval(interval)
  if (active && props.turnStartedAt) {
    interval = setInterval(updateTimer, 200)
  }
  updateTimer()
})

watch(() => props.turnStartedAt, () => {
  updateTimer()
})
</script>

<template>
  <div
    class="player-seat"
    :class="{
      'player-seat--active': isActive,
      'player-seat--myself': isMyself,
      'player-seat--folded': player.folded,
      'player-seat--all-in': player.allIn,
      'player-seat--winner': isWinner,
      'player-seat--eliminated': player.chips === 0 && !player.folded && !player.allIn,
    }"
  >
    <GamePlayerAvatar :player="player" :is-myself="isMyself" />

    <div class="player-seat__info">
      <div class="player-seat__name">{{ player.nickname }}</div>
      <div class="player-seat__chips">
        <span class="player-seat__chip-icon" :style="{ background: chipColor }">$</span>
        {{ player.chips.toLocaleString() }}
      </div>
    </div>

    <div v-if="player.bet > 0" class="player-seat__bet">
      <span class="player-seat__bet-chip">$</span>
      {{ player.bet.toLocaleString() }}
    </div>

    <div v-if="showCards && player.hand.length > 0" class="player-seat__showdown-hand">
      <GameCard v-for="(card, i) in player.hand" :key="i" :card="card" small />
    </div>

    <div v-if="player.chips === 0 && !player.allIn" class="player-seat__status player-seat__status--eliminated">Eliminado</div>
    <div v-else-if="player.allIn" class="player-seat__status player-seat__status--all-in">ALL IN</div>
    <div v-else-if="player.folded" class="player-seat__status">Fold</div>
    <div v-if="player.isTurn && !isMyself" class="player-seat__turn-indicator">
      <Timer :size="10" class="player-seat__turn-timer-icon" />
      Turno
    </div>

    <div v-if="player.isTurn && !isMyself && timeLeft > 0" class="player-seat__countdown" :style="{ color: timerColor }">
      {{ timeLeft }}s
    </div>

    <div v-if="!player.isConnected" class="player-seat__disconnected">
      <span class="player-seat__disconnect-icon">⚡</span>
      Desconectado
    </div>
  </div>
</template>

<style scoped>
.player-seat {
  display: flex; flex-direction: column; align-items: center; gap: 3px;
  padding: 8px; border-radius: 10px;
  background: rgba(0, 0, 0, 0.6); border: 2px solid transparent;
  min-width: 70px; max-width: 90px;
  transition: all 0.3s ease; position: relative;
}
.player-seat--active { border-color: #ffd700; box-shadow: 0 0 12px rgba(255, 215, 0, 0.4); }
.player-seat--myself { background: rgba(0, 100, 0, 0.3); border-color: #00aa00; }
.player-seat--folded { opacity: 0.5; }
.player-seat--eliminated { opacity: 0.5; border-color: #666; }
.player-seat--all-in { border-color: #ff4444; box-shadow: 0 0 12px rgba(255, 68, 68, 0.5); }
.player-seat--winner {
  border-color: #ffd700 !important;
  box-shadow:
    0 0 20px rgba(255, 215, 0, 0.6),
    0 0 40px rgba(255, 215, 0, 0.3),
    0 0 60px rgba(255, 215, 0, 0.15) !important;
  animation: winnerGlow 1s ease-in-out infinite alternate;
}

.player-seat__info { text-align: center; }
.player-seat__name { color: white; font-size: 11px; font-weight: 600; white-space: nowrap; overflow: hidden; text-overflow: ellipsis; max-width: 80px; }
.player-seat__chips {
  color: #ffd700; font-size: 10px;
  display: flex; align-items: center; gap: 3px; justify-content: center;
}
.player-seat__chip-icon {
  display: inline-flex; align-items: center; justify-content: center;
  width: 12px; height: 12px; border-radius: 50%;
  color: white; font-size: 8px; font-weight: bold;
}

.player-seat__bet {
  position: absolute; top: -8px; right: -8px;
  background: #ffd700; color: #000; padding: 2px 6px; border-radius: 10px;
  font-size: 10px; font-weight: bold; display: flex; align-items: center; gap: 2px;
}

.player-seat__status { color: #ff6666; font-size: 9px; font-weight: bold; text-transform: uppercase; }
.player-seat__status--all-in { color: #ff4444; font-size: 11px; animation: pulse 1s infinite; }
.player-seat__status--eliminated { color: #888; font-size: 9px; background: rgba(255,255,255,0.06); padding: 2px 6px; border-radius: 6px; }
.player-seat__turn-indicator { color: #00ff00; font-size: 9px; font-weight: bold; animation: pulse 1s infinite; display: flex; align-items: center; gap: 3px; }
.player-seat__turn-timer-icon { animation: spin 2s linear infinite; }
.player-seat__countdown { color: #ef4444; font-size: 10px; font-weight: 700; font-variant-numeric: tabular-nums; animation: timerPulse 1s ease-in-out infinite; }

@keyframes spin { from { transform: rotate(0deg); } to { transform: rotate(360deg); } }
@keyframes timerPulse { 0%, 100% { opacity: 1; } 50% { opacity: 0.5; } }
.player-seat__disconnected {
  color: #f59e0b;
  font-size: 9px;
  font-weight: 600;
  display: flex;
  align-items: center;
  gap: 3px;
  animation: disconnectPulse 1.5s ease-in-out infinite;
}

.player-seat__disconnect-icon {
  font-size: 10px;
}

.player-seat__showdown-hand {
  display: flex;
  gap: 2px;
  justify-content: center;
  animation: revealCards 0.4s ease-out;
}

@keyframes revealCards {
  from { opacity: 0; transform: scale(0.8) translateY(-4px); }
  to { opacity: 1; transform: scale(1) translateY(0); }
}

@keyframes disconnectPulse {
  0%, 100% { opacity: 0.5; }
  50% { opacity: 1; }
}

@keyframes pulse { 0%, 100% { opacity: 1; } 50% { opacity: 0.5; } }
@keyframes winnerGlow {
  0% { box-shadow: 0 0 20px rgba(255, 215, 0, 0.6), 0 0 40px rgba(255, 215, 0, 0.3); }
  100% { box-shadow: 0 0 30px rgba(255, 215, 0, 0.8), 0 0 60px rgba(255, 215, 0, 0.4), 0 0 80px rgba(255, 215, 0, 0.2); }
}

@media (max-width: 768px) {
  .player-seat {
    padding: 5px;
    min-width: 56px;
    max-width: 70px;
    gap: 2px;
  }
  .player-seat__name { font-size: 9px; max-width: 60px; }
  .player-seat__chips { font-size: 9px; }
  .player-seat__chip-icon { width: 10px; height: 10px; font-size: 7px; }
  .player-seat__bet { font-size: 8px; padding: 1px 4px; top: -6px; right: -6px; }
  .player-seat__status { font-size: 8px; }
  .player-seat__status--all-in { font-size: 9px; }
  .player-seat__turn-indicator { font-size: 8px; }
}
</style>

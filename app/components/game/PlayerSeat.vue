<script setup lang="ts">
import type { Player } from '../../types/poker'

const props = defineProps<{
  player: Player
  isActive?: boolean
  isMyself?: boolean
}>()

const chipColor = computed(() => {
  const chips = props.player.chips
  if (chips >= 2000) return '#ffd700'
  if (chips >= 1000) return '#000'
  if (chips >= 500) return '#0066cc'
  if (chips >= 100) return '#00aa00'
  return '#cc0000'
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

    <div v-if="player.folded" class="player-seat__status">Fold</div>
    <div v-if="player.allIn" class="player-seat__status player-seat__status--all-in">ALL IN</div>
    <div v-if="player.isTurn && !isMyself" class="player-seat__turn-indicator">Turno</div>

    <div v-if="!player.isConnected" class="player-seat__disconnected">Desconectado</div>
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
.player-seat--all-in { border-color: #ff4444; box-shadow: 0 0 12px rgba(255, 68, 68, 0.5); }

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
.player-seat__turn-indicator { color: #00ff00; font-size: 9px; font-weight: bold; animation: pulse 1s infinite; }
.player-seat__disconnected { color: #666; font-size: 9px; font-style: italic; }

@keyframes pulse { 0%, 100% { opacity: 1; } 50% { opacity: 0.5; } }
</style>

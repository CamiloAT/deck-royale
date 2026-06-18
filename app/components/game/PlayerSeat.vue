<script setup lang="ts">
import type { Player } from '../../types/poker'

const props = defineProps<{
  player: Player
  isActive?: boolean
  isMyself?: boolean
}>()

const chipColor = computed(() => {
  const chips = props.player.chips
  if (chips >= 1000) return '#ffd700'
  if (chips >= 500) return '#000'
  if (chips >= 100) return '#0066cc'
  if (chips >= 25) return '#00aa00'
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
    <div class="player-seat__avatar">
      <span class="player-seat__initial">{{ player.nickname.charAt(0).toUpperCase() }}</span>
      <div v-if="player.isDealer" class="player-seat__dealer">D</div>
    </div>

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
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 6px;
  padding: 12px;
  border-radius: 12px;
  background: rgba(0, 0, 0, 0.5);
  border: 2px solid transparent;
  min-width: 100px;
  transition: all 0.3s ease;
  position: relative;
}
.player-seat--active { border-color: #ffd700; box-shadow: 0 0 15px rgba(255, 215, 0, 0.4); }
.player-seat--myself { background: rgba(0, 100, 0, 0.3); border-color: #00aa00; }
.player-seat--folded { opacity: 0.5; }
.player-seat--all-in { border-color: #ff4444; box-shadow: 0 0 15px rgba(255, 68, 68, 0.5); }

.player-seat__avatar {
  width: 48px; height: 48px; border-radius: 50%;
  background: linear-gradient(135deg, #667eea, #764ba2);
  display: flex; align-items: center; justify-content: center;
  position: relative;
}
.player-seat__initial { color: white; font-size: 20px; font-weight: bold; }
.player-seat__dealer {
  position: absolute; bottom: -4px; right: -4px;
  width: 20px; height: 20px; border-radius: 50%;
  background: #ffd700; color: #000; font-size: 10px; font-weight: bold;
  display: flex; align-items: center; justify-content: center;
}

.player-seat__info { text-align: center; }
.player-seat__name { color: white; font-size: 14px; font-weight: 600; }
.player-seat__chips {
  color: #ffd700; font-size: 12px;
  display: flex; align-items: center; gap: 4px;
}
.player-seat__chip-icon {
  display: inline-flex; align-items: center; justify-content: center;
  width: 14px; height: 14px; border-radius: 50%;
  color: white; font-size: 10px; font-weight: bold;
}

.player-seat__bet {
  position: absolute; top: -10px; right: -10px;
  background: #ffd700; color: #000; padding: 4px 8px; border-radius: 12px;
  font-size: 12px; font-weight: bold; display: flex; align-items: center; gap: 2px;
}

.player-seat__status { color: #ff6666; font-size: 11px; font-weight: bold; text-transform: uppercase; }
.player-seat__status--all-in { color: #ff4444; font-size: 14px; animation: pulse 1s infinite; }
.player-seat__turn-indicator { color: #00ff00; font-size: 11px; font-weight: bold; animation: pulse 1s infinite; }
.player-seat__disconnected { color: #666; font-size: 10px; font-style: italic; }

@keyframes pulse { 0%, 100% { opacity: 1; } 50% { opacity: 0.5; } }
</style>

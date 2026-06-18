<script setup lang="ts">
import type { Room } from '../../types/poker'

const props = defineProps<{
  room: Room
  currentPlayerId: string
}>()

const emit = defineEmits<{
  (e: 'start'): void
  (e: 'leave'): void
}>()

const isHost = computed(() =>
  props.room.players.length > 0 && props.room.players[0].id === props.currentPlayerId
)

const canStart = computed(() => props.room.players.length >= 2)

function copyCode() {
  navigator.clipboard.writeText(props.room.id)
}
</script>

<template>
  <div class="waiting-room">
    <div class="waiting-room__card">
      <div class="waiting-room__header">
        <h2>Sala de Espera</h2>
        <div class="waiting-room__code" @click="copyCode" title="Copiar codigo">
          <span class="waiting-room__code-label">Codigo:</span>
          <span class="waiting-room__code-value">{{ room.id }}</span>
          <span class="waiting-room__copy">📋</span>
        </div>
      </div>

      <div class="waiting-room__info">
        <div class="waiting-room__detail">
          <span>Small Blind:</span>
          <span>${{ room.smallBlind }}</span>
        </div>
        <div class="waiting-room__detail">
          <span>Big Blind:</span>
          <span>${{ room.bigBlind }}</span>
        </div>
        <div class="waiting-room__detail">
          <span>Buy-In:</span>
          <span>${{ room.minBuyIn.toLocaleString() }}</span>
        </div>
      </div>

      <div class="waiting-room__players">
        <h3>Jugadores ({{ room.players.length }}/{{ room.maxPlayers }})</h3>
        <div class="waiting-room__player-list">
          <div
            v-for="(player, index) in room.players"
            :key="player.id"
            class="waiting-room__player"
          >
            <div class="waiting-room__player-avatar">
              {{ player.nickname.charAt(0).toUpperCase() }}
            </div>
            <span class="waiting-room__player-name">{{ player.nickname }}</span>
            <span v-if="index === 0" class="waiting-room__host-badge">Host</span>
          </div>
        </div>
      </div>

      <div class="waiting-room__actions">
        <button
          v-if="isHost"
          class="waiting-room__btn waiting-room__btn--start"
          @click="emit('start')"
          :disabled="!canStart"
        >
          Iniciar Partida
        </button>
        <div v-else class="waiting-room__waiting">
          Esperando que el host inicie la partida...
        </div>
        <button class="waiting-room__btn waiting-room__btn--leave" @click="emit('leave')">
          Salir
        </button>
      </div>
    </div>
  </div>
</template>

<style scoped>
.waiting-room { min-height: 100vh; display: flex; align-items: center; justify-content: center; padding: 20px; }
.waiting-room__card {
  background: rgba(0, 0, 0, 0.8); border: 1px solid rgba(255, 215, 0, 0.2);
  border-radius: 16px; padding: 32px; width: 100%; max-width: 500px;
}
.waiting-room__header { text-align: center; margin-bottom: 24px; }
.waiting-room__header h2 { color: white; margin: 0 0 16px 0; font-size: 24px; }
.waiting-room__code {
  display: flex; align-items: center; justify-content: center; gap: 8px;
  cursor: pointer; padding: 8px; border-radius: 8px; transition: background 0.2s;
}
.waiting-room__code:hover { background: rgba(255, 255, 255, 0.05); }
.waiting-room__code-label { color: #888; font-size: 14px; }
.waiting-room__code-value { color: #ffd700; font-size: 28px; font-weight: bold; letter-spacing: 4px; font-family: monospace; }
.waiting-room__copy { font-size: 16px; }

.waiting-room__info { background: rgba(255, 255, 255, 0.05); border-radius: 8px; padding: 16px; margin-bottom: 24px; }
.waiting-room__detail { display: flex; justify-content: space-between; color: #aaa; font-size: 14px; padding: 6px 0; }
.waiting-room__detail span:last-child { color: white; font-weight: 600; }

.waiting-room__players h3 { color: white; font-size: 16px; margin: 0 0 16px 0; }
.waiting-room__player-list { display: flex; flex-direction: column; gap: 8px; }
.waiting-room__player {
  display: flex; align-items: center; gap: 12px;
  padding: 12px; background: rgba(255, 255, 255, 0.05); border-radius: 8px;
}
.waiting-room__player-avatar {
  width: 36px; height: 36px; border-radius: 50%;
  background: linear-gradient(135deg, #667eea, #764ba2);
  display: flex; align-items: center; justify-content: center;
  color: white; font-weight: bold;
}
.waiting-room__player-name { color: white; font-size: 16px; }
.waiting-room__host-badge {
  margin-left: auto; background: #ffd700; color: #000;
  padding: 2px 8px; border-radius: 4px; font-size: 11px; font-weight: bold; text-transform: uppercase;
}

.waiting-room__actions { margin-top: 24px; display: flex; flex-direction: column; gap: 12px; }
.waiting-room__btn {
  padding: 14px 24px; border: none; border-radius: 8px;
  font-size: 16px; font-weight: 600; cursor: pointer; transition: all 0.2s;
}
.waiting-room__btn:disabled { opacity: 0.5; cursor: not-allowed; }
.waiting-room__btn--start {
  background: linear-gradient(135deg, #00aa00, #00cc00); color: white;
}
.waiting-room__btn--start:hover:not(:disabled) { transform: translateY(-2px); box-shadow: 0 4px 16px rgba(0, 170, 0, 0.4); }
.waiting-room__btn--leave { background: rgba(255, 255, 255, 0.1); color: #ff6666; }
.waiting-room__waiting { color: #888; text-align: center; font-style: italic; padding: 14px; }
</style>

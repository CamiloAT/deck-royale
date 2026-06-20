<script setup lang="ts">
import { Copy, Check, Spade, Heart, Diamond, Club, Play, LogOut, Users, Settings } from '@lucide/vue'
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

const copied = ref(false)

async function copyCode() {
  try {
    await navigator.clipboard.writeText(props.room.id)
    copied.value = true
    setTimeout(() => { copied.value = false }, 2000)
  } catch {
    const input = document.createElement('input')
    input.value = props.room.id
    document.body.appendChild(input)
    input.select()
    document.execCommand('copy')
    document.body.removeChild(input)
    copied.value = true
    setTimeout(() => { copied.value = false }, 2000)
  }
}

const suitComponents = [Spade, Heart, Diamond, Club]

const particles = Array.from({ length: 18 }, (_, i) => {
  const suitIndex = i % 4
  const left = (i * 17.3) % 100
  const delay = (i * 1.7) % 8
  const duration = 8 + (i % 5) * 2
  const size = 14 + (i % 4) * 6
  const isRed = suitIndex === 1 || suitIndex === 2
  return {
    component: suitComponents[suitIndex],
    style: {
      left: `${left}%`,
      animationDelay: `${delay}s`,
      animationDuration: `${duration}s`,
      color: isRed ? 'rgba(255, 80, 80, 0.15)' : 'rgba(255, 215, 0, 0.12)',
    },
    size,
  }
})
</script>

<template>
  <div class="waiting-room">
    <div class="waiting-room__particles">
      <component
        v-for="(p, idx) in particles"
        :key="idx"
        :is="p.component"
        :size="p.size"
        class="waiting-room__particle"
        :style="p.style"
      />
    </div>

    <div class="waiting-room__card">
      <div class="waiting-room__header">
        <div class="waiting-room__suits">
          <Spade :size="20" class="waiting-room__suit waiting-room__suit--spade" />
          <Heart :size="20" class="waiting-room__suit waiting-room__suit--heart" />
          <Diamond :size="20" class="waiting-room__suit waiting-room__suit--diamond" />
          <Club :size="20" class="waiting-room__suit waiting-room__suit--club" />
        </div>
        <h2 class="waiting-room__title">Sala de Espera</h2>
        <div class="waiting-room__divider">
          <span class="waiting-room__divider-line"></span>
          <Spade :size="12" class="waiting-room__divider-icon" />
          <span class="waiting-room__divider-line"></span>
        </div>

        <div class="waiting-room__code" @click="copyCode" title="Copiar codigo">
          <span class="waiting-room__code-label">Codigo:</span>
          <span class="waiting-room__code-value">{{ room.id }}</span>
          <span class="waiting-room__copy">
            <Check v-if="copied" :size="16" class="waiting-room__copy-icon waiting-room__copy-icon--check" />
            <Copy v-else :size="16" class="waiting-room__copy-icon" />
          </span>
        </div>
      </div>

      <div class="waiting-room__info">
        <div class="waiting-room__detail">
          <span class="waiting-room__detail-label"><Settings :size="14" /> Small Blind</span>
          <span>${{ room.smallBlind }}</span>
        </div>
        <div class="waiting-room__detail">
          <span class="waiting-room__detail-label"><Settings :size="14" /> Big Blind</span>
          <span>${{ room.bigBlind }}</span>
        </div>
        <div class="waiting-room__detail">
          <span class="waiting-room__detail-label"><Settings :size="14" /> Buy-In</span>
          <span>${{ room.minBuyIn.toLocaleString() }}</span>
        </div>
      </div>

      <div class="waiting-room__players">
        <h3 class="waiting-room__players-title"><Users :size="16" /> Jugadores ({{ room.players.length }}/{{ room.maxPlayers }})</h3>
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
          <Play :size="18" />
          Iniciar Partida
        </button>
        <div v-else class="waiting-room__waiting">
          Esperando que el host inicie la partida...
        </div>
        <button class="waiting-room__btn waiting-room__btn--leave" @click="emit('leave')">
          <LogOut :size="16" />
          Salir
        </button>
      </div>
    </div>
  </div>
</template>

<style scoped>
.waiting-room {
  min-height: 100vh;
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 20px;
  overflow: hidden;
  position: relative;
}

/* ── Particulas de fondo ── */
.waiting-room__particles {
  position: fixed;
  inset: 0;
  pointer-events: none;
  z-index: 0;
}
.waiting-room__particle {
  position: absolute;
  bottom: -40px;
  animation: float 8s ease-in-out infinite;
  pointer-events: none;
}

/* ── Card principal ── */
.waiting-room__card {
  position: relative;
  z-index: 1;
  background: rgba(10, 10, 20, 0.85);
  border-radius: 20px;
  padding: 44px 40px 36px;
  width: 100%;
  max-width: 480px;
  backdrop-filter: blur(24px);
  animation: fadeInUp 0.6s ease-out;
  border: 1px solid rgba(255, 215, 0, 0.15);
  box-shadow: 0 20px 60px rgba(0, 0, 0, 0.5);
}

/* ── Header ── */
.waiting-room__header {
  text-align: center;
  margin-bottom: 32px;
  animation: fadeIn 0.8s ease-out 0.2s both;
}
.waiting-room__suits {
  display: flex;
  justify-content: center;
  gap: 12px;
  margin-bottom: 16px;
}
.waiting-room__suit { transition: transform 0.3s; }
.waiting-room__suit--spade { color: #e0e0e0; }
.waiting-room__suit--heart { color: #ff4d4d; }
.waiting-room__suit--diamond { color: #ffd700; }
.waiting-room__suit--club { color: #4da6ff; }
.waiting-room__suits:hover .waiting-room__suit { transform: scale(1.2); }

.waiting-room__title {
  margin: 0 0 12px 0;
  font-size: 28px;
  font-family: 'Georgia', serif;
  letter-spacing: 2px;
  line-height: 1;
  color: white;
  font-weight: 400;
}

.waiting-room__divider {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 12px;
  margin: 12px 0 20px 0;
}
.waiting-room__divider-line {
  width: 50px;
  height: 1px;
  background: linear-gradient(90deg, transparent, rgba(255, 215, 0, 0.4), transparent);
}
.waiting-room__divider-icon {
  color: rgba(255, 215, 0, 0.4);
}

/* ── Codigo ── */
.waiting-room__code {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 10px;
  cursor: pointer;
  padding: 10px 16px;
  border-radius: 10px;
  transition: background 0.2s;
  background: rgba(255, 255, 255, 0.04);
  border: 1px solid rgba(255, 255, 255, 0.06);
}
.waiting-room__code:hover { background: rgba(255, 255, 255, 0.08); }
.waiting-room__code-label { color: #666; font-size: 13px; letter-spacing: 1px; text-transform: uppercase; }
.waiting-room__code-value { color: #ffd700; font-size: 22px; font-weight: bold; letter-spacing: 4px; font-family: monospace; }
.waiting-room__copy { display: flex; align-items: center; }
.waiting-room__copy-icon { color: #666; transition: color 0.2s; }
.waiting-room__copy-icon--check { color: #00cc00; }

/* ── Info section ── */
.waiting-room__info {
  background: rgba(255, 255, 255, 0.04);
  border: 1px solid rgba(255, 255, 255, 0.06);
  border-radius: 12px;
  padding: 16px;
  margin-bottom: 24px;
  animation: fadeIn 0.8s ease-out 0.4s both;
}
.waiting-room__detail {
  display: flex;
  justify-content: space-between;
  align-items: center;
  color: #aaa;
  font-size: 14px;
  padding: 8px 0;
}
.waiting-room__detail + .waiting-room__detail {
  border-top: 1px solid rgba(255, 255, 255, 0.05);
}
.waiting-room__detail-label {
  display: flex;
  align-items: center;
  gap: 8px;
  color: #777;
  font-size: 12px;
  text-transform: uppercase;
  letter-spacing: 1px;
}
.waiting-room__detail span:last-child { color: white; font-weight: 600; }

/* ── Jugadores ── */
.waiting-room__players {
  margin-bottom: 24px;
  animation: fadeIn 0.8s ease-out 0.5s both;
}
.waiting-room__players-title {
  display: flex;
  align-items: center;
  gap: 8px;
  color: white;
  font-size: 14px;
  font-weight: 500;
  margin: 0 0 16px 0;
  letter-spacing: 1px;
  text-transform: uppercase;
}
.waiting-room__player-list { display: flex; flex-direction: column; gap: 8px; }
.waiting-room__player {
  display: flex;
  align-items: center;
  gap: 12px;
  padding: 12px;
  background: rgba(255, 255, 255, 0.04);
  border: 1px solid rgba(255, 255, 255, 0.06);
  border-radius: 10px;
  transition: background 0.2s;
}
.waiting-room__player:hover { background: rgba(255, 255, 255, 0.07); }
.waiting-room__player-avatar {
  width: 36px;
  height: 36px;
  border-radius: 50%;
  background: linear-gradient(135deg, #ffd700, #e6a800);
  display: flex;
  align-items: center;
  justify-content: center;
  color: #1a1a00;
  font-weight: bold;
  font-size: 14px;
  flex-shrink: 0;
}
.waiting-room__player-name { color: white; font-size: 15px; }
.waiting-room__host-badge {
  margin-left: auto;
  background: rgba(255, 215, 0, 0.15);
  color: #ffd700;
  padding: 3px 10px;
  border-radius: 6px;
  font-size: 11px;
  font-weight: 600;
  text-transform: uppercase;
  letter-spacing: 0.5px;
  border: 1px solid rgba(255, 215, 0, 0.2);
}

/* ── Acciones ── */
.waiting-room__actions {
  margin-top: 8px;
  display: flex;
  flex-direction: column;
  gap: 12px;
  animation: fadeIn 0.8s ease-out 0.6s both;
}
.waiting-room__btn {
  padding: 14px 24px;
  border: none;
  border-radius: 10px;
  font-size: 16px;
  font-weight: 600;
  cursor: pointer;
  transition: all 0.3s;
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 8px;
}
.waiting-room__btn:disabled { opacity: 0.4; cursor: not-allowed; }
.waiting-room__btn--start {
  background: linear-gradient(135deg, #ffd700, #e6a800);
  color: #1a1a00;
  box-shadow: 0 4px 20px rgba(255, 215, 0, 0.2);
}
.waiting-room__btn--start:hover:not(:disabled) {
  transform: translateY(-2px);
  box-shadow: 0 6px 28px rgba(255, 215, 0, 0.35);
}
.waiting-room__btn--start:active:not(:disabled) { transform: translateY(0); }
.waiting-room__btn--leave {
  background: transparent;
  color: #555;
  font-size: 14px;
  padding: 8px;
}
.waiting-room__btn--leave:hover { color: #aaa; }
.waiting-room__waiting {
  color: #555;
  text-align: center;
  font-style: italic;
  padding: 14px;
  font-size: 14px;
  letter-spacing: 0.5px;
}
</style>

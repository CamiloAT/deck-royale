<script setup lang="ts">
import { Crown, Diamond, Heart, Club, Spade, Clock, LogOut, Flag, HelpCircle, EyeOff, Eye, Timer } from '@lucide/vue'
import type { GameState } from '../../types/poker'

const props = defineProps<{
  gameState: GameState
  myPlayerId: string
}>()

const emit = defineEmits<{
  (e: 'action', action: string, amount?: number): void
  (e: 'leave'): void
}>()

const { state, endGame, showdownSkip } = useGame()

const myPlayer = computed(() =>
  props.gameState.players.find(p => p.id === props.myPlayerId)
)

const isHost = computed(() => props.gameState.hostId === props.myPlayerId)
const canEndGame = computed(() => isHost.value && props.gameState.canEndHand)
const showEndGameConfirm = ref(false)
const endGameError = ref('')

async function handleEndGame() {
  const result = await endGame()
  if ('error' in result) {
    endGameError.value = result.error
  } else {
    showEndGameConfirm.value = false
    endGameError.value = ''
  }
}

async function handleSkip() {
  await showdownSkip()
}

const otherPlayers = computed(() =>
  props.gameState.players.filter(p => p.id !== props.myPlayerId)
)

const totalPot = computed(() =>
  props.gameState.pots.reduce((sum, pot) => sum + pot.amount, 0)
)

const myHand = computed(() => myPlayer.value?.hand ?? [])

const canCheck = computed(() => {
  if (!myPlayer.value) return false
  return myPlayer.value.bet >= props.gameState.currentBet
})

const minRaise = computed(() => 1)

const currentTurnPlayer = computed(() =>
  props.gameState.players.find(p => p.isTurn)
)

const isMyTurn = computed(() => myPlayer.value?.isTurn ?? false)

const turnDurationMs = computed(() => (props.gameState.turnTimer ?? 60) * 1000)
const turnTimeLeft = ref(0)
const turnPercentage = ref(100)

function updateTurnTimer() {
  if (!props.gameState.turnStartedAt) { turnTimeLeft.value = 0; turnPercentage.value = 0; return }
  const elapsed = Date.now() - props.gameState.turnStartedAt
  const remaining = Math.max(0, turnDurationMs.value - elapsed)
  turnTimeLeft.value = Math.ceil(remaining / 1000)
  turnPercentage.value = Math.max(0, (remaining / turnDurationMs.value) * 100)
}

const turnColor = computed(() => {
  if (turnTimeLeft.value <= 10) return { bg: 'rgba(239, 68, 68, 0.15)', border: 'rgba(239, 68, 68, 0.5)', text: '#ef4444' }
  if (turnTimeLeft.value <= 20) return { bg: 'rgba(245, 158, 11, 0.12)', border: 'rgba(245, 158, 11, 0.4)', text: '#f59e0b' }
  return { bg: 'rgba(34, 197, 94, 0.1)', border: 'rgba(34, 197, 94, 0.35)', text: '#22c55e' }
})

const turnPulseSpeed = computed(() => {
  if (turnTimeLeft.value <= 5) return '0.4s'
  if (turnTimeLeft.value <= 10) return '0.7s'
  if (turnTimeLeft.value <= 20) return '1.2s'
  return '2.5s'
})

let turnInterval: ReturnType<typeof setInterval> | null = null

onMounted(() => {
  updateTurnTimer()
  turnInterval = setInterval(updateTurnTimer, 100)
})
onUnmounted(() => { if (turnInterval) clearInterval(turnInterval) })
watch(() => props.gameState.turnStartedAt, () => updateTurnTimer())

const latestHandResult = computed(() => {
  const history = props.gameState.handHistory
  if (!history || history.length === 0) return null
  return history[history.length - 1]
})

const showReveal = ref(false)
const showLeaveModal = ref(false)
const showHelpModal = ref(false)
const cardsHidden = ref(true)

watch(() => props.gameState.handNumber, () => {
  cardsHidden.value = true
})

watch(() => props.gameState.phase, (phase) => {
  if (phase === 'showdown' && latestHandResult.value) {
    showReveal.value = true
  }
}, { immediate: true })
</script>

<template>
  <GameShowdownReveal
    v-if="showReveal && latestHandResult"
    :players="gameState.players"
    :winners="latestHandResult.winners"
    :community-cards="latestHandResult.communityCards"
    :countdown-end-at="state.showdownTimerEndAt"
    :skip-count="state.showdownSkipCount"
    :skip-total="state.showdownSkipTotal"
    :my-skipped="state.mySkippedShowdown"
    @done="showReveal = false"
    @skip="handleSkip"
  />
  <div class="poker-table" :class="{ 'poker-table--my-turn': isMyTurn && gameState.phase !== 'waiting' && gameState.phase !== 'showdown', 'poker-table--turn-urgent': isMyTurn && turnTimeLeft <= 10 && gameState.phase !== 'waiting' && gameState.phase !== 'showdown' }">
    <!-- Help button -->
    <button class="poker-table__help" @click="showHelpModal = true" title="Reglas de poker">
      <HelpCircle :size="16" />
    </button>

    <!-- End game button (host only) -->
    <button v-if="canEndGame" class="poker-table__end-game" @click="showEndGameConfirm = true" title="Terminar partida">
      <Flag :size="16" />
    </button>

    <!-- Leave button -->
    <button class="poker-table__leave" @click="showLeaveModal = true" title="Salir de la partida">
      <LogOut :size="16" />
    </button>

    <!-- Other players at the top -->
    <div class="poker-table__opponents">
      <GamePlayerSeat
        v-for="player in otherPlayers"
        :key="player.id"
        :player="player"
        :is-active="player.isTurn"
        :is-myself="false"
        :is-winner="latestHandResult?.winners?.some(w => w.winnerId === player.id) && gameState.phase === 'showdown'"
        :show-cards="gameState.phase === 'showdown' && !player.folded"
        :turn-started-at="player.isTurn ? gameState.turnStartedAt : undefined"
        :turn-timer="player.isTurn ? gameState.turnTimer : undefined"
      />
    </div>

    <!-- Table surface -->
    <div class="poker-table__surface" :class="{ 'poker-table__surface--my-turn': isMyTurn && gameState.phase !== 'waiting' && gameState.phase !== 'showdown' }">
      <div class="poker-table__felt">
        <!-- Corner suit decorations -->
        <div class="poker-table__suit-suites">
          <Spade :size="28" class="poker-table__corner-icon poker-table__corner-icon--tl" />
          <Heart :size="28" class="poker-table__corner-icon poker-table__corner-icon--tr" />
          <Club :size="28" class="poker-table__corner-icon poker-table__corner-icon--bl" />
          <Diamond :size="28" class="poker-table__corner-icon poker-table__corner-icon--br" />
        </div>

        <!-- Brand -->
        <div class="poker-table__brand">
          <div class="poker-table__brand-line">
            <span class="poker-table__suit-inline"><Spade :size="12" /></span>
            <span class="poker-table__suit-inline"><Heart :size="12" /></span>
            <span class="poker-table__suit-inline"><Club :size="12" /></span>
            <span class="poker-table__suit-inline"><Diamond :size="12" /></span>
          </div>
          <div class="poker-table__brand-title">
            <Crown :size="18" class="poker-table__crown" />
            DECK ROYALE
          </div>
          <div class="poker-table__brand-line">
            <span class="poker-table__suit-inline"><Diamond :size="12" /></span>
            <span class="poker-table__suit-inline"><Club :size="12" /></span>
            <span class="poker-table__suit-inline"><Heart :size="12" /></span>
            <span class="poker-table__suit-inline"><Spade :size="12" /></span>
          </div>
        </div>

        <GameCommunityCards :cards="gameState.communityCards" />
        <GamePotDisplay :amount="totalPot" />
      </div>
    </div>

    <!-- My area at the bottom - eliminated view -->
    <div v-if="myPlayer && myPlayer.chips === 0 && !myPlayer.allIn && gameState.phase !== 'showdown'" class="poker-table__my-area">
      <GamePlayerSeat
        :player="myPlayer"
        :is-active="false"
        :is-myself="true"
        :is-winner="false"
      />

      <div class="poker-table__eliminated">
        <div class="poker-table__eliminated-text">Has sido eliminado de esta partida</div>
        <div class="poker-table__eliminated-sub">Puedes seguir observando la partida</div>
        <button class="poker-table__eliminated-btn" @click="showLeaveModal = true">Salir al lobby</button>
      </div>
    </div>

    <!-- My area at the bottom - active view -->
    <div v-else-if="myPlayer" class="poker-table__my-area">
      <div class="poker-table__my-info">
        <GamePlayerSeat
          :player="myPlayer"
          :is-active="myPlayer.isTurn"
          :is-myself="true"
          :is-winner="latestHandResult?.winners?.some(w => w.winnerId === myPlayer.id) && gameState.phase === 'showdown'"
        />
        <GameHandCards :cards="myHand" :face-down="cardsHidden" />
        <button class="poker-table__hide-cards" @click="cardsHidden = !cardsHidden" :title="cardsHidden ? 'Mostrar cartas' : 'Ocultar cartas'">
          <EyeOff v-if="!cardsHidden" :size="14" />
          <Eye v-else :size="14" />
        </button>
      </div>

      <div v-if="isMyTurn && gameState.phase !== 'waiting' && gameState.phase !== 'showdown'" class="poker-table__turn-pill" :style="{ background: turnColor.bg, borderColor: turnColor.border, animationDuration: turnPulseSpeed }">
        <span class="poker-table__turn-pill-text" :style="{ color: turnColor.text }">TU TURNO</span>
        <span class="poker-table__turn-pill-sep" :style="{ background: turnColor.text }"></span>
        <Timer :size="13" :style="{ color: turnColor.text }" />
        <span class="poker-table__turn-pill-time" :style="{ color: turnColor.text }">{{ turnTimeLeft }}s</span>
      </div>

      <div v-if="!isMyTurn && gameState.phase !== 'waiting' && gameState.phase !== 'showdown'" class="poker-table__turn-info">
        <Clock :size="14" />
        Turno de {{ currentTurnPlayer?.nickname ?? '...' }} — espera tu turno
      </div>

      <GameBetControls
        v-if="!myPlayer.folded && gameState.phase !== 'showdown' && gameState.phase !== 'waiting'"
        :current-bet="gameState.currentBet"
        :min-raise="minRaise"
        :player-chips="myPlayer.chips"
        :player-bet="myPlayer.bet"
        :can-check="canCheck"
        :disabled="!isMyTurn"
        @action="(action, amount) => emit('action', action, amount)"
      />
    </div>
  </div>

  <!-- Leave confirmation modal -->
  <Teleport to="body">
    <div v-if="showLeaveModal" class="leave-modal">
      <div class="leave-modal__card">
        <div class="leave-modal__title">Salir de la partida</div>
        <div class="leave-modal__text">Estas seguro que quieres salir de la sala?</div>
        <div class="leave-modal__actions">
          <button class="leave-modal__btn leave-modal__btn--cancel" @click="showLeaveModal = false">Cancelar</button>
          <button class="leave-modal__btn leave-modal__btn--confirm" @click="emit('leave')">Salir</button>
        </div>
      </div>
    </div>
  </Teleport>

  <!-- End game confirmation modal -->
  <Teleport to="body">
    <div v-if="showEndGameConfirm" class="leave-modal">
      <div class="leave-modal__card">
        <div class="leave-modal__title">Terminar partida</div>
        <div class="leave-modal__text">Quieres terminar la partida? Se devolverán las ciegas y se mostrarán las estadísticas finales.</div>
        <div v-if="endGameError" class="leave-modal__error">{{ endGameError }}</div>
        <div class="leave-modal__actions">
          <button class="leave-modal__btn leave-modal__btn--cancel" @click="showEndGameConfirm = false; endGameError = ''">Cancelar</button>
          <button class="leave-modal__btn leave-modal__btn--confirm" @click="handleEndGame">Terminar</button>
        </div>
      </div>
    </div>
  </Teleport>

  <!-- Help modal -->
  <GameHelpModal
    v-if="showHelpModal"
    :turn-started-at="isMyTurn ? gameState.turnStartedAt : undefined"
    :turn-timer="isMyTurn ? gameState.turnTimer : undefined"
    @close="showHelpModal = false"
  />
</template>

<style scoped>
.poker-table {
  width: 100%;
  height: 100vh;
  max-height: 100vh;
  overflow: hidden;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: space-between;
  padding: 12px 16px;
  gap: 8px;
  position: relative;
  transition: background 0.5s ease;
}

.poker-table--my-turn {
  background: radial-gradient(ellipse at center bottom, rgba(255, 215, 0, 0.07) 0%, rgba(255, 215, 0, 0.02) 40%, transparent 65%);
}

.poker-table--turn-urgent {
  animation: bgPulse 1s ease-in-out infinite;
}

@keyframes bgPulse {
  0%, 100% {
    background: radial-gradient(ellipse at center bottom, rgba(255, 215, 0, 0.07) 0%, rgba(255, 215, 0, 0.02) 40%, transparent 65%);
  }
  50% {
    background: radial-gradient(ellipse at center bottom, rgba(239, 68, 68, 0.08) 0%, rgba(239, 68, 68, 0.03) 40%, transparent 65%);
  }
}

.poker-table__turn-pill {
  display: flex;
  align-items: center;
  gap: 6px;
  padding: 5px 12px;
  border: 1px solid;
  border-radius: 8px;
  backdrop-filter: blur(8px);
  animation: pillPulse 2.5s ease-in-out infinite;
  transition: background 0.3s, border-color 0.3s;
}

.poker-table__turn-pill-text {
  font-size: 11px;
  font-weight: 800;
  letter-spacing: 2px;
}

.poker-table__turn-pill-sep {
  width: 1px;
  height: 12px;
  opacity: 0.3;
}

.poker-table__turn-pill-time {
  font-size: 12px;
  font-weight: 700;
  font-variant-numeric: tabular-nums;
}

@keyframes pillPulse {
  0%, 100% { opacity: 0.7; }
  50% { opacity: 1; }
}

.poker-table__opponents {
  display: flex;
  gap: 10px;
  flex-wrap: wrap;
  justify-content: center;
  width: 100%;
}

.poker-table__surface {
  width: 90%;
  max-width: 700px;
  flex-shrink: 1;
  transition: filter 0.4s ease;
}

.poker-table__surface--my-turn .poker-table__felt {
  border-color: #5c3a1a;
  box-shadow:
    inset 0 0 60px rgba(0, 0, 0, 0.5),
    inset 0 0 120px rgba(0, 0, 0, 0.2),
    inset 0 0 0 1.5px #d4a520,
    0 0 0 1.5px #d4a520,
    0 0 20px rgba(0, 0, 0, 0.6),
    0 0 40px rgba(92, 58, 26, 0.3);
}

.poker-table__felt {
  width: 100%;
  aspect-ratio: 2.2 / 1;
  background:
    radial-gradient(ellipse at center, rgba(26, 92, 42, 0.9) 0%, rgba(13, 61, 26, 0.95) 50%, rgba(10, 45, 18, 1) 100%);
  border-radius: 140px;
  border: 6px solid #5c3a1a;
  box-shadow:
    inset 0 0 60px rgba(0, 0, 0, 0.5),
    inset 0 0 120px rgba(0, 0, 0, 0.2),
    0 0 20px rgba(0, 0, 0, 0.6),
    0 0 40px rgba(92, 58, 26, 0.3);
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  gap: 8px;
  padding: 24px;
  position: relative;
  overflow: hidden;
}

.poker-table__suit-suites {
  position: absolute;
  inset: 0;
  pointer-events: none;
}
.poker-table__corner-icon {
  position: absolute;
  color: rgba(255, 215, 0, 0.04);
}
.poker-table__corner-icon--tl { top: 14px; left: 20px; }
.poker-table__corner-icon--tr { top: 14px; right: 20px; }
.poker-table__corner-icon--bl { bottom: 14px; left: 20px; }
.poker-table__corner-icon--br { bottom: 14px; right: 20px; }

.poker-table__brand {
  position: absolute;
  top: 50%;
  left: 50%;
  transform: translate(-50%, -50%);
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 4px;
  pointer-events: none;
  user-select: none;
}

.poker-table__brand-title {
  color: rgba(255, 215, 0, 0.07);
  font-size: 60px;
  font-weight: 700;
  letter-spacing: 16px;
  font-family: 'Georgia', serif;
  display: flex;
  align-items: center;
  gap: 18px;
  text-shadow: 0 0 30px rgba(255, 215, 0, 0.04);
}
.poker-table__crown {
  color: rgba(255, 215, 0, 0.08);
  width: 50px;
  height: 50px;
}

.poker-table__brand-line {
  display: flex;
  gap: 28px;
}
.poker-table__suit-inline {
  color: rgba(255, 215, 0, 0.04);
}

.poker-table__my-area {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 8px;
  width: 100%;
}

.poker-table__my-info {
  display: flex;
  align-items: center;
  gap: 16px;
}

.poker-table__turn-info {
  display: flex;
  align-items: center;
  gap: 6px;
  color: rgba(255, 215, 0, 0.6);
  font-size: 11px;
  letter-spacing: 1px;
  animation: pulse 1.5s ease-in-out infinite;
}

.poker-table__timer {
  display: flex;
  justify-content: center;
}

.poker-table__eliminated {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 8px;
  color: #ff6666;
  font-size: 13px;
  font-weight: 600;
  padding: 12px 18px;
  background: rgba(220, 38, 38, 0.1);
  border-radius: 10px;
  border: 1px solid rgba(220, 38, 38, 0.25);
  animation: eliminatedPulse 2s ease-in-out infinite;
}
.poker-table__eliminated-text {
  letter-spacing: 1px;
}
.poker-table__eliminated-sub {
  color: rgba(255, 255, 255, 0.5);
  font-size: 11px;
  font-weight: 400;
  letter-spacing: 0;
}
.poker-table__eliminated-btn {
  padding: 6px 14px;
  border: 1px solid rgba(220, 38, 38, 0.4);
  background: rgba(220, 38, 38, 0.15);
  color: #ff6666;
  border-radius: 6px;
  font-size: 12px;
  font-weight: 600;
  cursor: pointer;
  transition: all 0.2s;
}
.poker-table__eliminated-btn:hover {
  background: rgba(220, 38, 38, 0.3);
  border-color: rgba(220, 38, 38, 0.6);
  color: white;
}
@keyframes eliminatedPulse {
  0%, 100% { opacity: 0.8; }
  50% { opacity: 1; }
}

@keyframes pulse {
  0%, 100% { opacity: 0.6; }
  50% { opacity: 1; }
}

.poker-table__leave {
  position: fixed;
  top: 12px;
  right: 12px;
  z-index: 100;
  width: 36px;
  height: 36px;
  border-radius: 50%;
  border: 1px solid rgba(255, 255, 255, 0.15);
  background: rgba(0, 0, 0, 0.6);
  color: rgba(255, 255, 255, 0.5);
  display: flex;
  align-items: center;
  justify-content: center;
  cursor: pointer;
  transition: all 0.2s;
  backdrop-filter: blur(8px);
}
.poker-table__leave:hover {
  background: rgba(220, 38, 38, 0.3);
  border-color: rgba(220, 38, 38, 0.5);
  color: #ff6666;
}

.poker-table__end-game {
  position: fixed; top: 12px; left: 56px; z-index: 100;
  width: 36px; height: 36px;
  border-radius: 50%;
  background: rgba(0, 0, 0, 0.6); border: 1px solid rgba(255, 215, 0, 0.3);
  color: #ffd700;
  display: flex; align-items: center; justify-content: center;
  cursor: pointer; transition: all 0.2s;
  backdrop-filter: blur(8px);
}
.poker-table__end-game:hover {
  background: rgba(255, 215, 0, 0.2);
  border-color: rgba(255, 215, 0, 0.5);
}

.poker-table__help {
  position: fixed; top: 12px; left: 12px; z-index: 100;
  width: 36px; height: 36px;
  border-radius: 50%;
  background: rgba(0, 0, 0, 0.6); border: 1px solid rgba(255, 255, 255, 0.15);
  color: rgba(255, 255, 255, 0.5);
  display: flex; align-items: center; justify-content: center;
  cursor: pointer; transition: all 0.2s;
  backdrop-filter: blur(8px);
}
.poker-table__help:hover {
  background: rgba(255, 255, 255, 0.1);
  border-color: rgba(255, 255, 255, 0.3);
  color: #fff;
}

.poker-table__hide-cards {
  width: 32px;
  height: 32px;
  border-radius: 50%;
  border: 1px solid rgba(255, 215, 0, 0.15);
  background: rgba(0, 0, 0, 0.4);
  color: rgba(255, 215, 0, 0.5);
  display: flex;
  align-items: center;
  justify-content: center;
  cursor: pointer;
  transition: all 0.2s;
  flex-shrink: 0;
}
.poker-table__hide-cards:hover {
  background: rgba(255, 215, 0, 0.1);
  border-color: rgba(255, 215, 0, 0.3);
  color: #ffd700;
}

.leave-modal {
  position: fixed;
  inset: 0;
  z-index: 6000;
  display: flex;
  align-items: center;
  justify-content: center;
  background: rgba(0, 0, 0, 0.7);
  backdrop-filter: blur(4px);
}
.leave-modal__card {
  background: #111827;
  border: 1px solid rgba(255, 215, 0, 0.2);
  border-radius: 16px;
  padding: 28px 32px;
  width: 90%;
  max-width: 340px;
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 16px;
}
.leave-modal__title {
  color: #ff6666;
  font-size: 18px;
  font-weight: 700;
}
.leave-modal__text {
  color: rgba(255, 255, 255, 0.7);
  font-size: 14px;
  text-align: center;
}
.leave-modal__actions {
  display: flex;
  gap: 10px;
  width: 100%;
}
.leave-modal__btn {
  flex: 1;
  padding: 10px;
  border: none;
  border-radius: 8px;
  font-size: 14px;
  font-weight: 600;
  cursor: pointer;
  transition: all 0.2s;
}
.leave-modal__btn--cancel {
  background: rgba(255, 255, 255, 0.1);
  color: #aaa;
  border: 1px solid rgba(255, 255, 255, 0.15);
}
.leave-modal__btn--cancel:hover {
  background: rgba(255, 255, 255, 0.15);
  color: white;
}
.leave-modal__btn--confirm {
  background: linear-gradient(135deg, #b91c1c, #dc2626);
  color: white;
}
.leave-modal__btn--confirm:hover {
  box-shadow: 0 4px 16px rgba(220, 38, 38, 0.4);
}

.leave-modal__error {
  color: #f59e0b;
  font-size: 13px;
  text-align: center;
  padding: 8px 12px;
  background: rgba(245, 158, 11, 0.1);
  border: 1px solid rgba(245, 158, 11, 0.3);
  border-radius: 8px;
  width: 100%;
}

/* === MOBILE === */
@media (max-width: 768px) {
  .poker-table {
    padding: 8px 10px;
    gap: 6px;
  }
  .poker-table__opponents {
    gap: 6px;
  }
  .poker-table__surface {
    width: 96%;
  }
  .poker-table__felt {
    aspect-ratio: 1.8 / 1;
    border-radius: 80px;
    padding: 14px;
    gap: 6px;
    border-width: 4px;
  }
  .poker-table__brand-title {
    font-size: 28px;
    letter-spacing: 8px;
  }
  .poker-table__crown {
    width: 24px;
    height: 24px;
  }
  .poker-table__corner-icon { display: none; }
  .poker-table__my-info {
    gap: 10px;
  }
  .poker-table__turn-info {
    font-size: 10px;
  }
  .poker-table__end-game {
    top: 8px; left: 48px;
    width: 32px; height: 32px;
  }
  .poker-table__help {
    top: 8px; left: 8px;
    width: 32px; height: 32px;
  }
}
</style>

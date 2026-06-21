<script setup lang="ts">
import { Crown, Diamond, Heart, Club, Spade, Clock } from '@lucide/vue'
import type { GameState } from '../../types/poker'

const props = defineProps<{
  gameState: GameState
  myPlayerId: string
}>()

const emit = defineEmits<{
  (e: 'action', action: string, amount?: number): void
}>()

const { state } = useGame()

const myPlayer = computed(() =>
  props.gameState.players.find(p => p.id === props.myPlayerId)
)

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

const latestHandResult = computed(() => {
  const history = props.gameState.handHistory
  if (!history || history.length === 0) return null
  return history[history.length - 1]
})

const showVictory = ref(false)

watch(() => props.gameState.phase, (phase) => {
  if (phase === 'showdown' && latestHandResult.value) {
    showVictory.value = true
  }
}, { immediate: true })
</script>

<template>
  <GameVictory
    v-if="showVictory && latestHandResult"
    :winner-nickname="latestHandResult.winnerNickname"
    :amount-won="latestHandResult.amountWon"
    @done="showVictory = false"
  />
  <div class="poker-table">
    <!-- Other players at the top -->
    <div class="poker-table__opponents">
      <GamePlayerSeat
        v-for="player in otherPlayers"
        :key="player.id"
        :player="player"
        :is-active="player.isTurn"
        :is-myself="false"
        :is-winner="latestHandResult?.winnerId === player.id && gameState.phase === 'showdown'"
      />
    </div>

    <!-- Table surface -->
    <div class="poker-table__surface">
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

    <!-- My area at the bottom -->
    <div v-if="myPlayer" class="poker-table__my-area">
      <div class="poker-table__my-info">
        <GamePlayerSeat
          :player="myPlayer"
          :is-active="myPlayer.isTurn"
          :is-myself="true"
          :is-winner="latestHandResult?.winnerId === myPlayer.id && gameState.phase === 'showdown'"
        />
        <GameHandCards :cards="myHand" />
      </div>

      <div v-if="!isMyTurn && gameState.phase !== 'waiting' && gameState.phase !== 'showdown'" class="poker-table__turn-info">
        <Clock :size="14" />
        Turno de {{ currentTurnPlayer?.nickname ?? '...' }} — espera tu turno
      </div>

      <GameBetControls
        v-if="myPlayer && !myPlayer.folded && gameState.phase !== 'showdown' && gameState.phase !== 'waiting'"
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

@keyframes pulse {
  0%, 100% { opacity: 0.6; }
  50% { opacity: 1; }
}
</style>

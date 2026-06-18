<script setup lang="ts">
import type { GameState } from '../../types/poker'

const props = defineProps<{
  gameState: GameState
  myPlayerId: string
}>()

const emit = defineEmits<{
  (e: 'action', action: string, amount?: number): void
}>()

const myPlayer = computed(() =>
  props.gameState.players.find(p => p.id === props.myPlayerId)
)

const otherPlayers = computed(() =>
  props.gameState.players.filter(p => p.id !== props.myPlayerId)
)

const totalPot = computed(() =>
  props.gameState.pots.reduce((sum, pot) => sum + pot.amount, 0)
)

const myHand = useState<any[]>('myHand', () => [])

const canCheck = computed(() => {
  if (!myPlayer.value) return false
  return myPlayer.value.bet >= props.gameState.currentBet
})

const minRaise = computed(() => props.gameState.bigBlind)
</script>

<template>
  <div class="poker-table">
    <!-- Other players at the top -->
    <div class="poker-table__opponents">
      <GamePlayerSeat
        v-for="player in otherPlayers"
        :key="player.id"
        :player="player"
        :is-active="player.isTurn"
        :is-myself="false"
      />
    </div>

    <!-- Table surface -->
    <div class="poker-table__surface">
      <div class="poker-table__felt">
        <div class="poker-table__brand">DECK ROYALE</div>
        <GameCommunityCards :cards="gameState.communityCards" />
        <GamePotDisplay :amount="totalPot" />
        <div class="poker-table__phase">{{ gameState.phase.toUpperCase() }}</div>
      </div>
    </div>

    <!-- My area at the bottom -->
    <div v-if="myPlayer" class="poker-table__my-area">
      <div class="poker-table__my-info">
        <GamePlayerSeat
          :player="myPlayer"
          :is-active="myPlayer.isTurn"
          :is-myself="true"
        />
        <GameHandCards :cards="myHand" />
      </div>

      <GameBetControls
        v-if="myPlayer.isTurn && !myPlayer.folded && gameState.phase !== 'showdown' && gameState.phase !== 'waiting'"
        :current-bet="gameState.currentBet"
        :min-raise="minRaise"
        :player-chips="myPlayer.chips"
        :player-bet="myPlayer.bet"
        :can-check="canCheck"
        @action="(action, amount) => emit('action', action, amount)"
      />
    </div>
  </div>
</template>

<style scoped>
.poker-table {
  width: 100%;
  min-height: 100vh;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: space-between;
  padding: 20px;
}

.poker-table__opponents {
  display: flex;
  gap: 16px;
  flex-wrap: wrap;
  justify-content: center;
  padding: 20px 0;
}

.poker-table__surface {
  width: 90%;
  max-width: 800px;
}

.poker-table__felt {
  width: 100%;
  aspect-ratio: 2 / 1;
  background: radial-gradient(ellipse at center, #1a5c2a 0%, #0d3d1a 70%, #0a2d12 100%);
  border-radius: 200px;
  border: 12px solid #5c3a1a;
  box-shadow:
    inset 0 0 60px rgba(0, 0, 0, 0.5),
    0 0 40px rgba(0, 0, 0, 0.8),
    0 10px 30px rgba(0, 0, 0, 0.5);
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  gap: 16px;
  padding: 30px;
  position: relative;
}

.poker-table__brand {
  position: absolute;
  top: 20px;
  color: rgba(255, 215, 0, 0.25);
  font-size: 20px;
  font-weight: bold;
  letter-spacing: 8px;
  font-family: 'Georgia', serif;
}

.poker-table__phase {
  position: absolute;
  bottom: 20px;
  color: rgba(255, 255, 255, 0.35);
  font-size: 12px;
  letter-spacing: 2px;
}

.poker-table__my-area {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 16px;
  padding: 20px;
  background: rgba(0, 0, 0, 0.6);
  border-radius: 16px;
  backdrop-filter: blur(10px);
}

.poker-table__my-info {
  display: flex;
  align-items: center;
  gap: 20px;
}
</style>

<script setup lang="ts">
import { Trophy, Medal, History, ArrowRightLeft, Star, Home } from '@lucide/vue'
import type { GameOverData } from '../../types/poker'

const props = defineProps<{
  data: GameOverData
  myPlayerId: string
}>()

const emit = defineEmits<{
  (e: 'leave'): void
}>()

const activeTab = ref<'standings' | 'history' | 'debts'>('standings')

const myRank = computed(() =>
  props.data.players.findIndex(p => p.id === props.myPlayerId) + 1
)

const myPlayer = computed(() =>
  props.data.players.find(p => p.id === props.myPlayerId)
)

const debts = computed(() => {
  const result: { from: string; fromId: string; to: string; toId: string; amount: number }[] = []
  const chipsDelta: Record<string, number> = {}
  const playerNames: Record<string, string> = {}

  for (const p of props.data.players) {
    playerNames[p.id] = p.nickname
    chipsDelta[p.id] = p.chips - (props.data.startingChips[p.id] ?? p.chips)
  }

  const debtors: { id: string; amount: number }[] = []
  const creditors: { id: string; amount: number }[] = []

  for (const [id, delta] of Object.entries(chipsDelta)) {
    if (delta < 0) debtors.push({ id, amount: Math.abs(delta) })
    else if (delta > 0) creditors.push({ id, amount: delta })
  }

  debtors.sort((a, b) => b.amount - a.amount)
  creditors.sort((a, b) => b.amount - a.amount)

  let di = 0, ci = 0
  while (di < debtors.length && ci < creditors.length) {
    const d = debtors[di]
    const c = creditors[ci]
    if (!d || !c) break
    const transfer = Math.min(d.amount, c.amount)
    if (transfer > 0) {
      result.push({
        from: playerNames[d.id] ?? d.id,
        fromId: d.id,
        to: playerNames[c.id] ?? c.id,
        toId: c.id,
        amount: transfer,
      })
    }
    d.amount -= transfer
    c.amount -= transfer
    if (d.amount <= 0) di++
    if (c.amount <= 0) ci++
  }

  return result
})

function medalIcon(rank: number) {
  if (rank === 1) return Trophy
  if (rank === 2) return Medal
  return null
}

const tabStyle = (tab: string) => ({
  background: activeTab.value === tab ? 'rgba(255, 215, 0, 0.15)' : 'transparent',
  color: activeTab.value === tab ? '#ffd700' : 'rgba(255, 255, 255, 0.5)',
  borderBottom: activeTab.value === tab ? '2px solid #ffd700' : '2px solid transparent',
})
</script>

<template>
  <div class="end-modal-overlay">
    <div class="end-modal">
      <!-- Header -->
      <div class="end-modal__header">
        <Trophy :size="36" class="end-modal__trophy" />
        <div class="end-modal__title">Partida Finalizada</div>
        <div v-if="myPlayer" class="end-modal__subtitle">
          <template v-if="myRank === 1">Ganaste la partida!</template>
          <template v-else>Terminaste en posicion #{{ myRank }}</template>
        </div>
      </div>

      <!-- Tabs -->
      <div class="end-modal__tabs">
        <button class="end-modal__tab" :style="tabStyle('standings')" @click="activeTab = 'standings'">
          <Trophy :size="14" />
          Posiciones
        </button>
        <button class="end-modal__tab" :style="tabStyle('history')" @click="activeTab = 'history'">
          <History :size="14" />
          Estadisticas
        </button>
        <button class="end-modal__tab" :style="tabStyle('debts')" @click="activeTab = 'debts'">
          <ArrowRightLeft :size="14" />
          Quien Paga a Quien
        </button>
      </div>

      <!-- Standings -->
      <div v-if="activeTab === 'standings'" class="end-modal__content">
        <div
          v-for="(player, index) in data.players"
          :key="player.id"
          class="end-modal__player"
          :class="{
            'end-modal__player--1st': index === 0,
            'end-modal__player--me': player.id === myPlayerId,
          }"
        >
          <div class="end-modal__rank">
            <component
              :is="medalIcon(index + 1)"
              v-if="index < 2"
              :size="20"
              class="end-modal__medal"
            />
            <span v-else class="end-modal__rank-num">#{{ index + 1 }}</span>
          </div>
          <div class="end-modal__player-name">{{ player.nickname }}</div>
          <div class="end-modal__player-chips">
            ${{ player.chips.toLocaleString() }}
          </div>
          <div
            class="end-modal__delta"
            :class="player.chips >= (data.startingChips[player.id] ?? 0) ? 'end-modal__delta--positive' : 'end-modal__delta--negative'"
          >
            {{ player.chips >= (data.startingChips[player.id] ?? 0) ? '+' : '' }}{{ (player.chips - (data.startingChips[player.id] ?? player.chips)).toLocaleString() }}
          </div>
        </div>
      </div>

      <!-- History -->
      <div v-if="activeTab === 'history'" class="end-modal__content end-modal__content--scroll">
        <div class="end-modal__history-header">
          Total de manos: {{ data.handHistory.length }}
        </div>
        <div
          v-for="hand in data.handHistory"
          :key="hand.handNumber"
          class="end-modal__hand"
        >
          <div class="end-modal__hand-header">
            <span class="end-modal__hand-num">Mano #{{ hand.handNumber }}</span>
            <span class="end-modal__hand-winner">
              <Star :size="12" />
              {{ hand.winners.map(w => w.winnerNickname).join(', ') }} gana ${{ hand.winners.reduce((sum, w) => sum + w.amountWon, 0).toLocaleString() }}
            </span>
          </div>
          <div class="end-modal__hand-details">
            <div v-if="hand.foldedPlayers.length > 0" class="end-modal__hand-folded">
              Se retiraron:
              {{ hand.foldedPlayers.map(p => p.nickname).join(', ') }}
            </div>
            <div class="end-modal__hand-chips">
              <template v-for="(chips, id) in hand.finalChips" :key="id">
                <span class="end-modal__chip-entry">
                  {{ data.players.find(p => p.id === id)?.nickname }}: ${{ chips.toLocaleString() }}
                </span>
              </template>
            </div>
          </div>
        </div>
      </div>

      <!-- Debts -->
      <div v-if="activeTab === 'debts'" class="end-modal__content">
        <div v-if="debts.length === 0" class="end-modal__no-debts">
          Todos estan parejos
        </div>
        <div
          v-for="(debt, i) in debts"
          :key="i"
          class="end-modal__debt"
        >
          <span class="end-modal__debt-from">{{ debt.from }}</span>
          <ArrowRightLeft :size="14" class="end-modal__debt-arrow" />
          <span class="end-modal__debt-to">{{ debt.to }}</span>
          <span class="end-modal__debt-amount">${{ debt.amount.toLocaleString() }}</span>
        </div>
      </div>

      <!-- Footer -->
      <div class="end-modal__footer">
        <button class="end-modal__btn end-modal__btn--leave" @click="emit('leave')">
          <Home :size="16" />
          Salir a la Sala
        </button>
      </div>
    </div>
  </div>
</template>

<style scoped>
.end-modal-overlay {
  position: fixed;
  inset: 0;
  background: rgba(0, 0, 0, 0.85);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 2000;
  backdrop-filter: blur(8px);
  animation: fadeIn 0.3s ease-out;
}

.end-modal {
  background: linear-gradient(145deg, #1a1a2e 0%, #0d0d1a 100%);
  border: 1px solid rgba(255, 215, 0, 0.2);
  border-radius: 16px;
  width: 90%;
  max-width: 480px;
  max-height: 85vh;
  display: flex;
  flex-direction: column;
  overflow: hidden;
  box-shadow: 0 0 40px rgba(255, 215, 0, 0.1);
  animation: slideUp 0.4s ease-out;
}

.end-modal__header {
  text-align: center;
  padding: 24px 20px 16px;
  border-bottom: 1px solid rgba(255, 215, 0, 0.1);
}

.end-modal__trophy {
  color: #ffd700;
  margin-bottom: 8px;
  animation: bounce 1s ease-in-out infinite;
}

.end-modal__title {
  color: #ffd700;
  font-size: 22px;
  font-weight: 700;
  letter-spacing: 2px;
}

.end-modal__subtitle {
  color: rgba(255, 255, 255, 0.6);
  font-size: 13px;
  margin-top: 4px;
}

.end-modal__tabs {
  display: flex;
  border-bottom: 1px solid rgba(255, 255, 255, 0.1);
}

.end-modal__tab {
  flex: 1;
  padding: 10px 8px;
  background: none;
  border: none;
  font-size: 11px;
  cursor: pointer;
  transition: all 0.2s;
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 5px;
  letter-spacing: 0.5px;
}

.end-modal__tab:hover {
  background: rgba(255, 215, 0, 0.05);
}

.end-modal__content {
  flex: 1;
  overflow-y: auto;
  padding: 16px;
}

.end-modal__content--scroll {
  max-height: 300px;
}

.end-modal__player {
  display: flex;
  align-items: center;
  gap: 12px;
  padding: 10px 12px;
  border-radius: 8px;
  margin-bottom: 6px;
  background: rgba(255, 255, 255, 0.03);
  border: 1px solid transparent;
}

.end-modal__player--1st {
  background: rgba(255, 215, 0, 0.08);
  border-color: rgba(255, 215, 0, 0.15);
}

.end-modal__player--me {
  border-color: rgba(255, 215, 0, 0.3);
}

.end-modal__rank {
  width: 32px;
  text-align: center;
  flex-shrink: 0;
}

.end-modal__medal {
  color: #ffd700;
}

.end-modal__rank-num {
  color: rgba(255, 255, 255, 0.4);
  font-size: 14px;
  font-weight: 600;
}

.end-modal__player-name {
  flex: 1;
  color: white;
  font-size: 14px;
  font-weight: 500;
}

.end-modal__player-chips {
  color: rgba(255, 255, 255, 0.7);
  font-size: 13px;
  font-family: monospace;
}

.end-modal__delta {
  font-size: 12px;
  font-weight: 600;
  min-width: 60px;
  text-align: right;
  font-family: monospace;
}

.end-modal__delta--positive {
  color: #4ade80;
}

.end-modal__delta--negative {
  color: #f87171;
}

.end-modal__history-header {
  color: rgba(255, 255, 255, 0.5);
  font-size: 12px;
  margin-bottom: 12px;
  letter-spacing: 1px;
}

.end-modal__hand {
  background: rgba(255, 255, 255, 0.03);
  border-radius: 8px;
  padding: 10px 12px;
  margin-bottom: 8px;
  border: 1px solid rgba(255, 255, 255, 0.05);
}

.end-modal__hand-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 6px;
}

.end-modal__hand-num {
  color: rgba(255, 255, 255, 0.4);
  font-size: 11px;
  letter-spacing: 1px;
}

.end-modal__hand-winner {
  color: #ffd700;
  font-size: 12px;
  font-weight: 600;
  display: flex;
  align-items: center;
  gap: 4px;
}

.end-modal__hand-details {
  display: flex;
  flex-direction: column;
  gap: 4px;
}

.end-modal__hand-folded {
  color: rgba(255, 255, 255, 0.4);
  font-size: 11px;
  font-style: italic;
}

.end-modal__hand-chips {
  display: flex;
  flex-wrap: wrap;
  gap: 6px;
}

.end-modal__chip-entry {
  color: rgba(255, 255, 255, 0.5);
  font-size: 11px;
  font-family: monospace;
}

.end-modal__no-debts {
  text-align: center;
  color: rgba(255, 255, 255, 0.4);
  padding: 24px;
  font-style: italic;
}

.end-modal__debt {
  display: flex;
  align-items: center;
  gap: 10px;
  padding: 10px 12px;
  background: rgba(255, 255, 255, 0.03);
  border-radius: 8px;
  margin-bottom: 6px;
}

.end-modal__debt-from {
  color: #f87171;
  font-size: 13px;
  font-weight: 500;
}

.end-modal__debt-arrow {
  color: rgba(255, 255, 255, 0.3);
}

.end-modal__debt-to {
  color: #4ade80;
  font-size: 13px;
  font-weight: 500;
}

.end-modal__debt-amount {
  margin-left: auto;
  color: #ffd700;
  font-size: 13px;
  font-weight: 600;
  font-family: monospace;
}

.end-modal__footer {
  padding: 16px;
  border-top: 1px solid rgba(255, 255, 255, 0.1);
}

.end-modal__btn {
  width: 100%;
  padding: 12px;
  border: none;
  border-radius: 8px;
  cursor: pointer;
  font-size: 14px;
  font-weight: 600;
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 8px;
  transition: all 0.2s;
  letter-spacing: 1px;
}

.end-modal__btn--leave {
  background: rgba(255, 215, 0, 0.1);
  color: #ffd700;
  border: 1px solid rgba(255, 215, 0, 0.3);
}

.end-modal__btn--leave:hover {
  background: rgba(255, 215, 0, 0.2);
}

@keyframes fadeIn {
  from { opacity: 0; }
  to { opacity: 1; }
}

@keyframes slideUp {
  from { transform: translateY(20px); opacity: 0; }
  to { transform: translateY(0); opacity: 1; }
}

@keyframes bounce {
  0%, 100% { transform: translateY(0); }
  50% { transform: translateY(-4px); }
}
</style>

<script setup lang="ts">
import { History, ArrowRightLeft, Home, LogOut, TrendingUp, TrendingDown, Crown, Sparkles } from '@lucide/vue'
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

const myProfit = computed(() => {
  if (!myPlayer.value) return 0
  return myPlayer.value.chips - (props.data.startingChips[myPlayer.value.id] ?? myPlayer.value.chips)
})

const groupedWinners = computed(() => {
  const result: { handNumber: number; groups: { nickname: string; totalWon: number; pots: { potIndex: number; potAmount: number; amountWon: number }[] }[]; foldedPlayers: { id: string; nickname: string }[]; finalChips: Record<string, number>; playerBets: Record<string, number>; communityCardCount: number }[] = []

  for (const hand of props.data.handHistory) {
    const winnerMap = new Map<string, { nickname: string; totalWon: number; pots: { potIndex: number; potAmount: number; amountWon: number }[] }>()

    for (const w of hand.winners) {
      const existing = winnerMap.get(w.winnerId)
      if (existing) {
        existing.totalWon += w.amountWon
        existing.pots.push({ potIndex: w.potIndex, potAmount: w.potAmount, amountWon: w.amountWon })
      } else {
        winnerMap.set(w.winnerId, {
          nickname: w.winnerNickname,
          totalWon: w.amountWon,
          pots: [{ potIndex: w.potIndex, potAmount: w.potAmount, amountWon: w.amountWon }],
        })
      }
    }

    result.push({
      handNumber: hand.handNumber,
      groups: Array.from(winnerMap.values()),
      foldedPlayers: hand.foldedPlayers,
      finalChips: hand.finalChips,
      playerBets: hand.playerBets,
      communityCardCount: hand.communityCards.length,
    })
  }

  return result
})

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
</script>

<template>
  <div class="end-overlay">
    <div class="end-modal">
      <!-- Hero header -->
      <div class="end-hero">
        <div class="end-hero__bg" />
        <div class="end-hero__content">
          <img src="/images/trophy.svg" alt="Trofeo" class="end-hero__trophy" />
          <h2 class="end-hero__title">
            <template v-if="myRank === 1">Ganaste la partida!</template>
            <template v-else>Posicion #{{ myRank }}</template>
          </h2>
          <p v-if="myPlayer" class="end-hero__profit" :class="myProfit >= 0 ? 'end-hero__profit--up' : 'end-hero__profit--down'">
            {{ myProfit >= 0 ? '+' : '' }}${{ myProfit.toLocaleString() }}
          </p>
          <p class="end-hero__hands">{{ data.handHistory.length }} manos jugadas</p>
        </div>
      </div>

      <!-- Tabs -->
      <div class="end-tabs">
        <button
          class="end-tabs__btn"
          :class="{ 'end-tabs__btn--active': activeTab === 'standings' }"
          @click="activeTab = 'standings'"
        >
          <Crown :size="14" />
          Posiciones
        </button>
        <button
          class="end-tabs__btn"
          :class="{ 'end-tabs__btn--active': activeTab === 'history' }"
          @click="activeTab = 'history'"
        >
          <History :size="14" />
          Manos
        </button>
        <button
          class="end-tabs__btn"
          :class="{ 'end-tabs__btn--active': activeTab === 'debts' }"
          @click="activeTab = 'debts'"
        >
          <ArrowRightLeft :size="14" />
          Deudas
        </button>
      </div>

      <!-- Standings -->
      <div v-if="activeTab === 'standings'" class="end-body">
        <div
          v-for="(player, index) in data.players"
          :key="player.id"
          class="end-rank"
          :class="{
            'end-rank--gold': index === 0 && !player.departed,
            'end-rank--silver': index === 1 && !player.departed,
            'end-rank--me': player.id === myPlayerId,
            'end-rank--departed': player.departed,
          }"
        >
          <div class="end-rank__pos">
            <img v-if="index === 0 && !player.departed" src="/images/trophy.svg" class="end-rank__trophy-mini" />
            <span v-else class="end-rank__num">{{ index + 1 }}</span>
          </div>
          <div class="end-rank__info">
            <span class="end-rank__name">
              {{ player.nickname }}
              <span v-if="player.id === myPlayerId" class="end-rank__you">TU</span>
              <span v-if="player.departed" class="end-rank__left">se retiro</span>
            </span>
            <span class="end-rank__stack">${{ player.chips.toLocaleString() }} fichas</span>
          </div>
          <div
            class="end-rank__delta"
            :class="player.chips >= (data.startingChips[player.id] ?? player.chips) ? 'end-rank__delta--up' : 'end-rank__delta--down'"
          >
            <TrendingUp v-if="player.chips >= (data.startingChips[player.id] ?? player.chips)" :size="12" />
            <TrendingDown v-else :size="12" />
            {{ player.chips >= (data.startingChips[player.id] ?? player.chips) ? '+' : '' }}{{ (player.chips - (data.startingChips[player.id] ?? player.chips)).toLocaleString() }}
          </div>
        </div>
      </div>

      <!-- History -->
      <div v-if="activeTab === 'history'" class="end-body end-body--scroll">
        <div
          v-for="hand in groupedWinners"
          :key="hand.handNumber"
          class="end-hand"
        >
          <div class="end-hand__header">
            <span class="end-hand__num">Mano #{{ hand.handNumber }}</span>
            <span class="end-hand__cards">{{ hand.communityCardCount }} cartas en mesa</span>
          </div>

          <div v-for="(group, gi) in hand.groups" :key="gi" class="end-hand__winner">
            <Sparkles :size="12" class="end-hand__sparkle" />
            <span class="end-hand__winner-name">{{ group.nickname }}</span>
            <span class="end-hand__winner-amount">+${{ group.totalWon.toLocaleString() }}</span>
          </div>

          <div v-if="hand.groups.length > 1 && hand.groups[0].pots.length > 1" class="end-hand__pots">
            <span v-for="(pot, pi) in hand.groups[0].pots" :key="pi" class="end-hand__pot">
              Bote {{ pot.potIndex === 0 ? 'Principal' : 'Lateral' }}: ${{ pot.potAmount.toLocaleString() }}
            </span>
          </div>

          <div v-if="hand.foldedPlayers.length > 0" class="end-hand__folded">
            Se retiraron: {{ hand.foldedPlayers.map(p => p.nickname).join(', ') }}
          </div>
        </div>
      </div>

      <!-- Debts -->
      <div v-if="activeTab === 'debts'" class="end-body">
        <div v-if="debts.length === 0" class="end-debts__empty">
          Todos estan parejos
        </div>
        <div
          v-for="(debt, i) in debts"
          :key="i"
          class="end-debt"
        >
          <div class="end-debt__top">
            <div class="end-debt__left">
              <span class="end-debt__from">{{ debt.from }}</span>
              <span class="end-debt__arrow">&rarr;</span>
              <span class="end-debt__to">{{ debt.to }}</span>
            </div>
            <span class="end-debt__amount">${{ debt.amount.toLocaleString() }}</span>
          </div>
          <div class="end-debt__subtitle">
            {{ debt.from }} le pasa ${{ debt.amount.toLocaleString() }} a {{ debt.to }}
          </div>
        </div>
      </div>

      <!-- Footer -->
      <div class="end-footer">
        <button class="end-footer__btn" @click="emit('leave')">
          <LogOut :size="16" />
          Salir a la Sala
        </button>
      </div>
    </div>
  </div>
</template>

<style scoped>
.end-overlay {
  position: fixed;
  inset: 0;
  background: transparent;
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 2000;
  backdrop-filter: blur(12px);
  animation: fadeIn 0.3s ease-out;
  padding: 20px;
}

.end-modal {
  background: #111119;
  border: 1px solid rgba(255, 215, 0, 0.12);
  border-radius: 24px;
  width: 100%;
  max-width: 460px;
  max-height: 88vh;
  display: flex;
  flex-direction: column;
  overflow: hidden;
  box-shadow: 0 25px 80px rgba(0, 0, 0, 0.6), 0 0 60px rgba(255, 215, 0, 0.05);
  animation: slideUp 0.4s cubic-bezier(0.16, 1, 0.3, 1);
}

/* ── Hero ── */
.end-hero {
  position: relative;
  padding: 36px 24px 28px;
  text-align: center;
  overflow: hidden;
}

.end-hero__bg {
  position: absolute;
  inset: 0;
  background: radial-gradient(ellipse at top, rgba(255, 215, 0, 0.08) 0%, transparent 70%);
  pointer-events: none;
}

.end-hero__content {
  position: relative;
  z-index: 1;
}

.end-hero__trophy {
  width: 64px;
  height: 64px;
  margin-bottom: 16px;
  filter: drop-shadow(0 0 20px rgba(255, 215, 0, 0.3));
  animation: float 2s ease-in-out infinite;
}

.end-hero__title {
  font-family: 'Georgia', serif;
  font-size: 24px;
  font-weight: 400;
  color: white;
  margin: 0 0 8px 0;
  letter-spacing: 1px;
}

.end-hero__profit {
  font-size: 28px;
  font-weight: 700;
  margin: 0 0 4px 0;
  font-family: monospace;
}

.end-hero__profit--up { color: #4ade80; }
.end-hero__profit--down { color: #f87171; }

.end-hero__hands {
  color: rgba(255, 255, 255, 0.35);
  font-size: 12px;
  letter-spacing: 1px;
  margin: 0;
  text-transform: uppercase;
}

/* ── Tabs ── */
.end-tabs {
  display: flex;
  padding: 0 16px;
  gap: 4px;
  border-bottom: 1px solid rgba(255, 255, 255, 0.06);
}

.end-tabs__btn {
  flex: 1;
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 6px;
  padding: 12px 4px;
  background: none;
  border: none;
  border-bottom: 2px solid transparent;
  color: rgba(255, 255, 255, 0.35);
  font-size: 12px;
  font-weight: 500;
  letter-spacing: 0.5px;
  cursor: pointer;
  transition: all 0.2s;
}

.end-tabs__btn:hover {
  color: rgba(255, 255, 255, 0.6);
}

.end-tabs__btn--active {
  color: #ffd700;
  border-bottom-color: #ffd700;
}

/* ── Body ── */
.end-body {
  flex: 1;
  overflow-y: auto;
  padding: 16px;
}

.end-body--scroll {
  max-height: 320px;
}

.end-body::-webkit-scrollbar {
  width: 4px;
}

.end-body::-webkit-scrollbar-track {
  background: transparent;
}

.end-body::-webkit-scrollbar-thumb {
  background: rgba(255, 215, 0, 0.2);
  border-radius: 4px;
}

/* ── Rankings ── */
.end-rank {
  display: flex;
  align-items: center;
  gap: 14px;
  padding: 14px 16px;
  border-radius: 14px;
  margin-bottom: 6px;
  background: rgba(255, 255, 255, 0.025);
  border: 1px solid rgba(255, 255, 255, 0.04);
  transition: background 0.2s;
}

.end-rank--gold {
  background: linear-gradient(135deg, rgba(255, 215, 0, 0.1) 0%, rgba(255, 215, 0, 0.03) 100%);
  border-color: rgba(255, 215, 0, 0.2);
}

.end-rank--silver {
  background: rgba(192, 192, 192, 0.04);
  border-color: rgba(192, 192, 192, 0.12);
}

.end-rank--me {
  box-shadow: inset 0 0 0 1px rgba(255, 215, 0, 0.15);
}

.end-rank--departed {
  opacity: 0.4;
}

.end-rank__pos {
  width: 36px;
  height: 36px;
  display: flex;
  align-items: center;
  justify-content: center;
  flex-shrink: 0;
}

.end-rank__trophy-mini {
  width: 28px;
  height: 28px;
}

.end-rank__num {
  font-size: 16px;
  font-weight: 700;
  color: rgba(255, 255, 255, 0.25);
  font-family: monospace;
}

.end-rank__info {
  flex: 1;
  min-width: 0;
  display: flex;
  flex-direction: column;
  gap: 2px;
}

.end-rank__name {
  display: flex;
  align-items: center;
  gap: 8px;
  color: white;
  font-size: 15px;
  font-weight: 500;
}

.end-rank__you {
  font-size: 9px;
  font-weight: 700;
  background: rgba(255, 215, 0, 0.2);
  color: #ffd700;
  padding: 2px 6px;
  border-radius: 4px;
  letter-spacing: 1px;
}

.end-rank__left {
  font-size: 11px;
  color: rgba(255, 255, 255, 0.3);
  font-style: italic;
  font-weight: 400;
}

.end-rank__stack {
  color: rgba(255, 255, 255, 0.35);
  font-size: 12px;
  font-family: monospace;
}

.end-rank__delta {
  display: flex;
  align-items: center;
  gap: 4px;
  font-size: 13px;
  font-weight: 700;
  font-family: monospace;
  flex-shrink: 0;
}

.end-rank__delta--up { color: #4ade80; }
.end-rank__delta--down { color: #f87171; }

/* ── Hand History ── */
.end-hand {
  padding: 14px;
  background: rgba(255, 255, 255, 0.02);
  border: 1px solid rgba(255, 255, 255, 0.04);
  border-radius: 12px;
  margin-bottom: 8px;
}

.end-hand__header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 8px;
}

.end-hand__num {
  font-size: 11px;
  font-weight: 600;
  color: rgba(255, 255, 255, 0.3);
  letter-spacing: 1px;
  text-transform: uppercase;
}

.end-hand__cards {
  font-size: 10px;
  color: rgba(255, 255, 255, 0.2);
}

.end-hand__winner {
  display: flex;
  align-items: center;
  gap: 8px;
  margin-bottom: 4px;
}

.end-hand__sparkle {
  color: #ffd700;
  flex-shrink: 0;
}

.end-hand__winner-name {
  color: #ffd700;
  font-size: 14px;
  font-weight: 600;
}

.end-hand__winner-amount {
  color: #4ade80;
  font-size: 14px;
  font-weight: 700;
  margin-left: auto;
  font-family: monospace;
}

.end-hand__pots {
  display: flex;
  gap: 6px;
  flex-wrap: wrap;
  margin-top: 6px;
  margin-bottom: 4px;
}

.end-hand__pot {
  font-size: 10px;
  color: rgba(255, 215, 0, 0.5);
  background: rgba(255, 215, 0, 0.06);
  padding: 3px 8px;
  border-radius: 6px;
}

.end-hand__folded {
  font-size: 11px;
  color: rgba(255, 255, 255, 0.3);
  font-style: italic;
  margin-top: 4px;
}

/* ── Debts ── */
.end-debts__empty {
  text-align: center;
  color: rgba(255, 255, 255, 0.3);
  padding: 32px 16px;
  font-style: italic;
  font-size: 14px;
}

.end-debt {
  display: flex;
  flex-direction: column;
  gap: 4px;
  padding: 14px 16px;
  background: rgba(255, 255, 255, 0.025);
  border: 1px solid rgba(255, 255, 255, 0.04);
  border-radius: 12px;
  margin-bottom: 6px;
}

.end-debt__top {
  display: flex;
  align-items: center;
  justify-content: space-between;
}

.end-debt__left {
  display: flex;
  align-items: center;
  gap: 10px;
}

.end-debt__from {
  color: #f87171;
  font-size: 14px;
  font-weight: 600;
}

.end-debt__arrow {
  color: rgba(255, 255, 255, 0.2);
  font-size: 14px;
}

.end-debt__to {
  color: #4ade80;
  font-size: 14px;
  font-weight: 600;
}

.end-debt__amount {
  color: #ffd700;
  font-size: 15px;
  font-weight: 700;
  font-family: monospace;
}

.end-debt__subtitle {
  font-size: 11px;
  color: rgba(255, 255, 255, 0.35);
  letter-spacing: 0.3px;
}

/* ── Footer ── */
.end-footer {
  padding: 16px;
  border-top: 1px solid rgba(255, 255, 255, 0.06);
}

.end-footer__btn {
  width: 100%;
  padding: 14px;
  border: none;
  border-radius: 12px;
  cursor: pointer;
  font-size: 15px;
  font-weight: 600;
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 8px;
  transition: all 0.2s;
  letter-spacing: 0.5px;
  background: linear-gradient(135deg, rgba(255, 215, 0, 0.15), rgba(255, 215, 0, 0.05));
  color: #ffd700;
  border: 1px solid rgba(255, 215, 0, 0.2);
}

.end-footer__btn:hover {
  background: linear-gradient(135deg, rgba(255, 215, 0, 0.25), rgba(255, 215, 0, 0.1));
  transform: translateY(-1px);
  box-shadow: 0 4px 20px rgba(255, 215, 0, 0.15);
}

.end-footer__btn:active {
  transform: translateY(0);
}

@keyframes fadeIn {
  from { opacity: 0; }
  to { opacity: 1; }
}

@keyframes slideUp {
  from { transform: translateY(24px) scale(0.97); opacity: 0; }
  to { transform: translateY(0) scale(1); opacity: 1; }
}

@keyframes float {
  0%, 100% { transform: translateY(0); }
  50% { transform: translateY(-6px); }
}
</style>

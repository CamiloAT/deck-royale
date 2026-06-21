<script setup lang="ts">
import { X, Check, TrendingUp, Coins } from '@lucide/vue'

const props = defineProps<{
  currentBet: number
  minRaise: number
  playerChips: number
  playerBet: number
  canCheck: boolean
  disabled?: boolean
}>()

const emit = defineEmits<{
  (e: 'action', action: string, amount?: number): void
}>()

const DENOMINATIONS = [
  { value: 50, color: '#f97316', darkColor: '#9a3412', label: '50' },
  { value: 100, color: '#ef4444', darkColor: '#991b1b', label: '100' },
  { value: 200, color: '#3b82f6', darkColor: '#1e3a8a', label: '200' },
  { value: 500, color: '#22c55e', darkColor: '#166534', label: '500' },
  { value: 1000, color: '#a855f7', darkColor: '#6b21a8', label: '1K' },
  { value: 2000, color: '#0ea5e9', darkColor: '#0c4a6e', label: '2K' },
]

const chipsSelected = ref<Record<number, number>>({
  50: 0,
  100: 0,
  200: 0,
  500: 0,
  1000: 0,
  2000: 0,
})

// chipsSum = additional amount player puts in on top of what they already bet
const chipsSum = computed(() => {
  return Object.entries(chipsSelected.value).reduce(
    (sum, [val, count]) => sum + Number(val) * count,
    0,
  )
})

const callAmount = computed(() => {
  return Math.min(props.currentBet - props.playerBet, props.playerChips)
})

const maxTotalBet = computed(() => props.playerBet + props.playerChips)

// chipsSum must be > 0 and cover at least the call
const canRaise = computed(() =>
  chipsSum.value > 0 &&
  chipsSum.value >= callAmount.value &&
  props.playerBet + chipsSum.value <= maxTotalBet.value,
)

// Is the raise amount above the call?
const isRaiseAboveCall = computed(() => chipsSum.value > callAmount.value)
const raiseAmount = computed(() => Math.max(0, chipsSum.value - callAmount.value))

function chipCount(val: number): number {
  return chipsSelected.value[val] ?? 0
}

function isChipDisabled(val: number): boolean {
  if (props.disabled) return true
  if (chipsSum.value + val > maxTotalBet.value) return true
  return false
}

function addChip(val: number) {
  if (isChipDisabled(val)) return
  chipsSelected.value[val] = (chipsSelected.value[val] ?? 0) + 1
}

function removeChip(val: number) {
  if ((chipsSelected.value[val] ?? 0) > 0) {
    chipsSelected.value[val] = (chipsSelected.value[val] ?? 0) - 1
  }
}

function handleRaise() {
  if (!canRaise.value) return
  if (!isRaiseAboveCall.value) {
    emit('action', 'call')
  } else {
    emit('action', 'raise', props.playerBet + chipsSum.value)
  }
}

function handleAllIn() {
  emit('action', 'all_in')
}

function handleCheckCall() {
  emit('action', props.canCheck ? 'check' : 'call')
}

watch(() => props.currentBet, () => {
  chipsSelected.value = { 50: 0, 100: 0, 200: 0, 500: 0, 1000: 0, 2000: 0 }
})

watch(() => props.playerChips, () => {
  chipsSelected.value = { 50: 0, 100: 0, 200: 0, 500: 0, 1000: 0, 2000: 0 }
})
</script>

<template>
  <div class="bet-controls">
    <button class="bet-controls__btn bet-controls__btn--fold" @click="emit('action', 'fold')" :disabled="disabled">
      <X :size="14" />
      Foldear
    </button>

    <button class="bet-controls__btn bet-controls__btn--check" @click="handleCheckCall" :disabled="disabled">
      <Check :size="14" />
      {{ canCheck ? 'Pasar' : `Igualar $${callAmount.toLocaleString()}` }}
    </button>

    <div class="bet-controls__center">
      <div class="bet-controls__chips">
        <div class="bet-controls__chip-row">
          <GamePokerChip
            v-for="chip in DENOMINATIONS"
            :key="chip.value"
            :value="chip.value"
            :color="chip.color"
            :dark-color="chip.darkColor"
            :count="chipCount(chip.value)"
            :disabled="isChipDisabled(chip.value)"
            @add="addChip(chip.value)"
            @remove="removeChip(chip.value)"
          />
        </div>
      </div>

      <button
        class="bet-controls__btn bet-controls__btn--raise"
        @click="handleRaise"
        :disabled="disabled || !canRaise"
      >
        <TrendingUp :size="14" />
        {{ isRaiseAboveCall ? `Subir $${raiseAmount.toLocaleString()}` : `Igualar $${callAmount.toLocaleString()}` }}
      </button>
    </div>

    <button class="bet-controls__btn bet-controls__btn--allin" @click="handleAllIn" :disabled="disabled">
      <Coins :size="18" />
      All-in
    </button>
  </div>
</template>

<style scoped>
.bet-controls {
  display: flex;
  align-items: stretch;
  gap: 6px;
  padding: 8px 10px;
  background: rgba(10, 10, 20, 0.85);
  border: 1px solid rgba(255, 215, 0, 0.12);
  border-radius: 12px;
  backdrop-filter: blur(16px);
  width: 100%;
  max-width: 620px;
}

.bet-controls__btn {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 5px;
  padding: 6px 12px;
  border: none;
  border-radius: 8px;
  font-size: 12px;
  font-weight: 600;
  cursor: pointer;
  transition: all 0.2s;
  white-space: nowrap;
}
.bet-controls__btn:disabled { opacity: 0.35; cursor: not-allowed; }
.bet-controls__btn:hover:not(:disabled) { transform: translateY(-1px); }

.bet-controls__btn--fold {
  background: rgba(255, 255, 255, 0.06);
  color: #ff6666;
  border: 1px solid rgba(255, 102, 102, 0.2);
}
.bet-controls__btn--fold:hover:not(:disabled) {
  background: rgba(255, 102, 102, 0.15);
  border-color: rgba(255, 102, 102, 0.4);
}

.bet-controls__btn--check {
  background: rgba(255, 255, 255, 0.06);
  color: #4da6ff;
  border: 1px solid rgba(77, 166, 255, 0.2);
}
.bet-controls__btn--check:hover:not(:disabled) {
  background: rgba(77, 166, 255, 0.15);
  border-color: rgba(77, 166, 255, 0.4);
}

.bet-controls__btn--allin {
  background: linear-gradient(135deg, #b91c1c, #dc2626);
  color: white;
  box-shadow: 0 2px 12px rgba(220, 38, 38, 0.25);
  padding: 6px 16px;
  font-size: 13px;
}
.bet-controls__btn--allin:hover:not(:disabled) {
  box-shadow: 0 4px 18px rgba(220, 38, 38, 0.45);
}

.bet-controls__chips {
  display: flex;
  flex-direction: column;
  gap: 2px;
  flex: 1;
  min-width: 0;
  align-items: center;
}

.bet-controls__chip-row {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 4px;
}

.bet-controls__center {
  display: flex;
  flex-direction: column;
  gap: 2px;
  flex: 1;
  min-width: 0;
}

.bet-controls__btn--raise {
  background: linear-gradient(135deg, #ffd700, #e6a800);
  color: #1a1a00;
  box-shadow: 0 2px 12px rgba(255, 215, 0, 0.2);
  width: 100%;
  padding: 5px 12px;
}
.bet-controls__btn--raise:hover:not(:disabled) {
  box-shadow: 0 4px 16px rgba(255, 215, 0, 0.35);
}

@media (max-width: 768px) {
  .bet-controls {
    flex-wrap: wrap;
    padding: 6px 8px;
    gap: 4px;
  }
  .bet-controls__center {
    order: 1;
    width: 100%;
    display: contents;
  }
  .bet-controls__chips {
    order: 1;
    width: 100%;
  }
  .bet-controls__btn--raise {
    order: 2;
    width: 100%;
    padding: 7px 8px;
    font-size: 12px;
  }
  .bet-controls__btn--fold {
    order: 3;
    flex: 1;
    font-size: 11px;
  }
  .bet-controls__btn--check {
    order: 3;
    flex: 1;
    font-size: 11px;
  }
  .bet-controls__btn--allin {
    order: 4;
    width: 100%;
    padding: 7px 8px;
    font-size: 12px;
  }
  .bet-controls__chip-row {
    display: flex;
    overflow-x: auto;
    -webkit-overflow-scrolling: touch;
    gap: 6px;
    padding: 4px 0 6px;
    justify-content: flex-start;
    scrollbar-width: none;
  }
  .bet-controls__chip-row::-webkit-scrollbar { display: none; }
}
</style>

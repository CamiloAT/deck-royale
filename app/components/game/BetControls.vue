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

const raiseAmount = ref(props.currentBet + props.minRaise)

const callAmount = computed(() => {
  return Math.min(props.currentBet - props.playerBet, props.playerChips)
})

const maxRaise = computed(() => props.playerChips + props.playerBet)
const minRaiseVal = computed(() => props.currentBet + props.minRaise)

function handleRaise() {
  emit('action', 'raise', raiseAmount.value)
}

function handleAllIn() {
  emit('action', 'all_in')
}

watch(() => props.currentBet, (val) => {
  raiseAmount.value = val + props.minRaise
})
</script>

<template>
  <div class="bet-controls">
    <button class="bet-controls__btn bet-controls__btn--fold" @click="emit('action', 'fold')" :disabled="disabled">
      <X :size="14" />
      Foldear
    </button>

    <button class="bet-controls__btn bet-controls__btn--check" @click="emit('action', canCheck ? 'check' : 'call')" :disabled="disabled">
      <Check :size="14" />
      {{ canCheck ? 'Pasar' : `Igualar $${callAmount.toLocaleString()}` }}
    </button>

    <div class="bet-controls__raise">
      <SharedNumberInput
        v-model="raiseAmount"
        :min="minRaiseVal"
        :max="maxRaise"
        :step="minRaise"
      />
      <button
        class="bet-controls__btn bet-controls__btn--raise"
        @click="handleRaise"
        :disabled="disabled || raiseAmount > playerChips + playerBet"
      >
        <TrendingUp :size="14" />
        Subir
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
  max-width: 560px;
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

.bet-controls__btn--raise {
  background: linear-gradient(135deg, #ffd700, #e6a800);
  color: #1a1a00;
  box-shadow: 0 2px 12px rgba(255, 215, 0, 0.2);
  width: 100%;
}
.bet-controls__btn--raise:hover:not(:disabled) {
  box-shadow: 0 4px 16px rgba(255, 215, 0, 0.35);
}

.bet-controls__btn--allin {
  background: linear-gradient(135deg, #1b8a2a, #22c55e);
  color: white;
  box-shadow: 0 2px 12px rgba(34, 197, 94, 0.25);
  padding: 6px 16px;
  font-size: 13px;
}
.bet-controls__btn--allin:hover:not(:disabled) {
  box-shadow: 0 4px 18px rgba(34, 197, 94, 0.45);
}

.bet-controls__raise {
  display: flex;
  flex-direction: column;
  gap: 4px;
  flex: 1;
  min-width: 0;
}
</style>

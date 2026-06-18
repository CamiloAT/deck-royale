<script setup lang="ts">
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

const maxRaise = computed(() => props.playerChips)

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
      Fold
    </button>

    <button class="bet-controls__btn bet-controls__btn--check" @click="emit('action', canCheck ? 'check' : 'call')" :disabled="disabled">
      {{ canCheck ? 'Check' : `Call $${callAmount.toLocaleString()}` }}
    </button>

    <div class="bet-controls__raise">
      <input
        v-model.number="raiseAmount"
        type="range"
        :min="currentBet + minRaise"
        :max="maxRaise"
        :step="minRaise"
        class="bet-controls__slider"
        :disabled="disabled"
      />
      <div class="bet-controls__raise-info">
        <span>Raise: ${{ raiseAmount.toLocaleString() }}</span>
        <button
          class="bet-controls__btn bet-controls__btn--raise"
          @click="handleRaise"
          :disabled="disabled || raiseAmount > playerChips + playerBet"
        >
          Raise
        </button>
      </div>
    </div>

    <button class="bet-controls__btn bet-controls__btn--allin" @click="handleAllIn" :disabled="disabled">
      All In (${{ playerChips.toLocaleString() }})
    </button>
  </div>
</template>

<style scoped>
.bet-controls {
  display: flex; align-items: center; gap: 12px; padding: 16px;
  background: rgba(0, 0, 0, 0.7); border-radius: 12px; backdrop-filter: blur(10px);
  flex-wrap: wrap; justify-content: center;
}
.bet-controls__btn {
  padding: 12px 24px; border: none; border-radius: 8px;
  font-size: 14px; font-weight: bold; cursor: pointer;
  transition: all 0.2s ease; text-transform: uppercase; letter-spacing: 1px;
}
.bet-controls__btn:hover:not(:disabled) { transform: translateY(-2px); box-shadow: 0 4px 12px rgba(0, 0, 0, 0.3); }
.bet-controls__btn:disabled { opacity: 0.5; cursor: not-allowed; }
.bet-controls__btn--fold { background: #666; color: white; }
.bet-controls__btn--check { background: #0066cc; color: white; }
.bet-controls__btn--raise { background: #00aa00; color: white; }
.bet-controls__btn--allin {
  background: linear-gradient(135deg, #cc0000, #ff4444); color: white;
  animation: allInPulse 2s infinite;
}
.bet-controls__raise { display: flex; flex-direction: column; gap: 8px; min-width: 200px; }
.bet-controls__slider {
  width: 100%; height: 6px; border-radius: 3px;
  background: #333; outline: none; -webkit-appearance: none;
}
.bet-controls__slider::-webkit-slider-thumb {
  -webkit-appearance: none; width: 18px; height: 18px; border-radius: 50%;
  background: #00aa00; cursor: pointer;
}
.bet-controls__raise-info {
  display: flex; justify-content: space-between; align-items: center;
  color: #aaa; font-size: 12px;
}

@keyframes allInPulse {
  0%, 100% { box-shadow: 0 0 0 0 rgba(255, 68, 68, 0.7); }
  50% { box-shadow: 0 0 0 10px rgba(255, 68, 68, 0); }
}
</style>

<script setup lang="ts">
import { X, Timer } from '@lucide/vue'
import type { Card } from '../../types/poker'

const props = defineProps<{
  turnStartedAt?: number
  turnTimer?: number
}>()

const emit = defineEmits<{
  (e: 'close'): void
}>()

const timeLeft = ref(0)
const timerColor = computed(() => {
  if (timeLeft.value <= 10) return '#ef4444'
  if (timeLeft.value <= 20) return '#f59e0b'
  return '#22c55e'
})

let interval: ReturnType<typeof setInterval> | null = null

function updateTimer() {
  if (!props.turnStartedAt || !props.turnTimer) {
    timeLeft.value = 0
    return
  }
  const elapsed = Date.now() - props.turnStartedAt
  const remaining = Math.max(0, props.turnTimer * 1000 - elapsed)
  timeLeft.value = Math.ceil(remaining / 1000)
}

onMounted(() => {
  updateTimer()
  interval = setInterval(updateTimer, 200)
})

onUnmounted(() => {
  if (interval) clearInterval(interval)
})

watch(() => props.turnStartedAt, () => { updateTimer() })

function c(rank: string, suit: Card['suit']): Card {
  return { rank, suit }
}

const hands = [
  {
    name: 'Escalera Real',
    desc: 'A, K, Q, J, 10 del mismo palo',
    cards: [c('A','spades'), c('K','spades'), c('Q','spades'), c('J','spades'), c('10','spades')],
    active: [0,1,2,3,4],
  },
  {
    name: 'Escalera de Color',
    desc: '5 cartas del mismo palo en secuencia',
    cards: [c('10','hearts'), c('9','hearts'), c('8','hearts'), c('7','hearts'), c('6','hearts')],
    active: [0,1,2,3,4],
  },
  {
    name: 'Poker',
    desc: '4 cartas del mismo valor',
    cards: [c('Q','hearts'), c('Q','diamonds'), c('Q','clubs'), c('Q','spades'), c('5','diamonds')],
    active: [0,1,2,3],
  },
  {
    name: 'Full House',
    desc: 'Trío + pareja',
    cards: [c('A','diamonds'), c('A','hearts'), c('A','clubs'), c('7','spades'), c('7','diamonds')],
    active: [0,1,2,3,4],
  },
  {
    name: 'Color',
    desc: '5 cartas del mismo palo',
    cards: [c('A','diamonds'), c('J','diamonds'), c('8','diamonds'), c('5','diamonds'), c('7','diamonds')],
    active: [0,1,2,3,4],
  },
  {
    name: 'Escalera',
    desc: '5 cartas en secuencia',
    cards: [c('10','hearts'), c('9','clubs'), c('8','spades'), c('7','hearts'), c('6','diamonds')],
    active: [0,1,2,3,4],
  },
  {
    name: 'Trío',
    desc: '3 cartas del mismo valor',
    cards: [c('Q','hearts'), c('Q','spades'), c('Q','clubs'), c('7','diamonds'), c('6','spades')],
    active: [0,1,2],
  },
  {
    name: 'Doble Pareja',
    desc: '2 parejas diferentes',
    cards: [c('J','hearts'), c('J','clubs'), c('9','spades'), c('9','hearts'), c('2','diamonds')],
    active: [0,1,2,3],
  },
  {
    name: 'Pareja',
    desc: '2 cartas del mismo valor',
    cards: [c('Q','spades'), c('Q','hearts'), c('6','clubs'), c('9','hearts'), c('2','spades')],
    active: [0,1],
  },
  {
    name: 'Carta Alta',
    desc: '5 cartas sin combinación',
    cards: [c('A','spades'), c('Q','hearts'), c('6','clubs'), c('5','hearts'), c('10','spades')],
    active: [0],
  },
]
</script>

<template>
  <Teleport to="body">
    <div class="help-overlay" @click.self="emit('close')">
      <div class="help-modal">
        <div class="help-modal__header">
          <div class="help-modal__title">Manos de Poker</div>
          <div v-if="timeLeft > 0" class="help-modal__timer" :style="{ color: timerColor }">
            <Timer :size="14" />
            {{ timeLeft }}s
          </div>
          <button class="help-modal__close" @click="emit('close')">
            <X :size="18" />
          </button>
        </div>

        <div class="help-modal__body">
          <div
            v-for="(hand, i) in hands"
            :key="i"
            class="help-hand"
          >
            <div class="help-hand__info">
              <div class="help-hand__rank">{{ i + 1 }}</div>
              <div class="help-hand__name">{{ hand.name }}</div>
              <div class="help-hand__desc">{{ hand.desc }}</div>
            </div>
            <div class="help-hand__cards">
              <GameCard
                v-for="(card, j) in hand.cards"
                :key="j"
                :card="card"
                small
                :dimmed="!hand.active.includes(j)"
              />
            </div>
          </div>
        </div>
      </div>
    </div>
  </Teleport>
</template>

<style scoped>
.help-overlay {
  position: fixed;
  inset: 0;
  z-index: 5000;
  display: flex;
  align-items: center;
  justify-content: center;
  background: rgba(0, 0, 0, 0.8);
  backdrop-filter: blur(6px);
}

.help-modal {
  background: #0f1520;
  border: 1px solid rgba(255, 215, 0, 0.2);
  border-radius: 16px;
  width: 92%;
  max-width: 440px;
  max-height: 85vh;
  display: flex;
  flex-direction: column;
  overflow: hidden;
}

.help-modal__header {
  display: flex;
  align-items: center;
  gap: 12px;
  padding: 16px 20px;
  border-bottom: 1px solid rgba(255, 215, 0, 0.1);
}

.help-modal__title {
  color: #ffd700;
  font-size: 18px;
  font-weight: 700;
  flex: 1;
}

.help-modal__timer {
  display: flex;
  align-items: center;
  gap: 4px;
  font-size: 14px;
  font-weight: 700;
  font-variant-numeric: tabular-nums;
}

.help-modal__close {
  background: rgba(255, 255, 255, 0.05);
  border: 1px solid rgba(255, 255, 255, 0.1);
  border-radius: 8px;
  width: 32px;
  height: 32px;
  display: flex;
  align-items: center;
  justify-content: center;
  color: #888;
  cursor: pointer;
  transition: all 0.2s;
}
.help-modal__close:hover {
  color: #fff;
  background: rgba(255, 255, 255, 0.1);
}

.help-modal__body {
  overflow-y: auto;
  padding: 12px 16px 20px;
  display: flex;
  flex-direction: column;
  gap: 6px;
}

.help-hand {
  display: flex;
  align-items: center;
  gap: 12px;
  padding: 10px 12px;
  background: rgba(255, 255, 255, 0.03);
  border-radius: 10px;
  transition: background 0.2s;
}
.help-hand:hover {
  background: rgba(255, 255, 255, 0.06);
}

.help-hand__info {
  flex: 1;
  min-width: 0;
}

.help-hand__rank {
  color: #ffd700;
  font-size: 10px;
  font-weight: 700;
  margin-bottom: 2px;
}

.help-hand__name {
  color: #fff;
  font-size: 13px;
  font-weight: 600;
  white-space: nowrap;
}

.help-hand__desc {
  color: rgba(255, 255, 255, 0.4);
  font-size: 11px;
  margin-top: 1px;
}

.help-hand__cards {
  display: flex;
  gap: 3px;
  flex-shrink: 0;
}

@media (max-width: 768px) {
  .help-modal {
    width: 96%;
    max-height: 80vh;
  }
  .help-modal__header {
    padding: 12px 14px;
  }
  .help-modal__title {
    font-size: 15px;
  }
  .help-modal__body {
    padding: 8px 10px 16px;
    gap: 4px;
  }
  .help-hand {
    padding: 8px 8px;
    gap: 8px;
  }
  .help-hand__name {
    font-size: 11px;
  }
  .help-hand__desc {
    font-size: 10px;
  }
  .help-hand__cards {
    gap: 2px;
  }
}
</style>

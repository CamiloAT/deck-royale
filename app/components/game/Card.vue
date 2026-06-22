<script setup lang="ts">
import type { Card } from '../../types/poker'

const props = defineProps<{
  card: Card
  faceDown?: boolean
  small?: boolean
  dimmed?: boolean
}>()

const suitSymbol = computed(() => {
  const symbols: Record<string, string> = {
    hearts: '♥',
    diamonds: '♦',
    clubs: '♣',
    spades: '♠',
  }
  return symbols[props.card.suit] || ''
})

const suitColor = computed(() => {
  return ['hearts', 'diamonds'].includes(props.card.suit) ? 'red' : 'black'
})
</script>

<template>
  <div
    class="card"
    :class="{
      'card--face-down': faceDown,
      'card--small': small,
      'card--dimmed': dimmed,
    }"
  >
    <template v-if="!faceDown">
      <div class="card__corner card__corner--top" :class="`card__corner--${suitColor}`">
        <span class="card__rank">{{ card.rank }}</span>
        <span class="card__suit-symbol">{{ suitSymbol }}</span>
      </div>
      <div class="card__center" :class="`card__center--${suitColor}`">
        <span class="card__suit-large">{{ suitSymbol }}</span>
      </div>
      <div class="card__corner card__corner--bottom" :class="`card__corner--${suitColor}`">
        <span class="card__rank">{{ card.rank }}</span>
        <span class="card__suit-symbol">{{ suitSymbol }}</span>
      </div>
    </template>
    <template v-else>
      <div class="card__back">
        <div class="card__back-pattern">
          <span class="card__back-text">DR</span>
        </div>
      </div>
    </template>
  </div>
</template>

<style scoped>
.card {
  width: 52px;
  height: 72px;
  border-radius: 5px;
  background: #fff;
  border: 1.5px solid #ccc;
  position: relative;
  box-shadow:
    0 2px 4px rgba(0, 0, 0, 0.2),
    inset 0 0 0 1px rgba(255, 255, 255, 0.5);
  display: flex;
  flex-direction: column;
  justify-content: space-between;
  padding: 3px 4px;
  font-family: system-ui, -apple-system, sans-serif;
  user-select: none;
  flex-shrink: 0;
  overflow: hidden;
}
.card--small {
  width: 36px;
  height: 50px;
  padding: 2px 3px;
}

/* Face down */
.card--face-down {
  background: linear-gradient(135deg, #1a1a5e 0%, #2d2d8a 50%, #1a1a5e 100%);
  border-color: #4a4a8a;
  box-shadow: 0 2px 6px rgba(0, 0, 0, 0.4);
}
.card--face-down .card__back {
  width: 100%;
  height: 100%;
  display: flex;
  align-items: center;
  justify-content: center;
}
.card--face-down .card__back-pattern {
  width: 80%;
  height: 80%;
  border: 1.5px solid rgba(255, 215, 0, 0.25);
  border-radius: 3px;
  display: flex;
  align-items: center;
  justify-content: center;
  background: repeating-linear-gradient(
    45deg,
    transparent,
    transparent 3px,
    rgba(255, 215, 0, 0.04) 3px,
    rgba(255, 215, 0, 0.04) 6px
  );
}
.card--face-down .card__back-text {
  color: rgba(255, 215, 0, 0.5);
  font-size: 11px;
  font-weight: bold;
  letter-spacing: 2px;
}
.card--small .card--face-down .card__back-text {
  font-size: 8px;
}

.card--dimmed {
  opacity: 0.25;
  filter: saturate(0.3);
}

/* Corners */
.card__corner {
  display: flex;
  flex-direction: column;
  align-items: center;
  line-height: 1;
  gap: 0;
}
.card__corner--bottom {
  transform: rotate(180deg);
}
.card__corner--red { color: #cc0000; }
.card__corner--black { color: #1a1a1a; }

.card__rank {
  font-size: 13px;
  font-weight: 700;
  line-height: 1;
}
.card--small .card__rank {
  font-size: 9px;
}

.card__suit-symbol {
  font-size: 11px;
  line-height: 1;
}
.card--small .card__suit-symbol {
  font-size: 8px;
}

/* Center */
.card__center {
  position: absolute;
  top: 50%;
  left: 50%;
  transform: translate(-50%, -50%);
}
.card__center--red { color: #cc0000; }
.card__center--black { color: #1a1a1a; }

.card__suit-large {
  font-size: 22px;
}
.card--small .card__suit-large {
  font-size: 15px;
}

@media (max-width: 768px) {
  .card {
    width: 42px;
    height: 58px;
    padding: 2px 3px;
    border-radius: 4px;
    border-width: 1px;
  }
  .card--small {
    width: 30px;
    height: 42px;
    padding: 1px 2px;
  }
  .card__rank { font-size: 11px; }
  .card__suit-symbol { font-size: 9px; }
  .card__suit-large { font-size: 18px; }
  .card--small .card__rank { font-size: 8px; }
  .card--small .card__suit-symbol { font-size: 7px; }
  .card--small .card__suit-large { font-size: 12px; }
}
</style>

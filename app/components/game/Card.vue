<script setup lang="ts">
import type { Card } from '../../types/poker'

const props = defineProps<{
  card: Card
  faceDown?: boolean
  small?: boolean
}>()

const suitSymbol = computed(() => {
  const symbols: Record<string, string> = {
    hearts: '\u2665',
    diamonds: '\u2666',
    clubs: '\u2663',
    spades: '\u2660',
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
      'card--red': suitColor === 'red' && !faceDown,
      'card--black': suitColor === 'black' && !faceDown,
    }"
  >
    <template v-if="!faceDown">
      <div class="card__corner card__corner--top">
        <span class="card__rank">{{ card.rank }}</span>
        <span class="card__suit">{{ suitSymbol }}</span>
      </div>
      <div class="card__center">
        <span class="card__suit-large">{{ suitSymbol }}</span>
      </div>
      <div class="card__corner card__corner--bottom">
        <span class="card__rank">{{ card.rank }}</span>
        <span class="card__suit">{{ suitSymbol }}</span>
      </div>
    </template>
    <template v-else>
      <div class="card__back">
        <span class="card__back-text">DR</span>
      </div>
    </template>
  </div>
</template>

<style scoped>
.card {
  width: 56px;
  height: 78px;
  border-radius: 6px;
  background: white;
  border: 1.5px solid #333;
  position: relative;
  box-shadow: 0 2px 6px rgba(0, 0, 0, 0.3);
  display: flex;
  flex-direction: column;
  justify-content: space-between;
  padding: 4px;
  font-family: 'Arial', sans-serif;
  user-select: none;
  transition: transform 0.3s ease;
  flex-shrink: 0;
}
.card--small { width: 40px; height: 56px; padding: 3px; }
.card--face-down { background: linear-gradient(135deg, #1a1a5e, #2d2d8a); border-color: #444; }
.card__corner { display: flex; flex-direction: column; align-items: center; line-height: 1; }
.card__corner--bottom { transform: rotate(180deg); }
.card__rank { font-size: 13px; font-weight: bold; }
.card--small .card__rank { font-size: 10px; }
.card__suit { font-size: 11px; }
.card--small .card__suit { font-size: 8px; }
.card__center { position: absolute; top: 50%; left: 50%; transform: translate(-50%, -50%); }
.card__suit-large { font-size: 22px; }
.card--small .card__suit-large { font-size: 16px; }
.card__back { display: flex; align-items: center; justify-content: center; width: 100%; height: 100%; }
.card__back-text { color: #ffd700; font-size: 14px; font-weight: bold; font-family: 'Georgia', serif; }
.card--small .card__back-text { font-size: 10px; }
</style>

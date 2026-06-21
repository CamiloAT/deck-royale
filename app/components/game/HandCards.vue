<script setup lang="ts">
import { Hand } from '@lucide/vue'
import type { Card } from '../../types/poker'

defineProps<{
  cards: Card[]
  faceDown?: boolean
}>()
</script>

<template>
  <div class="hand-cards" :class="{ 'hand-cards--empty': !cards.length }">
    <div class="hand-cards__label">
      <Hand :size="14" />
      Tu mano
    </div>
    <div class="hand-cards__cards">
      <GameCard
        v-for="(card, index) in cards"
        :key="index"
        :card="card"
        :face-down="faceDown"
        class="hand-cards__card"
      />
      <div v-if="!cards.length" class="hand-cards__placeholder">Esperando cartas...</div>
    </div>
  </div>
</template>

<style scoped>
.hand-cards {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 6px;
  padding: 10px 16px;
  background: rgba(0, 0, 0, 0.5);
  border: 1px solid rgba(255, 215, 0, 0.15);
  border-radius: 12px;
  backdrop-filter: blur(8px);
}
.hand-cards--empty {
  opacity: 0.5;
}
.hand-cards__label {
  color: rgba(255, 215, 0, 0.7);
  font-size: 11px;
  text-transform: uppercase;
  letter-spacing: 2px;
  display: flex;
  align-items: center;
  gap: 6px;
}
.hand-cards__cards {
  display: flex;
  gap: 8px;
  align-items: center;
}
.hand-cards__placeholder {
  color: #666;
  font-size: 11px;
  font-style: italic;
}
.hand-cards__card {
  animation: deal 0.4s ease-out;
}
.hand-cards__card:nth-child(2) {
  animation-delay: 0.15s;
}

@keyframes deal {
  from { transform: translateY(-30px) rotateY(90deg); opacity: 0; }
  to { transform: translateY(0) rotateY(0); opacity: 1; }
}

@media (max-width: 768px) {
  .hand-cards {
    padding: 6px 10px;
    gap: 4px;
  }
  .hand-cards__label { font-size: 9px; letter-spacing: 1px; gap: 4px; }
  .hand-cards__cards { gap: 5px; }
  .hand-cards__placeholder { font-size: 9px; }
}
</style>

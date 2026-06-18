<script setup lang="ts">
import type { Card } from '../../types/poker'

defineProps<{
  cards: Card[]
  faceDown?: boolean
}>()
</script>

<template>
  <div class="hand-cards">
    <div class="hand-cards__label">Tu mano</div>
    <div class="hand-cards__cards">
      <GameCard
        v-for="(card, index) in cards"
        :key="index"
        :card="card"
        :face-down="faceDown"
        class="hand-cards__card"
      />
    </div>
  </div>
</template>

<style scoped>
.hand-cards { display: flex; flex-direction: column; align-items: center; gap: 8px; }
.hand-cards__label { color: #aaa; font-size: 12px; text-transform: uppercase; letter-spacing: 1px; }
.hand-cards__cards { display: flex; gap: 8px; }
.hand-cards__card { animation: deal 0.4s ease-out; }
.hand-cards__card:nth-child(2) { animation-delay: 0.15s; }

@keyframes deal {
  from { transform: translateY(-50px) rotateY(90deg); opacity: 0; }
  to { transform: translateY(0) rotateY(0); opacity: 1; }
}
</style>

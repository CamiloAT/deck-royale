<script setup lang="ts">
import type { Card } from '../../types/poker'

defineProps<{
  cards: Card[]
}>()
</script>

<template>
  <div class="community-cards">
    <TransitionGroup name="card-reveal" tag="div" class="community-cards__cards">
      <GameCard
        v-for="(card, index) in cards"
        :key="`${card.suit}-${card.rank}-${index}`"
        :card="card"
        class="community-cards__card"
      />
    </TransitionGroup>
    <div v-if="cards.length === 0" class="community-cards__empty">
      Esperando cartas...
    </div>
  </div>
</template>

<style scoped>
.community-cards { display: flex; flex-direction: column; align-items: center; gap: 12px; }
.community-cards__cards { display: flex; gap: 10px; justify-content: center; flex-wrap: wrap; }
.community-cards__empty { color: #666; font-size: 14px; font-style: italic; }

.card-reveal-enter-active { animation: cardReveal 0.5s ease-out; }

@keyframes cardReveal {
  from { transform: scale(0.5) rotateY(180deg); opacity: 0; }
  to { transform: scale(1) rotateY(0); opacity: 1; }
}
</style>

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

const flipping = ref(false)
let flipTimeout: ReturnType<typeof setTimeout> | null = null

watch(() => props.faceDown, () => {
  if (flipTimeout) clearTimeout(flipTimeout)
  flipping.value = true
  flipTimeout = setTimeout(() => { flipping.value = false }, 500)
})
</script>

<template>
  <div
    class="card"
    :class="{
      'card--face-down': faceDown,
      'card--small': small,
      'card--dimmed': dimmed,
      'card--flipping': flipping,
    }"
  >
    <div class="card__face card__front">
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
    </div>
    <div class="card__face card__back">
      <div class="card__back-border">
        <div class="card__back-inner">
          <div class="card__back-dots" />
          <div class="card__back-corner card__back-corner--tl" />
          <div class="card__back-corner card__back-corner--tr" />
          <div class="card__back-corner card__back-corner--bl" />
          <div class="card__back-corner card__back-corner--br" />
          <div class="card__back-chip">
            <div class="card__back-chip-ring">
              <span class="card__back-spade">♠</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<style scoped>
.card {
  width: 52px;
  height: 72px;
  border-radius: 5px;
  position: relative;
  perspective: 400px;
  user-select: none;
  flex-shrink: 0;
}

.card__face {
  width: 100%;
  height: 100%;
  border-radius: 5px;
  border: 1.5px solid #ccc;
  position: absolute;
  top: 0;
  left: 0;
  backface-visibility: hidden;
  -webkit-backface-visibility: hidden;
  transition: transform 0.5s ease;
  display: flex;
  flex-direction: column;
  justify-content: space-between;
  padding: 3px 4px;
  font-family: system-ui, -apple-system, sans-serif;
  overflow: hidden;
}

.card__front {
  background: #fff;
  box-shadow:
    0 2px 4px rgba(0, 0, 0, 0.2),
    inset 0 0 0 1px rgba(255, 255, 255, 0.5);
  transform: rotateY(0deg);
  z-index: 2;
}

.card__back {
  background: linear-gradient(160deg, #12162d 0%, #0e1124 40%, #161b38 100%);
  border-color: #b8962e;
  border-width: 2px;
  box-shadow: 0 2px 6px rgba(0, 0, 0, 0.4), inset 0 0 8px rgba(184, 150, 46, 0.05);
  transform: rotateY(180deg);
  z-index: 1;
  padding: 0;
  overflow: hidden;
}

.card--face-down .card__front {
  transform: rotateY(180deg);
}
.card--face-down .card__back {
  transform: rotateY(360deg);
}

.card--small {
  width: 36px;
  height: 50px;
}
.card--small .card__face {
  padding: 2px 3px;
}

.card__back-border {
  width: 100%;
  height: 100%;
  border: 1.5px solid #b8962e;
  border-radius: 3px;
  margin: 2px;
  width: calc(100% - 4px);
  height: calc(100% - 4px);
}

.card__back-inner {
  width: 100%;
  height: 100%;
  position: relative;
  overflow: hidden;
  display: flex;
  align-items: center;
  justify-content: center;
}

.card__back-dots {
  position: absolute;
  inset: 0;
  background-image:
    radial-gradient(circle, rgba(184, 150, 46, 0.25) 1px, transparent 1px);
  background-size: 8px 8px;
  background-position: 0 0;
}

.card__back-corner {
  position: absolute;
  width: 14px;
  height: 14px;
  border: 1.5px solid rgba(184, 150, 46, 0.4);
}
.card__back-corner--tl { top: 4px; left: 4px; border-right: none; border-bottom: none; border-radius: 4px 0 0 0; }
.card__back-corner--tr { top: 4px; right: 4px; border-left: none; border-bottom: none; border-radius: 0 4px 0 0; }
.card__back-corner--bl { bottom: 4px; left: 4px; border-right: none; border-top: none; border-radius: 0 0 0 4px; }
.card__back-corner--br { bottom: 4px; right: 4px; border-left: none; border-top: none; border-radius: 0 0 4px 0; }

.card__back-chip {
  position: relative;
  z-index: 2;
  width: 26px;
  height: 26px;
  border-radius: 50%;
  background: conic-gradient(
    from 0deg,
    #b8962e 0deg 22.5deg, #0e1124 22.5deg 45deg,
    #b8962e 45deg 67.5deg, #0e1124 67.5deg 90deg,
    #b8962e 90deg 112.5deg, #0e1124 112.5deg 135deg,
    #b8962e 135deg 157.5deg, #0e1124 157.5deg 180deg,
    #b8962e 180deg 202.5deg, #0e1124 202.5deg 225deg,
    #b8962e 225deg 247.5deg, #0e1124 247.5deg 270deg,
    #b8962e 270deg 292.5deg, #0e1124 292.5deg 315deg,
    #b8962e 315deg 337.5deg, #0e1124 337.5deg 360deg
  );
  border: 1.5px solid #b8962e;
  box-shadow: 0 1px 4px rgba(0, 0, 0, 0.5);
  display: flex;
  align-items: center;
  justify-content: center;
}

.card__back-chip-ring {
  width: 72%;
  height: 72%;
  border-radius: 50%;
  border: 1.5px solid #b8962e;
  background: radial-gradient(circle at 40% 40%, #161b38, #0e1124);
  display: flex;
  align-items: center;
  justify-content: center;
  box-shadow: inset 0 0 3px rgba(0, 0, 0, 0.6);
}

.card__back-spade {
  color: #b8962e;
  font-size: 10px;
  line-height: 1;
}

.card--small .card__back-border {
  margin: 1px;
  width: calc(100% - 2px);
  height: calc(100% - 2px);
}
.card--small .card__back-dots {
  background-size: 6px 6px;
}
.card--small .card__back-corner {
  width: 10px;
  height: 10px;
}
.card--small .card__back-corner--tl { top: 2px; left: 2px; }
.card--small .card__back-corner--tr { top: 2px; right: 2px; }
.card--small .card__back-corner--bl { bottom: 2px; left: 2px; }
.card--small .card__back-corner--br { bottom: 2px; right: 2px; }
.card--small .card__back-chip {
  width: 18px;
  height: 18px;
}
.card--small .card__back-spade {
  font-size: 7px;
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
    border-radius: 4px;
  }
  .card--small {
    width: 30px;
    height: 42px;
  }
  .card--small .card__face {
    padding: 1px 2px;
  }
  .card__face {
    padding: 2px 3px;
    border-width: 1px;
  }
  .card__rank { font-size: 11px; }
  .card__suit-symbol { font-size: 9px; }
  .card__suit-large { font-size: 18px; }
  .card--small .card__rank { font-size: 8px; }
  .card--small .card__suit-symbol { font-size: 7px; }
  .card--small .card__suit-large { font-size: 12px; }
}
</style>

<script setup lang="ts">
import { ref, onMounted } from 'vue'

const props = defineProps<{
  handNumber: number
}>()

const emit = defineEmits<{
  (e: 'done'): void
}>()

const phase = ref<'split' | 'shuffle' | 'spread' | 'fadeout'>('split')

const suits = [
  { symbol: '♠', color: 'black' },
  { symbol: '♥', color: 'red' },
  { symbol: '♣', color: 'black' },
  { symbol: '♦', color: 'red' },
]

const cascadeCards = Array.from({ length: 14 }, (_, i) => ({
  suit: suits[i % 4],
  rank: ['A', 'K', 'Q', 'J', '10', '9', '8', '7', '6', '5', '4', '3', '2'][i % 13],
}))

onMounted(() => {
  setTimeout(() => { phase.value = 'shuffle' }, 400)
  setTimeout(() => { phase.value = 'spread' }, 1000)
  setTimeout(() => { phase.value = 'fadeout' }, 1700)
  setTimeout(() => emit('done'), 2300)
})
</script>

<template>
  <div class="tr-overlay" :class="`tr-overlay--${phase}`">
    <!-- Golden shockwave -->
    <div class="tr-shockwave"></div>
    <div class="tr-shockwave tr-shockwave--2"></div>

    <!-- Particle burst -->
    <div class="tr-particles">
      <div v-for="i in 36" :key="i" class="tr-particle" :style="{
        animationDelay: `${(i * 0.02)}s`,
        '--tx': `${Math.cos(i * 0.175) * (150 + (i % 5) * 60)}px`,
        '--ty': `${Math.sin(i * 0.175) * (150 + (i % 5) * 60)}px`,
        '--size': `${2 + (i % 4)}px`,
      }"></div>
    </div>

    <!-- Spinning deck -->
    <div class="tr-deck">
      <div v-for="i in 14" :key="i" class="tr-deck__card" :style="{
        transform: `rotateY(${i * (360 / 14)}deg) translateZ(50px)`,
      }"></div>
    </div>

    <!-- Cascade of cards from top -->
    <div class="tr-cascade">
      <div v-for="(card, i) in cascadeCards" :key="i" class="tr-cascade__card" :style="{
        left: `${5 + i * 6.5}%`,
        animationDelay: `${i * 0.05}s`,
      }">
        <span class="tr-cascade__rank" :class="`tr-suit--${card.suit.color}`">{{ card.rank }}</span>
        <span class="tr-cascade__suit" :class="`tr-suit--${card.suit.color}`">{{ card.suit.symbol }}</span>
      </div>
    </div>

    <!-- Center rings + text -->
    <div class="tr-center">
      <div class="tr-center__ring tr-center__ring--1"></div>
      <div class="tr-center__ring tr-center__ring--2"></div>
      <div class="tr-center__ring tr-center__ring--3"></div>
      <div class="tr-center__glow"></div>
      <div class="tr-center__text">MANO #{{ handNumber }}</div>
    </div>
  </div>
</template>

<style scoped>
.tr-overlay {
  position: fixed;
  inset: 0;
  z-index: 5000;
  display: flex;
  align-items: center;
  justify-content: center;
  background: radial-gradient(circle at center, rgba(10, 15, 30, 0.97) 0%, rgba(0, 0, 0, 0.99) 100%);
  transition: opacity 0.6s ease-out;
  pointer-events: none;
  overflow: hidden;
}

.tr-overlay--fadeout {
  opacity: 0;
}

/* Shockwave */
.tr-shockwave {
  position: absolute;
  top: 50%;
  left: 50%;
  width: 10px;
  height: 10px;
  border-radius: 50%;
  border: 3px solid #ffd700;
  transform: translate(-50%, -50%);
  opacity: 0;
  animation: shockwave 0.9s ease-out 0.3s forwards;
}
.tr-shockwave--2 {
  border-color: rgba(255, 215, 0, 0.4);
  animation-delay: 0.45s;
}

/* Particles */
.tr-particles {
  position: absolute;
  inset: 0;
  pointer-events: none;
}

.tr-particle {
  position: absolute;
  top: 50%;
  left: 50%;
  width: var(--size, 3px);
  height: var(--size, 3px);
  background: #ffd700;
  border-radius: 50%;
  opacity: 0;
  animation: particleBurst 0.7s ease-out 0.35s forwards;
}

/* Spinning deck */
.tr-deck {
  position: absolute;
  top: 50%;
  left: 50%;
  width: 50px;
  height: 70px;
  perspective: 300px;
  opacity: 0;
  animation: deckSpin 1s ease-in-out 0.2s forwards;
  transform: translate(-50%, -50%);
}

.tr-deck__card {
  position: absolute;
  width: 100%;
  height: 100%;
  background: linear-gradient(145deg, #1c2940 0%, #111827 100%);
  border: 1.5px solid rgba(255, 215, 0, 0.2);
  border-radius: 5px;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.6);
  transform-style: preserve-3d;
  backface-visibility: hidden;
}

/* Cascade cards */
.tr-cascade {
  position: absolute;
  top: -120px;
  left: 0;
  right: 0;
  height: 120px;
  pointer-events: none;
}

.tr-cascade__card {
  position: absolute;
  width: 38px;
  height: 54px;
  background: linear-gradient(145deg, #fefefe 0%, #e8e8e8 100%);
  border-radius: 4px;
  border: 1.5px solid rgba(0, 0, 0, 0.12);
  box-shadow: 0 4px 16px rgba(0, 0, 0, 0.5);
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  gap: 0;
  opacity: 0;
  animation: cascadeFall 0.9s ease-in forwards;
  overflow: hidden;
}

.tr-cascade__rank {
  font-size: 10px;
  font-weight: 900;
  line-height: 1;
  font-family: 'Georgia', serif;
}

.tr-cascade__suit {
  font-size: 12px;
  line-height: 1;
  font-weight: 700;
}

.tr-suit--red { color: #dc2626; }
.tr-suit--black { color: #1a1a2e; }

/* Center */
.tr-center {
  position: relative;
  z-index: 10;
  display: flex;
  align-items: center;
  justify-content: center;
}

.tr-center__ring {
  position: absolute;
  border-radius: 50%;
  border: 2px solid;
  opacity: 0;
}

.tr-center__ring--1 {
  width: 80px;
  height: 80px;
  border-color: rgba(255, 215, 0, 0.5);
  animation: ringExpand 0.7s ease-out 0.4s forwards;
}
.tr-center__ring--2 {
  width: 150px;
  height: 150px;
  border-color: rgba(255, 215, 0, 0.3);
  animation: ringExpand 0.7s ease-out 0.5s forwards;
}
.tr-center__ring--3 {
  width: 220px;
  height: 220px;
  border-color: rgba(255, 215, 0, 0.1);
  animation: ringExpand 0.7s ease-out 0.6s forwards;
}

.tr-center__glow {
  position: absolute;
  width: 100px;
  height: 100px;
  background: radial-gradient(circle, rgba(255, 215, 0, 0.15) 0%, transparent 70%);
  border-radius: 50%;
  animation: glowPulse 1s ease-out 0.4s both;
}

.tr-center__text {
  font-size: 36px;
  font-weight: 700;
  color: #ffd700;
  letter-spacing: 6px;
  font-family: 'Georgia', serif;
  text-shadow: 0 0 30px rgba(255, 215, 0, 0.6), 0 0 60px rgba(255, 215, 0, 0.3);
  animation: textFlash 0.5s ease-out 0.5s both;
}

/* === KEYFRAMES === */
@keyframes shockwave {
  0% { width: 10px; height: 10px; opacity: 0.8; border-width: 3px; }
  100% { width: 900px; height: 900px; opacity: 0; border-width: 1px; }
}

@keyframes particleBurst {
  0% { opacity: 1; transform: translate(0, 0) scale(1); }
  100% { opacity: 0; transform: translate(var(--tx), var(--ty)) scale(0); }
}

@keyframes deckSpin {
  0% { opacity: 1; transform: translate(-50%, -50%) rotateY(0deg) scale(0.5); }
  40% { opacity: 1; transform: translate(-50%, -50%) rotateY(720deg) scale(1.3); }
  70% { opacity: 0.5; transform: translate(-50%, -50%) rotateY(1080deg) scale(1.6); }
  100% { opacity: 0; transform: translate(-50%, -50%) rotateY(1440deg) scale(2.2); }
}

@keyframes cascadeFall {
  0% { opacity: 0; transform: translateY(0) rotate(-15deg) scale(0.7); }
  15% { opacity: 1; }
  50% { opacity: 1; transform: translateY(calc(50vh + 40px)) rotate(10deg) scale(1.05); }
  100% { opacity: 0; transform: translateY(calc(100vh + 120px)) rotate(25deg) scale(0.6); }
}

@keyframes ringExpand {
  0% { transform: scale(0.3); opacity: 0.8; }
  100% { transform: scale(1); opacity: 0; }
}

@keyframes glowPulse {
  0% { opacity: 0; transform: scale(0.5); }
  50% { opacity: 1; transform: scale(1.2); }
  100% { opacity: 0; transform: scale(1.5); }
}

@keyframes textFlash {
  0% { opacity: 0; transform: scale(2.5); filter: blur(12px); }
  50% { opacity: 1; transform: scale(1.1); filter: blur(0); }
  100% { opacity: 1; transform: scale(1); filter: blur(0); }
}
</style>

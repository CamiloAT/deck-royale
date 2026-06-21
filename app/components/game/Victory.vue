<script setup lang="ts">
import { Crown } from '@lucide/vue'

const props = defineProps<{
  winnerNickname: string
  amountWon: number
}>()

const emit = defineEmits<{
  (e: 'done'): void
}>()

const phase = ref<'in' | 'out'>('in')
const chips = Array.from({ length: 18 }, (_, i) => ({
  id: i,
  delay: `${(i * 0.08)}s`,
  startX: `${-20 + Math.random() * 140}%`,
  startY: `${-20 + Math.random() * 140}%`,
  rotation: `${Math.random() * 360}deg`,
}))

onMounted(() => {
  setTimeout(() => { phase.value = 'out' }, 2200)
  setTimeout(() => emit('done'), 3000)
})
</script>

<template>
  <div class="victory-overlay" :class="`victory-overlay--${phase}`">
    <!-- Flying chips converging to center -->
    <div class="victory-chips">
      <div v-for="chip in chips" :key="chip.id" class="victory-chip" :style="{
        left: chip.startX,
        top: chip.startY,
        animationDelay: chip.delay,
      }">
        <div class="victory-chip__face">$</div>
      </div>
    </div>

    <!-- Golden pulse rings -->
    <div class="victory-rings">
      <div class="victory-ring victory-ring--1"></div>
      <div class="victory-ring victory-ring--2"></div>
      <div class="victory-ring victory-ring--3"></div>
    </div>

    <!-- Center banner -->
    <div class="victory-center">
      <div class="victory-crown">
        <Crown :size="48" />
      </div>
      <div class="victory-label">GANADOR</div>
      <div class="victory-name">{{ props.winnerNickname }}</div>
      <div class="victory-amount">
        +${{ props.amountWon.toLocaleString() }}
      </div>
    </div>

    <!-- Sparkle particles -->
    <div class="victory-sparkles">
      <div v-for="i in 24" :key="i" class="victory-sparkle" :style="{
        left: `${(i / 24) * 100}%`,
        animationDelay: `${(i * 0.12) % 2}s`,
      }"></div>
    </div>
  </div>
</template>

<style scoped>
.victory-overlay {
  position: fixed;
  inset: 0;
  z-index: 4000;
  display: flex;
  align-items: center;
  justify-content: center;
  pointer-events: none;
  background: rgba(0, 0, 0, 0.6);
  transition: opacity 0.8s ease-out;
}

.victory-overlay--out {
  opacity: 0;
}

/* Flying chips */
.victory-chips {
  position: absolute;
  inset: 0;
  pointer-events: none;
}

.victory-chip {
  position: absolute;
  width: 36px;
  height: 36px;
  border-radius: 50%;
  opacity: 0;
  animation: chipFly 2s ease-out forwards;
  background:
    conic-gradient(from 0deg, #ffd700 0%, #b8860b 15%, #ffd700 30%, #b8860b 45%, #ffd700 60%, #b8860b 75%, #ffd700 100%);
  box-shadow:
    0 2px 10px rgba(255, 215, 0, 0.5),
    inset 0 -2px 4px rgba(0, 0, 0, 0.3),
    inset 0 2px 4px rgba(255, 255, 255, 0.2);
  border: 2px solid #b8860b;
  transform: translate(-50%, -50%);
}

.victory-chip__face {
  width: 22px;
  height: 22px;
  border-radius: 50%;
  background: linear-gradient(135deg, #fefefe 0%, #d4d4d4 100%);
  display: flex;
  align-items: center;
  justify-content: center;
  margin: 4px auto 0;
  font-size: 13px;
  font-weight: 900;
  color: #1a1a2e;
  border: 1px solid #999;
  box-shadow: inset 0 1px 2px rgba(255, 255, 255, 0.8);
  line-height: 1;
}

/* Rings */
.victory-rings {
  position: absolute;
  top: 50%;
  left: 50%;
  transform: translate(-50%, -50%);
  pointer-events: none;
}

.victory-ring {
  position: absolute;
  border-radius: 50%;
  border: 2px solid #ffd700;
  top: 50%;
  left: 50%;
  transform: translate(-50%, -50%);
  opacity: 0;
}

.victory-ring--1 {
  width: 80px;
  height: 80px;
  animation: ringPulse 1.8s ease-out 0.3s forwards;
}
.victory-ring--2 {
  width: 160px;
  height: 160px;
  border-color: rgba(255, 215, 0, 0.5);
  animation: ringPulse 1.8s ease-out 0.5s forwards;
}
.victory-ring--3 {
  width: 260px;
  height: 260px;
  border-color: rgba(255, 215, 0, 0.2);
  animation: ringPulse 1.8s ease-out 0.7s forwards;
}

/* Center */
.victory-center {
  position: relative;
  z-index: 10;
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 4px;
}

.victory-crown {
  color: #ffd700;
  filter: drop-shadow(0 0 16px rgba(255, 215, 0, 0.6));
  animation: crownBounce 0.6s ease-out 0.2s both;
}

.victory-label {
  font-size: 14px;
  font-weight: 700;
  color: rgba(255, 255, 255, 0.6);
  letter-spacing: 8px;
  text-transform: uppercase;
  animation: labelSlide 0.5s ease-out 0.3s both;
}

.victory-name {
  font-size: 42px;
  font-weight: 900;
  color: #ffd700;
  text-shadow:
    0 0 20px rgba(255, 215, 0, 0.5),
    0 0 40px rgba(255, 215, 0, 0.2),
    0 4px 8px rgba(0, 0, 0, 0.6);
  font-family: 'Georgia', serif;
  animation: nameZoom 0.5s ease-out 0.35s both;
}

.victory-amount {
  font-size: 20px;
  font-weight: 700;
  color: #4ade80;
  text-shadow: 0 0 12px rgba(74, 222, 128, 0.4);
  animation: amountPop 0.4s ease-out 0.5s both;
}

/* Sparkles */
.victory-sparkles {
  position: absolute;
  inset: 0;
  pointer-events: none;
}

.victory-sparkle {
  position: absolute;
  top: 50%;
  left: 50%;
  width: 3px;
  height: 3px;
  background: #ffd700;
  border-radius: 50%;
  opacity: 0;
  animation: sparkleFloat 1.5s ease-in-out infinite;
}

/* === KEYFRAMES === */
@keyframes chipFly {
  0% { opacity: 0; transform: translate(-50%, -50%) scale(0.3) rotate(0deg); }
  15% { opacity: 1; }
  50% { opacity: 1; transform: translate(calc(50vw - 50%), calc(50vh - 50%)) scale(1.1) rotate(180deg); }
  70% { opacity: 0.8; transform: translate(calc(50vw - 50%), calc(50vh - 50%)) scale(1.3) rotate(270deg); }
  100% { opacity: 0; transform: translate(calc(50vw - 50%), calc(50vh - 50%)) scale(1.6) rotate(360deg); }
}

@keyframes ringPulse {
  0% { transform: translate(-50%, -50%) scale(0.3); opacity: 0.8; }
  100% { transform: translate(-50%, -50%) scale(1); opacity: 0; }
}

@keyframes crownBounce {
  0% { transform: scale(0) rotate(-20deg); opacity: 0; }
  60% { transform: scale(1.2) rotate(5deg); opacity: 1; }
  100% { transform: scale(1) rotate(0deg); opacity: 1; }
}

@keyframes labelSlide {
  0% { transform: translateY(-10px); opacity: 0; }
  100% { transform: translateY(0); opacity: 1; }
}

@keyframes nameZoom {
  0% { transform: scale(0.5); opacity: 0; }
  60% { transform: scale(1.15); opacity: 1; }
  100% { transform: scale(1); opacity: 1; }
}

@keyframes amountPop {
  0% { transform: scale(0); opacity: 0; }
  70% { transform: scale(1.2); opacity: 1; }
  100% { transform: scale(1); opacity: 1; }
}

@keyframes sparkleFloat {
  0% { opacity: 0; transform: translate(0, 0) scale(0); }
  20% { opacity: 0.8; transform: translate(0, -20px) scale(1); }
  80% { opacity: 0.4; transform: translate(0, -80px) scale(0.6); }
  100% { opacity: 0; transform: translate(0, -120px) scale(0); }
}

@media (max-width: 768px) {
  .victory-chip {
    width: 28px;
    height: 28px;
  }
  .victory-chip__face {
    width: 17px;
    height: 17px;
    margin: 3px auto 0;
    font-size: 10px;
  }
  .victory-ring--1 { width: 60px; height: 60px; }
  .victory-ring--2 { width: 120px; height: 120px; }
  .victory-ring--3 { width: 180px; height: 180px; }
  .victory-crown { transform: scale(0.8); }
  .victory-label { font-size: 11px; letter-spacing: 5px; }
  .victory-name { font-size: 28px; }
  .victory-amount { font-size: 16px; }
}
</style>

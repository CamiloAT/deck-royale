<script setup lang="ts">
import { ref, onMounted } from 'vue'

const emit = defineEmits<{
  (e: 'done'): void
}>()

const countdown = ref(3)
const phase = ref<'cards' | 'countdown' | 'fadeout'>('cards')

onMounted(() => {
  setTimeout(() => {
    phase.value = 'countdown'
  }, 800)

  const timer = setInterval(() => {
    countdown.value--
    if (countdown.value <= 0) {
      clearInterval(timer)
      phase.value = 'fadeout'
      setTimeout(() => emit('done'), 800)
    }
  }, 1000)
})
</script>

<template>
  <div class="entry-overlay" :class="`entry-overlay--${phase}`">
    <!-- Background particles -->
    <div class="entry-particles">
      <div v-for="i in 24" :key="i" class="entry-particle" :style="{
        left: `${(i / 24) * 100}%`,
        animationDelay: `${(i * 0.3) % 3}s`,
        animationDuration: `${2 + (i % 3)}s`,
      }"></div>
    </div>

    <!-- Flying cards around center -->
    <div class="entry-cards">
      <div class="entry-card entry-card--1"><div class="entry-card__face"><span class="entry-suit entry-suit--red">A♥</span></div></div>
      <div class="entry-card entry-card--2"><div class="entry-card__face"><span class="entry-suit entry-suit--black">K♠</span></div></div>
      <div class="entry-card entry-card--3"><div class="entry-card__face"><span class="entry-suit entry-suit--red">Q♦</span></div></div>
      <div class="entry-card entry-card--4"><div class="entry-card__face"><span class="entry-suit entry-suit--black">J♣</span></div></div>
      <div class="entry-card entry-card--5"><div class="entry-card__face"><span class="entry-suit entry-suit--red">10♥</span></div></div>
      <div class="entry-card entry-card--6"><div class="entry-card__face"><span class="entry-suit entry-suit--black">A♠</span></div></div>
      <div class="entry-card entry-card--7"><div class="entry-card__face"><span class="entry-suit entry-suit--red">10♦</span></div></div>
      <div class="entry-card entry-card--8"><div class="entry-card__face"><span class="entry-suit entry-suit--black">A♣</span></div></div>
    </div>

    <!-- Center content -->
    <div class="entry-center">
      <div class="entry-logo">
        <div class="entry-logo__suits">
          <span class="entry-suit--black">♠</span>
          <span class="entry-suit--red">♥</span>
          <span class="entry-suit--black">♣</span>
          <span class="entry-suit--red">♦</span>
        </div>
        <div class="entry-logo__text">DECK ROYALE</div>
        <div class="entry-logo__line"></div>
      </div>

      <Transition name="count" mode="out-in">
        <div v-if="phase === 'countdown' || phase === 'fadeout'" :key="countdown" class="entry-countdown">
          <div v-if="countdown > 0" class="entry-countdown__number">{{ countdown }}</div>
          <div v-else class="entry-countdown__go">GO!</div>
        </div>
      </Transition>

      <div v-if="phase === 'cards'" class="entry-waiting">Preparando mesa...</div>
      <div v-else-if="countdown > 0" class="entry-waiting">Entrando a la partida</div>
      <div v-else class="entry-waiting">Buena suerte!</div>
    </div>

    <!-- Fan at bottom -->
    <div class="entry-fan">
      <div v-for="i in 7" :key="i" class="entry-fan__card" :style="{
        transform: `rotate(${(i - 4) * 10}deg)`,
      }">
        <span class="entry-fan__suit" :class="i % 2 === 0 ? 'entry-suit--red' : 'entry-suit--black'">♠♥♣♦♠♥♣</span>
      </div>
    </div>
  </div>
</template>

<style scoped>
.entry-overlay {
  position: fixed;
  inset: 0;
  z-index: 5000;
  display: flex;
  align-items: center;
  justify-content: center;
  background: radial-gradient(ellipse at center, #0f1a2e 0%, #060a12 60%, #000 100%);
  transition: opacity 0.8s ease-out;
  overflow: hidden;
}

.entry-overlay--fadeout {
  opacity: 0;
  pointer-events: none;
}

/* Particles */
.entry-particles {
  position: absolute;
  inset: 0;
  pointer-events: none;
}

.entry-particle {
  position: absolute;
  bottom: -10px;
  width: 2px;
  height: 2px;
  background: #ffd700;
  border-radius: 50%;
  opacity: 0;
  animation: particleFloat linear infinite;
}

/* Flying cards - positioned relative to center viewport */
.entry-cards {
  position: absolute;
  top: 50%;
  left: 50%;
  width: 0;
  height: 0;
  pointer-events: none;
  z-index: 5;
}

.entry-card {
  position: absolute;
  width: 60px;
  height: 84px;
  background: linear-gradient(145deg, #1c2940 0%, #111827 100%);
  border: 2px solid rgba(255, 215, 0, 0.25);
  border-radius: 8px;
  box-shadow: 0 4px 24px rgba(0, 0, 0, 0.6), inset 0 0 12px rgba(255, 215, 0, 0.05);
  opacity: 0;
  left: -30px;
  top: -42px;
}

.entry-card__face {
  width: 100%;
  height: 100%;
  display: flex;
  align-items: center;
  justify-content: center;
}

.entry-suit { font-size: 20px; font-weight: 900; font-family: 'Georgia', serif; }
.entry-suit--red { color: #ef4444; text-shadow: 0 0 8px rgba(239, 68, 68, 0.4); }
.entry-suit--black { color: #e5e7eb; text-shadow: 0 0 8px rgba(255, 255, 255, 0.15); }

.entry-card--1 { animation: cardOrbit1 2.8s ease-out 0.1s forwards; }
.entry-card--2 { animation: cardOrbit2 2.8s ease-out 0.2s forwards; }
.entry-card--3 { animation: cardOrbit3 2.8s ease-out 0.3s forwards; }
.entry-card--4 { animation: cardOrbit4 2.8s ease-out 0.4s forwards; }
.entry-card--5 { animation: cardOrbit5 2.8s ease-out 0.5s forwards; }
.entry-card--6 { animation: cardOrbit6 2.8s ease-out 0.6s forwards; }
.entry-card--7 { animation: cardOrbit7 2.8s ease-out 0.7s forwards; }
.entry-card--8 { animation: cardOrbit8 2.8s ease-out 0.8s forwards; }

/* Center */
.entry-center {
  position: relative;
  z-index: 10;
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 28px;
}

.entry-logo {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 10px;
}

.entry-logo__suits {
  display: flex;
  gap: 18px;
  font-size: 24px;
  animation: suitsGlow 2s ease-in-out infinite;
}

.entry-logo__text {
  font-size: 52px;
  font-weight: 700;
  color: #ffd700;
  letter-spacing: 14px;
  font-family: 'Georgia', serif;
  text-shadow: 0 0 30px rgba(255, 215, 0, 0.4), 0 0 60px rgba(255, 215, 0, 0.15);
  animation: logoPulse 2s ease-in-out infinite;
}

.entry-logo__line {
  width: 140px;
  height: 1px;
  background: linear-gradient(90deg, transparent, #ffd700, transparent);
  animation: lineExpand 0.8s ease-out 0.5s both;
}

/* Countdown */
.entry-countdown {
  height: 90px;
  display: flex;
  align-items: center;
  justify-content: center;
}

.entry-countdown__number {
  font-size: 80px;
  font-weight: 900;
  color: #ffd700;
  text-shadow: 0 0 40px rgba(255, 215, 0, 0.6), 0 0 80px rgba(255, 215, 0, 0.3);
  font-family: 'Georgia', serif;
}

.entry-countdown__go {
  font-size: 72px;
  font-weight: 900;
  color: #4ade80;
  text-shadow: 0 0 40px rgba(74, 222, 128, 0.6), 0 0 80px rgba(74, 222, 128, 0.3);
  font-family: 'Georgia', serif;
  letter-spacing: 10px;
}

.entry-waiting {
  color: rgba(255, 255, 255, 0.4);
  font-size: 13px;
  letter-spacing: 3px;
  text-transform: uppercase;
  animation: waitingPulse 1.5s ease-in-out infinite;
}

/* Fan */
.entry-fan {
  position: absolute;
  bottom: 12%;
  left: 50%;
  transform: translateX(-50%);
  display: flex;
  perspective: 400px;
}

.entry-fan__card {
  width: 38px;
  height: 52px;
  background: linear-gradient(135deg, #1c2940 0%, #111827 100%);
  border: 1.5px solid rgba(255, 215, 0, 0.2);
  border-radius: 5px;
  display: flex;
  align-items: center;
  justify-content: center;
  margin: 0 -8px;
  opacity: 0;
  animation: fanAppear 0.4s ease-out forwards;
  box-shadow: 0 2px 12px rgba(0, 0, 0, 0.5);
}

.entry-fan__suit {
  font-size: 12px;
  letter-spacing: -1px;
  opacity: 0.4;
}

/* === TRANSITIONS === */
.count-enter-active { animation: countPop 0.4s ease-out; }
.count-leave-active { animation: countPop 0.3s ease-in reverse; }

/* === KEYFRAMES === */
@keyframes particleFloat {
  0% { opacity: 0; transform: translateY(0) scale(1); }
  10% { opacity: 0.7; }
  90% { opacity: 0.2; }
  100% { opacity: 0; transform: translateY(-100vh) scale(0.3); }
}

/* Cards orbit outward from center */
@keyframes cardOrbit1 {
  0% { opacity: 0; transform: translate(0, 0) rotate(0deg) scale(0.3); }
  20% { opacity: 1; transform: translate(-60px, -100px) rotate(-20deg) scale(1); }
  60% { opacity: 0.8; transform: translate(-120px, -50px) rotate(-40deg) scale(0.9); }
  100% { opacity: 0; transform: translate(-180px, 40px) rotate(-60deg) scale(0.5); }
}
@keyframes cardOrbit2 {
  0% { opacity: 0; transform: translate(0, 0) rotate(0deg) scale(0.3); }
  20% { opacity: 1; transform: translate(50px, -110px) rotate(25deg) scale(1.05); }
  60% { opacity: 0.8; transform: translate(110px, -40px) rotate(50deg) scale(0.9); }
  100% { opacity: 0; transform: translate(160px, 50px) rotate(70deg) scale(0.5); }
}
@keyframes cardOrbit3 {
  0% { opacity: 0; transform: translate(0, 0) rotate(0deg) scale(0.3); }
  20% { opacity: 1; transform: translate(-90px, -60px) rotate(-30deg) scale(1.1); }
  60% { opacity: 0.8; transform: translate(-140px, 20px) rotate(-55deg) scale(0.95); }
  100% { opacity: 0; transform: translate(-170px, 100px) rotate(-80deg) scale(0.4); }
}
@keyframes cardOrbit4 {
  0% { opacity: 0; transform: translate(0, 0) rotate(0deg) scale(0.3); }
  20% { opacity: 1; transform: translate(80px, -80px) rotate(20deg) scale(1); }
  60% { opacity: 0.8; transform: translate(130px, 10px) rotate(45deg) scale(0.85); }
  100% { opacity: 0; transform: translate(150px, 90px) rotate(65deg) scale(0.4); }
}
@keyframes cardOrbit5 {
  0% { opacity: 0; transform: translate(0, 0) rotate(0deg) scale(0.3); }
  20% { opacity: 1; transform: translate(-40px, -120px) rotate(-15deg) scale(1.15); }
  60% { opacity: 0.8; transform: translate(-80px, -60px) rotate(-35deg) scale(1); }
  100% { opacity: 0; transform: translate(-100px, 30px) rotate(-50deg) scale(0.5); }
}
@keyframes cardOrbit6 {
  0% { opacity: 0; transform: translate(0, 0) rotate(0deg) scale(0.3); }
  20% { opacity: 1; transform: translate(70px, -90px) rotate(30deg) scale(1); }
  60% { opacity: 0.8; transform: translate(100px, -20px) rotate(60deg) scale(0.9); }
  100% { opacity: 0; transform: translate(130px, 60px) rotate(85deg) scale(0.45); }
}
@keyframes cardOrbit7 {
  0% { opacity: 0; transform: translate(0, 0) rotate(0deg) scale(0.3); }
  20% { opacity: 1; transform: translate(-70px, -70px) rotate(-25deg) scale(1.05); }
  60% { opacity: 0.8; transform: translate(-110px, 30px) rotate(-50deg) scale(0.9); }
  100% { opacity: 0; transform: translate(-140px, 80px) rotate(-70deg) scale(0.5); }
}
@keyframes cardOrbit8 {
  0% { opacity: 0; transform: translate(0, 0) rotate(0deg) scale(0.3); }
  20% { opacity: 1; transform: translate(90px, -60px) rotate(15deg) scale(1.1); }
  60% { opacity: 0.8; transform: translate(120px, 20px) rotate(40deg) scale(0.95); }
  100% { opacity: 0; transform: translate(140px, 80px) rotate(55deg) scale(0.4); }
}

@keyframes suitsGlow {
  0%, 100% { filter: brightness(1); }
  50% { filter: brightness(1.5); }
}

@keyframes logoPulse {
  0%, 100% { text-shadow: 0 0 30px rgba(255, 215, 0, 0.4); }
  50% { text-shadow: 0 0 50px rgba(255, 215, 0, 0.7), 0 0 80px rgba(255, 215, 0, 0.3); }
}

@keyframes lineExpand {
  0% { width: 0; opacity: 0; }
  100% { width: 140px; opacity: 1; }
}

@keyframes waitingPulse {
  0%, 100% { opacity: 0.4; }
  50% { opacity: 0.8; }
}

@keyframes countPop {
  0% { transform: scale(0.3); opacity: 0; }
  60% { transform: scale(1.2); opacity: 1; }
  100% { transform: scale(1); opacity: 1; }
}

@keyframes fanAppear {
  0% { opacity: 0; transform: rotate(var(--r, 0deg)) translateY(20px); }
  100% { opacity: 1; transform: rotate(var(--r, 0deg)) translateY(0); }
}

@media (max-width: 768px) {
  .entry-card {
    width: 44px;
    height: 62px;
    left: -22px;
    top: -31px;
    border-width: 1.5px;
  }
  .entry-suit { font-size: 16px; }
  .entry-logo__suits { font-size: 18px; gap: 12px; }
  .entry-logo__text { font-size: 28px; letter-spacing: 8px; }
  .entry-logo__line { width: 80px; }
  .entry-center { gap: 18px; }
  .entry-countdown { height: 60px; }
  .entry-countdown__number { font-size: 52px; }
  .entry-countdown__go { font-size: 46px; }
  .entry-waiting { font-size: 11px; letter-spacing: 2px; }
  .entry-fan__card { width: 28px; height: 40px; margin: 0 -6px; }
  .entry-fan__suit { font-size: 9px; }
  @keyframes cardOrbit1 {
    0% { opacity: 0; transform: translate(0, 0) rotate(0deg) scale(0.3); }
    20% { opacity: 1; transform: translate(-40px, -70px) rotate(-20deg) scale(1); }
    60% { opacity: 0.8; transform: translate(-80px, -35px) rotate(-40deg) scale(0.9); }
    100% { opacity: 0; transform: translate(-120px, 30px) rotate(-60deg) scale(0.5); }
  }
  @keyframes cardOrbit2 {
    0% { opacity: 0; transform: translate(0, 0) rotate(0deg) scale(0.3); }
    20% { opacity: 1; transform: translate(35px, -75px) rotate(25deg) scale(1.05); }
    60% { opacity: 0.8; transform: translate(75px, -28px) rotate(50deg) scale(0.9); }
    100% { opacity: 0; transform: translate(105px, 35px) rotate(70deg) scale(0.5); }
  }
  @keyframes cardOrbit3 {
    0% { opacity: 0; transform: translate(0, 0) rotate(0deg) scale(0.3); }
    20% { opacity: 1; transform: translate(-60px, -42px) rotate(-30deg) scale(1.1); }
    60% { opacity: 0.8; transform: translate(-95px, 14px) rotate(-55deg) scale(0.95); }
    100% { opacity: 0; transform: translate(-115px, 70px) rotate(-80deg) scale(0.4); }
  }
  @keyframes cardOrbit4 {
    0% { opacity: 0; transform: translate(0, 0) rotate(0deg) scale(0.3); }
    20% { opacity: 1; transform: translate(55px, -55px) rotate(20deg) scale(1); }
    60% { opacity: 0.8; transform: translate(90px, 7px) rotate(45deg) scale(0.85); }
    100% { opacity: 0; transform: translate(100px, 62px) rotate(65deg) scale(0.4); }
  }
  @keyframes cardOrbit5 {
    0% { opacity: 0; transform: translate(0, 0) rotate(0deg) scale(0.3); }
    20% { opacity: 1; transform: translate(-28px, -84px) rotate(-15deg) scale(1.15); }
    60% { opacity: 0.8; transform: translate(-56px, -42px) rotate(-35deg) scale(1); }
    100% { opacity: 0; transform: translate(-70px, 21px) rotate(-50deg) scale(0.5); }
  }
  @keyframes cardOrbit6 {
    0% { opacity: 0; transform: translate(0, 0) rotate(0deg) scale(0.3); }
    20% { opacity: 1; transform: translate(48px, -63px) rotate(30deg) scale(1); }
    60% { opacity: 0.8; transform: translate(70px, -14px) rotate(60deg) scale(0.9); }
    100% { opacity: 0; transform: translate(90px, 42px) rotate(85deg) scale(0.45); }
  }
  @keyframes cardOrbit7 {
    0% { opacity: 0; transform: translate(0, 0) rotate(0deg) scale(0.3); }
    20% { opacity: 1; transform: translate(-48px, -48px) rotate(-25deg) scale(1.05); }
    60% { opacity: 0.8; transform: translate(-76px, 21px) rotate(-50deg) scale(0.9); }
    100% { opacity: 0; transform: translate(-95px, 56px) rotate(-70deg) scale(0.5); }
  }
  @keyframes cardOrbit8 {
    0% { opacity: 0; transform: translate(0, 0) rotate(0deg) scale(0.3); }
    20% { opacity: 1; transform: translate(62px, -42px) rotate(15deg) scale(1.1); }
    60% { opacity: 0.8; transform: translate(82px, 14px) rotate(40deg) scale(0.95); }
    100% { opacity: 0; transform: translate(95px, 56px) rotate(55deg) scale(0.4); }
  }
}
</style>

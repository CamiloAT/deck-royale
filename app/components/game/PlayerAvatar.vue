<script setup lang="ts">
import { ref, watch, computed } from 'vue'
import type { Player } from '../../types/poker'

const props = defineProps<{
  player: Player
  isMyself?: boolean
  avatar?: 'suit' | 'casual' | 'hoodie'
}>()

const anim = ref('')

const prev = {
  folded: props.player.folded,
  allIn: props.player.allIn,
  isTurn: props.player.isTurn,
  bet: props.player.bet,
}

watch(() => props.player, (p) => {
  if (p.folded && !prev.folded) {
    anim.value = 'fold'
  } else if (p.allIn && !prev.allIn) {
    anim.value = 'allin'
  } else if (prev.isTurn && !p.isTurn) {
    anim.value = p.bet > prev.bet ? 'raise' : 'check'
  }

  prev.folded = p.folded
  prev.allIn = p.allIn
  prev.isTurn = p.isTurn
  prev.bet = p.bet

  if (anim.value) {
    const duration = anim.value === 'raise' ? 1400 : 800
    setTimeout(() => { anim.value = '' }, duration)
  }
}, { deep: true })

const avatarClass = computed(() => `avatar--${props.avatar || 'suit'}`)
</script>

<template>
  <div
    class="avatar"
    :class="[
      anim ? `avatar--${anim}` : null,
      avatarClass,
      {
        'avatar--myself': isMyself,
        'avatar--turn': player.isTurn,
        'avatar--folded': player.folded,
        'avatar--allin': player.allIn,
      },
    ]"
  >
    <svg viewBox="0 0 80 100" class="avatar__svg" role="img" :aria-label="player.nickname">
      <!-- Glow ring -->
      <circle class="avatar__glow" cx="40" cy="45" r="42" />

      <!-- Shadow -->
      <ellipse class="avatar__shadow" cx="40" cy="96" rx="22" ry="4" />

      <!-- Body group (breathing animation) -->
      <g class="avatar__body-group">
        <!-- Torso -->
        <path class="avatar__torso" d="M26,42 C26,37 54,37 54,42 L57,72 C57,75 23,75 23,72 Z" />

        <!-- Shirt V-neck -->
        <path class="avatar__shirt" d="M32,42 L40,52 L48,42" />

        <!-- Collar lines -->
        <path class="avatar__collar" d="M32,42 L34,45" />
        <path class="avatar__collar" d="M48,42 L46,45" />

        <!-- Jacket buttons -->
        <circle class="avatar__button" cx="40" cy="58" r="1.2" />
        <circle class="avatar__button" cx="40" cy="64" r="1.2" />
      </g>

      <!-- Head group -->
      <g class="avatar__head-group">
        <!-- Head -->
        <circle class="avatar__head" cx="40" cy="22" r="14" />

        <!-- Hair -->
        <path class="avatar__hair" d="M26,18 Q26,6 40,6 Q54,6 54,18" />

        <!-- Ears -->
        <ellipse class="avatar__ear" cx="26" cy="22" rx="2.5" ry="3.5" />
        <ellipse class="avatar__ear" cx="54" cy="22" rx="2.5" ry="3.5" />

        <!-- Eyes (blink animation) -->
        <g class="avatar__eyes">
          <circle class="avatar__eye-white" cx="34" cy="20" r="3" />
          <circle class="avatar__eye-white" cx="46" cy="20" r="3" />
          <circle class="avatar__pupil" cx="34" cy="20" r="1.5" />
          <circle class="avatar__pupil" cx="46" cy="20" r="1.5" />
          <circle class="avatar__eye-highlight" cx="33" cy="19" r="0.6" />
          <circle class="avatar__eye-highlight" cx="45" cy="19" r="0.6" />
        </g>

        <!-- Eyebrows -->
        <path class="avatar__eyebrow" d="M30,15 Q34,13 38,15" />
        <path class="avatar__eyebrow" d="M42,15 Q46,13 50,15" />

        <!-- Nose -->
        <path class="avatar__nose" d="M40,23 L38,28 Q40,29 42,28" />

        <!-- Mouth -->
        <path class="avatar__mouth" d="M36,32 Q40,35 44,32" />
      </g>

      <!-- Left arm (static) -->
      <g class="avatar__left-arm">
        <path class="avatar__arm" d="M26,47 C16,50 11,57 9,64" />
        <circle class="avatar__hand" cx="9" cy="64" r="4" />
      </g>

      <!-- Right arm (animated) -->
      <g class="avatar__right-arm">
        <path class="avatar__arm" d="M54,47 C64,50 69,57 71,64" />
        <circle class="avatar__hand" cx="71" cy="64" r="4" />
      </g>

      <!-- Dealer badge -->
      <g v-if="player.isDealer" class="avatar__dealer">
        <circle cx="66" cy="10" r="7" />
        <text x="66" y="13" text-anchor="middle">D</text>
      </g>
    </svg>

    <!-- Thrown chips on raise -->
    <div v-if="anim === 'raise'" class="avatar__thrown-chips">
      <div class="avatar__chip avatar__chip--1"></div>
      <div class="avatar__chip avatar__chip--2"></div>
      <div class="avatar__chip avatar__chip--3"></div>
      <div class="avatar__chip avatar__chip--4"></div>
      <div class="avatar__chip avatar__chip--5"></div>
      <div class="avatar__chip avatar__chip--6"></div>
      <div class="avatar__chip avatar__chip--7"></div>
      <div class="avatar__chip avatar__chip--8"></div>
    </div>
  </div>
</template>

<style scoped>
.avatar {
  --skin: #e8b89d;
  --skin-shadow: #d4a088;
  --hair: #2c3e50;
  --clothes: #1e40af;
  --clothes-light: #3b82f6;
  --collar: #93c5fd;
  position: relative;
  display: inline-flex;
}

.avatar--myself {
  --clothes: #047857;
  --clothes-light: #10b981;
}

.avatar--allin {
  --clothes: #b91c1c;
  --clothes-light: #ef4444;
}

.avatar__svg {
  width: 48px;
  height: 60px;
  overflow: visible;
}

/* Glow */
.avatar__glow {
  fill: none;
  stroke: rgba(255, 215, 0, 0.5);
  stroke-width: 2;
  opacity: 0;
  transition: opacity 0.3s;
}

/* Shadow */
.avatar__shadow {
  fill: rgba(0, 0, 0, 0.15);
}

/* Body */
.avatar__torso {
  fill: var(--clothes);
  transform-origin: 40px 58px;
}
.avatar__shirt {
  fill: var(--clothes-light);
}
.avatar__collar {
  stroke: var(--collar);
  stroke-width: 0.8;
  fill: none;
}
.avatar__button {
  fill: rgba(255, 255, 255, 0.3);
}

/* Head */
.avatar__head {
  fill: var(--skin);
}
.avatar__hair {
  fill: var(--hair);
}
.avatar__ear {
  fill: var(--skin-shadow);
}

/* Eyes */
.avatar__eyes {
  transform-origin: 40px 20px;
}
.avatar__eye-white {
  fill: white;
}
.avatar__pupil {
  fill: var(--hair);
}
.avatar__eye-highlight {
  fill: white;
}

/* Eyebrows */
.avatar__eyebrow {
  stroke: var(--hair);
  stroke-width: 1.2;
  stroke-linecap: round;
  fill: none;
}

/* Nose */
.avatar__nose {
  stroke: rgba(0, 0, 0, 0.15);
  stroke-width: 0.8;
  stroke-linecap: round;
  fill: none;
}

/* Mouth */
.avatar__mouth {
  stroke: rgba(0, 0, 0, 0.25);
  stroke-width: 1;
  stroke-linecap: round;
  fill: none;
}

/* Arms */
.avatar__arm {
  stroke: var(--clothes);
  stroke-width: 8;
  stroke-linecap: round;
  fill: none;
}
.avatar__hand {
  fill: var(--skin);
}

/* Right arm animation origin */
.avatar__right-arm {
  transform-origin: 54px 47px;
}

/* Dealer */
.avatar__dealer circle {
  fill: #ffd700;
}
.avatar__dealer text {
  fill: #000;
  font-size: 9px;
  font-weight: bold;
}

/* === STATES === */

/* Turn glow */
.avatar--turn .avatar__glow {
  animation: glowPulse 1.5s ease-in-out infinite;
}

/* Folded */
.avatar--folded {
  filter: saturate(0.3) brightness(0.6);
}

/* === IDLE ANIMATIONS === */

/* Breathing */
.avatar:not(.avatar--folded):not(.avatar--allin) .avatar__body-group {
  animation: breathe 3s ease-in-out infinite;
}

/* Blinking */
.avatar:not(.avatar--folded) .avatar__eyes {
  animation: blink 4s ease-in-out infinite;
}

/* === ACTION ANIMATIONS === */

/* Check - tap table twice */
.avatar--check .avatar__right-arm {
  animation: tap 0.6s ease-in-out;
}

/* Raise - arm up + throw chips */
.avatar--raise .avatar__right-arm {
  animation: raiseArmThrow 0.5s ease-out;
}

/* Fold - slump */
.avatar--fold .avatar__body-group {
  animation: slump 0.5s ease-out;
}

/* All-in - push forward */
.avatar--allin .avatar__svg {
  animation: pushForward 0.4s ease-out;
}

/* === THROWN CHIPS === */

.avatar__thrown-chips {
  position: absolute;
  top: 10px;
  left: 50%;
  width: 0;
  height: 0;
  pointer-events: none;
  z-index: 10;
}

.avatar__chip {
  position: absolute;
  width: 10px;
  height: 10px;
  border-radius: 50%;
  border: 1.5px solid;
  opacity: 0;
}

.avatar__chip::after {
  content: '';
  position: absolute;
  top: 50%;
  left: 50%;
  transform: translate(-50%, -50%);
  width: 5px;
  height: 5px;
  border-radius: 50%;
  background: white;
}

.avatar__chip--1 {
  background: #ef4444;
  border-color: #991b1b;
  animation: chipFly1 1.2s ease-out 0s forwards;
}
.avatar__chip--2 {
  background: #3b82f6;
  border-color: #1e3a8a;
  animation: chipFly2 1.2s ease-out 0.05s forwards;
}
.avatar__chip--3 {
  background: #22c55e;
  border-color: #166534;
  animation: chipFly3 1.2s ease-out 0.1s forwards;
}
.avatar__chip--4 {
  background: #f97316;
  border-color: #9a3412;
  animation: chipFly4 1.2s ease-out 0.15s forwards;
}
.avatar__chip--5 {
  background: #a855f7;
  border-color: #6b21a8;
  animation: chipFly5 1.2s ease-out 0.08s forwards;
}
.avatar__chip--6 {
  background: #0ea5e9;
  border-color: #0c4a6e;
  animation: chipFly6 1.2s ease-out 0.12s forwards;
}
.avatar__chip--7 {
  background: #ef4444;
  border-color: #991b1b;
  animation: chipFly7 1.2s ease-out 0.03s forwards;
}
.avatar__chip--8 {
  background: #22c55e;
  border-color: #166534;
  animation: chipFly8 1.2s ease-out 0.18s forwards;
}

/* === KEYFRAMES === */

@keyframes breathe {
  0%, 100% { transform: translateY(0); }
  50% { transform: translateY(-0.8px); }
}

@keyframes blink {
  0%, 90%, 100% { transform: scaleY(1); }
  95% { transform: scaleY(0.1); }
}

@keyframes tap {
  0% { transform: rotate(0deg); }
  15% { transform: rotate(-8deg); }
  30% { transform: rotate(12deg); }
  45% { transform: rotate(0deg); }
  60% { transform: rotate(-6deg); }
  75% { transform: rotate(10deg); }
  100% { transform: rotate(0deg); }
}

@keyframes raiseArmThrow {
  0% { transform: rotate(0deg); }
  30% { transform: rotate(-45deg); }
  60% { transform: rotate(-35deg); }
  100% { transform: rotate(-20deg); }
}

@keyframes slump {
  0% { transform: translateY(0) scaleY(1); }
  100% { transform: translateY(2px) scaleY(0.97); }
}

@keyframes pushForward {
  0% { transform: translateY(0) scale(1); }
  50% { transform: translateY(-3px) scale(1.05); }
  100% { transform: translateY(0) scale(1); }
}

@keyframes glowPulse {
  0%, 100% { opacity: 0.3; }
  50% { opacity: 0.8; }
}

/* Chip trajectories - parabolic arcs going outward */
@keyframes chipFly1 {
  0% { opacity: 1; transform: translate(0, 0) rotate(0deg) scale(1); }
  20% { opacity: 1; transform: translate(-18px, -32px) rotate(120deg) scale(1.2); }
  60% { opacity: 1; transform: translate(-30px, 8px) rotate(300deg) scale(1.1); }
  100% { opacity: 0; transform: translate(-35px, 25px) rotate(480deg) scale(0.6); }
}
@keyframes chipFly2 {
  0% { opacity: 1; transform: translate(0, 0) rotate(0deg) scale(1); }
  20% { opacity: 1; transform: translate(-8px, -38px) rotate(-100deg) scale(1.3); }
  60% { opacity: 1; transform: translate(-12px, 5px) rotate(-260deg) scale(1.1); }
  100% { opacity: 0; transform: translate(-15px, 28px) rotate(-400deg) scale(0.5); }
}
@keyframes chipFly3 {
  0% { opacity: 1; transform: translate(0, 0) rotate(0deg) scale(1); }
  20% { opacity: 1; transform: translate(6px, -36px) rotate(90deg) scale(1.2); }
  60% { opacity: 1; transform: translate(10px, 6px) rotate(220deg) scale(1); }
  100% { opacity: 0; transform: translate(12px, 26px) rotate(360deg) scale(0.5); }
}
@keyframes chipFly4 {
  0% { opacity: 1; transform: translate(0, 0) rotate(0deg) scale(1); }
  20% { opacity: 1; transform: translate(20px, -30px) rotate(-140deg) scale(1.3); }
  60% { opacity: 1; transform: translate(32px, 10px) rotate(-320deg) scale(1.1); }
  100% { opacity: 0; transform: translate(38px, 28px) rotate(-500deg) scale(0.6); }
}
@keyframes chipFly5 {
  0% { opacity: 1; transform: translate(0, 0) rotate(0deg) scale(1); }
  20% { opacity: 1; transform: translate(-22px, -28px) rotate(160deg) scale(1.2); }
  60% { opacity: 1; transform: translate(-28px, 12px) rotate(340deg) scale(1); }
  100% { opacity: 0; transform: translate(-30px, 30px) rotate(500deg) scale(0.5); }
}
@keyframes chipFly6 {
  0% { opacity: 1; transform: translate(0, 0) rotate(0deg) scale(1); }
  20% { opacity: 1; transform: translate(15px, -34px) rotate(-120deg) scale(1.3); }
  60% { opacity: 1; transform: translate(25px, 8px) rotate(-280deg) scale(1.1); }
  100% { opacity: 0; transform: translate(30px, 25px) rotate(-420deg) scale(0.6); }
}
@keyframes chipFly7 {
  0% { opacity: 1; transform: translate(0, 0) rotate(0deg) scale(1); }
  20% { opacity: 1; transform: translate(-12px, -40px) rotate(110deg) scale(1.4); }
  60% { opacity: 1; transform: translate(-8px, 2px) rotate(270deg) scale(1.1); }
  100% { opacity: 0; transform: translate(-5px, 30px) rotate(420deg) scale(0.5); }
}
@keyframes chipFly8 {
  0% { opacity: 1; transform: translate(0, 0) rotate(0deg) scale(1); }
  20% { opacity: 1; transform: translate(24px, -26px) rotate(-90deg) scale(1.2); }
  60% { opacity: 1; transform: translate(35px, 14px) rotate(-240deg) scale(1); }
  100% { opacity: 0; transform: translate(40px, 32px) rotate(-380deg) scale(0.4); }
}
</style>

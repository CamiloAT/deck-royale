<script setup lang="ts">
import { ref, watch, computed } from 'vue'
import type { Player } from '../../types/poker'
import { getAvatarColorOption } from '../../utils/avatarColors'

const props = defineProps<{
  player: Player
}>()

const anim = ref('')
let animTimeout: ReturnType<typeof setTimeout> | null = null

function setAnim(name: string, duration: number) {
  if (animTimeout) clearTimeout(animTimeout)
  anim.value = name
  animTimeout = setTimeout(() => { anim.value = '' }, duration)
}

watch(() => props.player.lastAction, (action) => {
  if (!action) return
  if (action === 'fold') {
    setAnim('fold', 1200)
  } else if (action === 'all_in') {
    setAnim('allin', 1500)
  } else if (action === 'call' || action === 'raise') {
    setAnim('raise', 1400)
  } else if (action === 'check') {
    setAnim('check', 800)
  }
})

const avatarType = computed(() => props.player.avatarType || 'classic')
const colorOption = computed(() => getAvatarColorOption(avatarType.value, props.player.avatarColor))

const avatarStyle = computed(() => ({
  '--avatar-main': colorOption.value.main,
  '--avatar-light': colorOption.value.light,
  '--avatar-extra': colorOption.value.extra || colorOption.value.light,
  '--avatar-bumps': colorOption.value.bumps || colorOption.value.main,
  '--avatar-spots': colorOption.value.spots || 'transparent',
  '--avatar-eye': colorOption.value.eyeColor || '',
}))

const isPoisonFrog = computed(() => avatarType.value === 'frog' && (props.player.avatarColor === 'poison' || props.player.avatarColor === 'fire'))
</script>

<template>
  <div
    class="avatar"
    :class="[
      anim ? `avatar--${anim}` : null,
      {
        'avatar--turn': player.isTurn,
        'avatar--folded': player.folded,
        'avatar--allin': player.allIn,
      },
    ]"
  >
    <svg viewBox="0 0 80 100" class="avatar__svg" role="img" :aria-label="player.nickname" :style="avatarStyle">
      <!-- Glow ring -->
      <circle class="avatar__glow" cx="40" cy="45" r="42" />

      <!-- Shadow -->
      <ellipse class="avatar__shadow" cx="40" cy="96" rx="22" ry="4" />

      <!-- ======================== CLASSIC AVATAR ======================== -->
      <template v-if="avatarType === 'classic'">
        <g class="avatar__body-group">
          <path class="avatar__torso avatar__torso--classic" d="M26,42 C26,37 54,37 54,42 L57,72 C57,75 23,75 23,72 Z" />
          <path class="avatar__shirt avatar__shirt--classic" d="M32,42 L40,52 L48,42" />
          <path class="avatar__collar" d="M32,42 L34,45" />
          <path class="avatar__collar" d="M48,42 L46,45" />
          <circle class="avatar__button" cx="40" cy="58" r="1.2" />
          <circle class="avatar__button" cx="40" cy="64" r="1.2" />
        </g>
        <g class="avatar__head-group">
          <circle class="avatar__head avatar__head--classic" cx="40" cy="22" r="14" />
          <!-- Hair with more volume -->
          <path class="avatar__hair avatar__hair--classic" d="M26,19 Q26,5 40,4 Q54,5 54,19 Q52,10 40,8 Q28,10 26,19 Z" />
          <!-- Sideburns -->
          <path class="avatar__hair avatar__hair--classic" d="M26,19 Q25,22 26,25 Q27,22 27,19 Z" />
          <path class="avatar__hair avatar__hair--classic" d="M54,19 Q55,22 54,25 Q53,22 53,19 Z" />
          <ellipse class="avatar__ear avatar__ear--classic" cx="26" cy="22" rx="2.5" ry="3.5" />
          <ellipse class="avatar__ear avatar__ear--classic" cx="54" cy="22" rx="2.5" ry="3.5" />
          <g class="avatar__eyes">
            <circle class="avatar__eye-white" cx="34" cy="20" r="3" />
            <circle class="avatar__eye-white" cx="46" cy="20" r="3" />
            <circle class="avatar__pupil avatar__pupil--classic" cx="34" cy="20" r="1.5" />
            <circle class="avatar__pupil avatar__pupil--classic" cx="46" cy="20" r="1.5" />
            <circle class="avatar__eye-highlight" cx="33" cy="19" r="0.6" />
            <circle class="avatar__eye-highlight" cx="45" cy="19" r="0.6" />
          </g>
          <path class="avatar__eyebrow avatar__eyebrow--classic" d="M30,15 Q34,13 38,15" />
          <path class="avatar__eyebrow avatar__eyebrow--classic" d="M42,15 Q46,13 50,15" />
          <path class="avatar__nose" d="M40,23 L38,28 Q40,29 42,28" />
          <path class="avatar__mouth" d="M36,32 Q40,35 44,32" />
        </g>
        <g class="avatar__left-arm">
          <path class="avatar__arm avatar__arm--classic" d="M26,47 C16,50 11,57 9,64" />
          <circle class="avatar__hand avatar__hand--classic" cx="9" cy="64" r="4" />
        </g>
        <g class="avatar__right-arm">
          <path class="avatar__arm avatar__arm--classic" d="M54,47 C64,50 69,57 71,64" />
          <circle class="avatar__hand avatar__hand--classic" cx="71" cy="64" r="4" />
        </g>
      </template>

      <!-- ======================== FEMALE AVATAR ======================== -->
      <template v-if="avatarType === 'female'">
        <g class="avatar__body-group">
          <path class="avatar__torso avatar__torso--female" d="M28,42 C28,38 52,38 52,42 L54,72 C54,75 26,75 26,72 Z" />
          <path class="avatar__shirt avatar__shirt--female" d="M34,42 L40,49 L46,42" />
          <path class="avatar__collar" d="M34,42 L35,44" />
          <path class="avatar__collar" d="M46,42 L45,44" />
          <circle class="avatar__button" cx="40" cy="56" r="1" />
          <circle class="avatar__button" cx="40" cy="62" r="1" />
        </g>
        <g class="avatar__head-group">
          <circle class="avatar__head avatar__head--female" cx="40" cy="22" r="13.5" />
          <!-- Wavy reddish-brown hair - behind face -->
          <path class="avatar__hair avatar__hair--female" d="M27,17 Q27,4 40,3 Q53,4 53,17 L52,20 Q50,12 40,10 Q30,12 28,20 Z" />
          <!-- Hair sides flowing down -->
          <path class="avatar__hair-side avatar__hair-side--female-l" d="M27,17 Q23,22 21,32 Q23,30 26,24" />
          <path class="avatar__hair-side avatar__hair-side--female-r" d="M53,17 Q57,22 59,32 Q57,30 54,24" />
          <!-- Hair wave details -->
          <path class="avatar__hair-wave avatar__hair-wave--1" d="M29,10 Q32,8 35,10" />
          <path class="avatar__hair-wave avatar__hair-wave--2" d="M35,7 Q38,5 41,7" />
          <path class="avatar__hair-wave avatar__hair-wave--3" d="M42,7 Q45,5 48,7" />
          <path class="avatar__hair-wave avatar__hair-wave--4" d="M46,10 Q49,8 51,10" />
          <ellipse class="avatar__ear avatar__ear--female" cx="27" cy="22" rx="2" ry="3" />
          <ellipse class="avatar__ear avatar__ear--female" cx="53" cy="22" rx="2" ry="3" />
          <g class="avatar__eyes">
            <circle class="avatar__eye-white" cx="34" cy="20" r="3.2" />
            <circle class="avatar__eye-white" cx="46" cy="20" r="3.2" />
            <circle class="avatar__pupil avatar__pupil--female" cx="34" cy="20" r="1.6" />
            <circle class="avatar__pupil avatar__pupil--female" cx="46" cy="20" r="1.6" />
            <circle class="avatar__eye-highlight" cx="33" cy="19" r="0.7" />
            <circle class="avatar__eye-highlight" cx="45" cy="19" r="0.7" />
          </g>
          <!-- Eyelashes -->
          <path class="avatar__eyelash" d="M30,17 L31,16" />
          <path class="avatar__eyelash" d="M50,17 L49,16" />
          <path class="avatar__eyebrow avatar__eyebrow--female" d="M30,14.5 Q34,12.5 38,14.5" />
          <path class="avatar__eyebrow avatar__eyebrow--female" d="M42,14.5 Q46,12.5 50,14.5" />
          <path class="avatar__nose" d="M40,23 L38.5,27 Q40,28 41.5,27" />
          <path class="avatar__mouth avatar__mouth--female" d="M36,31 Q40,34 44,31" />
        </g>
        <g class="avatar__left-arm">
          <path class="avatar__arm avatar__arm--female" d="M28,47 C18,50 13,57 11,64" />
          <circle class="avatar__hand avatar__hand--female" cx="11" cy="64" r="3.5" />
        </g>
        <g class="avatar__right-arm">
          <path class="avatar__arm avatar__arm--female" d="M52,47 C62,50 67,57 69,64" />
          <circle class="avatar__hand avatar__hand--female" cx="69" cy="64" r="3.5" />
        </g>
      </template>

      <!-- ======================== FROG AVATAR ======================== -->
      <template v-if="avatarType === 'frog'">
        <g class="avatar__body-group">
          <path class="avatar__torso avatar__torso--frog" d="M24,44 C24,38 56,38 56,44 L58,74 C58,77 22,77 22,74 Z" />
          <!-- Body spots -->
          <circle class="avatar__frog-spot" cx="29" cy="48" r="1.8" />
          <circle class="avatar__frog-spot" cx="37" cy="46" r="1.3" />
          <circle class="avatar__frog-spot" cx="46" cy="49" r="1.6" />
          <circle class="avatar__frog-spot" cx="52" cy="53" r="1.2" />
          <circle class="avatar__frog-spot" cx="33" cy="55" r="1.5" />
          <circle class="avatar__frog-spot" cx="43" cy="57" r="1.1" />
          <circle class="avatar__frog-spot" cx="27" cy="60" r="1.4" />
          <circle class="avatar__frog-spot" cx="50" cy="60" r="1.3" />
          <circle class="avatar__frog-spot" cx="36" cy="64" r="1.6" />
          <circle class="avatar__frog-spot" cx="47" cy="66" r="1.0" />
          <circle class="avatar__frog-spot" cx="30" cy="68" r="1.2" />
          <circle class="avatar__frog-spot" cx="42" cy="70" r="1.1" />
          <circle class="avatar__frog-spot" cx="53" cy="46" r="0.9" />
          <circle class="avatar__frog-spot" cx="25" cy="52" r="1.0" />
          <ellipse class="avatar__belly avatar__belly--frog" cx="40" cy="58" rx="11" ry="14" />
          <circle class="avatar__button" cx="40" cy="54" r="1.2" />
          <circle class="avatar__button" cx="40" cy="61" r="1.2" />
        </g>
        <g class="avatar__head-group">
          <!-- Frog head - wider -->
          <ellipse class="avatar__head avatar__head--frog" cx="40" cy="22" rx="16" ry="14" />
          <!-- Frog bump ridges -->
          <ellipse class="avatar__frog-bump" cx="32" cy="12" rx="5" ry="4" />
          <ellipse class="avatar__frog-bump" cx="48" cy="12" rx="5" ry="4" />
          <!-- Frog eyes - big and bulging -->
          <g class="avatar__eyes" :class="{ 'avatar__eyes--dark': isPoisonFrog }">
            <circle class="avatar__frog-eye-bg" cx="32" cy="14" r="6" />
            <circle class="avatar__frog-eye-bg" cx="48" cy="14" r="6" />
            <circle class="avatar__eye-white" cx="32" cy="14" r="4.5" />
            <circle class="avatar__eye-white" cx="48" cy="14" r="4.5" />
            <circle class="avatar__pupil avatar__pupil--frog" cx="32" cy="14" r="2.5" />
            <circle class="avatar__pupil avatar__pupil--frog" cx="48" cy="14" r="2.5" />
            <circle class="avatar__eye-highlight" cx="30.5" cy="12.5" r="1" />
            <circle class="avatar__eye-highlight" cx="46.5" cy="12.5" r="1" />
          </g>
          <!-- Wide frog mouth -->
          <path class="avatar__mouth avatar__mouth--frog" d="M28,28 Q40,34 52,28" />
          <!-- Nostrils -->
          <circle class="avatar__frog-nostril" cx="37" cy="24" r="1" />
          <circle class="avatar__frog-nostril" cx="43" cy="24" r="1" />
        </g>
        <g class="avatar__left-arm">
          <path class="avatar__arm avatar__arm--frog" d="M24,49 C14,52 9,58 7,64" />
          <!-- Webbed hand -->
          <path class="avatar__hand avatar__hand--frog" d="M4,64 L7,60 L10,64 L7,60 L7,68 Z" />
        </g>
        <g class="avatar__right-arm">
          <path class="avatar__arm avatar__arm--frog" d="M56,49 C66,52 71,58 73,64" />
          <path class="avatar__hand avatar__hand--frog" d="M70,64 L73,60 L76,64 L73,60 L73,68 Z" />
        </g>
      </template>

      <!-- ======================== PENGUIN AVATAR ======================== -->
      <template v-if="avatarType === 'penguin'">
        <g class="avatar__body-group">
          <path class="avatar__torso avatar__torso--penguin" d="M24,44 C24,36 56,36 56,44 L58,76 C58,79 22,79 22,76 Z" />
          <ellipse class="avatar__belly avatar__belly--penguin" cx="40" cy="58" rx="11" ry="15" />
          <path class="avatar__belly-line" d="M30,48 Q40,50 50,48" />
        </g>
        <g class="avatar__head-group">
          <circle class="avatar__head avatar__head--penguin" cx="40" cy="22" r="15" />
          <ellipse class="avatar__face-patch avatar__face-patch--penguin" cx="40" cy="24" rx="10" ry="10" />
          <g class="avatar__eyes">
            <circle class="avatar__eye-white" cx="35" cy="19" r="3.5" />
            <circle class="avatar__eye-white" cx="45" cy="19" r="3.5" />
            <circle class="avatar__pupil avatar__pupil--penguin" cx="35" cy="19" r="1.8" />
            <circle class="avatar__pupil avatar__pupil--penguin" cx="45" cy="19" r="1.8" />
            <circle class="avatar__eye-highlight" cx="34" cy="18" r="0.7" />
            <circle class="avatar__eye-highlight" cx="44" cy="18" r="0.7" />
          </g>
          <path class="avatar__beak avatar__beak--penguin" d="M37,26 L40,31 L43,26 Z" />
          <circle class="avatar__cheek avatar__cheek--penguin" cx="31" cy="24" r="2.5" />
          <circle class="avatar__cheek avatar__cheek--penguin" cx="49" cy="24" r="2.5" />
          <!-- Headphones band -->
          <path class="avatar__headphone-band avatar__headphone-band--penguin" d="M25,20 Q25,4 40,3 Q55,4 55,20" />
          <!-- Headphone cups -->
          <circle class="avatar__headphone-cup avatar__headphone-cup--penguin" cx="25" cy="22" r="5" />
          <circle class="avatar__headphone-cup avatar__headphone-cup--penguin" cx="55" cy="22" r="5" />
          <!-- Cup inner detail -->
          <circle class="avatar__headphone-cup-inner avatar__headphone-cup-inner--penguin" cx="25" cy="22" r="3" />
          <circle class="avatar__headphone-cup-inner avatar__headphone-cup-inner--penguin" cx="55" cy="22" r="3" />
        </g>
        <g class="avatar__left-arm">
          <path class="avatar__arm avatar__arm--penguin" d="M24,48 C16,52 12,60 10,66" />
          <ellipse class="avatar__hand avatar__hand--penguin" cx="10" cy="66" rx="4" ry="5" transform="rotate(-15, 10, 66)" />
        </g>
        <g class="avatar__right-arm">
          <path class="avatar__arm avatar__arm--penguin" d="M56,48 C64,52 68,60 70,66" />
          <ellipse class="avatar__hand avatar__hand--penguin" cx="70" cy="66" rx="4" ry="5" transform="rotate(15, 70, 66)" />
        </g>
        <ellipse class="avatar__foot avatar__foot--penguin" cx="34" cy="78" rx="5" ry="2.5" />
        <ellipse class="avatar__foot avatar__foot--penguin" cx="46" cy="78" rx="5" ry="2.5" />
      </template>

      <!-- Dealer badge (shared) -->
      <g v-if="player.isDealer" class="avatar__dealer">
        <circle cx="66" cy="10" r="7" />
        <text x="66" y="13" text-anchor="middle">D</text>
      </g>
    </svg>

    <!-- Thrown bills on all-in -->
    <div v-if="anim === 'allin'" class="avatar__thrown-bills">
      <div class="avatar__bill avatar__bill--1"><div class="avatar__bill-inner">$</div></div>
      <div class="avatar__bill avatar__bill--2"><div class="avatar__bill-inner">$</div></div>
      <div class="avatar__bill avatar__bill--3"><div class="avatar__bill-inner">$</div></div>
      <div class="avatar__bill avatar__bill--4"><div class="avatar__bill-inner">$</div></div>
      <div class="avatar__bill avatar__bill--5"><div class="avatar__bill-inner">$</div></div>
      <div class="avatar__bill avatar__bill--6"><div class="avatar__bill-inner">$</div></div>
    </div>

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

    <!-- Thrown cards on fold -->
    <div v-if="anim === 'fold'" class="avatar__thrown-cards">
      <div class="avatar__card avatar__card--1">
        <span class="avatar__card-rank">K</span>
        <span class="avatar__card-suit avatar__card-suit--hearts">&hearts;</span>
      </div>
      <div class="avatar__card avatar__card--2">
        <span class="avatar__card-rank">Q</span>
        <span class="avatar__card-suit avatar__card-suit--spades">&spades;</span>
      </div>
    </div>
  </div>
</template>

<style scoped>
.avatar {
  position: relative;
  display: inline-flex;
}

.avatar--myself {
  --clothes: #047857;
  --clothes-light: #10b981;
}

.avatar--allin .avatar__body-group {
  animation: allinPush 0.5s ease-out;
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

/* ===== CLASSIC COLORS ===== */
.avatar__torso--classic { fill: var(--avatar-main); }
.avatar__shirt--classic { fill: var(--avatar-light); }
.avatar__head--classic { fill: #e8b89d; }
.avatar__hair--classic { fill: #2c3e50; }
.avatar__ear--classic { fill: #d4a088; }
.avatar__pupil--classic { fill: #2c3e50; }
.avatar__eyebrow--classic { stroke: #2c3e50; stroke-width: 1.2; stroke-linecap: round; fill: none; }
.avatar__arm--classic { stroke: var(--avatar-main); stroke-width: 8; stroke-linecap: round; fill: none; }
.avatar__hand--classic { fill: #e8b89d; }

/* ===== FEMALE COLORS ===== */
.avatar__torso--female { fill: var(--avatar-main); }
.avatar__shirt--female { fill: var(--avatar-light); }
.avatar__head--female { fill: #f0c4a8; }
.avatar__hair--female { fill: #8b2500; }
.avatar__hair-side--female-l, .avatar__hair-side--female-r { fill: #8b2500; }
.avatar__hair-wave--1, .avatar__hair-wave--2, .avatar__hair-wave--3, .avatar__hair-wave--4 {
  stroke: #a03000;
  stroke-width: 0.8;
  fill: none;
  opacity: 0.5;
}
.avatar__ear--female { fill: #d9ad8c; }
.avatar__pupil--female { fill: #3b1a00; }
.avatar__eyebrow--female { stroke: #7a2000; stroke-width: 1; stroke-linecap: round; fill: none; }
.avatar__eyelash { stroke: #3b1a00; stroke-width: 0.8; stroke-linecap: round; fill: none; }
.avatar__mouth--female { stroke: #c46060; stroke-width: 1.2; stroke-linecap: round; fill: none; }
.avatar__arm--female { stroke: var(--avatar-main); stroke-width: 7; stroke-linecap: round; fill: none; }
.avatar__hand--female { fill: #f0c4a8; }

/* ===== FROG COLORS ===== */
.avatar__torso--frog { fill: var(--avatar-main); }
.avatar__belly--frog { fill: var(--avatar-extra); opacity: 0.3; }
.avatar__head--frog { fill: var(--avatar-light); }
.avatar__frog-bump { fill: var(--avatar-bumps); }
.avatar__frog-eye-bg { fill: #bbf7d0; }
.avatar__pupil--frog { fill: #14532d; }
.avatar__mouth--frog { stroke: #14532d; stroke-width: 1.5; stroke-linecap: round; fill: none; }
.avatar__frog-nostril { fill: var(--avatar-bumps); }
.avatar__arm--frog { stroke: var(--avatar-main); stroke-width: 8; stroke-linecap: round; fill: none; }
.avatar__hand--frog { fill: var(--avatar-light); }
/* Poison/fire frog spots */
.avatar__frog-spot { fill: var(--avatar-spots); opacity: 0.85; }
/* Poison/fire frog dark eyes */
.avatar__eyes--dark .avatar__frog-eye-bg { fill: #1a1a2e; }
.avatar__eyes--dark .avatar__eye-white { fill: #0a0a0a; }
.avatar__eyes--dark .avatar__pupil--frog { fill: #000; r: 3; }
.avatar__eyes--dark .avatar__eye-highlight { fill: rgba(255,255,255,0.7); r: 1.2; }

/* ===== PENGUIN COLORS ===== */
.avatar__torso--penguin { fill: #3d3d3d; }
.avatar__belly--penguin { fill: #e8e8e8; }
.avatar__belly-line { stroke: #d0d0d0; stroke-width: 0.6; fill: none; }
.avatar__head--penguin { fill: #1a1a2e; }
.avatar__face-patch--penguin { fill: #f0f0f0; }
.avatar__pupil--penguin { fill: #0a0a15; }
.avatar__beak--penguin { fill: #f59e0b; }
.avatar__cheek--penguin { fill: #f0a0b0; opacity: 0.55; }
.avatar__arm--penguin { stroke: #3d3d3d; stroke-width: 7; stroke-linecap: round; fill: none; }
.avatar__hand--penguin { fill: #f59e0b; }
.avatar__foot--penguin { fill: #f59e0b; }
.avatar__headphone-band--penguin { stroke: var(--avatar-main); stroke-width: 3; fill: none; stroke-linecap: round; }
.avatar__headphone-cup--penguin { fill: var(--avatar-main); }
.avatar__headphone-cup-inner--penguin { fill: var(--avatar-light); }

/* ===== SHARED STYLES ===== */
.avatar__torso { transform-origin: 40px 58px; }
.avatar__collar { stroke: rgba(255, 255, 255, 0.3); stroke-width: 0.8; fill: none; }
.avatar__button { fill: rgba(255, 255, 255, 0.3); }

/* Eyes */
.avatar__eyes { transform-origin: 40px 20px; }
.avatar__eye-white { fill: white; }
.avatar__pupil { }
.avatar__eye-highlight { fill: white; }

/* Eyebrows */
.avatar__eyebrow { }

/* Nose */
.avatar__nose { stroke: rgba(0, 0, 0, 0.15); stroke-width: 0.8; stroke-linecap: round; fill: none; }

/* Mouth */
.avatar__mouth { stroke: rgba(0, 0, 0, 0.25); stroke-width: 1; stroke-linecap: round; fill: none; }

/* Arms */
.avatar__arm { }
.avatar__hand { }

/* Right arm animation origin */
.avatar__right-arm { transform-origin: 54px 47px; }

/* Dealer */
.avatar__dealer circle { fill: #ffd700; }
.avatar__dealer text { fill: #000; font-size: 9px; font-weight: bold; }

/* === STATES === */
.avatar--turn .avatar__glow { animation: glowPulse 1.5s ease-in-out infinite; }
.avatar--folded { filter: saturate(0.3) brightness(0.6); }

/* === IDLE ANIMATIONS === */
.avatar:not(.avatar--folded):not(.avatar--allin) .avatar__body-group { animation: breathe 3s ease-in-out infinite; }
.avatar:not(.avatar--folded) .avatar__eyes { animation: blink 4s ease-in-out infinite; }

/* === ACTION ANIMATIONS === */
.avatar--check .avatar__right-arm { animation: tap 0.6s ease-in-out; }
.avatar--raise .avatar__right-arm { animation: raiseArmThrow 0.5s ease-out; }
.avatar--fold .avatar__body-group { animation: slump 0.5s ease-out; }
.avatar--fold .avatar__right-arm { animation: foldArmThrow 0.5s ease-out; }
.avatar--allin .avatar__right-arm { animation: raiseArmThrow 0.4s ease-out; }

/* === THROWN CHIPS === */
.avatar__thrown-chips { position: absolute; top: 10px; left: 50%; width: 0; height: 0; pointer-events: none; z-index: 10; }
.avatar__chip { position: absolute; width: 10px; height: 10px; border-radius: 50%; border: 1.5px solid; opacity: 0; }
.avatar__chip::after { content: ''; position: absolute; top: 50%; left: 50%; transform: translate(-50%, -50%); width: 5px; height: 5px; border-radius: 50%; background: white; }
.avatar__chip--1 { background: #ef4444; border-color: #991b1b; animation: chipFly1 1.2s ease-out 0s forwards; }
.avatar__chip--2 { background: #3b82f6; border-color: #1e3a8a; animation: chipFly2 1.2s ease-out 0.05s forwards; }
.avatar__chip--3 { background: #22c55e; border-color: #166534; animation: chipFly3 1.2s ease-out 0.1s forwards; }
.avatar__chip--4 { background: #f97316; border-color: #9a3412; animation: chipFly4 1.2s ease-out 0.15s forwards; }
.avatar__chip--5 { background: #a855f7; border-color: #6b21a8; animation: chipFly5 1.2s ease-out 0.08s forwards; }
.avatar__chip--6 { background: #0ea5e9; border-color: #0c4a6e; animation: chipFly6 1.2s ease-out 0.12s forwards; }
.avatar__chip--7 { background: #ef4444; border-color: #991b1b; animation: chipFly7 1.2s ease-out 0.03s forwards; }
.avatar__chip--8 { background: #22c55e; border-color: #166534; animation: chipFly8 1.2s ease-out 0.18s forwards; }

/* === THROWN CARDS === */
.avatar__thrown-cards { position: absolute; top: 14px; left: 50%; width: 0; height: 0; pointer-events: none; z-index: 10; }
.avatar__card { position: absolute; width: 20px; height: 28px; background: white; border-radius: 2px; border: 1px solid rgba(0, 0, 0, 0.2); box-shadow: 0 2px 6px rgba(0, 0, 0, 0.4); display: flex; flex-direction: column; align-items: center; justify-content: center; gap: 0; opacity: 0; overflow: hidden; }
.avatar__card-rank { font-size: 8px; font-weight: 900; line-height: 1; font-family: 'Georgia', serif; }
.avatar__card-suit { font-size: 7px; line-height: 1; }
.avatar__card-suit--hearts { color: #cc0000; }
.avatar__card-suit--spades { color: #1a1a1a; }
.avatar__card--1 { animation: cardFly1 1.1s cubic-bezier(0.25, 0.46, 0.45, 0.94) 0s forwards; }
.avatar__card--2 { animation: cardFly2 1.1s cubic-bezier(0.25, 0.46, 0.45, 0.94) 0.1s forwards; }

/* === THROWN BILLS === */
.avatar__thrown-bills { position: absolute; top: 10px; left: 50%; width: 0; height: 0; pointer-events: none; z-index: 10; }
.avatar__bill { position: absolute; width: 22px; height: 12px; background: linear-gradient(135deg, #22c55e 0%, #16a34a 50%, #15803d 100%); border-radius: 2px; border: 1px solid #14532d; box-shadow: 0 1px 4px rgba(0, 0, 0, 0.3), inset 0 0 4px rgba(255, 255, 255, 0.15); opacity: 0; overflow: hidden; }
.avatar__bill-inner { width: 100%; height: 100%; display: flex; align-items: center; justify-content: center; font-size: 8px; font-weight: 900; color: rgba(255, 255, 255, 0.6); font-family: 'Georgia', serif; text-shadow: 0 1px 1px rgba(0, 0, 0, 0.3); }
.avatar__bill::before { content: ''; position: absolute; top: 2px; left: 2px; right: 2px; bottom: 2px; border: 0.5px solid rgba(255, 255, 255, 0.15); border-radius: 1px; }
.avatar__bill--1 { animation: billFly1 1.3s ease-out 0s forwards; }
.avatar__bill--2 { animation: billFly2 1.3s ease-out 0.06s forwards; }
.avatar__bill--3 { animation: billFly3 1.3s ease-out 0.12s forwards; }
.avatar__bill--4 { animation: billFly4 1.3s ease-out 0.03s forwards; }
.avatar__bill--5 { animation: billFly5 1.3s ease-out 0.09s forwards; }
.avatar__bill--6 { animation: billFly6 1.3s ease-out 0.15s forwards; }

/* === KEYFRAMES === */
@keyframes breathe { 0%, 100% { transform: translateY(0); } 50% { transform: translateY(-0.8px); } }
@keyframes blink { 0%, 88%, 100% { transform: scaleY(1); } 92% { transform: scaleY(0.05); } 95% { transform: scaleY(0.05); } 98% { transform: scaleY(1); } }
@keyframes tap { 0% { transform: rotate(0deg); } 15% { transform: rotate(-8deg); } 30% { transform: rotate(12deg); } 45% { transform: rotate(0deg); } 60% { transform: rotate(-6deg); } 75% { transform: rotate(10deg); } 100% { transform: rotate(0deg); } }
@keyframes raiseArmThrow { 0% { transform: rotate(0deg); } 30% { transform: rotate(-45deg); } 60% { transform: rotate(-35deg); } 100% { transform: rotate(-20deg); } }
@keyframes slump { 0% { transform: translateY(0) scaleY(1); } 30% { transform: translateY(1px) scaleY(0.98) rotate(-2deg); } 100% { transform: translateY(3px) scaleY(0.95) rotate(0deg); } }
@keyframes foldArmThrow { 0% { transform: rotate(0deg); } 25% { transform: rotate(-50deg); } 50% { transform: rotate(-20deg); } 100% { transform: rotate(10deg); } }
@keyframes pushForward { 0% { transform: translateY(0) scale(1); } 50% { transform: translateY(-3px) scale(1.05); } 100% { transform: translateY(0) scale(1); } }
@keyframes glowPulse { 0%, 100% { opacity: 0.3; } 50% { opacity: 0.8; } }

/* Chip trajectories */
@keyframes chipFly1 { 0% { opacity: 1; transform: translate(0, 0) rotate(0deg) scale(1); } 20% { opacity: 1; transform: translate(-18px, -32px) rotate(120deg) scale(1.2); } 60% { opacity: 1; transform: translate(-30px, 8px) rotate(300deg) scale(1.1); } 100% { opacity: 0; transform: translate(-35px, 25px) rotate(480deg) scale(0.6); } }
@keyframes chipFly2 { 0% { opacity: 1; transform: translate(0, 0) rotate(0deg) scale(1); } 20% { opacity: 1; transform: translate(-8px, -38px) rotate(-100deg) scale(1.3); } 60% { opacity: 1; transform: translate(-12px, 5px) rotate(-260deg) scale(1.1); } 100% { opacity: 0; transform: translate(-15px, 28px) rotate(-400deg) scale(0.5); } }
@keyframes chipFly3 { 0% { opacity: 1; transform: translate(0, 0) rotate(0deg) scale(1); } 20% { opacity: 1; transform: translate(6px, -36px) rotate(90deg) scale(1.2); } 60% { opacity: 1; transform: translate(10px, 6px) rotate(220deg) scale(1); } 100% { opacity: 0; transform: translate(12px, 26px) rotate(360deg) scale(0.5); } }
@keyframes chipFly4 { 0% { opacity: 1; transform: translate(0, 0) rotate(0deg) scale(1); } 20% { opacity: 1; transform: translate(20px, -30px) rotate(-140deg) scale(1.3); } 60% { opacity: 1; transform: translate(32px, 10px) rotate(-320deg) scale(1.1); } 100% { opacity: 0; transform: translate(38px, 28px) rotate(-500deg) scale(0.6); } }
@keyframes chipFly5 { 0% { opacity: 1; transform: translate(0, 0) rotate(0deg) scale(1); } 20% { opacity: 1; transform: translate(-22px, -28px) rotate(160deg) scale(1.2); } 60% { opacity: 1; transform: translate(-28px, 12px) rotate(340deg) scale(1); } 100% { opacity: 0; transform: translate(-30px, 30px) rotate(500deg) scale(0.5); } }
@keyframes chipFly6 { 0% { opacity: 1; transform: translate(0, 0) rotate(0deg) scale(1); } 20% { opacity: 1; transform: translate(15px, -34px) rotate(-120deg) scale(1.3); } 60% { opacity: 1; transform: translate(25px, 8px) rotate(-280deg) scale(1.1); } 100% { opacity: 0; transform: translate(30px, 25px) rotate(-420deg) scale(0.6); } }
@keyframes chipFly7 { 0% { opacity: 1; transform: translate(0, 0) rotate(0deg) scale(1); } 20% { opacity: 1; transform: translate(-12px, -40px) rotate(110deg) scale(1.4); } 60% { opacity: 1; transform: translate(-8px, 2px) rotate(270deg) scale(1.1); } 100% { opacity: 0; transform: translate(-5px, 30px) rotate(420deg) scale(0.5); } }
@keyframes chipFly8 { 0% { opacity: 1; transform: translate(0, 0) rotate(0deg) scale(1); } 20% { opacity: 1; transform: translate(24px, -26px) rotate(-90deg) scale(1.2); } 60% { opacity: 1; transform: translate(35px, 14px) rotate(-240deg) scale(1); } 100% { opacity: 0; transform: translate(40px, 32px) rotate(-380deg) scale(0.4); } }

/* Card trajectories */
@keyframes cardFly1 { 0% { opacity: 1; transform: translate(0, 0) rotate(0deg) scale(0.5); } 10% { opacity: 1; transform: translate(-4px, -8px) rotate(-10deg) scale(1.1); } 30% { opacity: 1; transform: translate(-20px, -40px) rotate(-45deg) scale(1.2); } 60% { opacity: 0.9; transform: translate(-45px, -10px) rotate(-120deg) scale(1.1); } 100% { opacity: 0; transform: translate(-60px, 30px) rotate(-220deg) scale(0.7); } }
@keyframes cardFly2 { 0% { opacity: 1; transform: translate(0, 0) rotate(0deg) scale(0.5); } 10% { opacity: 1; transform: translate(4px, -10px) rotate(15deg) scale(1.1); } 30% { opacity: 1; transform: translate(25px, -45px) rotate(50deg) scale(1.3); } 60% { opacity: 0.9; transform: translate(50px, -8px) rotate(130deg) scale(1.1); } 100% { opacity: 0; transform: translate(65px, 28px) rotate(240deg) scale(0.6); } }

/* Bill trajectories */
@keyframes billFly1 { 0% { opacity: 1; transform: translate(0, 0) rotate(0deg) scale(0.6); } 15% { opacity: 1; transform: translate(-8px, -20px) rotate(-25deg) scale(0.9); } 40% { opacity: 1; transform: translate(-22px, -38px) rotate(-60deg) scale(1); } 70% { opacity: 0.9; transform: translate(-32px, 5px) rotate(-100deg) scale(0.95); } 100% { opacity: 0; transform: translate(-38px, 30px) rotate(-140deg) scale(0.8); } }
@keyframes billFly2 { 0% { opacity: 1; transform: translate(0, 0) rotate(0deg) scale(0.6); } 15% { opacity: 1; transform: translate(5px, -24px) rotate(20deg) scale(0.9); } 40% { opacity: 1; transform: translate(18px, -42px) rotate(55deg) scale(1.1); } 70% { opacity: 0.9; transform: translate(28px, -2px) rotate(95deg) scale(0.95); } 100% { opacity: 0; transform: translate(35px, 28px) rotate(130deg) scale(0.8); } }
@keyframes billFly3 { 0% { opacity: 1; transform: translate(0, 0) rotate(0deg) scale(0.6); } 15% { opacity: 1; transform: translate(-14px, -18px) rotate(-35deg) scale(1); } 40% { opacity: 1; transform: translate(-30px, -30px) rotate(-80deg) scale(1.05); } 70% { opacity: 0.9; transform: translate(-40px, 10px) rotate(-120deg) scale(0.9); } 100% { opacity: 0; transform: translate(-45px, 35px) rotate(-160deg) scale(0.7); } }
@keyframes billFly4 { 0% { opacity: 1; transform: translate(0, 0) rotate(0deg) scale(0.6); } 15% { opacity: 1; transform: translate(10px, -22px) rotate(30deg) scale(0.9); } 40% { opacity: 1; transform: translate(28px, -36px) rotate(70deg) scale(1); } 70% { opacity: 0.9; transform: translate(40px, 8px) rotate(110deg) scale(0.95); } 100% { opacity: 0; transform: translate(48px, 32px) rotate(150deg) scale(0.75); } }
@keyframes billFly5 { 0% { opacity: 1; transform: translate(0, 0) rotate(0deg) scale(0.6); } 15% { opacity: 1; transform: translate(-6px, -26px) rotate(-18deg) scale(0.95); } 40% { opacity: 1; transform: translate(-16px, -44px) rotate(-50deg) scale(1.05); } 70% { opacity: 0.9; transform: translate(-20px, -4px) rotate(-85deg) scale(0.9); } 100% { opacity: 0; transform: translate(-22px, 26px) rotate(-115deg) scale(0.75); } }
@keyframes billFly6 { 0% { opacity: 1; transform: translate(0, 0) rotate(0deg) scale(0.6); } 15% { opacity: 1; transform: translate(16px, -16px) rotate(40deg) scale(1); } 40% { opacity: 1; transform: translate(34px, -28px) rotate(85deg) scale(1.1); } 70% { opacity: 0.9; transform: translate(46px, 12px) rotate(130deg) scale(0.95); } 100% { opacity: 0; transform: translate(52px, 36px) rotate(170deg) scale(0.7); } }

@media (max-width: 768px) {
  .avatar__svg { width: 38px; height: 48px; }
}
</style>

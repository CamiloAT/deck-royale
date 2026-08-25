<script setup lang="ts">
import { Crown } from '@lucide/vue'
import type { Player, PotWinner, Card } from '../../types/poker'

const props = defineProps<{
  players: Player[]
  winners: PotWinner[]
  communityCards: Card[]
}>()

const emit = defineEmits<{
  (e: 'done'): void
}>()

const revealedIndex = ref(-1)
const showCommunity = ref(false)
const showPlayers = ref(false)
const showWinner = ref(false)
const phase = ref<'in' | 'out'>('in')

const nonFoldedPlayers = computed(() =>
  props.players.filter(p => !p.folded && p.hand.length > 0)
)

const winnerIds = computed(() =>
  new Set(props.winners.map(w => w.winnerId))
)

const mainWinner = computed(() => {
  const first = props.winners[0]
  if (!first) return null
  return {
    nickname: first.winnerNickname,
    amountWon: props.winners
      .filter(w => w.winnerId === first.winnerId)
      .reduce((sum, w) => sum + w.amountWon, 0),
    handName: first.handName,
  }
})

function getPlayerHandName(playerId: string): string {
  const w = props.winners.find(w => w.winnerId === playerId)
  return w?.handName || ''
}

function getPlayerAmountWon(playerId: string): number {
  return props.winners
    .filter(w => w.winnerId === playerId)
    .reduce((sum, w) => sum + w.amountWon, 0)
}

onMounted(() => {
  // Phase 1: Show community cards face down, then flip
  setTimeout(() => { showCommunity.value = true }, 200)

  // Phase 2: Reveal players one by one
  setTimeout(() => {
    showPlayers.value = true
    let i = 0
    const interval = setInterval(() => {
      revealedIndex.value = i
      i++
      if (i >= nonFoldedPlayers.value.length) {
        clearInterval(interval)
        setTimeout(() => { showWinner.value = true }, 400)
      }
    }, 400)
  }, 1200)

  // Phase 3: Fade out
  setTimeout(() => { phase.value = 'out' }, 4500)
  setTimeout(() => emit('done'), 5500)
})
</script>

<template>
  <div class="reveal-overlay" :class="`reveal-overlay--${phase}`">
    <div class="reveal-header">
      <div class="reveal-title">SHOWDOWN</div>
      <div class="reveal-subtitle">Manos reveladas</div>
    </div>

    <!-- Community cards -->
    <div class="reveal-community" :class="{ 'reveal-community--visible': showCommunity }">
      <div class="reveal-community__label">Cartas de la mesa</div>
      <div class="reveal-community__cards">
        <div
          v-for="(card, i) in communityCards"
          :key="i"
          class="reveal-community-card"
          :class="{ 'reveal-community-card--flipped': showCommunity }"
          :style="{ transitionDelay: `${0.1 + i * 0.12}s` }"
        >
          <div class="reveal-community-card__inner">
            <div class="reveal-community-card__front">
              <div class="reveal-card-back-deco">
                <div class="reveal-card-back-deco__border">
                  <div class="reveal-card-back-deco__inner">
                    <div class="reveal-card-back-deco__dots" />
                    <div class="reveal-card-back-deco__chip"><span>♠</span></div>
                  </div>
                </div>
              </div>
            </div>
            <div class="reveal-community-card__back">
              <GameCard :card="card" />
            </div>
          </div>
        </div>
      </div>
    </div>

    <!-- Players -->
    <div class="reveal-players" :class="{ 'reveal-players--visible': showPlayers }">
      <div
        v-for="(player, index) in nonFoldedPlayers"
        :key="player.id"
        class="reveal-player"
        :class="{
          'reveal-player--winner': winnerIds.has(player.id) && showWinner,
          'reveal-player--revealed': index <= revealedIndex,
        }"
      >
        <div class="reveal-player__name">{{ player.nickname }}</div>

        <div class="reveal-player__cards">
          <div
            v-for="(card, ci) in player.hand"
            :key="ci"
            class="reveal-card-wrapper"
            :class="{
              'reveal-card-wrapper--flipped': index <= revealedIndex,
              'reveal-card-wrapper--winner': winnerIds.has(player.id) && showWinner,
            }"
            :style="{ transitionDelay: `${ci * 0.15}s` }"
          >
            <div class="reveal-card-inner">
              <div class="reveal-card-front">
                <div class="reveal-card-back-deco">
                  <div class="reveal-card-back-deco__border">
                    <div class="reveal-card-back-deco__inner">
                      <div class="reveal-card-back-deco__dots" />
                      <div class="reveal-card-back-deco__chip"><span>♠</span></div>
                    </div>
                  </div>
                </div>
              </div>
              <div class="reveal-card-back">
                <GameCard :card="card" />
              </div>
            </div>
          </div>
        </div>

        <div
          v-if="winnerIds.has(player.id) && showWinner"
          class="reveal-player__winner-badge"
        >
          <Crown :size="14" />
          <span v-if="getPlayerHandName(player.id)">{{ player.nickname }} gana ronda con {{ getPlayerHandName(player.id) }}</span>
          <span v-else>GANA LA RONDA</span>
        </div>

        <div
          v-if="winnerIds.has(player.id) && showWinner"
          class="reveal-player__amount"
        >
          +${{ getPlayerAmountWon(player.id).toLocaleString() }}
        </div>
      </div>
    </div>

    <!-- Winner flash effect -->
    <div
      v-if="showWinner && mainWinner"
      class="reveal-winner-flash"
    ></div>

    <!-- Sparkles -->
    <div class="reveal-sparkles" v-if="showWinner">
      <div v-for="i in 20" :key="i" class="reveal-sparkle" :style="{
        left: `${10 + Math.random() * 80}%`,
        top: `${10 + Math.random() * 80}%`,
        animationDelay: `${(i * 0.15) % 2}s`,
      }"></div>
    </div>
  </div>
</template>

<style scoped>
.reveal-overlay {
  position: fixed;
  inset: 0;
  z-index: 4000;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  gap: 20px;
  background: rgba(0, 0, 0, 0.85);
  backdrop-filter: blur(8px);
  transition: opacity 0.8s ease-out;
  pointer-events: none;
}
.reveal-overlay--out {
  opacity: 0;
}

.reveal-header {
  text-align: center;
}
.reveal-title {
  font-size: 32px;
  font-weight: 900;
  letter-spacing: 8px;
  color: #ffd700;
  text-shadow: 0 0 20px rgba(255, 215, 0, 0.5), 0 0 40px rgba(255, 215, 0, 0.2);
  animation: titlePulse 1.5s ease-in-out infinite alternate;
}
.reveal-subtitle {
  font-size: 14px;
  color: rgba(255, 255, 255, 0.5);
  letter-spacing: 3px;
  margin-top: 4px;
}

/* Community cards */
.reveal-community {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 8px;
  opacity: 0;
  transform: translateY(10px);
  transition: all 0.5s ease;
}
.reveal-community--visible {
  opacity: 1;
  transform: translateY(0);
}
.reveal-community__label {
  font-size: 11px;
  color: rgba(255, 255, 255, 0.4);
  letter-spacing: 2px;
  text-transform: uppercase;
}
.reveal-community__cards {
  display: flex;
  gap: 8px;
}

.reveal-community-card {
  perspective: 600px;
  width: 52px;
  height: 72px;
}
.reveal-community-card__inner {
  width: 100%;
  height: 100%;
  position: relative;
  transform-style: preserve-3d;
  transition: transform 0.5s ease;
}
.reveal-community-card--flipped .reveal-community-card__inner {
  transform: rotateY(180deg);
}

.reveal-community-card__front,
.reveal-community-card__back {
  position: absolute;
  inset: 0;
  backface-visibility: hidden;
  border-radius: 5px;
  overflow: hidden;
}
.reveal-community-card__front {
  background: linear-gradient(160deg, #12162d 0%, #0e1124 40%, #161b38 100%);
  border: 2px solid #b8962e;
}
.reveal-community-card__back {
  transform: rotateY(180deg);
}

/* Players */
.reveal-players {
  display: flex;
  gap: 24px;
  flex-wrap: wrap;
  justify-content: center;
  max-width: 90vw;
  opacity: 0;
  transition: opacity 0.4s ease;
}
.reveal-players--visible {
  opacity: 1;
}

.reveal-player {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 8px;
  padding: 16px 20px;
  border-radius: 12px;
  background: rgba(255, 255, 255, 0.03);
  border: 1px solid rgba(255, 255, 255, 0.06);
  transition: all 0.5s ease;
  min-width: 100px;
}
.reveal-player--revealed {
  background: rgba(255, 255, 255, 0.06);
}
.reveal-player--winner {
  background: rgba(255, 215, 0, 0.08);
  border-color: #ffd700;
  box-shadow:
    0 0 20px rgba(255, 215, 0, 0.3),
    0 0 40px rgba(255, 215, 0, 0.15),
    inset 0 0 20px rgba(255, 215, 0, 0.05);
  animation: winnerPulse 1s ease-in-out infinite alternate;
  transform: scale(1.05);
}

.reveal-player__name {
  color: white;
  font-size: 13px;
  font-weight: 600;
  white-space: nowrap;
}

.reveal-player__cards {
  display: flex;
  gap: 6px;
}

/* Card flip */
.reveal-card-wrapper {
  perspective: 600px;
  width: 52px;
  height: 72px;
}
.reveal-card-inner {
  width: 100%;
  height: 100%;
  position: relative;
  transform-style: preserve-3d;
  transition: transform 0.5s ease;
}
.reveal-card-wrapper--flipped .reveal-card-inner {
  transform: rotateY(180deg);
}
.reveal-card-wrapper--winner .reveal-card-inner {
  transition-duration: 0.6s;
}

.reveal-card-front,
.reveal-card-back {
  position: absolute;
  inset: 0;
  backface-visibility: hidden;
  border-radius: 5px;
  overflow: hidden;
}

.reveal-card-front {
  background: linear-gradient(160deg, #12162d 0%, #0e1124 40%, #161b38 100%);
  border: 2px solid #b8962e;
}
.reveal-card-back {
  transform: rotateY(180deg);
}

/* Shared card back decoration */
.reveal-card-back-deco {
  width: 100%;
  height: 100%;
  display: flex;
  align-items: center;
  justify-content: center;
}
.reveal-card-back-deco__border {
  width: calc(100% - 6px);
  height: calc(100% - 6px);
  border: 1.5px solid #b8962e;
  border-radius: 3px;
  display: flex;
  align-items: center;
  justify-content: center;
}
.reveal-card-back-deco__inner {
  width: 100%;
  height: 100%;
  position: relative;
  overflow: hidden;
  display: flex;
  align-items: center;
  justify-content: center;
}
.reveal-card-back-deco__dots {
  position: absolute;
  inset: 0;
  background-image: radial-gradient(circle, rgba(184, 150, 46, 0.25) 1px, transparent 1px);
  background-size: 8px 8px;
}
.reveal-card-back-deco__chip {
  position: relative;
  z-index: 1;
  width: 24px;
  height: 24px;
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
.reveal-card-back-deco__chip::after {
  content: '';
  width: 72%;
  height: 72%;
  border-radius: 50%;
  background: radial-gradient(circle at 40% 40%, #161b38, #0e1124);
  border: 1.5px solid #b8962e;
  position: absolute;
  box-shadow: inset 0 0 3px rgba(0, 0, 0, 0.6);
}
.reveal-card-back-deco__chip span {
  position: relative;
  z-index: 1;
  color: #b8962e;
  font-size: 10px;
  line-height: 1;
}

.reveal-player__winner-badge {
  display: flex;
  align-items: center;
  gap: 4px;
  color: #ffd700;
  font-size: 11px;
  font-weight: 800;
  letter-spacing: 2px;
  animation: badgePop 0.4s ease-out both;
}

.reveal-player__amount {
  color: #4ade80;
  font-size: 16px;
  font-weight: 800;
  text-shadow: 0 0 10px rgba(74, 222, 128, 0.4);
  animation: amountSlide 0.4s ease-out 0.2s both;
}

/* Winner flash */
.reveal-winner-flash {
  position: fixed;
  inset: 0;
  background: radial-gradient(circle at center, rgba(255, 215, 0, 0.15) 0%, transparent 70%);
  animation: flashPulse 1.5s ease-in-out infinite alternate;
  pointer-events: none;
}

/* Sparkles */
.reveal-sparkles {
  position: fixed;
  inset: 0;
  pointer-events: none;
}
.reveal-sparkle {
  position: absolute;
  width: 3px;
  height: 3px;
  background: #ffd700;
  border-radius: 50%;
  opacity: 0;
  animation: sparkle 1.5s ease-in-out infinite;
}

@keyframes titlePulse {
  0% { text-shadow: 0 0 20px rgba(255, 215, 0, 0.5); }
  100% { text-shadow: 0 0 30px rgba(255, 215, 0, 0.8), 0 0 60px rgba(255, 215, 0, 0.3); }
}
@keyframes winnerPulse {
  0% { box-shadow: 0 0 20px rgba(255, 215, 0, 0.3), 0 0 40px rgba(255, 215, 0, 0.15); }
  100% { box-shadow: 0 0 30px rgba(255, 215, 0, 0.5), 0 0 60px rgba(255, 215, 0, 0.25), 0 0 80px rgba(255, 215, 0, 0.1); }
}
@keyframes badgePop {
  0% { transform: scale(0); opacity: 0; }
  70% { transform: scale(1.2); }
  100% { transform: scale(1); opacity: 1; }
}
@keyframes amountSlide {
  0% { transform: translateY(8px); opacity: 0; }
  100% { transform: translateY(0); opacity: 1; }
}
@keyframes flashPulse {
  0% { opacity: 0.3; }
  100% { opacity: 0.8; }
}
@keyframes sparkle {
  0% { opacity: 0; transform: scale(0); }
  30% { opacity: 0.9; transform: scale(1); }
  100% { opacity: 0; transform: scale(0) translateY(-40px); }
}

@media (max-width: 768px) {
  .reveal-title { font-size: 22px; letter-spacing: 5px; }
  .reveal-players { gap: 16px; }
  .reveal-player { padding: 10px 12px; min-width: 80px; }
  .reveal-card-wrapper { width: 42px; height: 58px; }
  .reveal-community-card { width: 42px; height: 58px; }
  .reveal-community__cards { gap: 5px; }
}
</style>

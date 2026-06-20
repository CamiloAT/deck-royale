<script setup lang="ts">
import { User, Home, Key, Plus, ArrowRight, ArrowLeft, Spade, Heart, Diamond, Club } from '@lucide/vue'
import { useRoute } from 'vue-router'

const emit = defineEmits<{
  (e: 'create', data: {
    nickname: string
    roomName: string
    smallBlind: number
    bigBlind: number
    buyIn: number
  }): void
  (e: 'join', data: { roomId: string; nickname: string; buyIn: number }): void
}>()

const route = useRoute()
const mode = ref<'menu' | 'create' | 'join'>('menu')
const nickname = ref('')
const roomName = ref('')
const roomId = ref('')
const buyIn = ref(2000)
const smallBlind = ref(100)
const bigBlind = ref(200)

onMounted(() => {
  const roomParam = route.query.room
  if (roomParam && typeof roomParam === 'string') {
    roomId.value = roomParam.toUpperCase()
    mode.value = 'join'
  }
})

function handleCreate() {
  emit('create', {
    nickname: nickname.value,
    roomName: roomName.value || 'Sala de Deck Royale',
    smallBlind: smallBlind.value,
    bigBlind: bigBlind.value,
    buyIn: buyIn.value,
  })
}

function handleJoin() {
  emit('join', {
    roomId: roomId.value.toUpperCase(),
    nickname: nickname.value,
    buyIn: buyIn.value,
  })
}

const suitComponents = [Spade, Heart, Diamond, Club]

const particles = Array.from({ length: 18 }, (_, i) => {
  const suitIndex = i % 4
  const left = (i * 17.3) % 100
  const delay = (i * 1.7) % 8
  const duration = 8 + (i % 5) * 2
  const size = 14 + (i % 4) * 6
  const isRed = suitIndex === 1 || suitIndex === 2
  return {
    component: suitComponents[suitIndex],
    style: {
      left: `${left}%`,
      animationDelay: `${delay}s`,
      animationDuration: `${duration}s`,
      color: isRed ? 'rgba(255, 80, 80, 0.15)' : 'rgba(255, 215, 0, 0.12)',
    },
    size,
  }
})
</script>

<template>
  <div class="lobby">
    <div class="lobby__particles">
      <component
        v-for="(p, idx) in particles"
        :key="idx"
        :is="p.component"
        :size="p.size"
        class="lobby__particle"
        :style="p.style"
      />
    </div>

    <div class="lobby__card">
      <div class="lobby__header">
        <div class="lobby__suits">
          <Spade :size="20" class="lobby__suit lobby__suit--spade" />
          <Heart :size="20" class="lobby__suit lobby__suit--heart" />
          <Diamond :size="20" class="lobby__suit lobby__suit--diamond" />
          <Club :size="20" class="lobby__suit lobby__suit--club" />
        </div>
        <h1 class="lobby__title">
          <span class="lobby__title-deck">DECK</span><span class="lobby__title-royale">ROYALE</span>
        </h1>
        <div class="lobby__divider">
          <span class="lobby__divider-line"></span>
          <Spade :size="12" class="lobby__divider-icon" />
          <span class="lobby__divider-line"></span>
        </div>
        <p class="lobby__subtitle">JUEGOS CON CARTAS ONLINE</p>
      </div>

      <div class="lobby__form">
        <div class="lobby__input-group">
          <input
            v-model="nickname"
            type="text"
            placeholder="Ingresa tu nickname..."
            class="lobby__input"
            maxlength="15"
            @keyup.enter="mode === 'menu' ? null : undefined"
          />
          <span class="lobby__input-icon"><User :size="16" /></span>
        </div>

        <template v-if="mode === 'menu'">
          <button class="lobby__btn lobby__btn--primary" @click="mode = 'create'" :disabled="!nickname">
            <Plus :size="18" />
            Crear Sala
          </button>
          <button class="lobby__btn lobby__btn--secondary" @click="mode = 'join'" :disabled="!nickname">
            <ArrowRight :size="18" />
            Unirse a Sala
          </button>
        </template>

        <template v-else-if="mode === 'create'">
          <div class="lobby__input-group">
            <input
              v-model="roomName"
              type="text"
              placeholder="Nombre de la sala"
              class="lobby__input"
            />
            <span class="lobby__input-icon"><Home :size="16" /></span>
          </div>
          <div class="lobby__row">
            <div class="lobby__field">
              <label>Small Blind</label>
              <SharedNumberInput v-model="smallBlind" :min="50" :step="50" />
            </div>
            <div class="lobby__field">
              <label>Big Blind</label>
              <SharedNumberInput v-model="bigBlind" :min="100" :step="100" />
            </div>
          </div>
          <div class="lobby__field">
            <label>Buy-In (COP)</label>
            <SharedNumberInput v-model="buyIn" :min="500" :step="1000" />
          </div>
          <button class="lobby__btn lobby__btn--primary" @click="handleCreate">
            <Plus :size="18" />
            Crear Sala
          </button>
          <button class="lobby__btn lobby__btn--ghost" @click="mode = 'menu'">
            <ArrowLeft :size="14" />
            Volver
          </button>
        </template>

        <template v-else-if="mode === 'join'">
          <template v-if="route.query.room">
            <div class="lobby__join-header">Te unirás a la sala</div>
            <div class="lobby__join-code">{{ roomId }}</div>
          </template>
          <template v-else>
            <div class="lobby__input-group">
              <input
                v-model="roomId"
                type="text"
                placeholder="Código de la sala"
                class="lobby__input lobby__input--code"
                maxlength="6"
                @keyup.enter="handleJoin"
              />
              <span class="lobby__input-icon"><Key :size="16" /></span>
            </div>
          </template>
          <button class="lobby__btn lobby__btn--primary" @click="handleJoin" :disabled="!roomId">
            <ArrowRight :size="18" />
            Unirse
          </button>
          <button class="lobby__btn lobby__btn--ghost" @click="mode = 'menu'">
            <ArrowLeft :size="14" />
            Volver
          </button>
        </template>
      </div>

      <p class="lobby__footer-text">Texas Hold'em &middot; 2-8 jugadores</p>
    </div>
  </div>
</template>

<style scoped>
.lobby {
  min-height: 100vh;
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 20px;
  overflow: hidden;
  position: relative;
}

/* ── Partículas de fondo ── */
.lobby__particles {
  position: fixed;
  inset: 0;
  pointer-events: none;
  z-index: 0;
}
.lobby__particle {
  position: absolute;
  bottom: -40px;
  animation: float 8s ease-in-out infinite;
  pointer-events: none;
}

/* ── Card principal ── */
.lobby__card {
  position: relative;
  z-index: 1;
  background: rgba(10, 10, 20, 0.85);
  border-radius: 20px;
  padding: 44px 40px 36px;
  width: 100%;
  max-width: 420px;
  backdrop-filter: blur(24px);
  animation: fadeInUp 0.6s ease-out;
  border: 1px solid rgba(255, 215, 0, 0.15);
  box-shadow:
    0 20px 60px rgba(0, 0, 0, 0.5);
}

/* ── Header / Título ── */
.lobby__header {
  text-align: center;
  margin-bottom: 32px;
  animation: fadeIn 0.8s ease-out 0.2s both;
}
.lobby__suits {
  display: flex;
  justify-content: center;
  gap: 12px;
  margin-bottom: 16px;
  font-size: 18px;
}
.lobby__suit { transition: transform 0.3s; }
.lobby__suit--spade { color: #e0e0e0; }
.lobby__suit--heart { color: #ff4d4d; }
.lobby__suit--diamond { color: #ffd700; }
.lobby__suit--club { color: #4da6ff; }
.lobby__suits:hover .lobby__suit { transform: scale(1.2); }

.lobby__title {
  margin: 0 0 12px 0;
  font-size: 42px;
  font-family: 'Georgia', serif;
  letter-spacing: 2px;
  line-height: 1;
}
.lobby__title-deck {
  color: #ffd700;
  animation: pulseGlow 3s ease-in-out infinite;
}
.lobby__title-royale {
  color: white;
  font-weight: 300;
}

.lobby__divider {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 12px;
  margin: 12px 0;
}
.lobby__divider-line {
  width: 50px;
  height: 1px;
  background: linear-gradient(90deg, transparent, rgba(255, 215, 0, 0.4), transparent);
}
.lobby__divider-icon {
  color: rgba(255, 215, 0, 0.4);
}

.lobby__subtitle {
  color: #666;
  font-size: 11px;
  letter-spacing: 4px;
  margin: 0;
  text-transform: uppercase;
}

/* ── Formulario ── */
.lobby__form {
  display: flex;
  flex-direction: column;
  gap: 16px;
  animation: fadeIn 0.8s ease-out 0.4s both;
}
.lobby__input-group {
  position: relative;
}
.lobby__input-group .lobby__input {
  padding-right: 44px;
}
.lobby__input-icon {
  position: absolute;
  right: 14px;
  top: 50%;
  transform: translateY(-50%);
  font-size: 16px;
  pointer-events: none;
  opacity: 0.6;
}

.lobby__input {
  width: 100%;
  padding: 14px 16px;
  background: rgba(255, 255, 255, 0.06);
  border: 1px solid rgba(255, 255, 255, 0.12);
  border-radius: 10px;
  color: white;
  font-size: 16px;
  outline: none;
  transition: all 0.3s;
}
.lobby__input:focus {
  border-color: rgba(255, 215, 0, 0.5);
  box-shadow: 0 0 20px rgba(255, 215, 0, 0.08);
  background: rgba(255, 255, 255, 0.08);
}
.lobby__input::placeholder { color: #555; }
.lobby__input--code {
  text-align: center;
  font-size: 18px;
  letter-spacing: 6px;
  text-transform: uppercase;
  font-weight: 700;
  padding: 12px 16px;
}
.lobby__input--code[readonly] {
  opacity: 0.7;
  cursor: default;
}

.lobby__join-header {
  text-align: center;
  color: #666;
  font-size: 13px;
  text-transform: uppercase;
  letter-spacing: 2px;
  margin-bottom: 4px;
}
.lobby__join-code {
  text-align: center;
  color: #ffd700;
  font-family: monospace;
  font-size: 20px;
  font-weight: bold;
  letter-spacing: 6px;
  padding: 10px;
  background: rgba(255, 215, 0, 0.06);
  border: 1px solid rgba(255, 215, 0, 0.15);
  border-radius: 10px;
  margin-bottom: 8px;
}

.lobby__row { display: flex; gap: 12px; }
.lobby__field { flex: 1; display: flex; flex-direction: column; gap: 6px; }
.lobby__row .lobby__field { max-width: 163px; }
.lobby__field label {
  color: #777;
  font-size: 11px;
  text-transform: uppercase;
  letter-spacing: 1.5px;
  font-weight: 500;
}

/* ── Botones ── */
.lobby__btn {
  position: relative;
  padding: 14px 24px;
  border: none;
  border-radius: 10px;
  font-size: 16px;
  font-weight: 600;
  cursor: pointer;
  transition: all 0.3s;
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 8px;
  overflow: hidden;
}
.lobby__btn:disabled { opacity: 0.4; cursor: not-allowed; }

.lobby__btn--primary {
  background: linear-gradient(135deg, #ffd700, #e6a800);
  color: #1a1a00;
  box-shadow: 0 4px 20px rgba(255, 215, 0, 0.2);
}
.lobby__btn--primary:hover:not(:disabled) {
  transform: translateY(-2px);
  box-shadow: 0 6px 28px rgba(255, 215, 0, 0.35);
}
.lobby__btn--primary:active:not(:disabled) {
  transform: translateY(0);
}

.lobby__btn--secondary {
  background: rgba(255, 255, 255, 0.06);
  color: #ccc;
  border: 1px solid rgba(255, 255, 255, 0.12);
}
.lobby__btn--secondary:hover:not(:disabled) {
  background: rgba(255, 255, 255, 0.1);
  color: white;
  border-color: rgba(255, 255, 255, 0.2);
}

.lobby__btn--ghost {
  background: transparent;
  color: #555;
  font-size: 14px;
  padding: 8px;
}
.lobby__btn--ghost:hover { color: #aaa; }

/* ── Footer text ── */
.lobby__footer-text {
  text-align: center;
  color: #3a3a3a;
  font-size: 11px;
  letter-spacing: 2px;
  margin: 24px 0 0 0;
  animation: fadeIn 0.8s ease-out 0.6s both;
}
</style>

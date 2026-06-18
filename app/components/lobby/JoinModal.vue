<script setup lang="ts">
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

const mode = ref<'menu' | 'create' | 'join'>('menu')
const nickname = ref('')
const roomName = ref('')
const roomId = ref('')
const buyIn = ref(1000)
const smallBlind = ref(10)
const bigBlind = ref(20)

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
</script>

<template>
  <div class="lobby">
    <div class="lobby__card">
      <h1 class="lobby__title">
        <span class="lobby__title-deck">DECK</span>
        <span class="lobby__title-royale">ROYALE</span>
      </h1>
      <p class="lobby__subtitle">Poker Multijugador</p>

      <div class="lobby__form">
        <input
          v-model="nickname"
          type="text"
          placeholder="Tu nickname"
          class="lobby__input"
          maxlength="15"
          @keyup.enter="mode === 'menu' ? null : undefined"
        />

        <template v-if="mode === 'menu'">
          <button class="lobby__btn lobby__btn--primary" @click="mode = 'create'" :disabled="!nickname">
            Crear Sala
          </button>
          <button class="lobby__btn lobby__btn--secondary" @click="mode = 'join'" :disabled="!nickname">
            Unirse a Sala
          </button>
        </template>

        <template v-else-if="mode === 'create'">
          <input
            v-model="roomName"
            type="text"
            placeholder="Nombre de la sala"
            class="lobby__input"
          />
          <div class="lobby__row">
            <div class="lobby__field">
              <label>Small Blind</label>
              <input v-model.number="smallBlind" type="number" class="lobby__input" min="1" />
            </div>
            <div class="lobby__field">
              <label>Big Blind</label>
              <input v-model.number="bigBlind" type="number" class="lobby__input" min="2" />
            </div>
          </div>
          <div class="lobby__field">
            <label>Buy-In (fichas)</label>
            <input v-model.number="buyIn" type="number" class="lobby__input" min="100" />
          </div>
          <button class="lobby__btn lobby__btn--primary" @click="handleCreate">
            Crear Sala
          </button>
          <button class="lobby__btn lobby__btn--ghost" @click="mode = 'menu'">
            Volver
          </button>
        </template>

        <template v-else-if="mode === 'join'">
          <input
            v-model="roomId"
            type="text"
            placeholder="Codigo de la sala"
            class="lobby__input lobby__input--code"
            maxlength="6"
            @keyup.enter="handleJoin"
          />
          <div class="lobby__field">
            <label>Buy-In (fichas)</label>
            <input v-model.number="buyIn" type="number" class="lobby__input" min="100" />
          </div>
          <button class="lobby__btn lobby__btn--primary" @click="handleJoin" :disabled="!roomId">
            Unirse
          </button>
          <button class="lobby__btn lobby__btn--ghost" @click="mode = 'menu'">
            Volver
          </button>
        </template>
      </div>
    </div>
  </div>
</template>

<style scoped>
.lobby { min-height: 100vh; display: flex; align-items: center; justify-content: center; padding: 20px; }
.lobby__card {
  background: rgba(0, 0, 0, 0.8); border: 1px solid rgba(255, 215, 0, 0.2);
  border-radius: 16px; padding: 40px; width: 100%; max-width: 400px;
  backdrop-filter: blur(20px);
}
.lobby__title { text-align: center; margin: 0 0 8px 0; font-size: 36px; font-family: 'Georgia', serif; }
.lobby__title-deck { color: #ffd700; }
.lobby__title-royale { color: white; font-weight: 300; }
.lobby__subtitle { text-align: center; color: #888; margin: 0 0 32px 0; font-size: 14px; letter-spacing: 2px; }

.lobby__form { display: flex; flex-direction: column; gap: 16px; }
.lobby__input {
  width: 100%; padding: 14px 16px; background: rgba(255, 255, 255, 0.1);
  border: 1px solid rgba(255, 255, 255, 0.2); border-radius: 8px;
  color: white; font-size: 16px; outline: none; transition: border-color 0.2s;
}
.lobby__input:focus { border-color: #ffd700; }
.lobby__input::placeholder { color: #666; }
.lobby__input--code { text-align: center; font-size: 24px; letter-spacing: 8px; text-transform: uppercase; }

.lobby__row { display: flex; gap: 12px; }
.lobby__field { flex: 1; display: flex; flex-direction: column; gap: 6px; }
.lobby__field label { color: #aaa; font-size: 12px; text-transform: uppercase; letter-spacing: 1px; }

.lobby__btn {
  padding: 14px 24px; border: none; border-radius: 8px;
  font-size: 16px; font-weight: 600; cursor: pointer; transition: all 0.2s;
}
.lobby__btn:disabled { opacity: 0.5; cursor: not-allowed; }
.lobby__btn--primary { background: linear-gradient(135deg, #ffd700, #ffaa00); color: #000; }
.lobby__btn--primary:hover:not(:disabled) { transform: translateY(-2px); box-shadow: 0 4px 16px rgba(255, 215, 0, 0.4); }
.lobby__btn--secondary { background: rgba(255, 255, 255, 0.1); color: white; border: 1px solid rgba(255, 255, 255, 0.2); }
.lobby__btn--secondary:hover:not(:disabled) { background: rgba(255, 255, 255, 0.2); }
.lobby__btn--ghost { background: transparent; color: #888; }
.lobby__btn--ghost:hover { color: white; }
</style>

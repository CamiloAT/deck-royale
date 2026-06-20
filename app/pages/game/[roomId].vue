<script setup lang="ts">
const route = useRoute()
const roomId = route.params.roomId as string

const { state, connect, joinRoom, leaveRoom, startGame, performAction } = useGame()

connect()

const nickname = ref('')
const buyIn = ref(1000)
const joined = ref(false)
const error = ref('')
const loading = ref(false)

async function handleJoin() {
  if (!nickname.value) { error.value = 'Ingresa un nickname'; return }
  loading.value = true
  error.value = ''
  const result = await joinRoom({ roomId, nickname: nickname.value, buyIn: buyIn.value })
  if ('error' in result) error.value = result.error
  else joined.value = true
  loading.value = false
}

async function handleStart() {
  loading.value = true
  error.value = ''
  const result = await startGame()
  if ('error' in result) error.value = result.error
  loading.value = false
}

async function handleAction(action: string, amount?: number) {
  const result = await performAction(action, amount)
  if ('error' in result) error.value = result.error
}

function handleLeave() { leaveRoom(); joined.value = false; error.value = '' }
</script>

<template>
  <div class="app">
    <div v-if="error" class="error-toast" @click="error = ''">{{ error }}</div>

    <div v-if="state.connected === false" class="loading">Conectando al servidor...</div>

    <template v-else-if="state.gameState && state.gameState.phase !== 'waiting'">
      <GamePokerTable
        :game-state="state.gameState"
        :my-player-id="state.player?.id || ''"
        @action="handleAction"
      />
    </template>

    <template v-else-if="state.room && joined">
      <LobbyWaitingRoom
        :room="state.room"
        :current-player-id="state.player?.id || ''"
        @start="handleStart"
        @leave="handleLeave"
      />
    </template>

    <template v-else>
      <div class="lobby">
        <div class="lobby__card">
          <h2>Unirse a Sala {{ roomId }}</h2>
          <div class="lobby__form">
            <input v-model="nickname" type="text" placeholder="Tu nickname" class="lobby__input" maxlength="15" />
            <div class="lobby__field">
              <label>Buy-In (fichas)</label>
              <SharedNumberInput v-model="buyIn" :min="100" :step="500" />
            </div>
            <button class="lobby__btn lobby__btn--primary" @click="handleJoin" :disabled="!nickname || loading">
              {{ loading ? 'Uniendo...' : 'Unirse' }}
            </button>
            <NuxtLink to="/" class="lobby__btn lobby__btn--ghost">Volver al lobby</NuxtLink>
          </div>
        </div>
      </div>
    </template>

    <div v-if="state.message" class="game-message">{{ state.message }}</div>
  </div>
</template>

<style scoped>
.app { min-height: 100vh; background: transparent; }
.loading { min-height: 100vh; display: flex; align-items: center; justify-content: center; color: #888; font-size: 18px; }
.lobby { min-height: 100vh; display: flex; align-items: center; justify-content: center; padding: 20px; }
.lobby__card {
  background: rgba(0, 0, 0, 0.8); border: 1px solid rgba(255, 215, 0, 0.2);
  border-radius: 16px; padding: 40px; width: 100%; max-width: 400px;
}
.lobby__card h2 { color: #ffd700; text-align: center; margin-bottom: 24px; }
.lobby__form { display: flex; flex-direction: column; gap: 16px; }
.lobby__input {
  width: 100%; padding: 14px 16px; background: rgba(255, 255, 255, 0.1);
  border: 1px solid rgba(255, 255, 255, 0.2); border-radius: 8px;
  color: white; font-size: 16px; outline: none; transition: border-color 0.2s;
}
.lobby__input:focus { border-color: #ffd700; }
.lobby__input::placeholder { color: #666; }
.lobby__field { display: flex; flex-direction: column; gap: 6px; }
.lobby__field label { color: #aaa; font-size: 12px; text-transform: uppercase; letter-spacing: 1px; }
.lobby__btn {
  padding: 14px 24px; border: none; border-radius: 8px;
  font-size: 16px; font-weight: 600; cursor: pointer; transition: all 0.2s; text-align: center;
}
.lobby__btn:disabled { opacity: 0.5; cursor: not-allowed; }
.lobby__btn--primary { background: linear-gradient(135deg, #ffd700, #ffaa00); color: #000; }
.lobby__btn--primary:hover:not(:disabled) { transform: translateY(-2px); box-shadow: 0 4px 16px rgba(255, 215, 0, 0.4); }
.lobby__btn--ghost { background: transparent; color: #888; border: 1px solid rgba(255, 255, 255, 0.1); }
.lobby__btn--ghost:hover { color: white; border-color: rgba(255, 255, 255, 0.3); }

.error-toast {
  position: fixed; top: 20px; left: 50%; transform: translateX(-50%);
  background: #cc0000; color: white; padding: 12px 24px; border-radius: 8px;
  font-size: 14px; cursor: pointer; z-index: 1000; animation: slideDown 0.3s ease-out;
}
.game-message {
  position: fixed; top: 20px; left: 50%; transform: translateX(-50%);
  background: rgba(0, 0, 0, 0.9); color: #ffd700; padding: 12px 24px;
  border-radius: 8px; font-size: 16px; font-weight: 600; z-index: 1000;
  animation: slideDown 0.3s ease-out; border: 1px solid rgba(255, 215, 0, 0.3);
}
@keyframes slideDown {
  from { transform: translate(-50%, -100%); opacity: 0; }
  to { transform: translate(-50%, 0); opacity: 1; }
}
</style>

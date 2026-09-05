<script setup lang="ts">
const route = useRoute()
const roomId = route.params.roomId as string

const { state, connect, joinRoom, leaveRoom, startGame, performAction, requestGameState, rejoinGame } = useGame()
const { show, showError } = useToast()

connect()

const nickname = ref('')
const buyIn = ref(2000)
const joined = ref(false)
const loading = ref(false)
const rejoining = ref(false)

onMounted(async () => {
  navigateTo({ query: { room: roomId }, replace: true })
})

async function handleJoin() {
  if (!nickname.value) { showError('Ingresa un nickname'); return }
  loading.value = true
  const result = await joinRoom({ roomId, nickname: nickname.value, buyIn: buyIn.value })
  if ('error' in result) showError(result.error)
  else joined.value = true
  loading.value = false
}

async function handleStart() {
  loading.value = true
  const result = await startGame()
  if ('error' in result) showError(result.error)
  loading.value = false
}

async function handleAction(action: string, amount?: number) {
  const result = await performAction(action, amount)
  if ('error' in result) showError(result.error)
}

function handleLeave() { leaveRoom(); joined.value = false; navigateTo('/') }

let lastMessage = ''
watch(() => state.message, (msg) => {
  if (msg && msg !== lastMessage) {
    show(msg)
    lastMessage = msg
  }
})
</script>

<template>
  <div class="app">
    <GameToastList />

    <div v-if="state.connected === false" class="loading">
      <img :src="'/images/logo.png'" alt="Deck Royale" class="loading__logo" />
      <div class="loading__brand">DECK<span>ROYALE</span></div>
      <div class="loading__spinner" />
      <div class="loading__text">Cargando...</div>
    </div>

    <div v-else-if="rejoining" class="loading">
      <img :src="'/images/logo.png'" alt="Deck Royale" class="loading__logo" />
      <div class="loading__brand">DECK<span>ROYALE</span></div>
      <div class="loading__spinner" />
      <div class="loading__text">Reconectando...</div>
    </div>

    <template v-else-if="state.gameState && state.gameState.phase !== 'waiting'">
      <GamePokerTable
        :game-state="state.gameState"
        :my-player-id="state.player?.id || ''"
        @action="handleAction"
        @leave="handleLeave"
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
              <label>Buy-In (COP)</label>
              <SharedNumberInput v-model="buyIn" :min="500" :step="1000" />
            </div>
            <button class="lobby__btn lobby__btn--primary" @click="handleJoin" :disabled="!nickname || loading">
              {{ loading ? 'Uniendo...' : 'Unirse' }}
            </button>
            <NuxtLink to="/" class="lobby__btn lobby__btn--ghost">Volver al lobby</NuxtLink>
          </div>
        </div>
      </div>
    </template>
  </div>
</template>

<style scoped>
.app { min-height: 100vh; background: transparent; }
.loading { min-height: 100vh; display: flex; flex-direction: column; align-items: center; justify-content: center; gap: 16px; }
.loading__logo { width: 64px; height: 64px; object-fit: contain; opacity: 0.6; filter: drop-shadow(0 0 8px rgba(255, 215, 0, 0.2)); }
.loading__brand { font-family: 'Georgia', serif; font-size: 28px; letter-spacing: 2px; color: #ffd700; }
.loading__brand span { color: white; font-weight: 300; }
.loading__spinner {
  width: 32px; height: 32px;
  border: 3px solid rgba(255, 215, 0, 0.15);
  border-top-color: #ffd700;
  border-radius: 50%;
  animation: spin 0.8s linear infinite;
}
.loading__text { color: #666; font-size: 14px; letter-spacing: 2px; }
@keyframes spin { to { transform: rotate(360deg); } }
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
</style>

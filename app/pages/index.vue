<script setup lang="ts">
const { state, connect, createRoom, joinRoom, leaveRoom, startGame, performAction, updateRoom, clearGameOver, onEntryDone, onTransitionDone, setAvatar, playAgain } = useGame()
const { show, showError } = useToast()

connect()

const loading = ref(false)

async function handleCreate(data: any) {
  loading.value = true
  const result = await createRoom(data)
  if ('error' in result) { showError(result.error) }
  else if ('room' in result) { navigateTo({ query: { room: result.room.id } }) }
  loading.value = false
}

async function handleJoin(data: any) {
  loading.value = true
  const result = await joinRoom(data)
  if ('error' in result) showError(result.error)
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

function handleLeave() {
  leaveRoom()
  navigateTo('/')
}

async function handleUpdateSettings(data: any) {
  const result = await updateRoom(data)
  if ('error' in result) showError(result.error)
}

async function handleSelectAvatar(avatarType: string, avatarColor: string) {
  await setAvatar(avatarType, avatarColor)
}

const hostLeft = computed(() => {
  if (!state.gameOverData || !state.room) return false
  const host = state.room.players.find(p => p.id === state.gameOverData!.hostId)
  return !host || !host.isConnected
})

function handleLeaveGameEnd() {
  clearGameOver()
  leaveRoom()
  navigateTo('/')
}

async function handlePlayAgain() {
  const result = await playAgain()
  if ('error' in result) showError(result.error)
}

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

    <GameEntry v-if="state.showEntry" @done="onEntryDone" />

    <GameRoundTransition v-if="state.showTransition" :hand-number="state.transitionHandNumber" @done="onTransitionDone" />

    <template v-if="!state.showEntry">
      <template v-if="state.gameOverData">
        <GameEndModal
          :data="state.gameOverData"
          :my-player-id="state.player?.id || ''"
          :play-again-count="state.playAgainCount"
          :play-again-total="state.playAgainTotal"
          :my-play-again="state.myPlayAgain"
          :host-left="hostLeft"
          @leave="handleLeaveGameEnd"
          @play-again="handlePlayAgain"
        />
      </template>

      <template v-else-if="state.gameState && state.gameState.phase !== 'waiting'">
        <GamePokerTable
          :game-state="state.gameState"
          :my-player-id="state.player?.id || ''"
          @action="handleAction"
          @leave="handleLeave"
        />
      </template>

      <template v-else-if="state.room">
        <LobbyWaitingRoom
          :room="state.room"
          :current-player-id="state.player?.id || ''"
          @start="handleStart"
          @leave="handleLeave"
          @update-settings="handleUpdateSettings"
          @select-avatar="handleSelectAvatar"
        />
      </template>

      <template v-else>
        <LobbyJoinModal @create="handleCreate" @join="handleJoin" />
      </template>
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
</style>

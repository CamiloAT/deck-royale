<script setup lang="ts">
const { state, connect, createRoom, joinRoom, leaveRoom, startGame, performAction } = useGame()

connect()

const error = ref('')
const loading = ref(false)

async function handleCreate(data: any) {
  loading.value = true
  error.value = ''
  const result = await createRoom(data)
  if ('error' in result) error.value = result.error
  loading.value = false
}

async function handleJoin(data: any) {
  loading.value = true
  error.value = ''
  const result = await joinRoom(data)
  if ('error' in result) error.value = result.error
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

function handleLeave() {
  leaveRoom()
  error.value = ''
}
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

    <template v-else-if="state.room">
      <LobbyWaitingRoom
        :room="state.room"
        :current-player-id="state.player?.id || ''"
        @start="handleStart"
        @leave="handleLeave"
      />
    </template>

    <template v-else>
      <LobbyJoinModal @create="handleCreate" @join="handleJoin" />
    </template>

    <div v-if="state.message" class="game-message">{{ state.message }}</div>
  </div>
</template>

<style scoped>
.app { min-height: 100vh; background: radial-gradient(ellipse at center, #1a1a2e 0%, #0f0f1a 100%); }
.loading { min-height: 100vh; display: flex; align-items: center; justify-content: center; color: #888; font-size: 18px; }

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

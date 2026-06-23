import type { Room, Player, GameState, Card, GameOverData } from '../types/poker'

interface GameStore {
  room: Room | null
  player: Player | null
  gameState: GameState | null
  myHand: Card[]
  message: string
  connected: boolean
  gameOverData: GameOverData | null
  showEntry: boolean
  showTransition: boolean
  transitionHandNumber: number
}

const state = reactive<GameStore>({
  room: null,
  player: null,
  gameState: null,
  myHand: [],
  message: '',
  connected: false,
  gameOverData: null,
  showEntry: false,
  showTransition: false,
  transitionHandNumber: 0,
})

const STORAGE_KEY = 'deck-royale-session'

function saveSession(roomId: string, playerId: string, nickname: string) {
  if (typeof window === 'undefined') return
  localStorage.setItem(STORAGE_KEY, JSON.stringify({ roomId, playerId, nickname }))
}

function loadSession(): { roomId: string; playerId: string; nickname: string } | null {
  if (typeof window === 'undefined') return null
  try {
    const raw = localStorage.getItem(STORAGE_KEY)
    if (!raw) return null
    return JSON.parse(raw)
  } catch { return null }
}

function clearSession() {
  if (typeof window === 'undefined') return
  localStorage.removeItem(STORAGE_KEY)
}

export function useGame() {
  const socket = useSocket()
  let listenersAttached = false

  function connect() {
    if (listenersAttached) return
    listenersAttached = true

    socket.on('connect', () => {
      state.connected = true
      const session = loadSession()
      if (session && state.gameState) {
        socket.emit('rejoin-game', { roomId: session.roomId, nickname: session.nickname }, (response: any) => {
          if (!response.error) {
            state.gameState = response.game
            state.player = response.player
          }
        })
      } else if (session && !state.gameState) {
        socket.emit('rejoin-game', { roomId: session.roomId, nickname: session.nickname }, (response: any) => {
          if (!response.error) {
            state.gameState = response.game
            state.player = response.player
            state.room = null
          } else {
            socket.emit('rejoin-room', { roomId: session.roomId, nickname: session.nickname }, (roomResponse: any) => {
              if (!roomResponse.error) {
                state.room = roomResponse.room
                state.player = roomResponse.player
              }
            })
          }
        })
      }
    })

    socket.on('disconnect', () => {
      state.connected = false
    })

    socket.on('room-update', (room: Room) => {
      state.room = room
    })

    socket.on('player-left', (data: { playerId: string }) => {
      if (state.room) {
        state.room.players = state.room.players.filter(p => p.id !== data.playerId)
      }
      if (state.gameState) {
        state.gameState.players = state.gameState.players.filter(p => p.id !== data.playerId)
      }
    })

    socket.on('player-disconnected', (data: { playerId: string; nickname: string }) => {
      if (state.gameState) {
        const p = state.gameState.players.find(p => p.id === data.playerId)
        if (p) p.isConnected = false
      }
    })

    socket.on('player-kicked', (data: { playerId: string }) => {
      if (state.gameState) {
        state.gameState.players = state.gameState.players.filter(p => p.id !== data.playerId)
      }
      clearSession()
    })

    socket.on('game-started', (game: GameState) => {
      state.gameState = game
      state.room = null
      state.showEntry = true
    })

    socket.on('game-update', (game: GameState) => {
      state.gameState = game
    })

    socket.on('game-message', (msg: string) => {
      state.message = msg
      setTimeout(() => {
        if (state.message === msg) state.message = ''
      }, 5000)
    })

    socket.on('your-hand', (hand: Card[]) => {
      state.myHand = hand
    })

    socket.on('game-over', (data: GameOverData) => {
      state.gameOverData = data
    })

    socket.on('hand-started', (data: { handNumber: number }) => {
      state.gameOverData = null
      state.showTransition = true
      state.transitionHandNumber = data.handNumber
    })
  }

  function createRoom(data: {
    nickname: string
    roomName: string
    smallBlind: number
    bigBlind: number
    buyIn: number
  }): Promise<{ room: Room; player: Player } | { error: string }> {
    return new Promise((resolve) => {
      socket.emit('create-room', data, (response: any) => {
        if (response.error) {
          resolve({ error: response.error })
        } else {
          state.room = response.room
          state.player = response.player
          saveSession(response.room.id, response.player.id, response.player.nickname)
          resolve(response)
        }
      })
    })
  }

  function joinRoom(data: {
    roomId: string
    nickname: string
    buyIn: number
  }): Promise<{ room: Room; player: Player } | { error: string }> {
    return new Promise((resolve) => {
      socket.emit('join-room', data, (response: any) => {
        if (response.error) {
          resolve({ error: response.error })
        } else {
          state.room = response.room
          state.player = response.player
          saveSession(data.roomId, response.player.id, response.player.nickname)
          resolve(response)
        }
      })
    })
  }

  function leaveRoom() {
    socket.emit('leave-room')
    clearSession()
    state.room = null
    state.player = null
    state.gameState = null
    state.myHand = []
    state.gameOverData = null
  }

  function clearGameOver() {
    state.gameOverData = null
  }

  function onEntryDone() {
    state.showEntry = false
  }

  function onTransitionDone() {
    state.showTransition = false
  }

  function startGame(): Promise<{ success: boolean } | { error: string }> {
    return new Promise((resolve) => {
      socket.emit('start-game', (response: any) => {
        resolve(response)
      })
    })
  }

  function performAction(action: string, amount?: number): Promise<{ success: boolean } | { error: string }> {
    return new Promise((resolve) => {
      socket.emit('player-action', { action, amount }, (response: any) => {
        resolve(response)
      })
    })
  }

  function requestGameState() {
    socket.emit('request-game-state', (response: any) => {
      if (response.game) {
        state.gameState = response.game
      } else if (response.room) {
        state.room = response.room
      }
    })
  }

  function updateRoom(settings: { smallBlind?: number; bigBlind?: number; minBuyIn?: number }): Promise<{ success: boolean } | { error: string }> {
    return new Promise((resolve) => {
      socket.emit('update-room', settings, (response: any) => {
        resolve(response)
      })
    })
  }

  function rejoinGame(roomId: string, nickname: string): Promise<{ game: GameState; player: Player } | { error: string }> {
    return new Promise((resolve) => {
      socket.emit('rejoin-game', { roomId, nickname }, (response: any) => {
        if (response.error) {
          resolve({ error: response.error })
        } else {
          state.gameState = response.game
          state.player = response.player
          state.room = null
          saveSession(roomId, response.player.id, nickname)
          resolve(response)
        }
      })
    })
  }

  function endGame(): Promise<{ success: boolean } | { error: string }> {
    return new Promise((resolve) => {
      socket.emit('end-game', (response: any) => {
        resolve(response)
      })
    })
  }

  function setAvatar(avatarType: string): Promise<{ success: boolean } | { error: string }> {
    return new Promise((resolve) => {
      socket.emit('set-avatar', { avatarType }, (response: any) => {
        resolve(response)
      })
    })
  }

  return {
    state: readonly(state),
    connect,
    createRoom,
    joinRoom,
    leaveRoom,
    startGame,
    performAction,
    requestGameState,
    updateRoom,
    rejoinGame,
    endGame,
    setAvatar,
    clearGameOver,
    onEntryDone,
    onTransitionDone,
  }
}

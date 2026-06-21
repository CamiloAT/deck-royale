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

export function useGame() {
  const socket = useSocket()

  function connect() {
    socket.on('connect', () => {
      state.connected = true
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
          resolve(response)
        }
      })
    })
  }

  function leaveRoom() {
    socket.emit('leave-room')
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
    clearGameOver,
    onEntryDone,
    onTransitionDone,
  }
}

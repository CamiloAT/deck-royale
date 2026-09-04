import { Server } from 'socket.io'
import {
  createRoom, joinRoom, leaveRoom, removePlayerFromGame, startGame, performAction, getGame, getRoom,
  hasGameEnded, getGameOverData, nextHand, advanceAllInRunout, resolveAllInShowdown,
  cancelTurnTimer, pauseTurnTimer, resumeTurnTimer,
  startDisconnectTimer, cancelDisconnectTimer,
  startLobbyCleanup, cancelLobbyCleanup,
  setOnAutoFold, setOnPlayerKicked, endGameByHost,
  showdownSkip, getShowdownSkips, resetRoomForNewGame,
} from '../rooms/manager'
import type { GameState } from '../../types/poker'

let io: Server | null = null
const showdownTimers = new Map<string, ReturnType<typeof setTimeout>>()
const playAgainSkips = new Map<string, Set<string>>()
export const SHOWDOWN_DURATION = 20000

export function defineSocketPlugin() {
  return defineNitroPlugin((nitroApp) => {
    nitroApp.hooks.hook('request', (event) => {
      if (!io && event.node.req.socket) {
        const server = event.node.req.socket.server as any
        if (server && !server.__socketio_initialized) {
          server.__socketio_initialized = true
          io = new Server(server, {
            cors: { origin: '*', methods: ['GET', 'POST'] },
          })
          setupSocketEvents(io)
          console.log('[Socket.io] Server attached to HTTP server')
        }
      }
    })
  })
}

function handleShowdownAndNext(ioRef: Server, roomId: string, game: GameState) {
  if (game.phase === 'showdown') {
    if (hasGameEnded(roomId)) {
      setTimeout(() => {
        const gameOverData = getGameOverData(roomId)
        ioRef.to(roomId).emit('game-over', gameOverData)
      }, 6000)
    } else {
      const existingTimer = showdownTimers.get(roomId)
      if (existingTimer) clearTimeout(existingTimer)

      const showdownEndAt = Date.now() + SHOWDOWN_DURATION
      ioRef.to(roomId).emit('showdown-timer', { endsAt: showdownEndAt, total: game.players.length })

      const timer = setTimeout(() => {
        showdownTimers.delete(roomId)
        ioRef.to(roomId).emit('hand-started', { handNumber: game.handNumber })
        setTimeout(() => {
          const newGame = nextHand(roomId)
          if (newGame) {
            ioRef.to(roomId).emit('game-update', newGame)
          }
        }, 500)
      }, SHOWDOWN_DURATION)

      showdownTimers.set(roomId, timer)
    }
  }
}

function handleAllInRunout(ioRef: Server, roomId: string) {
  const game = getGame(roomId)
  if (!game || game.phase === 'showdown') return
  if (game.communityCards.length >= 5) return

  setTimeout(() => {
    const latestGame = getGame(roomId)
    if (!latestGame || latestGame.phase === 'showdown') return

    const result = advanceAllInRunout(roomId)
    if (!result) return

    ioRef.to(roomId).emit('game-update', result.game)

    if (result.showdownReady) {
      setTimeout(() => {
        const showdownResult = resolveAllInShowdown(roomId)
        if (!showdownResult) return
        ioRef.to(roomId).emit('game-update', showdownResult.game)
        ioRef.to(roomId).emit('game-message', showdownResult.message)
        handleShowdownAndNext(ioRef, roomId, showdownResult.game)
      }, 2500)
    } else {
      handleAllInRunout(ioRef, roomId)
    }
  }, 2000)
}

function setupSocketEvents(io: Server) {
  setOnAutoFold((roomId, game, message) => {
    io.to(roomId).emit('game-update', game)
    io.to(roomId).emit('game-message', message)
    handleShowdownAndNext(io, roomId, game)
  })

  setOnPlayerKicked((roomId, playerId) => {
    io.to(roomId).emit('player-kicked', { playerId })
    const game = getGame(roomId)
    if (game) {
      const remaining = game.players.filter(p => !p.folded)
      if (remaining.length <= 1) {
        const gameOverData = getGameOverData(roomId)
        if (gameOverData) io.to(roomId).emit('game-over', gameOverData)
      } else {
        io.to(roomId).emit('game-update', game)
      }
    }
  })

  io.on('connection', (socket) => {
    console.log(`[Socket] Jugador conectado: ${socket.id}`)

    socket.on('create-room', (data: any, callback: any) => {
      try {
        const room = createRoom({
          name: data.roomName || 'Sala de Deck Royale',
          smallBlind: data.smallBlind || 100,
          bigBlind: data.bigBlind || 200,
          minBuyIn: data.buyIn || 2000,
          maxBuyIn: data.buyIn || 2000,
        })
        const result = joinRoom(room.id, data.nickname, data.buyIn || 2000)
        if ('error' in result) { callback({ error: result.error }); return }
        socket.join(room.id)
        socket.data.roomId = room.id
        socket.data.playerId = result.player.id
        callback({ room, player: result.player })
        io!.to(room.id).emit('room-update', room)
      } catch (e: any) { callback({ error: e.message }) }
    })

    socket.on('get-room-info', (data: any, callback: any) => {
      try {
        const room = getRoom(data.roomId)
        if (!room) { callback({ error: 'Sala no encontrada' }); return }
        callback({ room: { id: room.id, name: room.name, playerCount: room.players.length, started: room.started } })
      } catch (e: any) { callback({ error: e.message }) }
    })

    socket.on('join-room', (data: any, callback: any) => {
      try {
        const room = getRoom(data.roomId)
        if (!room) { callback({ error: 'Sala no encontrada' }); return }
        const result = joinRoom(data.roomId, data.nickname, room.minBuyIn)
        if ('error' in result) { callback({ error: result.error }); return }
        socket.join(data.roomId)
        socket.data.roomId = data.roomId
        socket.data.playerId = result.player.id
        cancelLobbyCleanup(data.roomId)
        callback({ room: result.room, player: result.player })
        io!.to(data.roomId).emit('room-update', result.room)
      } catch (e: any) { callback({ error: e.message }) }
    })

    socket.on('update-room', (data: any, callback: any) => {
      try {
        const roomId = socket.data.roomId
        const playerId = socket.data.playerId
        if (!roomId || !playerId) { callback({ error: 'No estas en una sala' }); return }
        const room = getRoom(roomId)
        if (!room) { callback({ error: 'Sala no encontrada' }); return }
        if (room.players.length === 0 || room.players[0].id !== playerId) {
          callback({ error: 'Solo el host puede modificar los ajustes' }); return
        }
        if (room.started) { callback({ error: 'La partida ya comenzó' }); return }
        if (data.smallBlind !== undefined) room.smallBlind = Math.max(50, Number(data.smallBlind) || 100)
        if (data.bigBlind !== undefined) room.bigBlind = Math.max(100, Number(data.bigBlind) || 200)
        if (data.minBuyIn !== undefined) {
          room.minBuyIn = Math.max(500, Number(data.minBuyIn) || 2000)
          room.players.forEach(p => { p.chips = room.minBuyIn })
        }
        callback({ success: true })
        io!.to(roomId).emit('room-update', room)
      } catch (e: any) { callback({ error: e.message }) }
    })

    socket.on('leave-room', () => {
      const { roomId, playerId } = socket.data
      if (roomId && playerId) {
        const game = getGame(roomId)
        const room = getRoom(roomId)

        if (game && room && room.started) {
          const result = removePlayerFromGame(roomId, playerId)
          leaveRoom(roomId, playerId)
          socket.leave(roomId)
          io!.to(roomId).emit('player-left', { playerId })
          io!.to(roomId).emit('game-update', getGame(roomId)!)
          if (result?.gameOver) {
            const gameOverData = getGameOverData(roomId)
            if (gameOverData) io!.to(roomId).emit('game-over', gameOverData)
          }
        } else {
          leaveRoom(roomId, playerId)
          socket.leave(roomId)
          io!.to(roomId).emit('player-left', { playerId })
        }

        socket.data.roomId = null
        socket.data.playerId = null
      }
    })

    socket.on('rejoin-game', (data: any, callback: any) => {
      try {
        const roomId = data.roomId
        const nickname = data.nickname
        if (!roomId || !nickname) { callback({ error: 'Datos incompletos' }); return }

        cancelDisconnectTimer(roomId)

        const game = getGame(roomId)
        if (!game) { callback({ error: 'Partida no encontrada' }); return }

        const disconnected = game.players.find(p => !p.isConnected && p.nickname === nickname)
        if (!disconnected) { callback({ error: 'Jugador no encontrado como desconectado' }); return }

        const wasOnTurn = disconnected.isTurn

        disconnected.isConnected = true
        const room = getRoom(roomId)
        if (room) {
          const rp = room.players.find(p => p.nickname === nickname)
          if (rp) rp.isConnected = true
        }

        socket.join(roomId)
        socket.data.roomId = roomId
        socket.data.playerId = disconnected.id
        callback({ game, player: disconnected })
        io!.to(roomId).emit('game-update', game)
        io!.to(roomId).emit('player-rejoined', { playerId: disconnected.id, nickname: disconnected.nickname })

        if (wasOnTurn) {
          resumeTurnTimer(roomId)
        }
      } catch (e: any) { callback({ error: e.message }) }
    })

    socket.on('rejoin-room', (data: any, callback: any) => {
      try {
        const { roomId, nickname } = data
        if (!roomId || !nickname) { callback({ error: 'Datos incompletos' }); return }

        const room = getRoom(roomId)
        if (!room) { callback({ error: 'Sala no encontrada' }); return }
        if (room.started) { callback({ error: 'La partida ya comenzó' }); return }

        const existingPlayer = room.players.find(p => p.nickname.toLowerCase() === nickname.toLowerCase())
        if (!existingPlayer) { callback({ error: 'Jugador no encontrado en la sala' }); return }

        existingPlayer.isConnected = true
        socket.join(roomId)
        socket.data.roomId = roomId
        socket.data.playerId = existingPlayer.id

        cancelLobbyCleanup(roomId)

        callback({ room, player: existingPlayer })
        io!.to(roomId).emit('room-update', room)
      } catch (e: any) { callback({ error: e.message }) }
    })

    socket.on('start-game', (callback: any) => {
      try {
        const roomId = socket.data.roomId
        if (!roomId) { callback({ error: 'No estas en una sala' }); return }
        const game = startGame(roomId)
        if (!game) { callback({ error: 'Minimo 2 jugadores para iniciar' }); return }
        io!.to(roomId).emit('game-started', game)
        callback({ success: true })
      } catch (e: any) { callback({ error: e.message }) }
    })

    socket.on('end-game', (callback: any) => {
      try {
        const { roomId, playerId } = socket.data
        if (!roomId || !playerId) { callback({ error: 'No estas en una sala' }); return }
        const result = endGameByHost(roomId, playerId)
        if (result && 'error' in result) { callback({ error: result.error }); return }
        const timer = showdownTimers.get(roomId)
        if (timer) { clearTimeout(timer); showdownTimers.delete(roomId) }
        const gameOverData = getGameOverData(roomId)
        io!.to(roomId).emit('game-over', gameOverData)
        callback({ success: true })
      } catch (e: any) { callback({ error: e.message }) }
    })

    socket.on('showdown-skip', (callback: any) => {
      try {
        const { roomId, playerId } = socket.data
        if (!roomId || !playerId) { callback({ error: 'No estas en una sala' }); return }

        const result = showdownSkip(roomId, playerId)
        if (!result.skipped) { callback({ error: 'No se puede saltar' }); return }

        const skips = getShowdownSkips(roomId)
        io!.to(roomId).emit('showdown-skip-update', { count: skips.count, total: skips.total, playerId })

        if (result.allSkipped) {
          const timer = showdownTimers.get(roomId)
          if (timer) {
            clearTimeout(timer)
            showdownTimers.delete(roomId)
          }

          setTimeout(() => {
            const game = getGame(roomId)
            if (game && game.phase === 'showdown') {
              io!.to(roomId).emit('hand-started', { handNumber: game.handNumber })
              setTimeout(() => {
                const newGame = nextHand(roomId)
                if (newGame) {
                  io!.to(roomId).emit('game-update', newGame)
                }
              }, 500)
            }
          }, 1000)
        }

        callback({ success: true })
      } catch (e: any) { callback({ error: e.message }) }
    })

    socket.on('set-avatar', (data: any, callback: any) => {
      try {
        const { roomId, playerId } = socket.data
        if (!roomId || !playerId) { callback({ error: 'No estas en una sala' }); return }
        const avatarType = data.avatarType
        if (!['classic', 'female', 'frog', 'penguin'].includes(avatarType)) { callback({ error: 'Avatar invalido' }); return }

        const game = getGame(roomId)
        if (game) {
          const p = game.players.find(p => p.id === playerId)
          if (p) p.avatarType = avatarType
          io!.to(roomId).emit('game-update', game)
        }

        const room = getRoom(roomId)
        if (room) {
          const rp = room.players.find(p => p.id === playerId)
          if (rp) rp.avatarType = avatarType
          io!.to(roomId).emit('room-update', room)
        }

        callback({ success: true })
      } catch (e: any) { callback({ error: e.message }) }
    })

    socket.on('play-again', (callback: any) => {
      try {
        const { roomId, playerId } = socket.data
        if (!roomId || !playerId) { callback({ error: 'No estas en una sala' }); return }

        const room = getRoom(roomId)
        if (!room) { callback({ error: 'Sala no encontrada' }); return }

        if (!playAgainSkips.has(roomId)) playAgainSkips.set(roomId, new Set())
        const skips = playAgainSkips.get(roomId)!

        if (skips.has(playerId)) { callback({ error: 'Ya presionaste Jugar de Nuevo' }); return }
        skips.add(playerId)

        const connectedPlayers = room.players.filter(p => p.isConnected)
        const allReady = connectedPlayers.every(p => skips.has(p.id))

        io!.to(roomId).emit('play-again-update', { count: skips.size, total: connectedPlayers.length, playerId })

        if (allReady) {
          playAgainSkips.delete(roomId)
          const timer = showdownTimers.get(roomId)
          if (timer) { clearTimeout(timer); showdownTimers.delete(roomId) }

          resetRoomForNewGame(roomId)
          const updatedRoom = getRoom(roomId)
          if (updatedRoom) io!.to(roomId).emit('room-update', updatedRoom)
        }

        callback({ success: true })
      } catch (e: any) { callback({ error: e.message }) }
    })

    socket.on('player-action', (data: any, callback: any) => {
      try {
        const { roomId, playerId } = socket.data
        if (!roomId || !playerId) { callback({ error: 'No estas en una sala' }); return }
        const result = performAction(roomId, playerId, data.action, data.amount)
        if ('error' in result) { callback({ error: result.error }); return }
        io!.to(roomId).emit('game-update', result.game)
        if (result.message) io!.to(roomId).emit('game-message', result.message)
        callback({ success: true })

        if (result.allInRunout) {
          handleAllInRunout(io!, roomId)
        } else {
          handleShowdownAndNext(io!, roomId, result.game)
        }
      } catch (e: any) { callback({ error: e.message }) }
    })

    socket.on('request-game-state', (callback: any) => {
      try {
        const roomId = socket.data.roomId
        if (!roomId) { callback({ error: 'No estas en una sala' }); return }
        const game = getGame(roomId)
        if (game) { callback({ game }) }
        else { callback({ room: getRoom(roomId) }) }
      } catch (e: any) { callback({ error: e.message }) }
    })

    socket.on('disconnect', () => {
      const { roomId, playerId } = socket.data
      if (roomId && playerId) {
        const room = getRoom(roomId)
        const game = getGame(roomId)

        if (room) {
          const player = room.players.find(p => p.id === playerId)
          if (player) player.isConnected = false
        }

        if (game) {
          const gp = game.players.find(p => p.id === playerId)
          if (gp) {
            gp.isConnected = false

            if (gp.isTurn) {
              pauseTurnTimer(roomId)
            }
          }
        }

        io!.to(roomId).emit('player-disconnected', { playerId, nickname: '' })

        if (game) {
          startDisconnectTimer(roomId, playerId)
        } else if (room && !room.started && room.players.every(p => !p.isConnected)) {
          startLobbyCleanup(roomId)
        }
      }
      console.log(`[Socket] Jugador desconectado: ${socket.id}`)
    })
  })
}

export default defineSocketPlugin()

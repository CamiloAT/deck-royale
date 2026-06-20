import { Server } from 'socket.io'
import { createRoom, joinRoom, leaveRoom, startGame, performAction, getGame, getRoom } from '../rooms/manager'

let io: Server | null = null

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

function setupSocketEvents(io: Server) {
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

    socket.on('join-room', (data: any, callback: any) => {
      try {
        const result = joinRoom(data.roomId, data.nickname, data.buyIn || 2000)
        if ('error' in result) { callback({ error: result.error }); return }
        socket.join(data.roomId)
        socket.data.roomId = data.roomId
        socket.data.playerId = result.player.id
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
        if (data.minBuyIn !== undefined) room.minBuyIn = Math.max(500, Number(data.minBuyIn) || 2000)
        callback({ success: true })
        io!.to(roomId).emit('room-update', room)
      } catch (e: any) { callback({ error: e.message }) }
    })

    socket.on('leave-room', () => {
      const { roomId, playerId } = socket.data
      if (roomId && playerId) {
        leaveRoom(roomId, playerId)
        socket.leave(roomId)
        io!.to(roomId).emit('player-left', { playerId })
        socket.data.roomId = null
        socket.data.playerId = null
      }
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

    socket.on('player-action', (data: any, callback: any) => {
      try {
        const { roomId, playerId } = socket.data
        if (!roomId || !playerId) { callback({ error: 'No estas en una sala' }); return }
        const result = performAction(roomId, playerId, data.action, data.amount)
        if ('error' in result) { callback({ error: result.error }); return }
        io!.to(roomId).emit('game-update', result.game)
        io!.to(roomId).emit('game-message', result.message)
        callback({ success: true })
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
        leaveRoom(roomId, playerId)
        io!.to(roomId).emit('player-left', { playerId })
      }
      console.log(`[Socket] Jugador desconectado: ${socket.id}`)
    })
  })
}

export default defineSocketPlugin()

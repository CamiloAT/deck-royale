import { io, Socket } from 'socket.io-client'

let socket: Socket | null = null

export function useSocket() {
  if (!socket && typeof window !== 'undefined') {
    socket = io({
      transports: ['websocket', 'polling'],
    })
  }
  return socket as Socket
}

export function disconnectSocket() {
  if (socket) {
    socket.disconnect()
    socket = null
  }
}

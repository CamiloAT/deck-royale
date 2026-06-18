import { getRoom, getAllRooms } from '../rooms/manager'

export default defineEventHandler((event) => {
  const query = getQuery(event)
  const roomId = query.roomId as string | undefined

  if (roomId) {
    const room = getRoom(roomId)
    if (!room) {
      throw createError({ statusCode: 404, message: 'Sala no encontrada' })
    }
    return { room }
  }

  return { rooms: getAllRooms() }
})

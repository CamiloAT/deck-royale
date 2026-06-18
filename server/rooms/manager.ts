import type { Room, Player, CreateRoomOptions, GameState, GamePhase } from '../../types/poker'
import { createDeck, shuffleDeck } from '../poker/deck'
import { evaluateHand, compareHands } from '../poker/hand'
import {
  initPlayerState,
  dealHoleCards,
  dealCommunityCards,
  getActivePlayers,
  getPlayersWhoCanAct,
  getMinRaise,
  getCallAmount,
  calculatePots,
  nextActivePlayer,
  shouldAdvancePhase,
} from '../poker/rules'

const rooms = new Map<string, Room>()
const games = new Map<string, GameState>()
const turnTimers = new Map<string, ReturnType<typeof setTimeout>>()

function generateRoomId(): string {
  const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789'
  let id = ''
  for (let i = 0; i < 6; i++) {
    id += chars.charAt(Math.floor(Math.random() * chars.length))
  }
  return id
}

function generatePlayerId(): string {
  return Math.random().toString(36).substring(2, 15)
}

export function createRoom(options: CreateRoomOptions): Room {
  const id = generateRoomId()
  const room: Room = {
    id,
    name: options.name || `Sala ${id}`,
    players: [],
    maxPlayers: 10,
    smallBlind: options.smallBlind,
    bigBlind: options.bigBlind,
    minBuyIn: options.minBuyIn,
    maxBuyIn: options.maxBuyIn,
    started: false,
    createdAt: Date.now(),
  }
  rooms.set(id, room)
  return room
}

export function getRoom(id: string): Room | undefined {
  return rooms.get(id)
}

export function getAllRooms(): Room[] {
  return Array.from(rooms.values()).filter(r => !r.started || r.players.some(p => p.isConnected))
}

export function deleteRoom(id: string): void {
  rooms.delete(id)
  games.delete(id)
  const timer = turnTimers.get(id)
  if (timer) clearTimeout(timer)
  turnTimers.delete(id)
}

export function joinRoom(roomId: string, nickname: string, chips: number): { room: Room, player: Player } | { error: string } {
  const room = rooms.get(roomId)
  if (!room) return { error: 'Sala no encontrada' }
  if (room.players.length >= room.maxPlayers) return { error: 'Sala llena' }
  if (room.started) return { error: 'La partida ya comenzó' }

  const id = generatePlayerId()
  const player: Player = {
    id,
    nickname,
    chips,
    hand: [],
    bet: 0,
    totalBet: 0,
    folded: false,
    allIn: false,
    isDealer: false,
    isTurn: false,
    isConnected: true,
  }

  room.players.push(player)
  return { room, player }
}

export function leaveRoom(roomId: string, playerId: string): void {
  const room = rooms.get(roomId)
  if (!room) return

  room.players = room.players.filter(p => p.id !== playerId)

  if (room.players.length === 0) {
    deleteRoom(roomId)
  }
}

export function startGame(roomId: string): GameState | null {
  const room = rooms.get(roomId)
  if (!room || room.players.length < 2) return null

  room.started = true

  const deck = shuffleDeck(createDeck())
  const players = room.players.map((p, i) => initPlayerState(p, i, i === 0))

  const blinds = room.bigBlind
  const smallBlinds = room.smallBlind

  // Post blinds
  const sbIndex = players.length > 2 ? 1 : 0
  const bbIndex = players.length > 2 ? 2 : 1

  players[sbIndex] = {
    ...players[sbIndex],
    bet: smallBlinds,
    totalBet: smallBlinds,
    chips: players[sbIndex].chips - smallBlinds,
  }

  players[bbIndex] = {
    ...players[bbIndex],
    bet: blinds,
    totalBet: blinds,
    chips: players[bbIndex].chips - blinds,
  }

  // Deal hole cards
  const { players: dealtPlayers, remainingDeck } = dealHoleCards(players, deck)

  const game: GameState = {
    roomId,
    players: dealtPlayers,
    deck: remainingDeck,
    communityCards: [],
    phase: 'preflop',
    pots: [{ amount: smallBlinds + blinds, eligiblePlayerIds: dealtPlayers.map(p => p.id) }],
    currentBet: blinds,
    dealerIndex: 0,
    currentPlayerIndex: (bbIndex + 1) % players.length,
    smallBlind: smallBlinds,
    bigBlind: blinds,
    minBuyIn: room.minBuyIn,
    maxBuyIn: room.maxBuyIn,
    started: true,
    turnTimer: 30,
  }

  game.players[game.currentPlayerIndex] = {
    ...game.players[game.currentPlayerIndex],
    isTurn: true,
  }

  games.set(roomId, game)
  return game
}

export function getGame(roomId: string): GameState | null {
  return games.get(roomId) || null
}

export function performAction(
  roomId: string,
  playerId: string,
  action: PlayerAction,
  amount?: number
): { game: GameState; message: string } | { error: string } {
  const game = games.get(roomId)
  if (!game) return { error: 'Partida no encontrada' }

  const playerIndex = game.players.findIndex(p => p.id === playerId)
  if (playerIndex === -1) return { error: 'Jugador no encontrado' }

  const player = game.players[playerIndex]
  if (!player.isTurn) return { error: 'No es tu turno' }
  if (player.folded || player.allIn) return { error: 'No puedes actuar' }

  // Clear timer
  const timer = turnTimers.get(roomId)
  if (timer) clearTimeout(timer)

  let updatedPlayers = [...game.players]
  let updatedPots = [...game.pots]
  let message = ''

  switch (action) {
    case 'fold': {
      updatedPlayers[playerIndex] = { ...player, folded: true, isTurn: false }
      message = `${player.nickname} se fue`
      break
    }

    case 'check': {
      if (player.bet < game.currentBet) {
        return { error: 'No puedes pasar, debes igualar o subir' }
      }
      updatedPlayers[playerIndex] = { ...player, isTurn: false }
      message = `${player.nickname} pasa`
      break
    }

    case 'call': {
      const callAmount = getCallAmount(player, game.currentBet)
      if (callAmount <= 0) return { error: 'Ya está igualado' }

      const newBet = player.bet + callAmount
      const newChips = player.chips - callAmount
      const newTotalBet = player.totalBet + callAmount

      updatedPlayers[playerIndex] = {
        ...player,
        bet: newBet,
        totalBet: newTotalBet,
        chips: newChips,
        isTurn: false,
        allIn: newChips === 0,
      }
      message = `${player.nickname} iguala ${callAmount}`
      break
    }

    case 'raise': {
      if (!amount) return { error: 'Debes especificar el monto' }

      const minRaise = getMinRaise(updatedPlayers, game.currentBet, game.bigBlind)
      const totalBetNeeded = game.currentBet + minRaise

      if (amount < totalBetNeeded && amount < player.chips + player.bet) {
        return { error: `Raise mínimo es ${totalBetNeeded}` }
      }

      const raiseAmount = Math.min(amount - player.bet, player.chips)
      const newBet = player.bet + raiseAmount
      const newChips = player.chips - raiseAmount
      const newTotalBet = player.totalBet + raiseAmount

      updatedPlayers[playerIndex] = {
        ...player,
        bet: newBet,
        totalBet: newTotalBet,
        chips: newChips,
        isTurn: false,
        allIn: newChips === 0,
      }
      game.currentBet = newBet
      message = `${player.nickname} sube a ${newBet}`
      break
    }

    case 'all_in': {
      const allInAmount = player.chips
      const newBet = player.bet + allInAmount

      updatedPlayers[playerIndex] = {
        ...player,
        bet: newBet,
        totalBet: player.totalBet + allInAmount,
        chips: 0,
        isTurn: false,
        allIn: true,
      }
      if (newBet > game.currentBet) {
        game.currentBet = newBet
      }
      message = `${player.nickname} all-in!`
      break
    }
  }

  // Update pot
  const totalBetSum = updatedPlayers.reduce((sum, p) => sum + p.totalBet, 0)
  updatedPots = [{ amount: totalBetSum, eligiblePlayerIds: updatedPlayers.map(p => p.id) }]

  // Check if phase should advance
  const activePlayers = getPlayersWhoCanAct(updatedPlayers, game.currentBet)

  if (activePlayers.length <= 1) {
    // Everyone else folded or all-in
    const remaining = updatedPlayers.filter(p => !p.folded)
    if (remaining.length === 1) {
      // Winner by default
      const winner = remaining[0]
      const winnerIdx = updatedPlayers.findIndex(p => p.id === winner.id)
      updatedPlayers[winnerIdx] = {
        ...updatedPlayers[winnerIdx],
        chips: updatedPlayers[winnerIdx].chips + totalBetSum,
      }
      game.phase = 'showdown'
      game.players = updatedPlayers
      game.pots = updatedPots
      games.set(roomId, game)
      return { game, message: `${winner.nickname} gana ${totalBetSum}!` }
    }
  }

  const betsEven = activePlayers.every(p => p.bet === game.currentBet || p.allIn)

  if (betsEven || activePlayers.length <= 1) {
    // Advance phase
    const nextPhase = getNextPhase(game.phase, game.communityCards.length)

    if (nextPhase === 'showdown') {
      // Showdown - evaluate hands
      const communityResult = dealCommunityCards(game.deck, 5 - game.communityCards.length)
      const finalCommunity = [...game.communityCards, ...communityResult.cards]

      const activeForShowdown = updatedPlayers.filter(p => !p.folded)
      let bestWinner = activeForShowdown[0]
      let bestHand = evaluateHand(bestWinner.hand, finalCommunity)

      for (let i = 1; i < activeForShowdown.length; i++) {
        const hand = evaluateHand(activeForShowdown[i].hand, finalCommunity)
        if (compareHands(hand, bestHand) > 0) {
          bestHand = hand
          bestWinner = activeForShowdown[i]
        }
      }

      const winnerIdx = updatedPlayers.findIndex(p => p.id === bestWinner.id)
      updatedPlayers[winnerIdx] = {
        ...updatedPlayers[winnerIdx],
        chips: updatedPlayers[winnerIdx].chips + totalBetSum,
      }

      game.phase = 'showdown'
      game.communityCards = finalCommunity
      game.players = updatedPlayers
      game.pots = updatedPots
      games.set(roomId, game)

      return {
        game,
        message: `${bestWinner.nickname} gana ${totalBetSum} con ${bestHand.name}!`,
      }
    }

    // Deal community cards
    if (nextPhase === 'flop') {
      const { cards, remainingDeck } = dealCommunityCards(game.deck, 3)
      game.communityCards = cards
      game.deck = remainingDeck
    } else {
      const { cards, remainingDeck } = dealCommunityCards(game.deck, 1)
      game.communityCards = [...game.communityCards, ...cards]
      game.deck = remainingDeck
    }

    // Reset bets for new phase
    updatedPlayers = updatedPlayers.map(p => ({ ...p, bet: 0 }))
    game.currentBet = 0
    game.phase = nextPhase
  }

  // Find next player
  const nextIdx = nextActivePlayer(updatedPlayers, playerIndex)
  if (nextIdx !== -1) {
    updatedPlayers[nextIdx] = { ...updatedPlayers[nextIdx], isTurn: true }
  }

  game.currentPlayerIndex = nextIdx !== -1 ? nextIdx : playerIndex
  game.players = updatedPlayers
  game.pots = updatedPots

  // Set turn timer
  if (nextIdx !== -1) {
    const timerTimeout = setTimeout(() => {
      // Auto-fold on timeout
      performAction(roomId, updatedPlayers[nextIdx].id, 'fold')
    }, 30000)
    turnTimers.set(roomId, timerTimeout)
  }

  games.set(roomId, game)
  return { game, message }
}

function getNextPhase(currentPhase: GamePhase, communityCardCount: number): GamePhase {
  switch (currentPhase) {
    case 'preflop': return 'flop'
    case 'flop': return 'turn'
    case 'turn': return 'river'
    case 'river': return 'showdown'
    default: return 'showdown'
  }
}

export function resetRoom(roomId: string): void {
  const room = rooms.get(roomId)
  if (room) {
    room.started = false
  }
  games.delete(roomId)
  const timer = turnTimers.get(roomId)
  if (timer) clearTimeout(timer)
  turnTimers.delete(roomId)
}

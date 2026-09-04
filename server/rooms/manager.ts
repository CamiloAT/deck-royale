import type { Room, Player, CreateRoomOptions, GameState, GamePhase, HandResult, Card, PlayerAction } from '../../types/poker'
import { createDeck, shuffleDeck } from '../poker/deck'
import { evaluateHand, compareHands } from '../poker/hand'
import {
  initPlayerState,
  dealHoleCards,
  dealCommunityCards,
  getActivePlayers,
  getPlayersWhoCanAct,
  getCallAmount,
  calculatePots,
  distributePots,
  nextActivePlayer,
} from '../poker/rules'

const rooms = new Map<string, Room>()
const games = new Map<string, GameState>()
const turnTimers = new Map<string, ReturnType<typeof setTimeout>>()
const disconnectTimers = new Map<string, ReturnType<typeof setTimeout>>()
const lobbyCleanupTimers = new Map<string, ReturnType<typeof setTimeout>>()
const pausedTurnRemaining = new Map<string, number>()
const departedPlayers = new Map<string, { id: string; nickname: string; chips: number }[]>()
const showdownSkips = new Map<string, Set<string>>()

export const TURN_DURATION = 60
export const DISCONNECT_GRACE = 15
export const LOBBY_CLEANUP_DELAY = 10 * 60 * 1000

let onAutoFold: ((roomId: string, game: GameState, message: string) => void) | null = null
let onPlayerKicked: ((roomId: string, playerId: string) => void) | null = null
let onTurnUpdate: ((roomId: string, game: GameState) => void) | null = null

export function setOnAutoFold(cb: (roomId: string, game: GameState, message: string) => void) {
  onAutoFold = cb
}

export function setOnPlayerKicked(cb: (roomId: string, playerId: string) => void) {
  onPlayerKicked = cb
}

export function setOnTurnUpdate(cb: (roomId: string, game: GameState) => void) {
  onTurnUpdate = cb
}

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

export function startTurnTimer(roomId: string, playerId: string) {
  cancelTurnTimer(roomId)
  pausedTurnRemaining.delete(roomId)
  const game = games.get(roomId)
  if (!game) return

  game.turnStartedAt = Date.now()

  const timer = setTimeout(() => {
    const result = performAction(roomId, playerId, 'fold')
    if ('game' in result && onAutoFold) {
      onAutoFold(roomId, result.game, result.message)
    }
  }, TURN_DURATION * 1000)

  turnTimers.set(roomId, timer)
}

export function cancelTurnTimer(roomId: string) {
  const timer = turnTimers.get(roomId)
  if (timer) {
    clearTimeout(timer)
    turnTimers.delete(roomId)
  }
}

export function pauseTurnTimer(roomId: string) {
  const game = games.get(roomId)
  if (!game || !game.turnStartedAt) return

  const elapsed = Date.now() - game.turnStartedAt
  const remaining = Math.max(0, TURN_DURATION * 1000 - elapsed)
  pausedTurnRemaining.set(roomId, remaining)

  cancelTurnTimer(roomId)
}

export function resumeTurnTimer(roomId: string) {
  const game = games.get(roomId)
  if (!game) return

  const remaining = pausedTurnRemaining.get(roomId) ?? TURN_DURATION * 1000
  pausedTurnRemaining.delete(roomId)

  const currentTurnPlayer = game.players.find(p => p.isTurn)
  if (!currentTurnPlayer) return

  game.turnStartedAt = Date.now() - (TURN_DURATION * 1000 - remaining)

  const timer = setTimeout(() => {
    const result = performAction(roomId, currentTurnPlayer.id, 'fold')
    if ('game' in result && onAutoFold) {
      onAutoFold(roomId, result.game, result.message)
    }
  }, remaining)

  turnTimers.set(roomId, timer)
}

export function startDisconnectTimer(roomId: string, playerId: string) {
  cancelDisconnectTimer(roomId)

  const timer = setTimeout(() => {
    kickPlayer(roomId, playerId)
  }, DISCONNECT_GRACE * 1000)

  disconnectTimers.set(roomId, timer)
}

export function cancelDisconnectTimer(roomId: string) {
  const timer = disconnectTimers.get(roomId)
  if (timer) {
    clearTimeout(timer)
    disconnectTimers.delete(roomId)
  }
}

export function startLobbyCleanup(roomId: string) {
  if (lobbyCleanupTimers.has(roomId)) return

  const timer = setTimeout(() => {
    lobbyCleanupTimers.delete(roomId)
    const room = rooms.get(roomId)
    if (!room || room.started) return
    if (room.players.some(p => p.isConnected)) return
    deleteRoom(roomId)
    console.log(`[Manager] Sala ${roomId} eliminada por inactividad en lobby`)
  }, LOBBY_CLEANUP_DELAY)

  lobbyCleanupTimers.set(roomId, timer)
}

export function cancelLobbyCleanup(roomId: string) {
  const timer = lobbyCleanupTimers.get(roomId)
  if (timer) {
    clearTimeout(timer)
    lobbyCleanupTimers.delete(roomId)
  }
}

function kickPlayer(roomId: string, playerId: string) {
  const game = games.get(roomId)
  const room = rooms.get(roomId)

  if (game) {
    const result = removePlayerFromGame(roomId, playerId)
    if (onPlayerKicked) {
      onPlayerKicked(roomId, playerId)
    }
  }

  if (room) {
    room.players = room.players.filter(p => p.id !== playerId)
    if (room.players.length === 0) {
      deleteRoom(roomId)
      return
    }
  }
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
  cancelTurnTimer(id)
  cancelDisconnectTimer(id)
  cancelLobbyCleanup(id)
  pausedTurnRemaining.delete(id)
}

export function joinRoom(roomId: string, nickname: string, chips: number): { room: Room, player: Player } | { error: string } {
  const room = rooms.get(roomId)
  if (!room) return { error: 'Sala no encontrada' }
  if (room.players.length >= room.maxPlayers) return { error: 'Sala llena' }
  if (room.started) return { error: 'La partida ya comenzó' }

  let finalNickname = nickname
  const existingNames = room.players.map(p => p.nickname.toLowerCase())
  if (existingNames.includes(nickname.toLowerCase())) {
    let counter = 1
    while (existingNames.includes(`${nickname}(${counter})`.toLowerCase())) {
      counter++
    }
    finalNickname = `${nickname}(${counter})`
  }

  const id = generatePlayerId()
  const player: Player = {
    id,
    nickname: finalNickname,
    chips,
    hand: [],
    bet: 0,
    totalBet: 0,
    folded: false,
    allIn: false,
    isDealer: false,
    isTurn: false,
    isConnected: true,
    avatarType: 'classic',
  }

  room.players.push(player)
  cancelLobbyCleanup(roomId)
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

export function removePlayerFromGame(roomId: string, playerId: string): { gameOver: boolean; winnerId?: string } | null {
  const game = games.get(roomId)
  if (!game) return null

  const player = game.players.find(p => p.id === playerId)
  if (!player) return null

  if (!departedPlayers.has(roomId)) departedPlayers.set(roomId, [])
  departedPlayers.get(roomId)!.push({ id: player.id, nickname: player.nickname, chips: player.chips })

  if (player.isTurn) {
    cancelTurnTimer(roomId)
  }

  game.players = game.players.filter(p => p.id !== playerId)

  const remaining = game.players.filter(p => !p.folded)

  if (remaining.length <= 1) {
    cancelTurnTimer(roomId)
    pausedTurnRemaining.delete(roomId)

    if (remaining.length === 1) {
      const winner = remaining[0]
      const totalBetSum = game.pots.reduce((sum, pot) => sum + pot.amount, 0)
      const winnerIdx = game.players.findIndex(p => p.id === winner.id)
      game.players[winnerIdx] = {
        ...game.players[winnerIdx],
        chips: game.players[winnerIdx].chips + totalBetSum,
      }

      const handResult: HandResult = {
        handNumber: game.handNumber,
        winners: game.pots.map((pot, i) => ({
          potIndex: i,
          potAmount: pot.amount,
          winnerId: winner.id,
          winnerNickname: winner.nickname,
          amountWon: pot.amount,
        })),
        foldedPlayers: [],
        communityCards: [...game.communityCards],
        finalChips: Object.fromEntries(game.players.map(p => [p.id, p.chips])),
        playerBets: Object.fromEntries(game.players.map(p => [p.id, p.totalBet])),
      }
      game.handHistory = [...game.handHistory, handResult]
      game.handNumber++

      game.phase = 'showdown'
      games.set(roomId, game)

      return { gameOver: true, winnerId: winner.id }
    }

    game.phase = 'showdown'
    games.set(roomId, game)
    return { gameOver: true }
  }

  if (player.isTurn) {
    const nextIdx = nextActivePlayer(game.players, -1)
    if (nextIdx !== -1) {
      game.players[nextIdx] = { ...game.players[nextIdx], isTurn: true, lastAction: undefined }
      game.currentPlayerIndex = nextIdx
      startTurnTimer(roomId, game.players[nextIdx].id)
    }
  }

  games.set(roomId, game)
  return { gameOver: false }
}

export function startGame(roomId: string): GameState | null {
  const room = rooms.get(roomId)
  if (!room || room.players.length < 2) return null

  room.started = true

  const eligiblePlayers = room.players.filter(p => p.chips > 0)
  if (eligiblePlayers.length < 2) return null

  const deck = shuffleDeck(createDeck())
  const players = eligiblePlayers.map((p, i) => initPlayerState(p, i, i === 0))

  const blinds = room.bigBlind
  const smallBlinds = room.smallBlind

  const sbIndex = players.length > 2 ? 1 : 0
  const bbIndex = players.length > 2 ? 2 : 1

  players[sbIndex] = {
    ...players[sbIndex],
    bet: smallBlinds,
    totalBet: smallBlinds,
    chips: players[sbIndex].chips - smallBlinds,
    allIn: players[sbIndex].chips <= smallBlinds,
  }

  players[bbIndex] = {
    ...players[bbIndex],
    bet: blinds,
    totalBet: blinds,
    chips: players[bbIndex].chips - blinds,
    allIn: players[bbIndex].chips <= blinds,
  }

  const { players: dealtPlayers, remainingDeck } = dealHoleCards(players, deck)
  const firstActor = (bbIndex + 1) % players.length

  const game: GameState = {
    roomId,
    players: dealtPlayers,
    deck: remainingDeck,
    communityCards: [],
    phase: 'preflop',
    pots: [{ amount: smallBlinds + blinds, eligiblePlayerIds: dealtPlayers.map(p => p.id) }],
    currentBet: blinds,
    dealerIndex: 0,
    currentPlayerIndex: firstActor,
    smallBlind: smallBlinds,
    bigBlind: blinds,
    minBuyIn: room.minBuyIn,
    maxBuyIn: room.maxBuyIn,
    started: true,
    turnTimer: TURN_DURATION,
    turnStartedAt: Date.now(),
    lastAggressorIndex: -1,
    firstActorIndex: firstActor,
    handNumber: 1,
    handHistory: [],
    canEndHand: true,
    hostId: room.players[0]?.id ?? '',
  }

  game.players[game.currentPlayerIndex] = {
    ...game.players[game.currentPlayerIndex],
    isTurn: true,
    lastAction: undefined,
  }

  games.set(roomId, game)
  startTurnTimer(roomId, game.players[game.currentPlayerIndex].id)
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
): { game: GameState; message: string; allInRunout?: boolean } | { error: string } {
  const game = games.get(roomId)
  if (!game) return { error: 'Partida no encontrada' }

  const playerIndex = game.players.findIndex(p => p.id === playerId)
  if (playerIndex === -1) return { error: 'Jugador no encontrado' }

  const player = game.players[playerIndex]
  if (!player.isTurn) return { error: 'No es tu turno' }
  if (player.folded || player.allIn || player.chips === 0) return { error: 'No puedes actuar' }

  cancelTurnTimer(roomId)

  game.canEndHand = false

  let updatedPlayers = [...game.players]
  let updatedPots = [...game.pots]
  let message = ''

  switch (action) {
    case 'fold': {
      updatedPlayers[playerIndex] = { ...player, folded: true, isTurn: false, lastAction: 'fold', hasActed: true }
      message = `${player.nickname} se fue`
      break
    }

    case 'check': {
      if (player.bet < game.currentBet) {
        return { error: 'No puedes pasar, debes igualar o subir' }
      }
      updatedPlayers[playerIndex] = { ...player, isTurn: false, lastAction: 'check', hasActed: true }
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
        lastAction: 'call',
        hasActed: true,
      }
      message = `${player.nickname} iguala ${callAmount}`
      break
    }

    case 'raise': {
      if (!amount) return { error: 'Debes especificar el monto' }

      if (amount <= game.currentBet && amount < player.chips + player.bet) {
        return { error: `Debes subir a más de $${game.currentBet}` }
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
        lastAction: 'raise',
        hasActed: true,
      }
      game.currentBet = newBet
      game.lastAggressorIndex = playerIndex
      updatedPlayers = updatedPlayers.map((p, i) =>
        i !== playerIndex && !p.folded && !p.allIn && p.chips > 0
          ? { ...p, hasActed: false }
          : p
      )
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
        lastAction: 'all_in',
        hasActed: true,
      }
      if (newBet > game.currentBet) {
        game.currentBet = newBet
        game.lastAggressorIndex = playerIndex
        updatedPlayers = updatedPlayers.map((p, i) =>
          i !== playerIndex && !p.folded && !p.allIn && p.chips > 0
            ? { ...p, hasActed: false }
            : p
        )
      }
      message = `${player.nickname} all-in!`
      break
    }
  }

  updatedPots = calculatePots(updatedPlayers)
  const totalBetSum = updatedPots.reduce((sum, pot) => sum + pot.amount, 0)

  const nextPlayerIdx = nextActivePlayer(updatedPlayers, playerIndex)

  const activePlayers = getPlayersWhoCanAct(updatedPlayers, game.currentBet)

  if (activePlayers.length <= 1) {
    const remaining = updatedPlayers.filter(p => !p.folded)
    if (remaining.length === 1) {
      const winner = remaining[0]
      const winnerIdx = updatedPlayers.findIndex(p => p.id === winner.id)
      updatedPlayers[winnerIdx] = {
        ...updatedPlayers[winnerIdx],
        chips: updatedPlayers[winnerIdx].chips + totalBetSum,
      }

      const handResult: HandResult = {
        handNumber: game.handNumber,
        winners: updatedPots.map((pot, i) => ({
          potIndex: i,
          potAmount: pot.amount,
          winnerId: winner.id,
          winnerNickname: winner.nickname,
          amountWon: pot.amount,
        })),
        foldedPlayers: updatedPlayers
          .filter(p => p.folded)
          .map(p => ({ id: p.id, nickname: p.nickname })),
        communityCards: [...game.communityCards],
        finalChips: Object.fromEntries(updatedPlayers.map(p => [p.id, p.chips])),
        playerBets: Object.fromEntries(updatedPlayers.map(p => [p.id, p.totalBet])),
      }
      game.handHistory = [...game.handHistory, handResult]
      game.handNumber++

      game.phase = 'showdown'
      game.players = updatedPlayers
      game.pots = updatedPots
      games.set(roomId, game)
      return { game, message: `${winner.nickname} gana ${totalBetSum}!` }
    }
  }

  const nonFolded = updatedPlayers.filter(p => !p.folded)
  const allAllIn = nonFolded.length >= 2 && nonFolded.every(p => p.allIn)

  let shouldAdvance = false
  if (activePlayers.length === 0) {
    shouldAdvance = true
  } else if (activePlayers.length === 1) {
    const singleActive = activePlayers[0]
    if (singleActive.bet >= game.currentBet) {
      shouldAdvance = true
    } else {
      shouldAdvance = false
    }
  } else {
    shouldAdvance = activePlayers.every(p => p.hasActed && p.bet === game.currentBet)
  }

  if (shouldAdvance) {
    if (allAllIn && game.communityCards.length < 5) {
      const batch = game.communityCards.length === 0 ? 3 : 1
      const communityResult = dealCommunityCards(game.deck, batch)
      const newCommunity = [...game.communityCards, ...communityResult.cards]

      const newPhase = getNextPhase(game.phase, newCommunity.length)
      const isShowdown = newCommunity.length >= 5

      if (isShowdown) {
        const { updatedPlayers: finalPlayers, potWinners } = distributePots(updatedPlayers, updatedPots, newCommunity)

        const handResult: HandResult = {
          handNumber: game.handNumber,
          winners: potWinners,
          foldedPlayers: finalPlayers
            .filter(p => p.folded)
            .map(p => ({ id: p.id, nickname: p.nickname })),
          communityCards: newCommunity,
          finalChips: Object.fromEntries(finalPlayers.map(p => [p.id, p.chips])),
          playerBets: Object.fromEntries(updatedPlayers.map(p => [p.id, p.totalBet])),
        }
        game.handHistory = [...game.handHistory, handResult]
        game.handNumber++

        game.phase = 'showdown'
        game.communityCards = newCommunity
        game.deck = communityResult.remainingDeck
        game.players = finalPlayers
        game.pots = updatedPots
        games.set(roomId, game)

        const mainWinner = potWinners[0]
        const winnerName = mainWinner?.winnerNickname ?? '?'
        const totalWon = mainWinner ? potWinners.filter(w => w.winnerId === mainWinner.winnerId).reduce((sum, w) => sum + w.amountWon, 0) : 0
        return { game, message: `${winnerName} gana ${totalWon}!` }
      }

      updatedPlayers = updatedPlayers.map(p => ({ ...p, bet: 0, hasActed: false }))
      game.communityCards = newCommunity
      game.deck = communityResult.remainingDeck
      game.phase = newPhase
      game.currentBet = 0
      game.lastAggressorIndex = -1
      game.players = updatedPlayers
      game.pots = updatedPots
      games.set(roomId, game)

      return { game, message: '', allInRunout: true }
    }

    const nextPhase = getNextPhase(game.phase, game.communityCards.length)

    if (nextPhase === 'showdown') {
      const communityResult = dealCommunityCards(game.deck, 5 - game.communityCards.length)
      const finalCommunity = [...game.communityCards, ...communityResult.cards]

      const { updatedPlayers: finalPlayers, potWinners } = distributePots(updatedPlayers, updatedPots, finalCommunity)

      const handResult: HandResult = {
        handNumber: game.handNumber,
        winners: potWinners,
        foldedPlayers: finalPlayers
          .filter(p => p.folded)
          .map(p => ({ id: p.id, nickname: p.nickname })),
        communityCards: finalCommunity,
        finalChips: Object.fromEntries(finalPlayers.map(p => [p.id, p.chips])),
        playerBets: Object.fromEntries(updatedPlayers.map(p => [p.id, p.totalBet])),
      }
      game.handHistory = [...game.handHistory, handResult]
      game.handNumber++

      game.phase = 'showdown'
      game.communityCards = finalCommunity
      game.players = finalPlayers
      game.pots = updatedPots
      games.set(roomId, game)

      const mainWinner = potWinners[0]
      const winnerName = mainWinner?.winnerNickname ?? '?'
      const totalWon = mainWinner ? potWinners.filter(w => w.winnerId === mainWinner.winnerId).reduce((sum, w) => sum + w.amountWon, 0) : 0
      return {
        game,
        message: `${winnerName} gana ${totalWon}!`,
      }
    }

    if (nextPhase === 'flop') {
      const { cards, remainingDeck } = dealCommunityCards(game.deck, 3)
      game.communityCards = cards
      game.deck = remainingDeck
    } else {
      const { cards, remainingDeck } = dealCommunityCards(game.deck, 1)
      game.communityCards = [...game.communityCards, ...cards]
      game.deck = remainingDeck
    }

    updatedPlayers = updatedPlayers.map(p => ({ ...p, bet: 0, hasActed: false }))
    game.currentBet = 0
    game.phase = nextPhase
    game.lastAggressorIndex = -1
    game.firstActorIndex = nextPlayerIdx !== -1 ? nextPlayerIdx : playerIndex
  }

  const nextIdx = nextPlayerIdx
  if (nextIdx !== -1) {
    updatedPlayers[nextIdx] = { ...updatedPlayers[nextIdx], isTurn: true, lastAction: undefined }
  }

  game.currentPlayerIndex = nextIdx !== -1 ? nextIdx : playerIndex
  game.players = updatedPlayers
  game.pots = updatedPots

  if (nextIdx !== -1 && game.phase !== 'showdown') {
    startTurnTimer(roomId, updatedPlayers[nextIdx].id)
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

export function advanceAllInRunout(roomId: string): { game: GameState; message: string; showdownReady?: boolean } | null {
  const game = games.get(roomId)
  if (!game || game.phase === 'showdown') return null
  if (game.communityCards.length >= 5) return null

  const batch = game.communityCards.length === 0 ? 3 : 1
  const communityResult = dealCommunityCards(game.deck, batch)
  const newCommunity = [...game.communityCards, ...communityResult.cards]
  const newPhase = getNextPhase(game.phase, newCommunity.length)
  const isShowdown = newCommunity.length >= 5

  const updatedPlayers = game.players.map(p => ({ ...p, bet: 0 }))

  if (isShowdown) {
    game.communityCards = newCommunity
    game.deck = communityResult.remainingDeck
    game.phase = newPhase
    game.currentBet = 0
    game.players = updatedPlayers
    games.set(roomId, game)

    return { game, message: '', showdownReady: true }
  }

  game.communityCards = newCommunity
  game.deck = communityResult.remainingDeck
  game.phase = newPhase
  game.currentBet = 0
  game.players = updatedPlayers
  games.set(roomId, game)

  return { game, message: '' }
}

export function resolveAllInShowdown(roomId: string): { game: GameState; message: string } | null {
  const game = games.get(roomId)
  if (!game || game.phase === 'showdown') return null
  if (game.communityCards.length < 5) return null

  const updatedPots = calculatePots(game.players)
  const { updatedPlayers: finalPlayers, potWinners } = distributePots(game.players, updatedPots, game.communityCards)

  const handResult: HandResult = {
    handNumber: game.handNumber,
    winners: potWinners,
    foldedPlayers: finalPlayers
      .filter(p => p.folded)
      .map(p => ({ id: p.id, nickname: p.nickname })),
    communityCards: [...game.communityCards],
    finalChips: Object.fromEntries(finalPlayers.map(p => [p.id, p.chips])),
    playerBets: Object.fromEntries(game.players.map(p => [p.id, p.totalBet])),
  }
  game.handHistory = [...game.handHistory, handResult]
  game.handNumber++

  game.phase = 'showdown'
  game.players = finalPlayers
  game.pots = updatedPots
  games.set(roomId, game)

  const mainWinner = potWinners[0]
  const winnerName = mainWinner?.winnerNickname ?? '?'
  const totalWon = mainWinner ? potWinners.filter(w => w.winnerId === mainWinner.winnerId).reduce((sum, w) => sum + w.amountWon, 0) : 0
  return { game, message: `${winnerName} gana ${totalWon}!` }
}

export function resetRoom(roomId: string): void {
  const room = rooms.get(roomId)
  if (room) {
    room.started = false
  }
  games.delete(roomId)
  cancelTurnTimer(roomId)
  cancelDisconnectTimer(roomId)
  pausedTurnRemaining.delete(roomId)
  departedPlayers.delete(roomId)
}

export function resetRoomForNewGame(roomId: string): void {
  const room = rooms.get(roomId)
  if (!room) return

  room.started = false
  for (const p of room.players) {
    p.chips = room.minBuyIn
  }

  games.delete(roomId)
  cancelTurnTimer(roomId)
  cancelDisconnectTimer(roomId)
  pausedTurnRemaining.delete(roomId)
  departedPlayers.delete(roomId)
  resetShowdownSkips(roomId)
}

export function hasGameEnded(roomId: string): boolean {
  const game = games.get(roomId)
  if (!game) return true
  const activePlayers = game.players.filter(p => p.chips > 0)
  return activePlayers.length <= 1
}

export function getGameOverData(roomId: string): { players: { id: string; nickname: string; chips: number; departed?: boolean }[]; handHistory: HandResult[]; startingChips: Record<string, number> } | null {
  const game = games.get(roomId)
  if (!game) return null

  const room = rooms.get(roomId)
  const startingChips: Record<string, number> = {}
  if (game.handHistory.length > 0 && room) {
    for (const p of game.players) {
      startingChips[p.id] = room.minBuyIn
    }
    const departed = departedPlayers.get(roomId) ?? []
    for (const p of departed) {
      if (!(p.id in startingChips)) {
        startingChips[p.id] = room.minBuyIn
      }
    }
  }

  const departed = departedPlayers.get(roomId) ?? []
  const allPlayers = [
    ...game.players.map(p => ({ id: p.id, nickname: p.nickname, chips: p.chips, departed: false as const })),
    ...departed.map(p => ({ id: p.id, nickname: p.nickname, chips: p.chips, departed: true as const })),
  ].sort((a, b) => b.chips - a.chips)

  return {
    players: allPlayers,
    handHistory: game.handHistory,
    startingChips,
    hostId: game.hostId,
  }
}

export function endGameByHost(roomId: string, playerId: string): { error: string } | null {
  const room = rooms.get(roomId)
  const game = games.get(roomId)
  if (!room || !game) return { error: 'Partida no encontrada' }

  if (room.players[0]?.id !== playerId) return { error: 'Solo el anfitrión puede terminar la partida' }
  if (!game.canEndHand) return { error: 'No se puede terminar en mitad de una ronda' }

  cancelTurnTimer(roomId)
  pausedTurnRemaining.delete(roomId)

  game.canEndHand = false

  for (let i = 0; i < game.players.length; i++) {
    const p = game.players[i]
    if (p.bet > 0) {
      game.players[i] = { ...p, chips: p.chips + p.bet, bet: 0, totalBet: 0 }
    }
  }
  game.pots = []

  return null
}

export function showdownSkip(roomId: string, playerId: string): { skipped: boolean; allSkipped: boolean; count: number; total: number } {
  const game = games.get(roomId)
  if (!game || game.phase !== 'showdown') return { skipped: false, allSkipped: false, count: 0, total: 0 }

  if (!showdownSkips.has(roomId)) showdownSkips.set(roomId, new Set())
  const skips = showdownSkips.get(roomId)!
  if (skips.has(playerId)) return { skipped: true, allSkipped: false, count: skips.size, total: 0 }

  skips.add(playerId)

  const allPlayers = game.players
  const allSkipped = allPlayers.every(p => skips.has(p.id))

  return { skipped: true, allSkipped, count: skips.size, total: allPlayers.length }
}

export function getShowdownSkips(roomId: string): { count: number; total: number } {
  const game = games.get(roomId)
  if (!game) return { count: 0, total: 0 }
  const skips = showdownSkips.get(roomId)
  const allPlayers = game.players
  return { count: skips?.size ?? 0, total: allPlayers.length }
}

export function resetShowdownSkips(roomId: string): void {
  showdownSkips.delete(roomId)
}

export function nextHand(roomId: string): GameState | null {
  const room = rooms.get(roomId)
  const game = games.get(roomId)
  if (!room || !game) return null

  const alivePlayers = game.players.filter(p => p.chips > 0)
  if (alivePlayers.length < 2) return null

  resetShowdownSkips(roomId)

  const handHistory = [...game.handHistory]
  const handNumber = game.handNumber

  const deck = shuffleDeck(createDeck())
  const players = alivePlayers.map((p, i) => ({
    ...initPlayerState(p, i, false),
    hand: [] as Card[],
  }))

  const eliminatedPlayers = game.players
    .filter(p => p.chips <= 0)
    .map(p => ({
      ...p,
      hand: [] as Card[],
      bet: 0,
      totalBet: 0,
      folded: true,
      allIn: false,
      isDealer: false,
      isTurn: false,
    }))

  const newDealerIndex = (game.dealerIndex + 1) % players.length

  const blinds = room.bigBlind
  const smallBlinds = room.smallBlind

  const sbIndex = players.length > 2 ? (newDealerIndex + 1) % players.length : newDealerIndex
  const bbIndex = players.length > 2 ? (newDealerIndex + 2) % players.length : (newDealerIndex + 1) % players.length

  players[sbIndex] = {
    ...players[sbIndex],
    bet: smallBlinds,
    totalBet: smallBlinds,
    chips: players[sbIndex].chips - smallBlinds,
    allIn: players[sbIndex].chips <= smallBlinds,
    isDealer: newDealerIndex === sbIndex,
  }

  players[bbIndex] = {
    ...players[bbIndex],
    bet: blinds,
    totalBet: blinds,
    chips: players[bbIndex].chips - blinds,
    allIn: players[bbIndex].chips <= blinds,
    isDealer: newDealerIndex === bbIndex,
  }

  if (newDealerIndex !== sbIndex && newDealerIndex !== bbIndex) {
    players[newDealerIndex] = { ...players[newDealerIndex], isDealer: true }
  }

  const { players: dealtPlayers, remainingDeck } = dealHoleCards(players, deck)
  const firstActor = (bbIndex + 1) % players.length

  const allPlayers = [...dealtPlayers, ...eliminatedPlayers]

  const newGame: GameState = {
    roomId,
    players: allPlayers,
    deck: remainingDeck,
    communityCards: [],
    phase: 'preflop',
    pots: [{ amount: smallBlinds + blinds, eligiblePlayerIds: dealtPlayers.map(p => p.id) }],
    currentBet: blinds,
    dealerIndex: newDealerIndex,
    currentPlayerIndex: firstActor,
    smallBlind: smallBlinds,
    bigBlind: blinds,
    minBuyIn: room.minBuyIn,
    maxBuyIn: room.maxBuyIn,
    started: true,
    turnTimer: TURN_DURATION,
    turnStartedAt: Date.now(),
    lastAggressorIndex: -1,
    firstActorIndex: firstActor,
    handNumber,
    handHistory,
    canEndHand: true,
    hostId: game.hostId,
  }

  newGame.players[newGame.currentPlayerIndex] = {
    ...newGame.players[newGame.currentPlayerIndex],
    isTurn: true,
    lastAction: undefined,
  }

  games.set(roomId, newGame)
  startTurnTimer(roomId, newGame.players[newGame.currentPlayerIndex].id)
  return newGame
}

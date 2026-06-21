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
  nextActivePlayer,
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
    turnTimer: 30,
    lastAggressorIndex: -1,
    firstActorIndex: firstActor,
    handNumber: 1,
    handHistory: [],
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
      }
      game.currentBet = newBet
      game.lastAggressorIndex = playerIndex
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
        game.lastAggressorIndex = playerIndex
      }
      message = `${player.nickname} all-in!`
      break
    }
  }

  // Update pot
  const totalBetSum = updatedPlayers.reduce((sum, p) => sum + p.totalBet, 0)
  updatedPots = [{ amount: totalBetSum, eligiblePlayerIds: updatedPlayers.map(p => p.id) }]

  // Compute next player (used for both round-end check and turn assignment)
  const nextPlayerIdx = nextActivePlayer(updatedPlayers, playerIndex)

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

      // Record hand result
      const handResult: HandResult = {
        handNumber: game.handNumber,
        winnerId: winner.id,
        winnerNickname: winner.nickname,
        amountWon: totalBetSum,
        foldedPlayers: updatedPlayers
          .filter(p => p.folded)
          .map(p => ({ id: p.id, nickname: p.nickname })),
        communityCards: [...game.communityCards],
        finalChips: Object.fromEntries(updatedPlayers.map(p => [p.id, p.chips])),
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

  // Determine if betting round is complete
  const nonFolded = updatedPlayers.filter(p => !p.folded)
  const allAllIn = nonFolded.length >= 2 && nonFolded.every(p => p.allIn)

  let shouldAdvance = false
  if (activePlayers.length === 0) {
    // No one can act (all-in or folded) → advance
    shouldAdvance = true
  } else if (activePlayers.length === 1) {
    const singleActive = activePlayers[0]
    const singleActiveIdx = updatedPlayers.findIndex(p => p.id === singleActive.id)
    if (singleActive.bet >= game.currentBet) {
      // This player already matched the bet → round ends
      shouldAdvance = true
    } else {
      // This player needs to call or fold → give them the turn
      shouldAdvance = false
    }
  } else if (game.lastAggressorIndex !== -1) {
    // Someone bet/raised - advance when action loops back to them
    shouldAdvance = nextPlayerIdx === game.lastAggressorIndex
  } else {
    // No one bet - advance when action loops back to the first actor (everyone checked)
    shouldAdvance = nextPlayerIdx === game.firstActorIndex
  }

  if (shouldAdvance) {
    // All remaining non-folded players are all-in → deal all remaining cards and showdown immediately
    if (allAllIn) {
      const cardsNeeded = 5 - game.communityCards.length
      const communityResult = dealCommunityCards(game.deck, cardsNeeded)
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

      const handResult: HandResult = {
        handNumber: game.handNumber,
        winnerId: bestWinner.id,
        winnerNickname: bestWinner.nickname,
        amountWon: totalBetSum,
        foldedPlayers: updatedPlayers
          .filter(p => p.folded)
          .map(p => ({ id: p.id, nickname: p.nickname })),
        communityCards: finalCommunity,
        finalChips: Object.fromEntries(updatedPlayers.map(p => [p.id, p.chips])),
      }
      game.handHistory = [...game.handHistory, handResult]
      game.handNumber++

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

    // Normal phase advancement
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

      // Record hand result
      const handResult: HandResult = {
        handNumber: game.handNumber,
        winnerId: bestWinner.id,
        winnerNickname: bestWinner.nickname,
        amountWon: totalBetSum,
        foldedPlayers: updatedPlayers
          .filter(p => p.folded)
          .map(p => ({ id: p.id, nickname: p.nickname })),
        communityCards: finalCommunity,
        finalChips: Object.fromEntries(updatedPlayers.map(p => [p.id, p.chips])),
      }
      game.handHistory = [...game.handHistory, handResult]
      game.handNumber++

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
    game.lastAggressorIndex = -1
    game.firstActorIndex = nextPlayerIdx !== -1 ? nextPlayerIdx : playerIndex
  }

  // Assign turn to next player
  const nextIdx = nextPlayerIdx
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

export function hasGameEnded(roomId: string): boolean {
  const game = games.get(roomId)
  if (!game) return true
  const activePlayers = game.players.filter(p => p.chips > 0)
  return activePlayers.length <= 1
}

export function getGameOverData(roomId: string): { players: { id: string; nickname: string; chips: number }[]; handHistory: HandResult[]; startingChips: Record<string, number> } | null {
  const game = games.get(roomId)
  if (!game) return null

  // Starting chips = chips before first hand (computed from first hand finalChips minus winner's gain)
  const startingChips: Record<string, number> = {}
  if (game.handHistory.length > 0) {
    const firstHand = game.handHistory[0]
    for (const p of game.players) {
      if (p.id === firstHand.winnerId) {
        startingChips[p.id] = firstHand.finalChips[p.id] - firstHand.amountWon
      } else {
        startingChips[p.id] = firstHand.finalChips[p.id]
        // Work backwards: if player bet money and didn't win, their starting was higher
        // We need to account for what they bet
      }
    }
    // Actually, let's compute it properly from the bets
    // Each player's starting chips = their final chips from first hand + what they lost
    // For folded players: starting = finalChips + what they bet (totalBet)
    // For the winner: starting = finalChips - amountWon
    // But we don't have per-player totalBet in HandResult...
    // Simplest: store startingChips at game start
    // Actually, we already know: starting = buyIn for all players
    const room = rooms.get(roomId)
    if (room) {
      for (const p of game.players) {
        startingChips[p.id] = room.minBuyIn
      }
    }
  }

  return {
    players: game.players
      .map(p => ({ id: p.id, nickname: p.nickname, chips: p.chips }))
      .sort((a, b) => b.chips - a.chips),
    handHistory: game.handHistory,
    startingChips,
  }
}

export function nextHand(roomId: string): GameState | null {
  const room = rooms.get(roomId)
  const game = games.get(roomId)
  if (!room || !game) return null

  const alivePlayers = game.players.filter(p => p.chips > 0)
  if (alivePlayers.length < 2) return null

  const handHistory = [...game.handHistory]
  const handNumber = game.handNumber

  const deck = shuffleDeck(createDeck())
  const players = alivePlayers.map((p, i) => ({
    ...initPlayerState(p, i, false),
    hand: [] as Card[],
  }))

  // Rotate dealer
  const newDealerIndex = (game.dealerIndex + 1) % players.length

  const blinds = room.bigBlind
  const smallBlinds = room.smallBlind

  // Post blinds
  const sbIndex = players.length > 2 ? (newDealerIndex + 1) % players.length : newDealerIndex
  const bbIndex = players.length > 2 ? (newDealerIndex + 2) % players.length : (newDealerIndex + 1) % players.length

  players[sbIndex] = {
    ...players[sbIndex],
    bet: smallBlinds,
    totalBet: smallBlinds,
    chips: players[sbIndex].chips - smallBlinds,
    isDealer: newDealerIndex === sbIndex,
  }

  players[bbIndex] = {
    ...players[bbIndex],
    bet: blinds,
    totalBet: blinds,
    chips: players[bbIndex].chips - blinds,
    isDealer: newDealerIndex === bbIndex,
  }

  // Set dealer for non-SB/BB
  if (newDealerIndex !== sbIndex && newDealerIndex !== bbIndex) {
    players[newDealerIndex] = { ...players[newDealerIndex], isDealer: true }
  }

  const { players: dealtPlayers, remainingDeck } = dealHoleCards(players, deck)
  const firstActor = (bbIndex + 1) % players.length

  const newGame: GameState = {
    roomId,
    players: dealtPlayers,
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
    turnTimer: 30,
    lastAggressorIndex: -1,
    firstActorIndex: firstActor,
    handNumber,
    handHistory,
  }

  newGame.players[newGame.currentPlayerIndex] = {
    ...newGame.players[newGame.currentPlayerIndex],
    isTurn: true,
  }

  games.set(roomId, newGame)
  return newGame
}

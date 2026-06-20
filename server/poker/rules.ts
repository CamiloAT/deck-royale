import type { Card, Player, GamePhase, PlayerAction, Pot } from '../../types/poker'
import { createDeck, shuffleDeck } from './deck'
import { evaluateHand, compareHands } from './hand'

export function initPlayerState(player: Player, index: number, isDealer: boolean): Player {
  return {
    ...player,
    hand: [],
    bet: 0,
    totalBet: 0,
    folded: false,
    allIn: false,
    isDealer,
    isTurn: false,
  }
}

export function dealHoleCards(players: Player[], deck: Card[]): { players: Player[], remainingDeck: Card[] } {
  let currentDeck = [...deck]
  const updatedPlayers = players.map(p => ({
    ...p,
    hand: [currentDeck.pop()!, currentDeck.pop()!],
  }))
  return { players: updatedPlayers, remainingDeck: currentDeck }
}

export function dealCommunityCards(deck: Card[], count: number): { cards: Card[], remainingDeck: Card[] } {
  const currentDeck = [...deck]
  const cards: Card[] = []
  // Burn one
  currentDeck.pop()
  for (let i = 0; i < count; i++) {
    cards.push(currentDeck.pop()!)
  }
  return { cards, remainingDeck: currentDeck }
}

export function getActivePlayers(players: Player[]): Player[] {
  return players.filter(p => !p.folded && p.chips >= 0)
}

export function getPlayersWhoCanAct(players: Player[], currentBet: number): Player[] {
  return players.filter(p => !p.folded && !p.allIn && p.chips > 0)
}

export function getMinRaise(players: Player[], currentBet: number, bigBlind: number): number {
  const activePlayers = getPlayersWhoCanAct(players)
  if (activePlayers.length === 0) return bigBlind

  const maxBet = Math.max(...activePlayers.map(p => p.bet))
  const lastRaise = currentBet - maxBet
  return Math.max(lastRaise, 1)
}

export function getCallAmount(player: Player, currentBet: number): number {
  return Math.min(currentBet - player.bet, player.chips)
}

export function calculatePots(players: Player[]): Pot[] {
  const allPlayers = players
  const totalBets = allPlayers.map(p => ({ id: p.id, totalBet: p.totalBet }))

  const pots: Pot[] = []
  let remaining = [...totalBets]

  while (remaining.some(p => p.totalBet > 0)) {
    const minBet = Math.min(...remaining.filter(p => p.totalBet > 0).map(p => p.totalBet))
    const eligible = remaining.filter(p => p.totalBet >= minBet).map(p => p.id)

    pots.push({
      amount: minBet * eligible.length,
      eligiblePlayerIds: eligible,
    })

    remaining = remaining.map(p => ({
      ...p,
      totalBet: Math.max(0, p.totalBet - minBet),
    }))
  }

  return pots
}

export function distributePots(players: Player[], pots: Pot[]): Player[] {
  const updatedPlayers = [...players]

  for (const pot of pots) {
    const eligiblePlayers = updatedPlayers.filter(p => pot.eligiblePlayerIds.includes(p.id))

    if (eligiblePlayers.length === 0) continue

    const hands = eligiblePlayers.map(p => ({
      player: p,
      result: evaluateHand(p.hand, []),
    }))

    let winners = [hands[0]]
    for (let i = 1; i < hands.length; i++) {
      const cmp = compareHands(hands[i].result, winners[0].result)
      if (cmp > 0) {
        winners = [hands[i]]
      } else if (cmp === 0) {
        winners.push(hands[i])
      }
    }

    const share = Math.floor(pot.amount / winners.length)
    for (const winner of winners) {
      const idx = updatedPlayers.findIndex(p => p.id === winner.player.id)
      updatedPlayers[idx] = {
        ...updatedPlayers[idx],
        chips: updatedPlayers[idx].chips + share,
      }
    }
  }

  return updatedPlayers
}

export function nextActivePlayer(players: Player[], currentIndex: number): number {
  let next = (currentIndex + 1) % players.length
  let count = 0
  while (count < players.length) {
    if (!players[next].folded && !players[next].allIn && players[next].chips > 0) {
      return next
    }
    next = (next + 1) % players.length
    count++
  }
  return -1
}

export function shouldAdvancePhase(players: Player[], currentBet: number): boolean {
  const actives = getPlayersWhoCanAct(players)
  if (actives.length === 0) return true

  const bets = actives.map(p => p.bet)
  return bets.every(b => b === currentBet)
}

export function startNewRound(players: Player[], dealerIndex: number): {
  players: Player[]
  deck: Card[]
  newDealerIndex: number
} {
  let newDealer = (dealerIndex + 1) % players.length
  while (players[newDealer].chips <= 0) {
    newDealer = (newDealer + 1) % players.length
    if (newDealer === dealerIndex) break
  }

  const resetPlayers = players.map((p, i) => ({
    ...p,
    hand: [],
    bet: 0,
    totalBet: 0,
    folded: p.chips <= 0,
    allIn: false,
    isDealer: i === newDealer,
    isTurn: false,
  }))

  return {
    players: resetPlayers,
    deck: shuffleDeck(createDeck()),
    newDealerIndex: newDealer,
  }
}

import type { Card, HandEvaluation, HandRank } from '../../types/poker'
import { rankValue } from './deck'

const HAND_RANK_VALUES: Record<HandRank, number> = {
  royal_flush: 10,
  straight_flush: 9,
  four_of_a_kind: 8,
  full_house: 7,
  flush: 6,
  straight: 5,
  three_of_a_kind: 4,
  two_pair: 3,
  one_pair: 2,
  high_card: 1,
}

const HAND_NAMES: Record<HandRank, string> = {
  royal_flush: 'Escalera Real',
  straight_flush: 'Escalera de Color',
  four_of_a_kind: 'Poker',
  full_house: 'Full House',
  flush: 'Color',
  straight: 'Escalera',
  three_of_a_kind: 'Trío',
  two_pair: 'Doble Pareja',
  one_pair: 'Pareja',
  high_card: 'Carta Alta',
}

function getCombinations(cards: Card[], size: number): Card[][] {
  if (size === 0) return [[]]
  if (cards.length < size) return []

  const result: Card[][] = []
  for (let i = 0; i <= cards.length - size; i++) {
    const rest = getCombinations(cards.slice(i + 1), size - 1)
    for (const combo of rest) {
      result.push([cards[i], ...combo])
    }
  }
  return result
}

function evaluateFiveCards(cards: Card[]): HandEvaluation {
  const sorted = [...cards].sort((a, b) => rankValue(b.rank) - rankValue(a.rank))
  const values = sorted.map(c => rankValue(c.rank))
  const suits = sorted.map(c => c.suit)

  const isFlush = suits.every(s => s === suits[0])

  let isStraight = false
  let straightHigh = 0
  const uniqueValues = [...new Set(values)]

  if (uniqueValues.length >= 5) {
    for (let i = 0; i <= uniqueValues.length - 5; i++) {
      if (uniqueValues[i] - uniqueValues[i + 4] === 4) {
        isStraight = true
        straightHigh = uniqueValues[i]
        break
      }
    }
    // Check A-2-3-4-5 (wheel)
    if (!isStraight && uniqueValues.includes(14) && uniqueValues.includes(2) &&
        uniqueValues.includes(3) && uniqueValues.includes(4) && uniqueValues.includes(5)) {
      isStraight = true
      straightHigh = 5
    }
  }

  const rankCounts: Record<number, number> = {}
  for (const v of values) {
    rankCounts[v] = (rankCounts[v] || 0) + 1
  }

  const counts = Object.entries(rankCounts)
    .map(([rank, count]) => ({ rank: Number(rank), count }))
    .sort((a, b) => b.count - a.count || b.rank - a.rank)

  const groups = counts.map(c => c.count)

  // Royal Flush
  if (isFlush && isStraight && straightHigh === 14) {
    return { rank: 'royal_flush', value: 14, kickers: [], name: HAND_NAMES.royal_flush }
  }

  // Straight Flush
  if (isFlush && isStraight) {
    return { rank: 'straight_flush', value: straightHigh, kickers: [], name: HAND_NAMES.straight_flush }
  }

  // Four of a Kind
  if (groups[0] === 4) {
    const quadRank = counts[0].rank
    return { rank: 'four_of_a_kind', value: quadRank, kickers: [counts[1].rank], name: HAND_NAMES.four_of_a_kind }
  }

  // Full House
  if (groups[0] === 3 && groups[1] === 2) {
    return { rank: 'full_house', value: counts[0].rank, kickers: [counts[1].rank], name: HAND_NAMES.full_house }
  }

  // Flush
  if (isFlush) {
    return { rank: 'flush', value: values[0], kickers: values.slice(1, 5), name: HAND_NAMES.flush }
  }

  // Straight
  if (isStraight) {
    return { rank: 'straight', value: straightHigh, kickers: [], name: HAND_NAMES.straight }
  }

  // Three of a Kind
  if (groups[0] === 3) {
    const tripRank = counts[0].rank
    const kickers = counts.slice(1).map(c => c.rank).sort((a, b) => b - a)
    return { rank: 'three_of_a_kind', value: tripRank, kickers, name: HAND_NAMES.three_of_a_kind }
  }

  // Two Pair
  if (groups[0] === 2 && groups[1] === 2) {
    const pairs = counts.filter(c => c.count === 2).map(c => c.rank).sort((a, b) => b - a)
    const kicker = counts.find(c => c.count === 1)?.rank || 0
    return { rank: 'two_pair', value: pairs[0], kickers: [pairs[1], kicker], name: HAND_NAMES.two_pair }
  }

  // One Pair
  if (groups[0] === 2) {
    const pairRank = counts[0].rank
    const kickers = counts.slice(1).map(c => c.rank).sort((a, b) => b - a)
    return { rank: 'one_pair', value: pairRank, kickers, name: HAND_NAMES.one_pair }
  }

  // High Card
  return { rank: 'high_card', value: values[0], kickers: values.slice(1, 5), name: HAND_NAMES.high_card }
}

export function evaluateHand(holeCards: Card[], communityCards: Card[]): HandEvaluation {
  const allCards = [...holeCards, ...communityCards]
  const combinations = getCombinations(allCards, 5)

  let bestHand: HandEvaluation | null = null

  for (const combo of combinations) {
    const result = evaluateFiveCards(combo)
    if (!bestHand || compareHands(result, bestHand) > 0) {
      bestHand = result
    }
  }

  return bestHand!
}

export function compareHands(a: HandEvaluation, b: HandEvaluation): number {
  const rankDiff = HAND_RANK_VALUES[a.rank] - HAND_RANK_VALUES[b.rank]
  if (rankDiff !== 0) return rankDiff

  if (a.value !== b.value) return a.value - b.value

  for (let i = 0; i < Math.min(a.kickers.length, b.kickers.length); i++) {
    if (a.kickers[i] !== b.kickers[i]) {
      return a.kickers[i] - b.kickers[i]
    }
  }

  return 0
}

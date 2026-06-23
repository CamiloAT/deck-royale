export type Suit = 'hearts' | 'diamonds' | 'clubs' | 'spades'
export type Rank = '2' | '3' | '4' | '5' | '6' | '7' | '8' | '9' | '10' | 'J' | 'Q' | 'K' | 'A'

export interface Card {
  suit: Suit
  rank: Rank
}

export type HandRank =
  | 'royal_flush'
  | 'straight_flush'
  | 'four_of_a_kind'
  | 'full_house'
  | 'flush'
  | 'straight'
  | 'three_of_a_kind'
  | 'two_pair'
  | 'one_pair'
  | 'high_card'

export interface HandEvaluation {
  rank: HandRank
  value: number
  kickers: number[]
  name: string
}

export type PlayerAction = 'fold' | 'check' | 'call' | 'raise' | 'all_in'

export type GamePhase = 'waiting' | 'preflop' | 'flop' | 'turn' | 'river' | 'showdown'

export interface Player {
  id: string
  nickname: string
  chips: number
  hand: Card[]
  bet: number
  totalBet: number
  folded: boolean
  allIn: boolean
  isDealer: boolean
  isTurn: boolean
  isConnected: boolean
  avatarType: 'classic' | 'female' | 'frog'
}

export interface Pot {
  amount: number
  eligiblePlayerIds: string[]
}

export interface GameState {
  roomId: string
  players: Player[]
  deck: Card[]
  communityCards: Card[]
  phase: GamePhase
  pots: Pot[]
  currentBet: number
  dealerIndex: number
  currentPlayerIndex: number
  smallBlind: number
  bigBlind: number
  minBuyIn: number
  maxBuyIn: number
  started: boolean
  turnTimer: number
  turnStartedAt: number
  lastAggressorIndex: number
  firstActorIndex: number
  handNumber: number
  handHistory: HandResult[]
  canEndHand: boolean
  hostId: string
}

export interface Room {
  id: string
  name: string
  players: Player[]
  maxPlayers: number
  smallBlind: number
  bigBlind: number
  minBuyIn: number
  maxBuyIn: number
  started: boolean
  createdAt: number
}

export interface CreateRoomOptions {
  name: string
  smallBlind: number
  bigBlind: number
  minBuyIn: number
  maxBuyIn: number
}

export interface PotWinner {
  potIndex: number
  potAmount: number
  winnerId: string
  winnerNickname: string
  amountWon: number
}

export interface HandResult {
  handNumber: number
  winners: PotWinner[]
  foldedPlayers: { id: string; nickname: string }[]
  communityCards: Card[]
  finalChips: Record<string, number>
  playerBets: Record<string, number>
}

export interface GameOverData {
  players: { id: string; nickname: string; chips: number; departed?: boolean }[]
  handHistory: HandResult[]
  startingChips: Record<string, number>
}

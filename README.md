# Deck Royale

[![Nuxt](https://img.shields.io/badge/Nuxt-4.4.8-00DC82?logo=nuxtdotjs&logoColor=white)](https://nuxt.com/)
[![Vue](https://img.shields.io/badge/Vue-3.5.38-42b883?logo=vue.js&logoColor=white)](https://vuejs.org/)
[![Socket.IO](https://img.shields.io/badge/Socket.IO-4.8.3-010101?logo=socket.io&logoColor=white)](https://socket.io/)
[![TypeScript](https://img.shields.io/badge/TypeScript-5.8-3178C6?logo=typescript&logoColor=white)](https://www.typescriptlang.org/)
[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](https://opensource.org/licenses/MIT)

Real-time multiplayer Texas Hold'em poker game. Create private rooms, compete against friends with virtual COP chips, and enjoy animated avatars, casino chips, and a full poker system with side pots and dramatic all-in reveals.

---

## Main Features

- **Multiplayer Room System** — Create rooms with custom names or join with a code. The host configures blinds, buy-in, and can kick players or end the game. Share a direct link or QR code from mobile.

- **Full Texas Hold'em Poker** — Progressive blinds, side pots for multiple all-ins, showdown with dramatic card reveal, and continuous mode with per-hand statistics until only one player remains.

- **Visual Chip Betting** — Casino chips in 6 denominations (50 to 2,000 COP) with a visual selector, simplified min raise, pure check button, and all-in with flying bills animation.

- **Animated SVG Avatars** — 3 types (Male, Female, Frog) with an articulated skeleton, CSS animations per action (breathe, blink, check-tap, raise-arm, fold-slump, all-in-push), and customization from the waiting room.

- **60-Second Turn Timer** — Countdown bar visible to all players with a color semaphore. When time runs out, the connected player auto-folds. 15-second disconnect grace period with no penalty.

- **Smart Reconnection** — localStorage persistence: reload the page and resume automatically. Reconnects to an active game or waiting room depending on state. Turn timer pauses and resumes on reconnect.

- **Responsive Animated Interface** — Mobile and desktop. Entry animations, inter-hand transitions, victory celebration with confetti, and end-game modal with detailed statistics, hand history, and player debts.

- **Admin Controls Between Hands** — The host can end the game between hands with a flag button, receiving a bet refund. Visual poker hand rankings help modal with illustrated cards.

---

## Pages & Views

| View | Description |
|---|---|
| **Lobby** (`/`) | Main screen to create or join rooms. Blind, buy-in, and room name options. Responsive title with animated logo. |
| **Waiting Room** (`/`) | Player list with SVG avatars, room configuration (host), QR link, native share, and start button. |
| **Game Table** (`/?room=ID`) | Poker table with player seats, community cards, chip-based bet controls, timer, help and end-game modals. |
| **Entry Animation** | Welcome sequence when entering a game with logo and effects. |
| **Round Transition** | Animation between hands showing hand number and community cards. |
| **Victory Screen** | Winner celebration with confetti and total winnings amount. |
| **End Game Modal** | Final standings: positions, hand-by-hand history, pot breakdown, and debts between players. |

---

## Execution and Development Guide

### 1. Clone the repository

```bash
git clone https://github.com/CamiloAT/deck-royale.git
cd deck-royale
```

### 2. Install dependencies

```bash
npm install
```

### 3. Run in development mode

```bash
npm run dev
```

The server starts at `http://localhost:3000`. Open two browser tabs to simulate two players.

> **Note:** Socket.IO requires a persistent Node.js server (not serverless). Development mode handles this automatically.

### 4. Build for production

```bash
npm run build
npm run preview
```

To deploy on Railway, Vercel (with Node.js adapter), or any VPS, run `node .output/server/index.mjs` after building.

> **Note:** In production, set the environment variable `NITRO_PORT=3000` and `HOST=0.0.0.0` if needed.

---

## Project Structure

```text
deck-royale/
│
├── nuxt.config.ts                       ← Nuxt configuration (SSR off, favicon)
├── package.json                         ← Node.js dependencies and scripts
├── tsconfig.json                        ← TypeScript configuration
│
├── public/                              ← Static assets
│   └── images/
│       ├── logo.png                     ← App logo and favicon source
│       └── background.webp              ← Table background texture
│
├── app/                                 ← Nuxt 4 client application
│   ├── app.vue                          ← Root component
│   │
│   ├── assets/css/
│   │   └── main.css                     ← Global styles and CSS variables
│   │
│   ├── components/
│   │   ├── game/                        ← Game table components
│   │   │   ├── PokerTable.vue           ← Main table layout and orchestration
│   │   │   ├── PlayerSeat.vue           ← Player seat with avatar and chips
│   │   │   ├── PlayerAvatar.vue         ← Animated SVG avatar (3 types)
│   │   │   ├── AvatarPicker.vue         ← Avatar selection modal
│   │   │   ├── BetControls.vue          ← Chip selector and bet controls
│   │   │   ├── Card.vue                 ← Poker card visual (52 types)
│   │   │   ├── CommunityCards.vue       ← Community cards with animation
│   │   │   ├── HandCards.vue            ← Player's hidden hand
│   │   │   ├── PokerChip.vue            ← Casino chip visual (6 denominations)
│   │   │   ├── TimerBar.vue             ← Turn countdown bar
│   │   │   ├── PotDisplay.vue           ← Accumulated pot display
│   │   │   ├── EndModal.vue             ← End-game statistics
│   │   │   ├── HelpModal.vue            ← Poker hand rankings
│   │   │   ├── Entry.vue                ← Game entry animation
│   │   │   ├── RoundTransition.vue      ← Inter-hand animation
│   │   │   └── Victory.vue              ← Victory animation
│   │   │
│   │   ├── lobby/                       ← Lobby and waiting room
│   │   │   ├── JoinModal.vue            ← Create/join room
│   │   │   └── WaitingRoom.vue          ← Waiting room with settings
│   │   │
│   │   └── shared/                      ← Reusable components
│   │       └── NumberInput.vue          ← Numeric input with +/- and snapping
│   │
│   ├── composables/                     ← Vue composables
│   │   ├── useGame.ts                   ← Reactive state, localStorage, auto-rejoin
│   │   └── useSocket.ts                 ← Socket.IO client singleton
│   │
│   ├── pages/                           ← Nuxt page routes
│   │   ├── index.vue                    ← Main lobby
│   │   └── game/
│   │       └── [roomId].vue             ← Game page (dynamic route)
│   │
│   └── types/
│       └── poker.ts                     ← TypeScript types (Player, GameState, Room)
│
└── server/                              ← Nuxt server (Nitro)
    ├── api/
    │   └── rooms.get.ts                 ← REST API to list active rooms
    │
    ├── plugins/
    │   └── socket.ts                    ← Socket.IO server: all events
    │
    ├── poker/                           ← Core poker engine
    │   ├── deck.ts                      ← Create and shuffle 52-card deck
    │   ├── hand.ts                      ← Hand evaluation and comparison
    │   └── rules.ts                     ← Poker rules: pots, side pots, actors
    │
    └── rooms/
        └── manager.ts                   ← Room management, turns, timers, disconnect
```

---

## Tech Stack

| Layer | Technology |
|---|---|
| **Framework** | Nuxt 4.4.8 (SPA mode, Nitro server) |
| **Frontend** | Vue 3.5.38, Vue Router 5.1, TypeScript 5.8 |
| **UI** | Lucide Vue (icons), CSS custom (no UI framework), animated SVG avatars |
| **Communication** | Socket.IO 4.8.3 (real-time bidirectional) |
| **Backend** | Node.js via Nitro, server plugins |
| **Game Logic** | Hand evaluation, side pot algorithm, turn management |
| **Storage** | In-memory (rooms/game state), localStorage (client session) |
| **Build** | Vite 7.3, Nitro 2.13 |

---

## Authors

| Name | GitHub |
|---|---|
| **Camilo Andres Arias Tenjo** | [@CamiloAT](https://github.com/CamiloAT) |

*Multiplayer Game Development*

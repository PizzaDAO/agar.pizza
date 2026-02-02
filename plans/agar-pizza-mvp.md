# Agar.Pizza - Implementation Plan

## Overview
Pizza-themed agar.io clone using PartyKit for real-time multiplayer. Players control pizza dough balls that grow into full pizzas by consuming toppings and other players.

---

## Tech Stack
- **Backend**: PartyKit (WebSockets, stateful edge servers, Cloudflare network)
- **Frontend**: Vite + React + TypeScript
- **Rendering**: HTML5 Canvas (MVP), upgrade to PixiJS if needed
- **Deployment**: PartyKit Cloud + Vercel

---

## Core Mechanics

### Pizza Progression
| Mass | Visual | Description |
|------|--------|-------------|
| 10-49 | Raw dough | Simple beige circle, wobbly edge |
| 50-199 | Small pizza | Tomato sauce base, few toppings |
| 200-999 | Large pizza | Full pizza look, more toppings |
| 1000+ | Supreme pizza | Loaded with toppings, glowing edges |

### Toppings (Pellets)
- Pepperoni, mushroom, olive, bell pepper, sausage, pineapple
- Each topping = 1 mass

### Eating Rules
- Must be 10% larger to eat another player
- Target center must be inside your radius
- Larger = slower movement

---

## Project Structure

```
agar.pizza/
├── partykit.json              # PartyKit config
├── package.json
├── tsconfig.json
│
├── party/                     # PartyKit server
│   ├── game.ts               # Main game server
│   ├── types.ts              # Shared types
│   ├── physics.ts            # Physics engine
│   ├── spatial-hash.ts       # Collision optimization
│   └── constants.ts          # Game config
│
├── src/                       # Frontend
│   ├── main.tsx
│   ├── App.tsx
│   │
│   ├── game/
│   │   ├── GameCanvas.tsx    # Canvas component
│   │   ├── Renderer.ts       # Drawing logic
│   │   ├── Input.ts          # Mouse/keyboard
│   │   ├── Camera.ts         # Viewport
│   │   └── Interpolation.ts  # Smooth rendering
│   │
│   ├── hooks/
│   │   ├── useGameSocket.ts  # PartyKit connection
│   │   └── useGameState.ts   # State management
│   │
│   ├── components/
│   │   ├── Lobby.tsx         # Name entry
│   │   ├── HUD.tsx           # Score overlay
│   │   ├── Minimap.tsx
│   │   └── DeathScreen.tsx
│   │
│   └── assets/
│       └── sprites/          # Pizza & topping images
│
└── plans/
    └── agar-pizza-mvp.md
```

---

## Architecture

### Server-Authoritative Model
1. **Server** runs physics at 30 ticks/second
2. **Client** renders at 60fps with interpolation
3. **Client** predicts local movement immediately
4. **Server** broadcasts state deltas every tick
5. **Client** reconciles predictions with server state

### Message Protocol
| Type | Direction | Description |
|------|-----------|-------------|
| `JOIN` | C → S | Player joins with name |
| `INPUT` | C → S | Mouse angle, split, eject |
| `SNAPSHOT` | S → C | Full state on connect |
| `DELTA` | S → C | State changes per tick |
| `DEATH` | S → C | Player was eaten |

---

## Game Constants

```typescript
TICK_RATE = 30           // Server ticks/sec
MAP_SIZE = 5000          // World size pixels
PELLET_COUNT = 500       // Toppings on map
START_MASS = 20          // Initial player mass
MIN_SPLIT_MASS = 100     // Mass to split
MAX_CELLS = 16           // Max cells per player
DECAY_RATE = 0.002       // 0.2% mass loss/sec
```

---

## MVP Features (Phase 1)

- [x] Basic movement and eating
- [x] Pellets (toppings) spawning
- [x] Player eating player
- [x] Visual progression (4 stages)
- [x] Leaderboard
- [x] Name entry
- [x] Basic HUD (score, mass)
- [x] Single game room
- [x] Canvas rendering
- [x] Desktop controls

## Phase 2 (Later)

- [ ] Splitting mechanic (Space)
- [ ] Mass ejection (W)
- [ ] Mass decay
- [ ] Cell merging
- [ ] Minimap
- [ ] Multiple rooms
- [ ] Mobile touch
- [ ] Sound effects

## Phase 3 (Future)

- [ ] Viruses (pizza cutters?)
- [ ] Teams mode
- [ ] Battle Royale
- [ ] PixiJS upgrade
- [ ] NFT pizza skins

---

## Implementation Order

### Week 1: Foundation
1. Project setup (Vite + PartyKit)
2. Basic PartyKit server with connection handling
3. Client WebSocket hook

### Week 2: Core Game
4. Canvas + camera system
5. Player movement (mouse → server → broadcast)
6. Pellet system (spawn, render, eat)

### Week 3: Gameplay
7. Player vs player eating
8. Pizza stage visuals
9. HUD and leaderboard

### Week 4: Polish & Deploy
10. Interpolation and smoothing
11. UI polish (lobby, death screen)
12. Deploy to PartyKit + Vercel

---

## Deployment

```bash
# PartyKit
npx partykit deploy
# → agar-pizza.{user}.partykit.dev

# Frontend (Vercel)
# VITE_PARTYKIT_HOST=agar-pizza.{user}.partykit.dev
npm run build
```

Domain: `agar.pizza` → Vercel

---

## Key Files to Create

1. `party/game.ts` - Main PartyKit server with game loop
2. `party/physics.ts` - Movement, collision, eating
3. `party/types.ts` - Shared TypeScript types
4. `src/game/Renderer.ts` - Canvas drawing
5. `src/hooks/useGameSocket.ts` - PartyKit connection hook

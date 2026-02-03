# Agar.pizza Handoff

## Project Overview
Agar.io-style multiplayer game with pizza theme, built for PizzaDAO.

**Live URL**: https://agarpizza.vercel.app
**GitHub**: https://github.com/PizzaDAO/agar.pizza
**Task Sheet**: https://docs.google.com/spreadsheets/d/1LZaKcHLCpmXDtf3ypT1FpoYvw4f04Afq69YfNX3ecUs/edit

## Tech Stack
- **Frontend**: Vite + React + TypeScript
- **Multiplayer**: PartyKit (WebSocket-based real-time server)
- **Wallet**: RainbowKit + wagmi + viem
- **NFT Data**: Alchemy API
- **Deployment**: Vercel

## What Was Done This Session

### 1. Fixed Laggy Movement
- Replaced delta-time lerp calculation with fixed `LERP_FACTOR = 0.12` (agar.io style)
- Removed `lastFrameTimeRef` and `SMOOTHING_BASE` complexity
- Camera smoothing set to 0.12 to match
- **Files**: `src/game/GameCanvas.tsx`, `src/game/Camera.ts`

### 2. Added Stress Test
- Playwright test that runs 4 players for 10 minutes
- Takes screenshots every minute for verification
- **File**: `tests/movement-stress.spec.ts`

### 3. Moved Repo to PizzaDAO
- Repo transferred from `snackman/agar.pizza` to `PizzaDAO/agar.pizza`

### 4. Created Task Sheet
- New Google Sheet with proper headers: Priority | Task | Type | Stage | Lead ID | Lead | Last Touch | Due Date | Notes | TaskID
- Configured `.sheets-claude.json` for sheets-claude MCP integration

### 5. Added Footer Links
- Google Sheets icon (links to task sheet)
- GitHub icon (links to repo)
- Fixed position bottom-right corner
- Uses inline styles (project doesn't have Tailwind)
- **File**: `src/App.tsx`

### 6. Pizza Image for Blobs
- Default blob image: margherita pizza photo
- Player color shows as accent ring around pizza
- **File**: `src/game/Renderer.ts`

### 7. WalletConnect Integration (PR #1 - Draft)
- **Branch**: `feature/garlic-75112-walletconnect`
- **Task ID**: garlic-75112

**Features**:
- RainbowKit wallet connection (multi-chain: Ethereum, Base, Polygon, Optimism, Zora)
- NFT picker modal showing PizzaDAO NFTs from connected wallet
- Fetches NFTs via Alchemy API
- Selected NFT replaces default pizza as player's blob image
- localStorage persistence for returning players
- Golden border on NFT blobs vs brown on default

**New Files**:
- `src/lib/wagmi-config.ts` - RainbowKit/wagmi configuration
- `src/lib/nft-types.ts` - TypeScript types for NFTs
- `src/lib/nft-fetch.ts` - Alchemy API integration
- `src/providers.tsx` - React providers wrapper
- `src/components/NFTPicker.tsx` - NFT selection modal
- `.env.example` - Environment variables template

**Modified Files**:
- `src/main.tsx` - Wrapped App with Providers
- `src/App.tsx` - Added NFT picker state and integration
- `src/components/Lobby.tsx` - Added pizza preview button
- `src/game/GameCanvas.tsx` - Pass NFT image to Renderer
- `src/game/Renderer.ts` - Render player's NFT image as blob
- `src/index.css` - RainbowKit style overrides

## Environment Variables
```
VITE_WALLETCONNECT_PROJECT_ID=<from cloud.walletconnect.com>
VITE_ALCHEMY_API_KEY=<from alchemy.com>
```

Currently using same keys as onboarding project (see `.env`).

## Open PR
- **PR #1**: WalletConnect for Rare Pizza NFT blobs
- Status: Draft
- Preview: https://agar-pizza-git-feature-garlic-75112-walletconnect-pizza-dao.vercel.app

## Running Locally
```bash
# Terminal 1: PartyKit server
npm run dev:party

# Terminal 2: Vite frontend
npm run dev
```

Open http://localhost:5173 (or next available port)

## Deployment
```bash
vercel --prod
```

PartyKit is deployed separately via `npm run deploy:party`.

## Known Issues / TODOs
1. WalletConnect PR needs testing and merge
2. NFT picker could show loading states better
3. Consider caching NFT images locally
4. May want to add more NFT collections beyond Rare Pizzas

## OAuth Setup (for Google Sheets scripts)
OAuth credentials were set up in `google-apps-scripts` folder:
- `oauth-credentials.json` - OAuth client credentials (gitignored)
- `oauth-token.json` - Saved token (gitignored)
- Run `node oauth-setup.js` to re-authenticate if needed

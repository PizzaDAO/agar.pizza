# Comprehensive Plan: Fix All Jitter

## Root Cause Analysis

After analyzing the codebase, I've identified **5 sources of jitter**:

### 1. React Re-renders Recreate Game Loop (CRITICAL)
**File:** `GameCanvas.tsx:216`
```typescript
}, [players, pellets, viruses, playerId, onInput]);
```
- Every server update (30Hz) triggers `setGameData()` in useGameSocket
- This changes the `players` prop, which recreates the `gameLoop` callback
- The useEffect then cancels and restarts the animation frame
- **Result:** 30 times per second, the render loop stutters

### 2. Double Smoothing (Camera + Player Lerp)
**Files:** `GameCanvas.tsx` and `Camera.ts`
- Player positions are lerped with `LERP_FACTOR = 0.16`
- Camera then lerps with `smoothing = 0.12`
- Two smoothing systems fighting each other = subtle jitter

### 3. Fixed LERP_FACTOR Ignores Frame Time
**File:** `GameCanvas.tsx:131`
```typescript
displayCell.x = lerp(displayCell.x, serverCell.x, LERP_FACTOR);
```
- If a frame takes longer, lerp moves the same amount
- If a frame is short, lerp still moves the same amount
- **Result:** Inconsistent motion on variable frame rates

### 4. LERP_FACTOR Too High
- Current: 0.16 (converges in ~15 frames / 250ms)
- Agar.io uses: 0.08-0.1 (converges in ~30 frames / 500ms)
- Higher = snappier but shows network variance as jitter

### 5. Server Position Stored in React State
**File:** `useGameSocket.ts`
- Server positions go: WebSocket → React State → Props → Render
- Every state update triggers React reconciliation overhead
- Should go: WebSocket → Ref → Render (bypass React)

---

## Fix Plan

### Step 1: Decouple Game Loop from React State

**Problem:** `gameLoop` is recreated every time `players` changes (30Hz)

**Solution:** Use refs to store server state, remove dependencies from gameLoop

```typescript
// In GameCanvas.tsx
const serverPlayersRef = useRef<Map<string, SerializedPlayer>>(new Map());

// Update ref when props change (doesn't recreate gameLoop)
useEffect(() => {
  serverPlayersRef.current = players;
}, [players]);

// gameLoop now has NO dependencies on players
const gameLoop = useCallback(() => {
  const serverPlayers = serverPlayersRef.current;
  // ... rest of loop
}, []); // Empty deps = never recreated
```

### Step 2: Delta-Time Adjusted Lerping

**Problem:** Fixed lerp factor doesn't account for variable frame times

**Solution:** Use exponential decay with delta time

```typescript
// Store last frame time
const lastFrameTimeRef = useRef<number>(performance.now());

// In game loop:
const now = performance.now();
const deltaTime = (now - lastFrameTimeRef.current) / 1000; // seconds
lastFrameTimeRef.current = now;

// Delta-adjusted lerp (smooth regardless of frame rate)
// At 60fps, dt=0.0167, at 30fps, dt=0.033
const lerpFactor = 1 - Math.pow(0.0001, deltaTime); // ~0.12 at 60fps
displayCell.x = lerp(displayCell.x, serverCell.x, lerpFactor);
```

### Step 3: Remove Double Smoothing

**Problem:** Player lerp + Camera lerp = mushy/jittery feel

**Solution:** Only smooth the camera, not individual positions OR vice versa

**Option A: Smooth camera only (recommended for agar.io feel)**
- Set player lerp very high (0.5+) so positions snap to server
- Camera smoothing handles all the smoothness
- Camera follows the "real" position smoothly

**Option B: Smooth positions only**
- Remove camera smoothing (`smoothing = 1.0`)
- Keep player lerp as the only smoothing
- Camera follows lerped positions directly

### Step 4: Lower Lerp Factor

**Current:** 0.16
**Recommended:** 0.08-0.10

Lower = smoother but slightly more latency (acceptable tradeoff)

### Step 5: Bypass React for Server Updates (Optional but Best)

**Problem:** React state updates add overhead

**Solution:** Store server positions directly in a ref, updated from WebSocket

```typescript
// In useGameSocket.ts
const serverStateRef = useRef<GameData>(...);

// In message handler:
case MessageType.UPDATE: {
  // Update ref directly (no React re-render)
  const players = new Map<string, SerializedPlayer>();
  for (const player of update.players) {
    players.set(player.id, player);
  }
  serverStateRef.current.players = players;

  // Only trigger re-render occasionally for HUD updates
  if (needsHudUpdate) {
    setGameData(prev => ({ ...prev, leaderboard: update.leaderboard }));
  }
  break;
}
```

---

## Implementation Order

1. **Step 1** - Decouple game loop (biggest impact, fixes 30Hz stutter)
2. **Step 3** - Remove double smoothing (fixes mushy feel)
3. **Step 4** - Lower lerp factor (smoother motion)
4. **Step 2** - Delta-time lerping (consistent across frame rates)
5. **Step 5** - Bypass React (optimization, do if still needed)

---

## Files to Modify

| File | Changes |
|------|---------|
| `src/game/GameCanvas.tsx` | Steps 1, 2, 3, 4 |
| `src/game/Camera.ts` | Step 3 (adjust smoothing) |
| `src/hooks/useGameSocket.ts` | Step 5 (optional) |

---

## Expected Results

- No more 30Hz stutter from React re-renders
- Smooth 60fps motion regardless of server tick rate
- Consistent feel across different devices/frame rates
- Matches agar.io's buttery smooth movement

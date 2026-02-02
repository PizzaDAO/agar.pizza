# Fix Laggy Movement

## Problem
After the jitter fixes, movement feels laggy/delayed.

## Root Cause Analysis

The delta-time lerp formula is likely too aggressive:
```typescript
const lerpFactor = 1 - Math.pow(0.00001, deltaTime);
// At 60fps: lerpFactor ≈ 0.17 (reasonable)
// But the exponential formula may behave unexpectedly
```

Also, creating new Maps/arrays every frame adds overhead.

## What Agar.io Actually Does

Looking at agar.io's client code, they use a **simple fixed lerp**, not delta-time adjusted:

```javascript
// Agar.io uses approximately:
cell.x += (target.x - cell.x) * 0.1;
cell.y += (target.y - cell.y) * 0.1;
```

The key insight: **agar.io assumes 60fps and uses a fixed factor**. If frames drop, movement stutters slightly but doesn't feel "laggy".

## The Fix

### 1. Use Simple Fixed Lerp Factor
```typescript
const LERP_FACTOR = 0.12; // Sweet spot: responsive but smooth

displayCell.x = lerp(displayCell.x, serverCell.x, LERP_FACTOR);
```

### 2. Keep Cell ID Matching (Good Fix)
The Map<cellId, DisplayCell> approach is correct for split/merge.

### 3. Reduce Object Creation
Instead of creating new renderPlayers Map every frame, reuse objects.

### 4. Simplify - Remove Unnecessary Complexity
- Remove delta-time calculation
- Remove SMOOTHING_BASE constant
- Use straightforward lerp

## Implementation

### File: `src/game/GameCanvas.tsx`

```typescript
// Constants
const LERP_FACTOR = 0.12; // Fixed lerp - agar.io style

// Remove these:
// - lastFrameTimeRef
// - SMOOTHING_BASE
// - Delta time calculation
// - Complex lerp formula

// In game loop, simply:
displayCell.x = lerp(displayCell.x, serverCell.x, LERP_FACTOR);
displayCell.y = lerp(displayCell.y, serverCell.y, LERP_FACTOR);
displayCell.radius = lerp(displayCell.radius, serverCell.radius, LERP_FACTOR);
```

### File: `src/game/Camera.ts`

```typescript
// Keep camera smoothing moderate
private smoothing: number = 0.12;
```

## Summary of Changes

1. Replace `SMOOTHING_BASE` + delta-time formula with simple `LERP_FACTOR = 0.12`
2. Remove `lastFrameTimeRef` and delta time calculation
3. Keep cell ID matching (Map-based cells)
4. Keep refs for decoupling from React (that was correct)
5. Camera smoothing back to 0.12

## Expected Result
- Responsive movement (not laggy)
- Smooth rendering (no jitter)
- Proper split/merge handling

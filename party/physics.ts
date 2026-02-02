import { Player, Cell, Pellet, Virus } from './types';
import {
  PELLET_MASS,
  EAT_RATIO,
  MAP_WIDTH,
  MAP_HEIGHT,
  MIN_MASS,
  MASS_DECAY_RATE,
  VELOCITY_DECAY,
  MIN_VELOCITY,
  MERGE_TIME_BASE,
  MERGE_TIME_MASS_FACTOR
} from './constants';

// Convert mass to radius (agar.io formula: 4 + 6√mass)
export function massToRadius(mass: number): number {
  return 4 + Math.sqrt(mass) * 6;
}

// Calculate speed based on mass (agar.io: speed ∝ mass^-0.439)
// Base speed ~150 at mass 10, scales down with mass
export function calculateSpeed(mass: number): number {
  return 150 * Math.pow(mass, -0.439) * Math.pow(10, 0.439);
}

// Calculate merge time based on mass (agar.io: 30s + 2.33% of mass)
export function calculateMergeTime(mass: number): number {
  return MERGE_TIME_BASE + mass * MERGE_TIME_MASS_FACTOR * 1000;
}

// Move player toward target angle
export function movePlayer(player: Player, deltaTime: number): void {
  if (player.isDead) return;

  for (const cell of player.cells) {
    const speed = calculateSpeed(cell.mass);
    const distance = speed * deltaTime;

    // Apply velocity (from split or other forces)
    if (Math.abs(cell.vx) > MIN_VELOCITY || Math.abs(cell.vy) > MIN_VELOCITY) {
      cell.x += cell.vx * deltaTime;
      cell.y += cell.vy * deltaTime;
      // Decay velocity
      cell.vx *= VELOCITY_DECAY;
      cell.vy *= VELOCITY_DECAY;
      // Stop if too slow
      if (Math.abs(cell.vx) < MIN_VELOCITY) cell.vx = 0;
      if (Math.abs(cell.vy) < MIN_VELOCITY) cell.vy = 0;
    }

    // Move toward target angle
    cell.x += Math.cos(player.targetAngle) * distance;
    cell.y += Math.sin(player.targetAngle) * distance;

    // Clamp to map bounds (5% margin from borders, same as pepperoni)
    const margin = 0.05;
    const minX = MAP_WIDTH * margin;
    const maxX = MAP_WIDTH * (1 - margin);
    const minY = MAP_HEIGHT * margin;
    const maxY = MAP_HEIGHT * (1 - margin);
    cell.x = Math.max(minX, Math.min(maxX, cell.x));
    cell.y = Math.max(minY, Math.min(maxY, cell.y));

    // Update radius based on current mass
    cell.radius = massToRadius(cell.mass);
  }

  // Push apart cells that are too close (same player)
  pushApartCells(player);
}

// Handle cell interactions - push apart if can't merge, attract if can merge
function pushApartCells(player: Player): void {
  const now = Date.now();

  for (let i = 0; i < player.cells.length; i++) {
    for (let j = i + 1; j < player.cells.length; j++) {
      const a = player.cells[i];
      const b = player.cells[j];

      const dx = b.x - a.x;
      const dy = b.y - a.y;
      const dist = Math.sqrt(dx * dx + dy * dy);
      const minDist = a.radius + b.radius;

      // Check if both cells can merge
      const canMerge = now >= a.mergeTime && now >= b.mergeTime;

      if (canMerge) {
        // Attract cells toward each other when they can merge
        if (dist > 0 && dist < minDist * 1.5) {
          const attractForce = 0.03;
          const attractX = (dx / dist) * attractForce * minDist;
          const attractY = (dy / dist) * attractForce * minDist;

          a.x += attractX;
          a.y += attractY;
          b.x -= attractX;
          b.y -= attractY;
        }
      } else {
        // Push apart cells that can't merge yet
        if (dist < minDist && dist > 0) {
          const overlap = minDist - dist;
          const pushX = (dx / dist) * overlap * 0.5;
          const pushY = (dy / dist) * overlap * 0.5;

          a.x -= pushX;
          a.y -= pushY;
          b.x += pushX;
          b.y += pushY;
        }
      }
    }
  }
}

// Merge cells of the same player that can merge
export function mergeCells(player: Player): void {
  if (player.cells.length <= 1) return;

  const now = Date.now();
  const toRemove: number[] = [];

  for (let i = 0; i < player.cells.length; i++) {
    if (toRemove.includes(i)) continue;

    for (let j = i + 1; j < player.cells.length; j++) {
      if (toRemove.includes(j)) continue;

      const a = player.cells[i];
      const b = player.cells[j];

      // Check if both can merge (enough time has passed)
      if (now < a.mergeTime || now < b.mergeTime) continue;

      const dx = b.x - a.x;
      const dy = b.y - a.y;
      const dist = Math.sqrt(dx * dx + dy * dy);
      const combinedRadius = a.radius + b.radius;

      // Merge when cells are touching (like agar.io)
      if (dist < combinedRadius * 0.9) {
        // Merge into larger cell, position weighted by mass
        if (a.mass >= b.mass) {
          const totalMass = a.mass + b.mass;
          // Move toward the center weighted by mass
          a.x = (a.x * a.mass + b.x * b.mass) / totalMass;
          a.y = (a.y * a.mass + b.y * b.mass) / totalMass;
          a.mass = totalMass;
          a.radius = massToRadius(a.mass);
          toRemove.push(j);
        } else {
          const totalMass = a.mass + b.mass;
          b.x = (a.x * a.mass + b.x * b.mass) / totalMass;
          b.y = (a.y * a.mass + b.y * b.mass) / totalMass;
          b.mass = totalMass;
          b.radius = massToRadius(b.mass);
          toRemove.push(i);
          break; // Cell i is gone, move on
        }
      }
    }
  }

  // Remove merged cells (in reverse order to preserve indices)
  for (const idx of toRemove.sort((a, b) => b - a)) {
    player.cells.splice(idx, 1);
  }
}

// Check if cell hits a virus
export function checkVirusCollision(cell: Cell, virus: Virus): boolean {
  const dx = virus.x - cell.x;
  const dy = virus.y - cell.y;
  const dist = Math.sqrt(dx * dx + dy * dy);
  return dist < cell.radius + virus.radius * 0.5;
}

// Apply mass decay
export function applyMassDecay(player: Player): void {
  if (player.isDead) return;

  for (const cell of player.cells) {
    if (cell.mass > MIN_MASS) {
      cell.mass *= (1 - MASS_DECAY_RATE);
      cell.mass = Math.max(MIN_MASS, cell.mass);
      cell.radius = massToRadius(cell.mass);
    }
  }

  // Update player score
  player.score = player.cells.reduce((sum, cell) => sum + Math.floor(cell.mass), 0);
}

// Check collision between two circles
export function checkCollision(
  x1: number,
  y1: number,
  r1: number,
  x2: number,
  y2: number,
  r2: number
): boolean {
  const dx = x2 - x1;
  const dy = y2 - y1;
  const distance = Math.sqrt(dx * dx + dy * dy);
  return distance < r1 + r2;
}

// Check if entity1 can eat entity2 (must overlap center)
export function canEat(
  x1: number,
  y1: number,
  r1: number,
  mass1: number,
  x2: number,
  y2: number,
  r2: number,
  mass2: number
): boolean {
  // Must be significantly larger
  if (mass1 < mass2 * EAT_RATIO) return false;

  // Center of smaller must be inside larger
  const dx = x2 - x1;
  const dy = y2 - y1;
  const distance = Math.sqrt(dx * dx + dy * dy);

  return distance < r1 - r2 * 0.4; // 40% overlap required
}

// Check if player cell can eat a pellet
export function canEatPellet(cell: Cell, pellet: Pellet): boolean {
  const dx = pellet.x - cell.x;
  const dy = pellet.y - cell.y;
  const distance = Math.sqrt(dx * dx + dy * dy);
  return distance < cell.radius;
}

// Eat a pellet and gain mass
export function eatPellet(cell: Cell, _pellet: Pellet): void {
  cell.mass += PELLET_MASS;
  cell.radius = massToRadius(cell.mass);
}

// Eat another player's cell
export function eatCell(eater: Cell, eaten: Cell): void {
  eater.mass += eaten.mass;
  eater.radius = massToRadius(eater.mass);
}

// Get the total mass of a player
export function getPlayerMass(player: Player): number {
  return player.cells.reduce((sum, cell) => sum + cell.mass, 0);
}

// Get the center position of a player (weighted by cell mass)
export function getPlayerCenter(player: Player): { x: number; y: number } {
  if (player.cells.length === 0) {
    return { x: MAP_WIDTH / 2, y: MAP_HEIGHT / 2 };
  }

  let totalMass = 0;
  let x = 0;
  let y = 0;

  for (const cell of player.cells) {
    x += cell.x * cell.mass;
    y += cell.y * cell.mass;
    totalMass += cell.mass;
  }

  return {
    x: x / totalMass,
    y: y / totalMass
  };
}

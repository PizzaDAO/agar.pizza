import { Player, Cell, Pellet } from './types';
import {
  MAX_SPEED,
  MIN_SPEED,
  START_MASS,
  PELLET_MASS,
  EAT_RATIO,
  MAP_WIDTH,
  MAP_HEIGHT,
  MIN_MASS,
  MASS_DECAY_RATE
} from './constants';

// Convert mass to radius using sqrt for area-based scaling
export function massToRadius(mass: number): number {
  return Math.sqrt(mass) * 4;
}

// Calculate speed based on mass (larger = slower)
export function calculateSpeed(mass: number): number {
  // Logarithmic scaling for smoother speed curve
  const speedFactor = 1 - Math.log(mass / START_MASS + 1) / Math.log(100);
  return MIN_SPEED + (MAX_SPEED - MIN_SPEED) * Math.max(0.1, speedFactor);
}

// Move player toward target angle
export function movePlayer(player: Player, deltaTime: number): void {
  if (player.isDead) return;

  for (const cell of player.cells) {
    const speed = calculateSpeed(cell.mass);
    const distance = speed * deltaTime;

    // Move toward target angle
    cell.x += Math.cos(player.targetAngle) * distance;
    cell.y += Math.sin(player.targetAngle) * distance;

    // Clamp to map bounds
    const radius = cell.radius;
    cell.x = Math.max(radius, Math.min(MAP_WIDTH - radius, cell.x));
    cell.y = Math.max(radius, Math.min(MAP_HEIGHT - radius, cell.y));

    // Update radius based on current mass
    cell.radius = massToRadius(cell.mass);
  }
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

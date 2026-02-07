// Game configuration constants - matching agar.io parameters
// VARIATION: GLASS CANNON - Start big, decay fast, high stakes gameplay

// Server tick rate (updates per second)
export const TICK_RATE = 30;
export const TICK_INTERVAL = 1000 / TICK_RATE;

// Map dimensions
export const MAP_WIDTH = 6000;
export const MAP_HEIGHT = 6000;

// Pellet settings - GLASS CANNON VARIATION
export const PELLET_COUNT = 600; // CHANGED: more pellets (was 500)
export const PELLET_MASS = 20; // CHANGED: worth more (was 10)
export const PELLET_RADIUS = 20;

// Player settings - GLASS CANNON VARIATION
export const START_MASS = 75; // CHANGED: start big! (was 13)
export const MIN_MASS = 15; // CHANGED: higher floor (was 9)
export const MAX_MASS = 22500;
export const MASS_DECAY_RATE = (0.002 * 4) / TICK_RATE; // CHANGED: 4x faster decay!

// Eating rules
export const EAT_RATIO = 1.2; // CHANGED: easier to eat (was 1.25)

// Split settings
export const MIN_SPLIT_MASS = 40; // CHANGED: slightly higher (was 35)
export const MAX_CELLS = 16;
export const SPLIT_SPEED = 500;
export const MERGE_TIME_BASE = 25000; // CHANGED: faster merge (was 30000)
export const MERGE_TIME_MASS_FACTOR = 0.0233;

// Eject settings
export const EJECT_MASS = 15; // CHANGED: bigger ejects (was 13)
export const EJECT_MASS_LOSS = 20; // CHANGED: costs more (was 18)
export const MIN_EJECT_MASS = 40;
export const EJECT_SPEED = 1200;

// Virus (pizza cutter) settings
export const VIRUS_COUNT = 25; // CHANGED: fewer hazards (was 30)
export const VIRUS_RADIUS = 60;
export const VIRUS_MASS = 100;
export const VIRUS_MIN_SPLIT_PIECES = 8;
export const VIRUS_MAX_SPLIT_PIECES = 8;

// Velocity decay
export const VELOCITY_DECAY = 0.92;
export const MIN_VELOCITY = 5;

// Respawn settings
export const RESPAWN_DELAY = 2000; // CHANGED: faster respawn (was 3000)

// Spatial hash cell size (for collision optimization)
export const CELL_SIZE = 200;

// Topping colors
export const TOPPING_COLORS: Record<string, string> = {
  pepperoni: '#D32F2F',
  mushroom: '#D7CCC8',
  olive: '#212121',
  pepper: '#4CAF50',
  sausage: '#795548',
  pineapple: '#FFC107',
};

export const TOPPING_TYPES = Object.keys(TOPPING_COLORS);

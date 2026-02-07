// Game configuration constants - matching agar.io parameters
// VARIATION: TINY ARENA - Small map forces constant combat

// Server tick rate (updates per second)
export const TICK_RATE = 30;
export const TICK_INTERVAL = 1000 / TICK_RATE;

// Map dimensions - TINY ARENA VARIATION
export const MAP_WIDTH = 3000; // CHANGED: half size (was 6000)
export const MAP_HEIGHT = 3000; // CHANGED: half size (was 6000)

// Pellet settings
export const PELLET_COUNT = 300; // CHANGED: less pellets, more fighting (was 500)
export const PELLET_MASS = 10;
export const PELLET_RADIUS = 16;

// Player settings
export const START_MASS = Math.round(PELLET_MASS * 1.25);
export const MIN_MASS = 9;
export const MAX_MASS = 15000; // CHANGED: lower cap for small map (was 22500)
export const MASS_DECAY_RATE = 0.002 / TICK_RATE;

// Eating rules
export const EAT_RATIO = 1.25;

// Split settings - TINY ARENA VARIATION
export const MIN_SPLIT_MASS = 35;
export const MAX_CELLS = 12; // CHANGED: fewer cells, easier to track (was 16)
export const SPLIT_SPEED = 400; // CHANGED: shorter splits for small map (was 500)
export const MERGE_TIME_BASE = 20000; // CHANGED: faster merge for action (was 30000)
export const MERGE_TIME_MASS_FACTOR = 0.0233;

// Eject settings
export const EJECT_MASS = 13;
export const EJECT_MASS_LOSS = 18;
export const MIN_EJECT_MASS = 35;
export const EJECT_SPEED = 800; // CHANGED: shorter eject (was 1200)

// Virus (pizza cutter) settings - TINY ARENA VARIATION
export const VIRUS_COUNT = 20; // CHANGED: fewer for small map (was 30)
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
export const CELL_SIZE = 150; // CHANGED: smaller for small map (was 200)

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

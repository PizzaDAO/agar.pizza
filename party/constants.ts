// Game configuration constants - matching agar.io parameters
// VARIATION: FEAST - Double pellets, double mass, everyone grows huge fast

// Server tick rate (updates per second)
export const TICK_RATE = 30;
export const TICK_INTERVAL = 1000 / TICK_RATE;

// Map dimensions
export const MAP_WIDTH = 6000;
export const MAP_HEIGHT = 6000;

// Pellet settings - FEAST VARIATION
export const PELLET_COUNT = 1000; // CHANGED: 2x pellets! (was 500)
export const PELLET_MASS = 20; // CHANGED: 2x mass! (was 10)
export const PELLET_RADIUS = 20;

// Player settings
export const START_MASS = 25; // CHANGED: start bigger (was 13)
export const MIN_MASS = 9;
export const MAX_MASS = 30000; // CHANGED: higher cap (was 22500)
export const MASS_DECAY_RATE = 0.002 / TICK_RATE;

// Eating rules
export const EAT_RATIO = 1.25;

// Split settings
export const MIN_SPLIT_MASS = 35;
export const MAX_CELLS = 16;
export const SPLIT_SPEED = 500;
export const MERGE_TIME_BASE = 30000;
export const MERGE_TIME_MASS_FACTOR = 0.0233;

// Eject settings
export const EJECT_MASS = 13;
export const EJECT_MASS_LOSS = 18;
export const MIN_EJECT_MASS = 35;
export const EJECT_SPEED = 1200;

// Virus (pizza cutter) settings
export const VIRUS_COUNT = 30;
export const VIRUS_RADIUS = 60;
export const VIRUS_MASS = 100;
export const VIRUS_MIN_SPLIT_PIECES = 8;
export const VIRUS_MAX_SPLIT_PIECES = 8;

// Velocity decay
export const VELOCITY_DECAY = 0.92;
export const MIN_VELOCITY = 5;

// Respawn settings
export const RESPAWN_DELAY = 3000;

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

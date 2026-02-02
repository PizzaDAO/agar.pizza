// Game configuration constants

// Server tick rate (updates per second)
export const TICK_RATE = 30;
export const TICK_INTERVAL = 1000 / TICK_RATE;

// Map dimensions
export const MAP_WIDTH = 5000;
export const MAP_HEIGHT = 5000;

// Player settings
export const START_MASS = 20;
export const MIN_MASS = 10;
export const MAX_SPEED = 300; // pixels per second at minimum mass
export const MIN_SPEED = 100; // pixels per second at maximum mass
export const MASS_DECAY_RATE = 0.001; // mass lost per tick as percentage

// Pellet settings
export const PELLET_COUNT = 2000;
export const PELLET_MASS = 5;
export const PELLET_RADIUS = 16;

// Eating rules
export const EAT_RATIO = 1.1; // Must be 10% larger to eat another player

// Respawn settings
export const RESPAWN_DELAY = 3000; // 3 seconds

// Spatial hash cell size (for collision optimization)
export const CELL_SIZE = 200;

// Topping colors
export const TOPPING_COLORS: Record<string, string> = {
  pepperoni: '#D32F2F',  // red
  mushroom: '#D7CCC8',   // tan
  olive: '#212121',      // black
  pepper: '#4CAF50',     // green
  sausage: '#795548',    // brown
  pineapple: '#FFC107',  // yellow
};

export const TOPPING_TYPES = Object.keys(TOPPING_COLORS);

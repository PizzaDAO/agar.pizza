// Game configuration constants - matching agar.io parameters
// VARIATION: SPEED DEMON - Everything moves 50% faster

// Server tick rate (updates per second)
export const TICK_RATE = 30;
export const TICK_INTERVAL = 1000 / TICK_RATE;

// Map dimensions (agar.io: 6000x6000)
export const MAP_WIDTH = 6000;
export const MAP_HEIGHT = 6000;

// Pellet settings (defined first since START_MASS depends on it)
export const PELLET_COUNT = 500;
export const PELLET_MASS = 10; // larger pepperoni for visibility
export const PELLET_RADIUS = 16;

// Player settings
export const START_MASS = Math.round(PELLET_MASS * 1.25); // 25% larger than pepperoni (13)
export const MIN_MASS = 9; // agar.io: 9
export const MAX_MASS = 22500; // agar.io: auto-split above this
export const MASS_DECAY_RATE = 0.002 / TICK_RATE; // agar.io: 0.2% per second

// Eating rules (agar.io: 25% larger to eat)
export const EAT_RATIO = 1.25;

// Split settings - SPEED DEMON VARIATION
export const MIN_SPLIT_MASS = 35; // agar.io: 35
export const MAX_CELLS = 16; // agar.io: 16
export const SPLIT_SPEED = 750; // CHANGED: 50% faster (was 500)
export const MERGE_TIME_BASE = 30000; // agar.io: 30 seconds base
export const MERGE_TIME_MASS_FACTOR = 0.0233; // agar.io: +2.33% of mass in ms

// Eject settings - SPEED DEMON VARIATION
export const EJECT_MASS = 13; // Mass of ejected pellet
export const EJECT_MASS_LOSS = 18; // Mass lost when ejecting
export const MIN_EJECT_MASS = 35; // Minimum mass to eject
export const EJECT_SPEED = 1800; // CHANGED: 50% faster (was 1200)

// Virus (pizza cutter) settings
export const VIRUS_COUNT = 30; // agar.io: 10-50
export const VIRUS_RADIUS = 60; // Size of virus
export const VIRUS_MASS = 100; // agar.io: 100
export const VIRUS_MIN_SPLIT_PIECES = 8; // Fixed at 8 pieces for pizza slicers
export const VIRUS_MAX_SPLIT_PIECES = 8; // Cap at 8 pieces (was 16)

// Velocity decay
export const VELOCITY_DECAY = 0.94; // CHANGED: less friction for faster feel (was 0.92)
export const MIN_VELOCITY = 5; // Minimum velocity before stopping

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

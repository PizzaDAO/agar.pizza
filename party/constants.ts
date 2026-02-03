// Game configuration constants - matching agar.io parameters
// VARIATION: HARDCORE MODE - For skilled players who want a challenge

// Server tick rate (updates per second)
export const TICK_RATE = 30;
export const TICK_INTERVAL = 1000 / TICK_RATE;

// Map dimensions (agar.io: 6000x6000)
export const MAP_WIDTH = 6000;
export const MAP_HEIGHT = 6000;

// Pellet settings - HARDCORE VARIATION
export const PELLET_COUNT = 350; // CHANGED: less food (was 500)
export const PELLET_MASS = 10; // larger pepperoni for visibility
export const PELLET_RADIUS = 16;

// Player settings - HARDCORE VARIATION
export const START_MASS = Math.round(PELLET_MASS * 1.25); // 25% larger than pepperoni (13)
export const MIN_MASS = 9; // agar.io: 9
export const MAX_MASS = 22500; // agar.io: auto-split above this
export const MASS_DECAY_RATE = (0.002 * 2) / TICK_RATE; // CHANGED: 2x faster decay

// Eating rules - HARDCORE VARIATION
export const EAT_RATIO = 1.1; // CHANGED: easier to get eaten (was 1.25)

// Split settings - HARDCORE VARIATION
export const MIN_SPLIT_MASS = 35; // agar.io: 35
export const MAX_CELLS = 16; // agar.io: 16
export const SPLIT_SPEED = 500; // Initial velocity when splitting
export const MERGE_TIME_BASE = 45000; // CHANGED: 45 seconds (was 30)
export const MERGE_TIME_MASS_FACTOR = 0.0233; // agar.io: +2.33% of mass in ms

// Eject settings (agar.io: lose 18, pellet is 13-14)
export const EJECT_MASS = 13; // Mass of ejected pellet
export const EJECT_MASS_LOSS = 18; // Mass lost when ejecting
export const MIN_EJECT_MASS = 35; // Minimum mass to eject
export const EJECT_SPEED = 1200; // Speed of ejected mass (increased for more distance)

// Virus (pizza cutter) settings
export const VIRUS_COUNT = 30; // agar.io: 10-50
export const VIRUS_RADIUS = 60; // Size of virus
export const VIRUS_MASS = 100; // agar.io: 100
export const VIRUS_MIN_SPLIT_PIECES = 8; // Fixed at 8 pieces for pizza slicers
export const VIRUS_MAX_SPLIT_PIECES = 8; // Cap at 8 pieces (was 16)

// Velocity decay
export const VELOCITY_DECAY = 0.92; // Velocity multiplier per tick (friction)
export const MIN_VELOCITY = 5; // Minimum velocity before stopping

// Respawn settings - HARDCORE VARIATION
export const RESPAWN_DELAY = 5000; // CHANGED: 5 seconds (was 3)

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

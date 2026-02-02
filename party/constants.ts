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

// Split settings
export const MIN_SPLIT_MASS = 35; // Minimum mass to split
export const MAX_CELLS = 16; // Maximum cells per player
export const SPLIT_SPEED = 500; // Initial velocity when splitting
export const MERGE_TIME = 15000; // Time in ms before cells can merge

// Eject settings
export const EJECT_MASS = 15; // Mass of ejected pellet
export const MIN_EJECT_MASS = 35; // Minimum mass to eject
export const EJECT_SPEED = 600; // Speed of ejected mass

// Virus (pizza cutter) settings
export const VIRUS_COUNT = 30; // Number of viruses on map
export const VIRUS_RADIUS = 60; // Size of virus (20% larger)
export const VIRUS_MASS = 100; // Mass gained when eating a virus
export const VIRUS_SPLIT_MASS = 150; // Minimum mass to be split by virus
export const VIRUS_SPLIT_COUNT = 8; // Number of pieces when split by virus

// Velocity decay
export const VELOCITY_DECAY = 0.92; // Velocity multiplier per tick (friction)
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

// Shared TypeScript types

export type ToppingType = 'pepperoni' | 'mushroom' | 'olive' | 'pepper' | 'sausage' | 'pineapple';

export interface Position {
  x: number;
  y: number;
}

export interface Pellet {
  id: string;
  x: number;
  y: number;
  topping: ToppingType;
}

export interface Cell {
  id: string;
  x: number;
  y: number;
  mass: number;
  radius: number;
  vx: number;  // velocity x
  vy: number;  // velocity y
  mergeTime: number;  // timestamp when cell can merge
}

export interface Virus {
  id: string;
  x: number;
  y: number;
  radius: number;
}

export interface Player {
  id: string;
  name: string;
  cells: Cell[];
  color: string;
  score: number;
  targetAngle: number;
  isDead: boolean;
  lastUpdate: number;
}

export interface GameState {
  players: Map<string, Player>;
  pellets: Map<string, Pellet>;
  leaderboard: LeaderboardEntry[];
}

export interface LeaderboardEntry {
  id: string;
  name: string;
  score: number;
}

// Message types for client-server communication
export enum MessageType {
  // Client -> Server
  JOIN = 'JOIN',
  INPUT = 'INPUT',
  LEAVE = 'LEAVE',

  // Server -> Client
  SNAPSHOT = 'SNAPSHOT',
  UPDATE = 'UPDATE',
  PLAYER_JOINED = 'PLAYER_JOINED',
  PLAYER_LEFT = 'PLAYER_LEFT',
  PLAYER_DIED = 'PLAYER_DIED',
  PELLET_EATEN = 'PELLET_EATEN',
  PELLETS_SPAWNED = 'PELLETS_SPAWNED',
  VIRUS_SPAWNED = 'VIRUS_SPAWNED',
}

// Client -> Server messages
export interface JoinMessage {
  type: MessageType.JOIN;
  name: string;
}

export interface InputMessage {
  type: MessageType.INPUT;
  angle: number;
  split?: boolean;
  eject?: boolean;
  timestamp: number;
}

export interface LeaveMessage {
  type: MessageType.LEAVE;
}

// Server -> Client messages
export interface SnapshotMessage {
  type: MessageType.SNAPSHOT;
  playerId: string;
  players: SerializedPlayer[];
  pellets: Pellet[];
  viruses: Virus[];
  leaderboard: LeaderboardEntry[];
}

export interface UpdateMessage {
  type: MessageType.UPDATE;
  players: SerializedPlayer[];
  leaderboard: LeaderboardEntry[];
  timestamp: number;
}

export interface PlayerJoinedMessage {
  type: MessageType.PLAYER_JOINED;
  player: SerializedPlayer;
}

export interface PlayerLeftMessage {
  type: MessageType.PLAYER_LEFT;
  playerId: string;
}

export interface PlayerDiedMessage {
  type: MessageType.PLAYER_DIED;
  playerId: string;
  killerId: string;
  killerName: string;
}

export interface PelletEatenMessage {
  type: MessageType.PELLET_EATEN;
  pelletId: string;
}

export interface PelletsSpawnedMessage {
  type: MessageType.PELLETS_SPAWNED;
  pellets: Pellet[];
}

export interface VirusSpawnedMessage {
  type: MessageType.VIRUS_SPAWNED;
  virus: Virus;
}

// Serialized player for network transmission
export interface SerializedPlayer {
  id: string;
  name: string;
  cells: Cell[];
  color: string;
  score: number;
  isDead: boolean;
}

export type ClientMessage = JoinMessage | InputMessage | LeaveMessage;
export type ServerMessage =
  | SnapshotMessage
  | UpdateMessage
  | PlayerJoinedMessage
  | PlayerLeftMessage
  | PlayerDiedMessage
  | PelletEatenMessage
  | PelletsSpawnedMessage
  | VirusSpawnedMessage;

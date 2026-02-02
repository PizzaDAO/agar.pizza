import type * as Party from "partykit/server";
import {
  Player,
  Pellet,
  ToppingType,
  MessageType,
  ClientMessage,
  SerializedPlayer,
  LeaderboardEntry,
  Cell,
  Virus
} from './types';
import {
  TICK_INTERVAL,
  MAP_WIDTH,
  MAP_HEIGHT,
  PELLET_COUNT,
  START_MASS,
  TOPPING_TYPES,
  TOPPING_COLORS,
  PELLET_RADIUS,
  MIN_SPLIT_MASS,
  MAX_CELLS,
  SPLIT_SPEED,
  EJECT_MASS,
  MIN_EJECT_MASS,
  EJECT_SPEED,
  VIRUS_COUNT,
  VIRUS_RADIUS,
  VIRUS_SPLIT_COUNT,
  MERGE_TIME
} from './constants';
import { SpatialHash } from './spatial-hash';
import {
  massToRadius,
  movePlayer,
  applyMassDecay,
  canEatPellet,
  eatPellet,
  canEat,
  eatCell,
  getPlayerMass,
  mergeCells,
  checkVirusCollision
} from './physics';

interface GameState {
  players: Map<string, Player>;
  pellets: Map<string, Pellet>;
  pelletSpatialHash: SpatialHash<Pellet>;
  viruses: Map<string, Virus>;
}

export default class GameServer implements Party.Server {
  private state: GameState;
  private _tickInterval: ReturnType<typeof setInterval> | null = null;
  private lastTickTime: number = 0;
  private pelletIdCounter: number = 0;
  private virusIdCounter: number = 0;

  constructor(readonly room: Party.Room) {
    this.state = {
      players: new Map(),
      pellets: new Map(),
      pelletSpatialHash: new SpatialHash(),
      viruses: new Map()
    };
  }

  onStart(): void {
    console.log(`Game room ${this.room.id} started`);

    // Spawn initial pellets
    this.spawnPellets(PELLET_COUNT);

    // Spawn viruses
    this.spawnViruses(VIRUS_COUNT);

    // Start game tick loop
    this.lastTickTime = Date.now();
    this._tickInterval = setInterval(() => this.tick(), TICK_INTERVAL);
  }

  onConnect(conn: Party.Connection): void {
    console.log(`Player ${conn.id} connected`);
  }

  onMessage(message: string, sender: Party.Connection): void {
    try {
      const data = JSON.parse(message) as ClientMessage;

      switch (data.type) {
        case MessageType.JOIN:
          this.handleJoin(sender, data.name);
          break;
        case MessageType.INPUT:
          this.handleInput(sender, data.angle, data.split, data.eject);
          break;
        case MessageType.LEAVE:
          this.handleLeave(sender);
          break;
      }
    } catch (e) {
      console.error('Error parsing message:', e);
    }
  }

  onClose(conn: Party.Connection): void {
    console.log(`Player ${conn.id} disconnected`);
    this.handleLeave(conn);
  }

  private handleJoin(conn: Party.Connection, name: string): void {
    // Create new player
    const startX = Math.random() * (MAP_WIDTH - 200) + 100;
    const startY = Math.random() * (MAP_HEIGHT - 200) + 100;
    const radius = massToRadius(START_MASS);

    // Pick a random color from topping colors
    const colorKeys = Object.keys(TOPPING_COLORS);
    const color = TOPPING_COLORS[colorKeys[Math.floor(Math.random() * colorKeys.length)]];

    const player: Player = {
      id: conn.id,
      name: name.slice(0, 20) || 'Pizza',
      cells: [{
        id: `${conn.id}-0`,
        x: startX,
        y: startY,
        mass: START_MASS,
        radius: radius,
        vx: 0,
        vy: 0,
        mergeTime: 0
      }],
      color,
      score: START_MASS,
      targetAngle: 0,
      isDead: false,
      lastUpdate: Date.now()
    };

    this.state.players.set(conn.id, player);

    // Send snapshot to joining player
    conn.send(JSON.stringify({
      type: MessageType.SNAPSHOT,
      playerId: conn.id,
      players: this.serializePlayers(),
      pellets: Array.from(this.state.pellets.values()),
      viruses: Array.from(this.state.viruses.values()),
      leaderboard: this.getLeaderboard()
    }));

    // Notify other players
    this.broadcast(JSON.stringify({
      type: MessageType.PLAYER_JOINED,
      player: this.serializePlayer(player)
    }), [conn.id]);
  }

  private handleInput(conn: Party.Connection, angle: number, split?: boolean, eject?: boolean): void {
    const player = this.state.players.get(conn.id);
    if (player && !player.isDead) {
      player.targetAngle = angle;
      player.lastUpdate = Date.now();

      if (split) {
        this.handleSplit(player);
      }
      if (eject) {
        this.handleEject(player);
      }
    }
  }

  private handleSplit(player: Player): void {
    // Split all cells that are large enough
    const cellsToSplit = player.cells.filter(
      cell => cell.mass >= MIN_SPLIT_MASS && player.cells.length < MAX_CELLS
    );

    const now = Date.now();

    for (const cell of cellsToSplit) {
      if (player.cells.length >= MAX_CELLS) break;

      // Split cell in half
      const newMass = cell.mass / 2;
      cell.mass = newMass;
      cell.radius = massToRadius(cell.mass);
      cell.mergeTime = now + MERGE_TIME; // Original cell can't merge until later

      // Create new cell with velocity in target direction
      const newCell: Cell = {
        id: `${player.id}-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
        x: cell.x,
        y: cell.y,
        mass: newMass,
        radius: massToRadius(newMass),
        vx: Math.cos(player.targetAngle) * SPLIT_SPEED,
        vy: Math.sin(player.targetAngle) * SPLIT_SPEED,
        mergeTime: now + MERGE_TIME
      };

      player.cells.push(newCell);
    }

    player.score = getPlayerMass(player);
  }

  private handleEject(player: Player): void {
    // Eject mass from all cells that are large enough
    for (const cell of player.cells) {
      if (cell.mass < MIN_EJECT_MASS) continue;

      // Reduce cell mass
      cell.mass -= EJECT_MASS;
      cell.radius = massToRadius(cell.mass);

      // Create ejected pellet moving in target direction
      const ejectDistance = cell.radius + PELLET_RADIUS + 5;
      const pellet: Pellet = {
        id: `ejected-${this.pelletIdCounter++}`,
        x: cell.x + Math.cos(player.targetAngle) * ejectDistance,
        y: cell.y + Math.sin(player.targetAngle) * ejectDistance,
        topping: TOPPING_TYPES[Math.floor(Math.random() * TOPPING_TYPES.length)] as ToppingType
      };

      // Clamp to map bounds
      pellet.x = Math.max(PELLET_RADIUS, Math.min(MAP_WIDTH - PELLET_RADIUS, pellet.x));
      pellet.y = Math.max(PELLET_RADIUS, Math.min(MAP_HEIGHT - PELLET_RADIUS, pellet.y));

      this.state.pellets.set(pellet.id, pellet);
      this.state.pelletSpatialHash.insert(pellet);

      // Broadcast new pellet
      this.broadcast(JSON.stringify({
        type: MessageType.PELLETS_SPAWNED,
        pellets: [pellet]
      }));
    }

    player.score = getPlayerMass(player);
  }

  private handleLeave(conn: Party.Connection): void {
    const player = this.state.players.get(conn.id);
    if (player) {
      this.state.players.delete(conn.id);

      this.broadcast(JSON.stringify({
        type: MessageType.PLAYER_LEFT,
        playerId: conn.id
      }));
    }
  }

  private tick(): void {
    const now = Date.now();
    const deltaTime = (now - this.lastTickTime) / 1000; // Convert to seconds
    this.lastTickTime = now;

    // Update all players
    for (const player of this.state.players.values()) {
      if (!player.isDead) {
        movePlayer(player, deltaTime);
        applyMassDecay(player);
        mergeCells(player); // Merge cells that can merge
        this.checkPelletCollisions(player);
        this.checkVirusCollisions(player); // Check virus collisions
      }
    }

    // Check player vs player collisions
    this.checkPlayerCollisions();

    // Respawn pellets if needed
    const pelletDeficit = PELLET_COUNT - this.state.pellets.size;
    if (pelletDeficit > 0) {
      const newPellets = this.spawnPellets(Math.min(pelletDeficit, 10)); // Spawn up to 10 per tick
      if (newPellets.length > 0) {
        this.broadcast(JSON.stringify({
          type: MessageType.PELLETS_SPAWNED,
          pellets: newPellets
        }));
      }
    }

    // Broadcast game state update
    this.broadcast(JSON.stringify({
      type: MessageType.UPDATE,
      players: this.serializePlayers(),
      leaderboard: this.getLeaderboard(),
      timestamp: now
    }));
  }

  private checkPelletCollisions(player: Player): void {
    const eatenPelletIds: string[] = [];

    for (const cell of player.cells) {
      // Query nearby pellets using spatial hash
      const nearbyPellets = this.state.pelletSpatialHash.query(
        cell.x,
        cell.y,
        cell.radius + PELLET_RADIUS
      );

      for (const pellet of nearbyPellets) {
        if (canEatPellet(cell, pellet)) {
          eatPellet(cell, pellet);
          eatenPelletIds.push(pellet.id);

          // Remove from spatial hash and pellets map
          this.state.pelletSpatialHash.remove(pellet);
          this.state.pellets.delete(pellet.id);
        }
      }
    }

    // Update player score
    player.score = getPlayerMass(player);

    // Broadcast eaten pellets
    for (const pelletId of eatenPelletIds) {
      this.broadcast(JSON.stringify({
        type: MessageType.PELLET_EATEN,
        pelletId
      }));
    }
  }

  private checkPlayerCollisions(): void {
    const players = Array.from(this.state.players.values()).filter(p => !p.isDead);

    for (let i = 0; i < players.length; i++) {
      const player1 = players[i];

      for (let j = i + 1; j < players.length; j++) {
        const player2 = players[j];

        // Check each cell pair
        for (const cell1 of player1.cells) {
          for (const cell2 of player2.cells) {
            // Check if cell1 can eat cell2
            if (canEat(cell1.x, cell1.y, cell1.radius, cell1.mass,
                       cell2.x, cell2.y, cell2.radius, cell2.mass)) {
              this.eatPlayerCell(player1, cell1, player2, cell2);
            }
            // Check if cell2 can eat cell1
            else if (canEat(cell2.x, cell2.y, cell2.radius, cell2.mass,
                           cell1.x, cell1.y, cell1.radius, cell1.mass)) {
              this.eatPlayerCell(player2, cell2, player1, cell1);
            }
          }
        }
      }
    }
  }

  private eatPlayerCell(eater: Player, eaterCell: Cell, victim: Player, victimCell: Cell): void {
    // Transfer mass
    eatCell(eaterCell, victimCell);
    eater.score = getPlayerMass(eater);

    // Remove the eaten cell
    const cellIndex = victim.cells.indexOf(victimCell);
    if (cellIndex > -1) {
      victim.cells.splice(cellIndex, 1);
    }

    // Check if victim is dead (no more cells)
    if (victim.cells.length === 0) {
      victim.isDead = true;

      // Broadcast death
      this.broadcast(JSON.stringify({
        type: MessageType.PLAYER_DIED,
        playerId: victim.id,
        killerId: eater.id,
        killerName: eater.name
      }));
    }
  }

  private spawnPellets(count: number): Pellet[] {
    const newPellets: Pellet[] = [];
    // Keep pellets 5% away from borders
    const margin = 0.05;
    const minX = MAP_WIDTH * margin;
    const maxX = MAP_WIDTH * (1 - margin);
    const minY = MAP_HEIGHT * margin;
    const maxY = MAP_HEIGHT * (1 - margin);

    for (let i = 0; i < count; i++) {
      const pellet: Pellet = {
        id: `pellet-${this.pelletIdCounter++}`,
        x: minX + Math.random() * (maxX - minX),
        y: minY + Math.random() * (maxY - minY),
        topping: TOPPING_TYPES[Math.floor(Math.random() * TOPPING_TYPES.length)] as ToppingType
      };

      this.state.pellets.set(pellet.id, pellet);
      this.state.pelletSpatialHash.insert(pellet);
      newPellets.push(pellet);
    }

    return newPellets;
  }

  private spawnViruses(count: number): void {
    const margin = 0.1; // 10% margin from borders
    const minX = MAP_WIDTH * margin;
    const maxX = MAP_WIDTH * (1 - margin);
    const minY = MAP_HEIGHT * margin;
    const maxY = MAP_HEIGHT * (1 - margin);

    for (let i = 0; i < count; i++) {
      const virus: Virus = {
        id: `virus-${this.virusIdCounter++}`,
        x: minX + Math.random() * (maxX - minX),
        y: minY + Math.random() * (maxY - minY),
        radius: VIRUS_RADIUS
      };
      this.state.viruses.set(virus.id, virus);
    }
  }

  private checkVirusCollisions(player: Player): void {
    const now = Date.now();
    const cellsToAdd: Cell[] = [];
    const cellsToRemove: number[] = [];

    for (let i = 0; i < player.cells.length; i++) {
      const cell = player.cells[i];

      // Only cells bigger than the pizza cutter's radius get sliced
      if (cell.radius <= VIRUS_RADIUS) continue;

      for (const virus of this.state.viruses.values()) {
        if (checkVirusCollision(cell, virus)) {
          // Split this cell into many pieces
          const numPieces = Math.min(VIRUS_SPLIT_COUNT, MAX_CELLS - player.cells.length + 1);
          if (numPieces <= 1) continue;

          // Divide the cell's mass among the pieces (no mass from virus)
          const piecesMass = cell.mass / numPieces;
          const pieceRadius = massToRadius(piecesMass);

          // Mark original cell for removal
          cellsToRemove.push(i);

          // Create new cells exploding outward
          for (let j = 0; j < numPieces; j++) {
            const angle = (j / numPieces) * Math.PI * 2;
            const newCell: Cell = {
              id: `${player.id}-${now}-${j}-${Math.random().toString(36).substr(2, 5)}`,
              x: cell.x,
              y: cell.y,
              mass: piecesMass,
              radius: pieceRadius,
              vx: Math.cos(angle) * SPLIT_SPEED * 0.8,
              vy: Math.sin(angle) * SPLIT_SPEED * 0.8,
              mergeTime: now + MERGE_TIME
            };
            cellsToAdd.push(newCell);
          }

          break; // Only hit one virus per cell per tick
        }
      }
    }

    // Remove split cells (reverse order)
    for (const idx of cellsToRemove.sort((a, b) => b - a)) {
      player.cells.splice(idx, 1);
    }

    // Add new cells
    for (const cell of cellsToAdd) {
      if (player.cells.length < MAX_CELLS) {
        player.cells.push(cell);
      }
    }

    player.score = getPlayerMass(player);
  }

  private getLeaderboard(): LeaderboardEntry[] {
    return Array.from(this.state.players.values())
      .filter(p => !p.isDead)
      .map(p => ({
        id: p.id,
        name: p.name,
        score: Math.floor(p.score)
      }))
      .sort((a, b) => b.score - a.score)
      .slice(0, 10);
  }

  private serializePlayers(): SerializedPlayer[] {
    return Array.from(this.state.players.values()).map(p => this.serializePlayer(p));
  }

  private serializePlayer(player: Player): SerializedPlayer {
    return {
      id: player.id,
      name: player.name,
      cells: player.cells,
      color: player.color,
      score: Math.floor(player.score),
      isDead: player.isDead
    };
  }

  private broadcast(message: string, exclude: string[] = []): void {
    for (const conn of this.room.getConnections()) {
      if (!exclude.includes(conn.id)) {
        conn.send(message);
      }
    }
  }
}

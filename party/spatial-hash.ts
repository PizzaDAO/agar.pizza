import { CELL_SIZE } from './constants';

interface SpatialEntity {
  id: string;
  x: number;
  y: number;
  radius?: number;
}

export class SpatialHash<T extends SpatialEntity> {
  private cells: Map<string, Set<T>> = new Map();
  private entityCells: Map<string, Set<string>> = new Map();
  private cellSize: number;

  constructor(cellSize: number = CELL_SIZE) {
    this.cellSize = cellSize;
  }

  private _getCellKey(x: number, y: number): string {
    const cellX = Math.floor(x / this.cellSize);
    const cellY = Math.floor(y / this.cellSize);
    return `${cellX},${cellY}`;
  }

  private getCellsForEntity(entity: T): string[] {
    const radius = entity.radius || 0;
    const minX = entity.x - radius;
    const maxX = entity.x + radius;
    const minY = entity.y - radius;
    const maxY = entity.y + radius;

    const cells: string[] = [];
    const startCellX = Math.floor(minX / this.cellSize);
    const endCellX = Math.floor(maxX / this.cellSize);
    const startCellY = Math.floor(minY / this.cellSize);
    const endCellY = Math.floor(maxY / this.cellSize);

    for (let cx = startCellX; cx <= endCellX; cx++) {
      for (let cy = startCellY; cy <= endCellY; cy++) {
        cells.push(`${cx},${cy}`);
      }
    }

    return cells;
  }

  insert(entity: T): void {
    const cellKeys = this.getCellsForEntity(entity);

    // Store which cells this entity belongs to
    this.entityCells.set(entity.id, new Set(cellKeys));

    // Add entity to each cell
    for (const key of cellKeys) {
      if (!this.cells.has(key)) {
        this.cells.set(key, new Set());
      }
      this.cells.get(key)!.add(entity);
    }
  }

  remove(entity: T): void {
    const cellKeys = this.entityCells.get(entity.id);
    if (!cellKeys) return;

    for (const key of cellKeys) {
      const cell = this.cells.get(key);
      if (cell) {
        cell.delete(entity);
        if (cell.size === 0) {
          this.cells.delete(key);
        }
      }
    }
    this.entityCells.delete(entity.id);
  }

  update(entity: T): void {
    this.remove(entity);
    this.insert(entity);
  }

  query(x: number, y: number, radius: number): T[] {
    const results: Set<T> = new Set();

    const startCellX = Math.floor((x - radius) / this.cellSize);
    const endCellX = Math.floor((x + radius) / this.cellSize);
    const startCellY = Math.floor((y - radius) / this.cellSize);
    const endCellY = Math.floor((y + radius) / this.cellSize);

    for (let cx = startCellX; cx <= endCellX; cx++) {
      for (let cy = startCellY; cy <= endCellY; cy++) {
        const key = `${cx},${cy}`;
        const cell = this.cells.get(key);
        if (cell) {
          for (const entity of cell) {
            results.add(entity);
          }
        }
      }
    }

    return Array.from(results);
  }

  clear(): void {
    this.cells.clear();
    this.entityCells.clear();
  }
}

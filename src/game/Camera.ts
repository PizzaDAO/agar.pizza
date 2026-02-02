import { MAP_WIDTH, MAP_HEIGHT } from '../../party/constants';

export class Camera {
  x: number = MAP_WIDTH / 2;
  y: number = MAP_HEIGHT / 2;
  zoom: number = 1;
  targetX: number = MAP_WIDTH / 2;
  targetY: number = MAP_HEIGHT / 2;
  targetZoom: number = 1;

  private screenWidth: number = 0;
  private screenHeight: number = 0;
  private smoothing: number = 0.12;

  setScreenSize(width: number, height: number): void {
    this.screenWidth = width;
    this.screenHeight = height;
  }

  setTarget(x: number, y: number, mass: number): void {
    this.targetX = x;
    this.targetY = y;

    // Zoom out as player gets larger
    const baseZoom = Math.min(this.screenWidth, this.screenHeight) / 1000;
    this.targetZoom = baseZoom / (1 + Math.log(mass / 20 + 1) * 0.3);
    this.targetZoom = Math.max(0.3, Math.min(2, this.targetZoom));
  }

  update(): void {
    // Smooth interpolation toward target
    this.x += (this.targetX - this.x) * this.smoothing;
    this.y += (this.targetY - this.y) * this.smoothing;
    this.zoom += (this.targetZoom - this.zoom) * this.smoothing;
  }

  // Convert world coordinates to screen coordinates
  worldToScreen(worldX: number, worldY: number): { x: number; y: number } {
    const x = (worldX - this.x) * this.zoom + this.screenWidth / 2;
    const y = (worldY - this.y) * this.zoom + this.screenHeight / 2;
    return { x, y };
  }

  // Convert screen coordinates to world coordinates
  screenToWorld(screenX: number, screenY: number): { x: number; y: number } {
    const x = (screenX - this.screenWidth / 2) / this.zoom + this.x;
    const y = (screenY - this.screenHeight / 2) / this.zoom + this.y;
    return { x, y };
  }

  // Get the visible world bounds
  getVisibleBounds(): { minX: number; minY: number; maxX: number; maxY: number } {
    const halfWidth = (this.screenWidth / 2) / this.zoom;
    const halfHeight = (this.screenHeight / 2) / this.zoom;

    return {
      minX: this.x - halfWidth,
      minY: this.y - halfHeight,
      maxX: this.x + halfWidth,
      maxY: this.y + halfHeight
    };
  }

  // Check if a point is visible on screen (with optional padding)
  isVisible(worldX: number, worldY: number, padding: number = 0): boolean {
    const bounds = this.getVisibleBounds();
    return (
      worldX >= bounds.minX - padding &&
      worldX <= bounds.maxX + padding &&
      worldY >= bounds.minY - padding &&
      worldY <= bounds.maxY + padding
    );
  }
}

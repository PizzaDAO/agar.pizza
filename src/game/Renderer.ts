import { Camera } from './Camera';
import { SerializedPlayer, Pellet } from '../../party/types';
import { MAP_WIDTH, MAP_HEIGHT, TOPPING_COLORS, PELLET_RADIUS } from '../../party/constants';

export class Renderer {
  private ctx: CanvasRenderingContext2D;
  private canvas: HTMLCanvasElement;

  constructor(canvas: HTMLCanvasElement) {
    this.canvas = canvas;
    this.ctx = canvas.getContext('2d')!;
  }

  clear(): void {
    // Dark background
    this.ctx.fillStyle = '#1a1a2e';
    this.ctx.fillRect(0, 0, this.canvas.width, this.canvas.height);
  }

  drawGrid(camera: Camera): void {
    const gridSize = 100;
    const bounds = camera.getVisibleBounds();

    // Extend bounds to grid boundaries
    const startX = Math.floor(bounds.minX / gridSize) * gridSize;
    const startY = Math.floor(bounds.minY / gridSize) * gridSize;
    const endX = Math.ceil(bounds.maxX / gridSize) * gridSize;
    const endY = Math.ceil(bounds.maxY / gridSize) * gridSize;

    this.ctx.strokeStyle = 'rgba(255, 255, 255, 0.1)';
    this.ctx.lineWidth = 1;

    // Vertical lines
    for (let x = startX; x <= endX; x += gridSize) {
      if (x < 0 || x > MAP_WIDTH) continue;
      const screenStart = camera.worldToScreen(x, Math.max(0, bounds.minY));
      const screenEnd = camera.worldToScreen(x, Math.min(MAP_HEIGHT, bounds.maxY));
      this.ctx.beginPath();
      this.ctx.moveTo(screenStart.x, screenStart.y);
      this.ctx.lineTo(screenEnd.x, screenEnd.y);
      this.ctx.stroke();
    }

    // Horizontal lines
    for (let y = startY; y <= endY; y += gridSize) {
      if (y < 0 || y > MAP_HEIGHT) continue;
      const screenStart = camera.worldToScreen(Math.max(0, bounds.minX), y);
      const screenEnd = camera.worldToScreen(Math.min(MAP_WIDTH, bounds.maxX), y);
      this.ctx.beginPath();
      this.ctx.moveTo(screenStart.x, screenStart.y);
      this.ctx.lineTo(screenEnd.x, screenEnd.y);
      this.ctx.stroke();
    }

    // Draw map boundary
    this.ctx.strokeStyle = 'rgba(255, 193, 7, 0.5)';
    this.ctx.lineWidth = 4 * camera.zoom;
    const topLeft = camera.worldToScreen(0, 0);
    const bottomRight = camera.worldToScreen(MAP_WIDTH, MAP_HEIGHT);
    this.ctx.strokeRect(
      topLeft.x,
      topLeft.y,
      bottomRight.x - topLeft.x,
      bottomRight.y - topLeft.y
    );
  }

  drawPellets(pellets: Map<string, Pellet>, camera: Camera): void {
    // bounds available for future culling optimization
    void camera.getVisibleBounds();

    for (const pellet of pellets.values()) {
      // Culling: skip pellets outside visible area
      if (!camera.isVisible(pellet.x, pellet.y, PELLET_RADIUS)) {
        continue;
      }

      const screen = camera.worldToScreen(pellet.x, pellet.y);
      const radius = PELLET_RADIUS * camera.zoom;

      // Draw pellet as colored circle
      this.ctx.beginPath();
      this.ctx.arc(screen.x, screen.y, radius, 0, Math.PI * 2);
      this.ctx.fillStyle = TOPPING_COLORS[pellet.topping] || '#FFC107';
      this.ctx.fill();

      // Add slight glow effect
      this.ctx.shadowColor = TOPPING_COLORS[pellet.topping] || '#FFC107';
      this.ctx.shadowBlur = 5;
      this.ctx.fill();
      this.ctx.shadowBlur = 0;
    }
  }

  drawPlayers(players: Map<string, SerializedPlayer>, myId: string | null, camera: Camera): void {
    // Sort players by mass (smaller on top so they're more visible)
    const sortedPlayers = Array.from(players.values())
      .filter(p => !p.isDead)
      .sort((a, b) => {
        const massA = a.cells.reduce((sum, c) => sum + c.mass, 0);
        const massB = b.cells.reduce((sum, c) => sum + c.mass, 0);
        return massB - massA; // Larger first (drawn first, behind smaller)
      });

    for (const player of sortedPlayers) {
      this.drawPlayer(player, player.id === myId, camera);
    }
  }

  private drawPlayer(player: SerializedPlayer, isMe: boolean, camera: Camera): void {
    for (const cell of player.cells) {
      // Culling
      if (!camera.isVisible(cell.x, cell.y, cell.radius)) {
        continue;
      }

      const screen = camera.worldToScreen(cell.x, cell.y);
      const radius = cell.radius * camera.zoom;

      // Draw pizza base (cheese circle)
      this.ctx.beginPath();
      this.ctx.arc(screen.x, screen.y, radius, 0, Math.PI * 2);

      // Gradient for pizza look
      const gradient = this.ctx.createRadialGradient(
        screen.x - radius * 0.3,
        screen.y - radius * 0.3,
        0,
        screen.x,
        screen.y,
        radius
      );
      gradient.addColorStop(0, '#FFE082');  // Light cheese
      gradient.addColorStop(0.7, '#FFC107'); // Cheese
      gradient.addColorStop(1, '#FF9800');   // Crust

      this.ctx.fillStyle = gradient;
      this.ctx.fill();

      // Draw crust outline
      this.ctx.strokeStyle = '#E65100';
      this.ctx.lineWidth = Math.max(2, radius * 0.08);
      this.ctx.stroke();

      // Draw player color accent
      this.ctx.beginPath();
      this.ctx.arc(screen.x, screen.y, radius * 0.85, 0, Math.PI * 2);
      this.ctx.strokeStyle = player.color;
      this.ctx.lineWidth = Math.max(3, radius * 0.1);
      this.ctx.stroke();

      // Highlight if it's the local player
      if (isMe) {
        this.ctx.beginPath();
        this.ctx.arc(screen.x, screen.y, radius + 3, 0, Math.PI * 2);
        this.ctx.strokeStyle = '#FFC107';
        this.ctx.lineWidth = 2;
        this.ctx.setLineDash([5, 5]);
        this.ctx.stroke();
        this.ctx.setLineDash([]);
      }
    }

    // Draw name label (above the largest cell)
    if (player.cells.length > 0) {
      const largestCell = player.cells.reduce((a, b) =>
        a.mass > b.mass ? a : b
      );
      const screen = camera.worldToScreen(largestCell.x, largestCell.y);
      const radius = largestCell.radius * camera.zoom;

      // Name
      const fontSize = Math.max(12, Math.min(24, radius * 0.4));
      this.ctx.font = `bold ${fontSize}px sans-serif`;
      this.ctx.textAlign = 'center';
      this.ctx.textBaseline = 'middle';

      // Text shadow
      this.ctx.fillStyle = 'rgba(0, 0, 0, 0.5)';
      this.ctx.fillText(player.name, screen.x + 2, screen.y - radius - 10 + 2);

      // Text
      this.ctx.fillStyle = isMe ? '#FFC107' : '#fff';
      this.ctx.fillText(player.name, screen.x, screen.y - radius - 10);

      // Mass
      const massText = Math.floor(player.score).toString();
      const massFontSize = fontSize * 0.7;
      this.ctx.font = `${massFontSize}px sans-serif`;
      this.ctx.fillStyle = 'rgba(255, 255, 255, 0.8)';
      this.ctx.fillText(massText, screen.x, screen.y);
    }
  }

  render(
    players: Map<string, SerializedPlayer>,
    pellets: Map<string, Pellet>,
    myId: string | null,
    camera: Camera
  ): void {
    this.clear();
    this.drawGrid(camera);
    this.drawPellets(pellets, camera);
    this.drawPlayers(players, myId, camera);
  }
}

import { Camera } from './Camera';
import { SerializedPlayer, Pellet, Virus } from '../../party/types';
import { VIRUS_RADIUS } from '../../party/constants';
import { MAP_WIDTH, MAP_HEIGHT, PELLET_RADIUS } from '../../party/constants';

const PEPPERONI_COUNT = 7;

export class Renderer {
  private ctx: CanvasRenderingContext2D;
  private canvas: HTMLCanvasElement;
  private pepperoniImages: HTMLImageElement[] = [];
  private imagesLoaded: boolean = false;
  private backgroundImage: HTMLImageElement | null = null;
  private backgroundLoaded: boolean = false;
  private backgroundPattern: CanvasPattern | null = null;
  private pizzaCutterImage: HTMLImageElement | null = null;
  private pizzaCutterLoaded: boolean = false;
  private defaultPizzaImage: HTMLImageElement | null = null;
  private defaultPizzaLoaded: boolean = false;
  private playerNFTImage: HTMLImageElement | null = null;
  private playerNFTLoaded: boolean = false;
  private playerNFTUrl: string | null = null;

  constructor(canvas: HTMLCanvasElement) {
    this.canvas = canvas;
    this.ctx = canvas.getContext('2d')!;
    this.loadPepperoniImages();
    this.loadBackgroundImage();
    this.loadPizzaCutterImage();
    this.loadDefaultPizzaImage();
  }

  setPlayerNFTImage(url: string | null): void {
    if (url === this.playerNFTUrl) return; // No change

    this.playerNFTUrl = url;
    this.playerNFTLoaded = false;
    this.playerNFTImage = null;

    if (url) {
      this.playerNFTImage = new Image();
      this.playerNFTImage.crossOrigin = 'anonymous';
      this.playerNFTImage.onload = () => {
        this.playerNFTLoaded = true;
      };
      this.playerNFTImage.onerror = () => {
        console.warn('Failed to load NFT image, using default');
        this.playerNFTLoaded = false;
        this.playerNFTImage = null;
      };
      this.playerNFTImage.src = url;
    }
  }

  private loadPepperoniImages(): void {
    let loadedCount = 0;
    for (let i = 1; i <= PEPPERONI_COUNT; i++) {
      const img = new Image();
      img.onload = () => {
        loadedCount++;
        if (loadedCount === PEPPERONI_COUNT) {
          this.imagesLoaded = true;
        }
      };
      img.src = `/pepperoni${i}.png`;
      this.pepperoniImages.push(img);
    }
  }

  private loadBackgroundImage(): void {
    this.backgroundImage = new Image();
    this.backgroundImage.onload = () => {
      this.backgroundLoaded = true;
      // Create a repeating pattern from the image
      this.backgroundPattern = this.ctx.createPattern(this.backgroundImage!, 'repeat');
    };
    this.backgroundImage.src = '/background.png';
  }

  private loadPizzaCutterImage(): void {
    this.pizzaCutterImage = new Image();
    this.pizzaCutterImage.onload = () => {
      this.pizzaCutterLoaded = true;
    };
    this.pizzaCutterImage.src = '/pizza-cutter.png';
  }

  private loadDefaultPizzaImage(): void {
    this.defaultPizzaImage = new Image();
    this.defaultPizzaImage.crossOrigin = 'anonymous';
    this.defaultPizzaImage.onload = () => {
      this.defaultPizzaLoaded = true;
    };
    this.defaultPizzaImage.src = 'https://kristineskitchenblog.com/wp-content/uploads/2024/07/margherita-pizza-22-2.jpg';
  }

  private getPepperoniIndex(pelletId: string): number {
    // Use pellet ID to get consistent random pepperoni variant
    const hash = pelletId.split('').reduce((acc, char) => acc + char.charCodeAt(0), 0);
    return hash % PEPPERONI_COUNT;
  }

  clear(): void {
    // Dark background fallback
    this.ctx.fillStyle = '#8B7355';
    this.ctx.fillRect(0, 0, this.canvas.width, this.canvas.height);
  }

  drawBackground(camera: Camera): void {
    // Draw dark outside the map
    this.ctx.fillStyle = '#1a1a1a';
    this.ctx.fillRect(0, 0, this.canvas.width, this.canvas.height);

    // Get the map area in screen coordinates
    const topLeft = camera.worldToScreen(0, 0);
    const bottomRight = camera.worldToScreen(MAP_WIDTH, MAP_HEIGHT);
    const mapWidth = bottomRight.x - topLeft.x;
    const mapHeight = bottomRight.y - topLeft.y;

    if (this.backgroundLoaded && this.backgroundImage) {
      // Draw single background image stretched to cover entire map
      this.ctx.drawImage(
        this.backgroundImage,
        topLeft.x,
        topLeft.y,
        mapWidth,
        mapHeight
      );
    } else {
      // Fallback: cardboard-ish color
      this.ctx.fillStyle = '#8B7355';
      this.ctx.fillRect(topLeft.x, topLeft.y, mapWidth, mapHeight);
    }

    // Draw map boundary
    this.ctx.strokeStyle = 'rgba(139, 69, 19, 0.8)';
    this.ctx.lineWidth = 6 * camera.zoom;
    this.ctx.strokeRect(topLeft.x, topLeft.y, mapWidth, mapHeight);
  }

  drawPellets(pellets: Map<string, Pellet>, camera: Camera): void {
    for (const pellet of pellets.values()) {
      // Culling: skip pellets outside visible area
      if (!camera.isVisible(pellet.x, pellet.y, PELLET_RADIUS)) {
        continue;
      }

      const screen = camera.worldToScreen(pellet.x, pellet.y);
      const size = PELLET_RADIUS * 2 * camera.zoom;

      // Draw pepperoni sprite
      if (this.imagesLoaded) {
        const imgIndex = this.getPepperoniIndex(pellet.id);
        const img = this.pepperoniImages[imgIndex];
        this.ctx.drawImage(
          img,
          screen.x - size / 2,
          screen.y - size / 2,
          size,
          size
        );
      } else {
        // Fallback: simple red circle while images load
        this.ctx.beginPath();
        this.ctx.arc(screen.x, screen.y, size / 2, 0, Math.PI * 2);
        this.ctx.fillStyle = '#C62828';
        this.ctx.fill();
      }
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

      // Determine which image to use for this player
      // Use NFT image if this is the local player and we have one loaded
      const useNFT = isMe && this.playerNFTLoaded && this.playerNFTImage;
      const pizzaImage = useNFT ? this.playerNFTImage : this.defaultPizzaImage;
      const pizzaLoaded = useNFT ? this.playerNFTLoaded : this.defaultPizzaLoaded;

      // Draw pizza image clipped to circle
      if (pizzaLoaded && pizzaImage) {
        this.ctx.save();

        // Create circular clipping path
        this.ctx.beginPath();
        this.ctx.arc(screen.x, screen.y, radius, 0, Math.PI * 2);
        this.ctx.clip();

        // Draw the pizza image centered and scaled to cover the circle
        const imgSize = radius * 2;
        this.ctx.drawImage(
          pizzaImage,
          screen.x - radius,
          screen.y - radius,
          imgSize,
          imgSize
        );

        this.ctx.restore();

        // Draw crust outline (golden for NFT, brown for default)
        this.ctx.beginPath();
        this.ctx.arc(screen.x, screen.y, radius, 0, Math.PI * 2);
        this.ctx.strokeStyle = useNFT ? '#FFC107' : '#8B4513';
        this.ctx.lineWidth = Math.max(3, radius * 0.08);
        this.ctx.stroke();
      } else {
        // Fallback: gradient pizza look
        this.ctx.beginPath();
        this.ctx.arc(screen.x, screen.y, radius, 0, Math.PI * 2);

        const gradient = this.ctx.createRadialGradient(
          screen.x - radius * 0.3,
          screen.y - radius * 0.3,
          0,
          screen.x,
          screen.y,
          radius
        );
        gradient.addColorStop(0, '#FFE082');
        gradient.addColorStop(0.7, '#FFC107');
        gradient.addColorStop(1, '#FF9800');

        this.ctx.fillStyle = gradient;
        this.ctx.fill();

        this.ctx.strokeStyle = '#E65100';
        this.ctx.lineWidth = Math.max(2, radius * 0.08);
        this.ctx.stroke();
      }

      // Draw player color accent ring
      this.ctx.beginPath();
      this.ctx.arc(screen.x, screen.y, radius * 0.92, 0, Math.PI * 2);
      this.ctx.strokeStyle = player.color;
      this.ctx.lineWidth = Math.max(3, radius * 0.06);
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

  drawViruses(viruses: Map<string, Virus>, camera: Camera): void {
    for (const virus of viruses.values()) {
      if (!camera.isVisible(virus.x, virus.y, virus.radius)) {
        continue;
      }

      const screen = camera.worldToScreen(virus.x, virus.y);
      const size = VIRUS_RADIUS * 2 * camera.zoom;

      if (this.pizzaCutterLoaded && this.pizzaCutterImage) {
        // Draw pizza cutter image
        this.ctx.drawImage(
          this.pizzaCutterImage,
          screen.x - size / 2,
          screen.y - size / 2,
          size,
          size
        );
      } else {
        // Fallback: green spiky circle
        this.ctx.beginPath();
        this.ctx.arc(screen.x, screen.y, size / 2, 0, Math.PI * 2);
        this.ctx.fillStyle = 'rgba(0, 200, 0, 0.5)';
        this.ctx.fill();
        this.ctx.strokeStyle = '#00aa00';
        this.ctx.lineWidth = 3;
        this.ctx.stroke();
      }
    }
  }

  render(
    players: Map<string, SerializedPlayer>,
    pellets: Map<string, Pellet>,
    viruses: Map<string, Virus>,
    myId: string | null,
    camera: Camera
  ): void {
    this.clear();
    this.drawBackground(camera);
    this.drawPellets(pellets, camera);
    this.drawViruses(viruses, camera);
    this.drawPlayers(players, myId, camera);
  }
}

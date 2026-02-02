import { useEffect, useRef, useCallback } from 'react';
import { Camera } from './Camera';
import { Renderer } from './Renderer';
import { Input } from './Input';
import { SerializedPlayer, Pellet, Virus } from '../../party/types';

interface GameCanvasProps {
  players: Map<string, SerializedPlayer>;
  pellets: Map<string, Pellet>;
  viruses: Map<string, Virus>;
  playerId: string | null;
  onInput: (angle: number, split?: boolean, eject?: boolean) => void;
}

// Agar.io-style lerp factor - how fast display positions catch up to server positions
// Higher = snappier but can show network jitter, Lower = smoother but more latency
const LERP_FACTOR = 0.16;

// Lerp helper
function lerp(a: number, b: number, t: number): number {
  return a + (b - a) * t;
}

// Display state for smooth rendering (stored separately from server state)
interface DisplayCell {
  id: string;
  x: number;
  y: number;
  radius: number;
  mass: number;
  vx: number;
  vy: number;
  mergeTime: number;
}

interface DisplayPlayer {
  id: string;
  name: string;
  cells: DisplayCell[];
  score: number;
  color: string;
  isDead: boolean;
}

export function GameCanvas({ players, pellets, viruses, playerId, onInput }: GameCanvasProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const rendererRef = useRef<Renderer | null>(null);
  const cameraRef = useRef<Camera>(new Camera());
  const inputRef = useRef<Input>(new Input());
  const animationFrameRef = useRef<number>(0);
  const lastInputTimeRef = useRef<number>(0);
  const splitSentRef = useRef<boolean>(false);
  const ejectSentRef = useRef<boolean>(false);

  // Agar.io-style: maintain display positions that smoothly lerp toward server positions
  const displayPlayersRef = useRef<Map<string, DisplayPlayer>>(new Map());

  // Setup canvas and renderer
  const setupCanvas = useCallback(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    // Set canvas size to window size
    const dpr = window.devicePixelRatio || 1;
    canvas.width = window.innerWidth * dpr;
    canvas.height = window.innerHeight * dpr;
    canvas.style.width = `${window.innerWidth}px`;
    canvas.style.height = `${window.innerHeight}px`;

    // Update camera and input with screen size
    cameraRef.current.setScreenSize(canvas.width, canvas.height);
    inputRef.current.setScreenSize(canvas.width, canvas.height);

    // Create renderer if needed
    if (!rendererRef.current) {
      rendererRef.current = new Renderer(canvas);
    }
  }, []);

  // Game loop
  const gameLoop = useCallback(() => {
    const camera = cameraRef.current;
    const renderer = rendererRef.current;
    const input = inputRef.current;
    const displayPlayers = displayPlayersRef.current;

    if (!renderer) {
      animationFrameRef.current = requestAnimationFrame(gameLoop);
      return;
    }

    // Agar.io-style: Update display positions by lerping toward server positions
    // This runs every frame for smooth 60fps movement regardless of server tick rate
    for (const [id, serverPlayer] of players) {
      let displayPlayer = displayPlayers.get(id);

      if (!displayPlayer) {
        // New player - initialize display state to server position
        displayPlayer = {
          id: serverPlayer.id,
          name: serverPlayer.name,
          cells: serverPlayer.cells.map(cell => ({ ...cell })),
          score: serverPlayer.score,
          color: serverPlayer.color,
          isDead: serverPlayer.isDead
        };
        displayPlayers.set(id, displayPlayer);
      } else {
        // Existing player - lerp display positions toward server positions
        displayPlayer.name = serverPlayer.name;
        displayPlayer.score = serverPlayer.score;
        displayPlayer.color = serverPlayer.color;
        displayPlayer.isDead = serverPlayer.isDead;

        // Handle cell count changes (split, merge, death)
        while (displayPlayer.cells.length < serverPlayer.cells.length) {
          // New cells appear - initialize at server position
          const newCell = serverPlayer.cells[displayPlayer.cells.length];
          displayPlayer.cells.push({ ...newCell });
        }
        while (displayPlayer.cells.length > serverPlayer.cells.length) {
          // Cells merged/removed
          displayPlayer.cells.pop();
        }

        // Lerp each cell toward its server position
        for (let i = 0; i < serverPlayer.cells.length; i++) {
          const serverCell = serverPlayer.cells[i];
          const displayCell = displayPlayer.cells[i];

          displayCell.x = lerp(displayCell.x, serverCell.x, LERP_FACTOR);
          displayCell.y = lerp(displayCell.y, serverCell.y, LERP_FACTOR);
          displayCell.radius = lerp(displayCell.radius, serverCell.radius, LERP_FACTOR);
          displayCell.mass = serverCell.mass;
          displayCell.id = serverCell.id;
          displayCell.vx = serverCell.vx;
          displayCell.vy = serverCell.vy;
          displayCell.mergeTime = serverCell.mergeTime;
        }
      }
    }

    // Remove players that left
    for (const id of displayPlayers.keys()) {
      if (!players.has(id)) {
        displayPlayers.delete(id);
      }
    }

    // Convert display state to SerializedPlayer format for renderer
    const renderPlayers = new Map<string, SerializedPlayer>();
    for (const [id, dp] of displayPlayers) {
      renderPlayers.set(id, {
        id: dp.id,
        name: dp.name,
        cells: dp.cells,
        score: dp.score,
        color: dp.color,
        isDead: dp.isDead
      });
    }

    // Get display player for camera
    const displayCurrentPlayer = playerId ? displayPlayers.get(playerId) : null;

    // Update camera target based on display player position (not server position)
    if (displayCurrentPlayer && displayCurrentPlayer.cells.length > 0) {
      let totalMass = 0;
      let x = 0;
      let y = 0;
      for (const cell of displayCurrentPlayer.cells) {
        x += cell.x * cell.mass;
        y += cell.y * cell.mass;
        totalMass += cell.mass;
      }
      camera.setTarget(x / totalMass, y / totalMass, totalMass);
    }

    // Smooth camera update
    camera.update();

    // Check for split (space) and eject (W) - only send once per keypress
    const spacePressed = input.isKeyPressed(' ');
    const wPressed = input.isKeyPressed('w');

    let split = false;
    let eject = false;

    if (spacePressed && !splitSentRef.current) {
      split = true;
      splitSentRef.current = true;
    } else if (!spacePressed) {
      splitSentRef.current = false;
    }

    if (wPressed && !ejectSentRef.current) {
      eject = true;
      ejectSentRef.current = true;
    } else if (!wPressed) {
      ejectSentRef.current = false;
    }

    // Send input at regular intervals (not every frame) or immediately for actions
    const now = Date.now();
    if (now - lastInputTimeRef.current > 50 || split || eject) { // 20 times per second
      const angle = input.getAngle();
      onInput(angle, split, eject);
      lastInputTimeRef.current = now;
    }

    // Render with smooth display positions
    renderer.render(renderPlayers, pellets, viruses, playerId, camera);

    // Continue loop
    animationFrameRef.current = requestAnimationFrame(gameLoop);
  }, [players, pellets, viruses, playerId, onInput]);

  // Initialize
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    setupCanvas();
    inputRef.current.attach(canvas);

    // Handle resize
    const handleResize = () => {
      setupCanvas();
    };
    window.addEventListener('resize', handleResize);

    // Start game loop
    animationFrameRef.current = requestAnimationFrame(gameLoop);

    return () => {
      window.removeEventListener('resize', handleResize);
      cancelAnimationFrame(animationFrameRef.current);
      inputRef.current.detach();
    };
  }, [setupCanvas, gameLoop]);

  return (
    <canvas
      ref={canvasRef}
      style={{
        display: 'block',
        width: '100%',
        height: '100%',
        cursor: 'crosshair'
      }}
    />
  );
}

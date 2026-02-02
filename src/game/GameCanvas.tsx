import { useEffect, useRef, useCallback } from 'react';
import { Camera } from './Camera';
import { Renderer } from './Renderer';
import { Input } from './Input';
import { SerializedPlayer, Pellet, Virus, Cell } from '../../party/types';

interface GameCanvasProps {
  players: Map<string, SerializedPlayer>;
  pellets: Map<string, Pellet>;
  viruses: Map<string, Virus>;
  playerId: string | null;
  onInput: (angle: number, split?: boolean, eject?: boolean) => void;
}

// Smoothing decay base - lower = smoother but more latency
// At 60fps this gives ~0.08 lerp factor, matching agar.io feel
const SMOOTHING_BASE = 0.00001;

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
}

interface DisplayPlayer {
  id: string;
  name: string;
  cells: Map<string, DisplayCell>; // Keyed by cell ID for proper matching
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
  const lastFrameTimeRef = useRef<number>(performance.now());
  const splitSentRef = useRef<boolean>(false);
  const ejectSentRef = useRef<boolean>(false);

  // Store server state in refs to decouple game loop from React re-renders
  const serverPlayersRef = useRef<Map<string, SerializedPlayer>>(new Map());
  const serverPelletsRef = useRef<Map<string, Pellet>>(new Map());
  const serverVirusesRef = useRef<Map<string, Virus>>(new Map());
  const playerIdRef = useRef<string | null>(null);

  // Agar.io-style: maintain display positions that smoothly lerp toward server positions
  const displayPlayersRef = useRef<Map<string, DisplayPlayer>>(new Map());

  // Update refs when props change (doesn't trigger gameLoop recreation)
  useEffect(() => {
    serverPlayersRef.current = players;
  }, [players]);

  useEffect(() => {
    serverPelletsRef.current = pellets;
  }, [pellets]);

  useEffect(() => {
    serverVirusesRef.current = viruses;
  }, [viruses]);

  useEffect(() => {
    playerIdRef.current = playerId;
  }, [playerId]);

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

  // Game loop - NO dependencies on props, reads from refs
  const gameLoop = useCallback(() => {
    const camera = cameraRef.current;
    const renderer = rendererRef.current;
    const input = inputRef.current;
    const displayPlayers = displayPlayersRef.current;
    const serverPlayers = serverPlayersRef.current;
    const serverPellets = serverPelletsRef.current;
    const serverViruses = serverVirusesRef.current;
    const currentPlayerId = playerIdRef.current;

    if (!renderer) {
      animationFrameRef.current = requestAnimationFrame(gameLoop);
      return;
    }

    // Calculate delta time for frame-rate independent smoothing
    const now = performance.now();
    const deltaTime = (now - lastFrameTimeRef.current) / 1000; // seconds
    lastFrameTimeRef.current = now;

    // Delta-time adjusted lerp factor (consistent smoothing at any frame rate)
    // At 60fps (dt=0.0167): lerpFactor ≈ 0.08
    // At 30fps (dt=0.033): lerpFactor ≈ 0.15
    const lerpFactor = 1 - Math.pow(SMOOTHING_BASE, deltaTime);

    // Agar.io-style: Update display positions by lerping toward server positions
    for (const [id, serverPlayer] of serverPlayers) {
      let displayPlayer = displayPlayers.get(id);

      if (!displayPlayer) {
        // New player - initialize display state to server position
        const cellsMap = new Map<string, DisplayCell>();
        for (const cell of serverPlayer.cells) {
          cellsMap.set(cell.id, {
            id: cell.id,
            x: cell.x,
            y: cell.y,
            radius: cell.radius,
            mass: cell.mass
          });
        }
        displayPlayer = {
          id: serverPlayer.id,
          name: serverPlayer.name,
          cells: cellsMap,
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

        // Build set of current server cell IDs
        const serverCellIds = new Set(serverPlayer.cells.map(c => c.id));

        // Remove cells that no longer exist on server
        for (const cellId of displayPlayer.cells.keys()) {
          if (!serverCellIds.has(cellId)) {
            displayPlayer.cells.delete(cellId);
          }
        }

        // Update/add cells
        for (const serverCell of serverPlayer.cells) {
          let displayCell = displayPlayer.cells.get(serverCell.id);

          if (!displayCell) {
            // New cell (from split) - initialize at server position
            displayCell = {
              id: serverCell.id,
              x: serverCell.x,
              y: serverCell.y,
              radius: serverCell.radius,
              mass: serverCell.mass
            };
            displayPlayer.cells.set(serverCell.id, displayCell);
          } else {
            // Existing cell - lerp toward server position
            displayCell.x = lerp(displayCell.x, serverCell.x, lerpFactor);
            displayCell.y = lerp(displayCell.y, serverCell.y, lerpFactor);
            displayCell.radius = lerp(displayCell.radius, serverCell.radius, lerpFactor);
            displayCell.mass = serverCell.mass;
          }
        }
      }
    }

    // Remove players that left
    for (const id of displayPlayers.keys()) {
      if (!serverPlayers.has(id)) {
        displayPlayers.delete(id);
      }
    }

    // Convert display state to SerializedPlayer format for renderer
    const renderPlayers = new Map<string, SerializedPlayer>();
    for (const [id, dp] of displayPlayers) {
      // Convert cells Map to array
      const cellsArray: Cell[] = Array.from(dp.cells.values()).map(dc => ({
        id: dc.id,
        x: dc.x,
        y: dc.y,
        radius: dc.radius,
        mass: dc.mass,
        vx: 0,
        vy: 0,
        mergeTime: 0
      }));

      renderPlayers.set(id, {
        id: dp.id,
        name: dp.name,
        cells: cellsArray,
        score: dp.score,
        color: dp.color,
        isDead: dp.isDead
      });
    }

    // Get display player for camera
    const displayCurrentPlayer = currentPlayerId ? displayPlayers.get(currentPlayerId) : null;

    // Update camera target based on display player position
    if (displayCurrentPlayer && displayCurrentPlayer.cells.size > 0) {
      let totalMass = 0;
      let x = 0;
      let y = 0;
      for (const cell of displayCurrentPlayer.cells.values()) {
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
    const inputNow = Date.now();
    if (inputNow - lastInputTimeRef.current > 50 || split || eject) { // 20 times per second
      const angle = input.getAngle();
      onInput(angle, split, eject);
      lastInputTimeRef.current = inputNow;
    }

    // Render with smooth display positions
    renderer.render(renderPlayers, serverPellets, serverViruses, currentPlayerId, camera);

    // Continue loop
    animationFrameRef.current = requestAnimationFrame(gameLoop);
  }, [onInput]); // Only depends on onInput callback, NOT on state

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

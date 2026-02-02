import { useEffect, useRef, useCallback } from 'react';
import { Camera } from './Camera';
import { Renderer } from './Renderer';
import { Input } from './Input';
import { SerializedPlayer, Pellet, Virus } from '../../party/types';

interface GameCanvasProps {
  players: Map<string, SerializedPlayer>;
  previousPlayers: Map<string, SerializedPlayer>;
  lastUpdateTime: number;
  pellets: Map<string, Pellet>;
  viruses: Map<string, Virus>;
  playerId: string | null;
  onInput: (angle: number, split?: boolean, eject?: boolean) => void;
}

// Server sends updates at ~30Hz (33ms)
const SERVER_TICK_MS = 33;
// Maximum extrapolation to prevent runaway predictions
const MAX_EXTRAPOLATION = 2.0;

function interpolatePositions(
  prev: Map<string, SerializedPlayer>,
  current: Map<string, SerializedPlayer>,
  lastUpdate: number,
  now: number
): Map<string, SerializedPlayer> {
  // Allow t to exceed 1 for extrapolation, but cap it
  const t = Math.min(MAX_EXTRAPOLATION, (now - lastUpdate) / SERVER_TICK_MS);
  const result = new Map<string, SerializedPlayer>();

  for (const [id, player] of current) {
    const prevPlayer = prev.get(id);
    if (prevPlayer && prevPlayer.cells.length > 0) {
      // Interpolate/extrapolate cell positions
      const interpolatedCells = player.cells.map((cell, i) => {
        const prevCell = prevPlayer.cells[i];
        if (prevCell) {
          // Linear interpolation (t <= 1) or extrapolation (t > 1)
          return {
            ...cell,
            x: prevCell.x + (cell.x - prevCell.x) * t,
            y: prevCell.y + (cell.y - prevCell.y) * t,
          };
        }
        return cell;
      });
      result.set(id, { ...player, cells: interpolatedCells });
    } else {
      result.set(id, player);
    }
  }
  return result;
}

export function GameCanvas({ players, previousPlayers, lastUpdateTime, pellets, viruses, playerId, onInput }: GameCanvasProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const rendererRef = useRef<Renderer | null>(null);
  const cameraRef = useRef<Camera>(new Camera());
  const inputRef = useRef<Input>(new Input());
  const animationFrameRef = useRef<number>(0);
  const lastInputTimeRef = useRef<number>(0);
  const splitSentRef = useRef<boolean>(false);
  const ejectSentRef = useRef<boolean>(false);

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

    if (!renderer) {
      animationFrameRef.current = requestAnimationFrame(gameLoop);
      return;
    }

    // Interpolate player positions for smooth rendering
    const now = Date.now();
    const interpolatedPlayers = interpolatePositions(
      previousPlayers,
      players,
      lastUpdateTime,
      now
    );

    // Get interpolated current player for camera
    const interpolatedCurrentPlayer = playerId ? interpolatedPlayers.get(playerId) : null;

    // Update camera target based on interpolated player position
    if (interpolatedCurrentPlayer && interpolatedCurrentPlayer.cells.length > 0) {
      // Find center of all cells
      let totalMass = 0;
      let x = 0;
      let y = 0;
      for (const cell of interpolatedCurrentPlayer.cells) {
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
    if (now - lastInputTimeRef.current > 50 || split || eject) { // 20 times per second
      const angle = input.getAngle();
      onInput(angle, split, eject);
      lastInputTimeRef.current = now;
    }

    // Render with interpolated positions
    renderer.render(interpolatedPlayers, pellets, viruses, playerId, camera);

    // Continue loop
    animationFrameRef.current = requestAnimationFrame(gameLoop);
  }, [players, previousPlayers, lastUpdateTime, pellets, viruses, playerId, onInput]);

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

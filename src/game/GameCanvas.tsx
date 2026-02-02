import { useEffect, useRef, useCallback } from 'react';
import { Camera } from './Camera';
import { Renderer } from './Renderer';
import { Input } from './Input';
import { SerializedPlayer, Pellet } from '../../party/types';

interface GameCanvasProps {
  players: Map<string, SerializedPlayer>;
  pellets: Map<string, Pellet>;
  playerId: string | null;
  onInput: (angle: number, split?: boolean, eject?: boolean) => void;
}

export function GameCanvas({ players, pellets, playerId, onInput }: GameCanvasProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const rendererRef = useRef<Renderer | null>(null);
  const cameraRef = useRef<Camera>(new Camera());
  const inputRef = useRef<Input>(new Input());
  const animationFrameRef = useRef<number>(0);
  const lastInputTimeRef = useRef<number>(0);
  const splitSentRef = useRef<boolean>(false);
  const ejectSentRef = useRef<boolean>(false);

  // Get current player data
  const currentPlayer = playerId ? players.get(playerId) : null;

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

    // Update camera target based on player position
    if (currentPlayer && currentPlayer.cells.length > 0) {
      // Find center of all cells
      let totalMass = 0;
      let x = 0;
      let y = 0;
      for (const cell of currentPlayer.cells) {
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

    // Render
    renderer.render(players, pellets, playerId, camera);

    // Continue loop
    animationFrameRef.current = requestAnimationFrame(gameLoop);
  }, [players, pellets, playerId, currentPlayer, onInput]);

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

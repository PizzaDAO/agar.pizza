import { useState, useCallback } from 'react';
import { useGameSocket } from './hooks/useGameSocket';
import { GameCanvas } from './game/GameCanvas';
import { Lobby } from './components/Lobby';
import { HUD } from './components/HUD';
import { DeathScreen } from './components/DeathScreen';

type GameState = 'lobby' | 'playing' | 'dead';

function App() {
  const [gameState, setGameState] = useState<GameState>('lobby');
  const [playerName, setPlayerName] = useState('');

  const {
    connectionState,
    gameData,
    join,
    sendInput,
    respawn
  } = useGameSocket();

  // Handle play button
  const handlePlay = useCallback((name: string) => {
    setPlayerName(name);
    setGameState('playing');
    join(name);
  }, [join]);

  // Handle respawn
  const handleRespawn = useCallback(() => {
    setGameState('playing');
    respawn(playerName);
  }, [respawn, playerName]);

  // Get current player's score
  const currentPlayer = gameData.playerId
    ? gameData.players.get(gameData.playerId)
    : null;
  const score = currentPlayer?.score || 0;

  // Check if player died
  const isDead = gameData.isDead;

  return (
    <div className="app">
      {gameState === 'lobby' && (
        <Lobby
          onPlay={handlePlay}
          isConnecting={connectionState === 'connecting'}
        />
      )}

      {gameState === 'playing' && (
        <div className="game-container">
          <GameCanvas
            players={gameData.players}
            pellets={gameData.pellets}
            viruses={gameData.viruses}
            playerId={gameData.playerId}
            onInput={sendInput}
          />
          <HUD
            score={score}
            leaderboard={gameData.leaderboard}
            playerId={gameData.playerId}
          />
          {isDead && (
            <DeathScreen
              killerName={gameData.killerName}
              onRespawn={handleRespawn}
            />
          )}
        </div>
      )}
    </div>
  );
}

export default App;

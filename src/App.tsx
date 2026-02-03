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

      {/* GitHub + Google Sheets links - bottom right */}
      <div style={{
        position: 'fixed',
        bottom: '16px',
        right: '16px',
        display: 'flex',
        alignItems: 'center',
        gap: '12px',
        zIndex: 9999
      }}>
        <a
          href="https://docs.google.com/spreadsheets/d/1LZaKcHLCpmXDtf3ypT1FpoYvw4f04Afq69YfNX3ecUs/edit"
          target="_blank"
          rel="noopener noreferrer"
          title="Task Sheet"
          style={{ opacity: 0.8 }}
          onMouseEnter={(e) => e.currentTarget.style.opacity = '1'}
          onMouseLeave={(e) => e.currentTarget.style.opacity = '0.8'}
        >
          <img
            src="https://cdn.simpleicons.org/googlesheets/A67B5B"
            alt="Google Sheets"
            style={{ width: '32px', height: '32px' }}
          />
        </a>
        <a
          href="https://github.com/PizzaDAO/agar.pizza"
          target="_blank"
          rel="noopener noreferrer"
          title="GitHub"
          style={{ opacity: 0.8 }}
          onMouseEnter={(e) => e.currentTarget.style.opacity = '1'}
          onMouseLeave={(e) => e.currentTarget.style.opacity = '0.8'}
        >
          <img
            src="https://cdn.simpleicons.org/github/A67B5B"
            alt="GitHub"
            style={{ width: '32px', height: '32px' }}
          />
        </a>
      </div>
    </div>
  );
}

export default App;

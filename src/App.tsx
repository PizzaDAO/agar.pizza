import { useState, useCallback, useEffect } from 'react';
import { useGameSocket } from './hooks/useGameSocket';
import { GameCanvas } from './game/GameCanvas';
import { Lobby } from './components/Lobby';
import { HUD } from './components/HUD';
import { DeathScreen } from './components/DeathScreen';
import { NFTPicker } from './components/NFTPicker';
import { getSelectedNFT } from './lib/nft-fetch';

type GameState = 'lobby' | 'playing' | 'dead';

function App() {
  const [gameState, setGameState] = useState<GameState>('lobby');
  const [playerName, setPlayerName] = useState('');
  const [selectedNFTImage, setSelectedNFTImage] = useState<string | null>(null);
  const [showNFTPicker, setShowNFTPicker] = useState(false);

  // Load selected NFT from localStorage on mount
  useEffect(() => {
    setSelectedNFTImage(getSelectedNFT());
  }, []);

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

  const handleNFTSelect = useCallback((imageUrl: string | null) => {
    setSelectedNFTImage(imageUrl);
  }, []);

  return (
    <div className="app">
      {gameState === 'lobby' && (
        <Lobby
          onPlay={handlePlay}
          isConnecting={connectionState === 'connecting'}
          onOpenNFTPicker={() => setShowNFTPicker(true)}
          selectedNFTImage={selectedNFTImage}
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
            playerNFTImage={selectedNFTImage}
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

      <NFTPicker
        isOpen={showNFTPicker}
        onClose={() => setShowNFTPicker(false)}
        onSelect={handleNFTSelect}
      />

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

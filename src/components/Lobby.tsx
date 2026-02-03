import { useState, FormEvent } from 'react';

interface LobbyProps {
  onPlay: (name: string) => void;
  isConnecting: boolean;
  onOpenNFTPicker?: () => void;
  selectedNFTImage?: string | null;
}

export function Lobby({ onPlay, isConnecting, onOpenNFTPicker, selectedNFTImage }: LobbyProps) {
  const [name, setName] = useState('');

  const handleSubmit = (e: FormEvent) => {
    e.preventDefault();
    if (name.trim() && !isConnecting) {
      onPlay(name.trim());
    }
  };

  return (
    <div className="lobby">
      <h1>Agar.Pizza</h1>
      <h2>Pizza Battle Royale</h2>

      {/* NFT Pizza Preview */}
      <button
        onClick={onOpenNFTPicker}
        style={{
          background: 'transparent',
          border: '3px dashed rgba(255, 193, 7, 0.5)',
          borderRadius: '50%',
          width: 100,
          height: 100,
          cursor: 'pointer',
          overflow: 'hidden',
          padding: 0,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          transition: 'border-color 0.2s',
        }}
        onMouseEnter={(e) => e.currentTarget.style.borderColor = '#FFC107'}
        onMouseLeave={(e) => e.currentTarget.style.borderColor = 'rgba(255, 193, 7, 0.5)'}
        title="Choose your pizza"
      >
        {selectedNFTImage ? (
          <img
            src={selectedNFTImage}
            alt="Your Pizza"
            style={{
              width: '100%',
              height: '100%',
              objectFit: 'cover',
              borderRadius: '50%',
            }}
          />
        ) : (
          <img
            src="https://kristineskitchenblog.com/wp-content/uploads/2024/07/margherita-pizza-22-2.jpg"
            alt="Default Pizza"
            style={{
              width: '100%',
              height: '100%',
              objectFit: 'cover',
              borderRadius: '50%',
              opacity: 0.7,
            }}
          />
        )}
      </button>
      <p style={{ fontSize: 12, color: '#888', marginTop: 8 }}>
        {selectedNFTImage ? 'Your Rare Pizza' : 'Click to choose your pizza'}
      </p>

      <form onSubmit={handleSubmit}>
        <input
          type="text"
          placeholder="Enter your name..."
          value={name}
          onChange={(e) => setName(e.target.value)}
          maxLength={20}
          autoFocus
          disabled={isConnecting}
        />
      </form>

      <button onClick={() => handleSubmit({ preventDefault: () => {} } as FormEvent)} disabled={!name.trim() || isConnecting}>
        {isConnecting ? (
          <span className="connecting">
            <span className="spinner" />
            Connecting...
          </span>
        ) : (
          'Play!'
        )}
      </button>

      <div style={{ marginTop: 24, textAlign: 'center', color: '#888', fontSize: 14 }}>
        <p>Move: Mouse</p>
        <p>Eat smaller pizzas to grow!</p>
      </div>
    </div>
  );
}

import { useState, FormEvent } from 'react';

interface LobbyProps {
  onPlay: (name: string) => void;
  isConnecting: boolean;
}

export function Lobby({ onPlay, isConnecting }: LobbyProps) {
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

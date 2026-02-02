interface DeathScreenProps {
  killerName: string | null;
  onRespawn: () => void;
}

export function DeathScreen({ killerName, onRespawn }: DeathScreenProps) {
  return (
    <div className="death-screen">
      <h2>You were eaten!</h2>
      {killerName && (
        <p>
          Consumed by <span className="killer-name">{killerName}</span>
        </p>
      )}
      <button onClick={onRespawn}>Play Again</button>
    </div>
  );
}

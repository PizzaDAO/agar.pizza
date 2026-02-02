import { LeaderboardEntry } from '../../party/types';

interface HUDProps {
  score: number;
  leaderboard: LeaderboardEntry[];
  playerId: string | null;
}

export function HUD({ score, leaderboard, playerId }: HUDProps) {
  return (
    <div className="hud">
      <div className="hud-score">
        <div className="score-label">Score</div>
        <div className="score-value">{Math.floor(score)}</div>
      </div>

      <div className="leaderboard">
        <h3>Leaderboard</h3>
        {leaderboard.map((entry, index) => (
          <div
            key={entry.id}
            className={`leaderboard-entry ${entry.id === playerId ? 'self' : ''}`}
          >
            <span className="leaderboard-rank">{index + 1}.</span>
            <span className="leaderboard-name">{entry.name}</span>
            <span className="leaderboard-score">{entry.score}</span>
          </div>
        ))}
        {leaderboard.length === 0 && (
          <div style={{ color: '#666', textAlign: 'center', padding: 8 }}>
            No players yet
          </div>
        )}
      </div>
    </div>
  );
}

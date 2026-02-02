import { useEffect, useRef, useState, useCallback } from 'react';
import PartySocket from 'partysocket';
import {
  MessageType,
  ServerMessage,
  SnapshotMessage,
  UpdateMessage,
  PlayerJoinedMessage,
  PlayerLeftMessage,
  PlayerDiedMessage,
  PelletEatenMessage,
  PelletsSpawnedMessage,
  SerializedPlayer,
  Pellet,
  Virus,
  LeaderboardEntry
} from '../../party/types';
import { encodeMessage, createJoinMessage, createInputMessage } from '../lib/protocol';

export type ConnectionState = 'disconnected' | 'connecting' | 'connected';

export interface GameData {
  playerId: string | null;
  players: Map<string, SerializedPlayer>;
  pellets: Map<string, Pellet>;
  viruses: Map<string, Virus>;
  leaderboard: LeaderboardEntry[];
  isDead: boolean;
  killerName: string | null;
}

interface UseGameSocketReturn {
  connectionState: ConnectionState;
  gameData: GameData;
  join: (name: string) => void;
  sendInput: (angle: number) => void;
  respawn: (name: string) => void;
  disconnect: () => void;
}

const PARTYKIT_HOST = import.meta.env.VITE_PARTYKIT_HOST || 'localhost:1999';

export function useGameSocket(): UseGameSocketReturn {
  const socketRef = useRef<PartySocket | null>(null);
  const [connectionState, setConnectionState] = useState<ConnectionState>('disconnected');
  const [gameData, setGameData] = useState<GameData>({
    playerId: null,
    players: new Map(),
    pellets: new Map(),
    viruses: new Map(),
    leaderboard: [],
    isDead: false,
    killerName: null
  });

  // Handle incoming messages
  const handleMessage = useCallback((event: MessageEvent) => {
    const message = JSON.parse(event.data) as ServerMessage;

    switch (message.type) {
      case MessageType.SNAPSHOT: {
        const snapshot = message as SnapshotMessage;
        const players = new Map<string, SerializedPlayer>();
        const pellets = new Map<string, Pellet>();
        const viruses = new Map<string, Virus>();

        for (const player of snapshot.players) {
          players.set(player.id, player);
        }
        for (const pellet of snapshot.pellets) {
          pellets.set(pellet.id, pellet);
        }
        for (const virus of snapshot.viruses || []) {
          viruses.set(virus.id, virus);
        }

        setGameData({
          playerId: snapshot.playerId,
          players,
          pellets,
          viruses,
          leaderboard: snapshot.leaderboard,
          isDead: false,
          killerName: null
        });
        break;
      }

      case MessageType.UPDATE: {
        const update = message as UpdateMessage;
        setGameData(prev => {
          const players = new Map<string, SerializedPlayer>();
          for (const player of update.players) {
            players.set(player.id, player);
          }
          return {
            ...prev,
            players,
            leaderboard: update.leaderboard
          };
        });
        break;
      }

      case MessageType.PLAYER_JOINED: {
        const joined = message as PlayerJoinedMessage;
        setGameData(prev => {
          const players = new Map(prev.players);
          players.set(joined.player.id, joined.player);
          return { ...prev, players };
        });
        break;
      }

      case MessageType.PLAYER_LEFT: {
        const left = message as PlayerLeftMessage;
        setGameData(prev => {
          const players = new Map(prev.players);
          players.delete(left.playerId);
          return { ...prev, players };
        });
        break;
      }

      case MessageType.PLAYER_DIED: {
        const died = message as PlayerDiedMessage;
        setGameData(prev => {
          if (died.playerId === prev.playerId) {
            return {
              ...prev,
              isDead: true,
              killerName: died.killerName
            };
          }
          return prev;
        });
        break;
      }

      case MessageType.PELLET_EATEN: {
        const eaten = message as PelletEatenMessage;
        setGameData(prev => {
          const pellets = new Map(prev.pellets);
          pellets.delete(eaten.pelletId);
          return { ...prev, pellets };
        });
        break;
      }

      case MessageType.PELLETS_SPAWNED: {
        const spawned = message as PelletsSpawnedMessage;
        setGameData(prev => {
          const pellets = new Map(prev.pellets);
          for (const pellet of spawned.pellets) {
            pellets.set(pellet.id, pellet);
          }
          return { ...prev, pellets };
        });
        break;
      }
    }
  }, []);

  // Connect to server
  const connect = useCallback(() => {
    if (socketRef.current) return;

    setConnectionState('connecting');

    const socket = new PartySocket({
      host: PARTYKIT_HOST,
      room: 'main-game'
    });

    socket.addEventListener('open', () => {
      setConnectionState('connected');
    });

    socket.addEventListener('message', handleMessage);

    socket.addEventListener('close', () => {
      setConnectionState('disconnected');
      socketRef.current = null;
    });

    socket.addEventListener('error', () => {
      setConnectionState('disconnected');
      socketRef.current = null;
    });

    socketRef.current = socket;
  }, [handleMessage]);

  // Disconnect from server
  const disconnect = useCallback(() => {
    if (socketRef.current) {
      socketRef.current.close();
      socketRef.current = null;
    }
    setConnectionState('disconnected');
    setGameData({
      playerId: null,
      players: new Map(),
      pellets: new Map(),
      viruses: new Map(),
      leaderboard: [],
      isDead: false,
      killerName: null
    });
  }, []);

  // Join the game
  const join = useCallback((name: string) => {
    connect();

    // Wait for connection then send join message
    const checkAndSend = () => {
      if (socketRef.current?.readyState === WebSocket.OPEN) {
        socketRef.current.send(encodeMessage(createJoinMessage(name)));
      } else {
        setTimeout(checkAndSend, 100);
      }
    };
    checkAndSend();
  }, [connect]);

  // Send input
  const sendInput = useCallback((angle: number, split?: boolean, eject?: boolean) => {
    if (socketRef.current?.readyState === WebSocket.OPEN) {
      socketRef.current.send(encodeMessage(createInputMessage(angle, split, eject)));
    }
  }, []);

  // Respawn after death
  const respawn = useCallback((name: string) => {
    setGameData(prev => ({
      ...prev,
      isDead: false,
      killerName: null
    }));

    if (socketRef.current?.readyState === WebSocket.OPEN) {
      socketRef.current.send(encodeMessage(createJoinMessage(name)));
    }
  }, []);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      if (socketRef.current) {
        socketRef.current.close();
      }
    };
  }, []);

  return {
    connectionState,
    gameData,
    join,
    sendInput,
    respawn,
    disconnect
  };
}

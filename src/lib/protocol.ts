// Message encoding/decoding utilities
import {
  MessageType,
  ClientMessage,
  ServerMessage,
  JoinMessage,
  InputMessage,
  LeaveMessage
} from '../../party/types';

export function createJoinMessage(name: string): JoinMessage {
  return {
    type: MessageType.JOIN,
    name
  };
}

export function createInputMessage(angle: number): InputMessage {
  return {
    type: MessageType.INPUT,
    angle,
    timestamp: Date.now()
  };
}

export function createLeaveMessage(): LeaveMessage {
  return {
    type: MessageType.LEAVE
  };
}

export function encodeMessage(message: ClientMessage): string {
  return JSON.stringify(message);
}

export function decodeMessage(data: string): ServerMessage {
  return JSON.parse(data) as ServerMessage;
}

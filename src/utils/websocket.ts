import { io, Socket } from 'socket.io-client';

let socket: Socket | null = null;

export const initializeWebSocket = (campaignId: string, onActionCompleted: (data: any) => void) => {
  const WEBSOCKET_URL = process.env.REACT_APP_WEBSOCKET_URL || 'http://localhost:3001';
  
  socket = io(WEBSOCKET_URL);
  
  socket.on('connect', () => {
    console.log('WebSocket connected');
    if (socket) {  // Add this null check
      socket.emit('join_campaign', campaignId);
    }
  });

  if (socket) {  // Add this null check
    socket.on('action_completed', (data: any) => {
      onActionCompleted(data);
    });
  }

  return () => {
    if (socket) {
      socket.disconnect();
    }
  };
};

export const emitAction = (event: string, data: any) => {
  if (socket) {
    socket.emit(event, data);
  }
};

export const getIO = (): Socket | null => {
  return socket;
};

// Add this function to handle room emissions
export const emitToRoom = (room: string, event: string, data: any) => {
  if (socket) {
    socket.emit('emit_to_room', { room, event, data });
  }
};
import { Handshake } from 'socket.io/dist/socket';

// Extend the Socket.IO types to include our custom properties
declare module 'socket.io' {
  interface Handshake {
    user?: {
      id: string;
      tenantId: string;
      [key: string]: any;
    };
  }
}

export interface WsClient {
  id: string;
  orgId: string;
  userId?: string;
  connectionTime: Date;
}

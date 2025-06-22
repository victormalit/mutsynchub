import 'socket.io';

declare module 'socket.io' {
  interface Socket {
    data: {
      user?: {
        id: string;
        tenantId: string;
        [key: string]: any;
      };
    };
  }
  
  interface Handshake {
    user?: {
      id: string;
      tenantId: string;
      [key: string]: any;
    };
  }
}

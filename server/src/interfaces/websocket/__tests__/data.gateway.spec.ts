import { Test, TestingModule } from '@nestjs/testing';
import { DataGateway } from '../data.gateway';
import { ConnectionStateService } from '../connection-state.service';
import { Socket, Server } from 'socket.io';
import { WsException } from '@nestjs/websockets';
import { JwtAuthGuard } from '../../../common/guards/jwt-auth.guard';
import { JoinOrgDto, LeaveOrgDto, DataUpdateDto } from '../dto/websocket-events.dto';

jest.mock('socket.io');

describe('DataGateway', () => {
  let gateway: DataGateway;
  let connectionState: ConnectionStateService;
  let mockServer: Server;

  // Mock Socket.IO client
  const createMockClient = (overrides = {}) => ({
    id: 'test-client-id',
    handshake: {
      address: '127.0.0.1',
      auth: {
        token: 'test-token',
        user: {
          id: 'test-user-id',
          tenantId: 'test-tenant-id',
        },
      },
      headers: {},
      query: {},
      issued: Date.now(),
      secure: true,
      time: new Date().toISOString(),
      url: '/analytics',
      xdomain: false,
    },
    data: {
      user: {
        id: 'test-user-id',
        tenantId: 'test-tenant-id',
      },
    },
    join: jest.fn().mockImplementation(() => Promise.resolve()),
    leave: jest.fn().mockImplementation(() => Promise.resolve()),
    emit: jest.fn(),
    to: jest.fn(),
    disconnect: jest.fn(),
    connected: true,
    rooms: new Set(),
    ...overrides,
  }) as unknown as Socket;

  const mockClient = createMockClient();

  // Mock connection state service
  const mockConnectionState = {
    registerClient: jest.fn(),
    deregisterClient: jest.fn(),
    addSubscription: jest.fn(),
    removeSubscription: jest.fn(),
    getClientState: jest.fn(),
  };

  beforeEach(async () => {
    jest.clearAllMocks();

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        DataGateway,
        {
          provide: ConnectionStateService,
          useValue: mockConnectionState,
        },
      ],
    })
      .overrideGuard(JwtAuthGuard)
      .useValue({ canActivate: () => true })
      .compile();

    gateway = module.get<DataGateway>(DataGateway);
    connectionState = module.get<ConnectionStateService>(ConnectionStateService);

    // Mock WebSocketServer
    mockServer = {
      to: jest.fn().mockReturnThis(),
      emit: jest.fn(),
      use: jest.fn(),
      on: jest.fn(),
      engine: {},
    } as unknown as Server;
    (gateway as any).server = mockServer;
  });

  describe('handleConnection', () => {
    it('should accept connection with valid JWT token', async () => {
      const client = createMockClient({
        disconnect: jest.fn()
      });
      
      await gateway.handleConnection(client);

      expect(mockConnectionState.registerClient).toHaveBeenCalledWith(
        client.id,
        null
      );
      expect(client.disconnect).not.toHaveBeenCalled();
    });

    it('should reject connection without JWT token', async () => {
      const clientWithoutToken = createMockClient({
        handshake: { 
          address: '127.0.0.1',
          auth: {},
          headers: {} 
        },
        disconnect: jest.fn()
      });

      await gateway.handleConnection(clientWithoutToken);

      expect(mockConnectionState.registerClient).not.toHaveBeenCalled();
      expect(clientWithoutToken.disconnect).toHaveBeenCalled();
    });
  });

  describe('handleDisconnect', () => {
    it('should handle client disconnection properly', async () => {
      await gateway.handleDisconnect(mockClient);

      expect(mockConnectionState.deregisterClient).toHaveBeenCalledWith(
        mockClient.id
      );
    });
  });

  describe('handleJoinOrg', () => {
    const joinOrgDto: JoinOrgDto = {
      orgId: 'test-org-id',
    };

    it('should allow joining org when tenant matches', async () => {
      const client = createMockClient({
        data: {
          user: {
            id: 'test-user-id',
            tenantId: 'test-org-id'
          }
        }
      });

      const result = await gateway.handleJoinOrg(client, joinOrgDto);

      expect(client.join).toHaveBeenCalledWith(`org:${joinOrgDto.orgId}`);
      expect(mockConnectionState.registerClient).toHaveBeenCalledWith(
        client.id,
        joinOrgDto.orgId
      );
      expect(result).toEqual({
        success: true,
        message: 'Joined organization successfully',
      });
    });

    it('should prevent joining org with mismatched tenant', async () => {
      const client = createMockClient({
        data: {
          user: {
            id: 'test-user-id',
            tenantId: 'different-tenant-id'
          }
        }
      });

      await expect(gateway.handleJoinOrg(client, joinOrgDto)).rejects.toThrow(
        WsException
      );

      expect(client.join).not.toHaveBeenCalled();
      expect(mockConnectionState.registerClient).not.toHaveBeenCalled();
    });
  });

  describe('handleLeaveOrg', () => {
    const leaveOrgDto: LeaveOrgDto = {
      orgId: 'test-org-id',
    };

    it('should handle leaving org properly', async () => {
      const result = await gateway.handleLeaveOrg(mockClient, leaveOrgDto);

      expect(mockClient.leave).toHaveBeenCalledWith(`org:${leaveOrgDto.orgId}`);
      expect(mockConnectionState.deregisterClient).toHaveBeenCalledWith(
        mockClient.id
      );
      expect(result).toEqual({
        success: true,
        message: 'Left organization successfully',
      });
    });
  });

  describe('handleSubscribeToStream', () => {
    const streamData = {
      streamId: '123e4567-e89b-12d3-a456-426614174001',
    };

    it('should handle stream subscription properly', async () => {
      mockConnectionState.getClientState.mockReturnValue({
        id: mockClient.id,
        orgId: '123e4567-e89b-12d3-a456-426614174000',
      });

      const result = await gateway.handleSubscribeToStream(mockClient, {
        streamId: '123e4567-e89b-12d3-a456-426614174001'
      });

      expect(mockClient.join).toHaveBeenCalledWith(
        `stream:${streamData.streamId}`
      );
      expect(mockConnectionState.addSubscription).toHaveBeenCalledWith(
        mockClient.id,
        `stream:${streamData.streamId}`
      );
      expect(result).toEqual({
        success: true,
        message: 'Subscribed to stream successfully',
      });
    });

    it('should not add subscription if client state is missing', async () => {
      mockConnectionState.getClientState.mockReturnValue(null);

      const result = await gateway.handleSubscribeToStream(mockClient, streamData);

      expect(mockClient.join).toHaveBeenCalledWith(
        `stream:${streamData.streamId}`
      );
      expect(mockConnectionState.addSubscription).not.toHaveBeenCalled();
      expect(result).toEqual({
        success: true,
        message: 'Subscribed to stream successfully',
      });
    });
  });

  describe('handleUnsubscribeFromStream', () => {
    const streamData = {
      streamId: '123e4567-e89b-12d3-a456-426614174001',
    };

    it('should handle stream unsubscription properly', async () => {
      const result = await gateway.handleUnsubscribeFromStream(
        mockClient,
        streamData
      );

      expect(mockClient.leave).toHaveBeenCalledWith(
        `stream:${streamData.streamId}`
      );
      expect(mockConnectionState.removeSubscription).toHaveBeenCalledWith(
        mockClient.id,
        `stream:${streamData.streamId}`
      );
      expect(result).toEqual({
        success: true,
        message: 'Unsubscribed from stream successfully',
      });
    });
  });

  describe('broadcastToOrg', () => {
    it('should broadcast valid payload to organization', async () => {
      const orgId = '123e4567-e89b-12d3-a456-426614174000';
      const event = 'dataUpdate';
      const data: DataUpdateDto = {
        streamId: '123e4567-e89b-12d3-a456-426614174001',
        data: { value: 42 },
        eventType: 'metric',
        correlationId: '123e4567-e89b-12d3-a456-426614174002'
      };

      await gateway.broadcastToOrg(orgId, event, data);

      expect(mockServer.to).toHaveBeenCalledWith(`org:${orgId}`);
      expect(mockServer.emit).toHaveBeenCalledWith(event, data);
    });

    it('should throw error for invalid payload', async () => {
      const orgId = 'test-org-id';
      const event = 'dataUpdate';
      const invalidData = {}; // Missing required fields

      await expect(
        gateway.broadcastToOrg(orgId, event, invalidData)
      ).rejects.toThrow();
    });
  });

  describe('broadcastToStream', () => {
    it('should broadcast valid payload to stream', async () => {
      const streamId = '123e4567-e89b-12d3-a456-426614174003';
      const data: DataUpdateDto = {
        streamId,
        data: { value: 42 },
        eventType: 'metric',
        correlationId: '123e4567-e89b-12d3-a456-426614174004'
      };

      await gateway.broadcastToStream(streamId, data);

      expect(mockServer.to).toHaveBeenCalledWith(`stream:${streamId}`);
      expect(mockServer.emit).toHaveBeenCalledWith('streamUpdate', data);
    });

    it('should throw error for invalid payload', async () => {
      const streamId = 'test-stream-id';
      const invalidData = {} as DataUpdateDto; // Missing required fields

      await expect(gateway.broadcastToStream(streamId, invalidData)).rejects.toThrow();
    });
  });
});

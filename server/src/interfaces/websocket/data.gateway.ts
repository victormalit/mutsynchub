import { 
  WebSocketGateway, 
  WebSocketServer, 
  SubscribeMessage, 
  OnGatewayConnection,
  OnGatewayDisconnect,
  ConnectedSocket,
  MessageBody,
  WsException
} from '@nestjs/websockets';
import { UseGuards, Logger, ValidationPipe } from '@nestjs/common';
import { Server, Socket } from 'socket.io';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { ConnectionStateService } from './connection-state.service';
import { JoinOrgDto, LeaveOrgDto, DataUpdateDto, AnalyticsEventDto } from './dto/websocket-events.dto';
import { validate } from 'class-validator';
import { WsClient } from './types';

@WebSocketGateway({
  cors: {
    origin: process.env.FRONTEND_URL || 'http://localhost:5173',
    credentials: true,
  },
  namespace: '/analytics'
})
export class DataGateway implements OnGatewayConnection, OnGatewayDisconnect {
  private readonly logger = new Logger(DataGateway.name);

  @WebSocketServer()
  server: Server;

  constructor(
    private readonly connectionState: ConnectionStateService
  ) {}

  async handleConnection(client: Socket) {
    try {
      this.logger.log(`Client connected: id=${client.id}, ip=${client.handshake.address}`);
      // Optionally, enforce JWT on connect (token in query or headers)
      const token = client.handshake.auth?.token || client.handshake.headers['authorization'];
      if (!token) {
        this.logger.warn(`Connection rejected: missing JWT token for client ${client.id}`);
        client.disconnect();
        return;
      }
      // Optionally, validate token here (for extra security)
      // If using JwtAuthGuard on all messages, this is optional but recommended for early rejection
      // await this.jwtService.verifyAsync(token.replace('Bearer ', ''));
      await this.connectionState.registerClient(client.id, null);
      // Audit log
      this.logger.log(`WebSocket connection accepted: client=${client.id}`);
    } catch (error) {
      this.logger.error(`Error handling connection: ${(error as any).message}`, (error as any).stack);
      client.disconnect();
    }
  }

  async handleDisconnect(client: Socket) {
    try {
      this.logger.debug(`Client disconnected: ${client.id}`);
      this.connectionState.deregisterClient(client.id);
    } catch (error) {
      this.logger.error(`Error handling disconnection: ${(error as any).message}`, (error as any).stack);
    }
  }

  @UseGuards(JwtAuthGuard)
  @SubscribeMessage('joinOrg')
  async handleJoinOrg(
    @ConnectedSocket() client: Socket,
    @MessageBody(new ValidationPipe()) data: JoinOrgDto,
  ) {
    try {
      const { orgId } = data;
      // Get user data from auth context
      const authData = client.handshake.auth || {};
      const user = client.data?.user || authData.user;
      
      if (user?.tenantId && user.tenantId !== orgId) {
        this.logger.warn(`Tenant/org isolation violation: user=${user.id}, userTenant=${user.tenantId}, requestedOrg=${orgId}`);
        throw new WsException('Tenant/org mismatch');
      }
      await client.join(`org:${orgId}`);
      this.connectionState.registerClient(client.id, orgId);
      this.logger.log(`Client ${client.id} joined org ${orgId}`);
      return { success: true, message: 'Joined organization successfully' };
    } catch (error) {
      this.logger.error(`Error joining org: ${(error as any).message}`, (error as any).stack);
      throw new WsException((error as any).message);
    }
  }

  @UseGuards(JwtAuthGuard)
  @SubscribeMessage('leaveOrg')
  async handleLeaveOrg(
    @ConnectedSocket() client: Socket,
    @MessageBody(new ValidationPipe()) data: LeaveOrgDto,
  ) {
    try {
      const { orgId } = data;
      await client.leave(`org:${orgId}`);
      this.connectionState.deregisterClient(client.id);
      this.logger.log(`Client ${client.id} left org ${orgId}`);
      return { success: true, message: 'Left organization successfully' };
    } catch (error) {
      this.logger.error(`Error leaving org: ${(error as any).message}`, (error as any).stack);
      throw new WsException((error as any).message);
    }
  }

  @UseGuards(JwtAuthGuard)
  @SubscribeMessage('subscribeToStream')
  async handleSubscribeToStream(
    @ConnectedSocket() client: Socket,
    @MessageBody() data: { streamId: string },
  ) {
    try {
      const { streamId } = data;
      // Optionally, enforce org/tenant isolation here as well
      await client.join(`stream:${streamId}`);
      const clientState = this.connectionState.getClientState(client.id);
      if (clientState) {
        this.connectionState.addSubscription(client.id, `stream:${streamId}`);
      }
      this.logger.log(`Client ${client.id} subscribed to stream ${streamId}`);
      return { success: true, message: 'Subscribed to stream successfully' };
    } catch (error) {
      this.logger.error(`Error subscribing to stream: ${(error as any).message}`, (error as any).stack);
      throw new WsException((error as any).message);
    }
  }

  @UseGuards(JwtAuthGuard)
  @SubscribeMessage('unsubscribeFromStream')
  async handleUnsubscribeFromStream(
    @ConnectedSocket() client: Socket,
    @MessageBody() data: { streamId: string },
  ) {
    try {
      const { streamId } = data;
      await client.leave(`stream:${streamId}`);
      this.connectionState.removeSubscription(client.id, `stream:${streamId}`);
      this.logger.log(`Client ${client.id} unsubscribed from stream ${streamId}`);
      return { success: true, message: 'Unsubscribed from stream successfully' };
    } catch (error) {
      this.logger.error(`Error unsubscribing from stream: ${(error as any).message}`, (error as any).stack);
      throw new WsException((error as any).message);
    }
  }

  async broadcastToOrg(orgId: string, event: string, data: any) {
    try {
      const payload = event === 'dataUpdate' ? new DataUpdateDto() : new AnalyticsEventDto();
      Object.assign(payload, data);
      
      const errors = await validate(payload);
      if (errors.length > 0) {
        throw new Error(`Invalid payload: ${JSON.stringify(errors)}`);
      }

      this.server.to(`org:${orgId}`).emit(event, payload);
      this.logger.debug(`Broadcast to org ${orgId}: ${event}`);
    } catch (error) {
      this.logger.error(`Error broadcasting to org: ${(error as any).message}`, (error as any).stack);
      throw new WsException((error as any).message);
    }
  }

  async broadcastToStream(streamId: string, data: DataUpdateDto) {
    try {
      const payload = new DataUpdateDto();
      Object.assign(payload, data);
      
      const errors = await validate(payload);
      if (errors.length > 0) {
        throw new Error(`Invalid payload: ${JSON.stringify(errors)}`);
      }

      this.server.to(`stream:${streamId}`).emit('streamUpdate', payload);
      this.logger.debug(`Broadcast to stream ${streamId}`);
    } catch (error) {
      this.logger.error(`Error broadcasting to stream: ${(error as any).message}`, (error as any).stack);
      throw new WsException((error as any).message);
    }
  }
}

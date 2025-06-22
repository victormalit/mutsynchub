import { Injectable, Logger } from '@nestjs/common';
import { EventEmitter2 } from '@nestjs/event-emitter';

@Injectable()
export class ConnectionStateService {
  private readonly logger = new Logger(ConnectionStateService.name);
  private readonly clientStates = new Map<string, {
    orgId: string;
    lastActivity: Date;
    subscriptions: Set<string>;
  }>();

  constructor(private eventEmitter: EventEmitter2) {}

  registerClient(clientId: string, orgId: string) {
    this.clientStates.set(clientId, {
      orgId,
      lastActivity: new Date(),
      subscriptions: new Set(),
    });
    this.logger.debug(`Client ${clientId} registered for org ${orgId}`);
    this.eventEmitter.emit('client.connected', { clientId, orgId });
  }

  deregisterClient(clientId: string) {
    const state = this.clientStates.get(clientId);
    if (state) {
      this.eventEmitter.emit('client.disconnected', { 
        clientId, 
        orgId: state.orgId 
      });
      this.clientStates.delete(clientId);
      this.logger.debug(`Client ${clientId} deregistered`);
    }
  }

  updateActivity(clientId: string) {
    const state = this.clientStates.get(clientId);
    if (state) {
      state.lastActivity = new Date();
    }
  }

  getClientState(clientId: string) {
    return this.clientStates.get(clientId);
  }

  getOrgClients(orgId: string): string[] {
    return Array.from(this.clientStates.entries())
      .filter(([_, state]) => state.orgId === orgId)
      .map(([clientId]) => clientId);
  }

  addSubscription(clientId: string, topic: string) {
    const state = this.clientStates.get(clientId);
    if (state) {
      state.subscriptions.add(topic);
      this.logger.debug(`Client ${clientId} subscribed to ${topic}`);
    }
  }

  removeSubscription(clientId: string, topic: string) {
    const state = this.clientStates.get(clientId);
    if (state) {
      state.subscriptions.delete(topic);
      this.logger.debug(`Client ${clientId} unsubscribed from ${topic}`);
    }
  }

  getInactiveClients(threshold: number): string[] {
    const now = new Date();
    return Array.from(this.clientStates.entries())
      .filter(([_, state]) => {
        const inactive = now.getTime() - state.lastActivity.getTime() > threshold;
        return inactive;
      })
      .map(([clientId]) => clientId);
  }
}

import { Logger } from '../lib/logger';

type EventType = 'user-joined' | 'lead-update' | 'revenue-spike' | 'system-alert' | 'viewer-update';

interface RealTimeEvent {
  type: EventType;
  channel?: string;
  payload: unknown;
  timestamp: number;
}

type Listener = (event: RealTimeEvent) => void;

class RealTimeService {
  private listeners: Map<string, Set<Listener>> = new Map();
  private eventSource: EventSource | null = null;
  private isConnected: boolean = false;
  private reconnectTimer: NodeJS.Timeout | null = null;

  connect() {
    if (this.isConnected || this.eventSource) return;


    
    // Connect to the Edge Function or Fallback to Simulation
    this.eventSource = new EventSource('/api/events');

    this.eventSource.onopen = () => {
      Logger.info('[RealTime] Connected to Live API');
      this.isConnected = true;
    };

    this.eventSource.onmessage = (event) => {
      try {
        const data = JSON.parse(event.data);
        if (data.type === 'connected') return;
        const targetChannel = data.channel || 'global';
        this.broadcast(targetChannel, data);
      } catch (e) {
      Logger.error('[RealTime] Parse Error', e);
    }
  };

  this.eventSource.onerror = (_err) => {
    Logger.warn('[RealTime] Live API unreachable, switching to Client Simulation Mode.');
      this.disconnect();
      this.startSimulationMode();
    };
  }

  // Pure Client-Side Simulation for Static Hosting
  private startSimulationMode() {
    if (this.isConnected) return;
    this.isConnected = true;
    Logger.info('[RealTime] Simulation Mode Active');

    // Simulate events every 2 seconds
    this.reconnectTimer = setInterval(() => {
        const services = ['strategic-management', 'digital-transformation', 'corporate-training', 'consulting'];
        const serviceName = services[Math.floor(Math.random() * services.length)];
        const viewerCount = Math.floor(Math.random() * 15) + 3;

        const mockEvent: RealTimeEvent = {
            type: 'viewer-update',
            channel: `service:${serviceName}`,
            payload: { count: viewerCount, service: serviceName },
            timestamp: Date.now()
        };
        this.broadcast(mockEvent.channel || 'global', mockEvent);
    }, 2000);
  }


  disconnect() {
    this.isConnected = false;
    if (this.eventSource) {
      this.eventSource.close();
      this.eventSource = null;
    }
    if (this.reconnectTimer) clearTimeout(this.reconnectTimer);

  }

  subscribe(channel: string, listener: Listener) {
    // Auto-connect on first subscription
    if (!this.isConnected && !this.eventSource) {
      this.connect();
    }

    if (!this.listeners.has(channel)) {
      this.listeners.set(channel, new Set());
    }
    this.listeners.get(channel)!.add(listener);
    
    return () => {
      const channelListeners = this.listeners.get(channel);
      if (channelListeners) {
        channelListeners.delete(listener);
        if (channelListeners.size === 0) {
          this.listeners.delete(channel);
        }
      }
    };
  }

  // Overload for backward compatibility (defaults to 'global')
  subscribeGlobal(listener: Listener) {
    return this.subscribe('global', listener);
  }

  private broadcast(channel: string, event: RealTimeEvent) {
    const channelListeners = this.listeners.get(channel);
    if (channelListeners) {
      channelListeners.forEach(listener => listener(event));
    }
  }
}

export const realtimeService = new RealTimeService();

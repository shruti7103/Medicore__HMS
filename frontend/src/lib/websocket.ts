import { Client } from '@stomp/stompjs';

class WebSocketService {
    private client: Client | null = null;
    private subscriptions: Map<string, any> = new Map();
    private listeners: Map<string, Set<(message: any) => void>> = new Map();

    connect(token: string, onConnect: () => void, onError: (err: any) => void) {
        if (this.client && this.client.active) {
            if (this.client.connected) {
                onConnect();
            }
            return;
        }
        
        const wsUrl = import.meta.env.VITE_WS_URL ?? 
          ((window.location.protocol === 'https:' ? 'wss://' : 'ws://') + window.location.host + '/ws');

        this.client = new Client({
            brokerURL: wsUrl,
            connectHeaders: {
                Authorization: `Bearer ${token}`
            },
            onConnect: () => {
                onConnect();
                // Subscribe to all topics that have active listeners
                this.listeners.forEach((callbacks, topic) => {
                    this.subscribeToBroker(topic);
                });
            },
            onStompError: (frame) => {
                onError(frame);
            },
            onWebSocketError: (err) => {
                console.warn('WebSocket error (backend may not support WS):', err);
            },
        });
        this.client.activate();
    }

    private subscribeToBroker(topic: string) {
        if (!this.client || !this.client.connected || this.subscriptions.has(topic)) return;

        const sub = this.client.subscribe(topic, (msg) => {
            let parsed = null;
            if (msg.body) {
                try {
                    parsed = JSON.parse(msg.body);
                } catch {
                    parsed = msg.body;
                }
            }
            const callbacks = this.listeners.get(topic);
            if (callbacks) {
                callbacks.forEach(cb => {
                    try { cb(parsed); } catch (e) { console.error('Error in WS callback:', e); }
                });
            }
        });
        this.subscriptions.set(topic, sub);
    }

    subscribe(topic: string, callback: (message: any) => void) {
        if (!this.listeners.has(topic)) {
            this.listeners.set(topic, new Set());
        }
        this.listeners.get(topic)!.add(callback);

        // If client is already connected, subscribe directly to the broker
        if (this.client && this.client.connected) {
            this.subscribeToBroker(topic);
        }
    }

    unsubscribe(topic: string, callback?: (message: any) => void) {
        if (callback) {
            const callbacks = this.listeners.get(topic);
            if (callbacks) {
                callbacks.delete(callback);
                if (callbacks.size > 0) {
                    // There are still other listeners, so keep the subscription active
                    return;
                }
            }
        }

        // If no callback is specified or no callbacks remain, unsubscribe from the broker
        const sub = this.subscriptions.get(topic);
        if (sub) {
            sub.unsubscribe();
            this.subscriptions.delete(topic);
        }
        this.listeners.delete(topic);
    }

    sendMessage(destination: string, body: any) {
        if (this.client && this.client.active) {
            this.client.publish({ destination, body: JSON.stringify(body) });
        }
    }

    disconnect() {
        if (this.client) {
            this.client.deactivate();
            this.client = null;
            this.subscriptions.clear();
            this.listeners.clear();
        }
    }
}

export const wsService = new WebSocketService();

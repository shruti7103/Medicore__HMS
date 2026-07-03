import { Client } from '@stomp/stompjs';

class WebSocketService {
    private client: Client | null = null;
    private subscriptions: Map<string, any> = new Map();

    connect(token: string, onConnect: () => void, onError: (err: any) => void) {
        if (this.client && this.client.active) return;
        
        // Use native WebSocket — works in all modern browsers without SockJS
        this.client = new Client({
            brokerURL: 'ws://localhost:8080/ws',
            connectHeaders: {
                Authorization: `Bearer ${token}`
            },
            onConnect: () => {
                onConnect();
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

    subscribe(topic: string, callback: (message: any) => void) {
        if (!this.client || !this.client.active) {
            console.warn("WebSocket is not connected. Cannot subscribe to", topic);
            return;
        }
        
        if (this.subscriptions.has(topic)) return;

        const sub = this.client.subscribe(topic, (msg) => {
            if (msg.body) {
                callback(JSON.parse(msg.body));
            }
        });
        
        this.subscriptions.set(topic, sub);
    }

    unsubscribe(topic: string) {
        const sub = this.subscriptions.get(topic);
        if (sub) {
            sub.unsubscribe();
            this.subscriptions.delete(topic);
        }
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
        }
    }
}

export const wsService = new WebSocketService();

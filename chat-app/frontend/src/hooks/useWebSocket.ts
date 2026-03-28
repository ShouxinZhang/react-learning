import { useEffect, useRef, useCallback } from 'react';
import { useAuthStore } from '../stores/authStore';

type MessageHandler = (data: any) => void;

const WS_BASE = 'ws://localhost:8000/ws';

// ── Global singleton ──
let globalWs: WebSocket | null = null;
let globalReconnectTimeout: ReturnType<typeof setTimeout> | undefined;
let globalReconnectAttempts = 0;
const globalHandlers = new Set<MessageHandler>();

function globalConnect(token: string) {
  if (globalWs && (globalWs.readyState === WebSocket.CONNECTING || globalWs.readyState === WebSocket.OPEN)) {
    return; // already connected
  }

  const ws = new WebSocket(`${WS_BASE}?token=${token}`);
  globalWs = ws;

  ws.onopen = () => {
    console.log('[WS] Connected');
    globalReconnectAttempts = 0;
  };

  ws.onmessage = (event) => {
    try {
      const data = JSON.parse(event.data);
      globalHandlers.forEach((h) => h(data));
    } catch (e) {
      console.error('[WS] Parse error:', e);
    }
  };

  ws.onclose = (event) => {
    console.log('[WS] Disconnected:', event.code);
    globalWs = null;

    if (event.code !== 4001 && useAuthStore.getState().isAuthenticated) {
      const delay = Math.min(1000 * Math.pow(2, globalReconnectAttempts), 30000);
      globalReconnectAttempts++;
      globalReconnectTimeout = setTimeout(() => {
        const t = useAuthStore.getState().token;
        if (t) globalConnect(t);
      }, delay);
    }
  };

  ws.onerror = () => {
    ws.close();
  };
}

function globalDisconnect() {
  clearTimeout(globalReconnectTimeout);
  if (globalWs) {
    globalWs.close();
    globalWs = null;
  }
}

export function globalSend(data: Record<string, unknown>) {
  if (globalWs?.readyState === WebSocket.OPEN) {
    globalWs.send(JSON.stringify(data));
  }
}

export function useWebSocket(onMessage?: MessageHandler) {
  const token = useAuthStore((s) => s.token);
  const isAuthenticated = useAuthStore((s) => s.isAuthenticated);
  const onMessageRef = useRef(onMessage);
  onMessageRef.current = onMessage;

  useEffect(() => {
    if (!onMessageRef.current) return;
    const handler: MessageHandler = (data) => onMessageRef.current?.(data);
    globalHandlers.add(handler);
    return () => { globalHandlers.delete(handler); };
  }, []);

  useEffect(() => {
    if (token && isAuthenticated) {
      globalConnect(token);
    } else {
      globalDisconnect();
    }
  }, [token, isAuthenticated]);

  const send = useCallback((data: Record<string, unknown>) => {
    globalSend(data);
  }, []);

  return { send };
}

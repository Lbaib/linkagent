import { create } from 'zustand';
import type { Message } from './chatStore';

export interface AgentSession {
  id: string;
  name: string;
  status: 'queuing' | 'agent_chat';
  queuePosition?: number;
  messages: Message[];
}

interface AgentState {
  wsStatus: 'disconnected' | 'connecting' | 'connected';
  agentState: 'online' | 'busy' | 'offline';
  sessions: AgentSession[];
  selectedSessionId: string | null;
  lastError: string | null;
  ws: WebSocket | null;
  agentConfig: { maxConcurrent: number };
  metrics: { activeConnections: number; totalRequests: number };
  activeSessions: AgentSession[];
  queuedSessions: AgentSession[];
  connect: () => void;
  disconnect: () => void;
  setAgentState: (state: 'online' | 'busy' | 'offline') => void;
  setSelectedSessionId: (id: string | null) => void;
  acceptSession: (sessionId: string) => void;
  closeSessionByAgent: (sessionId: string) => void;
  sendAgentMessage: (sessionId: string, text: string) => void;
}

const now = () => new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });

const derive = (sessions: AgentSession[]) => ({
  sessions,
  activeSessions: sessions.filter((s) => s.status === 'agent_chat'),
  queuedSessions: sessions.filter((s) => s.status === 'queuing'),
  metrics: {
    activeConnections: sessions.filter((s) => s.status === 'agent_chat').length,
    totalRequests: sessions.reduce((total, s) => total + s.messages.length, 0)
  }
});

const withMessage = (sessions: AgentSession[], sessionId: string, message: Message) =>
  sessions.map((s) => (s.id === sessionId ? { ...s, messages: [...s.messages, message] } : s));

export const useAgentStore = create<AgentState>((set, get) => ({
  wsStatus: 'disconnected',
  agentState: 'online',
  sessions: [],
  selectedSessionId: null,
  lastError: null,
  ws: null,
  agentConfig: { maxConcurrent: 5 },
  metrics: { activeConnections: 0, totalRequests: 0 },
  activeSessions: [],
  queuedSessions: [],

  connect: () => {
    if (get().ws) return;

    const token = localStorage.getItem('accessToken');
    if (!token) {
      set({ wsStatus: 'disconnected', lastError: '未检测到登录状态，请重新登录。' });
      return;
    }

    set({ wsStatus: 'connecting', lastError: null });
    const ws = new WebSocket(`ws://${window.location.host}/ws/chat?token=${token}`);

    ws.onopen = () => {
      set({ wsStatus: 'connected' });
      ws.send(JSON.stringify({ type: 'AGENT_READY' }));
    };

    ws.onmessage = (event) => {
      try {
        const data = JSON.parse(event.data);
        if (data.type === 'SESSION_OFFER') {
          const visitorId: string = data.payload.visitorId;
          set((state) => {
            if (state.sessions.some((s) => s.id === visitorId)) return state;
            const session: AgentSession = {
              id: visitorId,
              name: `访客 ${visitorId.slice(-6)}`,
              status: 'queuing',
              queuePosition: state.sessions.filter((s) => s.status === 'queuing').length + 1,
              messages: []
            };
            return derive([...state.sessions, session]);
          });
        } else if (data.type === 'CHAT') {
          const visitorId: string = data.payload.visitorId;
          set((state) => derive(withMessage(state.sessions, visitorId, {
            id: `in-${Date.now()}`,
            sender: data.payload.sender || 'system',
            text: data.payload.text,
            timestamp: now()
          })));
        } else if (data.type === 'ERROR') {
          set({ lastError: data.payload.message });
        }
      } catch (e) {
        console.error('Agent WebSocket message parsing failed', e);
      }
    };

    ws.onclose = () => set({ wsStatus: 'disconnected', ws: null });
    ws.onerror = () => set({ wsStatus: 'disconnected', lastError: '客服连接中断，请刷新页面。' });

    set({ ws });
  },

  disconnect: () => {
    const { ws } = get();
    if (ws) ws.close();
    set({ wsStatus: 'disconnected', ws: null });
  },

  setAgentState: (agentState) => set({ agentState }),

  setSelectedSessionId: (selectedSessionId) => set({ selectedSessionId }),

  acceptSession: (sessionId) => {
    set((state) => derive(state.sessions.map((s) =>
      s.id === sessionId ? { ...s, status: 'agent_chat', queuePosition: undefined } : s)));
    set({ selectedSessionId: sessionId });
  },

  closeSessionByAgent: (sessionId) => {
    set((state) => derive(state.sessions.filter((s) => s.id !== sessionId)));
    if (get().selectedSessionId === sessionId) {
      set({ selectedSessionId: null });
    }
  },

  sendAgentMessage: (sessionId, text) => {
    const { ws, wsStatus } = get();
    if (wsStatus !== 'connected' || !ws) return;

    ws.send(JSON.stringify({ type: 'CHAT', payload: { text, visitorId: sessionId } }));
    set((state) => derive(withMessage(state.sessions, sessionId, {
      id: `agent-${Date.now()}`,
      sender: 'agent',
      text,
      timestamp: now()
    })));
  }
}));

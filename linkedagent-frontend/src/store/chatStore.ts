import { create } from 'zustand';
import { authApi } from '../api/auth';

export interface Message {
  id: string;
  sender: 'visitor' | 'ai' | 'agent' | 'system';
  text: string;
  timestamp: string;
  isStreaming?: boolean;
}

interface ChatState {
  wsStatus: 'disconnected' | 'connecting' | 'connected';
  sessionStatus: 'ai_chat' | 'queuing' | 'agent_chat' | 'offline_leave';
  messages: Message[];
  ws: WebSocket | null;
  visitorId: string | null;
  lastError: string | null;
  connect: () => Promise<void>;
  disconnect: () => void;
  sendMessage: (text: string) => void;
  requestTransfer: () => void;
  _pushMessage: (msg: Message) => void;
}

const VISITOR_TOKEN_KEY = 'visitorToken';
const VISITOR_ID_KEY = 'visitorId';

const now = () => new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });

export const useChatStore = create<ChatState>((set, get) => ({
  wsStatus: 'disconnected',
  sessionStatus: 'ai_chat',
  messages: [{
    id: 'welcome',
    sender: 'ai',
    text: '您好！我是 LinkedAgent 智能客服助手。请问有什么可以帮您？',
    timestamp: now()
  }],
  ws: null,
  visitorId: null,
  lastError: null,

  connect: async () => {
    if (get().ws) return;

    set({ wsStatus: 'connecting', lastError: null });

    let token = sessionStorage.getItem(VISITOR_TOKEN_KEY);
    let visitorId = sessionStorage.getItem(VISITOR_ID_KEY);

    if (!token) {
      try {
        const anonymous = await authApi.getAnonymousToken();
        token = anonymous.token;
        visitorId = anonymous.visitorId;
        sessionStorage.setItem(VISITOR_TOKEN_KEY, token);
        sessionStorage.setItem(VISITOR_ID_KEY, visitorId);
      } catch {
        set({
          wsStatus: 'disconnected',
          lastError: '无法获取访客身份，请稍后重试。'
        });
        return;
      }
    }

    const ws = new WebSocket(`ws://${window.location.host}/ws/chat?token=${token}`);

    ws.onopen = () => set({ wsStatus: 'connected' });

    ws.onmessage = (event) => {
      try {
        const data = JSON.parse(event.data);
        if (data.type === 'AI_STREAM') {
          set((state) => {
            const msgs = [...state.messages];
            const lastMsg = msgs[msgs.length - 1];
            if (lastMsg && lastMsg.sender === 'ai' && lastMsg.isStreaming) {
              msgs[msgs.length - 1] = {
                ...lastMsg,
                text: data.payload.text,
                isStreaming: !data.payload.isDone
              };
            } else {
              msgs.push({
                id: `ai-${Date.now()}`,
                sender: 'ai',
                text: data.payload.text,
                timestamp: now(),
                isStreaming: !data.payload.isDone
              });
            }
            return { messages: msgs };
          });
        } else if (data.type === 'STATUS_UPDATE') {
          set({ sessionStatus: data.payload.status });
        } else if (data.type === 'CHAT') {
          set((state) => ({
            messages: [...state.messages, {
              id: `chat-${Date.now()}`,
              sender: data.payload.sender || 'system',
              text: data.payload.text,
              timestamp: now()
            }]
          }));
        } else if (data.type === 'ERROR') {
          set((state) => ({
            lastError: data.payload.message,
            messages: [...state.messages, {
              id: `error-${Date.now()}`,
              sender: 'system',
              text: data.payload.message,
              timestamp: now()
            }]
          }));
        }
      } catch (e) {
        console.error('WebSocket message parsing failed', e);
      }
    };

    ws.onclose = () => set({ wsStatus: 'disconnected', ws: null });

    ws.onerror = () => set({ wsStatus: 'disconnected', lastError: '连接中断，请重新打开会话。' });

    set({ ws, visitorId });
  },

  disconnect: () => {
    const { ws } = get();
    if (ws) {
      ws.close();
    }
    set({ wsStatus: 'disconnected', ws: null });
  },

  sendMessage: (text: string) => {
    const { ws, wsStatus } = get();
    if (wsStatus !== 'connected' || !ws) return;

    set((state) => ({
      messages: [...state.messages, {
        id: `visitor-${Date.now()}`,
        sender: 'visitor',
        text,
        timestamp: now()
      }]
    }));
    ws.send(JSON.stringify({ type: 'CHAT', payload: { text } }));
  },

  requestTransfer: () => {
    const { ws, wsStatus } = get();
    if (wsStatus !== 'connected' || !ws) return;

    ws.send(JSON.stringify({ type: 'TRANSFER_AGENT' }));
    set({ sessionStatus: 'queuing' });
  },

  _pushMessage: (msg: Message) => {
    set((state) => ({ messages: [...state.messages, msg] }));
  }
}));


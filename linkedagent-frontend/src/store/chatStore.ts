import { create } from 'zustand';

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
  connect: () => void;
  disconnect: () => void;
  sendMessage: (text: string) => void;
  requestTransfer: () => void;
  _pushMessage: (msg: Message) => void; // For testing and internal use
}

export const useChatStore = create<ChatState>((set, get) => ({
  wsStatus: 'disconnected',
  sessionStatus: 'ai_chat',
  messages: [{
    id: 'welcome',
    sender: 'ai',
    text: '您好！我是 LinkedAgent 智能客服助手。请问有什么可以帮您？',
    timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
  }],
  ws: null,

  connect: () => {
    if (get().ws) return;
    
    set({ wsStatus: 'connecting' });
    const ws = new WebSocket(`ws://${window.location.host}/ws`);
    
    ws.onopen = () => {
      set({ wsStatus: 'connected' });
    };

    ws.onmessage = (event) => {
      try {
        const data = JSON.parse(event.data);
        if (data.type === 'AI_STREAM') {
          set((state) => {
            const msgs = [...state.messages];
            const lastMsg = msgs[msgs.length - 1];
            if (lastMsg && lastMsg.sender === 'ai' && lastMsg.isStreaming) {
               lastMsg.text = data.payload.text;
               lastMsg.isStreaming = !data.payload.isDone;
            } else {
               msgs.push({
                 id: `ai-${Date.now()}`,
                 sender: 'ai',
                 text: data.payload.text,
                 timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
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
                 id: `sys-${Date.now()}`,
                 sender: data.payload.sender || 'system',
                 text: data.payload.text,
                 timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
              }]
           }));
        }
      } catch (e) {
        console.error('WebSocket message parsing failed', e);
      }
    };

    ws.onclose = () => {
      set({ wsStatus: 'disconnected', ws: null });
    };

    ws.onerror = () => {
      set({ wsStatus: 'disconnected' });
    };

    set({ ws });
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
    if (wsStatus === 'connected' && ws) {
      const msg: Message = {
        id: `visitor-${Date.now()}`,
        sender: 'visitor',
        text,
        timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
      };
      set((state) => ({ messages: [...state.messages, msg] }));
      ws.send(JSON.stringify({ type: 'CHAT', payload: { text } }));
    }
  },

  requestTransfer: () => {
    const { ws, wsStatus } = get();
    if (wsStatus === 'connected' && ws) {
      ws.send(JSON.stringify({ type: 'TRANSFER_AGENT' }));
      // Optimistically show queue
      set({ sessionStatus: 'queuing' });
    }
  },
  
  _pushMessage: (msg: Message) => {
      set((state) => ({ messages: [...state.messages, msg] }));
  }
}));

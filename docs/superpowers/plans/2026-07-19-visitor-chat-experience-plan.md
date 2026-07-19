# Visitor Chat Experience Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** 将前端访客聊天组件 (VisitorClient) 与真实的后端 WebSocket 网关打通，使用 Zustand 进行高性能的状态管理，并实现流式 AI 输出与转人工排队逻辑。

**Architecture:** 
引入 `zustand` 管理高频更新的聊天流状态（以避免 React Context 的性能损耗）。在 `chatStore` 内封装 `WebSocket`，处理 `CHAT`、`TRANSFER_AGENT` 动作，并接收 `AI_STREAM` 和 `STATUS_UPDATE` 事件，以非阻塞地更新 UI 组件。

**Tech Stack:** React, Zustand, WebSocket, Vite

## Global Constraints

- 使用 TypeScript 编写，严格定义接口
- 使用 Vitest 和 React Testing Library 编写测试
- 测试必须全部通过 (npm test)
- 遵循现有的 Tailwind CSS 样式规范
- 禁止留下任何 TBD 或 TODO，必须完成实际代码

---

### Task 1: 安装依赖并配置代理

**Files:**
- Modify: `e:\SDD+Harness\LinkAgent\linkedagent-frontend\package.json`
- Modify: `e:\SDD+Harness\LinkAgent\linkedagent-frontend\vite.config.ts`

**Interfaces:**
- Consumes: N/A
- Produces: 提供 `zustand` 库，并在 vite 中配置 `/ws` 路由代理至后端的 websocket 端口 (例如 `ws://127.0.0.1:8085`)。

- [ ] **Step 1: 安装 Zustand 依赖**

运行: `npm install zustand`
预期: `package.json` 增加 `zustand` 依赖。

- [ ] **Step 2: 配置 vite 代理**

修改 `vite.config.ts`，增加 `/ws` 代理:

```typescript
import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'

// https://vite.dev/config/
export default defineConfig({
  plugins: [react(), tailwindcss()],
  server: {
    proxy: {
      '/api': {
        target: 'http://127.0.0.1:8080',
        changeOrigin: true,
      },
      '/ws': {
        target: 'ws://127.0.0.1:8085',
        ws: true,
      }
    }
  },
  test: {
    environment: 'jsdom',
    setupFiles: ['./src/setupTests.ts'],
    globals: true
  }
})
```

- [ ] **Step 3: 提交代码**

```bash
git add package.json package-lock.json vite.config.ts
git commit -m "chore: install zustand and configure websocket proxy"
```

---

### Task 2: 创建 Zustand ChatStore 和 WebSocket 管理

**Files:**
- Create: `e:\SDD+Harness\LinkAgent\linkedagent-frontend\src\store\chatStore.ts`
- Create: `e:\SDD+Harness\LinkAgent\linkedagent-frontend\src\store\chatStore.test.ts`

**Interfaces:**
- Consumes: N/A
- Produces: 
  - `useChatStore()` Hook，暴露给 `VisitorClient`。
  - `ChatState` 接口定义，包含 `wsStatus`, `sessionStatus`, `messages`, `connect()`, `disconnect()`, `sendMessage()`, `requestTransfer()`。
  - `Message` 接口。

- [ ] **Step 1: 编写测试用例**

创建 `src/store/chatStore.test.ts`:

```typescript
import { renderHook, act } from '@testing-library/react';
import { useChatStore } from './chatStore';

describe('chatStore', () => {
  it('should initialize with disconnected status', () => {
    const { result } = renderHook(() => useChatStore());
    expect(result.current.wsStatus).toBe('disconnected');
    expect(result.current.sessionStatus).toBe('ai_chat');
    expect(result.current.messages).toHaveLength(1);
  });
  
  it('should append visitor message and update status', () => {
    const { result } = renderHook(() => useChatStore());
    act(() => {
      // simulate internal push
      result.current._pushMessage({
        id: 'msg-1',
        sender: 'visitor',
        text: 'hello',
        timestamp: '10:00'
      });
    });
    expect(result.current.messages).toHaveLength(2);
    expect(result.current.messages[1].text).toBe('hello');
  });
});
```

- [ ] **Step 2: 运行测试确保失败**

运行: `npm test src/store/chatStore.test.ts`
预期: 失败（找不到文件或未定义 useChatStore）

- [ ] **Step 3: 实现 chatStore.ts**

创建 `src/store/chatStore.ts`:

```typescript
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
```

- [ ] **Step 4: 运行测试确保成功**

运行: `npm test src/store/chatStore.test.ts`
预期: PASS

- [ ] **Step 5: 提交代码**

```bash
git add src/store/chatStore.ts src/store/chatStore.test.ts
git commit -m "feat: implement Zustand chat store for WebSocket"
```

---

### Task 3: 重构 VisitorClient 组件

**Files:**
- Modify: `e:\SDD+Harness\LinkAgent\linkedagent-frontend\src\components\VisitorClient.tsx`
- Modify: `e:\SDD+Harness\LinkAgent\linkedagent-frontend\src\pages\AdminConsole\AdminConsole.test.tsx` (如果受波及，但大概率不需要，只是安全检查)

**Interfaces:**
- Consumes: `useChatStore` from `src/store/chatStore.ts`
- Produces: 移除了 `useSimulation`，UI 层与后端通过 Zustand 完全打通。

- [ ] **Step 1: 运行现有的相关组件测试，确保我们了解重构范围**

运行: `npm test`
预期: 收集依赖了 SimulationContext 的任何其他组件。不过由于我们只重构 VisitorClient，对其他页面的模拟暂时保留（因为座席和管理后台的对接还没做）。

- [ ] **Step 2: 修改 VisitorClient.tsx**

打开 `src/components/VisitorClient.tsx`，进行如下替换：

```typescript
import React, { useState, useRef, useEffect } from 'react';
import { useChatStore } from '../store/chatStore';
import { Send, User, Cpu, Headphones, RefreshCw, Star, AlertTriangle, Wifi, WifiOff, X, MessageCircle } from 'lucide-react';

interface VisitorClientProps {
  isOpen: boolean;
  onClose: () => void;
}

export const VisitorClient: React.FC<VisitorClientProps> = ({ isOpen, onClose }) => {
  const { wsStatus, sessionStatus, messages, connect, disconnect, sendMessage, requestTransfer } = useChatStore();

  const [input, setInput] = useState('');
  const [offlineName, setOfflineName] = useState('');
  const [offlineEmail, setOfflineEmail] = useState('');
  const [offlineMessage, setOfflineMessage] = useState('');
  const [rating, setRating] = useState(5);
  const [hoverRating, setHoverRating] = useState<number | null>(null);
  const [feedbackText, setFeedbackText] = useState('');

  const chatEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (isOpen && wsStatus === 'disconnected') {
      connect();
    }
  }, [isOpen, wsStatus, connect]);

  useEffect(() => {
    chatEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, isOpen]);

  const handleSend = (e: React.FormEvent) => {
    e.preventDefault();
    if (!input.trim()) return;
    sendMessage(input);
    setInput('');
  };

  const handleLeaveSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!offlineName || !offlineEmail || !offlineMessage) return;
    // Mock leave submit for now
    alert('留言已提交：' + offlineMessage);
  };

  const handleFeedbackSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    // Mock feedback for now
    alert('反馈已提交：' + feedbackText);
  };

  if (!isOpen) return null;

  return (
    <div className="fixed bottom-6 right-6 w-full max-w-[400px] h-[600px] max-h-[85vh] bg-white rounded-3xl overflow-hidden shadow-premium-lg border border-gray-200 flex flex-col z-50 transition-all">
      {/* Header */}
      <div className="flex items-center justify-between px-6 py-5 border-b border-gray-100 bg-white">
        <div className="flex items-center gap-3">
          <div className="relative">
            <div className="w-12 h-12 rounded-full bg-purple-50 flex items-center justify-center">
              <Cpu className="w-6 h-6 text-purple-600" />
            </div>
            <div className={`absolute bottom-0 right-0 w-3 h-3 rounded-full border-2 border-white ${
              wsStatus === 'connected' ? 'bg-green-500' : wsStatus === 'connecting' ? 'bg-yellow-500' : 'bg-red-500'
            }`} />
          </div>
          <div>
            <h3 className="text-lg font-bold text-gray-900">官方客服</h3>
            <p className="text-xs text-gray-500 flex items-center gap-1 mt-0.5 font-medium">
              {wsStatus === 'connected' ? (
                <><Wifi className="w-3 h-3 text-green-500" />安全通道已连接</>
              ) : wsStatus === 'connecting' ? (
                <><RefreshCw className="w-3 h-3 text-yellow-500 animate-spin" />连接中...</>
              ) : (
                <><WifiOff className="w-3 h-3 text-red-500" />已断开</>
              )}
            </p>
          </div>
        </div>
        <div className="flex items-center gap-2">
            <button 
                onClick={connect}
                className="p-2 rounded-full hover:bg-gray-100 text-gray-500 transition-colors cursor-pointer"
                title="重新连接"
            >
                <RefreshCw className="w-5 h-5" />
            </button>
            <button 
                onClick={onClose}
                className="p-2 rounded-full hover:bg-gray-100 text-gray-500 transition-colors cursor-pointer"
                title="关闭"
            >
                <X className="w-5 h-5" />
            </button>
        </div>
      </div>

      {/* Messages */}
      <div className="flex-1 overflow-y-auto p-5 space-y-5 bg-gray-50/50">
        {messages.length === 0 && (
             <div className="text-center py-10">
                 <div className="w-16 h-16 bg-purple-100 text-purple-600 rounded-full flex items-center justify-center mx-auto mb-4">
                     <MessageCircle className="w-8 h-8" />
                 </div>
                 <h4 className="text-lg font-bold text-gray-900">有什么可以帮您？</h4>
                 <p className="text-sm text-gray-500 mt-2 px-4">您可以咨询产品功能、售后政策，或者直接呼叫人工服务。</p>
             </div>
        )}
        {messages.map((msg) => {
          const isVisitor = msg.sender === 'visitor';
          const isSystem = msg.sender === 'system';
          
          if (isSystem) {
            return (
              <div key={msg.id} className="flex justify-center my-3">
                <div className="text-xs px-4 py-1.5 rounded-full bg-gray-200 text-gray-600 font-medium">
                  {msg.text}
                </div>
              </div>
            );
          }

          return (
            <div key={msg.id} className={`flex gap-3 max-w-[85%] ${isVisitor ? 'ml-auto flex-row-reverse' : 'mr-auto'}`}>
              <div className={`w-8 h-8 rounded-full flex items-center justify-center flex-shrink-0 mt-1 ${
                isVisitor ? 'bg-gray-200 text-gray-500' : msg.sender === 'ai' ? 'bg-purple-100 text-purple-600' : 'bg-blue-100 text-blue-600'
              }`}>
                {isVisitor ? <User className="w-4 h-4" /> : msg.sender === 'ai' ? <Cpu className="w-4 h-4" /> : <Headphones className="w-4 h-4" />}
              </div>

              <div className="flex flex-col">
                <div className={`px-4 py-2.5 rounded-2xl shadow-sm text-[15px] ${
                  isVisitor 
                    ? 'bg-purple-600 text-white rounded-tr-sm' 
                    : 'bg-white text-gray-800 rounded-tl-sm border border-gray-200'
                }`}>
                  <p className="whitespace-pre-wrap leading-relaxed">{msg.text}</p>
                  {msg.isStreaming && <span className="inline-block w-1.5 h-4 ml-1.5 bg-gray-400 animate-pulse align-middle" />}
                </div>
                <span className={`text-[10px] mt-1.5 text-gray-400 ${isVisitor ? 'text-right' : 'text-left'}`}>
                  {msg.timestamp}
                </span>
              </div>
            </div>
          );
        })}
        <div ref={chatEndRef} />
      </div>

      {/* Input Area */}
      {sessionStatus === 'ai_chat' && (
        <div className="p-4 bg-white border-t border-gray-100">
          <div className="flex items-center justify-between mb-3 px-1">
             <span className="text-gray-500 flex items-center gap-1.5 text-xs font-medium">
              <Cpu className="w-3.5 h-3.5 text-purple-600" /> AI 助手
            </span>
            <button
              onClick={requestTransfer}
              className="text-purple-600 hover:text-purple-700 font-medium text-xs flex items-center gap-1 transition-colors cursor-pointer"
            >
              <Headphones className="w-3.5 h-3.5" />转人工
            </button>
          </div>
          <form onSubmit={handleSend} className="flex gap-2 relative">
            <input
              type="text"
              value={input}
              onChange={(e) => setInput(e.target.value)}
              disabled={wsStatus !== 'connected'}
              placeholder={wsStatus === 'connected' ? "输入消息..." : "已断开"}
              className="flex-1 bg-gray-50 border border-gray-200 focus:border-purple-500 focus:ring-1 focus:ring-purple-200 outline-none rounded-xl pl-4 pr-12 py-3 text-sm text-gray-900 transition-all"
            />
            <button
              type="submit"
              disabled={!input.trim() || wsStatus !== 'connected'}
              className="absolute right-1.5 top-1.5 bottom-1.5 px-3 bg-purple-600 hover:bg-purple-700 disabled:bg-gray-300 text-white rounded-lg font-bold transition-all flex items-center justify-center cursor-pointer"
            >
              <Send className="w-4 h-4" />
            </button>
          </form>
        </div>
      )}

      {sessionStatus === 'queuing' && (
        <div className="p-6 bg-white border-t border-gray-100 flex flex-col items-center text-center space-y-4">
          <div className="w-12 h-12 bg-purple-50 rounded-full flex items-center justify-center">
            <Headphones className="w-6 h-6 text-purple-600 animate-pulse" />
          </div>
          <div>
            <h4 className="text-lg font-bold text-gray-900">排队中</h4>
            <p className="text-sm text-gray-500 mt-1">
              正在为您转接人工客服，请稍候...
            </p>
          </div>
        </div>
      )}

      {sessionStatus === 'agent_chat' && (
        <div className="p-4 bg-blue-50 border-t border-blue-100">
           <div className="flex items-center gap-1.5 mb-3 px-1 text-blue-700 text-xs font-medium">
              <Headphones className="w-3.5 h-3.5" /> 已接通人工客服
           </div>
           <form onSubmit={handleSend} className="flex gap-2 relative">
            <input
              type="text"
              value={input}
              onChange={(e) => setInput(e.target.value)}
              disabled={wsStatus !== 'connected'}
              placeholder="输入消息..."
              className="flex-1 bg-white border border-blue-200 focus:border-blue-500 focus:ring-1 focus:ring-blue-200 outline-none rounded-xl pl-4 pr-12 py-3 text-sm text-gray-900"
            />
            <button
              type="submit"
              disabled={!input.trim() || wsStatus !== 'connected'}
              className="absolute right-1.5 top-1.5 bottom-1.5 px-3 bg-blue-600 hover:bg-blue-700 disabled:bg-gray-300 text-white rounded-lg transition-all flex items-center justify-center cursor-pointer"
            >
              <Send className="w-4 h-4" />
            </button>
          </form>
        </div>
      )}
      
      {sessionStatus === 'offline_leave' && (
         <form onSubmit={handleLeaveSubmit} className="p-6 bg-white border-t border-gray-100 space-y-4">
            <div className="flex items-center gap-2 text-sm text-gray-900 font-bold">
               <AlertTriangle className="w-5 h-5 text-yellow-500" /> 客服离线，请留言
            </div>
            <div className="grid grid-cols-2 gap-3">
              <input type="text" required value={offlineName} onChange={e=>setOfflineName(e.target.value)} placeholder="姓名" className="bg-gray-50 border border-gray-200 rounded-lg px-3 py-2 text-sm outline-none focus:border-purple-500" />
              <input type="email" required value={offlineEmail} onChange={e=>setOfflineEmail(e.target.value)} placeholder="邮箱" className="bg-gray-50 border border-gray-200 rounded-lg px-3 py-2 text-sm outline-none focus:border-purple-500" />
            </div>
            <textarea required rows={3} value={offlineMessage} onChange={e=>setOfflineMessage(e.target.value)} placeholder="描述问题..." className="w-full bg-gray-50 border border-gray-200 rounded-lg px-3 py-2 text-sm outline-none focus:border-purple-500 resize-none" />
            <div className="flex justify-end gap-2 pt-1">
              <button type="submit" className="px-4 py-2 rounded-lg bg-purple-600 hover:bg-purple-700 text-white text-sm font-bold cursor-pointer">提交</button>
            </div>
         </form>
      )}
    </div>
  );
};
```

- [ ] **Step 3: 运行并验证所有的测试均依然通过**

运行: `npm test`
预期: PASS

- [ ] **Step 4: 提交代码**

```bash
git add src/components/VisitorClient.tsx
git commit -m "refactor: transition VisitorClient from mock context to Zustand chatStore"
```

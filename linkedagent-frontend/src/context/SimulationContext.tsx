import React, { createContext, useContext, useState, useEffect, useRef } from 'react';

export interface Message {
  id: string;
  sender: 'visitor' | 'ai' | 'agent' | 'system';
  text: string;
  timestamp: string;
  isStreaming?: boolean;
}

export interface VisitorSession {
  id: string;
  name: string;
  avatar: string;
  status: 'ai_chat' | 'queuing' | 'agent_chat' | 'offline_leave' | 'closed';
  queuePosition?: number;
  messages: Message[];
  rating?: number;
  feedback?: string;
}

export interface KnowledgeSegment {
  id: string;
  title: string;
  content: string;
  vector: string; // Simulated 1536-dim vector snippet
}

export interface AgentConfig {
  maxConcurrent: number;
  rateLimit: number; // Sentinel rate limit requests/min
  aiConfidenceThreshold: number; // 0.0 - 1.0
}

interface SimulationContextType {
  // Visitor States
  currentSession: VisitorSession;
  setVisitorStatus: (status: VisitorSession['status']) => void;
  sendVisitorMessage: (text: string) => void;
  submitFeedback: (rating: number, feedback: string) => void;
  submitOfflineLeave: (name: string, email: string, message: string) => void;
  triggerTransferToAgent: () => void;
  resetVisitorSession: () => void;
  
  // Agent States
  agentState: 'online' | 'busy' | 'offline';
  setAgentState: (state: 'online' | 'busy' | 'offline') => void;
  activeSessions: VisitorSession[];
  queuedSessions: VisitorSession[];
  selectedSessionId: string | null;
  setSelectedSessionId: (id: string | null) => void;
  sendAgentMessage: (sessionId: string, text: string) => void;
  acceptSession: (sessionId: string) => void;
  closeSessionByAgent: (sessionId: string) => void;
  
  // Admin / RAG States
  knowledgeBase: KnowledgeSegment[];
  addKnowledgeSegment: (title: string, content: string) => void;
  deleteKnowledgeSegment: (id: string) => void;
  agentConfig: AgentConfig;
  updateAgentConfig: (config: Partial<AgentConfig>) => void;
  
  // WebSocket Simulator Stats
  wsStatus: 'disconnected' | 'connecting' | 'connected';
  connectWebSocket: () => void;
  disconnectWebSocket: () => void;
  metrics: {
    totalRequests: number;
    sentinelBlocks: number;
    aiAvgResponseTime: number;
    activeConnections: number;
  };
}

const DEFAULT_KNOWLEDGE: KnowledgeSegment[] = [
  {
    id: 'k-1',
    title: 'LinkedAgent 智能客服平台概述',
    content: 'LinkedAgent 是一款智能客服平台。结合 React/TailwindCSS 前端、Spring Cloud 微服务后端与 AI RAG 大模型。核心目标是人机协同，AI 解答 80% 基础咨询，复杂问题无缝流转至人工客服。',
    vector: '[0.012, -0.045, 0.231, ... 1536d]'
  },
  {
    id: 'k-2',
    title: '系统长连接网关端口隔离设计',
    content: 'Chat-Server 作为一个独立 WebSocket 网关运行，默认端口为 8085。前端 ws:// 连接会绕过 Spring Cloud 统一网关，直接与 Chat-Server 通信。这一设计实现了长短连接物理隔离，防止高并发长连接拖垮正常的 HTTP 服务。',
    vector: '[0.114, 0.089, -0.052, ... 1536d]'
  },
  {
    id: 'k-3',
    title: '人工客服状态路由与排队规则',
    content: '转人工机制包括主动触发（用户点击按钮）和被动触发（大模型置信度低于阈值，如 0.6）。分配采用简单轮询（Round-Robin）机制。若所有客服均达到上限（默认最大并发5人），客户进入 Redis 队列排队；若客服全员离线，转入离线工单留言。',
    vector: '[-0.087, 0.124, 0.176, ... 1536d]'
  },
  {
    id: 'k-4',
    title: 'AI 大模型防腐层 (Anti-corruption Layer) 说明',
    content: '在 AI-RAG-Service 中设有大模型接口防腐层适配器。屏蔽不同大模型服务商（OpenAI, Gemini 等）的接口差异，未来更换大模型只需修改配置或防腐层适配器实现，业务代码无需变动。',
    vector: '[0.045, -0.098, -0.012, ... 1536d]'
  }
];

const SimulationContext = createContext<SimulationContextType | undefined>(undefined);

export const SimulationProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  // Visitor session
  const [currentSession, setCurrentSession] = useState<VisitorSession>({
    id: 'visitor-session-1',
    name: '上海访客 (匿名)',
    avatar: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=80&fit=crop&auto=format',
    status: 'ai_chat',
    messages: [
      {
        id: 'welcome',
        sender: 'ai',
        text: '您好！我是 LinkedAgent 智能助理。请问有什么可以帮您？我可以为您解答关于平台架构、WebSocket 隔离设计、以及人机流转的各种问题。',
        timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
      }
    ]
  });

  // Agent workspace states
  const [agentState, setAgentState] = useState<'online' | 'busy' | 'offline'>('online');
  const [activeSessions, setActiveSessions] = useState<VisitorSession[]>([]);
  const [queuedSessions, setQueuedSessions] = useState<VisitorSession[]>([]);
  const [selectedSessionId, setSelectedSessionId] = useState<string | null>(null);

  // RAG / Knowledge states
  const [knowledgeBase, setKnowledgeBase] = useState<KnowledgeSegment[]>(DEFAULT_KNOWLEDGE);
  const [agentConfig, setAgentConfig] = useState<AgentConfig>({
    maxConcurrent: 2, // Low for demo
    rateLimit: 30,
    aiConfidenceThreshold: 0.65
  });

  // WS Stats
  const [wsStatus, setWsStatus] = useState<'disconnected' | 'connecting' | 'connected'>('connected');
  const [metrics, setMetrics] = useState({
    totalRequests: 8,
    sentinelBlocks: 0,
    aiAvgResponseTime: 420,
    activeConnections: 1
  });

  const aiStreamingRef = useRef<boolean>(false);
  const messageCounter = useRef<number>(1);

  // Trigger WebSocket state simulations
  const connectWebSocket = () => {
    setWsStatus('connecting');
    setTimeout(() => {
      setWsStatus('connected');
      setMetrics(prev => ({ ...prev, activeConnections: prev.activeConnections + 1 }));
    }, 1000);
  };

  const disconnectWebSocket = () => {
    setWsStatus('disconnected');
    setMetrics(prev => ({ ...prev, activeConnections: Math.max(0, prev.activeConnections - 1) }));
  };

  // RAG QA Matcher
  const queryKnowledgeBase = (query: string): { segment: KnowledgeSegment | null; confidence: number } => {
    const queryLower = query.toLowerCase();
    let bestMatch: KnowledgeSegment | null = null;
    let maxMatchCount = 0;

    knowledgeBase.forEach(k => {
      const matchWords = k.content.toLowerCase().split(/[ ,，。、？?]/);
      let matches = 0;
      matchWords.forEach(word => {
        if (word && queryLower.includes(word)) {
          matches++;
        }
      });
      if (matches > maxMatchCount) {
        maxMatchCount = matches;
        bestMatch = k;
      }
    });

    const confidence = bestMatch ? Math.min(0.95, 0.3 + (maxMatchCount / 10)) : 0.2;
    return { segment: bestMatch, confidence };
  };

  // Synchronize current visitor session to agent's list if active/queued
  useEffect(() => {
    if (currentSession.status === 'queuing') {
      const exists = queuedSessions.some(s => s.id === currentSession.id);
      if (!exists) {
        setQueuedSessions([currentSession]);
      } else {
        setQueuedSessions(prev => prev.map(s => s.id === currentSession.id ? currentSession : s));
      }
    } else if (currentSession.status === 'agent_chat') {
      const exists = activeSessions.some(s => s.id === currentSession.id);
      if (!exists) {
        setActiveSessions([currentSession]);
      } else {
        setActiveSessions(prev => prev.map(s => s.id === currentSession.id ? currentSession : s));
      }
    } else if (currentSession.status === 'closed') {
      setQueuedSessions(prev => prev.filter(s => s.id !== currentSession.id));
      setActiveSessions(prev => prev.filter(s => s.id !== currentSession.id));
    }
  }, [currentSession]);

  // Visitor actions
  const setVisitorStatus = (status: VisitorSession['status']) => {
    setCurrentSession(prev => ({ ...prev, status }));
  };

  const triggerTransferToAgent = () => {
    setMetrics(prev => ({ ...prev, totalRequests: prev.totalRequests + 1 }));
    
    // Check if rate limited
    if (metrics.totalRequests > 0 && metrics.totalRequests % agentConfig.rateLimit === 0) {
      setMetrics(prev => ({ ...prev, sentinelBlocks: prev.sentinelBlocks + 1 }));
      setCurrentSession(prev => ({
        ...prev,
        messages: [
          ...prev.messages,
          {
            id: `sys-limit-${Date.now()}`,
            sender: 'system',
            text: '🚨 [Sentinel 限流保护] 当前系统请求频率过高，触发安全熔断，转人工服务被限流。请稍后再试。',
            timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
          }
        ]
      }));
      return;
    }

    if (agentState === 'offline') {
      setCurrentSession(prev => ({
        ...prev,
        status: 'offline_leave',
        messages: [
          ...prev.messages,
          {
            id: `sys-offline-${Date.now()}`,
            sender: 'system',
            text: '🛎️ 系统提示：当前无人工客服在线，已为您转接至离线留言工单系统。',
            timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
          }
        ]
      }));
    } else {
      const totalActiveChatsCount = activeSessions.length;
      if (agentState === 'busy' || totalActiveChatsCount >= agentConfig.maxConcurrent) {
        const queuePos = queuedSessions.length + 1;
        setCurrentSession(prev => ({
          ...prev,
          status: 'queuing',
          queuePosition: queuePos,
          messages: [
            ...prev.messages,
            {
              id: `sys-queue-${Date.now()}`,
              sender: 'system',
              text: `排队中：人工座席正忙。您当前排在第 ${queuePos} 位，请稍候。`,
              timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
            }
          ]
        }));
      } else {
        // Direct allocation
        setCurrentSession(prev => ({
          ...prev,
          status: 'agent_chat',
          messages: [
            ...prev.messages,
            {
              id: `sys-alloc-${Date.now()}`,
              sender: 'system',
              text: '🎧 已为您成功分配客服专员 Agent-001 接管会话。',
              timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
            }
          ]
        }));
      }
    }
  };

  const sendVisitorMessage = (text: string) => {
    if (!text.trim() || wsStatus !== 'connected' || aiStreamingRef.current) return;

    setMetrics(prev => ({ ...prev, totalRequests: prev.totalRequests + 1 }));

    // Sensitivity / Content moderation check
    const isSensitive = text.includes('敏感') || text.includes('垃圾');
    const filteredText = isSensitive ? '***[该发言因包含敏感词已被内容风控拦截]***' : text;

    const visitorMsg: Message = {
      id: `visitor-msg-${Date.now()}`,
      sender: 'visitor',
      text: filteredText,
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
    };

    setCurrentSession(prev => {
      const updatedMessages = [...prev.messages, visitorMsg];
      
      // If client is chatting with agent
      if (prev.status === 'agent_chat') {
        return { ...prev, messages: updatedMessages };
      }
      
      // If AI mode
      if (prev.status === 'ai_chat') {
        if (isSensitive) {
          return {
            ...prev,
            messages: [
              ...updatedMessages,
              {
                id: `ai-err-${Date.now()}`,
                sender: 'ai',
                text: '⚠️ 尊敬的用户，您的输入违反了内容风控规定，无法生成回答。',
                timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
              }
            ]
          };
        }
        
        // Trigger AI RAG stream
        setTimeout(() => streamAIResponse(text), 600);
      }

      return { ...prev, messages: updatedMessages };
    });
  };

  // Streaming AI (RAG + Prompt adapted from CSV specs)
  const streamAIResponse = (visitorQuery: string) => {
    if (aiStreamingRef.current) return;
    aiStreamingRef.current = true;

    const { segment, confidence } = queryKnowledgeBase(visitorQuery);
    
    // Check confidence threshold for auto-fallback
    if (confidence < agentConfig.aiConfidenceThreshold) {
      aiStreamingRef.current = false;
      setCurrentSession(prev => ({
        ...prev,
        messages: [
          ...prev.messages,
          {
            id: `ai-fallback-${Date.now()}`,
            sender: 'ai',
            text: '💡 我对您的问题置信度较低（低于设定的阈值 ' + agentConfig.aiConfidenceThreshold + '），为了保障解答质量，系统自动为您推荐人工服务。',
            timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
          }
        ]
      }));
      // Auto transfer
      setTimeout(() => triggerTransferToAgent(), 1000);
      return;
    }

    // Set streaming state
    const responseTemplate = segment 
      ? `💡 [知识库召回匹配度: ${(confidence * 100).toFixed(0)}%]\n基于 RAG 检索到的内容：${segment.content}\n\n[AI 总结推理]：LinkedAgent 基于这一高维向量召回机制，能够快速定位问题。请问这解决了您的疑惑吗？`
      : '🤔 我检索了知识库，未发现完全匹配的内容。LinkedAgent 的大模型适配层支持流式返回，您也可以点击下方的按钮直接转接人工坐席沟通。';

    const streamingMsgId = `ai-stream-${Date.now()}`;
    
    setCurrentSession(prev => ({
      ...prev,
      messages: [
        ...prev.messages,
        {
          id: streamingMsgId,
          sender: 'ai',
          text: '',
          timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
          isStreaming: true
        }
      ]
    }));

    let currentLength = 0;
    const interval = setInterval(() => {
      currentLength += Math.floor(Math.random() * 4) + 2;
      const done = currentLength >= responseTemplate.length;
      const textSlice = done ? responseTemplate : responseTemplate.slice(0, currentLength);

      setCurrentSession(prev => ({
        ...prev,
        messages: prev.messages.map(m => 
          m.id === streamingMsgId 
            ? { ...m, text: textSlice, isStreaming: !done }
            : m
        )
      }));

      if (done) {
        clearInterval(interval);
        aiStreamingRef.current = false;
      }
    }, 40);
  };

  const submitFeedback = (rating: number, feedback: string) => {
    setCurrentSession(prev => ({
      ...prev,
      status: 'closed',
      rating,
      feedback,
      messages: [
        ...prev.messages,
        {
          id: `sys-feedback-${Date.now()}`,
          sender: 'system',
          text: `⭐ 评价成功！分值：${rating} 星，反馈内容：${feedback || '无'}。感谢您的反馈！`,
          timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
        }
      ]
    }));
  };

  const submitOfflineLeave = (name: string, email: string, message: string) => {
    setCurrentSession(prev => ({
      ...prev,
      status: 'closed',
      messages: [
        ...prev.messages,
        {
          id: `sys-leave-${Date.now()}`,
          sender: 'system',
          text: `📮 留言工单提交成功！我们会在客服上线后第一时间联系您。\n姓名：${name}\n邮箱：${email}\n内容：${message}`,
          timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
        }
      ]
    }));
  };

  const resetVisitorSession = () => {
    setCurrentSession({
      id: `visitor-session-${++messageCounter.current}`,
      name: '北京访客 (匿名)',
      avatar: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=80&fit=crop&auto=format',
      status: 'ai_chat',
      messages: [
        {
          id: 'welcome',
          sender: 'ai',
          text: '您好！我是 LinkedAgent 智能客服助手。已为您重置会话，请问有什么可以协助您？',
          timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
        }
      ]
    });
  };

  // Agent Actions
  const acceptSession = (sessionId: string) => {
    const session = queuedSessions.find(s => s.id === sessionId);
    if (!session) return;

    // Move from queuing to active
    setQueuedSessions(prev => prev.filter(s => s.id !== sessionId));
    const activeSession: VisitorSession = {
      ...session,
      status: 'agent_chat',
      messages: [
        ...session.messages,
        {
          id: `sys-agent-join-${Date.now()}`,
          sender: 'system',
          text: '🎧 客服 Agent-001 已进入会话，正为您服务。',
          timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
        }
      ]
    };
    setActiveSessions(prev => [...prev, activeSession]);
    setSelectedSessionId(sessionId);
    
    // Update visitor's view if matching
    if (currentSession.id === sessionId) {
      setCurrentSession(activeSession);
    }
  };

  const sendAgentMessage = (sessionId: string, text: string) => {
    if (!text.trim()) return;

    const agentMsg: Message = {
      id: `agent-msg-${Date.now()}`,
      sender: 'agent',
      text,
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
    };

    setActiveSessions(prev => prev.map(s => {
      if (s.id === sessionId) {
        const updated = { ...s, messages: [...s.messages, agentMsg] };
        if (currentSession.id === sessionId) {
          setCurrentSession(updated);
        }
        return updated;
      }
      return s;
    }));
  };

  const closeSessionByAgent = (sessionId: string) => {
    setActiveSessions(prev => prev.filter(s => s.id !== sessionId));
    if (selectedSessionId === sessionId) {
      setSelectedSessionId(null);
    }

    const closedSession: VisitorSession = {
      ...(activeSessions.find(s => s.id === sessionId) || currentSession),
      status: 'closed',
      messages: [
        ...(activeSessions.find(s => s.id === sessionId)?.messages || currentSession.messages),
        {
          id: `sys-agent-leave-${Date.now()}`,
          sender: 'system',
          text: '📞 客服已主动结束本次会话，感谢您的咨询。',
          timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
        }
      ]
    };

    if (currentSession.id === sessionId) {
      setCurrentSession(closedSession);
    }
  };

  // Admin Actions
  const addKnowledgeSegment = (title: string, content: string) => {
    const newSeg: KnowledgeSegment = {
      id: `k-${Date.now()}`,
      title,
      content,
      vector: `[${Array.from({ length: 4 }, () => (Math.random() * 0.4 - 0.2).toFixed(3)).join(', ')}, ... 1536d]`
    };
    setKnowledgeBase(prev => [...prev, newSeg]);
  };

  const deleteKnowledgeSegment = (id: string) => {
    setKnowledgeBase(prev => prev.filter(k => k.id !== id));
  };

  const updateAgentConfig = (config: Partial<AgentConfig>) => {
    setAgentConfig(prev => ({ ...prev, ...config }));
  };

  return (
    <SimulationContext.Provider value={{
      currentSession,
      setVisitorStatus,
      sendVisitorMessage,
      submitFeedback,
      submitOfflineLeave,
      triggerTransferToAgent,
      resetVisitorSession,
      
      agentState,
      setAgentState,
      activeSessions,
      queuedSessions,
      selectedSessionId,
      setSelectedSessionId,
      sendAgentMessage,
      acceptSession,
      closeSessionByAgent,
      
      knowledgeBase,
      addKnowledgeSegment,
      deleteKnowledgeSegment,
      agentConfig,
      updateAgentConfig,
      
      wsStatus,
      connectWebSocket,
      disconnectWebSocket,
      metrics
    }}>
      {children}
    </SimulationContext.Provider>
  );
};

export const useSimulation = () => {
  const context = useContext(SimulationContext);
  if (!context) {
    throw new Error('useSimulation must be used within a SimulationProvider');
  }
  return context;
};

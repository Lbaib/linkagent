import React, { useState, useRef, useEffect } from 'react';
import { useAgentStore } from '../store/agentStore';
import { Users, Clock, MessageSquare, Activity, CornerDownRight, CheckCircle, UserCheck, Bot, Sparkles, Loader2 } from 'lucide-react';
import { askAiAssistant } from '../services/api';

export const AgentWorkbench: React.FC = () => {
  const {
    agentState, setAgentState, activeSessions, queuedSessions,
    selectedSessionId, setSelectedSessionId, sendAgentMessage,
    acceptSession, closeSessionByAgent, agentConfig, metrics,
    wsStatus, connect
  } = useAgentStore();

  const [input, setInput] = useState('');
  const chatEndRef = useRef<HTMLDivElement>(null);
  
  // AI Copilot State
  const [aiSuggestion, setAiSuggestion] = useState('');
  const [isAiLoading, setIsAiLoading] = useState(false);
  const [aiError, setAiError] = useState('');
  
  const selectedSession = activeSessions.find(s => s.id === selectedSessionId) || queuedSessions.find(s => s.id === selectedSessionId);

  useEffect(() => {
    if (wsStatus === 'disconnected') {
      connect();
    }
  }, [wsStatus, connect]);

  const templates = [
    '您好！我是人工客服专员，很高兴为您服务。请问有什么可以帮您？',
    '已为您调取刚才与 AI 对话的历史上下文，已确认您的问题。',
    '好的，该问题已经为您处理完毕。如有其他疑问欢迎随时咨询，祝您生活愉快！'
  ];

  useEffect(() => {
    chatEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [selectedSession?.messages]);

  // Clear AI suggestion when switching sessions
  useEffect(() => {
    setAiSuggestion('');
    setAiError('');
  }, [selectedSessionId]);

  const handleSend = (e: React.FormEvent) => {
    e.preventDefault();
    if (!input.trim() || !selectedSessionId) return;
    sendAgentMessage(selectedSessionId, input);
    setInput('');
  };

  const selectTemplate = (tpl: string) => setInput(tpl);

  const handleAskAi = async () => {
    if (!selectedSession || selectedSession.messages.length === 0) return;
    setIsAiLoading(true);
    setAiError('');
    
    // Extract context from recent messages (e.g., last 10)
    const recentMessages = selectedSession.messages
      .slice(-10)
      .map(m => `${m.sender === 'visitor' ? '访客' : m.sender === 'ai' ? '系统自动回复' : '客服'}: ${m.text}`)
      .join('\n');
      
    const query = `请根据以下对话记录，为人工客服生成一小段专业的回复建议：\n\n${recentMessages}`;
    
    try {
      const answer = await askAiAssistant(query);
      setAiSuggestion(answer);
    } catch (err) {
      setAiError('AI 服务请求失败，请确保本地后端服务正常运行 (127.0.0.1:8080)。');
    } finally {
      setIsAiLoading(false);
    }
  };

  return (
    <div className="flex flex-1 w-full bg-white rounded-2xl overflow-hidden shadow-premium border border-gray-200">
      {/* 1. Left Sidebar - Session List */}
      <div className="w-[320px] border-r border-gray-200 bg-gray-50 flex flex-col shrink-0">
        {/* Agent Profile */}
        <div className="p-5 border-b border-gray-200 bg-white">
          <div className="flex items-center gap-3 mb-4">
            <div className="w-12 h-12 rounded-xl bg-purple-100 flex items-center justify-center">
              <span className="text-lg font-bold text-purple-600">AG</span>
            </div>
            <div>
              <h4 className="text-base font-bold text-gray-900">坐席 Agent-001</h4>
              <p className="text-xs text-gray-500 mt-0.5">并发额度: {activeSessions.length}/{agentConfig.maxConcurrent}</p>
            </div>
          </div>
          
          <div className="grid grid-cols-3 gap-2 p-1 bg-gray-100 rounded-lg border border-gray-200">
            {(['online', 'busy', 'offline'] as const).map((s) => (
              <button
                key={s}
                onClick={() => setAgentState(s)}
                className={`py-1.5 rounded-md text-xs font-bold capitalize transition-all cursor-pointer ${
                  agentState === s 
                    ? s === 'online' ? 'bg-white text-green-600 shadow-sm border border-gray-200/50' :
                      s === 'busy' ? 'bg-white text-yellow-600 shadow-sm border border-gray-200/50' :
                      'bg-white text-red-600 shadow-sm border border-gray-200/50'
                    : 'text-gray-500 hover:text-gray-900 hover:bg-gray-200/50'
                }`}
              >
                {s === 'online' ? '在线' : s === 'busy' ? '忙碌' : '离线'}
              </button>
            ))}
          </div>
        </div>

        <div className="flex-1 overflow-y-auto">
          {/* Queued List */}
          <div className="p-3">
            <h5 className="text-[10px] font-bold tracking-wider text-gray-500 uppercase flex items-center gap-1.5 mb-2 px-2">
              <Clock className="w-3.5 h-3.5 text-yellow-500" />
              待接管 ({queuedSessions.length})
            </h5>
            
            {queuedSessions.length === 0 ? (
              <p className="text-xs text-gray-400 py-4 text-center bg-gray-100/50 rounded-lg border border-dashed border-gray-200">
                暂无排队客户
              </p>
            ) : (
              <div className="space-y-2">
                {queuedSessions.map((session) => (
                  <div key={session.id} className="p-3 rounded-lg bg-white border border-gray-200 shadow-sm flex flex-col gap-2">
                    <div className="flex items-center justify-between">
                      <span className="text-sm font-bold text-gray-900 truncate pr-2">{session.name}</span>
                      <span className="text-[10px] px-1.5 py-0.5 rounded bg-yellow-100 text-yellow-700 font-bold shrink-0">
                        排队 #{session.queuePosition}
                      </span>
                    </div>
                    <div className="flex gap-2 justify-end mt-1">
                      <button onClick={() => setSelectedSessionId(session.id)} className="text-xs px-3 py-1.5 rounded-md bg-gray-100 hover:bg-gray-200 text-gray-700 font-semibold cursor-pointer transition-colors">
                        预览
                      </button>
                      <button onClick={() => acceptSession(session.id)} className="text-xs px-3 py-1.5 rounded-md bg-purple-600 hover:bg-purple-700 text-white font-bold cursor-pointer transition-colors">
                        接入
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Active Chats */}
          <div className="p-3 border-t border-gray-200">
            <h5 className="text-[10px] font-bold tracking-wider text-gray-500 uppercase flex items-center gap-1.5 mb-2 px-2">
              <MessageSquare className="w-3.5 h-3.5 text-green-500" />
              服务中 ({activeSessions.length})
            </h5>
            
            {activeSessions.length === 0 ? (
              <p className="text-xs text-gray-400 py-4 text-center bg-gray-100/50 rounded-lg border border-dashed border-gray-200">
                暂无服务中会话
              </p>
            ) : (
              <div className="space-y-1.5">
                {activeSessions.map((session) => (
                  <button
                    key={session.id}
                    onClick={() => setSelectedSessionId(session.id)}
                    className={`w-full text-left p-3 rounded-lg border transition-all cursor-pointer flex flex-col gap-1 ${
                      selectedSessionId === session.id
                        ? 'bg-purple-50 border-purple-200 shadow-sm'
                        : 'bg-white border-gray-200 hover:bg-gray-50'
                    }`}
                  >
                    <div className="flex items-center justify-between w-full">
                      <span className={`text-sm font-bold truncate pr-2 ${selectedSessionId === session.id ? 'text-purple-700' : 'text-gray-900'}`}>{session.name}</span>
                      <span className="text-[10px] text-gray-400 shrink-0">{session.messages[session.messages.length - 1]?.timestamp}</span>
                    </div>
                    <span className="text-xs text-gray-500 truncate w-full">
                      {session.messages[session.messages.length - 1]?.text || '无新消息'}
                    </span>
                  </button>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>

      {/* 2. Middle Main Chat Workspace */}
      <div className="flex-1 bg-white flex flex-col border-r border-gray-200 min-w-0">
        {selectedSession ? (
          <>
            {/* Header */}
            <div className="px-6 py-4 border-b border-gray-100 bg-white flex items-center justify-between shrink-0">
              <div className="flex flex-col truncate pr-4">
                <div className="flex items-center gap-3">
                  <h3 className="text-lg font-bold text-gray-900 truncate">{selectedSession.name}</h3>
                  <span className={`text-[10px] px-2 py-0.5 rounded-md font-bold uppercase shrink-0 ${
                    selectedSession.status === 'agent_chat' 
                      ? 'bg-blue-100 text-blue-700'
                      : 'bg-yellow-100 text-yellow-700'
                  }`}>
                    {selectedSession.status === 'agent_chat' ? '接待中' : '排队中'}
                  </span>
                </div>
                <p className="text-xs text-gray-400 mt-1 truncate">ID: {selectedSession.id}</p>
              </div>

              {selectedSession.status === 'agent_chat' && (
                <button
                  onClick={() => closeSessionByAgent(selectedSession.id)}
                  className="px-4 py-2 rounded-lg bg-gray-50 hover:bg-red-50 text-red-600 border border-gray-200 hover:border-red-200 text-xs font-bold cursor-pointer transition-colors shrink-0"
                >
                  结束会话
                </button>
              )}
            </div>

            {/* Messages */}
            <div className="flex-1 overflow-y-auto p-6 space-y-5 bg-gray-50/50">
              <div className="flex justify-center mb-4">
                <div className="text-[11px] px-4 py-1.5 rounded-full bg-purple-50 text-purple-600 flex items-center gap-1.5 font-medium border border-purple-100">
                  <UserCheck className="w-3.5 h-3.5" />
                  已自动漫游历史上下文
                </div>
              </div>

              {selectedSession.messages.map((msg) => {
                const isAgent = msg.sender === 'agent';
                const isSystem = msg.sender === 'system';
                
                if (isSystem) {
                  return (
                    <div key={msg.id} className="flex justify-center my-2">
                      <div className="text-[11px] px-3 py-1 rounded bg-gray-200/70 text-gray-500 text-center">
                        {msg.text}
                      </div>
                    </div>
                  );
                }

                return (
                  <div key={msg.id} className={`flex gap-3 max-w-[85%] ${isAgent ? 'ml-auto flex-row-reverse' : 'mr-auto'}`}>
                    <div className="flex flex-col">
                      <div className="flex items-center gap-2 mb-1 px-1">
                        <span className={`text-[10px] uppercase font-bold ${
                          msg.sender === 'visitor' ? 'text-gray-400' :
                          msg.sender === 'ai' ? 'text-purple-500' : 'text-blue-500'
                        }`}>
                          {msg.sender === 'visitor' ? '访客' : msg.sender === 'ai' ? 'AI' : '客服'}
                        </span>
                      </div>
                      
                      <div className={`px-4 py-2.5 rounded-xl text-sm leading-relaxed ${
                        isAgent
                          ? 'bg-blue-600 text-white rounded-tr-sm'
                          : msg.sender === 'ai'
                            ? 'bg-purple-50 text-purple-900 border border-purple-100 rounded-tl-sm'
                            : 'bg-white text-gray-800 border border-gray-200 rounded-tl-sm shadow-sm'
                      }`}>
                        <p className="whitespace-pre-wrap">{msg.text}</p>
                      </div>
                      
                      <span className={`text-[10px] text-gray-400 mt-1 ${isAgent ? 'text-right' : 'text-left'}`}>
                        {msg.timestamp}
                      </span>
                    </div>
                  </div>
                );
              })}
              <div ref={chatEndRef} />
            </div>

            {/* Input Panel */}
            {selectedSession.status === 'agent_chat' ? (
              <div className="p-4 border-t border-gray-200 bg-white space-y-3 shrink-0">
                <div className="flex gap-2 overflow-x-auto pb-1 scrollbar-thin">
                  {templates.map((tpl, i) => (
                    <button
                      key={i}
                      onClick={() => selectTemplate(tpl)}
                      className="px-3 py-1.5 rounded-lg bg-gray-50 hover:bg-gray-100 text-gray-600 text-xs font-medium whitespace-nowrap cursor-pointer transition-colors border border-gray-100"
                    >
                      <CornerDownRight className="w-3.5 h-3.5 inline mr-1 text-gray-400" />
                      {tpl.slice(0, 16)}...
                    </button>
                  ))}
                </div>

                <form onSubmit={handleSend} className="flex gap-3">
                  <input
                    type="text"
                    value={input}
                    onChange={(e) => setInput(e.target.value)}
                    placeholder="输入回复内容..."
                    className="flex-1 bg-gray-50 border border-gray-200 focus:border-blue-500 focus:ring-1 focus:ring-blue-500 outline-none rounded-xl px-4 py-2.5 text-sm text-gray-900 transition-shadow"
                  />
                  <button
                    type="submit"
                    disabled={!input.trim()}
                    className="px-6 bg-blue-600 hover:bg-blue-700 disabled:bg-gray-300 disabled:text-gray-500 text-white font-bold text-sm rounded-xl cursor-pointer transition-colors shrink-0"
                  >
                    发送
                  </button>
                </form>
              </div>
            ) : (
              <div className="p-4 border-t border-gray-200 bg-gray-50 text-center text-xs text-gray-500 font-medium shrink-0">
                排队中，请在左侧点击“接入”开始沟通。
              </div>
            )}
          </>
        ) : (
          <div className="flex-1 p-10 flex flex-col justify-center overflow-y-auto space-y-6 bg-gray-50/30">
            <div className="max-w-md mx-auto w-full text-center space-y-4">
              <div className="w-20 h-20 rounded-full bg-white border border-gray-100 flex items-center justify-center mx-auto shadow-sm">
                <Activity className="w-8 h-8 text-purple-600" />
              </div>
              <div>
                <h3 className="text-xl font-bold text-gray-900">坐席控制台</h3>
                <p className="text-sm text-gray-500 mt-1">系统已连接，正在监听访客流量...</p>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4 max-w-md mx-auto w-full">
              <div className="p-5 rounded-xl bg-white border border-gray-100 flex items-center gap-4 shadow-sm">
                <div className="p-3 bg-purple-50 rounded-lg">
                  <Users className="w-6 h-6 text-purple-600" />
                </div>
                <div>
                  <p className="text-xs text-gray-500 font-medium mb-0.5">活跃连接</p>
                  <p className="text-2xl font-bold text-gray-900">{metrics.activeConnections}</p>
                </div>
              </div>
              <div className="p-5 rounded-xl bg-white border border-gray-100 flex items-center gap-4 shadow-sm">
                <div className="p-3 bg-blue-50 rounded-lg">
                  <MessageSquare className="w-6 h-6 text-blue-600" />
                </div>
                <div>
                  <p className="text-xs text-gray-500 font-medium mb-0.5">总处理量</p>
                  <p className="text-2xl font-bold text-gray-900">{metrics.totalRequests}</p>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* 3. Right Sidebar - AI Copilot */}
      <div className="w-[320px] bg-slate-50 flex flex-col shrink-0 relative">
        {selectedSession ? (
          <>
            <div className="px-5 py-4 border-b border-gray-200 bg-white flex items-center gap-3">
              <div className="w-8 h-8 rounded-lg bg-purple-100 flex items-center justify-center">
                <Bot className="w-4 h-4 text-purple-600" />
              </div>
              <h3 className="text-sm font-bold text-gray-900">AI 知识库助手</h3>
            </div>
            
            <div className="flex-1 overflow-y-auto p-5 flex flex-col gap-4">
              {/* Call to action card */}
              <div className="bg-gradient-to-br from-purple-600 to-indigo-600 rounded-xl p-5 text-white shadow-md relative overflow-hidden group">
                <div className="absolute top-0 right-0 p-3 opacity-20 group-hover:scale-110 group-hover:rotate-12 transition-transform duration-500">
                  <Sparkles className="w-12 h-12" />
                </div>
                <h4 className="font-bold text-base mb-1.5 relative z-10">一键求助 AI</h4>
                <p className="text-purple-100 text-xs mb-4 relative z-10 leading-relaxed">
                  系统将自动分析当前上下文并检索企业知识库，为您生成话术建议。
                </p>
                <button 
                  onClick={handleAskAi}
                  disabled={isAiLoading || selectedSession.status !== 'agent_chat'}
                  className="w-full py-2.5 bg-white/10 hover:bg-white text-white hover:text-purple-700 backdrop-blur-sm font-bold text-sm rounded-lg transition-all flex items-center justify-center gap-2 relative z-10 disabled:opacity-50 disabled:cursor-not-allowed border border-white/20"
                >
                  {isAiLoading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Sparkles className="w-4 h-4" />}
                  {isAiLoading ? 'AI 思考中...' : '生成回复建议'}
                </button>
              </div>

              {/* Error Message */}
              {aiError && (
                <div className="p-3 bg-red-50 text-red-600 text-xs rounded-lg border border-red-100 flex gap-2">
                  <span className="shrink-0">⚠️</span>
                  <p>{aiError}</p>
                </div>
              )}

              {/* AI Suggestion Result */}
              {aiSuggestion && (
                <div className="bg-white border border-gray-200 rounded-xl p-4 shadow-sm flex flex-col gap-3">
                  <h5 className="text-[10px] font-bold text-gray-500 uppercase flex items-center gap-1.5">
                    <CheckCircle className="w-3.5 h-3.5 text-green-500" /> AI 建议回复
                  </h5>
                  <div className="text-sm text-gray-700 leading-relaxed whitespace-pre-wrap">
                    {aiSuggestion}
                  </div>
                  <button 
                    onClick={() => {
                      setInput(aiSuggestion);
                    }}
                    className="w-full mt-1 py-2 bg-purple-50 hover:bg-purple-100 text-purple-700 text-xs font-bold rounded-lg transition-colors border border-purple-100"
                  >
                    采纳并填入输入框
                  </button>
                </div>
              )}
            </div>
          </>
        ) : (
          <div className="flex-1 flex flex-col items-center justify-center p-8 text-center bg-gray-50">
            <Bot className="w-12 h-12 text-gray-300 mb-3" />
            <p className="text-sm text-gray-400 font-medium">接入会话后<br/>可使用 AI 辅助功能</p>
          </div>
        )}
      </div>
    </div>
  );
};

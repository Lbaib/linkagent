import React, { useState, useRef, useEffect } from 'react';
import { useSimulation } from '../context/SimulationContext';
import { Users, Clock, MessageSquare, Activity, CornerDownRight, CheckCircle, UserCheck } from 'lucide-react';

export const AgentWorkbench: React.FC = () => {
  const {
    agentState, setAgentState, activeSessions, queuedSessions,
    selectedSessionId, setSelectedSessionId, sendAgentMessage,
    acceptSession, closeSessionByAgent, agentConfig, metrics
  } = useSimulation();

  const [input, setInput] = useState('');
  const chatEndRef = useRef<HTMLDivElement>(null);
  
  const selectedSession = activeSessions.find(s => s.id === selectedSessionId) || queuedSessions.find(s => s.id === selectedSessionId);

  const templates = [
    '您好！我是人工客服专员，很高兴为您服务。请问有什么可以帮您？',
    '已为您调取刚才与 AI 对话的历史上下文，已确认您的问题。',
    '好的，该问题已经为您处理完毕。如有其他疑问欢迎随时咨询，祝您生活愉快！'
  ];

  useEffect(() => {
    chatEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [selectedSession?.messages]);

  const handleSend = (e: React.FormEvent) => {
    e.preventDefault();
    if (!input.trim() || !selectedSessionId) return;
    sendAgentMessage(selectedSessionId, input);
    setInput('');
  };

  const selectTemplate = (tpl: string) => setInput(tpl);

  return (
    <div className="flex flex-1 w-full bg-white rounded-2xl overflow-hidden shadow-premium border border-gray-200">
      {/* Left Sidebar */}
      <div className="w-[380px] border-r border-gray-200 bg-gray-50 flex flex-col">
        {/* Agent Profile */}
        <div className="p-6 border-b border-gray-200 bg-white">
          <div className="flex items-center gap-4 mb-5">
            <div className="w-14 h-14 rounded-xl bg-purple-100 flex items-center justify-center">
              <span className="text-xl font-bold text-purple-600">AG</span>
            </div>
            <div>
              <h4 className="text-lg font-bold text-gray-900">坐席 Agent-001</h4>
              <p className="text-sm text-gray-500 mt-0.5">并发额度: {activeSessions.length}/{agentConfig.maxConcurrent}</p>
            </div>
          </div>
          
          <div className="grid grid-cols-3 gap-2 p-1.5 bg-gray-100 rounded-xl border border-gray-200">
            {(['online', 'busy', 'offline'] as const).map((s) => (
              <button
                key={s}
                onClick={() => setAgentState(s)}
                className={`py-2 rounded-lg text-sm font-bold capitalize transition-all cursor-pointer ${
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
          <div className="p-4">
            <h5 className="text-xs font-bold tracking-wider text-gray-500 uppercase flex items-center gap-2 mb-3 px-2">
              <Clock className="w-4 h-4 text-yellow-500" />
              待接管队列 ({queuedSessions.length})
            </h5>
            
            {queuedSessions.length === 0 ? (
              <p className="text-sm text-gray-400 py-6 text-center bg-gray-100/50 rounded-xl border border-dashed border-gray-200">
                当前暂无排队客户
              </p>
            ) : (
              <div className="space-y-3">
                {queuedSessions.map((session) => (
                  <div key={session.id} className="p-4 rounded-xl bg-white border border-gray-200 shadow-sm flex flex-col gap-3">
                    <div className="flex items-center justify-between">
                      <span className="text-base font-bold text-gray-900">{session.name}</span>
                      <span className="text-xs px-2 py-1 rounded-md bg-yellow-100 text-yellow-700 font-bold">
                        排队 #{session.queuePosition}
                      </span>
                    </div>
                    <div className="flex gap-2 justify-end">
                      <button onClick={() => setSelectedSessionId(session.id)} className="text-sm px-4 py-2 rounded-lg bg-gray-100 hover:bg-gray-200 text-gray-700 font-semibold cursor-pointer">
                        预览
                      </button>
                      <button onClick={() => acceptSession(session.id)} className="text-sm px-4 py-2 rounded-lg bg-purple-600 hover:bg-purple-700 text-white font-bold cursor-pointer">
                        接入
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Active Chats */}
          <div className="p-4 border-t border-gray-200">
            <h5 className="text-xs font-bold tracking-wider text-gray-500 uppercase flex items-center gap-2 mb-3 px-2">
              <MessageSquare className="w-4 h-4 text-green-500" />
              正在服务 ({activeSessions.length})
            </h5>
            
            {activeSessions.length === 0 ? (
              <p className="text-sm text-gray-400 py-6 text-center bg-gray-100/50 rounded-xl border border-dashed border-gray-200">
                暂无服务中会话
              </p>
            ) : (
              <div className="space-y-2">
                {activeSessions.map((session) => (
                  <button
                    key={session.id}
                    onClick={() => setSelectedSessionId(session.id)}
                    className={`w-full text-left p-4 rounded-xl border transition-all cursor-pointer flex flex-col gap-1 ${
                      selectedSessionId === session.id
                        ? 'bg-purple-50 border-purple-200 shadow-sm'
                        : 'bg-white border-gray-200 hover:bg-gray-50'
                    }`}
                  >
                    <div className="flex items-center justify-between w-full">
                      <span className={`text-base font-bold ${selectedSessionId === session.id ? 'text-purple-700' : 'text-gray-900'}`}>{session.name}</span>
                      <span className="text-xs text-gray-500">{session.messages[session.messages.length - 1]?.timestamp}</span>
                    </div>
                    <span className="text-sm text-gray-500 truncate w-full">
                      {session.messages[session.messages.length - 1]?.text || '无新消息'}
                    </span>
                  </button>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Main Chat Workspace */}
      <div className="flex-1 bg-white flex flex-col">
        {selectedSession ? (
          <>
            {/* Header */}
            <div className="px-8 py-6 border-b border-gray-100 bg-white flex items-center justify-between">
              <div>
                <div className="flex items-center gap-3">
                  <h3 className="text-xl font-bold text-gray-900">{selectedSession.name}</h3>
                  <span className={`text-xs px-2.5 py-1 rounded-md font-bold uppercase ${
                    selectedSession.status === 'agent_chat' 
                      ? 'bg-blue-100 text-blue-700'
                      : 'bg-yellow-100 text-yellow-700'
                  }`}>
                    {selectedSession.status === 'agent_chat' ? '接待中' : '排队中'}
                  </span>
                </div>
                <p className="text-sm text-gray-500 mt-1">会话 ID: {selectedSession.id}</p>
              </div>

              {selectedSession.status === 'agent_chat' && (
                <button
                  onClick={() => closeSessionByAgent(selectedSession.id)}
                  className="px-5 py-2.5 rounded-xl bg-gray-100 border border-gray-200 hover:bg-red-50 text-red-600 text-sm font-bold cursor-pointer transition-colors"
                >
                  结束会话
                </button>
              )}
            </div>

            {/* Messages */}
            <div className="flex-1 overflow-y-auto p-8 space-y-6 bg-gray-50">
              <div className="flex justify-center mb-6">
                <div className="text-sm px-5 py-2 rounded-full bg-purple-50 text-purple-600 flex items-center gap-2 font-medium">
                  <UserCheck className="w-4 h-4" />
                  已自动漫游 AI 对话历史
                </div>
              </div>

              {selectedSession.messages.map((msg) => {
                const isAgent = msg.sender === 'agent';
                const isSystem = msg.sender === 'system';
                
                if (isSystem) {
                  return (
                    <div key={msg.id} className="flex justify-center my-3">
                      <div className="text-sm px-4 py-1.5 rounded-lg bg-gray-200 text-gray-600 text-center font-medium">
                        {msg.text}
                      </div>
                    </div>
                  );
                }

                return (
                  <div key={msg.id} className={`flex gap-4 max-w-[85%] ${isAgent ? 'ml-auto flex-row-reverse' : 'mr-auto'}`}>
                    <div className="flex flex-col">
                      <div className="flex items-center gap-2 mb-1.5 px-1">
                        <span className={`text-xs uppercase font-bold ${
                          msg.sender === 'visitor' ? 'text-gray-500' :
                          msg.sender === 'ai' ? 'text-purple-600' : 'text-blue-600'
                        }`}>
                          {msg.sender === 'visitor' ? '访客' : msg.sender === 'ai' ? 'AI 助手' : '我 (客服)'}
                        </span>
                      </div>
                      
                      <div className={`px-5 py-3.5 rounded-2xl text-base leading-relaxed ${
                        isAgent
                          ? 'bg-blue-600 text-white rounded-tr-sm'
                          : msg.sender === 'ai'
                            ? 'bg-purple-50 text-purple-900 border border-purple-100 rounded-tl-sm'
                            : 'bg-white text-gray-800 border border-gray-200 rounded-tl-sm shadow-sm'
                      }`}>
                        <p className="whitespace-pre-wrap">{msg.text}</p>
                      </div>
                      
                      <span className={`text-xs text-gray-400 mt-2 ${isAgent ? 'text-right' : 'text-left'}`}>
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
              <div className="p-6 border-t border-gray-200 bg-white space-y-4">
                <div className="flex gap-3 overflow-x-auto pb-2 scrollbar-thin">
                  {templates.map((tpl, i) => (
                    <button
                      key={i}
                      onClick={() => selectTemplate(tpl)}
                      className="px-4 py-2 rounded-xl bg-gray-100 hover:bg-gray-200 text-gray-700 text-sm font-medium whitespace-nowrap cursor-pointer transition-all"
                    >
                      <CornerDownRight className="w-4 h-4 inline mr-2 text-gray-400" />
                      {tpl.slice(0, 20)}...
                    </button>
                  ))}
                </div>

                <form onSubmit={handleSend} className="flex gap-4">
                  <input
                    type="text"
                    value={input}
                    onChange={(e) => setInput(e.target.value)}
                    placeholder="输入回复内容..."
                    className="flex-1 bg-gray-50 border border-gray-200 focus:border-blue-500 focus:ring-2 focus:ring-blue-200 outline-none rounded-xl px-6 py-4 text-base text-gray-900"
                  />
                  <button
                    type="submit"
                    disabled={!input.trim()}
                    className="px-8 bg-blue-600 hover:bg-blue-700 disabled:bg-gray-300 text-white font-bold text-base rounded-xl cursor-pointer transition-all"
                  >
                    发送
                  </button>
                </form>
              </div>
            ) : (
              <div className="p-6 border-t border-gray-200 bg-gray-50 text-center text-sm text-gray-500 font-medium">
                当前会话仍在排队中，点击左侧“接入”开始沟通。
              </div>
            )}
          </>
        ) : (
          <div className="flex-1 p-12 flex flex-col justify-center overflow-y-auto space-y-8 bg-gray-50/50">
            <div className="max-w-2xl mx-auto w-full text-center space-y-5">
              <div className="w-24 h-24 rounded-full bg-white border border-gray-100 flex items-center justify-center mx-auto shadow-sm">
                <Activity className="w-10 h-10 text-purple-600" />
              </div>
              <div>
                <h3 className="text-2xl font-bold text-gray-900">欢迎来到坐席控制台</h3>
                <p className="text-base text-gray-500 mt-2">系统已连接，正在监听访客流量...</p>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-6 max-w-2xl mx-auto w-full">
              <div className="p-6 rounded-2xl bg-white border border-gray-100 flex items-center gap-5 shadow-sm">
                <div className="p-4 bg-purple-50 rounded-xl">
                  <Users className="w-8 h-8 text-purple-600" />
                </div>
                <div>
                  <p className="text-sm text-gray-500 font-medium mb-1">活跃连接</p>
                  <p className="text-3xl font-bold text-gray-900">{metrics.activeConnections}</p>
                </div>
              </div>
              <div className="p-6 rounded-2xl bg-white border border-gray-100 flex items-center gap-5 shadow-sm">
                <div className="p-4 bg-blue-50 rounded-xl">
                  <MessageSquare className="w-8 h-8 text-blue-600" />
                </div>
                <div>
                  <p className="text-sm text-gray-500 font-medium mb-1">总处理量</p>
                  <p className="text-3xl font-bold text-gray-900">{metrics.totalRequests}</p>
                </div>
              </div>
            </div>

            <div className="p-6 rounded-2xl bg-purple-50/50 border border-purple-100 max-w-2xl mx-auto w-full text-left space-y-3">
              <h4 className="text-sm font-bold text-purple-800 flex items-center gap-2">
                <CheckCircle className="w-5 h-5 text-purple-600" />
                智能调度中心在线
              </h4>
              <p className="text-sm text-purple-700/80 leading-relaxed">
                所有通过 AI 转接的人工会话均会自动漫游历史上下文，确保您的服务体验无缝衔接。
              </p>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

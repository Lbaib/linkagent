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

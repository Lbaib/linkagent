import React, { useState } from 'react';
import { useSimulation } from '../context/SimulationContext';
import { Database, Settings, Plus, Trash2, Sliders, ShieldAlert, Layers } from 'lucide-react';

export const AdminConsole: React.FC = () => {
  const {
    knowledgeBase, addKnowledgeSegment, deleteKnowledgeSegment,
    agentConfig, updateAgentConfig
  } = useSimulation();

  const [activeTab, setActiveTab] = useState<'rag' | 'settings'>('rag');
  const [title, setTitle] = useState('');
  const [content, setContent] = useState('');

  const handleAddSegment = (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim() || !content.trim()) return;
    addKnowledgeSegment(title, content);
    setTitle('');
    setContent('');
  };

  return (
    <div className="flex flex-col flex-1 w-full bg-white rounded-3xl overflow-hidden shadow-premium border border-gray-200">
      {/* Header Tabs */}
      <div className="flex items-center justify-between px-8 py-6 border-b border-gray-100 bg-white">
        <div>
          <h3 className="text-xl font-bold text-gray-900">系统配置管理</h3>
          <p className="text-sm text-gray-500 mt-1">定制化配置知识库和业务规则参数</p>
        </div>

        <div className="flex gap-2 p-1.5 bg-gray-100 rounded-xl border border-gray-200">
          <button
            onClick={() => setActiveTab('rag')}
            className={`flex items-center gap-2 px-5 py-2.5 rounded-lg text-sm font-bold transition-all cursor-pointer ${
              activeTab === 'rag' 
                ? 'bg-white text-purple-700 shadow-sm border border-gray-200' 
                : 'text-gray-600 hover:text-gray-900 hover:bg-gray-200/50'
            }`}
          >
            <Database className="w-5 h-5" />
            知识库 (RAG)
          </button>
          <button
            onClick={() => setActiveTab('settings')}
            className={`flex items-center gap-2 px-5 py-2.5 rounded-lg text-sm font-bold transition-all cursor-pointer ${
              activeTab === 'settings' 
                ? 'bg-white text-purple-700 shadow-sm border border-gray-200' 
                : 'text-gray-600 hover:text-gray-900 hover:bg-gray-200/50'
            }`}
          >
            <Settings className="w-5 h-5" />
            业务流控策略
          </button>
        </div>
      </div>

      {/* Main Content Area */}
      <div className="flex-1 overflow-y-auto p-8 bg-gray-50">
        {activeTab === 'rag' ? (
          <div className="grid grid-cols-2 gap-8 h-full">
            {/* Form */}
            <div className="space-y-6">
              <div className="p-8 rounded-2xl bg-white border border-gray-200 space-y-6 shadow-sm">
                <h4 className="text-lg font-bold text-gray-900 flex items-center gap-3">
                  <div className="w-10 h-10 rounded-full bg-purple-50 flex items-center justify-center">
                     <Plus className="w-5 h-5 text-purple-600" />
                  </div>
                  新增知识入库
                </h4>
                <p className="text-sm text-gray-500">
                  录入后系统将自动分片并向量化，供 AI 坐席检索与应答。
                </p>

                <form onSubmit={handleAddSegment} className="space-y-5 pt-2">
                  <div className="space-y-2">
                    <label className="text-sm font-bold text-gray-700">知识点标题</label>
                    <input
                      type="text"
                      required
                      value={title}
                      onChange={(e) => setTitle(e.target.value)}
                      placeholder="例如：售后退换货政策"
                      className="w-full bg-gray-50 border border-gray-200 focus:border-purple-500 focus:ring-2 focus:ring-purple-200 outline-none rounded-xl px-4 py-3 text-base text-gray-900 transition-all"
                    />
                  </div>

                  <div className="space-y-2">
                    <label className="text-sm font-bold text-gray-700">知识详情</label>
                    <textarea
                      required
                      rows={6}
                      value={content}
                      onChange={(e) => setContent(e.target.value)}
                      placeholder="请录入具体的业务政策说明..."
                      className="w-full bg-gray-50 border border-gray-200 focus:border-purple-500 focus:ring-2 focus:ring-purple-200 outline-none rounded-xl px-4 py-3 text-base text-gray-900 resize-none transition-all"
                    />
                  </div>

                  <button
                    type="submit"
                    className="w-full py-4 rounded-xl bg-purple-600 hover:bg-purple-700 text-white font-bold text-base cursor-pointer transition-all flex items-center justify-center gap-2"
                  >
                    <Plus className="w-5 h-5" />
                    保存并向量化入库
                  </button>
                </form>
              </div>
            </div>

            {/* List */}
            <div className="space-y-4 flex flex-col h-full">
              <div className="flex items-center justify-between px-2 mb-2">
                <span className="text-sm font-bold text-gray-700">已入库条目 ({knowledgeBase.length})</span>
              </div>

              <div className="flex-1 overflow-y-auto space-y-4 pr-2">
                {knowledgeBase.map((seg) => (
                  <div 
                    key={seg.id}
                    className="p-6 rounded-2xl bg-white border border-gray-200 hover:border-purple-300 flex items-start justify-between gap-6 transition-all shadow-sm group"
                  >
                    <div className="space-y-3 flex-1">
                      <div className="flex items-center gap-3">
                        <h5 className="text-base font-bold text-gray-900">{seg.title}</h5>
                        <span className="text-xs px-2 py-1 rounded-md bg-gray-100 text-gray-500 font-mono">
                          ID: {seg.id}
                        </span>
                      </div>
                      <p className="text-sm text-gray-600 leading-relaxed bg-gray-50 p-3 rounded-xl border border-gray-100">{seg.content}</p>
                      
                      <div className="flex items-center gap-2 pt-1">
                        <Layers className="w-4 h-4 text-purple-500/70" />
                        <span className="text-xs font-mono text-purple-600/70 truncate w-48">向量: {seg.vector}</span>
                      </div>
                    </div>

                    <button
                      onClick={() => deleteKnowledgeSegment(seg.id)}
                      className="p-2.5 rounded-xl bg-gray-50 group-hover:bg-red-50 text-gray-400 group-hover:text-red-500 cursor-pointer transition-colors"
                      title="删除知识点"
                    >
                      <Trash2 className="w-5 h-5" />
                    </button>
                  </div>
                ))}
              </div>
            </div>
          </div>
        ) : (
          <div className="max-w-3xl mx-auto space-y-8">
            <div className="p-8 rounded-2xl bg-white border border-gray-200 space-y-8 shadow-sm">
              <h4 className="text-xl font-bold text-gray-900 flex items-center gap-3 border-b border-gray-100 pb-5">
                <div className="w-10 h-10 rounded-full bg-purple-50 flex items-center justify-center">
                   <Sliders className="w-5 h-5 text-purple-600" />
                </div>
                智能路由与分配策略
              </h4>

              <div className="space-y-4">
                <div className="flex justify-between items-center text-base">
                  <span className="font-bold text-gray-800">AI 拒识/转人工阈值 (Confidence)</span>
                  <span className="text-purple-700 font-mono font-bold px-3 py-1 bg-purple-50 rounded-lg border border-purple-100">{agentConfig.aiConfidenceThreshold}</span>
                </div>
                <input
                  type="range"
                  min="0.1"
                  max="0.95"
                  step="0.05"
                  value={agentConfig.aiConfidenceThreshold}
                  onChange={(e) => updateAgentConfig({ aiConfidenceThreshold: parseFloat(e.target.value) })}
                  className="w-full h-2.5 bg-gray-200 rounded-xl appearance-none cursor-pointer accent-purple-600"
                />
                <p className="text-sm text-gray-500 leading-relaxed">
                  决定 AI 的回答置信度标准。低于此标准的匹配结果将直接触发转人工。数值越高，AI 越严谨。
                </p>
              </div>

              <div className="space-y-4 pt-6 border-t border-gray-100">
                <div className="flex justify-between items-center text-base">
                  <span className="font-bold text-gray-800">单客服并行接待上限 (Concurrent)</span>
                  <span className="text-purple-700 font-mono font-bold px-3 py-1 bg-purple-50 rounded-lg border border-purple-100">{agentConfig.maxConcurrent} 人</span>
                </div>
                <input
                  type="range"
                  min="1"
                  max="10"
                  step="1"
                  value={agentConfig.maxConcurrent}
                  onChange={(e) => updateAgentConfig({ maxConcurrent: parseInt(e.target.value) })}
                  className="w-full h-2.5 bg-gray-200 rounded-xl appearance-none cursor-pointer accent-purple-600"
                />
                <p className="text-sm text-gray-500 leading-relaxed">
                  超过此上限后，后续访客请求人工将进入队列排队。
                </p>
              </div>
            </div>

            <div className="p-8 rounded-2xl bg-white border border-gray-200 space-y-8 shadow-sm">
              <h4 className="text-xl font-bold text-gray-900 flex items-center gap-3 border-b border-gray-100 pb-5">
                <div className="w-10 h-10 rounded-full bg-red-50 flex items-center justify-center">
                   <ShieldAlert className="w-5 h-5 text-red-600" />
                </div>
                网关流控保护
              </h4>

              <div className="space-y-4">
                <div className="flex justify-between items-center text-base">
                  <span className="font-bold text-gray-800">请求速率限制 (Rate Limit)</span>
                  <span className="text-red-700 font-mono font-bold px-3 py-1 bg-red-50 rounded-lg border border-red-100">{agentConfig.rateLimit} reqs/min</span>
                </div>
                <input
                  type="range"
                  min="5"
                  max="100"
                  step="5"
                  value={agentConfig.rateLimit}
                  onChange={(e) => updateAgentConfig({ rateLimit: parseInt(e.target.value) })}
                  className="w-full h-2.5 bg-gray-200 rounded-xl appearance-none cursor-pointer accent-red-600"
                />
                <p className="text-sm text-gray-500 leading-relaxed">
                  防范恶意刷单和异常流量攻击，当访问频次过高时将触发限流阻断。
                </p>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

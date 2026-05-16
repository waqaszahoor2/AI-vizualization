import React, { useState, useRef, useEffect, useCallback } from 'react';
import toast from 'react-hot-toast';
import { useStore } from '../store/useStore';
import { chatWithDashboard, getChatSuggestions, getChatModels, setKimiKey } from '../services/api';
import type { ChatMessage } from '../services/api';

interface Props {
  filePath: string;
  dashboardId?: string;
}

export default function ChatPanel({ filePath, dashboardId }: Props) {
  const { dashboard, setDashboard, addChart, updateChart, removeChart } = useStore();
  const [isOpen, setIsOpen] = useState(false);
  const [message, setMessage] = useState('');
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [suggestions, setSuggestions] = useState<string[]>([]);
  const [showSuggestions, setShowSuggestions] = useState(true);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLTextAreaElement>(null);

  // ── Model selector state ──────────────────────────────
  const [availableModels, setAvailableModels] = useState<string[]>([]);
  const [selectedModel, setSelectedModel] = useState<string>('');
  const [defaultModel, setDefaultModel] = useState<string>('');
  const [modelsLoading, setModelsLoading] = useState(false);
  const [showModelSelector, setShowModelSelector] = useState(false);

  // Kimi key state
  const [kimiKeyInput, setKimiKeyInput] = useState('');
  const [isSubmittingKey, setIsSubmittingKey] = useState(false);

  const handleSetKimiKey = async () => {
    if (!kimiKeyInput.trim()) return;
    setIsSubmittingKey(true);
    try {
      await setKimiKey(kimiKeyInput);
      toast.success('Kimi API Key updated!');
      // Refresh models
      setModelsLoading(true);
      const res = await getChatModels();
      setAvailableModels(res.models || []);
      setDefaultModel(res.default || '');
      setSelectedModel(res.default || '');
      setKimiKeyInput('');
    } catch (err) {
      toast.error('Failed to update API key');
    } finally {
      setIsSubmittingKey(false);
    }
  };

  // Load models on first open
  useEffect(() => {
    if (isOpen && availableModels.length === 0) {
      setModelsLoading(true);
      getChatModels()
        .then(res => {
          setAvailableModels(res.models || []);
          setDefaultModel(res.default || '');
          if (!selectedModel) {
            setSelectedModel(res.default || '');
          }
        })
        .catch(() => {})
        .finally(() => setModelsLoading(false));
    }
  }, [isOpen]);

  // Load suggestions on open
  useEffect(() => {
    if (isOpen && suggestions.length === 0) {
      getChatSuggestions(filePath)
        .then(s => setSuggestions(s))
        .catch(() => {});
    }
  }, [isOpen, filePath]);

  // Scroll to bottom on new message
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  // Focus input on open
  useEffect(() => {
    if (isOpen) {
      setTimeout(() => inputRef.current?.focus(), 300);
    }
  }, [isOpen]);

  const applyActions = useCallback((actions: any[]) => {
    if (!dashboard || !actions?.length) return;

    let updatedDashboard = { ...dashboard };
    let changeCount = 0;

    for (const action of actions) {
      switch (action.type) {
        case 'add_chart': {
          const newChart = {
            id: action.id || `chat_${Date.now()}`,
            type: action.chart_type || action.type_name || action.type || 'bar',
            title: action.title || 'New Chart',
            description: action.description || '',
            x_axis: action.x_axis || '',
            y_axis: Array.isArray(action.y_axis) ? action.y_axis : [action.y_axis].filter(Boolean),
            aggregation: action.aggregation || 'sum',
          };
          // Fix: if type is "add_chart", the chart type should come from a different field
          if (newChart.type === 'add_chart') {
            newChart.type = action.chart_type || 'bar';
          }
          updatedDashboard = {
            ...updatedDashboard,
            charts: [...updatedDashboard.charts, newChart],
          };
          changeCount++;
          break;
        }
        case 'remove_chart': {
          const cid = action.chart_id;
          updatedDashboard = {
            ...updatedDashboard,
            charts: updatedDashboard.charts.filter(c => c.id !== cid),
          };
          changeCount++;
          break;
        }
        case 'update_chart': {
          const chartId = action.chart_id;
          const updates: any = {};
          if (action.title) updates.title = action.title;
          if (action.chart_type) updates.type = action.chart_type;
          if (action.type_name) updates.type = action.type_name;
          if (action.x_axis) updates.x_axis = action.x_axis;
          if (action.y_axis) updates.y_axis = Array.isArray(action.y_axis) ? action.y_axis : [action.y_axis];
          if (action.aggregation) updates.aggregation = action.aggregation;
          const configPatch = action.config && typeof action.config === 'object' ? action.config : null;
          updatedDashboard = {
            ...updatedDashboard,
            charts: updatedDashboard.charts.map(c => {
              if (c.id !== chartId) return c;
              const next = { ...c, ...updates };
              if (configPatch) next.config = { ...(c.config || {}), ...configPatch };
              return next;
            }),
          };
          changeCount++;
          break;
        }
        case 'add_kpi': {
          const newKpi = {
            label: action.label || 'Metric',
            value: action.value ?? 0,
            format: action.format || 'number',
          };
          updatedDashboard = {
            ...updatedDashboard,
            kpis: [...updatedDashboard.kpis, newKpi],
          };
          changeCount++;
          break;
        }
        case 'remove_kpi': {
          const idx = typeof action.index === 'number' ? action.index : -1;
          if (idx >= 0 && idx < updatedDashboard.kpis.length) {
            updatedDashboard = {
              ...updatedDashboard,
              kpis: updatedDashboard.kpis.filter((_, i) => i !== idx),
            };
            changeCount++;
          }
          break;
        }
        case 'update_title': {
          if (action.title) {
            updatedDashboard = { ...updatedDashboard, title: action.title };
            changeCount++;
          }
          break;
        }
        case 'update_insights': {
          if (action.insights) {
            updatedDashboard = { ...updatedDashboard, insights: action.insights };
            changeCount++;
          }
          break;
        }
        case 'update_layout': {
          if (action.layout) {
            updatedDashboard = { ...updatedDashboard, layout: action.layout };
            changeCount++;
          }
          break;
        }
      }
    }

    if (changeCount > 0) {
      updatedDashboard.version = (updatedDashboard.version || 1) + 1;
      setDashboard(updatedDashboard);
      toast.success(`Applied ${changeCount} change${changeCount > 1 ? 's' : ''} to dashboard`);
    }
  }, [dashboard, setDashboard]);

  const handleSend = async (text?: string) => {
    const msg = (text || message).trim();
    if (!msg || isLoading) return;

    const userMsg: ChatMessage = { role: 'user', content: msg, timestamp: new Date().toISOString() };
    setMessages(prev => [...prev, userMsg]);
    setMessage('');
    setShowSuggestions(false);
    setIsLoading(true);

    try {
      const response = await chatWithDashboard(
        msg,
        filePath,
        dashboardId,
        dashboard?.charts,
        dashboard?.kpis,
        [...messages, userMsg],
        selectedModel || undefined
      );

      const assistantMsg: ChatMessage = {
        role: 'assistant',
        content: response.reply,
        actions: response.actions,
        timestamp: new Date().toISOString(),
      };
      setMessages(prev => [...prev, assistantMsg]);

      // Apply actions to dashboard
      if (response.actions?.length) {
        applyActions(response.actions);
      }
    } catch (err: any) {
      const errorMsg: ChatMessage = {
        role: 'assistant',
        content: '⚠️ Sorry, I couldn\'t process that. The AI model might still be loading. Please try again.',
        timestamp: new Date().toISOString(),
      };
      setMessages(prev => [...prev, errorMsg]);
    } finally {
      setIsLoading(false);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  const getModelShortName = (model: string) => {
    // "deepseek-r1:8b" → "deepseek-r1:8b"  but truncate long names
    if (model.length > 22) return model.substring(0, 20) + '…';
    return model;
  };

  return (
    <>
      {/* Floating Toggle Button */}
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="chat-toggle-btn"
        title="AI Dashboard Assistant"
      >
        {isOpen ? (
          <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <line x1="18" y1="6" x2="6" y2="18" />
            <line x1="6" y1="6" x2="18" y2="18" />
          </svg>
        ) : (
          <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z" />
            <path d="M8 10h.01" />
            <path d="M12 10h.01" />
            <path d="M16 10h.01" />
          </svg>
        )}
        {!isOpen && messages.length === 0 && (
          <span className="chat-badge">AI</span>
        )}
      </button>

      {/* Chat Panel */}
      <div className={`chat-panel ${isOpen ? 'chat-panel-open' : 'chat-panel-closed'}`}>
        {/* Header */}
        <div className="chat-header">
          <div className="flex items-center gap-3">
            <div className="chat-avatar">
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <path d="M12 2a4 4 0 0 1 4 4v2a4 4 0 0 1-8 0V6a4 4 0 0 1 4-4z" />
                <path d="M6 10a6 6 0 0 0 12 0" />
                <path d="M12 14v4" />
                <path d="M8 22h8" />
              </svg>
            </div>
            <div>
              <h3 className="text-sm font-semibold text-slate-900 dark:text-white">Dashboard AI</h3>
              <p className="text-[10px] text-slate-500 dark:text-white/40">Modify your dashboard with AI</p>
            </div>
          </div>
          <div className="flex items-center gap-1">
            {/* Model Selector Toggle */}
            <button
              onClick={() => setShowModelSelector(!showModelSelector)}
              className={`p-1.5 rounded-lg transition-all text-xs flex items-center gap-1 ${
                showModelSelector ? 'bg-brand-500/20 text-brand-600 dark:text-brand-300' : 'hover:bg-black/5 dark:hover:bg-white/10 text-slate-400 dark:text-white/40 hover:text-slate-900 dark:hover:text-white'
              }`}
              title="Select AI Model"
            >
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <circle cx="12" cy="12" r="3" />
                <path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 0 1 0 2.83 2 2 0 0 1-2.83 0l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-2 2 2 2 0 0 1-2-2v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 0 1-2.83 0 2 2 0 0 1 0-2.83l.06-.06A1.65 1.65 0 0 0 4.68 15a1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1-2-2 2 2 0 0 1 2-2h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 0 1 0-2.83 2 2 0 0 1 2.83 0l.06.06A1.65 1.65 0 0 0 9 4.68a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 2-2 2 2 0 0 1 2 2v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 0 1 2.83 0 2 2 0 0 1 0 2.83l-.06.06A1.65 1.65 0 0 0 19.4 9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 2 2 2 2 0 0 1-2 2h-.09a1.65 1.65 0 0 0-1.51 1z" />
              </svg>
            </button>
            <button
              onClick={() => setIsOpen(false)}
              className="p-1.5 rounded-lg hover:bg-black/5 dark:hover:bg-white/10 text-slate-400 dark:text-white/40 hover:text-slate-900 dark:hover:text-white transition-all"
            >
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <polyline points="6 9 12 15 18 9" />
              </svg>
            </button>
          </div>
        </div>

        {/* Model Selector Dropdown */}
        {showModelSelector && (
          <div className="model-selector-panel border-b border-black/5 dark:border-white/5 bg-black/[0.02] dark:bg-white/[0.02]">
            <div className="flex items-center justify-between mb-2 px-1">
              <span className="text-[10px] text-slate-400 dark:text-white/30 uppercase tracking-wider font-medium">Select AI Model</span>
              {modelsLoading && (
                <div className="w-3 h-3 border-2 border-brand-500/30 border-t-brand-500 rounded-full animate-spin" />
              )}
            </div>
            {availableModels.length > 0 ? (
              <div className="model-list">
                {availableModels.map(model => (
                  <button
                    key={model}
                    onClick={() => {
                      setSelectedModel(model);
                      setShowModelSelector(false);
                      toast.success(`Model switched to ${model}`);
                    }}
                    className={`model-item ${
                      selectedModel === model ? 'model-item-active bg-brand-500/10 text-brand-600 dark:text-brand-300' : 'text-slate-600 dark:text-white/70 hover:bg-black/5 dark:hover:bg-white/5'
                    }`}
                  >
                    <div className="flex items-center gap-2">
                      <div className={`w-2 h-2 rounded-full ${
                        selectedModel === model ? 'bg-brand-500' : 'bg-slate-300 dark:bg-white/20'
                      }`} />
                      <span className="text-xs font-medium">{model}</span>
                    </div>
                    {model === defaultModel && (
                      <span className="text-[9px] px-1.5 py-0.5 rounded-full bg-brand-500/10 text-brand-600 dark:text-brand-300">default</span>
                    )}
                  </button>
                ))}
              </div>
            ) : (
              <div className="py-2 px-1">
                <p className="text-xs text-slate-500 dark:text-white/40 text-center mb-3">
                  {modelsLoading ? 'Loading models...' : 'No models found. Is Ollama running?'}
                </p>
                <div className="border-t border-black/5 dark:border-white/10 pt-3 mt-1">
                  <p className="text-[10px] text-brand-600 dark:text-brand-300 font-medium mb-1.5 uppercase tracking-wider">Use Moonshot (Kimi) Instead</p>
                  <div className="flex gap-1.5">
                    <input 
                      type="password"
                      placeholder="Paste API Key (sk-...)"
                      value={kimiKeyInput}
                      onChange={e => setKimiKeyInput(e.target.value)}
                      onKeyDown={e => e.key === 'Enter' && handleSetKimiKey()}
                      className="flex-1 bg-black/5 dark:bg-[#121212] border border-black/10 dark:border-white/10 rounded px-2.5 py-1.5 text-xs text-slate-900 dark:text-white focus:outline-none focus:border-brand-500 placeholder-slate-400 dark:placeholder-white/20 transition-colors"
                    />
                    <button 
                      onClick={handleSetKimiKey}
                      disabled={isSubmittingKey || !kimiKeyInput.trim()}
                      className="bg-brand-500/20 text-brand-600 dark:text-brand-300 hover:bg-brand-500 hover:text-white px-3 py-1.5 rounded text-xs font-medium disabled:opacity-50 transition-colors"
                    >
                      {isSubmittingKey ? '...' : 'Save'}
                    </button>
                  </div>
                </div>
              </div>
            )}
          </div>
        )}

        {/* Messages Area */}
        <div className="chat-messages">
          {/* Welcome message */}
          {messages.length === 0 && (
            <div className="chat-welcome">
              <div className="chat-welcome-icon">✨</div>
              <h4 className="text-sm font-semibold text-slate-900 dark:text-white mb-1">Dashboard AI Assistant</h4>
              <p className="text-xs text-slate-500 dark:text-white/40 leading-relaxed">
                Ask me to add charts, modify visualizations, add KPIs, or change your dashboard layout.
              </p>
              {selectedModel && (
                <div className="mt-2 flex items-center gap-1.5 justify-center">
                  <div className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
                  <span className="text-[10px] text-slate-400 dark:text-white/30">Using {getModelShortName(selectedModel)}</span>
                </div>
              )}
            </div>
          )}

          {/* Messages */}
          {messages.map((msg, i) => (
            <div key={i} className={`chat-message ${msg.role === 'user' ? 'chat-message-user' : 'chat-message-assistant'}`}>
              {msg.role === 'assistant' && (
                <div className="chat-msg-avatar">
                  <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                    <polygon points="13 2 3 14 12 14 11 22 21 10 12 10 13 2" />
                  </svg>
                </div>
              )}
              <div className={`chat-bubble ${msg.role === 'user' ? 'chat-bubble-user' : 'chat-bubble-assistant'}`}>
                <p className="text-[13px] leading-relaxed whitespace-pre-wrap">{msg.content}</p>
                {msg.actions && msg.actions.length > 0 && (
                  <div className="chat-actions-badge">
                    <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                      <polyline points="20 6 9 17 4 12" />
                    </svg>
                    {msg.actions.length} change{msg.actions.length > 1 ? 's' : ''} applied
                  </div>
                )}
              </div>
            </div>
          ))}

          {/* Loading indicator */}
          {isLoading && (
            <div className="chat-message chat-message-assistant">
              <div className="chat-msg-avatar">
                <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                  <polygon points="13 2 3 14 12 14 11 22 21 10 12 10 13 2" />
                </svg>
              </div>
              <div className="chat-bubble chat-bubble-assistant">
                <div className="chat-typing">
                  <span></span><span></span><span></span>
                </div>
              </div>
            </div>
          )}

          <div ref={messagesEndRef} />
        </div>

        {/* Suggestions */}
        {showSuggestions && suggestions.length > 0 && messages.length === 0 && (
          <div className="chat-suggestions">
            <p className="text-[10px] text-slate-400 dark:text-white/30 uppercase tracking-wider font-medium mb-2 px-1">Quick Actions</p>
            <div className="flex flex-col gap-1.5">
              {suggestions.slice(0, 5).map((s, i) => (
                <button
                  key={i}
                  onClick={() => handleSend(s)}
                  className="chat-suggestion-btn text-slate-600 dark:text-white/70 hover:bg-black/5 dark:hover:bg-white/5"
                >
                  <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="shrink-0 opacity-50">
                    <polygon points="13 2 3 14 12 14 11 22 21 10 12 10 13 2" />
                  </svg>
                  <span className="truncate">{s}</span>
                </button>
              ))}
            </div>
          </div>
        )}

        {/* Input Area */}
        <div className="chat-input-area">
          {/* Active model indicator */}
          {selectedModel && (
            <div className="flex items-center gap-1.5 px-3 pb-1">
              <div className="w-1.5 h-1.5 rounded-full bg-emerald-500" />
              <span className="text-[10px] text-slate-400 dark:text-white/25">{getModelShortName(selectedModel)}</span>
              <button
                onClick={() => setShowModelSelector(true)}
                className="text-[10px] text-brand-600 dark:text-brand-400/60 hover:text-brand-500 dark:hover:text-brand-300 ml-auto"
              >
                change
              </button>
            </div>
          )}
          <div className="chat-input-wrapper">
            <textarea
              ref={inputRef}
              value={message}
              onChange={e => setMessage(e.target.value)}
              onKeyDown={handleKeyDown}
              placeholder="Ask AI to modify your dashboard..."
              className="chat-input"
              rows={1}
              disabled={isLoading}
            />
            <button
              onClick={() => handleSend()}
              disabled={!message.trim() || isLoading}
              className="chat-send-btn"
            >
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                <line x1="22" y1="2" x2="11" y2="13" />
                <polygon points="22 2 15 22 11 13 2 9 22 2" />
              </svg>
            </button>
          </div>
        </div>
      </div>
    </>
  );
}

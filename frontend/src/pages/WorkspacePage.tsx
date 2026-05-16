import React, { useState, useCallback, useEffect } from 'react';
import axios from 'axios';
import { useDropzone } from 'react-dropzone';
import toast from 'react-hot-toast';
import { useStore } from '../store/useStore';
import {
  uploadFile,
  generateDashboard,
  generateDashboardFromImage,
  getPresetPrompts,
  aiHealth,
} from '../services/api';
import DashboardView from '../components/DashboardView';
import type { PresetPrompt, CustomPromptEntry } from '../types';

const CUSTOM_PROMPTS_KEY = 'ai-viz-custom-prompts';

function loadCustomPrompts(): CustomPromptEntry[] {
  try {
    const raw = localStorage.getItem(CUSTOM_PROMPTS_KEY);
    if (!raw) return [];
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
}

function saveCustomPrompts(entries: CustomPromptEntry[]) {
  localStorage.setItem(CUSTOM_PROMPTS_KEY, JSON.stringify(entries));
}

export default function WorkspacePage() {
  const {
    uploadData,
    setUploadData,
    dashboard,
    setDashboard,
    setDashboardFilters,
    isGenerating,
    setIsGenerating,
    generationStep,
    setGenerationStep,
  } = useStore();
  const [prompt, setPrompt] = useState('');
  const [presets, setPresets] = useState<PresetPrompt[]>([]);
  const [customPrompts, setCustomPrompts] = useState<CustomPromptEntry[]>(() => loadCustomPrompts());
  const [refImage, setRefImage] = useState<string | null>(null);
  const [ollamaStatus, setOllamaStatus] = useState<string>('');
  const [showPromptSettings, setShowPromptSettings] = useState(false);
  const [newPromptTitle, setNewPromptTitle] = useState('');
  const [newPromptBody, setNewPromptBody] = useState('');
  const [step, setStep] = useState<'upload' | 'prompt' | 'dashboard'>(dashboard ? 'dashboard' : uploadData ? 'prompt' : 'upload');
  const [elapsedSeconds, setElapsedSeconds] = useState(0);
  const timerRef = React.useRef<NodeJS.Timeout | null>(null);
  const abortControllerRef = React.useRef<AbortController | null>(null);

  const handleStop = useCallback(() => {
    if (abortControllerRef.current) {
      abortControllerRef.current.abort();
      abortControllerRef.current = null;
    }
  }, []);

  const refreshAiHealth = useCallback(() => {
    aiHealth()
      .then((d: { status?: string; models?: string[] }) => {
        if (d.status === 'healthy') {
          const n = d.models?.length ?? 0;
          setOllamaStatus(n ? `Connected — ${n} model(s) available` : 'Connected');
        } else setOllamaStatus(typeof d === 'object' && d && 'error' in d ? String((d as { error?: string }).error) : 'Unreachable');
      })
      .catch(() => setOllamaStatus('Unreachable (is the API running?)'));
  }, []);

  useEffect(() => {
    refreshAiHealth();
  }, [refreshAiHealth]);

  // File upload handler
  const onDrop = useCallback(async (files: File[]) => {
    if (files.length === 0) return;
    const file = files[0];
    try {
      setIsGenerating(true);
      setGenerationStep('Uploading and profiling dataset...');
      const result = await uploadFile(file);
      setUploadData(result);
      setDashboardFilters([]);
      toast.success(`Uploaded ${result.file_name} — ${result.metadata.rows_count.toLocaleString()} rows`);

      // Load presets
      try {
        const p = await getPresetPrompts();
        setPresets(p);
      } catch { }

      setStep('prompt');
    } catch (err: any) {
      toast.error(err?.response?.data?.detail || 'Upload failed');
    } finally {
      setIsGenerating(false);
      setGenerationStep('');
    }
  }, []);

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    accept: { 'text/csv': ['.csv'], 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet': ['.xlsx'], 'application/vnd.ms-excel': ['.xls'] },
    maxFiles: 1,
    maxSize: 50 * 1024 * 1024,
    onDropRejected: (rejections) => {
      const first = rejections?.[0];
      if (!first) {
        toast.error('File rejected');
        return;
      }
      const err = first.errors?.[0];
      if (err?.code === 'file-too-large') {
        toast.error('File too large. Max 50MB (CSV/XLSX/XLS).');
        return;
      }
      if (err?.code === 'file-invalid-type') {
        toast.error('Invalid file type. Use CSV, XLSX, or XLS.');
        return;
      }
      toast.error(err?.message || 'File rejected');
    },
  });

  // Dashboard generation handler
  const handleGenerate = async () => {
    if (!uploadData || !prompt.trim()) {
      toast.error('Please enter a prompt');
      return;
    }
    try {
      setIsGenerating(true);
      setElapsedSeconds(0);
      timerRef.current = setInterval(() => {
        setElapsedSeconds(prev => prev + 1);
      }, 1000);

      abortControllerRef.current = new AbortController();

      setGenerationStep('AI is analyzing your data...');

      setTimeout(() => setGenerationStep('Generating chart configurations (Est. 10s)...'), 4000);
      setTimeout(() => setGenerationStep('Building dashboard layout (Est. 20s)...'), 12000);
      setTimeout(() => setGenerationStep('Finalizing visualizations...'), 20000);

      const result = refImage
        ? await generateDashboardFromImage(uploadData.file_path, refImage, prompt.trim(), undefined, abortControllerRef.current.signal)
        : await generateDashboard(uploadData.file_path, prompt.trim(), undefined, abortControllerRef.current.signal);

      setDashboard(result.dashboard);
      toast.success(refImage ? 'Dashboard generated from your reference image!' : 'Dashboard generated successfully!');
      setStep('dashboard');
    } catch (err: any) {
      if (err.name === 'CanceledError' || axios.isCancel(err)) {
        toast('stopped');
      } else {
        toast.error(err?.response?.data?.detail || 'Generation failed');
      }
    } finally {
      setIsGenerating(false);
      setGenerationStep('');
      if (timerRef.current) {
        clearInterval(timerRef.current);
        timerRef.current = null;
      }
    }
  };

  // Step 3: Dashboard view
  if (step === 'dashboard' && dashboard) {
    return <DashboardView onBack={() => setStep('prompt')} />;
  }

  return (
    <div className="max-w-[1000px] mx-auto px-6 py-12">
      {/* Step indicator */}
      <div className="flex items-center justify-center gap-4 mb-12">
        {['Upload Data', 'Describe Dashboard', 'View Dashboard'].map((label, i) => {
          const stepIndex = i + 1;
          const currentIdx = step === 'upload' ? 1 : step === 'prompt' ? 2 : 3;
          const active = stepIndex <= currentIdx;
          return (
            <React.Fragment key={label}>
              {i > 0 && <div className={`h-px w-12 ${active ? 'bg-brand-500' : 'bg-black/10 dark:bg-white/10'} transition-colors`} />}
              <div className="flex items-center gap-2">
                <div className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-semibold transition-all ${active ? 'bg-brand-500 text-white' : 'bg-black/[0.06] dark:bg-white/[0.06] text-slate-400 dark:text-white/30'}`}>
                  {stepIndex}
                </div>
                <span className={`text-sm hidden sm:inline ${active ? 'text-slate-900 dark:text-white' : 'text-slate-400 dark:text-white/30'}`}>{label}</span>
              </div>
            </React.Fragment>
          );
        })}
      </div>

      {/* Features Ribbon */}
      <div className="max-w-4xl mx-auto grid grid-cols-2 md:grid-cols-4 gap-4 mb-10">
        {[
          { icon: '🤖', label: 'Local AI Analysis' },
          { icon: '📊', label: '25+ Chart Types' },
          { icon: '🔒', label: '100% Privacy' },
          { icon: '⚡', label: 'Instant Dashboard' }
        ].map(f => (
          <div key={f.label} className="flex items-center gap-3 p-3.5 rounded-2xl bg-white dark:bg-white/[0.03] border border-black/[0.06] dark:border-white/[0.06] shadow-sm shadow-black/[0.02] dark:shadow-none hover:border-brand-500/30 transition-all duration-300">
            <span className="text-2xl">{f.icon}</span>
            <span className="text-[10px] font-bold uppercase tracking-widest text-slate-500 dark:text-white/40 leading-tight">{f.label}</span>
          </div>
        ))}
      </div>

      {/* Step 1: Upload */}
      {step === 'upload' && (
        <div className="animate-fade-in">
          <h1 className="text-3xl font-bold text-center mb-2">Upload Your Dataset</h1>
          <p className="text-slate-500 dark:text-white/40 text-center mb-10">Drag and drop a CSV or Excel file to begin</p>

          <div
            {...getRootProps()}
            className={`glass-card p-16 text-center cursor-pointer transition-all duration-300 hover:border-brand-500/30 ${isDragActive ? 'border-brand-500/50 bg-brand-500/[0.05]' : ''} ${isGenerating ? 'pointer-events-none opacity-60' : ''}`}
          >
            <input {...getInputProps()} />
            {isGenerating ? (
              <div>
                <div className="w-12 h-12 mx-auto mb-4 border-4 border-brand-500/30 border-t-brand-500 rounded-full animate-spin" />
                <p className="text-slate-600 dark:text-white/60">{generationStep}</p>
              </div>
            ) : (
              <>
                <div className="text-6xl mb-4">📁</div>
                <p className="text-lg font-medium mb-2">
                  {isDragActive ? 'Drop your file here' : 'Drag & drop your dataset'}
                </p>
                <p className="text-slate-400 dark:text-white/40 text-sm">Supports CSV, XLSX, XLS — up to 50MB</p>
              </>
            )}
          </div>
        </div>
      )}

      {/* Step 2: Prompt */}
      {step === 'prompt' && uploadData && (
        <div className="animate-fade-in">
          <h1 className="text-3xl font-bold text-center mb-2">Describe Your Dashboard</h1>
          <p className="text-slate-500 dark:text-white/40 text-center mb-8">Tell AI what kind of dashboard you want — or match a screenshot (Ollama vision)</p>

          <div className="flex flex-col sm:flex-row items-center justify-center gap-3 mb-6">
            <div className={`text-xs px-4 py-2 rounded-xl border ${ollamaStatus.includes('Connected') ? 'border-emerald-500/30 text-emerald-600 dark:text-emerald-300 bg-emerald-500/5' : 'border-amber-500/20 text-amber-600 dark:text-amber-200/80 bg-amber-500/5'}`}>
              AI: {ollamaStatus || 'Checking…'}
            </div>
            <button type="button" onClick={refreshAiHealth} className="text-xs text-slate-400 dark:text-white/40 hover:text-slate-700 dark:hover:text-white/70 underline">
              Refresh status
            </button>
            <button
              type="button"
              onClick={() => setShowPromptSettings(s => !s)}
              className="btn-secondary text-xs py-2 px-4"
            >
              ⚙ Prompt library &amp; settings
            </button>
          </div>

          {showPromptSettings && (
            <div className="glass-card p-5 mb-8 space-y-4 max-w-3xl mx-auto">
              <p className="text-sm text-slate-500 dark:text-white/50">
                Save reusable prompts here. Image-based layouts need{' '}
                <strong className="text-slate-700 dark:text-white/70">Ollama</strong> with a vision model (e.g. <code className="text-brand-600 dark:text-brand-300">llava</code>).
              </p>
              <div className="flex flex-wrap gap-2">
                {customPrompts.map(entry => (
                  <div key={entry.id} className="flex items-center gap-1 px-3 py-1.5 rounded-lg bg-black/[0.04] dark:bg-white/[0.04] border border-black/10 dark:border-white/10 text-xs">
                    <button type="button" className="text-brand-600 dark:text-brand-300 hover:underline" onClick={() => setPrompt(entry.prompt)}>
                      {entry.title}
                    </button>
                    <button
                      type="button"
                      className="text-red-400/70 hover:text-red-400"
                      onClick={() => {
                        const next = customPrompts.filter(e => e.id !== entry.id);
                        setCustomPrompts(next);
                        saveCustomPrompts(next);
                      }}
                    >
                      ×
                    </button>
                  </div>
                ))}
              </div>
              <div className="grid sm:grid-cols-2 gap-2">
                <input
                  className="input-field text-sm"
                  placeholder="Shortcut name"
                  value={newPromptTitle}
                  onChange={e => setNewPromptTitle(e.target.value)}
                />
                <button
                  type="button"
                  className="btn-secondary text-sm py-2"
                  onClick={() => {
                    if (!newPromptTitle.trim() || !prompt.trim()) {
                      toast.error('Enter a name and use the main prompt box for text to save');
                      return;
                    }
                    const entry: CustomPromptEntry = {
                      id: `c_${Date.now()}`,
                      title: newPromptTitle.trim(),
                      prompt: prompt.trim(),
                    };
                    const next = [...customPrompts, entry];
                    setCustomPrompts(next);
                    saveCustomPrompts(next);
                    setNewPromptTitle('');
                    toast.success('Saved to library');
                  }}
                >
                  Save current prompt to library
                </button>
              </div>
              <textarea
                className="input-field w-full text-sm h-20 resize-none"
                placeholder="Or type a new template body here, then Save…"
                value={newPromptBody}
                onChange={e => setNewPromptBody(e.target.value)}
              />
              <button
                type="button"
                className="btn-secondary text-xs py-2 px-3"
                onClick={() => {
                  if (!newPromptTitle.trim() || !newPromptBody.trim()) {
                    toast.error('Name and template body required');
                    return;
                  }
                  const entry: CustomPromptEntry = {
                    id: `c_${Date.now()}`,
                    title: newPromptTitle.trim(),
                    prompt: newPromptBody.trim(),
                  };
                  const next = [...customPrompts, entry];
                  setCustomPrompts(next);
                  saveCustomPrompts(next);
                  setNewPromptTitle('');
                  setNewPromptBody('');
                  toast.success('Template saved');
                }}
              >
                Save template from boxes above
              </button>
            </div>
          )}

          {/* Dataset info */}
          <div className="glass-card p-5 mb-8">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="text-2xl">📊</div>
                <div>
                  <p className="font-semibold">{uploadData.file_name}</p>
                  <p className="text-sm text-slate-500 dark:text-white/40">
                    {uploadData.metadata.rows_count.toLocaleString()} rows × {uploadData.metadata.columns_count} columns
                  </p>
                </div>
              </div>
              <button onClick={() => { setUploadData(null); setStep('upload'); }} className="text-slate-400 dark:text-white/30 hover:text-slate-900 dark:hover:text-white/60 text-sm">
                Change file
              </button>
            </div>

            {/* Column preview */}
            <div className="mt-4 flex flex-wrap gap-2">
              {uploadData.metadata.columns_info.slice(0, 12).map(col => (
                <span key={col.name} className={`px-3 py-1 rounded-full text-xs border ${col.is_numeric ? 'border-emerald-500/20 text-emerald-600 dark:text-emerald-400 bg-emerald-500/5' : col.is_datetime ? 'border-blue-500/20 text-blue-600 dark:text-blue-400 bg-blue-500/5' : 'border-purple-500/20 text-purple-600 dark:text-purple-400 bg-purple-500/5'}`}>
                  {col.name}
                </span>
              ))}
              {uploadData.metadata.columns_info.length > 12 && (
                <span className="px-3 py-1 rounded-full text-xs border border-black/10 dark:border-white/10 text-slate-400 dark:text-white/40">
                  +{uploadData.metadata.columns_info.length - 12} more
                </span>
              )}
            </div>
          </div>

          {/* Reference dashboard image (optional) */}
          <div className="glass-card p-5 mb-6 max-w-3xl mx-auto">
            <p className="text-sm text-slate-500 dark:text-white/50 mb-2">Reference layout (optional)</p>
            <p className="text-xs text-slate-400 dark:text-white/30 mb-3">
              Upload a screenshot of a dashboard you like. The model will try to recreate a similar layout using your dataset columns (requires Ollama + vision model).
            </p>
            <div className="flex flex-wrap items-center gap-4">
              <label className="btn-secondary text-sm py-2 px-4 cursor-pointer">
                <input
                  type="file"
                  accept="image/*"
                  className="hidden"
                  onChange={e => {
                    const f = e.target.files?.[0];
                    if (!f) return;
                    const r = new FileReader();
                    r.onload = () => setRefImage(r.result as string);
                    r.readAsDataURL(f);
                  }}
                />
                📷 Choose image
              </label>
              {refImage && (
                <>
                  <img src={refImage} alt="Reference" className="h-16 rounded-lg border border-black/10 dark:border-white/10 object-cover" />
                  <button type="button" className="text-xs text-slate-400 dark:text-white hover:text-slate-900 dark:hover:text-white" onClick={() => setRefImage(null)}>
                    Remove image
                  </button>
                </>
              )}
            </div>
          </div>

          {/* Prompt input */}
          <div className="mb-6">
            <textarea
              value={prompt}
              onChange={e => setPrompt(e.target.value)}
              placeholder="e.g., Create a sales dashboard showing trends, top products, regional performance, and profit analysis"
              className="input-field w-full h-32 resize-none text-base"
              disabled={isGenerating}
            />
          </div>

          {/* Preset prompts */}
          {presets.length > 0 && (
            <div className="mb-8">
              <p className="text-sm text-slate-500 dark:text-white/40 mb-3">Quick prompts:</p>
              <div className="flex flex-wrap gap-2">
                {presets.map(p => (
                  <button key={p.id} type="button" onClick={() => setPrompt(p.prompt)} className="px-4 py-2 rounded-xl bg-black/[0.04] dark:bg-white/[0.04] border border-black/[0.06] dark:border-white/[0.06] text-sm text-slate-600 dark:text-white/60 hover:bg-brand-500/10 hover:border-brand-500/20 hover:text-brand-600 dark:hover:text-brand-300 transition-all">
                    {p.title}
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* Generate button & Loading State */}
          <div className="w-full">
            {isGenerating ? (
              <div className="w-full py-6 rounded-2xl bg-white dark:bg-white/[0.03] border border-black/[0.08] dark:border-white/[0.08] shadow-xl flex flex-col items-center gap-3 animate-pulse-slow">
                <div className="flex items-center justify-center gap-4">
                  <div className="w-6 h-6 border-3 border-brand-500/30 border-t-brand-500 rounded-full animate-spin" />
                  <div className="flex flex-col">
                    <span className="text-base font-bold text-slate-700 dark:text-white/90 leading-none mb-1">{generationStep}</span>
                    <span className="text-[11px] font-medium text-slate-400 dark:text-white/40 tracking-widest uppercase">Time Elapsed: {elapsedSeconds}s</span>
                  </div>
                </div>

                <button
                  type="button"
                  onClick={handleStop}
                  className="px-6 py-2 rounded-xl bg-red-500/5 hover:bg-red-500 border border-red-500/20 text-red-600 dark:text-red-400 hover:text-white text-xs font-bold uppercase tracking-wider transition-all hover:shadow-lg hover:shadow-red-500/20"
                >
                  Stop Generation
                </button>
              </div>
            ) : (
              <button
                onClick={handleGenerate}
                disabled={!prompt.trim()}
                className={`w-full py-4 rounded-2xl text-lg font-bold transition-all shadow-xl ${!prompt.trim()
                    ? 'bg-black/5 dark:bg-white/5 text-slate-400 dark:text-white/20 cursor-not-allowed'
                    : 'bg-brand-600 dark:bg-brand-500 text-white shadow-brand-500/20 hover:shadow-brand-500/40 hover:-translate-y-1'
                  }`}
              >
                {refImage ? '🖼 Generate from image + prompt' : '🚀 Generate Visualization'}
              </button>
            )}
          </div>
        </div>
      )}
    </div>
  );
}

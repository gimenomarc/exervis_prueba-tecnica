'use client';

import { useState } from 'react';
import { Mail, Zap, Play, Loader2, Activity } from 'lucide-react';

interface TopBarProps {
  onAutoTrigger: () => void;
  onManualProcess: () => void;
  isProcessing: boolean;
}

export default function TopBar({ onAutoTrigger, onManualProcess, isProcessing }: TopBarProps) {
  const [autoEnabled, setAutoEnabled] = useState(false);

  const handleToggle = () => {
    setAutoEnabled(!autoEnabled);
    if (!autoEnabled) {
      onAutoTrigger();
    }
  };

  return (
    <header className="border-b border-white/[0.06] bg-[#0a0a0f]/80 backdrop-blur-xl">
      <div className="flex h-16 items-center justify-between px-6">
        {/* Logo & Title */}
        <div className="flex items-center gap-3">
          <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-gradient-to-br from-violet-500 to-indigo-600 shadow-lg shadow-violet-500/25">
            <Mail className="h-4.5 w-4.5 text-white" />
          </div>
          <div>
            <h1 className="text-sm font-semibold tracking-tight text-white">
              Exervis Mail Triage
            </h1>
            <p className="text-[11px] text-zinc-500">Gestión inteligente de correo</p>
          </div>
        </div>

        {/* Actions */}
        <div className="flex items-center gap-3">
          {/* Status indicator */}
          <div className="mr-2 flex items-center gap-2 rounded-full border border-white/[0.06] bg-white/[0.03] px-3 py-1.5">
            <Activity className={`h-3.5 w-3.5 ${autoEnabled ? 'text-emerald-400' : 'text-zinc-600'}`} />
            <span className="text-xs text-zinc-400">
              {autoEnabled ? 'Escuchando' : 'Inactivo'}
            </span>
          </div>

          {/* Auto-Trigger Toggle */}
          <button
            id="btn-auto-trigger"
            onClick={handleToggle}
            className={`group relative flex items-center gap-2 rounded-lg border px-4 py-2 text-xs font-medium transition-all duration-300 ${
              autoEnabled
                ? 'border-emerald-500/30 bg-emerald-500/10 text-emerald-400 shadow-lg shadow-emerald-500/10 hover:bg-emerald-500/20'
                : 'border-white/[0.08] bg-white/[0.03] text-zinc-400 hover:border-white/[0.15] hover:bg-white/[0.06] hover:text-white'
            }`}
          >
            <Zap className={`h-3.5 w-3.5 transition-transform duration-300 ${
              autoEnabled ? 'text-emerald-400' : 'group-hover:scale-110'
            }`} />
            <span>{autoEnabled ? 'Auto-Trigger ON' : 'Auto-Trigger OFF'}</span>
            {/* Toggle indicator */}
            <div className={`ml-1 h-4 w-8 rounded-full p-0.5 transition-colors duration-300 ${
              autoEnabled ? 'bg-emerald-500' : 'bg-zinc-700'
            }`}>
              <div className={`h-3 w-3 rounded-full bg-white shadow-sm transition-transform duration-300 ${
                autoEnabled ? 'translate-x-4' : 'translate-x-0'
              }`} />
            </div>
          </button>

          {/* Manual Process Button */}
          <button
            id="btn-manual-process"
            onClick={onManualProcess}
            disabled={isProcessing}
            className="group flex items-center gap-2 rounded-lg border border-violet-500/30 bg-gradient-to-r from-violet-600/80 to-indigo-600/80 px-4 py-2 text-xs font-medium text-white shadow-lg shadow-violet-500/20 transition-all duration-300 hover:from-violet-600 hover:to-indigo-600 hover:shadow-violet-500/30 disabled:cursor-not-allowed disabled:opacity-50"
          >
            {isProcessing ? (
              <Loader2 className="h-3.5 w-3.5 animate-spin" />
            ) : (
              <Play className="h-3.5 w-3.5 transition-transform duration-200 group-hover:scale-110" />
            )}
            <span>{isProcessing ? 'Procesando...' : 'Procesar Bandeja'}</span>
          </button>
        </div>
      </div>
    </header>
  );
}

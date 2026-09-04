'use client';

import { Play, Loader2, Activity, ShieldAlert } from 'lucide-react';

interface TopBarProps {
  onManualProcess: () => void;
  onToggleProdMode: (enabled: boolean) => void;
  isProcessing: boolean;
  prodModeEnabled: boolean;
}

export default function TopBar({
  onManualProcess,
  onToggleProdMode,
  isProcessing,
  prodModeEnabled,
}: TopBarProps) {
  return (
    <header className="border-b border-white/[0.06] bg-[#0a0a0f]/80 backdrop-blur-xl">
      <div className="flex h-16 items-center justify-between px-6">
        {/* Logo & Title */}
        <div className="flex items-center gap-3">
          <div className="flex h-10 w-10 overflow-hidden items-center justify-center rounded-lg bg-white p-1 shadow-lg shadow-white/10">
            <img src="/icon.jpg" alt="Exervis Logo" className="h-full w-full object-contain mix-blend-multiply" />
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
          {/* Envío Real de Correos Toggle */}
          <button
            id="btn-prod-mode"
            onClick={() => onToggleProdMode(!prodModeEnabled)}
            title="Si está activado, los correos que deban reenviarse se envían de verdad a prueba3@exervis.com. Si está desactivado, solo se simula (no se envía nada real)."
            className={`group relative flex items-center gap-2 rounded-lg border px-4 py-2 text-xs font-medium transition-all duration-300 ${
              prodModeEnabled
                ? 'border-emerald-500/30 bg-emerald-500/10 text-emerald-300 shadow-lg shadow-emerald-500/10 hover:bg-emerald-500/20'
                : 'border-red-500/30 bg-red-500/10 text-red-300 shadow-lg shadow-red-500/10 hover:bg-red-500/20'
            }`}
          >
            <ShieldAlert className={`h-3.5 w-3.5 transition-transform duration-300 ${
              prodModeEnabled ? 'text-emerald-400' : 'text-red-400 group-hover:scale-110'
            }`} />
            <span>
              {prodModeEnabled
                ? 'Envío Real de Correos: ACTIVADO'
                : 'Envío Real de Correos: DESACTIVADO (solo simulación)'}
            </span>
            <div className={`ml-1 h-4 w-8 rounded-full p-0.5 transition-colors duration-300 ${
              prodModeEnabled ? 'bg-emerald-500' : 'bg-red-500'
            }`}>
              <div className={`h-3 w-3 rounded-full bg-white shadow-sm transition-transform duration-300 ${
                prodModeEnabled ? 'translate-x-4' : 'translate-x-0'
              }`} />
            </div>
          </button>

          {/* Status indicator: la bandeja se refresca sola cada 15s, el procesado sigue siendo manual */}
          <div
            className="mr-2 flex items-center gap-2 rounded-full border border-white/[0.06] bg-white/[0.03] px-3 py-1.5"
            title="La bandeja se refresca automáticamente cada 15 segundos (nuevos correos por IMAP). El procesado sigue siendo manual."
          >
            <Activity className="h-3.5 w-3.5 animate-pulse text-emerald-400" />
            <span className="text-xs text-zinc-400">Escuchando</span>
          </div>

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

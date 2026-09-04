'use client';

import { AgentLog, LogLevel } from '@/lib/types';
import { Terminal, CheckCircle2, AlertTriangle, XCircle, Info } from 'lucide-react';

interface AgentLogsProps {
  logs: AgentLog[];
  isLoading?: boolean;
}

const logIcons: Record<LogLevel, React.ReactNode> = {
  info: <Info className="h-3.5 w-3.5 text-sky-400" />,
  success: <CheckCircle2 className="h-3.5 w-3.5 text-emerald-400" />,
  warning: <AlertTriangle className="h-3.5 w-3.5 text-amber-400" />,
  error: <XCircle className="h-3.5 w-3.5 text-red-400" />,
};

const logColors: Record<LogLevel, string> = {
  info: 'text-sky-300',
  success: 'text-emerald-300',
  warning: 'text-amber-300',
  error: 'text-red-300',
};

const logBgColors: Record<LogLevel, string> = {
  info: 'border-sky-500/10 bg-sky-500/[0.03]',
  success: 'border-emerald-500/10 bg-emerald-500/[0.03]',
  warning: 'border-amber-500/10 bg-amber-500/[0.03]',
  error: 'border-red-500/10 bg-red-500/[0.03]',
};

function formatLogTime(timestamp: string): string {
  return new Date(timestamp).toLocaleTimeString('es-ES', {
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit',
  });
}

export default function AgentLogs({ logs, isLoading }: AgentLogsProps) {
  return (
    <div className="flex flex-col border-t border-white/[0.06]">
      {/* Header */}
      <div className="flex items-center gap-2 border-b border-white/[0.06] bg-[#08080d] px-4 py-2.5">
        <Terminal className="h-3.5 w-3.5 text-violet-400" />
        <span className="text-xs font-semibold uppercase tracking-wider text-zinc-400">
          Logs del Agente
        </span>
        {logs.length > 0 && (
          <span className="rounded-full bg-violet-500/15 px-1.5 py-0.5 text-[10px] font-medium text-violet-400">
            {logs.length}
          </span>
        )}
        {isLoading && (
          <div className="ml-auto flex items-center gap-1.5">
            <div className="h-1.5 w-1.5 animate-pulse rounded-full bg-violet-400" />
            <span className="text-[11px] text-violet-400">Procesando...</span>
          </div>
        )}
      </div>

      {/* Log entries */}
      <div className="max-h-64 overflow-y-auto bg-[#06060a] p-3 font-mono scrollbar-thin">
        {logs.length === 0 ? (
          <div className="flex items-center justify-center py-8">
            <p className="text-xs text-zinc-700">
              {isLoading ? 'Esperando logs del agente...' : 'Sin logs disponibles para este correo'}
            </p>
          </div>
        ) : (
          <div className="space-y-1.5">
            {logs.map((log, index) => (
              <div
                key={log.id}
                className={`flex items-start gap-2.5 rounded-md border p-2 transition-all duration-300 ${logBgColors[log.level]}`}
                style={{ animationDelay: `${index * 100}ms` }}
              >
                <div className="mt-0.5 shrink-0">{logIcons[log.level]}</div>
                <div className="min-w-0 flex-1">
                  <div className="flex items-center gap-2">
                    <span className="text-[10px] text-zinc-600">
                      {formatLogTime(log.timestamp)}
                    </span>
                    <span className={`text-[11px] font-semibold uppercase tracking-wider ${logColors[log.level]}`}>
                      {log.step}
                    </span>
                  </div>
                  <p className="mt-0.5 text-xs leading-relaxed text-zinc-400">
                    {log.message}
                  </p>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

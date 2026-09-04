'use client';

import { useState } from 'react';
import { AgentLog, EmailAttachment, EmailStatus, LogLevel } from '@/lib/types';
import {
  ClipboardList,
  ChevronDown,
  Brain,
  CheckCircle2,
  AlertTriangle,
  XCircle,
  ArrowRight,
  Clock,
  Sparkles,
  Paperclip,
  Download,
} from 'lucide-react';

interface ManagementTimelineProps {
  logs: AgentLog[];
  isLoading?: boolean;
  emailId?: string | null;
  attachments?: EmailAttachment[];
  emailStatus?: EmailStatus;
}

// ==========================================
// Mapeado de pasos técnicos → Lenguaje de negocio
// ==========================================

interface TimelineStep {
  id: string;
  rawStep: string;
  icon: string;
  title: string;
  description: string;
  detail?: string;
  level: LogLevel;
  timestamp: string;
}

const stepIcons: Record<string, string> = {
  'Recepción': '📧',
  'Adjuntos': '📎',
  'Análisis NLP': '🧠',
  'Clasificación': '🏷️',
  'Extracción': '📋',
  'Acción': '▶️',
  'Reenvío': '📤',
  'Completado': '✅',
  'Análisis de Sentimiento': '💭',
};

const stepTitles: Record<string, string> = {
  'Recepción': 'Email recibido',
  'Adjuntos': 'Adjuntos analizados',
  'Análisis NLP': 'Analizado por IA',
  'Clasificación': 'Categoría asignada',
  'Extracción': 'Datos extraídos',
  'Acción': 'Acción determinada',
  'Reenvío': 'Correo reenviado',
  'Completado': 'Procesamiento completado',
  'Análisis de Sentimiento': 'Análisis de sentimiento',
};

function mapLogToStep(log: AgentLog): TimelineStep {
  return {
    id: log.id,
    rawStep: log.step,
    icon: stepIcons[log.step] ?? '📌',
    title: stepTitles[log.step] ?? log.step,
    description: log.message,
    detail: generateDetail(log),
    level: log.level,
    timestamp: log.timestamp,
  };
}

function generateDetail(log: AgentLog): string | undefined {
  switch (log.step) {
    case 'Análisis NLP':
      return 'El motor de IA ha procesado el contenido del correo electrónico, analizando su estructura semántica, intención del remitente y contexto del mensaje para determinar la categoría apropiada.';
    case 'Clasificación':
      return `Basándose en el análisis del contenido, la IA ha determinado la categoría del correo. ${log.message}. Esta clasificación se utiliza para aplicar las reglas de negocio configuradas y decidir la acción a ejecutar.`;
    case 'Extracción':
      return `Se han identificado y extraído los datos clave del correo: ${log.message}. Estos datos se almacenan para su uso en las acciones automatizadas y para referencia futura.`;
    case 'Acción':
      return `Se ha aplicado la regla de negocio correspondiente a esta categoría. ${log.message}. Esta acción se ejecutará de forma automática según la configuración del sistema.`;
    case 'Análisis de Sentimiento':
      return `El análisis de sentimiento evalúa el tono emocional del correo para detectar posibles riesgos o urgencias. ${log.message}`;
    case 'Completado':
      return 'Todos los pasos del procesamiento se han ejecutado correctamente. El correo ha sido clasificado, los datos extraídos y la acción correspondiente ha sido programada o ejecutada.';
    default:
      return undefined;
  }
}

function formatTime(timestamp: string): string {
  return new Date(timestamp).toLocaleTimeString('es-ES', {
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit',
  });
}

const levelStyles: Record<LogLevel, {
  dot: string;
  line: string;
  bg: string;
  border: string;
  icon: React.ReactNode;
}> = {
  info: {
    dot: 'bg-sky-500 shadow-sky-500/40',
    line: 'bg-sky-500/20',
    bg: 'bg-sky-500/[0.04]',
    border: 'border-sky-500/15 hover:border-sky-500/30',
    icon: <ArrowRight className="h-4 w-4 text-sky-400" />,
  },
  success: {
    dot: 'bg-emerald-500 shadow-emerald-500/40',
    line: 'bg-emerald-500/20',
    bg: 'bg-emerald-500/[0.04]',
    border: 'border-emerald-500/15 hover:border-emerald-500/30',
    icon: <CheckCircle2 className="h-4 w-4 text-emerald-400" />,
  },
  warning: {
    dot: 'bg-amber-500 shadow-amber-500/40',
    line: 'bg-amber-500/20',
    bg: 'bg-amber-500/[0.04]',
    border: 'border-amber-500/15 hover:border-amber-500/30',
    icon: <AlertTriangle className="h-4 w-4 text-amber-400" />,
  },
  error: {
    dot: 'bg-red-500 shadow-red-500/40',
    line: 'bg-red-500/20',
    bg: 'bg-red-500/[0.04]',
    border: 'border-red-500/15 hover:border-red-500/30',
    icon: <XCircle className="h-4 w-4 text-red-400" />,
  },
};

export default function ManagementTimeline({ logs, isLoading, emailId, attachments, emailStatus }: ManagementTimelineProps) {
  const [expandedId, setExpandedId] = useState<string | null>(null);
  const steps = logs.map(mapLogToStep);

  const toggleExpand = (id: string) => {
    setExpandedId((prev) => (prev === id ? null : id));
  };

  return (
    <div className="flex flex-col h-full">
      {/* Header */}
      <div className="flex items-center justify-between border-b border-white/[0.06] bg-[#0a0a12]/90 px-5 py-3 backdrop-blur-md">
        <div className="flex items-center gap-2.5">
          <div className="flex h-7 w-7 items-center justify-center rounded-lg bg-violet-500/15">
            <ClipboardList className="h-3.5 w-3.5 text-violet-400" />
          </div>
          <h3 className="text-xs font-semibold uppercase tracking-wider text-zinc-400">
            Historial de Gestión
          </h3>
          {steps.length > 0 && (
            <span className="rounded-full bg-violet-500/15 px-2 py-0.5 text-[10px] font-bold text-violet-400">
              {steps.length} pasos
            </span>
          )}
        </div>
        {isLoading && (
          <div className="flex items-center gap-2">
            <Sparkles className="h-3.5 w-3.5 animate-pulse text-violet-400" />
            <span className="text-[11px] font-medium text-violet-400">IA procesando...</span>
          </div>
        )}
      </div>

      {/* Timeline content */}
      <div className="flex-1 overflow-y-auto bg-[#08080e] p-5 scrollbar-thin">
        {steps.length === 0 ? (
          <div className="flex h-full flex-col items-center justify-center gap-3 py-12">
            <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-white/[0.03] ring-1 ring-white/[0.06]">
              <ClipboardList className="h-6 w-6 text-zinc-700" />
            </div>
            <div className="text-center">
              <p className="text-sm font-medium text-zinc-500">
                {isLoading
                  ? 'Procesando correo...'
                  : emailId && emailStatus === 'pendiente'
                    ? 'Este correo aún no se ha procesado'
                    : 'Sin historial de gestión'}
              </p>
              <p className="mt-1 text-xs text-zinc-600">
                {isLoading
                  ? 'La IA está analizando el contenido del correo'
                  : emailId && emailStatus === 'pendiente'
                    ? 'Pulsa "Procesar" para generar su historial de gestión'
                    : 'Selecciona un correo para ver su historial'}
              </p>
            </div>
          </div>
        ) : (
          <div className="relative">
            {/* Vertical line */}
            <div className="absolute left-[15px] top-2 bottom-2 w-[2px] bg-gradient-to-b from-violet-500/20 via-white/[0.06] to-transparent" />

            {/* Steps */}
            <div className="space-y-2">
              {steps.map((step, index) => {
                const style = levelStyles[step.level];
                const isExpanded = expandedId === step.id;
                const isLast = index === steps.length - 1;

                return (
                  <div
                    key={step.id}
                    className="relative pl-10"
                    style={{ animationDelay: `${index * 120}ms` }}
                  >
                    {/* Timeline dot */}
                    <div className="absolute left-0 top-3.5 z-10">
                      <div
                        className={`h-[11px] w-[11px] rounded-full border-2 border-[#08080e] shadow-md ${
                          isLast && !isLoading
                            ? `${style.dot} ring-4 ring-current/10`
                            : style.dot
                        }`}
                      />
                    </div>

                    {/* Step card (accordion) — div instead of button so the nested
                        attachment <a> download links stay valid HTML */}
                    <div
                      role="button"
                      tabIndex={0}
                      onClick={() => step.detail && toggleExpand(step.id)}
                      onKeyDown={(e) => {
                        if ((e.key === 'Enter' || e.key === ' ') && step.detail) {
                          e.preventDefault();
                          toggleExpand(step.id);
                        }
                      }}
                      className={`group w-full rounded-xl border p-3.5 text-left transition-all duration-300 ${
                        style.border
                      } ${
                        isExpanded ? style.bg : 'bg-transparent hover:bg-white/[0.02]'
                      } ${step.detail ? 'cursor-pointer' : 'cursor-default'}`}
                    >
                      {/* Step header */}
                      <div className="flex items-start justify-between gap-3">
                        <div className="flex items-start gap-3 min-w-0 flex-1">
                          <span className="mt-0.5 text-lg leading-none">{step.icon}</span>
                          <div className="min-w-0 flex-1">
                            <div className="flex items-center gap-2">
                              <span className="text-sm font-semibold text-zinc-200">
                                {step.title}
                              </span>
                              {step.level === 'warning' && (
                                <span className="rounded-full bg-amber-500/15 px-1.5 py-0.5 text-[9px] font-bold uppercase tracking-wider text-amber-400">
                                  Atención
                                </span>
                              )}
                              {step.level === 'error' && (
                                <span className="rounded-full bg-red-500/15 px-1.5 py-0.5 text-[9px] font-bold uppercase tracking-wider text-red-400">
                                  Urgente
                                </span>
                              )}
                            </div>
                            <p className="mt-1 text-xs leading-relaxed text-zinc-400">
                              {step.description}
                            </p>
                            {step.rawStep === 'Adjuntos' && emailId && attachments && attachments.length > 0 && (
                              <div className="mt-2 flex flex-wrap gap-1.5" onClick={(e) => e.stopPropagation()}>
                                {attachments.map((attachment) => (
                                  <a
                                    key={attachment.filename}
                                    href={`/api/emails/${emailId}/attachments/${encodeURIComponent(attachment.filename)}`}
                                    download={attachment.filename}
                                    className="flex items-center gap-1.5 rounded-md border border-white/[0.08] bg-white/[0.03] px-2 py-1 text-[11px] text-zinc-300 transition-colors hover:border-violet-500/40 hover:bg-violet-500/10 hover:text-violet-300"
                                  >
                                    <Paperclip className="h-3 w-3 text-zinc-500" />
                                    <span className="max-w-[160px] truncate">{attachment.filename}</span>
                                    <Download className="h-3 w-3 text-zinc-500" />
                                  </a>
                                ))}
                              </div>
                            )}
                          </div>
                        </div>

                        <div className="flex shrink-0 items-center gap-2">
                          <div className="flex items-center gap-1 text-[10px] text-zinc-600">
                            <Clock className="h-3 w-3" />
                            <span>{formatTime(step.timestamp)}</span>
                          </div>
                          {step.detail && (
                            <ChevronDown
                              className={`h-4 w-4 text-zinc-600 transition-transform duration-300 ${
                                isExpanded ? 'rotate-180 text-zinc-400' : ''
                              }`}
                            />
                          )}
                        </div>
                      </div>

                      {/* Expanded detail (accordion) */}
                      <div
                        className={`overflow-hidden transition-all duration-300 ease-in-out ${
                          isExpanded ? 'mt-3 max-h-96 opacity-100' : 'max-h-0 opacity-0'
                        }`}
                      >
                        <div className="rounded-lg border border-white/[0.05] bg-white/[0.02] p-3.5">
                          <div className="flex items-start gap-2">
                            <Brain className="mt-0.5 h-4 w-4 shrink-0 text-violet-400/60" />
                            <p className="text-xs leading-relaxed text-zinc-400">
                              {step.detail}
                            </p>
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                );
              })}

              {/* Loading indicator at end of timeline */}
              {isLoading && (
                <div className="relative pl-10">
                  <div className="absolute left-0 top-3">
                    <div className="h-[11px] w-[11px] animate-pulse rounded-full bg-violet-500 shadow-md shadow-violet-500/40" />
                  </div>
                  <div className="flex items-center gap-2 rounded-xl border border-violet-500/10 bg-violet-500/[0.03] p-3.5">
                    <div className="h-4 w-4 animate-spin rounded-full border-2 border-violet-500/20 border-t-violet-500" />
                    <span className="text-xs text-violet-400">Procesando siguiente paso...</span>
                  </div>
                </div>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

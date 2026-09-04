'use client';

import { Email } from '@/lib/types';
import StatusBadge from './StatusBadge';
import { User, Calendar, Tag, FileText, MousePointerClick, Play, Loader2 } from 'lucide-react';

interface EmailViewerProps {
  email: Email | null;
  onProcess?: (emailId: string) => void;
  isProcessing?: boolean;
}

function formatFullDate(dateString: string): string {
  return new Date(dateString).toLocaleDateString('es-ES', {
    weekday: 'long',
    year: 'numeric',
    month: 'long',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  });
}

export const categoryLabels: Record<string, string> = {
  ausencia_cliente: '🏥 Ausencia (Cliente)',
  ausencia_produccion: '🏭 Ausencia (Producción)',
  justificante_cobro: '💰 Justificante de cobro',
  info_facturacion: '📊 Info. facturación',
  cambio_cuenta: '🏦 Cambio de cuenta',
  cambio_datos_presupuesto: '📋 Cambio datos / Presupuesto',
  incidencia_servicio: '⚠️ Incidencia en servicio',
  autorizacion_recibo: '🔄 Autorización recibo',
  solicitud_facturas: '📤 Solicitud de facturas',
  queja_precio: '🚨 Queja por subida de precios',
};

export default function EmailViewer({ email, onProcess, isProcessing }: EmailViewerProps) {
  if (!email) {
    return (
      <div className="flex h-full flex-col items-center justify-center gap-4 p-8">
        <div className="flex h-16 w-16 items-center justify-center rounded-2xl bg-white/[0.04] ring-1 ring-white/[0.06]">
          <MousePointerClick className="h-7 w-7 text-zinc-700" />
        </div>
        <div className="text-center">
          <p className="text-sm font-medium text-zinc-500">Ningún correo seleccionado</p>
          <p className="mt-1 text-xs text-zinc-600">
            Selecciona un correo de la lista para ver su contenido
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="flex flex-col">
      {/* Email header */}
      <div className="border-b border-white/[0.06] p-5">
        <div className="flex items-start justify-between gap-4">
          <div className="min-w-0 flex-1">
            <h3 className="text-base font-semibold text-white">{email.subject}</h3>
            <div className="mt-3 flex flex-wrap items-center gap-x-4 gap-y-2">
              <div className="flex items-center gap-1.5 text-xs text-zinc-400">
                <User className="h-3.5 w-3.5 text-zinc-600" />
                <span className="font-medium text-zinc-300">{email.from}</span>
                <span className="text-zinc-600">{'<'}{email.fromEmail}{'>'}</span>
              </div>
              <div className="flex items-center gap-1.5 text-xs text-zinc-400">
                <Calendar className="h-3.5 w-3.5 text-zinc-600" />
                <span>{formatFullDate(email.date)}</span>
              </div>
            </div>
          </div>
            <div className="flex shrink-0 flex-col items-end gap-3">
              <div className="flex items-center gap-2">
                <StatusBadge status={email.status} />
                {onProcess && (
                  <button
                    onClick={() => onProcess(email.id)}
                    disabled={isProcessing}
                    className="flex items-center gap-1.5 rounded-md border border-violet-500/30 bg-violet-500/10 px-2.5 py-1 text-xs font-medium text-violet-300 transition-colors hover:bg-violet-500/20 disabled:cursor-not-allowed disabled:opacity-50"
                  >
                    {isProcessing ? (
                      <Loader2 className="h-3 w-3 animate-spin" />
                    ) : (
                      <Play className="h-3 w-3" />
                    )}
                    <span>{email.status === 'pendiente' ? 'Procesar' : 'Reprocesar'}</span>
                  </button>
                )}
              </div>

              {/* Huge Category Label */}
              {email.category && (
                <div className="flex flex-col items-end gap-1.5 animate-in fade-in slide-in-from-right-4 duration-500">
                  <div className="flex items-center gap-2 rounded-xl border border-violet-500/30 bg-gradient-to-r from-violet-500/20 to-fuchsia-500/20 px-4 py-2 text-sm font-bold text-violet-200 shadow-lg shadow-violet-500/10">
                    <Tag className="h-4 w-4 text-violet-400" />
                    {categoryLabels[email.category] || email.category}
                  </div>
                  {email.summary && (
                    <div className="text-right text-[11px] font-medium text-zinc-400 max-w-[300px]">
                      {email.summary}
                    </div>
                  )}
                </div>
              )}
            </div>
          </div>
        </div>

      {/* Email body */}
      <div className="p-5">
        <div className="rounded-xl border border-white/[0.06] bg-white/[0.02] p-5">
          <pre className="whitespace-pre-wrap font-sans text-[13px] leading-relaxed text-zinc-300">
            {email.body}
          </pre>
        </div>
      </div>
    </div>
  );
}

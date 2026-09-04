'use client';

import { Email } from '@/lib/types';
import StatusBadge from './StatusBadge';
import { User, Calendar, Tag, FileText, MousePointerClick } from 'lucide-react';

interface EmailViewerProps {
  email: Email | null;
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

const categoryLabels: Record<string, string> = {
  ausencia: '🏥 Ausencia / Baja',
  documentacion: '📄 Documentación',
  queja: '⚠️ Queja / Reclamación',
  informacion: 'ℹ️ Solicitud de Información',
  otro: '📋 Otros',
};

export default function EmailViewer({ email }: EmailViewerProps) {
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
          <StatusBadge status={email.status} />
        </div>

        {/* Category & Summary (if processed) */}
        {email.category && (
          <div className="mt-4 flex flex-wrap gap-2">
            <div className="flex items-center gap-1.5 rounded-md border border-white/[0.06] bg-white/[0.03] px-2.5 py-1 text-xs text-zinc-300">
              <Tag className="h-3 w-3 text-violet-400" />
              {categoryLabels[email.category] || email.category}
            </div>
            {email.summary && (
              <div className="flex items-center gap-1.5 rounded-md border border-white/[0.06] bg-white/[0.03] px-2.5 py-1 text-xs text-zinc-400">
                <FileText className="h-3 w-3 text-zinc-500" />
                {email.summary}
              </div>
            )}
          </div>
        )}
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

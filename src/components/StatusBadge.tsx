'use client';

import { EmailStatus } from '@/lib/types';

interface StatusBadgeProps {
  status: EmailStatus;
}

const statusConfig: Record<EmailStatus, { label: string; className: string }> = {
  pendiente: {
    label: 'Pendiente',
    className: 'bg-amber-500/15 text-amber-400 border-amber-500/30',
  },
  procesado: {
    label: 'Procesado',
    className: 'bg-emerald-500/15 text-emerald-400 border-emerald-500/30',
  },
  error: {
    label: 'Error',
    className: 'bg-red-500/15 text-red-400 border-red-500/30',
  },
};

export default function StatusBadge({ status }: StatusBadgeProps) {
  const config = statusConfig[status];

  return (
    <span
      className={`inline-flex items-center gap-1.5 rounded-full border px-2.5 py-0.5 text-xs font-medium tracking-wide uppercase ${config.className}`}
    >
      <span className="relative flex h-1.5 w-1.5">
        <span
          className={`absolute inline-flex h-full w-full rounded-full opacity-75 ${
            status === 'pendiente' ? 'animate-ping bg-amber-400' : 
            status === 'procesado' ? 'bg-emerald-400' : 'bg-red-400'
          }`}
        />
        <span
          className={`relative inline-flex h-1.5 w-1.5 rounded-full ${
            status === 'pendiente' ? 'bg-amber-400' : 
            status === 'procesado' ? 'bg-emerald-400' : 'bg-red-400'
          }`}
        />
      </span>
      {config.label}
    </span>
  );
}

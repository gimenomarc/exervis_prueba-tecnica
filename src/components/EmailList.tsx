'use client';

import { Email } from '@/lib/types';
import StatusBadge from './StatusBadge';
import { Clock, Inbox } from 'lucide-react';

interface EmailListProps {
  emails: Email[];
  selectedId: string | null;
  onSelect: (email: Email) => void;
}

function formatDate(dateString: string): string {
  const date = new Date(dateString);
  const now = new Date();
  const diffMs = now.getTime() - date.getTime();
  const diffHours = Math.floor(diffMs / (1000 * 60 * 60));

  if (diffHours < 1) return 'Hace menos de 1h';
  if (diffHours < 24) return `Hace ${diffHours}h`;
  const diffDays = Math.floor(diffHours / 24);
  if (diffDays === 1) return 'Ayer';
  if (diffDays < 7) return `Hace ${diffDays} días`;
  return date.toLocaleDateString('es-ES', { day: '2-digit', month: 'short' });
}

function getInitials(name: string): string {
  return name
    .split(' ')
    .slice(0, 2)
    .map((n) => n[0])
    .join('')
    .toUpperCase();
}

const avatarColors = [
  'from-violet-500 to-indigo-600',
  'from-rose-500 to-pink-600',
  'from-amber-500 to-orange-600',
  'from-emerald-500 to-teal-600',
];

export default function EmailList({ emails, selectedId, onSelect }: EmailListProps) {
  if (emails.length === 0) {
    return (
      <div className="flex h-full flex-col items-center justify-center gap-3 p-8">
        <div className="flex h-12 w-12 items-center justify-center rounded-full bg-white/[0.05]">
          <Inbox className="h-6 w-6 text-zinc-600" />
        </div>
        <p className="text-sm text-zinc-500">No hay correos en la bandeja</p>
      </div>
    );
  }

  return (
    <div className="flex flex-col">
      {/* Header */}
      <div className="sticky top-0 z-10 border-b border-white/[0.06] bg-[#0c0c14]/90 px-4 py-3 backdrop-blur-md">
        <div className="flex items-center justify-between">
          <h2 className="text-xs font-semibold uppercase tracking-wider text-zinc-400">
            Bandeja de entrada
          </h2>
          <span className="rounded-full bg-white/[0.06] px-2 py-0.5 text-[11px] font-medium text-zinc-500">
            {emails.length} correos
          </span>
        </div>
      </div>

      {/* Email items */}
      <div className="divide-y divide-white/[0.04]">
        {emails.map((email, index) => (
          <button
            key={email.id}
            id={`email-item-${email.id}`}
            onClick={() => onSelect(email)}
            className={`group w-full text-left transition-all duration-200 ${
              selectedId === email.id
                ? 'bg-violet-500/[0.08] border-l-2 border-l-violet-500'
                : 'border-l-2 border-l-transparent hover:bg-white/[0.03]'
            }`}
          >
            <div className="flex gap-3 px-4 py-3.5">
              {/* Avatar */}
              <div
                className={`flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-gradient-to-br text-[11px] font-bold text-white shadow-md ${
                  avatarColors[index % avatarColors.length]
                }`}
              >
                {getInitials(email.from)}
              </div>

              {/* Content */}
              <div className="min-w-0 flex-1">
                <div className="flex items-start justify-between gap-2">
                  <span className="truncate text-sm font-medium text-zinc-200 group-hover:text-white">
                    {email.from}
                  </span>
                  <div className="flex shrink-0 items-center gap-1 text-[11px] text-zinc-600">
                    <Clock className="h-3 w-3" />
                    <span>{formatDate(email.date)}</span>
                  </div>
                </div>
                <p className="mt-0.5 truncate text-[13px] text-zinc-400">
                  {email.subject}
                </p>
                <div className="mt-2">
                  <StatusBadge status={email.status} />
                </div>
              </div>
            </div>
          </button>
        ))}
      </div>
    </div>
  );
}

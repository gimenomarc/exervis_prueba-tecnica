'use client';

import { useState, useEffect, useCallback } from 'react';
import { Email, AgentLog } from '@/lib/types';
import TopBar from '@/components/TopBar';
import EmailList from '@/components/EmailList';
import EmailViewer from '@/components/EmailViewer';
import ManagementTimeline from '@/components/ManagementTimeline';

import { X, CheckCircle2, Tag } from 'lucide-react';
import { categoryLabels } from '@/components/EmailViewer';

export default function DashboardPage() {
  const [emails, setEmails] = useState<Email[]>([]);
  const [selectedEmail, setSelectedEmail] = useState<Email | null>(null);
  const [selectedLogs, setSelectedLogs] = useState<AgentLog[]>([]);
  const [isProcessing, setIsProcessing] = useState(false);
  const [isLoadingEmails, setIsLoadingEmails] = useState(true);
  const [isLoadingLogs, setIsLoadingLogs] = useState(false);
  const [isProcessingOne, setIsProcessingOne] = useState(false);
  const [popupEmail, setPopupEmail] = useState<Email | null>(null);
  const [prodModeEnabled, setProdModeEnabled] = useState(false);

  // Fetch current Prod Mode state on mount
  useEffect(() => {
    async function fetchProdMode() {
      try {
        const res = await fetch('/api/config/prod-mode');
        const data = await res.json();
        if (data.success) setProdModeEnabled(data.enabled);
      } catch (error) {
        console.error('Error fetching prod mode state:', error);
      }
    }
    fetchProdMode();
  }, []);

  // Fetch emails logic
  const fetchEmails = useCallback(async (showLoader = true) => {
    try {
      if (showLoader) setIsLoadingEmails(true);
      const res = await fetch('/api/emails');
      const data = await res.json();
      if (data.success) {
        setEmails(data.emails);
      }
    } catch (error) {
      console.error('Error fetching emails:', error);
    } finally {
      if (showLoader) setIsLoadingEmails(false);
    }
  }, []);

  // Procesa todos los correos pendientes. `showSpinner` controla si se
  // usa para el botón manual (con spinner) o el ciclo automático (silencioso).
  const processPending = useCallback(async (showSpinner = true) => {
    if (showSpinner) setIsProcessing(true);
    try {
      const res = await fetch('/api/trigger/manual', { method: 'POST' });
      const data = await res.json();
      if (data.success && data.emails) {
        setEmails((prev) =>
          prev.map((e) => {
            const updated = data.emails.find((ue: Email) => ue.id === e.id);
            return updated || e;
          })
        );
        if (data.emails.length > 0) {
          setPopupEmail(data.emails[data.emails.length - 1]);
        }
      }
    } catch (error) {
      console.error('Error processing pending emails:', error);
    } finally {
      if (showSpinner) setIsProcessing(false);
    }
  }, []);

  // Initial fetch on mount
  useEffect(() => {
    fetchEmails(true);
  }, [fetchEmails]);

  // Auto: cada 15 segundos refresca la bandeja (trae correos nuevos por
  // IMAP). El procesado es siempre manual — no se dispara aquí.
  useEffect(() => {
    const intervalId = setInterval(() => {
      fetchEmails(false); // sin spinner
    }, 15000);

    return () => clearInterval(intervalId);
  }, [fetchEmails]);

  // Handle email selection
  const handleSelectEmail = useCallback(async (email: Email) => {
    setSelectedEmail(email);
    setIsLoadingLogs(true);
    setSelectedLogs([]);

    try {
      const res = await fetch(`/api/emails/${email.id}`);
      const data = await res.json();
      if (data.success && data.logs) {
        // Simulate streaming logs one by one
        for (let i = 0; i < data.logs.length; i++) {
          await new Promise((resolve) => setTimeout(resolve, 250));
          setSelectedLogs((prev) => [...prev, data.logs[i]]);
        }
      }
    } catch (error) {
      console.error('Error fetching email details:', error);
    } finally {
      setIsLoadingLogs(false);
    }
  }, []);

  // Handle processing a single, specific email on demand
  const handleProcessOne = useCallback(async (emailId: string) => {
    setIsProcessingOne(true);
    try {
      const res = await fetch(`/api/emails/${emailId}/process`, { method: 'POST' });
      const data = await res.json();
      if (data.success && data.email) {
        setEmails((prev) => prev.map((e) => (e.id === emailId ? data.email : e)));
        setSelectedEmail((prev) => (prev?.id === emailId ? data.email : prev));
        setSelectedLogs(data.logs ?? []);
        setPopupEmail(data.email);
      }
    } catch (error) {
      console.error('Error processing single email:', error);
    } finally {
      setIsProcessingOne(false);
    }
  }, []);

  // Handle Prod Mode toggle
  const handleToggleProdMode = useCallback(async (enabled: boolean) => {
    const previous = prodModeEnabled;
    setProdModeEnabled(enabled); // optimistic
    try {
      const res = await fetch('/api/config/prod-mode', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ enabled }),
      });
      const data = await res.json();
      if (!data.success) setProdModeEnabled(previous);
    } catch (error) {
      console.error('Error toggling prod mode:', error);
      setProdModeEnabled(previous);
    }
  }, [prodModeEnabled]);

  return (
    <div className="flex h-screen flex-col overflow-hidden bg-background">
      {/* Top Bar */}
      <TopBar
        onManualProcess={() => processPending(true)}
        onToggleProdMode={handleToggleProdMode}
        isProcessing={isProcessing}
        prodModeEnabled={prodModeEnabled}
      />

      {/* Main Content - Split View */}
      <div className="flex flex-1 overflow-hidden">
        {/* Left Column - Email List */}
        <aside className="w-[380px] shrink-0 overflow-y-auto border-r border-white/[0.06] bg-[#0a0a12] scrollbar-thin">
          {isLoadingEmails ? (
            <div className="flex h-full items-center justify-center">
              <div className="flex flex-col items-center gap-3">
                <div className="h-8 w-8 animate-spin rounded-full border-2 border-violet-500/20 border-t-violet-500" />
                <p className="text-xs text-zinc-600">Cargando correos...</p>
              </div>
            </div>
          ) : (
            <EmailList
              emails={emails}
              selectedId={selectedEmail?.id ?? null}
              onSelect={handleSelectEmail}
            />
          )}
        </aside>

        {/* Right Column - Email Viewer (top) + Management Timeline (bottom) */}
        <main className="flex flex-1 flex-col overflow-hidden">
          {/* Email Viewer - Top half */}
          <div className="h-1/2 overflow-y-auto border-b border-white/[0.06] scrollbar-thin">
            <EmailViewer
              email={selectedEmail}
              onProcess={handleProcessOne}
              isProcessing={isProcessingOne}
            />
          </div>

          {/* Management Timeline - Bottom half */}
          <div className="h-1/2 overflow-hidden">
            <ManagementTimeline
              logs={selectedLogs}
              isLoading={isLoadingLogs}
              emailId={selectedEmail?.id}
              attachments={selectedEmail?.attachments}
              emailStatus={selectedEmail?.status}
            />
          </div>
        </main>
      </div>

      {/* Result Modal / Popup */}
      {popupEmail && popupEmail.category && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm animate-in fade-in duration-200">
          <div className="relative w-full max-w-lg overflow-hidden rounded-2xl border border-white/[0.08] bg-[#0c0c14] shadow-2xl shadow-black animate-in zoom-in-95 duration-200 p-8">
            <button
              onClick={() => setPopupEmail(null)}
              className="absolute right-4 top-4 rounded-full p-2 text-zinc-500 hover:bg-white/[0.05] hover:text-white transition-colors"
            >
              <X className="h-5 w-5" />
            </button>
            
            <div className="flex flex-col items-center text-center">
              <div className="mb-6 flex h-20 w-20 items-center justify-center rounded-full bg-gradient-to-br from-emerald-500/20 to-teal-500/20 ring-1 ring-emerald-500/30">
                <CheckCircle2 className="h-10 w-10 text-emerald-400" />
              </div>
              
              <h2 className="mb-2 text-2xl font-bold text-white">¡Correo procesado!</h2>
              <p className="mb-8 text-sm text-zinc-400">
                La IA ha analizado el correo y ha tomado la siguiente decisión:
              </p>
              
              <div className="w-full space-y-4 text-left">
                <div className="rounded-xl border border-violet-500/20 bg-violet-500/5 p-4">
                  <div className="mb-1 text-xs font-medium uppercase tracking-wider text-violet-400/70">
                    Categoría Detectada
                  </div>
                  <div className="flex items-center gap-2 text-lg font-bold text-violet-200">
                    <Tag className="h-5 w-5 text-violet-400" />
                    {categoryLabels[popupEmail.category] || popupEmail.category}
                  </div>
                </div>

                <div className="rounded-xl border border-white/[0.08] bg-white/[0.02] p-4">
                  <div className="mb-1 text-xs font-medium uppercase tracking-wider text-zinc-500">
                    Acción recomendada / Tomada
                  </div>
                  <div className="text-sm text-zinc-300">
                    {popupEmail.summary || 'Sin resumen disponible.'}
                  </div>
                </div>
              </div>

              <button
                onClick={() => setPopupEmail(null)}
                className="mt-8 w-full rounded-xl bg-gradient-to-r from-violet-600 to-indigo-600 px-4 py-3 text-sm font-semibold text-white shadow-lg shadow-violet-500/25 transition-all hover:from-violet-500 hover:to-indigo-500"
              >
                Aceptar y Continuar
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

'use client';

import { useState, useEffect, useCallback } from 'react';
import { Email, AgentLog } from '@/lib/types';
import TopBar from '@/components/TopBar';
import EmailList from '@/components/EmailList';
import EmailViewer from '@/components/EmailViewer';
import ManagementTimeline from '@/components/ManagementTimeline';

export default function DashboardPage() {
  const [emails, setEmails] = useState<Email[]>([]);
  const [selectedEmail, setSelectedEmail] = useState<Email | null>(null);
  const [selectedLogs, setSelectedLogs] = useState<AgentLog[]>([]);
  const [isProcessing, setIsProcessing] = useState(false);
  const [isLoadingEmails, setIsLoadingEmails] = useState(true);
  const [isLoadingLogs, setIsLoadingLogs] = useState(false);
  const [isProcessingOne, setIsProcessingOne] = useState(false);

  // Fetch emails on mount
  useEffect(() => {
    async function fetchEmails() {
      try {
        setIsLoadingEmails(true);
        const res = await fetch('/api/emails');
        const data = await res.json();
        if (data.success) {
          setEmails(data.emails);
        }
      } catch (error) {
        console.error('Error fetching emails:', error);
      } finally {
        setIsLoadingEmails(false);
      }
    }
    fetchEmails();
  }, []);

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

  // Handle auto-trigger
  const handleAutoTrigger = useCallback(async () => {
    try {
      const res = await fetch('/api/trigger/auto', { method: 'POST' });
      const data = await res.json();
      if (data.success && data.emails) {
        setEmails((prev) =>
          prev.map((e) => {
            const updated = data.emails.find((ue: Email) => ue.id === e.id);
            return updated || e;
          })
        );
      }
    } catch (error) {
      console.error('Error in auto trigger:', error);
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
      }
    } catch (error) {
      console.error('Error processing single email:', error);
    } finally {
      setIsProcessingOne(false);
    }
  }, []);

  // Handle manual process
  const handleManualProcess = useCallback(async () => {
    setIsProcessing(true);
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
      }
    } catch (error) {
      console.error('Error in manual process:', error);
    } finally {
      setIsProcessing(false);
    }
  }, []);

  return (
    <div className="flex h-screen flex-col overflow-hidden bg-background">
      {/* Top Bar */}
      <TopBar
        onAutoTrigger={handleAutoTrigger}
        onManualProcess={handleManualProcess}
        isProcessing={isProcessing}
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
    </div>
  );
}

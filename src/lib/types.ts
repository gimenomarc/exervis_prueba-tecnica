// ==========================================
// Email Triage MVP - Type Definitions
// ==========================================

export type EmailStatus = 'pendiente' | 'procesado' | 'error';

export type EmailCategory = 
  | 'ausencia'
  | 'documentacion'
  | 'queja'
  | 'informacion'
  | 'otro';

export type LogLevel = 'info' | 'success' | 'warning' | 'error';

export interface Email {
  id: string;
  from: string;
  fromEmail: string;
  subject: string;
  body: string;
  date: string;
  status: EmailStatus;
  category?: EmailCategory;
  summary?: string;
}

export interface AgentLog {
  id: string;
  emailId: string;
  timestamp: string;
  level: LogLevel;
  step: string;
  message: string;
}

export interface TriggerResponse {
  success: boolean;
  message: string;
  processedCount?: number;
  emails?: Email[];
  logs?: AgentLog[];
}

export interface ProcessResult {
  email: Email;
  logs: AgentLog[];
}

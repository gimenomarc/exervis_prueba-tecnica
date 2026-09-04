// ==========================================
// Email Triage MVP - Type Definitions
// ==========================================

export type EmailStatus = 'pendiente' | 'procesado' | 'error';

// ==========================================
// Categorías de negocio (10 reglas del cliente)
// ==========================================
export type BusinessCategory =
  | 'ausencia_cliente'
  | 'ausencia_produccion'
  | 'justificante_cobro'
  | 'info_facturacion'
  | 'cambio_cuenta'
  | 'cambio_datos_presupuesto'
  | 'incidencia_servicio'
  | 'autorizacion_recibo'
  | 'solicitud_facturas'
  | 'queja_precio';

// Tipo de remitente (crucial para regla de Ausencias)
export type SenderType = 'CLIENT' | 'INTERNAL';

// Tipo de acción del motor de reglas
export type ActionType = 'forward' | 'system_action' | 'manual_review';

export type LogLevel = 'info' | 'success' | 'warning' | 'error';

// Adjunto de un correo. `content` va en base64, tal como lo entregaría
// el proveedor de correo (IMAP/API) o un upload manual.
export interface EmailAttachment {
  filename: string;
  mimeType: string;
  content: string; // base64
  size: number;
}

export interface Email {
  id: string;
  from: string;
  fromEmail: string;
  subject: string;
  body: string;
  date: string;
  status: EmailStatus;
  category?: BusinessCategory;
  senderType?: SenderType;
  summary?: string;
  attachments?: EmailAttachment[];
}

export interface AgentLog {
  id: string;
  emailId: string;
  timestamp: string;
  level: LogLevel;
  step: string;
  message: string;
}

export interface ActionResult {
  type: ActionType;
  target: string;
  internalNote: string;
  businessLabel: string;
  requiresHuman: boolean;
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

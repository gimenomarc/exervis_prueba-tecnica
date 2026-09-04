import { Email, AgentLog, TriggerResponse, ProcessResult, LogLevel } from './types';
import { mockEmails, mockAgentLogs } from './mock-data';
import { determineAction } from './businessRules';
import { classifyEmail, LLMClassificationResult } from './aiService';

// ==========================================
// Email Service
// ==========================================
// Este servicio orquesta el flujo de procesamiento de correos:
// 1. Recibir correo (por ahora, bandeja mockeada — IMAP/webhook pendiente)
// 2. Clasificar con IA real (aiService.ts → OpenAI)
// 3. Aplicar reglas de negocio (businessRules.ts)
// 4. Registrar la acción a ejecutar (reenvío real por SMTP pendiente)
//
// Estado en memoria: no hay base de datos, el store vive mientras el
// proceso de Next.js esté arriba. Se reinicia al reiniciar el server.
// ==========================================

let emailStore: Email[] = [...mockEmails];
const logStore: Record<string, AgentLog[]> = Object.fromEntries(
  Object.entries(mockAgentLogs).map(([id, logs]) => [id, [...logs]])
);

let logCounter = 0;
function nextLogId(emailId: string): string {
  logCounter += 1;
  return `log-${emailId}-${logCounter}`;
}

function pushLog(
  emailId: string,
  level: LogLevel,
  step: string,
  message: string
): AgentLog {
  const log: AgentLog = {
    id: nextLogId(emailId),
    emailId,
    timestamp: new Date().toISOString(),
    level,
    step,
    message,
  };
  logStore[emailId] = [...(logStore[emailId] ?? []), log];
  return log;
}

// Simula un delay de red/procesamiento
const simulateDelay = (ms: number = 500): Promise<void> =>
  new Promise((resolve) => setTimeout(resolve, ms));

/**
 * Obtiene todos los correos electrónicos.
 *
 * 🔌 INYECCIÓN FUTURA:
 * Aquí se conectará con el proveedor de correo (IMAP/API) para obtener
 * los correos reales de la bandeja de entrada de prueba@exervis.com.
 */
export async function getEmails(): Promise<Email[]> {
  await simulateDelay(300);
  return [...emailStore];
}

/**
 * Obtiene un correo específico por su ID.
 */
export async function getEmailById(id: string): Promise<Email | null> {
  await simulateDelay(200);
  return emailStore.find((email) => email.id === id) ?? null;
}

/**
 * Obtiene los logs del agente para un correo específico.
 */
export async function getLogsByEmailId(emailId: string): Promise<AgentLog[]> {
  await simulateDelay(200);
  return logStore[emailId] ?? [];
}

function summarizeExtraction(classification: LLMClassificationResult): string {
  const { extractedData } = classification;
  const parts: string[] = [];
  if (extractedData.senderName) parts.push(`Remitente: ${extractedData.senderName}`);
  if (extractedData.senderCompany) parts.push(`Empresa: ${extractedData.senderCompany}`);
  if (extractedData.keyDates.length) parts.push(`Fechas: ${extractedData.keyDates.join(', ')}`);
  if (extractedData.amounts.length) parts.push(`Importes: ${extractedData.amounts.join(', ')}`);
  if (extractedData.references.length) parts.push(`Referencias: ${extractedData.references.join(', ')}`);
  return parts.length ? parts.join(' · ') : 'Sin datos adicionales extraídos.';
}

/**
 * Procesa un correo individual: clasificación IA real + reglas de negocio.
 * Genera el historial de logs en tiempo real reflejando cada paso.
 *
 * 🔌 PENDIENTE: ejecutar la acción real (reenvío SMTP a prueba3@exervis.com)
 * cuando la regla de negocio sea de tipo "forward". Por ahora solo se
 * determina y se registra la acción a ejecutar.
 */
export async function processEmail(emailId: string): Promise<ProcessResult | null> {
  const email = emailStore.find((e) => e.id === emailId);
  if (!email) return null;

  // Reinicia el historial para no mezclar logs de ejecuciones/mocks anteriores.
  logStore[emailId] = [];
  pushLog(emailId, 'info', 'Recepción', `Correo recibido de ${email.fromEmail}`);

  try {
    pushLog(emailId, 'info', 'Análisis NLP', 'Analizando contenido del correo con OpenAI...');

    const classification = await classifyEmail(email.body, email.fromEmail);

    pushLog(
      emailId,
      'success',
      'Clasificación',
      `Categoría: ${classification.category} · Remitente: ${classification.senderType}`
    );
    pushLog(emailId, 'info', 'Extracción', summarizeExtraction(classification));

    const action = determineAction(classification.category, classification.senderType);

    pushLog(
      emailId,
      action.requiresHuman ? 'warning' : 'info',
      'Acción',
      `${action.businessLabel} → ${action.target}`
    );

    const processedEmail: Email = {
      ...email,
      status: 'procesado',
      category: classification.category,
      senderType: classification.senderType,
      summary: `${action.businessLabel} — ${classification.rationale}`,
    };

    emailStore = emailStore.map((e) => (e.id === emailId ? processedEmail : e));

    pushLog(emailId, 'success', 'Completado', 'Procesamiento finalizado.');

    return { email: processedEmail, logs: logStore[emailId] ?? [] };
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Error desconocido al clasificar.';
    pushLog(emailId, 'error', 'Acción', `Fallo en la clasificación: ${message}`);

    const erroredEmail: Email = { ...email, status: 'error' };
    emailStore = emailStore.map((e) => (e.id === emailId ? erroredEmail : e));

    return { email: erroredEmail, logs: logStore[emailId] ?? [] };
  }
}

/**
 * Procesa todos los correos pendientes (modo masivo / one-shot).
 * Cada correo se procesa de forma aislada: si uno falla, el resto continúa.
 */
export async function processAllEmails(): Promise<TriggerResponse> {
  const pendingIds = emailStore.filter((e) => e.status === 'pendiente').map((e) => e.id);

  const processedEmails: Email[] = [];
  for (const id of pendingIds) {
    const result = await processEmail(id);
    if (result) processedEmails.push(result.email);
  }

  const failedCount = processedEmails.filter((e) => e.status === 'error').length;

  return {
    success: true,
    message:
      failedCount > 0
        ? `Se han procesado ${processedEmails.length} correos (${failedCount} con error).`
        : `Se han procesado ${processedEmails.length} correos pendientes.`,
    processedCount: processedEmails.length,
    emails: processedEmails,
  };
}

/**
 * Simula la recepción de un nuevo correo vía webhook: procesa el primer
 * correo pendiente encontrado.
 *
 * 🔌 INYECCIÓN FUTURA: Webhook Handler
 * Este endpoint será llamado por el proveedor de correo cuando llegue
 * un nuevo mensaje real.
 */
export async function handleAutoTrigger(): Promise<TriggerResponse> {
  const firstPending = emailStore.find((e) => e.status === 'pendiente');
  if (!firstPending) {
    return {
      success: true,
      message: 'No hay correos pendientes para procesar.',
      processedCount: 0,
    };
  }

  const result = await processEmail(firstPending.id);

  return {
    success: true,
    message: result
      ? `Correo "${firstPending.subject}" procesado automáticamente.`
      : 'No se pudo procesar el correo.',
    processedCount: result ? 1 : 0,
    emails: result ? [result.email] : [],
    logs: result?.logs ?? [],
  };
}

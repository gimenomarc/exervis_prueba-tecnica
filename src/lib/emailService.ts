import { Email, AgentLog, TriggerResponse, ProcessResult, BusinessCategory } from './types';
import { mockEmails, mockAgentLogs } from './mock-data';
import { determineAction } from './businessRules';
import { classifyEmail } from './aiService';

// ==========================================
// Email Service
// ==========================================
// Este servicio orquesta el flujo de procesamiento de correos:
// 1. Recibir correo (IMAP/Webhook)
// 2. Clasificar con IA (aiService.ts)
// 3. Aplicar reglas de negocio (businessRules.ts)
// 4. Ejecutar acción (reenviar, sistema, revisión manual)
//
// 🔌 PUNTO DE INYECCIÓN: LangChain / OpenAI
// En la versión de producción, las funciones de este servicio se conectarán
// con la cadena de LangChain para el análisis y clasificación de correos.
// ==========================================

// Simula un delay de red/procesamiento
const simulateDelay = (ms: number = 500): Promise<void> =>
  new Promise((resolve) => setTimeout(resolve, ms));

/**
 * Obtiene todos los correos electrónicos.
 *
 * 🔌 INYECCIÓN FUTURA:
 * Aquí se conectará con el proveedor de correo (IMAP/API)
 * para obtener los correos reales de la bandeja de entrada.
 * Ejemplo: await imapClient.fetchEmails({ folder: 'INBOX', unseen: true })
 */
export async function getEmails(): Promise<Email[]> {
  await simulateDelay(300);
  return [...mockEmails];
}

/**
 * Obtiene un correo específico por su ID.
 *
 * 🔌 INYECCIÓN FUTURA:
 * Se reemplazará por una consulta a la base de datos o al proveedor de correo.
 * Ejemplo: await db.emails.findUnique({ where: { id } })
 */
export async function getEmailById(id: string): Promise<Email | null> {
  await simulateDelay(200);
  return mockEmails.find((email) => email.id === id) ?? null;
}

/**
 * Obtiene los logs del agente para un correo específico.
 *
 * 🔌 INYECCIÓN FUTURA:
 * Los logs se generarán en tiempo real durante el procesamiento
 * del agente LangChain y se almacenarán en la base de datos.
 * Ejemplo: await db.agentLogs.findMany({ where: { emailId } })
 */
export async function getLogsByEmailId(emailId: string): Promise<AgentLog[]> {
  await simulateDelay(200);
  return mockAgentLogs[emailId] ?? [];
}

/**
 * Procesa un correo individual: clasificación IA + reglas de negocio.
 *
 * 🔌 INYECCIÓN FUTURA: LangChain Agent
 * En producción, esta función:
 * 1. Llamará a classifyEmail() con el LLM real
 * 2. Pasará el resultado a determineAction() del motor de reglas
 * 3. Ejecutará la acción (reenvío, registro en sistema, etc.)
 *
 * ```typescript
 * const classification = await classifyEmail(email.body, email.fromEmail);
 * const action = determineAction(classification.category, classification.senderType);
 * await executeAction(action, email);
 * ```
 */
export async function processEmail(emailId: string): Promise<ProcessResult | null> {
  await simulateDelay(1500); // Simula tiempo de procesamiento del LLM

  const email = mockEmails.find((e) => e.id === emailId);
  if (!email) return null;

  // 🔌 INYECCIÓN FUTURA: Reemplazar por classifyEmail() real
  const classification = await classifyEmail(email.body, email.fromEmail);

  // Aplicar motor de reglas de negocio
  const action = determineAction(classification.category, classification.senderType);

  // Simulamos el cambio de estado
  const processedEmail: Email = {
    ...email,
    status: 'procesado',
    category: classification.category,
    senderType: classification.senderType,
    summary: `${action.businessLabel} — ${classification.rationale}`,
  };

  const logs = mockAgentLogs[emailId] ?? [];

  return { email: processedEmail, logs };
}

/**
 * Procesa todos los correos pendientes (modo masivo / one-shot).
 *
 * 🔌 INYECCIÓN FUTURA: Batch Processing con LangChain
 * Se ejecutará el agente de LangChain en modo batch para procesar
 * todos los correos pendientes de forma secuencial o paralela.
 */
export async function processAllEmails(): Promise<TriggerResponse> {
  await simulateDelay(2000); // Simula procesamiento masivo

  const pendingEmails = mockEmails.filter((e) => e.status === 'pendiente');
  const processedEmails: Email[] = [];

  for (const email of pendingEmails) {
    const classification = await classifyEmail(email.body, email.fromEmail);
    const action = determineAction(classification.category, classification.senderType);

    processedEmails.push({
      ...email,
      status: 'procesado',
      category: classification.category,
      senderType: classification.senderType,
      summary: `${action.businessLabel} — ${classification.rationale}`,
    });
  }

  return {
    success: true,
    message: `Se han procesado ${processedEmails.length} correos pendientes.`,
    processedCount: processedEmails.length,
    emails: processedEmails,
  };
}

/**
 * Simula la recepción de un nuevo correo vía webhook.
 *
 * 🔌 INYECCIÓN FUTURA: Webhook Handler
 * Este endpoint será llamado por el proveedor de correo cuando
 * llegue un nuevo mensaje. Se procesará automáticamente con el agente.
 */
export async function handleAutoTrigger(): Promise<TriggerResponse> {
  await simulateDelay(1000);

  // Simula procesamiento del primer correo pendiente
  const firstPending = mockEmails.find((e) => e.status === 'pendiente');
  if (!firstPending) {
    return {
      success: true,
      message: 'No hay correos pendientes para procesar.',
      processedCount: 0,
    };
  }

  const result = await processEmail(firstPending.id);
  const logs = mockAgentLogs[firstPending.id] ?? [];

  return {
    success: true,
    message: `Correo "${firstPending.subject}" procesado automáticamente.`,
    processedCount: 1,
    emails: result ? [result.email] : [],
    logs,
  };
}

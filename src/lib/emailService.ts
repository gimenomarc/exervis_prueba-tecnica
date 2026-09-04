import { Email, AgentLog, TriggerResponse, ProcessResult } from './types';
import { mockEmails, mockAgentLogs } from './mock-data';

// ==========================================
// Email Service
// ==========================================
// Este servicio contiene funciones mockeadas que simulan la interacción
// con un proveedor de correo y el procesamiento por parte de un agente IA.
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
 * Procesa un correo individual (simula el análisis del agente IA).
 *
 * 🔌 INYECCIÓN FUTURA: LangChain Agent
 * Esta función será reemplazada por la ejecución del agente de LangChain:
 *
 * ```typescript
 * import { ChatOpenAI } from '@langchain/openai';
 * import { AgentExecutor, createOpenAIFunctionsAgent } from 'langchain/agents';
 *
 * const llm = new ChatOpenAI({ modelName: 'gpt-4', temperature: 0 });
 * const agent = createOpenAIFunctionsAgent({ llm, tools, prompt });
 * const executor = AgentExecutor.fromAgentAndTools({ agent, tools });
 * const result = await executor.invoke({ email: emailContent });
 * ```
 */
export async function processEmail(emailId: string): Promise<ProcessResult | null> {
  await simulateDelay(1500); // Simula tiempo de procesamiento del LLM

  const email = mockEmails.find((e) => e.id === emailId);
  if (!email) return null;

  // Simulamos el cambio de estado
  const processedEmail: Email = {
    ...email,
    status: 'procesado',
    category: getCategoryFromSubject(email.subject),
    summary: `Correo procesado automáticamente. Asunto analizado: "${email.subject}"`,
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
 *
 * ```typescript
 * const pendingEmails = await db.emails.findMany({ where: { status: 'pendiente' } });
 * const results = await Promise.all(
 *   pendingEmails.map(email => agentExecutor.invoke({ email }))
 * );
 * ```
 */
export async function processAllEmails(): Promise<TriggerResponse> {
  await simulateDelay(2000); // Simula procesamiento masivo

  const pendingEmails = mockEmails.filter((e) => e.status === 'pendiente');
  const processedEmails = pendingEmails.map((email) => ({
    ...email,
    status: 'procesado' as const,
    category: getCategoryFromSubject(email.subject),
    summary: `Correo procesado en lote. Asunto: "${email.subject}"`,
  }));

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
 *
 * ```typescript
 * // Webhook de Microsoft Graph / Gmail API
 * const notification = parseWebhookPayload(req.body);
 * const email = await fetchEmailFromProvider(notification.resourceId);
 * const result = await agentExecutor.invoke({ email });
 * await saveResultToDatabase(result);
 * ```
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

// ==========================================
// Utilidades internas
// ==========================================

/**
 * Asigna una categoría basada en el asunto del correo.
 * 🔌 INYECCIÓN FUTURA: Será reemplazada por la clasificación del LLM.
 */
function getCategoryFromSubject(subject: string): Email['category'] {
  const lower = subject.toLowerCase();
  if (lower.includes('ausencia') || lower.includes('baja') || lower.includes('enfermedad')) {
    return 'ausencia';
  }
  if (lower.includes('factura') || lower.includes('transferencia') || lower.includes('justificante')) {
    return 'documentacion';
  }
  if (lower.includes('queja') || lower.includes('reclamación') || lower.includes('precio')) {
    return 'queja';
  }
  if (lower.includes('información') || lower.includes('consulta') || lower.includes('solicitud')) {
    return 'informacion';
  }
  return 'otro';
}

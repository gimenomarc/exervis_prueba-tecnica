import { Email, AgentLog, TriggerResponse, ProcessResult, LogLevel } from './types';
import { determineAction, resolveCategory } from './businessRules';
import { classifyEmail, LLMClassificationResult } from './aiService';
import { processAttachments } from './attachmentService';
import { sendForwardEmail } from './mailService';
import { isProdModeEnabled, PROD_FORWARD_TARGET } from './appConfig';

// ==========================================
// Email Service
// ==========================================
// Este servicio orquesta el flujo de procesamiento de correos:
// 1. Recibir correo (por ahora, bandeja mockeada — IMAP/webhook pendiente)
// 2. Clasificar con IA real (aiService.ts → OpenAI)
// 3. Aplicar reglas de negocio (businessRules.ts)
// 4. Ejecutar la acción: si es "forward", reenviar de verdad por SMTP
//    (mailService.ts → Outlook/Microsoft 365)
//
// Estado en memoria: no hay base de datos, el store vive mientras el
// proceso de Next.js esté arriba. Se reinicia al reiniciar el server.
// ==========================================

let emailStore: Email[] = [];

const logStore: Record<string, AgentLog[]> = {};

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
 * Se conecta a Outlook vía IMAP para recuperar los últimos correos no leídos.
 */
export async function getEmails(): Promise<Email[]> {
  try {
    const { getCredentials } = await import('@/app/actions/auth');
    const credentials = await getCredentials();

    if (!credentials) {
      console.warn('No hay credenciales de Outlook en sesión. Devolviendo buzón vacío (limpio).');
      return [...emailStore]; 
    }

    console.log(`\n[IMAP] Iniciando conexión IMAP para ${credentials.email}...`);

    const imaps = (await import('imap-simple')).default;
    const { simpleParser } = await import('mailparser');

    const config = {
      imap: {
        user: credentials.email,
        password: credentials.password,
        host: 'imap.one.com',
        port: 993,
        tls: true,
        authTimeout: 10000,
        tlsOptions: { rejectUnauthorized: false }
      }
    };

    console.log('[IMAP] Conectando a imap.one.com:993...');
    const connection = await imaps.connect(config);
    console.log('[IMAP] Conexión IMAP establecida con éxito!');
    
    console.log('[IMAP] Abriendo bandeja INBOX...');
    await connection.openBox('INBOX');

    const searchCriteria = ['ALL']; 
    const fetchOptions = { bodies: ['HEADER', 'TEXT', ''], struct: true, markSeen: false };

    console.log('[IMAP] Buscando últimos correos...');
    const messages = await connection.search(searchCriteria, fetchOptions);
    console.log(`[IMAP] Se encontraron ${messages.length} correos en total.`);
    
    // Limitamos a los últimos 50 para no saturar, pero cargar bastantes
    const recentMessages = messages.slice(-50).reverse();

    const newEmails: Email[] = [];

    for (const item of recentMessages) {
      const all = item.parts.find((part) => part.which === '');
      const id = item.attributes.uid;
      const idHeader = 'IMAP-UID-' + id;

      if (!all) continue;

      const mail = await simpleParser(all.body);
      
      const fromEmail = mail.from?.value[0]?.address || 'desconocido@correo.com';
      const fromName = mail.from?.value[0]?.name || fromEmail;
      
      const attachments = mail.attachments?.map((att) => ({
        filename: att.filename || 'adjunto',
        mimeType: att.contentType,
        content: att.content.toString('base64'),
        size: att.size
      })) || [];

      newEmails.push({
        id: idHeader,
        from: fromName,
        fromEmail: fromEmail,
        subject: mail.subject || 'Sin asunto',
        body: mail.text || mail.html || '',
        date: mail.date ? mail.date.toISOString() : new Date().toISOString(),
        status: 'pendiente',
        attachments: attachments
      });
    }

    connection.end();
    console.log('[IMAP] Conexión finalizada y correos mapeados.');

    for (const newEmail of newEmails) {
      if (!emailStore.find((e) => e.id === newEmail.id)) {
        emailStore.unshift(newEmail);
      }
    }

    // Devuelve TODO el buzón (pendientes, procesados y con error), no solo
    // los pendientes — de lo contrario un correo ya procesado desaparece
    // de la lista en el siguiente refresco/polling.
    return [...emailStore];
  } catch (error) {
    console.error('\n[IMAP ERROR CATASTRÓFICO] Ha fallado la conexión IMAP!');
    console.error('[IMAP ERROR DETALLE]:', error);
    return [...emailStore];
  }
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
 * Procesa un correo individual: clasificación IA real + reglas de negocio +
 * ejecución de la acción (reenvío SMTP real cuando corresponda).
 * Genera el historial de logs en tiempo real reflejando cada paso.
 */
export async function processEmail(emailId: string): Promise<ProcessResult | null> {
  const email = emailStore.find((e) => e.id === emailId);
  if (!email) return null;

  // Reinicia el historial para no mezclar logs de ejecuciones/mocks anteriores.
  logStore[emailId] = [];
  pushLog(emailId, 'info', 'Recepción', `Correo recibido de ${email.fromEmail}`);

  try {
    let attachmentsForLLM: { texts: { filename: string; text: string }[]; images: { filename: string; mimeType: string; base64: string }[] } = {
      texts: [],
      images: [],
    };

    if (email.attachments && email.attachments.length > 0) {
      const { texts, images, errors } = await processAttachments(email.attachments);
      attachmentsForLLM = { texts, images };

      const parts: string[] = [];
      if (texts.length) parts.push(`${texts.length} documento(s) analizado(s): ${texts.map((t) => t.filename).join(', ')}`);
      if (images.length) parts.push(`${images.length} imagen(es) enviada(s) a visión: ${images.map((i) => i.filename).join(', ')}`);
      if (errors.length) parts.push(`${errors.length} con error: ${errors.map((e) => `${e.filename} (${e.message})`).join('; ')}`);

      pushLog(
        emailId,
        errors.length > 0 ? 'warning' : 'info',
        'Adjuntos',
        parts.length ? parts.join(' · ') : 'Sin adjuntos procesables.'
      );
    }

    pushLog(emailId, 'info', 'Análisis NLP', 'Analizando contenido del correo con OpenAI...');

    const classification = await classifyEmail(email.body, email.fromEmail, attachmentsForLLM);
    const { category: finalCategory, lowConfidence, lowConfidenceReason } = resolveCategory(
      classification.category,
      classification.confidence
    );

    pushLog(
      emailId,
      lowConfidence ? 'warning' : 'success',
      'Clasificación',
      lowConfidence
        ? `Confianza baja (${classification.confidence}%) — ${lowConfidenceReason}`
        : `Categoría: ${finalCategory} · Remitente: ${classification.senderType} · Confianza: ${classification.confidence}%`
    );
    pushLog(emailId, 'info', 'Extracción', summarizeExtraction(classification));

    const action = determineAction(finalCategory, classification.senderType);

    pushLog(
      emailId,
      action.requiresHuman ? 'warning' : 'info',
      'Acción',
      `${action.businessLabel} → ${action.target}`
    );

    let finalStatus: Email['status'] = 'procesado';

    if (action.type === 'forward') {
      const prodMode = isProdModeEnabled();
      try {
        if (prodMode) {
          await sendForwardEmail({
            to: PROD_FORWARD_TARGET,
            internalNote: action.internalNote,
            originalEmail: {
              from: email.from,
              fromEmail: email.fromEmail,
              subject: email.subject,
              body: email.body,
              date: email.date,
            },
          });
          pushLog(
            emailId,
            'success',
            'Reenvío',
            `Correo reenviado de verdad a ${PROD_FORWARD_TARGET} (Prod Mode activo · ${action.internalNote}).`
          );
        } else {
          pushLog(
            emailId,
            'success',
            'Reenvío',
            `[SIMULACIÓN] Prod Mode inactivo — no se ha enviado ningún correo real (destino en producción: ${PROD_FORWARD_TARGET}).`
          );
        }
      } catch (error) {
        const message = error instanceof Error ? error.message : 'Error desconocido al reenviar.';
        pushLog(emailId, 'error', 'Reenvío', `Fallo al reenviar a ${PROD_FORWARD_TARGET}: ${message}`);
        finalStatus = 'error';
      }
    }

    const processedEmail: Email = {
      ...email,
      status: finalStatus,
      category: finalCategory,
      senderType: classification.senderType,
      confidence: classification.confidence,
      summary: lowConfidence
        ? `${action.businessLabel} — ${lowConfidenceReason}`
        : `${action.businessLabel} — ${classification.rationale}`,
    };

    emailStore = emailStore.map((e) => (e.id === emailId ? processedEmail : e));

    pushLog(
      emailId,
      finalStatus === 'error' ? 'error' : 'success',
      'Completado',
      finalStatus === 'error'
        ? 'Procesamiento finalizado con errores en el reenvío.'
        : 'Procesamiento finalizado.'
    );

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

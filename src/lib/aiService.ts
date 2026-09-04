import { BusinessCategory, SenderType } from './types';

// ==========================================
// AI Service - Servicio de Inteligencia Artificial
// ==========================================
// Este módulo define el prompt del sistema y la interfaz de comunicación
// con el LLM (Large Language Model). Actualmente mockeado, preparado
// para conectar con LangChain + OpenAI/Anthropic.
//
// 🔌 PUNTO DE INYECCIÓN: LangChain / OpenAI / Anthropic
// ==========================================

// ==========================================
// SYSTEM PROMPT para el Agente LLM
// ==========================================

export const SYSTEM_PROMPT = `Eres un agente de triaje de correos electrónicos para la empresa Exervis.
Tu trabajo es leer el cuerpo de cada correo electrónico, clasificarlo en una de las categorías predefinidas,
e identificar si el remitente es un "Cliente" externo o personal "Interno" (Producción).

## Categorías disponibles:

1. **ausencia_cliente** — Comunicación de ausencia recibida desde un CLIENTE externo.
2. **ausencia_produccion** — Comunicación de ausencia recibida desde personal INTERNO de producción.
3. **justificante_cobro** — Justificantes de pago, confirmings bancarios, comprobantes de transferencia.
4. **info_facturacion** — Información necesaria para facturar (horas, datos puntuales, etc.).
5. **cambio_cuenta** — Solicitud de cambio de número de cuenta bancaria.
6. **cambio_datos_presupuesto** — Cambios en datos de cliente o solicitudes/envío de presupuestos.
7. **incidencia_servicio** — Reportes de incidencias, fallos o problemas en la prestación del servicio.
8. **autorizacion_recibo** — Autorización para gestionar un recibo bancario devuelto.
9. **solicitud_facturas** — Solicitud de envío o reenvío de facturas.
10. **queja_precio** — Quejas o reclamaciones por subidas de precio.

## Reglas de clasificación:

- La distinción entre "ausencia_cliente" y "ausencia_produccion" es CRUCIAL.
  Analiza el dominio del email del remitente y el contenido del mensaje:
  - Si el remitente usa un dominio externo (@cliente.com, @empresa-externa.es) → ausencia_cliente
  - Si el remitente usa un dominio interno (@exervis.com) o se identifica como empleado → ausencia_produccion

- Para "justificante_cobro": busca palabras clave como "justificante", "transferencia", "confirming",
  "comprobante de pago", números de factura con importes.

- Para "queja_precio": busca expresiones de disconformidad, mención a subidas de precio,
  incrementos no pactados, amenazas de resolución de contrato.

## Formato de respuesta:

Debes responder SIEMPRE con un JSON válido con esta estructura exacta:

\`\`\`json
{
  "category": "<una de las 10 categorías listadas arriba>",
  "rationale": "<explicación breve en lenguaje de negocio de POR QUÉ has elegido esta categoría>",
  "senderType": "CLIENT" | "INTERNAL",
  "extractedData": {
    "senderName": "<nombre del remitente>",
    "senderCompany": "<empresa del remitente si se menciona>",
    "keyDates": ["<fechas relevantes mencionadas>"],
    "amounts": ["<importes mencionados>"],
    "references": ["<números de factura, contrato, referencia>"],
    "urgency": "low" | "medium" | "high",
    "summary": "<resumen de 1-2 frases del contenido del correo>"
  }
}
\`\`\`

## Restricciones:
- NO inventes datos que no estén en el correo.
- Si no puedes determinar la categoría con confianza, usa la más cercana y explícalo en "rationale".
- La "urgency" debe ser "high" para quejas, incidencias y autorizaciones de recibos devueltos.
- Responde SOLO con el JSON, sin texto adicional.
`;

// ==========================================
// Schema de validación (preparado para Zod)
// ==========================================
// 🔌 INYECCIÓN FUTURA: Usar con zod + LangChain Structured Output
//
// ```typescript
// import { z } from 'zod';
// import { ChatOpenAI } from '@langchain/openai';
//
// const LLMResponseSchema = z.object({
//   category: z.enum([...businessCategories]),
//   rationale: z.string().describe('Explicación en lenguaje de negocio'),
//   senderType: z.enum(['CLIENT', 'INTERNAL']),
//   extractedData: z.object({
//     senderName: z.string(),
//     senderCompany: z.string().optional(),
//     keyDates: z.array(z.string()),
//     amounts: z.array(z.string()),
//     references: z.array(z.string()),
//     urgency: z.enum(['low', 'medium', 'high']),
//     summary: z.string(),
//   }),
// });
//
// const llm = new ChatOpenAI({ model: 'gpt-4o', temperature: 0 });
// const structuredLLM = llm.withStructuredOutput(LLMResponseSchema);
// const result = await structuredLLM.invoke([...messages]);
// ```

// ==========================================
// Interfaz del resultado del LLM
// ==========================================

export interface LLMClassificationResult {
  category: BusinessCategory;
  rationale: string;
  senderType: SenderType;
  extractedData: {
    senderName: string;
    senderCompany?: string;
    keyDates: string[];
    amounts: string[];
    references: string[];
    urgency: 'low' | 'medium' | 'high';
    summary: string;
  };
}

// ==========================================
// Función mockeada de clasificación
// ==========================================

/**
 * Clasifica un correo electrónico usando el LLM.
 *
 * 🔌 INYECCIÓN FUTURA: LangChain Structured Output
 * ```typescript
 * export async function classifyEmail(emailBody: string, senderEmail: string): Promise<LLMClassificationResult> {
 *   const llm = new ChatOpenAI({ model: 'gpt-4o', temperature: 0 });
 *   const structuredLLM = llm.withStructuredOutput(LLMResponseSchema);
 *   const result = await structuredLLM.invoke([
 *     { role: 'system', content: SYSTEM_PROMPT },
 *     { role: 'user', content: `Remitente: ${senderEmail}\n\nCuerpo del correo:\n${emailBody}` },
 *   ]);
 *   return result;
 * }
 * ```
 */
export async function classifyEmail(
  emailBody: string,
  senderEmail: string
): Promise<LLMClassificationResult> {
  // Simulación de delay del LLM
  await new Promise((resolve) => setTimeout(resolve, 800));

  // Mock: clasificación basada en keywords (será reemplazada por LLM real)
  const body = emailBody.toLowerCase();
  const email = senderEmail.toLowerCase();

  const isInternal = email.endsWith('@exervis.com');
  const senderType: SenderType = isInternal ? 'INTERNAL' : 'CLIENT';

  let category: BusinessCategory = 'cambio_datos_presupuesto'; // fallback
  let rationale = '';
  let urgency: 'low' | 'medium' | 'high' = 'low';
  let summary = '';

  if (body.includes('ausencia') || body.includes('baja') || body.includes('enfermedad')) {
    category = isInternal ? 'ausencia_produccion' : 'ausencia_cliente';
    rationale = `Se ha detectado una comunicación de ausencia/baja. El remitente es ${isInternal ? 'personal interno' : 'un cliente externo'}.`;
    urgency = 'medium';
    summary = 'Comunicación de ausencia laboral.';
  } else if (body.includes('justificante') || body.includes('transferencia') || body.includes('confirming')) {
    category = 'justificante_cobro';
    rationale = 'El correo contiene un justificante de pago o comprobante de transferencia bancaria.';
    urgency = 'low';
    summary = 'Justificante de pago/transferencia recibido.';
  } else if (body.includes('queja') || body.includes('reclamación') || body.includes('subida de precio')) {
    category = 'queja_precio';
    rationale = 'El cliente expresa disconformidad con una subida de precios. Requiere atención manual.';
    urgency = 'high';
    summary = 'Queja por incremento de precios en contrato.';
  } else if (body.includes('incidencia') || body.includes('fallo') || body.includes('problema en el servicio')) {
    category = 'incidencia_servicio';
    rationale = 'Se reporta una incidencia o problema en la prestación del servicio.';
    urgency = 'high';
    summary = 'Reporte de incidencia en el servicio.';
  } else if (body.includes('factura') && (body.includes('enviar') || body.includes('solicito') || body.includes('reenviar'))) {
    category = 'solicitud_facturas';
    rationale = 'El remitente solicita el envío o reenvío de facturas.';
    urgency = 'medium';
    summary = 'Solicitud de envío de facturas.';
  } else if (body.includes('cuenta') && (body.includes('cambio') || body.includes('actualizar') || body.includes('nuevo número'))) {
    category = 'cambio_cuenta';
    rationale = 'Se solicita actualización de datos bancarios (número de cuenta).';
    urgency = 'medium';
    summary = 'Solicitud de cambio de cuenta bancaria.';
  } else if (body.includes('recibo devuelto') || body.includes('autorización') || body.includes('domiciliación')) {
    category = 'autorizacion_recibo';
    rationale = 'Autorización relacionada con recibo bancario devuelto.';
    urgency = 'high';
    summary = 'Autorización de recibo devuelto.';
  } else if (body.includes('presupuesto') || body.includes('datos de cliente') || body.includes('modificar datos')) {
    category = 'cambio_datos_presupuesto';
    rationale = 'Solicitud de cambio de datos de cliente o gestión de presupuestos.';
    urgency = 'low';
    summary = 'Cambio de datos o presupuesto.';
  } else if (body.includes('horas') || body.includes('facturar') || body.includes('puntual')) {
    category = 'info_facturacion';
    rationale = 'Se recibe información necesaria para emitir facturación.';
    urgency = 'low';
    summary = 'Información para facturación recibida.';
  }

  return {
    category,
    rationale,
    senderType,
    extractedData: {
      senderName: 'Extraído por mock',
      keyDates: [],
      amounts: [],
      references: [],
      urgency,
      summary,
    },
  };
}

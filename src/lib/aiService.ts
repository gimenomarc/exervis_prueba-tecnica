import OpenAI from 'openai';
import { BusinessCategory, SenderType } from './types';

// ==========================================
// AI Service - Servicio de Inteligencia Artificial
// ==========================================
// Este módulo define el prompt del sistema y clasifica cada correo
// llamando a la API de OpenAI (Chat Completions, salida JSON).
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

const VALID_CATEGORIES: BusinessCategory[] = [
  'ausencia_cliente',
  'ausencia_produccion',
  'justificante_cobro',
  'info_facturacion',
  'cambio_cuenta',
  'cambio_datos_presupuesto',
  'incidencia_servicio',
  'autorizacion_recibo',
  'solicitud_facturas',
  'queja_precio',
];

const VALID_SENDER_TYPES: SenderType[] = ['CLIENT', 'INTERNAL'];
const VALID_URGENCIES = ['low', 'medium', 'high'] as const;

let openaiClient: OpenAI | null = null;

function getOpenAIClient(): OpenAI {
  if (!process.env.OPENAI_API_KEY) {
    throw new Error(
      'OPENAI_API_KEY no configurada. Añádela en .env.local para poder clasificar correos.'
    );
  }
  if (!openaiClient) {
    openaiClient = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });
  }
  return openaiClient;
}

/**
 * Valida y normaliza el JSON devuelto por el LLM contra el shape esperado.
 * Lanza si el modelo devuelve algo fuera de las categorías/tipos definidos,
 * para no fingir una clasificación incorrecta.
 */
function parseClassification(raw: string): LLMClassificationResult {
  let parsed: unknown;
  try {
    parsed = JSON.parse(raw);
  } catch {
    throw new Error('El LLM no devolvió un JSON válido.');
  }

  const obj = parsed as Record<string, unknown>;
  const category = obj.category as BusinessCategory;
  const senderType = obj.senderType as SenderType;
  const extractedData = (obj.extractedData ?? {}) as Record<string, unknown>;
  const urgency = extractedData.urgency as string;

  if (!VALID_CATEGORIES.includes(category)) {
    throw new Error(`Categoría devuelta por el LLM no reconocida: "${String(obj.category)}"`);
  }
  if (!VALID_SENDER_TYPES.includes(senderType)) {
    throw new Error(`senderType devuelto por el LLM no reconocido: "${String(obj.senderType)}"`);
  }

  return {
    category,
    rationale: typeof obj.rationale === 'string' ? obj.rationale : '',
    senderType,
    extractedData: {
      senderName: typeof extractedData.senderName === 'string' ? extractedData.senderName : '',
      senderCompany:
        typeof extractedData.senderCompany === 'string' ? extractedData.senderCompany : undefined,
      keyDates: Array.isArray(extractedData.keyDates) ? extractedData.keyDates : [],
      amounts: Array.isArray(extractedData.amounts) ? extractedData.amounts : [],
      references: Array.isArray(extractedData.references) ? extractedData.references : [],
      urgency: (VALID_URGENCIES as readonly string[]).includes(urgency)
        ? (urgency as 'low' | 'medium' | 'high')
        : 'low',
      summary: typeof extractedData.summary === 'string' ? extractedData.summary : '',
    },
  };
}

/**
 * Clasifica un correo electrónico llamando a la API de OpenAI, usando
 * el SYSTEM_PROMPT con las reglas de negocio de Exervis.
 */
export async function classifyEmail(
  emailBody: string,
  senderEmail: string
): Promise<LLMClassificationResult> {
  const client = getOpenAIClient();
  const model = process.env.OPENAI_MODEL || 'gpt-4o-mini';

  const completion = await client.chat.completions.create({
    model,
    temperature: 0,
    response_format: { type: 'json_object' },
    messages: [
      { role: 'system', content: SYSTEM_PROMPT },
      {
        role: 'user',
        content: `Remitente: ${senderEmail}\n\nCuerpo del correo:\n${emailBody}`,
      },
    ],
  });

  const content = completion.choices[0]?.message?.content;
  if (!content) {
    throw new Error('La API de OpenAI no devolvió contenido.');
  }

  return parseClassification(content);
}

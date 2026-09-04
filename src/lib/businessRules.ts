import { BusinessCategory, SenderType, ActionResult } from './types';

// ==========================================
// Motor de Reglas de Negocio
// ==========================================
// Define las acciones a ejecutar según la categoría detectada por la IA
// y el tipo de remitente. Estas reglas son proporcionadas por el cliente
// y representan el flujo operativo real de Exervis.
// ==========================================

/**
 * Configuración de reglas de negocio.
 * Cada entrada define: qué hacer cuando la IA detecta una categoría concreta.
 */
export const BUSINESS_RULES: Record<BusinessCategory, {
  label: string;
  icon: string;
  description: string;
  actions: {
    default: ActionResult;
    bysender?: Partial<Record<SenderType, ActionResult>>;
  };
}> = {
  ausencia_cliente: {
    label: 'Ausencia (desde Cliente)',
    icon: '🏥',
    description: 'Comunicación de ausencia recibida desde un cliente externo.',
    actions: {
      default: {
        type: 'forward',
        target: 'prueba3@exervis.com',
        internalNote: 'Para Producción/Delegación',
        businessLabel: 'Reenviar a Producción/Delegación',
        requiresHuman: false,
      },
    },
  },
  ausencia_produccion: {
    label: 'Ausencia (desde Producción)',
    icon: '🏭',
    description: 'Comunicación de ausencia recibida desde personal interno de producción.',
    actions: {
      default: {
        type: 'system_action',
        target: 'sistema_gestion',
        internalNote: 'Abono/Comparativa en sistema',
        businessLabel: 'Gestionar en sistema (Abono/Comparativa)',
        requiresHuman: false,
      },
    },
  },
  justificante_cobro: {
    label: 'Justificante de cobro / Confirming',
    icon: '💰',
    description: 'Justificantes de pago, confirmings bancarios o comprobantes de transferencia.',
    actions: {
      default: {
        type: 'forward',
        target: 'prueba3@exervis.com',
        internalNote: 'Para Glenis',
        businessLabel: 'Reenviar a Glenis',
        requiresHuman: false,
      },
    },
  },
  info_facturacion: {
    label: 'Información para facturar',
    icon: '📊',
    description: 'Datos de facturación, horas puntuales o información necesaria para emitir facturas.',
    actions: {
      default: {
        type: 'system_action',
        target: 'sistema_facturacion',
        internalNote: 'Procesar datos para facturación',
        businessLabel: 'Procesar para facturación (Sistema)',
        requiresHuman: false,
      },
    },
  },
  cambio_cuenta: {
    label: 'Cambio de número de cuenta',
    icon: '🏦',
    description: 'Solicitud de actualización de datos bancarios (número de cuenta).',
    actions: {
      default: {
        type: 'system_action',
        target: 'sistema_gestion',
        internalNote: 'Actualizar datos bancarios en el sistema',
        businessLabel: 'Actualizar en sistema',
        requiresHuman: false,
      },
    },
  },
  cambio_datos_presupuesto: {
    label: 'Cambio de datos / Presupuestos',
    icon: '📋',
    description: 'Modificación de datos de cliente o solicitudes/envío de presupuestos.',
    actions: {
      default: {
        type: 'forward',
        target: 'prueba3@exervis.com',
        internalNote: 'Para Oficina Técnica',
        businessLabel: 'Reenviar a Oficina Técnica',
        requiresHuman: false,
      },
    },
  },
  incidencia_servicio: {
    label: 'Incidencia en el servicio',
    icon: '⚠️',
    description: 'Reporte de incidencias, fallos o problemas en la prestación del servicio.',
    actions: {
      default: {
        type: 'forward',
        target: 'prueba3@exervis.com',
        internalNote: 'Para Producción/Delegación',
        businessLabel: 'Reenviar a Producción/Delegación',
        requiresHuman: false,
      },
    },
  },
  autorizacion_recibo: {
    label: 'Autorización recibo devuelto',
    icon: '🔄',
    description: 'Autorización para gestionar un recibo bancario devuelto.',
    actions: {
      default: {
        type: 'forward',
        target: 'prueba3@exervis.com',
        internalNote: 'Para Pagos',
        businessLabel: 'Reenviar a Pagos',
        requiresHuman: false,
      },
    },
  },
  solicitud_facturas: {
    label: 'Solicitud de envío de facturas',
    icon: '📤',
    description: 'Solicitud de envío o reenvío de facturas a un cliente o proveedor.',
    actions: {
      default: {
        type: 'system_action',
        target: 'sistema_facturacion',
        internalNote: 'Enviar facturas solicitadas desde el sistema',
        businessLabel: 'Enviar facturas solicitadas (Sistema)',
        requiresHuman: false,
      },
    },
  },
  queja_precio: {
    label: 'Queja por subida de precios',
    icon: '🚨',
    description: 'Reclamación o queja relacionada con incrementos de precio en contratos o servicios.',
    actions: {
      default: {
        type: 'manual_review',
        target: 'revision_manual',
        internalNote: 'Requiere intervención humana — No se puede automatizar',
        businessLabel: 'Marcar para revisión manual (Requiere humano)',
        requiresHuman: true,
      },
    },
  },
  sin_clasificar: {
    label: 'Sin clasificar (confianza baja)',
    icon: '❓',
    description: 'La IA no alcanzó suficiente confianza para asignar una categoría de negocio con seguridad.',
    actions: {
      default: {
        type: 'manual_review',
        target: 'revision_manual',
        internalNote: 'Confianza de clasificación por debajo del umbral — revisar manualmente',
        businessLabel: 'Revisión manual (confianza insuficiente)',
        requiresHuman: true,
      },
    },
  },
};

// ==========================================
// Umbral de confianza de clasificación
// ==========================================

/**
 * Confianza mínima (0-100) que debe reportar el LLM para aceptar su
 * categoría. Por debajo de este umbral, se sobreescribe a
 * 'sin_clasificar' en vez de fingir una clasificación poco fiable.
 * Configurable vía CLASSIFICATION_CONFIDENCE_THRESHOLD en .env.
 */
export const CONFIDENCE_THRESHOLD = (() => {
  const raw = Number(process.env.CLASSIFICATION_CONFIDENCE_THRESHOLD);
  return Number.isFinite(raw) && raw >= 0 && raw <= 100 ? raw : 60;
})();

export interface CategoryResolution {
  category: BusinessCategory;
  lowConfidence: boolean;
  lowConfidenceReason?: string;
}

/**
 * Aplica el umbral de confianza a la categoría sugerida por la IA.
 * Si la confianza reportada es insuficiente, degrada a 'sin_clasificar'
 * y explica por qué (categoría original sugerida + puntuación).
 */
export function resolveCategory(
  suggestedCategory: BusinessCategory,
  confidence: number
): CategoryResolution {
  if (confidence < CONFIDENCE_THRESHOLD) {
    return {
      category: 'sin_clasificar',
      lowConfidence: true,
      lowConfidenceReason: `Confianza del modelo (${confidence}%) por debajo del umbral configurado (${CONFIDENCE_THRESHOLD}%). Categoría sugerida por la IA: ${suggestedCategory}.`,
    };
  }
  return { category: suggestedCategory, lowConfidence: false };
}

// ==========================================
// Motor de Decisión
// ==========================================

/**
 * Determina la acción a ejecutar basándose en la categoría detectada
 * por la IA y el tipo de remitente.
 *
 * Para la categoría "ausencia", el tipo de remitente es crucial:
 * - CLIENT → Se reenvía a Producción/Delegación
 * - INTERNAL → Se gestiona en sistema (Abono/Comparativa)
 *
 * @param category - Categoría detectada por el LLM
 * @param senderType - Tipo de remitente: CLIENT o INTERNAL
 * @returns ActionResult con la acción a ejecutar
 */
export function determineAction(
  category: BusinessCategory,
  senderType: SenderType
): ActionResult {
  // Caso especial: Ausencias dependen del tipo de remitente
  if (category === 'ausencia_cliente' || category === 'ausencia_produccion') {
    if (senderType === 'INTERNAL') {
      return BUSINESS_RULES.ausencia_produccion.actions.default;
    }
    return BUSINESS_RULES.ausencia_cliente.actions.default;
  }

  // Para todas las demás categorías, usar la acción por defecto
  const rule = BUSINESS_RULES[category];
  if (!rule) {
    // Categoría desconocida → Revisión manual por seguridad
    return {
      type: 'manual_review',
      target: 'revision_manual',
      internalNote: 'Categoría no reconocida — Requiere revisión manual',
      businessLabel: 'Categoría desconocida — Revisión manual',
      requiresHuman: true,
    };
  }

  // Comprobar si hay una acción específica para el tipo de remitente
  const senderSpecific = rule.actions.bysender?.[senderType];
  return senderSpecific ?? rule.actions.default;
}

/**
 * Obtiene la regla de negocio completa para una categoría dada.
 */
export function getBusinessRule(category: BusinessCategory) {
  return BUSINESS_RULES[category] ?? null;
}

/**
 * Lista todas las categorías disponibles con sus labels.
 * Útil para UIs de configuración o depuración.
 */
export function getAllCategories(): { key: BusinessCategory; label: string; icon: string }[] {
  return Object.entries(BUSINESS_RULES).map(([key, rule]) => ({
    key: key as BusinessCategory,
    label: rule.label,
    icon: rule.icon,
  }));
}

import fs from 'node:fs';
import path from 'node:path';
import { Email, AgentLog, EmailAttachment } from './types';

// ==========================================
// Mock Emails - Simulación de bandeja de entrada
// ==========================================
// Correos representativos de las 10 categorías de negocio de Exervis

function loadFixtureAttachment(filename: string, mimeType: string): EmailAttachment {
  const filePath = path.join(process.cwd(), 'src/lib/fixtures/attachments', filename);
  const buffer = fs.readFileSync(filePath);
  return {
    filename,
    mimeType,
    content: buffer.toString('base64'),
    size: buffer.length,
  };
}

export const mockEmails: Email[] = [
  {
    id: 'email-001',
    from: 'María García López',
    fromEmail: 'maria.garcia@empresa.com',
    subject: 'Ausencia por enfermedad',
    body: `Estimado equipo de RRHH,\n\nMe dirijo a ustedes para comunicar que, debido a un problema de salud diagnosticado por mi médico de cabecera, me veré en la imposibilidad de acudir a mi puesto de trabajo durante los próximos 3 días laborables (del 4 al 6 de septiembre de 2026).\n\nAdjunto el parte médico correspondiente para su revisión. Quedo a su disposición para cualquier aclaración que necesiten.\n\nUn saludo cordial,\nMaría García López\nDepartamento de Contabilidad`,
    date: '2026-09-04T08:15:00Z',
    status: 'pendiente',
  },
  {
    id: 'email-002',
    from: 'Carlos Rodríguez Pérez',
    fromEmail: 'carlos.rodriguez@proveedor.es',
    subject: 'Justificante de transferencia - Factura #2024-0847',
    body: `Buenos días,\n\nLe adjunto el justificante bancario de la transferencia realizada el día 03/09/2026 correspondiente a la factura #2024-0847 por un importe de 4.350,00€.\n\nDatos de la transferencia:\n- Concepto: Pago Factura #2024-0847\n- Importe: 4.350,00€\n- Fecha valor: 03/09/2026\n- Referencia bancaria: TRF-2026090301847\n\nPor favor, confirmen la recepción del pago y procedan a actualizar el estado de la factura en sus sistemas.\n\nGracias y un saludo,\nCarlos Rodríguez Pérez\nDpto. Administración - Suministros Industriales del Norte S.L.`,
    date: '2026-09-03T16:42:00Z',
    status: 'pendiente',
  },
  {
    id: 'email-003',
    from: 'Ana Martínez Ruiz',
    fromEmail: 'ana.martinez@cliente.com',
    subject: 'Queja por subida de precio en contrato de mantenimiento',
    body: `A la atención del Departamento Comercial,\n\nMe pongo en contacto con ustedes para expresar mi disconformidad con la reciente subida de precios aplicada a nuestro contrato de mantenimiento (Ref: MANT-2024-0156).\n\nSegún las condiciones pactadas en la última renovación, el incremento anual máximo acordado era del 3% (vinculado al IPC), sin embargo, en la última factura recibida se ha aplicado un incremento del 8,5%, lo cual consideramos excesivo e injustificado.\n\nSolicitamos una revisión inmediata de esta situación y, en caso de no recibir una respuesta satisfactoria en un plazo de 15 días, nos veremos obligados a iniciar el procedimiento de resolución del contrato.\n\nAtentamente,\nAna Martínez Ruiz\nDirectora de Compras - Manufacturas Levante S.A.`,
    date: '2026-09-03T11:20:00Z',
    status: 'pendiente',
  },
  {
    id: 'email-004',
    from: 'Pedro Sánchez Díaz',
    fromEmail: 'pedro.sanchez@cliente.com',
    subject: 'Incidencia en servicio de limpieza - Centro Norte',
    body: `Estimados,\n\nLes escribo para reportar una incidencia en el servicio de limpieza contratado para nuestras instalaciones del Centro Norte (Ref. contrato: SRV-2025-0312).\n\nDesde el pasado lunes 01/09/2026, el personal asignado no se ha presentado en el turno de tarde (14:00-22:00), lo que ha provocado quejas internas de nuestros empleados y un deterioro visible de la limpieza en las áreas comunes.\n\nNecesitamos una solución urgente y que se restablezca el servicio completo a la mayor brevedad posible.\n\nUn saludo,\nPedro Sánchez Díaz\nFacilities Manager - Centro Empresarial Norte S.A.`,
    date: '2026-09-02T09:05:00Z',
    status: 'procesado',
    category: 'incidencia_servicio',
    senderType: 'CLIENT',
    summary: 'Incidencia reportada: falta de personal de limpieza en turno de tarde desde 01/09/2026.',
  },
  // ==========================================
  // Correos con adjuntos reales (PDF/DOCX/XLSX/imagen) — el cuerpo es
  // deliberadamente vago: el motivo real está en el adjunto, para probar
  // que la IA lo lee y clasifica en base a su contenido.
  // ==========================================
  {
    id: 'email-005',
    from: 'Laura Fernández Molina',
    fromEmail: 'laura.fernandez@cliente-externo.com',
    subject: 'Documentación adjunta',
    body: `Buenos días,\n\nLes adjunto la documentación correspondiente.\n\nUn saludo,\nLaura Fernández Molina`,
    date: '2026-09-05T09:00:00Z',
    status: 'pendiente',
    attachments: [loadFixtureAttachment('parte-medico.pdf', 'application/pdf')],
  },
  {
    id: 'email-006',
    from: 'Pedro Sánchez Díaz',
    fromEmail: 'pedro.sanchez@partner.com',
    subject: 'Adjunto solicitud',
    body: `Hola,\n\nOs paso adjunta la solicitud comentada por teléfono.\n\nGracias,\nPedro`,
    date: '2026-09-05T10:30:00Z',
    status: 'pendiente',
    attachments: [
      loadFixtureAttachment(
        'solicitud-presupuesto.docx',
        'application/vnd.openxmlformats-officedocument.wordprocessingml.document'
      ),
    ],
  },
  {
    id: 'email-007',
    from: 'Carlos Rodríguez Pérez',
    fromEmail: 'carlos.rodriguez@proveedor.es',
    subject: 'Datos para facturar',
    body: `Buenas,\n\nAdjunto el detalle para la facturación de este mes.\n\nSaludos.`,
    date: '2026-09-05T12:00:00Z',
    status: 'pendiente',
    attachments: [
      loadFixtureAttachment(
        'horas-puntuales.xlsx',
        'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet'
      ),
    ],
  },
  {
    id: 'email-008',
    from: 'Ana Martínez Ruiz',
    fromEmail: 'ana.martinez@cliente.com',
    subject: 'Recibo bancario adjunto',
    body: `Hola,\n\nOs adjunto la imagen del recibo que comentamos.\n\nGracias.`,
    date: '2026-09-05T13:15:00Z',
    status: 'pendiente',
    attachments: [loadFixtureAttachment('imagen-placeholder.png', 'image/png')],
  },
];

// ==========================================
// Mock Agent Logs - Simulación de logs del agente IA
// Escritos en lenguaje de negocio para el Historial de Gestión
// ==========================================

export const mockAgentLogs: Record<string, AgentLog[]> = {
  'email-001': [
    {
      id: 'log-001-1',
      emailId: 'email-001',
      timestamp: '2026-09-04T08:15:02Z',
      level: 'info',
      step: 'Recepción',
      message: 'Nuevo correo recibido de maria.garcia@empresa.com',
    },
    {
      id: 'log-001-2',
      emailId: 'email-001',
      timestamp: '2026-09-04T08:15:03Z',
      level: 'info',
      step: 'Análisis NLP',
      message: 'Analizando contenido del correo con motor de IA...',
    },
    {
      id: 'log-001-3',
      emailId: 'email-001',
      timestamp: '2026-09-04T08:15:05Z',
      level: 'success',
      step: 'Clasificación',
      message: 'Categoría: AUSENCIA (Cliente) | Confianza: 97.2%',
    },
    {
      id: 'log-001-4',
      emailId: 'email-001',
      timestamp: '2026-09-04T08:15:06Z',
      level: 'info',
      step: 'Extracción',
      message: 'Empleado: María García López · Duración: 3 días · Fechas: 04-06/09/2026 · Motivo: Enfermedad',
    },
    {
      id: 'log-001-5',
      emailId: 'email-001',
      timestamp: '2026-09-04T08:15:07Z',
      level: 'info',
      step: 'Acción',
      message: 'Reenviar a prueba3@exervis.com → Para Producción/Delegación',
    },
    {
      id: 'log-001-6',
      emailId: 'email-001',
      timestamp: '2026-09-04T08:15:08Z',
      level: 'success',
      step: 'Completado',
      message: 'Correo clasificado como Ausencia (Cliente) y reenviado a Producción/Delegación.',
    },
  ],
  'email-002': [
    {
      id: 'log-002-1',
      emailId: 'email-002',
      timestamp: '2026-09-03T16:42:02Z',
      level: 'info',
      step: 'Recepción',
      message: 'Nuevo correo recibido de carlos.rodriguez@proveedor.es',
    },
    {
      id: 'log-002-2',
      emailId: 'email-002',
      timestamp: '2026-09-03T16:42:03Z',
      level: 'info',
      step: 'Análisis NLP',
      message: 'Analizando contenido del correo con motor de IA...',
    },
    {
      id: 'log-002-3',
      emailId: 'email-002',
      timestamp: '2026-09-03T16:42:05Z',
      level: 'success',
      step: 'Clasificación',
      message: 'Categoría: JUSTIFICANTE DE COBRO | Confianza: 94.8%',
    },
    {
      id: 'log-002-4',
      emailId: 'email-002',
      timestamp: '2026-09-03T16:42:06Z',
      level: 'info',
      step: 'Extracción',
      message: 'Factura: #2024-0847 · Importe: 4.350,00€ · Ref. bancaria: TRF-2026090301847',
    },
    {
      id: 'log-002-5',
      emailId: 'email-002',
      timestamp: '2026-09-03T16:42:07Z',
      level: 'info',
      step: 'Acción',
      message: 'Reenviar a prueba3@exervis.com → Para Glenis (conciliación de pago)',
    },
    {
      id: 'log-002-6',
      emailId: 'email-002',
      timestamp: '2026-09-03T16:42:08Z',
      level: 'success',
      step: 'Completado',
      message: 'Justificante registrado y reenviado a Glenis para conciliación bancaria.',
    },
  ],
  'email-003': [
    {
      id: 'log-003-1',
      emailId: 'email-003',
      timestamp: '2026-09-03T11:20:02Z',
      level: 'info',
      step: 'Recepción',
      message: 'Nuevo correo recibido de ana.martinez@cliente.com',
    },
    {
      id: 'log-003-2',
      emailId: 'email-003',
      timestamp: '2026-09-03T11:20:03Z',
      level: 'info',
      step: 'Análisis NLP',
      message: 'Analizando contenido del correo con motor de IA...',
    },
    {
      id: 'log-003-3',
      emailId: 'email-003',
      timestamp: '2026-09-03T11:20:05Z',
      level: 'warning',
      step: 'Clasificación',
      message: 'Categoría: QUEJA POR SUBIDA DE PRECIOS | Confianza: 98.1% · ⚠️ Prioridad ALTA',
    },
    {
      id: 'log-003-4',
      emailId: 'email-003',
      timestamp: '2026-09-03T11:20:06Z',
      level: 'info',
      step: 'Extracción',
      message: 'Cliente: Ana Martínez Ruiz · Contrato: MANT-2024-0156 · Incremento: 8.5% vs 3% pactado · Plazo: 15 días',
    },
    {
      id: 'log-003-5',
      emailId: 'email-003',
      timestamp: '2026-09-03T11:20:07Z',
      level: 'warning',
      step: 'Análisis de Sentimiento',
      message: 'Sentimiento: NEGATIVO (0.87) — Riesgo de pérdida de cliente detectado',
    },
    {
      id: 'log-003-6',
      emailId: 'email-003',
      timestamp: '2026-09-03T11:20:08Z',
      level: 'error',
      step: 'Acción',
      message: 'MARCADO PARA REVISIÓN MANUAL — Requiere intervención humana. No automatizable.',
    },
  ],
  'email-004': [
    {
      id: 'log-004-1',
      emailId: 'email-004',
      timestamp: '2026-09-02T09:05:02Z',
      level: 'info',
      step: 'Recepción',
      message: 'Nuevo correo recibido de pedro.sanchez@cliente.com',
    },
    {
      id: 'log-004-2',
      emailId: 'email-004',
      timestamp: '2026-09-02T09:05:03Z',
      level: 'info',
      step: 'Análisis NLP',
      message: 'Analizando contenido del correo con motor de IA...',
    },
    {
      id: 'log-004-3',
      emailId: 'email-004',
      timestamp: '2026-09-02T09:05:05Z',
      level: 'warning',
      step: 'Clasificación',
      message: 'Categoría: INCIDENCIA EN EL SERVICIO | Confianza: 96.4% · ⚠️ Urgente',
    },
    {
      id: 'log-004-4',
      emailId: 'email-004',
      timestamp: '2026-09-02T09:05:06Z',
      level: 'info',
      step: 'Extracción',
      message: 'Cliente: Pedro Sánchez Díaz · Contrato: SRV-2025-0312 · Ubicación: Centro Norte · Turno afectado: Tarde (14-22h)',
    },
    {
      id: 'log-004-5',
      emailId: 'email-004',
      timestamp: '2026-09-02T09:05:07Z',
      level: 'info',
      step: 'Acción',
      message: 'Reenviar a prueba3@exervis.com → Para Producción/Delegación (incidencia de servicio)',
    },
    {
      id: 'log-004-6',
      emailId: 'email-004',
      timestamp: '2026-09-02T09:05:08Z',
      level: 'success',
      step: 'Completado',
      message: 'Incidencia registrada y reenviada a Producción/Delegación para resolución urgente.',
    },
  ],
};

import nodemailer, { Transporter } from 'nodemailer';

// ==========================================
// Mail Service
// ==========================================
// Envío real de correo por SMTP (Outlook / Microsoft 365) para las
// acciones de reenvío que decide el motor de reglas de negocio.
// ==========================================

let transporter: Transporter | null = null;

function getTransporter(): Transporter {
  const user = process.env.MAIL_USER;
  const password = process.env.MAIL_PASSWORD;

  if (!user || !password) {
    throw new Error(
      'MAIL_USER / MAIL_PASSWORD no configuradas. Añádelas en .env.local para poder enviar correos.'
    );
  }

  if (!transporter) {
    const service = (process.env.MAILING_SERVICE || 'outlook').toLowerCase();
    const isOutlook = ['outlook', 'outlook365', 'office365', 'hotmail'].includes(service);

    transporter = nodemailer.createTransport(
      isOutlook
        ? {
            host: 'smtp.office365.com',
            port: 587,
            secure: false, // STARTTLS
            auth: { user, pass: password },
          }
        : {
            service: process.env.MAILING_SERVICE,
            auth: { user, pass: password },
          }
    );
  }

  return transporter;
}

export interface ForwardEmailInput {
  to: string;
  internalNote: string;
  originalEmail: {
    from: string;
    fromEmail: string;
    subject: string;
    body: string;
    date: string;
  };
}

/**
 * Reenvía un correo original a un destinatario interno (Producción,
 * Glenis, Oficina Técnica, Pagos...), vía prueba3@exervis.com en esta
 * prueba técnica, incluyendo el motivo de la derivación y el contenido
 * original para contexto.
 */
export async function sendForwardEmail({ to, internalNote, originalEmail }: ForwardEmailInput): Promise<void> {
  const transport = getTransporter();

  await transport.sendMail({
    from: process.env.MAIL_USER,
    to,
    subject: `Fwd: ${originalEmail.subject}`,
    text: [
      'Reenviado automáticamente por el agente de triaje de correos de Exervis.',
      `Motivo de la derivación: ${internalNote}`,
      '',
      '--- Correo original ---',
      `De: ${originalEmail.from} <${originalEmail.fromEmail}>`,
      `Fecha: ${originalEmail.date}`,
      `Asunto: ${originalEmail.subject}`,
      '',
      originalEmail.body,
    ].join('\n'),
  });
}

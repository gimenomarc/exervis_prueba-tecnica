import nodemailer, { Transporter } from 'nodemailer';

// ==========================================
// Mail Service
// ==========================================
// Envío real de correo por SMTP (Outlook / Microsoft 365) para las
// acciones de reenvío que decide el motor de reglas de negocio.
// ==========================================

let transporter: Transporter | null = null;
let currentConfigUser: string | null = null;

async function getTransporter(): Promise<{ transport: Transporter, user: string }> {
  const user = process.env.MAIL_USER || '';
  const password = process.env.MAIL_PASSWORD || '';

  if (!user || !password) {
    throw new Error(
      'MAIL_USER / MAIL_PASSWORD no configuradas para poder enviar correos.'
    );
  }

  // Recrear el transporter si el usuario cambió
  if (!transporter || currentConfigUser !== user) {
    transporter = nodemailer.createTransport({
      host: 'send.one.com',
      port: 465,
      secure: true, // true para puerto 465 (SSL)
      auth: { user, pass: password },
    });
    currentConfigUser = user;
  }

  return { transport: transporter, user };
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
  const { transport, user } = await getTransporter();

  await transport.sendMail({
    from: user,
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

import { NextResponse } from 'next/server';
import { processEmail } from '@/lib/emailService';

// POST /api/emails/:id/process
// Procesa (o reprocesa) un único correo bajo demanda.
export async function POST(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const result = await processEmail(id);

    if (!result) {
      return NextResponse.json({ success: false, message: 'Correo no encontrado.' }, { status: 404 });
    }

    return NextResponse.json({ success: true, email: result.email, logs: result.logs });
  } catch (error) {
    console.error('Error processing email:', error);
    return NextResponse.json(
      { success: false, message: 'Error al procesar el correo.' },
      { status: 500 }
    );
  }
}

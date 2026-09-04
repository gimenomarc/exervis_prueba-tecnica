import { NextResponse } from 'next/server';
import { getEmailById, getLogsByEmailId } from '@/lib/emailService';

// GET /api/emails/:id
// Devuelve un correo específico con sus logs del agente.
export async function GET(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const email = await getEmailById(id);

    if (!email) {
      return NextResponse.json(
        { success: false, message: 'Correo no encontrado.' },
        { status: 404 }
      );
    }

    const logs = await getLogsByEmailId(id);

    return NextResponse.json({ success: true, email, logs });
  } catch (error) {
    console.error('Error fetching email:', error);
    return NextResponse.json(
      { success: false, message: 'Error al obtener el correo.' },
      { status: 500 }
    );
  }
}

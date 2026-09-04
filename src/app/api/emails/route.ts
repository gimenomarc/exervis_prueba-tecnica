export const dynamic = 'force-dynamic';

import { NextResponse } from 'next/server';
import { getEmails } from '@/lib/emailService';

// GET /api/emails
// Devuelve todos los correos electrónicos.
export async function GET() {
  try {
    const emails = await getEmails();
    return NextResponse.json({ success: true, emails });
  } catch (error) {
    console.error('Error fetching emails:', error);
    return NextResponse.json(
      { success: false, message: 'Error al obtener los correos.' },
      { status: 500 }
    );
  }
}

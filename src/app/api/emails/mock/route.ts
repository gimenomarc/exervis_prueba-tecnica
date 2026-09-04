import { NextResponse } from 'next/server';
import { generateMockData } from '@/lib/emailService';

// POST /api/emails/mock
// Genera casos de prueba en memoria
export async function POST() {
  try {
    generateMockData();
    return NextResponse.json({ success: true, message: 'Casos de prueba generados' });
  } catch (error) {
    console.error('Error generating mock data:', error);
    return NextResponse.json(
      { success: false, message: 'Error al generar casos.' },
      { status: 500 }
    );
  }
}

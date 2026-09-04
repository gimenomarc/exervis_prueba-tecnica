import { NextResponse } from 'next/server';
import { processAllEmails } from '@/lib/emailService';

// POST /api/trigger/manual
// Procesa masivamente todos los correos pendientes (modo one-shot).
//
// 🔌 INYECCIÓN FUTURA: Batch Processing
// En producción, este endpoint ejecutará el agente de LangChain
// en modo batch, procesando secuencial o paralelamente todos los
// correos marcados como 'pendiente' en la base de datos.
// Se podrá configurar el nivel de concurrencia y el timeout.
export async function POST() {
  try {
    const result = await processAllEmails();
    return NextResponse.json(result);
  } catch (error) {
    console.error('Error in manual trigger:', error);
    return NextResponse.json(
      { success: false, message: 'Error al procesar los correos manualmente.' },
      { status: 500 }
    );
  }
}

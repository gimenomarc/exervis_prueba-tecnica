import { NextResponse } from 'next/server';
import { handleAutoTrigger } from '@/lib/emailService';

// POST /api/trigger/auto
// Simula el webhook que se activa cuando llega un nuevo correo.
//
// 🔌 INYECCIÓN FUTURA: Webhook Real
// En producción, este endpoint será llamado por el proveedor de correo
// (Microsoft Graph, Gmail Push Notifications, etc.) cuando se reciba
// un nuevo mensaje. El payload incluirá el ID del mensaje para su
// procesamiento inmediato por el agente de LangChain.
export async function POST() {
  try {
    const result = await handleAutoTrigger();
    return NextResponse.json(result);
  } catch (error) {
    console.error('Error in auto trigger:', error);
    return NextResponse.json(
      { success: false, message: 'Error al procesar el webhook automático.' },
      { status: 500 }
    );
  }
}

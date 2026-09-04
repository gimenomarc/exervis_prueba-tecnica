'use server';

import { cookies } from 'next/headers';
import { redirect } from 'next/navigation';

export async function login(formData: FormData) {
  const email = formData.get('email')?.toString();
  const password = formData.get('password')?.toString();

  if (!email || !password) {
    return { error: 'Email y contraseña son requeridos' };
  }

  try {
    const imaps = (await import('imap-simple')).default;
    const config = {
      imap: {
        user: email,
        password: password,
        host: 'imap.one.com',
        port: 993,
        tls: true,
        authTimeout: 5000,
        tlsOptions: { rejectUnauthorized: false }
      }
    };

    console.log(`[LOGIN] Verificando credenciales IMAP para ${email}...`);
    const connection = await imaps.connect(config);
    connection.end();
    console.log(`[LOGIN] Credenciales verificadas con éxito.`);
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Error desconocido';
    console.error(`[LOGIN] Error de autenticación:`, message);
    return { error: `No se pudo conectar al correo: ${message}` };
  }

  // Si llegamos aquí, la conexión fue exitosa
  const cookieStore = await cookies();
  
  cookieStore.set('outlook_email', email, {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'lax',
    maxAge: 60 * 60 * 24, // 1 dia
  });

  cookieStore.set('outlook_password', password, {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'lax',
    maxAge: 60 * 60 * 24,
  });

  redirect('/dashboard');
}

export async function logout() {
  const cookieStore = await cookies();
  cookieStore.delete('outlook_email');
  cookieStore.delete('outlook_password');
  redirect('/');
}

export async function getCredentials() {
  const cookieStore = await cookies();
  const email = cookieStore.get('outlook_email')?.value;
  const password = cookieStore.get('outlook_password')?.value;
  
  if (!email || !password) {
    return null;
  }
  
  return { email, password };
}

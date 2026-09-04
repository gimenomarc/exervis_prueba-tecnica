'use server';

import { cookies } from 'next/headers';
import { redirect } from 'next/navigation';

export async function login(formData: FormData) {
  const password = formData.get('password')?.toString();

  if (!password) {
    return { error: 'La contraseña es requerida' };
  }

  const adminPassword = process.env.ADMIN_PASSWORD || 'exervis2026';

  if (password !== adminPassword) {
    return { error: 'Contraseña incorrecta' };
  }

  const cookieStore = await cookies();
  
  cookieStore.set('auth_token', 'authenticated', {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'lax',
    maxAge: 60 * 60 * 24 * 7, // 7 dias
  });

  redirect('/dashboard');
}

export async function logout() {
  const cookieStore = await cookies();
  cookieStore.delete('auth_token');
  redirect('/');
}

// Ya no necesitamos esto para IMAP, dejamos esto por si algo más lo importaba
export async function getCredentials() {
  return null;
}

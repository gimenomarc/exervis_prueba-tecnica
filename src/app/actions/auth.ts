'use server';

import { cookies } from 'next/headers';
import { redirect } from 'next/navigation';

export async function login(formData: FormData) {
  const email = formData.get('email')?.toString();
  const password = formData.get('password')?.toString();

  if (!email || !password) {
    throw new Error('Email y contraseña son requeridos');
  }

  // En una app real de producción, esto debería ir encriptado o no guardarse así.
  // Para esta prueba técnica, lo guardaremos en una cookie httpOnly temporal.
  
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

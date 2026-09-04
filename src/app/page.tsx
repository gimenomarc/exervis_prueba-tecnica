'use client';

import { useState } from 'react';
import { Mail, ArrowRight, Shield, Zap, Bot, Loader2, Sparkles, KeyRound, AlertTriangle } from 'lucide-react';
import { login } from './actions/auth';

export default function LoginPage() {
  const [isConnecting, setIsConnecting] = useState(false);
  const [error, setError] = useState('');

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setIsConnecting(true);
    setError('');

    const formData = new FormData(e.currentTarget);
    const result = await login(formData);

    if (result?.error) {
      setError(result.error);
      setIsConnecting(false);
    }
  };

  return (
    <main className="relative flex min-h-screen items-center justify-center overflow-hidden">
      {/* Background effects */}
      <div className="pointer-events-none absolute inset-0">
        <div className="absolute -top-40 -left-40 h-96 w-96 rounded-full bg-violet-600/10 blur-[128px]" />
        <div className="absolute -bottom-40 -right-40 h-96 w-96 rounded-full bg-indigo-600/10 blur-[128px]" />
        <div className="absolute top-1/2 left-1/2 h-64 w-64 -translate-x-1/2 -translate-y-1/2 rounded-full bg-violet-500/5 blur-[96px]" />
        <div
          className="absolute inset-0 opacity-[0.03]"
          style={{
            backgroundImage:
              'linear-gradient(rgba(255,255,255,0.1) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,0.1) 1px, transparent 1px)',
            backgroundSize: '64px 64px',
          }}
        />
      </div>

      {/* Card */}
      <div className="relative z-10 w-full max-w-md px-4">
        <div className="rounded-2xl border border-white/[0.08] bg-[#0c0c14]/80 p-8 shadow-2xl shadow-black/40 backdrop-blur-xl">
          {/* Logo */}
          <div className="mb-8 flex flex-col items-center">
            <div className="mb-4 flex h-20 w-20 items-center justify-center rounded-2xl bg-white p-2 shadow-xl shadow-white/10">
              <img src="/icon.jpg" alt="Exervis Logo" className="h-full w-full object-contain mix-blend-multiply" />
            </div>
            <h1 className="text-xl font-bold tracking-tight text-white">
              Exervis Mail Triage
            </h1>
            <p className="mt-1.5 text-center text-sm text-zinc-500">
              Gestión inteligente de correo potenciada por IA
            </p>
          </div>

          {error && (
            <div className="mb-6 rounded-lg bg-red-500/10 p-4 border border-red-500/20">
              <div className="flex items-start gap-3">
                <AlertTriangle className="h-5 w-5 text-red-400 shrink-0 mt-0.5" />
                <div className="text-xs text-red-200/80">
                  <p className="font-semibold text-red-300 mb-1">Error de conexión</p>
                  <p>{error}</p>
                </div>
              </div>
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="mb-2 block text-sm font-medium text-zinc-300" htmlFor="email">
                Correo de Outlook / Exervis
              </label>
              <div className="relative">
                <Mail className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-zinc-500" />
                <input
                  type="email"
                  id="email"
                  name="email"
                  required
                  defaultValue="prueba@exervis.com"
                  placeholder="tu.nombre@exervis.com"
                  className="w-full rounded-xl border border-white/[0.08] bg-white/[0.03] px-10 py-3 text-sm text-white placeholder:text-zinc-600 focus:border-violet-500 focus:outline-none focus:ring-1 focus:ring-violet-500"
                />
              </div>
            </div>

            <div>
              <label className="mb-2 block text-sm font-medium text-zinc-300" htmlFor="password">
                Contraseña
              </label>
              <div className="relative">
                <KeyRound className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-zinc-500" />
                <input
                  type="password"
                  id="password"
                  name="password"
                  required
                  defaultValue={process.env.NEXT_PUBLIC_CTO_PASSWORD || ''}
                  placeholder="••••••••••••••••"
                  className="w-full rounded-xl border border-white/[0.08] bg-white/[0.03] px-10 py-3 text-sm text-white placeholder:text-zinc-600 focus:border-violet-500 focus:outline-none focus:ring-1 focus:ring-violet-500"
                />
              </div>
            </div>

            <button
              type="submit"
              disabled={isConnecting}
              className="group relative mt-6 flex w-full items-center justify-center gap-2.5 rounded-xl bg-gradient-to-r from-violet-600 to-indigo-600 px-6 py-3.5 text-sm font-semibold text-white shadow-xl shadow-violet-500/25 transition-all duration-300 hover:from-violet-500 hover:to-indigo-500 hover:shadow-violet-500/40 disabled:cursor-not-allowed disabled:opacity-70"
            >
              {isConnecting ? (
                <>
                  <Loader2 className="h-4.5 w-4.5 animate-spin" />
                  <span>Conectando e iniciando sesión...</span>
                </>
              ) : (
                <>
                  <Sparkles className="h-4.5 w-4.5" />
                  <span>Conectar cuenta de Correo</span>
                  <ArrowRight className="h-4 w-4 transition-transform duration-200 group-hover:translate-x-0.5" />
                </>
              )}
            </button>
          </form>

          {/* Footer note */}
          <p className="mt-6 text-center text-[11px] text-zinc-600">
            Las credenciales solo se usan temporalmente en memoria para esta prueba y no se guardan en base de datos.
          </p>
        </div>
      </div>
    </main>
  );
}

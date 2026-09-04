'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Mail, ArrowRight, Shield, Zap, Bot, Loader2, Sparkles } from 'lucide-react';

export default function LoginPage() {
  const router = useRouter();
  const [isConnecting, setIsConnecting] = useState(false);

  const handleConnect = async () => {
    setIsConnecting(true);
    // Simulamos un delay de conexión OAuth
    await new Promise((resolve) => setTimeout(resolve, 1500));
    router.push('/dashboard');
  };

  return (
    <main className="relative flex min-h-screen items-center justify-center overflow-hidden">
      {/* Background effects */}
      <div className="pointer-events-none absolute inset-0">
        {/* Gradient orbs */}
        <div className="absolute -top-40 -left-40 h-96 w-96 rounded-full bg-violet-600/10 blur-[128px]" />
        <div className="absolute -bottom-40 -right-40 h-96 w-96 rounded-full bg-indigo-600/10 blur-[128px]" />
        <div className="absolute top-1/2 left-1/2 h-64 w-64 -translate-x-1/2 -translate-y-1/2 rounded-full bg-violet-500/5 blur-[96px]" />

        {/* Grid pattern */}
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
            <div className="animated-gradient mb-4 flex h-16 w-16 items-center justify-center rounded-2xl bg-gradient-to-br from-violet-500 via-indigo-500 to-purple-600 shadow-xl shadow-violet-500/30">
              <Mail className="h-8 w-8 text-white" />
            </div>
            <h1 className="text-xl font-bold tracking-tight text-white">
              Exervis Mail Triage
            </h1>
            <p className="mt-1.5 text-center text-sm text-zinc-500">
              Gestión inteligente de correo potenciada por IA
            </p>
          </div>

          {/* Features */}
          <div className="mb-8 space-y-3">
            {[
              {
                icon: Bot,
                title: 'Clasificación automática',
                desc: 'IA que categoriza tus correos al instante',
              },
              {
                icon: Zap,
                title: 'Procesamiento en tiempo real',
                desc: 'Webhooks y triggers automáticos',
              },
              {
                icon: Shield,
                title: 'Trazabilidad completa',
                desc: 'Logs detallados de cada decisión del agente',
              },
            ].map((feature) => (
              <div
                key={feature.title}
                className="group flex items-start gap-3 rounded-xl border border-white/[0.04] bg-white/[0.02] p-3 transition-colors duration-200 hover:border-white/[0.08] hover:bg-white/[0.04]"
              >
                <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-violet-500/10">
                  <feature.icon className="h-4 w-4 text-violet-400" />
                </div>
                <div>
                  <p className="text-sm font-medium text-zinc-200">{feature.title}</p>
                  <p className="text-xs text-zinc-500">{feature.desc}</p>
                </div>
              </div>
            ))}
          </div>

          {/* Connect Button */}
          <button
            id="btn-connect"
            onClick={handleConnect}
            disabled={isConnecting}
            className="group relative flex w-full items-center justify-center gap-2.5 rounded-xl bg-gradient-to-r from-violet-600 to-indigo-600 px-6 py-3.5 text-sm font-semibold text-white shadow-xl shadow-violet-500/25 transition-all duration-300 hover:from-violet-500 hover:to-indigo-500 hover:shadow-violet-500/40 disabled:cursor-not-allowed disabled:opacity-70"
          >
            {isConnecting ? (
              <>
                <Loader2 className="h-4.5 w-4.5 animate-spin" />
                <span>Conectando...</span>
              </>
            ) : (
              <>
                <Sparkles className="h-4.5 w-4.5" />
                <span>Conectar cuenta de Exervis</span>
                <ArrowRight className="h-4 w-4 transition-transform duration-200 group-hover:translate-x-0.5" />
              </>
            )}
          </button>

          {/* Footer note */}
          <p className="mt-4 text-center text-[11px] text-zinc-600">
            Conexión segura · No almacenamos credenciales · Solo lectura
          </p>
        </div>
      </div>
    </main>
  );
}

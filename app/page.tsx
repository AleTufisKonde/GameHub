'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { login, obtenerSesion } from '@/lib/auth';

export default function LoginPage() {
  const router = useRouter();
  const [email, setEmail] = useState('');
  const [contrasena, setContrasena] = useState('');
  const [cargando, setCargando] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => { if (obtenerSesion()) router.replace('/dashboard'); }, [router]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(''); setCargando(true);
    try {
      await login(email, contrasena);
      router.push('/dashboard');
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Error al iniciar sesión');
    } finally { setCargando(false); }
  };

  return (
    <main
      className="min-h-screen flex items-center justify-center px-4 relative overflow-hidden"
      style={{ background: 'linear-gradient(145deg, #0c0c2e 0%, #141450 50%, #0a1540 100%)' }}
    >
      {/* Esferas decorativas de fondo */}
      <div style={{
        position: 'fixed', top: '-80px', left: '-80px',
        width: '380px', height: '380px', borderRadius: '50%',
        background: 'radial-gradient(circle, rgba(99,102,241,0.2) 0%, transparent 70%)',
        filter: 'blur(50px)', pointerEvents: 'none',
      }} />
      <div style={{
        position: 'fixed', bottom: '-80px', right: '-60px',
        width: '340px', height: '340px', borderRadius: '50%',
        background: 'radial-gradient(circle, rgba(34,211,238,0.18) 0%, transparent 70%)',
        filter: 'blur(50px)', pointerEvents: 'none',
      }} />
      <div style={{
        position: 'fixed', top: '40%', right: '20%',
        width: '200px', height: '200px', borderRadius: '50%',
        background: 'radial-gradient(circle, rgba(244,114,182,0.1) 0%, transparent 70%)',
        filter: 'blur(40px)', pointerEvents: 'none',
      }} />

      {/* Card principal */}
      <div
        className="w-full relative z-10"
        style={{
          maxWidth: '400px',
          background: 'rgba(20,20,72,0.85)',
          border: '1px solid rgba(34,211,238,0.15)',
          borderRadius: '28px',
          padding: '44px 40px',
          backdropFilter: 'blur(24px)',
          boxShadow: '0 40px 80px rgba(0,0,0,0.5), 0 0 0 1px rgba(99,102,241,0.1), inset 0 1px 0 rgba(255,255,255,0.07)',
        }}
      >
        {/* Línea superior degradada */}
        <div style={{
          position: 'absolute', top: 0, left: '10%', right: '10%', height: '2px',
          background: 'var(--grad-cyan)', borderRadius: '28px 28px 0 0',
        }} />

        {/* Logo centrado */}
        <div className="flex flex-col items-center mb-8">
          <div
            className="rounded-2xl overflow-hidden mb-4"
            style={{
              width: '88px', height: '88px',
              boxShadow: '0 12px 40px rgba(34,211,238,0.35), 0 0 0 1px rgba(34,211,238,0.2)',
            }}
          >
            <img src="/logo.png" className="w-full h-full object-cover" alt="GameHub" />
          </div>
          <h1
            className="text-3xl font-black"
            style={{ color: 'var(--text-1)', fontFamily: "'Space Grotesk', sans-serif", letterSpacing: '-0.5px' }}
          >
            GameHub
          </h1>
          <p className="text-sm mt-1 font-700" style={{ color: 'var(--cyan)' }}>
            Bienvenido al sistema
          </p>
        </div>

        {/* Formulario */}
        <form onSubmit={handleSubmit} className="space-y-5">
          <div>
            <label className="form-label">Nombre de Usuario</label>
            <div className="relative">
              <span
                className="absolute left-4 top-1/2 -translate-y-1/2 pointer-events-none"
                style={{ color: 'var(--cyan)', opacity: 0.7 }}
              >
                <svg viewBox="0 0 20 20" fill="currentColor" className="w-4 h-4">
                  <path fillRule="evenodd" d="M10 9a3 3 0 100-6 3 3 0 000 6zm-7 9a7 7 0 1114 0H3z" clipRule="evenodd" />
                </svg>
              </span>
              <input
                type="email" className="form-input"
                style={{ paddingLeft: '44px' }}
                placeholder="Ingresa tu usuario"
                value={email} onChange={(e) => setEmail(e.target.value)} required
              />
            </div>
          </div>

          <div>
            <label className="form-label">Contraseña</label>
            <div className="relative">
              <span
                className="absolute left-4 top-1/2 -translate-y-1/2 pointer-events-none"
                style={{ color: 'var(--cyan)', opacity: 0.7 }}
              >
                <svg viewBox="0 0 20 20" fill="currentColor" className="w-4 h-4">
                  <path fillRule="evenodd" d="M5 9V7a5 5 0 0110 0v2a2 2 0 012 2v5a2 2 0 01-2 2H5a2 2 0 01-2-2v-5a2 2 0 012-2zm8-2v2H7V7a3 3 0 016 0z" clipRule="evenodd" />
                </svg>
              </span>
              <input
                type="password" className="form-input"
                style={{ paddingLeft: '44px' }}
                placeholder="Ingresa tu contraseña"
                value={contrasena} onChange={(e) => setContrasena(e.target.value)} required
              />
            </div>
          </div>

          {error && (
            <div
              className="flex items-center gap-2 px-4 py-3 rounded-xl text-sm font-700"
              style={{ background: 'rgba(248,113,113,0.1)', color: 'var(--red)', border: '1px solid rgba(248,113,113,0.25)' }}
            >
              <span>⚠️</span> {error}
            </div>
          )}

          <button
            type="submit" className="btn-primary w-full py-3.5 text-sm mt-2"
            disabled={cargando}
            style={{ fontSize: '14px', letterSpacing: '0.5px' }}
          >
            {cargando
              ? <><span className="animate-spin inline-block w-4 h-4 border-2 border-current border-t-transparent rounded-full" /> Iniciando sesión...</>
              : 'Iniciar Sesión'}
          </button>
        </form>

        <p className="text-center text-xs mt-6" style={{ color: 'var(--text-3)' }}>
          © 2026 GameHub · Todos los derechos reservados
        </p>
      </div>
    </main>
  );
}
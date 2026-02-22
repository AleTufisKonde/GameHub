'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { login, obtenerSesion } from '@/lib/auth';

export default function LoginPage() {
  const router = useRouter();
  const [email, setEmail] = useState('');
  const [contrasena, setContrasena] = useState('');
  const [mostrarContrasena, setMostrarContrasena] = useState(false);
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
      style={{ background: 'var(--grad-bg)' }}
    >
      {/* Orbs de fondo */}
      <div style={{
        position: 'fixed', top: '-80px', left: '-80px',
        width: '420px', height: '420px', borderRadius: '50%',
        background: 'radial-gradient(circle, rgba(88,28,135,0.35) 0%, transparent 70%)',
        filter: 'blur(60px)', pointerEvents: 'none',
      }} />
      <div style={{
        position: 'fixed', bottom: '-80px', right: '-60px',
        width: '380px', height: '380px', borderRadius: '50%',
        background: 'radial-gradient(circle, rgba(34,211,238,0.2) 0%, transparent 70%)',
        filter: 'blur(60px)', pointerEvents: 'none',
      }} />
      <div style={{
        position: 'fixed', top: '40%', right: '20%',
        width: '250px', height: '250px', borderRadius: '50%',
        background: 'radial-gradient(circle, rgba(30,58,138,0.25) 0%, transparent 70%)',
        filter: 'blur(50px)', pointerEvents: 'none',
      }} />

      {/* Card */}
      <div className="w-full relative z-10" style={{
        maxWidth: '420px',
        background: 'rgba(15, 10, 46, 0.92)',
        border: '1px solid rgba(34,211,238,0.15)',
        borderRadius: '28px',
        padding: '48px 44px',
        backdropFilter: 'blur(24px)',
        WebkitBackdropFilter: 'blur(24px)',
        boxShadow: '0 40px 80px rgba(0,0,0,0.6), 0 0 0 1px rgba(88,28,135,0.2), inset 0 1px 0 rgba(255,255,255,0.07)',
      }}>

        {/* Línea superior */}
        <div style={{
          position: 'absolute', top: 0, left: '10%', right: '10%', height: '2px',
          background: 'linear-gradient(90deg, transparent, #22d3ee, #581c87, transparent)',
          borderRadius: '28px 28px 0 0',
        }} />

        {/* Logo */}
        <div className="flex flex-col items-center" style={{ marginBottom: '40px' }}>
          <div style={{
            width: '110px', height: '110px',
            borderRadius: '50%',
            overflow: 'hidden',
            margin: '0 auto 20px',
            position: 'relative',
            border: '2.5px solid rgba(34,211,238,0.45)',
            boxShadow: '0 0 25px rgba(34,211,238,0.3), 0 0 50px rgba(88,28,135,0.2)',
          }}>
            <img src="/logo.png" alt="GameHub" style={{
              width: '144%',
              height: '150%',
              objectFit: 'cover',
              position: 'absolute',
              top: '54%',
              left: '50%',
              transform: 'translate(-50%, -50%)',
            }} />
          </div>

          <h1 className="text-3xl font-black" style={{ color: '#ffffff', letterSpacing: '-0.5px' }}>
            GameHub
          </h1>
          <p className="text-sm font-semibold" style={{ color: '#22d3ee', marginTop: '10px', letterSpacing: '0.5px' }}>
            Bienvenido al sistema
          </p>
        </div>

        {/* Formulario */}
        <form onSubmit={handleSubmit}>

          {/* Email */}
          <div style={{ marginBottom: '20px' }}>
            <label className="form-label">Correo electrónico</label>
            <div className="relative">
              <span className="absolute left-4 top-1/2 -translate-y-1/2 pointer-events-none"
                style={{ color: '#22d3ee', opacity: 0.7 }}>
                <svg viewBox="0 0 20 20" fill="currentColor" className="w-4 h-4">
                  <path fillRule="evenodd" d="M10 9a3 3 0 100-6 3 3 0 000 6zm-7 9a7 7 0 1114 0H3z" clipRule="evenodd" />
                </svg>
              </span>
              <input type="email" className="form-input"
                style={{ paddingLeft: '44px' }}
                placeholder="correo@gamehub.com"
                value={email} onChange={(e) => setEmail(e.target.value)} required />
            </div>
          </div>

          {/* Contraseña */}
          <div style={{ marginBottom: '28px' }}>
            <label className="form-label">Contraseña</label>
            <div className="relative">
              <span className="absolute left-4 top-1/2 -translate-y-1/2 pointer-events-none"
                style={{ color: '#22d3ee', opacity: 0.7 }}>
                <svg viewBox="0 0 20 20" fill="currentColor" className="w-4 h-4">
                  <path fillRule="evenodd" d="M5 9V7a5 5 0 0110 0v2a2 2 0 012 2v5a2 2 0 01-2 2H5a2 2 0 01-2-2v-5a2 2 0 012-2zm8-2v2H7V7a3 3 0 016 0z" clipRule="evenodd" />
                </svg>
              </span>
              <input
                type={mostrarContrasena ? 'text' : 'password'}
                className="form-input"
                style={{ paddingLeft: '44px', paddingRight: '48px' }}
                placeholder="Ingresa tu contraseña"
                value={contrasena} onChange={(e) => setContrasena(e.target.value)} required />
              {/* Botón ojo */}
              <button type="button"
                onClick={() => setMostrarContrasena(!mostrarContrasena)}
                className="absolute right-3 top-1/2 -translate-y-1/2"
                style={{
                  background: 'none', border: 'none', cursor: 'pointer', padding: '4px',
                  color: mostrarContrasena ? '#22d3ee' : 'rgba(255,255,255,0.35)',
                  transition: '0.2s ease',
                }}>
                {mostrarContrasena ? (
                  <svg viewBox="0 0 20 20" fill="currentColor" className="w-5 h-5">
                    <path d="M10 12a2 2 0 100-4 2 2 0 000 4z" />
                    <path fillRule="evenodd" d="M.458 10C1.732 5.943 5.522 3 10 3s8.268 2.943 9.542 7c-1.274 4.057-5.064 7-9.542 7S1.732 14.057.458 10zM14 10a4 4 0 11-8 0 4 4 0 018 0z" clipRule="evenodd" />
                  </svg>
                ) : (
                  <svg viewBox="0 0 20 20" fill="currentColor" className="w-5 h-5">
                    <path fillRule="evenodd" d="M3.707 2.293a1 1 0 00-1.414 1.414l14 14a1 1 0 001.414-1.414l-1.473-1.473A10.014 10.014 0 0019.542 10C18.268 5.943 14.478 3 10 3a9.958 9.958 0 00-4.512 1.074l-1.78-1.781zm4.261 4.26l1.514 1.515a2.003 2.003 0 012.45 2.45l1.514 1.514a4 4 0 00-5.478-5.478z" clipRule="evenodd" />
                    <path d="M12.454 16.697L9.75 13.992a4 4 0 01-3.742-3.741L2.335 6.578A9.98 9.98 0 00.458 10c1.274 4.057 5.064 7 9.542 7 .847 0 1.669-.105 2.454-.303z" />
                  </svg>
                )}
              </button>
            </div>
          </div>

          {/* Error */}
          {error && (
            <div className="flex items-center gap-2 px-4 py-3 rounded-xl text-sm font-semibold"
              style={{
                background: 'rgba(239,68,68,0.1)', color: '#ef4444',
                border: '1px solid rgba(239,68,68,0.25)', marginBottom: '20px',
              }}>
              <span>⚠️</span> {error}
            </div>
          )}

          {/* Botón */}
          <button type="submit" className="btn-primary w-full" disabled={cargando}
            style={{ fontSize: '1rem', padding: '15px 24px', marginTop: '8px', letterSpacing: '0.5px' }}>
            {cargando ? (
              <>
                <span className="animate-spin inline-block w-4 h-4 border-2 border-current border-t-transparent rounded-full" />
                Iniciando sesión...
              </>
            ) : ' Iniciar Sesión'}
          </button>
        </form>

        <p className="text-center text-xs" style={{ color: 'rgba(255,255,255,0.25)', marginTop: '28px' }}>
          © 2026 GameHub · Todos los derechos reservados
        </p>
      </div>
    </main>
  );
}
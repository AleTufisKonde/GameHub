'use client';

import { usePathname, useRouter } from 'next/navigation';
import { useEffect, useState } from 'react';
import { obtenerSesion, logout } from '@/lib/auth';
import { Usuario } from '@/lib/types';

const navItems = [
  { href: '/dashboard',    label: 'Dashboard',   icon: <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" width="22" height="22"><rect x="3" y="3" width="7" height="7" rx="1"/><rect x="14" y="3" width="7" height="7" rx="1"/><rect x="3" y="14" width="7" height="7" rx="1"/><rect x="14" y="14" width="7" height="7" rx="1"/></svg> },
  { href: '/rentas',       label: 'Rentas',      icon: <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" width="22" height="22"><circle cx="12" cy="12" r="9"/><polyline points="12 6 12 12 16 14"/></svg> },
  { href: '/consolas',     label: 'Consolas',    icon: <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" width="22" height="22"><rect x="2" y="6" width="20" height="12" rx="3"/><line x1="8" y1="12" x2="12" y2="12"/><line x1="10" y1="10" x2="10" y2="14"/><circle cx="16" cy="11" r="1" fill="currentColor"/><circle cx="18" cy="13" r="1" fill="currentColor"/></svg> },
  { href: '/controles',    label: 'Controles',   icon: <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" width="22" height="22"><circle cx="12" cy="12" r="9"/><line x1="9" y1="12" x2="15" y2="12"/><line x1="12" y1="9" x2="12" y2="15"/></svg> },
  { href: '/inventario',   label: 'Inventario',  icon: <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" width="22" height="22"><rect x="2" y="3" width="20" height="4" rx="1"/><rect x="2" y="10" width="20" height="4" rx="1"/><rect x="2" y="17" width="20" height="4" rx="1"/></svg> },
  { href: '/reparaciones', label: 'Reparación',  icon: <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" width="22" height="22"><path d="M14.7 6.3a1 1 0 0 0 0 1.4l1.6 1.6a1 1 0 0 0 1.4 0l3.77-3.77a6 6 0 0 1-7.94 7.94l-6.91 6.91a2.12 2.12 0 0 1-3-3l6.91-6.91a6 6 0 0 1 7.94-7.94l-3.76 3.76z"/></svg> },
];

const navItemsGerente = [
  { href: '/empleados', label: 'Empleados', icon: <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" width="22" height="22"><path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/><path d="M23 21v-2a4 4 0 0 0-3-3.87"/><path d="M16 3.13a4 4 0 0 1 0 7.75"/></svg> },
  { href: '/ganancias', label: 'Ganancias', icon: <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" width="22" height="22"><line x1="12" y1="1" x2="12" y2="23"/><path d="M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6"/></svg> },
  { href: '/precios',   label: 'Precios',   icon: <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" width="22" height="22"><circle cx="12" cy="12" r="3"/><path d="M12 1v4M12 19v4M4.22 4.22l2.83 2.83M16.95 16.95l2.83 2.83M1 12h4M19 12h4M4.22 19.78l2.83-2.83M16.95 7.05l2.83-2.83"/></svg> },
];

export default function Navbar() {
  const pathname = usePathname();
  const router = useRouter();
  const [usuario, setUsuario] = useState<Usuario | null>(null);

  useEffect(() => { setUsuario(obtenerSesion()); }, []);

  const handleCerrarSesion = () => { logout(); router.push('/'); };
  const esGerente = usuario?.rol === 'gerente';
  const items = esGerente ? [...navItems, ...navItemsGerente] : navItems;

  return (
    <aside style={{
      width: 'var(--navbar-width)',
      position: 'fixed', top: 0, left: 0, bottom: 0,
      display: 'flex', flexDirection: 'column',
      background: 'rgba(0,0,0,0.35)',
      backdropFilter: 'blur(20px)',
      WebkitBackdropFilter: 'blur(20px)',
      borderRight: '1px solid rgba(255,255,255,0.08)',
      zIndex: 40,
      overflowY: 'auto',
    }}>

      {/* ── Logo ── */}
      <div style={{ padding: '32px 24px 28px', textAlign: 'center', position: 'relative' }}>
        {/* Glow detrás del logo */}
        <div style={{
          position: 'absolute', top: '20px', left: '50%', transform: 'translateX(-50%)',
          width: '120px', height: '120px',
          background: 'radial-gradient(circle, rgba(34,211,238,0.25) 0%, transparent 70%)',
          filter: 'blur(15px)', pointerEvents: 'none',
        }} />

        {/* Contenedor logo */}
        <div style={{
  width: '110px', height: '110px',
  margin: '0 auto 16px',
  borderRadius: '50%',
  border: '2.5px solid rgba(34,211,238,0.45)',
  boxShadow: '0 0 25px rgba(34,211,238,0.3), 0 0 50px rgba(88,28,135,0.2)',
  overflow: 'hidden',
  position: 'relative',
  background: 'transparent',
}}>
  <img
    src="/logo.png"
    alt="GameHub"
    style={{
      width: '144%',
      height: '150%',
      objectFit: 'cover',
      position: 'absolute',
      top: '54%',
      left: '50%',
      transform: 'translate(-50%, -50%)',
    }}
  />
</div>

        <p style={{
          fontSize: '1.8rem', fontWeight: 'bold',
          color: '#fff', lineHeight: 1.1, letterSpacing: '-0.5px',
        }}>
          GameHub
        </p>
        <p style={{
          fontSize: '0.62rem', color: 'rgba(34,211,238,0.7)',
          letterSpacing: '3px', marginTop: '5px', textTransform: 'uppercase',
        }}>
          RENT · PLAY · DISCOVER
        </p>

        {/* Línea divisoria */}
        <div style={{
          height: '1px',
          background: 'linear-gradient(90deg, transparent, rgba(34,211,238,0.5), rgba(88,28,135,0.5), transparent)',
          marginTop: '24px',
        }} />
      </div>

      {/* ── Nav items ── */}
      <nav aria-label="Menú principal" style={{ flex: 1, padding: '8px 0' }}>
        {items.map((item) => {
          const activo = pathname === item.href ||
            (item.href !== '/dashboard' && pathname.startsWith(item.href));
          return (
            <a key={item.href} href={item.href} style={{
              display: 'flex', alignItems: 'center', gap: '14px',
              padding: '15px 25px',
              color: activo ? '#22d3ee' : '#d1d5db',
              textDecoration: 'none',
              fontSize: '1rem',
              fontWeight: activo ? '600' : '400',
              background: activo ? 'rgba(34,211,238,0.12)' : 'transparent',
              borderLeft: activo ? '3px solid #22d3ee' : '3px solid transparent',
              transition: '0.3s ease',
              position: 'relative',
            }}
            onMouseEnter={e => {
              if (!activo) {
                (e.currentTarget as HTMLElement).style.background = 'rgba(255,255,255,0.07)';
                (e.currentTarget as HTMLElement).style.color = '#ffffff';
              }
            }}
            onMouseLeave={e => {
              if (!activo) {
                (e.currentTarget as HTMLElement).style.background = 'transparent';
                (e.currentTarget as HTMLElement).style.color = '#d1d5db';
              }
            }}>
              <span style={{ opacity: activo ? 1 : 0.75, flexShrink: 0 }} aria-hidden="true">
                {item.icon}
              </span>
              <span>{item.label}</span>
              {activo && (
                <span style={{
                  marginLeft: 'auto', width: '6px', height: '6px',
                  borderRadius: '50%', background: '#22d3ee',
                  boxShadow: '0 0 8px rgba(34,211,238,0.8)', flexShrink: 0,
                }} />
              )}
            </a>
          );
        })}
      </nav>

      {/* ── Footer usuario ── */}
      <div style={{ padding: '20px 16px 24px', borderTop: '1px solid rgba(255,255,255,0.07)' }}>
        {usuario && (
          <div style={{
            display: 'flex', alignItems: 'center', gap: '12px',
            padding: '12px 14px', marginBottom: '12px',
            background: 'rgba(255,255,255,0.05)',
            borderRadius: '12px',
            border: '1px solid rgba(255,255,255,0.08)',
          }}>
            {/* Avatar */}
            <div style={{
              width: '38px', height: '38px', borderRadius: '50%', flexShrink: 0,
              background: 'linear-gradient(135deg, #1e3a8a, #581c87)',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              fontSize: '14px', fontWeight: 'bold', color: '#fff',
              overflow: 'hidden',
              boxShadow: '0 0 10px rgba(34,211,238,0.2)',
              border: '1px solid rgba(34,211,238,0.3)',
            }}>
              {usuario.foto_url
                ? <img src={usuario.foto_url} alt={usuario.nombre}
                    style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                : usuario.nombre.charAt(0).toUpperCase()}
            </div>

            {/* Nombre y rol */}
            <div style={{ minWidth: 0 }}>
              <p style={{
                fontSize: '0.875rem', fontWeight: '600', color: '#fff',
                whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis',
              }}>
                {usuario.nombre} {usuario.apellido}
              </p>
              <p style={{ fontSize: '0.75rem', color: '#22d3ee', fontWeight: '500' }}>
                {usuario.rol === 'gerente' ? '👑 Gerente' : '👤 Empleado'}
              </p>
            </div>
          </div>
        )}

        {/* Botón cerrar sesión */}
        <button onClick={handleCerrarSesion} style={{
          width: '100%',
          display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px',
          padding: '12px',
          borderRadius: '10px',
          background: 'linear-gradient(135deg, #ef4444, #ec4899)',
          color: '#fff', fontWeight: 'bold', fontSize: '0.9rem',
          border: 'none', cursor: 'pointer',
          transition: '0.3s ease',
          boxShadow: '0 4px 15px rgba(239,68,68,0.3)',
        }}
        onMouseEnter={e => {
          (e.currentTarget as HTMLElement).style.transform = 'scale(1.02)';
          (e.currentTarget as HTMLElement).style.boxShadow = '0 6px 20px rgba(239,68,68,0.5)';
        }}
        onMouseLeave={e => {
          (e.currentTarget as HTMLElement).style.transform = 'scale(1)';
          (e.currentTarget as HTMLElement).style.boxShadow = '0 4px 15px rgba(239,68,68,0.3)';
        }}>
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"
            width="18" height="18" aria-hidden="true">
            <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4"/>
            <polyline points="16 17 21 12 16 7"/>
            <line x1="21" y1="12" x2="9" y2="12"/>
          </svg>
          Cerrar Sesión
        </button>
      </div>
    </aside>
  );
}
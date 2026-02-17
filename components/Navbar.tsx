'use client';

import { usePathname, useRouter } from 'next/navigation';
import { logout } from '@/lib/auth';
import { Usuario } from '@/lib/types';

const NAV_LINKS = [
  { href: '/dashboard',    label: 'Dashboard',         icon: '▣' },
  { href: '/rentas',       label: 'Renta de Consolas', icon: '⏱' },
  { href: '/consolas',     label: 'Consolas',          icon: '🎮' },
  { href: '/inventario',   label: 'Inventario',        icon: '📋' },
  { href: '/reparaciones', label: 'Reparación',        icon: '🔧' },
  { href: '/empleados',    label: 'Empleados',         icon: '👥', soloGerente: true },
  { href: '/ganancias',    label: 'Ganancias',         icon: '💰', soloGerente: true },
  { href: '/precios',      label: 'Precios',           icon: '⚙️', soloGerente: true },
];

export default function Navbar({ usuario }: { usuario: Usuario }) {
  const pathname = usePathname();
  const router = useRouter();
  const links = NAV_LINKS.filter(l => !l.soloGerente || usuario.rol === 'gerente');

  return (
    <nav
      className="fixed left-0 top-0 h-full flex flex-col z-40"
      style={{
        width: 'var(--navbar-width)',
        background: 'var(--grad-sidebar)',
        borderRight: '1px solid rgba(34,211,238,0.1)',
      }}
    >
      {/* ══ LOGO centrado grande ══ */}
      <div
        className="flex flex-col items-center justify-center py-8 px-4"
        style={{ borderBottom: '1px solid rgba(255,255,255,0.06)' }}
      >
        {/* Logo imagen grande */}
        <div
          className="rounded-2xl overflow-hidden mb-3"
          style={{
            width: '90px', height: '90px',
            boxShadow: '0 8px 30px rgba(34,211,238,0.3), 0 0 0 1px rgba(34,211,238,0.15)',
          }}
        >
          <img src="/logo.png" className="w-full h-full object-cover" alt="GameHub" />
        </div>
        <span
          className="text-lg font-black tracking-wide"
          style={{ color: 'var(--text-1)', fontFamily: "'Space Grotesk', sans-serif" }}
        >
          GameHub
        </span>
        <span className="text-xs mt-0.5 font-600" style={{ color: 'var(--cyan)' }}>
          Sistema de Renta
        </span>
      </div>

      {/* ══ LINKS de navegación ══ */}
      <div className="flex-1 overflow-y-auto py-4 px-3 space-y-1">
        {links.map((link) => {
          const esActivo = pathname === link.href;
          return (
            <a
              key={link.href}
              href={link.href}
              className="flex items-center gap-3 px-4 py-2.5 rounded-xl text-sm transition-all duration-200"
              style={{
                fontWeight: 700,
                background: esActivo
                  ? 'linear-gradient(135deg, rgba(34,211,238,0.15), rgba(99,102,241,0.1))'
                  : 'transparent',
                color: esActivo ? 'var(--cyan)' : 'var(--text-3)',
                borderLeft: esActivo ? '3px solid var(--cyan)' : '3px solid transparent',
                boxShadow: esActivo ? 'inset 0 0 20px rgba(34,211,238,0.05)' : 'none',
              }}
            >
              <span className="text-base w-5 text-center flex-shrink-0">{link.icon}</span>
              <span>{link.label}</span>
              {esActivo && (
                <span
                  className="ml-auto w-1.5 h-1.5 rounded-full flex-shrink-0"
                  style={{ background: 'var(--cyan)', boxShadow: '0 0 6px var(--cyan)' }}
                />
              )}
            </a>
          );
        })}
      </div>

      {/* ══ Usuario + Cerrar sesión ══ */}
      <div className="p-4" style={{ borderTop: '1px solid rgba(255,255,255,0.06)' }}>
        {/* Info usuario */}
        <div
          className="flex items-center gap-3 mb-3 p-3 rounded-xl"
          style={{ background: 'rgba(255,255,255,0.04)', border: '1px solid var(--border)' }}
        >
          <div
            className="w-9 h-9 rounded-full flex-shrink-0 flex items-center justify-center text-sm font-black overflow-hidden"
            style={{ background: 'var(--grad-brand)', boxShadow: '0 2px 8px rgba(99,102,241,0.4)' }}
          >
            {usuario.foto_url
              ? <img src={usuario.foto_url} alt={usuario.nombre} className="w-full h-full object-cover" />
              : <span className="text-white">{usuario.nombre.charAt(0).toUpperCase()}</span>}
          </div>
          <div className="overflow-hidden min-w-0">
            <p className="text-sm font-bold truncate" style={{ color: 'var(--text-1)' }}>
              {usuario.nombre} {usuario.apellido}
            </p>
            <p className="text-xs truncate" style={{ color: 'var(--cyan)', fontWeight: 600 }}>
              {usuario.rol === 'gerente' ? '👑 Gerente' : '👤 Empleado'}
            </p>
          </div>
        </div>

        {/* Botón cerrar sesión */}
        <button
          onClick={() => { logout(); router.push('/'); }}
          className="w-full flex items-center justify-center gap-2 py-2.5 rounded-xl text-sm font-bold transition-all duration-200"
          style={{
            background: 'var(--grad-danger)',
            color: '#fff',
            border: 'none',
            cursor: 'pointer',
            boxShadow: '0 3px 12px rgba(248,113,113,0.3)',
          }}
        >
          ↩ Cerrar Sesión
        </button>
      </div>
    </nav>
  );
}
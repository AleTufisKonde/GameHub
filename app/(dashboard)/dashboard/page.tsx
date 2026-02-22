'use client';

import { useEffect, useState } from 'react';
import { obtenerSesion } from '@/lib/auth';
import { Usuario } from '@/lib/types';

export default function DashboardPage() {
  const [usuario, setUsuario] = useState<Usuario | null>(null);
  useEffect(() => { setUsuario(obtenerSesion()); }, []);
  if (!usuario) return null;

  const esGerente = usuario.rol === 'gerente';

  const tarjetas = [
    { href: '/rentas',       titulo: 'Renta de Consolas', desc: 'Crea y gestiona rentas activas en tiempo real.',  color: 'var(--cyan)',   bg: 'rgba(34,211,238,0.1)',  borderColor: 'rgba(34,211,238,0.2)',  icon: '⏱' },
    { href: '/consolas',     titulo: 'Consolas',          desc: 'Catálogo completo y estado de tus consolas.',     color: 'var(--violet)', bg: 'rgba(129,140,248,0.1)', borderColor: 'rgba(129,140,248,0.2)', icon: '🎮' },
    { href: '/controles',    titulo: 'Controles',         desc: 'Gestiona los controles vinculados a consolas.',   color: 'var(--green)',  bg: 'rgba(52,211,153,0.1)',  borderColor: 'rgba(52,211,153,0.2)',  icon: '🕹️' },
    { href: '/inventario',   titulo: 'Inventario',        desc: 'Vista general agrupada del inventario.',          color: 'var(--cyan)',   bg: 'rgba(34,211,238,0.1)',  borderColor: 'rgba(34,211,238,0.2)',  icon: '📋' },
    { href: '/reparaciones', titulo: 'Reparación',        desc: 'Equipos en proceso de reparación activa.',       color: 'var(--yellow)', bg: 'rgba(251,191,36,0.1)',  borderColor: 'rgba(251,191,36,0.2)',  icon: '🔧' },
    ...(esGerente ? [
      { href: '/empleados', titulo: 'Empleados',  desc: 'Gestiona los usuarios del sistema.',          color: 'var(--pink)',   bg: 'rgba(244,114,182,0.1)', borderColor: 'rgba(244,114,182,0.2)', icon: '👥' },
      { href: '/ganancias', titulo: 'Ganancias',  desc: 'Reportes de ingresos por día, semana o mes.', color: 'var(--orange)', bg: 'rgba(251,146,60,0.1)',  borderColor: 'rgba(251,146,60,0.2)',  icon: '💰' },
      { href: '/precios',   titulo: 'Precios',    desc: 'Configura tarifas por hora y control extra.', color: '#a78bfa',       bg: 'rgba(167,139,250,0.1)', borderColor: 'rgba(167,139,250,0.2)', icon: '⚙️' },
    ] : []),
  ];
  
  return (
    <div style={{ maxWidth: '920px', margin: '0 auto' }}>

      <div className="card mb-6 flex items-center gap-5" style={{ background: 'linear-gradient(135deg, rgba(99,102,241,0.2) 0%, rgba(34,211,238,0.1) 100%)', border: '1px solid rgba(34,211,238,0.15)' }}>
        <div className="flex-shrink-0 rounded-2xl overflow-hidden flex items-center justify-center font-black text-xl" style={{ width: '64px', height: '64px', background: 'var(--grad-brand)', boxShadow: '0 6px 20px rgba(99,102,241,0.5)' }}>
          {usuario.foto_url
            ? <img src={usuario.foto_url} alt={usuario.nombre} className="w-full h-full object-cover" />
            : <span className="text-white">{usuario.nombre.charAt(0).toUpperCase()}</span>}
        </div>
        <div>
          <h1 className="text-xl font-black" style={{ color: 'var(--text-1)' }}>
            {'¡Hola, Bienvenido '}
            <span style={{ color: 'var(--cyan)' }}>{usuario.nombre} {usuario.apellido}</span>
            {' '}
            <span style={{ color: 'var(--text-3)', fontSize: '14px', fontWeight: 600 }}>({usuario.rol === 'gerente' ? 'Gerente' : 'Empleado'})</span>
            {'!'}
          </h1>
          <p className="text-sm mt-1" style={{ color: 'var(--text-3)' }}>
            {new Date().toLocaleDateString('es-MX', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}
          </p>
        </div>
      </div>

      <div className="card mb-6">
        <h2 className="text-lg font-black mb-1" style={{ color: 'var(--cyan)' }}>Dashboard</h2>
        <p className="text-sm" style={{ color: 'var(--text-3)', lineHeight: 1.7 }}>
          Bienvenido al panel de control de GameHub. Aquí podrás gestionar todas las operaciones del sistema.
        </p>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(260px, 1fr))', gap: '16px' }}>
        {tarjetas.map((t) => (
          <a key={t.href} href={t.href} className="card flex items-start gap-4 cursor-pointer transition-all duration-200 no-underline" style={{ border: `1px solid ${t.borderColor}` }}
            onMouseEnter={e => { (e.currentTarget as HTMLElement).style.transform = 'translateY(-3px)'; (e.currentTarget as HTMLElement).style.boxShadow = `0 12px 30px ${t.borderColor}`; }}
            onMouseLeave={e => { (e.currentTarget as HTMLElement).style.transform = ''; (e.currentTarget as HTMLElement).style.boxShadow = ''; }}>
            <div className="flex-shrink-0 rounded-xl flex items-center justify-center text-xl" style={{ width: '48px', height: '48px', background: t.bg, border: `1px solid ${t.borderColor}` }}>
              {t.icon}
            </div>
            <div>
              <h3 className="font-black text-sm" style={{ color: t.color }}>{t.titulo}</h3>
              <p className="text-xs mt-1" style={{ color: 'var(--text-3)', lineHeight: 1.6 }}>{t.desc}</p>
            </div>
          </a>
        ))}
      </div>
    </div>
  );
}
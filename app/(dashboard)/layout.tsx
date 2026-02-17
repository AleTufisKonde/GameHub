'use client';

import { useEffect, useState } from 'react';
import { useRouter, usePathname } from 'next/navigation';
import { obtenerSesion } from '@/lib/auth';
import { Usuario } from '@/lib/types';
import dynamic from 'next/dynamic';

const Navbar = dynamic(() => import('@/components/Navbar'), { ssr: false });

const RUTAS_GERENTE = ['/empleados', '/ganancias', '/precios'];

export default function DashboardLayout({ children }: { children: React.ReactNode }) {
  const router = useRouter();
  const pathname = usePathname();
  const [usuario, setUsuario] = useState<Usuario | null>(null);
  const [verificando, setVerificando] = useState(true);

  useEffect(() => {
    const sesion = obtenerSesion();
    if (!sesion) { router.replace('/'); return; }
    const esRutaGerente = RUTAS_GERENTE.some((ruta) => pathname.startsWith(ruta));
    if (esRutaGerente && sesion.rol !== 'gerente') { router.replace('/dashboard'); return; }
    setUsuario(sesion as Usuario);
    setVerificando(false);
  }, [pathname, router]);

  if (verificando || !usuario) {
    return (
      <div className="min-h-screen flex items-center justify-center" style={{ backgroundColor: 'var(--color-primary)' }}>
        <div className="text-center">
          <div className="w-10 h-10 rounded-full border-2 animate-spin mx-auto mb-4"
            style={{ borderColor: 'var(--color-accent)', borderTopColor: 'transparent' }} />
          <p style={{ color: 'var(--color-text-muted)' }}>Cargando...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen" style={{ backgroundColor: 'var(--color-secondary)' }}>
      <Navbar usuario={usuario} />
      <main className="min-h-screen p-8" style={{ marginLeft: 'var(--navbar-width)' }}>
        {children}
      </main>
    </div>
  );
}
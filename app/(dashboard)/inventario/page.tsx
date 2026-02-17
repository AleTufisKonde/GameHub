'use client';

import { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/lib/supabase';
import { Consola } from '@/lib/types';

export default function InventarioPage() {
  const [consolas, setConsolas] = useState<Consola[]>([]);
  const [cargando, setCargando] = useState(true);

  const cargarConsolas = useCallback(async () => {
    setCargando(true);
    const { data, error } = await supabase.from('consola').select('*');
    if (error) console.error('Error cargando inventario:', error);
    if (data) setConsolas(data as Consola[]);
    setCargando(false);
  }, []);

  useEffect(() => { cargarConsolas(); }, [cargarConsolas]);

  const resumen = (() => {
    const mapa = new Map<string, { marca: string; modelo: string; total: number; disponibles: number; rentadas: number; reparacion: number; controles: number }>();
    consolas.forEach((c) => {
      const clave = `${c.marca}|${c.modelo}`;
      const ex = mapa.get(clave);
      if (ex) {
        ex.total++;
        if (c.estado === 'disponible') ex.disponibles++;
        if (c.estado === 'rentada') ex.rentadas++;
        if (c.estado === 'reparacion' || c.estado === 'mantenimiento') ex.reparacion++;
      } else {
        mapa.set(clave, {
          marca: c.marca, modelo: c.modelo, total: 1,
          disponibles: c.estado === 'disponible' ? 1 : 0,
          rentadas: c.estado === 'rentada' ? 1 : 0,
          reparacion: (c.estado === 'reparacion' || c.estado === 'mantenimiento') ? 1 : 0,
          controles: c.controles_incluidos,
        });
      }
    });
    return Array.from(mapa.values()).sort((a, b) => a.marca.localeCompare(b.marca));
  })();

  const totalDisponibles = consolas.filter((c) => c.estado === 'disponible').length;
  const totalRentadas = consolas.filter((c) => c.estado === 'rentada').length;
  const totalReparacion = consolas.filter((c) => c.estado === 'reparacion' || c.estado === 'mantenimiento').length;

  return (
    <div className="max-w-5xl mx-auto">
      <div className="mb-8">
        <h1 className="text-2xl font-bold text-white">📋 Inventario</h1>
        <p className="mt-1 text-sm" style={{ color: 'var(--color-text-muted)' }}>
          Vista general del inventario agrupado por tipo de consola.
        </p>
      </div>

      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 mb-8">
        {[
          { label: 'Total Consolas', valor: consolas.length, color: 'var(--color-accent)' },
          { label: 'Disponibles', valor: totalDisponibles, color: 'var(--color-success)' },
          { label: 'Rentadas', valor: totalRentadas, color: 'var(--color-warning)' },
          { label: 'En Reparación', valor: totalReparacion, color: 'var(--color-danger)' },
        ].map((item) => (
          <div key={item.label} className="card text-center">
            <p className="text-3xl font-bold mb-1" style={{ color: item.color }}>{item.valor}</p>
            <p className="text-xs" style={{ color: 'var(--color-text-muted)' }}>{item.label}</p>
          </div>
        ))}
      </div>

      <div className="card p-0 overflow-hidden">
        <div className="px-6 py-4" style={{ borderBottom: '1px solid rgba(148,163,184,0.1)' }}>
          <h2 className="text-base font-semibold text-white">Consolas por Modelo</h2>
        </div>
        {cargando ? (
          <div className="p-8 text-center" style={{ color: 'var(--color-text-muted)' }}>Cargando...</div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr>
                  <th className="table-header">Marca / Modelo</th>
                  <th className="table-header text-center">Total</th>
                  <th className="table-header text-center">Disponibles</th>
                  <th className="table-header text-center">Rentadas</th>
                  <th className="table-header text-center">Reparación</th>
                  <th className="table-header text-center">Controles c/u</th>
                </tr>
              </thead>
              <tbody>
                {resumen.map((r) => (
                  <tr key={`${r.marca}-${r.modelo}`}>
                    <td className="table-cell font-semibold text-white">{r.marca} {r.modelo}</td>
                    <td className="table-cell text-center font-bold" style={{ color: 'var(--color-accent)' }}>{r.total}</td>
                    <td className="table-cell text-center" style={{ color: 'var(--color-success)' }}>{r.disponibles}</td>
                    <td className="table-cell text-center" style={{ color: 'var(--color-warning)' }}>{r.rentadas}</td>
                    <td className="table-cell text-center" style={{ color: 'var(--color-danger)' }}>{r.reparacion}</td>
                    <td className="table-cell text-center">{r.controles}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}
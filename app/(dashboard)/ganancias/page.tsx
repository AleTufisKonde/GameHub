'use client';

import { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/lib/supabase';
import { RentaConDetalle } from '@/lib/types';

type Filtro = 'dia' | 'semana' | 'mes';

interface GananciaPorDia {
  fecha: string;
  total: number;
  rentas: RentaConDetalle[];
}

export default function GananciasPage() {
  const [filtro, setFiltro] = useState<Filtro>('dia');
  const [rentas, setRentas] = useState<RentaConDetalle[]>([]);
  const [cargando, setCargando] = useState(true);
  const [desgloseAbierto, setDesgloseAbierto] = useState<GananciaPorDia | null>(null);

  const obtenerFechaInicio = (f: Filtro): string => {
    const fecha = new Date();
    if (f === 'dia') fecha.setHours(0, 0, 0, 0);
    else if (f === 'semana') fecha.setDate(fecha.getDate() - 7);
    else fecha.setDate(fecha.getDate() - 30);
    return fecha.toISOString();
  };

  const cargarRentas = useCallback(async () => {
    setCargando(true);
    const { data, error } = await supabase
      .from('renta')
      .select(`
        *,
        detalle:detalle_renta(
          *,
          consola:id_consola(nombre, marca, modelo)
        )
      `)
      .eq('estado', 'finalizada')
      .gte('fecha_finalizacion', obtenerFechaInicio(filtro))
      .order('fecha_finalizacion', { ascending: false });

    if (error) console.error('Error cargando ganancias:', error);
    if (data) {
      const rentasFlat = data.map((r: any) => ({
        ...r,
        detalle: Array.isArray(r.detalle) ? r.detalle[0] || null : r.detalle,
      }));
      setRentas(rentasFlat as RentaConDetalle[]);
    }
    setCargando(false);
  }, [filtro]);

  useEffect(() => { cargarRentas(); }, [cargarRentas]);

  const gananciasAgrupadas: GananciaPorDia[] = (() => {
    const mapa = new Map<string, GananciaPorDia>();
    rentas.forEach((r) => {
      const fechaRef = r.fecha_finalizacion || r.fecha_creacion;
      if (!fechaRef) return;
      const fecha = new Date(fechaRef).toLocaleDateString('es-MX', { day: '2-digit', month: 'long', year: 'numeric' });
      const total = r.total_final || 0;
      if (mapa.has(fecha)) {
        const e = mapa.get(fecha)!;
        e.total += total;
        e.rentas.push(r);
      } else {
        mapa.set(fecha, { fecha, total, rentas: [r] });
      }
    });
    return Array.from(mapa.values());
  })();

  const totalGeneral = gananciasAgrupadas.reduce((sum, g) => sum + g.total, 0);

  return (
    <div className="max-w-4xl mx-auto">
      <div className="mb-8">
        <h1 className="text-2xl font-bold text-white">💰 Ganancias</h1>
        <p className="mt-1 text-sm" style={{ color: 'var(--color-text-muted)' }}>
          Consulta el historial de ingresos con desglose detallado por día.
        </p>
      </div>

      <div className="flex gap-3 mb-6">
        {(['dia', 'semana', 'mes'] as Filtro[]).map((f) => (
          <button key={f} className={filtro === f ? 'btn-primary' : 'btn-outline'} onClick={() => setFiltro(f)}>
            {f === 'dia' ? 'Hoy' : f === 'semana' ? 'Esta Semana' : 'Este Mes'}
          </button>
        ))}
      </div>

      <div className="card mb-6 flex items-center justify-between">
        <div>
          <p className="text-sm" style={{ color: 'var(--color-text-muted)' }}>Total del período</p>
          <p className="text-3xl font-bold mt-1" style={{ color: 'var(--color-success)' }}>${totalGeneral.toFixed(2)}</p>
        </div>
        <div className="text-4xl">💰</div>
      </div>

      <div className="card p-0 overflow-hidden">
        <div className="px-6 py-4" style={{ borderBottom: '1px solid rgba(148,163,184,0.1)' }}>
          <h2 className="text-base font-semibold text-white">Desglose por Día</h2>
        </div>
        {cargando ? (
          <div className="p-12 text-center" style={{ color: 'var(--color-text-muted)' }}>Cargando...</div>
        ) : gananciasAgrupadas.length === 0 ? (
          <div className="p-12 text-center" style={{ color: 'var(--color-text-muted)' }}>No hay ganancias en este período.</div>
        ) : (
          <table className="w-full">
            <thead>
              <tr>
                <th className="table-header">Fecha</th>
                <th className="table-header text-center">N° Rentas</th>
                <th className="table-header text-right">Total</th>
                <th className="table-header text-center">Desglose</th>
              </tr>
            </thead>
            <tbody>
              {gananciasAgrupadas.map((g) => (
                <tr key={g.fecha}>
                  <td className="table-cell font-medium text-white">{g.fecha}</td>
                  <td className="table-cell text-center">{g.rentas.length}</td>
                  <td className="table-cell text-right font-semibold" style={{ color: 'var(--color-success)' }}>${g.total.toFixed(2)}</td>
                  <td className="table-cell text-center">
                    <button className="text-xs px-3 py-1.5 rounded-lg font-medium"
                      style={{ backgroundColor: 'rgba(108,99,255,0.15)', color: 'var(--color-accent)' }}
                      onClick={() => setDesgloseAbierto(g)}>Ver Desglose</button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>

      {desgloseAbierto && (
        <div className="modal-overlay" onClick={() => setDesgloseAbierto(null)}>
          <div className="modal-container max-w-lg" onClick={(e) => e.stopPropagation()}>
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-xl font-bold text-white">📋 {desgloseAbierto.fecha}</h2>
              <button onClick={() => setDesgloseAbierto(null)} className="text-gray-400 hover:text-white text-2xl">×</button>
            </div>
            <div className="rounded-xl p-4 font-mono text-sm space-y-3"
              style={{ backgroundColor: 'var(--color-primary)', border: '2px dashed rgba(108,99,255,0.3)' }}>
              <p className="text-center font-bold text-white">🎮 GAMEHUB – REPORTE</p>
              <p style={{ color: 'var(--color-text-muted)' }}>──────────────────────────</p>
              {desgloseAbierto.rentas.map((r) => (
                <div key={r.id_renta} className="space-y-1 pb-3" style={{ borderBottom: '1px dashed rgba(148,163,184,0.2)' }}>
                  <div className="flex justify-between">
                    <span style={{ color: 'var(--color-text-muted)' }}>Folio:</span>
                    <span className="text-white">{r.folio || `#${r.id_renta}`}</span>
                  </div>
                  <div className="flex justify-between">
                    <span style={{ color: 'var(--color-text-muted)' }}>Consola:</span>
                    <span className="text-white">
                      {r.detalle?.consola ? `${r.detalle.consola.marca} ${r.detalle.consola.modelo}` : '—'}
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span style={{ color: 'var(--color-text-muted)' }}>Duración:</span>
                    <span className="text-white">{r.minutos_totales_uso || 0} min</span>
                  </div>
                  <div className="flex justify-between font-bold">
                    <span style={{ color: 'var(--color-text-muted)' }}>Total:</span>
                    <span style={{ color: 'var(--color-accent)' }}>${(r.total_final || 0).toFixed(2)}</span>
                  </div>
                </div>
              ))}
              <div className="flex justify-between text-lg font-bold" style={{ color: 'var(--color-success)' }}>
                <span>TOTAL:</span>
                <span>${desgloseAbierto.total.toFixed(2)}</span>
              </div>
            </div>
            <button className="btn-outline w-full mt-4" onClick={() => setDesgloseAbierto(null)}>← Cerrar</button>
          </div>
        </div>
      )}
    </div>
  );
}
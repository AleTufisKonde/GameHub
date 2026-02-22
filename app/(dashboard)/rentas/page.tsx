'use client';

import { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/lib/supabase';
import { obtenerSesion } from '@/lib/auth';
import { RentaConDetalle } from '@/lib/types';
import NuevaRentaModal from '@/components/modals/NuevaRentaModal';
import FinalizarRentaModal from '@/components/modals/FinalizarRentaModal';
import PageHeader from '@/components/PageHeader';

function formatearTiempo(ms: number): string {
  const totalSegundos = Math.floor(ms / 1000);
  const horas = Math.floor(totalSegundos / 3600);
  const minutos = Math.floor((totalSegundos % 3600) / 60);
  const segundos = totalSegundos % 60;
  return [horas, minutos, segundos].map((n) => String(n).padStart(2, '0')).join(':');
}

export default function RentasPage() {
  const sesion = obtenerSesion();
  const [rentas, setRentas] = useState<RentaConDetalle[]>([]);
  const [cargando, setCargando] = useState(true);
  const [mostrarNueva, setMostrarNueva] = useState(false);
  const [rentaAFinalizar, setRentaAFinalizar] = useState<RentaConDetalle | null>(null);
  const [tiempoActual, setTiempoActual] = useState(Date.now());

  useEffect(() => {
    const intervalo = setInterval(() => setTiempoActual(Date.now()), 1000);
    return () => clearInterval(intervalo);
  }, []);

  const cargarRentas = useCallback(async () => {
    setCargando(true);
    const { data, error } = await supabase
      .from('renta')
      .select(`
        *,
        detalle:detalle_renta(
          *,
          consola:id_consola(id_consola, nombre, marca, modelo, controles_incluidos)
        )
      `)
      .eq('estado', 'activa')
      .order('fecha_creacion', { ascending: false });

    if (error) console.error('Error cargando rentas:', error);
    if (data) {
      const rentasFlat = data.map((r: any) => ({
        ...r,
        detalle: Array.isArray(r.detalle) ? r.detalle[0] || null : r.detalle,
      }));
      setRentas(rentasFlat as RentaConDetalle[]);
    }
    setCargando(false);
  }, []);

  useEffect(() => { cargarRentas(); }, [cargarRentas]);

  return (
    <div className="max-w-7xl mx-auto">
      <PageHeader titulo="⏱ Rentas" descripcion="Gestiona las rentas activas en tiempo real." />


      <div className="mb-6">
        <button className="btn-primary" onClick={() => setMostrarNueva(true)}>+ Nueva Renta</button>
      </div>

      <div className="card p-0 overflow-hidden">
        <div className="px-6 py-4" style={{ borderBottom: '1px solid rgba(148,163,184,0.1)' }}>
          <h2 className="text-base font-semibold text-white">Rentas Activas ({rentas.length})</h2>
        </div>
        {cargando ? (
          <div className="p-12 text-center" style={{ color: 'var(--color-text-muted)' }}>Cargando rentas...</div>
        ) : rentas.length === 0 ? (
          <div className="p-12 text-center" style={{ color: 'var(--color-text-muted)' }}>No hay rentas activas en este momento.</div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr>
                  <th className="table-header">Consola</th>
                  <th className="table-header">Folio</th>
                  <th className="table-header">Cubículo</th>
                  <th className="table-header">Controles Extra</th>
                  <th className="table-header">Precio/Hora</th>
                  <th className="table-header">Observaciones</th>
                  <th className="table-header">⏱ Tiempo</th>
                  <th className="table-header">Acciones</th>
                </tr>
              </thead>
              <tbody>
                {rentas.map((renta) => {
                  const inicioMs = renta.fecha_creacion
                    ? new Date(renta.fecha_creacion).getTime()
                    : Date.now();
                  const tiempoMs = tiempoActual - inicioMs;
                  return (
                    <tr key={renta.id_renta}>
                      <td className="table-cell font-medium">
                        {renta.detalle?.consola
                          ? `${renta.detalle.consola.marca} ${renta.detalle.consola.modelo}`
                          : '—'}
                      </td>
                      <td className="table-cell font-mono text-xs">{renta.folio || `#${renta.id_renta}`}</td>
                      <td className="table-cell">{renta.numero_cubiculo || '—'}</td>
                      <td className="table-cell text-center">{renta.detalle?.cantidad_controles_extra ?? 0}</td>
                      <td className="table-cell">${renta.detalle?.precio_hora_aplicado?.toFixed(2) ?? '—'}</td>
                      <td className="table-cell max-w-[150px] truncate">
                        {renta.observaciones || <span style={{ color: 'var(--color-text-muted)' }}>—</span>}
                      </td>
                      <td className="table-cell font-mono">
                        <span style={{ color: 'var(--color-accent)' }}>{formatearTiempo(tiempoMs)}</span>
                      </td>
                      <td className="table-cell">
                        <button className="btn-danger text-xs px-3 py-1.5"
                          onClick={() => setRentaAFinalizar(renta)}>
                          Finalizar
                        </button>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {mostrarNueva && sesion && (
        <NuevaRentaModal
          onClose={() => setMostrarNueva(false)}
          onSuccess={() => { setMostrarNueva(false); cargarRentas(); }}
          idEmpleado={sesion.id_usuario}
        />
      )}
      {rentaAFinalizar && (
        <FinalizarRentaModal
          renta={rentaAFinalizar}
          onClose={() => setRentaAFinalizar(null)}
          onSuccess={() => { setRentaAFinalizar(null); cargarRentas(); }}
        />
      )}
    </div>
  );
}
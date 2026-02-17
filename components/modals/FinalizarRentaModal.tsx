'use client';

import { useState, useEffect } from 'react';
import { supabase } from '@/lib/supabase';
import { Precio, RentaConDetalle } from '@/lib/types';

interface Props { renta: RentaConDetalle; onClose: () => void; onSuccess: () => void; }

export default function FinalizarRentaModal({ renta, onClose, onSuccess }: Props) {
  const [precios, setPrecios] = useState<Precio | null>(null);
  const [cargando, setCargando] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    supabase
      .from('configuracion_precios_global')
      .select('*').eq('activo', true)
      .order('fecha_vigencia_inicio', { ascending: false })
      .limit(1).single()
      .then(({ data }) => { if (data) setPrecios(data as Precio); });
  }, []);

  const ahora = new Date();
  const inicioMs = renta.fecha_creacion ? new Date(renta.fecha_creacion).getTime() : Date.now();
  const minutosTotales = Math.max(1, Math.ceil((ahora.getTime() - inicioMs) / 60000));
  const horas = Math.floor(minutosTotales / 60);
  const minutos = minutosTotales % 60;

  const precioHora = renta.detalle?.precio_hora_aplicado || precios?.precio_hora || 0;
  const costoTiempo = precioHora * (minutosTotales / 60);
  const controlesExtra = renta.detalle?.cantidad_controles_extra || 0;
  const precioControlExtra = renta.detalle?.precio_control_extra_aplicado || precios?.precio_control_extra || 0;
  const costoControles = controlesExtra * precioControlExtra;
  const totalFinal = costoTiempo + costoControles;

  const handleFinalizar = async () => {
    setCargando(true); setError('');
    try {
      const horaFin = new Date();

      const { error: e1 } = await supabase.from('renta').update({
        estado: 'finalizada',
        hora_fin: horaFin.toTimeString().slice(0, 8),
        minutos_totales_uso: minutosTotales,
        total_base: parseFloat(costoTiempo.toFixed(2)),
        total_final: parseFloat(totalFinal.toFixed(2)),
        fecha_finalizacion: horaFin.toISOString(),
      }).eq('id_renta', renta.id_renta);
      if (e1) throw new Error(e1.message);

      if (renta.detalle) {
        await supabase.from('detalle_renta')
          .update({ subtotal: parseFloat(totalFinal.toFixed(2)) })
          .eq('id_detalle', renta.detalle.id_detalle);

        await supabase.from('consola')
          .update({ estado: 'disponible' })
          .eq('id_consola', renta.detalle.id_consola);
      }
      onSuccess();
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Error al finalizar');
    } finally { setCargando(false); }
  };

  const nombreConsola = renta.detalle?.consola
    ? `${renta.detalle.consola.marca} ${renta.detalle.consola.modelo}`
    : '—';

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-container" onClick={(e) => e.stopPropagation()}>
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-xl font-bold text-white">Finalizar Renta</h2>
          <button onClick={onClose} className="text-gray-400 hover:text-white text-2xl">×</button>
        </div>

        <div className="rounded-xl p-5 font-mono text-sm mb-6"
          style={{ backgroundColor: 'var(--color-primary)', border: '2px dashed rgba(108,99,255,0.4)' }}>
          <div className="text-center mb-4">
            <p className="text-lg font-bold text-white">🎮 GAMEHUB</p>
            <p className="text-xs" style={{ color: 'var(--color-text-muted)' }}>Sistema de Renta de Consolas</p>
            <p className="text-xs mt-1" style={{ color: 'var(--color-text-muted)' }}>─────────────────────</p>
          </div>
          <div className="space-y-2 mb-4">
            <div className="flex justify-between">
              <span style={{ color: 'var(--color-text-muted)' }}>Folio:</span>
              <span className="text-white">{renta.folio || `#${renta.id_renta}`}</span>
            </div>
            <div className="flex justify-between">
              <span style={{ color: 'var(--color-text-muted)' }}>Consola:</span>
              <span className="text-white">{nombreConsola}</span>
            </div>
            <div className="flex justify-between">
              <span style={{ color: 'var(--color-text-muted)' }}>Inicio:</span>
              <span className="text-white">
                {new Date(renta.fecha_creacion || Date.now()).toLocaleTimeString('es-MX')}
              </span>
            </div>
            <div className="flex justify-between">
              <span style={{ color: 'var(--color-text-muted)' }}>Fin:</span>
              <span className="text-white">{ahora.toLocaleTimeString('es-MX')}</span>
            </div>
          </div>
          <p style={{ color: 'var(--color-text-muted)' }}>─────────────────────</p>
          <div className="space-y-2 my-4">
            <div className="flex justify-between">
              <span style={{ color: 'var(--color-text-muted)' }}>Tiempo ({horas}h {minutos}min):</span>
              <span className="text-white">${costoTiempo.toFixed(2)}</span>
            </div>
            <div className="flex justify-between">
              <span style={{ color: 'var(--color-text-muted)' }}>Precio/hora:</span>
              <span className="text-white">${precioHora.toFixed(2)}</span>
            </div>
            {controlesExtra > 0 && (
              <div className="flex justify-between">
                <span style={{ color: 'var(--color-warning)' }}>
                  Controles extra ({controlesExtra} × ${precioControlExtra}):
                </span>
                <span style={{ color: 'var(--color-warning)' }}>+${costoControles.toFixed(2)}</span>
              </div>
            )}
          </div>
          <p style={{ color: 'var(--color-text-muted)' }}>─────────────────────</p>
          <div className="flex justify-between mt-4 text-lg font-bold" style={{ color: 'var(--color-accent)' }}>
            <span>TOTAL A COBRAR:</span>
            <span>${totalFinal.toFixed(2)}</span>
          </div>
          <p className="text-center text-xs mt-3" style={{ color: 'var(--color-text-muted)' }}>¡Gracias por su visita!</p>
        </div>

        {error && <p className="text-sm text-center mb-4" style={{ color: 'var(--color-danger)' }}>{error}</p>}
        <div className="flex gap-3">
          <button onClick={onClose} className="btn-outline flex-1">Cancelar</button>
          <button onClick={handleFinalizar} className="btn-primary flex-1" disabled={cargando}>
            {cargando ? 'Finalizando...' : '✅ Finalizar y Cobrar'}
          </button>
        </div>
      </div>
    </div>
  );
}
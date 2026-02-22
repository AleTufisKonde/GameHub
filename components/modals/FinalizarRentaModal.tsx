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
      .limit(1)
      .then(({ data }) => { if (data && data.length > 0) setPrecios(data[0] as Precio); });
  }, []);

  const ahora = new Date();
  const inicioMs = renta.fecha_creacion ? new Date(renta.fecha_creacion).getTime() : Date.now();
  const minutosTotales = Math.max(1, Math.ceil((ahora.getTime() - inicioMs) / 60000));
  const horas = Math.floor(minutosTotales / 60);
  const minutos = minutosTotales % 60;

  const precioHora = renta.detalle?.precio_hora_aplicado || precios?.precio_hora || 0;
  const controlesExtra = renta.detalle?.cantidad_controles_extra || 0;
  const precioControlExtra = renta.detalle?.precio_control_extra_aplicado || precios?.precio_control_extra || 0;

  // ── Misma lógica que el trigger de la BD ──
  const calcularCostoTiempo = (mins: number, phora: number): number => {
    const horasEnteras = Math.floor(mins / 60);
    const minutosRestantes = mins % 60;
    let total = horasEnteras * phora;
    if (minutosRestantes >= 36) {
      total += phora;         // 36-60 min = hora completa
    } else if (minutosRestantes >= 1) {
      total += phora / 2;     // 1-35 min = 50%
    }
    return total;
  };

  const costoTiempo = calcularCostoTiempo(minutosTotales, precioHora);
  const costoControles = controlesExtra * precioControlExtra;
  const totalEstimado = parseFloat((costoTiempo + costoControles).toFixed(2));

  // Etiqueta de fracción de hora
  const etiquetaFraccion = () => {
    const minutosRestantes = minutosTotales % 60;
    if (minutosRestantes === 0) return null;
    if (minutosRestantes >= 36) return `(${minutosRestantes}min → hora completa)`;
    return `(${minutosRestantes}min → 50%)`;
  };

  const handleFinalizar = async () => {
    setCargando(true); setError('');
    try {
      const horaFin = new Date();

      // Solo enviamos estado y hora_fin — el trigger calcula total_base, total_final etc.
      const { error: e1 } = await supabase
        .from('renta')
        .update({
          estado: 'finalizada',
          hora_fin: horaFin.toTimeString().slice(0, 8),
        })
        .eq('id_renta', renta.id_renta);
      if (e1) throw new Error(e1.message);

      // Liberar controles rentados vinculados a la consola
      if (renta.detalle?.id_consola) {
        const { data: controlesRentados } = await supabase
          .from('control')
          .select('id_control')
          .eq('id_consola', renta.detalle.id_consola)
          .eq('estado', 'rentado');

        if (controlesRentados && controlesRentados.length > 0) {
          const ids = controlesRentados.map((c: { id_control: number }) => c.id_control);
          await supabase
            .from('control')
            .update({ estado: 'disponible' })
            .in('id_control', ids);
        }
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
          <h2 className="text-xl font-bold" style={{ color: 'var(--text-1)' }}>
            ✅ Finalizar Renta
          </h2>
          <button onClick={onClose}
            style={{ color: 'var(--text-3)', background: 'none', border: 'none', fontSize: '24px', cursor: 'pointer' }}>×</button>
        </div>

        {/* Ticket */}
        <div className="ticket mb-6">
          <p className="font-bold text-center mb-4" style={{ color: 'var(--cyan)', fontSize: '15px' }}>
            🎮 GAMEHUB — TICKET
          </p>
          <hr className="ticket-divider" />

          <div className="space-y-1 my-3">
            <div className="ticket-row">
              <span style={{ color: 'var(--text-3)' }}>Folio:</span>
              <span style={{ color: 'var(--text-1)' }}>{renta.folio || `#${renta.id_renta}`}</span>
            </div>
            <div className="ticket-row">
              <span style={{ color: 'var(--text-3)' }}>Consola:</span>
              <span style={{ color: 'var(--text-1)' }}>{nombreConsola}</span>
            </div>
            <div className="ticket-row">
              <span style={{ color: 'var(--text-3)' }}>Cubículo:</span>
              <span style={{ color: 'var(--text-1)' }}>{renta.numero_cubiculo || '—'}</span>
            </div>
            <div className="ticket-row">
              <span style={{ color: 'var(--text-3)' }}>Inicio:</span>
              <span style={{ color: 'var(--text-1)' }}>
                {new Date(renta.fecha_creacion || Date.now()).toLocaleTimeString('es-MX')}
              </span>
            </div>
            <div className="ticket-row">
              <span style={{ color: 'var(--text-3)' }}>Fin:</span>
              <span style={{ color: 'var(--text-1)' }}>{ahora.toLocaleTimeString('es-MX')}</span>
            </div>
          </div>

          <hr className="ticket-divider" />

          <div className="space-y-1 my-3">
            <div className="ticket-row">
              <span style={{ color: 'var(--text-3)' }}>
                Tiempo ({horas}h {minutos}min):
              </span>
              <span style={{ color: 'var(--text-1)' }}>${costoTiempo.toFixed(2)}</span>
            </div>
            {etiquetaFraccion() && (
              <div className="ticket-row">
                <span style={{ color: 'var(--text-3)', fontSize: '11px' }}>{etiquetaFraccion()}</span>
                <span style={{ color: 'var(--text-3)', fontSize: '11px' }}>Precio/hora: ${precioHora.toFixed(2)}</span>
              </div>
            )}
            {controlesExtra > 0 && (
              <div className="ticket-row">
                <span style={{ color: 'var(--yellow)' }}>
                  Controles extra ({controlesExtra} × ${precioControlExtra}):
                </span>
                <span style={{ color: 'var(--yellow)' }}>+${costoControles.toFixed(2)}</span>
              </div>
            )}
          </div>

          <hr className="ticket-divider" />

          <div className="ticket-row mt-3">
            <span className="font-bold text-base" style={{ color: 'var(--text-1)' }}>
              TOTAL A COBRAR:
            </span>
            <span className="ticket-total">${totalEstimado.toFixed(2)}</span>
          </div>

          <p className="text-center text-xs mt-3" style={{ color: 'var(--text-3)' }}>
            ¡Gracias por su visita!
          </p>
        </div>

        {/* Aviso */}
        <div className="px-4 py-3 rounded-xl text-sm mb-4"
          style={{ background: 'rgba(34,211,238,0.06)', color: 'var(--cyan)', border: '1px solid var(--border-cyan)' }}>
          ℹ️ Al finalizar, la consola y sus controles volverán a estar <strong>disponibles</strong> automáticamente.
        </div>

        {error && (
          <div className="px-4 py-3 rounded-xl text-sm font-bold mb-4"
            style={{ background: 'rgba(248,113,113,0.1)', color: 'var(--red)', border: '1px solid rgba(248,113,113,0.2)' }}>
            ⚠️ {error}
          </div>
        )}

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
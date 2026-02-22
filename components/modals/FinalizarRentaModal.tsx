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

  const calcularCostoTiempo = (mins: number, phora: number): number => {
    const horasEnteras = Math.floor(mins / 60);
    const minutosRestantes = mins % 60;
    let total = horasEnteras * phora;
    if (minutosRestantes >= 36) total += phora;
    else if (minutosRestantes >= 1) total += phora / 2;
    return total;
  };

  const costoTiempo = calcularCostoTiempo(minutosTotales, precioHora);
  const costoControles = controlesExtra * precioControlExtra;
  const totalEstimado = parseFloat((costoTiempo + costoControles).toFixed(2));

  const etiquetaFraccion = () => {
    const mr = minutosTotales % 60;
    if (mr === 0) return null;
    if (mr >= 36) return `${mr} min → hora completa`;
    return `${mr} min → 50% de hora`;
  };

  const handleFinalizar = async () => {
    setCargando(true); setError('');
    try {
      const { error: e1 } = await supabase
        .from('renta')
        .update({ estado: 'finalizada', hora_fin: ahora.toTimeString().slice(0, 8) })
        .eq('id_renta', renta.id_renta);
      if (e1) throw new Error(e1.message);

      if (renta.detalle?.id_consola) {
        const { data: controlesRentados } = await supabase
          .from('control').select('id_control')
          .eq('id_consola', renta.detalle.id_consola)
          .eq('estado', 'rentado');
        if (controlesRentados && controlesRentados.length > 0) {
          const ids = controlesRentados.map((c: { id_control: number }) => c.id_control);
          await supabase.from('control').update({ estado: 'disponible' }).in('id_control', ids);
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

  const horaInicio = renta.hora_inicio
    ? (() => { const [h, m] = renta.hora_inicio.split(':'); const d = new Date(); d.setHours(+h, +m); return d.toLocaleTimeString('es-MX', { hour: '2-digit', minute: '2-digit' }); })()
    : new Date(renta.fecha_creacion || Date.now()).toLocaleTimeString('es-MX', { hour: '2-digit', minute: '2-digit' });

  const horaFin = ahora.toLocaleTimeString('es-MX', { hour: '2-digit', minute: '2-digit' });

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-container" onClick={(e) => e.stopPropagation()} style={{ maxWidth: '520px' }}>

        {/* Header */}
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-xl font-bold" style={{ color: 'var(--text-1)' }}>✅ Finalizar Renta</h2>
          <button onClick={onClose}
            style={{ background: 'none', border: 'none', fontSize: '24px', cursor: 'pointer', color: 'var(--text-3)' }}>×</button>
        </div>

        {/* Ticket */}
        <div style={{
          background: 'linear-gradient(135deg, rgba(30,58,138,0.25), rgba(88,28,135,0.2))',
          border: '1px solid rgba(34,211,238,0.2)',
          borderRadius: '16px',
          overflow: 'hidden',
          marginBottom: '20px',
        }}>
          {/* Cabecera ticket */}
          <div style={{
            background: 'linear-gradient(135deg, rgba(34,211,238,0.15), rgba(88,28,135,0.15))',
            borderBottom: '1px dashed rgba(34,211,238,0.25)',
            padding: '20px 24px',
            textAlign: 'center',
          }}>
            <p style={{ fontSize: '11px', letterSpacing: '3px', color: 'var(--cyan)', textTransform: 'uppercase', marginBottom: '4px' }}>
              🎮 GameHub — Comprobante de Renta
            </p>
            <p style={{ fontSize: '0.8rem', color: 'var(--text-3)' }}>
              {ahora.toLocaleDateString('es-MX', { weekday: 'long', day: '2-digit', month: 'long', year: 'numeric' })}
            </p>
          </div>

          {/* Cuerpo ticket */}
          <div style={{ padding: '20px 24px' }}>

            {/* Folio + Consola */}
            <div style={{
              display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px',
              marginBottom: '16px',
            }}>
              <div style={{ background: 'rgba(255,255,255,0.04)', borderRadius: '10px', padding: '12px' }}>
                <p style={{ fontSize: '10px', color: 'var(--text-3)', textTransform: 'uppercase', letterSpacing: '1px', marginBottom: '4px' }}>Folio</p>
                <p style={{ fontSize: '0.85rem', fontWeight: 'bold', color: 'var(--cyan)', fontFamily: 'monospace' }}>
                  {renta.folio || `#${renta.id_renta}`}
                </p>
              </div>
              <div style={{ background: 'rgba(255,255,255,0.04)', borderRadius: '10px', padding: '12px' }}>
                <p style={{ fontSize: '10px', color: 'var(--text-3)', textTransform: 'uppercase', letterSpacing: '1px', marginBottom: '4px' }}>Consola</p>
                <p style={{ fontSize: '0.85rem', fontWeight: 'bold', color: 'var(--text-1)' }}>{nombreConsola}</p>
              </div>
            </div>

            {/* Controles extra */}
            <div style={{ background: 'rgba(255,255,255,0.04)', borderRadius: '10px', padding: '12px', marginBottom: '16px' }}>
              <p style={{ fontSize: '10px', color: 'var(--text-3)', textTransform: 'uppercase', letterSpacing: '1px', marginBottom: '4px' }}>Controles Extra</p>
              {controlesExtra > 0
                ? <p style={{ fontSize: '0.85rem', fontWeight: 'bold', color: 'var(--yellow)' }}>
                    {controlesExtra} control{controlesExtra > 1 ? 'es' : ''} × ${precioControlExtra.toFixed(2)} = <span style={{ color: 'var(--yellow)' }}>${costoControles.toFixed(2)}</span>
                  </p>
                : <p style={{ fontSize: '0.85rem', color: 'var(--text-3)' }}>Sin controles extra</p>}
            </div>

            {/* Inicio / Fin / Tiempo */}
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '10px', marginBottom: '16px' }}>
              <div style={{ background: 'rgba(255,255,255,0.04)', borderRadius: '10px', padding: '12px', textAlign: 'center' }}>
                <p style={{ fontSize: '10px', color: 'var(--text-3)', textTransform: 'uppercase', letterSpacing: '1px', marginBottom: '4px' }}>Inicio</p>
                <p style={{ fontSize: '0.9rem', fontWeight: 'bold', color: 'var(--text-1)' }}>{horaInicio}</p>
              </div>
              <div style={{ background: 'rgba(255,255,255,0.04)', borderRadius: '10px', padding: '12px', textAlign: 'center' }}>
                <p style={{ fontSize: '10px', color: 'var(--text-3)', textTransform: 'uppercase', letterSpacing: '1px', marginBottom: '4px' }}>Término</p>
                <p style={{ fontSize: '0.9rem', fontWeight: 'bold', color: 'var(--text-1)' }}>{horaFin}</p>
              </div>
              <div style={{ background: 'rgba(34,211,238,0.08)', borderRadius: '10px', padding: '12px', textAlign: 'center', border: '1px solid rgba(34,211,238,0.15)' }}>
                <p style={{ fontSize: '10px', color: 'var(--text-3)', textTransform: 'uppercase', letterSpacing: '1px', marginBottom: '4px' }}>Tiempo</p>
                <p style={{ fontSize: '0.9rem', fontWeight: 'bold', color: 'var(--cyan)' }}>
                  {horas > 0 ? `${horas}h ` : ''}{minutos}min
                </p>
              </div>
            </div>

            {/* Desglose costos */}
            <div style={{ borderTop: '1px dashed rgba(34,211,238,0.2)', paddingTop: '14px', marginBottom: '14px' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '8px' }}>
                <div>
                  <span style={{ fontSize: '0.85rem', color: 'var(--text-3)' }}>Costo de tiempo</span>
                  {etiquetaFraccion() && (
                    <span style={{
                      marginLeft: '8px', fontSize: '10px', padding: '2px 8px', borderRadius: '20px',
                      background: 'rgba(34,211,238,0.1)', color: 'var(--cyan)', border: '1px solid rgba(34,211,238,0.2)',
                    }}>{etiquetaFraccion()}</span>
                  )}
                </div>
                <span style={{ fontSize: '0.9rem', fontWeight: 'bold', color: 'var(--text-1)' }}>${costoTiempo.toFixed(2)}</span>
              </div>
              {controlesExtra > 0 && (
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '8px' }}>
                  <span style={{ fontSize: '0.85rem', color: 'var(--text-3)' }}>Costo controles extra</span>
                  <span style={{ fontSize: '0.9rem', fontWeight: 'bold', color: 'var(--yellow)' }}>+${costoControles.toFixed(2)}</span>
                </div>
              )}
            </div>

            {/* Total */}
            <div style={{
              background: 'linear-gradient(135deg, rgba(52,211,153,0.12), rgba(34,211,238,0.08))',
              border: '1px solid rgba(52,211,153,0.25)',
              borderRadius: '12px', padding: '16px 20px',
              display: 'flex', justifyContent: 'space-between', alignItems: 'center',
            }}>
              <span style={{ fontSize: '1rem', fontWeight: 'bold', color: 'var(--text-1)' }}>TOTAL A COBRAR</span>
              <span style={{ fontSize: '1.8rem', fontWeight: 'bold', color: 'var(--green)', lineHeight: 1 }}>
                ${totalEstimado.toFixed(2)}
              </span>
            </div>

            {/* Gracias */}
            <p style={{ textAlign: 'center', fontSize: '0.8rem', color: 'var(--text-3)', marginTop: '16px', letterSpacing: '0.5px' }}>
              ✨ ¡Gracias por su visita! · GameHub
            </p>
          </div>
        </div>

        {/* Aviso */}
        <div style={{
          background: 'rgba(34,211,238,0.06)', color: 'var(--cyan)',
          border: '1px solid rgba(34,211,238,0.2)',
          borderRadius: '10px', padding: '12px 16px',
          fontSize: '0.85rem', marginBottom: '20px',
        }}>
          ℹ️ La consola y sus controles quedarán <strong>disponibles</strong> automáticamente.
        </div>

        {error && (
          <div style={{
            background: 'rgba(239,68,68,0.1)', color: 'var(--red)',
            border: '1px solid rgba(239,68,68,0.2)',
            borderRadius: '10px', padding: '12px 16px',
            fontSize: '0.85rem', fontWeight: 'bold', marginBottom: '16px',
          }}>⚠️ {error}</div>
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
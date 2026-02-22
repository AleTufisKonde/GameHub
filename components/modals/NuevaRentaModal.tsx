'use client';

import { useState, useEffect } from 'react';
import { supabase } from '@/lib/supabase';
import { Consola, Precio } from '@/lib/types';

interface Props { onClose: () => void; onSuccess: () => void; idEmpleado: number; }

export default function NuevaRentaModal({ onClose, onSuccess, idEmpleado }: Props) {
  const [consolaId, setConsolaId] = useState<number | null>(null);
  const [controlesExtra, setControlesExtra] = useState(0);
  const [observaciones, setObservaciones] = useState('');
  const [numeroCubiculo, setNumeroCubiculo] = useState('');
  const [consolasDisponibles, setConsolasDisponibles] = useState<Consola[]>([]);
  const [consolaSeleccionada, setConsolaSeleccionada] = useState<Consola | null>(null);
  const [precios, setPrecios] = useState<Precio | null>(null);
  const [controlesDisponibles, setControlesDisponibles] = useState<number>(0);
  const [cargando, setCargando] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    const cargar = async () => {
      const { data: consolas } = await supabase
        .from('consola').select('*').eq('estado', 'disponible').order('marca');
      if (consolas) setConsolasDisponibles(consolas as Consola[]);

      const { data: precio } = await supabase
        .from('configuracion_precios_global')
        .select('*').eq('activo', true)
        .order('fecha_vigencia_inicio', { ascending: false })
        .limit(1);
      if (precio && precio.length > 0) setPrecios(precio[0] as Precio);
    };
    cargar();
  }, []);

  const handleConsolaChange = async (id: number) => {
    setConsolaId(id);
    const consola = consolasDisponibles.find((c) => c.id_consola === id) || null;
    setConsolaSeleccionada(consola);
    setControlesExtra(0);

    // Contar controles disponibles vinculados a esta consola
    if (id) {
      const { count } = await supabase
        .from('control')
        .select('*', { count: 'exact', head: true })
        .eq('id_consola', id)
        .eq('estado', 'disponible');
      setControlesDisponibles(count || 0);
    } else {
      setControlesDisponibles(0);
    }
  };

  const costoControlesExtra = controlesExtra * (precios?.precio_control_extra || 0);

  const generarFolio = () => {
    const f = new Date();
    return `GH-${f.getFullYear()}${String(f.getMonth() + 1).padStart(2, '0')}${String(f.getDate()).padStart(2, '0')}-${String(f.getTime()).slice(-4)}`;
  };

  const handleCrear = async () => {
    if (!consolaId) { setError('Selecciona una consola'); return; }
    if (!precios) { setError('No se pudieron cargar los precios.'); return; }
    if (!numeroCubiculo.trim()) { setError('El número de cubículo es obligatorio.'); return; }

    // Verificar estado actual de la consola
    const { data: consolaActual } = await supabase
      .from('consola').select('estado').eq('id_consola', consolaId).single();
    if (consolaActual?.estado !== 'disponible') {
      setError(`Esta consola no está disponible (estado: ${consolaActual?.estado}).`);
      return;
    }

    // Verificar que hay suficientes controles disponibles
    // controles incluidos = 1 por defecto + extras solicitados
    const totalControlesNecesarios = 1 + controlesExtra;
    if (totalControlesNecesarios > controlesDisponibles) {
      setError(`No hay suficientes controles disponibles. Disponibles: ${controlesDisponibles}, necesarios: ${totalControlesNecesarios}.`);
      return;
    }

    setCargando(true); setError('');
    try {
      const ahora = new Date();

      // 1. Crear renta
      const { data: rentaData, error: e1 } = await supabase
        .from('renta')
        .insert({
          folio: generarFolio(),
          numero_cubiculo: numeroCubiculo.trim(),
          id_empleado: idEmpleado,
          fecha_renta: ahora.toISOString().slice(0, 10),
          hora_inicio: ahora.toTimeString().slice(0, 8),
          estado: 'activa',
          observaciones: observaciones || null,
          anticipo: 0,
          saldo_pendiente: 0,
          descuento: 0,
          fecha_creacion: ahora.toISOString(),
        })
        .select()
        .single();
      if (e1) throw new Error(e1.message);

      // 2. Crear detalle renta
      const { error: e2 } = await supabase.from('detalle_renta').insert({
        id_renta: rentaData.id_renta,
        id_consola: consolaId,
        cantidad_controles_extra: controlesExtra,
        precio_hora_aplicado: precios.precio_hora,
        precio_control_extra_aplicado: precios.precio_control_extra,
        subtotal: 0,
      });
      if (e2) throw new Error(e2.message);

      // 3. Cambiar consola a rentada
      await supabase.from('consola')
        .update({ estado: 'rentada' })
        .eq('id_consola', consolaId);

      // 4. Obtener controles disponibles de la consola ordenados por ID
      const { data: controles } = await supabase
        .from('control')
        .select('id_control')
        .eq('id_consola', consolaId)
        .eq('estado', 'disponible')
        .order('id_control', { ascending: true })
        .limit(totalControlesNecesarios);

      // 5. Cambiar estado de los controles usados a "rentado"
      if (controles && controles.length > 0) {
        const idsControles = controles.map((c: { id_control: number }) => c.id_control);
        await supabase
          .from('control')
          .update({ estado: 'rentado' })
          .in('id_control', idsControles);
      }

      onSuccess();
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Error al crear la renta');
    } finally { setCargando(false); }
  };

  // Máx controles extra = controles disponibles - 1 (el incluido)
  const maxControlesExtra = Math.max(0, controlesDisponibles - 1);

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-container" onClick={(e) => e.stopPropagation()}>
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-xl font-bold" style={{ color: 'var(--text-1)' }}>🎮 Nueva Renta</h2>
          <button onClick={onClose}
            style={{ color: 'var(--text-3)', background: 'none', border: 'none', fontSize: '24px', cursor: 'pointer' }}>×</button>
        </div>

        <div className="space-y-4">
          {/* Consola */}
          <div>
            <label className="form-label">Consola *</label>
            <select className="form-select" value={consolaId || ''}
              onChange={(e) => handleConsolaChange(Number(e.target.value))}>
              <option value="">— Selecciona una consola disponible —</option>
              {consolasDisponibles.map((c) => (
                <option key={c.id_consola} value={c.id_consola}>
                  {c.nombre} — {c.marca} {c.modelo} (ID: {c.id_consola})
                </option>
              ))}
            </select>
            {consolasDisponibles.length === 0 && (
              <p className="text-xs mt-1" style={{ color: 'var(--yellow)' }}>
                ⚠️ No hay consolas disponibles en este momento.
              </p>
            )}
          </div>

          {/* Info controles disponibles */}
          {consolaSeleccionada && (
            <div className="px-4 py-3 rounded-xl text-sm"
              style={{ background: 'rgba(34,211,238,0.06)', border: '1px solid var(--border-cyan)' }}>
              <div className="flex justify-between">
                <span style={{ color: 'var(--text-3)' }}>Controles disponibles en esta consola:</span>
                <span className="font-bold" style={{ color: controlesDisponibles === 0 ? 'var(--red)' : 'var(--cyan)' }}>
                  {controlesDisponibles}
                </span>
              </div>
              <div className="flex justify-between mt-1">
                <span style={{ color: 'var(--text-3)' }}>Controles máximos permitidos:</span>
                <span className="font-bold" style={{ color: 'var(--text-2)' }}>
                  {consolaSeleccionada.controles_maximos}
                </span>
              </div>
              {controlesDisponibles === 0 && (
                <p className="text-xs mt-2 font-bold" style={{ color: 'var(--red)' }}>
                  ⚠️ No hay controles disponibles para esta consola.
                </p>
              )}
            </div>
          )}

          {/* Número de cubículo */}
          <div>
            <label className="form-label">Número de cubículo *</label>
            <input type="text" className="form-input" placeholder="Ej: 1, 2, A..."
              value={numeroCubiculo} onChange={(e) => setNumeroCubiculo(e.target.value)} />
          </div>

          {/* Controles extra */}
          {consolaSeleccionada && (
            <div>
              <label className="form-label">
                Controles extra
                <span className="ml-2" style={{ color: 'var(--text-3)', textTransform: 'none', letterSpacing: 0, fontSize: '10px' }}>
                  (1 incluido + hasta {maxControlesExtra} extra{maxControlesExtra !== 1 ? 's' : ''})
                </span>
              </label>
              <input type="number" className="form-input"
                min={0} max={maxControlesExtra}
                value={controlesExtra}
                onChange={(e) => setControlesExtra(Math.min(Number(e.target.value), maxControlesExtra))} />
              <p className="text-xs mt-1" style={{ color: 'var(--text-3)' }}>
                Se pondrán en renta {1 + controlesExtra} control{1 + controlesExtra !== 1 ? 'es' : ''} en total
              </p>
            </div>
          )}

          {/* Observaciones */}
          <div>
            <label className="form-label">Observaciones (opcional)</label>
            <textarea className="form-input" rows={2} placeholder="Notas adicionales..."
              value={observaciones} onChange={(e) => setObservaciones(e.target.value)} />
          </div>

          {/* Ticket desglose */}
          {consolaSeleccionada && precios && (
            <div className="ticket">
              <p className="font-bold text-center mb-3" style={{ color: 'var(--cyan)' }}>── DESGLOSE ──</p>
              <div className="ticket-row">
                <span style={{ color: 'var(--text-3)' }}>Consola:</span>
                <span style={{ color: 'var(--text-1)' }}>{consolaSeleccionada.nombre}</span>
              </div>
              <div className="ticket-row">
                <span style={{ color: 'var(--text-3)' }}>Precio/hora:</span>
                <span style={{ color: 'var(--text-1)' }}>${precios.precio_hora.toFixed(2)}</span>
              </div>
              <div className="ticket-row">
                <span style={{ color: 'var(--text-3)' }}>Controles incluidos:</span>
                <span style={{ color: 'var(--text-1)' }}>1</span>
              </div>
              {controlesExtra > 0 && (
                <div className="ticket-row">
                  <span style={{ color: 'var(--yellow)' }}>
                    Controles extra ({controlesExtra} × ${precios.precio_control_extra}):
                  </span>
                  <span style={{ color: 'var(--yellow)' }}>+${costoControlesExtra.toFixed(2)}</span>
                </div>
              )}
              <div className="ticket-row">
                <span style={{ color: 'var(--text-3)' }}>Controles en renta:</span>
                <span style={{ color: 'var(--cyan)', fontWeight: 700 }}>{1 + controlesExtra}</span>
              </div>
              <hr className="ticket-divider" />
              <p className="text-xs text-center" style={{ color: 'var(--text-3)' }}>
                * El total final será calculado al terminar la renta
              </p>
            </div>
          )}

          {error && (
            <div className="px-4 py-3 rounded-xl text-sm font-bold"
              style={{ background: 'rgba(248,113,113,0.1)', color: 'var(--red)', border: '1px solid rgba(248,113,113,0.2)' }}>
              ⚠️ {error}
            </div>
          )}

          <div className="flex gap-3 pt-2">
            <button onClick={onClose} className="btn-outline flex-1">Cancelar</button>
            <button onClick={handleCrear} className="btn-primary flex-1"
              disabled={cargando || !consolaId || controlesDisponibles === 0}>
              {cargando ? 'Creando...' : '🎮 Crear Renta'}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
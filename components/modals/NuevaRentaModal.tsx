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
        .limit(1).single();
      if (precio) setPrecios(precio as Precio);
    };
    cargar();
  }, []);

  const handleConsolaChange = (id: number) => {
    setConsolaId(id);
    const consola = consolasDisponibles.find((c) => c.id_consola === id) || null;
    setConsolaSeleccionada(consola);
    setControlesExtra(0);
  };

  const costoControlesExtra = controlesExtra * (precios?.precio_control_extra || 0);

  const generarFolio = () => {
    const f = new Date();
    return `GH-${f.getFullYear()}${String(f.getMonth()+1).padStart(2,'0')}${String(f.getDate()).padStart(2,'0')}-${String(f.getTime()).slice(-4)}`;
  };

  const handleCrear = async () => {
    if (!consolaId) { setError('Selecciona una consola'); return; }
    if (!precios) { setError('No se pudieron cargar los precios.'); return; }
    setCargando(true); setError('');
    try {
      const ahora = new Date();

      const { data: rentaData, error: e1 } = await supabase
        .from('renta')
        .insert({
          folio: generarFolio(),
          numero_cubiculo: numeroCubiculo || null,
          id_empleado: idEmpleado,
          fecha_renta: ahora.toISOString().slice(0, 10),
          hora_inicio: ahora.toTimeString().slice(0, 8),
          estado: 'activa',
          observaciones: observaciones || null,
          total_base: 0,
          total_final: 0,
          fecha_creacion: ahora.toISOString(),
        })
        .select()
        .single();
      if (e1) throw new Error(e1.message);

      const { error: e2 } = await supabase.from('detalle_renta').insert({
        id_renta: rentaData.id_renta,
        id_consola: consolaId,
        cantidad_controles_extra: controlesExtra,
        precio_hora_aplicado: precios.precio_hora,
        precio_control_extra_aplicado: precios.precio_control_extra,
        subtotal: 0,
      });
      if (e2) throw new Error(e2.message);

      const { error: e3 } = await supabase
        .from('consola').update({ estado: 'rentada' }).eq('id_consola', consolaId);
      if (e3) throw new Error(e3.message);

      onSuccess();
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Error al crear la renta');
    } finally { setCargando(false); }
  };

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-container" onClick={(e) => e.stopPropagation()}>
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-xl font-bold text-white">🎮 Nueva Renta</h2>
          <button onClick={onClose} className="text-gray-400 hover:text-white text-2xl">×</button>
        </div>
        <div className="space-y-4">
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
              <p className="text-xs mt-1" style={{ color: 'var(--color-warning)' }}>No hay consolas disponibles.</p>
            )}
          </div>

          <div>
            <label className="form-label">Número de cubículo (opcional)</label>
            <input type="text" className="form-input" placeholder="Ej: 1, 2, A..."
              value={numeroCubiculo} onChange={(e) => setNumeroCubiculo(e.target.value)} />
          </div>

          {consolaSeleccionada && (
            <div>
              <label className="form-label">
                Controles extra
                <span className="ml-2 text-xs" style={{ color: 'var(--color-text-muted)' }}>
                  (Incluidos: {consolaSeleccionada.controles_incluidos} | Máx adicionales: {consolaSeleccionada.controles_maximos - consolaSeleccionada.controles_incluidos})
                </span>
              </label>
              <input type="number" className="form-input" min={0}
                max={consolaSeleccionada.controles_maximos - consolaSeleccionada.controles_incluidos}
                value={controlesExtra} onChange={(e) => setControlesExtra(Number(e.target.value))} />
            </div>
          )}

          <div>
            <label className="form-label">Observaciones (opcional)</label>
            <textarea className="form-input" rows={2} placeholder="Notas adicionales..."
              value={observaciones} onChange={(e) => setObservaciones(e.target.value)} />
          </div>

          {consolaSeleccionada && precios && (
            <div className="rounded-xl p-4 font-mono text-sm"
              style={{ backgroundColor: 'var(--color-primary)', border: '1px dashed rgba(108,99,255,0.3)' }}>
              <p className="font-bold text-center text-white mb-3">── DESGLOSE ──</p>
              <div className="space-y-2">
                <div className="flex justify-between">
                  <span style={{ color: 'var(--color-text-muted)' }}>Consola:</span>
                  <span className="text-white">{consolaSeleccionada.nombre}</span>
                </div>
                <div className="flex justify-between">
                  <span style={{ color: 'var(--color-text-muted)' }}>Precio/hora:</span>
                  <span className="text-white">${precios.precio_hora.toFixed(2)}</span>
                </div>
                <div className="flex justify-between">
                  <span style={{ color: 'var(--color-text-muted)' }}>Controles incluidos:</span>
                  <span className="text-white">{consolaSeleccionada.controles_incluidos}</span>
                </div>
                {controlesExtra > 0 && (
                  <div className="flex justify-between">
                    <span style={{ color: 'var(--color-warning)' }}>
                      Controles extra ({controlesExtra} × ${precios.precio_control_extra}):
                    </span>
                    <span style={{ color: 'var(--color-warning)' }}>+${costoControlesExtra.toFixed(2)}</span>
                  </div>
                )}
                <p className="text-xs text-center mt-1" style={{ color: 'var(--color-text-muted)' }}>
                  * El total incluirá el tiempo al finalizar
                </p>
              </div>
            </div>
          )}

          {error && <p className="text-sm text-center" style={{ color: 'var(--color-danger)' }}>{error}</p>}
          <div className="flex gap-3 pt-2">
            <button onClick={onClose} className="btn-outline flex-1">Cancelar</button>
            <button onClick={handleCrear} className="btn-primary flex-1" disabled={cargando || !consolaId}>
              {cargando ? 'Creando...' : '🎮 Crear Renta'}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
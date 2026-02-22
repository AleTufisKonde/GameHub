'use client';

import { useState, useEffect } from 'react';
import { supabase } from '@/lib/supabase';
import { Consola } from '@/lib/types';

interface Control {
  id_control: number;
  id_consola: number;
  numero_control: string;
  estado: string;
  observaciones?: string;
  consola?: { nombre: string; marca: string; modelo: string; controles_maximos: number; };
}

interface Props {
  controlInicial?: Control;
  onClose: () => void;
  onSuccess: () => void;
}

export default function NuevoControlModal({ controlInicial, onClose, onSuccess }: Props) {
  const esEdicion = !!controlInicial;
  const [consolas, setConsolas] = useState<Consola[]>([]);
  const [consolaSeleccionada, setConsolaSeleccionada] = useState<Consola | null>(null);
  const [controlesExistentes, setControlesExistentes] = useState(0);
  const [form, setForm] = useState({
    id_consola: controlInicial?.id_consola?.toString() || '',
    numero_control: controlInicial?.numero_control || '',
    estado: controlInicial?.estado || 'disponible',
    observaciones: controlInicial?.observaciones || '',
  });
  const [cargando, setCargando] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    const cargarConsolas = async () => {
      const { data } = await supabase
        .from('consola')
        .select('*')
        .order('marca');
      if (data) setConsolas(data as Consola[]);
    };
    cargarConsolas();
  }, []);

  // Cuando cambia la consola seleccionada, verificar cuántos controles tiene
  useEffect(() => {
    const verificarControles = async () => {
      if (!form.id_consola) { setConsolaSeleccionada(null); setControlesExistentes(0); return; }
      const consola = consolas.find(c => c.id_consola === Number(form.id_consola)) || null;
      setConsolaSeleccionada(consola);
      if (consola) {
        const { count } = await supabase
          .from('control')
          .select('*', { count: 'exact', head: true })
          .eq('id_consola', consola.id_consola)
          .neq('estado', 'baja');
        setControlesExistentes(count || 0);
      }
    };
    verificarControles();
  }, [form.id_consola, consolas]);

  const handleChange = (campo: string, valor: string) =>
    setForm((prev) => ({ ...prev, [campo]: valor }));

  const handleGuardar = async () => {
    if (!form.id_consola) { setError('Selecciona una consola.'); return; }
    if (!form.numero_control.trim()) { setError('El número de control es obligatorio.'); return; }

    // Verificar límite de controles (solo en creación)
    if (!esEdicion && consolaSeleccionada) {
      if (controlesExistentes >= consolaSeleccionada.controles_maximos) {
        setError(`Esta consola ya tiene el máximo de ${consolaSeleccionada.controles_maximos} controles permitidos.`);
        return;
      }
    }

    setCargando(true); setError('');
    try {
      if (esEdicion && controlInicial) {
        const { error } = await supabase
          .from('control')
          .update({
            id_consola: Number(form.id_consola),
            numero_control: form.numero_control.trim(),
            estado: form.estado,
            observaciones: form.observaciones || null,
          })
          .eq('id_control', controlInicial.id_control);
        if (error) throw new Error(error.message);
      } else {
        const { error } = await supabase.from('control').insert({
          id_consola: Number(form.id_consola),
          numero_control: form.numero_control.trim(),
          estado: form.estado,
          observaciones: form.observaciones || null,
          fecha_creacion: new Date().toISOString(),
        });
        if (error) throw new Error(error.message);
      }
      onSuccess();
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Error al guardar');
    } finally { setCargando(false); }
  };

  const capacidadOcupada = consolaSeleccionada
    ? Math.min(controlesExistentes, consolaSeleccionada.controles_maximos)
    : 0;
  const capacidadTotal = consolaSeleccionada?.controles_maximos || 0;
  const porcentaje = capacidadTotal > 0 ? (capacidadOcupada / capacidadTotal) * 100 : 0;
  const limiteAlcanzado = !esEdicion && consolaSeleccionada && controlesExistentes >= consolaSeleccionada.controles_maximos;

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-container" onClick={(e) => e.stopPropagation()}>
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-xl font-bold" style={{ color: 'var(--text-1)' }}>
            {esEdicion ? '✏️ Editar Control' : '🕹️ Nuevo Control'}
          </h2>
          <button onClick={onClose}
            style={{ color: 'var(--text-3)', background: 'none', border: 'none', fontSize: '24px', cursor: 'pointer' }}>×</button>
        </div>

        <div className="space-y-4">
          {/* Consola */}
          <div>
            <label className="form-label">Consola *</label>
            <select className="form-select" value={form.id_consola}
              onChange={(e) => handleChange('id_consola', e.target.value)}>
              <option value="">— Selecciona una consola —</option>
              {consolas.map((c) => (
                <option key={c.id_consola} value={c.id_consola}>
                  {c.nombre} — {c.marca} {c.modelo} (ID: {c.id_consola})
                </option>
              ))}
            </select>
          </div>

          {/* Indicador de capacidad */}
          {consolaSeleccionada && (
            <div className="p-4 rounded-xl"
              style={{
                background: limiteAlcanzado ? 'rgba(248,113,113,0.08)' : 'rgba(34,211,238,0.06)',
                border: `1px solid ${limiteAlcanzado ? 'rgba(248,113,113,0.25)' : 'var(--border-cyan)'}`,
              }}>
              <div className="flex items-center justify-between mb-2">
                <p className="text-xs font-bold uppercase" style={{ color: 'var(--text-3)', letterSpacing: '0.6px' }}>
                  Capacidad de controles
                </p>
                <p className="text-sm font-bold"
                  style={{ color: limiteAlcanzado ? 'var(--red)' : 'var(--cyan)' }}>
                  {controlesExistentes} / {capacidadTotal}
                </p>
              </div>
              {/* Barra de progreso */}
              <div className="rounded-full overflow-hidden" style={{ height: '6px', background: 'rgba(255,255,255,0.08)' }}>
                <div className="h-full rounded-full transition-all duration-300"
                  style={{
                    width: `${porcentaje}%`,
                    background: limiteAlcanzado ? 'var(--grad-danger)' : 'var(--grad-cyan)',
                  }} />
              </div>
              {limiteAlcanzado && (
                <p className="text-xs font-bold mt-2" style={{ color: 'var(--red)' }}>
                  ⚠️ Esta consola ya alcanzó el límite máximo de controles
                </p>
              )}
            </div>
          )}

          {/* Número de control */}
          <div>
            <label className="form-label">Número / Identificador *</label>
            <input type="text" className="form-input"
              placeholder="Ej: CTRL-001, Control-1..."
              value={form.numero_control}
              onChange={(e) => handleChange('numero_control', e.target.value)} />
            <p className="text-xs mt-1" style={{ color: 'var(--text-3)' }}>
              Debe ser único por consola
            </p>
          </div>

          {/* Estado */}
          <div>
            <label className="form-label">Estado *</label>
            <select className="form-select" value={form.estado}
              onChange={(e) => handleChange('estado', e.target.value)}>
              <option value="disponible">✅ Disponible</option>
              <option value="rentado">⏱ Rentado</option>
              <option value="reparacion">🔧 Reparación</option>
              <option value="baja">❌ Baja</option>
            </select>
          </div>

          {/* Observaciones */}
          <div>
            <label className="form-label">Observaciones (opcional)</label>
            <textarea className="form-input" rows={2}
              placeholder="Daños, notas, detalles del control..."
              value={form.observaciones}
              onChange={(e) => handleChange('observaciones', e.target.value)} />
          </div>

          {error && (
            <div className="px-4 py-3 rounded-xl text-sm font-bold"
              style={{ background: 'rgba(248,113,113,0.1)', color: 'var(--red)', border: '1px solid rgba(248,113,113,0.2)' }}>
              ⚠️ {error}
            </div>
          )}

          <div className="flex gap-3 pt-2">
            <button onClick={onClose} className="btn-outline flex-1">Cancelar</button>
            <button onClick={handleGuardar} className="btn-primary flex-1"
              disabled={cargando || !!limiteAlcanzado}>
              {cargando ? 'Guardando...' : esEdicion ? '💾 Guardar' : '🕹️ Agregar Control'}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
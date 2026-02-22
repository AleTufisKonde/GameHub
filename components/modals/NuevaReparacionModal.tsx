'use client';

import { useState } from 'react';
import { supabase } from '@/lib/supabase';
import { Reparacion, Consola } from '@/lib/types';
import { obtenerSesion } from '@/lib/auth';

interface Control {
  id_control: number;
  id_consola: number;
  numero_control: string;
  estado: string;
  consola?: Consola;
}

interface Props { reparacionInicial?: Reparacion; onClose: () => void; onSuccess: () => void; }

export default function NuevaReparacionModal({ reparacionInicial, onClose, onSuccess }: Props) {
  const esEdicion = !!reparacionInicial;
  const sesion = obtenerSesion();
  const [form, setForm] = useState({
    tipo_equipo: reparacionInicial?.tipo_equipo || 'consola',
    id_equipo: reparacionInicial?.id_equipo?.toString() || '',
    nombre_equipo: reparacionInicial?.nombre_equipo || '',
    marca: reparacionInicial?.marca || '',
    modelo: reparacionInicial?.modelo || '',
    numero_serie: reparacionInicial?.numero_serie || '',
    descripcion_falla: reparacionInicial?.descripcion_falla || '',
    fecha_ingreso: reparacionInicial?.fecha_ingreso || new Date().toISOString().slice(0, 10),
    fecha_estimada_salida: reparacionInicial?.fecha_estimada_salida || '',
  });
  const [buscando, setBuscando] = useState(false);
  const [cargando, setCargando] = useState(false);
  const [error, setError] = useState('');

  const handleChange = (campo: string, valor: string) =>
    setForm((prev) => ({ ...prev, [campo]: valor }));

  // ── Buscar CONSOLA por ID ──
  const buscarConsola = async (id: string) => {
    if (!id || isNaN(Number(id))) return;
    setBuscando(true); setError('');

    const { data } = await supabase
      .from('consola')
      .select('*')
      .eq('id_consola', Number(id))
      .single();

    if (data) {
      const c = data as Consola;
      if (c.estado === 'rentada') {
        setError('Esta consola está actualmente rentada, no se puede enviar a reparación.');
        setBuscando(false); return;
      }
      if (c.estado === 'reparacion') {
        setError('Esta consola ya está en reparación.');
        setBuscando(false); return;
      }
      setForm((prev) => ({
        ...prev,
        id_equipo: c.id_consola.toString(),
        nombre_equipo: c.nombre,
        marca: c.marca,
        modelo: c.modelo,
        numero_serie: c.numero_serie,
      }));
      await supabase.from('consola').update({ estado: 'reparacion' }).eq('id_consola', c.id_consola);
    } else {
      setError('No se encontró ninguna consola con ese ID.');
    }
    setBuscando(false);
  };

  // ── Buscar CONTROL por ID ──
  const buscarControl = async (id: string) => {
    if (!id || isNaN(Number(id))) return;
    setBuscando(true); setError('');

    const { data } = await supabase
      .from('control')
      .select(`*, consola:id_consola(*)`)
      .eq('id_control', Number(id))
      .single();

    if (data) {
      const ctrl = data as Control;

      if (ctrl.estado === 'rentado') {
        setError('Este control está actualmente rentado, no se puede enviar a reparación.');
        setBuscando(false); return;
      }
      if (ctrl.estado === 'reparacion') {
        setError('Este control ya está en reparación.');
        setBuscando(false); return;
      }

      const consola = ctrl.consola as Consola | undefined;
      setForm((prev) => ({
        ...prev,
        id_equipo: ctrl.id_control.toString(),
        numero_serie: ctrl.numero_control,
        nombre_equipo: consola ? `Control ${ctrl.numero_control} — ${consola.nombre}` : `Control ${ctrl.numero_control}`,
        marca: consola?.marca || '',
        modelo: consola?.modelo || '',
      }));

      // Cambiar estado del control a reparacion
      await supabase.from('control').update({ estado: 'reparacion' }).eq('id_control', ctrl.id_control);
    } else {
      setError('No se encontró ningún control con ese ID.');
    }
    setBuscando(false);
  };

  const handleGuardar = async () => {
    if (!form.descripcion_falla) { setError('La descripción de la falla es obligatoria.'); return; }
    setCargando(true); setError('');
    try {
      const datos = {
        tipo_equipo: form.tipo_equipo,
        id_equipo: form.id_equipo ? Number(form.id_equipo) : null,
        nombre_equipo: form.nombre_equipo || null,
        marca: form.marca || null,
        modelo: form.modelo || null,
        numero_serie: form.numero_serie || null,
        descripcion_falla: form.descripcion_falla,
        fecha_ingreso: form.fecha_ingreso,
        fecha_estimada_salida: form.fecha_estimada_salida || null,
        estado: 'en_reparacion',
        id_empleado_registro: sesion?.id_usuario || null,
      };

      if (esEdicion && reparacionInicial) {
        const { error } = await supabase
          .from('reparacion')
          .update(datos)
          .eq('id_reparacion', reparacionInicial.id_reparacion);
        if (error) throw new Error(error.message);
      } else {
        const { error } = await supabase.from('reparacion').insert(datos);
        if (error) throw new Error(error.message);
      }
      onSuccess();
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Error al guardar');
    } finally { setCargando(false); }
  };

  // Al finalizar reparación también hay que liberar la consola
  // Eso se hace en ReparacionesPage handleFinalizar que ya tiene la lógica

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-container" onClick={(e) => e.stopPropagation()}>
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-xl font-bold" style={{ color: 'var(--text-1)' }}>
            {esEdicion ? '✏️ Editar Reparación' : '🔧 Nueva Reparación'}
          </h2>
          <button onClick={onClose}
            style={{ color: 'var(--text-3)', background: 'none', border: 'none', fontSize: '24px', cursor: 'pointer' }}>×</button>
        </div>

        <div className="space-y-4">

          {/* Tipo equipo */}
          <div>
            <label className="form-label">Tipo de equipo *</label>
            <select className="form-select" value={form.tipo_equipo}
              onChange={(e) => {
                handleChange('tipo_equipo', e.target.value);
                // Limpiar campos al cambiar tipo
                setForm((prev) => ({
                  ...prev,
                  tipo_equipo: e.target.value,
                  id_equipo: '',
                  nombre_equipo: '',
                  marca: '',
                  modelo: '',
                  numero_serie: '',
                }));
                setError('');
              }}>
              <option value="consola">🎮 Consola</option>
              <option value="control">🕹️ Control</option>
            </select>
          </div>

          {/* ID equipo */}
          <div>
            <label className="form-label">
              ID del {form.tipo_equipo === 'consola' ? 'consola' : 'control'}
              <span className="ml-2" style={{ color: 'var(--text-3)', textTransform: 'none', letterSpacing: 0, fontSize: '10px' }}>
                (los datos se llenan automáticamente)
              </span>
            </label>
            <input type="number" className="form-input"
              placeholder={`Ej: 1, 2, 3...`}
              value={form.id_equipo}
              onChange={(e) => handleChange('id_equipo', e.target.value)}
              onBlur={(e) => {
                if (form.tipo_equipo === 'consola') buscarConsola(e.target.value);
                else buscarControl(e.target.value);
              }} />
            {buscando && (
              <p className="text-xs mt-1" style={{ color: 'var(--cyan)' }}>
                🔍 Buscando {form.tipo_equipo}...
              </p>
            )}
          </div>

          {/* Nombre equipo */}
          <div>
            <label className="form-label">Nombre del equipo</label>
            <input type="text" className="form-input"
              placeholder="Se llena automáticamente o escribe manualmente"
              value={form.nombre_equipo}
              onChange={(e) => handleChange('nombre_equipo', e.target.value)} />
          </div>

          {/* Marca y Modelo */}
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="form-label">Marca</label>
              <input type="text" className="form-input" placeholder="Sony, Microsoft..."
                value={form.marca} onChange={(e) => handleChange('marca', e.target.value)} />
            </div>
            <div>
              <label className="form-label">Modelo</label>
              <input type="text" className="form-input" placeholder="CFI-1216A, Series X..."
                value={form.modelo} onChange={(e) => handleChange('modelo', e.target.value)} />
            </div>
          </div>

          {/* Número de serie */}
          <div>
            <label className="form-label">
              {form.tipo_equipo === 'control' ? 'Número de control' : 'Número de serie'}
            </label>
            <input type="text" className="form-input"
              placeholder={form.tipo_equipo === 'control' ? 'Se llena automáticamente' : 'SN-XXXXXXXXXX'}
              value={form.numero_serie}
              onChange={(e) => handleChange('numero_serie', e.target.value)} />
          </div>

          {/* Descripción falla */}
          <div>
            <label className="form-label">Descripción de la falla *</label>
            <textarea className="form-input" rows={3}
              placeholder="Describe el problema detalladamente..."
              value={form.descripcion_falla}
              onChange={(e) => handleChange('descripcion_falla', e.target.value)} />
          </div>

          {/* Fechas */}
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="form-label">Fecha de ingreso</label>
              <input type="date" className="form-input"
                value={form.fecha_ingreso}
                onChange={(e) => handleChange('fecha_ingreso', e.target.value)} />
            </div>
            <div>
              <label className="form-label">Fecha estimada de salida</label>
              <input type="date" className="form-input"
                value={form.fecha_estimada_salida}
                onChange={(e) => handleChange('fecha_estimada_salida', e.target.value)} />
            </div>
          </div>

          {error && (
            <div className="px-4 py-3 rounded-xl text-sm font-bold"
              style={{ background: 'rgba(248,113,113,0.1)', color: 'var(--red)', border: '1px solid rgba(248,113,113,0.2)' }}>
              ⚠️ {error}
            </div>
          )}

          <div className="flex gap-3 pt-2">
            <button onClick={onClose} className="btn-outline flex-1">Cancelar</button>
            <button onClick={handleGuardar} className="btn-primary flex-1" disabled={cargando}>
              {cargando ? 'Guardando...' : esEdicion ? '💾 Guardar' : '🔧 Registrar'}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
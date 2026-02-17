'use client';

import { useState } from 'react';
import { supabase } from '@/lib/supabase';
import { Reparacion, Consola } from '@/lib/types';

interface Props { reparacionInicial?: Reparacion; onClose: () => void; onSuccess: () => void; }

export default function NuevaReparacionModal({ reparacionInicial, onClose, onSuccess }: Props) {
  const esEdicion = !!reparacionInicial;
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

  const buscarConsola = async (id: string) => {
    if (!id || isNaN(Number(id))) return;
    setBuscando(true);
    const { data } = await supabase.from('consola').select('*').eq('id_consola', Number(id)).single();
    if (data) {
      const c = data as Consola;
      setForm((prev) => ({
        ...prev,
        id_equipo: c.id_consola.toString(),
        nombre_equipo: c.nombre,
        marca: c.marca,
        modelo: c.modelo,
        numero_serie: c.numero_serie,
      }));
      await supabase.from('consola').update({ estado: 'reparacion' }).eq('id_consola', c.id_consola);
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
        estado: 'en_curso',
      };
      if (esEdicion && reparacionInicial) {
        const { error } = await supabase.from('reparacion').update(datos).eq('id_reparacion', reparacionInicial.id_reparacion);
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

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-container" onClick={(e) => e.stopPropagation()}>
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-xl font-bold text-white">{esEdicion ? '✏️ Editar Reparación' : '🔧 Nueva Reparación'}</h2>
          <button onClick={onClose} className="text-gray-400 hover:text-white text-2xl">×</button>
        </div>
        <div className="space-y-4">
          <div>
            <label className="form-label">Tipo de equipo *</label>
            <select className="form-select" value={form.tipo_equipo}
              onChange={(e) => handleChange('tipo_equipo', e.target.value)}>
              <option value="consola">Consola</option>
              <option value="control">Control</option>
            </select>
          </div>
          <div>
            <label className="form-label">
              ID de la consola
              <span className="ml-2 text-xs" style={{ color: 'var(--color-text-muted)' }}>
                (escribe el ID y los datos se llenan automáticamente)
              </span>
            </label>
            <input type="number" className="form-input" placeholder="Ej: 1, 2, 3..."
              value={form.id_equipo}
              onChange={(e) => handleChange('id_equipo', e.target.value)}
              onBlur={(e) => form.tipo_equipo === 'consola' && buscarConsola(e.target.value)} />
            {buscando && <p className="text-xs mt-1" style={{ color: 'var(--color-text-muted)' }}>Buscando consola...</p>}
          </div>
          <div>
            <label className="form-label">Nombre del equipo</label>
            <input type="text" className="form-input" placeholder="Se llena automáticamente o escribe manualmente"
              value={form.nombre_equipo} onChange={(e) => handleChange('nombre_equipo', e.target.value)} />
          </div>
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
          <div>
            <label className="form-label">Número de serie</label>
            <input type="text" className="form-input" placeholder="SN-XXXXXXXXXX"
              value={form.numero_serie} onChange={(e) => handleChange('numero_serie', e.target.value)} />
          </div>
          <div>
            <label className="form-label">Descripción de la falla *</label>
            <textarea className="form-input" rows={3} placeholder="Describe el problema..."
              value={form.descripcion_falla} onChange={(e) => handleChange('descripcion_falla', e.target.value)} />
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="form-label">Fecha de ingreso</label>
              <input type="date" className="form-input"
                value={form.fecha_ingreso} onChange={(e) => handleChange('fecha_ingreso', e.target.value)} />
            </div>
            <div>
              <label className="form-label">Fecha estimada de salida</label>
              <input type="date" className="form-input"
                value={form.fecha_estimada_salida} onChange={(e) => handleChange('fecha_estimada_salida', e.target.value)} />
            </div>
          </div>
          {error && <p className="text-sm" style={{ color: 'var(--color-danger)' }}>{error}</p>}
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
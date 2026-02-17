'use client';

import { useState } from 'react';
import { supabase } from '@/lib/supabase';
import { Consola } from '@/lib/types';

interface Props { consolaInicial?: Consola; onClose: () => void; onSuccess: () => void; }

export default function NuevaConsolaModal({ consolaInicial, onClose, onSuccess }: Props) {
  const esEdicion = !!consolaInicial;
  const [form, setForm] = useState({
    nombre: consolaInicial?.nombre || '',
    modelo: consolaInicial?.modelo || '',
    marca: consolaInicial?.marca || '',
    numero_serie: consolaInicial?.numero_serie || '',
    controles_incluidos: consolaInicial?.controles_incluidos || 1,
    controles_maximos: consolaInicial?.controles_maximos || 4,
    almacenamiento: consolaInicial?.almacenamiento || '',
    fecha_adquisicion: consolaInicial?.fecha_adquisicion?.slice(0, 10) || '',
    observaciones: consolaInicial?.observaciones || '',
  });
  const [cargando, setCargando] = useState(false);
  const [error, setError] = useState('');

  const handleChange = (campo: string, valor: string | number) =>
    setForm((prev) => ({ ...prev, [campo]: valor }));

  const handleGuardar = async () => {
    if (!form.nombre || !form.marca || !form.numero_serie) {
      setError('Nombre, marca y número de serie son obligatorios.');
      return;
    }
    setCargando(true); setError('');
    try {
      if (esEdicion && consolaInicial) {
        const { error } = await supabase
          .from('consola')
          .update({ ...form, fecha_modificacion: new Date().toISOString() })
          .eq('id_consola', consolaInicial.id_consola);
        if (error) throw new Error(error.message);
      } else {
        const { error } = await supabase.from('consola').insert({
          ...form,
          estado: 'disponible',
          fecha_creacion: new Date().toISOString(),
          fecha_modificacion: new Date().toISOString(),
        });
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
          <h2 className="text-xl font-bold text-white">{esEdicion ? '✏️ Editar Consola' : '📦 Nueva Consola'}</h2>
          <button onClick={onClose} className="text-gray-400 hover:text-white text-2xl">×</button>
        </div>
        <div className="space-y-4">
          <div>
            <label className="form-label">Nombre *</label>
            <input type="text" className="form-input" placeholder="PlayStation 5 #1..."
              value={form.nombre} onChange={(e) => handleChange('nombre', e.target.value)} />
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="form-label">Marca *</label>
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
            <label className="form-label">Número de serie *</label>
            <input type="text" className="form-input" placeholder="SN-XXXXXXXXXX"
              value={form.numero_serie} onChange={(e) => handleChange('numero_serie', e.target.value)} />
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="form-label">Controles incluidos</label>
              <input type="number" className="form-input" min={0}
                value={form.controles_incluidos} onChange={(e) => handleChange('controles_incluidos', Number(e.target.value))} />
            </div>
            <div>
              <label className="form-label">Controles máximos</label>
              <input type="number" className="form-input" min={1}
                value={form.controles_maximos} onChange={(e) => handleChange('controles_maximos', Number(e.target.value))} />
            </div>
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="form-label">Almacenamiento</label>
              <input type="text" className="form-input" placeholder="512GB, 1TB..."
                value={form.almacenamiento} onChange={(e) => handleChange('almacenamiento', e.target.value)} />
            </div>
            <div>
              <label className="form-label">Fecha de adquisición</label>
              <input type="date" className="form-input"
                value={form.fecha_adquisicion} onChange={(e) => handleChange('fecha_adquisicion', e.target.value)} />
            </div>
          </div>
          <div>
            <label className="form-label">Observaciones</label>
            <textarea className="form-input" rows={2} placeholder="Estado del equipo..."
              value={form.observaciones} onChange={(e) => handleChange('observaciones', e.target.value)} />
          </div>
          {error && <p className="text-sm" style={{ color: 'var(--color-danger)' }}>{error}</p>}
          <div className="flex gap-3 pt-2">
            <button onClick={onClose} className="btn-outline flex-1">Cancelar</button>
            <button onClick={handleGuardar} className="btn-primary flex-1" disabled={cargando}>
              {cargando ? 'Guardando...' : esEdicion ? '💾 Guardar' : '📦 Crear Consola'}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
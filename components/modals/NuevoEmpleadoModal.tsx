'use client';

import { useState } from 'react';
import { supabase } from '@/lib/supabase';
import { Usuario } from '@/lib/types';
import { obtenerSesion } from '@/lib/auth';

interface Props { empleadoInicial?: Usuario; onClose: () => void; onSuccess: () => void; }

export default function NuevoEmpleadoModal({ empleadoInicial, onClose, onSuccess }: Props) {
  const sesion = obtenerSesion();
  const esEdicion = !!empleadoInicial;
  const [form, setForm] = useState({
    nombre: empleadoInicial?.nombre || '',
    apellido: empleadoInicial?.apellido || '',
    email: empleadoInicial?.email || '',
    contrasena: '',
    rol: empleadoInicial?.rol || 'empleado' as 'empleado' | 'gerente',
    activo: empleadoInicial?.activo ?? true,
  });
  const [cargando, setCargando] = useState(false);
  const [error, setError] = useState('');

  const handleChange = (campo: string, valor: string | boolean) =>
    setForm((prev) => ({ ...prev, [campo]: valor }));

  const handleGuardar = async () => {
    if (!form.nombre || !form.apellido || !form.email) {
      setError('Nombre, apellido y email son obligatorios.');
      return;
    }
    if (!esEdicion && !form.contrasena) {
      setError('La contraseña es obligatoria para nuevos empleados.');
      return;
    }
    setCargando(true); setError('');
    try {
      // Encripta la contraseña con bcrypt
      const bcrypt = await import('bcryptjs');
      const contrasenaHash = form.contrasena
        ? await bcrypt.hash(form.contrasena, 10)
        : null;

      if (esEdicion && empleadoInicial) {
        const datos: Record<string, unknown> = {
          nombre: form.nombre, apellido: form.apellido,
          email: form.email, rol: form.rol, activo: form.activo,
          fecha_modificacion: new Date().toISOString(),
        };
        if (contrasenaHash) datos.contrasena = contrasenaHash;
        const { error } = await supabase
          .from('usuario')
          .update(datos)
          .eq('id_usuario', empleadoInicial.id_usuario);
        if (error) throw new Error(error.message);
      } else {
        const { error } = await supabase.from('usuario').insert({
          nombre: form.nombre, apellido: form.apellido,
          email: form.email, contrasena: contrasenaHash,
          rol: form.rol, activo: form.activo,
          creado_por: sesion?.id_usuario || null,
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
          <h2 className="text-xl font-bold text-white">{esEdicion ? '✏️ Editar Empleado' : '👤 Nuevo Empleado'}</h2>
          <button onClick={onClose} className="text-gray-400 hover:text-white text-2xl">×</button>
        </div>
        <div className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="form-label">Nombre *</label>
              <input type="text" className="form-input" placeholder="Carlos"
                value={form.nombre} onChange={(e) => handleChange('nombre', e.target.value)} />
            </div>
            <div>
              <label className="form-label">Apellido *</label>
              <input type="text" className="form-input" placeholder="García"
                value={form.apellido} onChange={(e) => handleChange('apellido', e.target.value)} />
            </div>
          </div>
          <div>
            <label className="form-label">Email *</label>
            <input type="email" className="form-input" placeholder="empleado@gamehub.com"
              value={form.email} onChange={(e) => handleChange('email', e.target.value)} />
          </div>
          <div>
            <label className="form-label">
              Contraseña {esEdicion && <span style={{ color: 'var(--color-text-muted)' }}>(vacío = no cambiar)</span>}
            </label>
            <input type="password" className="form-input" placeholder="••••••••"
              value={form.contrasena} onChange={(e) => handleChange('contrasena', e.target.value)} />
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="form-label">Rol *</label>
              <select className="form-select" value={form.rol}
                onChange={(e) => handleChange('rol', e.target.value)}>
                <option value="empleado">Empleado</option>
                <option value="gerente">Gerente</option>
              </select>
            </div>
            <div>
              <label className="form-label">Estado *</label>
              <select className="form-select" value={form.activo ? 'activo' : 'inactivo'}
                onChange={(e) => handleChange('activo', e.target.value === 'activo')}>
                <option value="activo">Activo</option>
                <option value="inactivo">Inactivo</option>
              </select>
            </div>
          </div>
          {error && <p className="text-sm" style={{ color: 'var(--color-danger)' }}>{error}</p>}
          <div className="flex gap-3 pt-2">
            <button onClick={onClose} className="btn-outline flex-1">Cancelar</button>
            <button onClick={handleGuardar} className="btn-primary flex-1" disabled={cargando}>
              {cargando ? 'Guardando...' : esEdicion ? '💾 Guardar' : '👤 Crear Empleado'}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
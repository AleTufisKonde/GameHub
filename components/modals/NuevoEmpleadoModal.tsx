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
    foto_url: empleadoInicial?.foto_url || '',
  });
  const [mostrarContrasena, setMostrarContrasena] = useState(false);
  const [cargando, setCargando] = useState(false);
  const [errores, setErrores] = useState<Record<string, string>>({});

  // Solo letras y espacios
  const soloLetras = (valor: string) => /^[a-zA-ZáéíóúÁÉÍÓÚüÜñÑ\s]*$/.test(valor);

  // Validar email
  const emailValido = (email: string) => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);

  const handleChange = (campo: string, valor: string) => {
    // Bloquear números y caracteres especiales en nombre y apellido
    if ((campo === 'nombre' || campo === 'apellido') && !soloLetras(valor)) return;
    setForm((prev) => ({ ...prev, [campo]: valor }));
    // Limpiar error del campo al escribir
    setErrores((prev) => ({ ...prev, [campo]: '' }));
  };

  const validar = (): boolean => {
    const nuevosErrores: Record<string, string> = {};

    if (!form.nombre.trim())
      nuevosErrores.nombre = 'El nombre es obligatorio.';
    else if (form.nombre.trim().length < 2)
      nuevosErrores.nombre = 'El nombre debe tener al menos 2 caracteres.';

    if (!form.apellido.trim())
      nuevosErrores.apellido = 'El apellido es obligatorio.';
    else if (form.apellido.trim().length < 2)
      nuevosErrores.apellido = 'El apellido debe tener al menos 2 caracteres.';

    if (!form.email.trim())
      nuevosErrores.email = 'El email es obligatorio.';
    else if (!emailValido(form.email))
      nuevosErrores.email = 'Ingresa un email válido (ejemplo@correo.com).';

    if (!esEdicion && !form.contrasena)
      nuevosErrores.contrasena = 'La contraseña es obligatoria para nuevos empleados.';
    else if (form.contrasena && form.contrasena.length < 6)
      nuevosErrores.contrasena = 'La contraseña debe tener al menos 6 caracteres.';

    setErrores(nuevosErrores);
    return Object.keys(nuevosErrores).length === 0;
  };

  const handleGuardar = async () => {
    if (!validar()) return;
    setCargando(true);
    try {
      const bcrypt = await import('bcryptjs');
      const contrasenaHash = form.contrasena ? await bcrypt.hash(form.contrasena, 10) : null;

      if (esEdicion && empleadoInicial) {
        const datos: Record<string, unknown> = {
          nombre: form.nombre.trim(),
          apellido: form.apellido.trim(),
          email: form.email.trim(),
          rol: form.rol,
          activo: form.activo,
          foto_url: form.foto_url || null,
          fecha_modificacion: new Date().toISOString(),
        };
        if (contrasenaHash) datos.contrasena = contrasenaHash;
        const { error } = await supabase.from('usuario').update(datos).eq('id_usuario', empleadoInicial.id_usuario);
        if (error) throw new Error(error.message);
      } else {
        const { error } = await supabase.from('usuario').insert({
          nombre: form.nombre.trim(),
          apellido: form.apellido.trim(),
          email: form.email.trim(),
          contrasena: contrasenaHash,
          rol: form.rol,
          activo: form.activo,
          foto_url: form.foto_url || null,
          creado_por: sesion?.id_usuario || null,
          fecha_creacion: new Date().toISOString(),
          fecha_modificacion: new Date().toISOString(),
        });
        if (error) throw new Error(error.message);
      }
      onSuccess();
    } catch (err: unknown) {
      setErrores({ general: err instanceof Error ? err.message : 'Error al guardar' });
    } finally { setCargando(false); }
  };

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-container" onClick={(e) => e.stopPropagation()}>
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-xl font-bold" style={{ color: 'var(--text-1)' }}>
            {esEdicion ? '✏️ Editar Empleado' : '👤 Nuevo Empleado'}
          </h2>
          <button onClick={onClose}
            style={{ color: 'var(--text-3)', background: 'none', border: 'none', fontSize: '24px', cursor: 'pointer' }}>×</button>
        </div>

        <div className="space-y-4">

          {/* Preview foto */}
          {form.foto_url && (
            <div className="flex justify-center">
              <img src={form.foto_url} alt="Preview"
                className="w-20 h-20 rounded-full object-cover"
                style={{ border: '3px solid var(--border-cyan)', boxShadow: '0 4px 15px rgba(34,211,238,0.2)' }}
                onError={(e) => { (e.target as HTMLImageElement).style.display = 'none'; }} />
            </div>
          )}

          {/* Nombre y Apellido */}
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="form-label">Nombre *</label>
              <input type="text" className="form-input"
                placeholder="Carlos"
                style={{ borderColor: errores.nombre ? 'var(--red)' : '' }}
                value={form.nombre}
                onChange={(e) => handleChange('nombre', e.target.value)} />
              {errores.nombre && (
                <p className="text-xs mt-1" style={{ color: 'var(--red)' }}>⚠ {errores.nombre}</p>
              )}
              <p className="text-xs mt-1" style={{ color: 'var(--text-3)' }}>Solo letras</p>
            </div>
            <div>
              <label className="form-label">Apellido *</label>
              <input type="text" className="form-input"
                placeholder="García"
                style={{ borderColor: errores.apellido ? 'var(--red)' : '' }}
                value={form.apellido}
                onChange={(e) => handleChange('apellido', e.target.value)} />
              {errores.apellido && (
                <p className="text-xs mt-1" style={{ color: 'var(--red)' }}>⚠ {errores.apellido}</p>
              )}
              <p className="text-xs mt-1" style={{ color: 'var(--text-3)' }}>Solo letras</p>
            </div>
          </div>

          {/* Email */}
          <div>
            <label className="form-label">Email *</label>
            <input type="email" className="form-input"
              placeholder="empleado@gamehub.com"
              style={{ borderColor: errores.email ? 'var(--red)' : '' }}
              value={form.email}
              onChange={(e) => handleChange('email', e.target.value)} />
            {errores.email
              ? <p className="text-xs mt-1" style={{ color: 'var(--red)' }}>⚠ {errores.email}</p>
              : <p className="text-xs mt-1" style={{ color: 'var(--text-3)' }}>Debe contener @ y dominio (ejemplo@correo.com)</p>}
          </div>

          {/* Contraseña con ojo */}
          <div>
            <label className="form-label">
              Contraseña
              {esEdicion && (
                <span style={{ color: 'var(--text-3)', textTransform: 'none', letterSpacing: 0, fontSize: '10px', marginLeft: '6px' }}>
                  (vacío = no cambiar)
                </span>
              )}
            </label>
            <div className="relative">
              <input
                type={mostrarContrasena ? 'text' : 'password'}
                className="form-input"
                placeholder="Mínimo 6 caracteres"
                style={{ paddingRight: '44px', borderColor: errores.contrasena ? 'var(--red)' : '' }}
                value={form.contrasena}
                onChange={(e) => handleChange('contrasena', e.target.value)} />
              {/* Botón ojo */}
              <button
                type="button"
                onClick={() => setMostrarContrasena(!mostrarContrasena)}
                className="absolute right-3 top-1/2 -translate-y-1/2"
                style={{ background: 'none', border: 'none', cursor: 'pointer', color: mostrarContrasena ? 'var(--cyan)' : 'var(--text-3)', padding: '4px' }}>
                {mostrarContrasena ? (
                  // Ojo abierto
                  <svg viewBox="0 0 20 20" fill="currentColor" className="w-5 h-5">
                    <path d="M10 12a2 2 0 100-4 2 2 0 000 4z" />
                    <path fillRule="evenodd" d="M.458 10C1.732 5.943 5.522 3 10 3s8.268 2.943 9.542 7c-1.274 4.057-5.064 7-9.542 7S1.732 14.057.458 10zM14 10a4 4 0 11-8 0 4 4 0 018 0z" clipRule="evenodd" />
                  </svg>
                ) : (
                  // Ojo cerrado
                  <svg viewBox="0 0 20 20" fill="currentColor" className="w-5 h-5">
                    <path fillRule="evenodd" d="M3.707 2.293a1 1 0 00-1.414 1.414l14 14a1 1 0 001.414-1.414l-1.473-1.473A10.014 10.014 0 0019.542 10C18.268 5.943 14.478 3 10 3a9.958 9.958 0 00-4.512 1.074l-1.78-1.781zm4.261 4.26l1.514 1.515a2.003 2.003 0 012.45 2.45l1.514 1.514a4 4 0 00-5.478-5.478z" clipRule="evenodd" />
                    <path d="M12.454 16.697L9.75 13.992a4 4 0 01-3.742-3.741L2.335 6.578A9.98 9.98 0 00.458 10c1.274 4.057 5.064 7 9.542 7 .847 0 1.669-.105 2.454-.303z" />
                  </svg>
                )}
              </button>
            </div>
            {errores.contrasena && (
              <p className="text-xs mt-1" style={{ color: 'var(--red)' }}>⚠ {errores.contrasena}</p>
            )}
          </div>

          {/* URL foto */}
          <div>
            <label className="form-label">URL de foto (opcional)</label>
            <input type="url" className="form-input"
              placeholder="https://ejemplo.com/foto.jpg"
              value={form.foto_url}
              onChange={(e) => handleChange('foto_url', e.target.value)} />
            <p className="text-xs mt-1" style={{ color: 'var(--text-3)' }}>
              Ingresa una URL de imagen para la foto del empleado
            </p>
          </div>

          {/* Rol y Estado */}
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
              <select className="form-select"
                value={form.activo ? 'activo' : 'inactivo'}
                onChange={(e) => handleChange('activo', e.target.value === 'activo' ? 'true' : 'false')}>
                <option value="activo">Activo</option>
                <option value="inactivo">Inactivo</option>
              </select>
            </div>
          </div>

          {/* Error general */}
          {errores.general && (
            <div className="px-4 py-3 rounded-xl text-sm font-bold"
              style={{ background: 'rgba(248,113,113,0.1)', color: 'var(--red)', border: '1px solid rgba(248,113,113,0.2)' }}>
              ⚠️ {errores.general}
            </div>
          )}

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
'use client';

import { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/lib/supabase';
import { Usuario } from '@/lib/types';
import NuevoEmpleadoModal from '@/components/modals/NuevoEmpleadoModal';
import { obtenerSesion } from '@/lib/auth';

export default function EmpleadosPage() {
  const sesion = obtenerSesion();
  const [empleados, setEmpleados] = useState<Usuario[]>([]);
  const [cargando, setCargando] = useState(true);
  const [mostrarNuevo, setMostrarNuevo] = useState(false);
  const [empleadoAEditar, setEmpleadoAEditar] = useState<Usuario | null>(null);
  const [empleadoAEliminar, setEmpleadoAEliminar] = useState<Usuario | null>(null);
  const [eliminando, setEliminando] = useState(false);

  const cargarEmpleados = useCallback(async () => {
    setCargando(true);
    const { data, error } = await supabase
      .from('usuario')
      .select('*')
      .order('fecha_creacion', { ascending: false });
    if (error) console.error('Error cargando empleados:', error);
    if (data) setEmpleados(data as Usuario[]);
    setCargando(false);
  }, []);

  // eslint-disable-next-line react-hooks/exhaustive-deps
  useEffect(() => { cargarEmpleados(); }, []);

  const handleEliminar = async () => {
    if (!empleadoAEliminar) return;
    setEliminando(true);
    await supabase.from('usuario').delete().eq('id_usuario', empleadoAEliminar.id_usuario);
    setEmpleadoAEliminar(null);
    cargarEmpleados();
    setEliminando(false);
  };

  return (
    <div style={{ maxWidth: '1100px', margin: '0 auto' }}>
      <div className="mb-8">
        <h1 className="text-2xl font-bold" style={{ color: 'var(--cyan)' }}>👥 Empleados</h1>
        <p className="mt-1 text-sm" style={{ color: 'var(--text-3)' }}>
          Administra los usuarios del sistema. Los empleados inactivos no pueden acceder.
        </p>
      </div>

      <div className="mb-6">
        <button className="btn-primary" onClick={() => setMostrarNuevo(true)}>+ Nuevo Empleado</button>
      </div>

      <div className="card-table">
        <div className="card-table-header">
          <span className="card-table-title">Empleados Registrados ({empleados.length})</span>
        </div>

        {cargando ? (
          <div className="empty-state">
            <p className="empty-state-text">Cargando empleados...</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr>
                  <th className="table-header">Foto</th>
                  <th className="table-header">Nombre</th>
                  <th className="table-header">ID</th>
                  <th className="table-header">Email</th>
                  <th className="table-header">Rol</th>
                  <th className="table-header">Estado</th>
                  <th className="table-header">Fecha Creación</th>
                  <th className="table-header">Acciones</th>
                </tr>
              </thead>
              <tbody>
                {empleados.length === 0 ? (
                  <tr>
                    <td colSpan={8} className="table-cell text-center" style={{ color: 'var(--text-3)' }}>
                      No hay empleados registrados.
                    </td>
                  </tr>
                ) : (
                  empleados.map((e) => (
                    <tr key={e.id_usuario}>
                      {/* Foto */}
                      <td className="table-cell">
                        <div
                          className="w-9 h-9 rounded-full flex items-center justify-center text-sm font-black overflow-hidden flex-shrink-0"
                          style={{ background: 'var(--grad-brand)', boxShadow: '0 2px 8px rgba(99,102,241,0.3)' }}
                        >
                          {e.foto_url
                            ? <img src={e.foto_url} alt={e.nombre} className="w-full h-full object-cover"
                                onError={(ev) => { (ev.target as HTMLImageElement).style.display = 'none'; }} />
                            : <span className="text-white">{e.nombre.charAt(0).toUpperCase()}</span>}
                        </div>
                      </td>
                      {/* Nombre */}
                      <td className="table-cell font-bold" style={{ color: 'var(--text-1)' }}>
                        {e.nombre} {e.apellido}
                        {e.id_usuario === sesion?.id_usuario && (
                          <span className="ml-2 text-xs" style={{ color: 'var(--cyan)' }}>(tú)</span>
                        )}
                      </td>
                      <td className="table-cell font-mono text-xs">{e.id_usuario}</td>
                      <td className="table-cell">{e.email}</td>
                      <td className="table-cell">
                        <span className={e.rol === 'gerente' ? 'badge-warning' : 'badge-info'}
                          style={{ textTransform: 'capitalize' }}>
                          {e.rol === 'gerente' ? '👑 Gerente' : '👤 Empleado'}
                        </span>
                      </td>
                      <td className="table-cell">
                        {e.activo
                          ? <span className="badge-success">Activo</span>
                          : <span className="badge-danger">Inactivo</span>}
                      </td>
                      <td className="table-cell">
                        {new Date(e.fecha_creacion).toLocaleDateString('es-MX')}
                      </td>
                      <td className="table-cell">
                        <div className="flex gap-2">
                          <button className="btn-edit"
                            onClick={() => setEmpleadoAEditar(e)}>✏️ Editar</button>
                          {e.id_usuario !== sesion?.id_usuario && (
                            <button className="btn-danger"
                              onClick={() => setEmpleadoAEliminar(e)}>🗑️</button>
                          )}
                        </div>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {(mostrarNuevo || empleadoAEditar) && (
        <NuevoEmpleadoModal
          empleadoInicial={empleadoAEditar || undefined}
          onClose={() => { setMostrarNuevo(false); setEmpleadoAEditar(null); }}
          onSuccess={() => { setMostrarNuevo(false); setEmpleadoAEditar(null); cargarEmpleados(); }}
        />
      )}

      {empleadoAEliminar && (
        <div className="modal-overlay" onClick={() => setEmpleadoAEliminar(null)}>
          <div className="modal-container" style={{ maxWidth: '400px' }} onClick={(e) => e.stopPropagation()}>
            <h2 className="text-xl font-bold mb-4" style={{ color: 'var(--text-1)' }}>⚠️ Eliminar Empleado</h2>
            <div className="card mb-4 space-y-2 text-sm">
              <p><span style={{ color: 'var(--text-3)' }}>Nombre:</span>{' '}
                <strong style={{ color: 'var(--text-1)' }}>{empleadoAEliminar.nombre} {empleadoAEliminar.apellido}</strong></p>
              <p><span style={{ color: 'var(--text-3)' }}>Email:</span>{' '}
                <span style={{ color: 'var(--text-1)' }}>{empleadoAEliminar.email}</span></p>
            </div>
            <div className="flex gap-3">
              <button className="btn-outline flex-1" onClick={() => setEmpleadoAEliminar(null)}>Cancelar</button>
              <button className="btn-danger flex-1" onClick={handleEliminar} disabled={eliminando}>
                {eliminando ? 'Eliminando...' : '🗑️ Eliminar'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
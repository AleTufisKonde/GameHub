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

  useEffect(() => { cargarEmpleados(); }, [cargarEmpleados]);

  const handleEliminar = async () => {
    if (!empleadoAEliminar) return;
    setEliminando(true);
    await supabase.from('usuario').delete().eq('id_usuario', empleadoAEliminar.id_usuario);
    setEmpleadoAEliminar(null);
    cargarEmpleados();
    setEliminando(false);
  };

  return (
    <div className="max-w-7xl mx-auto">
      <div className="mb-8">
        <h1 className="text-2xl font-bold text-white">👥 Empleados</h1>
        <p className="mt-1 text-sm" style={{ color: 'var(--color-text-muted)' }}>
          Administra los usuarios del sistema. Los empleados inactivos no pueden acceder.
        </p>
      </div>
      <div className="mb-6">
        <button className="btn-primary" onClick={() => setMostrarNuevo(true)}>+ Nuevo Empleado</button>
      </div>

      <div className="card p-0 overflow-hidden">
        <div className="px-6 py-4" style={{ borderBottom: '1px solid rgba(148, 163, 184, 0.1)' }}>
          <h2 className="text-base font-semibold text-white">Lista de Empleados ({empleados.length})</h2>
        </div>
        {cargando ? (
          <div className="p-12 text-center" style={{ color: 'var(--color-text-muted)' }}>Cargando...</div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr>
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
                    <td colSpan={7} className="table-cell text-center" style={{ color: 'var(--color-text-muted)' }}>
                      No hay empleados registrados.
                    </td>
                  </tr>
                ) : (
                  empleados.map((e) => (
                    <tr key={e.id_usuario}>
                      <td className="table-cell font-medium text-white">
                        {e.nombre} {e.apellido}
                        {e.id_usuario === sesion?.id_usuario && (
                          <span className="ml-2 text-xs" style={{ color: 'var(--color-accent)' }}>(tú)</span>
                        )}
                      </td>
                      <td className="table-cell font-mono text-xs">{e.id_usuario}</td>
                      <td className="table-cell">{e.email}</td>
                      <td className="table-cell">
                        <span className={e.rol === 'gerente' ? 'badge-warning' : 'badge-success'}
                          style={{ textTransform: 'capitalize' }}>
                          {e.rol}
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
                          <button className="text-xs px-2 py-1 rounded font-medium"
                            style={{ backgroundColor: 'rgba(108,99,255,0.15)', color: 'var(--color-accent)' }}
                            onClick={() => setEmpleadoAEditar(e)}>Editar</button>
                          {e.id_usuario !== sesion?.id_usuario && (
                            <button className="btn-danger text-xs px-2 py-1"
                              onClick={() => setEmpleadoAEliminar(e)}>Eliminar</button>
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
          <div className="modal-container max-w-sm" onClick={(e) => e.stopPropagation()}>
            <h2 className="text-xl font-bold text-white mb-4">⚠️ Eliminar Empleado</h2>
            <div className="card mb-4 text-sm space-y-1">
              <p><span style={{ color: 'var(--color-text-muted)' }}>Nombre:</span>{' '}
                <strong className="text-white">{empleadoAEliminar.nombre} {empleadoAEliminar.apellido}</strong></p>
              <p><span style={{ color: 'var(--color-text-muted)' }}>Email:</span>{' '}
                <span className="text-white">{empleadoAEliminar.email}</span></p>
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
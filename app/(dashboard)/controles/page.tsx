'use client';

import { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/lib/supabase';
import NuevoControlModal from '@/components/modals/NuevoControlModal';

interface Control {
  id_control: number;
  id_consola: number;
  numero_control: string;
  estado: string;
  observaciones?: string;
  fecha_creacion?: string;
  consola?: { nombre: string; marca: string; modelo: string; controles_maximos: number; };
}

export default function ControlesPage() {
  const [controles, setControles] = useState<Control[]>([]);
  const [cargando, setCargando] = useState(true);
  const [mostrarNuevo, setMostrarNuevo] = useState(false);
  const [controlAEditar, setControlAEditar] = useState<Control | null>(null);
  const [controlAEliminar, setControlAEliminar] = useState<Control | null>(null);
  const [eliminando, setEliminando] = useState(false);
  const [filtroEstado, setFiltroEstado] = useState('todos');

  const cargarControles = useCallback(async () => {
    setCargando(true);
    const { data, error } = await supabase
      .from('control')
      .select(`*, consola:id_consola(nombre, marca, modelo, controles_maximos)`)
      .order('id_consola', { ascending: true });
    if (error) console.error('Error cargando controles:', error);
    if (data) setControles(data as Control[]);
    setCargando(false);
  }, []);

  // eslint-disable-next-line react-hooks/exhaustive-deps
  useEffect(() => { cargarControles(); }, []);

  const handleEliminar = async () => {
    if (!controlAEliminar) return;
    setEliminando(true);
    await supabase.from('control').delete().eq('id_control', controlAEliminar.id_control);
    setControlAEliminar(null);
    cargarControles();
    setEliminando(false);
  };

  const controlesFiltrados = filtroEstado === 'todos'
    ? controles
    : controles.filter(c => c.estado === filtroEstado);

  const badgeEstado = (estado: string) => {
    if (estado === 'disponible') return <span className="badge-success">Disponible</span>;
    if (estado === 'rentado') return <span className="badge-warning">Rentado</span>;
    if (estado === 'reparacion') return <span className="badge-danger">Reparación</span>;
    return <span className="badge-info">Baja</span>;
  };

  return (
    <div style={{ maxWidth: '1100px', margin: '0 auto' }}>

      {/* Título */}
      <div className="mb-8">
        <h1 className="text-2xl font-bold" style={{ color: 'var(--cyan)' }}>🕹️ Controles</h1>
        <p className="mt-1 text-sm" style={{ color: 'var(--text-3)' }}>
          Administra los controles vinculados a cada consola. Cada consola tiene un límite máximo de controles.
        </p>
      </div>

      {/* Botón izquierda + Filtros derecha */}
      <div className="flex items-center justify-between gap-4 mb-4 flex-wrap">
        <button className="btn-primary" onClick={() => setMostrarNuevo(true)}>
          + Nuevo Control
        </button>
        <div className="flex gap-2 flex-wrap">
          {[
            { valor: 'todos',      label: 'Todos' },
            { valor: 'disponible', label: 'Disponible' },
            { valor: 'rentado',    label: 'Rentado' },
            { valor: 'reparacion', label: 'Reparación' },
          ].map((f) => (
            <button key={f.valor}
              onClick={() => setFiltroEstado(f.valor)}
              className={filtroEstado === f.valor ? 'btn-primary' : 'btn-outline'}
              style={{ padding: '7px 16px', fontSize: '12px' }}>
              {f.label}
            </button>
          ))}
        </div>
      </div>

      {/* Tabla */}
      <div className="card-table">
        <div className="card-table-header">
          <span className="card-table-title">
            Controles ({controlesFiltrados.length})
          </span>
        </div>
        {cargando ? (
          <div className="empty-state">
            <p className="empty-state-text">Cargando controles...</p>
          </div>
        ) : controlesFiltrados.length === 0 ? (
          <div className="empty-state">
            <div className="empty-state-icon">🕹️</div>
            <p className="empty-state-text">No hay controles registrados.</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr>
                  <th className="table-header">ID</th>
                  <th className="table-header">Número</th>
                  <th className="table-header">Consola</th>
                  <th className="table-header">ID Consola</th>
                  <th className="table-header">Controles Máx.</th>
                  <th className="table-header">Estado</th>
                  <th className="table-header">Observaciones</th>
                  <th className="table-header">Fecha Registro</th>
                  <th className="table-header">Acciones</th>
                </tr>
              </thead>
              <tbody>
                {controlesFiltrados.map((c) => (
                  <tr key={c.id_control}>
                    <td className="table-cell font-mono text-xs">{c.id_control}</td>
                    <td className="table-cell font-bold" style={{ color: 'var(--text-1)' }}>
                      {c.numero_control}
                    </td>
                    <td className="table-cell">
                      {c.consola
                        ? `${c.consola.marca} ${c.consola.modelo}`
                        : <span style={{ color: 'var(--text-3)' }}>—</span>}
                    </td>
                    <td className="table-cell font-mono text-xs">{c.id_consola}</td>
                    <td className="table-cell text-center">
                      <span style={{ color: 'var(--cyan)', fontWeight: 700 }}>
                        {c.consola?.controles_maximos ?? '—'}
                      </span>
                    </td>
                    <td className="table-cell">{badgeEstado(c.estado)}</td>
                    <td className="table-cell" style={{ maxWidth: '160px' }}>
                      <span className="truncate block" style={{ color: 'var(--text-3)' }}>
                        {c.observaciones || '—'}
                      </span>
                    </td>
                    <td className="table-cell">
                      {c.fecha_creacion
                        ? new Date(c.fecha_creacion).toLocaleDateString('es-MX')
                        : '—'}
                    </td>
                    <td className="table-cell">
                      <div className="flex gap-2">
                        <button className="btn-edit"
                          onClick={() => setControlAEditar(c)}>✏️ Editar</button>
                        <button className="btn-danger"
                          onClick={() => setControlAEliminar(c)}>🗑️</button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Modal nuevo/editar */}
      {(mostrarNuevo || controlAEditar) && (
        <NuevoControlModal
          controlInicial={controlAEditar || undefined}
          onClose={() => { setMostrarNuevo(false); setControlAEditar(null); }}
          onSuccess={() => { setMostrarNuevo(false); setControlAEditar(null); cargarControles(); }}
        />
      )}

      {/* Modal eliminar */}
      {controlAEliminar && (
        <div className="modal-overlay" onClick={() => setControlAEliminar(null)}>
          <div className="modal-container" style={{ maxWidth: '400px' }}
            onClick={(e) => e.stopPropagation()}>
            <h2 className="text-xl font-bold mb-4" style={{ color: 'var(--text-1)' }}>
              ⚠️ Eliminar Control
            </h2>
            <div className="card mb-4 space-y-2 text-sm">
              <div className="flex justify-between">
                <span style={{ color: 'var(--text-3)' }}>Control:</span>
                <strong style={{ color: 'var(--text-1)' }}>{controlAEliminar.numero_control}</strong>
              </div>
              <div className="flex justify-between">
                <span style={{ color: 'var(--text-3)' }}>Consola:</span>
                <span style={{ color: 'var(--text-1)' }}>
                  {controlAEliminar.consola
                    ? `${controlAEliminar.consola.marca} ${controlAEliminar.consola.modelo}`
                    : `ID ${controlAEliminar.id_consola}`}
                </span>
              </div>
            </div>
            <div className="flex gap-3">
              <button className="btn-outline flex-1"
                onClick={() => setControlAEliminar(null)}>Cancelar</button>
              <button className="btn-danger flex-1"
                onClick={handleEliminar} disabled={eliminando}>
                {eliminando ? 'Eliminando...' : '🗑️ Eliminar'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
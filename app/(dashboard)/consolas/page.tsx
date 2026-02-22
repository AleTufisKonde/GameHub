'use client';

import { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/lib/supabase';
import { Consola } from '@/lib/types';
import NuevaConsolaModal from '@/components/modals/NuevaConsolaModal';
import PageHeader from '@/components/PageHeader';

export default function ConsolasPage() {
  const [consolas, setConsolas] = useState<Consola[]>([]);
  const [cargando, setCargando] = useState(true);
  const [mostrarNueva, setMostrarNueva] = useState(false);
  const [consolaAEditar, setConsolaAEditar] = useState<Consola | null>(null);
  const [consolaAEliminar, setConsolaAEliminar] = useState<Consola | null>(null);
  const [eliminando, setEliminando] = useState(false);
  const [filtroEstado, setFiltroEstado] = useState('todos');

  const cargarConsolas = useCallback(async () => {
    setCargando(true);
    const { data, error } = await supabase.from('consola').select('*').order('marca');
    if (error) console.error('Error cargando consolas:', error);
    if (data) setConsolas(data as Consola[]);
    setCargando(false);
  }, []);

  // eslint-disable-next-line react-hooks/exhaustive-deps
  useEffect(() => { cargarConsolas(); }, []);

  const handleEliminar = async () => {
    if (!consolaAEliminar) return;
    setEliminando(true);
    await supabase.from('consola').delete().eq('id_consola', consolaAEliminar.id_consola);
    setConsolaAEliminar(null);
    cargarConsolas();
    setEliminando(false);
  };

  const consolasFiltradas = filtroEstado === 'todos'
    ? consolas
    : consolas.filter(c => c.estado === filtroEstado);

  const badgeEstado = (estado: string) => {
    if (estado === 'disponible') return <span className="badge-success">Disponible</span>;
    if (estado === 'rentada') return <span className="badge-warning">Rentada</span>;
    return <span className="badge-danger">Reparación</span>;
  };

  return (
    <div style={{ maxWidth: '1100px', margin: '0 auto' }}>

      {/* Título */}
      <PageHeader titulo="🎮 Consolas" descripcion="Administra el catálogo completo de consolas." />


      {/* Botón izquierda + Filtros derecha */}
      <div className="flex items-center justify-between gap-4 mb-4 flex-wrap">
        <button className="btn-primary" onClick={() => setMostrarNueva(true)}>
          + Nueva Consola
        </button>
        <div className="flex gap-2 flex-wrap">
          {[
            { valor: 'todos',      label: 'Todos' },
            { valor: 'disponible', label: 'Disponible' },
            { valor: 'rentada',    label: 'Rentada' },
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
            Catálogo de Consolas ({consolasFiltradas.length})
          </span>
        </div>
        {cargando ? (
          <div className="empty-state">
            <p className="empty-state-text">Cargando consolas...</p>
          </div>
        ) : consolasFiltradas.length === 0 ? (
          <div className="empty-state">
            <div className="empty-state-icon">🎮</div>
            <p className="empty-state-text">No hay consolas registradas.</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr>
                  <th className="table-header">Nombre</th>
                  <th className="table-header">Marca / Modelo</th>
                  <th className="table-header">ID</th>
                  <th className="table-header">No. Serie</th>
                  <th className="table-header">Ctrl. Inc.</th>
                  <th className="table-header">Ctrl. Máx.</th>
                  <th className="table-header">Estado</th>
                  <th className="table-header">Almacenamiento</th>
                  <th className="table-header">Adquisición</th>
                  <th className="table-header">Acciones</th>
                </tr>
              </thead>
              <tbody>
                {consolasFiltradas.map((c) => (
                  <tr key={c.id_consola}>
                    <td className="table-cell font-bold" style={{ color: 'var(--text-1)' }}>{c.nombre}</td>
                    <td className="table-cell">{c.marca} {c.modelo}</td>
                    <td className="table-cell font-mono text-xs">{c.id_consola}</td>
                    <td className="table-cell font-mono text-xs">{c.numero_serie}</td>
                    <td className="table-cell text-center">{c.controles_incluidos}</td>
                    <td className="table-cell text-center">{c.controles_maximos}</td>
                    <td className="table-cell">{badgeEstado(c.estado)}</td>
                    <td className="table-cell">{c.almacenamiento || '—'}</td>
                    <td className="table-cell">
                      {c.fecha_adquisicion
                        ? new Date(c.fecha_adquisicion).toLocaleDateString('es-MX')
                        : '—'}
                    </td>
                    <td className="table-cell">
                      <div className="flex gap-2">
                        <button className="btn-edit"
                          onClick={() => setConsolaAEditar(c)}>✏️ Editar</button>
                        <button className="btn-danger"
                          onClick={() => setConsolaAEliminar(c)}
                          disabled={c.estado !== 'disponible'}>🗑️</button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Modal nueva/editar */}
      {(mostrarNueva || consolaAEditar) && (
        <NuevaConsolaModal
          consolaInicial={consolaAEditar || undefined}
          onClose={() => { setMostrarNueva(false); setConsolaAEditar(null); }}
          onSuccess={() => { setMostrarNueva(false); setConsolaAEditar(null); cargarConsolas(); }}
        />
      )}

      {/* Modal eliminar */}
      {consolaAEliminar && (
        <div className="modal-overlay" onClick={() => setConsolaAEliminar(null)}>
          <div className="modal-container" style={{ maxWidth: '420px' }}
            onClick={(e) => e.stopPropagation()}>
            <h2 className="text-xl font-bold mb-4" style={{ color: 'var(--text-1)' }}>
              ⚠️ Eliminar Consola
            </h2>
            <div className="card mb-4 space-y-2 text-sm">
              <div className="flex justify-between">
                <span style={{ color: 'var(--text-3)' }}>Consola:</span>
                <strong style={{ color: 'var(--text-1)' }}>
                  {consolaAEliminar.nombre} — {consolaAEliminar.marca} {consolaAEliminar.modelo}
                </strong>
              </div>
              <div className="flex justify-between">
                <span style={{ color: 'var(--text-3)' }}>No. Serie:</span>
                <span style={{ color: 'var(--text-1)' }}>{consolaAEliminar.numero_serie}</span>
              </div>
            </div>
            <div className="flex gap-3">
              <button className="btn-outline flex-1"
                onClick={() => setConsolaAEliminar(null)}>Cancelar</button>
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
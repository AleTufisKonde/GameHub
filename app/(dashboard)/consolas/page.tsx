'use client';

import { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/lib/supabase';
import { Consola } from '@/lib/types';
import NuevaConsolaModal from '@/components/modals/NuevaConsolaModal';

export default function ConsolasPage() {
  const [consolas, setConsolas] = useState<Consola[]>([]);
  const [cargando, setCargando] = useState(true);
  const [mostrarNueva, setMostrarNueva] = useState(false);
  const [consolaAEditar, setConsolaAEditar] = useState<Consola | null>(null);
  const [consolaAEliminar, setConsolaAEliminar] = useState<Consola | null>(null);
  const [eliminando, setEliminando] = useState(false);

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

  const badgeEstado = (estado: string) => {
    if (estado === 'disponible') return <span className="badge-success">Disponible</span>;
    if (estado === 'rentada') return <span className="badge-warning">Rentada</span>;
    return <span className="badge-danger">Reparación</span>;
  };

  return (
    <div className="max-w-7xl mx-auto">
      <div className="mb-8">
        <h1 className="text-2xl font-bold text-white">📦 Consolas</h1>
        <p className="mt-1 text-sm" style={{ color: 'var(--color-text-muted)' }}>
          Administra el catálogo completo de consolas.
        </p>
      </div>
      <div className="mb-6">
        <button className="btn-primary" onClick={() => setMostrarNueva(true)}>+ Nueva Consola</button>
      </div>

      <div className="card p-0 overflow-hidden">
        <div className="px-6 py-4" style={{ borderBottom: '1px solid rgba(148,163,184,0.1)' }}>
          <h2 className="text-base font-semibold text-white">Catálogo de Consolas ({consolas.length})</h2>
        </div>
        {cargando ? (
          <div className="p-12 text-center" style={{ color: 'var(--color-text-muted)' }}>Cargando...</div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr>
                  <th className="table-header">Nombre</th>
                  <th className="table-header">Marca / Modelo</th>
                  <th className="table-header">ID</th>
                  <th className="table-header">No. Serie</th>
                  <th className="table-header">Controles Inc.</th>
                  <th className="table-header">Controles Máx.</th>
                  <th className="table-header">Estado</th>
                  <th className="table-header">Almacenamiento</th>
                  <th className="table-header">Adquisición</th>
                  <th className="table-header">Acciones</th>
                </tr>
              </thead>
              <tbody>
                {consolas.length === 0 ? (
                  <tr>
                    <td colSpan={10} className="table-cell text-center" style={{ color: 'var(--color-text-muted)' }}>
                      No hay consolas registradas.
                    </td>
                  </tr>
                ) : (
                  consolas.map((c) => (
                    <tr key={c.id_consola}>
                      <td className="table-cell font-medium text-white">{c.nombre}</td>
                      <td className="table-cell">{c.marca} {c.modelo}</td>
                      <td className="table-cell font-mono text-xs">{c.id_consola}</td>
                      <td className="table-cell font-mono text-xs">{c.numero_serie}</td>
                      <td className="table-cell text-center">{c.controles_incluidos}</td>
                      <td className="table-cell text-center">{c.controles_maximos}</td>
                      <td className="table-cell">{badgeEstado(c.estado)}</td>
                      <td className="table-cell">{c.almacenamiento || '—'}</td>
                      <td className="table-cell">
                        {c.fecha_adquisicion ? new Date(c.fecha_adquisicion).toLocaleDateString('es-MX') : '—'}
                      </td>
                      <td className="table-cell">
                        <div className="flex gap-2">
                          <button className="text-xs px-3 py-1.5 rounded-lg font-medium"
                            style={{ backgroundColor: 'rgba(108,99,255,0.15)', color: 'var(--color-accent)' }}
                            onClick={() => setConsolaAEditar(c)}>Editar</button>
                          <button className="btn-danger text-xs px-3 py-1.5"
                            onClick={() => setConsolaAEliminar(c)}
                            disabled={c.estado !== 'disponible'}>Eliminar</button>
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

      {(mostrarNueva || consolaAEditar) && (
        <NuevaConsolaModal
          consolaInicial={consolaAEditar || undefined}
          onClose={() => { setMostrarNueva(false); setConsolaAEditar(null); }}
          onSuccess={() => { setMostrarNueva(false); setConsolaAEditar(null); cargarConsolas(); }}
        />
      )}

      {consolaAEliminar && (
        <div className="modal-overlay" onClick={() => setConsolaAEliminar(null)}>
          <div className="modal-container max-w-md" onClick={(e) => e.stopPropagation()}>
            <h2 className="text-xl font-bold text-white mb-4">⚠️ Eliminar Consola</h2>
            <div className="card mb-4 space-y-2 text-sm">
              <p><span style={{ color: 'var(--color-text-muted)' }}>Consola:</span>{' '}
                <strong className="text-white">{consolaAEliminar.nombre} — {consolaAEliminar.marca} {consolaAEliminar.modelo}</strong></p>
              <p><span style={{ color: 'var(--color-text-muted)' }}>No. Serie:</span>{' '}
                <span className="text-white">{consolaAEliminar.numero_serie}</span></p>
            </div>
            <div className="flex gap-3">
              <button className="btn-outline flex-1" onClick={() => setConsolaAEliminar(null)}>Cancelar</button>
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
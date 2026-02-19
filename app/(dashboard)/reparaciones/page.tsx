'use client';

import { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/lib/supabase';
import { Reparacion } from '@/lib/types';
import NuevaReparacionModal from '@/components/modals/NuevaReparacionModal';

export default function ReparacionesPage() {
  const [reparaciones, setReparaciones] = useState<Reparacion[]>([]);
  const [cargando, setCargando] = useState(true);
  const [mostrarNueva, setMostrarNueva] = useState(false);
  const [repAEditar, setRepAEditar] = useState<Reparacion | null>(null);
  const [repAFinalizar, setRepAFinalizar] = useState<Reparacion | null>(null);
  const [repAEliminar, setRepAEliminar] = useState<Reparacion | null>(null);
  const [procesando, setProcesando] = useState(false);
  const [error, setError] = useState('');

  const cargarReparaciones = useCallback(async () => {
    setCargando(true);
    const { data, error } = await supabase
      .from('reparacion')
      .select('*')
      .eq('estado', 'en_reparacion')
      .order('fecha_ingreso', { ascending: false });
    if (error) console.error('Error cargando reparaciones:', error);
    if (data) setReparaciones(data as Reparacion[]);
    setCargando(false);
  }, []);

  // eslint-disable-next-line react-hooks/exhaustive-deps
  useEffect(() => { cargarReparaciones(); }, []);

  const handleFinalizar = async () => {
    if (!repAFinalizar) return;
    setProcesando(true); setError('');
    try {
      const { error: e } = await supabase
        .from('reparacion')
        .update({ estado: 'reparado', fecha_fin: new Date().toISOString().slice(0, 10) })
        .eq('id_reparacion', repAFinalizar.id_reparacion);
      if (e) throw new Error(e.message);
      if (repAFinalizar.id_equipo && repAFinalizar.tipo_equipo === 'consola') {
        await supabase.from('consola').update({ estado: 'disponible' }).eq('id_consola', repAFinalizar.id_equipo);
      }
      setRepAFinalizar(null);
      cargarReparaciones();
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Error al finalizar');
    } finally { setProcesando(false); }
  };

  const handleEliminar = async () => {
    if (!repAEliminar) return;
    setProcesando(true);
    await supabase.from('reparacion').delete().eq('id_reparacion', repAEliminar.id_reparacion);
    setRepAEliminar(null);
    cargarReparaciones();
    setProcesando(false);
  };

  return (
    <div className="max-w-7xl mx-auto">
      <div className="mb-8">
        <h1 className="text-2xl font-bold text-white">🔧 Reparaciones</h1>
        <p className="mt-1 text-sm" style={{ color: 'var(--color-text-muted)' }}>
          Registra equipos en reparación y márcalos como finalizados cuando estén listos.
        </p>
      </div>
      <div className="mb-6">
        <button className="btn-primary" onClick={() => setMostrarNueva(true)}>+ Nueva Reparación</button>
      </div>

      <div className="card p-0 overflow-hidden">
        <div className="px-6 py-4" style={{ borderBottom: '1px solid rgba(148,163,184,0.1)' }}>
          <h2 className="text-base font-semibold text-white">Reparaciones en Curso</h2>
        </div>
        {cargando ? (
          <div className="p-12 text-center" style={{ color: 'var(--color-text-muted)' }}>Cargando...</div>
        ) : reparaciones.length === 0 ? (
          <div className="p-12 text-center" style={{ color: 'var(--color-text-muted)' }}>No hay reparaciones en curso.</div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr>
                  <th className="table-header">Tipo</th>
                  <th className="table-header">Equipo</th>
                  <th className="table-header">ID Rep.</th>
                  <th className="table-header">ID Equipo</th>
                  <th className="table-header">No. Serie</th>
                  <th className="table-header">Falla</th>
                  <th className="table-header">Fecha Ingreso</th>
                  <th className="table-header">Acciones</th>
                </tr>
              </thead>
              <tbody>
                {reparaciones.map((r) => (
                  <tr key={r.id_reparacion}>
                    <td className="table-cell"><span className="badge-warning capitalize">{r.tipo_equipo}</span></td>
                    <td className="table-cell font-medium">{r.nombre_equipo || `${r.marca || ''} ${r.modelo || ''}`}</td>
                    <td className="table-cell font-mono text-xs">{r.id_reparacion}</td>
                    <td className="table-cell font-mono text-xs">{r.id_equipo || '—'}</td>
                    <td className="table-cell font-mono text-xs">{r.numero_serie || '—'}</td>
                    <td className="table-cell max-w-[180px] truncate">{r.descripcion_falla}</td>
                    <td className="table-cell">{r.fecha_ingreso ? new Date(r.fecha_ingreso).toLocaleDateString('es-MX') : '—'}</td>
                    <td className="table-cell">
                      <div className="flex gap-2">
                        <button className="text-xs px-2 py-1 rounded font-medium"
                          style={{ backgroundColor: 'rgba(108,99,255,0.15)', color: 'var(--color-accent)' }}
                          onClick={() => setRepAEditar(r)}>Editar</button>
                        <button className="text-xs px-2 py-1 rounded font-medium"
                          style={{ backgroundColor: 'rgba(16,185,129,0.15)', color: 'var(--color-success)' }}
                          onClick={() => setRepAFinalizar(r)}>Finalizar</button>
                        <button className="btn-danger text-xs px-2 py-1"
                          onClick={() => setRepAEliminar(r)}>Eliminar</button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {(mostrarNueva || repAEditar) && (
        <NuevaReparacionModal
          reparacionInicial={repAEditar || undefined}
          onClose={() => { setMostrarNueva(false); setRepAEditar(null); }}
          onSuccess={() => { setMostrarNueva(false); setRepAEditar(null); cargarReparaciones(); }}
        />
      )}

      {repAFinalizar && (
        <div className="modal-overlay" onClick={() => setRepAFinalizar(null)}>
          <div className="modal-container max-w-md" onClick={(e) => e.stopPropagation()}>
            <h2 className="text-xl font-bold text-white mb-4">✅ Finalizar Reparación</h2>
            <div className="card mb-4 space-y-2 text-sm">
              <p><span style={{ color: 'var(--color-text-muted)' }}>Equipo:</span>{' '}
                <strong className="text-white">{repAFinalizar.nombre_equipo || `${repAFinalizar.marca} ${repAFinalizar.modelo}`}</strong></p>
              <p><span style={{ color: 'var(--color-text-muted)' }}>Falla:</span>{' '}
                <span className="text-white">{repAFinalizar.descripcion_falla}</span></p>
            </div>
            {error && <p className="text-sm mb-3" style={{ color: 'var(--color-danger)' }}>{error}</p>}
            <div className="flex gap-3">
              <button className="btn-outline flex-1" onClick={() => setRepAFinalizar(null)}>Cancelar</button>
              <button className="btn-primary flex-1" onClick={handleFinalizar} disabled={procesando}>
                {procesando ? 'Finalizando...' : '✅ Confirmar'}
              </button>
            </div>
          </div>
        </div>
      )}

      {repAEliminar && (
        <div className="modal-overlay" onClick={() => setRepAEliminar(null)}>
          <div className="modal-container max-w-sm" onClick={(e) => e.stopPropagation()}>
            <h2 className="text-xl font-bold text-white mb-4">⚠️ Eliminar Reparación</h2>
            <p className="text-sm mb-4" style={{ color: 'var(--color-text-muted)' }}>
              ¿Eliminar la reparación de <strong className="text-white">
                {repAEliminar.nombre_equipo || `${repAEliminar.marca} ${repAEliminar.modelo}`}
              </strong>?
            </p>
            <div className="flex gap-3">
              <button className="btn-outline flex-1" onClick={() => setRepAEliminar(null)}>Cancelar</button>
              <button className="btn-danger flex-1" onClick={handleEliminar} disabled={procesando}>
                {procesando ? 'Eliminando...' : '🗑️ Eliminar'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
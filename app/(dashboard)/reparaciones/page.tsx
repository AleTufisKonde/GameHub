'use client';

import { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/lib/supabase';
import { Reparacion } from '@/lib/types';
import NuevaReparacionModal from '@/components/modals/NuevaReparacionModal';
import PageHeader from '@/components/PageHeader';

export default function ReparacionesPage() {
  const [reparaciones, setReparaciones] = useState<Reparacion[]>([]);
  const [cargando, setCargando] = useState(true);
  const [mostrarNueva, setMostrarNueva] = useState(false);
  const [repAEditar, setRepAEditar] = useState<Reparacion | null>(null);
  const [repAFinalizar, setRepAFinalizar] = useState<Reparacion | null>(null);
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

      // Liberar consola si aplica
      if (repAFinalizar.id_equipo && repAFinalizar.tipo_equipo === 'consola') {
        await supabase
          .from('consola')
          .update({ estado: 'disponible' })
          .eq('id_consola', repAFinalizar.id_equipo);
      }

      // Liberar control si aplica
      if (repAFinalizar.id_equipo && repAFinalizar.tipo_equipo === 'control') {
        await supabase
          .from('control')
          .update({ estado: 'disponible' })
          .eq('id_control', repAFinalizar.id_equipo);
      }

      setRepAFinalizar(null);
      cargarReparaciones();
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Error al finalizar');
    } finally { setProcesando(false); }
  };

  return (
    <div style={{ maxWidth: '1100px', margin: '0 auto' }}>
      <PageHeader titulo="🔧 Reparaciones" descripcion="Registra equipos en reparación y márcalos como finalizados." />

      <div className="mb-6">
        <button className="btn-primary" onClick={() => setMostrarNueva(true)}>
          + Nueva Reparación
        </button>
      </div>

      <div className="card-table">
        <div className="card-table-header">
          <span className="card-table-title">
            Reparaciones en Curso ({reparaciones.length})
          </span>
        </div>

        {cargando ? (
          <div className="empty-state">
            <p className="empty-state-text">Cargando reparaciones...</p>
          </div>
        ) : reparaciones.length === 0 ? (
          <div className="empty-state">
            <div className="empty-state-icon">🔧</div>
            <p className="empty-state-text">No hay reparaciones en curso.</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr>
                  <th className="table-header">ID Rep.</th>
                  <th className="table-header">Tipo</th>
                  <th className="table-header">Equipo</th>
                  <th className="table-header">ID Equipo</th>
                  <th className="table-header">No. Serie</th>
                  <th className="table-header">Descripción de Falla</th>
                  <th className="table-header">Fecha Ingreso</th>
                  <th className="table-header">Fecha Est. Salida</th>
                  <th className="table-header">Acciones</th>
                </tr>
              </thead>
              <tbody>
                {reparaciones.map((r) => (
                  <tr key={r.id_reparacion}>
                    <td className="table-cell font-mono text-xs">{r.id_reparacion}</td>
                    <td className="table-cell">
                      <span className="badge-warning" style={{ textTransform: 'capitalize' }}>
                        {r.tipo_equipo === 'consola' ? '🎮 Consola' : '🕹️ Control'}
                      </span>
                    </td>
                    <td className="table-cell font-bold" style={{ color: 'var(--text-1)' }}>
                      {r.nombre_equipo || `${r.marca || ''} ${r.modelo || ''}`.trim() || '—'}
                    </td>
                    <td className="table-cell font-mono text-xs">{r.id_equipo || '—'}</td>
                    <td className="table-cell font-mono text-xs">{r.numero_serie || '—'}</td>
                    <td className="table-cell" style={{ maxWidth: '200px' }}>
                      <span className="block truncate" title={r.descripcion_falla}>
                        {r.descripcion_falla}
                      </span>
                    </td>
                    <td className="table-cell">
                      {r.fecha_ingreso
                        ? new Date(r.fecha_ingreso).toLocaleDateString('es-MX')
                        : '—'}
                    </td>
                    <td className="table-cell">
                      {r.fecha_estimada_salida
                        ? <span style={{ color: 'var(--yellow)' }}>
                            {new Date(r.fecha_estimada_salida).toLocaleDateString('es-MX')}
                          </span>
                        : <span style={{ color: 'var(--text-3)' }}>—</span>}
                    </td>
                    <td className="table-cell">
                      <div className="flex gap-2">
                        <button className="btn-edit" onClick={() => setRepAEditar(r)}>
                          ✏️ Editar
                        </button>
                        <button className="btn-success" onClick={() => setRepAFinalizar(r)}>
                          ✅ Finalizar
                        </button>
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
      {(mostrarNueva || repAEditar) && (
        <NuevaReparacionModal
          reparacionInicial={repAEditar || undefined}
          onClose={() => { setMostrarNueva(false); setRepAEditar(null); }}
          onSuccess={() => { setMostrarNueva(false); setRepAEditar(null); cargarReparaciones(); }}
        />
      )}

      {/* Modal finalizar */}
      {repAFinalizar && (
        <div className="modal-overlay" onClick={() => setRepAFinalizar(null)}>
          <div className="modal-container" style={{ maxWidth: '420px' }}
            onClick={(e) => e.stopPropagation()}>
            <h2 className="text-xl font-bold mb-4" style={{ color: 'var(--text-1)' }}>
              ✅ Finalizar Reparación
            </h2>
            <div className="card mb-4 space-y-2 text-sm">
              <div className="flex justify-between">
                <span style={{ color: 'var(--text-3)' }}>Tipo:</span>
                <span className={repAFinalizar.tipo_equipo === 'consola' ? 'badge-info' : 'badge-warning'}>
                  {repAFinalizar.tipo_equipo === 'consola' ? '🎮 Consola' : '🕹️ Control'}
                </span>
              </div>
              <div className="flex justify-between">
                <span style={{ color: 'var(--text-3)' }}>Equipo:</span>
                <strong style={{ color: 'var(--text-1)' }}>
                  {repAFinalizar.nombre_equipo || `${repAFinalizar.marca} ${repAFinalizar.modelo}`}
                </strong>
              </div>
              <div className="flex justify-between">
                <span style={{ color: 'var(--text-3)' }}>Falla:</span>
                <span style={{ color: 'var(--text-1)', maxWidth: '200px', textAlign: 'right' }}>
                  {repAFinalizar.descripcion_falla}
                </span>
              </div>
              {repAFinalizar.id_equipo && (
                <div className="flex justify-between">
                  <span style={{ color: 'var(--text-3)' }}>ID Equipo:</span>
                  <span className="badge-info">{repAFinalizar.id_equipo}</span>
                </div>
              )}
            </div>

            <div className="px-4 py-3 rounded-xl text-sm mb-4"
              style={{ background: 'rgba(52,211,153,0.08)', color: 'var(--green)', border: '1px solid rgba(52,211,153,0.2)' }}>
              ℹ️ Al finalizar, el {repAFinalizar.tipo_equipo === 'consola' ? 'consola' : 'control'} volverá a estar <strong>disponible</strong> automáticamente.
            </div>

            {error && (
              <div className="px-4 py-3 rounded-xl text-sm font-bold mb-4"
                style={{ background: 'rgba(248,113,113,0.1)', color: 'var(--red)', border: '1px solid rgba(248,113,113,0.2)' }}>
                ⚠️ {error}
              </div>
            )}

            <div className="flex gap-3">
              <button className="btn-outline flex-1" onClick={() => setRepAFinalizar(null)}>
                Cancelar
              </button>
              <button className="btn-success flex-1" onClick={handleFinalizar} disabled={procesando}>
                {procesando ? 'Finalizando...' : '✅ Confirmar'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
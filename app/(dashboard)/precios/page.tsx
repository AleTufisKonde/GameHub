'use client';

import { useState, useEffect } from 'react';
import { supabase } from '@/lib/supabase';
import { Precio } from '@/lib/types';

export default function PreciosPage() {
  const [precioActual, setPrecioActual] = useState<Precio | null>(null);
  const [precioHora, setPrecioHora] = useState('');
  const [precioControlExtra, setPrecioControlExtra] = useState('');
  const [cargando, setCargando] = useState(true);
  const [guardando, setGuardando] = useState(false);
  const [exito, setExito] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => { cargarPrecios(); }, []);

  const cargarPrecios = async () => {
    setCargando(true);
    const { data, error } = await supabase
      .from('configuracion_precios_global')
      .select('*')
      .eq('activo', true)
      .order('fecha_vigencia_inicio', { ascending: false })
      .limit(1)
      .single();
    if (error) console.error('Error cargando precios:', error);
    if (data) {
      const precio = data as Precio;
      setPrecioActual(precio);
      setPrecioHora(precio.precio_hora.toString());
      setPrecioControlExtra(precio.precio_control_extra.toString());
    }
    setCargando(false);
  };

  const handleGuardar = async () => {
    const hora = parseFloat(precioHora);
    const extra = parseFloat(precioControlExtra);
    if (isNaN(hora) || hora <= 0) { setError('El precio por hora debe ser mayor a 0.'); return; }
    if (isNaN(extra) || extra < 0) { setError('El precio de control extra debe ser 0 o mayor.'); return; }
    setGuardando(true); setError(''); setExito(false);
    try {
      if (precioActual) {
        await supabase.from('configuracion_precios_global')
          .update({ activo: false, fecha_vigencia_fin: new Date().toISOString() })
          .eq('id_config', precioActual.id_config);
      }
      const { error: e } = await supabase.from('configuracion_precios_global').insert({
        precio_hora: hora,
        precio_control_extra: extra,
        activo: true,
        fecha_vigencia_inicio: new Date().toISOString(),
        fecha_modificacion: new Date().toISOString(),
      });
      if (e) throw new Error(e.message);
      setExito(true);
      cargarPrecios();
      setTimeout(() => setExito(false), 3000);
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Error al guardar');
    } finally { setGuardando(false); }
  };

  return (
    <div className="max-w-2xl mx-auto">
      <div className="mb-8">
        <h1 className="text-2xl font-bold text-white">💲 Precios</h1>
        <p className="mt-1 text-sm" style={{ color: 'var(--color-text-muted)' }}>
          Actualiza el precio de renta por hora y el costo adicional por control extra.
        </p>
      </div>

      {precioActual && (
        <div className="card mb-6">
          <h2 className="text-base font-semibold text-white mb-4">📌 Precio Vigente</h2>
          <div className="grid grid-cols-2 gap-4">
            <div className="text-center p-4 rounded-xl" style={{ backgroundColor: 'rgba(108,99,255,0.1)' }}>
              <p className="text-sm mb-1" style={{ color: 'var(--color-text-muted)' }}>Precio por hora</p>
              <p className="text-3xl font-bold" style={{ color: 'var(--color-accent)' }}>${precioActual.precio_hora.toFixed(2)}</p>
            </div>
            <div className="text-center p-4 rounded-xl" style={{ backgroundColor: 'rgba(245,158,11,0.1)' }}>
              <p className="text-sm mb-1" style={{ color: 'var(--color-text-muted)' }}>Control extra</p>
              <p className="text-3xl font-bold" style={{ color: 'var(--color-warning)' }}>${precioActual.precio_control_extra.toFixed(2)}</p>
            </div>
          </div>
          {precioActual.fecha_vigencia_inicio && (
            <p className="text-xs text-center mt-3" style={{ color: 'var(--color-text-muted)' }}>
              Vigente desde: {new Date(precioActual.fecha_vigencia_inicio).toLocaleString('es-MX')}
            </p>
          )}
        </div>
      )}

      <div className="card">
        <h2 className="text-base font-semibold text-white mb-6">✏️ Actualizar Precios</h2>
        {cargando ? (
          <p className="text-center" style={{ color: 'var(--color-text-muted)' }}>Cargando...</p>
        ) : (
          <div className="space-y-5">
            <div>
              <label className="form-label">Precio por hora ($)</label>
              <input type="number" className="form-input" placeholder="0.00" min="0" step="0.50"
                value={precioHora} onChange={(e) => setPrecioHora(e.target.value)} />
            </div>
            <div>
              <label className="form-label">Precio de control extra ($)</label>
              <input type="number" className="form-input" placeholder="0.00" min="0" step="0.50"
                value={precioControlExtra} onChange={(e) => setPrecioControlExtra(e.target.value)} />
            </div>
            {error && <div className="px-4 py-3 rounded-lg text-sm"
              style={{ backgroundColor: 'rgba(239,68,68,0.1)', color: 'var(--color-danger)' }}>{error}</div>}
            {exito && <div className="px-4 py-3 rounded-lg text-sm text-center"
              style={{ backgroundColor: 'rgba(16,185,129,0.1)', color: 'var(--color-success)' }}>✅ Precios actualizados correctamente.</div>}
            <button className="btn-primary w-full py-3" onClick={handleGuardar} disabled={guardando}>
              {guardando ? 'Guardando...' : '💾 Guardar Nuevos Precios'}
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
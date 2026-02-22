'use client';

import { useState, useEffect } from 'react';
import { supabase } from '@/lib/supabase';
import { Precio } from '@/lib/types';
import { obtenerSesion } from '@/lib/auth';
import PageHeader from '@/components/PageHeader';

export default function PreciosPage() {
  const sesion = obtenerSesion();
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
      .limit(1);

    if (error) console.error('Error cargando precios:', error);
    if (data && data.length > 0) {
      const precio = data[0] as Precio;
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
        await supabase
          .from('configuracion_precios_global')
          .update({ activo: false, fecha_vigencia_fin: new Date().toISOString() })
          .eq('id_config', precioActual.id_config);
      }
      const { error: e } = await supabase.from('configuracion_precios_global').insert({
        precio_hora: hora,
        precio_control_extra: extra,
        activo: true,
        fecha_vigencia_inicio: new Date().toISOString(),
        fecha_modificacion: new Date().toISOString(),
        modificado_por: sesion?.id_usuario || 1,
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
    <div style={{ maxWidth: '600px', margin: '0 auto' }}>
      <PageHeader titulo="⚙️ Precios" descripcion="Configura las tarifas por hora y controles extra." />

      {precioActual && (
        <div className="card mb-6">
          <h2 className="text-base font-bold mb-4" style={{ color: 'var(--text-1)' }}>📌 Precio Vigente</h2>
          <div className="grid grid-cols-2 gap-4">
            <div className="text-center p-5 rounded-xl"
              style={{ background: 'rgba(34,211,238,0.08)', border: '1px solid var(--border-cyan)' }}>
              <p className="text-xs font-bold uppercase mb-2" style={{ color: 'var(--text-3)', letterSpacing: '0.8px' }}>
                Precio por Hora
              </p>
              <p className="text-3xl font-bold" style={{ color: 'var(--cyan)' }}>
                ${precioActual.precio_hora.toFixed(2)}
              </p>
              <p className="text-xs mt-1" style={{ color: 'var(--text-3)' }}>MXN</p>
            </div>
            <div className="text-center p-5 rounded-xl"
              style={{ background: 'rgba(251,191,36,0.08)', border: '1px solid rgba(251,191,36,0.25)' }}>
              <p className="text-xs font-bold uppercase mb-2" style={{ color: 'var(--text-3)', letterSpacing: '0.8px' }}>
                Control Adicional
              </p>
              <p className="text-3xl font-bold" style={{ color: 'var(--yellow)' }}>
                ${precioActual.precio_control_extra.toFixed(2)}
              </p>
              <p className="text-xs mt-1" style={{ color: 'var(--text-3)' }}>MXN</p>
            </div>
          </div>
          {precioActual.fecha_vigencia_inicio && (
            <p className="text-xs text-center mt-4" style={{ color: 'var(--text-3)' }}>
              Vigente desde: {new Date(precioActual.fecha_vigencia_inicio).toLocaleString('es-MX')}
            </p>
          )}
        </div>
      )}

      <div className="card">
        <h2 className="text-base font-bold mb-6" style={{ color: 'var(--text-1)' }}>✏️ Actualizar Precios</h2>
        {cargando ? (
          <p className="text-center py-8" style={{ color: 'var(--text-3)' }}>Cargando precios...</p>
        ) : (
          <div className="space-y-5">
            <div>
              <label className="form-label">Precio por hora ($)</label>
              <p className="text-xs mb-2" style={{ color: 'var(--text-3)' }}>
                Costo base por hora de renta (incluye 1 control)
              </p>
              <div className="relative">
                <span className="absolute left-4 top-1/2 -translate-y-1/2 font-bold"
                  style={{ color: 'var(--cyan)' }}>$</span>
                <input
                  type="number" className="form-input" placeholder="0.00" min="0" step="0.50"
                  style={{ paddingLeft: '28px' }}
                  value={precioHora} onChange={(e) => setPrecioHora(e.target.value)}
                />
              </div>
            </div>

            <div>
              <label className="form-label">Control adicional ($)</label>
              <p className="text-xs mb-2" style={{ color: 'var(--text-3)' }}>
                Costo por cada control extra
              </p>
              <div className="relative">
                <span className="absolute left-4 top-1/2 -translate-y-1/2 font-bold"
                  style={{ color: 'var(--cyan)' }}>$</span>
                <input
                  type="number" className="form-input" placeholder="0.00" min="0" step="0.50"
                  style={{ paddingLeft: '28px' }}
                  value={precioControlExtra} onChange={(e) => setPrecioControlExtra(e.target.value)}
                />
              </div>
            </div>

            {error && (
              <div className="px-4 py-3 rounded-xl text-sm font-bold"
                style={{ background: 'rgba(248,113,113,0.1)', color: 'var(--red)', border: '1px solid rgba(248,113,113,0.2)' }}>
                ⚠️ {error}
              </div>
            )}

            {exito && (
              <div className="px-4 py-3 rounded-xl text-sm font-bold text-center"
                style={{ background: 'rgba(52,211,153,0.1)', color: 'var(--green)', border: '1px solid rgba(52,211,153,0.2)' }}>
                ✅ Precios actualizados correctamente.
              </div>
            )}

            <p className="text-xs text-center" style={{ color: 'var(--text-3)' }}>
              Los cambios se aplicarán automáticamente en todo el sistema
            </p>

            <button className="btn-primary w-full py-3" onClick={handleGuardar} disabled={guardando}>
              {guardando ? 'Guardando...' : '💾 Guardar Cambios'}
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
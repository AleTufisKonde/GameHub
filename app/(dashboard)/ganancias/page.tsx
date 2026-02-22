'use client';

import { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/lib/supabase';
import { RentaConDetalle } from '@/lib/types';

type Filtro = 'dia' | 'semana' | 'mes' | 'mes_especifico';

interface GananciaPorDia {
  fecha: string;
  total: number;
  rentas: RentaConDetalle[];
}

const MESES = [
  'Enero', 'Febrero', 'Marzo', 'Abril', 'Mayo', 'Junio',
  'Julio', 'Agosto', 'Septiembre', 'Octubre', 'Noviembre', 'Diciembre'
];

export default function GananciasPage() {
  const [filtro, setFiltro] = useState<Filtro>('dia');
  const [mesSeleccionado, setMesSeleccionado] = useState(new Date().getMonth());
  const [anioSeleccionado, setAnioSeleccionado] = useState(new Date().getFullYear());
  const [rentas, setRentas] = useState<RentaConDetalle[]>([]);
  const [cargando, setCargando] = useState(true);
  const [desgloseAbierto, setDesgloseAbierto] = useState<GananciaPorDia | null>(null);

  const obtenerRango = (): { inicio: string; fin: string } => {
    const ahora = new Date();
    if (filtro === 'dia') {
      const inicio = new Date(ahora); inicio.setHours(0, 0, 0, 0);
      const fin = new Date(ahora); fin.setHours(23, 59, 59, 999);
      return { inicio: inicio.toISOString(), fin: fin.toISOString() };
    }
    if (filtro === 'semana') {
      const inicio = new Date(ahora); inicio.setDate(ahora.getDate() - 7);
      return { inicio: inicio.toISOString(), fin: ahora.toISOString() };
    }
    if (filtro === 'mes') {
      const inicio = new Date(ahora.getFullYear(), ahora.getMonth(), 1);
      const fin = new Date(ahora.getFullYear(), ahora.getMonth() + 1, 0, 23, 59, 59);
      return { inicio: inicio.toISOString(), fin: fin.toISOString() };
    }
    // mes_especifico
    const inicio = new Date(anioSeleccionado, mesSeleccionado, 1);
    const fin = new Date(anioSeleccionado, mesSeleccionado + 1, 0, 23, 59, 59);
    return { inicio: inicio.toISOString(), fin: fin.toISOString() };
  };

  const cargarRentas = useCallback(async () => {
    setCargando(true);
    const { inicio, fin } = obtenerRango();
    const { data, error } = await supabase
      .from('renta')
      .select(`
        *,
        detalle:detalle_renta(
          *,
          consola:id_consola(nombre, marca, modelo)
        )
      `)
      .eq('estado', 'finalizada')
      .gte('fecha_finalizacion', inicio)
      .lte('fecha_finalizacion', fin)
      .order('fecha_finalizacion', { ascending: false });

    if (error) console.error('Error cargando ganancias:', error);
    if (data) {
      const rentasFlat = data.map((r: any) => ({
        ...r,
        detalle: Array.isArray(r.detalle) ? r.detalle[0] || null : r.detalle,
      }));
      setRentas(rentasFlat as RentaConDetalle[]);
    }
    setCargando(false);
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [filtro, mesSeleccionado, anioSeleccionado]);

  useEffect(() => { cargarRentas(); }, [cargarRentas]);

  const gananciasAgrupadas: GananciaPorDia[] = (() => {
    const mapa = new Map<string, GananciaPorDia>();
    rentas.forEach((r) => {
      const fechaRef = r.fecha_finalizacion || r.fecha_creacion;
      if (!fechaRef) return;
      const fecha = new Date(fechaRef).toLocaleDateString('es-MX', { day: '2-digit', month: 'long', year: 'numeric' });
      const total = r.total_final || 0;
      if (mapa.has(fecha)) {
        const e = mapa.get(fecha)!;
        e.total += total;
        e.rentas.push(r);
      } else {
        mapa.set(fecha, { fecha, total, rentas: [r] });
      }
    });
    return Array.from(mapa.values());
  })();

  const totalGeneral = gananciasAgrupadas.reduce((sum, g) => sum + g.total, 0);

  // Años disponibles (últimos 5 años)
  const anioActual = new Date().getFullYear();
  const anios = Array.from({ length: 5 }, (_, i) => anioActual - i);

  const etiquetaFiltro = () => {
    if (filtro === 'dia') return 'Hoy';
    if (filtro === 'semana') return 'Esta Semana';
    if (filtro === 'mes') return 'Este Mes';
    return `${MESES[mesSeleccionado]} ${anioSeleccionado}`;
  };

  return (
    <div style={{ maxWidth: '900px', margin: '0 auto' }}>
      <div className="mb-8">
        <h1 className="text-2xl font-bold" style={{ color: 'var(--cyan)' }}>💰 Ganancias</h1>
        <p className="mt-1 text-sm" style={{ color: 'var(--text-3)' }}>
          Consulta el historial de ingresos con desglose detallado por día.
        </p>
      </div>

      {/* Filtros */}
      <div className="card mb-6">
        <p className="text-xs font-bold uppercase mb-3" style={{ color: 'var(--text-3)', letterSpacing: '0.8px' }}>
          Período
        </p>
        <div className="flex gap-2 flex-wrap mb-4">
          {([
            { valor: 'dia',            label: 'Hoy' },
            { valor: 'semana',         label: 'Esta Semana' },
            { valor: 'mes',            label: 'Este Mes' },
            { valor: 'mes_especifico', label: 'Elegir Mes' },
          ] as { valor: Filtro; label: string }[]).map((f) => (
            <button key={f.valor}
              className={filtro === f.valor ? 'btn-primary' : 'btn-outline'}
              style={{ padding: '8px 18px', fontSize: '13px' }}
              onClick={() => setFiltro(f.valor)}>
              {f.label}
            </button>
          ))}
        </div>

        {/* Selector de mes específico */}
        {filtro === 'mes_especifico' && (
          <div className="flex gap-3 items-center flex-wrap pt-3"
            style={{ borderTop: '1px solid var(--border)' }}>
            <div>
              <label className="form-label">Mes</label>
              <select className="form-select" style={{ width: '160px' }}
                value={mesSeleccionado}
                onChange={(e) => setMesSeleccionado(Number(e.target.value))}>
                {MESES.map((m, i) => (
                  <option key={i} value={i}>{m}</option>
                ))}
              </select>
            </div>
            <div>
              <label className="form-label">Año</label>
              <select className="form-select" style={{ width: '110px' }}
                value={anioSeleccionado}
                onChange={(e) => setAnioSeleccionado(Number(e.target.value))}>
                {anios.map((a) => (
                  <option key={a} value={a}>{a}</option>
                ))}
              </select>
            </div>
            <div style={{ paddingTop: '20px' }}>
              <button className="btn-primary" onClick={cargarRentas}
                style={{ padding: '11px 20px', fontSize: '13px' }}>
                🔍 Buscar
              </button>
            </div>
          </div>
        )}
      </div>

      {/* Total general */}
      <div className="card mb-6 flex items-center justify-between"
        style={{ background: 'linear-gradient(135deg, rgba(52,211,153,0.1), rgba(34,211,238,0.08))', border: '1px solid rgba(52,211,153,0.2)' }}>
        <div>
          <p className="text-xs font-bold uppercase" style={{ color: 'var(--text-3)', letterSpacing: '0.8px' }}>
            Total — {etiquetaFiltro()}
          </p>
          <p className="text-4xl font-bold mt-1" style={{ color: 'var(--green)' }}>
            ${totalGeneral.toFixed(2)}
          </p>
          <p className="text-xs mt-1" style={{ color: 'var(--text-3)' }}>
            {rentas.length} renta{rentas.length !== 1 ? 's' : ''} finalizada{rentas.length !== 1 ? 's' : ''}
          </p>
        </div>
        <div style={{ fontSize: '48px', opacity: 0.4 }}>💰</div>
      </div>

      {/* Tabla */}
      <div className="card-table">
        <div className="card-table-header">
          <span className="card-table-title">Desglose por Día</span>
        </div>

        {cargando ? (
          <div className="empty-state">
            <p className="empty-state-text">Cargando ganancias...</p>
          </div>
        ) : gananciasAgrupadas.length === 0 ? (
          <div className="empty-state">
            <div className="empty-state-icon">💸</div>
            <p className="empty-state-text">No hay ganancias en este período.</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr>
                  <th className="table-header">Fecha</th>
                  <th className="table-header text-center">N° Rentas</th>
                  <th className="table-header text-right">Total</th>
                  <th className="table-header text-center">Desglose</th>
                </tr>
              </thead>
              <tbody>
                {gananciasAgrupadas.map((g) => (
                  <tr key={g.fecha}>
                    <td className="table-cell font-bold" style={{ color: 'var(--text-1)' }}>{g.fecha}</td>
                    <td className="table-cell text-center">
                      <span className="badge-info">{g.rentas.length}</span>
                    </td>
                    <td className="table-cell text-right font-bold" style={{ color: 'var(--green)' }}>
                      ${g.total.toFixed(2)}
                    </td>
                    <td className="table-cell text-center">
                      <button className="btn-outline" style={{ padding: '6px 14px', fontSize: '12px' }}
                        onClick={() => setDesgloseAbierto(g)}>
                        Ver Desglose
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Modal desglose */}
      {desgloseAbierto && (
        <div className="modal-overlay" onClick={() => setDesgloseAbierto(null)}>
          <div className="modal-container" onClick={(e) => e.stopPropagation()}>
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-xl font-bold" style={{ color: 'var(--text-1)' }}>
                📋 {desgloseAbierto.fecha}
              </h2>
              <button onClick={() => setDesgloseAbierto(null)}
                style={{ color: 'var(--text-3)', background: 'none', border: 'none', fontSize: '24px', cursor: 'pointer' }}>×</button>
            </div>

            <div className="ticket space-y-3">
              <p className="text-center font-bold" style={{ color: 'var(--cyan)' }}>🎮 GAMEHUB – REPORTE</p>
              <hr className="ticket-divider" />
              {desgloseAbierto.rentas.map((r) => (
                <div key={r.id_renta} className="space-y-1 pb-3" style={{ borderBottom: '1px dashed var(--border-cyan)' }}>
                  <div className="ticket-row">
                    <span style={{ color: 'var(--text-3)' }}>Folio:</span>
                    <span style={{ color: 'var(--text-1)' }}>{r.folio || `#${r.id_renta}`}</span>
                  </div>
                  <div className="ticket-row">
                    <span style={{ color: 'var(--text-3)' }}>Consola:</span>
                    <span style={{ color: 'var(--text-1)' }}>
                      {r.detalle?.consola ? `${r.detalle.consola.marca} ${r.detalle.consola.modelo}` : '—'}
                    </span>
                  </div>
                  <div className="ticket-row">
                    <span style={{ color: 'var(--text-3)' }}>Duración:</span>
                    <span style={{ color: 'var(--text-1)' }}>{r.minutos_totales_uso || 0} min</span>
                  </div>
                  <div className="ticket-row">
                    <span style={{ color: 'var(--text-3)' }}>Total:</span>
                    <span className="font-bold" style={{ color: 'var(--cyan)' }}>${(r.total_final || 0).toFixed(2)}</span>
                  </div>
                </div>
              ))}
              <hr className="ticket-divider" />
              <div className="ticket-row">
                <span className="font-bold" style={{ color: 'var(--text-1)' }}>TOTAL DEL DÍA:</span>
                <span className="ticket-total">${desgloseAbierto.total.toFixed(2)}</span>
              </div>
            </div>

            <button className="btn-outline w-full mt-4" onClick={() => setDesgloseAbierto(null)}>
              ← Cerrar
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
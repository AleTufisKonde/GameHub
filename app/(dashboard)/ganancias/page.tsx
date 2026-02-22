'use client';

import { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/lib/supabase';
import { RentaConDetalle } from '@/lib/types';
import PageHeader from '@/components/PageHeader';

type Filtro = 'dia' | 'semana' | 'mes' | 'mes_especifico';

const MESES = ['Enero','Febrero','Marzo','Abril','Mayo','Junio','Julio','Agosto','Septiembre','Octubre','Noviembre','Diciembre'];

function inicioFindeSemana(fecha: Date) {
  const d = new Date(fecha);
  const dia = d.getDay();
  const lunes = new Date(d);
  lunes.setDate(d.getDate() - (dia === 0 ? 6 : dia - 1));
  lunes.setHours(0,0,0,0);
  return lunes;
}

function semanasDelMes(anio: number, mes: number) {
  const semanas: { label: string; inicio: Date; fin: Date }[] = [];
  const primerDia = new Date(anio, mes, 1);
  const ultimoDia = new Date(anio, mes + 1, 0);
  let actual = inicioFindeSemana(primerDia);
  while (actual <= ultimoDia) {
    const fin = new Date(actual); fin.setDate(actual.getDate() + 6); fin.setHours(23,59,59,999);
    const finReal = fin > ultimoDia ? ultimoDia : fin;
    semanas.push({ label: `${actual.getDate()} – ${finReal.getDate()} de ${MESES[mes]}`, inicio: new Date(actual), fin: new Date(finReal) });
    actual = new Date(actual); actual.setDate(actual.getDate() + 7);
  }
  return semanas;
}

function diasDeSemana(inicio: Date, fin: Date) {
  const dias: Date[] = [];
  const actual = new Date(inicio);
  while (actual <= fin) { dias.push(new Date(actual)); actual.setDate(actual.getDate() + 1); }
  return dias;
}

function formatFecha(d: Date) {
  return d.toLocaleDateString('es-MX', { weekday: 'long', day: '2-digit', month: 'long', year: 'numeric' });
}

export default function GananciasPage() {
  const [filtro, setFiltro] = useState<Filtro>('dia');
  const [mesSeleccionado, setMesSeleccionado] = useState(new Date().getMonth());
  const [anioSeleccionado, setAnioSeleccionado] = useState(new Date().getFullYear());
  const [rentas, setRentas] = useState<RentaConDetalle[]>([]);
  const [cargando, setCargando] = useState(true);
  const [semanaSeleccionada, setSemanaSeleccionada] = useState<{ inicio: Date; fin: Date } | null>(null);
  const [diaSeleccionado, setDiaSeleccionado] = useState<Date | null>(null);
  const [rentaDetalle, setRentaDetalle] = useState<RentaConDetalle | null>(null);

  const obtenerRango = useCallback((): { inicio: string; fin: string } => {
    const ahora = new Date();
    if (filtro === 'dia') {
      const i = new Date(ahora); i.setHours(0,0,0,0);
      const f = new Date(ahora); f.setHours(23,59,59,999);
      return { inicio: i.toISOString(), fin: f.toISOString() };
    }
    if (filtro === 'semana') {
      const i = inicioFindeSemana(ahora);
      const f = new Date(i); f.setDate(i.getDate() + 6); f.setHours(23,59,59,999);
      return { inicio: i.toISOString(), fin: f.toISOString() };
    }
    if (filtro === 'mes') {
      const i = new Date(ahora.getFullYear(), ahora.getMonth(), 1);
      const f = new Date(ahora.getFullYear(), ahora.getMonth() + 1, 0, 23,59,59);
      return { inicio: i.toISOString(), fin: f.toISOString() };
    }
    const i = new Date(anioSeleccionado, mesSeleccionado, 1);
    const f = new Date(anioSeleccionado, mesSeleccionado + 1, 0, 23,59,59);
    return { inicio: i.toISOString(), fin: f.toISOString() };
  }, [filtro, mesSeleccionado, anioSeleccionado]);

  const cargarRentas = useCallback(async () => {
    setCargando(true);
    const { inicio, fin } = obtenerRango();
    const { data } = await supabase
      .from('renta')
      .select(`*, detalle:detalle_renta(*, consola:id_consola(nombre, marca, modelo))`)
      .eq('estado', 'finalizada')
      .gte('fecha_finalizacion', inicio)
      .lte('fecha_finalizacion', fin)
      .order('fecha_finalizacion', { ascending: false });
    if (data) {
      setRentas(data.map((r: any) => ({
        ...r, detalle: Array.isArray(r.detalle) ? r.detalle[0] || null : r.detalle,
      })) as RentaConDetalle[]);
    }
    setCargando(false);
  }, [obtenerRango]);

  useEffect(() => {
    cargarRentas();
    setSemanaSeleccionada(null);
    setDiaSeleccionado(null);
    setRentaDetalle(null);
  }, [cargarRentas]);

  const totalGeneral = rentas.reduce((s, r) => s + (r.total_final || 0), 0);
  const anios = Array.from({ length: 5 }, (_, i) => new Date().getFullYear() - i);

  const rentasDelDia = (dia: Date) => rentas.filter(r => {
    const ref = r.fecha_finalizacion || r.fecha_creacion;
    if (!ref) return false;
    const d = new Date(ref);
    return d.getFullYear() === dia.getFullYear() && d.getMonth() === dia.getMonth() && d.getDate() === dia.getDate();
  });

  const rentasDeSemana = (inicio: Date, fin: Date) => rentas.filter(r => {
    const ref = r.fecha_finalizacion || r.fecha_creacion;
    if (!ref) return false;
    const d = new Date(ref);
    return d >= inicio && d <= fin;
  });

  const etiquetaFiltro = () => {
    if (filtro === 'dia') return 'Hoy';
    if (filtro === 'semana') return 'Esta Semana';
    if (filtro === 'mes') return 'Este Mes';
    return `${MESES[mesSeleccionado]} ${anioSeleccionado}`;
  };

  const mes = filtro === 'mes_especifico' ? mesSeleccionado : new Date().getMonth();
  const anio = filtro === 'mes_especifico' ? anioSeleccionado : new Date().getFullYear();
  const semanasMes = semanasDelMes(anio, mes);
  const ahora = new Date();
  const iniciSemanaActual = inicioFindeSemana(ahora);
  const finSemanaActual = new Date(iniciSemanaActual); finSemanaActual.setDate(iniciSemanaActual.getDate() + 6); finSemanaActual.setHours(23,59,59,999);
  const diasSemanaActual = diasDeSemana(iniciSemanaActual, finSemanaActual);

  return (
    <div style={{ maxWidth: '960px', margin: '0 auto' }}>
      <PageHeader titulo="💰 Ganancias" descripcion="Consulta el historial de ingresos con desglose detallado." />

      {/* Filtros */}
      <div className="card mb-6">
        <p className="text-xs font-bold uppercase mb-3" style={{ color: 'var(--text-3)', letterSpacing: '0.8px' }}>Período</p>
        <div className="flex gap-2 flex-wrap mb-4">
          {([
            { valor: 'dia', label: 'Hoy' },
            { valor: 'semana', label: 'Esta Semana' },
            { valor: 'mes', label: 'Este Mes' },
            { valor: 'mes_especifico', label: 'Elegir Mes' },
          ] as { valor: Filtro; label: string }[]).map((f) => (
            <button key={f.valor}
              className={filtro === f.valor ? 'btn-primary' : 'btn-outline'}
              style={{ padding: '8px 18px', fontSize: '13px' }}
              onClick={() => { setFiltro(f.valor); setSemanaSeleccionada(null); setDiaSeleccionado(null); }}>
              {f.label}
            </button>
          ))}
        </div>
        {filtro === 'mes_especifico' && (
          <div className="flex gap-3 items-center flex-wrap pt-3" style={{ borderTop: '1px solid var(--border)' }}>
            <div>
              <label className="form-label">Mes</label>
              <select className="form-select" style={{ width: '160px' }} value={mesSeleccionado}
                onChange={(e) => { setMesSeleccionado(Number(e.target.value)); setSemanaSeleccionada(null); setDiaSeleccionado(null); }}>
                {MESES.map((m, i) => <option key={i} value={i}>{m}</option>)}
              </select>
            </div>
            <div>
              <label className="form-label">Año</label>
              <select className="form-select" style={{ width: '110px' }} value={anioSeleccionado}
                onChange={(e) => setAnioSeleccionado(Number(e.target.value))}>
                {anios.map(a => <option key={a} value={a}>{a}</option>)}
              </select>
            </div>
            <div style={{ paddingTop: '20px' }}>
              <button className="btn-primary" onClick={cargarRentas} style={{ padding: '11px 20px', fontSize: '13px' }}>
                🔍 Buscar
              </button>
            </div>
          </div>
        )}
      </div>

      {/* Total general */}
      <div className="card mb-6 flex items-center justify-between"
        style={{ background: 'linear-gradient(135deg, rgba(52,211,153,0.08), rgba(34,211,238,0.06))', border: '1px solid rgba(52,211,153,0.2)' }}>
        <div>
          <p className="text-xs font-bold uppercase" style={{ color: 'var(--text-3)', letterSpacing: '0.8px' }}>
            Total — {etiquetaFiltro()}
          </p>
          <p className="text-4xl font-bold mt-1" style={{ color: 'var(--green)' }}>${totalGeneral.toFixed(2)}</p>
          <p className="text-xs mt-1" style={{ color: 'var(--text-3)' }}>
            {rentas.length} renta{rentas.length !== 1 ? 's' : ''} finalizada{rentas.length !== 1 ? 's' : ''}
          </p>
        </div>
        <div style={{ fontSize: '48px', opacity: 0.3 }}>💰</div>
      </div>

      {cargando ? (
        <div className="empty-state"><p className="empty-state-text">Cargando...</p></div>
      ) : rentas.length === 0 ? (
        <div className="empty-state"><div className="empty-state-icon">💸</div><p className="empty-state-text">No hay ganancias en este período.</p></div>
      ) : (
        <>
          {/* ══ HOY ══ */}
          {filtro === 'dia' && (
            <div className="card-table">
              <div className="card-table-header"><span className="card-table-title">Rentas de Hoy ({rentas.length})</span></div>
              <TablaRentasDetalle rentas={rentas} onDetalle={setRentaDetalle} />
            </div>
          )}

          {/* ══ SEMANA > DÍAS ══ */}
          {filtro === 'semana' && !diaSeleccionado && (
            <div className="card-table">
              <div className="card-table-header"><span className="card-table-title">Días de esta semana</span></div>
              <TablaDias dias={diasSemanaActual} rentasDelDia={rentasDelDia} onSeleccionarDia={setDiaSeleccionado} />
            </div>
          )}

          {/* ══ SEMANA > DÍA > RENTAS ══ */}
          {filtro === 'semana' && diaSeleccionado && (
            <>
              <button className="btn-outline mb-4" style={{ fontSize: '13px', padding: '8px 16px' }}
                onClick={() => { setDiaSeleccionado(null); setRentaDetalle(null); }}>
                ← Volver a la semana
              </button>
              <div className="card-table">
                <div className="card-table-header">
                  <span className="card-table-title">Rentas del {formatFecha(diaSeleccionado)}</span>
                  <span className="badge-info">
                    {rentasDelDia(diaSeleccionado).length} rentas · ${rentasDelDia(diaSeleccionado).reduce((s,r) => s+(r.total_final||0),0).toFixed(2)}
                  </span>
                </div>
                <TablaRentasDetalle rentas={rentasDelDia(diaSeleccionado)} onDetalle={setRentaDetalle} />
              </div>
            </>
          )}

          {/* ══ MES > SEMANAS ══ */}
          {(filtro === 'mes' || filtro === 'mes_especifico') && !semanaSeleccionada && (
            <div className="card-table">
              <div className="card-table-header"><span className="card-table-title">Semanas de {MESES[mes]} {anio}</span></div>
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead><tr>
                    <th className="table-header">Semana</th>
                    <th className="table-header text-center">Rentas</th>
                    <th className="table-header text-right">Total</th>
                    <th className="table-header text-center">Ver Días</th>
                  </tr></thead>
                  <tbody>
                    {semanasMes.map((sem, i) => {
                      const rs = rentasDeSemana(sem.inicio, sem.fin);
                      const total = rs.reduce((s, r) => s + (r.total_final || 0), 0);
                      return (
                        <tr key={i}>
                          <td className="table-cell font-bold" style={{ color: 'var(--text-1)' }}>Semana del {sem.label}</td>
                          <td className="table-cell text-center">{rs.length}</td>
                          <td className="table-cell text-right font-bold" style={{ color: total > 0 ? 'var(--green)' : 'var(--text-3)' }}>
                            ${total.toFixed(2)}
                          </td>
                          <td className="table-cell text-center">
                            {rs.length > 0
                              ? <button className="btn-outline" style={{ padding: '6px 14px', fontSize: '12px' }}
                                  onClick={() => setSemanaSeleccionada({ inicio: sem.inicio, fin: sem.fin })}>Ver Días</button>
                              : <span style={{ color: 'var(--text-3)', fontSize: '12px' }}>Sin rentas</span>}
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {/* ══ MES > SEMANA > DÍAS ══ */}
          {(filtro === 'mes' || filtro === 'mes_especifico') && semanaSeleccionada && !diaSeleccionado && (
            <>
              <button className="btn-outline mb-4" style={{ fontSize: '13px', padding: '8px 16px' }}
                onClick={() => { setSemanaSeleccionada(null); setDiaSeleccionado(null); }}>
                ← Volver a las semanas
              </button>
              <div className="card-table">
                <div className="card-table-header">
                  <span className="card-table-title">
                    Días — {semanaSeleccionada.inicio.toLocaleDateString('es-MX')} al {semanaSeleccionada.fin.toLocaleDateString('es-MX')}
                  </span>
                </div>
                <TablaDias
                  dias={diasDeSemana(semanaSeleccionada.inicio, semanaSeleccionada.fin)}
                  rentasDelDia={rentasDelDia}
                  onSeleccionarDia={setDiaSeleccionado} />
              </div>
            </>
          )}

          {/* ══ MES > SEMANA > DÍA > RENTAS ══ */}
          {(filtro === 'mes' || filtro === 'mes_especifico') && semanaSeleccionada && diaSeleccionado && (
            <>
              <button className="btn-outline mb-4" style={{ fontSize: '13px', padding: '8px 16px' }}
                onClick={() => { setDiaSeleccionado(null); setRentaDetalle(null); }}>
                ← Volver a los días
              </button>
              <div className="card-table">
                <div className="card-table-header">
                  <span className="card-table-title">Rentas del {formatFecha(diaSeleccionado)}</span>
                  <span className="badge-info">
                    {rentasDelDia(diaSeleccionado).length} rentas · ${rentasDelDia(diaSeleccionado).reduce((s,r) => s+(r.total_final||0),0).toFixed(2)}
                  </span>
                </div>
                <TablaRentasDetalle rentas={rentasDelDia(diaSeleccionado)} onDetalle={setRentaDetalle} />
              </div>
            </>
          )}
        </>
      )}

      {/* ══ MODAL DETALLE RENTA ══ */}
      {rentaDetalle && (
        <div className="modal-overlay" onClick={() => setRentaDetalle(null)}>
          <div className="modal-container" onClick={e => e.stopPropagation()} style={{ maxWidth: '520px' }}>

            <div className="flex items-center justify-between mb-6">
              <h2 className="text-xl font-bold" style={{ color: 'var(--text-1)' }}>📋 Detalle de Renta</h2>
              <button onClick={() => setRentaDetalle(null)}
                style={{ background: 'none', border: 'none', fontSize: '24px', cursor: 'pointer', color: 'var(--text-3)' }}>×</button>
            </div>

            <div style={{
              background: 'linear-gradient(135deg, rgba(30,58,138,0.25), rgba(88,28,135,0.2))',
              border: '1px solid rgba(34,211,238,0.2)',
              borderRadius: '16px', overflow: 'hidden', marginBottom: '20px',
            }}>
              {/* Cabecera ticket */}
              <div style={{
                background: 'linear-gradient(135deg, rgba(34,211,238,0.15), rgba(88,28,135,0.15))',
                borderBottom: '1px dashed rgba(34,211,238,0.25)',
                padding: '20px 24px', textAlign: 'center',
              }}>
                <p style={{ fontSize: '11px', letterSpacing: '3px', color: 'var(--cyan)', textTransform: 'uppercase', marginBottom: '4px' }}>
                  🎮 GameHub — Comprobante de Renta
                </p>
                <p style={{ fontSize: '0.8rem', color: 'var(--text-3)' }}>
                  {rentaDetalle.fecha_finalizacion
                    ? new Date(rentaDetalle.fecha_finalizacion).toLocaleDateString('es-MX', { weekday: 'long', day: '2-digit', month: 'long', year: 'numeric' })
                    : '—'}
                </p>
              </div>

              <div style={{ padding: '20px 24px' }}>

                {/* Folio + Consola */}
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px', marginBottom: '16px' }}>
                  <div style={{ background: 'rgba(255,255,255,0.04)', borderRadius: '10px', padding: '12px' }}>
                    <p style={{ fontSize: '10px', color: 'var(--text-3)', textTransform: 'uppercase', letterSpacing: '1px', marginBottom: '4px' }}>Folio</p>
                    <p style={{ fontSize: '0.85rem', fontWeight: 'bold', color: 'var(--cyan)', fontFamily: 'monospace' }}>
                      {rentaDetalle.folio || `#${rentaDetalle.id_renta}`}
                    </p>
                  </div>
                  <div style={{ background: 'rgba(255,255,255,0.04)', borderRadius: '10px', padding: '12px' }}>
                    <p style={{ fontSize: '10px', color: 'var(--text-3)', textTransform: 'uppercase', letterSpacing: '1px', marginBottom: '4px' }}>Consola</p>
                    <p style={{ fontSize: '0.85rem', fontWeight: 'bold', color: 'var(--text-1)' }}>
                      {rentaDetalle.detalle?.consola ? `${rentaDetalle.detalle.consola.marca} ${rentaDetalle.detalle.consola.modelo}` : '—'}
                    </p>
                  </div>
                </div>

                {/* Controles extra */}
                <div style={{ background: 'rgba(255,255,255,0.04)', borderRadius: '10px', padding: '12px', marginBottom: '16px' }}>
                  <p style={{ fontSize: '10px', color: 'var(--text-3)', textTransform: 'uppercase', letterSpacing: '1px', marginBottom: '4px' }}>Controles Extra</p>
                  {(rentaDetalle.detalle?.cantidad_controles_extra || 0) > 0
                    ? <p style={{ fontSize: '0.85rem', fontWeight: 'bold', color: 'var(--yellow)' }}>
                        {rentaDetalle.detalle!.cantidad_controles_extra} control{rentaDetalle.detalle!.cantidad_controles_extra > 1 ? 'es' : ''}{' '}
                        × ${(rentaDetalle.detalle?.precio_control_extra_aplicado || 0).toFixed(2)} ={' '}
                        <span>${((rentaDetalle.detalle?.cantidad_controles_extra || 0) * (rentaDetalle.detalle?.precio_control_extra_aplicado || 0)).toFixed(2)}</span>
                      </p>
                    : <p style={{ fontSize: '0.85rem', color: 'var(--text-3)' }}>Sin controles extra</p>}
                </div>

                {/* Inicio / Fin / Tiempo */}
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '10px', marginBottom: '16px' }}>
                  <div style={{ background: 'rgba(255,255,255,0.04)', borderRadius: '10px', padding: '12px', textAlign: 'center' }}>
                    <p style={{ fontSize: '10px', color: 'var(--text-3)', textTransform: 'uppercase', letterSpacing: '1px', marginBottom: '4px' }}>Inicio</p>
                    <p style={{ fontSize: '0.9rem', fontWeight: 'bold', color: 'var(--text-1)' }}>
                      {rentaDetalle.hora_inicio ? rentaDetalle.hora_inicio.slice(0,5) : '—'}
                    </p>
                  </div>
                  <div style={{ background: 'rgba(255,255,255,0.04)', borderRadius: '10px', padding: '12px', textAlign: 'center' }}>
                    <p style={{ fontSize: '10px', color: 'var(--text-3)', textTransform: 'uppercase', letterSpacing: '1px', marginBottom: '4px' }}>Término</p>
                    <p style={{ fontSize: '0.9rem', fontWeight: 'bold', color: 'var(--text-1)' }}>
                      {rentaDetalle.hora_fin ? rentaDetalle.hora_fin.slice(0,5) : '—'}
                    </p>
                  </div>
                  <div style={{ background: 'rgba(34,211,238,0.08)', borderRadius: '10px', padding: '12px', textAlign: 'center', border: '1px solid rgba(34,211,238,0.15)' }}>
                    <p style={{ fontSize: '10px', color: 'var(--text-3)', textTransform: 'uppercase', letterSpacing: '1px', marginBottom: '4px' }}>Tiempo</p>
                    <p style={{ fontSize: '0.9rem', fontWeight: 'bold', color: 'var(--cyan)' }}>
                      {(() => { const mins = rentaDetalle.minutos_totales_uso || 0; const h = Math.floor(mins/60); const m = mins%60; return h > 0 ? `${h}h ${m}min` : `${m}min`; })()}
                    </p>
                  </div>
                </div>

                {/* Desglose costos */}
                <div style={{ borderTop: '1px dashed rgba(34,211,238,0.2)', paddingTop: '14px', marginBottom: '14px' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '8px' }}>
                    <div>
                      <span style={{ fontSize: '0.85rem', color: 'var(--text-3)' }}>Costo de tiempo</span>
                      <span style={{ marginLeft: '8px', fontSize: '10px', padding: '2px 8px', borderRadius: '20px', background: 'rgba(34,211,238,0.1)', color: 'var(--cyan)', border: '1px solid rgba(34,211,238,0.2)' }}>
                        ${(rentaDetalle.detalle?.precio_hora_aplicado || 0).toFixed(2)}/hr
                      </span>
                    </div>
                    <span style={{ fontSize: '0.9rem', fontWeight: 'bold', color: 'var(--text-1)' }}>
                      ${((rentaDetalle.total_final || 0) - ((rentaDetalle.detalle?.cantidad_controles_extra || 0) * (rentaDetalle.detalle?.precio_control_extra_aplicado || 0))).toFixed(2)}
                    </span>
                  </div>
                  {(rentaDetalle.detalle?.cantidad_controles_extra || 0) > 0 && (
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '8px' }}>
                      <span style={{ fontSize: '0.85rem', color: 'var(--text-3)' }}>Costo controles extra</span>
                      <span style={{ fontSize: '0.9rem', fontWeight: 'bold', color: 'var(--yellow)' }}>
                        +${((rentaDetalle.detalle?.cantidad_controles_extra || 0) * (rentaDetalle.detalle?.precio_control_extra_aplicado || 0)).toFixed(2)}
                      </span>
                    </div>
                  )}
                </div>

                {/* Total */}
                <div style={{
                  background: 'linear-gradient(135deg, rgba(52,211,153,0.12), rgba(34,211,238,0.08))',
                  border: '1px solid rgba(52,211,153,0.25)',
                  borderRadius: '12px', padding: '16px 20px',
                  display: 'flex', justifyContent: 'space-between', alignItems: 'center',
                }}>
                  <span style={{ fontSize: '1rem', fontWeight: 'bold', color: 'var(--text-1)' }}>TOTAL COBRADO</span>
                  <span style={{ fontSize: '1.8rem', fontWeight: 'bold', color: 'var(--green)', lineHeight: 1 }}>
                    ${(rentaDetalle.total_final || 0).toFixed(2)}
                  </span>
                </div>

                <p style={{ textAlign: 'center', fontSize: '0.8rem', color: 'var(--text-3)', marginTop: '16px', letterSpacing: '0.5px' }}>
                  ✨ ¡Gracias por su visita! · GameHub
                </p>
              </div>
            </div>

            <button className="btn-outline w-full" onClick={() => setRentaDetalle(null)}>← Cerrar</button>
          </div>
        </div>
      )}
    </div>
  );
}

// ── Subcomponente tabla de días ──
function TablaDias({ dias, rentasDelDia, onSeleccionarDia }: {
  dias: Date[];
  rentasDelDia: (d: Date) => RentaConDetalle[];
  onSeleccionarDia: (d: Date) => void;
}) {
  return (
    <div className="overflow-x-auto">
      <table className="w-full">
        <thead><tr>
          <th className="table-header">Día</th>
          <th className="table-header text-center">Rentas</th>
          <th className="table-header text-right">Total</th>
          <th className="table-header text-center">Ver Rentas</th>
        </tr></thead>
        <tbody>
          {dias.map((dia, i) => {
            const rd = rentasDelDia(dia);
            const total = rd.reduce((s, r) => s + (r.total_final || 0), 0);
            const esHoy = dia.toDateString() === new Date().toDateString();
            return (
              <tr key={i}>
                <td className="table-cell font-bold" style={{ color: esHoy ? 'var(--cyan)' : 'var(--text-1)' }}>
                  {formatFecha(dia)}
                  {esHoy && <span className="badge-info" style={{ marginLeft: 8 }}>Hoy</span>}
                </td>
                <td className="table-cell text-center">{rd.length}</td>
                <td className="table-cell text-right font-bold" style={{ color: total > 0 ? 'var(--green)' : 'var(--text-3)' }}>
                  ${total.toFixed(2)}
                </td>
                <td className="table-cell text-center">
                  {rd.length > 0
                    ? <button className="btn-outline" style={{ padding: '6px 14px', fontSize: '12px' }}
                        onClick={() => onSeleccionarDia(dia)}>Ver Rentas</button>
                    : <span style={{ color: 'var(--text-3)', fontSize: '12px' }}>Sin rentas</span>}
                </td>
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );
}

// ── Subcomponente tabla de rentas ──
function TablaRentasDetalle({ rentas, onDetalle }: { rentas: RentaConDetalle[]; onDetalle: (r: RentaConDetalle) => void }) {
  if (rentas.length === 0) return (
    <div className="empty-state"><div className="empty-state-icon">💸</div><p className="empty-state-text">Sin rentas este día.</p></div>
  );
  return (
    <div className="overflow-x-auto">
      <table className="w-full">
        <thead><tr>
          <th className="table-header">Folio</th>
          <th className="table-header">Consola</th>
          <th className="table-header">Inicio</th>
          <th className="table-header">Fin</th>
          <th className="table-header text-center">Duración</th>
          <th className="table-header text-center">Ctrl. Extra</th>
          <th className="table-header text-right">Total</th>
          <th className="table-header text-center">Detalle</th>
        </tr></thead>
        <tbody>
          {rentas.map(r => (
            <tr key={r.id_renta}>
              <td className="table-cell font-mono text-xs">{r.folio || `#${r.id_renta}`}</td>
              <td className="table-cell font-bold" style={{ color: 'var(--text-1)' }}>
                {r.detalle?.consola ? `${r.detalle.consola.marca} ${r.detalle.consola.modelo}` : '—'}
              </td>
              <td className="table-cell">{r.hora_inicio ? r.hora_inicio.slice(0,5) : '—'}</td>
              <td className="table-cell">{r.hora_fin ? r.hora_fin.slice(0,5) : '—'}</td>
              <td className="table-cell text-center">{r.minutos_totales_uso || 0} min</td>
              <td className="table-cell text-center">
                {r.detalle?.cantidad_controles_extra
                  ? <span className="badge-warning">+{r.detalle.cantidad_controles_extra}</span>
                  : <span style={{ color: 'var(--text-3)' }}>—</span>}
              </td>
              <td className="table-cell text-right font-bold" style={{ color: 'var(--green)' }}>
                ${(r.total_final || 0).toFixed(2)}
              </td>
              <td className="table-cell text-center">
                <button className="btn-outline" style={{ padding: '6px 14px', fontSize: '12px' }}
                  onClick={() => onDetalle(r)}>Ver Detalle</button>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
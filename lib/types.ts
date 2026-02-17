export interface Usuario {
  id_usuario: number;
  nombre: string;
  apellido: string;
  email: string;
  contrasena: string;
  rol: 'empleado' | 'gerente';
  activo: boolean;
  creado_por?: number;
  foto_url?: string;
  fecha_creacion: string;
  fecha_modificacion?: string;
}

export interface Consola {
  id_consola: number;
  nombre: string;
  modelo: string;
  marca: string;
  numero_serie: string;
  controles_incluidos: number;
  controles_maximos: number;
  estado: string;
  fecha_adquisicion?: string;
  observaciones?: string;
  almacenamiento?: string;
  fecha_creacion?: string;
  fecha_modificacion?: string;
}

export interface Renta {
  id_renta: number;
  folio?: string;
  numero_cubiculo?: string;
  id_empleado: number;
  fecha_renta?: string;
  hora_inicio?: string;
  hora_fin?: string;
  minutos_totales_uso?: number;
  total_base?: number;
  descuento?: number;
  total_final?: number;
  anticipo?: number;
  saldo_pendiente?: number;
  estado: string;
  observaciones?: string;
  fecha_creacion?: string;
  fecha_finalizacion?: string;
}

export interface DetalleRenta {
  id_detalle: number;
  id_renta: number;
  id_consola: number;
  cantidad_controles_extra: number;
  precio_hora_aplicado: number;
  precio_control_extra_aplicado: number;
  subtotal: number;
  observaciones?: string;
  consola?: Consola;
}

export interface RentaConDetalle extends Renta {
  detalle: (DetalleRenta & { consola: Consola | null }) | null;
}

export interface Reparacion {
  id_reparacion: number;
  tipo_equipo: string;
  id_equipo?: number;
  descripcion_falla: string;
  fecha_ingreso?: string;
  fecha_estimada_salida?: string;
  fecha_fin?: string;
  estado: string;
  marca?: string;
  modelo?: string;
  numero_serie?: string;
  nombre_equipo?: string;
}

export interface Precio {
  id_config: number;
  precio_hora: number;
  precio_control_extra: number;
  activo: boolean;
  fecha_vigencia_inicio?: string;
  fecha_vigencia_fin?: string;
  modificado_por?: number;
  fecha_modificacion?: string;
}
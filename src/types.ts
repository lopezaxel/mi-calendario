export type Categoria = 'suscripcion' | 'impuesto' | 'servicio' | 'otro'
export type Moneda = 'USD' | 'ARS'

export interface Pago {
  id: string
  nombre: string
  monto: number | null
  moneda: Moneda
  dia_vencimiento: number
  es_recurrente: boolean
  categoria: Categoria
  activo: boolean
  created_at: string
}

export interface RegistroPago {
  id: string
  pago_id: string
  mes: number
  año: number
  pagado: boolean
  monto: number | null
  fecha_pago_real: string | null
  created_at: string
}

export interface PagoConRegistro extends Pago {
  registro: RegistroPago | null
}

export interface Evento {
  id: string
  titulo: string
  descripcion: string | null
  dia: number
  mes: number | null
  año: number | null
  es_recurrente: boolean
  activo: boolean
  created_at: string
}

export type ItemDetalle =
  | { tipo: 'pago'; item: PagoConRegistro }
  | { tipo: 'evento'; item: Evento }

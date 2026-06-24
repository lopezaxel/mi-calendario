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
  fecha_pago_real: string | null
  created_at: string
}

export interface PagoConRegistro extends Pago {
  registro: RegistroPago | null
}

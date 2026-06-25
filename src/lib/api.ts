import { supabase } from './supabase'
import type { Pago, RegistroPago, PagoConRegistro, Categoria, Moneda } from '../types'

export async function getPagosDelMes(mes: number, año: number): Promise<PagoConRegistro[]> {
  const { data: pagos, error: pagosError } = await supabase
    .from('calendario_pagos')
    .select('*')
    .eq('activo', true)
    .order('dia_vencimiento', { ascending: true })

  if (pagosError) throw pagosError

  const { data: registros, error: registrosError } = await supabase
    .from('calendario_pagos_registro')
    .select('*')
    .eq('mes', mes)
    .eq('año', año)

  if (registrosError) throw registrosError

  const registroMap = new Map<string, RegistroPago>()
  for (const r of registros ?? []) {
    registroMap.set(r.pago_id, r)
  }

  return (pagos ?? [])
    .filter((pago: Pago) => pago.es_recurrente || registroMap.has(pago.id))
    .map((pago: Pago) => ({
      ...pago,
      registro: registroMap.get(pago.id) ?? null,
    }))
}

export async function crearPago(
  data: {
    nombre: string
    monto: number | null
    moneda: Moneda
    dia_vencimiento: number
    es_recurrente: boolean
    categoria: Categoria
  },
  mes: number,
  año: number,
): Promise<Pago> {
  const { data: pago, error } = await supabase
    .from('calendario_pagos')
    .insert({ ...data, activo: true })
    .select()
    .single()

  if (error) throw error

  // Los pagos no recurrentes solo existen en el mes en que se crean
  if (!data.es_recurrente) {
    const { error: regError } = await supabase
      .from('calendario_pagos_registro')
      .insert({ pago_id: pago.id, mes, año, pagado: false, monto: null })
    if (regError) throw regError
  }

  return pago
}

export async function marcarPagado(
  pagoId: string,
  mes: number,
  año: number,
  pagado: boolean,
): Promise<void> {
  const { data: existing } = await supabase
    .from('calendario_pagos_registro')
    .select('id')
    .eq('pago_id', pagoId)
    .eq('mes', mes)
    .eq('año', año)
    .maybeSingle()

  if (existing) {
    const { error } = await supabase
      .from('calendario_pagos_registro')
      .update({ pagado, fecha_pago_real: pagado ? new Date().toISOString().split('T')[0] : null })
      .eq('id', existing.id)
    if (error) throw error
  } else {
    const { error } = await supabase.from('calendario_pagos_registro').insert({
      pago_id: pagoId,
      mes,
      año,
      pagado,
      fecha_pago_real: pagado ? new Date().toISOString().split('T')[0] : null,
    })
    if (error) throw error
  }
}

export async function actualizarMonto(
  pagoId: string,
  mes: number,
  año: number,
  monto: number | null,
): Promise<void> {
  const { data: existing } = await supabase
    .from('calendario_pagos_registro')
    .select('id')
    .eq('pago_id', pagoId)
    .eq('mes', mes)
    .eq('año', año)
    .maybeSingle()

  if (existing) {
    const { error } = await supabase
      .from('calendario_pagos_registro')
      .update({ monto })
      .eq('id', existing.id)
    if (error) throw error
  } else {
    const { error } = await supabase
      .from('calendario_pagos_registro')
      .insert({ pago_id: pagoId, mes, año, pagado: false, monto })
    if (error) throw error
  }
}

export async function eliminarPago(id: string): Promise<void> {
  const { error } = await supabase
    .from('calendario_pagos')
    .update({ activo: false })
    .eq('id', id)
  if (error) throw error
}

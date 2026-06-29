import { useState } from 'react'
import { Check, RefreshCw } from 'lucide-react'
import { cn } from '@/lib/utils'
import type { PagoConRegistro, Evento, ItemDetalle } from '@/types'

const DIAS_SEMANA = ['Lun', 'Mar', 'Mié', 'Jue', 'Vie', 'Sáb', 'Dom']

const CATEGORIA_COLOR: Record<string, string> = {
  suscripcion: 'bg-violet-900/60 text-violet-300 border-violet-800/50',
  impuesto:    'bg-amber-900/60  text-amber-300  border-amber-800/50',
  servicio:    'bg-blue-900/60   text-blue-300   border-blue-800/50',
  otro:        'bg-zinc-800      text-zinc-300   border-zinc-700',
}

const CATEGORIA_LABEL: Record<string, string> = {
  suscripcion: 'Suscripción',
  impuesto: 'Impuesto',
  servicio: 'Servicio',
  otro: 'Otro',
}

interface TooltipData {
  x: number
  y: number
  item: ItemDetalle
}

interface Props {
  pagos: PagoConRegistro[]
  eventos: Evento[]
  mes: number
  año: number
  onClickItem: (item: ItemDetalle) => void
}

export function CalendarView({ pagos, eventos, mes, año, onClickItem }: Props) {
  const [tooltip, setTooltip] = useState<TooltipData | null>(null)

  const hoy = new Date()
  const diaHoy = hoy.getDate()
  const mesHoy = hoy.getMonth() + 1
  const añoHoy = hoy.getFullYear()
  const esMesActual = mes === mesHoy && año === añoHoy

  const primerDiaSemana = (new Date(año, mes - 1, 1).getDay() + 6) % 7
  const diasEnMes = new Date(año, mes, 0).getDate()

  const pagosPorDia = new Map<number, PagoConRegistro[]>()
  for (const pago of pagos) {
    const d = pago.dia_vencimiento
    if (!pagosPorDia.has(d)) pagosPorDia.set(d, [])
    pagosPorDia.get(d)!.push(pago)
  }

  const eventosPorDia = new Map<number, Evento[]>()
  for (const evento of eventos) {
    const d = evento.dia
    if (!eventosPorDia.has(d)) eventosPorDia.set(d, [])
    eventosPorDia.get(d)!.push(evento)
  }

  const totalCeldas = primerDiaSemana + diasEnMes
  const filas = Math.ceil(totalCeldas / 7)

  function showTooltip(e: React.MouseEvent, item: ItemDetalle) {
    setTooltip({ x: e.clientX, y: e.clientY, item })
  }

  return (
    <div className="select-none">
      {/* Cabecera días de semana */}
      <div className="grid grid-cols-7 mb-1">
        {DIAS_SEMANA.map(d => (
          <div key={d} className="text-center text-xs font-medium text-zinc-600 py-1">
            {d}
          </div>
        ))}
      </div>

      {/* Grid de días */}
      <div className="grid grid-cols-7 gap-px bg-zinc-800 rounded-xl overflow-hidden border border-zinc-800">
        {Array.from({ length: filas * 7 }, (_, i) => {
          const dia = i - primerDiaSemana + 1
          const fuera = dia < 1 || dia > diasEnMes
          const esHoy = esMesActual && dia === diaHoy
          const pagosDia = pagosPorDia.get(dia) ?? []
          const eventosDia = eventosPorDia.get(dia) ?? []
          const tieneVencido = pagosDia.some(
            p => !p.registro?.pagado && esMesActual && dia < diaHoy,
          )

          return (
            <div
              key={i}
              className={cn(
                'bg-zinc-950 min-h-[120px] p-1.5 flex flex-col gap-1',
                fuera && 'bg-zinc-950/50',
              )}
            >
              {!fuera && (
                <>
                  <span className={cn(
                    'text-xs font-medium w-6 h-6 flex items-center justify-center rounded-full self-end shrink-0',
                    esHoy
                      ? 'bg-violet-600 text-white'
                      : tieneVencido
                        ? 'text-red-400'
                        : 'text-zinc-500',
                  )}>
                    {dia}
                  </span>

                  {pagosDia.map(pago => {
                    const pagado = pago.registro?.pagado ?? false
                    const esVencido = !pagado && esMesActual && dia < diaHoy
                    const itemDetalle: ItemDetalle = { tipo: 'pago', item: pago }
                    return (
                      <button
                        key={pago.id}
                        onClick={() => onClickItem(itemDetalle)}
                        onMouseMove={(e) => showTooltip(e, itemDetalle)}
                        onMouseLeave={() => setTooltip(null)}
                        className={cn(
                          'w-full flex items-center gap-1 px-1.5 py-0.5 rounded text-left border text-xs leading-snug hover:opacity-75 transition-opacity',
                          pagado
                            ? 'bg-emerald-950/60 text-emerald-500 border-emerald-900/50 opacity-60 line-through'
                            : esVencido
                              ? 'bg-red-950/60 text-red-400 border-red-900/50'
                              : CATEGORIA_COLOR[pago.categoria],
                        )}
                      >
                        {pagado && <Check size={8} className="shrink-0" />}
                        <span className="truncate">{pago.nombre}</span>
                      </button>
                    )
                  })}

                  {eventosDia.map(evento => {
                    const itemDetalle: ItemDetalle = { tipo: 'evento', item: evento }
                    return (
                      <button
                        key={evento.id}
                        onClick={() => onClickItem(itemDetalle)}
                        onMouseMove={(e) => showTooltip(e, itemDetalle)}
                        onMouseLeave={() => setTooltip(null)}
                        className="w-full flex items-center gap-1 px-1.5 py-0.5 rounded text-left border text-xs leading-snug bg-teal-900/60 text-teal-300 border-teal-800/50 hover:opacity-75 transition-opacity"
                      >
                        {evento.es_recurrente && <RefreshCw size={7} className="shrink-0" />}
                        <span className="truncate">{evento.titulo}</span>
                      </button>
                    )
                  })}
                </>
              )}
            </div>
          )
        })}
      </div>

      {/* Leyenda */}
      <div className="flex flex-wrap gap-x-4 gap-y-1 mt-3">
        {[
          { label: 'Suscripción', cls: 'bg-violet-900/60 border-violet-800/50' },
          { label: 'Impuesto',    cls: 'bg-amber-900/60  border-amber-800/50' },
          { label: 'Servicio',    cls: 'bg-blue-900/60   border-blue-800/50' },
          { label: 'Otro',        cls: 'bg-zinc-800      border-zinc-700' },
          { label: 'Evento',      cls: 'bg-teal-900/60   border-teal-800/50' },
          { label: 'Pagado',      cls: 'bg-emerald-950/60 border-emerald-900/50' },
          { label: 'Vencido',     cls: 'bg-red-950/60    border-red-900/50' },
        ].map(({ label, cls }) => (
          <span key={label} className="flex items-center gap-1.5 text-[10px] text-zinc-500">
            <span className={cn('w-2.5 h-2.5 rounded-sm border', cls)} />
            {label}
          </span>
        ))}
      </div>

      {/* Tooltip flotante */}
      {tooltip && (
        <div
          style={{ position: 'fixed', left: tooltip.x + 14, top: tooltip.y + 14, zIndex: 9999 }}
          className="pointer-events-none bg-zinc-800 border border-zinc-700 rounded-lg px-3 py-2 shadow-2xl max-w-[220px] space-y-1"
        >
          {tooltip.item.tipo === 'pago'
            ? <TooltipPago pago={tooltip.item.item} mes={mes} año={año} />
            : <TooltipEvento evento={tooltip.item.item} />
          }
        </div>
      )}
    </div>
  )
}

function TooltipPago({ pago, mes, año }: { pago: PagoConRegistro; mes: number; año: number }) {
  const pagado = pago.registro?.pagado ?? false
  const montoDelMes = pago.registro?.monto ?? pago.monto
  const montoFmt = montoDelMes != null
    ? `${pago.moneda === 'USD' ? 'U$S' : '$'} ${montoDelMes.toLocaleString('es-AR')}`
    : 'Monto variable'
  const hoy = new Date()
  const esVencido = !pagado
    && mes === hoy.getMonth() + 1
    && año === hoy.getFullYear()
    && pago.dia_vencimiento < hoy.getDate()

  return (
    <>
      <p className="text-xs font-medium text-white">{pago.nombre}</p>
      <p className={cn(
        'text-xs font-mono',
        pago.moneda === 'USD' ? 'text-emerald-400' : 'text-zinc-300',
      )}>
        {montoFmt}
      </p>
      <p className="text-[11px] text-zinc-400">
        {CATEGORIA_LABEL[pago.categoria]} · Día {pago.dia_vencimiento}
      </p>
      <p className={cn(
        'text-[11px] font-medium',
        pagado ? 'text-emerald-400' : esVencido ? 'text-red-400' : 'text-zinc-500',
      )}>
        {pagado ? '✓ Pagado' : esVencido ? '⚠ Vencido' : 'Pendiente'}
      </p>
    </>
  )
}

function TooltipEvento({ evento }: { evento: Evento }) {
  return (
    <>
      <p className="text-xs font-medium text-white">{evento.titulo}</p>
      {evento.descripcion && (
        <p className="text-[11px] text-zinc-400 leading-relaxed">{evento.descripcion}</p>
      )}
      <p className="text-[11px] text-zinc-500">
        Día {evento.dia}{evento.es_recurrente ? ' · Mensual' : ''}
      </p>
    </>
  )
}

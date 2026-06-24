import { useState } from 'react'
import { Check } from 'lucide-react'
import { cn } from '@/lib/utils'
import { marcarPagado } from '@/lib/api'
import type { PagoConRegistro } from '@/types'

const DIAS_SEMANA = ['Lun', 'Mar', 'Mié', 'Jue', 'Vie', 'Sáb', 'Dom']

const CATEGORIA_COLOR: Record<string, string> = {
  suscripcion: 'bg-violet-900/60 text-violet-300 border-violet-800/50',
  impuesto:    'bg-amber-900/60  text-amber-300  border-amber-800/50',
  servicio:    'bg-blue-900/60   text-blue-300   border-blue-800/50',
  otro:        'bg-zinc-800      text-zinc-300   border-zinc-700',
}

interface PildoraPagoProps {
  pago: PagoConRegistro
  mes: number
  año: number
  esVencido: boolean
  onActualizar: () => void
}

function PildoraPago({ pago, mes, año, esVencido, onActualizar }: PildoraPagoProps) {
  const [loading, setLoading] = useState(false)
  const pagado = pago.registro?.pagado ?? false

  async function toggle(e: React.MouseEvent) {
    e.stopPropagation()
    setLoading(true)
    try {
      await marcarPagado(pago.id, mes, año, !pagado)
      onActualizar()
    } finally {
      setLoading(false)
    }
  }

  return (
    <button
      onClick={toggle}
      disabled={loading}
      title={`${pago.nombre} — ${pagado ? 'Marcar pendiente' : 'Marcar pagado'}`}
      className={cn(
        'w-full flex items-center gap-1 px-1.5 py-0.5 rounded text-left border transition-opacity text-[10px] leading-tight',
        pagado
          ? 'bg-emerald-950/60 text-emerald-500 border-emerald-900/50 opacity-60 line-through'
          : esVencido
            ? 'bg-red-950/60 text-red-400 border-red-900/50'
            : CATEGORIA_COLOR[pago.categoria],
        loading && 'opacity-40 cursor-wait',
      )}
    >
      {pagado && <Check size={8} className="shrink-0" />}
      <span className="truncate">{pago.nombre}</span>
    </button>
  )
}

interface Props {
  pagos: PagoConRegistro[]
  mes: number
  año: number
  onActualizar: () => void
}

export function CalendarView({ pagos, mes, año, onActualizar }: Props) {
  const hoy = new Date()
  const diaHoy = hoy.getDate()
  const mesHoy = hoy.getMonth() + 1
  const añoHoy = hoy.getFullYear()
  const esMesActual = mes === mesHoy && año === añoHoy

  // Primer día del mes: getDay() devuelve 0=Dom … 6=Sab
  // Convertimos a semana lunes-primero: (getDay() + 6) % 7 → 0=Lun … 6=Dom
  const primerDiaSemana = (new Date(año, mes - 1, 1).getDay() + 6) % 7
  const diasEnMes = new Date(año, mes, 0).getDate()

  // Mapa: día → pagos de ese día
  const pagosPorDia = new Map<number, PagoConRegistro[]>()
  for (const pago of pagos) {
    const d = pago.dia_vencimiento
    if (!pagosPorDia.has(d)) pagosPorDia.set(d, [])
    pagosPorDia.get(d)!.push(pago)
  }

  // Celdas: vacías al inicio + días del mes
  const totalCeldas = primerDiaSemana + diasEnMes
  const filas = Math.ceil(totalCeldas / 7)

  return (
    <div className="select-none">
      {/* Cabecera días de semana */}
      <div className="grid grid-cols-7 mb-1">
        {DIAS_SEMANA.map(d => (
          <div key={d} className="text-center text-[11px] font-medium text-zinc-600 py-1">
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
          const tieneVencido = pagosDia.some(
            p => !p.registro?.pagado && esMesActual && dia < diaHoy,
          )

          return (
            <div
              key={i}
              className={cn(
                'bg-zinc-950 min-h-[80px] p-1.5 flex flex-col gap-1',
                fuera && 'bg-zinc-950/50',
              )}
            >
              {!fuera && (
                <>
                  <span
                    className={cn(
                      'text-xs font-medium w-6 h-6 flex items-center justify-center rounded-full self-end',
                      esHoy
                        ? 'bg-violet-600 text-white'
                        : tieneVencido
                          ? 'text-red-400'
                          : 'text-zinc-500',
                    )}
                  >
                    {dia}
                  </span>
                  {pagosDia.map(pago => (
                    <PildoraPago
                      key={pago.id}
                      pago={pago}
                      mes={mes}
                      año={año}
                      esVencido={esMesActual && dia < diaHoy && !(pago.registro?.pagado)}
                      onActualizar={onActualizar}
                    />
                  ))}
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
          { label: 'Pagado',      cls: 'bg-emerald-950/60 border-emerald-900/50' },
          { label: 'Vencido',     cls: 'bg-red-950/60    border-red-900/50' },
        ].map(({ label, cls }) => (
          <span key={label} className="flex items-center gap-1.5 text-[10px] text-zinc-500">
            <span className={cn('w-2.5 h-2.5 rounded-sm border', cls)} />
            {label}
          </span>
        ))}
      </div>
    </div>
  )
}

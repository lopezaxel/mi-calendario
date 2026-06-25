import { useState } from 'react'
import { Check, Trash2, RefreshCw, Pencil } from 'lucide-react'
import { cn } from '@/lib/utils'
import { marcarPagado, eliminarPago, actualizarMonto } from '@/lib/api'
import type { PagoConRegistro } from '@/types'

const CATEGORIA_LABEL: Record<string, string> = {
  suscripcion: 'Suscripción',
  impuesto: 'Impuesto',
  servicio: 'Servicio',
  otro: 'Otro',
}

interface Props {
  pago: PagoConRegistro
  mes: number
  año: number
  hoy: number
  onActualizar: () => void
}

export function FilaPago({ pago, mes, año, hoy, onActualizar }: Props) {
  const [loadingCheck, setLoadingCheck] = useState(false)
  const [loadingDel, setLoadingDel] = useState(false)
  const [editandoMonto, setEditandoMonto] = useState(false)
  const [montoInput, setMontoInput] = useState('')
  const [loadingMonto, setLoadingMonto] = useState(false)

  const pagado = pago.registro?.pagado ?? false
  const montoDelMes = pago.registro?.monto ?? pago.monto

  const ahora = new Date()
  const mesActual = ahora.getMonth() + 1
  const añoActual = ahora.getFullYear()
  const esVencido = !pagado && mes === mesActual && año === añoActual && pago.dia_vencimiento < hoy

  async function togglePagado() {
    setLoadingCheck(true)
    try {
      await marcarPagado(pago.id, mes, año, !pagado)
      onActualizar()
    } finally {
      setLoadingCheck(false)
    }
  }

  async function handleEliminar() {
    if (!confirm(`¿Eliminar "${pago.nombre}"?`)) return
    setLoadingDel(true)
    try {
      await eliminarPago(pago.id)
      onActualizar()
    } finally {
      setLoadingDel(false)
    }
  }

  function abrirEditorMonto() {
    setMontoInput(montoDelMes != null ? String(montoDelMes) : '')
    setEditandoMonto(true)
  }

  async function guardarMonto() {
    const valor = montoInput.trim() === '' ? null : parseFloat(montoInput)
    if (valor !== null && isNaN(valor)) return
    setLoadingMonto(true)
    try {
      await actualizarMonto(pago.id, mes, año, valor)
      onActualizar()
    } finally {
      setLoadingMonto(false)
      setEditandoMonto(false)
    }
  }

  const montoFmt = montoDelMes != null
    ? `${pago.moneda === 'USD' ? 'U$S' : '$'} ${montoDelMes.toLocaleString('es-AR')}`
    : '—'

  const esMontoVariable = pago.monto === null

  return (
    <div
      className={cn(
        'flex items-center gap-4 px-4 py-3 rounded-xl border transition-colors',
        pagado
          ? 'border-zinc-800 bg-zinc-900/40 opacity-60'
          : esVencido
            ? 'border-red-900/60 bg-red-950/20'
            : 'border-zinc-800 bg-zinc-900',
      )}
    >
      {/* Día */}
      <div className="w-8 text-center shrink-0">
        <span className={cn(
          'text-lg font-semibold',
          esVencido ? 'text-red-400' : pagado ? 'text-zinc-600' : 'text-zinc-300',
        )}>
          {pago.dia_vencimiento}
        </span>
      </div>

      {/* Info */}
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2">
          <span className={cn(
            'font-medium text-sm truncate',
            pagado ? 'line-through text-zinc-500' : 'text-white',
          )}>
            {pago.nombre}
          </span>
          {pago.es_recurrente && (
            <RefreshCw size={12} className="text-zinc-600 shrink-0" />
          )}
        </div>
        <div className="flex items-center gap-2 mt-0.5">
          <span className="text-xs text-zinc-500">{CATEGORIA_LABEL[pago.categoria]}</span>
          <span className="text-xs text-zinc-700">·</span>
          {editandoMonto ? (
            <div className="flex items-center gap-1">
              <input
                type="number"
                min="0"
                step="0.01"
                autoFocus
                className="w-24 bg-zinc-800 border border-zinc-600 rounded px-2 py-0.5 text-xs text-white outline-none focus:border-violet-500"
                placeholder="monto..."
                value={montoInput}
                onChange={(e) => setMontoInput(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === 'Enter') guardarMonto()
                  if (e.key === 'Escape') setEditandoMonto(false)
                }}
              />
              <button
                onClick={guardarMonto}
                disabled={loadingMonto}
                className="text-xs text-violet-400 hover:text-violet-300 px-1"
              >
                {loadingMonto ? '...' : 'OK'}
              </button>
              <button
                onClick={() => setEditandoMonto(false)}
                className="text-xs text-zinc-600 hover:text-zinc-400 px-1"
              >
                ✕
              </button>
            </div>
          ) : (
            <div className="flex items-center gap-1">
              <span className={cn(
                'text-xs font-mono',
                pago.moneda === 'USD' ? 'text-emerald-500' : 'text-zinc-400',
              )}>
                {montoFmt}
              </span>
              {esMontoVariable && (
                <button
                  onClick={abrirEditorMonto}
                  title="Editar monto de este mes"
                  className="text-zinc-600 hover:text-zinc-400 transition-colors"
                >
                  <Pencil size={10} />
                </button>
              )}
            </div>
          )}
        </div>
      </div>

      {/* Estado badge */}
      <div className="shrink-0">
        {pagado ? (
          <span className="text-xs text-emerald-600 font-medium">Pagado</span>
        ) : esVencido ? (
          <span className="text-xs text-red-400 font-medium">Vencido</span>
        ) : (
          <span className="text-xs text-zinc-500">Pendiente</span>
        )}
      </div>

      {/* Acciones */}
      <div className="flex items-center gap-1 shrink-0">
        <button
          onClick={togglePagado}
          disabled={loadingCheck}
          className={cn(
            'w-8 h-8 rounded-lg flex items-center justify-center transition-colors',
            pagado
              ? 'bg-emerald-900/40 text-emerald-400 hover:bg-emerald-900/60'
              : 'bg-zinc-800 text-zinc-500 hover:bg-zinc-700 hover:text-white',
          )}
          title={pagado ? 'Desmarcar' : 'Marcar como pagado'}
        >
          <Check size={14} />
        </button>
        <button
          onClick={handleEliminar}
          disabled={loadingDel}
          className="w-8 h-8 rounded-lg flex items-center justify-center bg-zinc-800 text-zinc-600 hover:bg-red-900/40 hover:text-red-400 transition-colors"
          title="Eliminar"
        >
          <Trash2 size={14} />
        </button>
      </div>
    </div>
  )
}

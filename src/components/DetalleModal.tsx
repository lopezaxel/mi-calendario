import { useState } from 'react'
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { RefreshCw, Check, Trash2 } from 'lucide-react'
import { cn } from '@/lib/utils'
import { marcarPagado, eliminarPago, eliminarEvento } from '@/lib/api'
import type { ItemDetalle } from '@/types'

const CATEGORIA_LABEL: Record<string, string> = {
  suscripcion: 'Suscripción',
  impuesto: 'Impuesto',
  servicio: 'Servicio',
  otro: 'Otro',
}

interface Props {
  item: ItemDetalle | null
  mes: number
  año: number
  onClose: () => void
  onActualizar: () => void
}

export function DetalleModal({ item, mes, año, onClose, onActualizar }: Props) {
  const [loadingPago, setLoadingPago] = useState(false)
  const [loadingDel, setLoadingDel] = useState(false)

  async function handleTogglePago() {
    if (item?.tipo !== 'pago') return
    const pagado = item.item.registro?.pagado ?? false
    setLoadingPago(true)
    try {
      await marcarPagado(item.item.id, mes, año, !pagado)
      onActualizar()
      onClose()
    } finally {
      setLoadingPago(false)
    }
  }

  async function handleEliminar() {
    if (!item) return
    const nombre = item.tipo === 'pago' ? item.item.nombre : item.item.titulo
    if (!confirm(`¿Eliminar "${nombre}"?`)) return
    setLoadingDel(true)
    try {
      if (item.tipo === 'pago') await eliminarPago(item.item.id)
      else await eliminarEvento(item.item.id)
      onActualizar()
      onClose()
    } finally {
      setLoadingDel(false)
    }
  }

  return (
    <Dialog open={item !== null} onOpenChange={(v) => { if (!v) onClose() }}>
      <DialogContent className="bg-zinc-900 border-zinc-800 text-white max-w-sm">
        {item?.tipo === 'pago' && (() => {
          const pago = item.item
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
              <DialogHeader>
                <DialogTitle className="text-white flex items-center gap-2">
                  {pago.nombre}
                  {pago.es_recurrente && <RefreshCw size={14} className="text-zinc-500" />}
                </DialogTitle>
              </DialogHeader>
              <div className="flex flex-col gap-3 mt-2">
                <Row label="Estado">
                  <span className={cn(
                    'font-medium',
                    pagado ? 'text-emerald-400' : esVencido ? 'text-red-400' : 'text-zinc-300',
                  )}>
                    {pagado ? 'Pagado' : esVencido ? 'Vencido' : 'Pendiente'}
                  </span>
                </Row>
                <Row label="Monto">
                  <span className={cn(
                    'font-mono font-medium',
                    pago.moneda === 'USD' ? 'text-emerald-400' : 'text-zinc-200',
                  )}>
                    {montoFmt}
                  </span>
                </Row>
                <Row label="Categoría">
                  <span className="text-zinc-300">{CATEGORIA_LABEL[pago.categoria]}</span>
                </Row>
                <Row label="Vencimiento">
                  <span className="text-zinc-300">Día {pago.dia_vencimiento}</span>
                </Row>
                {pago.registro?.fecha_pago_real && (
                  <Row label="Fecha de pago">
                    <span className="text-zinc-300">{pago.registro.fecha_pago_real}</span>
                  </Row>
                )}
              </div>
              <div className="flex items-center justify-between mt-4 pt-4 border-t border-zinc-800">
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={handleEliminar}
                  disabled={loadingDel}
                  className="text-red-500 hover:text-red-400 hover:bg-red-950/30 gap-1.5"
                >
                  <Trash2 size={14} />
                  Eliminar
                </Button>
                <Button
                  onClick={handleTogglePago}
                  disabled={loadingPago}
                  className={cn(
                    'gap-2',
                    pagado
                      ? 'bg-zinc-700 hover:bg-zinc-600 text-white'
                      : 'bg-emerald-700 hover:bg-emerald-600 text-white',
                  )}
                >
                  <Check size={15} />
                  {loadingPago ? '...' : pagado ? 'Desmarcar pago' : 'Marcar como pagado'}
                </Button>
              </div>
            </>
          )
        })()}

        {item?.tipo === 'evento' && (() => {
          const evento = item.item
          return (
            <>
              <DialogHeader>
                <DialogTitle className="text-white flex items-center gap-2">
                  {evento.titulo}
                  {evento.es_recurrente && <RefreshCw size={14} className="text-zinc-500" />}
                </DialogTitle>
              </DialogHeader>
              <div className="flex flex-col gap-3 mt-2">
                {evento.descripcion && (
                  <p className="text-sm text-zinc-300 leading-relaxed">{evento.descripcion}</p>
                )}
                <Row label="Día del mes">
                  <span className="text-zinc-300">Día {evento.dia}</span>
                </Row>
                {evento.es_recurrente && (
                  <Row label="Recurrencia">
                    <span className="text-zinc-300">Mensual</span>
                  </Row>
                )}
              </div>
              <div className="flex items-center justify-end mt-4 pt-4 border-t border-zinc-800">
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={handleEliminar}
                  disabled={loadingDel}
                  className="text-red-500 hover:text-red-400 hover:bg-red-950/30 gap-1.5"
                >
                  <Trash2 size={14} />
                  Eliminar
                </Button>
              </div>
            </>
          )
        })()}
      </DialogContent>
    </Dialog>
  )
}

function Row({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div className="flex items-center justify-between text-sm">
      <span className="text-zinc-500">{label}</span>
      {children}
    </div>
  )
}

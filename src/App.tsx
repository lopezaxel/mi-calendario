import { useEffect, useState, useCallback } from 'react'
import { ChevronLeft, ChevronRight, Plus, Loader2, List, Grid3x3, CalendarPlus } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { FilaPago } from '@/components/FilaPago'
import { CalendarView } from '@/components/CalendarView'
import { NuevoPagoDialog } from '@/components/NuevoPagoDialog'
import { NuevoEventoDialog } from '@/components/NuevoEventoDialog'
import { DetalleModal } from '@/components/DetalleModal'
import { getPagosDelMes, getEventosDelMes } from '@/lib/api'
import { cn } from '@/lib/utils'
import type { PagoConRegistro, Evento, ItemDetalle } from '@/types'

type Vista = 'lista' | 'calendario'

const MESES = [
  'Enero', 'Febrero', 'Marzo', 'Abril', 'Mayo', 'Junio',
  'Julio', 'Agosto', 'Septiembre', 'Octubre', 'Noviembre', 'Diciembre',
]

export default function App() {
  const hoy = new Date()
  const [mes, setMes] = useState(hoy.getMonth() + 1)
  const [año, setAño] = useState(hoy.getFullYear())
  const [pagos, setPagos] = useState<PagoConRegistro[]>([])
  const [eventos, setEventos] = useState<Evento[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [pagoDialogOpen, setPagoDialogOpen] = useState(false)
  const [eventoDialogOpen, setEventoDialogOpen] = useState(false)
  const [detalleItem, setDetalleItem] = useState<ItemDetalle | null>(null)
  const [vista, setVista] = useState<Vista>('calendario')

  const cargar = useCallback(async () => {
    setLoading(true)
    setError('')
    try {
      const [dataPagos, dataEventos] = await Promise.all([
        getPagosDelMes(mes, año),
        getEventosDelMes(mes, año),
      ])
      setPagos(dataPagos)
      setEventos(dataEventos)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Error al cargar')
    } finally {
      setLoading(false)
    }
  }, [mes, año])

  useEffect(() => { cargar() }, [cargar])

  function irMesAnterior() {
    if (mes === 1) { setMes(12); setAño(a => a - 1) }
    else setMes(m => m - 1)
  }

  function irMesSiguiente() {
    if (mes === 12) { setMes(1); setAño(a => a + 1) }
    else setMes(m => m + 1)
  }

  function irHoy() {
    setMes(hoy.getMonth() + 1)
    setAño(hoy.getFullYear())
  }

  const esMesActual = mes === hoy.getMonth() + 1 && año === hoy.getFullYear()
  const pagados = pagos.filter(p => p.registro?.pagado)
  const pendientes = pagos.filter(p => !p.registro?.pagado)
  const totalUSD = pendientes.reduce((s, p) => p.moneda === 'USD' && p.monto ? s + p.monto : s, 0)
  const totalARS = pendientes.reduce((s, p) => p.moneda === 'ARS' && p.monto ? s + p.monto : s, 0)

  return (
    <div className="min-h-screen bg-zinc-950 text-white">
      <div className={cn(
        'mx-auto px-4 py-8 transition-all duration-300',
        vista === 'calendario' ? 'max-w-5xl' : 'max-w-2xl',
      )}>

        {/* Header */}
        <div className="flex items-center justify-between mb-8">
          <div>
            <h1 className="text-2xl font-semibold text-white">Calendario de pagos</h1>
            {!esMesActual && (
              <button onClick={irHoy} className="text-xs text-violet-400 hover:text-violet-300 mt-1">
                ← Volver a hoy
              </button>
            )}
          </div>
          <div className="flex items-center gap-2">
            {/* Toggle vista */}
            <div className="flex rounded-lg bg-zinc-800 p-0.5">
              <button
                onClick={() => setVista('lista')}
                className={cn(
                  'w-8 h-8 flex items-center justify-center rounded-md transition-colors',
                  vista === 'lista' ? 'bg-zinc-600 text-white' : 'text-zinc-500 hover:text-zinc-300',
                )}
                title="Vista lista"
              >
                <List size={15} />
              </button>
              <button
                onClick={() => setVista('calendario')}
                className={cn(
                  'w-8 h-8 flex items-center justify-center rounded-md transition-colors',
                  vista === 'calendario' ? 'bg-zinc-600 text-white' : 'text-zinc-500 hover:text-zinc-300',
                )}
                title="Vista calendario"
              >
                <Grid3x3 size={15} />
              </button>
            </div>
            <Button
              onClick={() => setEventoDialogOpen(true)}
              className="bg-teal-700 hover:bg-teal-600 text-white gap-2"
            >
              <CalendarPlus size={16} />
              Nuevo evento
            </Button>
            <Button
              onClick={() => setPagoDialogOpen(true)}
              className="bg-violet-600 hover:bg-violet-500 text-white gap-2"
            >
              <Plus size={16} />
              Nuevo pago
            </Button>
          </div>
        </div>

        {/* Navegación de mes */}
        <div className="flex items-center justify-between mb-6">
          <button
            onClick={irMesAnterior}
            className="w-9 h-9 rounded-lg bg-zinc-800 hover:bg-zinc-700 flex items-center justify-center transition-colors"
          >
            <ChevronLeft size={18} />
          </button>
          <div className="text-center">
            <h2 className="text-lg font-medium">{MESES[mes - 1]} {año}</h2>
            <p className="text-xs text-zinc-500">
              {pagados.length}/{pagos.length} pagados
            </p>
          </div>
          <button
            onClick={irMesSiguiente}
            className="w-9 h-9 rounded-lg bg-zinc-800 hover:bg-zinc-700 flex items-center justify-center transition-colors"
          >
            <ChevronRight size={18} />
          </button>
        </div>

        {/* Resumen de totales pendientes */}
        {(totalUSD > 0 || totalARS > 0) && (
          <div className="flex gap-3 mb-6">
            {totalARS > 0 && (
              <div className="flex-1 bg-zinc-900 border border-zinc-800 rounded-xl px-4 py-3">
                <p className="text-xs text-zinc-500 mb-1">Pendiente ARS</p>
                <p className="text-lg font-semibold text-white">
                  $ {totalARS.toLocaleString('es-AR')}
                </p>
              </div>
            )}
            {totalUSD > 0 && (
              <div className="flex-1 bg-zinc-900 border border-zinc-800 rounded-xl px-4 py-3">
                <p className="text-xs text-zinc-500 mb-1">Pendiente USD</p>
                <p className="text-lg font-semibold text-emerald-400">
                  U$S {totalUSD.toLocaleString('es-AR')}
                </p>
              </div>
            )}
          </div>
        )}

        {/* Contenido principal */}
        {loading ? (
          <div className="flex justify-center py-16">
            <Loader2 size={24} className="animate-spin text-zinc-600" />
          </div>
        ) : error ? (
          <div className="text-center py-16">
            <p className="text-red-400 text-sm">{error}</p>
            <button onClick={cargar} className="text-zinc-500 text-xs mt-2 hover:text-zinc-300">
              Reintentar
            </button>
          </div>
        ) : vista === 'lista' && pagos.length === 0 ? (
          <div className="text-center py-16">
            <p className="text-zinc-600 text-sm">No hay pagos este mes.</p>
            <button
              onClick={() => setPagoDialogOpen(true)}
              className="text-violet-400 text-xs mt-2 hover:text-violet-300"
            >
              Agregar el primero
            </button>
          </div>
        ) : vista === 'lista' ? (
          <div className="flex flex-col gap-2">
            {pagos.map(pago => (
              <FilaPago
                key={pago.id}
                pago={pago}
                mes={mes}
                año={año}
                hoy={hoy.getDate()}
                onActualizar={cargar}
              />
            ))}
          </div>
        ) : (
          <CalendarView
            pagos={pagos}
            eventos={eventos}
            mes={mes}
            año={año}
            onClickItem={setDetalleItem}
          />
        )}
      </div>

      <NuevoPagoDialog
        open={pagoDialogOpen}
        onClose={() => setPagoDialogOpen(false)}
        onCreado={cargar}
        mes={mes}
        año={año}
      />
      <NuevoEventoDialog
        open={eventoDialogOpen}
        onClose={() => setEventoDialogOpen(false)}
        onCreado={cargar}
        mes={mes}
        año={año}
      />
      <DetalleModal
        item={detalleItem}
        mes={mes}
        año={año}
        onClose={() => setDetalleItem(null)}
        onActualizar={cargar}
      />
    </div>
  )
}

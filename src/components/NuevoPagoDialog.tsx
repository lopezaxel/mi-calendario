import { useState } from 'react'
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { crearPago } from '@/lib/api'
import type { Categoria, Moneda } from '@/types'

interface Props {
  open: boolean
  onClose: () => void
  onCreado: () => void
  mes: number
  año: number
}

const CATEGORIAS: { value: Categoria; label: string }[] = [
  { value: 'suscripcion', label: 'Suscripción' },
  { value: 'impuesto', label: 'Impuesto' },
  { value: 'servicio', label: 'Servicio' },
  { value: 'otro', label: 'Otro' },
]

export function NuevoPagoDialog({ open, onClose, onCreado, mes, año }: Props) {
  const [nombre, setNombre] = useState('')
  const [monto, setMonto] = useState('')
  const [moneda, setMoneda] = useState<Moneda>('ARS')
  const [dia, setDia] = useState('1')
  const [recurrente, setRecurrente] = useState(true)
  const [categoria, setCategoria] = useState<Categoria>('suscripcion')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  function reset() {
    setNombre('')
    setMonto('')
    setMoneda('ARS')
    setDia('1')
    setRecurrente(true)
    setCategoria('suscripcion')
    setError('')
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (!nombre.trim()) { setError('El nombre es requerido'); return }
    const diaNum = parseInt(dia)
    if (isNaN(diaNum) || diaNum < 1 || diaNum > 31) { setError('Día inválido (1-31)'); return }

    setLoading(true)
    setError('')
    try {
      await crearPago(
        {
          nombre: nombre.trim(),
          monto: monto ? parseFloat(monto) : null,
          moneda,
          dia_vencimiento: diaNum,
          es_recurrente: recurrente,
          categoria,
        },
        mes,
        año,
      )
      reset()
      onCreado()
      onClose()
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Error al guardar')
    } finally {
      setLoading(false)
    }
  }

  return (
    <Dialog open={open} onOpenChange={(v) => { if (!v) { reset(); onClose() } }}>
      <DialogContent className="bg-zinc-900 border-zinc-800 text-white max-w-md">
        <DialogHeader>
          <DialogTitle className="text-white">Nuevo pago</DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="flex flex-col gap-4 mt-2">
          <div className="flex flex-col gap-1">
            <label className="text-sm text-zinc-400">Nombre</label>
            <input
              className="bg-zinc-800 border border-zinc-700 rounded-md px-3 py-2 text-white text-sm outline-none focus:border-zinc-500"
              placeholder="Ej: Claude Pro, IVA ARCA"
              value={nombre}
              onChange={(e) => setNombre(e.target.value)}
            />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div className="flex flex-col gap-1">
              <label className="text-sm text-zinc-400">
                Monto {!recurrente || monto === '' ? '(opcional)' : ''}
              </label>
              <input
                type="number"
                min="0"
                step="0.01"
                className="bg-zinc-800 border border-zinc-700 rounded-md px-3 py-2 text-white text-sm outline-none focus:border-zinc-500"
                placeholder="Dejar vacío si varía"
                value={monto}
                onChange={(e) => setMonto(e.target.value)}
              />
            </div>
            <div className="flex flex-col gap-1">
              <label className="text-sm text-zinc-400">Moneda</label>
              <Select value={moneda} onValueChange={(v) => setMoneda(v as Moneda)}>
                <SelectTrigger className="bg-zinc-800 border-zinc-700 text-white">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent className="bg-zinc-800 border-zinc-700 text-white">
                  <SelectItem value="ARS">ARS</SelectItem>
                  <SelectItem value="USD">USD</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div className="flex flex-col gap-1">
              <label className="text-sm text-zinc-400">Día de vencimiento</label>
              <input
                type="number"
                min="1"
                max="31"
                className="bg-zinc-800 border border-zinc-700 rounded-md px-3 py-2 text-white text-sm outline-none focus:border-zinc-500"
                value={dia}
                onChange={(e) => setDia(e.target.value)}
              />
            </div>
            <div className="flex flex-col gap-1">
              <label className="text-sm text-zinc-400">Categoría</label>
              <Select value={categoria} onValueChange={(v) => setCategoria(v as Categoria)}>
                <SelectTrigger className="bg-zinc-800 border-zinc-700 text-white">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent className="bg-zinc-800 border-zinc-700 text-white">
                  {CATEGORIAS.map((c) => (
                    <SelectItem key={c.value} value={c.value}>{c.label}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>

          <label className="flex items-center gap-3 cursor-pointer select-none">
            <input
              type="checkbox"
              className="w-4 h-4 accent-violet-500"
              checked={recurrente}
              onChange={(e) => setRecurrente(e.target.checked)}
            />
            <span className="text-sm text-zinc-300">Se repite cada mes</span>
          </label>

          {!recurrente && (
            <p className="text-xs text-zinc-500 -mt-2">
              Este pago solo aparecerá en el mes actual.
            </p>
          )}

          {error && <p className="text-red-400 text-sm">{error}</p>}

          <div className="flex justify-end gap-2 mt-2">
            <Button
              type="button"
              variant="ghost"
              className="text-zinc-400 hover:text-white"
              onClick={() => { reset(); onClose() }}
            >
              Cancelar
            </Button>
            <Button
              type="submit"
              disabled={loading}
              className="bg-violet-600 hover:bg-violet-500 text-white"
            >
              {loading ? 'Guardando...' : 'Guardar'}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  )
}

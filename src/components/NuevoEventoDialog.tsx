import { useState } from 'react'
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { crearEvento } from '@/lib/api'

interface Props {
  open: boolean
  onClose: () => void
  onCreado: () => void
  mes: number
  año: number
}

export function NuevoEventoDialog({ open, onClose, onCreado, mes, año }: Props) {
  const [titulo, setTitulo] = useState('')
  const [descripcion, setDescripcion] = useState('')
  const [dia, setDia] = useState('1')
  const [recurrente, setRecurrente] = useState(false)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  function reset() {
    setTitulo('')
    setDescripcion('')
    setDia('1')
    setRecurrente(false)
    setError('')
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (!titulo.trim()) { setError('El título es requerido'); return }
    const diaNum = parseInt(dia)
    if (isNaN(diaNum) || diaNum < 1 || diaNum > 31) { setError('Día inválido (1–31)'); return }

    setLoading(true)
    setError('')
    try {
      await crearEvento(
        {
          titulo: titulo.trim(),
          descripcion: descripcion.trim() || null,
          dia: diaNum,
          es_recurrente: recurrente,
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
          <DialogTitle className="text-white">Nuevo evento</DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="flex flex-col gap-4 mt-2">
          <div className="flex flex-col gap-1">
            <label className="text-sm text-zinc-400">Título</label>
            <input
              className="bg-zinc-800 border border-zinc-700 rounded-md px-3 py-2 text-white text-sm outline-none focus:border-zinc-500"
              placeholder="Ej: Reunión con contador"
              value={titulo}
              onChange={(e) => setTitulo(e.target.value)}
              autoFocus
            />
          </div>

          <div className="flex flex-col gap-1">
            <label className="text-sm text-zinc-400">
              Descripción <span className="text-zinc-600">(opcional)</span>
            </label>
            <textarea
              className="bg-zinc-800 border border-zinc-700 rounded-md px-3 py-2 text-white text-sm outline-none focus:border-zinc-500 resize-none"
              placeholder="Detalles del evento..."
              rows={3}
              value={descripcion}
              onChange={(e) => setDescripcion(e.target.value)}
            />
          </div>

          <div className="flex flex-col gap-1">
            <label className="text-sm text-zinc-400">Día del mes</label>
            <input
              type="number"
              min="1"
              max="31"
              className="bg-zinc-800 border border-zinc-700 rounded-md px-3 py-2 text-white text-sm outline-none focus:border-zinc-500 w-24"
              value={dia}
              onChange={(e) => setDia(e.target.value)}
            />
          </div>

          <label className="flex items-center gap-3 cursor-pointer select-none">
            <input
              type="checkbox"
              className="w-4 h-4 accent-teal-500"
              checked={recurrente}
              onChange={(e) => setRecurrente(e.target.checked)}
            />
            <span className="text-sm text-zinc-300">Se repite cada mes</span>
          </label>

          {!recurrente && (
            <p className="text-xs text-zinc-500 -mt-2">
              Este evento solo aparecerá en el mes actual.
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
              className="bg-teal-600 hover:bg-teal-500 text-white"
            >
              {loading ? 'Guardando...' : 'Guardar'}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  )
}

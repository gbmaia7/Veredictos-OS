import { useState } from 'react'
import { Play, Square, Clock } from 'lucide-react'
import { useTimer, formatDuration } from '../../hooks/useTimer'
import Button from '../ui/Button'
import Avatar from '../ui/Avatar'

interface TimerProps {
  taskId: string
  userId: string | undefined
}

export default function Timer({ taskId, userId }: TimerProps) {
  const { entries, activeEntry, elapsed, totalSeconds, startTimer, stopTimer } = useTimer(taskId, userId)
  const [note, setNote] = useState('')
  const [stopping, setStopping] = useState(false)

  async function handleStop() {
    setStopping(false)
    await stopTimer(note || undefined)
    setNote('')
  }

  return (
    <div className="space-y-4">
      {/* Timer principal */}
      <div className="bg-bg-surface border border-border rounded-xl p-4">
        <div className="flex items-center justify-between mb-3">
          <div className="flex items-center gap-2">
            <Clock size={14} className="text-text-muted" />
            <span className="text-text-secondary text-xs font-mono tracking-badge uppercase">Tempo registrado</span>
          </div>
          <span className="text-teal font-mono font-medium text-sm">
            Total: {formatDuration(totalSeconds + (activeEntry ? elapsed : 0))}
          </span>
        </div>

        {activeEntry ? (
          <div className="space-y-3">
            <div className="flex items-center gap-3">
              <div className="w-2 h-2 rounded-full bg-teal animate-pulse" />
              <span className="font-mono text-2xl text-teal font-medium">{formatDuration(elapsed)}</span>
              <span className="text-text-muted text-xs font-mono">em andamento</span>
            </div>
            {stopping ? (
              <div className="space-y-2">
                <input
                  value={note}
                  onChange={e => setNote(e.target.value)}
                  placeholder="Nota sobre o trabalho realizado (opcional)"
                  className="w-full bg-bg-card border border-border rounded-lg px-3 py-2 text-text-primary text-xs font-sans placeholder-text-muted focus:outline-none focus:border-teal-muted"
                />
                <div className="flex gap-2">
                  <Button variant="danger" size="sm" onClick={handleStop}>
                    <Square size={12} /> Parar
                  </Button>
                  <Button variant="ghost" size="sm" onClick={() => setStopping(false)}>Cancelar</Button>
                </div>
              </div>
            ) : (
              <Button variant="danger" size="sm" onClick={() => setStopping(true)}>
                <Square size={12} /> Parar Timer
              </Button>
            )}
          </div>
        ) : (
          <Button variant="primary" size="sm" onClick={startTimer} disabled={!userId}>
            <Play size={12} /> Iniciar Timer
          </Button>
        )}
      </div>

      {/* Entradas de tempo */}
      {entries.length > 0 && (
        <div className="space-y-2">
          <p className="text-text-muted text-xs font-mono tracking-badge uppercase">Registros</p>
          {entries.map(entry => (
            <div key={entry.id} className="flex items-start justify-between bg-bg-surface border border-border rounded-lg px-3 py-2.5">
              <div className="flex items-center gap-2">
                {entry.user && <Avatar profile={entry.user} size="sm" />}
                <div>
                  <p className="text-text-secondary text-xs font-mono">
                    {new Date(entry.started_at).toLocaleDateString('pt-BR')}
                  </p>
                  {entry.note && <p className="text-text-muted text-xs font-sans mt-0.5">{entry.note}</p>}
                </div>
              </div>
              <span className="text-text-secondary text-xs font-mono flex-shrink-0 ml-2">
                {entry.duration_seconds ? formatDuration(entry.duration_seconds) : (
                  <span className="text-teal animate-pulse">ativo</span>
                )}
              </span>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}

import { Calendar, Clock } from 'lucide-react'
import type { Task } from '../../lib/types'
import Badge from '../ui/Badge'
import Avatar from '../ui/Avatar'

interface TaskCardProps {
  task: Task
  onClick?: () => void
  dragging?: boolean
}

function formatDate(dateStr: string | null): string {
  if (!dateStr) return ''
  const date = new Date(dateStr + 'T00:00:00')
  return date.toLocaleDateString('pt-BR', { day: '2-digit', month: 'short' })
}

function isOverdue(dateStr: string | null): boolean {
  if (!dateStr) return false
  return new Date(dateStr + 'T23:59:59') < new Date()
}

function isDueToday(dateStr: string | null): boolean {
  if (!dateStr) return false
  const today = new Date().toISOString().split('T')[0]
  return dateStr === today
}

export default function TaskCard({ task, onClick, dragging }: TaskCardProps) {
  const overdue = isOverdue(task.due_date) && task.status !== 'done'
  const today = isDueToday(task.due_date)

  return (
    <div
      onClick={onClick}
      className={`bg-bg-card border rounded-xl p-4 cursor-pointer transition-all select-none ${
        dragging
          ? 'border-teal/40 shadow-lg rotate-1 opacity-90'
          : 'border-border hover:border-teal/30 hover:bg-teal-glow'
      }`}
    >
      <div className="flex items-start justify-between gap-2 mb-3">
        <p className="text-text-primary text-sm font-sans font-medium leading-snug line-clamp-2 flex-1">
          {task.title}
        </p>
        <Badge value={task.priority} type="priority" className="flex-shrink-0" />
      </div>

      <div className="flex items-center gap-2 flex-wrap mb-3">
        <Badge value={task.module} type="module" />
      </div>

      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          {task.due_date && (
            <div className={`flex items-center gap-1 text-xs font-mono ${
              overdue ? 'text-red-DEFAULT' : today ? 'text-amber' : 'text-text-muted'
            }`}>
              <Calendar size={11} />
              {formatDate(task.due_date)}
              {overdue && ' ·  atrasado'}
            </div>
          )}
        </div>
        <div className="flex items-center gap-2">
          {task.estimated_hours && (
            <div className="flex items-center gap-1 text-xs font-mono text-text-muted">
              <Clock size={11} />
              {task.estimated_hours}h
            </div>
          )}
          {task.assignee && <Avatar profile={task.assignee} size="sm" />}
        </div>
      </div>
    </div>
  )
}

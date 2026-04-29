import { Calendar, ArrowRight } from 'lucide-react'
import type { Deal } from '../../lib/types'
import Badge from '../ui/Badge'
import Avatar from '../ui/Avatar'

interface DealCardProps {
  deal: Deal
  onClick?: () => void
  dragging?: boolean
}

function formatDate(dateStr: string | null): string {
  if (!dateStr) return ''
  return new Date(dateStr + 'T00:00:00').toLocaleDateString('pt-BR', { day: '2-digit', month: 'short' })
}

export default function DealCard({ deal, onClick, dragging }: DealCardProps) {
  return (
    <div
      onClick={onClick}
      className={`bg-bg-card border rounded-xl p-4 cursor-pointer transition-all select-none ${
        dragging
          ? 'border-teal/40 shadow-lg rotate-1 opacity-90'
          : 'border-border hover:border-teal/30 hover:bg-teal-glow'
      }`}
    >
      <div className="flex items-start justify-between gap-2 mb-2">
        <p className="text-text-primary text-sm font-sans font-medium leading-snug flex-1">{deal.name}</p>
        <Badge value={deal.sector} type="sector" className="flex-shrink-0" />
      </div>

      {deal.organization && (
        <p className="text-text-muted text-xs font-mono mb-3">{deal.organization}</p>
      )}

      {deal.next_action && (
        <div className="flex items-start gap-1.5 mb-3">
          <ArrowRight size={12} className="text-teal mt-0.5 flex-shrink-0" />
          <p className="text-text-secondary text-xs font-sans line-clamp-2">{deal.next_action}</p>
        </div>
      )}

      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          {deal.next_action_date && (
            <div className="flex items-center gap-1 text-xs font-mono text-text-muted">
              <Calendar size={11} />
              {formatDate(deal.next_action_date)}
            </div>
          )}
          {deal.probability !== undefined && (
            <span className="text-xs font-mono text-text-muted">{deal.probability}%</span>
          )}
        </div>
        {deal.assignee && <Avatar profile={deal.assignee} size="sm" />}
      </div>
    </div>
  )
}

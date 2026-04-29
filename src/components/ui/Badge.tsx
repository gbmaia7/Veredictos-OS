import type { TaskPriority, TaskModule, TaskStatus, DealStage, DealSector, OpportunityStatus, OpportunityType } from '../../lib/types'

type BadgeVariant = TaskPriority | TaskModule | TaskStatus | DealStage | DealSector | OpportunityStatus | OpportunityType | string

const priorityMap: Record<TaskPriority, { label: string; className: string }> = {
  critical: { label: 'CRÍTICO', className: 'bg-red-bg text-red-DEFAULT border border-red-DEFAULT/30' },
  high: { label: 'ALTA', className: 'bg-amber-bg text-amber border border-amber/30' },
  medium: { label: 'MÉDIA', className: 'bg-teal/10 text-teal border border-teal/20' },
  low: { label: 'BAIXA', className: 'bg-bg-card text-text-muted border border-border' },
}

const statusMap: Record<TaskStatus, { label: string; className: string }> = {
  todo: { label: 'A FAZER', className: 'bg-bg-card text-text-muted border border-border' },
  in_progress: { label: 'EM ANDAMENTO', className: 'bg-teal/10 text-teal border border-teal/20' },
  review: { label: 'REVISÃO', className: 'bg-amber-bg text-amber border border-amber/30' },
  done: { label: 'CONCLUÍDO', className: 'bg-green-bg text-green border border-green/30' },
}

const moduleMap: Record<TaskModule, { label: string; className: string }> = {
  produto: { label: 'PRODUTO', className: 'bg-teal/10 text-teal border border-teal/20' },
  mercado: { label: 'MERCADO', className: 'bg-amber-bg text-amber border border-amber/20' },
  canais: { label: 'CANAIS', className: 'bg-bg-surface text-text-secondary border border-border' },
  time: { label: 'TIME', className: 'bg-green-bg text-green border border-green/30' },
  gestao: { label: 'GESTÃO', className: 'bg-bg-surface text-text-secondary border border-border' },
  capital: { label: 'CAPITAL', className: 'bg-green-bg text-green border border-green/20' },
  pipeline: { label: 'PIPELINE', className: 'bg-teal/10 text-teal border border-teal/20' },
}

const stageMap: Record<DealStage, { label: string; className: string }> = {
  prospeccao: { label: 'PROSPECÇÃO', className: 'bg-bg-card text-text-muted border border-border' },
  contato: { label: 'CONTATO', className: 'bg-bg-surface text-text-secondary border border-border' },
  reuniao: { label: 'REUNIÃO', className: 'bg-teal/10 text-teal border border-teal/20' },
  negociacao: { label: 'NEGOCIAÇÃO', className: 'bg-amber-bg text-amber border border-amber/30' },
  piloto: { label: 'PILOTO', className: 'bg-teal/15 text-teal-dim border border-teal/30' },
  assinado: { label: 'ASSINADO', className: 'bg-green-bg text-green border border-green/30' },
  perdido: { label: 'PERDIDO', className: 'bg-red-bg text-red-DEFAULT border border-red-DEFAULT/30' },
}

const sectorMap: Record<DealSector, { label: string; className: string }> = {
  publico: { label: 'PÚBLICO', className: 'bg-teal/10 text-teal border border-teal/20' },
  privado: { label: 'PRIVADO', className: 'bg-amber-bg text-amber border border-amber/20' },
}

const oppStatusMap: Record<OpportunityStatus, { label: string; className: string }> = {
  identificado: { label: 'IDENTIFICADO', className: 'bg-bg-card text-text-muted border border-border' },
  preparando: { label: 'PREPARANDO', className: 'bg-amber-bg text-amber border border-amber/30' },
  submetido: { label: 'SUBMETIDO', className: 'bg-teal/10 text-teal border border-teal/20' },
  aprovado: { label: 'APROVADO', className: 'bg-green-bg text-green border border-green/30' },
  reprovado: { label: 'REPROVADO', className: 'bg-red-bg text-red-DEFAULT border border-red-DEFAULT/30' },
}

const oppTypeMap: Record<OpportunityType, { label: string; className: string }> = {
  edital: { label: 'EDITAL', className: 'bg-bg-surface text-text-secondary border border-border' },
  aceleradora: { label: 'ACELERADORA', className: 'bg-teal/10 text-teal border border-teal/20' },
  investidor: { label: 'INVESTIDOR', className: 'bg-green-bg text-green border border-green/30' },
  hackathon: { label: 'HACKATHON', className: 'bg-amber-bg text-amber border border-amber/20' },
}

interface BadgeProps {
  value: BadgeVariant
  type: 'priority' | 'status' | 'module' | 'stage' | 'sector' | 'oppStatus' | 'oppType'
  className?: string
}

export default function Badge({ value, type, className = '' }: BadgeProps) {
  let config: { label: string; className: string } | undefined

  if (type === 'priority') config = priorityMap[value as TaskPriority]
  else if (type === 'status') config = statusMap[value as TaskStatus]
  else if (type === 'module') config = moduleMap[value as TaskModule]
  else if (type === 'stage') config = stageMap[value as DealStage]
  else if (type === 'sector') config = sectorMap[value as DealSector]
  else if (type === 'oppStatus') config = oppStatusMap[value as OpportunityStatus]
  else if (type === 'oppType') config = oppTypeMap[value as OpportunityType]

  if (!config) return null

  return (
    <span
      className={`inline-flex items-center px-2 py-0.5 rounded text-[10px] font-mono tracking-badge font-medium ${config.className} ${className}`}
    >
      {config.label}
    </span>
  )
}

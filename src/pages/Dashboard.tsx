import { useEffect, useState } from 'react'
import { CheckSquare, AlertTriangle, TrendingUp, Clock } from 'lucide-react'
import { supabase } from '../lib/supabase'
import type { Task, Deal, Opportunity } from '../lib/types'
import PageHeader from '../components/layout/PageHeader'
import Card from '../components/ui/Card'
import Badge from '../components/ui/Badge'
import Spinner from '../components/ui/Spinner'
import Avatar from '../components/ui/Avatar'

const STAGE_LABELS: Record<string, string> = {
  prospeccao: 'Prospecção',
  contato: 'Contato',
  reuniao: 'Reunião',
  negociacao: 'Negociação',
  piloto: 'Piloto',
  assinado: 'Assinado',
}

const STAGE_ORDER = ['prospeccao', 'contato', 'reuniao', 'negociacao', 'piloto', 'assinado']

export default function Dashboard() {
  const [loading, setLoading] = useState(true)
  const [openTasks, setOpenTasks] = useState(0)
  const [criticalTasks, setCriticalTasks] = useState(0)
  const [activeDeals, setActiveDeals] = useState(0)
  const [weekHours, setWeekHours] = useState(0)
  const [upcomingTasks, setUpcomingTasks] = useState<Task[]>([])
  const [deals, setDeals] = useState<Deal[]>([])
  const [opportunities, setOpportunities] = useState<Opportunity[]>([])

  useEffect(() => {
    fetchAll()
  }, [])

  async function fetchAll() {
    setLoading(true)

    const today = new Date().toISOString().split('T')[0]
    const weekAgo = new Date(Date.now() - 7 * 86400000).toISOString()

    const [
      { count: open },
      { count: critical },
      { count: dealCount },
      { data: weekEntries },
      { data: tasks },
      { data: dealsData },
      { data: oppsData },
    ] = await Promise.all([
      supabase.from('tasks').select('*', { count: 'exact', head: true }).in('status', ['todo', 'in_progress', 'review']),
      supabase.from('tasks').select('*', { count: 'exact', head: true }).eq('priority', 'critical').in('status', ['todo', 'in_progress']).lte('due_date', today),
      supabase.from('deals').select('*', { count: 'exact', head: true }).neq('stage', 'perdido'),
      supabase.from('time_entries').select('duration_seconds').gte('started_at', weekAgo).not('duration_seconds', 'is', null),
      supabase.from('tasks').select('*, assignee:profiles!tasks_assignee_id_fkey(*)').in('status', ['todo', 'in_progress']).order('due_date', { ascending: true, nullsFirst: false }).limit(5),
      supabase.from('deals').select('*, assignee:profiles!deals_assignee_id_fkey(*)').neq('stage', 'perdido').order('updated_at', { ascending: false }),
      supabase.from('opportunities').select('*, assignee:profiles(*)').lte('deadline', new Date(Date.now() + 30 * 86400000).toISOString().split('T')[0]).gte('deadline', today).order('deadline', { ascending: true }),
    ])

    setOpenTasks(open ?? 0)
    setCriticalTasks(critical ?? 0)
    setActiveDeals(dealCount ?? 0)
    const totalSec = (weekEntries ?? []).reduce((s: number, e: { duration_seconds?: number | null }) => s + (e.duration_seconds ?? 0), 0)
    setWeekHours(Math.round(totalSec / 3600 * 10) / 10)
    setUpcomingTasks((tasks as Task[]) ?? [])
    setDeals((dealsData as Deal[]) ?? [])
    setOpportunities((oppsData as Opportunity[]) ?? [])
    setLoading(false)
  }

  const stageCounts = STAGE_ORDER.map(stage => ({
    stage,
    label: STAGE_LABELS[stage],
    count: deals.filter(d => d.stage === stage).length,
  }))

  const maxCount = Math.max(...stageCounts.map(s => s.count), 1)

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <Spinner size="lg" />
      </div>
    )
  }

  return (
    <div className="p-8">
      <PageHeader
        title="Dashboard"
        subtitle={`Visão geral · ${new Date().toLocaleDateString('pt-BR', { weekday: 'long', day: 'numeric', month: 'long' })}`}
      />

      {/* Métricas */}
      <div className="grid grid-cols-4 gap-4 mb-8">
        <MetricCard
          icon={<CheckSquare size={18} className="text-teal" />}
          label="Tarefas abertas"
          value={openTasks}
          color="teal"
        />
        <MetricCard
          icon={<AlertTriangle size={18} className="text-red-DEFAULT" />}
          label="Críticas vencendo"
          value={criticalTasks}
          color="red"
          alert={criticalTasks > 0}
        />
        <MetricCard
          icon={<TrendingUp size={18} className="text-amber" />}
          label="Deals ativos"
          value={activeDeals}
          color="amber"
        />
        <MetricCard
          icon={<Clock size={18} className="text-green" />}
          label="Horas esta semana"
          value={`${weekHours}h`}
          color="green"
        />
      </div>

      {/* Row 2 */}
      <div className="grid grid-cols-2 gap-6 mb-8">
        {/* Próximas tarefas */}
        <Card className="p-5">
          <h2 className="font-display text-lg text-text-primary tracking-wider mb-4">PRÓXIMAS TAREFAS</h2>
          {upcomingTasks.length === 0 ? (
            <p className="text-text-muted text-sm font-mono">Nenhuma tarefa aberta.</p>
          ) : (
            <div className="space-y-3">
              {upcomingTasks.map(task => (
                <div key={task.id} className="flex items-start gap-3 p-3 rounded-lg bg-bg-surface border border-border">
                  <div className="flex-1 min-w-0">
                    <p className="text-text-primary text-sm font-sans leading-snug line-clamp-1">{task.title}</p>
                    <div className="flex items-center gap-2 mt-1.5">
                      <Badge value={task.priority} type="priority" />
                      {task.due_date && (
                        <span className="text-text-muted text-xs font-mono">
                          {new Date(task.due_date + 'T00:00:00').toLocaleDateString('pt-BR', { day: '2-digit', month: 'short' })}
                        </span>
                      )}
                    </div>
                  </div>
                  {task.assignee && <Avatar profile={task.assignee} size="sm" />}
                </div>
              ))}
            </div>
          )}
        </Card>

        {/* Pipeline resumo */}
        <Card className="p-5">
          <h2 className="font-display text-lg text-text-primary tracking-wider mb-4">PIPELINE POR ESTÁGIO</h2>
          <div className="space-y-3">
            {stageCounts.map(({ stage, label, count }) => (
              <div key={stage} className="flex items-center gap-3">
                <span className="text-text-muted text-xs font-mono w-24 flex-shrink-0">{label}</span>
                <div className="flex-1 bg-bg-surface rounded-full h-1.5 overflow-hidden">
                  <div
                    className="h-full bg-teal rounded-full transition-all"
                    style={{ width: `${(count / maxCount) * 100}%` }}
                  />
                </div>
                <span className="text-text-secondary text-xs font-mono w-4 text-right">{count}</span>
              </div>
            ))}
          </div>
          <div className="mt-4 pt-4 border-t border-border">
            <p className="text-text-muted text-xs font-mono">{activeDeals} deal{activeDeals !== 1 ? 's' : ''} ativo{activeDeals !== 1 ? 's' : ''} no pipeline</p>
          </div>
        </Card>
      </div>

      {/* Oportunidades próximas */}
      {opportunities.length > 0 && (
        <div>
          <h2 className="font-display text-lg text-text-primary tracking-wider mb-4">OPORTUNIDADES COM PRAZO CHEGANDO</h2>
          <div className="grid grid-cols-4 gap-4">
            {opportunities.map(opp => {
              const daysLeft = Math.ceil((new Date(opp.deadline!).getTime() - Date.now()) / 86400000)
              const urgent = daysLeft <= 7
              return (
                <Card key={opp.id} className="p-4">
                  <div className="flex items-start justify-between mb-2">
                    <Badge value={opp.type} type="oppType" />
                    <Badge value={opp.status} type="oppStatus" />
                  </div>
                  <p className="text-text-primary text-sm font-sans font-medium mt-2 mb-1">{opp.name}</p>
                  <p className={`text-xs font-mono ${urgent ? 'text-red-DEFAULT' : 'text-text-muted'}`}>
                    {daysLeft === 0 ? 'Vence hoje' : daysLeft === 1 ? 'Vence amanhã' : `${daysLeft} dias restantes`}
                  </p>
                </Card>
              )
            })}
          </div>
        </div>
      )}
    </div>
  )
}

interface MetricCardProps {
  icon: React.ReactNode
  label: string
  value: number | string
  color: 'teal' | 'red' | 'amber' | 'green'
  alert?: boolean
}

function MetricCard({ icon, label, value, color, alert }: MetricCardProps) {
  const colorClass = {
    teal: 'border-teal/20',
    red: 'border-red-DEFAULT/20',
    amber: 'border-amber/20',
    green: 'border-green/20',
  }

  return (
    <Card className={`p-5 ${alert ? 'border-red-DEFAULT/40 bg-red-bg' : colorClass[color]}`}>
      <div className="flex items-center gap-2 mb-3">{icon}</div>
      <p className="text-3xl font-display text-text-primary tracking-wider">{value}</p>
      <p className="text-text-muted text-xs font-mono tracking-badge mt-1 uppercase">{label}</p>
    </Card>
  )
}

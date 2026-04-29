import { supabase } from './supabase'
import type { TaskPriority, TaskModule, OpportunityType, OpportunityStatus, DealSector, DealStage } from './types'

interface SeedTask {
  title: string
  priority: TaskPriority
  module: TaskModule
  due_date: string
  assignee_name: string
}

const seedTasks: SeedTask[] = [
  { title: 'Formalizar alteração do contrato social com adição dos sócios', priority: 'critical', module: 'gestao', due_date: '2026-05-31', assignee_name: 'Gabriel' },
  { title: 'Definir acordo de sócios (vesting, good/bad leaver, tag-along)', priority: 'critical', module: 'gestao', due_date: '2026-05-31', assignee_name: 'Gabriel' },
  { title: 'Atualizar CNAE e regime tributário para healthtech/SaaS', priority: 'critical', module: 'gestao', due_date: '2026-06-15', assignee_name: 'Gabriel' },
  { title: 'Visita presencial no Centro Carioca do Olho para destravar assinatura do termo de cooperação', priority: 'critical', module: 'produto', due_date: '2026-05-20', assignee_name: 'Gabriel' },
  { title: 'Definir cronograma de implantação e métricas de sucesso do piloto CCO', priority: 'high', module: 'produto', due_date: '2026-06-30', assignee_name: 'Pedro' },
  { title: 'Iniciar coleta de dados reais de retinografia para refinamento do modelo', priority: 'high', module: 'produto', due_date: '2026-07-31', assignee_name: 'Pedro' },
  { title: 'Operacionalizar piloto CCO: analisar primeiras 500–1.000 retinografias', priority: 'high', module: 'produto', due_date: '2026-08-31', assignee_name: 'Pedro' },
  { title: 'Documentar resultados clínicos e operacionais do piloto', priority: 'high', module: 'produto', due_date: '2026-09-30', assignee_name: 'João' },
  { title: 'Submeter candidatura ao YCombinator', priority: 'high', module: 'capital', due_date: '2026-06-01', assignee_name: 'Gabriel' },
  { title: 'Iniciar documentação para FAPESP PIPE Fase 1', priority: 'high', module: 'capital', due_date: '2026-06-30', assignee_name: 'Gabriel' },
  { title: 'Submeter FINEP Startup com laudo do piloto como evidência técnica', priority: 'medium', module: 'capital', due_date: '2026-10-31', assignee_name: 'Gabriel' },
  { title: 'Realizar 5–8 entrevistas de descoberta com decisores de operadoras de plano de saúde', priority: 'high', module: 'mercado', due_date: '2026-07-31', assignee_name: 'Gabriel' },
  { title: 'Entrevistar 3–5 diretores médicos ou gestores de clínicas oftalmológicas privadas', priority: 'high', module: 'mercado', due_date: '2026-07-31', assignee_name: 'Gabriel' },
  { title: 'Mapear proposta de valor específica para o mercado privado', priority: 'high', module: 'mercado', due_date: '2026-08-15', assignee_name: 'Gabriel' },
  { title: 'Contratar estagiário/freelancer de marketing e produção de conteúdo', priority: 'high', module: 'canais', due_date: '2026-07-15', assignee_name: 'Gabriel' },
  { title: 'Estruturar calendário editorial Instagram Veredictos Vision (3 posts/semana)', priority: 'high', module: 'canais', due_date: '2026-07-31', assignee_name: 'Gabriel' },
  { title: 'Criar LinkedIn institucional da empresa e publicar case do piloto CCO', priority: 'medium', module: 'canais', due_date: '2026-08-31', assignee_name: 'Gabriel' },
  { title: 'Consultar especialista em regulatório ANVISA para SaMD', priority: 'high', module: 'gestao', due_date: '2026-08-31', assignee_name: 'Gabriel' },
  { title: 'Prospectar 2 municípios fora do Rio para expansão', priority: 'high', module: 'gestao', due_date: '2026-09-30', assignee_name: 'Gabriel' },
  { title: 'Consolidar 2–3 termos de cooperação assinados', priority: 'medium', module: 'gestao', due_date: '2026-10-31', assignee_name: 'Gabriel' },
  { title: 'Estruturar data room para investidores', priority: 'medium', module: 'gestao', due_date: '2026-10-31', assignee_name: 'Gabriel' },
  { title: 'Definir modelo de precificação para escala', priority: 'medium', module: 'gestao', due_date: '2026-10-31', assignee_name: 'Gabriel' },
]

interface SeedOpportunity {
  name: string
  type: OpportunityType
  deadline: string
  status: OpportunityStatus
}

const seedOpportunities: SeedOpportunity[] = [
  { name: 'YCombinator', type: 'aceleradora', deadline: '2026-06-01', status: 'preparando' },
  { name: 'A16Z', type: 'aceleradora', deadline: '2026-07-01', status: 'identificado' },
  { name: 'FAPESP PIPE Fase 1', type: 'edital', deadline: '2026-07-31', status: 'preparando' },
  { name: 'FINEP Startup', type: 'edital', deadline: '2026-10-31', status: 'identificado' },
]

interface SeedDeal {
  name: string
  sector: DealSector
  stage: DealStage
  next_action: string
}

const seedDeals: SeedDeal[] = [
  { name: 'Centro Carioca do Olho', sector: 'publico', stage: 'negociacao', next_action: 'Assinar termo de cooperação técnica' },
  { name: 'Secretaria Municipal de Saúde RJ', sector: 'publico', stage: 'contato', next_action: 'Agendar reunião com gestor' },
  { name: 'Vibee Unimed (mercado privado)', sector: 'privado', stage: 'prospeccao', next_action: 'Realizar entrevistas de descoberta' },
]

export async function runSeedIfEmpty() {
  const { count } = await supabase.from('tasks').select('*', { count: 'exact', head: true })

  if (count && count > 0) return

  const { data: profiles } = await supabase.from('profiles').select('*')
  if (!profiles || profiles.length === 0) return

  const findProfile = (name: string) =>
    profiles.find(p => p.name.toLowerCase().includes(name.toLowerCase()))

  const gabriel = findProfile('gabriel')
  const pedro = findProfile('pedro')
  const joao = findProfile('joão') || findProfile('joao') || findProfile('batista')

  const getAssigneeId = (name: string): string | null => {
    if (name === 'Gabriel') return gabriel?.id ?? null
    if (name === 'Pedro') return pedro?.id ?? null
    if (name === 'João') return joao?.id ?? null
    return gabriel?.id ?? null
  }

  const tasksToInsert = seedTasks.map(t => ({
    title: t.title,
    priority: t.priority,
    module: t.module,
    due_date: t.due_date,
    assignee_id: getAssigneeId(t.assignee_name),
    status: 'todo' as const,
    tags: [],
  }))

  await supabase.from('tasks').insert(tasksToInsert)

  const oppsToInsert = seedOpportunities.map(o => ({
    name: o.name,
    type: o.type,
    deadline: o.deadline,
    status: o.status,
    assignee_id: gabriel?.id ?? null,
  }))

  await supabase.from('opportunities').insert(oppsToInsert)

  const dealsToInsert = seedDeals.map(d => ({
    name: d.name,
    sector: d.sector,
    stage: d.stage,
    next_action: d.next_action,
    assignee_id: gabriel?.id ?? null,
  }))

  await supabase.from('deals').insert(dealsToInsert)
}

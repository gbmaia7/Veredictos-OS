import { useState, useCallback } from 'react'
import { Plus, Mail, Phone, Calendar, MessageSquare } from 'lucide-react'
import { DragDropContext, Droppable, Draggable } from '@hello-pangea/dnd'
import type { DropResult } from '@hello-pangea/dnd'
import { useDeals, useDealActivities } from '../hooks/useDeals'
import { useAuth } from '../hooks/useAuth'
import type { Deal, DealStage, DealSector, ActivityType } from '../lib/types'
import PageHeader from '../components/layout/PageHeader'
import DealCard from '../components/features/DealCard'
import Badge from '../components/ui/Badge'
import Avatar from '../components/ui/Avatar'
import Button from '../components/ui/Button'
import Input from '../components/ui/Input'
import Select from '../components/ui/Select'
import SlideOver from '../components/ui/SlideOver'
import Modal from '../components/ui/Modal'
import Spinner from '../components/ui/Spinner'
import { supabase } from '../lib/supabase'

const STAGES: { id: DealStage; label: string }[] = [
  { id: 'prospeccao', label: 'Prospecção' },
  { id: 'contato', label: 'Contato' },
  { id: 'reuniao', label: 'Reunião' },
  { id: 'negociacao', label: 'Negociação' },
  { id: 'piloto', label: 'Piloto' },
  { id: 'assinado', label: 'Assinado' },
]

const ACTIVITY_ICONS: Record<ActivityType, React.ReactNode> = {
  email: <Mail size={12} />,
  ligacao: <Phone size={12} />,
  reuniao: <Calendar size={12} />,
  nota: <MessageSquare size={12} />,
  status_change: <span>→</span>,
}

const ACTIVITY_LABELS: Record<ActivityType, string> = {
  email: 'E-mail', ligacao: 'Ligação', reuniao: 'Reunião', nota: 'Nota', status_change: 'Mudança de status',
}

export default function Pipeline() {
  const { deals, loading, createDeal, updateDeal } = useDeals()
  const { profile } = useAuth()
  const [selectedDeal, setSelectedDeal] = useState<Deal | null>(null)
  const [newDealOpen, setNewDealOpen] = useState(false)
  const [sectorFilter, setSectorFilter] = useState<DealSector | ''>('')
  const [activityType, setActivityType] = useState<ActivityType>('nota')
  const [activityContent, setActivityContent] = useState('')
  const [profiles, setProfiles] = useState<{id: string; name: string}[]>([])
  const { activities, addActivity } = useDealActivities(selectedDeal?.id ?? null)

  const [form, setForm] = useState({
    name: '', organization: '', sector: 'publico' as DealSector, stage: 'prospeccao' as DealStage,
    next_action: '', next_action_date: '', probability: '20', assignee_id: '', notes: '',
  })

  const filtered = sectorFilter ? deals.filter(d => d.sector === sectorFilter) : deals

  function getStageDeals(stage: DealStage) {
    return filtered.filter(d => d.stage === stage)
  }

  const onDragEnd = useCallback(async (result: DropResult) => {
    if (!result.destination) return
    const newStage = result.destination.droppableId as DealStage
    const deal = deals.find(d => d.id === result.draggableId)
    if (!deal || deal.stage === newStage) return
    await updateDeal(result.draggableId, { stage: newStage })
    if (profile) {
      await addActivity(result.draggableId, profile.id, 'status_change', `Movido para ${newStage}`)
    }
  }, [deals, updateDeal, addActivity, profile])

  async function openNewDeal() {
    const { data } = await supabase.from('profiles').select('id, name')
    setProfiles(data ?? [])
    setNewDealOpen(true)
  }

  async function handleCreate(e: React.FormEvent) {
    e.preventDefault()
    await createDeal({
      name: form.name, organization: form.organization || null, sector: form.sector,
      stage: form.stage, next_action: form.next_action || null,
      next_action_date: form.next_action_date || null,
      probability: parseInt(form.probability), assignee_id: form.assignee_id || null,
      notes: form.notes || null, created_by: profile?.id,
    })
    setNewDealOpen(false)
    setForm({ name: '', organization: '', sector: 'publico', stage: 'prospeccao', next_action: '', next_action_date: '', probability: '20', assignee_id: '', notes: '' })
  }

  async function handleDealFieldUpdate(field: keyof Deal, value: unknown) {
    if (!selectedDeal) return
    await updateDeal(selectedDeal.id, { [field]: value })
    setSelectedDeal(prev => prev ? { ...prev, [field]: value } : null)
  }

  async function handleAddActivity(e: React.FormEvent) {
    e.preventDefault()
    if (!selectedDeal || !profile || !activityContent) return
    await addActivity(selectedDeal.id, profile.id, activityType, activityContent)
    setActivityContent('')
  }

  if (loading) return <div className="flex items-center justify-center h-64"><Spinner size="lg" /></div>

  return (
    <div className="h-full flex flex-col">
      <div className="px-8 pt-8 pb-4">
        <PageHeader
          title="Pipeline"
          subtitle="Gestão comercial"
          actions={
            <Button variant="primary" onClick={openNewDeal}><Plus size={16} /> Novo Deal</Button>
          }
        />
        <div className="flex items-center gap-3 mb-4">
          <select value={sectorFilter} onChange={e => setSectorFilter(e.target.value as DealSector | '')}
            className="bg-bg-surface border border-border rounded-lg px-3 py-1.5 text-text-secondary text-xs font-mono focus:outline-none focus:border-teal-muted">
            <option value="">Público e Privado</option>
            <option value="publico">Setor Público</option>
            <option value="privado">Setor Privado</option>
          </select>
          <span className="text-text-muted text-xs font-mono">{filtered.length} deal{filtered.length !== 1 ? 's' : ''}</span>
        </div>
      </div>

      {/* Kanban */}
      <div className="flex-1 px-8 pb-8 overflow-x-auto">
        <DragDropContext onDragEnd={onDragEnd}>
          <div className="flex gap-4 h-full min-w-max">
            {STAGES.map(col => {
              const stageDeals = getStageDeals(col.id)
              return (
                <div key={col.id} className="w-64 flex-shrink-0 flex flex-col">
                  <div className="flex items-center justify-between mb-3">
                    <h3 className="text-text-secondary text-xs font-mono tracking-badge uppercase">{col.label}</h3>
                    <span className="text-text-muted text-xs font-mono bg-bg-surface border border-border px-1.5 py-0.5 rounded">{stageDeals.length}</span>
                  </div>
                  <Droppable droppableId={col.id}>
                    {(provided, snapshot) => (
                      <div
                        ref={provided.innerRef}
                        {...provided.droppableProps}
                        className={`flex-1 rounded-xl p-2 min-h-[200px] space-y-3 transition-colors ${
                          snapshot.isDraggingOver ? 'bg-teal-glow border border-teal/20' : 'bg-bg-surface border border-border'
                        }`}
                      >
                        {stageDeals.map((deal, index) => (
                          <Draggable key={deal.id} draggableId={deal.id} index={index}>
                            {(provided, snapshot) => (
                              <div ref={provided.innerRef} {...provided.draggableProps} {...provided.dragHandleProps}>
                                <DealCard deal={deal} onClick={() => setSelectedDeal(deal)} dragging={snapshot.isDragging} />
                              </div>
                            )}
                          </Draggable>
                        ))}
                        {provided.placeholder}
                      </div>
                    )}
                  </Droppable>
                </div>
              )
            })}
          </div>
        </DragDropContext>
      </div>

      {/* Slide-over deal */}
      <SlideOver open={!!selectedDeal} onClose={() => setSelectedDeal(null)} width="xl">
        {selectedDeal && (
          <div className="p-6 space-y-6">
            <div>
              <input
                defaultValue={selectedDeal.name}
                onBlur={e => handleDealFieldUpdate('name', e.target.value)}
                className="w-full bg-transparent text-text-primary text-xl font-display tracking-wider focus:outline-none border-b border-transparent focus:border-teal/30 pb-1 transition-colors"
              />
              <div className="flex items-center gap-2 mt-2">
                <Badge value={selectedDeal.stage} type="stage" />
                <Badge value={selectedDeal.sector} type="sector" />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <Input label="Organização" defaultValue={selectedDeal.organization ?? ''} onBlur={e => handleDealFieldUpdate('organization', e.target.value || null)} />
              <Input label="Contato" defaultValue={selectedDeal.contact_name ?? ''} onBlur={e => handleDealFieldUpdate('contact_name', e.target.value || null)} />
              <Input label="E-mail" type="email" defaultValue={selectedDeal.contact_email ?? ''} onBlur={e => handleDealFieldUpdate('contact_email', e.target.value || null)} />
              <Input label="Telefone" defaultValue={selectedDeal.contact_phone ?? ''} onBlur={e => handleDealFieldUpdate('contact_phone', e.target.value || null)} />
              <Select label="Estágio" value={selectedDeal.stage} onChange={e => handleDealFieldUpdate('stage', e.target.value)}>
                {STAGES.map(s => <option key={s.id} value={s.id}>{s.label}</option>)}
              </Select>
              <Select label="Setor" value={selectedDeal.sector} onChange={e => handleDealFieldUpdate('sector', e.target.value)}>
                <option value="publico">Público</option>
                <option value="privado">Privado</option>
              </Select>
              <Input label="Probabilidade (%)" type="number" min="0" max="100" defaultValue={selectedDeal.probability?.toString()} onBlur={e => handleDealFieldUpdate('probability', parseInt(e.target.value))} />
              <Input label="Valor (R$)" type="number" defaultValue={selectedDeal.value?.toString() ?? ''} onBlur={e => handleDealFieldUpdate('value', e.target.value ? parseFloat(e.target.value) : null)} />
            </div>

            <div>
              <Input label="Próxima ação" defaultValue={selectedDeal.next_action ?? ''} onBlur={e => handleDealFieldUpdate('next_action', e.target.value || null)} />
            </div>
            <Input label="Data da próxima ação" type="date" defaultValue={selectedDeal.next_action_date ?? ''} onBlur={e => handleDealFieldUpdate('next_action_date', e.target.value || null)} />

            <div>
              <label className="block text-text-secondary text-xs font-mono tracking-badge uppercase mb-1.5">Notas</label>
              <textarea defaultValue={selectedDeal.notes ?? ''} onBlur={e => handleDealFieldUpdate('notes', e.target.value || null)} rows={3}
                className="w-full bg-bg-surface border border-border rounded-lg px-3 py-2 text-text-primary text-sm font-sans placeholder-text-muted focus:outline-none focus:border-teal-muted resize-none" />
            </div>

            {/* Registrar atividade */}
            <div>
              <h3 className="text-text-secondary text-xs font-mono tracking-badge uppercase mb-3">Registrar atividade</h3>
              <form onSubmit={handleAddActivity} className="space-y-3">
                <div className="flex gap-2">
                  {(['email', 'ligacao', 'reuniao', 'nota'] as ActivityType[]).map(t => (
                    <button key={t} type="button" onClick={() => setActivityType(t)}
                      className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-mono transition-colors ${
                        activityType === t ? 'bg-teal/20 text-teal border border-teal/30' : 'bg-bg-surface text-text-muted border border-border hover:text-text-secondary'
                      }`}>
                      {ACTIVITY_ICONS[t]} {ACTIVITY_LABELS[t]}
                    </button>
                  ))}
                </div>
                <textarea value={activityContent} onChange={e => setActivityContent(e.target.value)} rows={2} placeholder="Descreva a atividade..." required
                  className="w-full bg-bg-surface border border-border rounded-lg px-3 py-2 text-text-primary text-sm font-sans placeholder-text-muted focus:outline-none focus:border-teal-muted resize-none" />
                <Button variant="primary" size="sm" type="submit" disabled={!activityContent}>Registrar</Button>
              </form>
            </div>

            {/* Histórico */}
            {activities.length > 0 && (
              <div>
                <h3 className="text-text-secondary text-xs font-mono tracking-badge uppercase mb-3">Histórico</h3>
                <div className="space-y-3">
                  {activities.map(act => (
                    <div key={act.id} className="flex items-start gap-3 bg-bg-surface border border-border rounded-lg p-3">
                      <div className="text-text-muted mt-0.5 flex-shrink-0">{ACTIVITY_ICONS[act.type]}</div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 mb-1">
                          <span className="text-text-muted text-[10px] font-mono tracking-badge uppercase">{ACTIVITY_LABELS[act.type]}</span>
                          {act.user && <Avatar profile={act.user} size="sm" />}
                          <span className="text-text-muted text-[10px] font-mono ml-auto">
                            {new Date(act.created_at).toLocaleDateString('pt-BR')}
                          </span>
                        </div>
                        {act.content && <p className="text-text-secondary text-xs font-sans">{act.content}</p>}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        )}
      </SlideOver>

      {/* Modal novo deal */}
      <Modal open={newDealOpen} onClose={() => setNewDealOpen(false)} title="Novo Deal" size="md">
        <form onSubmit={handleCreate} className="p-6 space-y-4">
          <Input label="Nome do deal" value={form.name} onChange={e => setForm(p => ({ ...p, name: e.target.value }))} required placeholder="Ex: Centro Carioca do Olho" />
          <div className="grid grid-cols-2 gap-3">
            <Select label="Setor" value={form.sector} onChange={e => setForm(p => ({ ...p, sector: e.target.value as DealSector }))}>
              <option value="publico">Público</option>
              <option value="privado">Privado</option>
            </Select>
            <Select label="Estágio" value={form.stage} onChange={e => setForm(p => ({ ...p, stage: e.target.value as DealStage }))}>
              {STAGES.map(s => <option key={s.id} value={s.id}>{s.label}</option>)}
            </Select>
          </div>
          <Input label="Organização" value={form.organization} onChange={e => setForm(p => ({ ...p, organization: e.target.value }))} />
          <Input label="Próxima ação" value={form.next_action} onChange={e => setForm(p => ({ ...p, next_action: e.target.value }))} />
          <div className="grid grid-cols-2 gap-3">
            <Input label="Probabilidade (%)" type="number" min="0" max="100" value={form.probability} onChange={e => setForm(p => ({ ...p, probability: e.target.value }))} />
            <Select label="Responsável" value={form.assignee_id} onChange={e => setForm(p => ({ ...p, assignee_id: e.target.value }))}>
              <option value="">Sem responsável</option>
              {profiles.map(p => <option key={p.id} value={p.id}>{p.name}</option>)}
            </Select>
          </div>
          <div className="flex justify-end gap-3 pt-2">
            <Button variant="ghost" type="button" onClick={() => setNewDealOpen(false)}>Cancelar</Button>
            <Button variant="primary" type="submit" disabled={!form.name}>Criar Deal</Button>
          </div>
        </form>
      </Modal>
    </div>
  )
}

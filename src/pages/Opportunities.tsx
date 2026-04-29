import { useState, useEffect } from 'react'
import { Plus, ExternalLink, Calendar, AlertCircle } from 'lucide-react'
import { supabase } from '../lib/supabase'
// useAuth not needed here — opportunities don't require current user context
import type { Opportunity, OpportunityType, OpportunityStatus } from '../lib/types'
import PageHeader from '../components/layout/PageHeader'
import Badge from '../components/ui/Badge'
import Avatar from '../components/ui/Avatar'
import Button from '../components/ui/Button'
import Input from '../components/ui/Input'
import Select from '../components/ui/Select'
import Modal from '../components/ui/Modal'
import Spinner from '../components/ui/Spinner'
import Card from '../components/ui/Card'

const TYPES: OpportunityType[] = ['edital', 'aceleradora', 'investidor', 'hackathon']
const TYPE_LABELS: Record<OpportunityType, string> = {
  edital: 'Edital', aceleradora: 'Aceleradora', investidor: 'Investidor', hackathon: 'Hackathon',
}
const STATUSES: OpportunityStatus[] = ['identificado', 'preparando', 'submetido', 'aprovado', 'reprovado']
const STATUS_LABELS: Record<OpportunityStatus, string> = {
  identificado: 'Identificado', preparando: 'Preparando', submetido: 'Submetido',
  aprovado: 'Aprovado', reprovado: 'Reprovado',
}

export default function Opportunities() {
  const [opportunities, setOpportunities] = useState<Opportunity[]>([])
  const [loading, setLoading] = useState(true)
  const [selectedOpp, setSelectedOpp] = useState<Opportunity | null>(null)
  const [newOppOpen, setNewOppOpen] = useState(false)
  const [profiles, setProfiles] = useState<{id: string; name: string}[]>([])
  const [form, setForm] = useState({
    name: '', type: 'edital' as OpportunityType, organization: '', deadline: '',
    value: '', equity_percent: '', status: 'identificado' as OpportunityStatus,
    notes: '', url: '', assignee_id: '',
  })
  const [editForm, setEditForm] = useState<Partial<Opportunity>>({})

  useEffect(() => { fetchOpportunities() }, [])

  async function fetchOpportunities() {
    setLoading(true)
    const { data } = await supabase.from('opportunities').select('*, assignee:profiles(*)').order('deadline', { ascending: true, nullsFirst: false })
    setOpportunities((data as Opportunity[]) ?? [])
    setLoading(false)
  }

  async function openNewOpp() {
    const { data } = await supabase.from('profiles').select('id, name')
    setProfiles(data ?? [])
    setNewOppOpen(true)
  }

  async function openEdit(opp: Opportunity) {
    const { data } = await supabase.from('profiles').select('id, name')
    setProfiles(data ?? [])
    setEditForm({ ...opp })
    setSelectedOpp(opp)
  }

  async function handleCreate(e: React.FormEvent) {
    e.preventDefault()
    await supabase.from('opportunities').insert([{
      name: form.name, type: form.type, organization: form.organization || null,
      deadline: form.deadline || null, value: form.value ? parseFloat(form.value) : null,
      equity_percent: form.equity_percent ? parseFloat(form.equity_percent) : null,
      status: form.status, notes: form.notes || null, url: form.url || null,
      assignee_id: form.assignee_id || null,
    }])
    await fetchOpportunities()
    setNewOppOpen(false)
    setForm({ name: '', type: 'edital', organization: '', deadline: '', value: '', equity_percent: '', status: 'identificado', notes: '', url: '', assignee_id: '' })
  }

  async function handleUpdate(e: React.FormEvent) {
    e.preventDefault()
    if (!selectedOpp) return
    await supabase.from('opportunities').update(editForm).eq('id', selectedOpp.id)
    await fetchOpportunities()
    setSelectedOpp(null)
    setEditForm({})
  }

  function getDaysLeft(deadline: string | null): number | null {
    if (!deadline) return null
    return Math.ceil((new Date(deadline).getTime() - Date.now()) / 86400000)
  }

  function formatValue(v: number | null): string {
    if (v == null) return ''
    return new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL', maximumFractionDigits: 0 }).format(v)
  }

  if (loading) return <div className="flex items-center justify-center h-64"><Spinner size="lg" /></div>

  const grouped = TYPES.reduce((acc, type) => {
    acc[type] = opportunities.filter(o => o.type === type)
    return acc
  }, {} as Record<OpportunityType, Opportunity[]>)

  return (
    <div className="p-8">
      <PageHeader
        title="Oportunidades"
        subtitle="Editais, aceleradoras e investidores"
        actions={<Button variant="primary" onClick={openNewOpp}><Plus size={16} /> Nova Oportunidade</Button>}
      />

      <div className="space-y-8">
        {TYPES.map(type => {
          const opps = grouped[type]
          if (opps.length === 0) return null
          return (
            <div key={type}>
              <h2 className="font-display text-xl text-text-secondary tracking-wider mb-4 flex items-center gap-2">
                {TYPE_LABELS[type].toUpperCase()}
                <span className="text-text-muted text-sm font-mono">({opps.length})</span>
              </h2>
              <div className="grid grid-cols-3 gap-4">
                {opps.map(opp => {
                  const daysLeft = getDaysLeft(opp.deadline)
                  const urgent = daysLeft !== null && daysLeft <= 14
                  const overdue = daysLeft !== null && daysLeft < 0

                  return (
                    <Card key={opp.id} hover onClick={() => openEdit(opp)} className="p-5">
                      <div className="flex items-start justify-between mb-3">
                        <Badge value={opp.status} type="oppStatus" />
                        {opp.url && (
                          <a href={opp.url} target="_blank" rel="noreferrer"
                            onClick={e => e.stopPropagation()}
                            className="text-text-muted hover:text-teal transition-colors">
                            <ExternalLink size={13} />
                          </a>
                        )}
                      </div>
                      <h3 className="text-text-primary font-sans font-medium text-sm mb-1">{opp.name}</h3>
                      {opp.organization && <p className="text-text-muted text-xs font-mono mb-3">{opp.organization}</p>}

                      <div className="space-y-1.5">
                        {opp.deadline && (
                          <div className={`flex items-center gap-1.5 text-xs font-mono ${overdue ? 'text-red-DEFAULT' : urgent ? 'text-amber' : 'text-text-muted'}`}>
                            {urgent && <AlertCircle size={11} />}
                            <Calendar size={11} />
                            {new Date(opp.deadline + 'T00:00:00').toLocaleDateString('pt-BR', { day: '2-digit', month: 'short', year: 'numeric' })}
                            {daysLeft !== null && (
                              <span>
                                {overdue ? '· vencido' : daysLeft === 0 ? '· hoje' : `· ${daysLeft}d`}
                              </span>
                            )}
                          </div>
                        )}
                        {opp.value && <p className="text-teal text-xs font-mono">{formatValue(opp.value)}</p>}
                        {opp.equity_percent != null && <p className="text-text-secondary text-xs font-mono">{opp.equity_percent}% equity</p>}
                      </div>

                      {opp.assignee && (
                        <div className="flex items-center gap-2 mt-3 pt-3 border-t border-border">
                          <Avatar profile={opp.assignee} size="sm" />
                          <span className="text-text-muted text-xs font-mono">{opp.assignee.name}</span>
                        </div>
                      )}
                    </Card>
                  )
                })}
              </div>
            </div>
          )
        })}

        {opportunities.length === 0 && (
          <div className="text-center py-16 text-text-muted font-mono text-sm">Nenhuma oportunidade cadastrada.</div>
        )}
      </div>

      {/* Modal nova oportunidade */}
      <Modal open={newOppOpen} onClose={() => setNewOppOpen(false)} title="Nova Oportunidade" size="md">
        <form onSubmit={handleCreate} className="p-6 space-y-4">
          <Input label="Nome" value={form.name} onChange={e => setForm(p => ({ ...p, name: e.target.value }))} required placeholder="Ex: YCombinator W26" />
          <div className="grid grid-cols-2 gap-3">
            <Select label="Tipo" value={form.type} onChange={e => setForm(p => ({ ...p, type: e.target.value as OpportunityType }))}>
              {TYPES.map(t => <option key={t} value={t}>{TYPE_LABELS[t]}</option>)}
            </Select>
            <Select label="Status" value={form.status} onChange={e => setForm(p => ({ ...p, status: e.target.value as OpportunityStatus }))}>
              {STATUSES.map(s => <option key={s} value={s}>{STATUS_LABELS[s]}</option>)}
            </Select>
          </div>
          <Input label="Organização" value={form.organization} onChange={e => setForm(p => ({ ...p, organization: e.target.value }))} />
          <Input label="Prazo" type="date" value={form.deadline} onChange={e => setForm(p => ({ ...p, deadline: e.target.value }))} />
          <div className="grid grid-cols-2 gap-3">
            <Input label="Valor (R$)" type="number" value={form.value} onChange={e => setForm(p => ({ ...p, value: e.target.value }))} />
            <Input label="Equity (%)" type="number" step="0.1" value={form.equity_percent} onChange={e => setForm(p => ({ ...p, equity_percent: e.target.value }))} />
          </div>
          <Input label="URL" type="url" value={form.url} onChange={e => setForm(p => ({ ...p, url: e.target.value }))} placeholder="https://..." />
          <Select label="Responsável" value={form.assignee_id} onChange={e => setForm(p => ({ ...p, assignee_id: e.target.value }))}>
            <option value="">Sem responsável</option>
            {profiles.map(p => <option key={p.id} value={p.id}>{p.name}</option>)}
          </Select>
          <div>
            <label className="block text-text-secondary text-xs font-mono tracking-badge uppercase mb-1.5">Notas</label>
            <textarea value={form.notes} onChange={e => setForm(p => ({ ...p, notes: e.target.value }))} rows={2}
              className="w-full bg-bg-surface border border-border rounded-lg px-3 py-2 text-text-primary text-sm font-sans placeholder-text-muted focus:outline-none focus:border-teal-muted resize-none" />
          </div>
          <div className="flex justify-end gap-3 pt-2">
            <Button variant="ghost" type="button" onClick={() => setNewOppOpen(false)}>Cancelar</Button>
            <Button variant="primary" type="submit" disabled={!form.name}>Criar</Button>
          </div>
        </form>
      </Modal>

      {/* Modal editar oportunidade */}
      <Modal open={!!selectedOpp} onClose={() => setSelectedOpp(null)} title="Editar Oportunidade" size="md">
        <form onSubmit={handleUpdate} className="p-6 space-y-4">
          <Input label="Nome" value={editForm.name ?? ''} onChange={e => setEditForm(p => ({ ...p, name: e.target.value }))} required />
          <div className="grid grid-cols-2 gap-3">
            <Select label="Tipo" value={editForm.type ?? 'edital'} onChange={e => setEditForm(p => ({ ...p, type: e.target.value as OpportunityType }))}>
              {TYPES.map(t => <option key={t} value={t}>{TYPE_LABELS[t]}</option>)}
            </Select>
            <Select label="Status" value={editForm.status ?? 'identificado'} onChange={e => setEditForm(p => ({ ...p, status: e.target.value as OpportunityStatus }))}>
              {STATUSES.map(s => <option key={s} value={s}>{STATUS_LABELS[s]}</option>)}
            </Select>
          </div>
          <Input label="Organização" value={editForm.organization ?? ''} onChange={e => setEditForm(p => ({ ...p, organization: e.target.value }))} />
          <Input label="Prazo" type="date" value={editForm.deadline ?? ''} onChange={e => setEditForm(p => ({ ...p, deadline: e.target.value }))} />
          <div className="grid grid-cols-2 gap-3">
            <Input label="Valor (R$)" type="number" value={editForm.value?.toString() ?? ''} onChange={e => setEditForm(p => ({ ...p, value: e.target.value ? parseFloat(e.target.value) : null }))} />
            <Input label="Equity (%)" type="number" step="0.1" value={editForm.equity_percent?.toString() ?? ''} onChange={e => setEditForm(p => ({ ...p, equity_percent: e.target.value ? parseFloat(e.target.value) : null }))} />
          </div>
          <Input label="URL" type="url" value={editForm.url ?? ''} onChange={e => setEditForm(p => ({ ...p, url: e.target.value }))} />
          <Select label="Responsável" value={editForm.assignee_id ?? ''} onChange={e => setEditForm(p => ({ ...p, assignee_id: e.target.value || null }))}>
            <option value="">Sem responsável</option>
            {profiles.map(p => <option key={p.id} value={p.id}>{p.name}</option>)}
          </Select>
          <div>
            <label className="block text-text-secondary text-xs font-mono tracking-badge uppercase mb-1.5">Notas</label>
            <textarea value={editForm.notes ?? ''} onChange={e => setEditForm(p => ({ ...p, notes: e.target.value }))} rows={3}
              className="w-full bg-bg-surface border border-border rounded-lg px-3 py-2 text-text-primary text-sm font-sans placeholder-text-muted focus:outline-none focus:border-teal-muted resize-none" />
          </div>
          <div className="flex justify-end gap-3 pt-2">
            <Button variant="ghost" type="button" onClick={() => setSelectedOpp(null)}>Cancelar</Button>
            <Button variant="primary" type="submit">Salvar alterações</Button>
          </div>
        </form>
      </Modal>
    </div>
  )
}

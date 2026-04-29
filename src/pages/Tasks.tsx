import { useState, useEffect, useRef } from 'react'
import { Plus, ChevronUp, ChevronDown, Trash2, Paperclip, Upload, X } from 'lucide-react'
import { useTasks } from '../hooks/useTasks'
import { useAuth } from '../hooks/useAuth'
import type { Task, TaskStatus, TaskModule, TaskPriority, DocumentAttachment } from '../lib/types'
import PageHeader from '../components/layout/PageHeader'
import Badge from '../components/ui/Badge'
import Avatar from '../components/ui/Avatar'
import Button from '../components/ui/Button'
import Input from '../components/ui/Input'
import Select from '../components/ui/Select'
import SlideOver from '../components/ui/SlideOver'
import Modal from '../components/ui/Modal'
import Spinner from '../components/ui/Spinner'
import Timer from '../components/features/Timer'
import { supabase } from '../lib/supabase'

const MODULES: TaskModule[] = ['produto', 'mercado', 'canais', 'time', 'gestao', 'capital', 'pipeline']
const MODULE_LABELS: Record<TaskModule, string> = {
  produto: 'Produto', mercado: 'Mercado', canais: 'Canais', time: 'Time',
  gestao: 'Gestão', capital: 'Capital', pipeline: 'Pipeline',
}
const PRIORITIES: TaskPriority[] = ['critical', 'high', 'medium', 'low']
const PRIORITY_LABELS: Record<TaskPriority, string> = {
  critical: 'Crítico', high: 'Alta', medium: 'Média', low: 'Baixa',
}
const STATUSES: TaskStatus[] = ['todo', 'in_progress', 'review', 'done']
const STATUS_LABELS: Record<TaskStatus, string> = {
  todo: 'A Fazer', in_progress: 'Em Andamento', review: 'Em Revisão', done: 'Concluído',
}

type SortField = 'priority' | 'due_date' | 'module'
type SortDir = 'asc' | 'desc'

const PRIORITY_ORDER: Record<TaskPriority, number> = { critical: 0, high: 1, medium: 2, low: 3 }

export default function Tasks() {
  const { tasks, loading, createTask, updateTask, deleteTask } = useTasks()
  const { profile } = useAuth()
  const [selectedTask, setSelectedTask] = useState<Task | null>(null)
  const [sortField, setSortField] = useState<SortField>('priority')
  const [sortDir, setSortDir] = useState<SortDir>('asc')
  const [moduleFilter, setModuleFilter] = useState<TaskModule | ''>('')
  const [statusFilter, setStatusFilter] = useState<TaskStatus | ''>('')
  const [newTaskOpen, setNewTaskOpen] = useState(false)
  const [profiles, setProfiles] = useState<{id: string; name: string}[]>([])
  const [attachments, setAttachments] = useState<DocumentAttachment[]>([])
  const [uploading, setUploading] = useState(false)
  const fileInputRef = useRef<HTMLInputElement>(null)

  const [form, setForm] = useState({
    title: '', module: 'gestao' as TaskModule, priority: 'medium' as TaskPriority,
    assignee_id: '', due_date: '', estimated_hours: '', description: '',
  })

  useEffect(() => {
    if (selectedTask) fetchAttachments(selectedTask.id)
  }, [selectedTask?.id])

  async function fetchAttachments(taskId: string) {
    const { data } = await supabase.from('document_attachments').select('*, uploader:profiles(*)').eq('task_id', taskId).order('created_at', { ascending: false })
    setAttachments((data as DocumentAttachment[]) ?? [])
  }

  async function openNewTask() {
    const { data } = await supabase.from('profiles').select('id, name')
    setProfiles(data ?? [])
    setNewTaskOpen(true)
  }

  async function handleCreate(e: React.FormEvent) {
    e.preventDefault()
    await createTask({
      title: form.title, module: form.module, priority: form.priority,
      assignee_id: form.assignee_id || null, due_date: form.due_date || null,
      estimated_hours: form.estimated_hours ? parseFloat(form.estimated_hours) : null,
      description: form.description || null, created_by: profile?.id,
    })
    setNewTaskOpen(false)
    setForm({ title: '', module: 'gestao', priority: 'medium', assignee_id: '', due_date: '', estimated_hours: '', description: '' })
  }

  async function handleFieldUpdate(field: keyof Task, value: unknown) {
    if (!selectedTask) return
    await updateTask(selectedTask.id, { [field]: value })
    setSelectedTask(prev => prev ? { ...prev, [field]: value } : null)
  }

  async function handleUpload(e: React.ChangeEvent<HTMLInputElement>) {
    if (!e.target.files?.[0] || !selectedTask || !profile) return
    const file = e.target.files[0]
    setUploading(true)
    const path = `tasks/${selectedTask.id}/${Date.now()}-${file.name}`
    const { error } = await supabase.storage.from('veredictos-files').upload(path, file)
    if (!error) {
      await supabase.from('document_attachments').insert([{
        task_id: selectedTask.id, file_name: file.name, file_path: path,
        file_size: file.size, file_type: file.type, uploaded_by: profile.id,
      }])
      await fetchAttachments(selectedTask.id)
    }
    setUploading(false)
    if (fileInputRef.current) fileInputRef.current.value = ''
  }

  async function handleDeleteAttachment(id: string, path: string) {
    await supabase.storage.from('veredictos-files').remove([path])
    await supabase.from('document_attachments').delete().eq('id', id)
    setAttachments(prev => prev.filter(a => a.id !== id))
  }

  async function getSignedUrl(path: string) {
    const { data } = await supabase.storage.from('veredictos-files').createSignedUrl(path, 60)
    if (data?.signedUrl) window.open(data.signedUrl, '_blank')
  }

  function sort(a: Task, b: Task): number {
    if (sortField === 'priority') {
      const diff = PRIORITY_ORDER[a.priority] - PRIORITY_ORDER[b.priority]
      return sortDir === 'asc' ? diff : -diff
    }
    if (sortField === 'due_date') {
      const da = a.due_date ?? 'Z'
      const db = b.due_date ?? 'Z'
      return sortDir === 'asc' ? da.localeCompare(db) : db.localeCompare(da)
    }
    if (sortField === 'module') {
      return sortDir === 'asc' ? a.module.localeCompare(b.module) : b.module.localeCompare(a.module)
    }
    return 0
  }

  function toggleSort(field: SortField) {
    if (sortField === field) setSortDir(d => d === 'asc' ? 'desc' : 'asc')
    else { setSortField(field); setSortDir('asc') }
  }

  const filtered = tasks
    .filter(t => !moduleFilter || t.module === moduleFilter)
    .filter(t => !statusFilter || t.status === statusFilter)
    .sort(sort)

  if (loading) return <div className="flex items-center justify-center h-64"><Spinner size="lg" /></div>

  return (
    <div className="p-8">
      <PageHeader
        title="Tarefas"
        subtitle={`${filtered.length} tarefa${filtered.length !== 1 ? 's' : ''}`}
        actions={
          <Button variant="primary" onClick={openNewTask}><Plus size={16} /> Nova Tarefa</Button>
        }
      />

      {/* Filtros e ordenação */}
      <div className="flex items-center gap-3 mb-6 flex-wrap">
        <select value={moduleFilter} onChange={e => setModuleFilter(e.target.value as TaskModule | '')}
          className="bg-bg-surface border border-border rounded-lg px-3 py-1.5 text-text-secondary text-xs font-mono focus:outline-none focus:border-teal-muted">
          <option value="">Todos os módulos</option>
          {MODULES.map(m => <option key={m} value={m}>{MODULE_LABELS[m]}</option>)}
        </select>
        <select value={statusFilter} onChange={e => setStatusFilter(e.target.value as TaskStatus | '')}
          className="bg-bg-surface border border-border rounded-lg px-3 py-1.5 text-text-secondary text-xs font-mono focus:outline-none focus:border-teal-muted">
          <option value="">Todos os status</option>
          {STATUSES.map(s => <option key={s} value={s}>{STATUS_LABELS[s]}</option>)}
        </select>
        <div className="flex items-center gap-1 ml-auto text-text-muted text-xs font-mono">
          <span>Ordenar por:</span>
          {(['priority', 'due_date', 'module'] as SortField[]).map(f => (
            <button key={f} onClick={() => toggleSort(f)}
              className={`flex items-center gap-1 px-2 py-1 rounded transition-colors ${sortField === f ? 'text-teal' : 'hover:text-text-secondary'}`}>
              {f === 'priority' ? 'Prioridade' : f === 'due_date' ? 'Prazo' : 'Módulo'}
              {sortField === f && (sortDir === 'asc' ? <ChevronUp size={12} /> : <ChevronDown size={12} />)}
            </button>
          ))}
        </div>
      </div>

      {/* Lista */}
      <div className="bg-bg-card border border-border rounded-xl overflow-hidden">
        <div className="grid grid-cols-[1fr_120px_120px_100px_40px] gap-4 px-5 py-3 border-b border-border text-text-muted text-[10px] font-mono tracking-badge uppercase">
          <span>Tarefa</span><span>Módulo</span><span>Prioridade</span><span>Prazo</span><span />
        </div>
        {filtered.length === 0 ? (
          <div className="text-center py-12 text-text-muted text-sm font-mono">Nenhuma tarefa encontrada.</div>
        ) : (
          filtered.map(task => (
            <div key={task.id}
              onClick={() => setSelectedTask(task)}
              className="grid grid-cols-[1fr_120px_120px_100px_40px] gap-4 px-5 py-4 border-b border-border last:border-0 cursor-pointer hover:bg-teal-glow transition-colors items-center">
              <div className="flex items-center gap-3 min-w-0">
                <Badge value={task.status} type="status" className="flex-shrink-0" />
                <span className="text-text-primary text-sm font-sans truncate">{task.title}</span>
              </div>
              <Badge value={task.module} type="module" />
              <Badge value={task.priority} type="priority" />
              <span className="text-text-muted text-xs font-mono">
                {task.due_date ? new Date(task.due_date + 'T00:00:00').toLocaleDateString('pt-BR', { day: '2-digit', month: 'short' }) : '—'}
              </span>
              {task.assignee ? <Avatar profile={task.assignee} size="sm" /> : <div />}
            </div>
          ))
        )}
      </div>

      {/* Slide-over detalhe */}
      <SlideOver open={!!selectedTask} onClose={() => setSelectedTask(null)} width="xl">
        {selectedTask && (
          <div className="p-6 space-y-6">
            {/* Título editável */}
            <input
              defaultValue={selectedTask.title}
              onBlur={e => handleFieldUpdate('title', e.target.value)}
              className="w-full bg-transparent text-text-primary text-xl font-display tracking-wider focus:outline-none border-b border-transparent focus:border-teal/30 pb-1 transition-colors"
            />

            {/* Campos */}
            <div className="grid grid-cols-2 gap-4">
              <Select label="Status" value={selectedTask.status} onChange={e => handleFieldUpdate('status', e.target.value)}>
                {STATUSES.map(s => <option key={s} value={s}>{STATUS_LABELS[s]}</option>)}
              </Select>
              <Select label="Prioridade" value={selectedTask.priority} onChange={e => handleFieldUpdate('priority', e.target.value)}>
                {PRIORITIES.map(p => <option key={p} value={p}>{PRIORITY_LABELS[p]}</option>)}
              </Select>
              <Select label="Módulo" value={selectedTask.module} onChange={e => handleFieldUpdate('module', e.target.value)}>
                {MODULES.map(m => <option key={m} value={m}>{MODULE_LABELS[m]}</option>)}
              </Select>
              <Input label="Prazo" type="date" defaultValue={selectedTask.due_date ?? ''} onBlur={e => handleFieldUpdate('due_date', e.target.value || null)} />
              <Input label="Estimativa (h)" type="number" step="0.5" defaultValue={selectedTask.estimated_hours?.toString() ?? ''} onBlur={e => handleFieldUpdate('estimated_hours', e.target.value ? parseFloat(e.target.value) : null)} />
            </div>

            {/* Descrição */}
            <div>
              <label className="block text-text-secondary text-xs font-mono tracking-badge uppercase mb-1.5">Descrição</label>
              <textarea
                defaultValue={selectedTask.description ?? ''}
                onBlur={e => handleFieldUpdate('description', e.target.value || null)}
                rows={4}
                placeholder="Adicione uma descrição..."
                className="w-full bg-bg-surface border border-border rounded-lg px-3 py-2 text-text-primary text-sm font-sans placeholder-text-muted focus:outline-none focus:border-teal-muted resize-none"
              />
            </div>

            {/* Timer */}
            <div>
              <label className="block text-text-secondary text-xs font-mono tracking-badge uppercase mb-3">Tempo</label>
              <Timer taskId={selectedTask.id} userId={profile?.id} />
            </div>

            {/* Anexos */}
            <div>
              <div className="flex items-center justify-between mb-3">
                <label className="text-text-secondary text-xs font-mono tracking-badge uppercase">Anexos ({attachments.length})</label>
                <button onClick={() => fileInputRef.current?.click()} disabled={uploading}
                  className="flex items-center gap-1.5 text-xs font-mono text-teal hover:text-teal-dim transition-colors">
                  <Upload size={12} /> {uploading ? 'Enviando...' : 'Enviar arquivo'}
                </button>
              </div>
              <input ref={fileInputRef} type="file" className="hidden" onChange={handleUpload} />
              {attachments.length > 0 ? (
                <div className="space-y-2">
                  {attachments.map(a => (
                    <div key={a.id} className="flex items-center justify-between bg-bg-surface border border-border rounded-lg px-3 py-2">
                      <button onClick={() => getSignedUrl(a.file_path)} className="flex items-center gap-2 text-left group">
                        <Paperclip size={12} className="text-text-muted" />
                        <span className="text-text-secondary text-xs font-mono group-hover:text-teal transition-colors truncate max-w-[280px]">{a.file_name}</span>
                        {a.file_size && <span className="text-text-muted text-xs font-mono flex-shrink-0">{(a.file_size / 1024).toFixed(0)}KB</span>}
                      </button>
                      <button onClick={() => handleDeleteAttachment(a.id, a.file_path)} className="text-text-muted hover:text-red-DEFAULT transition-colors ml-2">
                        <X size={14} />
                      </button>
                    </div>
                  ))}
                </div>
              ) : (
                <p className="text-text-muted text-xs font-mono">Nenhum anexo.</p>
              )}
            </div>

            {/* Deletar */}
            <div className="pt-4 border-t border-border">
              <Button variant="danger" size="sm" onClick={async () => {
                if (confirm('Excluir esta tarefa?')) {
                  await deleteTask(selectedTask.id)
                  setSelectedTask(null)
                }
              }}>
                <Trash2 size={14} /> Excluir tarefa
              </Button>
            </div>
          </div>
        )}
      </SlideOver>

      {/* Modal nova task */}
      <Modal open={newTaskOpen} onClose={() => setNewTaskOpen(false)} title="Nova Tarefa" size="md">
        <form onSubmit={handleCreate} className="p-6 space-y-4">
          <Input label="Título" value={form.title} onChange={e => setForm(p => ({ ...p, title: e.target.value }))} required placeholder="Descreva a tarefa..." />
          <div className="grid grid-cols-2 gap-3">
            <Select label="Módulo" value={form.module} onChange={e => setForm(p => ({ ...p, module: e.target.value as TaskModule }))}>
              {MODULES.map(m => <option key={m} value={m}>{MODULE_LABELS[m]}</option>)}
            </Select>
            <Select label="Prioridade" value={form.priority} onChange={e => setForm(p => ({ ...p, priority: e.target.value as TaskPriority }))}>
              {PRIORITIES.map(p => <option key={p} value={p}>{PRIORITY_LABELS[p]}</option>)}
            </Select>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <Input label="Prazo" type="date" value={form.due_date} onChange={e => setForm(p => ({ ...p, due_date: e.target.value }))} />
            <Input label="Estimativa (h)" type="number" step="0.5" value={form.estimated_hours} onChange={e => setForm(p => ({ ...p, estimated_hours: e.target.value }))} placeholder="Ex: 4" />
          </div>
          <Select label="Responsável" value={form.assignee_id} onChange={e => setForm(p => ({ ...p, assignee_id: e.target.value }))}>
            <option value="">Sem responsável</option>
            {profiles.map(p => <option key={p.id} value={p.id}>{p.name}</option>)}
          </Select>
          <div>
            <label className="block text-text-secondary text-xs font-mono tracking-badge uppercase mb-1.5">Descrição</label>
            <textarea value={form.description} onChange={e => setForm(p => ({ ...p, description: e.target.value }))} rows={3} placeholder="Descrição opcional..." className="w-full bg-bg-surface border border-border rounded-lg px-3 py-2 text-text-primary text-sm font-sans placeholder-text-muted focus:outline-none focus:border-teal-muted resize-none" />
          </div>
          <div className="flex justify-end gap-3 pt-2">
            <Button variant="ghost" type="button" onClick={() => setNewTaskOpen(false)}>Cancelar</Button>
            <Button variant="primary" type="submit" disabled={!form.title}>Criar Tarefa</Button>
          </div>
        </form>
      </Modal>
    </div>
  )
}

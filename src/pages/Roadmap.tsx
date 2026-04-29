import { useState, useCallback } from 'react'
import { Plus } from 'lucide-react'
import { DragDropContext, Droppable, Draggable } from '@hello-pangea/dnd'
import type { DropResult } from '@hello-pangea/dnd'
import { useTasks } from '../hooks/useTasks'
import { useAuth } from '../hooks/useAuth'
import type { TaskStatus, TaskModule, TaskPriority } from '../lib/types'
import PageHeader from '../components/layout/PageHeader'
import TaskCard from '../components/features/TaskCard'
import Button from '../components/ui/Button'
import Modal from '../components/ui/Modal'
import Input from '../components/ui/Input'
import Select from '../components/ui/Select'
import Spinner from '../components/ui/Spinner'
import { supabase } from '../lib/supabase'

const COLUMNS: { id: TaskStatus; label: string }[] = [
  { id: 'todo', label: 'A Fazer' },
  { id: 'in_progress', label: 'Em Andamento' },
  { id: 'review', label: 'Em Revisão' },
  { id: 'done', label: 'Concluído' },
]

const MODULES: TaskModule[] = ['produto', 'mercado', 'canais', 'time', 'gestao', 'capital', 'pipeline']
const MODULE_LABELS: Record<TaskModule, string> = {
  produto: 'Produto', mercado: 'Mercado', canais: 'Canais', time: 'Time',
  gestao: 'Gestão', capital: 'Capital', pipeline: 'Pipeline',
}
const PRIORITIES: TaskPriority[] = ['critical', 'high', 'medium', 'low']
const PRIORITY_LABELS: Record<TaskPriority, string> = {
  critical: 'Crítico', high: 'Alta', medium: 'Média', low: 'Baixa',
}

export default function Roadmap() {
  const { tasks, loading, updateTaskStatus, createTask } = useTasks()
  const { profile } = useAuth()
  const [moduleFilter, setModuleFilter] = useState<TaskModule | ''>('')
  const [priorityFilter, setPriorityFilter] = useState<TaskPriority | ''>('')
  const [newTaskOpen, setNewTaskOpen] = useState(false)
  const [profiles, setProfiles] = useState<{id: string; name: string}[]>([])
  const [form, setForm] = useState({
    title: '', module: 'gestao' as TaskModule, priority: 'medium' as TaskPriority,
    assignee_id: '', due_date: '', estimated_hours: '',
  })
  const [saving, setSaving] = useState(false)

  const filtered = tasks.filter(t =>
    (!moduleFilter || t.module === moduleFilter) &&
    (!priorityFilter || t.priority === priorityFilter)
  )

  function getColumn(status: TaskStatus) {
    return filtered.filter(t => t.status === status)
  }

  const onDragEnd = useCallback(async (result: DropResult) => {
    if (!result.destination) return
    const { draggableId, destination } = result
    const newStatus = destination.droppableId as TaskStatus
    await updateTaskStatus(draggableId, newStatus)
  }, [updateTaskStatus])

  async function openNewTask() {
    const { data } = await supabase.from('profiles').select('id, name')
    setProfiles(data ?? [])
    setNewTaskOpen(true)
  }

  async function handleCreate(e: React.FormEvent) {
    e.preventDefault()
    setSaving(true)
    try {
      await createTask({
        title: form.title,
        module: form.module,
        priority: form.priority,
        assignee_id: form.assignee_id || null,
        due_date: form.due_date || null,
        estimated_hours: form.estimated_hours ? parseFloat(form.estimated_hours) : null,
        created_by: profile?.id,
      })
      setNewTaskOpen(false)
      setForm({ title: '', module: 'gestao', priority: 'medium', assignee_id: '', due_date: '', estimated_hours: '' })
    } finally {
      setSaving(false)
    }
  }

  if (loading) return (
    <div className="flex items-center justify-center h-64"><Spinner size="lg" /></div>
  )

  return (
    <div className="h-full flex flex-col">
      <div className="px-8 pt-8 pb-4">
        <PageHeader
          title="Roadmap"
          subtitle="Kanban de tarefas e entregas"
          actions={
            <Button variant="primary" onClick={openNewTask}>
              <Plus size={16} /> Nova Task
            </Button>
          }
        />

        {/* Filtros */}
        <div className="flex items-center gap-3 mb-6">
          <select
            value={moduleFilter}
            onChange={e => setModuleFilter(e.target.value as TaskModule | '')}
            className="bg-bg-surface border border-border rounded-lg px-3 py-1.5 text-text-secondary text-xs font-mono focus:outline-none focus:border-teal-muted transition-colors"
          >
            <option value="">Todos os módulos</option>
            {MODULES.map(m => <option key={m} value={m}>{MODULE_LABELS[m]}</option>)}
          </select>
          <select
            value={priorityFilter}
            onChange={e => setPriorityFilter(e.target.value as TaskPriority | '')}
            className="bg-bg-surface border border-border rounded-lg px-3 py-1.5 text-text-secondary text-xs font-mono focus:outline-none focus:border-teal-muted transition-colors"
          >
            <option value="">Todas as prioridades</option>
            {PRIORITIES.map(p => <option key={p} value={p}>{PRIORITY_LABELS[p]}</option>)}
          </select>
          <span className="text-text-muted text-xs font-mono">{filtered.length} task{filtered.length !== 1 ? 's' : ''}</span>
        </div>
      </div>

      {/* Kanban */}
      <div className="flex-1 px-8 pb-8 overflow-x-auto">
        <DragDropContext onDragEnd={onDragEnd}>
          <div className="flex gap-4 h-full min-w-max">
            {COLUMNS.map(col => {
              const colTasks = getColumn(col.id)
              return (
                <div key={col.id} className="w-72 flex-shrink-0 flex flex-col">
                  <div className="flex items-center justify-between mb-3">
                    <h3 className="text-text-secondary text-xs font-mono tracking-badge uppercase">{col.label}</h3>
                    <span className="text-text-muted text-xs font-mono bg-bg-surface border border-border px-1.5 py-0.5 rounded">
                      {colTasks.length}
                    </span>
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
                        {colTasks.map((task, index) => (
                          <Draggable key={task.id} draggableId={task.id} index={index}>
                            {(provided, snapshot) => (
                              <div
                                ref={provided.innerRef}
                                {...provided.draggableProps}
                                {...provided.dragHandleProps}
                              >
                                <TaskCard task={task} dragging={snapshot.isDragging} />
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

      {/* Modal nova task */}
      <Modal open={newTaskOpen} onClose={() => setNewTaskOpen(false)} title="Nova Task" size="md">
        <form onSubmit={handleCreate} className="p-6 space-y-4">
          <Input
            label="Título"
            value={form.title}
            onChange={e => setForm(p => ({ ...p, title: e.target.value }))}
            required
            placeholder="Descreva a tarefa..."
          />
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
            <Input label="Estimativa (horas)" type="number" step="0.5" value={form.estimated_hours} onChange={e => setForm(p => ({ ...p, estimated_hours: e.target.value }))} placeholder="Ex: 4" />
          </div>
          <Select label="Responsável" value={form.assignee_id} onChange={e => setForm(p => ({ ...p, assignee_id: e.target.value }))}>
            <option value="">Sem responsável</option>
            {profiles.map(p => <option key={p.id} value={p.id}>{p.name}</option>)}
          </Select>
          <div className="flex justify-end gap-3 pt-2">
            <Button variant="ghost" type="button" onClick={() => setNewTaskOpen(false)}>Cancelar</Button>
            <Button variant="primary" type="submit" disabled={saving || !form.title}>
              {saving ? 'Criando...' : 'Criar Task'}
            </Button>
          </div>
        </form>
      </Modal>
    </div>
  )
}

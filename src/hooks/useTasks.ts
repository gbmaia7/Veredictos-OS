import { useState, useEffect, useCallback } from 'react'
import { supabase } from '../lib/supabase'
import type { Task, TaskStatus, TaskModule, TaskPriority } from '../lib/types'

export function useTasks(filters?: { module?: TaskModule; assignee_id?: string; priority?: TaskPriority }) {
  const [tasks, setTasks] = useState<Task[]>([])
  const [loading, setLoading] = useState(true)

  const fetchTasks = useCallback(async () => {
    setLoading(true)
    let query = supabase
      .from('tasks')
      .select('*, assignee:profiles!tasks_assignee_id_fkey(*)')
      .order('due_date', { ascending: true, nullsFirst: false })

    if (filters?.module) query = query.eq('module', filters.module)
    if (filters?.assignee_id) query = query.eq('assignee_id', filters.assignee_id)
    if (filters?.priority) query = query.eq('priority', filters.priority)

    const { data } = await query
    setTasks((data as Task[]) ?? [])
    setLoading(false)
  }, [filters?.module, filters?.assignee_id, filters?.priority])

  useEffect(() => {
    fetchTasks()

    const channel = supabase
      .channel('tasks-realtime')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'tasks' }, fetchTasks)
      .subscribe()

    return () => { supabase.removeChannel(channel) }
  }, [fetchTasks])

  async function updateTaskStatus(id: string, status: TaskStatus) {
    await supabase.from('tasks').update({ status }).eq('id', id)
  }

  async function createTask(data: Partial<Task>) {
    const { error } = await supabase.from('tasks').insert([{
      title: data.title!,
      status: data.status ?? 'todo',
      priority: data.priority ?? 'medium',
      module: data.module ?? 'gestao',
      description: data.description,
      assignee_id: data.assignee_id,
      due_date: data.due_date,
      estimated_hours: data.estimated_hours,
      tags: data.tags ?? [],
    }])
    if (error) throw error
  }

  async function updateTask(id: string, data: Partial<Task>) {
    const { error } = await supabase.from('tasks').update(data).eq('id', id)
    if (error) throw error
  }

  async function deleteTask(id: string) {
    await supabase.from('tasks').delete().eq('id', id)
  }

  return { tasks, loading, fetchTasks, updateTaskStatus, createTask, updateTask, deleteTask }
}

export function useTask(id: string | null) {
  const [task, setTask] = useState<Task | null>(null)
  const [loading, setLoading] = useState(false)

  useEffect(() => {
    if (!id) { setTask(null); return }
    setLoading(true)
    supabase
      .from('tasks')
      .select('*, assignee:profiles!tasks_assignee_id_fkey(*)')
      .eq('id', id)
      .single()
      .then(({ data }) => {
        setTask(data as Task)
        setLoading(false)
      })
  }, [id])

  return { task, loading }
}

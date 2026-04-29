import { useState, useEffect, useRef } from 'react'
import { supabase } from '../lib/supabase'
import type { TimeEntry } from '../lib/types'

export function useTimer(taskId: string, userId: string | undefined) {
  const [entries, setEntries] = useState<TimeEntry[]>([])
  const [activeEntry, setActiveEntry] = useState<TimeEntry | null>(null)
  const [elapsed, setElapsed] = useState(0)
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null)

  useEffect(() => {
    if (!taskId) return
    fetchEntries()
  }, [taskId])

  useEffect(() => {
    if (activeEntry) {
      const startTime = new Date(activeEntry.started_at).getTime()
      intervalRef.current = setInterval(() => {
        setElapsed(Math.floor((Date.now() - startTime) / 1000))
      }, 1000)
    } else {
      if (intervalRef.current) clearInterval(intervalRef.current)
      setElapsed(0)
    }
    return () => { if (intervalRef.current) clearInterval(intervalRef.current) }
  }, [activeEntry])

  async function fetchEntries() {
    const { data } = await supabase
      .from('time_entries')
      .select('*, user:profiles(*)')
      .eq('task_id', taskId)
      .order('started_at', { ascending: false })

    const all = (data as TimeEntry[]) ?? []
    setEntries(all)

    const active = userId ? all.find(e => !e.ended_at && e.user_id === userId) ?? null : null
    setActiveEntry(active)
    if (active) {
      setElapsed(Math.floor((Date.now() - new Date(active.started_at).getTime()) / 1000))
    }
  }

  async function startTimer() {
    if (!userId || activeEntry) return
    const { data, error } = await supabase.from('time_entries').insert([{
      task_id: taskId,
      user_id: userId,
      started_at: new Date().toISOString(),
    }]).select('*, user:profiles(*)').single()
    if (error) throw error
    setActiveEntry(data as TimeEntry)
    setEntries(prev => [data as TimeEntry, ...prev])
  }

  async function stopTimer(note?: string) {
    if (!activeEntry) return
    const endedAt = new Date().toISOString()
    const duration = Math.floor((new Date(endedAt).getTime() - new Date(activeEntry.started_at).getTime()) / 1000)

    await supabase.from('time_entries').update({
      ended_at: endedAt,
      duration_seconds: duration,
      note: note ?? null,
    }).eq('id', activeEntry.id)

    setActiveEntry(null)
    await fetchEntries()
  }

  const totalSeconds = entries
    .filter(e => e.duration_seconds)
    .reduce((acc, e) => acc + (e.duration_seconds ?? 0), 0)

  return { entries, activeEntry, elapsed, totalSeconds, startTimer, stopTimer, fetchEntries }
}

export function formatDuration(seconds: number): string {
  const h = Math.floor(seconds / 3600)
  const m = Math.floor((seconds % 3600) / 60)
  const s = seconds % 60
  if (h > 0) return `${h}h ${m.toString().padStart(2, '0')}m`
  return `${m.toString().padStart(2, '0')}m ${s.toString().padStart(2, '0')}s`
}

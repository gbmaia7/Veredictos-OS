import { useState, useEffect, useCallback } from 'react'
import { supabase } from '../lib/supabase'
import type { Deal, DealActivity, DealSector, ActivityType } from '../lib/types'

export function useDeals(sectorFilter?: DealSector) {
  const [deals, setDeals] = useState<Deal[]>([])
  const [loading, setLoading] = useState(true)

  const fetchDeals = useCallback(async () => {
    setLoading(true)
    let query = supabase
      .from('deals')
      .select('*, assignee:profiles!deals_assignee_id_fkey(*)')
      .neq('stage', 'perdido')
      .order('updated_at', { ascending: false })

    if (sectorFilter) query = query.eq('sector', sectorFilter)

    const { data } = await query
    setDeals((data as Deal[]) ?? [])
    setLoading(false)
  }, [sectorFilter])

  useEffect(() => {
    fetchDeals()

    const channel = supabase
      .channel('deals-realtime')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'deals' }, fetchDeals)
      .subscribe()

    return () => { supabase.removeChannel(channel) }
  }, [fetchDeals])

  async function createDeal(data: Partial<Deal>) {
    const { error } = await supabase.from('deals').insert([{
      name: data.name!,
      sector: data.sector ?? 'publico',
      stage: data.stage ?? 'prospeccao',
      organization: data.organization,
      contact_name: data.contact_name,
      contact_email: data.contact_email,
      contact_phone: data.contact_phone,
      value: data.value,
      probability: data.probability ?? 20,
      next_action: data.next_action,
      next_action_date: data.next_action_date,
      notes: data.notes,
      assignee_id: data.assignee_id,
    }])
    if (error) throw error
  }

  async function updateDeal(id: string, data: Partial<Deal>) {
    const { error } = await supabase.from('deals').update(data).eq('id', id)
    if (error) throw error
  }

  return { deals, loading, fetchDeals, createDeal, updateDeal }
}

export function useDealActivities(dealId: string | null) {
  const [activities, setActivities] = useState<DealActivity[]>([])

  useEffect(() => {
    if (!dealId) return
    supabase
      .from('deal_activities')
      .select('*, user:profiles(*)')
      .eq('deal_id', dealId)
      .order('created_at', { ascending: false })
      .then(({ data }) => setActivities((data as DealActivity[]) ?? []))
  }, [dealId])

  async function addActivity(dealId: string, userId: string, type: ActivityType, content: string) {
    const { error } = await supabase.from('deal_activities').insert([{
      deal_id: dealId, user_id: userId, type, content,
    }])
    if (error) throw error
    const { data } = await supabase
      .from('deal_activities')
      .select('*, user:profiles(*)')
      .eq('deal_id', dealId)
      .order('created_at', { ascending: false })
    setActivities((data as DealActivity[]) ?? [])
  }

  return { activities, addActivity }
}

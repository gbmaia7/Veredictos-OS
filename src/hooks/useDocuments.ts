import { useState, useEffect, useCallback } from 'react'
import { supabase } from '../lib/supabase'
import type { Document, DocumentCategory } from '../lib/types'

export function useDocuments(categoryFilter?: DocumentCategory) {
  const [documents, setDocuments] = useState<Document[]>([])
  const [loading, setLoading] = useState(true)

  const fetchDocuments = useCallback(async () => {
    setLoading(true)
    let query = supabase
      .from('documents')
      .select('*, creator:profiles!documents_created_by_fkey(*), last_editor:profiles!documents_last_edited_by_fkey(*)')
      .order('is_pinned', { ascending: false })
      .order('updated_at', { ascending: false })

    if (categoryFilter) query = query.eq('category', categoryFilter)

    const { data } = await query
    setDocuments((data as Document[]) ?? [])
    setLoading(false)
  }, [categoryFilter])

  useEffect(() => { fetchDocuments() }, [fetchDocuments])

  async function createDocument(data: { title: string; category: DocumentCategory; created_by: string }) {
    const { data: doc, error } = await supabase.from('documents').insert([{
      title: data.title,
      category: data.category,
      created_by: data.created_by,
      last_edited_by: data.created_by,
      content: null,
      is_pinned: false,
    }]).select().single()
    if (error) throw error
    await fetchDocuments()
    return doc as Document
  }

  async function updateDocument(id: string, data: Partial<Document>) {
    await supabase.from('documents').update(data).eq('id', id)
  }

  async function togglePin(id: string, currentPinned: boolean) {
    await supabase.from('documents').update({ is_pinned: !currentPinned }).eq('id', id)
    await fetchDocuments()
  }

  return { documents, loading, fetchDocuments, createDocument, updateDocument, togglePin }
}

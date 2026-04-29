import { useState, useEffect, useRef } from 'react'
import { Plus, Pin, PinOff, ArrowLeft, Paperclip, Upload, X } from 'lucide-react'
import { useEditor, EditorContent } from '@tiptap/react'
import StarterKit from '@tiptap/starter-kit'
import Placeholder from '@tiptap/extension-placeholder'
import { useDocuments } from '../hooks/useDocuments'
import { useAuth } from '../hooks/useAuth'
import type { Document, DocumentCategory, DocumentAttachment } from '../lib/types'
import PageHeader from '../components/layout/PageHeader'
import Badge from '../components/ui/Badge'
import Avatar from '../components/ui/Avatar'
import Button from '../components/ui/Button'
import Input from '../components/ui/Input'
import Select from '../components/ui/Select'
import Modal from '../components/ui/Modal'
import Spinner from '../components/ui/Spinner'
import { supabase } from '../lib/supabase'

const CATEGORIES: DocumentCategory[] = ['reuniao', 'estrategia', 'tecnico', 'comercial', 'geral']
const CATEGORY_LABELS: Record<DocumentCategory, string> = {
  reuniao: 'Reunião', estrategia: 'Estratégia', tecnico: 'Técnico', comercial: 'Comercial', geral: 'Geral',
}

export default function Documents() {
  const { profile } = useAuth()
  const [categoryFilter, setCategoryFilter] = useState<DocumentCategory | undefined>(undefined)
  const { documents, loading, createDocument, updateDocument, togglePin, fetchDocuments } = useDocuments(categoryFilter)
  const [selectedDoc, setSelectedDoc] = useState<Document | null>(null)
  const [newDocOpen, setNewDocOpen] = useState(false)
  const [newDocForm, setNewDocForm] = useState({ title: '', category: 'geral' as DocumentCategory })
  const [saveStatus, setSaveStatus] = useState<'idle' | 'saving' | 'saved'>('idle')
  const [attachments, setAttachments] = useState<DocumentAttachment[]>([])
  const [uploading, setUploading] = useState(false)
  const fileInputRef = useRef<HTMLInputElement>(null)
  const saveTimer = useRef<ReturnType<typeof setTimeout> | null>(null)

  const editor = useEditor({
    extensions: [
      StarterKit,
      Placeholder.configure({ placeholder: 'Comece a escrever...' }),
    ],
    content: selectedDoc?.content ?? null,
    onUpdate: ({ editor }) => {
      if (!selectedDoc) return
      setSaveStatus('saving')
      if (saveTimer.current) clearTimeout(saveTimer.current)
      saveTimer.current = setTimeout(async () => {
        await updateDocument(selectedDoc.id, {
          content: editor.getJSON() as Record<string, unknown>,
          last_edited_by: profile?.id,
        })
        setSaveStatus('saved')
        setTimeout(() => setSaveStatus('idle'), 2000)
      }, 3000)
    },
    editorProps: {
      attributes: { class: 'tiptap' },
    },
  })

  useEffect(() => {
    if (selectedDoc && editor) {
      editor.commands.setContent(selectedDoc.content ?? null)
    }
  }, [selectedDoc?.id])

  useEffect(() => {
    if (selectedDoc) fetchAttachments(selectedDoc.id)
  }, [selectedDoc?.id])

  async function fetchAttachments(docId: string) {
    const { data } = await supabase.from('document_attachments').select('*, uploader:profiles(*)').eq('document_id', docId).order('created_at', { ascending: false })
    setAttachments((data as DocumentAttachment[]) ?? [])
  }

  async function handleCreate(e: React.FormEvent) {
    e.preventDefault()
    if (!profile) return
    const doc = await createDocument({ title: newDocForm.title, category: newDocForm.category, created_by: profile.id })
    setNewDocOpen(false)
    setNewDocForm({ title: '', category: 'geral' })
    setSelectedDoc(doc)
  }

  async function handleUpload(e: React.ChangeEvent<HTMLInputElement>) {
    if (!e.target.files?.[0] || !selectedDoc || !profile) return
    const file = e.target.files[0]
    setUploading(true)
    const path = `documents/${selectedDoc.id}/${Date.now()}-${file.name}`
    const { error } = await supabase.storage.from('veredictos-files').upload(path, file)
    if (!error) {
      await supabase.from('document_attachments').insert([{
        document_id: selectedDoc.id, file_name: file.name, file_path: path,
        file_size: file.size, file_type: file.type, uploaded_by: profile.id,
      }])
      await fetchAttachments(selectedDoc.id)
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

  async function handleTitleBlur(value: string) {
    if (!selectedDoc || value === selectedDoc.title) return
    await updateDocument(selectedDoc.id, { title: value })
    setSelectedDoc(prev => prev ? { ...prev, title: value } : null)
    await fetchDocuments()
  }

  if (loading) return <div className="flex items-center justify-center h-64"><Spinner size="lg" /></div>

  // Editor view
  if (selectedDoc) {
    return (
      <div className="h-full flex flex-col">
        {/* Toolbar */}
        <div className="px-8 py-4 border-b border-border flex items-center justify-between flex-shrink-0">
          <div className="flex items-center gap-4">
            <button onClick={() => { setSelectedDoc(null); fetchDocuments() }}
              className="flex items-center gap-2 text-text-muted hover:text-text-primary transition-colors text-sm font-mono">
              <ArrowLeft size={14} /> Documentos
            </button>
            <div className="w-px h-4 bg-border" />
            <Badge value={selectedDoc.category} type="oppType" />
          </div>
          <div className="flex items-center gap-3">
            {saveStatus === 'saving' && <span className="text-text-muted text-xs font-mono">Salvando...</span>}
            {saveStatus === 'saved' && <span className="text-teal text-xs font-mono">Salvo ✓</span>}
            <EditorToolbar editor={editor} />
          </div>
        </div>

        <div className="flex-1 flex overflow-hidden">
          {/* Editor */}
          <div className="flex-1 overflow-y-auto px-16 py-8">
            <input
              defaultValue={selectedDoc.title}
              onBlur={e => handleTitleBlur(e.target.value)}
              className="w-full bg-transparent text-text-primary font-display text-5xl tracking-wider focus:outline-none mb-8 border-b-2 border-transparent focus:border-teal/30 pb-2"
              placeholder="Título do documento"
            />
            <EditorContent editor={editor} />
          </div>

          {/* Metadados */}
          <div className="w-60 flex-shrink-0 border-l border-border p-5 overflow-y-auto">
            <div className="space-y-5">
              <div>
                <p className="text-text-muted text-[10px] font-mono tracking-badge uppercase mb-1">Criado em</p>
                <p className="text-text-secondary text-xs font-mono">{new Date(selectedDoc.created_at).toLocaleDateString('pt-BR')}</p>
              </div>
              {selectedDoc.creator && (
                <div>
                  <p className="text-text-muted text-[10px] font-mono tracking-badge uppercase mb-2">Criado por</p>
                  <div className="flex items-center gap-2">
                    <Avatar profile={selectedDoc.creator} size="sm" />
                    <span className="text-text-secondary text-xs font-sans">{selectedDoc.creator.name}</span>
                  </div>
                </div>
              )}
              <div>
                <p className="text-text-muted text-[10px] font-mono tracking-badge uppercase mb-1">Atualizado</p>
                <p className="text-text-secondary text-xs font-mono">{new Date(selectedDoc.updated_at).toLocaleDateString('pt-BR')}</p>
              </div>
              <div>
                <Select label="Categoria" value={selectedDoc.category} onChange={async e => {
                  const cat = e.target.value as DocumentCategory
                  await updateDocument(selectedDoc.id, { category: cat })
                  setSelectedDoc(prev => prev ? { ...prev, category: cat } : null)
                }}>
                  {CATEGORIES.map(c => <option key={c} value={c}>{CATEGORY_LABELS[c]}</option>)}
                </Select>
              </div>

              {/* Anexos */}
              <div>
                <div className="flex items-center justify-between mb-2">
                  <p className="text-text-muted text-[10px] font-mono tracking-badge uppercase">Anexos</p>
                  <button onClick={() => fileInputRef.current?.click()} disabled={uploading}
                    className="text-teal hover:text-teal-dim transition-colors"><Upload size={12} /></button>
                </div>
                <input ref={fileInputRef} type="file" className="hidden" onChange={handleUpload} />
                {attachments.length === 0 ? (
                  <p className="text-text-muted text-[10px] font-mono">Nenhum anexo</p>
                ) : (
                  <div className="space-y-1.5">
                    {attachments.map(a => (
                      <div key={a.id} className="flex items-center justify-between group">
                        <button onClick={() => getSignedUrl(a.file_path)} className="flex items-center gap-1.5 text-left flex-1 min-w-0">
                          <Paperclip size={10} className="text-text-muted flex-shrink-0" />
                          <span className="text-text-secondary text-[10px] font-mono truncate group-hover:text-teal transition-colors">{a.file_name}</span>
                        </button>
                        <button onClick={() => handleDeleteAttachment(a.id, a.file_path)} className="text-text-muted hover:text-red-DEFAULT transition-colors ml-1">
                          <X size={10} />
                        </button>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>
    )
  }

  // Lista view
  return (
    <div className="p-8">
      <PageHeader
        title="Documentos"
        subtitle="Base de conhecimento"
        actions={
          <Button variant="primary" onClick={() => setNewDocOpen(true)}><Plus size={16} /> Novo Documento</Button>
        }
      />

      <div className="flex items-center gap-3 mb-6">
        <button onClick={() => setCategoryFilter(undefined)}
          className={`px-3 py-1.5 rounded-lg text-xs font-mono transition-colors ${!categoryFilter ? 'bg-teal/20 text-teal border border-teal/30' : 'bg-bg-surface text-text-muted border border-border hover:text-text-secondary'}`}>
          Todos
        </button>
        {CATEGORIES.map(c => (
          <button key={c} onClick={() => setCategoryFilter(c === categoryFilter ? undefined : c)}
            className={`px-3 py-1.5 rounded-lg text-xs font-mono transition-colors ${categoryFilter === c ? 'bg-teal/20 text-teal border border-teal/30' : 'bg-bg-surface text-text-muted border border-border hover:text-text-secondary'}`}>
            {CATEGORY_LABELS[c]}
          </button>
        ))}
      </div>

      {documents.length === 0 ? (
        <div className="text-center py-16 text-text-muted font-mono text-sm">Nenhum documento encontrado.</div>
      ) : (
        <div className="space-y-2">
          {documents.map(doc => (
            <div key={doc.id}
              className="flex items-center gap-4 bg-bg-card border border-border rounded-xl px-5 py-4 cursor-pointer hover:border-teal/30 hover:bg-teal-glow transition-all group"
              onClick={() => setSelectedDoc(doc)}>
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-3 mb-1">
                  {doc.is_pinned && <Pin size={12} className="text-teal flex-shrink-0" />}
                  <p className="text-text-primary text-sm font-sans font-medium truncate">{doc.title}</p>
                </div>
                <div className="flex items-center gap-3">
                  <Badge value={doc.category} type="oppType" />
                  <span className="text-text-muted text-xs font-mono">
                    {new Date(doc.updated_at).toLocaleDateString('pt-BR')}
                  </span>
                  {doc.last_editor && (
                    <div className="flex items-center gap-1.5">
                      <Avatar profile={doc.last_editor} size="sm" />
                      <span className="text-text-muted text-xs font-mono">{doc.last_editor.name}</span>
                    </div>
                  )}
                </div>
              </div>
              <button
                onClick={async e => { e.stopPropagation(); await togglePin(doc.id, doc.is_pinned) }}
                className="opacity-0 group-hover:opacity-100 transition-opacity text-text-muted hover:text-teal"
              >
                {doc.is_pinned ? <PinOff size={14} /> : <Pin size={14} />}
              </button>
            </div>
          ))}
        </div>
      )}

      <Modal open={newDocOpen} onClose={() => setNewDocOpen(false)} title="Novo Documento" size="sm">
        <form onSubmit={handleCreate} className="p-6 space-y-4">
          <Input label="Título" value={newDocForm.title} onChange={e => setNewDocForm(p => ({ ...p, title: e.target.value }))} required placeholder="Nome do documento..." />
          <Select label="Categoria" value={newDocForm.category} onChange={e => setNewDocForm(p => ({ ...p, category: e.target.value as DocumentCategory }))}>
            {CATEGORIES.map(c => <option key={c} value={c}>{CATEGORY_LABELS[c]}</option>)}
          </Select>
          <div className="flex justify-end gap-3 pt-2">
            <Button variant="ghost" type="button" onClick={() => setNewDocOpen(false)}>Cancelar</Button>
            <Button variant="primary" type="submit" disabled={!newDocForm.title}>Criar</Button>
          </div>
        </form>
      </Modal>
    </div>
  )
}

function EditorToolbar({ editor }: { editor: ReturnType<typeof useEditor> }) {
  if (!editor) return null

  const btn = (active: boolean, onClick: () => void, label: string) => (
    <button
      onClick={onClick}
      className={`px-2 py-1 rounded text-xs font-mono transition-colors ${active ? 'bg-teal/20 text-teal' : 'text-text-muted hover:text-text-secondary'}`}
    >
      {label}
    </button>
  )

  return (
    <div className="flex items-center gap-1 border border-border rounded-lg px-2 py-1">
      {btn(editor.isActive('bold'), () => editor.chain().focus().toggleBold().run(), 'B')}
      {btn(editor.isActive('italic'), () => editor.chain().focus().toggleItalic().run(), 'I')}
      {btn(editor.isActive('heading', { level: 1 }), () => editor.chain().focus().toggleHeading({ level: 1 }).run(), 'H1')}
      {btn(editor.isActive('heading', { level: 2 }), () => editor.chain().focus().toggleHeading({ level: 2 }).run(), 'H2')}
      {btn(editor.isActive('bulletList'), () => editor.chain().focus().toggleBulletList().run(), '•')}
      {btn(editor.isActive('orderedList'), () => editor.chain().focus().toggleOrderedList().run(), '1.')}
      {btn(editor.isActive('code'), () => editor.chain().focus().toggleCode().run(), '<>')}
      {btn(editor.isActive('blockquote'), () => editor.chain().focus().toggleBlockquote().run(), '""')}
      {btn(false, () => editor.chain().focus().setHorizontalRule().run(), '—')}
    </div>
  )
}

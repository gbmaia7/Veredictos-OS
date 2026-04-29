export type UserRole = 'ceo' | 'cto' | 'advisor'
export type TaskStatus = 'todo' | 'in_progress' | 'review' | 'done'
export type TaskPriority = 'low' | 'medium' | 'high' | 'critical'
export type TaskModule = 'produto' | 'mercado' | 'canais' | 'time' | 'gestao' | 'capital' | 'pipeline'
export type DealSector = 'publico' | 'privado'
export type DealStage = 'prospeccao' | 'contato' | 'reuniao' | 'negociacao' | 'piloto' | 'assinado' | 'perdido'
export type DocumentCategory = 'reuniao' | 'estrategia' | 'tecnico' | 'comercial' | 'geral'
export type OpportunityType = 'edital' | 'aceleradora' | 'investidor' | 'hackathon'
export type OpportunityStatus = 'identificado' | 'preparando' | 'submetido' | 'aprovado' | 'reprovado'
export type ActivityType = 'email' | 'ligacao' | 'reuniao' | 'nota' | 'status_change'

export interface Profile {
  id: string
  name: string
  role: UserRole
  avatar_color: string
  created_at: string
}

export interface Task {
  id: string
  title: string
  description: string | null
  status: TaskStatus
  priority: TaskPriority
  module: TaskModule
  assignee_id: string | null
  due_date: string | null
  estimated_hours: number | null
  tags: string[]
  created_by: string | null
  created_at: string
  updated_at: string
  assignee?: Profile
}

export interface TimeEntry {
  id: string
  task_id: string
  user_id: string
  started_at: string
  ended_at: string | null
  duration_seconds: number | null
  note: string | null
  created_at: string
  user?: Profile
}

export interface Document {
  id: string
  title: string
  content: Record<string, unknown> | null
  category: DocumentCategory
  is_pinned: boolean
  created_by: string | null
  last_edited_by: string | null
  created_at: string
  updated_at: string
  creator?: Profile
  last_editor?: Profile
}

export interface DocumentAttachment {
  id: string
  document_id: string | null
  task_id: string | null
  file_name: string
  file_path: string
  file_size: number | null
  file_type: string | null
  uploaded_by: string | null
  created_at: string
  uploader?: Profile
}

export interface Deal {
  id: string
  name: string
  organization: string | null
  contact_name: string | null
  contact_email: string | null
  contact_phone: string | null
  sector: DealSector
  stage: DealStage
  value: number | null
  probability: number
  next_action: string | null
  next_action_date: string | null
  notes: string | null
  assignee_id: string | null
  created_by: string | null
  created_at: string
  updated_at: string
  assignee?: Profile
}

export interface DealActivity {
  id: string
  deal_id: string
  user_id: string
  type: ActivityType
  content: string | null
  created_at: string
  user?: Profile
}

export interface Opportunity {
  id: string
  name: string
  type: OpportunityType
  organization: string | null
  deadline: string | null
  value: number | null
  equity_percent: number | null
  status: OpportunityStatus
  notes: string | null
  url: string | null
  assignee_id: string | null
  created_at: string
  updated_at: string
  assignee?: Profile
}

export interface Database {
  public: {
    Tables: {
      profiles: { Row: Profile; Insert: Omit<Profile, 'created_at'>; Update: Partial<Profile> }
      tasks: { Row: Task; Insert: Omit<Task, 'id' | 'created_at' | 'updated_at'>; Update: Partial<Task> }
      time_entries: { Row: TimeEntry; Insert: Omit<TimeEntry, 'id' | 'created_at'>; Update: Partial<TimeEntry> }
      documents: { Row: Document; Insert: Omit<Document, 'id' | 'created_at' | 'updated_at'>; Update: Partial<Document> }
      document_attachments: { Row: DocumentAttachment; Insert: Omit<DocumentAttachment, 'id' | 'created_at'>; Update: Partial<DocumentAttachment> }
      deals: { Row: Deal; Insert: Omit<Deal, 'id' | 'created_at' | 'updated_at'>; Update: Partial<Deal> }
      deal_activities: { Row: DealActivity; Insert: Omit<DealActivity, 'id' | 'created_at'>; Update: Partial<DealActivity> }
      opportunities: { Row: Opportunity; Insert: Omit<Opportunity, 'id' | 'created_at' | 'updated_at'>; Update: Partial<Opportunity> }
    }
  }
}

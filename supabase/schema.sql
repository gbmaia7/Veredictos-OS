-- Perfis de usuário (extensão da tabela auth.users do Supabase)
create table profiles (
  id uuid references auth.users on delete cascade primary key,
  name text not null,
  role text not null, -- 'ceo' | 'cto' | 'advisor'
  avatar_color text default '#00E5C3',
  created_at timestamptz default now()
);

-- Tasks (Roadmap + gestão de tarefas)
create table tasks (
  id uuid primary key default gen_random_uuid(),
  title text not null,
  description text,
  status text not null default 'todo', -- 'todo' | 'in_progress' | 'review' | 'done'
  priority text not null default 'medium', -- 'low' | 'medium' | 'high' | 'critical'
  module text not null default 'gestao', -- 'produto' | 'mercado' | 'canais' | 'time' | 'gestao' | 'capital' | 'pipeline'
  assignee_id uuid references profiles(id),
  due_date date,
  estimated_hours numeric(5,2),
  tags text[] default '{}',
  created_by uuid references profiles(id),
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

-- Entradas de tempo (cronômetro)
create table time_entries (
  id uuid primary key default gen_random_uuid(),
  task_id uuid references tasks(id) on delete cascade,
  user_id uuid references profiles(id),
  started_at timestamptz not null,
  ended_at timestamptz,
  duration_seconds integer, -- preenchido ao parar
  note text,
  created_at timestamptz default now()
);

-- Documentos (editor rich text)
create table documents (
  id uuid primary key default gen_random_uuid(),
  title text not null,
  content jsonb, -- TipTap JSON
  category text default 'geral', -- 'reuniao' | 'estrategia' | 'tecnico' | 'comercial' | 'geral'
  is_pinned boolean default false,
  created_by uuid references profiles(id),
  last_edited_by uuid references profiles(id),
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

-- Anexos de documentos (Supabase Storage)
create table document_attachments (
  id uuid primary key default gen_random_uuid(),
  document_id uuid references documents(id) on delete cascade,
  task_id uuid references tasks(id) on delete cascade,
  file_name text not null,
  file_path text not null, -- path no Supabase Storage
  file_size integer,
  file_type text,
  uploaded_by uuid references profiles(id),
  created_at timestamptz default now()
);

-- Pipeline comercial
create table deals (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  organization text,
  contact_name text,
  contact_email text,
  contact_phone text,
  sector text not null default 'publico', -- 'publico' | 'privado'
  stage text not null default 'prospeccao', -- 'prospeccao' | 'contato' | 'reuniao' | 'negociacao' | 'piloto' | 'assinado' | 'perdido'
  value numeric(12,2),
  probability integer default 20, -- % de chance de fechar
  next_action text,
  next_action_date date,
  notes text,
  assignee_id uuid references profiles(id),
  created_by uuid references profiles(id),
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

-- Atividades do pipeline (histórico de interações)
create table deal_activities (
  id uuid primary key default gen_random_uuid(),
  deal_id uuid references deals(id) on delete cascade,
  user_id uuid references profiles(id),
  type text not null, -- 'email' | 'ligacao' | 'reuniao' | 'nota' | 'status_change'
  content text,
  created_at timestamptz default now()
);

-- Editais e oportunidades de capital
create table opportunities (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  type text not null, -- 'edital' | 'aceleradora' | 'investidor' | 'hackathon'
  organization text,
  deadline date,
  value numeric(12,2),
  equity_percent numeric(5,2),
  status text default 'identificado', -- 'identificado' | 'preparando' | 'submetido' | 'aprovado' | 'reprovado'
  notes text,
  url text,
  assignee_id uuid references profiles(id),
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

-- RLS (Row Level Security)
alter table profiles enable row level security;
alter table tasks enable row level security;
alter table time_entries enable row level security;
alter table documents enable row level security;
alter table document_attachments enable row level security;
alter table deals enable row level security;
alter table deal_activities enable row level security;
alter table opportunities enable row level security;

create policy "authenticated_all" on profiles for all using (auth.role() = 'authenticated');
create policy "authenticated_all" on tasks for all using (auth.role() = 'authenticated');
create policy "authenticated_all" on time_entries for all using (auth.role() = 'authenticated');
create policy "authenticated_all" on documents for all using (auth.role() = 'authenticated');
create policy "authenticated_all" on document_attachments for all using (auth.role() = 'authenticated');
create policy "authenticated_all" on deals for all using (auth.role() = 'authenticated');
create policy "authenticated_all" on deal_activities for all using (auth.role() = 'authenticated');
create policy "authenticated_all" on opportunities for all using (auth.role() = 'authenticated');

-- Storage bucket para arquivos
insert into storage.buckets (id, name, public) values ('veredictos-files', 'veredictos-files', false);
create policy "authenticated_storage" on storage.objects for all using (auth.role() = 'authenticated');

-- Trigger para atualizar updated_at automaticamente
create or replace function update_updated_at()
returns trigger as $$
begin
  new.updated_at = now();
  return new;
end;
$$ language plpgsql;

create trigger tasks_updated_at before update on tasks for each row execute function update_updated_at();
create trigger documents_updated_at before update on documents for each row execute function update_updated_at();
create trigger deals_updated_at before update on deals for each row execute function update_updated_at();
create trigger opportunities_updated_at before update on opportunities for each row execute function update_updated_at();

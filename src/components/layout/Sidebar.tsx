import { NavLink, useNavigate } from 'react-router-dom'
import {
  LayoutDashboard,
  Map,
  CheckSquare,
  TrendingUp,
  FileText,
  Zap,
  LogOut,
} from 'lucide-react'
import { useAuth } from '../../hooks/useAuth'
import Avatar from '../ui/Avatar'

const navItems = [
  { path: '/', icon: LayoutDashboard, label: 'Dashboard' },
  { path: '/roadmap', icon: Map, label: 'Roadmap' },
  { path: '/tasks', icon: CheckSquare, label: 'Tarefas' },
  { path: '/pipeline', icon: TrendingUp, label: 'Pipeline' },
  { path: '/documents', icon: FileText, label: 'Documentos' },
  { path: '/opportunities', icon: Zap, label: 'Oportunidades' },
]

const roleLabels: Record<string, string> = {
  ceo: 'CEO',
  cto: 'CTO',
  advisor: 'Advisor Clínico',
}

export default function Sidebar() {
  const { profile, signOut } = useAuth()
  const navigate = useNavigate()

  async function handleSignOut() {
    await signOut()
    navigate('/login')
  }

  return (
    <aside className="w-60 flex-shrink-0 h-full bg-bg-surface border-r border-border flex flex-col">
      {/* Logo */}
      <div className="px-5 py-5 border-b border-border">
        <div className="flex items-baseline gap-1.5">
          <span className="font-display text-2xl text-text-primary tracking-widest">VEREDICTOS</span>
          <span className="font-display text-2xl text-teal tracking-widest">OS</span>
        </div>
        <p className="text-text-muted text-[10px] font-mono tracking-badge mt-0.5">SISTEMA OPERACIONAL</p>
      </div>

      {/* User info */}
      {profile && (
        <div className="px-4 py-3 border-b border-border">
          <div className="flex items-center gap-3">
            <Avatar profile={profile} size="md" />
            <div className="min-w-0">
              <p className="text-text-primary text-sm font-sans font-medium truncate">{profile.name}</p>
              <span className="text-[10px] font-mono tracking-badge text-teal-muted uppercase">
                {roleLabels[profile.role] ?? profile.role}
              </span>
            </div>
          </div>
        </div>
      )}

      {/* Navigation */}
      <nav className="flex-1 px-2 py-3 space-y-0.5">
        {navItems.map(({ path, icon: Icon, label }) => (
          <NavLink
            key={path}
            to={path}
            end={path === '/'}
            className={({ isActive }) =>
              `flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-sans transition-all group ${
                isActive
                  ? 'bg-teal-glow text-teal border border-teal/20'
                  : 'text-text-secondary hover:text-text-primary hover:bg-teal-glow'
              }`
            }
          >
            {({ isActive }) => (
              <>
                <Icon size={16} className={isActive ? 'text-teal' : 'text-text-muted group-hover:text-text-secondary'} />
                {label}
              </>
            )}
          </NavLink>
        ))}
      </nav>

      {/* Footer */}
      <div className="px-2 py-3 border-t border-border">
        <button
          onClick={handleSignOut}
          className="flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-sans text-text-muted hover:text-red-DEFAULT hover:bg-red-bg transition-all w-full"
        >
          <LogOut size={16} />
          Sair
        </button>
      </div>
    </aside>
  )
}

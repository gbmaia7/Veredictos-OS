import { useState } from 'react'
import type { FormEvent } from 'react'
import { useAuth } from '../hooks/useAuth'

export default function Login() {
  const { signIn } = useAuth()
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)

  async function handleSubmit(e: FormEvent) {
    e.preventDefault()
    setError('')
    setLoading(true)
    try {
      await signIn(email, password)
    } catch (err) {
      setError('Email ou senha inválidos. Verifique suas credenciais.')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen bg-bg-primary flex items-center justify-center px-4">
      <div className="w-full max-w-sm">
        {/* Logo */}
        <div className="text-center mb-10">
          <div className="inline-flex items-baseline gap-2">
            <span className="font-display text-5xl text-text-primary tracking-widest">VEREDICTOS</span>
            <span className="font-display text-5xl text-teal tracking-widest">OS</span>
          </div>
          <p className="mt-2 text-text-muted font-mono text-xs tracking-badge uppercase">
            Sistema Operacional Interno
          </p>
        </div>

        {/* Card de login */}
        <div className="bg-bg-card border border-border rounded-xl p-8">
          <h2 className="text-text-primary font-display text-2xl tracking-wider mb-6">ENTRAR</h2>

          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-text-secondary text-xs font-mono tracking-badge uppercase mb-1.5">
                Email
              </label>
              <input
                type="email"
                value={email}
                onChange={e => setEmail(e.target.value)}
                required
                className="w-full bg-bg-surface border border-border rounded-lg px-4 py-2.5 text-text-primary text-sm font-sans placeholder-text-muted focus:outline-none focus:border-teal-muted transition-colors"
                placeholder="seu@email.com"
              />
            </div>

            <div>
              <label className="block text-text-secondary text-xs font-mono tracking-badge uppercase mb-1.5">
                Senha
              </label>
              <input
                type="password"
                value={password}
                onChange={e => setPassword(e.target.value)}
                required
                className="w-full bg-bg-surface border border-border rounded-lg px-4 py-2.5 text-text-primary text-sm font-sans placeholder-text-muted focus:outline-none focus:border-teal-muted transition-colors"
                placeholder="••••••••"
              />
            </div>

            {error && (
              <p className="text-red-DEFAULT text-xs font-mono">{error}</p>
            )}

            <button
              type="submit"
              disabled={loading}
              className="w-full bg-teal hover:bg-teal-dim disabled:opacity-50 disabled:cursor-not-allowed text-bg-primary font-sans font-700 font-bold rounded-lg py-2.5 px-4 text-sm transition-colors mt-2"
            >
              {loading ? 'Entrando...' : 'Entrar'}
            </button>
          </form>
        </div>

        <p className="text-center text-text-muted text-xs mt-6 font-mono">
          Acesso restrito. Contate o administrador para criar uma conta.
        </p>
      </div>
    </div>
  )
}

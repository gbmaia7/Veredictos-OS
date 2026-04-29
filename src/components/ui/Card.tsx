import type { ReactNode } from 'react'

interface CardProps {
  children: ReactNode
  className?: string
  onClick?: () => void
  hover?: boolean
}

export default function Card({ children, className = '', onClick, hover = false }: CardProps) {
  const base = 'bg-bg-card border border-border rounded-xl'
  const hoverClass = hover ? 'cursor-pointer transition-all hover:border-teal/30 hover:bg-teal-glow' : ''
  const clickable = onClick ? 'cursor-pointer' : ''

  return (
    <div
      className={`${base} ${hoverClass} ${clickable} ${className}`}
      onClick={onClick}
    >
      {children}
    </div>
  )
}

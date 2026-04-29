import type { Profile } from '../../lib/types'

interface AvatarProps {
  profile: Profile | null | undefined
  size?: 'sm' | 'md' | 'lg'
  className?: string
}

export default function Avatar({ profile, size = 'md', className = '' }: AvatarProps) {
  const sizes = {
    sm: 'w-6 h-6 text-xs',
    md: 'w-8 h-8 text-sm',
    lg: 'w-10 h-10 text-base',
  }

  const initial = profile?.name ? profile.name.charAt(0).toUpperCase() : '?'
  const color = profile?.avatar_color ?? '#00E5C3'

  return (
    <div
      className={`rounded-full flex items-center justify-center font-sans font-bold text-bg-primary flex-shrink-0 ${sizes[size]} ${className}`}
      style={{ backgroundColor: color }}
      title={profile?.name}
    >
      {initial}
    </div>
  )
}

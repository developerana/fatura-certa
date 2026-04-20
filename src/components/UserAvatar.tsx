import { cn } from '@/lib/utils';

interface UserAvatarProps {
  name?: string | null;
  email?: string | null;
  size?: 'sm' | 'md' | 'lg' | 'xl';
  className?: string;
}

const sizeClasses: Record<NonNullable<UserAvatarProps['size']>, string> = {
  sm: 'h-8 w-8 text-xs',
  md: 'h-10 w-10 text-sm',
  lg: 'h-14 w-14 text-base',
  xl: 'h-20 w-20 text-2xl',
};

function getInitials(name?: string | null, email?: string | null): string {
  const source = (name?.trim() || email?.split('@')[0] || '?').trim();
  const parts = source.split(/\s+/).filter(Boolean);
  if (parts.length === 0) return '?';
  if (parts.length === 1) return parts[0].slice(0, 2).toUpperCase();
  return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase();
}

// Stable color from a string seed
function getColorClass(seed: string): string {
  const palette = [
    'bg-primary/20 text-primary',
    'bg-accent/30 text-accent-foreground',
    'bg-secondary text-secondary-foreground',
    'bg-muted text-foreground',
  ];
  let hash = 0;
  for (let i = 0; i < seed.length; i++) hash = (hash * 31 + seed.charCodeAt(i)) >>> 0;
  return palette[hash % palette.length];
}

export function UserAvatar({ name, email, size = 'md', className }: UserAvatarProps) {
  const initials = getInitials(name, email);
  const seed = (name || email || 'user').toLowerCase();
  const color = getColorClass(seed);
  return (
    <div
      className={cn(
        'rounded-full flex items-center justify-center font-semibold ring-1 ring-border/50 select-none',
        sizeClasses[size],
        color,
        className,
      )}
      aria-label={name || email || 'Usuário'}
    >
      {initials}
    </div>
  );
}

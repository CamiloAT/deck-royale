export interface AvatarColorOption {
  key: string
  label: string
  main: string
  light: string
  /** Extra color for frog belly or penguin inner */
  extra?: string
  /** Frog bump/nostril color (separate from main for spotted frogs) */
  bumps?: string
  /** Frog spot color */
  spots?: string
  /** Frog eye color override */
  eyeColor?: string
}

export const AVATAR_COLORS: Record<string, AvatarColorOption[]> = {
  classic: [
    { key: 'blue', label: 'Azul', main: '#1e40af', light: '#3b82f6' },
    { key: 'black', label: 'Negro', main: '#1a1a2e', light: '#374151' },
    { key: 'white', label: 'Blanco', main: '#9ca3af', light: '#d1d5db' },
    { key: 'green', label: 'Verde', main: '#14532d', light: '#166534' },
  ],
  female: [
    { key: 'purple', label: 'Morado', main: '#7c3aed', light: '#a78bfa' },
    { key: 'fuchsia', label: 'Fucsia', main: '#a21caf', light: '#d946ef' },
    { key: 'red', label: 'Rojo', main: '#991b1b', light: '#dc2626' },
    { key: 'green', label: 'Verde', main: '#166534', light: '#4ade80' },
  ],
  frog: [
    { key: 'green', label: 'Verde', main: '#166534', light: '#22c55e', extra: '#4ade80', bumps: '#14532d', spots: '#14532d' },
    { key: 'brown', label: 'Marron', main: '#713f12', light: '#a16207', extra: '#d4a017', bumps: '#422006', spots: '#422006' },
    { key: 'fire', label: 'Fuego', main: '#1a1a1a', light: '#f97316', extra: '#2a2a2a', bumps: '#1a1a1a', spots: '#f97316', eyeColor: '#0a0a0a' },
    { key: 'poison', label: 'Veneno', main: '#0891b2', light: '#22d3ee', extra: '#a5f3fc', bumps: '#164e63', spots: '#0e1525', eyeColor: '#0a0a0a' },
  ],
  penguin: [
    { key: 'orange', label: 'Naranja', main: '#f59e0b', light: '#e08800' },
    { key: 'blue', label: 'Azul', main: '#3b82f6', light: '#2563eb' },
    { key: 'red', label: 'Rojo', main: '#ef4444', light: '#dc2626' },
    { key: 'green', label: 'Verde', main: '#22c55e', light: '#16a34a' },
  ],
}

export const AVATAR_DEFAULT_COLORS: Record<string, string> = {
  classic: 'blue',
  female: 'purple',
  frog: 'green',
  penguin: 'orange',
}

export function getAvatarColorOption(avatarType: string, colorKey?: string): AvatarColorOption {
  const palette = AVATAR_COLORS[avatarType] || AVATAR_COLORS.classic
  const key = colorKey || AVATAR_DEFAULT_COLORS[avatarType] || palette[0].key
  return palette.find(c => c.key === key) || palette[0]
}

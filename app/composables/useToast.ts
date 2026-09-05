export interface Toast {
  id: number
  message: string
  variant: 'error' | 'fold' | 'check' | 'call' | 'raise' | 'allin' | 'winner'
}

export interface ToastStyle {
  bg: string
  text: string
  border: string
}

let toastId = 0

const toasts = ref<Toast[]>([])

function classifyMessage(msg: string): Toast['variant'] {
  const lower = msg.toLowerCase()
  if (lower.includes('all-in') || lower.includes('all in')) return 'allin'
  if (lower.includes('gana')) return 'winner'
  if (lower.includes('sube')) return 'raise'
  if (lower.includes('iguala')) return 'call'
  if (lower.includes('pasa')) return 'check'
  if (lower.includes('se fue') || lower.includes('fold')) return 'fold'
  return 'check'
}

const VARIANT_STYLES: Record<Toast['variant'], ToastStyle> = {
  error: { bg: '#cc0000', text: '#ffffff', border: 'rgba(255,255,255,0.3)' },
  fold: { bg: '#374151', text: '#9ca3af', border: 'rgba(156,163,175,0.3)' },
  check: { bg: '#1e3a5f', text: '#60a5fa', border: 'rgba(96,165,250,0.3)' },
  call: { bg: '#78350f', text: '#fbbf24', border: 'rgba(251,191,36,0.3)' },
  raise: { bg: '#7c2d12', text: '#fb923c', border: 'rgba(251,146,60,0.3)' },
  allin: { bg: '#7f1d1d', text: '#f87171', border: 'rgba(248,113,113,0.3)' },
  winner: { bg: '#14532d', text: '#4ade80', border: 'rgba(74,222,128,0.3)' },
}

export function useToast() {
  function show(message: string, variant?: Toast['variant'], duration = 4000) {
    const id = ++toastId
    const v = variant || classifyMessage(message)
    toasts.value.push({ id, message, variant: v })
    setTimeout(() => dismiss(id), duration)
  }

  function showError(message: string) {
    show(message, 'error', 5000)
  }

  function dismiss(id: number) {
    toasts.value = toasts.value.filter(t => t.id !== id)
  }

  function getStyle(variant: Toast['variant']): ToastStyle {
    return VARIANT_STYLES[variant]
  }

  return { toasts, show, showError, dismiss, getStyle }
}

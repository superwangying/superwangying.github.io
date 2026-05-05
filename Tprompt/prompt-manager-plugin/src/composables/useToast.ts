/* ============================================================
  useToast — 轻量级全局 Toast 通知 composable
  ============================================================ */

export type ToastType = 'success' | 'error' | 'warning' | 'info'

export interface Toast {
  id: string
  message: string
  type: ToastType
  duration: number
}

const toasts = ref<Toast[]>([])

export function useToast() {
  /**
   * 显示一条 Toast，自动在 duration ms 后消失
   * @param message 通知内容
   * @param type  类型
   * @param duration 显示时长（默认 2500ms）
   */
  function show(message: string, type: ToastType = 'info', duration = 2500) {
    const id = `${Date.now()}-${Math.random().toString(36).slice(2)}`
    const toast: Toast = { id, message, type, duration }
    toasts.value.push(toast)

    setTimeout(() => {
      dismiss(id)
    }, duration)

    return id
  }

  function dismiss(id: string) {
    const idx = toasts.value.findIndex(t => t.id === id)
    if (idx !== -1) toasts.value.splice(idx, 1)
  }

  function success(message: string, duration = 2500) { return show(message, 'success', duration) }
  function error(message: string, duration = 3500)   { return show(message, 'error', duration) }
  function warning(message: string, duration = 3000)  { return show(message, 'warning', duration) }
  function info(message: string, duration = 2500)    { return show(message, 'info', duration) }

  return {
    toasts: readonly(toasts),
    show,
    dismiss,
    success,
    error,
    warning,
    info,
  }
}

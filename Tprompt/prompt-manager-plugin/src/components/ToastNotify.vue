<template>
  <Teleport to="body">
    <div class="toast-container" aria-live="polite" aria-atomic="true">
      <TransitionGroup name="toast">
        <div
          v-for="toast in toasts"
          :key="toast.id"
          class="toast"
          :class="`toast--${toast.type}`"
          @click="dismiss(toast.id)"
          role="alert"
        >
          <!-- 图标 -->
          <span class="toast__icon">
            <IconRender v-if="toast.type === 'success'" icon="carbon:checkmark-filled" :size="18" class="toast-icon--success" />
            <IconRender v-else-if="toast.type === 'error'"   icon="carbon:warning-filled"   :size="18" class="toast-icon--error" />
            <IconRender v-else-if="toast.type === 'warning'" icon="carbon:warning"           :size="18" class="toast-icon--warning" />
            <IconRender v-else                             icon="carbon:information"        :size="18" class="toast-icon--info" />
          </span>
          <span class="toast__message">{{ toast.message }}</span>
          <button class="toast__close" @click.stop="dismiss(toast.id)">
            <IconRender icon="carbon:close" :size="14" />
          </button>
        </div>
      </TransitionGroup>
    </div>
  </Teleport>
</template>

<script setup lang="ts">
import { useToast } from '@/composables/useToast'

const { toasts, dismiss } = useToast()
</script>

<style scoped>
.toast-container {
  position: fixed;
  top: 16px;
  right: 16px;
  z-index: 99999;
  display: flex;
  flex-direction: column;
  gap: 8px;
  pointer-events: none;
}

.toast {
  display: flex;
  align-items: center;
  gap: 10px;
  padding: 12px 16px;
  border-radius: var(--radius-lg);
  background: var(--bg-surface);
  border: 1.5px solid var(--border-color);
  box-shadow: var(--shadow-xl);
  max-width: 360px;
  min-width: 240px;
  cursor: pointer;
  pointer-events: all;
  font-size: var(--text-sm);
  color: var(--text-primary);
  transition: opacity 200ms ease, transform 200ms ease;
}

.toast:hover {
  opacity: 0.9;
}

.toast__icon {
  font-size: 18px;
  flex-shrink: 0;
  display: flex;
  align-items: center;
}

.toast-icon--success { color: var(--color-success); }
.toast-icon--error   { color: var(--color-error); }
.toast-icon--warning { color: var(--color-warning); }
.toast-icon--info    { color: var(--color-info); }

.toast__message {
  flex: 1;
  line-height: 1.4;
}

.toast__close {
  font-size: 16px;
  color: var(--text-muted);
  padding: 2px;
  border-radius: var(--radius-sm);
  transition: color var(--transition-fast), background var(--transition-fast);
  flex-shrink: 0;
}
.toast__close:hover {
  color: var(--text-primary);
  background: var(--gray-100);
}

/* 暗色 */
[data-theme='dark'] .toast {
  background: var(--gray-800);
  border-color: rgba(255, 255, 255, 0.1);
}

/* 过渡动画 */
.toast-enter-active,
.toast-leave-active {
  transition: all 300ms cubic-bezier(0.16, 1, 0.3, 1);
}
.toast-enter-from {
  opacity: 0;
  transform: translateX(32px) scale(0.95);
}
.toast-leave-to {
  opacity: 0;
  transform: translateX(32px) scale(0.95);
}
</style>

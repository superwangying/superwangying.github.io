<template>
  <div class="theme-toggle" role="group" aria-label="主题切换">
    <button
      v-for="opt in options"
      :key="opt.value"
      class="theme-toggle__btn"
      :class="{ active: modelValue === opt.value }"
      @click="$emit('update:modelValue', opt.value)"
      :aria-pressed="modelValue === opt.value"
      :title="opt.label + ' 模式'"
    >
      <IconRender :icon="opt.icon" :size="15" class="theme-toggle__icon" />
      <span class="theme-toggle__label">{{ opt.label }}</span>
    </button>
  </div>
</template>

<script setup lang="ts">
import type { ThemeMode } from '@/types'

defineProps<{
  modelValue: ThemeMode
}>()

defineEmits<{
  'update:modelValue': [value: ThemeMode]
}>()

const options: Array<{ value: ThemeMode; label: string; icon: string }> = [
  { value: 'light', label: '浅色', icon: 'carbon:sun' },
  { value: 'dark',  label: '深色', icon: 'carbon:moon' },
  { value: 'system', label: '系统', icon: 'carbon:laptop' },
]
</script>

<style scoped>
.theme-toggle {
  display: flex;
  align-items: center;
  gap: 4px;
  padding: 4px;
  background: var(--gray-100);
  border-radius: var(--radius-full);
  border: 1px solid var(--border-color);
}

.theme-toggle__btn {
  display: flex;
  align-items: center;
  gap: 5px;
  padding: 6px 12px;
  border-radius: var(--radius-full);
  font-size: var(--text-sm);
  font-weight: 500;
  color: var(--text-secondary);
  transition: all var(--transition-base);
  cursor: pointer;
  white-space: nowrap;
}

.theme-toggle__btn:hover {
  color: var(--text-primary);
  background: rgba(255, 255, 255, 0.6);
}

.theme-toggle__btn.active {
  background: var(--bg-surface);
  color: var(--primary-700);
  box-shadow: var(--shadow-sm);
}

.theme-toggle__icon svg {
  width: 15px;
  height: 15px;
}

[data-theme='dark'] .theme-toggle {
  background: rgba(255, 255, 255, 0.06);
}

[data-theme='dark'] .theme-toggle__btn:hover {
  background: rgba(255, 255, 255, 0.06);
}

[data-theme='dark'] .theme-toggle__btn.active {
  background: var(--gray-700);
  color: var(--primary-300);
}
</style>

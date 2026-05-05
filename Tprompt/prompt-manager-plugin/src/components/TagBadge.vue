<template>
  <span class="tag-badge" :class="[`tag-badge--${size}`, { 'tag-badge--removable': removable }]">
    <span v-if="color" class="tag-badge__dot" :style="{ background: color }"></span>
    <span class="tag-badge__text">{{ label }}</span>
    <button v-if="removable" class="tag-badge__remove" @click.stop="$emit('remove')" :title="'移除'">
      <IconRender icon="carbon:close" :size="10" />
    </button>
  </span>
</template>

<script setup lang="ts">
defineProps<{
  label: string
  color?: string
  size?: 'sm' | 'md'
  removable?: boolean
}>()

defineEmits<{
  remove: []
}>()
</script>

<style scoped>
.tag-badge {
  display: inline-flex;
  align-items: center;
  gap: 4px;
  border-radius: var(--radius-full);
  font-size: 11px;
  font-weight: 500;
  line-height: 1;
  white-space: nowrap;
  background: var(--gray-100);
  color: var(--gray-700);
  border: 1px solid var(--gray-200);
  transition: background var(--transition-fast), border-color var(--transition-fast);
}

.tag-badge--md {
  padding: 4px 10px;
  font-size: var(--text-sm);
}

.tag-badge--sm {
  padding: 3px 8px;
  font-size: 11px;
}

.tag-badge__dot {
  width: 6px;
  height: 6px;
  border-radius: 50%;
  flex-shrink: 0;
}

.tag-badge__text {
  max-width: 120px;
  overflow: hidden;
  text-overflow: ellipsis;
}

.tag-badge__remove {
  display: flex;
  align-items: center;
  justify-content: center;
  width: 14px;
  height: 14px;
  border-radius: 50%;
  color: var(--gray-400);
  transition: background var(--transition-fast), color var(--transition-fast);
  flex-shrink: 0;
}

.tag-badge__remove:hover {
  background: var(--gray-200);
  color: var(--gray-700);
}

.tag-badge--removable {
  padding-right: 6px;
}

[data-theme='dark'] .tag-badge {
  background: rgba(255, 255, 255, 0.06);
  color: var(--gray-300);
  border-color: rgba(255, 255, 255, 0.08);
}

[data-theme='dark'] .tag-badge__remove:hover {
  background: rgba(255, 255, 255, 0.1);
  color: var(--gray-200);
}
</style>

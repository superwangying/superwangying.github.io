<template>
  <Teleport to="body">
    <Transition name="ctx-fade">
      <div
        v-if="visible"
        class="ctx-menu"
        :style="{ top: y + 'px', left: x + 'px' }"
        @click.stop
      >
        <slot />
        <button
          v-for="item in items"
          :key="item.id"
          class="ctx-menu__item"
          :class="{
            'ctx-menu__item--danger': item.type === 'danger',
            'ctx-menu__item--disabled': item.disabled,
          }"
          :title="item.label"
          @click="item.action()"
        >
          <IconRender v-if="item.icon" :icon="item.icon" :size="14" class="ctx-menu__icon" />
          <span>{{ item.label }}</span>
          <span v-if="item.badge" class="ctx-menu__badge">{{ item.badge }}</span>
        </button>
      </div>
    </Transition>
  </Teleport>
</template>

<script setup lang="ts">
export interface MenuItem {
  id: string
  label: string
  icon: string
  type?: 'default' | 'danger'
  disabled?: boolean
  badge?: string
  action: () => void
}

withDefaults(
  defineProps<{
    visible: boolean
    x: number
    y: number
    items: MenuItem[]
  }>(),
  {
    visible: false,
    x: 0,
    y: 0,
    items: () => [],
  },
)
</script>

<style scoped>
.ctx-menu {
  position: fixed;
  background: var(--bg-surface);
  border: 1px solid var(--border-color);
  border-radius: var(--radius-md);
  box-shadow: var(--shadow-lg);
  z-index: 99999;
  padding: 4px;
  min-width: 180px;
  max-height: 400px;
  overflow-y: auto;
}

.ctx-menu__item {
  display: flex;
  align-items: center;
  gap: 8px;
  width: 100%;
  padding: 8px 12px;
  border-radius: var(--radius-sm);
  font-size: var(--text-sm);
  color: var(--text-primary);
  text-align: left;
  transition: background var(--transition-fast);
  cursor: pointer;
}

.ctx-menu__item:hover:not(.ctx-menu__item--disabled) {
  background: var(--gray-100);
}

.ctx-menu__icon {
  flex-shrink: 0;
}

.ctx-menu__item--danger { color: var(--color-error); }
.ctx-menu__item--danger:hover:not(.ctx-menu__item--disabled) {
  background: rgba(239, 68, 68, 0.1);
}

.ctx-menu__item--disabled {
  opacity: 0.4;
  cursor: not-allowed;
}

.ctx-menu__badge {
  margin-left: auto;
  font-size: 11px;
  color: var(--text-muted);
}

/* 暗色适配 */
[data-theme='dark'] .ctx-menu__item:hover:not(.ctx-menu__item--disabled) {
  background: rgba(255, 255, 255, 0.07);
}

/* 动画 */
.ctx-fade-enter-active,
.ctx-fade-leave-active {
  transition: opacity 0.12s ease, transform 0.12s ease;
}

.ctx-fade-enter-from,
.ctx-fade-leave-to {
  opacity: 0;
  transform: scale(0.95) translateY(-4px);
  transform-origin: top left;
}
</style>

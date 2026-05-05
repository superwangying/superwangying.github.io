<template>
  <Teleport to="body">
    <Transition name="dialog">
      <div v-if="modelValue" class="dialog-overlay" @click.self="onCancel">
        <div class="dialog" role="dialog" :aria-labelledby="'dialog-title'" @keydown.esc="onCancel">
          <!-- Header -->
          <div class="dialog__header">
            <div class="dialog__icon" :class="`dialog__icon--${type}`">
              <IconRender v-if="type === 'danger'" icon="carbon:warning-filled" :size="22" />
              <IconRender v-else-if="type === 'info'" icon="carbon:information" :size="22" />
              <IconRender v-else                        icon="carbon:help" :size="22" />
            </div>
            <h2 id="dialog-title" class="dialog__title">{{ title }}</h2>
          </div>

          <!-- Body -->
          <div class="dialog__body">
            <p>{{ message }}</p>
          </div>

          <!-- Footer -->
          <div class="dialog__footer">
            <button class="dialog__btn dialog__btn--cancel" @click="onCancel">
              {{ cancelText }}
            </button>
            <button
              class="dialog__btn"
              :class="confirmClass"
              @click="onConfirm"
              ref="confirmBtn"
            >
              {{ confirmText }}
            </button>
          </div>
        </div>
      </div>
    </Transition>
  </Teleport>
</template>

<script setup lang="ts">
import { ref, watch, nextTick } from 'vue'

const props = withDefaults(defineProps<{
  modelValue: boolean
  title?: string
  message?: string
  confirmText?: string
  cancelText?: string
  type?: 'danger' | 'info' | 'warning'
}>(), {
  title: '确认操作',
  message: '确定要执行此操作吗？',
  confirmText: '确认',
  cancelText: '取消',
  type: 'info',
})

const emit = defineEmits<{
  'update:modelValue': [value: boolean]
  confirm: []
  cancel: []
}>()

const confirmBtn = ref<HTMLButtonElement>()

// 打开时自动 focus 确认按钮
watch(() => props.modelValue, async (val) => {
  if (val) {
    await nextTick()
    confirmBtn.value?.focus()
  }
})

function onConfirm() {
  emit('confirm')
  emit('update:modelValue', false)
}

function onCancel() {
  emit('cancel')
  emit('update:modelValue', false)
}

const confirmClass = computed(() => ({
  'dialog__btn--danger':   props.type === 'danger',
  'dialog__btn--warning': props.type === 'warning',
  'dialog__btn--primary': props.type === 'info',
}))
</script>

<style scoped>
.dialog-overlay {
  position: fixed;
  inset: 0;
  background: rgba(0, 0, 0, 0.45);
  backdrop-filter: blur(3px);
  z-index: 99998;
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 16px;
}

.dialog {
  background: var(--bg-surface);
  border-radius: var(--radius-xl);
  border: 1.5px solid var(--border-color);
  box-shadow: var(--shadow-xl);
  width: 100%;
  max-width: 380px;
  overflow: hidden;
}

.dialog__header {
  display: flex;
  align-items: center;
  gap: 14px;
  padding: 24px 24px 16px;
}

.dialog__icon {
  width: 40px;
  height: 40px;
  border-radius: var(--radius-lg);
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 22px;
  flex-shrink: 0;
}

.dialog__icon--danger  { background: rgba(239, 68, 68, 0.1);  color: var(--color-error); }
.dialog__icon--warning { background: rgba(245, 158, 11, 0.1); color: var(--color-warning); }
.dialog__icon--info    { background: rgba(59, 130, 246, 0.1);  color: var(--color-info); }

.dialog__title {
  font-size: var(--text-lg);
  font-weight: 600;
  color: var(--text-primary);
}

.dialog__body {
  padding: 0 24px 20px;
  color: var(--text-secondary);
  font-size: var(--text-sm);
  line-height: 1.6;
}

.dialog__footer {
  display: flex;
  justify-content: flex-end;
  gap: 10px;
  padding: 16px 24px 24px;
  border-top: 1px solid var(--border-color);
}

.dialog__btn {
  padding: 9px 20px;
  border-radius: var(--radius-md);
  font-size: var(--text-sm);
  font-weight: 500;
  transition: all var(--transition-base);
  border: 1.5px solid transparent;
}

.dialog__btn--cancel {
  background: var(--gray-100);
  color: var(--gray-700);
  border-color: var(--gray-200);
}
.dialog__btn--cancel:hover {
  background: var(--gray-200);
}

.dialog__btn--primary {
  background: var(--primary-600);
  color: #fff;
  box-shadow: var(--shadow-sm);
}
.dialog__btn--primary:hover {
  background: var(--primary-700);
}

.dialog__btn--danger {
  background: var(--color-error);
  color: #fff;
  box-shadow: var(--shadow-sm);
}
.dialog__btn--danger:hover {
  background: #dc2626;
}

.dialog__btn--warning {
  background: var(--color-warning);
  color: #fff;
  box-shadow: var(--shadow-sm);
}
.dialog__btn--warning:hover {
  background: #d97706;
}

/* 暗色 */
[data-theme='dark'] .dialog {
  background: var(--gray-800);
  border-color: rgba(255, 255, 255, 0.1);
}
[data-theme='dark'] .dialog__btn--cancel {
  background: rgba(255, 255, 255, 0.06);
  color: var(--gray-300);
  border-color: rgba(255, 255, 255, 0.1);
}
[data-theme='dark'] .dialog__btn--cancel:hover {
  background: rgba(255, 255, 255, 0.1);
}

/* 过渡 */
.dialog-enter-active,
.dialog-leave-active {
  transition: opacity 250ms ease;
}
.dialog-enter-active .dialog,
.dialog-leave-active .dialog {
  transition: transform 250ms cubic-bezier(0.16, 1, 0.3, 1), opacity 250ms ease;
}
.dialog-enter-from,
.dialog-leave-to {
  opacity: 0;
}
.dialog-enter-from .dialog {
  transform: scale(0.92) translateY(-8px);
}
.dialog-leave-to .dialog {
  transform: scale(0.95) translateY(4px);
  opacity: 0;
}
</style>

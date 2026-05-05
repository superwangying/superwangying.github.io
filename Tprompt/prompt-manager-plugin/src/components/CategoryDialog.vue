<template>
  <Teleport to="body">
    <Transition name="dialog">
      <div v-if="modelValue" class="dialog-overlay" @click.self="onCancel">
        <div class="cat-dialog" role="dialog">
          <!-- Header -->
          <div class="cat-dialog__header">
            <h2 class="cat-dialog__title">{{ isNew ? '新建分类' : '编辑分类' }}</h2>
            <button class="cat-dialog__close" @click="onCancel">
              <IconRender icon="carbon:close" />
            </button>
          </div>

          <!-- Body -->
          <div class="cat-dialog__body">
            <!-- 名称 -->
            <div class="cat-dialog__field">
              <label class="cat-dialog__label">名称 <span class="cat-dialog__required">*</span></label>
              <input
                v-model="form.name"
                class="cat-dialog__input"
                :class="{ 'is-error': errors.name }"
                placeholder="例如：写作助手、代码生成"
                maxlength="30"
                @input="errors.name = ''"
              />
              <span v-if="errors.name" class="cat-dialog__error">{{ errors.name }}</span>
            </div>

            <!-- 父分类（可选） -->
            <div class="cat-dialog__field">
              <label class="cat-dialog__label">
                父分类
                <span class="cat-dialog__hint">（可选，选择后该分类将作为子分类）</span>
              </label>
              <div class="cat-dialog__select-wrap">
                <select v-model="form.parentId" class="cat-dialog__select">
                  <option :value="null">— 顶级分类（无父分类）</option>
                  <option
                    v-for="root in availableParents"
                    :key="root.id"
                    :value="root.id"
                  >
                    {{ root.name }}
                  </option>
                </select>
                <IconRender icon="carbon:chevron-down" :size="14" class="cat-dialog__select-arrow" />
              </div>
              <span v-if="form.parentId" class="cat-dialog__sub-tip">
                <IconRender icon="carbon:information" :size="12" />
                子分类最多支持一级（不可再嵌套）
              </span>
            </div>

            <!-- 图标 + 颜色 行 -->
            <div class="cat-dialog__row">
              <!-- 图标选择 -->
              <div class="cat-dialog__field">
                <label class="cat-dialog__label">图标</label>
                <div class="cat-dialog__icon-grid">
                  <button
                    v-for="iconName in ICON_OPTIONS"
                    :key="iconName"
                    class="cat-dialog__icon-btn"
                    :class="{ active: form.emoji === iconName }"
                    @click="form.emoji = iconName"
                    type="button"
                  ><IconRender :icon="iconName" :size="18" /></button>
                </div>
              </div>

              <!-- 颜色选择 -->
              <div class="cat-dialog__field cat-dialog__field--right">
                <label class="cat-dialog__label">颜色</label>
                <div class="cat-dialog__color-grid">
                  <button
                    v-for="color in COLOR_OPTIONS"
                    :key="color"
                    class="cat-dialog__color-btn"
                    :class="{ active: form.color === color }"
                    :style="{ background: color }"
                    @click="form.color = color"
                    type="button"
                  >
                    <IconRender v-if="form.color === color" icon="carbon:checkmark" :size="12" style="color:white" />
                  </button>
                </div>
              </div>
            </div>

            <!-- 预览 -->
            <div class="cat-dialog__preview">
              <span class="cat-dialog__preview-label">预览</span>
              <div class="cat-dialog__preview-item">
                <!-- 若是子分类，预览时显示缩进箭头 -->
                <template v-if="form.parentId">
                  <span class="cat-dialog__preview-indent">
                    <IconRender icon="carbon:arrow-right" :size="12" />
                  </span>
                </template>
                <span class="cat-dialog__preview-dot" :style="{ background: form.color }"></span>
                <IconRender v-if="form.emoji" :icon="form.emoji" :size="16" />
                <IconRender v-else icon="feather:folder" :size="16" />
                <span>{{ form.name || '分类名称' }}</span>
              </div>
            </div>
          </div>

          <!-- Footer -->
          <div class="cat-dialog__footer">
            <button class="cat-dialog__btn cat-dialog__btn--cancel" @click="onCancel">取消</button>
            <button class="cat-dialog__btn cat-dialog__btn--save magnetic-btn" @click="onSave" :disabled="saving">
              <IconRender v-if="saving" icon="carbon:loading" class="icon-spin" />
              <IconRender v-else icon="carbon:checkmark" />
              {{ saving ? '保存中...' : '保存' }}
            </button>
          </div>
        </div>
      </div>
    </Transition>
  </Teleport>
</template>

<script setup lang="ts">
import { ref, computed, watch, nextTick, onMounted, onUnmounted } from 'vue'
import { CATEGORY_COLORS, CATEGORY_ICONS, useCategoryStore } from '@/stores/categoryStore'
import type { Category } from '@/types'

const props = withDefaults(defineProps<{
  modelValue: boolean
  category?: Category | null
  /** 预设父分类 ID（从子分类「新建子分类」按钮触发时传入） */
  defaultParentId?: string | null
}>(), {
  category: null,
  defaultParentId: null,
})

const emit = defineEmits<{
  'update:modelValue': [value: boolean]
  saved: [category: Category]
}>()

const COLOR_OPTIONS = CATEGORY_COLORS
const ICON_OPTIONS = CATEGORY_ICONS

const categoryStore = useCategoryStore()
const isNew = computed(() => !props.category)
const saving = ref(false)

const form = ref<{
  name: string
  emoji: string
  color: string
  parentId: string | null
}>({ name: '', emoji: '', color: '', parentId: null })

const errors = ref({ name: '' })

/**
 * 可选的父分类列表：
 * - 只能选顶级分类（parentId 为空）作为父级，防止三级嵌套
 * - 编辑时排除自身（防止自我引用）
 */
const availableParents = computed<Category[]>(() => {
  return categoryStore.categories
    .filter(c => {
      if (props.category && c.id === props.category.id) return false // 排除自身
      return !c.parentId // 只显示顶级分类
    })
    .sort((a, b) => a.sortOrder - b.sortOrder)
})

function initForm() {
  if (props.category) {
    form.value = {
      name: props.category.name,
      emoji: props.category.emoji ?? '',
      color: props.category.color,
      parentId: props.category.parentId ?? null,
    }
  } else {
    form.value = {
      name: '',
      emoji: CATEGORY_ICONS[0],
      color: CATEGORY_COLORS[0],
      parentId: props.defaultParentId ?? null,
    }
  }
  errors.value = { name: '' }
}

watch(() => props.modelValue, async (val) => {
  if (val) {
    await nextTick()
    initForm()
  }
})

async function onSave() {
  errors.value.name = ''
  if (!form.value.name.trim()) {
    errors.value.name = '请输入分类名称'
    return
  }

  saving.value = true
  try {
    let saved: Category
    if (props.category) {
      saved = await categoryStore.updateCategory(props.category.id, {
        name: form.value.name.trim(),
        emoji: form.value.emoji || '',
        color: form.value.color,
        parentId: form.value.parentId ?? null,
        sortOrder: props.category.sortOrder,
      })
    } else {
      saved = await categoryStore.createCategory({
        name: form.value.name.trim(),
        emoji: form.value.emoji || '',
        color: form.value.color,
        parentId: form.value.parentId ?? null,
        sortOrder: 0,
      })
    }
    emit('saved', saved)
    emit('update:modelValue', false)
  } finally {
    saving.value = false
  }
}

function onCancel() {
  emit('update:modelValue', false)
}

function onKeydown(e: KeyboardEvent) {
  if (!props.modelValue) return
  if (e.key === 'Escape') onCancel()
}

onMounted(() => document.addEventListener('keydown', onKeydown))
onUnmounted(() => document.removeEventListener('keydown', onKeydown))
</script>

<style scoped>
.dialog-overlay {
  position: fixed;
  inset: 0;
  background: rgba(0, 0, 0, 0.45);
  backdrop-filter: blur(3px);
  z-index: 99997;
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 16px;
}

.cat-dialog {
  background: var(--bg-surface);
  border-radius: var(--radius-xl);
  border: 1.5px solid var(--border-color);
  box-shadow: var(--shadow-xl);
  width: 420px;
  max-width: 100%;
  overflow: hidden;
}

.cat-dialog__header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 20px 24px;
  border-bottom: 1px solid var(--border-color);
}

.cat-dialog__title {
  font-size: var(--text-lg);
  font-weight: 600;
  color: var(--text-primary);
}

.cat-dialog__close {
  width: 32px;
  height: 32px;
  display: flex;
  align-items: center;
  justify-content: center;
  border-radius: var(--radius-md);
  font-size: 18px;
  color: var(--text-muted);
  transition: all var(--transition-fast);
}
.cat-dialog__close:hover { background: var(--gray-100); color: var(--text-primary); }

.cat-dialog__body {
  padding: 20px 24px;
  display: flex;
  flex-direction: column;
  gap: 18px;
}

.cat-dialog__field {
  display: flex;
  flex-direction: column;
  gap: 8px;
}

.cat-dialog__field--right {
  flex: 1;
}

.cat-dialog__row {
  display: flex;
  gap: 20px;
}

.cat-dialog__label {
  font-size: var(--text-sm);
  font-weight: 500;
  color: var(--text-primary);
}

.cat-dialog__required { color: var(--color-error); }
.cat-dialog__error { font-size: 11px; color: var(--color-error); }

.cat-dialog__input {
  padding: 10px 14px;
  border: 1.5px solid var(--border-color);
  border-radius: var(--radius-md);
  font-size: var(--text-sm);
  color: var(--text-primary);
  background: var(--bg-surface);
  transition: border-color var(--transition-fast), box-shadow var(--transition-fast);
  width: 100%;
}
.cat-dialog__input:focus {
  outline: none;
  border-color: var(--primary-500);
  box-shadow: var(--shadow-focus);
}
.cat-dialog__input.is-error { border-color: var(--color-error); }

/* Icon Grid */
.cat-dialog__icon-grid {
  display: flex;
  flex-wrap: wrap;
  gap: 6px;
}

.cat-dialog__icon-btn {
  width: 36px;
  height: 36px;
  display: flex;
  align-items: center;
  justify-content: center;
  border-radius: var(--radius-md);
  border: 1.5px solid var(--border-color);
  transition: all var(--transition-fast);
  background: var(--bg-surface);
  color: var(--text-primary);
}
.cat-dialog__icon-btn:hover { border-color: var(--primary-400); transform: scale(1.1); }
.cat-dialog__icon-btn.active { border-color: var(--primary-500); background: var(--primary-50); color: var(--primary-600); }

/* Color */
.cat-dialog__color-grid {
  display: flex;
  flex-wrap: wrap;
  gap: 8px;
}

.cat-dialog__color-btn {
  width: 28px;
  height: 28px;
  border-radius: 50%;
  border: 2.5px solid transparent;
  display: flex;
  align-items: center;
  justify-content: center;
  transition: all var(--transition-fast);
}
.cat-dialog__color-btn:hover { transform: scale(1.15); }
.cat-dialog__color-btn.active { border-color: rgba(255,255,255,0.8); box-shadow: 0 0 0 2px rgba(0,0,0,0.2); }

/* Preview */
.cat-dialog__preview {
  display: flex;
  align-items: center;
  gap: 12px;
  padding: 12px 14px;
  background: var(--gray-50);
  border-radius: var(--radius-md);
  border: 1px dashed var(--gray-300);
}

.cat-dialog__preview-label {
  font-size: 11px;
  color: var(--text-muted);
  flex-shrink: 0;
}

.cat-dialog__preview-item {
  display: flex;
  align-items: center;
  gap: 8px;
  font-size: var(--text-sm);
  color: var(--text-primary);
}

.cat-dialog__preview-dot {
  width: 8px;
  height: 8px;
  border-radius: 50%;
}

/* Footer */
.cat-dialog__footer {
  display: flex;
  justify-content: flex-end;
  gap: 10px;
  padding: 16px 24px;
  border-top: 1px solid var(--border-color);
}

.cat-dialog__btn {
  display: inline-flex;
  align-items: center;
  gap: 6px;
  padding: 9px 20px;
  border-radius: var(--radius-md);
  font-size: var(--text-sm);
  font-weight: 500;
  transition: all var(--transition-base);
}

.cat-dialog__btn--cancel {
  background: var(--gray-100);
  color: var(--gray-700);
  border: 1.5px solid var(--gray-200);
}
.cat-dialog__btn--cancel:hover { background: var(--gray-200); }

.cat-dialog__btn--save {
  background: var(--primary-600);
  color: #fff;
  box-shadow: var(--shadow-sm);
  border: none;
}
.cat-dialog__btn--save:hover:not(:disabled) { background: var(--primary-700); }
.cat-dialog__btn--save:disabled { opacity: 0.6; cursor: not-allowed; }

/* 暗色 */
[data-theme='dark'] .cat-dialog {
  background: var(--gray-800);
  border-color: rgba(255,255,255,0.1);
}
[data-theme='dark'] .cat-dialog__input {
  background: rgba(255,255,255,0.04);
  border-color: rgba(255,255,255,0.1);
  color: var(--text-primary);
}
[data-theme='dark'] .cat-dialog__icon-btn {
  background: rgba(255,255,255,0.04);
  border-color: rgba(255,255,255,0.1);
}
[data-theme='dark'] .cat-dialog__icon-btn.active { background: rgba(99,102,241,0.15); }
[data-theme='dark'] .cat-dialog__preview {
  background: rgba(0,0,0,0.2);
  border-color: rgba(255,255,255,0.1);
}

/* 动画 */
.dialog-enter-active, .dialog-leave-active { transition: opacity 250ms ease; }
.dialog-enter-active .cat-dialog, .dialog-leave-active .cat-dialog {
  transition: transform 250ms cubic-bezier(0.16, 1, 0.3, 1), opacity 250ms ease;
}
.dialog-enter-from, .dialog-leave-to { opacity: 0; }
.dialog-enter-from .cat-dialog { transform: scale(0.92) translateY(-8px); }
.dialog-leave-to .cat-dialog { transform: scale(0.95); opacity: 0; }

@keyframes spin {
  from { transform: rotate(0deg); }
  to { transform: rotate(360deg); }
}
.icon-spin { animation: spin 1s linear infinite; }

/* ---- 父分类选择 ---- */
.cat-dialog__hint {
  font-size: 11px;
  color: var(--text-muted);
  font-weight: 400;
  margin-left: 4px;
}

.cat-dialog__select-wrap {
  position: relative;
}

.cat-dialog__select {
  width: 100%;
  padding: 10px 36px 10px 14px;
  border: 1.5px solid var(--border-color);
  border-radius: var(--radius-md);
  font-size: var(--text-sm);
  color: var(--text-primary);
  background: var(--bg-surface);
  appearance: none;
  -webkit-appearance: none;
  cursor: pointer;
  transition: border-color var(--transition-fast), box-shadow var(--transition-fast);
}

.cat-dialog__select:focus {
  outline: none;
  border-color: var(--primary-500);
  box-shadow: var(--shadow-focus);
}

.cat-dialog__select-arrow {
  position: absolute;
  right: 12px;
  top: 50%;
  transform: translateY(-50%);
  color: var(--text-muted);
  pointer-events: none;
}

.cat-dialog__sub-tip {
  display: inline-flex;
  align-items: center;
  gap: 4px;
  font-size: 11px;
  color: var(--primary-500);
}

/* 子分类预览缩进 */
.cat-dialog__preview-indent {
  display: inline-flex;
  align-items: center;
  color: var(--text-muted);
  margin-right: 2px;
}

/* 暗色下 select */
[data-theme='dark'] .cat-dialog__select {
  background: rgba(255,255,255,0.04);
  border-color: rgba(255,255,255,0.1);
  color: var(--text-primary);
}
[data-theme='dark'] .cat-dialog__select option {
  background: var(--gray-800);
  color: var(--text-primary);
}
</style>

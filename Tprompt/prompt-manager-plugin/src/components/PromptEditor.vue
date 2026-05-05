<template>
  <Teleport to="body">
    <Transition name="editor-slide">
      <div v-if="modelValue" class="editor-overlay" @click.self="onCancel">
        <div class="editor" :style="{ width: isPreview ? '900px' : '680px' }" role="dialog">
          <!-- Header -->
          <div class="editor__header">
            <div class="editor__header-left">
              <div class="editor__icon logo-icon">
                <IconRender icon="carbon:edit" :size="18" color="white" />
              </div>
              <h2 class="editor__title">{{ isNew ? '新建提示词' : '编辑提示词' }}</h2>
            </div>
            <div class="editor__header-right">
              <button
                class="editor__tab-btn"
                :class="{ active: !isPreview }"
                @click="isPreview = false"
              >编辑</button>
              <button
                class="editor__tab-btn"
                :class="{ active: isPreview }"
                @click="isPreview = true"
              >预览</button>
              <button class="editor__close" @click="onCancel">
                <IconRender icon="carbon:close" :size="16" />
              </button>
            </div>
          </div>

          <!-- Body -->
          <div class="editor__body" :class="{ 'is-preview': isPreview }">
            <!-- 左：编辑区 -->
            <div v-show="!isPreview" class="editor__edit">
              <!-- 标题 -->
              <div class="editor__field">
                <label class="editor__label">
                  标题 <span class="editor__required">*</span>
                </label>
                <input
                  v-model="form.title"
                  class="editor__input"
                  :class="{ 'is-error': errors.title }"
                  placeholder="给提示词起个名字"
                  maxlength="80"
                  @input="errors.title = ''"
                />
                <span v-if="errors.title" class="editor__error">{{ errors.title }}</span>
              </div>

              <!-- 内容 -->
              <div class="editor__field editor__field--grow">
                <label class="editor__label">
                  内容 <span class="editor__required">*</span>
                  <span class="editor__char-count" :class="{ 'is-warning': form.content.length > 3000 }">
                    {{ form.content.length }} / 10000
                  </span>
                </label>
                <textarea
                  v-model="form.content"
                  class="editor__textarea"
                  :class="{ 'is-error': errors.content }"
                  placeholder="粘贴或输入提示词内容..."
                  :rows="isMobile ? 8 : 12"
                  maxlength="10000"
                  @input="errors.content = ''"
                ></textarea>
                <span v-if="errors.content" class="editor__error">{{ errors.content }}</span>
              </div>

              <!-- 分类 + 标签 行 -->
              <div class="editor__row">
                <!-- 分类 -->
                <div class="editor__field editor__field--half">
                  <label class="editor__label">分类</label>
                  <select v-model="form.categoryId" class="editor__select">
                    <option value="">未分类</option>
                    <option
                      v-for="cat in categoryStore.categories"
                      :key="cat.id"
                      :value="cat.id"
                    >{{ cat.name }}</option>
                  </select>
                </div>

                <!-- 标签 -->
                <div class="editor__field editor__field--half">
                  <label class="editor__label">标签</label>
                  <div class="editor__tag-input">
                    <div class="editor__tags-list">
                      <span v-for="(tag, idx) in form.tags" :key="idx" class="editor__tag">
                        {{ tag }}
                        <button class="editor__tag-remove" @click="removeTag(idx)">
                          <IconRender icon="carbon:close" :size="12" />
                        </button>
                      </span>
                    </div>
                    <input
                      v-model="tagInput"
                      class="editor__tag-text"
                      placeholder="输入后回车添加标签"
                      @keydown.enter.prevent="addTag"
                      @keydown.comma.prevent="addTag"
                      @focus="console.log('[DEBUG] tagInput focused')"
                      @blur="console.log('[DEBUG] tagInput blurred')"
                    />
                    <!-- DEBUG: 测试按钮 -->
                    <button type="button" @click="testAddTag" style="margin-left: 8px; font-size: 11px; padding: 2px 8px; background: #ff6b6b; color: white; border: none; border-radius: 4px; cursor: pointer;">
                      测试
                    </button>
                  </div>
                </div>
              </div>

              <!-- 收藏开关 -->
              <div class="editor__field editor__field--inline">
                <label class="editor__switch-label">
                  <span class="editor__label">收藏置顶</span>
                  <button
                    class="editor__star"
                    :class="{ active: form.isFavorite }"
                    @click="form.isFavorite = !form.isFavorite"
                    type="button"
                  >
                    <IconRender :icon="form.isFavorite ? 'carbon:star-filled' : 'carbon:star'" :size="16" />
                    {{ form.isFavorite ? '已置顶' : '未置顶' }}
                  </button>
                </label>
              </div>
            </div>

            <!-- 右：预览区 -->
            <div v-show="isPreview" class="editor__preview">
              <div class="preview__badge">
                <TagBadge
                  v-if="previewCategory"
                  :label="previewCategory.name"
                  :color="previewCategory.color"
                />
                <TagBadge v-if="form.tags.length" :label="form.tags[0]" />
                <span v-if="form.isFavorite" class="preview__fav">
                  <IconRender icon="carbon:star-filled" :size="14" /> 收藏
                </span>
              </div>

              <h1 class="preview__title">{{ form.title || '（无标题）' }}</h1>

              <p v-if="form.description" class="preview__desc">{{ form.description }}</p>

              <div class="preview__content" v-html="renderedContent"></div>

              <div v-if="form.tags.length > 1" class="preview__tags">
                <TagBadge
                  v-for="tag in form.tags.slice(1)"
                  :key="tag"
                  :label="tag"
                  size="sm"
                />
              </div>
            </div>
          </div>

          <!-- Footer -->
          <div class="editor__footer">
            <span class="editor__shortcut">
              <kbd>{{ isMac ? '⌘' : 'Ctrl' }}</kbd>+<kbd>S</kbd> 保存
            </span>
            <div class="editor__footer-actions">
              <button class="editor__btn editor__btn--cancel" @click="onCancel">取消</button>
              <button class="editor__btn editor__btn--save magnetic-btn" @click="onSave" :disabled="saving">
                <IconRender v-if="saving" icon="carbon:loading" :size="14" style="animation: spin 1s linear infinite" />
                <IconRender v-else icon="carbon:checkmark" :size="14" />
                {{ saving ? '保存中...' : '保存' }}
              </button>
            </div>
          </div>
        </div>
      </div>
    </Transition>
  </Teleport>
</template>

<script setup lang="ts">
import { ref, computed, watch, nextTick } from 'vue'
import { marked } from 'marked'
import DOMPurify from 'dompurify'
import TagBadge from './TagBadge.vue'
import { useCategoryStore } from '@/stores/categoryStore'
import type { Prompt, PromptForm } from '@/types'

// Configure marked
marked.setOptions({ breaks: true })

const props = withDefaults(defineProps<{
  modelValue: boolean
  prompt?: Prompt | null
  defaultCategoryId?: string
}>(), {
  prompt: null,
  defaultCategoryId: '',
})

const emit = defineEmits<{
  'update:modelValue': [value: boolean]
  saved: [prompt: Prompt]
}>()

const categoryStore = useCategoryStore()

const isNew = computed(() => !props.prompt)
const saving = ref(false)
const isPreview = ref(false)
const tagInput = ref('')
const isMac = ref(false)

// 移动端判断
const isMobile = ref(false)

// 表单
const form = ref<PromptForm>({
  title: '',
  content: '',
  description: '',
  categoryId: '',
  tags: [],
  isPinned: false,
  isFavorite: false,
})

// 错误信息
const errors = ref({ title: '', content: '' })

// 初始化 / 重置表单
function initForm() {
  // 优先使用 props.prompt（编辑模式），否则使用默认值（新建模式）
  const source = props.prompt
  if (source) {
    form.value = {
      title: source.title,
      content: source.content,
      description: source.description ?? '',
      categoryId: source.categoryId ?? '',
      tags: source.tags ? [...source.tags] : [], // 安全复制 tags 数组
      isPinned: source.isPinned,
      isFavorite: source.isFavorite,
    }
    console.log('[DEBUG] initForm EDIT, source.tags:', source.tags, '| form.tags:', JSON.stringify(form.value.tags))
  } else {
    form.value = {
      title: '',
      content: '',
      description: '',
      categoryId: props.defaultCategoryId || categoryStore.activeCategoryId || '',
      tags: [],
      isPinned: false,
      isFavorite: false,
    }
    console.log('[DEBUG] initForm CREATE')
  }
  errors.value = { title: '', content: '' }
  isPreview.value = false
  tagInput.value = ''
}

// 监听打开（同时监听 modelValue 和 prompt，防止 prompt prop 异步更新导致表单初始化不完整）
watch(
  () => [props.modelValue, props.prompt] as const,
  async ([isOpen]) => {
    if (isOpen) {
      // 确保 prompt 已正确传递后再初始化表单
      await nextTick()
      initForm()
      // mac 判断
      isMac.value = navigator.platform.toUpperCase().includes('MAC')
      isMobile.value = window.innerWidth < 640
    }
  },
  { immediate: true },
)

// DEBUG: 监听 form.tags 变化
watch(
  () => [...form.value.tags],
  (newTags, oldTags) => {
    console.log('[DEBUG-WATCH] form.tags changed:', JSON.stringify({ old: oldTags, new: newTags }))
  },
  { deep: true }
)

// 预览内容
const renderedContent = computed(() => {
  if (!form.value.content) return '<p class="preview-empty">暂无内容</p>'
  const raw = marked.parse(form.value.content) as string
  return DOMPurify.sanitize(raw)
})

// 预览分类信息
const previewCategory = computed(() => {
  if (!form.value.categoryId) return null
  return categoryStore.categoryMap.get(form.value.categoryId) ?? null
})

// 标签操作
function addTag() {
  const tag = tagInput.value.trim().replace(/,+$/, '')
  console.log('[DEBUG] === addTag START ===')
  console.log('[DEBUG] input tag:', JSON.stringify(tag))
  console.log('[DEBUG] form.value.tags BEFORE:', JSON.stringify(form.value.tags))
  console.log('[DEBUG] form.value.tags.length:', form.value.tags.length)
  console.log('[DEBUG] form.value.tags.length < 8:', form.value.tags.length < 8)
  console.log('[DEBUG] form.value.tags.includes(tag):', form.value.tags.includes(tag))
  if (tag && !form.value.tags.includes(tag) && form.value.tags.length < 8) {
    form.value.tags.push(tag)
    console.log('[DEBUG] AFTER push, form.value.tags:', JSON.stringify(form.value.tags))
  } else {
    console.log('[DEBUG] Tag NOT added - condition failed')
  }
  console.log('[DEBUG] === addTag END ===')
  tagInput.value = ''
}

// DEBUG: 测试按钮
function testAddTag() {
  console.log('[DEBUG] testAddTag button clicked')
  console.log('[DEBUG] tagInput.value:', JSON.stringify(tagInput.value))
  console.log('[DEBUG] form.value.tags BEFORE:', JSON.stringify(form.value.tags))
  tagInput.value = '@image:test.png'
  addTag()
  console.log('[DEBUG] form.value.tags AFTER:', JSON.stringify(form.value.tags))
}

function removeTag(idx: number) {
  form.value.tags.splice(idx, 1)
}

// 保存
async function onSave() {
  // 校验
  errors.value.title = ''
  errors.value.content = ''
  if (!form.value.title.trim()) { errors.value.title = '请输入标题'; return }
  if (!form.value.content.trim()) { errors.value.content = '请输入内容'; return }

  saving.value = true
  try {
    const { usePromptStore } = await import('@/stores/promptStore')
    const promptStore = usePromptStore()

    // ===== DEBUG: 检查保存前的 form.value.tags =====
    console.log('[DEBUG] === onSave START ===')
    console.log('[DEBUG] form.value.tags directly:', JSON.stringify(form.value.tags))
    console.log('[DEBUG] form.value.tags is Array:', Array.isArray(form.value.tags))
    console.log('[DEBUG] form.value.tags length:', form.value.tags.length)

    // 深度脱响应式：Vue Proxy 对象无法被 IndexedDB 的 structured clone 克隆
    // 需要先提取 tags 数组（JSON.parse(JSON.stringify(...)) 脱 Proxy），再展开
    const rawForm = JSON.parse(JSON.stringify(form.value))
    console.log('[DEBUG] rawForm.tags after JSON.parse:', JSON.stringify(rawForm.tags))

    const formData = {
      ...rawForm,
      categoryId: rawForm.categoryId || null,
      tags: rawForm.tags ?? [],
    }
    console.log('[DEBUG] formData.tags:', JSON.stringify(formData.tags), '| isEdit:', !!props.prompt)
    console.log('[DEBUG] === onSave END ===')

    let saved: Prompt
    if (props.prompt) {
      saved = await promptStore.updatePrompt(props.prompt.id, formData)
    } else {
      saved = await promptStore.createPrompt(formData)
    }
    console.log('[DEBUG] onSave saved, saved.tags:', JSON.stringify(saved.tags))
    emit('saved', saved)
    emit('update:modelValue', false)
  } catch (err) {
    console.error('[PromptEditor] 保存失败:', err)
    alert(`保存失败: ${err instanceof Error ? err.message : String(err)}`)
  } finally {
    saving.value = false
  }
}

function onCancel() {
  emit('update:modelValue', false)
}

// 键盘快捷键
function onKeydown(e: KeyboardEvent) {
  if (!props.modelValue) return
  if ((e.metaKey || e.ctrlKey) && e.key === 's') {
    e.preventDefault()
    onSave()
  }
  if (e.key === 'Escape') {
    onCancel()
  }
}

// 挂载/卸载监听
import { onMounted, onUnmounted } from 'vue'
onMounted(() => document.addEventListener('keydown', onKeydown))
onUnmounted(() => document.removeEventListener('keydown', onKeydown))
</script>

<style scoped>
.editor-overlay {
  position: fixed;
  inset: 0;
  background: rgba(0, 0, 0, 0.5);
  backdrop-filter: blur(4px);
  z-index: 99990;
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 16px;
}

.editor {
  background: var(--bg-surface);
  border-radius: var(--radius-xl);
  border: 1.5px solid var(--border-color);
  box-shadow: var(--shadow-xl);
  width: 680px;
  max-width: 100%;
  max-height: 90vh;
  display: flex;
  flex-direction: column;
  overflow: hidden;
  transition: width 300ms cubic-bezier(0.16, 1, 0.3, 1);
}

/* Header */
.editor__header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 18px 24px;
  border-bottom: 1px solid var(--border-color);
  flex-shrink: 0;
}

.editor__header-left {
  display: flex;
  align-items: center;
  gap: 12px;
}

.editor__icon {
  width: 36px;
  height: 36px;
  border-radius: var(--radius-md);
  display: flex;
  align-items: center;
  justify-content: center;
  flex-shrink: 0;
}

.editor__title {
  font-size: var(--text-lg);
  font-weight: 600;
  color: var(--text-primary);
}

.editor__header-right {
  display: flex;
  align-items: center;
  gap: 8px;
}

.editor__tab-btn {
  padding: 6px 14px;
  border-radius: var(--radius-full);
  font-size: var(--text-sm);
  font-weight: 500;
  color: var(--text-secondary);
  transition: all var(--transition-fast);
  border: 1.5px solid transparent;
}
.editor__tab-btn:hover { color: var(--text-primary); background: var(--gray-100); }
.editor__tab-btn.active {
  background: var(--primary-50);
  color: var(--primary-700);
  border-color: var(--primary-200);
}

.editor__close {
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
.editor__close:hover { background: var(--gray-100); color: var(--text-primary); }

/* Body */
.editor__body {
  flex: 1;
  overflow: hidden;
  display: flex;
}

.editor__body.is-preview {
  overflow-y: auto;
}

.editor__edit {
  flex: 1;
  overflow-y: auto;
  padding: 20px 24px;
  display: flex;
  flex-direction: column;
  gap: 14px;
}

.editor__field {
  display: flex;
  flex-direction: column;
  gap: 6px;
}

.editor__field--grow {
  flex: 1;
  min-height: 140px;
  display: flex;
  flex-direction: column;
}

.editor__field--grow .editor__textarea {
  flex: 1;
  min-height: 100px;
}

.editor__field--half {
  flex: 1;
}

.editor__field--inline {
  flex-direction: row;
  align-items: center;
  justify-content: space-between;
}

.editor__row {
  display: flex;
  gap: 16px;
}

.editor__label {
  font-size: var(--text-sm);
  font-weight: 500;
  color: var(--text-primary);
  display: flex;
  align-items: center;
  gap: 6px;
}

.editor__required {
  color: var(--color-error);
}

.editor__char-count {
  margin-left: auto;
  font-size: 11px;
  color: var(--text-muted);
  font-weight: 400;
}
.editor__char-count.is-warning { color: var(--color-warning); }

.editor__error {
  font-size: 11px;
  color: var(--color-error);
}

.editor__input,
.editor__select,
.editor__textarea {
  padding: 8px 12px;
  border: 1.5px solid var(--border-color);
  border-radius: var(--radius-md);
  font-size: var(--text-sm);
  color: var(--text-primary);
  background: var(--bg-surface);
  transition: border-color var(--transition-fast), box-shadow var(--transition-fast);
  width: 100%;
}

.editor__input:focus,
.editor__select:focus,
.editor__textarea:focus {
  outline: none;
  border-color: var(--primary-500);
  box-shadow: var(--shadow-focus);
}

.editor__input.is-error,
.editor__textarea.is-error {
  border-color: var(--color-error);
}

.editor__textarea {
  resize: none;
  font-family: var(--font-mono);
  line-height: 1.6;
  min-height: 120px;
}

.editor__select {
  cursor: pointer;
  appearance: none;
  background-image: url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='12' height='12' viewBox='0 0 12 12'%3E%3Cpath fill='%239ca3af' d='M2 4l4 4 4-4'/%3E%3C/svg%3E");
  background-repeat: no-repeat;
  background-position: right 12px center;
  padding-right: 36px;
}

/* Tags */
.editor__tag-input {
  border: 1.5px solid var(--border-color);
  border-radius: var(--radius-md);
  padding: 8px 12px;
  display: flex;
  flex-wrap: wrap;
  gap: 6px;
  background: var(--bg-surface);
  transition: border-color var(--transition-fast), box-shadow var(--transition-fast);
  cursor: text;
  min-height: 42px;
}

.editor__tag-input:focus-within {
  border-color: var(--primary-500);
  box-shadow: var(--shadow-focus);
}

.editor__tag-text {
  flex: 1;
  min-width: 80px;
  font-size: var(--text-sm);
}

.editor__tag {
  display: inline-flex;
  align-items: center;
  gap: 4px;
  padding: 3px 8px;
  background: var(--primary-50);
  color: var(--primary-700);
  border-radius: var(--radius-full);
  font-size: 11px;
  font-weight: 500;
}

.editor__tag-remove {
  font-size: 11px;
  color: var(--primary-400);
  display: flex;
  align-items: center;
  transition: color var(--transition-fast);
}
.editor__tag-remove:hover { color: var(--primary-700); }

/* Star toggle */
.editor__switch-label {
  display: flex;
  align-items: center;
  justify-content: space-between;
  width: 100%;
}

.editor__star {
  display: flex;
  align-items: center;
  gap: 5px;
  padding: 6px 14px;
  border-radius: var(--radius-full);
  font-size: var(--text-sm);
  font-weight: 500;
  border: 1.5px solid var(--border-color);
  color: var(--text-secondary);
  transition: all var(--transition-base);
}
.editor__star:hover {
  border-color: var(--color-warning);
  color: var(--color-warning);
  background: rgba(245, 158, 11, 0.08);
}
.editor__star.active {
  background: rgba(245, 158, 11, 0.12);
  border-color: var(--color-warning);
  color: var(--color-warning);
}
.editor__star svg { width: 16px; height: 16px; }

/* Preview */
.editor__preview {
  flex: 1;
  overflow-y: auto;
  padding: 28px 32px;
  display: flex;
  flex-direction: column;
  gap: 16px;
}

.preview__badge {
  display: flex;
  align-items: center;
  gap: 8px;
  flex-wrap: wrap;
}

.preview__fav {
  display: inline-flex;
  align-items: center;
  gap: 4px;
  font-size: 12px;
  color: var(--color-warning);
  padding: 3px 8px;
  background: rgba(245, 158, 11, 0.1);
  border-radius: var(--radius-full);
}

.preview__title {
  font-size: var(--text-2xl);
  font-weight: 700;
  color: var(--text-primary);
  line-height: 1.3;
}

.preview__desc {
  font-size: var(--text-sm);
  color: var(--text-secondary);
  line-height: 1.6;
  padding-bottom: 12px;
  border-bottom: 1px solid var(--border-color);
}

.preview__content {
  font-size: var(--text-sm);
  line-height: 1.8;
  color: var(--text-primary);
  white-space: pre-wrap;
  word-break: break-word;
}

:deep(.preview__content h1),
:deep(.preview__content h2),
:deep(.preview__content h3) {
  margin: 16px 0 8px;
  font-weight: 600;
  color: var(--text-primary);
}
:deep(.preview__content p) { margin: 8px 0; }
:deep(.preview__content code) {
  background: var(--gray-100);
  padding: 2px 6px;
  border-radius: 4px;
  font-family: var(--font-mono);
  font-size: 0.9em;
}
:deep(.preview__content pre) {
  background: var(--gray-900);
  color: var(--gray-100);
  padding: 16px;
  border-radius: var(--radius-md);
  overflow-x: auto;
}
:deep(.preview__content blockquote) {
  border-left: 3px solid var(--primary-400);
  padding-left: 12px;
  color: var(--text-secondary);
}
:deep(.preview-empty) {
  color: var(--text-muted);
  font-style: italic;
}

.preview__tags {
  display: flex;
  flex-wrap: wrap;
  gap: 6px;
  padding-top: 12px;
  border-top: 1px solid var(--border-color);
}

/* Footer */
.editor__footer {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 14px 24px;
  border-top: 1px solid var(--border-color);
  flex-shrink: 0;
  background: var(--bg-surface);
}

.editor__shortcut {
  font-size: 12px;
  color: var(--text-muted);
  display: flex;
  align-items: center;
  gap: 2px;
}

kbd {
  padding: 2px 6px;
  background: var(--gray-100);
  border: 1px solid var(--gray-200);
  border-radius: 4px;
  font-size: 11px;
  font-family: var(--font-mono);
}

.editor__footer-actions {
  display: flex;
  gap: 10px;
}

.editor__btn {
  display: inline-flex;
  align-items: center;
  gap: 6px;
  padding: 9px 20px;
  border-radius: var(--radius-md);
  font-size: var(--text-sm);
  font-weight: 500;
  transition: all var(--transition-base);
}

.editor__btn--cancel {
  background: var(--gray-100);
  color: var(--gray-700);
  border: 1.5px solid var(--gray-200);
}
.editor__btn--cancel:hover { background: var(--gray-200); }

.editor__btn--save {
  background: var(--primary-600);
  color: #fff;
  box-shadow: var(--shadow-sm);
  border: none;
}
.editor__btn--save:hover:not(:disabled) { background: var(--primary-700); }
.editor__btn--save:disabled { opacity: 0.6; cursor: not-allowed; }

/* 暗色 */
[data-theme='dark'] .editor {
  background: var(--gray-800);
  border-color: rgba(255, 255, 255, 0.1);
}
[data-theme='dark'] .editor__tab-btn.active {
  background: rgba(99, 102, 241, 0.15);
  color: var(--primary-300);
  border-color: rgba(99, 102, 241, 0.3);
}
[data-theme='dark'] .editor__tag {
  background: rgba(99, 102, 241, 0.15);
  color: var(--primary-300);
}
[data-theme='dark'] .editor__input,
[data-theme='dark'] .editor__select,
[data-theme='dark'] .editor__textarea,
[data-theme='dark'] .editor__tag-input {
  background: rgba(255, 255, 255, 0.04);
  border-color: rgba(255, 255, 255, 0.1);
  color: var(--text-primary);
}
[data-theme='dark'] .preview__content code {
  background: rgba(255, 255, 255, 0.08);
}
[data-theme='dark'] kbd {
  background: rgba(255, 255, 255, 0.06);
  border-color: rgba(255, 255, 255, 0.12);
}

/* 动画 */
.editor-slide-enter-active,
.editor-slide-leave-active {
  transition: opacity 250ms ease;
}
.editor-slide-enter-active .editor,
.editor-slide-leave-active .editor {
  transition: transform 300ms cubic-bezier(0.16, 1, 0.3, 1), opacity 250ms ease;
}
.editor-slide-enter-from,
.editor-slide-leave-to { opacity: 0; }
.editor-slide-enter-from .editor { transform: translateY(20px) scale(0.97); }
.editor-slide-leave-to .editor { transform: translateY(10px) scale(0.98); opacity: 0; }

@keyframes spin {
  from { transform: rotate(0deg); }
  to { transform: rotate(360deg); }
}
</style>

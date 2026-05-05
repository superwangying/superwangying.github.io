<template>
  <Teleport to="body">
    <Transition name="dialog">
      <div v-if="modelValue" class="dialog-overlay" @click.self="onCancel">
        <div class="ie-dialog" role="dialog">
          <!-- Header -->
          <div class="ie-dialog__header">
            <h2 class="ie-dialog__title">
              <IconRender icon="carbon:import-export" :size="18" />
              导入 / 导出
            </h2>
            <button class="ie-dialog__close" @click="onCancel">
              <IconRender icon="carbon:close" :size="16" />
            </button>
          </div>

          <!-- Tabs -->
          <div class="ie-dialog__tabs">
            <button class="ie-dialog__tab" :class="{ active: tab === 'export' }" @click="tab = 'export'">
              <IconRender icon="carbon:download" :size="14" /> 导出
            </button>
            <button class="ie-dialog__tab" :class="{ active: tab === 'import' }" @click="tab = 'import'">
              <IconRender icon="carbon:upload" :size="14" /> 导入
            </button>
          </div>

          <!-- Body -->
          <div class="ie-dialog__body">
            <!-- ============ 导出 ============ -->
            <div v-if="tab === 'export'" class="ie-section">
              <p class="ie-section__desc">
                将提示词导出为不同格式，方便备份或在多设备间同步。
              </p>

              <!-- 格式选择 -->
              <div class="ie-section__subtitle">选择导出格式</div>
              <div class="ie-format-grid">
                <button
                  v-for="fmt in EXPORT_FORMATS"
                  :key="fmt.value"
                  class="ie-format-card"
                  :class="{ active: exportFormat === fmt.value }"
                  @click="exportFormat = fmt.value as 'json' | 'csv' | 'markdown'"
                >
                  <IconRender :icon="fmt.icon" :size="24" class="ie-format-card__icon" />
                  <span class="ie-format-card__name">{{ fmt.name }}</span>
                  <span class="ie-format-card__desc">{{ fmt.desc }}</span>
                </button>
              </div>

              <!-- 范围选择 -->
              <div class="ie-section__subtitle">导出范围</div>
              <div class="ie-scope-btns">
                <button
                  v-for="scope in EXPORT_SCOPES"
                  :key="scope.value"
                  class="ie-scope-btn"
                  :class="{ active: exportScope === scope.value }"
                  @click="exportScope = scope.value as 'all' | 'favorites'"
                >
                  <IconRender :icon="scope.icon" :size="14" />
                  {{ scope.label }}
                </button>
              </div>

              <!-- 统计信息 -->
              <div class="ie-section__stats">
                <div class="ie-stat">
                  <span class="ie-stat__num">{{ exportStats.prompts }}</span>
                  <span class="ie-stat__label">条提示词</span>
                </div>
                <div class="ie-stat">
                  <span class="ie-stat__num">{{ exportStats.categories }}</span>
                  <span class="ie-stat__label">个分类</span>
                </div>
                <div class="ie-stat">
                  <span class="ie-stat__num">{{ exportStats.size }}</span>
                  <span class="ie-stat__label">预估大小</span>
                </div>
              </div>

              <!-- JSON 选项 -->
              <div v-if="exportFormat === 'json'" class="ie-section__options">
                <label class="ie-check">
                  <input v-model="jsonOptions.includeCategories" type="checkbox" />
                  <span>包含分类信息</span>
                </label>
                <label class="ie-check">
                  <input v-model="jsonOptions.prettyPrint" type="checkbox" />
                  <span>格式化 JSON（可读性更好）</span>
                </label>

                <!-- JSON 预览 -->
                <div v-if="jsonPreview" class="ie-section__preview">
                  <div class="ie-preview__header">
                    <span>预览（前 500 字符）</span>
                    <span class="ie-preview__badge">{{ jsonPreview.length }} 字符</span>
                  </div>
                  <pre class="ie-preview__code">{{ jsonPreview }}</pre>
                </div>
              </div>

              <!-- CSV 预览 -->
              <div v-if="exportFormat === 'csv'" class="ie-csv-preview">
                <div class="ie-preview__header">
                  <span>CSV 格式预览</span>
                  <span class="ie-preview__badge">表格友好</span>
                </div>
                <div class="ie-csv-info">
                  <p>CSV 格式包含以下字段：</p>
                  <code>ID, 标题, 内容, 描述, 分类, 标签, 收藏, 置顶, 使用次数, 创建时间, 更新时间</code>
                  <p class="ie-csv-hint">适用于 Excel、Google Sheets 等表格处理工具</p>
                </div>
              </div>

              <!-- Markdown 预览 -->
              <div v-if="exportFormat === 'markdown'" class="ie-md-preview">
                <div class="ie-preview__header">
                  <span>Markdown 格式预览</span>
                  <span class="ie-preview__badge">阅读友好</span>
                </div>
                <div class="ie-md-info">
                  <p>Markdown 格式特点：</p>
                  <ul>
                    <li>按分类分组，H2 标题表示分类</li>
                    <li>每个提示词为 H3 标题 + 代码块内容</li>
                    <li>包含标签、使用次数等元信息</li>
                    <li>适用于笔记软件（Obsidian、Notion）</li>
                  </ul>
                </div>
              </div>

              <!-- 静态站点预览 -->
              <div v-if="exportFormat === 'site'" class="ie-site-preview">
                <div class="ie-preview__header">
                  <span>静态站点预览</span>
                  <span class="ie-preview__badge">移动端友好</span>
                </div>
                <div class="ie-site-info">
                  <p>导出一个自包含的 HTML 文件，特点：</p>
                  <ul>
                    <li>📱 移动端响应式设计，手机访问体验佳</li>
                    <li>🔍 内置全文搜索，快速定位提示词</li>
                    <li>📋 一键复制到剪贴板，直接粘贴到 AI</li>
                    <li>🌙 支持暗色模式，自动跟随系统</li>
                    <li>📲 可添加到手机主屏幕（PWA）</li>
                    <li>💾 可保存到本地，离线使用</li>
                  </ul>
                  <div class="ie-site-stats">
                    <span><IconRender icon="carbon:document" :size="14" /> {{ siteStats.prompts }} 条提示词</span>
                    <span><IconRender icon="carbon:folder" :size="14" /> {{ siteStats.categories }} 个分类</span>
                    <span><IconRender icon="carbon:information" :size="14" /> {{ siteStats.size }}</span>
                  </div>
                </div>
              </div>
            </div>

            <!-- ============ 导入 ============ -->
            <div v-else class="ie-section">
              <p class="ie-section__desc">
                从 JSON 文件导入提示词。导入模式决定如何处理同名数据：
              </p>

              <div class="ie-section__options">
                <label v-for="mode in IMPORT_MODES" :key="mode.value" class="ie-radio">
                  <input v-model="importOptions.mode" type="radio" :value="mode.value" />
                  <div class="ie-radio__content">
                    <span class="ie-radio__title">{{ mode.label }}</span>
                    <span class="ie-radio__desc">{{ mode.desc }}</span>
                  </div>
                </label>
              </div>

              <div class="ie-dropzone" :class="{ dragging: isDragging }" @dragover.prevent="isDragging = true"
                @dragleave="isDragging = false" @drop.prevent="onDrop" @click="triggerFileInput">
                <input ref="fileInputEl" type="file" accept=".json" style="display:none" @change="onFileChange" />
                <IconRender icon="carbon:document-blank" :size="40" />
                <p class="ie-dropzone__text">
                  {{ isDragging ? '释放以导入' : '点击选择文件，或拖拽到此处' }}
                </p>
                <p class="ie-dropzone__hint">支持 .json 格式</p>
              </div>

              <!-- 解析预览 -->
              <div v-if="importPreview" class="ie-section__preview">
                <div class="ie-preview__header">
                  <span>检测到数据</span>
                  <span class="ie-preview__badge">{{ importPreview.prompts?.length ?? 0 }} 条提示词</span>
                </div>
                <div class="ie-parse-info">
                  <span><IconRender icon="carbon:document" :size="14" /> {{ importPreview.prompts?.length ?? 0 }} 条提示词</span>
                  <span><IconRender icon="carbon:folder" :size="14" /> {{ importPreview.categories?.length ?? 0 }} 个分类</span>
                  <span><IconRender icon="carbon:information" :size="14" /> 版本 v{{ importPreview._version ?? '?' }}</span>
                </div>
              </div>
            </div>
          </div>

          <!-- Footer -->
          <div class="ie-dialog__footer">
            <button class="ie-dialog__btn ie-dialog__btn--cancel" @click="onCancel">取消</button>
            <button
              v-if="tab === 'export'"
              class="ie-dialog__btn ie-dialog__btn--primary magnetic-btn"
              @click="doExport"
            >
              <IconRender icon="carbon:download" :size="14" />
              导出 {{ formatLabel }}
            </button>
            <button
              v-else
              class="ie-dialog__btn ie-dialog__btn--primary magnetic-btn"
              :disabled="!importPreview || importing"
              @click="doImport"
            >
              <IconRender v-if="importing" icon="carbon:loading" :size="14" style="animation:spin 1s linear infinite" />
              <IconRender v-else icon="carbon:upload" :size="14" />
              {{ importing ? '导入中...' : '开始导入' }}
            </button>
          </div>
        </div>
      </div>
    </Transition>
  </Teleport>
</template>

<script setup lang="ts">
import { ref, computed, watch, onMounted, onUnmounted } from 'vue'
import { usePromptStore } from '@/stores/promptStore'
import { useCategoryStore } from '@/stores/categoryStore'
import { useToast } from '@/composables/useToast'
import { useImportExport, type ExportFormat, type ExportOptions } from '@/composables/useImportExport'
import { useExportSite } from '@/composables/useExportSite'
import type { ExportData, Prompt } from '@/types'

const props = withDefaults(defineProps<{
  modelValue: boolean
}>(), {})

const emit = defineEmits<{
  'update:modelValue': [value: boolean]
}>()

const promptStore = usePromptStore()
const categoryStore = useCategoryStore()
const toast = useToast()
const { exportData, getExportStats } = useImportExport()
const { exportSite, exportSiteWithPWA, getExportStats: getSiteStats } = useExportSite()

const tab = ref<'export' | 'import'>('export')
const isDragging = ref(false)
const fileInputEl = ref<HTMLInputElement>()
const importPreview = ref<ExportData | null>(null)
const importing = ref(false)

// 导出相关状态
const exportFormat = ref<ExportFormat>('json')
const exportScope = ref<'all' | 'favorites'>('all')

const jsonOptions = ref({
  includeCategories: true,
  prettyPrint: true,
})

const importOptions = ref({
  mode: 'merge' as 'merge' | 'replace' | 'skip',
})

const EXPORT_FORMATS = [
  {
    value: 'json',
    name: 'JSON',
    desc: '完整备份，可完整恢复',
    icon: 'carbon:document-json',
  },
  {
    value: 'csv',
    name: 'CSV',
    desc: '表格格式，Excel 友好',
    icon: 'carbon:table',
  },
  {
    value: 'markdown',
    name: 'Markdown',
    desc: '阅读友好，笔记软件适用',
    icon: 'carbon:document',
  },
  {
    value: 'site',
    name: '静态站点',
    desc: '移动端访问，离线可用',
    icon: 'carbon:mobile',
  },
]

const EXPORT_SCOPES = [
  { value: 'all', label: '全部', icon: 'carbon:list' },
  { value: 'favorites', label: '已收藏', icon: 'carbon:star' },
]

const IMPORT_MODES = [
  { value: 'merge', label: '合并（推荐）', desc: '保留现有数据，追加新数据，重复项跳过' },
  { value: 'replace', label: '替换', desc: '用导入数据完全覆盖现有数据（⚠️ 危险）' },
  { value: 'skip', label: '仅新增', desc: '只导入全新提示词，已有完全匹配项跳过' },
]

// 格式标签
const formatLabel = computed(() => {
  const map: Record<ExportFormat | 'site', string> = {
    json: 'JSON',
    csv: 'CSV',
    markdown: 'Markdown',
    site: '静态站点',
  }
  return map[exportFormat.value as ExportFormat | 'site']
})

// 导出统计
const exportStats = computed(() => {
  const prompts = exportScope.value === 'favorites'
    ? promptStore.prompts.filter(p => p.isFavorite).length
    : promptStore.prompts.length
  const categories = categoryStore.categories.length
  const sizeKB = Math.ceil((prompts * 300 + categories * 100) / 1024)
  return { prompts, categories, size: sizeKB < 1 ? '<1KB' : `${sizeKB}KB` }
})

// 静态站点统计
const siteStats = computed(() => {
  const prompts = exportScope.value === 'favorites'
    ? promptStore.prompts.filter(p => p.isFavorite).length
    : promptStore.prompts.length
  const categories = categoryStore.categories.length
  const sizeKB = Math.ceil((prompts * 300 + categories * 100) * 1.5 / 1024)
  return { prompts, categories, size: sizeKB < 1 ? '<1KB' : `${sizeKB}KB` }
})

// JSON 预览
const jsonPreview = computed(() => {
  if (exportFormat.value !== 'json' || !jsonOptions.value.prettyPrint) return null
  const data = buildExportData()
  const json = JSON.stringify(data, null, 2)
  return json.slice(0, 500) + (json.length > 500 ? '...' : '')
})

function buildExportData(): ExportData {
  const prompts = promptStore.prompts.map(p => ({
    id: p.id,
    title: p.title,
    content: p.content,
    description: p.description,
    categoryId: jsonOptions.value.includeCategories ? (p.categoryId ?? null) : null,
    tags: p.tags,
    isPinned: p.isPinned,
    isFavorite: p.isFavorite,
    usageCount: p.usageCount,
    createdAt: p.createdAt,
    updatedAt: p.updatedAt,
  }))
  const categories = jsonOptions.value.includeCategories ? categoryStore.categories.map(c => ({
    id: c.id,
    name: c.name,
    emoji: c.emoji,
    color: c.color,
    sortOrder: c.sortOrder,
    createdAt: c.createdAt,
    updatedAt: c.updatedAt,
  })) : []
  return {
    _version: '1.0',
    _exportedAt: new Date().toISOString(),
    prompts,
    categories,
  }
}

async function doExport() {
  if (exportFormat.value === 'site') {
    await exportSite({ scope: exportScope.value })
    toast.success(`已导出静态站点（${siteStats.value.prompts} 条提示词）`)
    onCancel()
    return
  }

  const options: ExportOptions = {
    includeCategories: exportFormat.value === 'json' ? jsonOptions.value.includeCategories : true,
    prettyPrint: jsonOptions.value.prettyPrint,
    scope: exportScope.value,
  }

  await exportData(exportFormat.value as ExportFormat, options)

  toast.success(`已导出 ${exportStats.value.prompts} 条提示词（${formatLabel.value} 格式）`)
  onCancel()
}

function triggerFileInput() {
  fileInputEl.value?.click()
}

async function onFileChange(e: Event) {
  const file = (e.target as HTMLInputElement).files?.[0]
  if (file) await parseFile(file)
}

async function onDrop(e: DragEvent) {
  isDragging.value = false
  const file = e.dataTransfer?.files?.[0]
  if (file) await parseFile(file)
}

async function parseFile(file: File) {
  if (!file.name.endsWith('.json')) {
    toast.error('仅支持 .json 格式文件')
    return
  }
  try {
    const text = await file.text()
    const data = JSON.parse(text) as ExportData
    if (!data.prompts || !Array.isArray(data.prompts)) {
      toast.error('文件格式无效，缺少 prompts 字段')
      return
    }
    importPreview.value = data
  } catch {
    toast.error('文件解析失败，请检查 JSON 格式')
  }
}

async function doImport() {
  if (!importPreview.value) return
  importing.value = true
  try {
    const { prompts, categories } = importPreview.value
    let added = 0

    // 导入分类（保留原始 ID 以维持父子关系）
    if (categories?.length) {
      for (const cat of categories) {
        const exists = categoryStore.categories.find(c => c.id === cat.id || c.name === cat.name)
        if (!exists) {
          // 传递原始 ID，保持 parentId 引用有效
          await categoryStore.createCategory({
            name: cat.name,
            emoji: cat.emoji,
            color: cat.color,
            sortOrder: cat.sortOrder ?? 0,
            parentId: cat.parentId ?? null,
          }, cat.id)
        }
      }
      await categoryStore.loadCategories()
    }

    // 导入提示词
    for (const prompt of prompts as Prompt[]) {
      if (importOptions.value.mode === 'skip') {
        const dup = promptStore.prompts.find(p => p.title === prompt.title && p.content === prompt.content)
        if (dup) continue
      }

      // 找分类映射
      let categoryId: string = ''
      if (prompt.categoryId && categories?.length) {
        const cat = categories.find(c => c.id === prompt.categoryId || c.name === categoryStore.categoryMap.get(prompt.categoryId ?? '')?.name)
        if (cat) {
          const mapped = categoryStore.categories.find(c => c.name === cat.name)
          categoryId = mapped?.id ?? ''
        }
      }

      await promptStore.createPrompt({
        title: prompt.title,
        content: prompt.content,
        description: prompt.description,
        categoryId,
        tags: prompt.tags,
        isPinned: prompt.isPinned ?? false,
        isFavorite: prompt.isFavorite,
      })
      added++
    }

    await promptStore.loadPrompts()
    toast.success(`导入完成，新增 ${added} 条提示词`)
    onCancel()
  } catch (err) {
    toast.error('导入失败：' + (err as Error).message)
  } finally {
    importing.value = false
  }
}

function onCancel() {
  importPreview.value = null
  emit('update:modelValue', false)
}

watch(() => props.modelValue, (val) => {
  if (val) {
    tab.value = 'export'
    importPreview.value = null
    exportFormat.value = 'json'
    exportScope.value = 'all'
    jsonOptions.value = { includeCategories: true, prettyPrint: true }
  }
})

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

.ie-dialog {
  background: var(--bg-surface);
  border-radius: var(--radius-xl);
  border: 1.5px solid var(--border-color);
  box-shadow: var(--shadow-xl);
  width: 580px;
  max-width: 100%;
  max-height: 90vh;
  display: flex;
  flex-direction: column;
  overflow: hidden;
}

.ie-dialog__header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 18px 24px;
  border-bottom: 1px solid var(--border-color);
}

.ie-dialog__title {
  display: flex;
  align-items: center;
  gap: 10px;
  font-size: var(--text-lg);
  font-weight: 600;
  color: var(--text-primary);
}

.ie-dialog__title i { color: var(--primary-600); font-size: 22px; }

.ie-dialog__close {
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
.ie-dialog__close:hover { background: var(--gray-100); color: var(--text-primary); }

/* Tabs */
.ie-dialog__tabs {
  display: flex;
  border-bottom: 1px solid var(--border-color);
  flex-shrink: 0;
}

.ie-dialog__tab {
  flex: 1;
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 8px;
  padding: 12px;
  font-size: var(--text-sm);
  font-weight: 500;
  color: var(--text-secondary);
  border-bottom: 2px solid transparent;
  transition: all var(--transition-fast);
}
.ie-dialog__tab:hover { color: var(--text-primary); }
.ie-dialog__tab.active {
  color: var(--primary-600);
  border-bottom-color: var(--primary-500);
}

/* Body */
.ie-dialog__body {
  flex: 1;
  overflow-y: auto;
  padding: 20px 24px;
}

.ie-section { display: flex; flex-direction: column; gap: 16px; }

.ie-section__desc {
  font-size: var(--text-sm);
  color: var(--text-secondary);
  line-height: 1.6;
}

.ie-section__subtitle {
  font-size: var(--text-xs);
  font-weight: 600;
  color: var(--text-muted);
  text-transform: uppercase;
  letter-spacing: 0.5px;
}

/* 格式选择卡片 */
.ie-format-grid {
  display: grid;
  grid-template-columns: repeat(3, 1fr);
  gap: 10px;
}

.ie-format-card {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 6px;
  padding: 16px 12px;
  background: var(--bg-surface);
  border: 1.5px solid var(--border-color);
  border-radius: var(--radius-lg);
  cursor: pointer;
  transition: all var(--transition-fast);
  text-align: center;
}

.ie-format-card:hover {
  border-color: var(--primary-300);
  background: var(--primary-50);
}

.ie-format-card.active {
  border-color: var(--primary-500);
  background: var(--primary-50);
}

.ie-format-card__icon {
  font-size: 24px;
  color: var(--primary-600);
}

.ie-format-card__name {
  font-size: var(--text-sm);
  font-weight: 600;
  color: var(--text-primary);
}

.ie-format-card__desc {
  font-size: 11px;
  color: var(--text-muted);
  line-height: 1.4;
}

/* 范围选择 */
.ie-scope-btns {
  display: flex;
  gap: 8px;
}

.ie-scope-btn {
  display: flex;
  align-items: center;
  gap: 6px;
  padding: 8px 16px;
  font-size: var(--text-sm);
  font-weight: 500;
  color: var(--text-secondary);
  background: var(--gray-50);
  border: 1.5px solid var(--border-color);
  border-radius: var(--radius-md);
  cursor: pointer;
  transition: all var(--transition-fast);
}

.ie-scope-btn:hover {
  border-color: var(--primary-300);
  color: var(--primary-600);
}

.ie-scope-btn.active {
  background: var(--primary-100);
  border-color: var(--primary-500);
  color: var(--primary-700);
}

/* Stats */
.ie-section__stats {
  display: flex;
  gap: 16px;
  padding: 14px;
  background: var(--gray-50);
  border-radius: var(--radius-lg);
  border: 1px solid var(--border-color);
}

.ie-stat {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 2px;
  flex: 1;
}

.ie-stat__num {
  font-size: var(--text-xl);
  font-weight: 700;
  color: var(--primary-600);
}

.ie-stat__label {
  font-size: 11px;
  color: var(--text-muted);
}

/* Options */
.ie-section__options {
  display: flex;
  flex-direction: column;
  gap: 10px;
}

.ie-check {
  display: flex;
  align-items: flex-start;
  gap: 10px;
  font-size: var(--text-sm);
  color: var(--text-primary);
  cursor: pointer;
}
.ie-check input[type="checkbox"] {
  margin-top: 2px;
  width: 16px;
  height: 16px;
  accent-color: var(--primary-600);
  cursor: pointer;
}

.ie-radio {
  display: flex;
  align-items: flex-start;
  gap: 10px;
  padding: 12px;
  border: 1.5px solid var(--border-color);
  border-radius: var(--radius-md);
  cursor: pointer;
  transition: all var(--transition-fast);
}
.ie-radio:hover { border-color: var(--primary-300); background: var(--primary-50); }
.ie-radio:has(input:checked) { border-color: var(--primary-500); background: var(--primary-50); }
.ie-radio input[type="radio"] {
  margin-top: 3px;
  width: 16px;
  height: 16px;
  accent-color: var(--primary-600);
  cursor: pointer;
  flex-shrink: 0;
}
.ie-radio__content { display: flex; flex-direction: column; gap: 2px; }
.ie-radio__title { font-size: var(--text-sm); font-weight: 500; color: var(--text-primary); }
.ie-radio__desc { font-size: 12px; color: var(--text-secondary); }

/* Preview */
.ie-section__preview {
  background: var(--gray-50);
  border: 1px solid var(--border-color);
  border-radius: var(--radius-md);
  overflow: hidden;
}

.ie-preview__header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 8px 12px;
  font-size: 12px;
  color: var(--text-secondary);
  background: rgba(0,0,0,0.03);
  border-bottom: 1px solid var(--border-color);
}

.ie-preview__badge {
  background: var(--primary-100);
  color: var(--primary-700);
  padding: 2px 8px;
  border-radius: var(--radius-full);
  font-size: 11px;
}

.ie-preview__code {
  padding: 12px;
  font-family: var(--font-mono);
  font-size: 11px;
  color: var(--text-secondary);
  line-height: 1.6;
  overflow-x: auto;
  white-space: pre-wrap;
  word-break: break-all;
  max-height: 180px;
  overflow-y: auto;
}

/* CSV 预览 */
.ie-csv-preview {
  background: var(--gray-50);
  border: 1px solid var(--border-color);
  border-radius: var(--radius-md);
  overflow: hidden;
}

.ie-csv-info {
  padding: 12px;
  font-size: var(--text-sm);
  color: var(--text-secondary);
  line-height: 1.6;
}

.ie-csv-info code {
  display: block;
  padding: 8px 10px;
  margin: 8px 0;
  background: var(--bg-surface);
  border: 1px solid var(--border-color);
  border-radius: var(--radius-sm);
  font-family: var(--font-mono);
  font-size: 11px;
  color: var(--primary-600);
  word-break: break-all;
}

.ie-csv-hint {
  font-size: 12px;
  color: var(--text-muted);
  margin-top: 8px;
}

/* Markdown 预览 */
.ie-md-preview {
  background: var(--gray-50);
  border: 1px solid var(--border-color);
  border-radius: var(--radius-md);
  overflow: hidden;
}

.ie-md-info {
  padding: 12px;
  font-size: var(--text-sm);
  color: var(--text-secondary);
  line-height: 1.6;
}

.ie-md-info ul {
  margin: 8px 0 0 0;
  padding-left: 20px;
}

.ie-md-info li {
  margin-bottom: 4px;
}

/* 静态站点预览 */
.ie-site-preview {
  background: var(--gray-50);
  border: 1px solid var(--border-color);
  border-radius: var(--radius-md);
  overflow: hidden;
}

.ie-site-info {
  padding: 12px;
  font-size: var(--text-sm);
  color: var(--text-secondary);
  line-height: 1.6;
}

.ie-site-info ul {
  margin: 8px 0;
  padding-left: 20px;
}

.ie-site-info li {
  margin-bottom: 6px;
}

.ie-site-stats {
  display: flex;
  gap: 16px;
  padding: 10px 12px;
  font-size: 12px;
  color: var(--text-secondary);
  background: rgba(0,0,0,0.03);
  border-top: 1px solid var(--border-color);
}

.ie-site-stats span {
  display: flex;
  align-items: center;
  gap: 4px;
}

/* Parse info */
.ie-parse-info {
  display: flex;
  gap: 16px;
  padding: 10px 12px;
  font-size: 12px;
  color: var(--text-secondary);
}
.ie-parse-info span {
  display: flex;
  align-items: center;
  gap: 4px;
}

/* Dropzone */
.ie-dropzone {
  border: 2px dashed var(--border-color);
  border-radius: var(--radius-lg);
  padding: 32px;
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 10px;
  cursor: pointer;
  transition: all var(--transition-base);
  text-align: center;
}
.ie-dropzone:hover, .ie-dropzone.dragging {
  border-color: var(--primary-400);
  background: var(--primary-50);
}
.ie-dropzone i {
  font-size: 40px;
  color: var(--text-muted);
}
.ie-dropzone__text {
  font-size: var(--text-sm);
  color: var(--text-primary);
  font-weight: 500;
}
.ie-dropzone__hint {
  font-size: 12px;
  color: var(--text-muted);
}

/* Footer */
.ie-dialog__footer {
  display: flex;
  justify-content: flex-end;
  gap: 10px;
  padding: 16px 24px;
  border-top: 1px solid var(--border-color);
  flex-shrink: 0;
}

.ie-dialog__btn {
  display: inline-flex;
  align-items: center;
  gap: 6px;
  padding: 9px 20px;
  border-radius: var(--radius-md);
  font-size: var(--text-sm);
  font-weight: 500;
  transition: all var(--transition-base);
}

.ie-dialog__btn--cancel {
  background: var(--gray-100);
  color: var(--gray-700);
  border: 1.5px solid var(--gray-200);
}
.ie-dialog__btn--cancel:hover { background: var(--gray-200); }

.ie-dialog__btn--primary {
  background: var(--primary-600);
  color: #fff;
  box-shadow: var(--shadow-sm);
  border: none;
}
.ie-dialog__btn--primary:hover:not(:disabled) { background: var(--primary-700); }
.ie-dialog__btn--primary:disabled { opacity: 0.5; cursor: not-allowed; }

/* 暗色 */
[data-theme='dark'] .ie-dialog {
  background: var(--gray-800);
  border-color: rgba(255,255,255,0.1);
}
[data-theme='dark'] .ie-section__stats,
[data-theme='dark'] .ie-preview__header,
[data-theme='dark'] .ie-section__preview,
[data-theme='dark'] .ie-csv-preview,
[data-theme='dark'] .ie-md-preview {
  background: rgba(0,0,0,0.2);
}
[data-theme='dark'] .ie-dropzone:hover,
[data-theme='dark'] .ie-dropzone.dragging { background: rgba(99,102,241,0.1); }
[data-theme='dark'] .ie-scope-btn { background: rgba(0,0,0,0.2); }
[data-theme='dark'] .ie-format-card { background: rgba(0,0,0,0.2); }
[data-theme='dark'] .ie-csv-info code { background: rgba(0,0,0,0.3); }

/* 动画 */
.dialog-enter-active, .dialog-leave-active { transition: opacity 250ms ease; }
.dialog-enter-active .ie-dialog, .dialog-leave-active .ie-dialog {
  transition: transform 250ms cubic-bezier(0.16,1,0.3,1), opacity 250ms ease;
}
.dialog-enter-from, .dialog-leave-to { opacity: 0; }
.dialog-enter-from .ie-dialog { transform: scale(0.92) translateY(-8px); }
.dialog-leave-to .ie-dialog { transform: scale(0.95); opacity: 0; }

@keyframes spin {
  from { transform: rotate(0deg); }
  to { transform: rotate(360deg); }
}
</style>

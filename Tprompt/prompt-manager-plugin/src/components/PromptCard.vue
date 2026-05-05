<template>
  <div
    class="prompt-card"
    :class="{
      'prompt-card--compact': compact,
      'prompt-card--fav': prompt.isFavorite,
      'prompt-card--selected': selected,
      'prompt-card--list': listMode,
    }"
    @click.self="$emit('copy', prompt)"
    @contextmenu.prevent="onContextMenu"
  >
    <!-- 复选框（批量选择，noCheckbox 时隐藏）-->
    <div v-if="!noCheckbox" class="prompt-card__checkbox" @click.stop>
      <input
        type="checkbox"
        class="prompt-card__checkbox-input"
        :checked="selected"
        @change="$emit('select', prompt.id, ($event.target as HTMLInputElement).checked)"
      />
      <div class="prompt-card__checkbox-custom" :class="{ checked: selected }">
        <IconRender v-if="selected" icon="carbon:checkmark" :size="11" />
      </div>
    </div>

    <!-- 收藏角标 -->
    <div v-if="prompt.isFavorite" class="prompt-card__fav-badge" title="已收藏">
      <IconRender icon="carbon:star-filled" :size="11" />
    </div>

    <!-- 主内容 -->
    <div class="prompt-card__main">
      <div class="prompt-card__header">
        <!-- 搜索高亮标题 -->
        <h3 class="prompt-card__title truncate" @click.stop="$emit('edit', prompt)">
          <span v-html="highlightedTitle"></span>
        </h3>
        <!-- 简单模式：仅复制按钮 -->
        <div v-if="simpleActions" class="prompt-card__actions prompt-card__actions--simple" @click.stop>
          <button class="pc-btn pc-btn--copy" title="复制全文" @click="copyFull">
            <IconRender icon="carbon:copy" :size="14" />
          </button>
        </div>

        <!-- 完整模式：收藏/复制/编辑/删除 -->
        <div v-else class="prompt-card__actions" @click.stop>
          <button
            class="pc-btn"
            :class="{ active: prompt.isFavorite }"
            :title="prompt.isFavorite ? '取消收藏' : '收藏'"
            @click="$emit('toggle-favorite', prompt.id)"
          >
            <IconRender :icon="prompt.isFavorite ? 'carbon:star-filled' : 'carbon:star'" :size="14" />
          </button>

          <!-- 复制全文 -->
          <button class="pc-btn pc-btn--copy" title="复制全文" @click="copyFull">
            <IconRender icon="carbon:copy" :size="14" />
          </button>

          <button class="pc-btn" title="编辑" @click="$emit('edit', prompt)">
            <IconRender icon="carbon:edit" :size="14" />
          </button>
          <button class="pc-btn pc-btn--danger" title="删除" @click="$emit('delete', prompt)">
            <IconRender icon="carbon:trash-can" :size="14" />
          </button>
        </div>
      </div>

      <!-- 搜索高亮内容 -->
      <p class="prompt-card__content">
        <span v-html="highlightedContent"></span>
      </p>

      <div class="prompt-card__footer">
        <div class="prompt-card__meta-left">
          <TagBadge
            v-if="categoryName"
            :label="categoryName"
            :color="categoryColor"
            size="sm"
          />
          <span
            v-for="tag in prompt.tags?.slice(0, 3)"
            :key="tag"
            class="prompt-card__tag"
          >{{ tag }}</span>
        </div>
        <div class="prompt-card__meta-right">
          <span class="prompt-card__meta-item" :title="fullDate">
            <IconRender icon="carbon:time" :size="12" /> {{ relativeDate }}
          </span>
          <span class="prompt-card__meta-item">
            <IconRender icon="carbon:chart-bar" :size="12" /> {{ prompt.usageCount }}
          </span>
        </div>
      </div>
    </div>

    <!-- 右键菜单 -->
    <ContextMenu
      :visible="ctxMenu.visible"
      :x="ctxMenu.x"
      :y="ctxMenu.y"
      :items="ctxMenuItems"
    />
  </div>
</template>

<script setup lang="ts">
import { computed, reactive } from 'vue'
import ContextMenu from './ContextMenu.vue'
import type { MenuItem } from './ContextMenu.vue'
import TagBadge from './TagBadge.vue'
import { useCategoryStore } from '@/stores/categoryStore'
import type { Prompt } from '@/types'

const props = defineProps<{
  prompt: Prompt
  compact?: boolean
  listMode?: boolean
  searchQuery?: string
  selected?: boolean
  noCheckbox?: boolean
  simpleActions?: boolean
  categories?: Array<{ id: string; name: string; emoji: string }>
}>()

const emit = defineEmits<{
  'copy': [prompt: Prompt]
  'edit': [prompt: Prompt]
  'delete': [prompt: Prompt]
  'toggle-favorite': [id: string]
  'move': [id: string, categoryId: string | null]
  'select': [id: string, selected: boolean]
}>()

const categoryStore = useCategoryStore()

// -------------------- 分类信息 --------------------
const categoryName = computed(() => {
  if (!props.prompt.categoryId) return null
  return categoryStore.categoryMap.get(props.prompt.categoryId)?.name ?? null
})

const categoryColor = computed(() => {
  if (!props.prompt.categoryId) return '#6366f1'
  return categoryStore.categoryMap.get(props.prompt.categoryId)?.color ?? '#6366f1'
})

const fullDate = computed(() => new Date(props.prompt.updatedAt).toLocaleString('zh-CN'))

const relativeDate = computed(() => {
  const diff = Date.now() - props.prompt.updatedAt
  const m = Math.floor(diff / 60000)
  if (m < 1) return '刚刚'
  if (m < 60) return `${m}m前`
  const h = Math.floor(m / 60)
  if (h < 24) return `${h}h前`
  const d = Math.floor(h / 24)
  if (d < 30) return `${d}天前`
  const mo = Math.floor(d / 30)
  if (mo < 12) return `${mo}月前`
  return `${Math.floor(mo / 12)}年前`
})

// -------------------- 搜索高亮 --------------------
function escapeHtml(str: string): string {
  return str
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
}

function highlightText(text: string, query: string): string {
  if (!query?.trim()) return escapeHtml(text)
  const terms = query.trim().split(/\s+/).filter(Boolean)
  let result = escapeHtml(text)
  for (const term of terms) {
    const escaped = term.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')
    const re = new RegExp(`(${escaped})`, 'gi')
    result = result.replace(re, '<mark class="search-highlight">$1</mark>')
  }
  return result
}

const highlightedTitle = computed(() => highlightText(props.prompt.title, props.searchQuery ?? ''))
const highlightedContent = computed(() => {
  const content = props.prompt.content || ''
  const q = props.searchQuery ?? ''
  if (!q.trim()) return escapeHtml(content)
  const terms = q.trim().split(/\s+/).filter(Boolean)
  for (const term of terms) {
    const idx = content.toLowerCase().indexOf(term.toLowerCase())
    if (idx !== -1) {
      const start = Math.max(0, idx - 40)
      const end = Math.min(content.length, idx + term.length + 60)
      const snippet = content.slice(start, end)
      return highlightText((start > 0 ? '…' : '') + snippet + (end < content.length ? '…' : ''), q)
    }
  }
  return highlightText(content, q)
})

// -------------------- 右键菜单 --------------------
const ctxMenu = reactive({ visible: false, x: 0, y: 0 })

function onContextMenu(e: MouseEvent) {
  ctxMenu.visible = true
  ctxMenu.x = e.clientX
  ctxMenu.y = e.clientY
  document.addEventListener('click', closeCtxMenu, { once: true })
  document.addEventListener('contextmenu', closeCtxMenu, { once: true })
}

function closeCtxMenu() {
  ctxMenu.visible = false
}

// -------------------- 复制全文 --------------------
function copyFull() {
  emit('copy', props.prompt)
}

const ctxMenuItems = computed<MenuItem[]>(() => {
  const cats = props.categories ?? categoryStore.categories

  const items: MenuItem[] = [
    {
      id: 'copy',
      label: '复制全文',
      icon: 'carbon:copy',
      action: () => { emit('copy', props.prompt); closeCtxMenu() },
    },
    {
      id: 'edit',
      label: '编辑',
      icon: 'carbon:edit',
      action: () => { emit('edit', props.prompt); closeCtxMenu() },
    },
    {
      id: 'fav',
      label: props.prompt.isFavorite ? '取消收藏' : '收藏',
      icon: props.prompt.isFavorite ? 'carbon:star-filled' : 'carbon:star',
      action: () => { emit('toggle-favorite', props.prompt.id); closeCtxMenu() },
    },
    {
      id: 'sep1',
      label: '',
      icon: '',
      action: () => {},
    },
  ]

  // 移动到分类
  if (cats.length > 0) {
    items.push({
      id: 'move-header',
      label: '移动到...',
      icon: 'carbon:folder-move',
      action: () => {},
    })

    for (const cat of cats) {
      if (cat.id === props.prompt.categoryId) continue
      items.push({
        id: `move-${cat.id}`,
        label: `  ${cat.name}`,
        icon: '',
        action: () => { emit('move', props.prompt.id, cat.id); closeCtxMenu() },
      })
    }

    if (props.prompt.categoryId) {
      items.push({
        id: 'move-none',
        label: '  🚫 移除分类',
        icon: '',
        action: () => { emit('move', props.prompt.id, null); closeCtxMenu() },
      })
    }
  }

  items.push({
    id: 'sep2',
    label: '',
    icon: '',
    action: () => {},
  })
  items.push({
    id: 'delete',
    label: '删除',
    icon: 'carbon:trash-can',
    type: 'danger',
    action: () => { emit('delete', props.prompt); closeCtxMenu() },
  })

  return items
})
</script>

<style>
/* ---- 搜索高亮（全局，穿透 scoped 边界）---- */
.search-highlight {
  background: rgba(251, 191, 36, 0.35);
  color: inherit;
  border-radius: 2px;
  padding: 0 1px;
}

[data-theme='dark'] .search-highlight {
  background: rgba(251, 191, 36, 0.2);
  color: #fbbf24;
}
</style>

<style scoped>
/* ---- 卡片 ---- */
.prompt-card {
  position: relative;
  background: var(--bg-surface);
  border: 1.5px solid var(--border-color);
  border-radius: var(--radius-lg);
  padding: 16px;
  cursor: pointer;
  transition: transform var(--transition-base), box-shadow var(--transition-base),
    border-color var(--transition-base);
  user-select: none;
}

.prompt-card:hover {
  transform: translateY(-2px);
  border-color: var(--primary-400);
  box-shadow: var(--shadow-lg);
}

.prompt-card--fav {
  border-color: rgba(245, 158, 11, 0.3);
}

.prompt-card--fav:hover {
  border-color: var(--color-warning);
}

.prompt-card--selected {
  border-color: var(--primary-400);
  background: var(--primary-50);
}

[data-theme='dark'] .prompt-card--selected {
  background: rgba(99, 102, 241, 0.08);
}

/* ---- 复选框 ---- */
.prompt-card__checkbox {
  position: absolute;
  top: 12px;
  left: 12px;
  z-index: 2;
  opacity: 0;
  transition: opacity var(--transition-fast);
}

.prompt-card:hover .prompt-card__checkbox,
.prompt-card--selected .prompt-card__checkbox {
  opacity: 1;
}

.prompt-card__checkbox-input {
  position: absolute;
  width: 18px;
  height: 18px;
  opacity: 0;
  cursor: pointer;
  margin: 0;
}

.prompt-card__checkbox-custom {
  width: 18px;
  height: 18px;
  border-radius: 4px;
  border: 2px solid var(--gray-300);
  background: var(--bg-surface);
  display: flex;
  align-items: center;
  justify-content: center;
  transition: all var(--transition-fast);
  font-size: 11px;
  color: #fff;
}

.prompt-card__checkbox-custom.checked {
  background: var(--primary-600);
  border-color: var(--primary-600);
}

.prompt-card--compact {
  padding: 12px 14px;
}

.prompt-card__fav-badge {
  position: absolute;
  top: -6px;
  right: -6px;
  width: 22px;
  height: 22px;
  border-radius: 50%;
  background: var(--color-warning);
  color: #fff;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 12px;
  box-shadow: var(--shadow-sm);
}

.prompt-card__header {
  display: flex;
  align-items: center;
  gap: 8px;
  margin-bottom: 8px;
}

.prompt-card__title {
  flex: 1;
  font-size: var(--text-base);
  font-weight: 600;
  color: var(--text-primary);
  cursor: pointer;
  transition: color var(--transition-fast);
}

.prompt-card__title:hover {
  color: var(--primary-600);
  text-decoration: underline;
  text-decoration-color: var(--primary-400);
}

.prompt-card--compact .prompt-card__title {
  font-size: var(--text-sm);
}

.prompt-card__actions {
  display: flex;
  align-items: center;
  gap: 2px;
  opacity: 0;
  transition: opacity var(--transition-fast);
  flex-shrink: 0;
}

.prompt-card:hover .prompt-card__actions {
  opacity: 1;
}

/* 简单模式：右对齐，hover 时显示 */
.prompt-card__actions--simple {
  justify-content: flex-end;
  opacity: 0;
  transition: opacity var(--transition-fast);
}
.prompt-card:hover .prompt-card__actions--simple {
  opacity: 1;
}

.pc-btn {
  width: 28px;
  height: 28px;
  display: flex;
  align-items: center;
  justify-content: center;
  border-radius: var(--radius-sm);
  font-size: 15px;
  color: var(--text-muted);
  transition: background var(--transition-fast), color var(--transition-fast);
}

.pc-btn:hover {
  background: var(--gray-100);
  color: var(--text-primary);
}

.pc-btn.active { color: var(--color-warning); }
.pc-btn.active:hover { background: rgba(245, 158, 11, 0.1); }

.pc-btn--danger:hover {
  background: rgba(239, 68, 68, 0.1);
  color: var(--color-error);
}

/* ---- 卡片内容 ---- */
.prompt-card__content {
  font-size: var(--text-sm);
  color: var(--text-secondary);
  line-height: 1.6;
  margin-bottom: 12px;
  overflow: hidden;
  display: -webkit-box;
  -webkit-line-clamp: 2;
  -webkit-box-orient: vertical;
}

.prompt-card--compact .prompt-card__content {
  -webkit-line-clamp: 1;
}

.prompt-card__footer {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 8px;
}

.prompt-card__meta-left {
  display: flex;
  align-items: center;
  gap: 6px;
  flex-wrap: wrap;
  flex: 1;
  min-width: 0;
}

.prompt-card__tag {
  font-size: 11px;
  padding: 2px 7px;
  background: var(--gray-100);
  color: var(--text-muted);
  border-radius: var(--radius-full);
}

.prompt-card__meta-right {
  display: flex;
  align-items: center;
  gap: 10px;
  flex-shrink: 0;
}

.prompt-card__meta-item {
  display: flex;
  align-items: center;
  gap: 3px;
  font-size: 11px;
  color: var(--text-muted);
}

[data-theme='dark'] .prompt-card__tag {
  background: rgba(255, 255, 255, 0.06);
  color: var(--gray-400);
}

/* ---- 列表模式 ---- */
.prompt-card--list .prompt-card__actions {
  opacity: 1;
}

.prompt-card--list .prompt-card__checkbox {
  opacity: 0;
}

.prompt-card--list:hover .prompt-card__checkbox,
.prompt-card--list.prompt-card--selected .prompt-card__checkbox {
  opacity: 1;
}
</style>

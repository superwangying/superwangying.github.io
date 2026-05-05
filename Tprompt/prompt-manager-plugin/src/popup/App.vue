<template>
  <div class="popup-app" @keydown="onKeyDown" tabindex="0" @contextmenu.prevent>
    <!-- Header 深色顶栏 -->
    <header class="popup-header">
      <div class="popup-header__logo">
        <IconRender icon="carbon:bookmark" :size="16" />
      </div>
      <span class="popup-header__title">Prompt Manager</span>
      <div class="popup-header__actions">
        <button class="popup-header__action" title="设置" @click="openOptionsPage">
          <IconRender icon="carbon:settings" :size="16" />
        </button>
        <button class="popup-header__action" title="打开管理页" @click="openOptionsPage">
          <IconRender icon="carbon:open-panel-right" :size="16" />
        </button>
      </div>
    </header>

    <!-- 搜索框 -->
    <div class="popup-search">
      <IconRender icon="carbon:search" class="popup-search__icon" />
      <input
        ref="searchInputRef"
        v-model="searchKeyword"
        class="popup-search__input"
        placeholder="快速搜索..."
        @input="onSearch"
        @keydown.enter="onSearchSubmit"
        @keydown.esc="clearSearch"
      />
      <button v-if="searchKeyword" class="popup-search__clear" @click="clearSearch">
        <IconRender icon="carbon:close" />
      </button>
    </div>

    <!-- Tab 栏：全部 / 收藏 / 最近 -->
    <div class="popup-tabs">
      <button
        v-for="tab in tabs"
        :key="tab.key"
        class="popup-tab"
        :class="{ 'popup-tab--active': activeTab === tab.key }"
        @click="switchTab(tab.key)"
      >
        <IconRender :icon="tab.icon" :size="13" class="popup-tab__icon" />
        {{ tab.label }}
      </button>
    </div>

    <!-- 提示词列表 -->
    <div ref="listRef" class="popup-list">
      <template v-if="displayPrompts.length > 0">
        <PromptCard
          v-for="p in displayPrompts"
          :key="p.id"
          :prompt="p"
          :search-query="searchKeyword"
          :compact="true"
          :no-checkbox="true"
          :simple-actions="true"
          :categories="categoryStore.categories as any"
          @copy="copyPrompt"
          @edit="openOptionsPage"
          @delete="onDeletePrompt"
          @toggle-favorite="onToggleFavorite"
          @move="onMovePrompt"
        />
      </template>
      <EmptyState
        v-else-if="!searchKeyword"
        type="prompts"
        title="还没有提示词"
        description="去管理页添加"
      />
      <EmptyState
        v-else
        type="search"
        title="没有找到"
        description="换个关键词试试"
      />
    </div>

    <!-- 底部栏 -->
    <footer class="popup-footer">
      <span class="popup-footer__link" @click="openNewPrompt">✚ 新建提示词</span>
      <span class="popup-footer__link" @click="openOptionsPage">打开管理页 &rarr;</span>
    </footer>

    <!-- 右键上下文菜单 -->
    <Teleport to="body">
      <div
        v-if="contextMenu.visible"
        class="ctx-menu"
        :style="{ top: contextMenu.y + 'px', left: contextMenu.x + 'px' }"
        @click.stop
      >
        <div class="ctx-menu__item" @click="ctxAction('copy')">
        <IconRender icon="carbon:copy" :size="14" /> 复制全文
      </div>
        <div class="ctx-menu__item" @click="ctxAction('edit')">
          <IconRender icon="carbon:edit" :size="14" /> 编辑
        </div>
        <div class="ctx-menu__item" @click="ctxAction('move')">
          <IconRender icon="carbon:folder-move" :size="14" /> 移动到分类
        </div>
        <div class="ctx-menu__item" @click="ctxAction('unfav')">
          <IconRender icon="carbon:star" :size="14" /> 取消收藏
        </div>
        <div class="ctx-menu__divider"></div>
        <div class="ctx-menu__item ctx-menu__item--danger" @click="ctxAction('delete')">
          <IconRender icon="carbon:trash-can" :size="14" /> 删除
        </div>
      </div>
    </Teleport>

    <ToastNotify />
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted, onUnmounted, nextTick, reactive } from 'vue'
import PromptCard from '@/components/PromptCard.vue'
import EmptyState from '@/components/EmptyState.vue'
import ToastNotify from '@/components/ToastNotify.vue'
import { usePromptStore } from '@/stores/promptStore'
import { useCategoryStore } from '@/stores/categoryStore'
import { useSettingStore } from '@/stores/settingStore'
import { useToast } from '@/composables/useToast'
import { useSearch } from '@/composables/useSearch'
import { VIRTUAL_CATEGORY } from '@/types'
import type { Prompt } from '@/types'

const promptStore = usePromptStore()
const categoryStore = useCategoryStore()
const settingStore = useSettingStore()
const toast = useToast()
const search = useSearch()

// ===== 状态 =====
const searchKeyword = ref('')
const searchInputRef = ref<HTMLInputElement | null>(null)
const listRef = ref<HTMLElement | null>(null)
const focusedIndex = ref(-1)
const activeTab = ref('all')

const tabs = [
  { key: 'all' as const, label: '全部', icon: 'feather:grid' },
  { key: 'favorite' as const, label: '收藏', icon: 'feather:star' },
  { key: 'recent' as const, label: '最近', icon: 'carbon:time' },
]

// 右键菜单状态
const contextMenu = reactive({
  visible: false,
  x: 0,
  y: 0,
  prompt: null as Prompt | null,
})



// ===== 显示列表（根据 tab + 搜索过滤）======
const displayPrompts = computed(() => {
  let list = promptStore.filteredPrompts
  if (activeTab.value === 'favorite') {
    list = list.filter((p: Prompt) => p.isFavorite)
  } else if (activeTab.value === 'recent') {
    list = [...list].sort((a: Prompt, b: Prompt) => {
      return new Date(b.updatedAt || b.createdAt).getTime() -
             new Date(a.updatedAt || a.createdAt).getTime()
    })
  }
  return list
})

// ===== 初始化 =====
onMounted(async () => {
  await settingStore.init()
  await categoryStore.loadCategories()
  await promptStore.loadPrompts()
  search.buildIndex(promptStore.prompts)
  categoryStore.setActiveCategory(VIRTUAL_CATEGORY.ALL)
})

// 点击其他区域关闭右键菜单
onMounted(() => {
  document.addEventListener('click', closeContextMenu)
})
onUnmounted(() => {
  document.removeEventListener('click', closeContextMenu)
})

// ===== 搜索 =====
function onSearch() {
  focusedIndex.value = -1
  if (!searchKeyword.value.trim()) {
    promptStore.setSearchResults([])
    promptStore.setSearchKeyword('')
    return
  }
  promptStore.setSearchKeyword(searchKeyword.value)
  const ids = search.search(searchKeyword.value)
  promptStore.setSearchResults(ids)
}

function onSearchSubmit() {
  if (focusedIndex.value >= 0) {
    const p = displayPrompts.value[focusedIndex.value]
    if (p) copyPrompt(p)
  } else if (searchKeyword.value.trim()) {
    search.addToHistory(searchKeyword.value)
  }
}

function clearSearch() {
  searchKeyword.value = ''
  focusedIndex.value = -1
  promptStore.setSearchResults([])
  promptStore.setSearchKeyword('')
  searchInputRef.value?.focus()
}

// ===== Tab 切换 =====
function switchTab(key: string) {
  activeTab.value = key
  focusedIndex.value = -1
}

// ===== 键盘导航 =====
function onKeyDown(e: KeyboardEvent) {
  const total = displayPrompts.value.length
  if (total === 0) return

  if (e.key === 'ArrowDown') {
    e.preventDefault()
    focusedIndex.value = Math.min(focusedIndex.value + 1, total - 1)
    scrollToFocused()
  } else if (e.key === 'ArrowUp') {
    e.preventDefault()
    focusedIndex.value = Math.max(focusedIndex.value - 1, 0)
    scrollToFocused()
  } else if (e.key === 'Enter') {
    if (focusedIndex.value >= 0) {
      const p = displayPrompts.value[focusedIndex.value]
      if (p) copyPrompt(p)
    }
  }
}

function scrollToFocused() {
  nextTick(() => {
    const items = listRef.value?.querySelectorAll('.prompt-card')
    if (items && items[focusedIndex.value]) {
      items[focusedIndex.value].scrollIntoView({ block: 'nearest', behavior: 'smooth' })
    }
  })
}

// ===== 操作 =====
async function copyPrompt(p: Prompt) {
  try {
    await navigator.clipboard.writeText(p.content)
    await promptStore.incrementUsageCount(p.id)
    toast.success('已复制到剪贴板')
  } catch {
    toast.error('复制失败')
  }
}

function openOptionsPage() {
  if (typeof chrome !== 'undefined' && chrome.runtime?.openOptionsPage) {
    chrome.runtime.openOptionsPage()
  }
}

function openNewPrompt() {
  openOptionsPage()
}

// ===== PromptCard 事件处理 =====
async function onDeletePrompt(p: Prompt) {
  await promptStore.deletePrompt(p.id)
  toast.success('已删除')
}

function onToggleFavorite(id: string) {
  promptStore.toggleFavorite(id)
}

function onMovePrompt(id: string, categoryId: string | null) {
  promptStore.updatePrompt(id, { categoryId })
  toast.success('已移动')
}

// ===== 右键菜单 =====
function showContextMenu(e: MouseEvent, p: Prompt) {
  contextMenu.prompt = p
  contextMenu.x = e.clientX
  contextMenu.y = e.clientY
  contextMenu.visible = true
}

function closeContextMenu() {
  contextMenu.visible = false
  contextMenu.prompt = null
}

function ctxAction(action: string) {
  const p = contextMenu.prompt
  if (!p) return
  closeContextMenu()

  switch (action) {
    case 'copy':
      copyPrompt(p)
      break
    case 'edit':
      openOptionsPage()
      break
    case 'move':
      toast.info('请在管理页中移动分类')
      break
    case 'unfav':
      promptStore.toggleFavorite(p.id)
      toast.success('已取消收藏')
      break
    case 'delete':
      promptStore.deletePrompt(p.id)
      toast.success('已删除')
      break
  }
}
</script>

<style scoped>
/* ============================
   设计令牌 — 与 ui-preview/index.html 完全一致
============================ */
:root {
  --primary-500: #6366f1;
  --primary-600: #4f46e5;
  --primary-400: #818cf8;
  --primary-300: #a5b4fc;
  --primary-50: #f0f4ff;

  --gray-50: #f9fafb;
  --gray-100: #f3f4f6;
  --gray-200: #e5e7eb;
  --gray-300: #d1d5db;
  --gray-400: #9ca3af;
  --gray-500: #6b7280;
  --gray-600: #4b5563;
  --gray-700: #374151;
  --gray-800: #1f2937;
  --gray-900: #111827;

  --radius-sm: 4px;
  --radius-md: 8px;
  --radius-lg: 12px;
  --radius-xl: 16px;

  --shadow-md: 0 4px 12px rgba(0,0,0,.10);
  --shadow-lg: 0 8px 24px rgba(0,0,0,.12);

  --transition: 150ms ease;
  --transition-md: 250ms ease;
}

/* ========== 容器 ========== */
.popup-app {
  width: 360px;
  max-height: 560px;
  display: flex;
  flex-direction: column;
  background: #fff;
  border-radius: var(--radius-xl);
  overflow: hidden;
  font-family: 'PingFang SC', 'Microsoft YaHei', -apple-system, sans-serif;
  user-select: none;
}

/* ========== Header 深色顶栏 ========== */
.popup-header {
  padding: 12px 14px;
  background: var(--gray-900);
  display: flex;
  align-items: center;
  gap: 10px;
  flex-shrink: 0;
}

.popup-header__logo {
  width: 26px;
  height: 26px;
  border-radius: 6px;
  background: linear-gradient(135deg, var(--primary-400), var(--primary-700));
  display: flex;
  align-items: center;
  justify-content: center;
  flex-shrink: 0;
  color: #fff;
}

.popup-header__title {
  font-size: 13px;
  font-weight: 600;
  color: #fff;
  flex: 1;
}

.popup-header__actions {
  display: flex;
  align-items: center;
  gap: 2px;
}

.popup-header__action {
  width: 28px;
  height: 28px;
  display: flex;
  align-items: center;
  justify-content: center;
  color: var(--gray-400);
  cursor: pointer;
  transition: color var(--transition), background var(--transition);
  border-radius: var(--radius-sm);
  border: none;
  background: transparent;
}
.popup-header__action:hover {
  color: #fff;
  background: rgba(255, 255, 255, 0.1);
}

/* ========== 搜索框 ========== */
.popup-search {
  display: flex;
  align-items: center;
  gap: 10px;
  margin: 10px 14px;
  padding: 10px 14px;
  background: var(--bg-surface);
  border: 1px solid var(--gray-200);
  border-radius: var(--radius-md);
  flex-shrink: 0;
  transition: box-shadow var(--transition-fast), border-color var(--transition-fast);
}

.popup-search:focus-within {
  border-color: var(--gray-400);
}

.popup-search__icon {
  font-size: 15px;
  color: var(--text-muted);
  flex-shrink: 0;
}

.popup-search__input {
  flex: 1;
  border: none;
  background: none;
  outline: none;
  font-size: 13px;
  color: var(--gray-800);
  font-family: inherit;
}
.popup-search__input:focus {
  outline: none;
  box-shadow: none;
}
.popup-search__input::placeholder { color: var(--text-muted); }

.popup-search__clear {
  font-size: 14px;
  padding: 2px;
  border-radius: var(--radius-sm);
  color: var(--text-muted);
  transition: color var(--transition-fast);
  flex-shrink: 0;
  background: none;
  border: none;
  cursor: pointer;
}
.popup-search__clear:hover { color: var(--gray-700); }

/* ========== Tab 栏 ========== */
.popup-tabs {
  display: flex;
  border-bottom: 1px solid var(--gray-200);
  padding: 0 14px;
  flex-shrink: 0;
}

.popup-tab {
  display: flex;
  align-items: center;
  gap: 4px;
  padding: 8px 10px;
  font-size: 12px;
  color: var(--gray-400);
  border-bottom: 2px solid transparent;
  transition: var(--transition);
  cursor: pointer;
  background: none;
  border-top: none;
  border-left: none;
  border-right: none;
  font-family: inherit;
}
.popup-tab:hover { color: var(--gray-600); }

.popup-tab__icon {
  flex-shrink: 0;
}

.popup-tab--active {
  color: var(--primary-600);
  border-color: var(--primary-600);
  font-weight: 500;
}

.popup-tab--active .popup-tab__icon {
  color: var(--primary-600);
}

/* ========== 列表区 ========== */
.popup-list {
  flex: 1;
  overflow-y: auto;
  max-height: 360px;
  /* 自定义滚动条 */
  scrollbar-width: thin;
  scrollbar-color: var(--gray-300) transparent;
}
.popup-list::-webkit-scrollbar { width: 4px; }
.popup-list::-webkit-scrollbar-track { background: transparent; }
.popup-list::-webkit-scrollbar-thumb {
  background: var(--gray-300);
  border-radius: 2px;
}

/* ========== 提示词列表（PromptCard 容器）========== */
.popup-list {
  flex: 1;
  overflow-y: auto;
  padding: 8px;
  display: flex;
  flex-direction: column;
  gap: 6px;
}

/* ========== Footer 底部栏 ========== */
.popup-footer {
  padding: 10px 14px;
  background: var(--gray-50);
  border-top: 1px solid var(--gray-200);
  display: flex;
  align-items: center;
  justify-content: space-between;
  flex-shrink: 0;
}

.popup-footer__link {
  font-size: 12px;
  color: var(--primary-600);
  cursor: pointer;
  transition: all var(--transition);
}
.popup-footer__link:hover {
  text-decoration: underline;
}

/* ========== 右键上下文菜单 ========== */
.ctx-menu {
  position: fixed;
  z-index: 9998;
  background: #fff;
  border: 1.5px solid var(--gray-200);
  border-radius: var(--radius-lg);
  box-shadow: var(--shadow-lg);
  padding: 4px;
  min-width: 160px;
  animation: ctxFadeIn 0.15s ease;
}

@keyframes ctxFadeIn {
  from { opacity: 0; transform: scale(0.96); }
  to { opacity: 1; transform: scale(1); }
}

.ctx-menu__item {
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 7px 12px;
  border-radius: var(--radius-md);
  font-size: 13px;
  color: var(--gray-700);
  cursor: pointer;
  transition: all var(--transition);
}
.ctx-menu__item:hover {
  background: var(--primary-50);
  color: var(--primary-700);
}

.ctx-menu__item--danger:hover {
  background: #fef2f2;
  color: #ef4444;
}

.ctx-menu__divider {
  height: 1px;
  background: var(--gray-100);
  margin: 4px 8px;
}
</style>

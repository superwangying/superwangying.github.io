<template>
  <div class="options-app">
    <template v-if="view === 'main'">
      <!-- Topbar -->
      <header class="topbar">
        <div class="topbar__left">
          <div class="topbar__logo logo-icon">
            <svg width="22" height="22" viewBox="0 0 22 22" fill="none">
              <rect x="2" y="2" width="18" height="3" rx="1.5" fill="white" opacity="0.9"/>
              <rect x="2" y="8" width="14" height="2.5" rx="1.25" fill="white" opacity="0.7"/>
              <rect x="2" y="13" width="16" height="2.5" rx="1.25" fill="white" opacity="0.7"/>
              <rect x="2" y="18" width="10" height="2.5" rx="1.25" fill="white" opacity="0.5"/>
            </svg>
          </div>
          <span class="topbar__title">提示词管理器</span>
        </div>

        <!-- 搜索框 + 历史 -->
        <div class="topbar__center">
          <div class="topbar__search">
            <IconRender icon="carbon:search" class="topbar__search-icon" />
            <input
              v-model="searchKeyword"
              class="topbar__search-input search-input"
              placeholder="搜索提示词..."
              @input="onSearch"
              @focus="onSearchFocus"
              @blur="onSearchBlur"
              @keydown.enter="onSearchSubmit"
              @keydown.esc="clearSearch"
            />
            <button v-if="searchKeyword" class="topbar__search-clear" @click="clearSearch">
              <IconRender icon="carbon:close" />
            </button>

            <!-- 搜索历史下拉 -->
            <Transition name="dropdown">
              <div
                v-if="showSearchHistory && searchHistoryList.length > 0 && !searchKeyword"
                class="search-history-dropdown"
              >
                <div class="search-history-header">
                  <span>搜索历史</span>
                  <button class="clear-history-btn" @click="search.clearHistory()">清空</button>
                </div>
                <button
                  v-for="h in searchHistoryList"
                  :key="h"
                  class="search-history-item"
                  @mousedown.prevent="useHistoryItem(h)"
                >
                  <IconRender icon="carbon:time" :size="14" />

                  <span>{{ h }}</span>
                </button>
              </div>
            </Transition>
          </div>
        </div>

        <div class="topbar__right">
          <button class="topbar__icon-btn" title="导入/导出" @click="showImportExport = true">
            <IconRender icon="carbon:import-export" />
          </button>
          <button class="topbar__icon-btn" title="设置" @click="view = 'settings'">
            <IconRender icon="carbon:settings" />
          </button>
        </div>
      </header>

      <!-- 主内容区 -->
      <div class="main-layout">
        <!-- 侧边栏 -->
        <aside class="sidebar">
          <nav class="sidebar__nav">
            <!-- 虚拟分类 -->
            <div
              v-for="vc in VIRTUAL_CATEGORIES"
              :key="vc.id"
              class="sidebar__item sidebar-item"
              :class="{ active: categoryStore.activeCategoryId === vc.id }"
              @click="onCategorySelect(vc.id)"
            >
              <IconRender :icon="vc.emoji" :size="15" class="sidebar__emoji" />
              <span class="sidebar__name truncate">{{ vc.name }}</span>
              <span class="sidebar__count">{{ getVirtualCount(vc.id) }}</span>
            </div>

            <div class="sidebar__divider"></div>

            <!-- 真实分类（树形，父 → 子两层）-->
            <draggable
              :list="rootCategoriesList"
              item-key="id"
              handle=".sidebar-item--drag"
              ghost-class="sidebar-ghost"
              chosen-class="sidebar-chosen"
              animation="200"
              @end="onRootDragEnd"
            >
              <template #item="{ element: cat }">
                <!-- 必须单一根元素：vuedraggable #item slot 限制 -->
                <div class="sidebar__category-group">
                  <!-- 父分类行 -->
                  <div
                    class="sidebar__item sidebar-item"
                    :class="{ active: categoryStore.activeCategoryId === cat.id }"
                    @click="onCategorySelect(cat.id)"
                    @contextmenu.prevent="openCatMenu($event, cat)"
                  >
                    <span class="sidebar-item--drag sidebar__drag-handle" title="拖拽排序">
                      <IconRender icon="carbon:draggable" :size="14" />
                    </span>
                    <!-- 折叠/展开按钮（有子分类时显示） -->
                    <button
                      v-if="getChildCategories(cat.id).length > 0"
                      class="sidebar__expand-btn"
                      :class="{ expanded: categoryStore.isExpanded(cat.id) }"
                      @click.stop="categoryStore.toggleExpand(cat.id)"
                    >
                      <IconRender icon="carbon:chevron-right" :size="12" />
                    </button>
                    <span v-else class="sidebar__expand-placeholder"></span>
                    <IconRender :icon="cat.emoji || 'feather:folder'" :size="15" class="sidebar__emoji" />
                    <span class="sidebar__name truncate">{{ cat.name }}</span>
                    <span v-if="getCategoryTotalCount(cat.id) > 0" class="sidebar__count">
                      {{ getCategoryTotalCount(cat.id) }}
                    </span>
                  </div>

                  <!-- 子分类展开区域（独立 draggable） -->
                  <Transition name="expand">
                    <div
                      v-if="categoryStore.isExpanded(cat.id) && getChildCategories(cat.id).length > 0"
                      class="sidebar__children"
                    >
                      <draggable
                        :list="getChildCategoriesRef(cat.id)"
                        item-key="id"
                        handle=".sidebar-item--drag-child"
                        ghost-class="sidebar-ghost"
                        chosen-class="sidebar-chosen"
                        animation="150"
                        group="children"
                        @end="onChildDragEnd(cat.id)"
                      >
                        <template #item="{ element: child }">
                          <div
                            class="sidebar__item sidebar-item sidebar-item--child"
                            :class="{ active: categoryStore.activeCategoryId === child.id }"
                            @click="onCategorySelect(child.id)"
                            @contextmenu.prevent="openCatMenu($event, child)"
                          >
                            <span class="sidebar-item--drag-child sidebar__drag-handle-child" title="拖拽排序">
                              <IconRender icon="carbon:draggable" :size="12" />
                            </span>
                            <IconRender :icon="child.emoji || 'feather:folder'" :size="13" class="sidebar__emoji" />
                            <span class="sidebar__name truncate">{{ child.name }}</span>
                            <span v-if="promptStore.countByCategory[child.id]" class="sidebar__count">
                              {{ promptStore.countByCategory[child.id] }}
                            </span>
                          </div>
                        </template>
                      </draggable>
                    </div>
                  </Transition>
                </div>
              </template>
            </draggable>
          </nav>

        <div class="sidebar__footer">
          <button class="sidebar__add-btn" @click="openCategoryDialog()">
              <IconRender icon="carbon:add" :size="16" />
              <span>新建分类</span>
            </button>
        </div>
        </aside>

        <!-- 中部：提示词列表 -->
        <main class="content-area">
          <!-- 操作栏 -->
          <div class="content-toolbar">
            <!-- 批量选择模式 -->
            <template v-if="selectedCount > 0">
              <div class="batch-bar">
                <div class="batch-bar__left">
                  <button class="batch-bar__close" @click="exitSelectionMode">
                    <IconRender icon="carbon:close" />
                  </button>
                  <span class="batch-bar__count">已选择 <strong>{{ selectedCount }}</strong> 项</span>
                </div>
                <div class="batch-bar__actions">
                  <button class="batch-btn" title="收藏" @click="batchToggleFavorite(true)">
                    <IconRender icon="carbon:star" />
                  </button>
                  <button class="batch-btn" title="取消收藏" @click="batchToggleFavorite(false)">
                    <IconRender icon="carbon:star-filled" />
                  </button>
                  <div class="batch-btn-wrap">
                    <button class="batch-btn" title="移动到分类" @click="showBatchMoveMenu = !showBatchMoveMenu">
                      <IconRender icon="carbon:folder-move" />
                    </button>
                    <div v-if="showBatchMoveMenu" class="batch-move-menu">
                      <button
                        v-for="cat in categoryStore.categories"
                        :key="cat.id"
                        class="batch-move-menu__item"
                        @click="batchMove(cat.id); showBatchMoveMenu = false"
                      >
                        <IconRender :icon="cat.emoji || 'feather:folder'" :size="14" /> {{ cat.name }}
                      </button>
                      <button
                        v-if="selectedCount > 0"
                        class="batch-move-menu__item batch-move-menu__item--danger"
                        @click="batchDelete(); showBatchMoveMenu = false"
                      >
                        <IconRender icon="carbon:trash-can" :size="14" /> 删除所选
                      </button>
                    </div>
                  </div>
                  <button class="batch-btn batch-btn--danger" title="删除" @click="batchDelete">
                    <IconRender icon="carbon:trash-can" />
                  </button>
                </div>
              </div>
            </template>

            <!-- 正常模式 -->
            <template v-else>
              <span class="content-toolbar__count">
                <template v-if="searchKeyword">
                  找到 <strong>{{ promptStore.filteredPrompts.length }}</strong> 条结果
                </template>
                <template v-else>
                  {{ promptStore.filteredPrompts.length }} 条提示词
                </template>
              </span>
              <div class="content-toolbar__actions">
                <button class="icon-btn" title="全选" @click="toggleSelectAll">
                  <IconRender icon="carbon:checkbox-checked" :class="{ 'icon-active': isAllSelected }" />
                </button>

                <!-- 排序下拉 -->
                <div class="sort-dropdown-wrap">
                  <button class="icon-btn" title="排序" @click="showSortMenu = !showSortMenu">
                    <IconRender icon="carbon:sort" :class="{ 'rotate-180': promptStore.sortDirection === 'asc' }" />
                  </button>
                  <Transition name="dropdown">
                    <div v-if="showSortMenu" class="sort-dropdown-menu">
                      <button
                        v-for="opt in sortOptions"
                        :key="opt.value"
                        class="sort-dropdown-item"
                        :class="{ active: promptStore.sortField === opt.value }"
                        @click="onSortSelect(opt.value)"
                      >
                        <IconRender :icon="opt.icon" :size="14" />
                        <span>{{ opt.label }}</span>
                        <IconRender
                          v-if="promptStore.sortField === opt.value"
                          :icon="promptStore.sortDirection === 'asc' ? 'carbon:sort-ascending' : 'carbon:sort-descending'"
                          :size="13"
                          class="sort-indicator"
                        />
                      </button>
                    </div>
                  </Transition>
                </div>

                <button class="icon-btn" title="刷新" @click="reloadData">
                  <IconRender icon="carbon:renew" />
                </button>

                <!-- 视图切换 -->
                <div class="view-toggle">
                  <button
                    class="icon-btn"
                    :class="{ 'icon-active': settingStore.viewMode === 'card' }"
                    title="卡片视图"
                    @click="settingStore.setViewMode('card')"
                  >
                    <IconRender icon="carbon:grid" />
                  </button>
                  <button
                    class="icon-btn"
                    :class="{ 'icon-active': settingStore.viewMode === 'list' }"
                    title="列表视图"
                    @click="settingStore.setViewMode('list')"
                  >
                    <IconRender icon="carbon:list" />
                  </button>
                </div>

                <button class="btn-primary magnetic-btn" @click="openPromptEditor()">
                  <IconRender icon="carbon:add" />
                  新建提示词
                </button>
              </div>
            </template>
          </div>

          <!-- 标签筛选栏 -->
          <div v-if="promptStore.allTags.length > 0" class="tag-filter-bar">
            <div class="tag-filter-bar__scroll">
              <span class="tag-filter-bar__label">
                <IconRender icon="carbon:tag" :size="13" />
                标签
              </span>
              <button
                v-for="t in promptStore.allTags.slice(0, 20)"
                :key="t.tag"
                class="tag-filter-chip"
                :class="{ active: promptStore.selectedTags.includes(t.tag) }"
                @click="promptStore.toggleTag(t.tag)"
              >
                {{ t.tag }}
                <span class="tag-filter-chip__count">{{ t.count }}</span>
              </button>
              <button
                v-if="promptStore.selectedTags.length > 0"
                class="tag-filter-clear"
                @click="promptStore.clearTags()"
              >
                <IconRender icon="carbon:close" :size="12" />
                清除筛选
              </button>
            </div>
          </div>

          <!-- 提示词列表 -->
          <div class="prompt-list" :class="{ 'prompt-list--list': settingStore.viewMode === 'list' }">
            <template v-if="promptStore.filteredPrompts.length > 0">
              <PromptCard
                v-for="p in promptStore.filteredPrompts"
                :key="p.id"
                :prompt="p"
                :search-query="searchKeyword"
                :selected="selectedPromptIds.has(p.id)"
                :list-mode="settingStore.viewMode === 'list'"
                :categories="categoryStore.categories.map(c => ({ id: c.id, name: c.name, emoji: c.emoji || 'feather:folder' }))"
                @copy="copyPrompt"
                @edit="openPromptEditor"
                @delete="confirmDelete"
                @toggle-favorite="promptStore.toggleFavorite"
                @move="onPromptMove"
                @select="onPromptSelect"
              />
            </template>
            <EmptyState
              v-else-if="!searchKeyword && !isFiltered"
              type="prompts"
              title="还没有提示词"
              description="点击右上角「新建提示词」，开始添加你的第一个提示词吧"
            >
              <template #action>
                <button class="btn-primary magnetic-btn" @click="openPromptEditor()">
                  <IconRender icon="carbon:add" />
                  新建提示词
                </button>
              </template>
            </EmptyState>
            <EmptyState
              v-else-if="searchKeyword"
              type="search"
              title="没有找到结果"
              description="换个关键词试试，或者检查一下拼写"
            />
            <EmptyState
              v-else
              type="general"
              title="该分类下还没有提示词"
              description="新建一条提示词试试"
            >
              <template #action>
                <button class="btn-primary magnetic-btn" @click="openPromptEditor()">
                  <IconRender icon="carbon:add" />
                  新建提示词
                </button>
              </template>
            </EmptyState>
          </div>
        </main>
      </div>
    </template>

    <!-- 设置视图 -->
    <OptionsView
      v-else-if="view === 'settings'"
      @back="view = 'main'"
      @stats="view = 'stats'"
    />

    <!-- 统计视图 -->
    <StatsView v-else-if="view === 'stats'" @back="view = 'settings'" />

    <!-- 全局组件 -->
    <ToastNotify />

    <!-- 提示词编辑器 -->
    <PromptEditor
      v-model="showPromptEditor"
      :prompt="editingPrompt"
      @saved="onPromptSaved"
    />

    <!-- 分类管理弹窗 -->
    <CategoryDialog
      v-model="showCategoryDialog"
      :category="editingCategory"
      :default-parent-id="newCategoryParentId"
      @saved="onCategorySaved"
    />

    <!-- 导入导出 -->
    <ImportExport v-model="showImportExport" />

    <!-- 删除提示词确认 -->
    <ConfirmDialog
      v-model="showDeleteDialog"
      type="danger"
      title="删除提示词"
      :message="`确定要删除「${deleteTarget?.title}」吗？此操作不可恢复。`"
      confirm-text="删除"
      cancel-text="取消"
      @confirm="doDelete"
    />

    <!-- 删除分类确认 -->
    <ConfirmDialog
      v-model="showDeleteCatDialog"
      type="danger"
      title="删除分类"
      :message="`确定要删除分类「${deleteCatTarget?.name}」吗？该分类下的提示词不会被删除，但会变为「未分类」。`"
      confirm-text="删除分类"
      cancel-text="取消"
      @confirm="doDeleteCategory"
    />

    <!-- 右键分类菜单 -->
    <div
      v-if="catMenu.show"
      class="cat-context-menu"
      :style="{ top: catMenu.y + 'px', left: catMenu.x + 'px' }"
      @click.stop
    >
      <button class="cat-context-menu__item" @click="openCategoryDialog(catMenu.category!)">
        <IconRender icon="carbon:edit" /> 编辑分类
      </button>
      <!-- 只有顶级分类才能新建子分类 -->
      <button
        v-if="catMenu.category && !catMenu.category.parentId"
        class="cat-context-menu__item"
        @click="openCategoryDialogAsChild(catMenu.category!)"
      >
        <IconRender icon="carbon:folder-add" /> 新建子分类
      </button>
      <button class="cat-context-menu__item cat-context-menu__item--danger" @click="confirmDeleteCategory(catMenu.category!)">
        <IconRender icon="carbon:trash-can" /> 删除分类
      </button>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted, onUnmounted } from 'vue'
import draggable from 'vuedraggable'
import PromptCard from '@/components/PromptCard.vue'
import PromptEditor from '@/components/PromptEditor.vue'
import CategoryDialog from '@/components/CategoryDialog.vue'
import ImportExport from '@/components/ImportExport.vue'
import EmptyState from '@/components/EmptyState.vue'
import ConfirmDialog from '@/components/ConfirmDialog.vue'
import ToastNotify from '@/components/ToastNotify.vue'
import OptionsView from '@/views/OptionsView.vue'
import StatsView from '@/components/StatsView.vue'
import { usePromptStore } from '@/stores/promptStore'
import { useCategoryStore } from '@/stores/categoryStore'
import { useSettingStore } from '@/stores/settingStore'
import { useToast } from '@/composables/useToast'
import { useSearch } from '@/composables/useSearch'
import { VIRTUAL_CATEGORY } from '@/types'
import type { Prompt, Category } from '@/types'

const promptStore = usePromptStore()
const categoryStore = useCategoryStore()
const settingStore = useSettingStore()
const toast = useToast()
const search = useSearch()
const searchHistoryList = computed(() => search.searchHistory.value)

// ===== 视图切换 =====
const view = ref<'main' | 'settings' | 'stats'>('main')

// ===== 导入导出弹窗 =====
const showImportExport = ref(false)

// ===== 搜索 =====
const searchKeyword = ref('')
const searchFocused = ref(false)
const showSearchHistory = ref(false)

function onSearchFocus() {
  searchFocused.value = true
  if (!searchKeyword.value) {
    showSearchHistory.value = true
  }
}

function onSearchBlur() {
  searchFocused.value = false
  // 延迟关闭，允许点击历史项
  setTimeout(() => { showSearchHistory.value = false }, 200)
}

function onSearch() {
  showSearchHistory.value = false
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
  if (searchKeyword.value.trim()) {
    search.addToHistory(searchKeyword.value)
    showSearchHistory.value = false
  }
}

function useHistoryItem(q: string) {
  searchKeyword.value = q
  searchFocused.value = false
  showSearchHistory.value = false
  promptStore.setSearchKeyword(q)
  const ids = search.search(q)
  promptStore.setSearchResults(ids)
}

function clearSearch() {
  searchKeyword.value = ''
  showSearchHistory.value = false
  promptStore.setSearchKeyword('')
  promptStore.setSearchResults([])
}

// ===== 排序 =====
const showSortMenu = ref(false)

const sortOptions = [
  { value: 'updatedAt' as const, label: '最近更新', icon: 'carbon:time' },
  { value: 'usageCount' as const, label: '使用频率', icon: 'carbon:chart-bar' },
  { value: 'createdAt' as const, label: '创建时间', icon: 'carbon:add' },
  { value: 'title' as const, label: '标题字母', icon: 'carbon:text-creation' },
]

function onSortSelect(field: typeof sortOptions[number]['value']) {
  promptStore.setSortField(field)
  showSortMenu.value = false
}

// 点击空白区域关闭排序菜单
function closeSortMenu() {
  showSortMenu.value = false
}

// ===== 批量选择 =====
const selectedPromptIds = ref<Set<string>>(new Set())
const showBatchMoveMenu = ref(false)

const isAllSelected = computed(() => {
  const prompts = promptStore.filteredPrompts
  return prompts.length > 0 && prompts.every((p) => selectedPromptIds.value.has(p.id))
})

const selectedCount = computed(() => selectedPromptIds.value.size)

function toggleSelectAll() {
  if (isAllSelected.value) {
    selectedPromptIds.value = new Set()
  } else {
    selectedPromptIds.value = new Set(promptStore.filteredPrompts.map((p) => p.id))
  }
}

function onPromptSelect(id: string, checked: boolean) {
  if (checked) {
    selectedPromptIds.value = new Set([...selectedPromptIds.value, id])
  } else {
    const next = new Set(selectedPromptIds.value)
    next.delete(id)
    selectedPromptIds.value = next
  }
}

function exitSelectionMode() {
  selectedPromptIds.value = new Set()
}

// ===== 批量操作 =====
async function batchDelete() {
  const ids = [...selectedPromptIds.value]
  if (!confirm(`确定要删除选中的 ${ids.length} 条提示词吗？此操作不可恢复。`)) return
  for (const id of ids) {
    search.removeFromIndex(id)
    await promptStore.deletePrompt(id)
  }
  toast.success(`已删除 ${ids.length} 条提示词`)
  selectedPromptIds.value = new Set()
}

async function batchMove(categoryId: string | null) {
  const ids = [...selectedPromptIds.value]
  for (const id of ids) {
    await promptStore.updatePrompt(id, { categoryId })
  }
  toast.success(`已移动 ${ids.length} 条提示词`)
  selectedPromptIds.value = new Set()
}

async function batchToggleFavorite(fav: boolean) {
  const ids = [...selectedPromptIds.value]
  for (const id of ids) {
    const prompt = promptStore.prompts.find((p) => p.id === id)
    if (prompt && prompt.isFavorite !== fav) {
      await promptStore.toggleFavorite(id)
    }
  }
  toast.success(`已${fav ? '收藏' : '取消收藏'} ${ids.length} 条提示词`)
  selectedPromptIds.value = new Set()
}

// ===== 分类切换 =====
const VIRTUAL_CATEGORIES = [
  { id: VIRTUAL_CATEGORY.ALL,      name: '全部',     emoji: 'feather:grid' },
  { id: VIRTUAL_CATEGORY.FAVORITES, name: '收藏', emoji: 'feather:star' },
]

function getVirtualCount(id: string) {
  if (id === VIRTUAL_CATEGORY.ALL) return promptStore.prompts.length
  if (id === VIRTUAL_CATEGORY.FAVORITES) return promptStore.prompts.filter(p => p.isFavorite).length
  return 0
}

/** 获取某顶级分类的所有直接子分类（按 sortOrder 排序） */
function getChildCategories(parentId: string) {
  return categoryStore.categories
    .filter(c => c.parentId === parentId)
    .sort((a, b) => a.sortOrder - b.sortOrder)
}

/**
 * 父分类计数 = 自身提示词数 + 所有子分类提示词数之和
 * 子分类只显示自身数量
 */
function getCategoryTotalCount(catId: string): number {
  const direct = promptStore.countByCategory[catId] ?? 0
  const children = getChildCategories(catId)
  const childSum = children.reduce((sum, c) => sum + (promptStore.countByCategory[c.id] ?? 0), 0)
  return direct + childSum
}

function onCategorySelect(id: string) {
  categoryStore.setActiveCategory(id)
  promptStore.setActiveCategory(id)
  // 切换分类时清空搜索
  if (searchKeyword.value) clearSearch()
}

// ===== 拖拽排序 =====
/** 顶级分类列表（仅用于 draggable 的 :list 绑定） */
const rootCategoriesList = computed<Category[]>(() =>
  categoryStore.categories.filter(c => !c.parentId).sort((a, b) => a.sortOrder - b.sortOrder)
)

/** 获取某父分类下的子分类列表引用（用于子 draggable 的 :list 绑定） */
function getChildCategoriesRef(parentId: string): Category[] {
  return categoryStore.categories
    .filter(c => c.parentId === parentId)
    .sort((a, b) => a.sortOrder - b.sortOrder)
}

/** 顶级分类拖拽结束 → 持久化排序 */
async function onRootDragEnd() {
  const ids = rootCategoriesList.value.map(c => c.id)
  await categoryStore.reorderCategories(ids)
  toast.info('分类顺序已保存')
}

/** 子分类拖拽结束 → 只更新该父分类下的子分类排序 */
async function onChildDragEnd(parentId: string) {
  const childIds = getChildCategoriesRef(parentId).map(c => c.id)
  await categoryStore.reorderChildCategories(parentId, childIds)
  toast.info('子分类顺序已保存')
}

const isFiltered = computed(() => {
  return categoryStore.activeCategoryId !== VIRTUAL_CATEGORY.ALL
})

// ===== 提示词编辑器 =====
const showPromptEditor = ref(false)
const editingPrompt = ref<Prompt | null>(null)

function openPromptEditor(prompt?: Prompt) {
  editingPrompt.value = prompt ?? null
  showPromptEditor.value = true
}

async function onPromptSaved(prompt: Prompt) {
  const isEditing = editingPrompt.value !== null
  editingPrompt.value = null
  toast.success(isEditing ? '更新成功' : '创建成功')
  // 增量更新搜索索引
  if (isEditing) {
    search.updateInIndex(prompt)
  } else {
    search.addToIndex(prompt)
  }
}

// ===== 分类弹窗 =====
const showCategoryDialog = ref(false)
const editingCategory = ref<Category | null>(null)
const newCategoryParentId = ref<string | null>(null)

function openCategoryDialog(category?: Category) {
  editingCategory.value = category ?? null
  newCategoryParentId.value = null
  showCategoryDialog.value = true
  closeCatMenu()
}

/** 新建子分类（预填父分类 ID） */
function openCategoryDialogAsChild(parentCat: Category) {
  editingCategory.value = null
  newCategoryParentId.value = parentCat.id
  showCategoryDialog.value = true
  closeCatMenu()
}

async function onCategorySaved() {
  toast.success(editingCategory.value ? '分类已更新' : '分类已创建')
  editingCategory.value = null
  newCategoryParentId.value = null
}

// ===== 删除提示词 =====
const showDeleteDialog = ref(false)
const deleteTarget = ref<Prompt | null>(null)

function confirmDelete(prompt: Prompt) {
  deleteTarget.value = prompt
  showDeleteDialog.value = true
}

async function doDelete() {
  if (deleteTarget.value) {
    search.removeFromIndex(deleteTarget.value.id)
    await promptStore.deletePrompt(deleteTarget.value.id)
    toast.success('删除成功')
    deleteTarget.value = null
  }
}

// ===== 删除分类 =====
const showDeleteCatDialog = ref(false)
const deleteCatTarget = ref<Category | null>(null)

function confirmDeleteCategory(cat: Category) {
  closeCatMenu()
  deleteCatTarget.value = cat
  showDeleteCatDialog.value = true
}

async function doDeleteCategory() {
  if (deleteCatTarget.value) {
    await categoryStore.deleteCategory(deleteCatTarget.value.id)
    if (categoryStore.activeCategoryId === deleteCatTarget.value.id) {
      categoryStore.setActiveCategory(VIRTUAL_CATEGORY.ALL)
      promptStore.setActiveCategory(VIRTUAL_CATEGORY.ALL)
    }
    toast.success('分类已删除')
    deleteCatTarget.value = null
  }
}

// ===== 右键分类菜单 =====
const catMenu = ref({ show: false, x: 0, y: 0, category: null as Category | null })

function openCatMenu(e: MouseEvent, cat: Category) {
  catMenu.value = { show: true, x: e.clientX, y: e.clientY, category: cat }
}

function closeCatMenu() {
  catMenu.value.show = false
}

// ===== 移动分类 =====
async function onPromptMove(id: string, categoryId: string | null) {
  await promptStore.updatePrompt(id, { categoryId })
  toast.success('已移动到分类')
}

// ===== 复制 =====
async function copyPrompt(p: Prompt) {
  try {
    await navigator.clipboard.writeText(p.content)
    await promptStore.incrementUsageCount(p.id)
    toast.success('已复制到剪贴板')
  } catch {
    toast.error('复制失败，请手动复制')
  }
}

// ===== 刷新数据 =====
async function reloadData() {
  await promptStore.loadPrompts()
  search.buildIndex(promptStore.prompts)
  toast.info('已刷新')
}

// ===== 初始化 =====
onMounted(async () => {
  await settingStore.init()
  await categoryStore.loadCategories()
  await promptStore.loadPrompts()
  search.buildIndex(promptStore.prompts)
  document.addEventListener('click', closeCatMenu)
  document.addEventListener('click', closeSortMenu)
})

onUnmounted(() => {
  document.removeEventListener('click', closeCatMenu)
  document.removeEventListener('click', closeSortMenu)
})
</script>

<style scoped>
/* ---- Topbar ---- */
.topbar {
  height: var(--topbar-height);
  display: flex;
  align-items: center;
  gap: 16px;
  padding: 0 20px;
  background: var(--bg-topbar);
  border-bottom: 1px solid var(--border-color);
  flex-shrink: 0;
  position: sticky;
  top: 0;
  z-index: 100;
}

.topbar__left {
  display: flex;
  align-items: center;
  gap: 10px;
  flex-shrink: 0;
}

.topbar__logo {
  width: 36px;
  height: 36px;
  display: flex;
  align-items: center;
  justify-content: center;
}

.topbar__title {
  font-size: var(--text-lg);
  font-weight: 600;
  color: var(--text-primary);
}

.topbar__center {
  flex: 1;
  max-width: 480px;
  position: relative;
}

.topbar__search {
  display: flex;
  align-items: center;
  gap: 10px;
  background: var(--bg-surface);
  border: 1px solid var(--gray-200);
  border-radius: var(--radius-md);
  padding: 10px 16px;
  position: relative;
  transition: box-shadow var(--transition-fast), border-color var(--transition-fast);
}

.topbar__search:focus-within {
  border-color: var(--gray-400);
}

.topbar__search-icon {
  color: var(--text-muted);
  font-size: 16px;
  flex-shrink: 0;
}

.topbar__search-input {
  flex: 1;
  font-size: var(--text-sm);
  color: var(--text-primary);
  background: transparent;
  border: none;
  outline: none;
}

.topbar__search-input:focus {
  outline: none;
  box-shadow: none;
}

.topbar__search-input::placeholder { color: var(--text-muted); }

.topbar__search-clear {
  color: var(--text-muted);
  font-size: 14px;
  padding: 2px;
  border-radius: var(--radius-sm);
  transition: color var(--transition-fast);
  background: none;
  border: none;
  cursor: pointer;
}
.topbar__search-clear:hover { color: var(--text-primary); }

/* 搜索历史下拉 */
.search-history-dropdown {
  position: absolute;
  top: calc(100% + 6px);
  left: 0;
  right: 0;
  background: var(--bg-surface);
  border: 1px solid var(--border-color);
  border-radius: var(--radius-md);
  box-shadow: var(--shadow-lg);
  z-index: 1000;
  overflow: hidden;
}

.search-history-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 8px 14px 4px;
  font-size: 11px;
  color: var(--text-muted);
  text-transform: uppercase;
  letter-spacing: 0.5px;
}

.clear-history-btn {
  font-size: 11px;
  color: var(--primary-600);
  transition: color var(--transition-fast);
}
.clear-history-btn:hover { color: var(--primary-700); }

.search-history-item {
  display: flex;
  align-items: center;
  gap: 8px;
  width: 100%;
  padding: 7px 14px;
  font-size: var(--text-sm);
  color: var(--text-secondary);
  text-align: left;
  transition: background var(--transition-fast), color var(--transition-fast);
}

.search-history-item:hover {
  background: var(--gray-100);
  color: var(--text-primary);
}

.search-history-item i { font-size: 14px; color: var(--text-muted); }

/* 下拉动画 */
.dropdown-enter-active, .dropdown-leave-active {
  transition: opacity 0.15s ease, transform 0.15s ease;
}
.dropdown-enter-from, .dropdown-leave-to {
  opacity: 0;
  transform: translateY(-6px);
}

.topbar__right {
  display: flex;
  align-items: center;
  gap: 10px;
  margin-left: auto;
}

.topbar__icon-btn {
  width: 34px;
  height: 34px;
  display: flex;
  align-items: center;
  justify-content: center;
  border-radius: var(--radius-md);
  color: var(--text-secondary);
  font-size: 18px;
  transition: background var(--transition-fast), color var(--transition-fast);
}
.topbar__icon-btn:hover { background: var(--gray-100); color: var(--text-primary); }

/* ---- Main Layout ---- */
.main-layout {
  display: flex;
  flex: 1;
  overflow: hidden;
}

/* ---- Sidebar ---- */
.sidebar {
  width: var(--sidebar-width);
  background: var(--bg-sidebar);
  border-right: 1px solid var(--border-color);
  display: flex;
  flex-direction: column;
  flex-shrink: 0;
  overflow-y: auto;
}

.sidebar__nav {
  flex: 1;
  padding: 12px 10px;
  display: flex;
  flex-direction: column;
  gap: 2px;
}

.sidebar__item {
  display: flex;
  align-items: center;
  gap: 10px;
  padding: 9px 12px;
  border-radius: var(--radius-md);
  cursor: pointer;
  transition: background var(--transition-fast), color var(--transition-fast);
  font-size: var(--text-sm);
  color: var(--text-secondary);
  user-select: none;
}

.sidebar__item:hover {
  background: var(--gray-100);
  color: var(--text-primary);
}

.sidebar__emoji {
  font-size: 15px;
  flex-shrink: 0;
  line-height: 1;
}

.sidebar__name { flex: 1; }

.sidebar__count {
  font-size: 11px;
  background: var(--gray-100);
  color: var(--text-muted);
  padding: 2px 7px;
  border-radius: var(--radius-full);
  min-width: 22px;
  text-align: center;
}

.sidebar__divider {
  height: 1px;
  background: var(--border-color);
  margin: 8px 0;
}

/* 拖拽分组容器：每个顶级分类及其子分类作为一个整体 */
.sidebar__category-group {
  display: flex;
  flex-direction: column;
  gap: 2px;
}

.sidebar__footer {
  padding: 12px 10px;
  border-top: 1px solid var(--border-color);
}

.sidebar__add-btn {
  display: flex;
  align-items: center;
  gap: 6px;
  width: 100%;
  padding: 8px 12px;
  border-radius: var(--radius-md);
  font-size: var(--text-sm);
  color: var(--primary-600);
  transition: background var(--transition-fast);
}
.sidebar__add-btn:hover {
  background: var(--primary-50);
}

/* ---- 拖拽排序 ---- */
.sidebar-item--drag {
  cursor: grab;
  opacity: 0.25;
  transition: opacity var(--transition-fast), transform var(--transition-fast);
  flex-shrink: 0;
  color: var(--text-muted);
  font-size: 14px;
}

.sidebar__item:hover .sidebar-item--drag {
  opacity: 0.7;
}

.sidebar__item:hover .sidebar-item--drag:hover {
  opacity: 1;
  transform: scale(1.1);
}

.sidebar-item--drag:active {
  cursor: grabbing;
  opacity: 1 !important;
}

.sidebar__drag-handle {
  display: flex;
  align-items: center;
}

/* 子分类拖拽 handle */
.sidebar-item--drag-child {
  cursor: grab;
  opacity: 0;
  transition: opacity var(--transition-fast), transform var(--transition-fast);
  flex-shrink: 0;
  color: var(--text-muted);
  font-size: 12px;
}

.sidebar__item.sidebar-item--child:hover .sidebar-item--drag-child {
  opacity: 0.6;
}

.sidebar__item.sidebar-item--child:hover .sidebar-item--drag-child:hover {
  opacity: 1;
  transform: scale(1.1);
}

.sidebar-item--drag-child:active {
  cursor: grabbing;
  opacity: 1 !important;
}

.sidebar__drag-handle-child {
  display: flex;
  align-items: center;
}

.sidebar-ghost {
  opacity: 0.4;
  background: var(--primary-50);
  border-radius: var(--radius-md);
}

.sidebar-chosen {
  background: var(--gray-50);
  box-shadow: var(--shadow-md);
}

.content-area {
  flex: 1;
  display: flex;
  flex-direction: column;
  overflow: hidden;
  background: var(--bg-app);
}

.content-toolbar {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 14px 20px;
  border-bottom: 1px solid var(--border-color);
  flex-shrink: 0;
  background: var(--bg-surface);
}

.content-toolbar__count {
  font-size: var(--text-sm);
  color: var(--text-secondary);
}

.content-toolbar__actions {
  display: flex;
  align-items: center;
  gap: 8px;
}

/* ---- Prompt List ---- */
.prompt-list {
  flex: 1;
  overflow-y: auto;
  padding: 16px 20px;
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(320px, 1fr));
  gap: 12px;
  align-content: start;
}

/* ---- Buttons ---- */
.btn-primary {
  display: inline-flex;
  align-items: center;
  gap: 6px;
  padding: 8px 16px;
  background: var(--primary-600);
  color: #fff;
  border-radius: var(--radius-md);
  font-size: var(--text-sm);
  font-weight: 500;
  box-shadow: var(--shadow-sm);
  transition: all var(--transition-base);
}
.btn-primary:hover { background: var(--primary-700); }

.icon-btn {
  width: 32px;
  height: 32px;
  display: flex;
  align-items: center;
  justify-content: center;
  border-radius: var(--radius-md);
  font-size: 17px;
  color: var(--text-secondary);
  transition: background var(--transition-fast), color var(--transition-fast);
}
.icon-btn:hover { background: var(--gray-100); color: var(--text-primary); }

.rotate-180 { transform: rotate(180deg); transition: transform var(--transition-base); }

/* ---- 排序下拉 ---- */
.sort-dropdown-wrap {
  position: relative;
}

.sort-dropdown-menu {
  position: absolute;
  top: calc(100% + 6px);
  right: 0;
  background: var(--bg-surface);
  border: 1px solid var(--border-color);
  border-radius: var(--radius-md);
  box-shadow: var(--shadow-lg);
  z-index: 1000;
  padding: 4px;
  min-width: 160px;
}

.sort-dropdown-item {
  display: flex;
  align-items: center;
  gap: 8px;
  width: 100%;
  padding: 8px 12px;
  border-radius: var(--radius-sm);
  font-size: var(--text-sm);
  color: var(--text-secondary);
  text-align: left;
  transition: background var(--transition-fast), color var(--transition-fast);
}

.sort-dropdown-item:hover {
  background: var(--gray-100);
  color: var(--text-primary);
}

.sort-dropdown-item.active {
  background: var(--primary-50);
  color: var(--primary-600);
}

[data-theme='dark'] .sort-dropdown-item.active {
  background: rgba(99, 102, 241, 0.1);
}

.sort-indicator {
  margin-left: auto;
  color: var(--primary-500);
}

/* ---- 视图切换 ---- */
.view-toggle {
  display: flex;
  align-items: center;
  background: var(--gray-100);
  border-radius: var(--radius-md);
  padding: 2px;
  gap: 1px;
}

.view-toggle .icon-btn {
  width: 28px;
  height: 28px;
  font-size: 15px;
  border-radius: var(--radius-sm);
}

.view-toggle .icon-btn.icon-active {
  background: var(--bg-surface);
  color: var(--primary-600);
  box-shadow: var(--shadow-sm);
}

/* ---- 列表视图布局 ---- */
.prompt-list--list {
  grid-template-columns: 1fr !important;
  gap: 6px !important;
  padding: 12px 20px;
}

.prompt-list--list :deep(.prompt-card) {
  border-radius: var(--radius-md);
  padding: 12px 16px;
  display: flex;
  align-items: center;
  gap: 16px;
}

.prompt-list--list :deep(.prompt-card:hover) {
  transform: none;
}

.prompt-list--list :deep(.prompt-card__main) {
  flex: 1;
  display: flex;
  align-items: center;
  gap: 20px;
  min-width: 0;
}

.prompt-list--list :deep(.prompt-card__header) {
  flex-shrink: 0;
  margin-bottom: 0;
  min-width: 200px;
}

.prompt-list--list :deep(.prompt-card__title) {
  font-size: var(--text-sm);
  white-space: nowrap;
}

.prompt-list--list :deep(.prompt-card__content) {
  flex: 1;
  min-width: 0;
  margin-bottom: 0;
  -webkit-line-clamp: 1;
}

.prompt-list--list :deep(.prompt-card__footer) {
  flex-shrink: 0;
}

.prompt-list--list :deep(.prompt-card__checkbox) {
  top: 50%;
  transform: translateY(-50%);
}

/* ---- Context Menu ---- */
.cat-context-menu {
  position: fixed;
  background: var(--bg-surface);
  border: 1px solid var(--border-color);
  border-radius: var(--radius-md);
  box-shadow: var(--shadow-lg);
  z-index: 99999;
  padding: 4px;
  min-width: 160px;
}

.cat-context-menu__item {
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
}
.cat-context-menu__item:hover { background: var(--gray-100); }
.cat-context-menu__item i { font-size: 16px; color: var(--text-secondary); }
.cat-context-menu__item--danger:hover { background: rgba(239, 68, 68, 0.1); color: var(--color-error); }
.cat-context-menu__item--danger:hover i { color: var(--color-error); }

/* ---- 批量操作栏 ---- */
.batch-bar {
  display: flex;
  align-items: center;
  justify-content: space-between;
  width: 100%;
  gap: 12px;
}

.batch-bar__left {
  display: flex;
  align-items: center;
  gap: 10px;
}

.batch-bar__close {
  width: 28px;
  height: 28px;
  border-radius: var(--radius-sm);
  display: flex;
  align-items: center;
  justify-content: center;
  color: var(--text-secondary);
  transition: all var(--transition-fast);
}
.batch-bar__close:hover { background: var(--gray-100); color: var(--text-primary); }
.batch-bar__close i { font-size: 16px; }

.batch-bar__count {
  font-size: var(--text-sm);
  color: var(--text-secondary);
}
.batch-bar__count strong { color: var(--primary-600); }

.batch-bar__actions {
  display: flex;
  align-items: center;
  gap: 4px;
}

.batch-btn-wrap {
  position: relative;
}

.batch-btn {
  width: 32px;
  height: 32px;
  display: flex;
  align-items: center;
  justify-content: center;
  border-radius: var(--radius-md);
  font-size: 16px;
  color: var(--text-secondary);
  transition: all var(--transition-fast);
}
.batch-btn:hover { background: var(--gray-100); color: var(--text-primary); }
.batch-btn--danger:hover { background: rgba(239, 68, 68, 0.1); color: var(--color-error); }

.batch-move-menu {
  position: absolute;
  top: calc(100% + 6px);
  right: 0;
  background: var(--bg-surface);
  border: 1px solid var(--border-color);
  border-radius: var(--radius-md);
  box-shadow: var(--shadow-lg);
  z-index: 1000;
  padding: 4px;
  min-width: 160px;
}

.batch-move-menu__item {
  display: flex;
  align-items: center;
  gap: 8px;
  width: 100%;
  padding: 7px 12px;
  border-radius: var(--radius-sm);
  font-size: var(--text-sm);
  color: var(--text-primary);
  text-align: left;
  transition: background var(--transition-fast);
}
.batch-move-menu__item:hover { background: var(--gray-100); }
.batch-move-menu__item--danger { color: var(--color-error); margin-top: 4px; }
.batch-move-menu__item--danger:hover { background: rgba(239, 68, 68, 0.1); }

.icon-active {
  color: var(--primary-600);
}

/* ---- 标签筛选栏 ---- */
.tag-filter-bar {
  padding: 8px 20px;
  border-bottom: 1px solid var(--border-color);
  background: var(--bg-surface);
  flex-shrink: 0;
}

.tag-filter-bar__scroll {
  display: flex;
  align-items: center;
  gap: 6px;
  overflow-x: auto;
  scrollbar-width: none;
}

.tag-filter-bar__scroll::-webkit-scrollbar {
  display: none;
}

.tag-filter-bar__label {
  display: flex;
  align-items: center;
  gap: 4px;
  font-size: 12px;
  color: var(--text-muted);
  white-space: nowrap;
  flex-shrink: 0;
  margin-right: 2px;
}

.tag-filter-bar__label i {
  font-size: 13px;
}

.tag-filter-chip {
  display: inline-flex;
  align-items: center;
  gap: 4px;
  padding: 3px 10px;
  border-radius: var(--radius-full);
  font-size: 12px;
  color: var(--text-secondary);
  background: var(--gray-100);
  border: 1.5px solid transparent;
  white-space: nowrap;
  flex-shrink: 0;
  transition: all var(--transition-fast);
}

.tag-filter-chip:hover {
  border-color: var(--primary-300);
  color: var(--primary-700);
  background: var(--primary-50);
}

.tag-filter-chip.active {
  background: var(--primary-600);
  color: #fff;
  border-color: var(--primary-600);
}

.tag-filter-chip__count {
  font-size: 10px;
  opacity: 0.7;
}

.tag-filter-clear {
  display: inline-flex;
  align-items: center;
  gap: 4px;
  padding: 3px 10px;
  border-radius: var(--radius-full);
  font-size: 12px;
  color: var(--text-muted);
  background: transparent;
  border: 1.5px dashed var(--gray-300);
  white-space: nowrap;
  flex-shrink: 0;
  transition: all var(--transition-fast);
  margin-left: 4px;
}

.tag-filter-clear:hover {
  border-color: var(--color-error);
  color: var(--color-error);
  background: rgba(239, 68, 68, 0.05);
}
/* ---- 子分类（二级）---- */
.sidebar-item--child {
  padding-left: 24px;
  font-size: 12px;
}

.sidebar__child-indent {
  color: var(--text-muted);
  flex-shrink: 0;
  display: flex;
  align-items: center;
  margin-right: 2px;
  opacity: 0.6;
}

.sidebar__children {
  display: flex;
  flex-direction: column;
  gap: 2px;
  overflow: hidden;
}

/* 展开/折叠按钮 */
.sidebar__expand-btn {
  display: flex;
  align-items: center;
  justify-content: center;
  width: 16px;
  height: 16px;
  flex-shrink: 0;
  color: var(--text-muted);
  border-radius: var(--radius-sm);
  transition: transform var(--transition-fast), color var(--transition-fast);
}

.sidebar__expand-btn:hover {
  color: var(--text-primary);
}

.sidebar__expand-btn.expanded {
  transform: rotate(90deg);
}

.sidebar__expand-placeholder {
  width: 16px;
  height: 16px;
  flex-shrink: 0;
}

/* 子分类展开收起动画 */
.expand-enter-active,
.expand-leave-active {
  transition: max-height 0.2s ease, opacity 0.2s ease;
  max-height: 200px;
}
.expand-enter-from,
.expand-leave-to {
  max-height: 0;
  opacity: 0;
}
</style>

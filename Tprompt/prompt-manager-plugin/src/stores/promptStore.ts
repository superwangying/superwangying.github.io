import { defineStore } from 'pinia'
import { ref, computed } from 'vue'
import { nanoid } from 'nanoid'
import { db } from '@/db/schema'
import type { Prompt, PromptForm, PromptId, CategoryId } from '@/types'
import { VIRTUAL_CATEGORY } from '@/types'
import { useSettingStore } from './settingStore'
import { useCategoryStore } from './categoryStore'

export const usePromptStore = defineStore('prompt', () => {
  // -------------------- State --------------------
  const prompts = ref<Prompt[]>([])
  const loading = ref(false)
  const searchQuery = ref('')
  const searchResultIds = ref<string[]>([]) // MiniSearch 返回的 ID 列表
  const activeCategoryId = ref<string>(VIRTUAL_CATEGORY.ALL)
  const selectedTags = ref<string[]>([]) // 选中的标签（多选 AND 逻辑）
  const sortField = ref<'updatedAt' | 'usageCount' | 'createdAt' | 'title'>('updatedAt')
  const sortDirection = ref<'asc' | 'desc'>('desc')

  // -------------------- 分类过滤 + 搜索 --------------------
  const filteredPrompts = computed<Prompt[]>(() => {
    let list = [...prompts.value]
    const categoryStore = useCategoryStore()

    // 1. 分类过滤
    const catId = activeCategoryId.value
    if (catId === VIRTUAL_CATEGORY.FAVORITES) {
      list = list.filter((p) => p.isFavorite)
    } else if (catId !== VIRTUAL_CATEGORY.ALL) {
      // 收集该分类及其所有子分类的 ID（最多两层）
      const childIds = categoryStore.categories
        .filter(c => c.parentId === catId)
        .map(c => c.id)
      const matchIds = new Set([catId, ...childIds])
      list = list.filter((p) => p.categoryId && matchIds.has(p.categoryId))
    }

    // 2. 搜索过滤（MiniSearch 返回的 ID 列表）
    if (searchResultIds.value.length > 0) {
      const idSet = new Set(searchResultIds.value)
      list = list.filter((p) => idSet.has(p.id))
    }

    // 3. 标签过滤（AND 逻辑：必须包含所有选中标签）
    if (selectedTags.value.length > 0) {
      list = list.filter((p) =>
        selectedTags.value.every((tag) => p.tags?.includes(tag)),
      )
    }

    // 4. 排序（收藏/置顶优先）
    list.sort((a, b) => {
      if (a.isPinned !== b.isPinned) return a.isPinned ? -1 : 1

      const field = sortField.value
      const dir = sortDirection.value === 'desc' ? -1 : 1
      let cmp = 0

      if (field === 'title') {
        cmp = a.title.localeCompare(b.title, 'zh-CN')
      } else {
        cmp = (a[field] as number) - (b[field] as number)
      }

      return cmp * dir
    })

    return list
  })

  // 每个分类的 Prompt 数量 Map
  const countByCategory = computed<Record<string, number>>(() => {
    const map: Record<string, number> = {}
    for (const p of prompts.value) {
      if (p.categoryId) {
        map[p.categoryId] = (map[p.categoryId] ?? 0) + 1
      }
    }
    return map
  })

  // -------------------- 标签统计 --------------------
  // 所有不重复标签（按出现次数降序）
  const allTags = computed<Array<{ tag: string; count: number }>>(() => {
    const map = new Map<string, number>()
    for (const p of prompts.value) {
      for (const tag of p.tags ?? []) {
        map.set(tag, (map.get(tag) ?? 0) + 1)
      }
    }
    return [...map.entries()]
      .map(([tag, count]) => ({ tag, count }))
      .sort((a, b) => b.count - a.count)
  })

  // -------------------- 加载 --------------------
  async function loadPrompts(): Promise<void> {
    loading.value = true
    try {
      const raw = await db.prompts.orderBy('updatedAt').reverse().toArray()
      prompts.value = raw
      const tagged = raw.filter(p => p.tags && p.tags.length > 0)
      if (tagged.length > 0) {
        console.log('[DEBUG store] loadPrompts, prompts with tags:', tagged.map(p => ({ id: p.id, title: p.title, tags: p.tags })))
      }
    } finally {
      loading.value = false
    }
  }

  // -------------------- CRUD --------------------
  async function createPrompt(form: PromptForm): Promise<Prompt> {
    const now = Date.now()
    // 确保数据可被 IndexedDB 克隆（脱 Vue Proxy）
    const safeForm = JSON.parse(JSON.stringify(form))
    console.log('[DEBUG store] createPrompt, form.tags:', JSON.stringify(form.tags), '| safeForm.tags:', JSON.stringify(safeForm.tags))
    const prompt: Prompt = {
      id: nanoid(),
      ...safeForm,
      usageCount: 0,
      createdAt: now,
      updatedAt: now,
    }
    console.log('[DEBUG store] createPrompt, prompt.tags:', JSON.stringify(prompt.tags))
    await db.prompts.add(prompt)
    prompts.value.unshift(prompt)
    return prompt
  }

  async function updatePrompt(id: string, patch: Partial<PromptForm>): Promise<Prompt> {
    const now = Date.now()
    // 确保数据可被 IndexedDB 克隆（脱 Vue Proxy）
    const safePatch = JSON.parse(JSON.stringify(patch))
    console.log('[DEBUG store] updatePrompt, patch.tags:', JSON.stringify(patch.tags), '| safePatch.tags:', JSON.stringify(safePatch.tags))
    await db.prompts.update(id, { ...safePatch, updatedAt: now })
    const idx = prompts.value.findIndex((p) => p.id === id)
    if (idx !== -1) {
      prompts.value[idx] = { ...prompts.value[idx], ...safePatch, updatedAt: now }
    }
    const result = prompts.value.find((p) => p.id === id)!
    console.log('[DEBUG store] updatePrompt result, result.tags:', JSON.stringify(result.tags))
    return result
  }

  async function deletePrompt(id: string): Promise<void> {
    await db.prompts.delete(id)
    const idx = prompts.value.findIndex((p) => p.id === id)
    if (idx !== -1) prompts.value.splice(idx, 1)
  }

  async function bulkDeletePrompts(ids: string[]): Promise<void> {
    await db.prompts.bulkDelete(ids)
    prompts.value = prompts.value.filter((p) => !ids.includes(p.id))
  }

  // -------------------- 收藏 --------------------
  async function toggleFavorite(id: string): Promise<void> {
    const prompt = prompts.value.find((p) => p.id === id)
    if (!prompt) return
    const next = !prompt.isFavorite
    const now = Date.now()
    await db.prompts.update(id, { isFavorite: next, updatedAt: now })
    prompt.isFavorite = next
    prompt.updatedAt = now
  }

  // -------------------- 置顶 --------------------
  async function togglePin(id: string): Promise<void> {
    const prompt = prompts.value.find((p) => p.id === id)
    if (!prompt) return
    const next = !prompt.isPinned
    const now = Date.now()
    await db.prompts.update(id, { isPinned: next, updatedAt: now })
    prompt.isPinned = next
    prompt.updatedAt = now
  }

  // -------------------- 复制 & 使用统计 --------------------
  async function incrementUsageCount(id: string): Promise<void> {
    const prompt = prompts.value.find((p) => p.id === id)
    if (!prompt) return
    const now = Date.now()
    await db.prompts.update(id, { usageCount: prompt.usageCount + 1, updatedAt: now })
    prompt.usageCount++
    prompt.updatedAt = now
  }

  // -------------------- 移动分类 --------------------
  async function moveToCategory(ids: string[], categoryId: CategoryId | null): Promise<void> {
    const now = Date.now()
    for (const id of ids) {
      await db.prompts.update(id, { categoryId, updatedAt: now })
    }
    await loadPrompts()
  }

  // -------------------- 搜索控制 --------------------
  function setSearchKeyword(q: string): void {
    searchQuery.value = q
  }

  function setSearchResults(ids: string[]): void {
    searchResultIds.value = ids
  }

  function setActiveCategory(id: string): void {
    activeCategoryId.value = id
    searchQuery.value = ''
  }

  function setSortField(field: 'updatedAt' | 'usageCount' | 'createdAt' | 'title'): void {
    // 切换排序字段时自动重置方向为 desc（首次选某字段时）；如果点的是同一字段则翻转方向
    if (sortField.value === field) {
      sortDirection.value = sortDirection.value === 'desc' ? 'asc' : 'desc'
    } else {
      sortField.value = field
      sortDirection.value = field === 'title' ? 'asc' : 'desc'
    }
  }

  function toggleTag(tag: string): void {
    if (selectedTags.value.includes(tag)) {
      selectedTags.value = selectedTags.value.filter((t) => t !== tag)
    } else {
      selectedTags.value = [...selectedTags.value, tag]
    }
  }

  function clearTags(): void {
    selectedTags.value = []
  }

  // -------------------- 获取单条 --------------------
  async function getPromptById(id: string): Promise<Prompt | undefined> {
    return db.prompts.get(id)
  }

  // -------------------- 清空全部数据 --------------------
  async function clearAll(): Promise<void> {
    await db.prompts.clear()
    prompts.value = []
  }

  return {
    prompts,
    loading,
    searchQuery,
    searchResultIds,
    activeCategoryId,
    selectedTags,
    sortField,
    sortDirection,
    filteredPrompts,
    countByCategory,
    allTags,
    loadPrompts,
    createPrompt,
    updatePrompt,
    deletePrompt,
    bulkDeletePrompts,
    toggleFavorite,
    togglePin,
    incrementUsageCount,
    moveToCategory,
    setSearchKeyword,
    setSearchResults,
    setActiveCategory,
    setSortField,
    toggleTag,
    clearTags,
    getPromptById,
    clearAll,
  }
})

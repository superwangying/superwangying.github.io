import { defineStore } from 'pinia'
import { ref, computed } from 'vue'
import { nanoid } from 'nanoid'
import { db } from '@/db/schema'
import type { Category, CategoryForm, CategoryId } from '@/types'
import { VIRTUAL_CATEGORY } from '@/types'

// -------------------- 常量 --------------------
export const CATEGORY_COLORS = [
  '#6366f1', '#8b5cf6', '#ec4899', '#ef4444',
  '#f97316', '#eab308', '#22c55e', '#14b8a6',
  '#3b82f6', '#64748b',
]

/** 分类图标列表 — 使用 Feather Icons（极简线性商务风）
 *  存储格式：Iconify 图标全名（feather:xxx），模板中用 `<i :class="'i-' + iconName">` 渲染
 *  映射来源：原 Emoji → Feather 图标对应替换
 */
export const CATEGORY_ICONS = [
  'feather:folder',          // 📁 文件夹
  'feather:zap',             // ⚡ 闪电/灵感
  'feather:droplet',         // 🎨 调色板/设计
  'feather:file-text',       // 📝 文档/铅笔
  'feather:tool',            // 🔧 扳手/工具
  'feather:navigation-2',    // 🚀 火箭/启动
  'feather:monitor',         // 💻 电脑/设备
  'feather:bar-chart-2',     // 📊 柱状图
  'feather:crosshair',       // 🎯 靶心
  'feather:search',          // 🔍 搜索
  'feather:star',            // ✨ 星光
  'feather:award',           // 🌟 奖牌/成就
  'feather:book-open',       // 📚 书籍
  'feather:layers',          // 🎭 面具/层次
  'feather:message-circle',  // 💬 对话
  'feather:settings',        // 🛠️ 工具/设置
  'feather:hexagon',         // 💎 六边形/稀有
  'feather:command',         // 🎮 命令/游戏
  'feather:music',           // 🎵 音乐
  'feather:camera',          // 📷 相机
  'feather:cloud',           // 🌈 云彩
  'feather:globe',           // 🔮 水晶球/地球
  'feather:cpu',             // 🧠 芯片/科技
  'feather:heart',           // 🌺 花朵/爱心
]

/** 向后兼容别名：新代码请使用 CATEGORY_ICONS */
export const CATEGORY_EMOJIS = CATEGORY_ICONS

// -------------------- 旧 Emoji → 新 Feather 图标迁移映射 --------------------
/** 完整映射表，覆盖所有可能的旧 emoji 值 */
const EMOJI_TO_ICON_MAP: Record<string, string> = {
  // 原 CATEGORY_EMOJIS 列表中的 24 个（一一对应）
  '📁': 'feather:folder',
  '💡': 'feather:zap',
  '🎨': 'feather:droplet',
  '📝': 'feather:file-text',
  '🔧': 'feather:tool',
  '🚀': 'feather:navigation-2',
  '💻': 'feather:monitor',
  '📊': 'feather:bar-chart-2',
  '🎯': 'feather:crosshair',
  '🔍': 'feather:search',
  '✨': 'feather:star',
  '🌟': 'feather:award',
  '📚': 'feather:book-open',
  '🎭': 'feather:layers',
  '💬': 'feather:message-circle',
  '🛠️': 'feather:settings',
  '⚡': 'feather:zap',
  '🎮': 'feather:command',
  '🎵': 'feather:music',
  '📷': 'feather:camera',
  '🌈': 'feather:cloud',
  '🔮': 'feather:globe',
  '💎': 'feather:hexagon',
  '🌺': 'feather:heart',
  // schema.ts 默认数据中的额外 emoji
  '🌍': 'feather:globe',
  // 虚拟分类中可能出现的
  '🌐': 'feather:globe',
  '⭐': 'feather:star',
  '📭': 'feather:inbox',
  // 旧的 ant-design 格式也需要迁移（防止中途切换）
  'ant-design:folder-outlined':    'feather:folder',
  'ant-design:bulb-outlined':     'feather:zap',
  'ant-design:bg-colors-outlined': 'feather:droplet',
  'ant-design:file-text-outlined': 'feather:file-text',
  'ant-design:tool-outlined':     'feather:tool',
  'ant-design:rocket-outlined':   'feather:navigation-2',
  'ant-design:desktop-outlined':  'feather:monitor',
  'ant-design:bar-chart-outlined': 'feather:bar-chart-2',
  'ant-design:aim-outlined':     'feather:crosshair',
  'ant-design:search-outlined':   'feather:search',
  'ant-design:star-outlined':     'feather:star',
  'ant-design:star-filled':       'feather:award',
  'ant-design:book-outlined':     'feather:book-open',
  'ant-design:experiment-outlined': 'feather:layers',
  'ant-design:message-outlined':  'feather:message-circle',
  'ant-design:build-outlined':    'feather:settings',
  'ant-design:thunderbolt-outlined': 'feather:zap',
  'ant-design:gamepad-outlined':  'feather:command',
  'ant-design:customer-service-outlined': 'feather:music',
  'ant-design:camera-outlined':   'feather:camera',
  'ant-design:cloud-outlined':    'feather:cloud',
  'ant-design:global-outlined':   'feather:globe',
  'ant-design:diamond-outlined':  'feather:hexagon',
  'ant-design:heart-outlined':    'feather:heart',
  'ant-design:inbox-outlined':    'feather:inbox',
}

/** 判断一个 emoji 字段是否需要迁移
 *  旧格式：emoji 字符（长度≤4）或 ant-design:xxx（之前的错误格式）
 *  新格式：feather:xxx
 */
function needsMigration(emoji: string): boolean {
  if (!emoji) return false
  // 已经是 feather 格式，不需要迁移
  if (emoji.startsWith('feather:')) return false
  return true
}

/** 执行旧 emoji → 新图标的迁移，返回是否发生过迁移 */
async function migrateCategoryIcons(cats: Category[]): Promise<boolean> {
  let migrated = false
  const now = Date.now()
  for (const cat of cats) {
    if (cat.emoji && needsMigration(cat.emoji)) {
      const newIcon = EMOJI_TO_ICON_MAP[cat.emoji] || 'ant-design-folder-outlined'
      cat.emoji = newIcon
      await db.categories.update(cat.id!, { emoji: newIcon, updatedAt: now })
      migrated = true
    }
  }
  return migrated
}

// -------------------- 树形节点类型 --------------------
export interface CategoryTreeNode extends Category {
  children: CategoryTreeNode[]
  depth: number   // 0 = 顶级, 1 = 二级
}

// -------------------- Store --------------------
export const useCategoryStore = defineStore('category', () => {
  const categories = ref<Category[]>([])
  const activeCategoryId = ref<string>(VIRTUAL_CATEGORY.ALL)
  // 记录哪些父分类处于"展开"状态，默认全部展开
  const expandedIds = ref<Set<string>>(new Set())

  // displayCategories = 所有分类按 sortOrder 排序（扁平）
  const displayCategories = computed<Category[]>(() => {
    return [...categories.value].sort((a, b) => a.sortOrder - b.sortOrder)
  })

  // 快速查找 Map
  const categoryMap = computed<Map<string, Category>>(() => {
    const map = new Map<string, Category>()
    for (const c of categories.value) {
      map.set(c.id, c)
    }
    return map
  })

  // 树形结构：只有两层（父 → 子），顶级 parentId 为 null/undefined
  const categoryTree = computed<CategoryTreeNode[]>(() => {
    const sorted = [...categories.value].sort((a, b) => a.sortOrder - b.sortOrder)
    const roots: CategoryTreeNode[] = []
    const childrenMap = new Map<string, CategoryTreeNode[]>()

    for (const cat of sorted) {
      const node: CategoryTreeNode = { ...cat, children: [], depth: cat.parentId ? 1 : 0 }
      if (!cat.parentId) {
        roots.push(node)
      } else {
        if (!childrenMap.has(cat.parentId)) childrenMap.set(cat.parentId, [])
        childrenMap.get(cat.parentId)!.push(node)
      }
    }
    // 把子节点挂到父节点上
    for (const root of roots) {
      root.children = childrenMap.get(root.id) ?? []
    }
    return roots
  })

  // 顶级分类（只有 parentId 为空的）
  const rootCategories = computed<Category[]>(() =>
    categories.value.filter(c => !c.parentId).sort((a, b) => a.sortOrder - b.sortOrder)
  )

  // 判断某分类是否展开（默认展开）
  function isExpanded(id: string): boolean {
    return expandedIds.value.has(id) || !expandedIds.value.has(id + '__collapsed')
  }

  function toggleExpand(id: string): void {
    if (expandedIds.value.has(id + '__collapsed')) {
      expandedIds.value.delete(id + '__collapsed')
    } else {
      expandedIds.value.add(id + '__collapsed')
    }
  }

  // -------------------- 加载（含旧数据自动迁移） --------------------
  async function loadCategories(): Promise<void> {
    categories.value = await db.categories.orderBy('sortOrder').toArray()
    // 一次性迁移：将旧 emoji 字符串转为 AD 图标名
    await migrateCategoryIcons(categories.value)
  }

  // -------------------- CRUD --------------------
  /**
   * 创建分类
   * @param form 分类数据
   * @param forceId 可选：强制使用指定 ID（用于导入时保留原始 ID）
   */
  async function createCategory(form: CategoryForm, forceId?: string): Promise<Category> {
    const now = Date.now()
    const category: Category = {
      id: forceId ?? nanoid(),
      ...form,
      parentId: form.parentId ?? null,
      sortOrder: form.sortOrder ?? (categories.value.length * 10),
      createdAt: now,
      updatedAt: now,
    }
    await db.categories.add(category)
    categories.value.push(category)
    return category
  }

  async function updateCategory(id: string, patch: Partial<CategoryForm>): Promise<Category> {
    const now = Date.now()
    await db.categories.update(id, { ...patch, updatedAt: now })
    const idx = categories.value.findIndex((c) => c.id === id)
    if (idx !== -1) {
      categories.value[idx] = { ...categories.value[idx], ...patch, updatedAt: now }
    }
    return categories.value.find((c) => c.id === id)!
  }

  async function deleteCategory(id: string): Promise<void> {
    // 同时将子分类提升为顶级分类（解除父子绑定）
    const children = categories.value.filter(c => c.parentId === id)
    const now = Date.now()
    for (const child of children) {
      await db.categories.update(child.id, { parentId: null, updatedAt: now })
      const idx = categories.value.findIndex(c => c.id === child.id)
      if (idx !== -1) categories.value[idx] = { ...categories.value[idx], parentId: null, updatedAt: now }
    }
    await db.categories.delete(id)
    const idx = categories.value.findIndex((c) => c.id === id)
    if (idx !== -1) categories.value.splice(idx, 1)
  }

  // -------------------- 排序 --------------------
  async function reorderCategories(orderedIds: string[]): Promise<void> {
    const now = Date.now()
    for (let i = 0; i < orderedIds.length; i++) {
      await db.categories.update(orderedIds[i], { sortOrder: i * 10, updatedAt: now })
      const idx = categories.value.findIndex((c) => c.id === orderedIds[i])
      if (idx !== -1) categories.value[idx].sortOrder = i * 10
    }
    categories.value.sort((a, b) => a.sortOrder - b.sortOrder)
  }

  /** 子分类独立排序：只更新指定父分类下的子分类 sortOrder
   *  为了避免与顶级分类的 sortOrder 冲突，子分类的 sortOrder 基于偏移量计算
   *  sortOrder = parentBase + childIndex * 1
   *  其中 parentBase = 父分类在顶级列表中的位置 * 1000
   */
  async function reorderChildCategories(parentId: string, orderedChildIds: string[]): Promise<void> {
    const parent = categories.value.find(c => c.id === parentId)
    if (!parent) return

    // 计算父分类的基础偏移：顶级分类的排序位置 * 1000
    const rootCats = categories.value.filter(c => !c.parentId).sort((a, b) => a.sortOrder - b.sortOrder)
    const parentIndex = rootCats.findIndex(c => c.id === parentId)
    const base = (parentIndex >= 0 ? parentIndex : 0) * 1000 + 100

    const now = Date.now()
    for (let i = 0; i < orderedChildIds.length; i++) {
      const newSortOrder = base + i * 10
      await db.categories.update(orderedChildIds[i], { sortOrder: newSortOrder, updatedAt: now })
      const idx = categories.value.findIndex((c) => c.id === orderedChildIds[i])
      if (idx !== -1) categories.value[idx].sortOrder = newSortOrder
    }
  }

  // -------------------- 切换分类 --------------------
  function setActiveCategory(id: string): void {
    activeCategoryId.value = id
  }

  // -------------------- 统计 --------------------
  // 真实分类数量通过 promptStore.countByCategory 获取（App.vue 中通过 ps.countByCategory 直接访问）
  function countByCategory(categoryId: string): number {
    return -1 // 占位，App.vue 使用 promptStore.countByCategory
  }

  return {
    categories,
    activeCategoryId,
    displayCategories,
    categoryMap,
    categoryTree,
    rootCategories,
    expandedIds,
    isExpanded,
    toggleExpand,
    loadCategories,
    createCategory,
    updateCategory,
    deleteCategory,
    reorderCategories,
    reorderChildCategories,
    setActiveCategory,
    countByCategory,
  }
})

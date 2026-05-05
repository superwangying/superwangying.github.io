// ============================================================
// Prompt Manager Plugin — 全局类型定义
// ============================================================

// -------------------- 虚拟分类常量 --------------------
export const VIRTUAL_CATEGORY = {
  ALL: '__all__',
  FAVORITES: '__favorites__',
} as const

export type VirtualCategoryId = typeof VIRTUAL_CATEGORY[keyof typeof VIRTUAL_CATEGORY]

// -------------------- 基础实体 --------------------
export type PromptId = string
export type CategoryId = string

// -------------------- 分类 --------------------
export interface Category {
  id: CategoryId
  name: string
  emoji: string
  color: string
  sortOrder: number
  parentId?: string | null  // 父分类 ID，null/undefined 表示顶级分类
  createdAt: number
  updatedAt: number
}

export type CategoryForm = Omit<Category, 'id' | 'createdAt' | 'updatedAt'>

// -------------------- 提示词 --------------------
export interface Prompt {
  id: PromptId
  title: string
  content: string
  description?: string
  categoryId: CategoryId | null
  tags: string[]
  isPinned: boolean
  isFavorite: boolean
  usageCount: number
  createdAt: number
  updatedAt: number
}

export type PromptForm = Omit<Prompt, 'id' | 'usageCount' | 'createdAt' | 'updatedAt'>

// -------------------- 设置 --------------------
export type ThemeMode = 'light' | 'dark' | 'system'
export type ViewMode = 'card' | 'list'
export type FontSize = 'sm' | 'md' | 'lg'
export type SortField = 'updatedAt' | 'createdAt' | 'usageCount' | 'title'
export type SortOrder = 'desc' | 'asc'

export interface Setting {
  id?: number
  theme: ThemeMode
  viewMode: ViewMode
  fontSize: FontSize
  fontFamily: string
  sortField: SortField
  sortOrder: SortOrder
}

export const DEFAULT_SETTINGS: Omit<Setting, 'id'> = {
  theme: 'system',
  viewMode: 'card',
  fontSize: 'md',
  fontFamily: 'system-ui',
  sortField: 'updatedAt',
  sortOrder: 'desc',
}

// -------------------- 导入/导出 --------------------
export type ConflictStrategy = 'replace' | 'skip' | 'merge'

export interface ExportData {
  _version: '1.0'
  _exportedAt: string
  prompts: Prompt[]
  categories: Category[]
  settings?: Partial<Omit<Setting, 'id'>>
}

export interface ImportResult {
  total: number
  imported: number
  skipped: number
  replaced: number
  errors: string[]
}

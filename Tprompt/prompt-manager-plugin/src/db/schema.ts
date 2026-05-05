import Dexie, { type EntityTable } from 'dexie'
import type { Prompt, Category, Setting } from '@/types'

// ============================================================
// Dexie 数据库 — v4 版本
// ============================================================
class PromptManagerDB extends Dexie {
  prompts!: EntityTable<Prompt, 'id'>
  categories!: EntityTable<Category, 'id'>
  settings!: EntityTable<Setting, 'id'>

  constructor() {
    super('PromptManagerDB')

    this.version(1).stores({
      // id: primaryKey; ++ 自动；[分类+收藏+更新时间] = compound 索引
      prompts: 'id, categoryId, isFavorite, updatedAt',
      categories: 'id, sortOrder',
      settings: 'id',
    })

    // v2: categories 增加 parentId 索引（支持二级分类）
    this.version(2).stores({
      prompts: 'id, categoryId, isFavorite, updatedAt',
      categories: 'id, sortOrder, parentId',
      settings: 'id',
    })
  }
}

export const db = new PromptManagerDB()

// ============================================================
// 首次安装 — 无预置分类（由用户自行导入/同步数据）
// ============================================================

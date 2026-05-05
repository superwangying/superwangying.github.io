/**
 * useImportExport - 导入导出功能 composable
 * 支持 JSON / CSV / Markdown 三种格式的导出
 */
import { db } from '@/db/schema'
import type { Prompt, Category } from '@/types'

export type ExportFormat = 'json' | 'csv' | 'markdown' | 'site'

export interface ExportOptions {
  includeCategories?: boolean
  includeSettings?: boolean
  prettyPrint?: boolean
  /** 导出范围 */
  scope?: 'all' | 'favorites' | 'category'
  /** 当 scope=category 时，指定的分类 ID */
  categoryId?: string
}

/**
 * 下载文件通用函数
 */
function downloadFile(content: string | Blob, filename: string, mimeType?: string) {
  const blob = mimeType
    ? new Blob([content], { type: mimeType })
    : content instanceof Blob ? content : new Blob([content], { type: 'text/plain;charset=utf-8' })
  const url = URL.createObjectURL(blob)
  const a = document.createElement('a')
  a.href = url
  a.download = filename
  document.body.appendChild(a)
  a.click()
  document.body.removeChild(a)
  URL.revokeObjectURL(url)
}

/**
 * 日期格式化
 */
function formatDate(timestamp: number): string {
  return new Date(timestamp).toISOString().replace('T', ' ').slice(0, 19)
}

/**
 * 转义 CSV 字段（处理双引号和逗号）
 */
function escapeCSVField(field: string | number | boolean | null | undefined): string {
  if (field === null || field === undefined) return ''
  const str = String(field)
  // 如果包含逗号、双引号或换行，需要用双引号包裹
  if (str.includes(',') || str.includes('"') || str.includes('\n') || str.includes('\r')) {
    return `"${str.replace(/"/g, '""')}"`
  }
  return str
}

// ============================================================
// JSON 导出
// ============================================================
export async function exportJSON(options: ExportOptions = {}): Promise<void> {
  const { includeCategories = true, prettyPrint = true } = options

  // 获取提示词
  let prompts: Prompt[]
  if (options.scope === 'favorites') {
    prompts = await db.prompts.where('isFavorite').equals(1).toArray() as unknown as Prompt[]
  } else if (options.scope === 'category' && options.categoryId) {
    prompts = await db.prompts.where('categoryId').equals(options.categoryId).toArray()
  } else {
    prompts = await db.prompts.toArray()
  }

  // 脱 Proxy（解决 IndexedDB structured clone 问题）
  prompts = JSON.parse(JSON.stringify(prompts))

  // 获取分类
  const categories = includeCategories ? await db.categories.toArray() : []

  const data = {
    _version: '1.0',
    _exportedAt: new Date().toISOString(),
    prompts,
    categories,
  }

  const json = prettyPrint ? JSON.stringify(data, null, 2) : JSON.stringify(data)
  const filename = `prompts-backup-${new Date().toISOString().slice(0, 10)}.json`
  downloadFile(json, filename, 'application/json;charset=utf-8')
}

// ============================================================
// CSV 导出
// ============================================================
export async function exportCSV(options: ExportOptions = {}): Promise<void> {
  const { includeCategories = true } = options

  // 获取提示词
  let prompts: Prompt[]
  if (options.scope === 'favorites') {
    prompts = await db.prompts.where('isFavorite').equals(1).toArray() as unknown as Prompt[]
  } else if (options.scope === 'category' && options.categoryId) {
    prompts = await db.prompts.where('categoryId').equals(options.categoryId).toArray()
  } else {
    prompts = await db.prompts.toArray()
  }

  // 脱 Proxy
  prompts = JSON.parse(JSON.stringify(prompts))

  // 获取分类映射
  const categoryMap = new Map<string, string>()
  if (includeCategories) {
    const categories = await db.categories.toArray()
    categories.forEach(c => categoryMap.set(c.id, c.name))
  }

  // CSV 表头
  const headers = [
    'ID',
    '标题',
    '内容',
    '描述',
    '分类',
    '标签',
    '收藏',
    '置顶',
    '使用次数',
    '创建时间',
    '更新时间',
  ]

  // 生成行数据
  const rows = prompts.map(p => [
    p.id,
    p.title,
    p.content,
    p.description || '',
    categoryMap.get(p.categoryId || '') || '未分类',
    (p.tags || []).join('; '),
    p.isFavorite ? '是' : '否',
    p.isPinned ? '是' : '否',
    p.usageCount || 0,
    formatDate(p.createdAt),
    formatDate(p.updatedAt),
  ].map(escapeCSVField))

  // 构建 CSV
  const csvContent = [
    headers.map(escapeCSVField).join(','),
    ...rows.map(row => row.join(',')),
  ].join('\r\n')

  const filename = `prompts-${new Date().toISOString().slice(0, 10)}.csv`
  downloadFile(csvContent, filename, 'text/csv;charset=utf-8')
}

// ============================================================
// Markdown 导出
// ============================================================
export async function exportMarkdown(options: ExportOptions = {}): Promise<void> {
  const { includeCategories = true } = options

  // 获取提示词
  let prompts: Prompt[]
  if (options.scope === 'favorites') {
    prompts = await db.prompts.where('isFavorite').equals(1).toArray() as unknown as Prompt[]
  } else if (options.scope === 'category' && options.categoryId) {
    prompts = await db.prompts.where('categoryId').equals(options.categoryId).toArray()
  } else {
    prompts = await db.prompts.toArray()
  }

  // 脱 Proxy
  prompts = JSON.parse(JSON.stringify(prompts))

  // 获取分类
  const categoryMap = new Map<string, Category>()
  if (includeCategories) {
    const categories = await db.categories.toArray()
    categories.forEach(c => categoryMap.set(c.id, c))
  }

  // 按分类分组
  const grouped = new Map<string, Prompt[]>()
  const uncategorized: Prompt[] = []

  for (const p of prompts) {
    if (p.categoryId) {
      const catName = categoryMap.get(p.categoryId)?.name || '未分类'
      if (!grouped.has(catName)) {
        grouped.set(catName, [])
      }
      grouped.get(catName)!.push(p)
    } else {
      uncategorized.push(p)
    }
  }

  // 构建 Markdown
  const lines: string[] = []
  const today = new Date().toLocaleDateString('zh-CN', {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  })

  // 头部
  lines.push('# Prompt Manager 提示词备份')
  lines.push('')
  lines.push(`> 导出时间：${today}`)
  lines.push(`> 共 ${prompts.length} 条提示词`)
  lines.push('')
  lines.push('---')
  lines.push('')

  // 按分类输出
  const sortedCategories = Array.from(grouped.entries()).sort((a, b) => a[0].localeCompare(b[0]))

  for (const [catName, catPrompts] of sortedCategories) {
    const cat = Array.from(categoryMap.values()).find(c => c.name === catName)
    const icon = cat?.emoji ? getIconEmoji(cat.emoji) : '📁'

    lines.push(`## ${icon} ${catName}`)
    lines.push('')

    for (const p of catPrompts) {
      lines.push(buildPromptSection(p))
    }

    lines.push('')
  }

  // 未分类
  if (uncategorized.length > 0) {
    lines.push('## 📋 未分类')
    lines.push('')
    for (const p of uncategorized) {
      lines.push(buildPromptSection(p))
    }
    lines.push('')
  }

  // 底部统计
  lines.push('---')
  lines.push('')
  lines.push('## 📊 统计信息')
  lines.push('')
  lines.push(`- 提示词总数：${prompts.length}`)
  lines.push(`- 分类数量：${grouped.size}`)
  lines.push(`- 收藏数量：${prompts.filter(p => p.isFavorite).length}`)
  lines.push(`- 导出时间：${new Date().toISOString()}`)

  const mdContent = lines.join('\n')
  const filename = `prompts-backup-${new Date().toISOString().slice(0, 10)}.md`
  downloadFile(mdContent, filename, 'text/markdown;charset=utf-8')
}

/**
 * 构建单个提示词的 Markdown 段落
 */
function buildPromptSection(p: Prompt): string {
  const sections: string[] = []

  // 标题行
  sections.push(`### ${p.title}`)

  // 元信息
  const meta: string[] = []
  if (p.isFavorite) meta.push('⭐ 收藏')
  if (p.isPinned) meta.push('📌 置顶')
  if (p.usageCount > 0) meta.push(`使用 ${p.usageCount} 次`)

  if (meta.length > 0) {
    sections.push('')
    sections.push(`> ${meta.join(' · ')}`)
  }

  // 描述
  if (p.description) {
    sections.push('')
    sections.push(`**描述：** ${p.description}`)
  }

  // 标签
  if (p.tags && p.tags.length > 0) {
    sections.push('')
    sections.push(`**标签：** ${p.tags.map(t => `\`${t}\``).join(' ')}`)
  }

  // 内容
  sections.push('')
  sections.push('```')
  sections.push(p.content)
  sections.push('```')

  // 底部信息
  sections.push('')
  sections.push(`> 创建于 ${formatDate(p.createdAt)} · 更新于 ${formatDate(p.updatedAt)}`)

  return sections.join('\n')
}

/**
 * 将 feather 图标名转换为 emoji
 */
function getIconEmoji(icon: string): string {
  const iconToEmoji: Record<string, string> = {
    'feather:folder': '📁',
    'feather:bulb': '💡',
    'feather:droplet': '🎨',
    'feather:file-text': '📝',
    'feather:tool': '🔧',
    'feather:navigation-2': '🚀',
    'feather:monitor': '💻',
    'feather:bar-chart-2': '📊',
    'feather:crosshair': '🎯',
    'feather:search': '🔍',
    'feather:star': '⭐',
    'feather:award': '🌟',
    'feather:book-open': '📚',
    'feather:layers': '🎭',
    'feather:message-circle': '💬',
    'feather:settings': '🛠️',
    'feather:zap': '⚡',
    'feather:gamepad': '🎮',
    'feather:music': '🎵',
    'feather:camera': '📷',
    'feather:cloud': '🌈',
    'feather:globe': '🔮',
    'feather:diamond': '💎',
    'feather:heart': '🌺',
  }

  // 如果是 feather 图标，转换为 emoji
  if (icon.startsWith('feather:')) {
    return iconToEmoji[icon] || '📋'
  }

  // 已经是 emoji
  if (icon.length <= 4 && !icon.includes(':')) {
    return icon
  }

  return '📋'
}

// ============================================================
// 导出统计（用于预览）
// ============================================================
export async function getExportStats(scope: ExportOptions['scope'] = 'all'): Promise<{
  prompts: number
  categories: number
  size: string
}> {
  let prompts: Prompt[]

  if (scope === 'favorites') {
    prompts = await db.prompts.where('isFavorite').equals(1).toArray() as unknown as Prompt[]
  } else {
    prompts = await db.prompts.toArray()
  }

  const categories = await db.categories.count()

  // 估算文件大小（JSON 格式）
  const jsonSize = JSON.stringify(prompts).length
  const sizeKB = Math.ceil(jsonSize / 1024)

  return {
    prompts: prompts.length,
    categories,
    size: sizeKB < 1 ? '<1KB' : `${sizeKB}KB`,
  }
}

// ============================================================
// 导出函数主入口
// ============================================================
export function useImportExport() {
  async function exportData(
    format: ExportFormat,
    options: ExportOptions = {},
  ): Promise<void> {
    switch (format) {
      case 'json':
        await exportJSON(options)
        break
      case 'csv':
        await exportCSV(options)
        break
      case 'markdown':
        await exportMarkdown(options)
        break
    }
  }

  return {
    exportData,
    exportJSON,
    exportCSV,
    exportMarkdown,
    getExportStats,
  }
}

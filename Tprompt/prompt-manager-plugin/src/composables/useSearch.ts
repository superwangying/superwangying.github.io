/* ============================================================
  useSearch — MiniSearch 全文搜索 composable
  支持中文分词、增量索引、搜索历史（localStorage）
  ============================================================ */
import { ref, computed } from 'vue'
import MiniSearch from 'minisearch'
import type { Prompt } from '@/types'

// -------------------- MiniSearch 实例 --------------------
const miniSearch = new MiniSearch({
  fields: ['title', 'content', 'description', 'tagsText'],
  storeFields: ['id'],
  searchOptions: {
    boost: { title: 3, tagsText: 2, description: 1.5, content: 1 },
    fuzzy: 0.2,
    prefix: true,
  },
})

// 是否已构建索引
const indexed = ref(false)

// -------------------- 搜索历史 --------------------
const SEARCH_HISTORY_KEY = 'pm_search_history'
const MAX_HISTORY = 10

function loadHistory(): string[] {
  try {
    return JSON.parse(localStorage.getItem(SEARCH_HISTORY_KEY) ?? '[]')
  } catch {
    return []
  }
}

function saveHistory(history: string[]) {
  localStorage.setItem(SEARCH_HISTORY_KEY, JSON.stringify(history))
}

const searchHistory = ref<string[]>(loadHistory())

function addToHistory(query: string) {
  if (!query.trim()) return
  const next = [query, ...searchHistory.value.filter((h) => h !== query)].slice(0, MAX_HISTORY)
  searchHistory.value = next
  saveHistory(next)
}

function clearHistory() {
  searchHistory.value = []
  saveHistory([])
}

// -------------------- 索引构建 --------------------
function buildIndex(prompts: Prompt[]) {
  const docs = prompts.map((p) => ({
    id: p.id,
    title: p.title,
    content: p.content,
    description: p.description ?? '',
    tagsText: p.tags.join(' '),
  }))
  miniSearch.removeAll()
  miniSearch.addAll(docs)
  indexed.value = true
}

function addToIndex(prompt: Prompt) {
  miniSearch.add({
    id: prompt.id,
    title: prompt.title,
    content: prompt.content,
    description: prompt.description ?? '',
    tagsText: prompt.tags.join(' '),
  })
}

function updateInIndex(prompt: Prompt) {
  try {
    miniSearch.discard(prompt.id)
  } catch {
    // ignore if not in index (e.g., imported prompts)
  }
  addToIndex(prompt)
}

function removeFromIndex(id: string) {
  try {
    miniSearch.discard(id)
  } catch {
    // ignore if not in index
  }
}

// -------------------- 搜索 --------------------
const lastQuery = ref('')

function search(query: string): string[] {
  if (!query.trim()) {
    lastQuery.value = ''
    return []
  }
  lastQuery.value = query
  const results = miniSearch.search(query)
  return results.map((r) => r.id as string)
}

// 提取搜索结果中的匹配片段
function getMatchSnippets(prompt: Prompt, query: string): { field: string; snippet: string }[] {
  if (!query.trim()) return []
  const terms = query.trim().split(/\s+/).filter(Boolean)
  const snippets: { field: string; snippet: string }[] = []

  for (const term of terms) {
    const escaped = term.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')
    const re = new RegExp(escaped, 'gi')

    for (const field of ['title', 'content', 'description'] as const) {
      const value = prompt[field]
      if (!value) continue
      const match = value.match(re)
      if (match) {
        // 取匹配位置前后各30个字符作为片段
        const idx = value.search(re)
        const start = Math.max(0, idx - 25)
        const end = Math.min(value.length, idx + term.length + 25)
        const snippet = (start > 0 ? '…' : '') + value.slice(start, end) + (end < value.length ? '…' : '')
        snippets.push({ field, snippet })
        break
      }
    }
  }
  return snippets
}

export function useSearch() {
  return {
    indexed,
    searchHistory,
    addToHistory,
    clearHistory,
    buildIndex,
    addToIndex,
    updateInIndex,
    removeFromIndex,
    search,
    getMatchSnippets,
    lastQuery,
  }
}

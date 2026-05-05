import { defineStore } from 'pinia'
import { ref, computed, watch } from 'vue'
import { db } from '@/db/schema'
import type { ThemeMode, ViewMode, FontSize } from '@/types'
import { DEFAULT_SETTINGS } from '@/types'

// 字号 → px 映射
export const FONT_SIZE_MAP: Record<FontSize, number> = {
  sm: 13,
  md: 14,
  lg: 16,
}

export const useSettingStore = defineStore('setting', () => {
  // -------------------- State --------------------
  // 主题固定为浅色，不提供切换
  const themeMode = ref<ThemeMode>('light')
  const viewMode = ref<ViewMode>(DEFAULT_SETTINGS.viewMode)
  const fontSize = ref<number>(FONT_SIZE_MAP[DEFAULT_SETTINGS.fontSize])
  const fontFamily = ref<string>(DEFAULT_SETTINGS.fontFamily)

  // -------------------- 计算属性 --------------------
  const resolvedTheme = computed<Exclude<ThemeMode, 'system'>>(() => {
    if (themeMode.value !== 'system') return themeMode.value
    return window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light'
  })

  // -------------------- 初始化 --------------------
  async function init(): Promise<void> {
    try {
      const record = await db.settings.get(1)
      if (record) {
        viewMode.value = record.viewMode ?? DEFAULT_SETTINGS.viewMode
        if (record.fontSize) {
          fontSize.value = FONT_SIZE_MAP[record.fontSize] ?? FONT_SIZE_MAP.md
        }
        fontFamily.value = record.fontFamily ?? DEFAULT_SETTINGS.fontFamily
      }
    } catch {
      // ignore
    }

    // 固定浅色主题
    applyTheme()
    applyFont()
  }

  // -------------------- 持久化 --------------------
  async function save(): Promise<void> {
    const fontSizeKey = (Object.entries(FONT_SIZE_MAP) as [FontSize, number][]).find(
      ([, v]) => v === fontSize.value,
    )?.[0] ?? 'md'

    await db.settings.put({
      id: 1,
      theme: themeMode.value,
      viewMode: viewMode.value,
      fontSize: fontSizeKey,
      fontFamily: fontFamily.value,
      sortField: 'updatedAt',
      sortOrder: 'desc',
    })
  }

  // -------------------- 主题应用 --------------------
  function applyTheme() {
    const resolved = resolvedTheme.value
    document.documentElement.setAttribute('data-theme', resolved)
  }

  function setThemeMode(mode: ThemeMode) {
    themeMode.value = mode
    applyTheme()
    save()
  }

  // -------------------- 字体应用 --------------------
  function applyFont() {
    document.documentElement.style.setProperty('--editor-font-size', `${fontSize.value}px`)
    if (fontFamily.value !== 'system-ui') {
      document.documentElement.style.setProperty('--editor-font-family', fontFamily.value)
    }
  }

  function setFontFamily(family: string) {
    fontFamily.value = family
    applyFont()
    save()
  }

  function setFontSize(px: number) {
    fontSize.value = Math.max(10, Math.min(24, px))
    applyFont()
    save()
  }

  function setViewMode(mode: ViewMode) {
    viewMode.value = mode
    save()
  }

  // -------------------- 统计 --------------------
  async function getStats() {
    const prompts = await db.prompts.count()
    const categories = await db.categories.count()
    return { prompts, categories }
  }

  return {
    themeMode,
    viewMode,
    fontSize,
    fontFamily,
    resolvedTheme,
    init,
    setThemeMode,
    setFontFamily,
    setFontSize,
    setViewMode,
    getStats,
    save,
  }
})

import { defineStore } from 'pinia'
import { ref } from 'vue'
import { db } from '@/db/schema'
import {
  validateToken,
  pushToGist,
  pullFromGist,
  findExistingGist,
  type GistSyncPayload,
  type SyncResult,
} from '@/services/syncService'

export type SyncStatus = 'idle' | 'validating' | 'pushing' | 'pulling' | 'success' | 'error'

export const useSyncStore = defineStore('sync', () => {
  // -------------------- State --------------------
  const token = ref<string>('')
  const gistId = ref<string | null>(null)
  const lastSyncTime = ref<string | null>(null)
  const lastError = ref<string | null>(null)
  const status = ref<SyncStatus>('idle')

  // -------------------- 初始化（从 IndexedDB settings 读取） --------------------
  const SYNC_SETTINGS_KEY = 999

  async function loadSyncConfig(): Promise<void> {
    try {
      const record = await db.settings.get(SYNC_SETTINGS_KEY) as any
      if (record) {
        token.value = record.token ?? ''
        gistId.value = record.gistId ?? null
        lastSyncTime.value = record.lastSyncTime ?? null
      }
    } catch {
      // ignore
    }
  }

  async function saveSyncConfig(): Promise<void> {
    await db.settings.put({
      id: SYNC_SETTINGS_KEY,
      token: token.value,
      gistId: gistId.value,
      lastSyncTime: lastSyncTime.value,
    } as any)
  }

  // -------------------- 验证 Token --------------------
  async function testToken(inputToken: string): Promise<boolean> {
    status.value = 'validating'
    lastError.value = null
    try {
      const valid = await validateToken(inputToken)
      if (!valid) {
        lastError.value = 'Token 无效或已过期，请检查后重试'
        status.value = 'error'
        return false
      }
      token.value = inputToken

      // 尝试查找已有的 Gist
      const existingId = await findExistingGist(inputToken)
      gistId.value = existingId
      await saveSyncConfig()

      status.value = 'success'
      return true
    } catch (err) {
      lastError.value = `连接失败: ${(err as Error).message}`
      status.value = 'error'
      return false
    }
  }

  // -------------------- 构建同步数据 --------------------
  function buildPayload(): GistSyncPayload {
    // 从 IndexedDB 直接读取（脱 Proxy）
    return {
      prompts: JSON.parse(JSON.stringify([])), // placeholder，由 doPush 填充
      categories: JSON.parse(JSON.stringify([])), // placeholder
      _version: '1.0',
      _syncedAt: new Date().toISOString(),
    }
  }

  // -------------------- 推送（本地 → Gist） --------------------
  async function doPush(): Promise<SyncResult> {
    status.value = 'pushing'
    lastError.value = null
    try {
      // 从 IndexedDB 读取原始数据（脱 Proxy）
      const prompts = await db.prompts.toArray()
      const categories = await db.categories.toArray()

      const payload: GistSyncPayload = {
        prompts: JSON.parse(JSON.stringify(prompts)),
        categories: JSON.parse(JSON.stringify(categories)),
        _version: '1.0',
        _syncedAt: new Date().toISOString(),
      }

      const result = await pushToGist(token.value, payload, gistId.value)

      if (result.success) {
        gistId.value = result.gistId ?? gistId.value
        lastSyncTime.value = new Date().toISOString()
        await saveSyncConfig()
        status.value = 'success'
      } else {
        lastError.value = result.message
        status.value = 'error'
      }

      return result
    } catch (err) {
      const msg = `推送失败: ${(err as Error).message}`
      lastError.value = msg
      status.value = 'error'
      return { success: false, message: msg }
    }
  }

  // -------------------- 拉取（Gist → 本地） --------------------
  async function doPull(): Promise<SyncResult> {
    if (!gistId.value) {
      const msg = '未配置 Gist，请先验证 Token'
      lastError.value = msg
      status.value = 'error'
      return { success: false, message: msg }
    }

    status.value = 'pulling'
    lastError.value = null
    try {
      const result = await pullFromGist(token.value, gistId.value)

      if (!result.success) {
        lastError.value = result.message
        status.value = 'error'
        return result
      }

      // 写入 IndexedDB
      const { prompts, categories } = result.data!

      if (categories?.length) {
        await db.categories.clear()
        await db.categories.bulkAdd(categories)
      }

      if (prompts?.length) {
        await db.prompts.clear()
        await db.prompts.bulkAdd(prompts)
      }

      lastSyncTime.value = new Date().toISOString()
      await saveSyncConfig()
      status.value = 'success'

      return result
    } catch (err) {
      const msg = `拉取失败: ${(err as Error).message}`
      lastError.value = msg
      status.value = 'error'
      return { success: false, message: msg }
    }
  }

  // -------------------- 断开同步 --------------------
  async function disconnect(): Promise<void> {
    token.value = ''
    gistId.value = null
    lastSyncTime.value = null
    lastError.value = null
    status.value = 'idle'
    await saveSyncConfig()
  }

  // -------------------- 辅助 --------------------
  const isConfigured = ref(false)
  async function checkConfigured(): Promise<boolean> {
    await loadSyncConfig()
    isConfigured.value = !!token.value
    return isConfigured.value
  }

  return {
    token,
    gistId,
    lastSyncTime,
    lastError,
    status,
    isConfigured,
    loadSyncConfig,
    testToken,
    doPush,
    doPull,
    disconnect,
    checkConfigured,
  }
})

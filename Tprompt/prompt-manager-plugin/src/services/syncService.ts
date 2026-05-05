// ============================================================
// GitHub Gist 同步服务
// ============================================================

const GIST_API = 'https://api.github.com'
const GIST_FILENAME = 'prompt-manager-backup.json'
const GIST_DESCRIPTION = '🧠 Prompt Manager Backup — Auto-synced'

export interface GistSyncPayload {
  prompts: any[]
  categories: any[]
  _version: string
  _syncedAt: string
}

export interface SyncResult {
  success: boolean
  message: string
  gistId?: string
  updatedAt?: string
}

/**
 * 验证 GitHub Personal Access Token 是否有效（需 gist 权限）
 */
export async function validateToken(token: string): Promise<boolean> {
  const res = await fetch(`${GIST_API}/user`, {
    headers: {
      Authorization: `Bearer ${token}`,
      Accept: 'application/vnd.github+json',
    },
  })
  return res.ok
}

/**
 * 获取用户所有 Gists，查找属于本插件的那个
 */
export async function findExistingGist(token: string): Promise<string | null> {
  const res = await fetch(`${GIST_API}/gists`, {
    headers: {
      Authorization: `Bearer ${token}`,
      Accept: 'application/vnd.github+json',
    },
  })
  if (!res.ok) return null

  const gists = await res.json()
  const match = gists.find(
    (g: any) =>
      g.description === GIST_DESCRIPTION &&
      g.files &&
      g.files[GIST_FILENAME]
  )
  return match?.id ?? null
}

/**
 * 创建新的 Gist 用于存储备份
 */
export async function createGist(
  token: string,
  payload: GistSyncPayload
): Promise<SyncResult> {
  const body = {
    description: GIST_DESCRIPTION,
    public: false,
    files: {
      [GIST_FILENAME]: {
        content: JSON.stringify(payload, null, 2),
      },
    },
  }

  const res = await fetch(`${GIST_API}/gists`, {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${token}`,
      Accept: 'application/vnd.github+json',
    },
    body: JSON.stringify(body),
  })

  if (!res.ok) {
    const err = await res.json().catch(() => ({}))
    return {
      success: false,
      message: `创建 Gist 失败: ${err.message ?? res.status}`,
    }
  }

  const gist = await res.json()
  return {
    success: true,
    message: 'Gist 创建成功',
    gistId: gist.id,
    updatedAt: gist.updated_at,
  }
}

/**
 * 更新已有 Gist
 */
export async function updateGist(
  token: string,
  gistId: string,
  payload: GistSyncPayload
): Promise<SyncResult> {
  const body = {
    description: GIST_DESCRIPTION,
    files: {
      [GIST_FILENAME]: {
        content: JSON.stringify(payload, null, 2),
      },
    },
  }

  const res = await fetch(`${GIST_API}/gists/${gistId}`, {
    method: 'PATCH',
    headers: {
      Authorization: `Bearer ${token}`,
      Accept: 'application/vnd.github+json',
    },
    body: JSON.stringify(body),
  })

  if (!res.ok) {
    const err = await res.json().catch(() => ({}))
    return {
      success: false,
      message: `更新 Gist 失败: ${err.message ?? res.status}`,
    }
  }

  const gist = await res.json()
  return {
    success: true,
    message: '同步完成',
    gistId: gist.id,
    updatedAt: gist.updated_at,
  }
}

/**
 * 推送数据到 Gist（自动判断创建/更新）
 */
export async function pushToGist(
  token: string,
  payload: GistSyncPayload,
  existingGistId?: string | null
): Promise<SyncResult> {
  // 如果已有 gistId，直接更新
  if (existingGistId) {
    const result = await updateGist(token, existingGistId, payload)
    if (result.success) return result
    // 更新失败（可能被删除），尝试查找或创建新的
  }

  // 尝试查找已有的
  const foundId = await findExistingGist(token)
  if (foundId) {
    return updateGist(token, foundId, payload)
  }

  // 都没有，创建新的
  return createGist(token, payload)
}

/**
 * 从 Gist 拉取数据
 */
export async function pullFromGist(
  token: string,
  gistId: string
): Promise<SyncResult & { data?: GistSyncPayload }> {
  const res = await fetch(`${GIST_API}/gists/${gistId}`, {
    headers: {
      Authorization: `Bearer ${token}`,
      Accept: 'application/vnd.github+json',
    },
  })

  if (!res.ok) {
    return {
      success: false,
      message: `拉取失败: ${res.status}，请检查 Gist ID 是否正确`,
    }
  }

  const gist = await res.json()
  const file = gist.files?.[GIST_FILENAME]

  if (!file) {
    return {
      success: false,
      message: 'Gist 中未找到备份数据文件',
    }
  }

  try {
    const data = JSON.parse(file.content) as GistSyncPayload
    return {
      success: true,
      message: `拉取成功（${data.prompts?.length ?? 0} 条提示词）`,
      data,
      updatedAt: gist.updated_at,
    }
  } catch {
    return {
      success: false,
      message: '备份数据格式错误',
    }
  }
}

/**
 * 获取 Gist 最后更新时间
 */
export async function getGistInfo(
  token: string,
  gistId: string
): Promise<{ updatedAt: string; fileCount: number } | null> {
  const res = await fetch(`${GIST_API}/gists/${gistId}`, {
    headers: {
      Authorization: `Bearer ${token}`,
      Accept: 'application/vnd.github+json',
    },
  })

  if (!res.ok) return null

  const gist = await res.json()
  return {
    updatedAt: gist.updated_at,
    fileCount: Object.keys(gist.files ?? {}).length,
  }
}

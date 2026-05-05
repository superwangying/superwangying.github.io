<template>
  <div class="settings-view">
    <!-- Header -->
    <div class="settings-view__header">
        <button class="settings-back-btn" @click="$emit('back')">
          <IconRender icon="carbon:arrow-left" :size="18" />
        </button>
      <h2 class="settings-view__title">设置</h2>
      <div class="flex-1"></div>
        <button class="settings-view__stats-btn" @click="$emit('stats')">
          <IconRender icon="carbon:chart-line" :size="16" />
          数据统计
        </button>
    </div>

    <!-- Content -->
    <div class="settings-view__body">
      <!-- 主题 -->
      <section class="settings-section">
        <h3 class="settings-section__title">
          <IconRender icon="carbon:sun" :size="18" />
          外观
        </h3>

        <div class="settings-row">
          <div class="settings-row__info">
            <span class="settings-row__label">字体族</span>
            <span class="settings-row__desc">编辑器中使用的等宽字体</span>
          </div>
            <select
              :value="settingStore.fontFamily"
              class="settings-select"
              @change="settingStore.setFontFamily(($event.target as HTMLSelectElement).value)"
            >
              <option value="system-ui">系统默认</option>
              <option value="'JetBrains Mono', 'Fira Code', Consolas, monospace">JetBrains Mono</option>
              <option value="'Cascadia Code', 'Fira Code', Consolas, monospace">Cascadia Code</option>
              <option value="'Source Code Pro', Consolas, monospace">Source Code Pro</option>
              <option value="Menlo, Monaco, Consolas, monospace">Menlo</option>
            </select>
        </div>

        <div class="settings-row">
          <div class="settings-row__info">
            <span class="settings-row__label">字号档位</span>
            <span class="settings-row__desc">编辑器字体大小</span>
          </div>
          <div class="font-size-control">
            <button class="font-size-btn" @click="adjustFontSize(-1)">
              <IconRender icon="carbon:subtract" :size="14" />
            </button>
            <span class="font-size-value">{{ settingStore.fontSize }}</span>
            <button class="font-size-btn" @click="adjustFontSize(1)">
              <IconRender icon="carbon:add" :size="14" />
            </button>
          </div>
        </div>

        <!-- 字号预览 -->
        <div class="font-preview">
          <label class="font-preview__label">预览</label>
          <textarea
            class="font-preview__area"
            :style="{ fontFamily: settingStore.fontFamily, fontSize: settingStore.fontSize + 'px' }"
            readonly
            value="The quick brown fox jumps over the lazy dog."
            placeholder="预览区..."
          ></textarea>
        </div>
      </section>

      <!-- 快捷键 -->
      <section class="settings-section">
        <h3 class="settings-section__title">
          <IconRender icon="carbon:keyboard" :size="18" />
          快捷键
        </h3>

        <div class="settings-row">
          <div class="settings-row__info">
            <span class="settings-row__label">打开管理器</span>
            <span class="settings-row__desc">全局快捷键，浏览器任意页面可用</span>
          </div>
          <div class="shortcut-badge">
            <kbd>Ctrl</kbd>+<kbd>Shift</kbd>+<kbd>P</kbd>
          </div>
        </div>
      </section>

      <!-- 云同步 -->
      <section class="settings-section">
        <h3 class="settings-section__title">
          <IconRender icon="carbon:cloud-upload" :size="18" />
          云同步
        </h3>

        <!-- 未配置：显示 Token 输入 -->
        <template v-if="!syncStore.isConfigured">
          <div class="sync-info-card">
            <IconRender icon="carbon:cloud-sync" :size="28" class="sync-info-card__icon" />
            <p class="sync-info-card__text">
              通过 GitHub Gist 备份你的提示词数据，支持多设备同步。
            </p>
          </div>

          <div class="sync-token-row">
            <div class="sync-token-input-wrap">
              <input
                v-model="tokenInput"
                class="sync-token-input"
                :type="showToken ? 'text' : 'password'"
                placeholder="ghp_xxxxxxxxxxxx"
                :disabled="syncStore.status === 'validating'"
              />
              <button class="sync-token-toggle" @click="showToken = !showToken" title="显示/隐藏">
                <IconRender :icon="showToken ? 'carbon:view-off' : 'carbon:view'" :size="16" />
              </button>
            </div>
            <button
              class="sync-btn sync-btn--primary magnetic-btn"
              :disabled="!tokenInput.trim() || syncStore.status === 'validating'"
              @click="handleTestToken"
            >
              <IconRender v-if="syncStore.status === 'validating'" icon="carbon:loading" :size="14" style="animation:spin 1s linear infinite" />
              <IconRender v-else icon="carbon:checkmark" :size="14" />
              {{ syncStore.status === 'validating' ? '验证中...' : '验证并连接' }}
            </button>
          </div>

          <div v-if="syncStore.lastError && !syncStore.isConfigured" class="sync-error">
            <IconRender icon="carbon:warning-alt-filled" :size="14" />
            {{ syncStore.lastError }}
          </div>

          <a class="sync-help-link" href="https://github.com/settings/tokens/new?description=Prompt%20Manager%20Sync&scopes=gist" target="_blank" rel="noopener">
            <IconRender icon="carbon:link" :size="13" />
            如何创建 Personal Access Token？
          </a>
        </template>

        <!-- 已配置：显示同步操作 -->
        <template v-else>
          <div class="sync-connected-card">
            <div class="sync-connected-card__status">
              <span class="sync-status-dot"></span>
              <span class="sync-connected-card__label">已连接 GitHub</span>
            </div>
            <div class="sync-connected-card__meta">
              <span v-if="syncStore.lastSyncTime" class="sync-meta-item">
                <IconRender icon="carbon:time" :size="13" />
                上次同步: {{ formatSyncTime(syncStore.lastSyncTime) }}
              </span>
              <span v-if="syncStore.gistId" class="sync-meta-item">
                <IconRender icon="carbon:document" :size="13" />
                Gist: {{ syncStore.gistId.slice(0, 8) }}...
              </span>
            </div>
          </div>

          <div class="sync-actions">
            <button
              class="sync-btn sync-btn--push magnetic-btn"
              :disabled="syncStore.status === 'pushing' || syncStore.status === 'pulling'"
              @click="handlePush"
            >
              <IconRender v-if="syncStore.status === 'pushing'" icon="carbon:loading" :size="14" style="animation:spin 1s linear infinite" />
              <IconRender v-else icon="carbon:cloud-upload" :size="14" />
              {{ syncStore.status === 'pushing' ? '上传中...' : '上传到云端' }}
            </button>
            <button
              class="sync-btn sync-btn--pull magnetic-btn"
              :disabled="syncStore.status === 'pushing' || syncStore.status === 'pulling'"
              @click="handlePull"
            >
              <IconRender v-if="syncStore.status === 'pulling'" icon="carbon:loading" :size="14" style="animation:spin 1s linear infinite" />
              <IconRender v-else icon="carbon:cloud-download" :size="14" />
              {{ syncStore.status === 'pulling' ? '下载中...' : '从云端恢复' }}
            </button>
          </div>

          <!-- 同步结果提示 -->
          <div v-if="syncStore.status === 'success' && syncSuccessMsg" class="sync-success">
            <IconRender icon="carbon:checkmark-filled" :size="14" />
            {{ syncSuccessMsg }}
          </div>
          <div v-if="syncStore.lastError && syncStore.isConfigured" class="sync-error">
            <IconRender icon="carbon:warning-alt-filled" :size="14" />
            {{ syncStore.lastError }}
          </div>

          <div class="sync-warning">
            <IconRender icon="carbon:warning" :size="13" />
            <span>「从云端恢复」会用云端数据<strong>完全覆盖</strong>本地数据，请谨慎操作。</span>
          </div>

          <button class="sync-disconnect-btn" @click="handleDisconnect">
            <IconRender icon="carbon:disconnect" :size="13" />
            断开同步
          </button>
        </template>
      </section>

      <!-- 数据 -->
      <section class="settings-section">
        <h3 class="settings-section__title">
          <IconRender icon="carbon:database" :size="18" />
          数据
        </h3>

        <div class="settings-row">
          <div class="settings-row__info">
            <span class="settings-row__label">提示词数量</span>
            <span class="settings-row__desc">当前库中的提示词总数</span>
          </div>
          <span class="settings-row__value">{{ stats.prompts }}</span>
        </div>

        <div class="settings-row">
          <div class="settings-row__info">
            <span class="settings-row__label">分类数量</span>
            <span class="settings-row__desc">当前分类总数</span>
          </div>
          <span class="settings-row__value">{{ stats.categories }}</span>
        </div>

        <div class="settings-row">
          <div class="settings-row__info">
            <span class="settings-row__label">数据库版本</span>
            <span class="settings-row__desc">当前数据库结构版本</span>
          </div>
          <span class="settings-row__value">v2.0</span>
        </div>
      </section>

      <!-- 关于 -->
      <section class="settings-section">
        <h3 class="settings-section__title">
          <IconRender icon="carbon:information" :size="18" />
          关于
        </h3>

        <div class="about-card">
          <div class="about-card__logo logo-icon">
            <svg width="28" height="28" viewBox="0 0 22 22" fill="none">
              <rect x="2" y="2" width="18" height="3" rx="1.5" fill="white" opacity="0.9"/>
              <rect x="2" y="8" width="14" height="2.5" rx="1.25" fill="white" opacity="0.7"/>
              <rect x="2" y="13" width="16" height="2.5" rx="1.25" fill="white" opacity="0.7"/>
              <rect x="2" y="18" width="10" height="2.5" rx="1.25" fill="white" opacity="0.5"/>
            </svg>
          </div>
          <div class="about-card__info">
            <h4 class="about-card__name">提示词管理器</h4>
            <p class="about-card__version">Version 1.0.0 · Manifest V3</p>
            <p class="about-card__desc">本地提示词管理浏览器插件，安全、快速、离线可用</p>
          </div>
        </div>

        <div class="about-links">
          <a href="#" class="about-link" @click.prevent="openGithub">
            <IconRender icon="carbon:logo-github" :size="16" />
            GitHub
          </a>
          <a href="#" class="about-link" @click.prevent="openDocs">
            <IconRender icon="carbon:book" :size="16" />
            文档
          </a>
        </div>
      </section>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted, watch } from 'vue'
import { usePromptStore } from '@/stores/promptStore'
import { useCategoryStore } from '@/stores/categoryStore'
import { useSettingStore } from '@/stores/settingStore'
import { useSyncStore } from '@/stores/syncStore'
import { useToast } from '@/composables/useToast'

defineEmits<{
  back: []
  stats: []
}>()

const promptStore = usePromptStore()
const categoryStore = useCategoryStore()
const settingStore = useSettingStore()
const syncStore = useSyncStore()
const toast = useToast()

// ===== 统计 =====
const stats = computed(() => ({
  prompts: promptStore.prompts.length,
  categories: categoryStore.categories.length,
}))

// ===== 字体调节 =====
function adjustFontSize(delta: number) {
  settingStore.setFontSize(settingStore.fontSize + delta)
}

// ===== 链接 =====
function openGithub() {
  window.open('https://github.com')
}

function openDocs() {
  window.open('https://github.com')
}

// ===== 云同步 =====
const tokenInput = ref('')
const showToken = ref(false)
const syncSuccessMsg = ref('')

// 初始化时加载同步配置
onMounted(async () => {
  await syncStore.checkConfigured()
})

// 监听同步状态变化
watch(() => syncStore.status, (val) => {
  if (val === 'success') {
    // 2秒后清除成功提示
    setTimeout(() => { syncSuccessMsg.value = '' }, 3000)
  }
})

async function handleTestToken() {
  const t = tokenInput.value.trim()
  if (!t) return
  const ok = await syncStore.testToken(t)
  if (ok) {
    toast.success('已连接 GitHub，可以开始同步')
    tokenInput.value = ''
  }
}

async function handlePush() {
  const result = await syncStore.doPush()
  if (result.success) {
    syncSuccessMsg.value = result.message
    toast.success(result.message)
  } else {
    toast.error(result.message)
  }
}

async function handlePull() {
  const result = await syncStore.doPull()
  if (result.success) {
    syncSuccessMsg.value = result.message
    toast.success(result.message)
    // 刷新本地数据
    await categoryStore.loadCategories()
    await promptStore.loadPrompts()
  } else {
    toast.error(result.message)
  }
}

async function handleDisconnect() {
  if (!confirm('确定要断开云同步吗？云端数据不会被删除。')) return
  await syncStore.disconnect()
  toast.info('已断开云同步')
}

function formatSyncTime(iso: string): string {
  try {
    const d = new Date(iso)
    const now = new Date()
    const diffMs = now.getTime() - d.getTime()
    const diffMin = Math.floor(diffMs / 60000)

    if (diffMin < 1) return '刚刚'
    if (diffMin < 60) return `${diffMin} 分钟前`
    const diffHr = Math.floor(diffMin / 60)
    if (diffHr < 24) return `${diffHr} 小时前`
    const diffDay = Math.floor(diffHr / 24)
    if (diffDay < 7) return `${diffDay} 天前`
    return d.toLocaleDateString('zh-CN', { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' })
  } catch {
    return iso
  }
}
</script>

<style scoped>
.settings-view {
  display: flex;
  flex-direction: column;
  height: 100%;
  overflow: hidden;
}

.settings-view__header {
  display: flex;
  align-items: center;
  gap: 12px;
  padding: 16px 24px;
  border-bottom: 1px solid var(--border-color);
  background: var(--bg-surface);
  flex-shrink: 0;
}

.settings-back-btn {
  width: 34px;
  height: 34px;
  display: flex;
  align-items: center;
  justify-content: center;
  border-radius: var(--radius-md);
  font-size: 18px;
  color: var(--text-secondary);
  transition: background var(--transition-fast), color var(--transition-fast);
}
.settings-back-btn:hover { background: var(--gray-100); color: var(--text-primary); }

.settings-view__title {
  font-size: var(--text-lg);
  font-weight: 600;
  color: var(--text-primary);
}

.settings-view__stats-btn {
  display: inline-flex;
  align-items: center;
  gap: 6px;
  padding: 7px 14px;
  border-radius: var(--radius-md);
  font-size: var(--text-sm);
  font-weight: 500;
  color: var(--primary-700);
  background: var(--primary-50);
  border: 1.5px solid var(--primary-200);
  transition: all var(--transition-fast);
}
.settings-view__stats-btn:hover { background: var(--primary-100); border-color: var(--primary-300); }
.settings-view__stats-btn svg { width: 16px; height: 16px; }

.settings-view__body {
  flex: 1;
  overflow-y: auto;
  padding: 20px 24px;
  display: flex;
  flex-direction: column;
  gap: 28px;
}

/* Section */
.settings-section {
  display: flex;
  flex-direction: column;
  gap: 14px;
}

.settings-section__title {
  display: flex;
  align-items: center;
  gap: 8px;
  font-size: var(--text-base);
  font-weight: 600;
  color: var(--text-primary);
  padding-bottom: 10px;
  border-bottom: 1px solid var(--border-color);
}

.settings-section__title svg { color: var(--primary-600); width: 18px; height: 18px; }

/* Row */
.settings-row {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 16px;
  padding: 12px 16px;
  background: var(--bg-surface);
  border: 1px solid var(--border-color);
  border-radius: var(--radius-md);
}

.settings-row__info {
  display: flex;
  flex-direction: column;
  gap: 2px;
}

.settings-row__label {
  font-size: var(--text-sm);
  font-weight: 500;
  color: var(--text-primary);
}

.settings-row__desc {
  font-size: 12px;
  color: var(--text-muted);
}

.settings-row__value {
  font-size: var(--text-base);
  font-weight: 600;
  color: var(--primary-600);
}

/* Select */
.settings-select {
  padding: 7px 12px;
  border: 1.5px solid var(--border-color);
  border-radius: var(--radius-md);
  font-size: var(--text-sm);
  color: var(--text-primary);
  background: var(--bg-surface);
  cursor: pointer;
  transition: border-color var(--transition-fast);
  min-width: 180px;
}
.settings-select:focus { outline: none; border-color: var(--primary-500); }

/* Font size control */
.font-size-control {
  display: flex;
  align-items: center;
  gap: 8px;
  background: var(--gray-100);
  border: 1px solid var(--border-color);
  border-radius: var(--radius-md);
  padding: 4px;
}

.font-size-btn {
  width: 30px;
  height: 30px;
  display: flex;
  align-items: center;
  justify-content: center;
  border-radius: var(--radius-sm);
  font-size: 16px;
  color: var(--text-secondary);
  transition: all var(--transition-fast);
}
.font-size-btn:hover { background: var(--gray-200); color: var(--text-primary); }

.font-size-value {
  font-size: var(--text-base);
  font-weight: 600;
  color: var(--text-primary);
  min-width: 28px;
  text-align: center;
}

/* Font preview */
.font-preview {
  display: flex;
  flex-direction: column;
  gap: 6px;
  padding: 12px 16px;
  background: var(--bg-surface);
  border: 1px solid var(--border-color);
  border-radius: var(--radius-md);
}

.font-preview__label {
  font-size: 12px;
  color: var(--text-muted);
}

.font-preview__area {
  width: 100%;
  padding: 10px 12px;
  background: var(--gray-50);
  border: 1px solid var(--border-color);
  border-radius: var(--radius-sm);
  font-size: 14px;
  line-height: 1.6;
  color: var(--text-primary);
  resize: none;
  height: 72px;
}

/* Shortcut badge */
.shortcut-badge {
  display: inline-flex;
  align-items: center;
  gap: 3px;
  font-size: var(--text-sm);
  color: var(--text-secondary);
}

.shortcut-badge kbd {
  padding: 3px 8px;
  background: var(--gray-100);
  border: 1px solid var(--gray-200);
  border-radius: 4px;
  font-size: 11px;
  font-family: var(--font-mono);
  color: var(--text-primary);
}

/* About */
.about-card {
  display: flex;
  align-items: center;
  gap: 16px;
  padding: 20px;
  background: var(--bg-surface);
  border: 1px solid var(--border-color);
  border-radius: var(--radius-lg);
}

.about-card__logo {
  width: 56px;
  height: 56px;
  display: flex;
  align-items: center;
  justify-content: center;
  flex-shrink: 0;
}

.about-card__info { display: flex; flex-direction: column; gap: 4px; }

.about-card__name {
  font-size: var(--text-lg);
  font-weight: 700;
  color: var(--text-primary);
}

.about-card__version {
  font-size: 12px;
  color: var(--text-muted);
  font-family: var(--font-mono);
}

.about-card__desc {
  font-size: var(--text-sm);
  color: var(--text-secondary);
  margin-top: 4px;
}

.about-links {
  display: flex;
  gap: 12px;
}

.about-link {
  display: inline-flex;
  align-items: center;
  gap: 6px;
  padding: 8px 14px;
  border: 1.5px solid var(--border-color);
  border-radius: var(--radius-md);
  font-size: var(--text-sm);
  color: var(--text-secondary);
  transition: all var(--transition-fast);
}
.about-link:hover {
  border-color: var(--primary-400);
  color: var(--primary-600);
  background: var(--primary-50);
  text-decoration: none;
}

/* ---- Cloud Sync ---- */
.sync-info-card {
  display: flex;
  align-items: center;
  gap: 14px;
  padding: 16px 18px;
  background: var(--primary-50);
  border: 1.5px solid var(--primary-200);
  border-radius: var(--radius-lg);
}

.sync-info-card__icon {
  color: var(--primary-600);
  flex-shrink: 0;
}

.sync-info-card__text {
  font-size: var(--text-sm);
  color: var(--primary-700);
  line-height: 1.6;
}

.sync-token-row {
  display: flex;
  gap: 10px;
  align-items: stretch;
}

.sync-token-input-wrap {
  flex: 1;
  position: relative;
  display: flex;
  align-items: center;
}

.sync-token-input {
  width: 100%;
  padding: 9px 36px 9px 14px;
  border: 1.5px solid var(--border-color);
  border-radius: var(--radius-md);
  font-size: var(--text-sm);
  font-family: var(--font-mono);
  color: var(--text-primary);
  background: var(--bg-surface);
  transition: border-color var(--transition-fast), box-shadow var(--transition-fast);
}

.sync-token-input:focus {
  outline: none;
  border-color: var(--primary-500);
  box-shadow: var(--shadow-focus);
}

.sync-token-input:disabled {
  opacity: 0.5;
}

.sync-token-toggle {
  position: absolute;
  right: 8px;
  width: 28px;
  height: 28px;
  display: flex;
  align-items: center;
  justify-content: center;
  color: var(--text-muted);
  border-radius: var(--radius-sm);
  transition: color var(--transition-fast);
}
.sync-token-toggle:hover { color: var(--text-primary); }

.sync-btn {
  display: inline-flex;
  align-items: center;
  gap: 6px;
  padding: 9px 18px;
  border-radius: var(--radius-md);
  font-size: var(--text-sm);
  font-weight: 500;
  transition: all var(--transition-base);
  white-space: nowrap;
  flex-shrink: 0;
}

.sync-btn--primary {
  background: var(--primary-600);
  color: #fff;
  border: none;
  box-shadow: var(--shadow-sm);
}
.sync-btn--primary:hover:not(:disabled) { background: var(--primary-700); }
.sync-btn--primary:disabled { opacity: 0.5; cursor: not-allowed; }

.sync-btn--push {
  background: var(--primary-600);
  color: #fff;
  border: none;
}
.sync-btn--push:hover:not(:disabled) { background: var(--primary-700); }

.sync-btn--pull {
  background: var(--bg-surface);
  color: var(--text-primary);
  border: 1.5px solid var(--border-color);
}
.sync-btn--pull:hover:not(:disabled) {
  border-color: var(--primary-400);
  color: var(--primary-600);
}

.sync-btn:disabled { opacity: 0.5; cursor: not-allowed; }

.sync-help-link {
  display: inline-flex;
  align-items: center;
  gap: 4px;
  font-size: 12px;
  color: var(--primary-600);
  transition: color var(--transition-fast);
}
.sync-help-link:hover { color: var(--primary-700); text-decoration: underline; }

.sync-connected-card {
  padding: 16px 18px;
  background: var(--bg-surface);
  border: 1.5px solid var(--border-color);
  border-radius: var(--radius-lg);
  display: flex;
  flex-direction: column;
  gap: 10px;
}

.sync-connected-card__status {
  display: flex;
  align-items: center;
  gap: 8px;
}

.sync-status-dot {
  width: 8px;
  height: 8px;
  border-radius: 50%;
  background: #22c55e;
  box-shadow: 0 0 0 2px rgba(34, 197, 94, 0.2);
  animation: pulse-dot 2s ease-in-out infinite;
}

@keyframes pulse-dot {
  0%, 100% { box-shadow: 0 0 0 2px rgba(34, 197, 94, 0.2); }
  50% { box-shadow: 0 0 0 5px rgba(34, 197, 94, 0.08); }
}

.sync-connected-card__label {
  font-size: var(--text-sm);
  font-weight: 600;
  color: var(--text-primary);
}

.sync-connected-card__meta {
  display: flex;
  gap: 16px;
  flex-wrap: wrap;
}

.sync-meta-item {
  display: inline-flex;
  align-items: center;
  gap: 4px;
  font-size: 12px;
  color: var(--text-muted);
}

.sync-actions {
  display: flex;
  gap: 10px;
}

.sync-success {
  display: flex;
  align-items: center;
  gap: 6px;
  padding: 10px 14px;
  background: rgba(34, 197, 94, 0.08);
  border: 1px solid rgba(34, 197, 94, 0.2);
  border-radius: var(--radius-md);
  font-size: var(--text-sm);
  color: #16a34a;
}

.sync-error {
  display: flex;
  align-items: center;
  gap: 6px;
  padding: 10px 14px;
  background: rgba(239, 68, 68, 0.06);
  border: 1px solid rgba(239, 68, 68, 0.15);
  border-radius: var(--radius-md);
  font-size: var(--text-sm);
  color: var(--color-error);
}

.sync-warning {
  display: flex;
  align-items: flex-start;
  gap: 6px;
  padding: 10px 14px;
  background: rgba(234, 179, 8, 0.06);
  border: 1px solid rgba(234, 179, 8, 0.15);
  border-radius: var(--radius-md);
  font-size: 12px;
  color: var(--text-secondary);
  line-height: 1.5;
}

.sync-disconnect-btn {
  display: inline-flex;
  align-items: center;
  gap: 4px;
  padding: 6px 12px;
  font-size: 12px;
  color: var(--text-muted);
  transition: color var(--transition-fast);
}
.sync-disconnect-btn:hover { color: var(--color-error); }

/* 暗色模式补充 */
[data-theme='dark'] .sync-info-card {
  background: rgba(99, 102, 241, 0.08);
  border-color: rgba(99, 102, 241, 0.2);
}
[data-theme='dark'] .sync-info-card__text { color: var(--text-secondary); }
[data-theme='dark'] .sync-token-input {
  background: rgba(255, 255, 255, 0.04);
  border-color: rgba(255, 255, 255, 0.1);
}
[data-theme='dark'] .sync-success {
  background: rgba(34, 197, 94, 0.08);
  border-color: rgba(34, 197, 94, 0.15);
}
[data-theme='dark'] .sync-warning {
  background: rgba(234, 179, 8, 0.06);
}

@keyframes spin {
  from { transform: rotate(0deg); }
  to { transform: rotate(360deg); }
}
</style>

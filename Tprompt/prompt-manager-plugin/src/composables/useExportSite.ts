/**
 * useExportSite - 导出为静态 HTML 站点的 composable
 * 生成可离线访问的移动端友好提示词库
 */
import { db } from '@/db/schema'
import type { Prompt, Category } from '@/types'

export interface SiteExportOptions {
  /** 导出范围 */
  scope?: 'all' | 'favorites'
  /** 是否包含 PWA 支持（manifest.json + service worker） */
  includePWA?: boolean
}

/** 下载文件通用函数 */
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

/** 将 feather 图标名转换为 emoji */
function iconToEmoji(icon: string): string {
  const iconToEmoji: Record<string, string> = {
    'feather:folder': '📁',
    'feather:zap': '💡',
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
    'feather:hexagon': '💎',
    'feather:command': '🎮',
    'feather:music': '🎵',
    'feather:camera': '📷',
    'feather:cloud': '🌈',
    'feather:globe': '🔮',
    'feather:cpu': '🧠',
    'feather:heart': '🌺',
    'feather:inbox': '📭',
  }
  if (icon.startsWith('feather:')) {
    return iconToEmoji[icon] || '📋'
  }
  if (icon.length <= 4 && !icon.includes(':')) {
    return icon
  }
  return '📋'
}

/**
 * 生成静态站点的 HTML
 */
export function generateSiteHTML(prompts: Prompt[], categories: Category[]): string {
  // 构建分类映射
  const categoryMap = new Map<string, Category>()
  categories.forEach(c => categoryMap.set(c.id, c))

  // 按分类分组
  const groupedPrompts = new Map<string, Prompt[]>()
  prompts.forEach(p => {
    const catId = p.categoryId || '__uncategorized__'
    if (!groupedPrompts.has(catId)) {
      groupedPrompts.set(catId, [])
    }
    groupedPrompts.get(catId)!.push(p)
  })

  // 构建提示词数据（内联到页面中）
  const promptsJSON = JSON.stringify(prompts.map(p => ({
    id: p.id,
    title: p.title,
    content: p.content,
    categoryId: p.categoryId,
    tags: p.tags || [],
    isFavorite: p.isFavorite,
    usageCount: p.usageCount,
  })))

  // 构建分类数据
  const categoriesJSON = JSON.stringify(categories.map(c => ({
    id: c.id,
    name: c.name,
    emoji: c.emoji,
    color: c.color,
  })))

  // 生成 HTML
  return `<!DOCTYPE html>
<html lang="zh-CN">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0, maximum-scale=1.0, user-scalable=no">
  <meta name="theme-color" content="#6366f1">
  <meta name="description" content="提示词管理器 - 移动端快速访问">
  <title>提示词管理器</title>
  
  <!-- PWA -->
  <link rel="manifest" href="manifest.json">
  <link rel="apple-touch-icon" href="icon-192.png">
  
  <!-- 样式 -->
  <style>
    /* ===== CSS 变量 ===== */
    :root {
      --primary-50: #eef2ff;
      --primary-100: #e0e7ff;
      --primary-500: #6366f1;
      --primary-600: #4f46e5;
      --primary-700: #4338ca;
      --gray-50: #f9fafb;
      --gray-100: #f3f4f6;
      --gray-200: #e5e7eb;
      --gray-300: #d1d5db;
      --gray-400: #9ca3af;
      --gray-500: #6b7280;
      --gray-600: #4b5563;
      --gray-700: #374151;
      --gray-800: #1f2937;
      --gray-900: #111827;
      --success: #10b981;
      --bg: var(--gray-50);
      --surface: #ffffff;
      --border: var(--gray-200);
      --text: var(--gray-900);
      --text-secondary: var(--gray-500);
      --text-muted: var(--gray-400);
      --shadow: 0 1px 3px rgba(0,0,0,0.1);
      --shadow-lg: 0 10px 15px -3px rgba(0,0,0,0.1);
      --radius: 12px;
      --radius-sm: 8px;
    }
    
    [data-theme="dark"] {
      --bg: #0f172a;
      --surface: var(--gray-800);
      --border: var(--gray-700);
      --text: #f1f5f9;
      --text-secondary: var(--gray-400);
      --text-muted: var(--gray-500);
      --shadow: 0 1px 3px rgba(0,0,0,0.3);
      --shadow-lg: 0 10px 15px -3px rgba(0,0,0,0.4);
    }
    
    /* ===== 基础重置 ===== */
    * { box-sizing: border-box; margin: 0; padding: 0; }
    html {
      font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
      font-size: 14px;
      background: var(--bg);
      color: var(--text);
      -webkit-font-smoothing: antialiased;
      scroll-behavior: smooth;
    }
    body { min-height: 100vh; }
    
    /* ===== 主题过渡 ===== */
    html, body, .app { transition: background 300ms, color 300ms; }
    
    /* ===== 滚动条 ===== */
    ::-webkit-scrollbar { width: 6px; height: 6px; }
    ::-webkit-scrollbar-thumb { background: var(--gray-300); border-radius: 999px; }
    [data-theme="dark"] ::-webkit-scrollbar-thumb { background: var(--gray-600); }
    
    /* ===== App 容器 ===== */
    .app {
      max-width: 640px;
      margin: 0 auto;
      min-height: 100vh;
      background: var(--bg);
    }
    
    /* ===== 头部 ===== */
    .header {
      position: sticky;
      top: 0;
      z-index: 100;
      background: var(--surface);
      border-bottom: 1px solid var(--border);
      padding: 12px 16px;
      backdrop-filter: blur(10px);
    }
    
    .header__title {
      font-size: 18px;
      font-weight: 700;
      color: var(--primary-600);
      margin-bottom: 12px;
      display: flex;
      align-items: center;
      gap: 8px;
    }
    
    /* ===== 搜索框 ===== */
    .search-box {
      position: relative;
    }
    
    .search-box__input {
      width: 100%;
      padding: 10px 16px 10px 40px;
      font-size: 14px;
      background: var(--gray-100);
      border: 1.5px solid transparent;
      border-radius: var(--radius);
      color: var(--text);
      transition: all 200ms;
    }
    
    .search-box__input:focus {
      outline: none;
      border-color: var(--primary-500);
      background: var(--surface);
      box-shadow: 0 0 0 3px rgba(99, 102, 241, 0.15);
    }
    
    .search-box__icon {
      position: absolute;
      left: 12px;
      top: 50%;
      transform: translateY(-50%);
      color: var(--text-muted);
      font-size: 16px;
    }
    
    /* ===== 分类标签栏 ===== */
    .categories {
      display: flex;
      gap: 8px;
      padding: 12px 16px;
      overflow-x: auto;
      -webkit-overflow-scrolling: touch;
      scrollbar-width: none;
    }
    .categories::-webkit-scrollbar { display: none; }
    
    .category-chip {
      flex-shrink: 0;
      padding: 6px 14px;
      font-size: 13px;
      font-weight: 500;
      background: var(--gray-100);
      border: 1.5px solid var(--border);
      border-radius: 999px;
      color: var(--text-secondary);
      cursor: pointer;
      transition: all 150ms;
    }
    
    .category-chip:hover {
      border-color: var(--primary-400);
      color: var(--primary-600);
    }
    
    .category-chip.active {
      background: var(--primary-100);
      border-color: var(--primary-500);
      color: var(--primary-700);
    }
    
    /* ===== 提示词列表 ===== */
    .prompt-list {
      padding: 0 16px 24px;
      display: flex;
      flex-direction: column;
      gap: 12px;
    }
    
    /* ===== 提示词卡片 ===== */
    .prompt-card {
      background: var(--surface);
      border: 1px solid var(--border);
      border-radius: var(--radius);
      padding: 16px;
      transition: all 200ms;
    }
    
    .prompt-card:hover {
      border-color: var(--primary-300);
      box-shadow: var(--shadow);
      transform: translateY(-1px);
    }
    
    .prompt-card__header {
      display: flex;
      align-items: flex-start;
      justify-content: space-between;
      gap: 12px;
      margin-bottom: 8px;
    }
    
    .prompt-card__title {
      font-size: 15px;
      font-weight: 600;
      color: var(--text);
      line-height: 1.4;
    }
    
    .prompt-card__badge {
      flex-shrink: 0;
      font-size: 12px;
      color: var(--text-muted);
    }
    
    .prompt-card__content {
      font-size: 13px;
      color: var(--text-secondary);
      line-height: 1.6;
      margin-bottom: 12px;
      display: -webkit-box;
      -webkit-line-clamp: 3;
      -webkit-box-orient: vertical;
      overflow: hidden;
    }
    
    .prompt-card__footer {
      display: flex;
      align-items: center;
      justify-content: space-between;
      gap: 12px;
    }
    
    .prompt-card__tags {
      display: flex;
      flex-wrap: wrap;
      gap: 6px;
      flex: 1;
      overflow: hidden;
    }
    
    .tag {
      padding: 2px 8px;
      font-size: 11px;
      background: var(--primary-50);
      color: var(--primary-600);
      border-radius: 999px;
    }
    
    [data-theme="dark"] .tag {
      background: rgba(99, 102, 241, 0.15);
      color: var(--primary-300);
    }
    
    .copy-btn {
      flex-shrink: 0;
      padding: 6px 14px;
      font-size: 12px;
      font-weight: 500;
      background: var(--primary-600);
      color: white;
      border: none;
      border-radius: var(--radius-sm);
      cursor: pointer;
      transition: all 150ms;
    }
    
    .copy-btn:hover {
      background: var(--primary-700);
    }
    
    .copy-btn:active {
      transform: scale(0.95);
    }
    
    .copy-btn.copied {
      background: var(--success);
    }
    
    /* ===== 空状态 ===== */
    .empty {
      padding: 48px 24px;
      text-align: center;
      color: var(--text-muted);
    }
    
    .empty__icon { font-size: 48px; margin-bottom: 16px; }
    .empty__text { font-size: 14px; }
    
    /* ===== Toast ===== */
    .toast {
      position: fixed;
      bottom: 24px;
      left: 50%;
      transform: translateX(-50%) translateY(100px);
      padding: 12px 24px;
      background: var(--gray-800);
      color: white;
      border-radius: var(--radius);
      font-size: 13px;
      font-weight: 500;
      box-shadow: var(--shadow-lg);
      opacity: 0;
      transition: all 300ms cubic-bezier(0.16, 1, 0.3, 1);
      z-index: 9999;
    }
    
    .toast.show {
      transform: translateX(-50%) translateY(0);
      opacity: 1;
    }
    
    /* ===== 暗色切换 ===== */
    .theme-toggle {
      position: fixed;
      top: 12px;
      right: 12px;
      width: 36px;
      height: 36px;
      display: flex;
      align-items: center;
      justify-content: center;
      background: var(--surface);
      border: 1px solid var(--border);
      border-radius: 50%;
      cursor: pointer;
      font-size: 16px;
      z-index: 101;
      transition: all 150ms;
    }
    
    .theme-toggle:hover {
      background: var(--gray-100);
    }
    
    /* ===== 搜索高亮 ===== */
    .highlight {
      background: rgba(99, 102, 241, 0.2);
      color: var(--primary-700);
      border-radius: 2px;
      padding: 0 2px;
    }
    
    [data-theme="dark"] .highlight {
      background: rgba(99, 102, 241, 0.3);
      color: var(--primary-300);
    }
  </style>
</head>
<body>
  <div class="app" id="app">
    <!-- 暗色切换 -->
    <button class="theme-toggle" id="themeToggle" title="切换主题">🌙</button>
    
    <!-- 头部 -->
    <header class="header">
      <h1 class="header__title">
        <span>📝</span> 提示词管理器
      </h1>
      <div class="search-box">
        <span class="search-box__icon">🔍</span>
        <input 
          type="search" 
          class="search-box__input" 
          id="searchInput" 
          placeholder="搜索提示词..."
          autocomplete="off"
        >
      </div>
    </header>
    
    <!-- 分类标签 -->
    <nav class="categories" id="categories"></nav>
    
    <!-- 提示词列表 -->
    <main class="prompt-list" id="promptList"></main>
    
    <!-- Toast -->
    <div class="toast" id="toast"></div>
  </div>

  <!-- 数据内联 -->
  <script>
    // 内联数据
    const PROMPTS = ${promptsJSON};
    const CATEGORIES = ${categoriesJSON};
    
    // 状态
    let currentCategory = '__all__';
    let searchQuery = '';
    
    // DOM
    const app = document.getElementById('app');
    const searchInput = document.getElementById('searchInput');
    const categoriesEl = document.getElementById('categories');
    const promptListEl = document.getElementById('promptList');
    const toastEl = document.getElementById('toast');
    const themeToggle = document.getElementById('themeToggle');
    
    // ===== 主题切换 =====
    function initTheme() {
      const saved = localStorage.getItem('site-theme');
      const prefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
      const isDark = saved ? saved === 'dark' : prefersDark;
      setTheme(isDark);
    }
    
    function setTheme(isDark) {
      document.documentElement.setAttribute('data-theme', isDark ? 'dark' : 'light');
      themeToggle.textContent = isDark ? '☀️' : '🌙';
      localStorage.setItem('site-theme', isDark ? 'dark' : 'light');
    }
    
    themeToggle.addEventListener('click', () => {
      const isDark = document.documentElement.getAttribute('data-theme') === 'dark';
      setTheme(!isDark);
    });
    
    initTheme();
    
    // ===== 渲染分类 =====
    function renderCategories() {
      const allPrompts = currentCategory === '__all__' ? PROMPTS 
        : currentCategory === '__favorites__' ? PROMPTS.filter(p => p.isFavorite)
        : PROMPTS.filter(p => p.categoryId === currentCategory);
      
      const counts = { '__all__': PROMPTS.length, '__favorites__': PROMPTS.filter(p => p.isFavorite).length };
      CATEGORIES.forEach(c => {
        counts[c.id] = PROMPTS.filter(p => p.categoryId === c.id).length;
      });
      
      const chips = [
        { id: '__all__', name: '全部', emoji: '📋', count: counts['__all__'] },
        { id: '__favorites__', name: '收藏', emoji: '⭐', count: counts['__favorites__'] },
        ...CATEGORIES.map(c => ({ id: c.id, name: c.name, emoji: iconToEmoji(c.emoji), count: counts[c.id] || 0 }))
      ].filter(c => c.count > 0 || c.id === '__all__');
      
      categoriesEl.innerHTML = chips.map(c => \`
        <button 
          class="category-chip \${currentCategory === c.id ? 'active' : ''}"
          data-id="\${c.id}"
        >
          \${c.emoji} \${c.name} (\${c.count})
        </button>
      \`).join('');
      
      categoriesEl.querySelectorAll('.category-chip').forEach(btn => {
        btn.addEventListener('click', () => {
          currentCategory = btn.dataset.id;
          renderCategories();
          renderPrompts();
        });
      });
    }
    
    // ===== 过滤提示词 =====
    function getFilteredPrompts() {
      let list = PROMPTS;
      
      // 分类过滤
      if (currentCategory === '__favorites__') {
        list = list.filter(p => p.isFavorite);
      } else if (currentCategory !== '__all__') {
        list = list.filter(p => p.categoryId === currentCategory);
      }
      
      // 搜索过滤
      if (searchQuery) {
        const q = searchQuery.toLowerCase();
        list = list.filter(p => 
          p.title.toLowerCase().includes(q) ||
          p.content.toLowerCase().includes(q) ||
          (p.tags || []).some(t => t.toLowerCase().includes(q))
        );
      }
      
      return list;
    }
    
    // ===== 渲染提示词 =====
    function renderPrompts() {
      const prompts = getFilteredPrompts();
      
      if (prompts.length === 0) {
        promptListEl.innerHTML = \`
          <div class="empty">
            <div class="empty__icon">🔍</div>
            <p class="empty__text">\${searchQuery ? '没有找到匹配的提示词' : '暂无提示词'}</p>
          </div>
        \`;
        return;
      }
      
      promptListEl.innerHTML = prompts.map(p => {
        const cat = CATEGORIES.find(c => c.id === p.categoryId);
        const title = searchQuery ? highlightText(p.title, searchQuery) : p.title;
        const content = searchQuery ? highlightText(truncate(p.content, 150), searchQuery) : truncate(p.content, 150);
        const tags = (p.tags || []).slice(0, 3).map(t => \`<span class="tag">#\${t}</span>\`).join('');
        
        return \`
          <article class="prompt-card" data-id="\${p.id}">
            <div class="prompt-card__header">
              <h3 class="prompt-card__title">\${title}</h3>
              <span class="prompt-card__badge">
                \${cat ? iconToEmoji(cat.emoji) + ' ' + cat.name : ''}
                \${p.isFavorite ? ' ⭐' : ''}
              </span>
            </div>
            <p class="prompt-card__content">\${content}</p>
            <div class="prompt-card__footer">
              <div class="prompt-card__tags">\${tags}</div>
              <button class="copy-btn" data-content="\${escapeHtml(p.content)}">
                📋 复制
              </button>
            </div>
          </article>
        \`;
      }).join('');
      
      // 绑定复制按钮
      promptListEl.querySelectorAll('.copy-btn').forEach(btn => {
        btn.addEventListener('click', () => copyPrompt(btn));
      });
    }
    
    // ===== 复制功能 =====
    async function copyPrompt(btn) {
      const content = btn.dataset.content || btn.closest('.prompt-card').querySelector('.prompt-card__content')?.textContent || '';
      
      try {
        await navigator.clipboard.writeText(unescapeHtml(content));
        btn.textContent = '✓ 已复制';
        btn.classList.add('copied');
        showToast('已复制到剪贴板');
        
        setTimeout(() => {
          btn.textContent = '📋 复制';
          btn.classList.remove('copied');
        }, 2000);
      } catch (e) {
        showToast('复制失败，请手动选择内容');
      }
    }
    
    // ===== Toast =====
    function showToast(msg) {
      toastEl.textContent = msg;
      toastEl.classList.add('show');
      setTimeout(() => toastEl.classList.remove('show'), 2000);
    }
    
    // ===== 工具函数 =====
    function truncate(str, len) {
      return str.length > len ? str.slice(0, len) + '...' : str;
    }
    
    function escapeHtml(str) {
      const div = document.createElement('div');
      div.textContent = str;
      return div.innerHTML;
    }
    
    function unescapeHtml(str) {
      const div = document.createElement('div');
      div.innerHTML = str;
      return div.textContent || '';
    }
    
    function highlightText(text, query) {
      if (!query) return text;
      const regex = new RegExp('(' + query.replace(/[.*+?^\$()|[\]\\]/g, '\\$&') + ')', 'gi');
      return text.replace(regex, '<mark class="highlight">\$1</mark>');
    }
    
    function iconToEmoji(icon) {
      const map = {
        'feather:folder': '📁', 'feather:zap': '💡', 'feather:droplet': '🎨',
        'feather:file-text': '📝', 'feather:tool': '🔧', 'feather:navigation-2': '🚀',
        'feather:monitor': '💻', 'feather:bar-chart-2': '📊', 'feather:crosshair': '🎯',
        'feather:search': '🔍', 'feather:star': '⭐', 'feather:award': '🌟',
        'feather:book-open': '📚', 'feather:layers': '🎭', 'feather:message-circle': '💬',
        'feather:settings': '🛠️', 'feather:hexagon': '💎', 'feather:command': '🎮',
        'feather:music': '🎵', 'feather:camera': '📷', 'feather:cloud': '🌈',
        'feather:globe': '🔮', 'feather:cpu': '🧠', 'feather:heart': '🌺',
      };
      if (icon?.startsWith('feather:')) return map[icon] || '📋';
      if (icon?.length <= 4 && !icon?.includes(':')) return icon;
      return '📋';
    }
    
    // ===== 搜索 =====
    let searchTimeout;
    searchInput.addEventListener('input', (e) => {
      clearTimeout(searchTimeout);
      searchTimeout = setTimeout(() => {
        searchQuery = e.target.value.trim();
        renderPrompts();
      }, 200);
    });
    
    // ===== Service Worker 注册 =====
    if ('serviceWorker' in navigator) {
      navigator.serviceWorker.register('sw.js').catch(() => {});
    }
    
    // ===== 初始化 =====
    renderCategories();
    renderPrompts();
  <\/script>
</body>
</html>`
}

/**
 * 生成 PWA Manifest
 */
export function generateSiteManifest(): string {
  return JSON.stringify({
    "name": "提示词管理器",
    "short_name": "提示词",
    "description": "移动端快速访问提示词库",
    "start_url": "/",
    "display": "standalone",
    "background_color": "#f9fafb",
    "theme_color": "#6366f1",
    "icons": [
      {
        "src": "icon-192.png",
        "sizes": "192x192",
        "type": "image/png"
      },
      {
        "src": "icon-512.png",
        "sizes": "512x512",
        "type": "image/png"
      }
    ]
  }, null, 2)
}

/**
 * 生成 Service Worker（离线缓存）
 */
export function generateServiceWorker(): string {
  return `/**
 * Service Worker for Prompt Manager Mobile Site
 * 提供离线缓存支持
 */
const CACHE_NAME = 'prompt-manager-v1';
const urlsToCache = [
  '/',
  '/index.html'
];

// 安装
self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME)
      .then((cache) => cache.addAll(urlsToCache))
      .then(() => self.skipWaiting())
  );
});

// 激活
self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys().then((cacheNames) => {
      return Promise.all(
        cacheNames.map((cacheName) => {
          if (cacheName !== CACHE_NAME) {
            return caches.delete(cacheName);
          }
        })
      );
    }).then(() => self.clients.claim())
  );
});

// 请求拦截
self.addEventListener('fetch', (event) => {
  event.respondWith(
    caches.match(event.request)
      .then((response) => {
        if (response) {
          return response;
        }
        return fetch(event.request).then((response) => {
          // 不缓存非同源请求或错误响应
          if (!response || response.status !== 200 || response.type !== 'basic') {
            return response;
          }
          const responseToCache = response.clone();
          caches.open(CACHE_NAME).then((cache) => {
            cache.put(event.request, responseToCache);
          });
          return response;
        });
      })
  );
});
`
}

// ============================================================
// 主入口函数
// ============================================================
export function useExportSite() {
  
  /**
   * 导出静态站点（下载 HTML 文件）
   */
  async function exportSite(options: SiteExportOptions = {}): Promise<void> {
    const { scope = 'all' } = options
    
    // 获取提示词
    let prompts: Prompt[]
    if (scope === 'favorites') {
      prompts = await db.prompts.where('isFavorite').equals(1).toArray() as unknown as Prompt[]
    } else {
      prompts = await db.prompts.toArray()
    }
    
    // 脱 Proxy
    prompts = JSON.parse(JSON.stringify(prompts))
    
    // 获取分类
    const categories = await db.categories.toArray()
    
    // 生成站点 HTML
    const html = generateSiteHTML(prompts, categories)
    
    // 生成文件名
    const date = new Date().toISOString().slice(0, 10)
    const filename = `prompt-site-${date}.html`
    
    // 下载
    downloadFile(html, filename, 'text/html;charset=utf-8')
  }
  
  /**
   * 导出静态站点（含 PWA 支持）
   * 生成一个 ZIP 文件，包含 index.html + manifest.json + sw.js
   */
  async function exportSiteWithPWA(options: SiteExportOptions = {}): Promise<void> {
    const { scope = 'all' } = options
    
    // 获取提示词
    let prompts: Prompt[]
    if (scope === 'favorites') {
      prompts = await db.prompts.where('isFavorite').equals(1).toArray() as unknown as Prompt[]
    } else {
      prompts = await db.prompts.toArray()
    }
    prompts = JSON.parse(JSON.stringify(prompts))
    
    const categories = await db.categories.toArray()
    
    // 生成各文件
    const html = generateSiteHTML(prompts, categories)
    const manifest = generateSiteManifest()
    const sw = generateServiceWorker()
    
    // 创建 ZIP（使用简单的多文件打包方式）
    // 由于浏览器环境限制，我们逐个下载或打包成 HTML（内联资源）
    // 这里采用简化方案：生成一个自包含的 HTML 文件
    const date = new Date().toISOString().slice(0, 10)
    const filename = `prompt-site-${date}.html`
    
    // 在 HTML 末尾添加说明
    const comment = `<!-- 
========================================
提示词管理器 · 静态站点导出包
========================================
提示词数量: ${prompts.length}
分类数量: ${categories.length}
导出时间: ${new Date().toISOString()}

PWA 使用说明:
1. 将此文件部署到 Web 服务器（如 GitHub Pages、Vercel、Netlify）
2. 在服务器根目录添加 manifest.json 和 sw.js
3. 或使用 https://htmlsave.com/ 等工具将此页面转为可托管站点

离线使用说明:
1. 在浏览器中打开此文件
2. 按 Ctrl/Cmd + S 保存为网页
3. 之后可离线访问
-->
`
    const fullHTML = html + comment
    
    downloadFile(fullHTML, filename, 'text/html;charset=utf-8')
    
    // 同时下载 manifest 和 sw 作为参考
    setTimeout(() => {
      downloadFile(manifest, 'manifest.json', 'application/json')
    }, 100)
    setTimeout(() => {
      downloadFile(sw, 'sw.js', 'application/javascript')
    }, 200)
  }
  
  /**
   * 获取导出统计
   */
  async function getExportStats(scope: SiteExportOptions['scope'] = 'all'): Promise<{
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
    
    // 估算 HTML 大小（约为 JSON 的 1.5 倍）
    const jsonSize = JSON.stringify(prompts).length
    const htmlSizeKB = Math.ceil((jsonSize * 1.5) / 1024)
    
    return {
      prompts: prompts.length,
      categories,
      size: htmlSizeKB < 1 ? '<1KB' : `${htmlSizeKB}KB`,
    }
  }
  
  return {
    exportSite,
    exportSiteWithPWA,
    getExportStats,
  }
}

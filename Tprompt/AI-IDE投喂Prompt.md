# Prompt Manager 插件 · AI IDE 开发 Prompt 合集

> 用途：直接复制每个 Prompt 投喂给 Cursor / Windsurf / GitHub Copilot 等 AI IDE
> 技术栈：Vue 3 + Vite + Chrome MV3 + Dexie.js + MiniSearch + Element Plus + UnoCSS

---

## 📋 使用说明

每个 Prompt 对应一个开发任务，按顺序执行：
1. 先执行「项目初始化」
2. 再按模块顺序开发
3. 每个 Prompt 独立可用，也可组合使用

---

---

## Prompt 0 · 项目脚手架初始化

```
你是一位 Chrome 浏览器扩展开发专家，熟悉 Manifest V3 规范。

请帮我初始化一个名为 "prompt-manager-plugin" 的 Chrome 扩展项目，要求：

**技术栈：**
- Vue 3 + TypeScript + Composition API
- Vite + vite-plugin-web-extension 构建
- Element Plus（按需引入）UI 组件库
- UnoCSS 原子化 CSS
- Pinia 状态管理
- Dexie.js（IndexedDB ORM）
- MiniSearch（全文搜索）

**项目结构：**
```
prompt-manager-plugin/
├── manifest.json
├── vite.config.ts
├── src/
│   ├── popup/        # 弹窗入口 (index.html + App.vue + main.ts)
│   ├── options/      # 管理页入口 (index.html + App.vue + main.ts)
│   ├── background/   # Service Worker (index.ts)
│   ├── components/   # 公共组件
│   ├── stores/       # Pinia Store
│   ├── composables/  # Composition 函数
│   ├── db/           # Dexie 数据层
│   ├── types/        # TypeScript 类型定义
│   └── utils/        # 工具函数
└── public/icons/
```

**manifest.json 权限：**
- permissions: ["storage", "contextMenus", "clipboardWrite"]
- options_ui: open_in_tab: true
- 支持 popup 和 options 双入口

**请输出：**
1. package.json（含所有依赖）
2. manifest.json（MV3 完整配置）
3. vite.config.ts（含多入口配置）
4. tsconfig.json
5. src/types/index.ts（所有 TypeScript 类型定义）

**类型定义要求（src/types/index.ts）：**
```typescript
interface Prompt {
  id: string;
  title: string;
  content: string;
  categoryId: string;
  tags: string[];
  isFavorite: boolean;
  isPinned: boolean;
  useCount: number;
  createdAt: number;
  updatedAt: number;
  lastUsedAt: number;
}

interface Category {
  id: string;
  name: string;
  icon: string;
  color: string;
  sortOrder: number;
  parentId?: string;
  createdAt: number;
}

interface Setting {
  key: string;
  value: unknown;
}

type ViewMode = 'list' | 'card';
type ThemeMode = 'light' | 'dark' | 'system';
type FontSize = 'sm' | 'md' | 'lg';
type ConflictStrategy = 'replace' | 'skip' | 'merge';
```
```

---

## Prompt 1 · 数据层（Dexie + Pinia Store）

```
基于已有的 TypeScript 类型定义（Prompt, Category, Setting），请实现数据层：

**1. src/db/schema.ts - Dexie 数据库定义**

使用 Dexie.js 创建 IndexedDB 数据库 "PromptManagerDB"，包含：
- prompts 表：索引 id, title, categoryId, *tags, isFavorite, isPinned, updatedAt, lastUsedAt
- categories 表：索引 id, name, sortOrder, parentId  
- settings 表：主键 key

支持版本迁移（version 1），导出 db 单例。

**2. src/stores/promptStore.ts - Pinia Store**

功能：
- state: { prompts, loading, selectedCategoryId, searchQuery, viewMode, sortBy }
- actions:
  - fetchPrompts(categoryId?: string) 从 DB 加载
  - addPrompt(data: Omit<Prompt, 'id'|'createdAt'|'updatedAt'>) 新增，自动生成 uuid
  - updatePrompt(id, updates) 更新，自动更新 updatedAt
  - deletePrompt(id) 删除
  - deletePrompts(ids: string[]) 批量删除
  - toggleFavorite(id) 切换收藏
  - copyPrompt(id) 复制全文，更新 useCount 和 lastUsedAt
  - searchPrompts(query) 使用 MiniSearch 搜索
  - buildSearchIndex() 构建搜索索引
- getters:
  - filteredPrompts: 根据当前 selectedCategoryId 和 searchQuery 过滤

**3. src/stores/categoryStore.ts**

功能：
- 加载/新增/更新/删除/重排序分类
- 内置虚拟分类常量（__all__, __favorite__, __recent__）
- getAllCategories getter（内置 + 用户自定义）

**4. src/stores/settingStore.ts**

功能：
- 读写 theme, viewMode, fontSize 设置
- 持久化到 Dexie settings 表
- 初始化时从 DB 加载

请输出完整的 TypeScript 代码，包含完整的错误处理。
```

---

## Prompt 2 · Options 主界面布局

```
请实现 Chrome 扩展的 Options 页面主界面（src/options/App.vue），这是一个全屏管理页面。

**整体布局（三栏结构）：**
```
┌────────────────────────────────────────────────────────┐
│  TopBar: Logo + 搜索框 + [导入][导出][设置] 按钮        │
├────────────┬───────────────────────────────────────────┤
│  Sidebar   │  Toolbar: 标题 + 排序 + 筛选 + 视图切换 + 新建  │
│  220px     ├───────────────────────────────────────────┤
│            │                                           │
│  分类列表   │  主内容区（卡片/列表视图，响应式网格）       │
│            │                                           │
└────────────┴───────────────────────────────────────────┘
```

**设计规范（使用 CSS 变量 / UnoCSS）：**
- 主色：#6366f1（Indigo-500）
- 背景：#f9fafb（Gray-50）
- 卡片背景：#ffffff
- 边框：#e5e7eb（Gray-200）
- 侧边栏宽度：220px，固定不变
- TopBar 高度：56px
- 字体：system-ui, PingFang SC

**TopBar 要求：**
- 左：Logo图标(渐变色圆角方块) + "Prompt Manager" 文字
- 中：搜索框（圆角，焦点时蓝色发光边框，支持 ⌘K 快捷键），placeholder="搜索提示词..."
- 右：导入按钮、导出按钮（outline样式）、设置图标按钮

**Sidebar 要求：**
- 内置分类：全部📋、收藏⭐、最近使用🕐（带数量角标）
- 分隔线 + "我的分类" 小标题
- 用户分类：左侧彩色小圆点 + emoji图标 + 名称 + 数量角标
- 底部：「+ 新建分类」按钮
- 激活状态：紫色背景 + 紫色文字

**PromptCard 卡片组件（嵌套在 PromptCard.vue）：**
- 标题（加粗，最多2行）
- 内容预览（3行省略，灰色）
- 底部：标签列表（彩色胶囊）+ 使用次数 + 复制按钮
- 右上角：收藏星星（点击切换）+ 更多菜单(···)
- Hover：上移2px + 紫色边框 + 阴影
- 右键：显示 ContextMenu（复制/编辑/移动/收藏/删除）

**交互：**
- 点击卡片：打开编辑 Modal
- 点击复制按钮：调用 promptStore.copyPrompt(id)，显示 Toast
- 切换视图（卡片/列表）：持久化到 settingStore

请使用 Vue 3 Composition API + `<script setup>` 语法，使用 Pinia store，
搜索框实现 debounce 300ms 后触发搜索。
```

---

## Prompt 3 · PromptCard 与列表视图组件

```
请实现两个视图组件：

**1. src/components/PromptCard.vue（卡片视图单项）**

Props:
- prompt: Prompt
- searchQuery?: string（用于高亮匹配词）

Emits:
- copy(id: string)
- edit(prompt: Prompt)
- delete(id: string)
- toggleFavorite(id: string)
- moveTo(id: string, categoryId: string)

样式要求：
- 白色背景，12px 圆角，1.5px 灰色边框
- 内边距：14px 16px
- Hover：translateY(-2px)，紫色边框，阴影
- 标题：14px, 600, 最多2行，超出省略
- 内容预览：12.5px，灰色（var(--gray-500)），3行省略
- 标签：彩色胶囊样式，不同颜色根据 tag 内容 hash 分配
- 复制按钮：hover 时显示（默认隐藏），紫色背景白色文字

搜索词高亮：用 `<mark class="highlight">` 包裹匹配的文字，`highlight` 类：background: #fef08a

右键菜单（ContextMenu）：
- 定位：绝对定位，白色背景，圆角，阴影
- 选项：复制全文 / 编辑 / 移动到分类▶ / 收藏 / 分隔线 / 删除（红色）
- 点击外部区域关闭

**2. src/components/PromptListItem.vue（列表视图单项）**

样式：
- 横向卡片，高度约 56px
- 左：圆角方块图标（emoji or 分类色）
- 中：标题（加粗）+ 内容预览（单行省略，灰色）
- 右：标签（最多2个）+ 使用次数 + 复制按钮
- Hover：紫色左边框（3px）+ 轻微背景色

两个组件都要支持搜索词高亮（封装 useHighlight composable）。
```

---

## Prompt 4 · 提示词编辑器 Modal

```
请实现提示词新建/编辑的 Modal 弹窗（src/components/PromptModal.vue）。

**触发方式：** 点击新建按钮或点击已有提示词

**Modal 布局（740px 宽，最大高度 88vh）：**
```
┌──────────────────────────────────────────┐
│  Header: ✏️ 新建提示词           [✕]      │
├─────────────┬────────────────────────────┤
│  左侧表单   │  右侧编辑区                │
│  260px      │  [编辑] [预览] Tab          │
│             │  ─────────────────────     │
│  - 标题*    │  Monaco-like 编辑器        │
│  - 分类     │  （textarea，等宽字体）     │
│  - 标签     │  或 Markdown 预览          │
│  - 置顶     │                            │
│  - 收藏     │                            │
│  ─────────  │                            │
│  元数据显示  │                            │
└─────────────┴────────────────────────────┘
│  Footer: 提示文字           [取消] [保存]  │
└──────────────────────────────────────────┘
```

**左侧表单：**
- 标题输入框（必填，校验非空）
- 分类下拉（el-select，含分类 emoji 和颜色点）
- 标签输入（自定义 TagInput 组件：Enter 添加，× 删除，彩色胶囊展示）
- 置顶开关（el-switch）
- 收藏开关（el-switch）
- 元数据区：创建时间、更新时间、使用次数（只读，灰色小字）

**右侧编辑区：**
- Tab 切换：编辑 / 预览
- 编辑模式：`<textarea>` 等宽字体（JetBrains Mono），支持 Tab 键插入空格
- 预览模式：使用 marked 渲染 Markdown，DOMPurify 净化，样式参考 GitHub Markdown
- 底部提示："支持 {{变量名}} 模板语法"

**交互：**
- 打开时 autofocus 标题输入框
- 内容自动保存草稿到 localStorage（debounce 1s）
- ESC 关闭 Modal（若有未保存内容，弹确认）
- 保存：校验标题非空，调用 promptStore.addPrompt 或 updatePrompt
- 保存成功：关闭 Modal，显示 Toast "保存成功 ✓"

Props:
- visible: boolean
- prompt?: Prompt（编辑模式时传入）

Emits:
- update:visible
- saved(prompt: Prompt)

使用 Vue 3 `<script setup>` + TypeScript + Element Plus 组件。
```

---

## Prompt 5 · 全文搜索（MiniSearch）

```
请实现全文搜索功能（src/composables/useSearch.ts）。

**需求：**
- 使用 MiniSearch 进行客户端全文搜索
- 搜索字段：title（权重3）、content（权重1）、tags（权重2）
- 支持模糊匹配（fuzzy: 0.2）和前缀匹配（prefix: true）
- 搜索结果按相关性排序

**实现 useSearch composable：**
```typescript
// 初始化 MiniSearch 实例
const miniSearch = new MiniSearch({
  fields: ['title', 'content', 'tags'],
  storeFields: ['id', 'title'],
  searchOptions: {
    boost: { title: 3, tags: 2, content: 1 },
    fuzzy: 0.2,
    prefix: true,
  }
})

export function useSearch() {
  // buildIndex(): 从 DB 加载所有 Prompt，构建索引
  // search(query: string): 搜索，返回匹配的 Prompt id 列表
  // addToIndex(prompt): 新增时更新索引
  // updateIndex(prompt): 更新时刷新索引
  // removeFromIndex(id): 删除时移除索引
  
  return { buildIndex, search, addToIndex, updateIndex, removeFromIndex }
}
```

**搜索高亮 useHighlight composable：**
```typescript
export function useHighlight() {
  // highlightText(text: string, query: string): string
  // 将 text 中匹配 query 的部分用 <mark class="highlight"> 包裹
  // 返回安全的 HTML 字符串（需用 v-html 渲染）
  // 注意：需要对 query 进行 HTML 实体转义防 XSS
  
  return { highlightText }
}
```

**集成到 promptStore：**
- 应用启动时调用 buildIndex()
- 在 filteredPrompts getter 中：若有 searchQuery，先搜索得到 id 集合，再过滤 prompts
- 搜索为空时展示当前分类的所有 Prompt

**搜索框 UI 要求（在 TopBar 中）：**
- el-input，圆角，宽度自适应（最大 480px）
- 前缀搜索图标，后缀 ⌘K 快捷键提示（显示为 kbd 标签）
- debounce 300ms 触发搜索
- 有搜索词时右侧显示清除按钮 ✕
- 搜索中显示 loading 旋转图标
```

---

## Prompt 6 · 分类管理页面

```
请实现分类管理页面（src/options/views/CategoryManager.vue）。

**页面布局：**
- 标题 + 描述 + 右上角「新建分类」按钮
- 内置分类区（只读，不可删除）
- 用户自定义分类区（可拖拽排序）
- 底部内联「新建分类」表单

**分类列表项（CategoryItem）：**
```
┌──────────────────────────────────────────────┐
│  ⠿  [色块emoji]  分类名称      12个  [✏️] [🗑️] │
└──────────────────────────────────────────────┘
```
- 左侧拖拽手柄（⠿，hover 显示为移动光标）
- 彩色 emoji 色块（背景色 = 分类 color 的浅色版）
- 分类名称
- Prompt 数量
- 操作：编辑图标、删除图标（hover 红色）

**拖拽排序：**
- 使用 Sortable.js（或 @vueuse/integrations/useSortable）
- 拖拽时高亮 drop 目标区域
- 松开后自动更新 sortOrder，调用 categoryStore.reorderCategories()

**内联新建/编辑表单：**
- 分类名称输入框
- Emoji 图标输入（单个 emoji，点击弹出 EmojiPicker 或手动输入）
- 颜色选择：12个预设颜色圆点（#6366f1, #10b981, #f59e0b, #ec4899, #3b82f6, #14b8a6, #8b5cf6, #f97316, #06b6d4, #84cc16, #ef4444, #a855f7）+ 自定义颜色输入
- 保存 / 取消按钮

**删除分类：**
- 若分类下有 Prompt，弹确认 Dialog："该分类下有 X 个提示词，删除后这些提示词将移至「全部」"
- 确认后：先将该分类下所有 Prompt 的 categoryId 改为空，再删除分类

请使用 Vue 3 Composition API，接入 categoryStore，完整 TypeScript。
```

---

## Prompt 7 · 导入/导出功能

```
请实现导入导出功能（src/composables/useImportExport.ts + src/options/views/ImportExport.vue）。

**1. useImportExport composable**

**导出功能：**

```typescript
// 导出 JSON（完整备份，可恢复）
async function exportJSON(options?: { categoryIds?: string[] }): Promise<void>
// 数据结构: { version: '1.0', exportedAt: timestamp, categories: Category[], prompts: Prompt[] }
// 文件名: prompts-backup-YYYYMMDD.json

// 导出 Markdown（阅读友好）
async function exportMarkdown(): Promise<void>
// 按分类分组，H2标题=分类名，H3标题=Prompt标题，内容原文
// 文件名: prompts-backup.md

// 导出 CSV（表格处理）
async function exportCSV(): Promise<void>
// 列: id, title, content, categoryName, tags, isFavorite, useCount, createdAt
// content 中的双引号转义为 ""，整个字段用 "" 包裹
// 文件名: prompts.csv
```

**导入功能：**

```typescript
// 验证 JSON 格式
function validateImportData(data: unknown): { valid: boolean; errors: string[] }

// 导入 JSON，支持三种冲突策略
async function importJSON(
  file: File,
  strategy: 'replace' | 'skip' | 'merge',
  onProgress?: (current: number, total: number) => void
): Promise<{ imported: number; skipped: number; errors: number }>
```

冲突策略：
- skip: 已存在的 ID 直接跳过
- replace: 用导入数据完全覆盖已存在的记录
- merge: 合并字段，保留本地的 useCount、lastUsedAt（不被覆盖）

**2. ImportExport.vue 页面**

布局：
- 导出区块（白色卡片，蓝色图标）：
  - 三种格式卡片（JSON/Markdown/CSV），点击选中，hover效果
  - 导出范围下拉（全部/当前分类/已收藏）
  - 「立即导出」按钮
- 导入区块（白色卡片，绿色图标）：
  - 拖拽上传区域（虚线边框，hover变色，支持拖拽和点击选择）
  - 文件选中后显示文件名、大小、预计导入数量
  - 冲突解决选项：三个可选按钮（跳过/合并/替换）
  - 导入进度条（el-progress，大量数据时显示）
  - 「开始导入」按钮
- 危险区（红色边框卡片）：
  - 清空所有数据按钮，点击后弹二次确认 Dialog

所有操作完成后显示 Toast 通知结果（如：成功导入 42 个提示词，跳过 3 个重复项）。
```

---

## Prompt 8 · Popup 弹窗界面

```
请实现 Chrome 扩展的 Popup 弹窗（src/popup/App.vue），宽度固定 360px。

**布局（从上到下）：**
1. Header（48px）：渐变Logo + "Prompt Manager" + 设置⚙ + 打开管理页↗
2. 搜索框（40px）：灰色背景，autoFocus，placeholder="快速搜索..."
3. Tab 栏：全部 / ⭐收藏 / 🕐最近
4. Prompt 列表（max-height: 400px，overflow-y: auto）
5. Footer：「✚ 新建」链接 + 「打开管理页 →」链接

**Prompt 列表项：**
```
[分类色点]  标题（加粗）                        [复制⧉]
           内容预览（单行省略，12px灰色）
```
- 左侧 6px 彩色圆点（分类颜色）
- Hover：主色淡背景
- 点击复制图标：复制到剪贴板 + 显示 Toast "已复制 ✓"
- 点击行：聚焦该条目（高亮边框），再次点击可展开预览

**Header 样式：**
- 背景：var(--gray-900) 深色
- Logo：渐变色（紫蓝）
- 字体：白色

**交互：**
- 打开 Popup 时自动 focus 搜索框
- 搜索 debounce 200ms（Popup 要更快响应）
- Tab 切换时清空搜索词
- 列表项上方显示分类名称分隔（可选）
- Popup 高度根据内容自适应（最小 280px）

**打开管理页：**
```javascript
chrome.runtime.openOptionsPage()
```

请共享与 options 相同的 Pinia store 和 Dexie DB，保持数据一致。
```

---

## Prompt 9 · Toast 通知 + 全局 UI 组件

```
请实现以下全局 UI 组件：

**1. src/components/ToastNotify.vue（Toast 通知）**

功能：
- 右上角弹出，2秒后自动消失
- 支持类型：success（绿色）/ error（红色）/ info（灰色）/ warning（黄色）
- 支持队列（多个 Toast 堆叠显示）
- 动画：从右侧滑入，消失时滑出

使用 composable 调用：
```typescript
const { showToast } = useToast()
showToast('已复制到剪贴板 ✓', 'success')
showToast('保存失败，请重试', 'error')
```

组件挂载在 App.vue 顶层，通过 Pinia 或 mitt 事件总线触发。

**2. src/components/EmptyState.vue（空状态）**

Props:
- icon: string（emoji）
- title: string
- description: string  
- actionText?: string
- onAction?: () => void

样式：居中，大 emoji，标题，描述，可选操作按钮

**3. src/components/TagBadge.vue（标签胶囊）**

Props:
- tag: string
- closable?: boolean

功能：
- 根据 tag 字符串哈希值自动分配颜色（6种颜色循环）
- closable 时显示 × 按钮

颜色方案：
```typescript
const COLORS = [
  { bg: '#ede9fe', text: '#7c3aed' }, // purple
  { bg: '#dbeafe', text: '#1d4ed8' }, // blue
  { bg: '#d1fae5', text: '#065f46' }, // green
  { bg: '#ffedd5', text: '#c2410c' }, // orange
  { bg: '#fce7f3', text: '#9d174d' }, // pink
  { bg: '#ccfbf1', text: '#0f766e' }, // teal
]

function getTagColor(tag: string) {
  const hash = [...tag].reduce((acc, c) => acc + c.charCodeAt(0), 0)
  return COLORS[hash % COLORS.length]
}
```

**4. CSS 变量主题系统（src/styles/tokens.css）**

请输出完整的设计令牌 CSS 变量，包含：
- 颜色（primary 50-900, gray 50-900, success, warning, danger, info）
- 字体大小（xs 12px, sm 14px, base 16px, lg 18px, xl 20px, 2xl 24px）
- 间距（1-4px, 2-8px, 3-12px, 4-16px, 6-24px, 8-32px, 12-48px, 16-64px）
- 圆角、阴影、过渡

以及暗色模式覆盖（[data-theme="dark"] 选择器）：
- 背景色变深，文字变浅
- 边框颜色调暗
- 主色调在暗背景上适当提亮
```

---

## Prompt 10 · 暗色模式 + 设置面板

```
请实现主题切换和设置面板功能：

**1. 主题系统（src/composables/useTheme.ts）**

```typescript
export function useTheme() {
  // 初始化：读取 settingStore.theme
  // 应用主题：在 document.documentElement 上设置 data-theme="dark"/"light"
  // 监听系统主题变化：window.matchMedia('(prefers-color-scheme: dark)')
  // toggleTheme()：在 light/dark 间切换
  // setTheme(mode: 'light' | 'dark' | 'system')：设置指定主题
  
  return { theme, isDark, toggleTheme, setTheme }
}
```

**2. 设置面板 SettingsDrawer.vue**

触发方式：点击 TopBar 右侧⚙图标，从右侧滑入抽屉（el-drawer）

面板内容：
- 外观设置：
  - 主题：三个图标按钮（☀️浅色 / 🌙深色 / 💻跟随系统），当前选中高亮
  - 字体大小：小/中（默认）/大 三档，实时预览
  - 默认视图：卡片 / 列表
- 数据：
  - 提示词数量（只读统计）
  - 分类数量
  - 上次备份时间
  - 「立即备份」按钮（触发 JSON 导出）
- 关于：
  - 版本号 v1.0.0
  - 反馈链接

所有设置修改后立即生效，自动保存到 settingStore（持久化到 IndexedDB）。

**3. 暗色模式下所有组件的样式**

请确保以下组件支持暗色模式（data-theme="dark"）：
- TopBar：深灰背景（#1f2937），白色文字
- Sidebar：深灰背景（#111827），深色边框，激活项紫色半透明背景
- PromptCard：深色卡片（#1f2937），深色边框，浅色文字
- 搜索框：深色输入框背景
- 标签：暗色版配色（透明度降低）
- 所有边框：使用 var(--gray-700)
```

---

## Prompt 11 · Background Service Worker

```
请实现 Background Service Worker（src/background/index.ts）。

**功能：**

1. 右键菜单注册：
```javascript
chrome.runtime.onInstalled.addListener(() => {
  // 在所有页面上注册右键菜单
  chrome.contextMenus.create({
    id: 'save-to-prompt-manager',
    title: '保存为提示词',
    contexts: ['selection'],  // 选中文字时显示
  })
  chrome.contextMenus.create({
    id: 'open-prompt-manager',
    title: '打开 Prompt Manager',
    contexts: ['all'],
  })
})
```

2. 右键菜单点击处理：
- 点击「保存为提示词」：获取选中文字，打开 options 页并传递文字作为初始内容
- 点击「打开 Prompt Manager」：打开 options 页

3. 消息通信：
```typescript
chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
  if (message.type === 'OPEN_OPTIONS') {
    chrome.runtime.openOptionsPage()
    sendResponse({ success: true })
  }
  if (message.type === 'COPY_PROMPT') {
    // 通知 popup 刷新数据
    sendResponse({ success: true })
  }
  return true
})
```

4. 安装/更新事件：
- 首次安装：打开 options 页展示欢迎引导
- 更新：记录更新时间到 storage

注意：MV3 Service Worker 不能保持长期存活，所有状态必须存储在 IndexedDB 或 chrome.storage 中，不能存在变量里。
```

---

## Prompt 12 · 最终整合与优化

```
请对整个 Prompt Manager 插件进行最终整合和性能优化：

**1. App.vue 整合（src/options/App.vue）**

将以下视图通过路由或条件渲染整合：
- PromptList（主界面）
- CategoryManager（分类管理）
- ImportExport（导入导出）
- Settings（设置，使用抽屉）

顶部增加二级导航：提示词 | 分类管理 | 导入导出

**2. 性能优化**

- 虚拟滚动：Prompt 数量超过 100 条时启用 el-virtual-list 或 vueuse/useVirtualList
- 搜索索引懒加载：首次搜索时才构建 MiniSearch 索引
- 图片/图标懒加载

**3. 键盘快捷键（src/composables/useKeyboard.ts）**

```typescript
// 全局快捷键：
// ⌘K / Ctrl+K：聚焦搜索框
// ⌘N / Ctrl+N：打开新建 Modal
// ESC：关闭当前 Modal/抽屉
// ⌘/ Ctrl+/：切换视图（卡片/列表）
```

**4. 首次使用引导**

检测到 prompts 和 categories 均为空时，显示欢迎 Modal：
- 标题：「欢迎使用 Prompt Manager 🎉」
- 提示：强烈建议定期导出 JSON 备份（因为卸载插件会清空数据）
- 两个操作：「导入已有数据」/ 「快速创建第一个提示词」

**5. 错误边界处理**

- 所有异步操作包含 try-catch，失败时 showToast('操作失败，请重试', 'error')
- IndexedDB 不可用时（隐私模式某些浏览器）：显示友好提示
- 导入文件格式错误：具体说明哪里不对

**6. 可访问性（a11y）**

- 所有按钮有 aria-label
- 模态框有 role="dialog" aria-modal="true"
- 搜索框有 aria-label="搜索提示词"
- 键盘 Tab 顺序合理
- 颜色对比度满足 WCAG AA（4.5:1）

请输出最终整合后的 App.vue 和以上所有 composable 的完整代码。
```

---

## 🗂️ 文件清单（供 AI IDE 参考）

```
src/
├── types/index.ts                    ← Prompt 1 (类型定义)
├── db/schema.ts                      ← Prompt 1 (数据库)
├── styles/tokens.css                 ← Prompt 9 (设计令牌)
├── stores/
│   ├── promptStore.ts                ← Prompt 1
│   ├── categoryStore.ts              ← Prompt 1
│   └── settingStore.ts               ← Prompt 1
├── composables/
│   ├── useSearch.ts                  ← Prompt 5
│   ├── useHighlight.ts               ← Prompt 5
│   ├── useImportExport.ts            ← Prompt 7
│   ├── useClipboard.ts               ← Prompt 3
│   ├── useTheme.ts                   ← Prompt 10
│   ├── useKeyboard.ts                ← Prompt 12
│   └── useToast.ts                   ← Prompt 9
├── components/
│   ├── PromptCard.vue                ← Prompt 3
│   ├── PromptListItem.vue            ← Prompt 3
│   ├── PromptModal.vue               ← Prompt 4
│   ├── CategoryItem.vue              ← Prompt 6
│   ├── TagBadge.vue                  ← Prompt 9
│   ├── ToastNotify.vue               ← Prompt 9
│   ├── EmptyState.vue                ← Prompt 9
│   └── SettingsDrawer.vue            ← Prompt 10
├── popup/
│   ├── App.vue                       ← Prompt 8
│   └── main.ts
├── options/
│   ├── App.vue                       ← Prompt 12 (整合)
│   ├── main.ts
│   └── views/
│       ├── PromptList.vue            ← Prompt 2
│       ├── CategoryManager.vue       ← Prompt 6
│       └── ImportExport.vue          ← Prompt 7
└── background/index.ts               ← Prompt 11
```

---

*以上 12 个 Prompt 覆盖了插件的完整开发流程，按序执行可完整实现 Phase 1 MVP。*

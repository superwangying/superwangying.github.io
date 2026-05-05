# Tprompt - 本地提示词管理插件

> 🚀 一款纯本地、零依赖的浏览器扩展，帮助你高效管理、分类、搜索和复用 AI 提示词。

## ✨ 核心特性

- 📋 **智能分类管理** - 支持多级分类、颜色标签、拖拽排序
- 🔍 **全文搜索引擎** - 基于 MiniSearch 的秒级搜索体验
- 📤 **多格式导入导出** - 支持 JSON / Markdown / CSV 格式
- 🎨 **精美 UI 设计** - Vue 3 + Element Plus + UnoCSS
- 🌙 **暗色模式** - 自动跟随系统，支持手动切换
- 💾 **纯本地存储** - 基于 IndexedDB，数据完全掌握在自己手中

## 📦 项目结构

```
Tprompt/
├── Tprompt/                    # 项目根目录
│   ├── prompt-manager-plugin/   # Chrome 扩展主程序
│   │   ├── src/               # 源代码
│   │   ├── public/            # 静态资源
│   │   └── manifest.json      # 扩展配置
│   └── ui-preview/            # UI 设计预览
└── README.md
```

## 🚀 快速开始

### 安装扩展

1. 下载本项目到本地
2. 打开 Chrome/Edge 浏览器
3. 进入 `chrome://extensions/` 或 `edge://extensions/`
4. 开启"开发者模式"
5. 点击"加载已解压的扩展"，选择 `Tprompt/prompt-manager-plugin/dist` 目录

### 构建项目

```bash
cd Tprompt/prompt-manager-plugin
npm install
npm run build
```

## 📖 功能说明

### 提示词管理
- ✏️ 新建/编辑提示词（支持 Markdown）
- 📋 一键复制全文或段落
- ⭐ 收藏常用提示词
- 📌 置顶重要提示词
- 🗑️ 单个/批量删除

### 分类管理
- 📁 创建自定义分类
- 🎨 设置分类颜色和图标
- 🔄 拖拽调整排序
- 📊 内置"全部/收藏/最近使用"

### 搜索与筛选
- 🔍 全文关键词搜索（标题+内容+标签）
- 🏷️ 按标签多维度筛选
- 📊 实时搜索结果统计

### 导入导出
- 📤 导出 JSON（完整备份）
- 📝 导出 Markdown（阅读友好）
- 📊 导出 CSV（表格处理）
- 📥 导入 JSON（支持冲突解决：跳过/合并/替换）

## 🌐 在线预览

访问产品展示页：[https://superwangying.github.io/Tprompt](https://superwangying.github.io/Tprompt)

## 🛠️ 技术栈

| 层级 | 技术 | 用途 |
|------|------|------|
| 插件框架 | Chrome Extension MV3 | 兼容 Chrome/Edge |
| 前端框架 | Vue 3 + Composition API | 响应式开发 |
| UI 组件库 | Element Plus | 成熟组件库 |
| 构建工具 | Vite + vite-plugin-web-extension | 极速构建 |
| 状态管理 | Pinia | 轻量状态管理 |
| 本地存储 | Dexie.js (IndexedDB) | 大量数据存储 |
| 搜索引擎 | MiniSearch | 纯 JS 全文索引 |
| 样式方案 | UnoCSS | 原子化 CSS |

## 📝 开发计划

### ✅ Phase 1 · MVP（已完成）
- [x] 提示词 CRUD + Markdown 预览
- [x] 分类管理（增删改 + 颜色/图标）
- [x] 全文搜索（MiniSearch）
- [x] 导入导出（JSON/Markdown/CSV）
- [x] 亮/暗模式

### 🔜 Phase 2 · 增强体验
- [ ] 分类拖拽排序
- [ ] 批量操作
- [ ] 右键快捷菜单
- [ ] 字体大小调节
- [ ] 复制段落功能

### 🎯 Phase 3 · 高级功能
- [ ] 二级分类支持
- [ ] 模板变量系统
- [ ] Prompt 版本历史
- [ ] 网页内容快速保存
- [ ] ChatGPT/Claude 集成

## ⚠️ 注意事项

- **纯本地运行**：所有数据存储在浏览器 IndexedDB 中，不会上传到任何服务器
- **定期备份**：建议定期导出 JSON 备份，避免浏览器卸载扩展导致数据丢失
- **隐私保护**：无需注册登录，零数据收集

## 📄 开源协议

MIT License

## 💬 联系反馈

如有问题或建议，欢迎提交 Issue 或 Pull Request！

---

**Made with ❤️ for AI Prompt Enthusiasts**

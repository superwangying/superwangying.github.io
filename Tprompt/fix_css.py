# -*- coding: utf-8 -*-
import os

path = r'D:\Tprompt\prompt-manager-plugin\src\options\App.vue'
content = open(path, 'r', encoding='utf-8').read()

# ---- FIX 1: Corrupted drag CSS block ----
idx1 = content.find('.sidebar__add-btn:hover')
ca_idx = content.find('.content-area', idx1)
corrupted1 = content[idx1:ca_idx]

correct1 = (
    '.sidebar__add-btn:hover {\n'
    '  background: var(--primary-50);\n'
    '}\n\n'
    '/* ---- 拖拽排序 ---- */\n'
    '.sidebar-item--drag {\n'
    '  cursor: grab;\n'
    '  opacity: 0;\n'
    '  transition: opacity var(--transition-fast);\n'
    '  flex-shrink: 0;\n'
    '  color: var(--text-muted);\n'
    '  font-size: 14px;\n'
    '}\n\n'
    '.sidebar__item:hover .sidebar-item--drag {\n'
    '  opacity: 1;\n'
    '}\n\n'
    '.sidebar-item--drag:active {\n'
    '  cursor: grabbing;\n'
    '}\n\n'
    '.sidebar__drag-handle {\n'
    '  display: flex;\n'
    '  align-items: center;\n'
    '}\n\n'
    '.sidebar-ghost {\n'
    '  opacity: 0.4;\n'
    '  background: var(--primary-50);\n'
    '  border-radius: var(--radius-md);\n'
    '}\n\n'
    '.sidebar-chosen {\n'
    '  background: var(--gray-50);\n'
    '  box-shadow: var(--shadow-md);\n'
    '}\n\n'
)

# ---- FIX 2: Corrupted tag filter CSS block ----
idx2 = content.find('.icon-active')
end_idx = content.find('</style>', idx2)
corrupted2 = content[idx2:end_idx]

correct2 = (
    '.icon-active {\n'
    '  color: var(--primary-600);\n'
    '}\n\n'
    '/* ---- 标签筛选栏 ---- */\n'
    '.tag-filter-bar {\n'
    '  padding: 8px 20px;\n'
    '  border-bottom: 1px solid var(--border-color);\n'
    '  background: var(--bg-surface);\n'
    '  flex-shrink: 0;\n'
    '}\n\n'
    '.tag-filter-bar__scroll {\n'
    '  display: flex;\n'
    '  align-items: center;\n'
    '  gap: 6px;\n'
    '  overflow-x: auto;\n'
    '  scrollbar-width: none;\n'
    '}\n\n'
    '.tag-filter-bar__scroll::-webkit-scrollbar {\n'
    '  display: none;\n'
    '}\n\n'
    '.tag-filter-bar__label {\n'
    '  display: flex;\n'
    '  align-items: center;\n'
    '  gap: 4px;\n'
    '  font-size: 12px;\n'
    '  color: var(--text-muted);\n'
    '  white-space: nowrap;\n'
    '  flex-shrink: 0;\n'
    '  margin-right: 2px;\n'
    '}\n\n'
    '.tag-filter-bar__label i {\n'
    '  font-size: 13px;\n'
    '}\n\n'
    '.tag-filter-chip {\n'
    '  display: inline-flex;\n'
    '  align-items: center;\n'
    '  gap: 4px;\n'
    '  padding: 3px 10px;\n'
    '  border-radius: var(--radius-full);\n'
    '  font-size: 12px;\n'
    '  color: var(--text-secondary);\n'
    '  background: var(--gray-100);\n'
    '  border: 1.5px solid transparent;\n'
    '  white-space: nowrap;\n'
    '  flex-shrink: 0;\n'
    '  transition: all var(--transition-fast);\n'
    '}\n\n'
    '.tag-filter-chip:hover {\n'
    '  border-color: var(--primary-300);\n'
    '  color: var(--primary-700);\n'
    '  background: var(--primary-50);\n'
    '}\n\n'
    '.tag-filter-chip.active {\n'
    '  background: var(--primary-600);\n'
    '  color: #fff;\n'
    '  border-color: var(--primary-600);\n'
    '}\n\n'
    '.tag-filter-chip__count {\n'
    '  font-size: 10px;\n'
    '  opacity: 0.7;\n'
    '}\n\n'
    '.tag-filter-clear {\n'
    '  display: inline-flex;\n'
    '  align-items: center;\n'
    '  gap: 4px;\n'
    '  padding: 3px 10px;\n'
    '  border-radius: var(--radius-full);\n'
    '  font-size: 12px;\n'
    '  color: var(--text-muted);\n'
    '  background: transparent;\n'
    '  border: 1.5px dashed var(--gray-300);\n'
    '  white-space: nowrap;\n'
    '  flex-shrink: 0;\n'
    '  transition: all var(--transition-fast);\n'
    '  margin-left: 4px;\n'
    '}\n\n'
    '.tag-filter-clear:hover {\n'
    '  border-color: var(--color-error);\n'
    '  color: var(--color-error);\n'
    '  background: rgba(239, 68, 68, 0.05);\n'
    '}\n'
)

if corrupted1 in content:
    content = content.replace(corrupted1, correct1)
    print('Fixed block 1 (drag CSS)')
else:
    print('Block 1 not found!')

if corrupted2 in content:
    content = content.replace(corrupted2, correct2)
    print('Fixed block 2 (tag filter CSS)')
else:
    print('Block 2 not found!')

with open(path, 'w', encoding='utf-8') as f:
    f.write(content)

print('Done!')

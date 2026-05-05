// Background Service Worker — Prompt Manager
// Step 5: 快捷键 + 右键菜单完善

chrome.runtime.onInstalled.addListener((details) => {
  if (details.reason === 'install') {
    // 首次安装：打开管理页引导
    chrome.runtime.openOptionsPage()
  }

  // 注册右键菜单
  chrome.contextMenus.create({
    id: 'pm-save-selection',
    title: '保存为提示词',
    contexts: ['selection'],
  })

  chrome.contextMenus.create({
    id: 'pm-open-manager',
    title: '打开 Prompt Manager',
    contexts: ['all'],
  })
})

// 右键菜单点击处理
chrome.contextMenus.onClicked.addListener((info, tab) => {
  if (info.menuItemId === 'pm-save-selection' && info.selectionText) {
    chrome.runtime.openOptionsPage()
    // 延迟发送消息，等 options 页加载完成
    setTimeout(() => {
      chrome.runtime.sendMessage({
        type: 'SAVE_SELECTION',
        payload: { content: info.selectionText },
      })
    }, 800)
  }

  if (info.menuItemId === 'pm-open-manager') {
    chrome.runtime.openOptionsPage()
  }
})

// 快捷键命令处理（_execute_action = Ctrl/Cmd+Shift+P）
chrome.commands.onCommand.addListener((command) => {
  if (command === '_execute_action') {
    chrome.runtime.openOptionsPage()
  }
})

// 消息监听
chrome.runtime.onMessage.addListener((message, _sender, sendResponse) => {
  if (message.type === 'OPEN_OPTIONS') {
    chrome.runtime.openOptionsPage()
    sendResponse({ ok: true })
  }
  if (message.type === 'PING') {
    sendResponse({ ok: true, version: '1.0.0' })
  }
})

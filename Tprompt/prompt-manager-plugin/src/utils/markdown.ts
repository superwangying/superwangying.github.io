/**
 * Markdown 分段解析工具
 * 将 Markdown 文本按标题（h1-h6）拆分为独立段落块
 */

export interface MarkdownSection {
  heading: string    // 标题文本（不含 # 号）
  level: number       // 标题级别 1-6
  content: string     // 该段落的内容（从标题行到下一个标题之前）
  fullHeadingLine: string // 原始标题行，如 "## 角色设定"
}

/**
 * 解析 Markdown 内容，返回分段列表
 */
export function parseMarkdownSections(content: string): MarkdownSection[] {
  const lines = content.split('\n')
  const sections: MarkdownSection[] = []
  let currentSection: MarkdownSection | null = null

  for (const line of lines) {
    const match = line.match(/^(#{1,6})\s+(.+)$/)
    if (match) {
      // 保存上一个段落
      if (currentSection) {
        currentSection.content = lines
          .slice(
            lines.indexOf(currentSection.fullHeadingLine),
            lines.indexOf(line),
          )
          .join('\n')
          .trim()
        sections.push(currentSection)
      }

      currentSection = {
        heading: match[2].trim(),
        level: match[1].length,
        content: '',
        fullHeadingLine: line,
      }
    }
  }

  // 保存最后一个段落
  if (currentSection) {
    const startIdx = lines.indexOf(currentSection.fullHeadingLine)
    currentSection.content = lines.slice(startIdx).join('\n').trim()
    sections.push(currentSection)
  }

  return sections
}

/**
 * 复制指定段落的内容
 * @param content 完整 Markdown 内容
 * @param sectionIndex 段落索引（-1 表示全文）
 */
export function getSectionContent(content: string, sectionIndex: number): string {
  const sections = parseMarkdownSections(content)

  if (sectionIndex === -1 || sections.length === 0) {
    return content
  }

  const section = sections[sectionIndex]
  if (!section) return content

  // 如果只有一个段落，返回全文
  if (sections.length === 1) return content

  return section.content
}

/**
 * 获取用于显示的简短段落摘要（截取前 30 个字符）
 */
export function getSectionSummary(section: MarkdownSection): string {
  const text = section.content
    .replace(/^#{1,6}\s+.+$/gm, '') // 去除子标题
    .replace(/\n+/g, ' ')
    .trim()

  if (text.length <= 40) return text
  return text.slice(0, 40) + '…'
}

import fs from 'fs'
import path from 'path'

const assetsDir = 'd:/Tprompt/prompt-manager-plugin/dist/assets'
const files = fs.readdirSync(assetsDir)
const cssFile = files.find(f => f.startsWith('options-') && f.endsWith('.css'))
if (!cssFile) { console.error('No options CSS found'); process.exit(1) }

const css = fs.readFileSync(path.join(assetsDir, cssFile), 'utf8')
const matches = css.match(/i-[a-z][\w:-]*/g) || []
const unique = [...new Set(matches)].sort()

const out = []
out.push(`找到 ${unique.length} 个不同的图标类名`)
out.push('=== ant-design 相关 ===')
const ad = unique.filter(x => x.includes('ant-design'))
if (ad.length === 0) out.push('【无！safelist 可能未生效】')
else ad.forEach(x => out.push(x))
out.push('=== carbon 相关 ===')
const carbon = unique.filter(x => x.includes('carbon'))
if (carbon.length === 0) out.push('【无！carbon 图标也丢了】')
else carbon.slice(0, 10).forEach(x => out.push(x))

fs.writeFileSync('d:/Tprompt/prompt-manager-plugin/check-icons-result.txt', out.join('\n'), 'utf8')
console.log('Done')

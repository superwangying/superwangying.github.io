import { defineConfig, presetUno, presetAttributify } from 'unocss'

export default defineConfig({
  presets: [
    presetUno(),
    presetAttributify(),
  ],
  shortcuts: {
    // 常用组合类
    'btn-primary': 'bg-indigo-500 hover:bg-indigo-600 text-white rounded-lg px-4 py-2 text-sm font-medium transition-colors cursor-pointer',
    'btn-ghost': 'hover:bg-gray-100 dark:hover:bg-gray-700 text-gray-600 dark:text-gray-300 rounded-lg px-3 py-1.5 text-sm transition-colors cursor-pointer',
    'card-base': 'bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700',
    'input-base': 'w-full px-3 py-2 rounded-lg border border-gray-200 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 text-sm outline-none transition-all focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500/25',
    'flex-center': 'flex items-center justify-center',
    'flex-between': 'flex items-center justify-between',
  },
  theme: {
    colors: {
      primary: {
        50: '#eef2ff',
        100: '#e0e7ff',
        200: '#c7d2fe',
        300: '#a5b4fc',
        400: '#818cf8',
        500: '#6366f1',
        600: '#4f46e5',
        700: '#4338ca',
        800: '#3730a3',
        900: '#312e81',
      },
    },
    fontFamily: {
      mono: ['JetBrains Mono', 'Fira Code', 'Consolas', 'monospace'],
    },
  },
})

<template>
  <Icon v-bind="$attrs" :icon="normalized" :width="size" :height="size" :color="color" />
</template>

<script setup lang="ts">
import { computed } from 'vue'
import { Icon } from '@iconify/vue'

const props = withDefaults(defineProps<{
  icon?: string
  size?: number
  color?: string
}>(), {
  icon: 'feather:folder',
  size: 18,
  color: 'currentColor',
})

const normalized = computed(() => {
  const v = props.icon
  if (!v) return 'feather:folder'
  // 已是 iconify 格式（含冒号）
  if (v.includes(':')) return v
  // 旧格式 ant-design-folder-outlined → ant-design:folder-outlined
  const idx = v.indexOf('-')
  if (idx > 0) return v.replace('-', ':')
  return 'feather:folder'
})
</script>

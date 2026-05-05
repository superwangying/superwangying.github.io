<template>
  <div class="empty-state">
    <!-- 装饰图形 SVG -->
    <div class="empty-state__graphic">
      <svg v-if="type === 'prompts'" width="80" height="80" viewBox="0 0 80 80" fill="none" xmlns="http://www.w3.org/2000/svg">
        <circle cx="40" cy="40" r="36" fill="var(--primary-50)" stroke="var(--primary-200)" stroke-width="2"/>
        <rect x="22" y="24" width="36" height="4" rx="2" fill="var(--primary-300)"/>
        <rect x="22" y="34" width="28" height="3" rx="1.5" fill="var(--primary-200)"/>
        <rect x="22" y="43" width="32" height="3" rx="1.5" fill="var(--primary-200)"/>
        <rect x="22" y="52" width="20" height="3" rx="1.5" fill="var(--primary-100)"/>
        <circle cx="56" cy="54" r="12" fill="var(--primary-100)" stroke="var(--primary-200)" stroke-width="1.5"/>
        <line x1="56" y1="49" x2="56" y2="59" stroke="var(--primary-400)" stroke-width="2" stroke-linecap="round"/>
        <line x1="51" y1="54" x2="61" y2="54" stroke="var(--primary-400)" stroke-width="2" stroke-linecap="round"/>
      </svg>
      <svg v-else-if="type === 'search'" width="80" height="80" viewBox="0 0 80 80" fill="none" xmlns="http://www.w3.org/2000/svg">
        <circle cx="40" cy="40" r="36" fill="var(--gray-50)" stroke="var(--gray-200)" stroke-width="2"/>
        <circle cx="35" cy="35" r="14" stroke="var(--gray-300)" stroke-width="3" fill="none"/>
        <line x1="45" y1="45" x2="55" y2="55" stroke="var(--gray-300)" stroke-width="3" stroke-linecap="round"/>
        <line x1="30" y1="30" x2="32" y2="28" stroke="var(--gray-400)" stroke-width="2" stroke-linecap="round"/>
        <line x1="38" y1="28" x2="40" y2="26" stroke="var(--gray-400)" stroke-width="2" stroke-linecap="round"/>
      </svg>
      <svg v-else width="80" height="80" viewBox="0 0 80 80" fill="none" xmlns="http://www.w3.org/2000/svg">
        <circle cx="40" cy="40" r="36" fill="var(--gray-50)" stroke="var(--gray-200)" stroke-width="2"/>
        <rect x="26" y="26" width="28" height="28" rx="6" stroke="var(--gray-300)" stroke-width="2.5" fill="none" stroke-dasharray="4 3"/>
        <line x1="40" y1="34" x2="40" y2="46" stroke="var(--gray-400)" stroke-width="2.5" stroke-linecap="round"/>
        <line x1="34" y1="40" x2="46" y2="40" stroke="var(--gray-400)" stroke-width="2.5" stroke-linecap="round"/>
      </svg>
    </div>

    <h3 class="empty-state__title">{{ title }}</h3>
    <p class="empty-state__desc">{{ description }}</p>

    <div v-if="$slots.action" class="empty-state__action">
      <slot name="action" />
    </div>
  </div>
</template>

<script setup lang="ts">
withDefaults(defineProps<{
  type?: 'prompts' | 'search' | 'general'
  title?: string
  description?: string
}>(), {
  type: 'prompts',
  title: '暂无内容',
  description: '这里还没有任何内容，快去创建吧',
})
</script>

<style scoped>
.empty-state {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  padding: 48px 24px;
  text-align: center;
  gap: 12px;
}

.empty-state__graphic {
  margin-bottom: 8px;
  opacity: 0.9;
}

.empty-state__title {
  font-size: var(--text-lg);
  font-weight: 600;
  color: var(--text-primary);
}

.empty-state__desc {
  font-size: var(--text-sm);
  color: var(--text-secondary);
  max-width: 280px;
  line-height: 1.6;
}

.empty-state__action {
  margin-top: 8px;
}
</style>

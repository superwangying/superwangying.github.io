<template>
  <div class="stats-view">
    <!-- Header -->
    <div class="stats-view__header">
      <button class="stats-back-btn" @click="$emit('back')">
        <IconRender icon="carbon:arrow-left" />
      </button>
      <h2 class="stats-view__title">数据统计</h2>
      <div class="flex-1"></div>
    </div>

    <!-- Body -->
    <div class="stats-view__body">

      <!-- 概览卡片 -->
      <section class="stats-overview">
        <div class="stat-card">
          <div class="stat-card__icon" style="background: rgba(99,102,241,0.1); color: var(--primary-600)">
            <IconRender icon="carbon:text-font" :size="22" />
          </div>
          <div class="stat-card__info">
            <span class="stat-card__value">{{ stats.total }}</span>
            <span class="stat-card__label">提示词总数</span>
          </div>
        </div>

        <div class="stat-card">
          <div class="stat-card__icon" style="background: rgba(34,197,94,0.1); color: var(--success-600)">
            <IconRender icon="carbon:category" :size="22" />
          </div>
          <div class="stat-card__info">
            <span class="stat-card__value">{{ stats.categories }}</span>
            <span class="stat-card__label">分类总数</span>
          </div>
        </div>

        <div class="stat-card">
          <div class="stat-card__icon" style="background: rgba(245,158,11,0.1); color: var(--color-warning)">
            <IconRender icon="carbon:star" :size="22" />
          </div>
          <div class="stat-card__info">
            <span class="stat-card__value">{{ stats.favorites }}</span>
            <span class="stat-card__label">收藏数量</span>
          </div>
        </div>

        <div class="stat-card">
          <div class="stat-card__icon" style="background: rgba(59,130,246,0.1); color: var(--info-600)">
            <IconRender icon="carbon:chart-line" :size="22" />
          </div>
          <div class="stat-card__info">
            <span class="stat-card__value">{{ stats.totalUses }}</span>
            <span class="stat-card__label">累计使用次数</span>
          </div>
        </div>
      </section>

      <!-- 最常用 Top 10 -->
      <section class="stats-section">
        <h3 class="stats-section__title">
          <IconRender icon="carbon:fire" :size="18" />
          最常用提示词
        </h3>

        <div v-if="topPrompts.length > 0" class="top-prompts">
          <div
            v-for="(p, idx) in topPrompts"
            :key="p.id"
            class="top-prompt-item"
          >
            <span class="top-prompt-item__rank" :class="`rank-${idx + 1}`">
              {{ idx + 1 }}
            </span>
            <div class="top-prompt-item__info">
              <span class="top-prompt-item__title truncate">{{ p.title }}</span>
              <span class="top-prompt-item__meta">
                {{ getCategoryName(p.categoryId) }} · {{ p.usageCount }} 次使用
              </span>
            </div>
            <div class="top-prompt-item__bar-wrap">
              <div
                class="top-prompt-item__bar"
                :style="{ width: (p.usageCount / maxUsage) * 100 + '%' }"
              ></div>
            </div>
          </div>
        </div>

        <div v-else class="stats-empty">
          <IconRender icon="carbon:chart-bar" :size="32" />
          <p>还没有使用数据</p>
          <p class="stats-empty__hint">使用提示词后会自动统计</p>
        </div>
      </section>

      <!-- 分类分布 -->
      <section class="stats-section">
        <h3 class="stats-section__title">
          <IconRender icon="carbon:chart-pie" :size="18" />
          分类分布
        </h3>

        <div v-if="categoryDistribution.length > 0" class="category-chart">
          <div
            v-for="item in categoryDistribution"
            :key="item.id"
            class="category-bar"
          >
            <div class="category-bar__label">
              <IconRender :icon="item.emoji || 'feather:folder'" :size="13" class="category-bar__emoji" />
              <span class="category-bar__name truncate">{{ item.name }}</span>
              <span class="category-bar__count">{{ item.count }}</span>
            </div>
            <div class="category-bar__track">
              <div
                class="category-bar__fill"
                :style="{ width: (item.count / maxCatCount) * 100 + '%', background: item.color || 'var(--primary-500)' }"
              ></div>
            </div>
            <span class="category-bar__pct">{{ ((item.count / stats.total) * 100).toFixed(0) }}%</span>
          </div>

          <!-- 未分类 -->
          <div v-if="uncategorized > 0" class="category-bar">
            <div class="category-bar__label">
              <IconRender icon="feather:inbox" :size="13" class="category-bar__emoji" />
              <span class="category-bar__name">未分类</span>
              <span class="category-bar__count">{{ uncategorized }}</span>
            </div>
            <div class="category-bar__track">
              <div
                class="category-bar__fill"
                :style="{ width: (uncategorized / stats.total) * 100 + '%', background: 'var(--gray-400)' }"
              ></div>
            </div>
            <span class="category-bar__pct">{{ ((uncategorized / stats.total) * 100).toFixed(0) }}%</span>
          </div>
        </div>

        <div v-else class="stats-empty">
          <IconRender icon="carbon:chart-pie" :size="32" />
          <p>还没有分类数据</p>
        </div>
      </section>

      <!-- 近7天趋势（占位） -->
      <section class="stats-section">
        <h3 class="stats-section__title">
          <IconRender icon="carbon:time" :size="18" />
          使用趋势
        </h3>
        <div class="stats-empty">
          <IconRender icon="carbon:data-structured" :size="32" />
          <p>即将推出</p>
          <p class="stats-empty__hint">近7天/30天使用趋势分析</p>
        </div>
      </section>
    </div>
  </div>
</template>

<script setup lang="ts">
import { computed } from 'vue'
import { usePromptStore } from '@/stores/promptStore'
import { useCategoryStore } from '@/stores/categoryStore'

defineEmits<{ back: [] }>()

const promptStore = usePromptStore()
const categoryStore = useCategoryStore()

// 概览统计
const stats = computed(() => {
  const prompts = promptStore.prompts
  return {
    total: prompts.length,
    categories: categoryStore.categories.length,
    favorites: prompts.filter(p => p.isFavorite).length,
    totalUses: prompts.reduce((sum, p) => sum + p.usageCount, 0),
  }
})

// Top 10 最常用
const topPrompts = computed(() =>
  [...promptStore.prompts]
    .sort((a, b) => b.usageCount - a.usageCount)
    .slice(0, 10)
)

const maxUsage = computed(() =>
  topPrompts.value.length > 0 ? topPrompts.value[0].usageCount : 1
)

// 分类分布
const categoryDistribution = computed(() => {
  const counts = promptStore.countByCategory
  return categoryStore.categories
    .map(cat => ({
      id: cat.id,
      name: cat.name,
      emoji: cat.emoji,
      color: cat.color,
      count: counts[cat.id] ?? 0,
    }))
    .filter(item => item.count > 0)
    .sort((a, b) => b.count - a.count)
})

const maxCatCount = computed(() =>
  categoryDistribution.value.length > 0 ? categoryDistribution.value[0].count : 1
)

const uncategorized = computed(() =>
  promptStore.prompts.filter(p => !p.categoryId).length
)

function getCategoryName(id: string | null | undefined) {
  if (!id) return '未分类'
  return categoryStore.categoryMap.get(id)?.name ?? '未知'
}
</script>

<style scoped>
.stats-view {
  display: flex;
  flex-direction: column;
  height: 100%;
  overflow: hidden;
}

.stats-view__header {
  display: flex;
  align-items: center;
  gap: 12px;
  padding: 16px 24px;
  border-bottom: 1px solid var(--border-color);
  background: var(--bg-surface);
  flex-shrink: 0;
}

.stats-back-btn {
  width: 34px;
  height: 34px;
  display: flex;
  align-items: center;
  justify-content: center;
  border-radius: var(--radius-md);
  font-size: 18px;
  color: var(--text-secondary);
  transition: background var(--transition-fast), color var(--transition-fast);
}
.stats-back-btn:hover { background: var(--gray-100); color: var(--text-primary); }

.stats-view__title {
  font-size: var(--text-lg);
  font-weight: 600;
  color: var(--text-primary);
}

.stats-view__body {
  flex: 1;
  overflow-y: auto;
  padding: 20px 24px;
  display: flex;
  flex-direction: column;
  gap: 24px;
}

/* Overview */
.stats-overview {
  display: grid;
  grid-template-columns: repeat(4, 1fr);
  gap: 12px;
}

.stat-card {
  display: flex;
  align-items: center;
  gap: 12px;
  padding: 16px;
  background: var(--bg-surface);
  border: 1px solid var(--border-color);
  border-radius: var(--radius-lg);
}

.stat-card__icon {
  width: 44px;
  height: 44px;
  border-radius: var(--radius-md);
  display: flex;
  align-items: center;
  justify-content: center;
  flex-shrink: 0;
}

.stat-card__info {
  display: flex;
  flex-direction: column;
  gap: 2px;
}

.stat-card__value {
  font-size: var(--text-2xl);
  font-weight: 700;
  color: var(--text-primary);
  line-height: 1;
}

.stat-card__label {
  font-size: 12px;
  color: var(--text-muted);
  margin-top: 2px;
}

/* Section */
.stats-section {
  display: flex;
  flex-direction: column;
  gap: 12px;
}

.stats-section__title {
  display: flex;
  align-items: center;
  gap: 8px;
  font-size: var(--text-base);
  font-weight: 600;
  color: var(--text-primary);
  padding-bottom: 8px;
  border-bottom: 1px solid var(--border-color);
}

/* Top Prompts */
.top-prompts {
  display: flex;
  flex-direction: column;
  gap: 8px;
}

.top-prompt-item {
  display: flex;
  align-items: center;
  gap: 10px;
  padding: 10px 14px;
  background: var(--bg-surface);
  border: 1px solid var(--border-color);
  border-radius: var(--radius-md);
  transition: border-color var(--transition-fast);
}
.top-prompt-item:hover { border-color: var(--primary-300); }

.top-prompt-item__rank {
  width: 24px;
  height: 24px;
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 11px;
  font-weight: 700;
  flex-shrink: 0;
  background: var(--gray-100);
  color: var(--text-muted);
}
.rank-1 { background: rgba(234,179,8,0.15); color: #b45309; }
.rank-2 { background: rgba(148,163,184,0.15); color: #64748b; }
.rank-3 { background: rgba(180,83,9,0.1); color: #92400e; }

.top-prompt-item__info {
  flex: 1;
  display: flex;
  flex-direction: column;
  gap: 2px;
  min-width: 0;
}

.top-prompt-item__title {
  font-size: var(--text-sm);
  font-weight: 500;
  color: var(--text-primary);
}

.top-prompt-item__meta {
  font-size: 11px;
  color: var(--text-muted);
}

.top-prompt-item__bar-wrap {
  width: 80px;
  flex-shrink: 0;
}

.top-prompt-item__bar {
  height: 5px;
  border-radius: 3px;
  background: var(--primary-400);
  transition: width 600ms cubic-bezier(0.16, 1, 0.3, 1);
  max-width: 100%;
}

/* Category Distribution */
.category-chart {
  display: flex;
  flex-direction: column;
  gap: 8px;
}

.category-bar {
  display: flex;
  align-items: center;
  gap: 10px;
}

.category-bar__label {
  display: flex;
  align-items: center;
  gap: 6px;
  width: 160px;
  flex-shrink: 0;
}

.category-bar__emoji { flex-shrink: 0; }

.category-bar__name {
  font-size: var(--text-sm);
  color: var(--text-primary);
  flex: 1;
}

.category-bar__count {
  font-size: 12px;
  font-weight: 600;
  color: var(--text-secondary);
  min-width: 20px;
  text-align: right;
}

.category-bar__track {
  flex: 1;
  height: 8px;
  background: var(--gray-100);
  border-radius: 4px;
  overflow: hidden;
}

.category-bar__fill {
  height: 100%;
  border-radius: 4px;
  transition: width 600ms cubic-bezier(0.16, 1, 0.3, 1);
  min-width: 4px;
}

.category-bar__pct {
  font-size: 11px;
  color: var(--text-muted);
  min-width: 32px;
  text-align: right;
}

/* Empty state */
.stats-empty {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  gap: 8px;
  padding: 32px;
  background: var(--bg-surface);
  border: 1px dashed var(--border-color);
  border-radius: var(--radius-lg);
  color: var(--text-muted);
  font-size: var(--text-sm);
}

.stats-empty__hint {
  font-size: 12px;
  opacity: 0.7;
}

/* Responsive */
@media (max-width: 640px) {
  .stats-overview {
    grid-template-columns: repeat(2, 1fr);
  }
  .category-bar__label { width: 120px; }
}
</style>

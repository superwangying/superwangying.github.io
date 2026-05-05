/**
 * products.js - 产品数据加载与卡片渲染
 * 支持置顶(pinned)、排序(order)、分类过滤
 */

// 产品数据存储
let allProducts = [];
let currentCategory = 'all';

/**
 * 加载产品数据
 */
async function loadProducts() {
  try {
    const response = await fetch('data/products.json');
    const data = await response.json();
    allProducts = data.products;
    renderCategories(data.categories);
    renderProducts();
  } catch (error) {
    console.error('加载产品数据失败:', error);
  }
}

/**
 * 渲染分类过滤器
 */
function renderCategories(categories) {
  const filterContainer = document.getElementById('categoryFilter');
  if (!filterContainer) return;

  filterContainer.innerHTML = categories.map(cat => `
    <button class="category-btn ${cat.id === 'all' ? 'active' : ''}" 
            data-category="${cat.id}"
            onclick="filterByCategory('${cat.id}')">
      <span class="cat-icon">${cat.icon}</span>
      <span class="cat-name">${cat.name}</span>
    </button>
  `).join('');
}

/**
 * 按分类过滤产品
 */
function filterByCategory(categoryId) {
  currentCategory = categoryId;
  
  // 更新按钮状态
  document.querySelectorAll('.category-btn').forEach(btn => {
    btn.classList.toggle('active', btn.dataset.category === categoryId);
  });
  
  renderProducts();
}

/**
 * 产品排序函数
 * 优先级：pinned > order > updateDate
 */
function sortProducts(products) {
  return [...products].sort((a, b) => {
    // 1. 置顶优先
    if (a.pinned && !b.pinned) return -1;
    if (!a.pinned && b.pinned) return 1;
    
    // 2. order 字段（越小越靠前，99表示最后）
    if (a.order !== b.order) {
      // order 为 99 的排最后
      if (a.order === 99) return 1;
      if (b.order === 99) return -1;
      return a.order - b.order;
    }
    
    // 3. 更新日期（越新越靠前）
    return new Date(b.updateDate) - new Date(a.updateDate);
  });
}

/**
 * 渲染产品卡片
 */
function renderProducts() {
  const grid = document.getElementById('productGrid');
  const emptyState = document.getElementById('emptyState');
  if (!grid) return;

  // 过滤 + 排序
  let filtered = currentCategory === 'all' 
    ? allProducts 
    : allProducts.filter(p => p.category === currentCategory);
  
  filtered = sortProducts(filtered);

  if (filtered.length === 0) {
    grid.style.display = 'none';
    if (emptyState) emptyState.style.display = 'block';
    return;
  }

  grid.style.display = 'grid';
  if (emptyState) emptyState.style.display = 'none';

  grid.innerHTML = filtered.map(product => `
    <div class="product-card ${product.pinned ? 'pinned' : ''}" 
         data-id="${product.id}"
         onclick="showProductDetail('${product.id}')">
      ${product.pinned ? '<div class="pin-badge" title="已置顶">📌</div>' : ''}
      <div class="card-icon">${product.icon}</div>
      <div class="card-body">
        <h3 class="card-title">${product.name}</h3>
        <p class="card-tagline">${product.tagline}</p>
        <div class="card-meta">
          <span class="card-category">${getCategoryName(product.category)}</span>
          <span class="card-date">${formatDate(product.updateDate)}</span>
        </div>
        <div class="card-highlights">
          ${product.highlights.slice(0, 2).map(h => `<span class="highlight-tag">${h}</span>`).join('')}
        </div>
      </div>
      <div class="card-footer">
        <span class="card-version">v${product.version}</span>
        <span class="card-status status-${product.status === '活跃开发' ? 'active' : 'stable'}">${product.status}</span>
      </div>
    </div>
  `).join('');
}

/**
 * 获取分类名称
 */
function getCategoryName(categoryId) {
  const catMap = {
    'tools': '自研工具',
    'apps': '应用产品',
    'webapps': 'Web 应用',
    'extensions': '浏览器插件',
    'opensource': '开源项目',
    'libraries': '库/框架'
  };
  return catMap[categoryId] || categoryId;
}

/**
 * 格式化日期
 */
function formatDate(dateStr) {
  const d = new Date(dateStr);
  return `${d.getMonth() + 1}月${d.getDate()}日`;
}

/**
 * 显示产品详情弹窗
 */
function showProductDetail(productId) {
  const product = allProducts.find(p => p.id === productId);
  if (!product) return;

  const modal = document.getElementById('productModal');
  const modalBody = document.getElementById('modalBody');
  const overlay = document.getElementById('modalOverlay');

  modalBody.innerHTML = `
    <div class="detail-header">
      <div class="detail-icon">${product.icon}</div>
      <div class="detail-info">
        <h2>${product.name}</h2>
        <p class="detail-tagline">${product.tagline}</p>
        <div class="detail-meta">
          <span class="badge-category">${getCategoryName(product.category)}</span>
          <span class="badge-version">v${product.version}</span>
          <span class="badge-status">${product.status}</span>
          ${product.pinned ? '<span class="badge-pinned">📌 已置顶</span>' : ''}
        </div>
      </div>
    </div>
    <div class="detail-description">
      <p>${product.description}</p>
    </div>
    <div class="detail-features">
      <h3>核心功能</h3>
      <ul>
        ${product.features.map(f => `<li>${f}</li>`).join('')}
      </ul>
    </div>
    <div class="detail-highlights">
      <h3>亮点</h3>
      <div class="highlights-grid">
        ${product.highlights.map(h => `<div class="highlight-card">${h}</div>`).join('')}
      </div>
    </div>
    <div class="detail-tech">
      <h3>技术栈</h3>
      <div class="tech-tags">
        ${product.tech.map(t => `<span class="tech-tag">${t}</span>`).join('')}
      </div>
    </div>
    <div class="detail-links">
      ${product.links.demo ? `<a href="${product.links.demo}" target="_blank" class="btn btn-primary">查看演示</a>` : ''}
      ${product.links.github ? `<a href="${product.links.github}" target="_blank" class="btn btn-outline">GitHub</a>` : ''}
      ${product.links.download ? `<a href="${product.links.download}" class="btn btn-download">下载</a>` : ''}
    </div>
  `;

  overlay.classList.add('active');
}

// 关闭弹窗
document.addEventListener('DOMContentLoaded', () => {
  const closeBtn = document.getElementById('modalClose');
  const overlay = document.getElementById('modalOverlay');
  
  if (closeBtn) closeBtn.addEventListener('click', () => overlay.classList.remove('active'));
  if (overlay) overlay.addEventListener('click', (e) => {
    if (e.target === overlay) overlay.classList.remove('active');
  });
});

// 初始化
document.addEventListener('DOMContentLoaded', loadProducts);

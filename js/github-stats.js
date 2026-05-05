/**
 * github-stats.js - GitHub 统计信息加载
 * 由于 API 限制，此处提供静态数据作为备选
 */

// 静态统计数据（当 API 不可用时使用）
const STATIC_STATS = {
  followers: '--',
  public_repos: 6,
  totalStars: '--',
  totalForks: '--'
};

/**
 * 尝试从 GitHub API 加载数据
 */
async function loadGitHubStats() {
  const username = 'superwangying';
  
  try {
    // 尝试获取用户数据
    const userResp = await fetch(`https://api.github.com/users/${username}`);
    
    if (userResp.ok) {
      const userData = await userResp.json();
      updateStat('statFollowers', userData.followers);
      updateStat('statProducts', 6); // 产品数量
      
      // 更新分类数
      const categories = document.querySelectorAll('.category-btn');
      if (categories.length > 0) {
        updateStat('statCategories', categories.length - 1); // 减去"全部"
      }
      
      // 获取仓库数据（stars/forks）
      const reposResp = await fetch(`https://api.github.com/users/${username}/repos?per_page=100`);
      if (reposResp.ok) {
        const repos = await reposResp.json();
        const stars = repos.reduce((sum, repo) => sum + repo.stargazers_count, 0);
        const forks = repos.reduce((sum, repo) => sum + repo.forks_count, 0);
        
        updateStat('statStars', stars);
        updateStat('statForks', forks);
      }
    } else {
      // API 失败，使用静态数据
      useStaticStats();
    }
  } catch (error) {
    console.log('GitHub API 访问受限，使用静态数据');
    useStaticStats();
  }
}

/**
 * 更新统计数字（带动画效果）
 */
function updateStat(elementId, value) {
  const el = document.getElementById(elementId);
  if (!el) return;
  
  const target = typeof value === 'number' ? value : parseInt(value) || 0;
  
  // 简单的数字动画
  let current = 0;
  const increment = Math.ceil(target / 30);
  const timer = setInterval(() => {
    current += increment;
    if (current >= target) {
      current = target;
      clearInterval(timer);
    }
    el.textContent = current.toLocaleString();
  }, 30);
}

/**
 * 使用静态数据
 */
function useStaticStats() {
  updateStat('statFollowers', STATIC_STATS.followers);
  updateStat('statProducts', STATIC_STATS.public_repos);
  updateStat('statCategories', 6);
  updateStat('statStars', STATIC_STATS.totalStars);
  updateStat('statForks', STATIC_STATS.totalForks);
}

// 页面加载后执行
document.addEventListener('DOMContentLoaded', () => {
  // 延迟加载，避免阻塞主要资源
  setTimeout(loadGitHubStats, 1000);
});

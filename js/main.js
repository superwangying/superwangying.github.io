/**
 * main.js - 主导航、滚动、交互逻辑
 */

// ===== Navbar Scroll Effect =====
const navbar = document.getElementById('navbar');
let lastScroll = 0;

window.addEventListener('scroll', () => {
  const currentScroll = window.pageYOffset;
  
  if (navbar) {
    if (currentScroll > 50) {
      navbar.style.boxShadow = '0 1px 3px rgba(0,0,0,0.1)';
    } else {
      navbar.style.boxShadow = 'none';
    }
  }
  
  lastScroll = currentScroll;
});

// ===== Mobile Nav Toggle =====
const navToggle = document.getElementById('navToggle');
const navLinks = document.getElementById('navLinks');

if (navToggle && navLinks) {
  navToggle.addEventListener('click', () => {
    navLinks.classList.toggle('active');
    navToggle.classList.toggle('active');
  });
  
  // Close mobile nav on link click
  navLinks.querySelectorAll('.nav-link').forEach(link => {
    link.addEventListener('click', () => {
      navLinks.classList.remove('active');
      navToggle.classList.remove('active');
    });
  });
}

// ===== Smooth Scroll for Anchor Links =====
document.querySelectorAll('a[href^="#"]').forEach(anchor => {
  anchor.addEventListener('click', function(e) {
    e.preventDefault();
    const target = document.querySelector(this.getAttribute('href'));
    if (target) {
      const offset = navbar ? navbar.offsetHeight : 0;
      const top = target.getBoundingClientRect().top + window.pageYOffset - offset;
      window.scrollTo({ top, behavior: 'smooth' });
    }
  });
});

// ===== Intersection Observer for Animations =====
const observerOptions = {
  threshold: 0.1,
  rootMargin: '0px 0px -50px 0px'
};

const observer = new IntersectionObserver((entries) => {
  entries.forEach(entry => {
    if (entry.isIntersecting) {
      entry.target.classList.add('animate-in');
      observer.unobserve(entry.target);
    }
  });
}, observerOptions);

// Observe elements
document.querySelectorAll('.product-card, .about-card, .section-header').forEach(el => {
  el.style.opacity = '0';
  el.style.transform = 'translateY(20px)';
  el.style.transition = 'opacity 0.5s ease, transform 0.5s ease';
  observer.observe(el);
});

// Add animate-in class styles
const style = document.createElement('style');
style.textContent = `
  .animate-in {
    opacity: 1 !important;
    transform: translateY(0) !important;
  }
`;
document.head.appendChild(style);

// ===== GitHub Stats (Placeholder) =====
async function loadGitHubStats() {
  const username = 'superwangying';
  
  try {
    // Fetch user data
    const userResponse = await fetch(`https://api.github.com/users/${username}`);
    if (!userResponse.ok) return;
    
    const userData = await userResponse.json();
    
    // Update stats
    const statFollowers = document.getElementById('statFollowers');
    const statStars = document.getElementById('statStars');
    const statForks = document.getElementById('statForks');
    
    if (statFollowers) statFollowers.textContent = userData.followers || 0;
    
    // Fetch repos for stars/forks count
    const reposResponse = await fetch(`https://api.github.com/users/${username}/repos?per_page=100`);
    if (!reposResponse.ok) return;
    
    const repos = await reposResponse.json();
    const totalStars = repos.reduce((sum, repo) => sum + repo.stargazers_count, 0);
    const totalForks = repos.reduce((sum, repo) => sum + repo.forks_count, 0);
    
    if (statStars) statStars.textContent = totalStars;
    if (statForks) statForks.textContent = totalForks;
    
  } catch (error) {
    console.log('GitHub API 访问受限，使用默认值');
  }
}

// ===== Update Product Stats =====
function updateProductStats() {
  const statProducts = document.getElementById('statProducts');
  const statCategories = document.getElementById('statCategories');
  
  if (statProducts) {
    // Count unique products (excluding placeholder)
    const count = allProducts ? allProducts.filter(p => p.id !== 'welcome').length : 0;
    statProducts.textContent = count;
  }
  
  if (statCategories) {
    const categories = allProducts ? [...new Set(allProducts.map(p => p.category))] : [];
    statCategories.textContent = categories.length;
  }
}

// ===== Initialize =====
document.addEventListener('DOMContentLoaded', () => {
  // Load GitHub stats (optional, may fail due to rate limits)
  // loadGitHubStats();
  
  // Update product stats after products load
  setTimeout(() => {
    updateProductStats();
  }, 500);
});

// ===== Keyboard Navigation =====
document.addEventListener('keydown', (e) => {
  // ESC to close modal
  if (e.key === 'Escape') {
    const overlay = document.getElementById('modalOverlay');
    if (overlay) overlay.classList.remove('active');
  }
});

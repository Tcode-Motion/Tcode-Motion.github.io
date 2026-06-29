/**
 * Dynamic GitHub Portfolio Script.
 * Fully automated project loading, caching, filtering, and sorting.
 */

(function () {
  'use strict';

  // Constants
  const CACHE_KEY = 'proj_portfolio_cache';
  const CACHE_TIME_KEY = 'proj_portfolio_cache_time';
  const AUTO_REFRESH_INTERVAL = 3600000; // 1 hour in ms

  // State
  let projectsData = null;
  let activeLanguage = 'all';
  let activeTopic = 'all';
  let searchQuery = '';
  let activeSort = 'newest';

  // DOM Elements
  let gridContainer = null;
  let searchInput = null;
  let sortSelect = null;
  let langChipsContainer = null;
  let topicChipsContainer = null;

  // Initialize on DOM load
  document.addEventListener('DOMContentLoaded', () => {
    initElements();
    setupEventListeners();
    setupOfflineHandlers();
    loadProjects();
  });

  function initElements() {
    gridContainer = document.getElementById('proj-grid');
    searchInput = document.getElementById('proj-search');
    sortSelect = document.getElementById('proj-sort');
    langChipsContainer = document.getElementById('proj-lang-chips');
    topicChipsContainer = document.getElementById('proj-topic-chips');
  }

  function setupEventListeners() {
    if (searchInput) {
      searchInput.addEventListener('input', (e) => {
        searchQuery = e.target.value.toLowerCase().trim();
        renderFilteredProjects();
      });
    }

    if (sortSelect) {
      sortSelect.addEventListener('change', (e) => {
        activeSort = e.target.value;
        renderFilteredProjects();
      });
    }

    // Auto-refresh periodically
    setInterval(() => {
      fetchFreshProjects(true);
    }, AUTO_REFRESH_INTERVAL);
  }

  function setupOfflineHandlers() {
    window.addEventListener('offline', () => {
      showToast('You are offline. Showing cached projects.', 'offline');
    });

    window.addEventListener('online', () => {
      showToast('Connection restored. Updating projects...', 'online');
      fetchFreshProjects(true);
    });
  }

  /**
   * Loads projects from cache first, then fetches fresh data.
   */
  function loadProjects() {
    const cached = localStorage.getItem(CACHE_KEY);
    
    if (cached) {
      try {
        const parsed = JSON.parse(cached);
        if (parsed && Array.isArray(parsed.projects)) {
          projectsData = parsed;
          logger('Loaded from localStorage cache.');
          generateFilterChips();
          updateMetricsDashboard(projectsData.projects);
          renderFilteredProjects();
          
          // Fetch fresh data in background
          fetchFreshProjects(false);
          return;
        }
      } catch (e) {
        logger('Error parsing cache, fetching fresh data...', e);
      }
    }

    // No cache, show skeletons and fetch
    renderSkeletons();
    fetchFreshProjects(true);
  }

  /**
   * Fetches the latest projects.json from server.
   */
  function fetchFreshProjects(forceRender = false) {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 10000); // 10s timeout

    fetch('projects.json', { signal: controller.signal })
      .then(res => {
        clearTimeout(timeoutId);
        if (!res.ok) throw new Error(`HTTP status ${res.status}`);
        return res.json();
      })
      .then(data => {
        if (!data || !Array.isArray(data.projects)) {
          throw new Error('Invalid schema in fetched JSON');
        }

        const isDifferent = checkDataChanged(projectsData, data);
        
        // Save to cache
        localStorage.setItem(CACHE_KEY, JSON.stringify(data));
        localStorage.setItem(CACHE_TIME_KEY, Date.now().toString());
        projectsData = data;

        if (isDifferent || forceRender) {
          logger('Projects updated. Rendering fresh data.');
          generateFilterChips();
          updateMetricsDashboard(data.projects);
          renderFilteredProjects();
        } else {
          logger('No updates found in projects list.');
        }
      })
      .catch(err => {
        clearTimeout(timeoutId);
        logger('Fetch failed: ', err);
        if (!projectsData) {
          renderErrorState();
        } else if (forceRender) {
          showToast('Failed to update projects. Running in offline mode.', 'offline');
        }
      });
  }

  function checkDataChanged(oldData, newData) {
    if (!oldData) return true;
    if (oldData.projects.length !== newData.projects.length) return true;
    
    // Compare dates/pushed timestamps of all projects to check for changes
    for (let i = 0; i < newData.projects.length; i++) {
      const newP = newData.projects[i];
      const oldP = oldData.projects.find(p => p.name === newP.name);
      if (!oldP || oldP.pushed !== newP.pushed || oldP.stars !== newP.stars || oldP.forks !== newP.forks) {
        return true;
      }
    }
    return false;
  }

  /**
   * Extracts languages and popular topics to create filter chips dynamically.
   */
  function generateFilterChips() {
    if (!projectsData || !projectsData.projects) return;
    
    const projects = projectsData.projects;

    // 1. Generate Languages
    const languages = new Set();
    projects.forEach(p => {
      if (p.language) languages.add(p.language);
    });
    
    // 2. Generate Topics (Only count topics with > 1 occurrence for cleaner filters)
    const topicCounts = {};
    projects.forEach(p => {
      if (Array.isArray(p.topics)) {
        p.topics.forEach(t => {
          topicCounts[t] = (topicCounts[t] || 0) + 1;
        });
      }
    });

    const popularTopics = Object.keys(topicCounts)
      .filter(t => topicCounts[t] >= 1)
      .sort((a, b) => topicCounts[b] - topicCounts[a])
      .slice(0, 10); // Limit to top 10 topics for layout sanity

    // 3. Render Language Chips
    if (langChipsContainer) {
      langChipsContainer.innerHTML = '';
      
      // All chip
      const allChip = createChip('All Languages', 'all', activeLanguage === 'all', (val) => {
        activeLanguage = val;
        updateChipsActiveState(langChipsContainer, val);
        renderFilteredProjects();
      });
      langChipsContainer.appendChild(allChip);

      languages.forEach(lang => {
        const chip = createChip(lang, lang, activeLanguage === lang, (val) => {
          activeLanguage = val;
          updateChipsActiveState(langChipsContainer, val);
          renderFilteredProjects();
        });
        langChipsContainer.appendChild(chip);
      });
    }

    // 4. Render Topic Chips
    if (topicChipsContainer) {
      topicChipsContainer.innerHTML = '';
      
      // All chip
      const allChip = createChip('All Topics', 'all', activeTopic === 'all', (val) => {
        activeTopic = val;
        updateChipsActiveState(topicChipsContainer, val);
        renderFilteredProjects();
      });
      topicChipsContainer.appendChild(allChip);

      popularTopics.forEach(top => {
        const chip = createChip(`#${top}`, top, activeTopic === top, (val) => {
          activeTopic = val;
          updateChipsActiveState(topicChipsContainer, val);
          renderFilteredProjects();
        });
        topicChipsContainer.appendChild(chip);
      });
    }
  }

  function createChip(text, val, isActive, onClick) {
    const btn = document.createElement('button');
    btn.type = 'button';
    btn.className = 'proj-chip' + (isActive ? ' proj-active' : '');
    btn.textContent = text;
    btn.setAttribute('data-value', val);
    btn.setAttribute('aria-pressed', isActive ? 'true' : 'false');
    btn.addEventListener('click', () => onClick(val));
    return btn;
  }

  function updateChipsActiveState(container, activeVal) {
    container.querySelectorAll('.proj-chip').forEach(chip => {
      const chipVal = chip.getAttribute('data-value');
      const isActive = chipVal === activeVal;
      chip.classList.toggle('proj-active', isActive);
      chip.setAttribute('aria-pressed', isActive ? 'true' : 'false');
    });
  }

  /**
   * Updates and animates the top metrics dashboard cards.
   */
  function updateMetricsDashboard(projects) {
    if (!projects || !Array.isArray(projects)) return;
    
    const totalRepos = projects.length;
    const totalStars = projects.reduce((acc, p) => acc + (p.stars || 0), 0);
    
    const languages = new Set();
    projects.forEach(p => {
      if (p.language) languages.add(p.language);
    });
    const totalLangs = languages.size;
    
    // Animate the counters
    animateCounter('metric-repos', totalRepos);
    animateCounter('metric-stars', totalStars);
    animateCounter('metric-langs', totalLangs);
    
    // Setup hover glow effects
    setupMetricCardGlow();
  }

  /**
   * Animates counting numbers from 0 to target value.
   */
  function animateCounter(elementId, targetValue) {
    const el = document.getElementById(elementId);
    if (!el) return;
    
    const duration = 1000; // ms
    const startTime = performance.now();
    
    function update(currentTime) {
      const elapsed = currentTime - startTime;
      const progress = Math.min(elapsed / duration, 1);
      // Easing out quad
      const easeProgress = progress * (2 - progress);
      const currentVal = Math.floor(easeProgress * targetValue);
      
      el.textContent = currentVal;
      
      if (progress < 1) {
        requestAnimationFrame(update);
      } else {
        el.textContent = targetValue;
      }
    }
    
    requestAnimationFrame(update);
  }

  /**
   * Sets up mouse-move event handlers to update the coordinates of CSS glow gradients.
   */
  function setupMetricCardGlow() {
    const cards = document.querySelectorAll('.proj-metric-card');
    cards.forEach(card => {
      card.addEventListener('mousemove', (e) => {
        const rect = card.getBoundingClientRect();
        const x = e.clientX - rect.left;
        const y = e.clientY - rect.top;
        card.style.setProperty('--mouse-x', `${x}px`);
        card.style.setProperty('--mouse-y', `${y}px`);
      });
    });
  }

  /**
   * Filter and Sort Projects, then Render Cards.
   */
  function renderFilteredProjects() {
    if (!projectsData || !projectsData.projects) return;

    let filtered = [...projectsData.projects];

    // 1. Language Filter
    if (activeLanguage !== 'all') {
      filtered = filtered.filter(p => p.language === activeLanguage);
    }

    // 2. Topic Filter
    if (activeTopic !== 'all') {
      filtered = filtered.filter(p => Array.isArray(p.topics) && p.topics.includes(activeTopic));
    }

    // 3. Search Query Filter
    if (searchQuery) {
      filtered = filtered.filter(p => {
        const nameMatch = p.name && p.name.toLowerCase().includes(searchQuery);
        const descMatch = p.description && p.description.toLowerCase().includes(searchQuery);
        const langMatch = p.language && p.language.toLowerCase().includes(searchQuery);
        const topicMatch = Array.isArray(p.topics) && p.topics.some(t => t.toLowerCase().includes(searchQuery));
        return nameMatch || descMatch || langMatch || topicMatch;
      });
    }

    // 4. Sort
    if (activeSort === 'newest') {
      // Sort updated desc, name asc
      filtered.sort((a, b) => {
        if (b.updated === a.updated) {
          return a.name.localeCompare(b.name);
        }
        return b.updated.localeCompare(a.updated);
      });
    } else if (activeSort === 'oldest') {
      // Sort updated asc, name asc
      filtered.sort((a, b) => {
        if (a.updated === b.updated) {
          return a.name.localeCompare(b.name);
        }
        return a.updated.localeCompare(b.updated);
      });
    } else if (activeSort === 'stars') {
      // Sort stars desc, name asc
      filtered.sort((a, b) => {
        if (b.stars === a.stars) {
          return a.name.localeCompare(b.name);
        }
        return b.stars - a.stars;
      });
    } else if (activeSort === 'name') {
      // Sort name asc
      filtered.sort((a, b) => a.name.localeCompare(b.name));
    }

    // 5. Update result count
    const resultCounter = document.getElementById('proj-result-count');
    if (resultCounter) {
      if (searchQuery || activeLanguage !== 'all' || activeTopic !== 'all') {
        resultCounter.textContent = `Showing ${filtered.length} of ${projectsData.projects.length}`;
      } else {
        resultCounter.textContent = `Showing all ${projectsData.projects.length} projects`;
      }
    }

    // 6. Render
    renderCards(filtered);
  }

  function renderCards(projects) {
    if (!gridContainer) return;
    
    gridContainer.innerHTML = '';

    if (projects.length === 0) {
      renderEmptyState();
      return;
    }

    const fragment = document.createDocumentFragment();

    projects.forEach((proj, idx) => {
      const card = document.createElement('article');
      card.className = 'proj-card';
      card.setAttribute('tabindex', '0');
      card.setAttribute('aria-label', `Project card: ${proj.display_title || proj.name}`);
      
      // Determine if newly updated (within 30 days)
      const isNew = checkIsNew(proj.updated);

      // Create card structure
      card.innerHTML = `
        <div class="proj-img-wrapper">
          <div class="proj-img-fallback">${proj.name.substring(0, 2).toUpperCase()}</div>
          <img class="proj-img" data-src="${proj.preview_image}" alt="Preview screenshot of ${proj.name}" loading="lazy">
          <div class="proj-badges">
            ${proj.language ? `<span class="proj-badge proj-badge-lang">${proj.language}</span>` : ''}
            ${isNew ? `<span class="proj-badge proj-badge-new" aria-label="Newly updated project">New</span>` : ''}
          </div>
        </div>
        <div class="proj-card-content">
          <div class="proj-card-header">
            ${proj.favicon ? `<img class="proj-favicon" src="${proj.favicon}" alt="" aria-hidden="true" onerror="this.remove()">` : ''}
            <h3 class="proj-card-title">${proj.display_title || proj.name}</h3>
          </div>
          <p class="proj-card-desc">${proj.description || 'No description available.'}</p>
          
          ${Array.isArray(proj.topics) && proj.topics.length > 0 ? `
            <div class="proj-card-topics" aria-label="Project topics">
              ${proj.topics.slice(0, 4).map(t => `<span class="proj-topic">#${t}</span>`).join('')}
            </div>
          ` : ''}
          
          <div class="proj-card-metrics">
            <span class="proj-metric" aria-label="${proj.stars} stars">★ ${proj.stars}</span>
            <span class="proj-metric" aria-label="${proj.forks} forks">⑂ ${proj.forks}</span>
            <span class="proj-updated" aria-label="Last updated on ${proj.updated}">Updated: ${proj.updated}</span>
          </div>
          <div class="proj-card-actions">
            <a href="${proj.website}" target="_blank" rel="noopener noreferrer" class="btn btn-primary proj-btn" aria-label="Open live demo for ${proj.name}">Live Demo</a>
            <a href="${proj.repo}" target="_blank" rel="noopener noreferrer" class="btn btn-secondary proj-btn" aria-label="View repository for ${proj.name} on GitHub">GitHub</a>
          </div>
        </div>
      `;

      // Set up lazy-loading and fallback on image elements
      const img = card.querySelector('.proj-img');
      const fallback = card.querySelector('.proj-img-fallback');
      
      // Fallback visual generation
      const fallbackSrc = generateFallbackImage(proj.name);
      if (fallback) {
        fallback.style.background = `linear-gradient(135deg, var(--bg) 0%, var(--surface) 100%)`;
      }

      img.addEventListener('load', () => {
        img.classList.add('proj-loaded');
        if (fallback) fallback.style.display = 'none';
      });

      img.addEventListener('error', () => {
        img.src = fallbackSrc;
        img.classList.add('proj-loaded');
        if (fallback) fallback.style.display = 'none';
      });

      // Keyboard support: activate first action button on Enter
      card.addEventListener('keydown', (e) => {
        if (e.key === 'Enter' && e.target === card) {
          const firstLink = card.querySelector('.proj-card-actions a');
          if (firstLink) firstLink.click();
        }
      });

      fragment.appendChild(card);
    });

    gridContainer.appendChild(fragment);
    
    // Trigger lazy loading observer for dynamic loading attribute fallback
    observeImages();
  }

  function checkIsNew(dateStr) {
    if (!dateStr) return false;
    try {
      const updated = new Date(dateStr);
      const diffTime = Math.abs(new Date() - updated);
      const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
      return diffDays <= 30;
    } catch (e) {
      return false;
    }
  }

  /**
   * Observes images and swaps data-src to src when entering viewport.
   */
  function observeImages() {
    const images = gridContainer.querySelectorAll('.proj-img[data-src]');
    if ('IntersectionObserver' in window) {
      const io = new IntersectionObserver((entries, observer) => {
        entries.forEach(entry => {
          if (entry.isIntersecting) {
            const img = entry.target;
            img.src = img.getAttribute('data-src');
            img.removeAttribute('data-src');
            observer.unobserve(img);
          }
        });
      }, { rootMargin: '0px 0px 100px 0px' });

      images.forEach(img => io.observe(img));
    } else {
      // Fallback
      images.forEach(img => {
        img.src = img.getAttribute('data-src');
        img.removeAttribute('data-src');
      });
    }
  }

  /**
   * Generates a canvas fallback image with project initials.
   */
  function generateFallbackImage(projectName) {
    try {
      const canvas = document.createElement('canvas');
      canvas.width = 480;
      canvas.height = 270;
      const ctx = canvas.getContext('2d');
      
      // Gradient background
      const grad = ctx.createLinearGradient(0, 0, canvas.width, canvas.height);
      grad.addColorStop(0, '#04060f');
      grad.addColorStop(1, '#101828');
      ctx.fillStyle = grad;
      ctx.fillRect(0, 0, canvas.width, canvas.height);
      
      // Draw grid
      ctx.strokeStyle = 'rgba(13, 242, 139, 0.03)';
      ctx.lineWidth = 1;
      const gridSize = 30;
      for (let x = 0; x < canvas.width; x += gridSize) {
        ctx.beginPath();
        ctx.moveTo(x, 0);
        ctx.lineTo(x, canvas.height);
        ctx.stroke();
      }
      for (let y = 0; y < canvas.height; y += gridSize) {
        ctx.beginPath();
        ctx.moveTo(0, y);
        ctx.lineTo(canvas.width, y);
        ctx.stroke();
      }
      
      // Form initials
      const cleanName = projectName.replace(/[-_.]/g, ' ').trim();
      const words = cleanName.split(' ');
      const initials = words.length > 1 
        ? (words[0][0] + words[1][0]).toUpperCase() 
        : cleanName.substring(0, 2).toUpperCase();
        
      // Shadow and text
      ctx.shadowColor = 'rgba(13, 242, 139, 0.25)';
      ctx.shadowBlur = 12;
      ctx.fillStyle = '#0df28b'; // var(--accent)
      ctx.font = 'bold 64px sans-serif';
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';
      ctx.fillText(initials, canvas.width / 2, canvas.height / 2);
      
      return canvas.toDataURL();
    } catch (e) {
      // Return simple SVG fallback
      return `data:image/svg+xml;utf8,<svg xmlns="http://www.w3.org/2000/svg" width="480" height="270" style="background:%2304060f"><text x="50%" y="50%" fill="%230df28b" font-size="64" font-weight="bold" text-anchor="middle" dominant-baseline="middle">${projectName.substring(0, 2).toUpperCase()}</text></svg>`;
    }
  }

  function renderSkeletons() {
    if (!gridContainer) return;
    gridContainer.innerHTML = '';
    
    for (let i = 0; i < 6; i++) {
      const sk = document.createElement('div');
      sk.className = 'proj-card proj-skeleton';
      sk.innerHTML = `
        <div class="proj-img-wrapper">
          <div class="proj-skeleton-img proj-shimmer"></div>
        </div>
        <div class="proj-card-content">
          <div class="proj-skeleton-title proj-shimmer"></div>
          <div class="proj-skeleton-desc proj-shimmer"></div>
          <div class="proj-skeleton-desc-2 proj-shimmer"></div>
          <div class="proj-skeleton-metrics proj-shimmer"></div>
        </div>
      `;
      gridContainer.appendChild(sk);
    }
  }

  function renderEmptyState() {
    if (!gridContainer) return;
    gridContainer.innerHTML = `
      <div class="proj-empty-state">
        <div class="proj-empty-title">No Projects Found</div>
        <div class="proj-empty-desc">No projects match the active search query or filter settings.</div>
      </div>
    `;
  }

  function renderErrorState() {
    if (!gridContainer) return;
    gridContainer.innerHTML = `
      <div class="proj-empty-state" style="border-color: var(--accent4);">
        <div class="proj-empty-title" style="color: var(--accent4);">Unable to Load Projects</div>
        <div class="proj-empty-desc" style="margin-bottom: 16px;">There was an error fetching the projects list. Please check your network connection.</div>
        <button type="button" class="btn btn-secondary" onclick="window.location.reload()">Retry</button>
      </div>
    `;
  }

  /**
   * Helper to display non-intrusive toast messages.
   */
  function showToast(message, type) {
    let container = document.getElementById('proj-toast-container');
    if (!container) {
      container = document.createElement('div');
      container.id = 'proj-toast-container';
      container.className = 'proj-toast-container';
      document.body.appendChild(container);
    }

    const toast = document.createElement('div');
    toast.className = 'proj-toast';
    
    const iconClass = type === 'offline' ? 'proj-toast-icon-offline' : 'proj-toast-icon-online';
    const iconSymbol = type === 'offline' ? '⚠️' : '⚡';

    toast.innerHTML = `
      <span class="${iconClass}">${iconSymbol}</span>
      <span>${message}</span>
    `;

    container.appendChild(toast);
    
    // Animate in
    setTimeout(() => toast.classList.add('show'), 50);

    // Remove after 4s
    setTimeout(() => {
      toast.classList.remove('show');
      setTimeout(() => toast.remove(), 300);
    }, 4000);
  }

  function logger(...args) {
    console.log('[Portfolio Dashboard]', ...args);
  }

})();

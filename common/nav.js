/**
 * Global Navigation Component — Khanchic Dashboards
 * Auto-injects responsive topbar navigation across all dashboard pages.
 */
(function() {
  function initGlobalNav() {
    if (document.getElementById('gnav-root')) return;

    const path = window.location.pathname.toLowerCase();
    
    // Resolve base path
    let base = '/dashboards/';
    if (!path.includes('/dashboards/')) {
      // Local or relative fallback
      const segments = path.split('/').filter(Boolean);
      base = segments.length > 1 ? '../' : './';
    }

    // Determine active tab key
    let activeKey = 'home';
    if (path.includes('smm-heatmap')) activeKey = 'smm';
    else if (path.includes('powerbi')) activeKey = 'powerbi';
    else if (path.includes('promo-codes') || path.includes('promo-vipbonus')) activeKey = 'promo';
    else if (path.includes('chat') || path.includes('chat-triage')) activeKey = 'chat';
    else if (path.includes('highrollers') || path.includes('hr-offers')) activeKey = 'highrollers';
    else if (path.includes('tao-quest')) activeKey = 'tao';
    else if (path.includes('storm-quest')) activeKey = 'storm';
    else if (path.includes('reports') || path.includes('poll-breakdown')) activeKey = 'reports';
    else if (path.includes('onboarding')) activeKey = 'onboarding';

    const tabs = [
      { key: 'home', title: 'Главная', icon: '🏠', href: `${base}` },
      { key: 'smm', title: 'SMM Хитмап', icon: '⚡', href: `${base}smm-heatmap/` },
      { key: 'powerbi', title: 'Power BI', icon: '📊', href: `${base}powerbi/` },
      { key: 'promo', title: 'Промокоды', icon: '🏷️', href: `${base}promo-codes/` },
      { key: 'chat', title: 'Чат-триаж', icon: '💬', href: `${base}chat-triage/` },
      { key: 'highrollers', title: 'Хайроллы', icon: '💎', href: `${base}highrollers/` },
      { key: 'tao', title: 'Квест TAO', icon: '🪐', href: `${base}tao-quest/` },
      { key: 'storm', title: 'Квест Storm', icon: '⚡', href: `${base}storm-quest/` },
      { key: 'reports', title: 'Отчёты', icon: '📋', href: `${base}reports/` },
      { key: 'onboarding', title: 'Онбординг', icon: '🎓', href: `${base}onboarding/` }
    ];

    const topbar = document.createElement('header');
    topbar.id = 'gnav-root';
    topbar.className = 'gnav-topbar';

    const inner = document.createElement('div');
    inner.className = 'gnav-inner';

    // Left brand
    const left = document.createElement('div');
    left.className = 'gnav-left';
    left.innerHTML = `
      <a href="${base}" class="gnav-brand">
        <span class="gnav-logo">⚡</span>
        <span class="gnav-brand-text">Dashboards</span>
        <span class="gnav-badge">USA2</span>
      </a>
    `;

    // Center tabs
    const nav = document.createElement('nav');
    nav.className = 'gnav-tabs';
    nav.setAttribute('role', 'tablist');

    tabs.forEach(t => {
      const a = document.createElement('a');
      a.className = `gnav-tab ${t.key === activeKey ? 'active' : ''}`;
      a.href = t.href;
      a.innerHTML = `
        <span class="gnav-tab-icon">${t.icon}</span>
        <span class="gnav-tab-label">${t.title}</span>
      `;
      if (t.key === activeKey) {
        a.setAttribute('aria-current', 'page');
      }
      nav.appendChild(a);
    });

    // Right status
    const right = document.createElement('div');
    right.className = 'gnav-right';
    right.innerHTML = `
      <div class="gnav-live-indicator" title="Все системы активны">
        <span class="gnav-live-dot"></span>
        <span>Live</span>
      </div>
    `;

    inner.appendChild(left);
    inner.appendChild(nav);
    inner.appendChild(right);
    topbar.appendChild(inner);

    // Insert at beginning of body or replace #global-nav placeholder
    const existing = document.getElementById('global-nav');
    if (existing) {
      existing.replaceWith(topbar);
    } else {
      document.body.insertBefore(topbar, document.body.firstChild);
    }

    // Auto-scroll active tab into view on small screens
    const activeEl = nav.querySelector('.gnav-tab.active');
    if (activeEl) {
      setTimeout(() => {
        activeEl.scrollIntoView({ behavior: 'smooth', inline: 'center', block: 'nearest' });
      }, 100);
    }
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', initGlobalNav);
  } else {
    initGlobalNav();
  }
})();

/**
 * Global Navigation Component — Khanchic Dashboards
 * Top bar is completely removed per user request ("нужно убрать все сверху").
 * Navigation is accessible via a discreet floating button in the bottom right corner.
 */
(function() {
  function initNav() {
    // 1. Completely remove any topbar if present in the DOM
    const oldTop = document.getElementById('gnav-root') || document.querySelector('.gnav-topbar');
    if (oldTop) oldTop.remove();

    if (document.getElementById('gnav-fab-root')) return;

    const path = window.location.pathname.toLowerCase();
    const hash = window.location.hash.toLowerCase();

    // Resolve base path
    let base = '/dashboards/';
    if (!path.includes('/dashboards/')) {
      const segments = path.split('/').filter(Boolean);
      base = segments.length > 1 ? '../' : './';
    }

    // Determine active tab key
    let activeKey = 'home';
    if (hash.includes('powerbi') || path.includes('powerbi')) {
      activeKey = 'powerbi';
    } else if (path.includes('smm-heatmap')) {
      activeKey = 'smm';
    } else if (path.includes('promo-codes') || path.includes('promo-vipbonus')) {
      activeKey = 'promo';
    } else if (path.includes('chat') || path.includes('chat-triage')) {
      activeKey = 'chat';
    } else if (path.includes('highrollers') || path.includes('hr-offers')) {
      activeKey = 'highrollers';
    } else if (path.includes('tao-quest')) {
      activeKey = 'tao';
    } else if (path.includes('storm-quest')) {
      activeKey = 'storm';
    } else if (path.includes('reports') || path.includes('poll-breakdown')) {
      activeKey = 'reports';
    } else if (path.includes('onboarding')) {
      activeKey = 'onboarding';
    }

    const tabs = [
      { key: 'home', title: 'Главная (Хаб)', icon: '🏠', href: `${base}` },
      { key: 'powerbi', title: 'Power BI Live', icon: '📊', href: `${base}powerbi/` },
      { key: 'smm', title: 'SMM Хитмап', icon: '⚡', href: `${base}smm-heatmap/` },
      { key: 'promo', title: 'Промокоды', icon: '🏷️', href: `${base}promo-codes/` },
      { key: 'chat', title: 'Чат-триаж', icon: '💬', href: `${base}chat-triage/` },
      { key: 'highrollers', title: 'Хайроллы', icon: '💎', href: `${base}highrollers/` },
      { key: 'tao', title: 'Квест TAO', icon: '🪐', href: `${base}tao-quest/` },
      { key: 'storm', title: 'Квест Storm', icon: '⚡', href: `${base}storm-quest/` },
      { key: 'reports', title: 'Отчёты', icon: '📋', href: `${base}reports/` },
      { key: 'onboarding', title: 'Онбординг', icon: '🎓', href: `${base}onboarding/` }
    ];

    // Root wrapper
    const root = document.createElement('div');
    root.id = 'gnav-fab-root';

    // Backdrop
    const backdrop = document.createElement('div');
    backdrop.className = 'gnav-drawer-backdrop';

    // Drawer
    const drawer = document.createElement('div');
    drawer.className = 'gnav-drawer';
    drawer.innerHTML = `
      <div class="gnav-drawer-header">
        <div class="gnav-drawer-title">
          <span>⚡</span>
          <span>Навигация по разделам</span>
        </div>
        <button type="button" class="gnav-drawer-close" aria-label="Закрыть">✕</button>
      </div>
      <div class="gnav-drawer-list">
        ${tabs.map(t => `
          <a href="${t.href}" class="gnav-drawer-item ${t.key === activeKey ? 'active' : ''}">
            <span style="font-size:16px;">${t.icon}</span>
            <span>${t.title}</span>
          </a>
        `).join('')}
      </div>
    `;

    // Floating button (docked in bottom-right)
    const fab = document.createElement('button');
    fab.type = 'button';
    fab.className = 'gnav-fab';
    fab.innerHTML = `
      <span class="gnav-fab-icon">⚡</span>
      <span>Меню</span>
    `;

    function toggleMenu(open) {
      const isOpen = typeof open === 'boolean' ? open : !drawer.classList.contains('open');
      drawer.classList.toggle('open', isOpen);
      backdrop.classList.toggle('open', isOpen);
    }

    fab.onclick = () => toggleMenu();
    backdrop.onclick = () => toggleMenu(false);
    drawer.querySelector('.gnav-drawer-close').onclick = () => toggleMenu(false);

    document.addEventListener('keydown', e => {
      if (e.key === 'Escape' && drawer.classList.contains('open')) {
        toggleMenu(false);
      }
    });

    root.appendChild(backdrop);
    root.appendChild(drawer);
    root.appendChild(fab);
    document.body.appendChild(root);

    // If on SMM Heatmap and URL has #powerbi, activate powerbi tab automatically
    if (path.includes('smm-heatmap') && hash.includes('powerbi')) {
      if (typeof window.switchMainTab === 'function') {
        window.switchMainTab('powerbi');
      }
    }
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', initNav);
  } else {
    initNav();
  }
})();

/**
 * TAO Discord Arc Dashboard — Application Logic
 * Interactive multi-week campaign switcher, story branch simulator, prompt copiers, Discord preview toggles, and campaign export.
 */

// State: Days 2 to 7 branches (Day 1 is single root start scene)
let selectedBranches = {
  2: 'A',
  3: 'A',
  4: 'A',
  5: 'A',
  6: 'A',
  7: 'A'
};

let currentFilter = 'all';

// DOM Elements
const timelineStripEl = document.getElementById('interactive-timeline-strip');
const pathDisplayEl = document.getElementById('active-path-display');
const daysContainerEl = document.getElementById('days-cards-container');
const toastEl = document.getElementById('toast-element');
const toastMsgEl = document.getElementById('toast-message');
const toastIconEl = document.getElementById('toast-icon');

// Initialize
document.addEventListener('DOMContentLoaded', () => {
  setupWeekSwitcher();
  renderCurrentWeek();
  setupFilterTabs();
  setupHeaderActions();
  setupDnaCopy();
});

/**
 * Setup Week Switcher Tabs & State Restoration
 */
function setupWeekSwitcher() {
  const weekTabsContainer = document.getElementById('week-tabs-container');
  if (!weekTabsContainer) return;

  // Render week tab buttons if ALL_ARCS is available
  if (typeof ALL_ARCS !== 'undefined') {
    weekTabsContainer.innerHTML = '';
    Object.keys(ALL_ARCS).forEach(weekKey => {
      const arc = ALL_ARCS[weekKey];
      const isWeek2 = weekKey === 'week-2';
      const btn = document.createElement('button');
      btn.className = `week-tab-btn ${weekKey === CURRENT_WEEK_ID ? 'active' : ''}`;
      btn.id = `tab-${weekKey}`;
      btn.setAttribute('data-week', weekKey);
      btn.innerHTML = `
        <span class="week-tab-icon">${isWeek2 ? '🌴' : '🔑'}</span>
        <span class="week-tab-title">${arc.tabLabel || arc.metadata.titleRu}</span>
        <span class="week-tab-badge ${isWeek2 ? 'badge-active' : 'badge-archive'}">${isWeek2 ? 'Текущая' : 'Архив'}</span>
      `;

      btn.addEventListener('click', () => {
        switchWeek(weekKey);
      });

      weekTabsContainer.appendChild(btn);
    });
  }

  // Restore active week from URL hash or localStorage
  const urlHash = window.location.hash.replace('#', '');
  const savedWeek = localStorage.getItem('tao_active_week');
  if (urlHash && (urlHash === 'week-1' || urlHash === 'week-2')) {
    switchWeek(urlHash, false);
  } else if (savedWeek && (savedWeek === 'week-1' || savedWeek === 'week-2')) {
    switchWeek(savedWeek, false);
  }
}

/**
 * Switch Active Week Campaign
 */
function switchWeek(weekId, showToastNotice = true) {
  if (typeof setActiveArcWeek === 'function') {
    const activeArc = setActiveArcWeek(weekId);
    if (!activeArc) return;

    // Update active tab buttons
    document.querySelectorAll('.week-tab-btn').forEach(btn => {
      if (btn.getAttribute('data-week') === weekId) {
        btn.classList.add('active');
      } else {
        btn.classList.remove('active');
      }
    });

    // Save state
    localStorage.setItem('tao_active_week', weekId);
    if (window.location.hash !== `#${weekId}`) {
      history.replaceState(null, '', `#${weekId}`);
    }

    // Reset branch selections
    selectedBranches = { 2: 'A', 3: 'A', 4: 'A', 5: 'A', 6: 'A', 7: 'A' };

    // Re-render UI
    renderCurrentWeek();

    if (showToastNotice) {
      showToast(`Переключено: ${activeArc.metadata.titleRu}`, '🔀');
    }
  }
}

/**
 * Render all components for current active week
 */
function renderCurrentWeek() {
  updateHeaderInfo();
  renderTimelineStrip();
  renderDaysCards();
  updatePathDisplay();
  updateCounterText();
  applyFilter(currentFilter);
}

/**
 * Update Header and Lore Elements dynamically
 */
function updateHeaderInfo() {
  if (typeof ARC_METADATA === 'undefined') return;

  const headingTitleEl = document.getElementById('heading-arc-title');
  const arcBadgeEl = document.getElementById('arc-badge');
  const subheadingEl = document.getElementById('page-subheading');
  const specRoleEl = document.getElementById('spec-char-role');
  const dnaTextEl = document.getElementById('dna-token-text');

  if (headingTitleEl) headingTitleEl.textContent = ARC_METADATA.titleRu;
  if (arcBadgeEl) {
    arcBadgeEl.textContent = CURRENT_WEEK_ID === 'week-2' ? 'Неделя 2 (Текущая)' : 'Неделя 1 (Архив)';
    arcBadgeEl.style.borderColor = CURRENT_WEEK_ID === 'week-2' ? 'rgba(0, 240, 255, 0.4)' : 'rgba(255, 200, 55, 0.4)';
  }
  
  if (typeof ALL_ARCS !== 'undefined' && ALL_ARCS[CURRENT_WEEK_ID]) {
    const arc = ALL_ARCS[CURRENT_WEEK_ID];
    if (subheadingEl && arc.subheading) subheadingEl.textContent = arc.subheading;
    if (specRoleEl && arc.characterDna && arc.characterDna.role) specRoleEl.textContent = arc.characterDna.role;
    if (dnaTextEl && arc.dnaPrefix) dnaTextEl.textContent = arc.dnaPrefix;
  }

  document.title = `🪐 ТАО: ${ARC_METADATA.titleRu} — 7-Day Quest Dashboard`;
}

/**
 * Update total counter text
 */
function updateCounterText() {
  const counterEl = document.getElementById('total-scenes-counter');
  if (counterEl) {
    counterEl.textContent = '13 сцен (1 старт + 12 ответвлений)';
  }
}

/**
 * Render 7-Step Interactive Node Timeline
 */
function renderTimelineStrip() {
  if (!timelineStripEl || !QUEST_DAYS) return;
  timelineStripEl.innerHTML = '';

  QUEST_DAYS.forEach((qDay) => {
    const node = document.createElement('div');
    const isTwist = qDay.day === 4;
    const isSingle = qDay.isSingleScene;

    node.className = `timeline-step-node ${isTwist ? 'twist-node' : ''} ${isSingle ? 'root-node' : ''}`;
    node.id = `timeline-node-${qDay.day}`;

    if (isSingle) {
      // Day 1: Root Kickoff Scene, controls Day 2's starting branch
      const activeD2Choice = selectedBranches[2];
      const optALabel = qDay.votingOptions && qDay.votingOptions.A ? qDay.votingOptions.A.label : 'Вариант A';
      const optBLabel = qDay.votingOptions && qDay.votingOptions.B ? qDay.votingOptions.B.label : 'Вариант B';
      node.innerHTML = `
        <div class="step-day-pill" style="color: var(--accent-gold);">День 1 🚀 СТАРТ</div>
        <div class="step-name">${qDay.singleScene.label}</div>
        <div class="node-branch-toggle">
          <button class="branch-choice-btn ${activeD2Choice === 'A' ? 'selected-a' : ''}" 
                  data-target-day="2" data-branch="A" id="btn-node-1-a" title="Выбор на День 2: ${optALabel}">
            🅰️ ${optALabel} (Д2)
          </button>
          <button class="branch-choice-btn ${activeD2Choice === 'B' ? 'selected-b' : ''}" 
                  data-target-day="2" data-branch="B" id="btn-node-1-b" title="Выбор на День 2: ${optBLabel}">
            🅱️ ${optBLabel} (Д2)
          </button>
        </div>
      `;

      const btnA = node.querySelector('#btn-node-1-a');
      const btnB = node.querySelector('#btn-node-1-b');

      btnA.addEventListener('click', (e) => {
        e.stopPropagation();
        setBranch(2, 'A');
      });

      btnB.addEventListener('click', (e) => {
        e.stopPropagation();
        setBranch(2, 'B');
      });

    } else {
      // Days 2 to 7: Dual branch choices
      const activeChoice = selectedBranches[qDay.day];
      const labelA = qDay.branches && qDay.branches.A ? qDay.branches.A.label : 'Ветка A';
      const labelB = qDay.branches && qDay.branches.B ? qDay.branches.B.label : 'Ветка B';
      node.innerHTML = `
        <div class="step-day-pill">День ${qDay.day} ${isTwist ? '💥' : ''}</div>
        <div class="step-name">${getShortDayTitle(qDay.day)}</div>
        <div class="node-branch-toggle">
          <button class="branch-choice-btn ${activeChoice === 'A' ? 'selected-a' : ''}" 
                  data-day="${qDay.day}" data-branch="A" id="btn-node-${qDay.day}-a" title="${labelA}">
            🅰️ ${labelA.substring(0, 7)}…
          </button>
          <button class="branch-choice-btn ${activeChoice === 'B' ? 'selected-b' : ''}" 
                  data-day="${qDay.day}" data-branch="B" id="btn-node-${qDay.day}-b" title="${labelB}">
            🅱️ ${labelB.substring(0, 7)}…
          </button>
        </div>
      `;

      const btnA = node.querySelector(`[data-branch="A"]`);
      const btnB = node.querySelector(`[data-branch="B"]`);

      btnA.addEventListener('click', (e) => {
        e.stopPropagation();
        setBranch(qDay.day, 'A');
      });

      btnB.addEventListener('click', (e) => {
        e.stopPropagation();
        setBranch(qDay.day, 'B');
      });
    }

    // Click node to scroll
    node.addEventListener('click', (e) => {
      if (e.target.tagName !== 'BUTTON') {
        scrollToDay(qDay.day);
      }
    });

    timelineStripEl.appendChild(node);
  });
}

/**
 * Set selected branch for a day
 */
function setBranch(day, branch) {
  selectedBranches[day] = branch;

  // Update Day 1 buttons if target day is 2
  if (day === 2) {
    const d1BtnA = document.getElementById('btn-node-1-a');
    const d1BtnB = document.getElementById('btn-node-1-b');
    if (d1BtnA && d1BtnB) {
      if (branch === 'A') {
        d1BtnA.classList.add('selected-a');
        d1BtnB.classList.remove('selected-b');
      } else {
        d1BtnB.classList.add('selected-b');
        d1BtnA.classList.remove('selected-a');
      }
    }
  }

  // Update Timeline Buttons UI
  const btnA = document.getElementById(`btn-node-${day}-a`);
  const btnB = document.getElementById(`btn-node-${day}-b`);
  if (btnA && btnB) {
    if (branch === 'A') {
      btnA.classList.add('selected-a');
      btnB.classList.remove('selected-b');
    } else {
      btnB.classList.add('selected-b');
      btnA.classList.remove('selected-a');
    }
  }

  updatePathDisplay();
  highlightBranchCard(day, branch);
  showToast(`День ${day}: выбран вариант ${branch === 'A' ? '🅰️' : '🅱️'}`, '🔀');
}

/**
 * Update Path Display String
 */
function updatePathDisplay() {
  if (!pathDisplayEl) return;
  const pathParts = [`<span style="color: var(--accent-gold); font-weight: 700;">🚀 1 (Старт)</span>`];

  for (let d = 2; d <= 7; d++) {
    const b = selectedBranches[d];
    const isTwist = d === 4;
    const isA = b === 'A';
    const color = isA ? 'var(--accent-cyan)' : 'var(--accent-orange)';
    pathParts.push(`<span style="color: ${color}; font-weight: 700;">${d}${b}${isTwist ? '💥' : ''}</span>`);
  }

  pathDisplayEl.innerHTML = pathParts.join(' ➔ ');
}

/**
 * Highlight Active Branch Card
 */
function highlightBranchCard(day, branch) {
  if (day === 1) return; // Day 1 has only single scene
  const cardA = document.getElementById(`scene-card-${day}A`);
  const cardB = document.getElementById(`scene-card-${day}B`);
  if (!cardA || !cardB) return;

  if (branch === 'A') {
    cardA.style.borderColor = 'var(--accent-cyan)';
    cardA.style.boxShadow = '0 0 20px rgba(0, 240, 255, 0.2)';
    cardB.style.borderColor = 'var(--border-subtle)';
    cardB.style.boxShadow = 'none';
  } else {
    cardB.style.borderColor = 'var(--accent-orange)';
    cardB.style.boxShadow = '0 0 20px rgba(255, 123, 0, 0.2)';
    cardA.style.borderColor = 'var(--border-subtle)';
    cardA.style.boxShadow = 'none';
  }
}

/**
 * Render all 7 Day Cards
 */
function renderDaysCards() {
  if (!daysContainerEl || !QUEST_DAYS) return;
  daysContainerEl.innerHTML = '';

  QUEST_DAYS.forEach((qDay) => {
    const isTwist = qDay.day === 4;
    const isSingle = qDay.isSingleScene;

    const dayCard = document.createElement('article');
    dayCard.className = `day-module-card ${isTwist ? 'twist-day' : ''}`;
    dayCard.id = `day-card-${qDay.day}`;
    dayCard.setAttribute('data-day', qDay.day);

    let contentHtml = '';

    if (isSingle) {
      // Day 1 Single Kickoff Scene
      contentHtml = `
        <div class="day-header">
          <div class="day-title-group">
            <div class="day-number-badge" style="background: linear-gradient(135deg, rgba(255, 200, 55, 0.25), rgba(255, 123, 0, 0.25)); border-color: var(--accent-gold); color: var(--accent-gold);">
              ДЕНЬ 1 🚀 СТАРТ
            </div>
            <div class="day-title-text">
              <h3>${qDay.titleRu}</h3>
              <span class="day-act-label">${qDay.act} • ${qDay.titleEn}</span>
            </div>
          </div>

          <div style="display: flex; gap: 8px;">
            <button class="action-btn" style="padding: 6px 12px; font-size: 12px;" onclick="focusDay(${qDay.day})">
              🎯 Фокус на дне
            </button>
          </div>
        </div>

        <p class="day-summary-text">
          <strong>Сюжетный синопсис:</strong> ${qDay.summary}<br>
          <span style="color: var(--accent-gold);">⚡ Голосование старта (определяет кадр Дня 2):</span> <em>«${qDay.votingQuestion}»</em>
        </p>

        <!-- Single Master Scene Card -->
        <div class="single-scene-card" id="scene-card-1">
          <div class="branch-card-header">
            <span class="kickoff-badge">
              🌟 Стартовый мастер-кадр недели (#1)
            </span>
            <span style="font-size: 12px; color: var(--text-muted); font-family: 'Space Grotesk', sans-serif;">Кадр #1 (Kickoff Scene)</span>
          </div>

          <h4 class="scene-heading" style="font-size: 18px;">${qDay.singleScene.sceneTitle}</h4>

          <div class="kickoff-voting-options">
            <div class="voting-option-box opt-a">
              <strong>Вариант 🅰️ (голос комьюнити):</strong><br>
              ${qDay.votingOptions.A.choiceText}
            </div>
            <div class="voting-option-box opt-b">
              <strong>Вариант 🅱️ (голос комьюнити):</strong><br>
              ${qDay.votingOptions.B.choiceText}
            </div>
          </div>

          <!-- Nano Banana 2 Prompt Block -->
          <div class="prompt-container">
            <div class="prompt-bar-label">
              <span>Nano Banana 2 Prompt (16:9 Cinematic 3D)</span>
              <span style="color: var(--accent-gold); font-size: 10px;">Stylized 3D • Ref: Attached TAO PNG</span>
            </div>
            <div class="prompt-text-box" id="prompt-text-1">${escapeHtml(qDay.singleScene.prompt)}</div>
            <button class="copy-prompt-btn" data-target="prompt-text-1" id="btn-copy-prompt-1">
              <span>📋</span> <span>Скопировать первый стартовый промпт для Gemini</span>
            </button>
          </div>

          <!-- Discord Post Preview Accordion -->
          <div class="discord-accordion">
            <button class="accordion-trigger" data-target="accordion-body-1">
              <span>💬 Стартовый текст публикации для Discord (Запуск квеста)</span>
              <span class="accordion-arrow">▼</span>
            </button>
            <div class="accordion-body" id="accordion-body-1">
              <div class="discord-preview-box" id="discord-text-1">${escapeHtml(qDay.singleScene.discordCopy)}</div>
              <button class="copy-discord-btn" data-target="discord-text-1" id="btn-copy-discord-1">
                <span>💬</span> <span>Скопировать стартовый пост для Discord</span>
              </button>
            </div>
          </div>
        </div>
      `;
    } else {
      // Days 2 to 7 Dual Branching Grid
      contentHtml = `
        <div class="day-header">
          <div class="day-title-group">
            <div class="day-number-badge">ДЕНЬ ${qDay.day} ${isTwist ? '💥' : ''}</div>
            <div class="day-title-text">
              <h3>${qDay.titleRu}</h3>
              <span class="day-act-label">${qDay.act} • ${qDay.titleEn}</span>
            </div>
          </div>

          <div style="display: flex; gap: 8px;">
            <button class="action-btn" style="padding: 6px 12px; font-size: 12px;" onclick="focusDay(${qDay.day})">
              🎯 Фокус на дне
            </button>
          </div>
        </div>

        <p class="day-summary-text">
          <strong>Сюжетный синопсис:</strong> ${qDay.summary}<br>
          <span style="color: var(--accent-gold);">⚡ Интерактивный вопрос дня:</span> <em>«${qDay.votingQuestion}»</em>
        </p>

        <!-- Branches Grid (A vs B) -->
        <div class="branches-grid">
          ${renderBranchCard(qDay.day, 'A', qDay.branches.A)}
          ${renderBranchCard(qDay.day, 'B', qDay.branches.B)}
        </div>
      `;
    }

    dayCard.innerHTML = contentHtml;
    daysContainerEl.appendChild(dayCard);
  });

  // Attach event listeners for copies and accordions
  attachDynamicCardEvents();
}

/**
 * Render single branch card (A or B)
 */
function renderBranchCard(day, branchLetter, branchData) {
  const isA = branchLetter === 'A';
  const branchClass = isA ? 'branch-a' : 'branch-b';
  const badgeClass = isA ? 'branch-badge-a' : 'branch-badge-b';
  const btnClass = isA ? 'copy-prompt-btn-a' : 'copy-prompt-btn-b';
  const promoCode = branchData.promoCode ? `<div class="promocode-pill" style="margin-top: 8px; display:inline-block; font-family: monospace; font-size: 13px; font-weight: 700; background: rgba(255,200,55,0.15); border: 1px solid var(--accent-gold); color: var(--accent-gold); padding: 4px 10px; border-radius: 6px;">🎁 Промокод: ${escapeHtml(branchData.promoCode)}</div>` : '';

  return `
    <div class="branch-card ${branchClass}" id="scene-card-${branchData.id}">
      <div class="branch-card-header">
        <span class="branch-indicator-badge ${badgeClass}">
          ${isA ? '🅰️ Ветка А' : '🅱️ Ветка B'} (${branchData.label})
        </span>
        <span style="font-size: 12px; color: var(--text-muted); font-family: 'Space Grotesk', sans-serif;">
          Кадр #${branchData.id}
        </span>
      </div>

      <div class="branch-choice-quote">
        <strong>Выбор зрителей:</strong> ${branchData.choiceText}
      </div>

      <h4 class="scene-heading">${branchData.sceneTitle}</h4>
      ${promoCode}

      <!-- Nano Banana 2 Prompt Block -->
      <div class="prompt-container" style="margin-top: 14px;">
        <div class="prompt-bar-label">
          <span>Nano Banana 2 Prompt (16:9)</span>
          <span style="color: ${isA ? 'var(--accent-cyan)' : 'var(--accent-orange)'}; font-size: 10px;">ID: ${branchData.id}</span>
        </div>
        <div class="prompt-text-box" id="prompt-text-${branchData.id}">${escapeHtml(branchData.prompt)}</div>
        <button class="copy-prompt-btn ${btnClass}" data-target="prompt-text-${branchData.id}" id="btn-copy-prompt-${branchData.id}">
          <span>📋</span> <span>Скопировать промпт кадра #${branchData.id}</span>
        </button>
      </div>

      <!-- Discord Post Preview Accordion -->
      <div class="discord-accordion">
        <button class="accordion-trigger" data-target="accordion-body-${branchData.id}">
          <span>💬 Текст публикации в Discord для ветки ${branchLetter}</span>
          <span class="accordion-arrow">▼</span>
        </button>
        <div class="accordion-body" id="accordion-body-${branchData.id}">
          <div class="discord-preview-box" id="discord-text-${branchData.id}">${escapeHtml(branchData.discordCopy)}</div>
          <button class="copy-discord-btn" data-target="discord-text-${branchData.id}" id="btn-copy-discord-${branchData.id}">
            <span>💬</span> <span>Скопировать пост ветки #${branchData.id} для Discord</span>
          </button>
        </div>
      </div>
    </div>
  `;
}

/**
 * Attach Card Event Listeners (Prompt copies, discord copies, accordions)
 */
function attachDynamicCardEvents() {
  // Accordion toggle
  document.querySelectorAll('.accordion-trigger').forEach(trigger => {
    trigger.addEventListener('click', () => {
      const targetId = trigger.getAttribute('data-target');
      const bodyEl = document.getElementById(targetId);
      if (bodyEl) {
        bodyEl.classList.toggle('open');
        trigger.classList.toggle('active');
      }
    });
  });

  // Copy Prompt buttons
  document.querySelectorAll('.copy-prompt-btn').forEach(btn => {
    btn.addEventListener('click', () => {
      const targetId = btn.getAttribute('data-target');
      const textEl = document.getElementById(targetId);
      if (textEl) {
        copyToClipboard(textEl.innerText);
        showToast('Промпт успешно скопирован для Google AI Studio!', '📋');
      }
    });
  });

  // Copy Discord text buttons
  document.querySelectorAll('.copy-discord-btn').forEach(btn => {
    btn.addEventListener('click', () => {
      const targetId = btn.getAttribute('data-target');
      const textEl = document.getElementById(targetId);
      if (textEl) {
        copyToClipboard(textEl.innerText);
        showToast('Текст поста для Discord скопирован!', '💬');
      }
    });
  });
}

/**
 * Filter Tabs Logic
 */
function setupFilterTabs() {
  const tabs = document.querySelectorAll('.filter-tab-btn');
  tabs.forEach(tab => {
    tab.addEventListener('click', () => {
      tabs.forEach(t => t.classList.remove('active'));
      tab.classList.add('active');

      const filterVal = tab.getAttribute('data-filter');
      currentFilter = filterVal;
      applyFilter(filterVal);
    });
  });
}

/**
 * Apply Filter on Day Cards
 */
function applyFilter(filterVal) {
  const dayCards = document.querySelectorAll('.day-module-card');
  dayCards.forEach(card => {
    const cardDay = card.getAttribute('data-day');
    if (filterVal === 'all' || filterVal === cardDay) {
      card.style.display = 'block';
    } else {
      card.style.display = 'none';
    }
  });
}

/**
 * Focus Single Day
 */
window.focusDay = function(dayNumber) {
  const targetTab = document.getElementById(`tab-filter-day-${dayNumber}`);
  if (targetTab) {
    targetTab.click();
    scrollToDay(dayNumber);
  }
};

/**
 * Scroll to Day
 */
function scrollToDay(dayNumber) {
  const card = document.getElementById(`day-card-${dayNumber}`);
  if (card) {
    card.scrollIntoView({ behavior: 'smooth', block: 'start' });
  }
}

/**
 * Setup Header Actions (Export Markdown & JSON, Reset)
 */
function setupHeaderActions() {
  // Export Markdown
  const exportMdBtn = document.getElementById('btn-export-markdown');
  if (exportMdBtn) {
    exportMdBtn.addEventListener('click', exportEntireCampaignMarkdown);
  }

  // Export JSON
  const exportJsonBtn = document.getElementById('btn-export-json');
  if (exportJsonBtn) {
    exportJsonBtn.addEventListener('click', exportEntireCampaignJson);
  }

  // Reset Path
  const resetBtn = document.getElementById('btn-reset-path');
  if (resetBtn) {
    resetBtn.addEventListener('click', () => {
      for (let i = 2; i <= 7; i++) {
        setBranch(i, 'A');
      }
      showToast('Маршрут сброшен на базовый (Все ветки А)', '🔄');
    });
  }
}

/**
 * Setup DNA Token Copy
 */
function setupDnaCopy() {
  const copyDnaBtn = document.getElementById('btn-copy-dna');
  const dnaTextEl = document.getElementById('dna-token-text');
  if (copyDnaBtn && dnaTextEl) {
    copyDnaBtn.addEventListener('click', () => {
      copyToClipboard(dnaTextEl.innerText);
      showToast('DNA префикс ТАО скопирован!', '🧬');
    });
  }
}

/**
 * Export Entire Campaign as Clean Markdown
 */
function exportEntireCampaignMarkdown() {
  const activeTitle = ARC_METADATA ? ARC_METADATA.titleRu : 'TAO Quest Campaign';
  const activeEn = ARC_METADATA ? ARC_METADATA.title : 'The Quest';
  let md = `# 🪐 TAO: ${activeTitle} (${activeEn})\n`;
  md += `**Интерактивная 7-дневная сюжетная кампания для Discord • Tao Fortune**\n`;
  md += `* Персонаж: ${CHARACTER_DNA ? CHARACTER_DNA.name : 'ТАО'}\n`;
  md += `* Референс: \`assets/TAO_character.png\` (Официальный арт ТАО)\n`;
  md += `* Модель генерации: Google AI Studio / Gemini Nano Banana 2 (16:9 Cinematic 3D)\n\n`;
  md += `---\n\n`;

  QUEST_DAYS.forEach(qDay => {
    md += `## 📅 ${qDay.titleRu} (${qDay.titleEn})\n`;
    md += `**Фаза**: ${qDay.act}\n`;
    md += `**Синопсис**: ${qDay.summary}\n`;
    md += `**Вопрос дня**: ${qDay.votingQuestion}\n\n`;

    if (qDay.isSingleScene) {
      md += `### 🌟 Стартовый Кадр #1: ${qDay.singleScene.sceneTitle}\n`;
      md += `* **Голосование за День 2**:\n`;
      md += `  - 🅰️ ${qDay.votingOptions.A.choiceText}\n`;
      md += `  - 🅱️ ${qDay.votingOptions.B.choiceText}\n`;
      md += `* **Промпт для Nano Banana 2**:\n\`\`\`text\n${qDay.singleScene.prompt}\n\`\`\`\n`;
      md += `* **Текст поста для Discord**:\n\`\`\`markdown\n${qDay.singleScene.discordCopy}\n\`\`\`\n\n`;
    } else {
      // Branch A
      md += `### 🅰️ Кадр ${qDay.branches.A.id}: ${qDay.branches.A.sceneTitle}\n`;
      md += `* **Выбор**: ${qDay.branches.A.choiceText}\n`;
      if (qDay.branches.A.promoCode) md += `* **Промокод**: \`${qDay.branches.A.promoCode}\`\n`;
      md += `* **Промпт для Nano Banana 2**:\n\`\`\`text\n${qDay.branches.A.prompt}\n\`\`\`\n`;
      md += `* **Текст поста для Discord**:\n\`\`\`markdown\n${qDay.branches.A.discordCopy}\n\`\`\`\n\n`;

      // Branch B
      md += `### 🅱️ Кадр ${qDay.branches.B.id}: ${qDay.branches.B.sceneTitle}\n`;
      md += `* **Выбор**: ${qDay.branches.B.choiceText}\n`;
      if (qDay.branches.B.promoCode) md += `* **Промокод**: \`${qDay.branches.B.promoCode}\`\n`;
      md += `* **Промпт для Nano Banana 2**:\n\`\`\`text\n${qDay.branches.B.prompt}\n\`\`\`\n`;
      md += `* **Текст поста для Discord**:\n\`\`\`markdown\n${qDay.branches.B.discordCopy}\n\`\`\`\n\n`;
    }

    md += `---\n\n`;
  });

  downloadFile(`TAO_${CURRENT_WEEK_ID}_Discord_Quest.md`, md, 'text/markdown');
  showToast(`Кампания (${activeTitle}) экспортирована в Markdown!`, '📄');
}

/**
 * Export JSON
 */
function exportEntireCampaignJson() {
  const exportData = {
    weekId: CURRENT_WEEK_ID,
    metadata: ARC_METADATA,
    character: CHARACTER_DNA,
    days: QUEST_DAYS
  };
  const jsonStr = JSON.stringify(exportData, null, 2);
  downloadFile(`TAO_${CURRENT_WEEK_ID}_arc_data.json`, jsonStr, 'application/json');
  showToast('Структура кампании экспортирована в JSON!', '💾');
}

/**
 * Helper: Download File
 */
function downloadFile(filename, content, mimeType) {
  const blob = new Blob([content], { type: mimeType });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
}

/**
 * Helper: Copy to Clipboard
 */
function copyToClipboard(text) {
  if (navigator.clipboard && window.isSecureContext) {
    navigator.clipboard.writeText(text);
  } else {
    const textArea = document.createElement('textarea');
    textArea.value = text;
    textArea.style.position = 'fixed';
    textArea.style.left = '-999999px';
    document.body.appendChild(textArea);
    textArea.focus();
    textArea.select();
    try {
      document.execCommand('copy');
    } catch (err) {
      console.error('Fallback copy error', err);
    }
    document.body.removeChild(textArea);
  }
}

/**
 * Helper: Show Toast
 */
let toastTimeout;
function showToast(message, icon = '✨') {
  if (!toastEl) return;
  toastMsgEl.textContent = message;
  toastIconEl.textContent = icon;
  toastEl.classList.add('show');
  clearTimeout(toastTimeout);
  toastTimeout = setTimeout(() => {
    toastEl.classList.remove('show');
  }, 3000);
}

/**
 * Helper: Get Short Title for Node
 */
function getShortDayTitle(day) {
  if (typeof QUEST_DAYS !== 'undefined' && QUEST_DAYS[day - 1]) {
    const title = QUEST_DAYS[day - 1].titleRu;
    const parts = title.split(':');
    return parts.length > 1 ? parts[1].replace(/\(.*\)/, '').trim() : title;
  }
  return `День ${day}`;
}

/**
 * Helper: Escape HTML
 */
function escapeHtml(string) {
  return String(string)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#039;');
}

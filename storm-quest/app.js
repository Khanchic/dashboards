/**
 * Storm Rush (STR): Interactive Discord Storytelling Dashboard
 * Logic supporting multi-week campaign switching and dynamic branching
 */

let activeDay = 1;
let communityDecisions = {
  1: 'A',
  2: 'A',
  3: 'A',
  4: 'A',
  5: 'A',
  6: 'A',
  7: 'A'
};

document.addEventListener('DOMContentLoaded', () => {
  setupWeekSwitcher();
  initWeekView();
  initGlobalEvents();
});

/**
 * Setup Week Switcher Tabs & State Restoration
 */
function setupWeekSwitcher() {
  const weekTabsContainer = document.getElementById('week-tabs-container');
  if (!weekTabsContainer) return;

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
        <span class="week-tab-icon">${isWeek2 ? '🎰' : '👑'}</span>
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
  const savedWeek = localStorage.getItem('storm_active_week');
  if (urlHash && (urlHash === 'week-1' || urlHash === 'week-2')) {
    switchWeek(urlHash, false);
  } else if (savedWeek && (savedWeek === 'week-1' || savedWeek === 'week-2')) {
    switchWeek(savedWeek, false);
  }
}

/**
 * Switch Active Week Campaign
 */
function switchWeek(weekId, updateStorage = true) {
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

    if (updateStorage) {
      localStorage.setItem('storm_active_week', weekId);
      if (window.location.hash !== `#${weekId}`) {
        history.replaceState(null, '', `#${weekId}`);
      }
    }

    communityDecisions = { 1: 'A', 2: 'A', 3: 'A', 4: 'A', 5: 'A', 6: 'A', 7: 'A' };
    activeDay = 1;
    initWeekView();
  }
}

/**
 * Initialize current active week view
 */
function initWeekView() {
  updateHeaderAndMeta();
  initTimeline();
  initDayPills();
  renderDayView(activeDay);
  updateActivePathDisplay();
}

/**
 * Update Header and Lore Metadata
 */
function updateHeaderAndMeta() {
  if (typeof ARC_METADATA === 'undefined') return;

  const headerTitleEl = document.getElementById('header-brand-title');
  const headerSubtitleEl = document.getElementById('header-brand-subtitle');
  const specRoleEl = document.getElementById('spec-char-role');
  const dnaTextEl = document.getElementById('dna-token-text');

  if (headerTitleEl) {
    headerTitleEl.textContent = `STORM RUSH • ${ARC_METADATA.titleRu}`;
  }

  if (typeof ALL_ARCS !== 'undefined' && ALL_ARCS[CURRENT_WEEK_ID]) {
    const arc = ALL_ARCS[CURRENT_WEEK_ID];
    if (headerSubtitleEl && arc.subheading) {
      headerSubtitleEl.textContent = arc.subheading;
    }
    if (specRoleEl && arc.characterDna && arc.characterDna.role) {
      specRoleEl.textContent = arc.characterDna.role;
    }
    if (dnaTextEl && arc.dnaPrefix) {
      dnaTextEl.textContent = arc.dnaPrefix;
    }
  }

  document.title = `⚡ STORM RUSH: ${ARC_METADATA.titleRu} — 7-Day Quest Dashboard`;
}

/**
 * Initialize 7-Day Interactive Node Timeline
 */
function initTimeline() {
  const container = document.getElementById('interactive-timeline-strip');
  if (!container || !QUEST_DAYS) return;

  container.innerHTML = '';

  QUEST_DAYS.forEach((qDay) => {
    const nodeBtn = document.createElement('button');
    nodeBtn.className = `day-node-btn ${qDay.day === activeDay ? 'active' : ''}`;
    nodeBtn.id = `node-day-${qDay.day}`;

    const choice = communityDecisions[qDay.day] || 'A';
    const choiceClass = qDay.isSingleScene ? 'choice-start' : (choice === 'A' ? 'choice-a' : 'choice-b');
    const choiceLabel = qDay.isSingleScene ? '1' : `${qDay.day}${choice}`;

    nodeBtn.innerHTML = `
      <span class="node-day-num">День ${qDay.day}</span>
      <span class="node-branch-choice ${choiceClass}" id="node-choice-label-${qDay.day}">
        ${choiceLabel}
      </span>
    `;

    nodeBtn.addEventListener('click', () => {
      if (activeDay !== qDay.day) {
        selectDay(qDay.day);
      } else if (!qDay.isSingleScene) {
        toggleDayChoice(qDay.day);
      }
    });

    container.appendChild(nodeBtn);
  });
}

/**
 * Initialize Day Filter Pills
 */
function initDayPills() {
  const container = document.getElementById('day-pills-container');
  if (!container || !QUEST_DAYS) return;

  container.innerHTML = '';

  QUEST_DAYS.forEach((qDay) => {
    const pill = document.createElement('button');
    pill.className = `pill-btn ${qDay.day === activeDay ? 'active' : ''}`;
    pill.id = `pill-day-${qDay.day}`;
    pill.textContent = `День ${qDay.day}`;

    pill.addEventListener('click', () => {
      selectDay(qDay.day);
    });

    container.appendChild(pill);
  });
}

/**
 * Select active day
 */
function selectDay(dayNum) {
  activeDay = dayNum;

  document.querySelectorAll('.day-node-btn').forEach(btn => btn.classList.remove('active'));
  const activeNode = document.getElementById(`node-day-${dayNum}`);
  if (activeNode) activeNode.classList.add('active');

  document.querySelectorAll('.pill-btn').forEach(pill => pill.classList.remove('active'));
  const activePill = document.getElementById(`pill-day-${dayNum}`);
  if (activePill) activePill.classList.add('active');

  renderDayView(dayNum);
}

/**
 * Toggle Day Branch Choice between A and B
 */
function toggleDayChoice(dayNum) {
  const current = communityDecisions[dayNum] || 'A';
  communityDecisions[dayNum] = current === 'A' ? 'B' : 'A';

  const labelEl = document.getElementById(`node-choice-label-${dayNum}`);
  if (labelEl) {
    const newChoice = communityDecisions[dayNum];
    labelEl.textContent = `${dayNum}${newChoice}`;
    labelEl.className = `node-branch-choice ${newChoice === 'A' ? 'choice-a' : 'choice-b'}`;
  }

  updateActivePathDisplay();
  renderDayView(activeDay);
}

/**
 * Update Active Path Summary Bar
 */
function updateActivePathDisplay() {
  const displayEl = document.getElementById('active-path-display');
  if (!displayEl || !QUEST_DAYS) return;

  const pathParts = [];
  QUEST_DAYS.forEach(qDay => {
    if (qDay.isSingleScene) {
      pathParts.push(`1 (${communityDecisions[1] || 'A'})`);
    } else {
      pathParts.push(`${qDay.day}${communityDecisions[qDay.day] || 'A'}`);
    }
  });

  displayEl.textContent = pathParts.join(' ➔ ');
}

/**
 * Render Day Details (1 Single Root Scene or 2 Dual Branches)
 */
function renderDayView(dayNum) {
  if (!QUEST_DAYS) return;
  const qDay = QUEST_DAYS.find(d => d.day === dayNum);
  if (!qDay) return;

  const titleEl = document.getElementById('current-day-title');
  const summaryEl = document.getElementById('current-day-summary');
  const container = document.getElementById('branches-container');

  if (titleEl) titleEl.textContent = qDay.titleRu;
  if (summaryEl) summaryEl.textContent = qDay.summary;

  if (!container) return;

  if (qDay.isSingleScene) {
    container.style.gridTemplateColumns = '1fr';
    
    const votingOptA = qDay.votingOptions && qDay.votingOptions.A ? qDay.votingOptions.A.choiceText : '';
    const votingOptB = qDay.votingOptions && qDay.votingOptions.B ? qDay.votingOptions.B.choiceText : '';
    const questionText = qDay.votingQuestion || '';

    container.innerHTML = `
      <div class="branch-panel active-branch">
        <div class="branch-header">
          <span class="branch-tag tag-a">Мастер-Старт Квеста</span>
          <span style="font-size: 11px; color: var(--text-muted);">${escapeHtml(qDay.act || '')}</span>
        </div>
        <h3 class="branch-title">${escapeHtml(qDay.singleScene.sceneTitle)}</h3>

        <div style="background: rgba(0, 229, 255, 0.06); border: 1px solid var(--border-subtle); border-radius: 8px; padding: 12px; font-size: 13px;">
          <div style="font-weight: 700; color: #ffffff; margin-bottom: 6px;">Голосование дня в Discord: ${escapeHtml(questionText)}</div>
          <div style="display: flex; flex-direction: column; gap: 4px;">
            <div style="color: var(--accent-cyan);">${escapeHtml(votingOptA)}</div>
            <div style="color: var(--accent-emerald);">${escapeHtml(votingOptB)}</div>
          </div>
        </div>

        <div class="prompt-container">
          <div class="prompt-bar-label">
            <span>Google Flow / 3D Prompt (16:9 Widescreen)</span>
            <span style="color: var(--accent-cyan); font-size: 10px;">Stylized 3D • Ref: Golem & Sparky</span>
          </div>
          <div class="prompt-text-box" id="prompt-text-1">${escapeHtml(qDay.singleScene.prompt)}</div>
          <button class="copy-prompt-btn" data-target="prompt-text-1" id="btn-copy-prompt-1">
            <span>📋</span> <span>Скопировать стартовый промпт для Google Flow</span>
          </button>
        </div>

        <div class="discord-accordion">
          <button class="accordion-trigger" data-target="accordion-body-1">
            <span>💬 Стартовый текст публикации для Discord (Запуск квеста)</span>
            <span class="accordion-arrow">▼</span>
          </button>
          <div class="accordion-body" id="accordion-body-1">
            <div class="discord-preview-box" id="discord-text-1">${escapeHtml(qDay.singleScene.discordCopy)}</div>
            <button class="action-btn" style="margin-top: 10px; width: 100%; justify-content: center;" data-copy-target="discord-text-1">
              <span>📋 Скопировать пост для Discord</span>
            </button>
          </div>
        </div>
      </div>
    `;
  } else {
    container.style.gridTemplateColumns = '';
    const chosen = communityDecisions[dayNum] || 'A';
    const bA = qDay.branches.A;
    const bB = qDay.branches.B;

    const promoBadgeA = bA.promoCode ? `
      <div class="promo-badge-box">
        <span>🎁 <strong>Победный промокод ветки 🅰️:</strong></span>
        <span class="promo-code-pill">${escapeHtml(bA.promoCode)}</span>
      </div>
    ` : '';

    const promoBadgeB = bB.promoCode ? `
      <div class="promo-badge-box" style="border-color: var(--accent-emerald);">
        <span>🎁 <strong>Победный промокод ветки 🅱️:</strong></span>
        <span class="promo-code-pill">${escapeHtml(bB.promoCode)}</span>
      </div>
    ` : '';

    container.innerHTML = `
      <!-- Branch A Panel -->
      <div class="branch-panel ${chosen === 'A' ? 'active-branch' : ''}" id="panel-branch-A">
        <div class="branch-header">
          <span class="branch-tag tag-a">${escapeHtml(bA.label || 'Ветка 🅰️')}</span>
          <button class="action-btn" style="padding: 4px 10px; font-size: 11px;" onclick="setBranchChoice(${dayNum}, 'A')">
            ${chosen === 'A' ? '✅ Выбрано комьюнити' : 'Выбрать ветку 🅰️'}
          </button>
        </div>
        <h3 class="branch-title">${escapeHtml(bA.sceneTitle)}</h3>

        ${promoBadgeA}

        <div class="prompt-container">
          <div class="prompt-bar-label">
            <span>Google Flow Prompt (16:9)</span>
            <span style="color: var(--accent-cyan); font-size: 10px;">Stylized 3D • Ref: Golem & Sparky</span>
          </div>
          <div class="prompt-text-box" id="prompt-text-${bA.id}">${escapeHtml(bA.prompt)}</div>
          <button class="copy-prompt-btn" data-target="prompt-text-${bA.id}">
            <span>📋</span> <span>Скопировать промпт ветки 🅰️</span>
          </button>
        </div>

        <div class="discord-accordion">
          <button class="accordion-trigger" data-target="accordion-body-${bA.id}">
            <span>💬 Текст публикации Discord (Ветка 🅰️)</span>
            <span class="accordion-arrow">▼</span>
          </button>
          <div class="accordion-body" id="accordion-body-${bA.id}">
            <div class="discord-preview-box" id="discord-text-${bA.id}">${escapeHtml(bA.discordCopy)}</div>
            <button class="action-btn" style="margin-top: 10px; width: 100%; justify-content: center;" data-copy-target="discord-text-${bA.id}">
              <span>📋 Скопировать пост для Discord</span>
            </button>
          </div>
        </div>
      </div>

      <!-- Branch B Panel -->
      <div class="branch-panel ${chosen === 'B' ? 'active-branch-b' : ''}" id="panel-branch-B">
        <div class="branch-header">
          <span class="branch-tag tag-b">${escapeHtml(bB.label || 'Ветка 🅱️')}</span>
          <button class="action-btn" style="padding: 4px 10px; font-size: 11px;" onclick="setBranchChoice(${dayNum}, 'B')">
            ${chosen === 'B' ? '✅ Выбрано комьюнити' : 'Выбрать ветку 🅱️'}
          </button>
        </div>
        <h3 class="branch-title">${escapeHtml(bB.sceneTitle)}</h3>

        ${promoBadgeB}

        <div class="prompt-container">
          <div class="prompt-bar-label">
            <span>Google Flow Prompt (16:9)</span>
            <span style="color: var(--accent-emerald); font-size: 10px;">Stylized 3D • Ref: Golem & Sparky</span>
          </div>
          <div class="prompt-text-box" id="prompt-text-${bB.id}">${escapeHtml(bB.prompt)}</div>
          <button class="copy-prompt-btn" data-target="prompt-text-${bB.id}" style="border-color: var(--accent-emerald);">
            <span>📋</span> <span>Скопировать промпт ветки 🅱️</span>
          </button>
        </div>

        <div class="discord-accordion">
          <button class="accordion-trigger" data-target="accordion-body-${bB.id}">
            <span>💬 Текст публикации Discord (Ветка 🅱️)</span>
            <span class="accordion-arrow">▼</span>
          </button>
          <div class="accordion-body" id="accordion-body-${bB.id}">
            <div class="discord-preview-box" id="discord-text-${bB.id}">${escapeHtml(bB.discordCopy)}</div>
            <button class="action-btn" style="margin-top: 10px; width: 100%; justify-content: center;" data-copy-target="discord-text-${bB.id}">
              <span>📋 Скопировать пост для Discord</span>
            </button>
          </div>
        </div>
      </div>
    `;
  }

  attachDynamicCardListeners();
}

/**
 * User sets specific branch choice
 */
window.setBranchChoice = function(dayNum, choice) {
  communityDecisions[dayNum] = choice;
  
  const labelEl = document.getElementById(`node-choice-label-${dayNum}`);
  if (labelEl) {
    labelEl.textContent = `${dayNum}${choice}`;
    labelEl.className = `node-branch-choice ${choice === 'A' ? 'choice-a' : 'choice-b'}`;
  }

  updateActivePathDisplay();
  renderDayView(dayNum);
};

/**
 * Attach listeners to dynamically created cards
 */
function attachDynamicCardListeners() {
  document.querySelectorAll('.accordion-trigger').forEach(trigger => {
    trigger.addEventListener('click', () => {
      const targetId = trigger.getAttribute('data-target');
      const body = document.getElementById(targetId);
      if (body) {
        const isOpen = body.classList.contains('open');
        body.classList.toggle('open', !isOpen);
        const arrow = trigger.querySelector('.accordion-arrow');
        if (arrow) arrow.textContent = isOpen ? '▼' : '▲';
      }
    });
  });

  document.querySelectorAll('.copy-prompt-btn').forEach(btn => {
    btn.addEventListener('click', () => {
      const targetId = btn.getAttribute('data-target');
      const box = document.getElementById(targetId);
      if (box) {
        copyToClipboard(box.textContent, btn);
      }
    });
  });

  document.querySelectorAll('[data-copy-target]').forEach(btn => {
    btn.addEventListener('click', () => {
      const targetId = btn.getAttribute('data-copy-target');
      const box = document.getElementById(targetId);
      if (box) {
        copyToClipboard(box.textContent, btn);
      }
    });
  });
}

/**
 * Global static events
 */
function initGlobalEvents() {
  const btnDna = document.getElementById('btn-copy-dna');
  if (btnDna) {
    btnDna.addEventListener('click', () => {
      const textEl = document.getElementById('dna-token-text');
      if (textEl) {
        copyToClipboard(textEl.textContent, btnDna);
      }
    });
  }

  const btnReset = document.getElementById('btn-reset-path');
  if (btnReset) {
    btnReset.addEventListener('click', () => {
      communityDecisions = { 1: 'A', 2: 'A', 3: 'A', 4: 'A', 5: 'A', 6: 'A', 7: 'A' };
      initTimeline();
      updateActivePathDisplay();
      renderDayView(activeDay);
    });
  }

  const btnExport = document.getElementById('btn-export-markdown');
  if (btnExport) {
    btnExport.addEventListener('click', () => {
      exportEntireCampaignMarkdown();
    });
  }
}

/**
 * Copy to clipboard with visual feedback
 */
function copyToClipboard(text, btnElement) {
  navigator.clipboard.writeText(text).then(() => {
    const originalText = btnElement.innerHTML;
    btnElement.innerHTML = '<span>✅ Скопировано!</span>';
    btnElement.style.borderColor = 'var(--accent-emerald)';
    btnElement.style.color = 'var(--accent-emerald)';

    setTimeout(() => {
      btnElement.innerHTML = originalText;
      btnElement.style.borderColor = '';
      btnElement.style.color = '';
    }, 2000);
  }).catch(err => {
    console.error('Failed to copy text: ', err);
  });
}

/**
 * Export campaign to markdown
 */
function exportEntireCampaignMarkdown() {
  if (typeof ARC_METADATA === 'undefined' || !QUEST_DAYS) return;

  let md = `# ⚡ STORM RUSH: ${ARC_METADATA.titleRu} (${ARC_METADATA.title})
**Интерактивная 7-дневная сюжетная кампания для Discord • Storm Rush**
* Персонажи: Голем и Спарки (Икринка)
* Референс: \`assets/Golem_and_Sparky.jpg\`
* Модель генерации: Google Flow / Nano Banana 2, 16:9 Widescreen

---

`;

  QUEST_DAYS.forEach(qDay => {
    md += `## 📅 ${qDay.titleRu} (${qDay.titleEn})\n`;
    md += `**Фаза**: ${qDay.act}\n`;
    md += `**Синопсис**: ${qDay.summary}\n`;
    if (qDay.votingQuestion) {
      md += `**Вопрос дня**: ${qDay.votingQuestion}\n\n`;
    }

    if (qDay.isSingleScene) {
      md += `### 🎬 ${qDay.singleScene.sceneTitle}\n\n`;
      md += `**Промпт для Google Flow (16:9):**\n\`\`\`text\n${qDay.singleScene.prompt}\n\`\`\`\n\n`;
      md += `**Текст публикации в Discord:**\n\`\`\`markdown\n${qDay.singleScene.discordCopy}\n\`\`\`\n\n`;
    } else {
      md += `### 🅰️ ${qDay.branches.A.sceneTitle}\n\n`;
      if (qDay.branches.A.promoCode) {
        md += `🎁 **Победный промокод**: \`${qDay.branches.A.promoCode}\`\n\n`;
      }
      md += `**Промпт для Google Flow (16:9):**\n\`\`\`text\n${qDay.branches.A.prompt}\n\`\`\`\n\n`;
      md += `**Текст публикации в Discord:**\n\`\`\`markdown\n${qDay.branches.A.discordCopy}\n\`\`\`\n\n`;

      md += `### 🅱️ ${qDay.branches.B.sceneTitle}\n\n`;
      if (qDay.branches.B.promoCode) {
        md += `🎁 **Победный промокод**: \`${qDay.branches.B.promoCode}\`\n\n`;
      }
      md += `**Промпт для Google Flow (16:9):**\n\`\`\`text\n${qDay.branches.B.prompt}\n\`\`\`\n\n`;
      md += `**Текст публикации в Discord:**\n\`\`\`markdown\n${qDay.branches.B.discordCopy}\n\`\`\`\n\n`;
    }

    md += `---\n\n`;
  });

  const blob = new Blob([md], { type: 'text/markdown;charset=utf-8;' });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.setAttribute('href', url);
  link.setAttribute('download', `Storm_Rush_Quest_Campaign_${CURRENT_WEEK_ID}.md`);
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
}

function escapeHtml(string) {
  const entityMap = {
    '&': '&amp;',
    '<': '&lt;',
    '>': '&gt;',
    '"': '&quot;',
    "'": '&#39;'
  };
  return String(string).replace(/[&<>"']/g, function (s) {
    return entityMap[s];
  });
}

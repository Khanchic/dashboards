/**
 * Storm Rush (STR): The Stolen Crown of Storms — Dashboard Logic
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
  initTimeline();
  initDayPills();
  renderDayView(activeDay);
  updateActivePathDisplay();
  initGlobalEvents();
});

function initTimeline() {
  const container = document.getElementById('interactive-timeline-strip');
  if (!container) return;

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

function initDayPills() {
  const container = document.getElementById('day-pills-container');
  if (!container) return;

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

function updateActivePathDisplay() {
  const displayEl = document.getElementById('active-path-display');
  if (!displayEl) return;

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

function renderDayView(dayNum) {
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
    container.innerHTML = `
      <div class="branch-panel active-branch">
        <div class="branch-header">
          <span class="branch-tag tag-a">Мастер-Старт Квеста</span>
          <span style="font-size: 11px; color: var(--text-muted);">${qDay.act}</span>
        </div>
        <h3 class="branch-title">${escapeHtml(qDay.singleScene.sceneTitle)}</h3>

        <div style="background: rgba(0, 229, 255, 0.06); border: 1px solid var(--border-subtle); border-radius: 8px; padding: 12px; font-size: 13px;">
          <strong>Голосование дня в Discord:</strong> ${escapeHtml(qDay.votingQuestion)}<br>
          <div style="margin-top: 8px; display: flex; flex-direction: column; gap: 4px;">
            <div style="color: var(--accent-cyan);">${escapeHtml(qDay.votingOptions.A.choiceText)}</div>
            <div style="color: var(--accent-emerald);">${escapeHtml(qDay.votingOptions.B.choiceText)}</div>
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

    container.innerHTML = `
      <!-- Branch A Panel -->
      <div class="branch-panel ${chosen === 'A' ? 'active-branch' : ''}" id="panel-branch-A">
        <div class="branch-header">
          <span class="branch-tag tag-a">${bA.branchLabel}</span>
          <button class="action-btn" style="padding: 4px 10px; font-size: 11px;" onclick="setBranchChoice(${dayNum}, 'A')">
            ${chosen === 'A' ? '✅ Выбрано комьюнити' : 'Выбрать ветку 🅰️'}
          </button>
        </div>
        <h3 class="branch-title">${escapeHtml(bA.sceneTitle)}</h3>

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
          <span class="branch-tag tag-b">${bB.branchLabel}</span>
          <button class="action-btn" style="padding: 4px 10px; font-size: 11px;" onclick="setBranchChoice(${dayNum}, 'B')">
            ${chosen === 'B' ? '✅ Выбрано комьюнити' : 'Выбрать ветку 🅱️'}
          </button>
        </div>
        <h3 class="branch-title">${escapeHtml(bB.sceneTitle)}</h3>

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

function exportEntireCampaignMarkdown() {
  let md = `# ⚡ STORM RUSH: Похищенная Корона Гроз (The Stolen Crown of Storms)
**Интерактивная 7-дневная сюжетная кампания для Discord • Storm Rush**
* Персонажи: Голем и Спарки (Икринка)
* Референс: \`assets/Golem_and_Sparky.jpg\`
* Модель генерации: Google Flow / Nano Banana, 16:9 Widescreen

---

`;

  QUEST_DAYS.forEach(qDay => {
    md += `## 📅 ${qDay.titleRu} (${qDay.titleEn})\n`;
    md += `**Фаза**: ${qDay.act}\n`;
    md += `**Синопсис**: ${qDay.summary}\n`;
    md += `**Вопрос дня**: ${qDay.votingQuestion}\n\n`;

    if (qDay.isSingleScene) {
      md += `### 🎬 ${qDay.singleScene.sceneTitle}\n\n`;
      md += `**Промпт для Google Flow (16:9):**\n\`\`\`text\n${qDay.singleScene.prompt}\n\`\`\`\n\n`;
      md += `**Текст публикации в Discord:**\n\`\`\`markdown\n${qDay.singleScene.discordCopy}\n\`\`\`\n\n`;
    } else {
      md += `### 🅰️ ${qDay.branches.A.sceneTitle}\n\n`;
      md += `**Промпт для Google Flow (16:9):**\n\`\`\`text\n${qDay.branches.A.prompt}\n\`\`\`\n\n`;
      md += `**Текст публикации в Discord:**\n\`\`\`markdown\n${qDay.branches.A.discordCopy}\n\`\`\`\n\n`;

      md += `### 🅱️ ${qDay.branches.B.sceneTitle}\n\n`;
      md += `**Промпт для Google Flow (16:9):**\n\`\`\`text\n${qDay.branches.B.prompt}\n\`\`\`\n\n`;
      md += `**Текст публикации в Discord:**\n\`\`\`markdown\n${qDay.branches.B.discordCopy}\n\`\`\`\n\n`;
    }

    md += `---\n\n`;
  });

  const blob = new Blob([md], { type: 'text/markdown;charset=utf-8;' });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.setAttribute('href', url);
  link.setAttribute('download', 'Storm_Rush_7Day_Quest_Campaign.md');
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

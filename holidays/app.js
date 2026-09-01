// US Holidays Interactive Dashboard Logic
// Supports RU / EN bilingual interface, calendar grid, radar, search, filter, and iCal/CSV export.

(function () {
  'use strict';

  // Current UI State
  const state = {
    lang: 'ru',
    search: '',
    selectedCategory: 'all',
    selectedMonth: 'all',
    selectedState: 'all',
    currentView: 'timeline',
    selectedHolidayModal: null
  };

  const holidays = window.HOLIDAYS_DATA || [];

  // Translations
  const i18n = {
    ru: {
      subHeader: '02.09.2026 – 01.01.2027 • Федеральные, штатные, религиозные и коммерческие даты США',
      nextHoliday: 'Ближайший праздник',
      daysLeft: 'дн.',
      today: 'Сегодня',
      totalEvents: 'Всего событий в периоде',
      federalHolidays: 'Федеральных праздников (US Bank)',
      retailPeaks: 'Пиков E-Commerce & Распродаж',
      stateHolidays: 'Праздников отдельных штатов',
      religiousEvents: 'Религиозных и духовных дат',
      filtersTitle: '🔍 Фильтры и поиск',
      reset: 'Сбросить',
      searchPlaceholder: 'Поиск (название, штат, тег)...',
      monthTitle: 'Период / Месяц',
      categoryTitle: 'Категории праздников',
      stateTitle: 'Фильтр по штату США',
      tabTimeline: 'Список и карточки',
      tabCalendar: 'Сетка календаря',
      tabRadar: 'Маркетинговый радар (Q4)',
      tabAnalytics: 'Аналитика',
      showingLabel: 'Показано:',
      ofLabel: 'из',
      detailsHint: 'Подробнее →',
      noResults: 'Событий по заданным фильтрам не найдено',
      noResultsSub: 'Попробуйте изменить категорию, месяц или поисковый запрос.',
      exportIcs: 'Скачать .ICS',
      moreEvents: 'еще',
      months: {
        9: 'Сентябрь 2026',
        10: 'Октябрь 2026',
        11: 'Ноябрь 2026',
        12: 'Декабрь 2026',
        1: 'Январь 2027'
      },
      weekdays: ['Вс', 'Пн', 'Вт', 'Ср', 'Чт', 'Пт', 'Сб'],
      categories: {
        'all': '🌐 Все категории',
        'Federal Holiday': '🏛️ Федеральные праздники',
        'Commercial & Shopping': '🛍️ E-Commerce & Шопинг',
        'State Holiday': '🗽 Праздники штатов',
        'Religious': '🕊️ Религиозные и традиции',
        'National Observance': '📌 Общественные памятные даты',
        'UN & International': '🇺🇳 ООН и международные',
        'Astronomical / Season': '🪐 Астрономические / Сезоны',
        'State Observance': '🗽 Памятные даты штатов'
      }
    },
    en: {
      subHeader: 'Sep 02, 2026 – Jan 01, 2027 • Federal, State, Religious & Commercial Dates in the USA',
      nextHoliday: 'Next Major Event',
      daysLeft: 'days',
      today: 'Today',
      totalEvents: 'Total Events in Period',
      federalHolidays: 'Federal Bank Holidays',
      retailPeaks: 'E-Commerce & Retail Peaks',
      stateHolidays: 'Individual State Holidays',
      religiousEvents: 'Religious & Cultural Observances',
      filtersTitle: '🔍 Filters & Search',
      reset: 'Reset',
      searchPlaceholder: 'Search (name, state, tag)...',
      monthTitle: 'Period / Month',
      categoryTitle: 'Holiday Categories',
      stateTitle: 'Filter by US State',
      tabTimeline: 'Cards & Timeline',
      tabCalendar: 'Calendar Grid',
      tabRadar: 'Marketing Radar (Q4)',
      tabAnalytics: 'Analytics',
      showingLabel: 'Showing:',
      ofLabel: 'of',
      detailsHint: 'View Details →',
      noResults: 'No events found for the given criteria',
      noResultsSub: 'Try broadening your search or resetting category filters.',
      exportIcs: 'Download .ICS',
      moreEvents: 'more',
      months: {
        9: 'September 2026',
        10: 'October 2026',
        11: 'November 2026',
        12: 'December 2026',
        1: 'January 2027'
      },
      weekdays: ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'],
      categories: {
        'all': '🌐 All Categories',
        'Federal Holiday': '🏛️ Federal Holidays',
        'Commercial & Shopping': '🛍️ E-Commerce & Retail',
        'State Holiday': '🗽 State Holidays',
        'Religious': '🕊️ Religious & Faith',
        'National Observance': '📌 National Observances',
        'UN & International': '🇺🇳 UN & International',
        'Astronomical / Season': '🪐 Astronomical / Seasons',
        'State Observance': '🗽 State Observances'
      }
    }
  };

  // DOM Elements
  const els = {
    subHeader: document.getElementById('sub-header-text'),
    countdownVal: document.getElementById('countdown-val'),
    countdownLabel: document.getElementById('countdown-label'),
    langRuBtn: document.getElementById('lang-ru'),
    langEnBtn: document.getElementById('lang-en'),
    exportIcsBtn: document.getElementById('export-ics-btn'),
    exportCsvBtn: document.getElementById('export-csv-btn'),
    exportJsonBtn: document.getElementById('export-json-btn'),
    txtExportIcs: document.getElementById('txt-export-ics'),
    
    // KPI
    kpiTotalVal: document.getElementById('kpi-total-val'),
    kpiFederalVal: document.getElementById('kpi-federal-val'),
    kpiRetailVal: document.getElementById('kpi-retail-val'),
    kpiStateVal: document.getElementById('kpi-state-val'),
    kpiReligiousVal: document.getElementById('kpi-religious-val'),
    
    kpiTotalLbl: document.getElementById('kpi-total-lbl'),
    kpiFederalLbl: document.getElementById('kpi-federal-lbl'),
    kpiRetailLbl: document.getElementById('kpi-retail-lbl'),
    kpiStateLbl: document.getElementById('kpi-state-lbl'),
    kpiReligiousLbl: document.getElementById('kpi-religious-lbl'),
    
    // Sidebar
    searchInput: document.getElementById('search-input'),
    resetBtn: document.getElementById('reset-filters-btn'),
    categoryPills: document.querySelectorAll('.filter-pill'),
    monthBtns: document.querySelectorAll('.month-btn'),
    stateSelect: document.getElementById('state-select'),
    
    txtFiltersTitle: document.getElementById('txt-filters-title'),
    txtMonthTitle: document.getElementById('txt-month-title'),
    txtCategoryTitle: document.getElementById('txt-category-title'),
    txtStateTitle: document.getElementById('txt-state-title'),
    
    // Tabs & Views
    viewTabs: document.querySelectorAll('.view-tab'),
    txtTabTimeline: document.getElementById('txt-tab-timeline'),
    txtTabCalendar: document.getElementById('txt-tab-calendar'),
    txtTabRadar: document.getElementById('txt-tab-radar'),
    txtTabAnalytics: document.getElementById('txt-tab-analytics'),
    
    txtShowingLabel: document.getElementById('txt-showing-label'),
    txtOfLabel: document.getElementById('txt-of-label'),
    visibleCount: document.getElementById('visible-count'),
    
    cardsContainer: document.getElementById('cards-container'),
    calendarContainer: document.getElementById('calendar-container'),
    radarContainer: document.getElementById('radar-container'),
    
    // Analytics
    analyticsCategories: document.getElementById('analytics-categories'),
    analyticsMonths: document.getElementById('analytics-months'),
    analyticsStates: document.getElementById('analytics-states'),
    
    // Modal
    modal: document.getElementById('detail-modal'),
    modalCloseBtn: document.getElementById('modal-close-btn'),
    modalIcon: document.getElementById('modal-icon'),
    modalTitle: document.getElementById('modal-title'),
    modalTitleRu: document.getElementById('modal-title-ru'),
    modalMetaChips: document.getElementById('modal-meta-chips'),
    modalSummary: document.getElementById('modal-summary'),
    modalBusiness: document.getElementById('modal-business'),
    modalMarketing: document.getElementById('modal-marketing'),
    modalStates: document.getElementById('modal-states'),
    modalAddCalBtn: document.getElementById('modal-add-cal-btn')
  };

  // Helper: Format Date
  function formatDateBadge(dateStr) {
    const [year, month, day] = dateStr.split('-');
    const monthsShort = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
    return {
      month: monthsShort[parseInt(month, 10) - 1],
      day: parseInt(day, 10),
      year: year
    };
  }

  // Filter Logic
  function getFilteredHolidays() {
    const q = state.search.trim().toLowerCase();
    
    return holidays.filter(h => {
      // Month filter
      if (state.selectedMonth !== 'all') {
        if (h.month.toString() !== state.selectedMonth) {
          return false;
        }
      }

      // Category filter
      if (state.selectedCategory !== 'all') {
        if (h.category !== state.selectedCategory) {
          return false;
        }
      }

      // State filter
      if (state.selectedState !== 'all') {
        const stateLow = state.selectedState.toLowerCase();
        const matchesState = (h.states || '').toLowerCase().includes(stateLow) || (h.states || '').includes('All 50 US States') || (h.states || '').includes('Federal');
        if (!matchesState) {
          return false;
        }
      }

      // Text Search
      if (q) {
        const matchName = h.name.toLowerCase().includes(q);
        const matchNameRu = (h.name_ru || '').toLowerCase().includes(q);
        const matchSummary = (h.summary || '').toLowerCase().includes(q);
        const matchSummaryRu = (h.summary_ru || '').toLowerCase().includes(q);
        const matchStates = (h.states || '').toLowerCase().includes(q);
        const matchTags = (h.tags || []).some(t => t.toLowerCase().includes(q));
        if (!matchName && !matchNameRu && !matchSummary && !matchSummaryRu && !matchStates && !matchTags) {
          return false;
        }
      }

      return true;
    });
  }

  // Category CSS Class
  function getCategoryClass(cat) {
    switch (cat) {
      case 'Federal Holiday': return 'cat-federal';
      case 'State Holiday': return 'cat-state';
      case 'Commercial & Shopping': return 'cat-commercial';
      case 'Religious': return 'cat-religious';
      case 'National Observance': return 'cat-observance';
      case 'UN & International': return 'cat-un';
      case 'Astronomical / Season': return 'cat-season';
      default: return 'cat-observance';
    }
  }

  // Render Cards / Timeline View
  function renderCards(filtered) {
    if (!els.cardsContainer) return;
    
    if (filtered.length === 0) {
      els.cardsContainer.innerHTML = `
        <div class="empty-state">
          <div class="empty-state-icon">🔎</div>
          <h3>${i18n[state.lang].noResults}</h3>
          <p>${i18n[state.lang].noResultsSub}</p>
        </div>
      `;
      return;
    }

    // Group by month
    const groups = {};
    filtered.forEach(h => {
      const monthKey = `${h.year}-${h.month}`;
      if (!groups[monthKey]) {
        groups[monthKey] = {
          year: h.year,
          month: h.month,
          items: []
        };
      }
      groups[monthKey].items.push(h);
    });

    let html = '';
    const sortedMonthKeys = Object.keys(groups).sort();

    sortedMonthKeys.forEach(mKey => {
      const group = groups[mKey];
      const monthTitle = i18n[state.lang].months[group.month] || `Month ${group.month}`;

      html += `
        <div class="month-group">
          <div class="month-group-header">
            <h2 class="month-group-title">${monthTitle}</h2>
            <span class="month-badge">${group.items.length} ${state.lang === 'ru' ? 'событий' : 'events'}</span>
          </div>
          <div class="holidays-cards-grid">
      `;

      group.items.forEach(h => {
        const dateBadge = formatDateBadge(h.date);
        const catClass = getCategoryClass(h.category);
        const titlePrimary = state.lang === 'ru' ? (h.name_ru || h.name) : h.name;
        const titleSecondary = state.lang === 'ru' ? h.name : (h.name_ru || '');
        const summaryText = state.lang === 'ru' ? (h.summary_ru || h.summary) : h.summary;

        html += `
          <article class="holiday-card" onclick="window.App.openDetailModal('${h.id}')" tabindex="0" role="button" aria-label="${titlePrimary}">
            <div class="card-top">
              <div class="date-badge">
                <span class="date-month">${dateBadge.month}</span>
                <span class="date-day">${dateBadge.day}</span>
              </div>
              <div class="card-header-meta">
                <span class="card-category-tag ${catClass}">
                  <span>${h.icon}</span> ${h.category}
                </span>
                <h3 class="card-title">${titlePrimary}</h3>
                ${titleSecondary && titleSecondary !== titlePrimary ? `<div class="card-title-ru">${titleSecondary}</div>` : ''}
              </div>
            </div>

            <p class="card-summary">${summaryText}</p>

            <div class="card-footer">
              <span class="state-badge-text" title="${h.states}">
                <span>📍</span> ${h.states}
              </span>
              <span class="card-action-hint">${i18n[state.lang].detailsHint}</span>
            </div>
          </article>
        `;
      });

      html += `
          </div>
        </div>
      `;
    });

    els.cardsContainer.innerHTML = html;
  }

  // Render Calendar Grid View
  function renderCalendar(filtered) {
    if (!els.calendarContainer) return;

    // Months in range: Sep 2026, Oct 2026, Nov 2026, Dec 2026, Jan 2027
    const calendarMonths = [
      { year: 2026, month: 9, days: 30, startDay: 2 }, // Sep 1, 2026 is Tuesday (2)
      { year: 2026, month: 10, days: 31, startDay: 4 }, // Oct 1, 2026 is Thursday (4)
      { year: 2026, month: 11, days: 30, startDay: 0 }, // Nov 1, 2026 is Sunday (0)
      { year: 2026, month: 12, days: 31, startDay: 2 }, // Dec 1, 2026 is Tuesday (2)
      { year: 2027, month: 1, days: 31, startDay: 5 }   // Jan 1, 2027 is Friday (5)
    ];

    const activeMonths = state.selectedMonth === 'all' 
      ? calendarMonths 
      : calendarMonths.filter(m => m.month.toString() === state.selectedMonth);

    // Map filtered events by date
    const eventsByDate = {};
    filtered.forEach(h => {
      if (!eventsByDate[h.date]) {
        eventsByDate[h.date] = [];
      }
      eventsByDate[h.date].push(h);
    });

    // Sort events on each day so Federal and Commercial always appear first
    Object.keys(eventsByDate).forEach(d => {
      eventsByDate[d].sort((a, b) => {
        const score = item => item.is_federal ? 3 : (item.is_commercial ? 2 : (item.category === 'State Holiday' ? 1 : 0));
        return score(b) - score(a);
      });
    });

    let html = '';
    const weekdays = i18n[state.lang].weekdays;

    activeMonths.forEach(m => {
      const monthTitle = i18n[state.lang].months[m.month];
      
      html += `
        <div class="calendar-month-block">
          <div class="cal-month-header">
            <h3 class="cal-month-name">${monthTitle}</h3>
          </div>

          <div class="cal-weekdays-row">
            ${weekdays.map(w => `<div class="cal-weekday">${w}</div>`).join('')}
          </div>

          <div class="cal-days-grid">
      `;

      // Empty cells before start of month
      for (let i = 0; i < m.startDay; i++) {
        html += `<div class="cal-day-cell empty"></div>`;
      }

      // Day cells
      const totalDaysToRender = (m.month === 1 && m.year === 2027 && state.selectedMonth === 'all') ? 1 : m.days;
      for (let d = 1; d <= totalDaysToRender; d++) {
        const dateStr = `${m.year}-${m.month.toString().padStart(2, '0')}-${d.toString().padStart(2, '0')}`;
        
        // Check range bounds
        if (dateStr < '2026-09-02' || dateStr > '2027-01-01') {
          html += `<div class="cal-day-cell empty" style="opacity:0.3;"><span class="cal-day-num">${d}</span></div>`;
          continue;
        }

        const dayEvents = eventsByDate[dateStr] || [];
        const hasFederal = dayEvents.some(e => e.is_federal);
        const hasCommercial = dayEvents.some(e => e.is_commercial);

        let cellClasses = 'cal-day-cell';
        if (dayEvents.length > 0) cellClasses += ' has-events';
        if (hasFederal) cellClasses += ' federal-day';
        if (hasCommercial) cellClasses += ' commercial-day';

        html += `
          <div class="${cellClasses}" onclick="window.App.onCalendarDayClick('${dateStr}')">
            <span class="cal-day-num">${d}</span>
            <div class="cal-day-events-preview">
              ${dayEvents.slice(0, 2).map(e => {
                const catClass = getCategoryClass(e.category);
                const title = state.lang === 'ru' ? (e.name_ru || e.name) : e.name;
                return `<div class="cal-event-chip ${catClass}" title="${title}">${e.icon} ${title}</div>`;
              }).join('')}
              ${dayEvents.length > 2 ? `<span style="font-size:0.65rem; color:var(--text-dim);">+${dayEvents.length - 2} ${i18n[state.lang].moreEvents}</span>` : ''}
            </div>
          </div>
        `;
      }

      html += `
          </div>
        </div>
      `;
    });

    els.calendarContainer.innerHTML = html;
  }

  // Render E-Commerce Marketing Radar
  function renderRadar() {
    if (!els.radarContainer) return;

    // Major Q4 peaks
    const radarHolidays = holidays.filter(h => 
      h.is_commercial || 
      h.is_federal || 
      ['Halloween', 'Boss\'s Day', 'Election Day', 'Christmas Eve', 'New Year\'s Eve', 'Chanukah/Hanukkah (first day)'].includes(h.name)
    );

    let html = '';

    radarHolidays.forEach(h => {
      const titlePrimary = state.lang === 'ru' ? (h.name_ru || h.name) : h.name;
      const dateParts = h.date.split('-');
      const formattedDate = `${dateParts[2]}.${dateParts[1]}.${dateParts[0]}`;

      html += `
        <div class="radar-step-card" onclick="window.App.openDetailModal('${h.id}')" style="cursor:pointer;">
          <div class="radar-date-col">
            <span class="radar-date-val">${formattedDate}</span>
            <span class="radar-date-day">${h.day_of_week}</span>
          </div>

          <div class="radar-info-col">
            <h3><span>${h.icon}</span> ${titlePrimary}</h3>
            <p>${state.lang === 'ru' ? (h.summary_ru || h.summary) : h.summary}</p>
          </div>

          <div class="radar-action-col">
            <span class="radar-action-label">${state.lang === 'ru' ? '💡 Маркетинговая стратегия' : '💡 Marketing Strategy'}</span>
            <span class="radar-action-text">${h.marketing_tips}</span>
          </div>
        </div>
      `;
    });

    els.radarContainer.innerHTML = html;
  }

  // Render Analytics View
  function renderAnalytics(filtered) {
    if (!els.analyticsCategories || !els.analyticsMonths || !els.analyticsStates) return;

    // 1. Categories
    const catCounts = {};
    filtered.forEach(h => {
      catCounts[h.category] = (catCounts[h.category] || 0) + 1;
    });

    const maxCat = Math.max(...Object.values(catCounts), 1);
    let catHtml = '';
    Object.keys(catCounts).sort((a, b) => catCounts[b] - catCounts[a]).forEach(cat => {
      const count = catCounts[cat];
      const percent = Math.round((count / maxCat) * 100);
      const catClass = getCategoryClass(cat);
      const label = (i18n[state.lang].categories[cat] || cat);

      catHtml += `
        <div class="bar-chart-row">
          <div class="bar-label-row">
            <span>${label}</span>
            <span><strong>${count}</strong></span>
          </div>
          <div class="bar-track">
            <div class="bar-fill ${catClass}" style="width: ${percent}%;"></div>
          </div>
        </div>
      `;
    });
    els.analyticsCategories.innerHTML = catHtml;

    // 2. Months
    const monthCounts = { 9: 0, 10: 0, 11: 0, 12: 0, 1: 0 };
    filtered.forEach(h => {
      if (monthCounts[h.month] !== undefined) {
        monthCounts[h.month]++;
      }
    });

    const maxMonth = Math.max(...Object.values(monthCounts), 1);
    let monthHtml = '';
    [9, 10, 11, 12, 1].forEach(mNum => {
      const count = monthCounts[mNum];
      const percent = Math.round((count / maxMonth) * 100);
      const label = i18n[state.lang].months[mNum];

      monthHtml += `
        <div class="bar-chart-row">
          <div class="bar-label-row">
            <span>${label}</span>
            <span><strong>${count}</strong></span>
          </div>
          <div class="bar-track">
            <div class="bar-fill" style="width: ${percent}%; background: linear-gradient(90deg, #6366f1, #06b6d4);"></div>
          </div>
        </div>
      `;
    });
    els.analyticsMonths.innerHTML = monthHtml;

    // 3. States
    const stateCounts = {};
    filtered.forEach(h => {
      if (h.states && !h.states.includes('All 50') && !h.states.includes('Nationwide')) {
        const parts = h.states.split(',').map(s => s.trim());
        parts.forEach(s => {
          if (s && s.length > 1 && !s.toLowerCase().includes('states')) {
            stateCounts[s] = (stateCounts[s] || 0) + 1;
          }
        });
      }
    });

    const sortedStates = Object.keys(stateCounts).sort((a, b) => stateCounts[b] - stateCounts[a]).slice(0, 10);
    const maxState = sortedStates.length ? stateCounts[sortedStates[0]] : 1;
    let stateHtml = '';

    sortedStates.forEach(st => {
      const count = stateCounts[st];
      const percent = Math.round((count / maxState) * 100);

      stateHtml += `
        <div class="bar-chart-row">
          <div class="bar-label-row">
            <span>🗽 ${st}</span>
            <span><strong>${count}</strong> ${state.lang === 'ru' ? 'региональных праздников' : 'state holidays'}</span>
          </div>
          <div class="bar-track">
            <div class="bar-fill" style="width: ${percent}%; background: linear-gradient(90deg, #3b82f6, #ec4899);"></div>
          </div>
        </div>
      `;
    });
    els.analyticsStates.innerHTML = stateHtml || '<p style="color:var(--text-dim);font-size:0.85rem;">Нет специфических данных по выбранным фильтрам.</p>';
  }

  // Update All Views and Counts
  function updateDashboard() {
    const filtered = getFilteredHolidays();
    if (els.visibleCount) {
      els.visibleCount.textContent = filtered.length;
    }

    renderCards(filtered);
    renderCalendar(filtered);
    renderRadar();
    renderAnalytics(filtered);
    updateCountdown();
  }

  // Countdown Widget Calculator
  function updateCountdown() {
    if (!els.countdownVal) return;
    
    // Next major federal or commercial event from Sep 2, 2026
    const todayStr = '2026-09-02';
    const upcoming = holidays.find(h => (h.is_federal || h.is_commercial) && h.date >= todayStr);

    if (upcoming) {
      const targetDate = new Date(upcoming.date);
      const refDate = new Date(todayStr);
      const diffDays = Math.ceil((targetDate - refDate) / (1000 * 60 * 60 * 24));
      
      const name = state.lang === 'ru' ? (upcoming.name_ru || upcoming.name) : upcoming.name;
      els.countdownVal.textContent = `${name} (${diffDays} ${i18n[state.lang].daysLeft})`;
    }
  }

  // Open Modal Details
  function openDetailModal(holidayId) {
    const holiday = holidays.find(h => h.id === holidayId);
    if (!holiday) return;

    state.selectedHolidayModal = holiday;

    els.modalIcon.textContent = holiday.icon || '📌';
    els.modalTitle.textContent = state.lang === 'ru' ? (holiday.name_ru || holiday.name) : holiday.name;
    els.modalTitleRu.textContent = state.lang === 'ru' ? holiday.name : (holiday.name_ru || '');

    const catClass = getCategoryClass(holiday.category);
    els.modalMetaChips.innerHTML = `
      <span class="card-category-tag ${catClass}"><span>${holiday.icon}</span> ${holiday.category}</span>
      <span class="card-category-tag" style="background:rgba(255,255,255,0.06);color:#fff;">📅 ${holiday.date} (${holiday.day_of_week})</span>
      ${holiday.is_federal ? '<span class="card-category-tag cat-federal">🏛️ US Federal Holiday</span>' : ''}
      ${holiday.is_commercial ? '<span class="card-category-tag cat-commercial">🛍️ Q4 Retail Peak</span>' : ''}
    `;

    els.modalSummary.textContent = state.lang === 'ru' ? (holiday.summary_ru || holiday.summary) : holiday.summary;
    els.modalBusiness.textContent = holiday.business_impact || 'Обычный рабочий день.';
    els.modalMarketing.textContent = holiday.marketing_tips || 'Тематический контент.';
    els.modalStates.textContent = holiday.states || 'Общефедеральное.';

    els.modal.classList.add('active');
  }

  function closeDetailModal() {
    els.modal.classList.remove('active');
    state.selectedHolidayModal = null;
  }

  // Export ICS Calendar
  function exportICS(singleEvent = null) {
    const eventsToExport = singleEvent ? [singleEvent] : getFilteredHolidays();
    if (eventsToExport.length === 0) return;

    let icsContent = [
      'BEGIN:VCALENDAR',
      'VERSION:2.0',
      'PRODID:-//Antigravity//US Holidays Dashboard 2026-2027//RU',
      'CALSCALE:GREGORIAN',
      'METHOD:PUBLISH',
      'X-WR-CALNAME:US Holidays 2026-2027',
      'X-WR-TIMEZONE:America/New_York'
    ];

    eventsToExport.forEach(h => {
      const dtClean = h.date.replace(/-/g, '');
      const summary = `${h.icon || ''} ${h.name} (${h.name_ru || ''})`.trim();
      const desc = `${h.summary_ru || h.summary}\\n\\nImpact: ${h.business_impact}\\nMarketing: ${h.marketing_tips}`.replace(/\n/g, '\\n');

      icsContent.push(
        'BEGIN:VEVENT',
        `UID:${h.id}@usholidays.dashboard`,
        `DTSTAMP:20260901T000000Z`,
        `DTSTART;VALUE=DATE:${dtClean}`,
        `DTEND;VALUE=DATE:${dtClean}`,
        `SUMMARY:${summary}`,
        `DESCRIPTION:${desc}`,
        `CATEGORIES:${h.category}`,
        'STATUS:CONFIRMED',
        'TRANSP:TRANSPARENT',
        'END:VEVENT'
      );
    });

    icsContent.push('END:VCALENDAR');

    const blob = new Blob([icsContent.join('\r\n')], { type: 'text/calendar;charset=utf-8' });
    const link = document.createElement('a');
    link.href = URL.createObjectURL(blob);
    link.download = singleEvent ? `${singleEvent.id}.ics` : 'US_Holidays_2026_2027.ics';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  }

  // Export CSV
  function exportCSV() {
    const filtered = getFilteredHolidays();
    const headers = ['Date', 'Day', 'Name_EN', 'Name_RU', 'Category', 'States', 'Business_Impact', 'Marketing_Tips'];
    
    const rows = filtered.map(h => [
      `"${h.date}"`,
      `"${h.day_of_week}"`,
      `"${(h.name || '').replace(/"/g, '""')}"`,
      `"${(h.name_ru || '').replace(/"/g, '""')}"`,
      `"${h.category}"`,
      `"${(h.states || '').replace(/"/g, '""')}"`,
      `"${(h.business_impact || '').replace(/"/g, '""')}"`,
      `"${(h.marketing_tips || '').replace(/"/g, '""')}"`
    ]);

    const csvContent = '\uFEFF' + [headers.join(','), ...rows.map(r => r.join(','))].join('\r\n');
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    link.href = URL.createObjectURL(blob);
    link.download = 'US_Holidays_2026_2027.csv';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  }

  // Export JSON
  function exportJSON() {
    const filtered = getFilteredHolidays();
    const blob = new Blob([JSON.stringify(filtered, null, 2)], { type: 'application/json;charset=utf-8;' });
    const link = document.createElement('a');
    link.href = URL.createObjectURL(blob);
    link.download = 'US_Holidays_2026_2027.json';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  }

  // Change Language
  function setLanguage(lang) {
    state.lang = lang;

    if (lang === 'ru') {
      els.langRuBtn.classList.add('active');
      els.langEnBtn.classList.remove('active');
    } else {
      els.langEnBtn.classList.add('active');
      els.langRuBtn.classList.remove('active');
    }

    // Update UI text strings
    const texts = i18n[lang];
    els.subHeader.textContent = texts.subHeader;
    els.countdownLabel.textContent = texts.nextHoliday;
    els.txtFiltersTitle.textContent = texts.filtersTitle;
    els.resetBtn.textContent = texts.reset;
    els.searchInput.placeholder = texts.searchPlaceholder;
    els.txtMonthTitle.textContent = texts.monthTitle;
    els.txtCategoryTitle.textContent = texts.categoryTitle;
    els.txtStateTitle.textContent = texts.stateTitle;
    
    els.txtTabTimeline.textContent = texts.tabTimeline;
    els.txtTabCalendar.textContent = texts.tabCalendar;
    els.txtTabRadar.textContent = texts.tabRadar;
    els.txtTabAnalytics.textContent = texts.tabAnalytics;
    
    els.txtShowingLabel.textContent = texts.showingLabel;
    els.txtOfLabel.textContent = texts.ofLabel;
    els.txtExportIcs.textContent = texts.exportIcs;

    els.kpiTotalLbl.textContent = texts.totalEvents;
    els.kpiFederalLbl.textContent = texts.federalHolidays;
    els.kpiRetailLbl.textContent = texts.retailPeaks;
    els.kpiStateLbl.textContent = texts.stateHolidays;
    els.kpiReligiousLbl.textContent = texts.religiousEvents;

    updateDashboard();
  }

  // Event Listeners Setup
  function initEventListeners() {
    // Search
    els.searchInput.addEventListener('input', (e) => {
      state.search = e.target.value;
      updateDashboard();
    });

    // Reset Filters
    els.resetBtn.addEventListener('click', () => {
      state.search = '';
      state.selectedCategory = 'all';
      state.selectedMonth = 'all';
      state.selectedState = 'all';
      els.searchInput.value = '';
      els.stateSelect.value = 'all';

      els.categoryPills.forEach(p => p.classList.toggle('active', p.dataset.cat === 'all'));
      els.monthBtns.forEach(b => b.classList.toggle('active', b.dataset.month === 'all'));

      updateDashboard();
    });

    // Category Pills
    els.categoryPills.forEach(pill => {
      pill.addEventListener('click', () => {
        els.categoryPills.forEach(p => p.classList.remove('active'));
        pill.classList.add('active');
        state.selectedCategory = pill.dataset.cat;
        updateDashboard();
      });
    });

    // Month Buttons
    els.monthBtns.forEach(btn => {
      btn.addEventListener('click', () => {
        els.monthBtns.forEach(b => b.classList.remove('active'));
        btn.classList.add('active');
        state.selectedMonth = btn.dataset.month;
        updateDashboard();
      });
    });

    // State Select
    els.stateSelect.addEventListener('change', (e) => {
      state.selectedState = e.target.value;
      updateDashboard();
    });

    // View Tabs
    els.viewTabs.forEach(tab => {
      tab.addEventListener('click', () => {
        els.viewTabs.forEach(t => t.classList.remove('active'));
        tab.classList.add('active');
        
        const targetView = tab.dataset.view;
        state.currentView = targetView;

        document.querySelectorAll('.view-section').forEach(sec => {
          sec.classList.remove('active');
        });
        const activeSec = document.getElementById(`view-${targetView}`);
        if (activeSec) activeSec.classList.add('active');
      });
    });

    // Languages
    els.langRuBtn.addEventListener('click', () => setLanguage('ru'));
    els.langEnBtn.addEventListener('click', () => setLanguage('en'));

    // Export Handlers
    els.exportIcsBtn.addEventListener('click', () => exportICS());
    els.exportCsvBtn.addEventListener('click', () => exportCSV());
    els.exportJsonBtn.addEventListener('click', () => exportJSON());

    // Modal Handlers
    els.modalCloseBtn.addEventListener('click', closeDetailModal);
    els.modal.addEventListener('click', (e) => {
      if (e.target === els.modal) closeDetailModal();
    });
    document.addEventListener('keydown', (e) => {
      if (e.key === 'Escape' && els.modal.classList.contains('active')) {
        closeDetailModal();
      }
    });

    els.modalAddCalBtn.addEventListener('click', () => {
      if (state.selectedHolidayModal) {
        exportICS(state.selectedHolidayModal);
      }
    });
  }

  // Global window helpers for onclick handlers
  window.App = {
    openDetailModal: openDetailModal,
    onCalendarDayClick: function (dateStr) {
      const dayEvents = holidays.filter(h => h.date === dateStr);
      if (dayEvents.length > 0) {
        openDetailModal(dayEvents[0].id);
      }
    }
  };

  // Initialize App
  function init() {
    initEventListeners();
    updateDashboard();
  }

  // Launch when DOM is ready
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }

})();

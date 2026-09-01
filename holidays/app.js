// US Holidays Interactive Dashboard Logic
// Full bilingual RU / EN, featured highlights, calendar grid, radar, search, presets, and export.

(function () {
  'use strict';

  // State Management
  const state = {
    lang: 'ru',
    search: '',
    filterType: 'category', // 'category' or 'preset'
    filterVal: 'all',
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
      featuredTitle: '🔥 Главные события и длинные выходные периода',
      totalEvents: 'Всего событий в периоде',
      federalHolidays: 'Федеральных праздников (US Bank)',
      longWeekends: 'Длинных 3-4 дневных уикендов',
      retailPeaks: 'Пиков E-Commerce & Распродаж',
      stateHolidays: 'Праздников отдельных штатов',
      religiousEvents: 'Религиозных и духовных дат',
      filtersTitle: '🔍 Фильтры и поиск',
      presetsTitle: 'Быстрые фильтры',
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
      bankClosedBadge: '🏦 Банки закрыты',
      longWeekendBadge: '🏖️ 3 дня отдыха',
      retailPeakBadge: '🔥 Пик шопинга',
      federalBadge: '🏛️ Федеральный',
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
        'National Observance': '📌 Памятные даты США',
        'UN & International': '🇺🇳 ООН и международные',
        'Astronomical / Season': '🪐 Сезоны и астрономия'
      }
    },
    en: {
      subHeader: 'Sep 02, 2026 – Jan 01, 2027 • Federal, State, Religious & Commercial Dates in the USA',
      nextHoliday: 'Next Major Event',
      daysLeft: 'days',
      today: 'Today',
      featuredTitle: '🔥 Major US Milestones & Long Holiday Weekends',
      totalEvents: 'Total Events in Period',
      federalHolidays: 'Federal Bank Holidays',
      longWeekends: 'Long Holiday Weekends (3-4 Days)',
      retailPeaks: 'E-Commerce & Retail Peaks',
      stateHolidays: 'Individual State Holidays',
      religiousEvents: 'Religious & Cultural Observances',
      filtersTitle: '🔍 Filters & Search',
      presetsTitle: 'Quick Presets',
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
      bankClosedBadge: '🏦 Banks Closed',
      longWeekendBadge: '🏖️ 3-Day Weekend',
      retailPeakBadge: '🔥 Retail Peak',
      federalBadge: '🏛️ Federal Holiday',
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
        'National Observance': '📌 US Observances',
        'UN & International': '🇺🇳 UN & International',
        'Astronomical / Season': '🪐 Seasons & Astronomy'
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
    
    // Featured Carousel
    txtFeaturedTitle: document.getElementById('txt-featured-title'),
    featuredCardsCarousel: document.getElementById('featured-cards-carousel'),

    // KPI
    kpiTotalVal: document.getElementById('kpi-total-val'),
    kpiFederalVal: document.getElementById('kpi-federal-val'),
    kpiWeekendsVal: document.getElementById('kpi-weekends-val'),
    kpiRetailVal: document.getElementById('kpi-retail-val'),
    kpiStateVal: document.getElementById('kpi-state-val'),
    
    kpiTotalLbl: document.getElementById('kpi-total-lbl'),
    kpiFederalLbl: document.getElementById('kpi-federal-lbl'),
    kpiWeekendsLbl: document.getElementById('kpi-weekends-lbl'),
    kpiRetailLbl: document.getElementById('kpi-retail-lbl'),
    kpiStateLbl: document.getElementById('kpi-state-lbl'),
    
    // Sidebar
    searchInput: document.getElementById('search-input'),
    resetBtn: document.getElementById('reset-filters-btn'),
    presetChips: document.querySelectorAll('.preset-chip'),
    monthBtns: document.querySelectorAll('.month-filter-button'),
    stateSelect: document.getElementById('state-select'),
    
    txtFiltersTitle: document.getElementById('txt-filters-title'),
    txtPresetsTitle: document.getElementById('txt-presets-title'),
    txtMonthTitle: document.getElementById('txt-month-title'),
    txtStateTitle: document.getElementById('txt-state-title'),
    
    // Tabs & Views
    viewTabs: document.querySelectorAll('.tab-nav-btn'),
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

  // Calculate Days Until
  function getDaysUntil(dateStr) {
    const refDate = new Date('2026-09-02');
    const targetDate = new Date(dateStr);
    const diffTime = targetDate - refDate;
    return Math.ceil(diffTime / (1000 * 60 * 60 * 24));
  }

  // Category CSS Class
  function getCategoryClass(cat) {
    switch (cat) {
      case 'Federal Holiday': return 'tag-federal';
      case 'State Holiday': return 'tag-state';
      case 'Commercial & Shopping': return 'tag-commercial';
      case 'Religious': return 'tag-religious';
      case 'National Observance': return 'tag-observance';
      case 'UN & International': return 'tag-un';
      default: return 'tag-observance';
    }
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

      // Presets & Categories
      if (state.filterType === 'preset') {
        if (state.filterVal === 'long_weekend' && !h.long_weekend) return false;
      } else if (state.filterType === 'category' && state.filterVal !== 'all') {
        if (h.category !== state.filterVal) {
          return false;
        }
      }

      // State filter
      if (state.selectedState !== 'all') {
        const stateLow = state.selectedState.toLowerCase();
        const matchesState = (h.states || '').toLowerCase().includes(stateLow) || (h.states || '').includes('All 50') || (h.states || '').includes('Federal');
        if (!matchesState) {
          return false;
        }
      }

      // Text Search
      if (q) {
        const matchName = (h.name || '').toLowerCase().includes(q);
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

  // Render Top Featured Milestones Carousel
  function renderFeaturedCarousel() {
    if (!els.featuredCardsCarousel) return;

    const featuredItems = holidays.filter(h => h.is_featured);
    let html = '';

    featuredItems.forEach(h => {
      const days = getDaysUntil(h.date);
      const countdownStr = days === 0 ? i18n[state.lang].today : (days > 0 ? (state.lang === 'ru' ? `через ${days} дн.` : `in ${days} days`) : '');
      const title = state.lang === 'ru' ? (h.name_ru || h.name) : h.name;
      const desc = state.lang === 'ru' ? (h.summary_ru || h.summary) : h.summary;

      const dateParts = h.date.split('-');
      const formattedDate = `${dateParts[2]}.${dateParts[1]}`;

      let highlightClass = '';
      if (h.is_federal) highlightClass = 'highlight-federal';
      else if (h.is_commercial) highlightClass = 'highlight-commercial';

      html += `
        <div class="featured-card ${highlightClass}" onclick="window.App.openDetailModal('${h.id}')" tabindex="0" role="button">
          <div class="featured-card-top">
            <span class="featured-date-badge">📅 ${formattedDate} (${h.day_of_week})</span>
            <span class="featured-countdown-tag">⏳ ${countdownStr}</span>
          </div>

          <div class="featured-card-title">
            <span>${h.icon}</span> ${title}
          </div>

          <div class="featured-card-desc">${desc}</div>

          <div class="featured-card-badges">
            ${h.is_federal ? `<span class="mini-badge badge-bank">${i18n[state.lang].federalBadge}</span>` : ''}
            ${h.bank_closed ? `<span class="mini-badge badge-bank">${i18n[state.lang].bankClosedBadge}</span>` : ''}
            ${h.long_weekend ? `<span class="mini-badge badge-weekend">${i18n[state.lang].longWeekendBadge}</span>` : ''}
            ${h.is_commercial ? `<span class="mini-badge badge-retail">${i18n[state.lang].retailPeakBadge}</span>` : ''}
          </div>
        </div>
      `;
    });

    els.featuredCardsCarousel.innerHTML = html;
  }

  // Render Cards / Timeline View
  function renderCards(filtered) {
    if (!els.cardsContainer) return;
    
    if (filtered.length === 0) {
      els.cardsContainer.innerHTML = `
        <div class="empty-results-box">
          <div class="empty-results-icon">🔎</div>
          <h3>${i18n[state.lang].noResults}</h3>
          <p style="color:var(--text-muted);font-size:0.86rem;margin-top:4px;">${i18n[state.lang].noResultsSub}</p>
        </div>
      `;
      return;
    }

    // Group by month (pad with 0 to ensure strict chronological sorting)
    const groups = {};
    filtered.forEach(h => {
      const monthKey = `${h.year}-${String(h.month).padStart(2, '0')}`;
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
        <div class="month-cards-block">
          <div class="month-block-header">
            <h2 class="month-block-title">${monthTitle}</h2>
            <span class="month-block-badge">${group.items.length} ${state.lang === 'ru' ? 'событий' : 'events'}</span>
          </div>
          <div class="cards-render-grid">
      `;

      group.items.forEach(h => {
        const dateBadge = formatDateBadge(h.date);
        const catClass = getCategoryClass(h.category);
        const titlePrimary = state.lang === 'ru' ? (h.name_ru || h.name) : h.name;
        const titleSecondary = state.lang === 'ru' ? h.name : (h.name_ru || '');
        const summaryText = state.lang === 'ru' ? (h.summary_ru || h.summary) : h.summary;

        html += `
          <article class="holiday-card-modern" onclick="window.App.openDetailModal('${h.id}')" tabindex="0" role="button" aria-label="${titlePrimary}">
            <div class="card-top-row">
              <div class="date-box-square">
                <span class="date-box-month">${dateBadge.month}</span>
                <span class="date-box-day">${dateBadge.day}</span>
              </div>
              <div class="card-titles-col">
                <span class="category-tag-pill ${catClass}">
                  <span>${h.icon}</span> ${h.category}
                </span>
                <h3 class="card-name-main">${titlePrimary}</h3>
                ${titleSecondary && titleSecondary !== titlePrimary ? `<div class="card-name-sub">${titleSecondary}</div>` : ''}
              </div>
            </div>

            <p class="card-desc-snippet">${summaryText}</p>

            <div class="card-bottom-bar">
              <span class="card-states-snippet" title="${h.states}">
                <span>📍</span> ${h.states}
              </span>
              <span class="card-action-link">${i18n[state.lang].detailsHint}</span>
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

    const calendarMonths = [
      { year: 2026, month: 9, days: 30, startDay: 2 },
      { year: 2026, month: 10, days: 31, startDay: 4 },
      { year: 2026, month: 11, days: 30, startDay: 0 },
      { year: 2026, month: 12, days: 31, startDay: 2 },
      { year: 2027, month: 1, days: 31, startDay: 5 }
    ];

    const activeMonths = state.selectedMonth === 'all' 
      ? calendarMonths 
      : calendarMonths.filter(m => m.month.toString() === state.selectedMonth);

    const eventsByDate = {};
    filtered.forEach(h => {
      if (!eventsByDate[h.date]) eventsByDate[h.date] = [];
      eventsByDate[h.date].push(h);
    });

    // Prioritize Federal & Commercial first
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
        <div class="calendar-block-wrapper">
          <h3 class="calendar-header-title">${monthTitle}</h3>

          <div class="cal-week-row">
            ${weekdays.map(w => `<div class="cal-week-col-head">${w}</div>`).join('')}
          </div>

          <div class="cal-cells-grid">
      `;

      for (let i = 0; i < m.startDay; i++) {
        html += `<div class="cal-day-box empty"></div>`;
      }

      const totalDaysToRender = (m.month === 1 && m.year === 2027 && state.selectedMonth === 'all') ? 1 : m.days;
      for (let d = 1; d <= totalDaysToRender; d++) {
        const dateStr = `${m.year}-${m.month.toString().padStart(2, '0')}-${d.toString().padStart(2, '0')}`;
        
        if (dateStr < '2026-09-02' || dateStr > '2027-01-01') {
          html += `<div class="cal-day-box empty" style="opacity:0.3;"><span class="cal-day-number">${d}</span></div>`;
          continue;
        }

        const dayEvents = eventsByDate[dateStr] || [];
        const hasFederal = dayEvents.some(e => e.is_federal);
        const hasCommercial = dayEvents.some(e => e.is_commercial);

        let cellClasses = 'cal-day-box';
        if (hasFederal) cellClasses += ' has-federal';
        if (hasCommercial) cellClasses += ' has-commercial';

        html += `
          <div class="${cellClasses}" onclick="window.App.onCalendarDayClick('${dateStr}')">
            <span class="cal-day-number">${d}</span>
            <div class="cal-day-chips-container">
              ${dayEvents.slice(0, 2).map(e => {
                const catClass = getCategoryClass(e.category);
                const title = state.lang === 'ru' ? (e.name_ru || e.name) : e.name;
                return `<div class="cal-chip-item ${catClass}" title="${title}">${e.icon} ${title}</div>`;
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
        <div class="radar-step-card-modern" onclick="window.App.openDetailModal('${h.id}')">
          <div class="radar-date-side">
            <span class="date-num">${formattedDate}</span>
            <span class="date-day">${h.day_of_week}</span>
          </div>

          <div class="radar-info-side">
            <h3><span>${h.icon}</span> ${titlePrimary}</h3>
            <p>${state.lang === 'ru' ? (h.summary_ru || h.summary) : h.summary}</p>
          </div>

          <div class="radar-checklist-box">
            <span class="radar-checklist-label">💡 ${state.lang === 'ru' ? 'Маркетинговая стратегия' : 'Marketing Strategy'}</span>
            <span class="radar-checklist-text">${h.marketing_tips}</span>
          </div>
        </div>
      `;
    });

    els.radarContainer.innerHTML = html;
  }

  // Render Analytics
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
        <div class="bar-row-item">
          <div class="bar-row-label">
            <span>${label}</span>
            <span><strong>${count}</strong></span>
          </div>
          <div class="bar-track-bg">
            <div class="bar-fill-bar ${catClass}" style="width: ${percent}%;"></div>
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
        <div class="bar-row-item">
          <div class="bar-row-label">
            <span>${label}</span>
            <span><strong>${count}</strong></span>
          </div>
          <div class="bar-track-bg">
            <div class="bar-fill-bar" style="width: ${percent}%; background: linear-gradient(90deg, #d4a24e, #6366f1);"></div>
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
        <div class="bar-row-item">
          <div class="bar-row-label">
            <span>🗽 ${st}</span>
            <span><strong>${count}</strong> ${state.lang === 'ru' ? 'праздников' : 'holidays'}</span>
          </div>
          <div class="bar-track-bg">
            <div class="bar-fill-bar" style="width: ${percent}%; background: linear-gradient(90deg, #38bdf8, #ec4899);"></div>
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

    renderFeaturedCarousel();
    renderCards(filtered);
    renderCalendar(filtered);
    renderRadar();
    renderAnalytics(filtered);
    updateCountdown();
  }

  // Countdown Widget
  function updateCountdown() {
    if (!els.countdownVal) return;
    
    const todayStr = '2026-09-02';
    const upcoming = holidays.find(h => (h.is_federal || h.is_commercial) && h.date >= todayStr);

    if (upcoming) {
      const diffDays = getDaysUntil(upcoming.date);
      const name = state.lang === 'ru' ? (upcoming.name_ru || upcoming.name) : upcoming.name;
      els.countdownVal.textContent = `${name} (${diffDays} ${i18n[state.lang].daysLeft})`;
    }
  }

  // Open Detail Modal
  function openDetailModal(holidayId) {
    const holiday = holidays.find(h => h.id === holidayId);
    if (!holiday) return;

    state.selectedHolidayModal = holiday;

    els.modalIcon.textContent = holiday.icon || '📌';
    els.modalTitle.textContent = state.lang === 'ru' ? (holiday.name_ru || holiday.name) : holiday.name;
    els.modalTitleRu.textContent = state.lang === 'ru' ? holiday.name : (holiday.name_ru || '');

    const catClass = getCategoryClass(holiday.category);
    els.modalMetaChips.innerHTML = `
      <span class="category-tag-pill ${catClass}"><span>${holiday.icon}</span> ${holiday.category}</span>
      <span class="category-tag-pill" style="background:rgba(255,255,255,0.06);color:#fff;">📅 ${holiday.date} (${holiday.day_of_week})</span>
      ${holiday.is_federal ? `<span class="category-tag-pill tag-federal">${i18n[state.lang].federalBadge}</span>` : ''}
      ${holiday.bank_closed ? `<span class="category-tag-pill tag-federal">${i18n[state.lang].bankClosedBadge}</span>` : ''}
      ${holiday.long_weekend ? `<span class="category-tag-pill tag-observance">${i18n[state.lang].longWeekendBadge}</span>` : ''}
      ${holiday.is_commercial ? `<span class="category-tag-pill tag-commercial">${i18n[state.lang].retailPeakBadge}</span>` : ''}
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

  // Export ICS
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

  // Set Language
  function setLanguage(lang) {
    state.lang = lang;

    if (lang === 'ru') {
      els.langRuBtn.classList.add('active');
      els.langEnBtn.classList.remove('active');
    } else {
      els.langEnBtn.classList.add('active');
      els.langRuBtn.classList.remove('active');
    }

    const texts = i18n[lang];
    els.subHeader.textContent = texts.subHeader;
    els.countdownLabel.textContent = texts.nextHoliday;
    els.txtFeaturedTitle.innerHTML = `<span>🔥</span> ${texts.featuredTitle}`;
    els.txtFiltersTitle.innerHTML = `<span>🔍</span> ${texts.filtersTitle}`;
    els.txtPresetsTitle.textContent = texts.presetsTitle;
    els.resetBtn.textContent = texts.reset;
    els.searchInput.placeholder = texts.searchPlaceholder;
    els.txtMonthTitle.textContent = texts.monthTitle;
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
    els.kpiWeekendsLbl.textContent = texts.longWeekends;
    els.kpiRetailLbl.textContent = texts.retailPeaks;
    els.kpiStateLbl.textContent = texts.stateHolidays;

    updateDashboard();
  }

  // Setup Event Listeners
  function initEventListeners() {
    // Search
    els.searchInput.addEventListener('input', (e) => {
      state.search = e.target.value;
      updateDashboard();
    });

    // Reset Filters
    els.resetBtn.addEventListener('click', () => {
      state.search = '';
      state.filterType = 'category';
      state.filterVal = 'all';
      state.selectedMonth = 'all';
      state.selectedState = 'all';
      els.searchInput.value = '';
      els.stateSelect.value = 'all';

      els.presetChips.forEach(p => p.classList.toggle('active', p.dataset.val === 'all'));
      els.monthBtns.forEach(b => b.classList.toggle('active', b.dataset.month === 'all'));

      updateDashboard();
    });

    // Preset & Category Chips
    els.presetChips.forEach(chip => {
      chip.addEventListener('click', () => {
        els.presetChips.forEach(p => p.classList.remove('active'));
        chip.classList.add('active');
        state.filterType = chip.dataset.filterType;
        state.filterVal = chip.dataset.val;
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

        document.querySelectorAll('.tab-view-panel').forEach(sec => {
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

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }

})();

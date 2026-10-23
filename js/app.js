// ============================================================================
// DevEloped LeadDesk — Main Application Controller & Router
// Built for Dev — DevEloped Web Co. (Albuquerque, NM)
// ============================================================================

import { store, fillTemplatePlaceholders, normalizePhone, buildPreviewProtectionSnippet } from './store.js';
import { searchProspects } from './finder-service.js';
import { renderDashboardView, renderDashboardBottomSection } from './view-dashboard.js';
import {
  renderLeadFinderView,
  renderLeadFinderResultsSection,
  renderLeadsDirectoryView
} from './view-finder.js';
import { renderPipelineKanbanView, renderFollowUpsQueueView } from './view-pipeline.js';
import { renderCallModeView, getDialerQueue } from './view-callmode.js';
import {
  renderScriptsLibraryView,
  renderTemplatesLibraryView,
  renderSettingsAndDataView
} from './view-scripts-templates.js';
import {
  renderLeadDetailDrawer,
  renderQuickMessageModal,
  renderAddLeadModal,
  renderInstallAppModal
} from './modals.js';

let deferredInstallPrompt = null;
window.addEventListener('beforeinstallprompt', e => {
  e.preventDefault();
  deferredInstallPrompt = e;
});

const appState = {
  currentView: 'dashboard', // 'dashboard' | 'finder' | 'leads' | 'pipeline' | 'followups' | 'callmode' | 'scripts' | 'templates' | 'settings'
  chartDays: 30,
  globalSearch: '',
  selectedLeadId: null, // For Lead Detail Drawer
  messageModal: null,   // { leadId, channel: 'sms' | 'email' }
  showAddLeadModal: false,
  showInstallModal: false,
  previewLeadId: '',
  finder: {
    category: 'all',
    city: store.state.settings.defaultCity || 'Albuquerque, NM',
    radius: store.state.settings.defaultRadiusMiles || 10,
    results: null
  },
  directory: {
    search: '',
    category: 'all',
    stage: 'all',
    webStatus: 'all',
    temperature: 'all',
    minScore: 0,
    sortBy: 'score'
  },
  kanbanCategory: 'all',
  dialer: {
    queueFilter: 'callable',
    activeLeadId: null,
    scriptTab: 'opener',
    draftNote: '',
    timerSec: 0,
    timerRunning: false,
    timerInterval: null
  },
  csvImport: null
};

export function showToast(message, icon = '✓') {
  const container = document.getElementById('toast-container');
  if (!container) return;
  const el = document.createElement('div');
  el.className = 'toast';
  el.innerHTML = `<span style="color:#34D399;font-weight:700;">${icon}</span><span>${message}</span>`;
  container.appendChild(el);
  setTimeout(() => {
    el.style.opacity = '0';
    setTimeout(() => el.remove(), 220);
  }, 3200);
}

function startDialerTimer() {
  stopDialerTimer();
  appState.dialer.timerSec = 0;
  appState.dialer.timerRunning = true;
  appState.dialer.timerInterval = setInterval(() => {
    appState.dialer.timerSec++;
    const disp = document.getElementById('dialer-timer-display');
    if (disp) {
      const m = String(Math.floor(appState.dialer.timerSec / 60)).padStart(2, '0');
      const s = String(appState.dialer.timerSec % 60).padStart(2, '0');
      disp.textContent = `${m}:${s}`;
      disp.style.color = '#34D399';
    }
  }, 1000);
}

function stopDialerTimer() {
  if (appState.dialer.timerInterval) {
    clearInterval(appState.dialer.timerInterval);
    appState.dialer.timerInterval = null;
  }
  appState.dialer.timerRunning = false;
}

export async function navigateTo(view, options = {}) {
  appState.currentView = view;
  if (options.leadId) {
    appState.dialer.activeLeadId = options.leadId;
  }
  if (view === 'finder' && !appState.finder.results) {
    appState.finder.results = await searchProspects({
      category: appState.finder.category,
      city: appState.finder.city,
      radiusMiles: appState.finder.radius,
      apiKey: store.state.settings.googlePlacesApiKey,
      existingLeads: store.getLeads()
    });
  }
  renderApp();
}

const VIEW_TITLES = {
  dashboard: 'Command Center Dashboard',
  finder: 'Lead Finder — Scrub Google Maps for Prospects',
  leads: 'All Leads & Pitch Score Ranking',
  pipeline: 'Sales Pipeline (Kanban Board)',
  followups: 'Follow-Ups & Callback Queue',
  callmode: 'Call Mode — Full-Screen Power Dialer',
  scripts: 'Cold Call Scripts & Objection Playbook',
  templates: 'SMS & Email Message Templates',
  settings: 'Settings, CSV Import/Export & JSON Backup'
};

export function renderApp() {
  const leads = store.getLeads();
  const followUps = store.getFollowUpBuckets();
  const urgentFollowUps = followUps.overdue.length + followUps.dueToday.length;
  const dupCount = store.findDuplicateGroups().length;

  // Update Sidebar active state & badges
  document.querySelectorAll('[data-nav]').forEach(btn => {
    btn.classList.toggle('active', btn.getAttribute('data-nav') === appState.currentView);
  });

  const badgeLeads = document.getElementById('nav-badge-leads');
  if (badgeLeads) badgeLeads.textContent = leads.length;

  const badgeFollowups = document.getElementById('nav-badge-followups');
  if (badgeFollowups) {
    badgeFollowups.textContent = urgentFollowUps;
    badgeFollowups.className = `nav-badge ${followUps.overdue.length > 0 ? 'urgent' : urgentFollowUps > 0 ? 'amber' : ''}`;
  }

  const badgeSettings = document.getElementById('nav-badge-settings');
  if (badgeSettings) {
    badgeSettings.textContent = dupCount > 0 ? `${dupCount} dup` : '';
    badgeSettings.style.display = dupCount > 0 ? 'inline-block' : 'none';
  }

  const titleEl = document.getElementById('topbar-page-title');
  if (titleEl) titleEl.textContent = VIEW_TITLES[appState.currentView] || 'DevEloped LeadDesk';

  // Render Main View Content
  const container = document.getElementById('view-container');
  if (!container) return;

  container.classList.toggle('no-padding', appState.currentView === 'pipeline');

  if (appState.currentView === 'dashboard') {
    container.innerHTML = renderDashboardView(appState.chartDays) + renderDashboardBottomSection();
  } else if (appState.currentView === 'finder') {
    container.innerHTML = renderLeadFinderView(appState.finder) + renderLeadFinderResultsSection(appState.finder);
  } else if (appState.currentView === 'leads') {
    container.innerHTML = renderLeadsDirectoryView(appState.directory);
  } else if (appState.currentView === 'pipeline') {
    container.innerHTML = renderPipelineKanbanView(appState.globalSearch, appState.kanbanCategory);
  } else if (appState.currentView === 'followups') {
    container.innerHTML = renderFollowUpsQueueView();
  } else if (appState.currentView === 'callmode') {
    container.innerHTML = renderCallModeView(appState.dialer);
  } else if (appState.currentView === 'scripts') {
    container.innerHTML = renderScriptsLibraryView(appState.previewLeadId);
  } else if (appState.currentView === 'templates') {
    container.innerHTML = renderTemplatesLibraryView(appState.previewLeadId);
  } else if (appState.currentView === 'settings') {
    container.innerHTML = renderSettingsAndDataView(appState.csvImport);
  }

  // Render Overlays (Lead Detail Drawer, Message Modal, Add Lead Modal)
  const overlayRoot = document.getElementById('overlay-root');
  if (overlayRoot) {
    let overlayHtml = '';
    if (appState.selectedLeadId) {
      overlayHtml += renderLeadDetailDrawer(appState.selectedLeadId);
    }
    if (appState.messageModal) {
      overlayHtml += renderQuickMessageModal(appState.messageModal.leadId, appState.messageModal.channel);
    }
    if (appState.showAddLeadModal) {
      overlayHtml += renderAddLeadModal();
    }
    if (appState.showInstallModal) {
      overlayHtml += renderInstallAppModal(Boolean(deferredInstallPrompt));
    }
    overlayRoot.innerHTML = overlayHtml;
  }

  bindViewEvents();
  bindOverlayEvents();
}

function bindViewEvents() {
  const container = document.getElementById('view-container');
  if (!container) return;

  // Navigation shortcuts inside views
  container.querySelectorAll('[data-nav-target]').forEach(el => {
    el.addEventListener('click', () => navigateTo(el.getAttribute('data-nav-target')));
  });

  // Open Lead Detail Drawer
  container.querySelectorAll('[data-open-lead]').forEach(el => {
    el.addEventListener('click', e => {
      e.stopPropagation();
      appState.selectedLeadId = el.getAttribute('data-open-lead');
      renderApp();
    });
  });

  // Dial specific lead in Call Mode
  container.querySelectorAll('[data-dial-lead]').forEach(el => {
    el.addEventListener('click', e => {
      e.stopPropagation();
      const id = el.getAttribute('data-dial-lead');
      appState.dialer.activeLeadId = id;
      appState.dialer.draftNote = '';
      stopDialerTimer();
      navigateTo('callmode', { leadId: id });
    });
  });

  // Quick SMS / Email triggers
  container.querySelectorAll('[data-sms-lead]').forEach(el => {
    el.addEventListener('click', e => {
      e.stopPropagation();
      appState.messageModal = { leadId: el.getAttribute('data-sms-lead'), channel: 'sms' };
      renderApp();
    });
  });
  container.querySelectorAll('[data-email-lead]').forEach(el => {
    el.addEventListener('click', e => {
      e.stopPropagation();
      appState.messageModal = { leadId: el.getAttribute('data-email-lead'), channel: 'email' };
      renderApp();
    });
  });
  container.querySelectorAll('[data-copy-demo-link]').forEach(el => {
    el.addEventListener('click', e => {
      e.stopPropagation();
      const id = el.getAttribute('data-copy-demo-link');
      const lead = store.getLeadById(id);
      if (lead) {
        const link = lead.demoLink || lead.sampleSite?.url || '';
        navigator.clipboard?.writeText(link);
        store.markSampleSent(id, 'Text / SMS', link);
        showToast(`Copied Demo Link & logged Sample Sent for ${lead.businessName}!`, '📋');
        renderApp();
      }
    });
  });
  container.querySelectorAll('[data-copy-shield]').forEach(el => {
    el.addEventListener('click', e => {
      e.stopPropagation();
      const lead = store.getLeadById(el.getAttribute('data-copy-shield'));
      if (lead) {
        navigator.clipboard?.writeText(buildPreviewProtectionSnippet(lead));
        showToast(`Copied Preview Protection Shield HTML for ${lead.businessName}!`, '🛡');
      }
    });
  });

  // Dashboard chart timeframe toggle & Paid-in-Full toggle
  container.querySelectorAll('[data-chart-days]').forEach(btn => {
    btn.addEventListener('click', () => {
      appState.chartDays = Number(btn.getAttribute('data-chart-days')) || 30;
      renderApp();
    });
  });
  container.querySelectorAll('[data-toggle-paid-full]').forEach(chk => {
    chk.addEventListener('change', () => {
      const id = chk.getAttribute('data-toggle-paid-full');
      const lead = store.getLeadById(id);
      if (lead) {
        const paid = chk.checked;
        store.updateLead(id, {
          deal: { ...lead.deal, paidInFull: paid, depositPaid: paid ? lead.deal.priceAgreed : lead.deal.depositPaid }
        });
        showToast(`Updated payment status for ${lead.businessName}`);
        renderApp();
      }
    });
  });

  // Lead Finder Events
  const finderForm = document.getElementById('lead-finder-form');
  if (finderForm) {
    finderForm.addEventListener('submit', async e => {
      e.preventDefault();
      appState.finder.category = document.getElementById('finder-category').value;
      appState.finder.city = document.getElementById('finder-city').value || 'Albuquerque, NM';
      appState.finder.radius = Number(document.getElementById('finder-radius').value) || 10;
      appState.finder.results = await searchProspects({
        category: appState.finder.category,
        city: appState.finder.city,
        radiusMiles: appState.finder.radius,
        apiKey: store.state.settings.googlePlacesApiKey,
        existingLeads: store.getLeads()
      });
      showToast(`Scrubbed ${appState.finder.results.qualified.length} qualified prospects in ${appState.finder.city}`);
      renderApp();
    });

    container.querySelectorAll('[data-city-preset]').forEach(btn => {
      btn.addEventListener('click', async () => {
        appState.finder.city = btn.getAttribute('data-city-preset');
        appState.finder.results = await searchProspects({
          category: appState.finder.category,
          city: appState.finder.city,
          radiusMiles: appState.finder.radius,
          apiKey: store.state.settings.googlePlacesApiKey,
          existingLeads: store.getLeads()
        });
        renderApp();
      });
    });

    document.getElementById('finder-btn-open-settings')?.addEventListener('click', () => navigateTo('settings'));
    document.getElementById('finder-btn-open-csv')?.addEventListener('click', () => navigateTo('settings'));
    document.getElementById('finder-btn-add-manual')?.addEventListener('click', () => {
      appState.showAddLeadModal = true;
      renderApp();
    });

    container.querySelectorAll('[data-import-index]').forEach(btn => {
      btn.addEventListener('click', () => {
        const idx = Number(btn.getAttribute('data-import-index'));
        const item = appState.finder.results?.qualified?.[idx];
        if (item) {
          store.addLead(item);
          item.alreadyInCrm = true;
          showToast(`Imported "${item.businessName}" (Pitch Score: ${item.pitchScore})`);
          renderApp();
        }
      });
    });

    document.getElementById('finder-btn-import-all')?.addEventListener('click', () => {
      const list = (appState.finder.results?.qualified || []).filter(q => !q.alreadyInCrm);
      list.forEach(item => {
        store.addLead(item);
        item.alreadyInCrm = true;
      });
      showToast(`Imported ${list.length} new leads into CRM`);
      renderApp();
    });
  }

  // Leads Directory Filters & Sort
  const dirSearch = document.getElementById('dir-search');
  if (dirSearch) {
    dirSearch.addEventListener('input', e => {
      appState.directory.search = e.target.value;
      renderApp();
      const input = document.getElementById('dir-search');
      if (input) {
        input.focus();
        input.setSelectionRange(input.value.length, input.value.length);
      }
    });
    document.getElementById('dir-category')?.addEventListener('change', e => {
      appState.directory.category = e.target.value;
      renderApp();
    });
    document.getElementById('dir-stage')?.addEventListener('change', e => {
      appState.directory.stage = e.target.value;
      renderApp();
    });
    document.getElementById('dir-web')?.addEventListener('change', e => {
      appState.directory.webStatus = e.target.value;
      renderApp();
    });
    document.getElementById('dir-temp')?.addEventListener('change', e => {
      appState.directory.temperature = e.target.value;
      renderApp();
    });
    document.getElementById('dir-sort')?.addEventListener('change', e => {
      appState.directory.sortBy = e.target.value;
      renderApp();
    });
    document.getElementById('dir-btn-add-lead')?.addEventListener('click', () => {
      appState.showAddLeadModal = true;
      renderApp();
    });
    document.getElementById('dir-btn-export-csv')?.addEventListener('click', downloadLeadsCSV);
    document.getElementById('btn-open-dup-merger')?.addEventListener('click', () => navigateTo('settings'));
  }

  // Kanban Board Drag & Drop + Category Filter
  const kanbanCat = document.getElementById('kanban-cat-filter');
  if (kanbanCat) {
    kanbanCat.addEventListener('change', e => {
      appState.kanbanCategory = e.target.value;
      renderApp();
    });
  }
  // Kanban cards drag & drop
  container.querySelectorAll('[data-lead-card]').forEach(card => {
    card.addEventListener('dragstart', e => {
      e.dataTransfer.setData('text/plain', card.getAttribute('data-lead-card'));
    });
  });
  container?.querySelectorAll('[data-kanban-dropzone]').forEach(zone => {
    const col = zone.closest('.kanban-col');
    zone.addEventListener('dragover', e => {
      e.preventDefault();
      col?.classList.add('drag-over');
    });
    zone.addEventListener('dragleave', () => col?.classList.remove('drag-over'));
    zone.addEventListener('drop', e => {
      e.preventDefault();
      col?.classList.remove('drag-over');
      const leadId = e.dataTransfer.getData('text/plain');
      const newStage = zone.getAttribute('data-kanban-dropzone');
      if (leadId && newStage) {
        const lead = store.updateLead(leadId, { stage: newStage });
        if (lead) {
          showToast(`Moved "${lead.businessName}" → ${newStage}`);
          renderApp();
        }
      }
    });
  });

  // Follow-Ups Queue Actions
  container?.querySelectorAll('[data-snooze-lead]').forEach(btn => {
    btn.addEventListener('click', () => {
      const id = btn.getAttribute('data-snooze-lead');
      const d = new Date();
      d.setDate(d.getDate() + 2);
      d.setHours(10, 30, 0, 0);
      store.updateLead(id, { nextFollowUp: d.toISOString() });
      showToast('Snoozed callback for +2 days');
      renderApp();
    });
  });
  document.getElementById('btn-seed-demo-followup')?.addEventListener('click', () => {
    const first = store.getLeads()[0];
    if (first) {
      const soon = new Date(Date.now() + 45 * 60000);
      store.updateLead(first.id, { stage: 'Callback Scheduled', nextFollowUp: soon.toISOString() });
      showToast(`Scheduled "${first.businessName}" for callback today`);
      renderApp();
    }
  });

  // Call Mode (Power Dialer) Events
  bindCallModeEvents();
  bindScriptsTemplatesSettingsEvents();
}

function bindCallModeEvents() {
  if (appState.currentView !== 'callmode') return;
  const container = document.getElementById('view-container');
  if (!container) return;

  const qFilter = document.getElementById('dialer-queue-filter');
  qFilter?.addEventListener('change', e => {
    appState.dialer.queueFilter = e.target.value;
    const q = getDialerQueue(appState.dialer.queueFilter);
    appState.dialer.activeLeadId = q[0]?.id || null;
    stopDialerTimer();
    renderApp();
  });

  container.querySelectorAll('[data-dialer-queue]').forEach(btn => {
    btn.addEventListener('click', () => {
      appState.dialer.queueFilter = btn.getAttribute('data-dialer-queue');
      const q = getDialerQueue(appState.dialer.queueFilter);
      appState.dialer.activeLeadId = q[0]?.id || null;
      renderApp();
    });
  });

  document.getElementById('dialer-auto-advance')?.addEventListener('change', e => {
    store.state.settings.autoAdvanceCallMode = e.target.checked;
    store.save();
  });

  const stepLead = dir => {
    const q = getDialerQueue(appState.dialer.queueFilter);
    if (!q.length) return;
    const idx = q.findIndex(l => l.id === appState.dialer.activeLeadId);
    const nextIdx = (idx + dir + q.length) % q.length;
    appState.dialer.activeLeadId = q[nextIdx].id;
    appState.dialer.draftNote = '';
    stopDialerTimer();
    renderApp();
  };

  document.getElementById('dialer-prev-lead')?.addEventListener('click', () => stepLead(-1));
  document.getElementById('dialer-next-lead')?.addEventListener('click', () => stepLead(1));

  // Tap to Call starts live timer
  document.getElementById('dialer-btn-tap-call')?.addEventListener('click', () => {
    startDialerTimer();
    showToast('Dialing prospect — live call timer started', '📞');
  });

  // Live Owner Name, Email & Sample URL edits inside Call Mode
  const activeId = appState.dialer.activeLeadId;
  document.getElementById('dialer-owner-input')?.addEventListener('change', e => {
    if (activeId) store.updateLead(activeId, { ownerName: e.target.value });
  });
  document.getElementById('dialer-email-input')?.addEventListener('change', e => {
    if (activeId) store.updateLead(activeId, { email: e.target.value });
  });
  document.getElementById('dialer-sample-input')?.addEventListener('change', e => {
    if (activeId) store.updateLead(activeId, { sampleSite: { url: e.target.value } });
  });

  // Note input & snippet chips
  const notesInput = document.getElementById('dialer-notes-input');
  notesInput?.addEventListener('input', e => {
    appState.dialer.draftNote = e.target.value;
  });
  container.querySelectorAll('[data-note-chip]').forEach(chip => {
    chip.addEventListener('click', () => {
      const text = chip.getAttribute('data-note-chip');
      appState.dialer.draftNote = appState.dialer.draftNote
        ? `${appState.dialer.draftNote} · ${text}`
        : text;
      if (notesInput) notesInput.value = appState.dialer.draftNote;
    });
  });

  // Script Side Panel Tabs
  container.querySelectorAll('[data-script-tab]').forEach(tab => {
    tab.addEventListener('click', () => {
      appState.dialer.scriptTab = tab.getAttribute('data-script-tab');
      renderApp();
    });
  });

  // 8 Outcome Buttons
  container.querySelectorAll('[data-log-outcome]').forEach(btn => {
    btn.addEventListener('click', () => {
      const outcome = btn.getAttribute('data-log-outcome');
      handleLogOutcomeInDialer(outcome);
    });
  });
}

export function handleLogOutcomeInDialer(outcome) {
  const leadId = appState.dialer.activeLeadId;
  if (!leadId) return;

  const qBefore = getDialerQueue(appState.dialer.queueFilter);
  const currentIdx = qBefore.findIndex(l => l.id === leadId);
  const nextCandidate = qBefore[currentIdx + 1] || qBefore[0] || null;

  const notes = document.getElementById('dialer-notes-input')?.value || appState.dialer.draftNote || '';
  const dtVal = document.getElementById('dialer-callback-dt')?.value;
  const customFollowUp = dtVal ? new Date(dtVal).toISOString() : null;
  const dealPrice = Number(document.getElementById('dialer-deal-price')?.value) || 850;
  const sampleUrl = document.getElementById('dialer-sample-input')?.value || '';

  const updated = store.logCallOutcome(leadId, {
    outcome,
    notes,
    durationSec: appState.dialer.timerSec,
    customFollowUp: ['Callback', 'Owner Not There'].includes(outcome) ? customFollowUp : null,
    dealInfo: outcome === 'Sold' ? { priceAgreed: dealPrice, depositPaid: Math.round(dealPrice / 2), paidInFull: false } : null,
    sampleUrl
  });

  stopDialerTimer();
  appState.dialer.draftNote = '';
  appState.dialer.timerSec = 0;

  showToast(`Logged "${outcome}" for ${updated?.businessName} → Moved to ${updated?.stage}`);

  if (store.state.settings.autoAdvanceCallMode !== false) {
    const qAfter = getDialerQueue(appState.dialer.queueFilter);
    if (nextCandidate && nextCandidate.id !== leadId && qAfter.some(l => l.id === nextCandidate.id)) {
      appState.dialer.activeLeadId = nextCandidate.id;
    } else {
      appState.dialer.activeLeadId = qAfter[0]?.id || null;
    }
  }
  renderApp();
}

function bindScriptsTemplatesSettingsEvents() {
  const container = document.getElementById('view-container');
  if (!container) return;

  // Scripts Library Events
  document.getElementById('scripts-preview-lead')?.addEventListener('change', e => {
    appState.previewLeadId = e.target.value;
    renderApp();
  });
  container.querySelectorAll('[data-edit-script]').forEach(ta => {
    ta.addEventListener('change', () => {
      const key = ta.getAttribute('data-edit-script');
      if (store.state.scripts[key]) {
        store.state.scripts[key].content = ta.value;
        store.save();
        showToast('Saved script update');
        renderApp();
      }
    });
  });
  container.querySelectorAll('[data-edit-objection]').forEach(ta => {
    ta.addEventListener('change', () => {
      const key = ta.getAttribute('data-edit-objection');
      if (store.state.scripts.objections?.[key]) {
        store.state.scripts.objections[key].content = ta.value;
        store.save();
        showToast('Saved objection handler');
        renderApp();
      }
    });
  });

  // Templates Library Events
  document.getElementById('tpl-preview-lead')?.addEventListener('change', e => {
    appState.previewLeadId = e.target.value;
    renderApp();
  });
  container.querySelectorAll('[data-tpl-subject]').forEach(inp => {
    inp.addEventListener('change', () => {
      const idx = Number(inp.getAttribute('data-tpl-subject'));
      if (store.state.templates[idx]) {
        store.state.templates[idx].subject = inp.value;
        store.save();
        showToast('Saved template subject');
      }
    });
  });
  container.querySelectorAll('[data-tpl-body]').forEach(ta => {
    ta.addEventListener('change', () => {
      const idx = Number(ta.getAttribute('data-tpl-body'));
      if (store.state.templates[idx]) {
        store.state.templates[idx].body = ta.value;
        store.save();
        showToast('Saved message template');
        renderApp();
      }
    });
  });
  container.querySelectorAll('[data-copy-tpl]').forEach(btn => {
    btn.addEventListener('click', () => {
      const idx = Number(btn.getAttribute('data-copy-tpl'));
      const lead = store.getLeadById(appState.previewLeadId) || store.getLeads()[0];
      const text = fillTemplatePlaceholders(store.state.templates[idx]?.body || '', lead);
      navigator.clipboard?.writeText(text);
      showToast('Copied auto-filled message to clipboard!');
    });
  });
  container.querySelectorAll('[data-send-tpl-sms]').forEach(btn => {
    btn.addEventListener('click', () => {
      const idx = Number(btn.getAttribute('data-send-tpl-sms'));
      const lead = store.getLeadById(appState.previewLeadId) || store.getLeads()[0];
      const text = fillTemplatePlaceholders(store.state.templates[idx]?.body || '', lead);
      window.location.href = `sms:${normalizePhone(lead.phone)}?body=${encodeURIComponent(text)}`;
    });
  });
  container.querySelectorAll('[data-send-tpl-email]').forEach(btn => {
    btn.addEventListener('click', () => {
      const idx = Number(btn.getAttribute('data-send-tpl-email'));
      const lead = store.getLeadById(appState.previewLeadId) || store.getLeads()[0];
      const subj = fillTemplatePlaceholders(store.state.templates[idx]?.subject || `Website Preview for ${lead.businessName}`, lead);
      const body = fillTemplatePlaceholders(store.state.templates[idx]?.body || '', lead);
      window.location.href = `mailto:${lead.email || ''}?subject=${encodeURIComponent(subj)}&body=${encodeURIComponent(body)}`;
    });
  });

  // Settings & Data Management Events
  document.getElementById('settings-form')?.addEventListener('submit', e => {
    e.preventDefault();
    store.state.settings.googlePlacesApiKey = document.getElementById('set-api-key').value.trim();
    store.state.settings.defaultCity = document.getElementById('set-default-city').value.trim() || 'Albuquerque, NM';
    store.state.settings.dailyCallGoal = Number(document.getElementById('set-call-goal').value) || 25;
    store.state.settings.defaultSitePrice = Number(document.getElementById('set-site-price').value) || 850;
    store.state.settings.operatorName = document.getElementById('set-operator').value.trim() || 'Dev';
    store.save();
    showToast('Saved DevEloped Web Co. settings!');
    renderApp();
  });

  document.getElementById('btn-export-all-csv')?.addEventListener('click', downloadLeadsCSV);
  document.getElementById('btn-download-sample-csv')?.addEventListener('click', () => {
    const sample = `Business Name,Category,Phone,Address,City,Rating,Reviews,Website Status\n"Duke City Taqueria","Mexican restaurant","(505) 555-0142","3100 Central Ave SE","Albuquerque, NM",4.8,84,"None"\n"Mesa Fade Barbershop","barber shop","(505) 555-0188","4400 Menaul Blvd NE","Albuquerque, NM",4.9,62,"Weak Presence"`;
    triggerFileDownload(sample, 'developed-leaddesk-sample.csv', 'text/csv');
  });

  document.getElementById('csv-file-input')?.addEventListener('change', handleCsvFileSelected);
  document.getElementById('btn-confirm-csv-import')?.addEventListener('click', executeCsvImport);
  container.querySelectorAll('[data-csv-map]').forEach(sel => {
    sel.addEventListener('change', () => {
      const field = sel.getAttribute('data-csv-map');
      if (appState.csvImport) {
        appState.csvImport.mapping[field] = sel.value === '' ? undefined : Number(sel.value);
      }
    });
  });

  document.getElementById('btn-export-json')?.addEventListener('click', () => {
    const json = store.exportFullBackupJSON();
    triggerFileDownload(json, `developed-leaddesk-backup-${new Date().toISOString().slice(0, 10)}.json`, 'application/json');
    showToast('Downloaded full JSON backup');
  });

  document.getElementById('json-restore-input')?.addEventListener('change', e => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = ev => {
      try {
        store.restoreFromBackupJSON(ev.target.result);
        showToast('Restored CRM state from JSON backup!');
        renderApp();
      } catch (err) {
        showToast('Invalid JSON backup: ' + err.message, '⚠️');
      }
    };
    reader.readAsText(file);
  });

  document.getElementById('btn-factory-reset')?.addEventListener('click', () => {
    store.resetToFactorySeed();
    showToast('Reset CRM to the 18 Albuquerque seed leads');
    renderApp();
  });

  document.getElementById('btn-test-create-dup')?.addEventListener('click', () => {
    const first = store.getLeads()[0];
    if (first) {
      store.addLead({
        businessName: first.businessName + ' (Duplicate Copy)',
        category: first.category,
        phone: first.phone,
        address: first.address,
        city: first.city,
        rating: first.rating,
        reviewCount: Number(first.reviewCount) + 5,
        websiteStatus: first.websiteStatus,
        ownerName: 'Carlos (Owner)'
      });
      showToast('Created test duplicate record — click Merge below!');
      renderApp();
    }
  });

  container.querySelectorAll('[data-merge-group]').forEach(btn => {
    btn.addEventListener('click', () => {
      const idx = Number(btn.getAttribute('data-merge-group'));
      const groups = store.findDuplicateGroups();
      const g = groups[idx];
      if (g && g.leads.length > 1) {
        const primary = g.leads[0];
        const dupIds = g.leads.slice(1).map(l => l.id);
        store.mergeDuplicateLeads(primary.id, dupIds);
        showToast(`Merged ${g.leads.length} records into "${primary.businessName}"!`);
        renderApp();
      }
    });
  });
}

function parseCSVLine(line) {
  const result = [];
  let cur = '';
  let inQuotes = false;
  for (let i = 0; i < line.length; i++) {
    const ch = line[i];
    if (ch === '"') {
      inQuotes = !inQuotes;
    } else if (ch === ',' && !inQuotes) {
      result.push(cur.trim());
      cur = '';
    } else {
      cur += ch;
    }
  }
  result.push(cur.trim());
  return result;
}

function handleCsvFileSelected(e) {
  const file = e.target.files?.[0];
  if (!file) return;
  const reader = new FileReader();
  reader.onload = ev => {
    const lines = String(ev.target.result || '')
      .split(/\r?\n/)
      .filter(l => l.trim().length > 0);
    if (lines.length < 2) {
      showToast('CSV needs a header row and at least 1 data row', '⚠️');
      return;
    }
    const headers = parseCSVLine(lines[0]);
    const rows = lines.slice(1).map(parseCSVLine);

    const findCol = terms => {
      const idx = headers.findIndex(h => terms.some(t => h.toLowerCase().includes(t)));
      return idx >= 0 ? idx : undefined;
    };

    appState.csvImport = {
      headers,
      rows,
      mapping: {
        businessName: findCol(['business', 'name', 'company']) ?? 0,
        phone: findCol(['phone', 'tel', 'mobile']) ?? 1,
        category: findCol(['cat', 'type', 'industry']),
        address: findCol(['addr', 'street']),
        city: findCol(['city', 'town']),
        rating: findCol(['rat', 'star']),
        reviewCount: findCol(['rev', 'count']),
        websiteStatus: findCol(['web', 'status'])
      }
    };
    showToast(`Loaded ${rows.length} CSV rows — confirm column mapping below!`);
    renderApp();
  };
  reader.readAsText(file);
}

function executeCsvImport() {
  if (!appState.csvImport) return;
  const { rows, mapping } = appState.csvImport;
  let count = 0;
  for (const r of rows) {
    const name = mapping.businessName !== undefined ? r[mapping.businessName] : '';
    if (!name) continue;
    store.addLead({
      businessName: name,
      phone: mapping.phone !== undefined ? r[mapping.phone] : '',
      category: mapping.category !== undefined ? r[mapping.category] : 'other',
      address: mapping.address !== undefined ? r[mapping.address] : '',
      city: mapping.city !== undefined ? r[mapping.city] : 'Albuquerque, NM',
      rating: mapping.rating !== undefined ? Number(r[mapping.rating]) || 4.6 : 4.6,
      reviewCount: mapping.reviewCount !== undefined ? Number(r[mapping.reviewCount]) || 25 : 25,
      websiteStatus: mapping.websiteStatus !== undefined && String(r[mapping.websiteStatus]).toLowerCase().includes('weak') ? 'Weak Presence' : 'None'
    });
    count++;
  }
  appState.csvImport = null;
  showToast(`Successfully imported ${count} leads from CSV!`);
  renderApp();
}

function triggerFileDownload(content, filename, mimeType) {
  const blob = new Blob([content], { type: mimeType });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = filename;
  a.click();
  URL.revokeObjectURL(url);
}

function downloadLeadsCSV() {
  const csv = store.exportToCSV();
  triggerFileDownload(csv, `developed-leaddesk-leads-${new Date().toISOString().slice(0, 10)}.csv`, 'text/csv');
  showToast('Exported leads to CSV');
}

function bindOverlayEvents() {
  // Lead Detail Drawer Events
  const leadId = appState.selectedLeadId;
  if (leadId) {
    const closeDrawer = () => {
      appState.selectedLeadId = null;
      renderApp();
    };
    document.getElementById('lead-drawer-backdrop')?.addEventListener('click', closeDrawer);
    document.getElementById('btn-close-drawer')?.addEventListener('click', closeDrawer);

    document.getElementById('drawer-btn-dialer')?.addEventListener('click', () => {
      appState.selectedLeadId = null;
      navigateTo('callmode', { leadId });
    });
    document.getElementById('drawer-btn-sms')?.addEventListener('click', () => {
      appState.messageModal = { leadId, channel: 'sms' };
      renderApp();
    });
    document.getElementById('drawer-btn-email')?.addEventListener('click', () => {
      appState.messageModal = { leadId, channel: 'email' };
      renderApp();
    });
    document.getElementById('drawer-btn-delete')?.addEventListener('click', () => {
      store.deleteLead(leadId);
      appState.selectedLeadId = null;
      showToast('Deleted lead from CRM');
      renderApp();
    });

    document.getElementById('drawer-btn-regen-angle')?.addEventListener('click', () => {
      store.updateLead(leadId, { regeneratePitchAngle: true });
      showToast('Regenerated Pitch Angle from lead data');
      renderApp();
    });

    const saveProfileChanges = () => {
      const fVal = document.getElementById('drawer-followup')?.value;
      const sDateVal = document.getElementById('drawer-sample-date')?.value;
      const priceAgreed = Number(document.getElementById('drawer-deal-price')?.value) || 850;
      const paidFull = Boolean(document.getElementById('drawer-deal-paid-full')?.checked);
      const depositPaid = paidFull ? priceAgreed : Number(document.getElementById('drawer-deal-deposit')?.value) || 0;

      store.updateLead(leadId, {
        businessName: document.getElementById('drawer-biz-name')?.value || 'Business',
        ownerName: document.getElementById('drawer-owner-name')?.value || '',
        phone: document.getElementById('drawer-phone')?.value || '',
        email: document.getElementById('drawer-email')?.value || '',
        category: document.getElementById('drawer-category')?.value || '',
        bestTimeToCall: document.getElementById('drawer-best-time')?.value || '',
        address: document.getElementById('drawer-address')?.value || '',
        city: document.getElementById('drawer-city')?.value || '',
        rating: Number(document.getElementById('drawer-rating')?.value) || 4.5,
        reviewCount: Number(document.getElementById('drawer-reviews')?.value) || 10,
        websiteStatus: document.getElementById('drawer-web-status')?.value || 'None',
        weakPresenceDetail: document.getElementById('drawer-web-detail')?.value || '',
        pitchAngle: document.getElementById('drawer-pitch-angle')?.value || '',
        stage: document.getElementById('drawer-stage')?.value || 'New Lead',
        temperature: document.getElementById('drawer-temp')?.value || 'Warm',
        nextFollowUp: fVal ? new Date(fVal).toISOString() : null,
        sampleSite: {
          url: document.getElementById('drawer-sample-url')?.value || '',
          dateSent: sDateVal ? new Date(sDateVal).toISOString() : '',
          method: document.getElementById('drawer-sample-method')?.value || 'Text / SMS'
        },
        deal: { priceAgreed, depositPaid, paidInFull: paidFull }
      });
      renderApp();
    };

    [
      'drawer-biz-name', 'drawer-owner-name', 'drawer-phone', 'drawer-email',
      'drawer-category', 'drawer-best-time', 'drawer-address', 'drawer-city',
      'drawer-rating', 'drawer-reviews', 'drawer-web-status', 'drawer-web-detail',
      'drawer-pitch-angle', 'drawer-stage', 'drawer-temp', 'drawer-followup',
      'drawer-sample-url', 'drawer-sample-date', 'drawer-sample-method',
      'drawer-deal-price', 'drawer-deal-deposit', 'drawer-deal-paid-full'
    ].forEach(id => {
      document.getElementById(id)?.addEventListener('change', saveProfileChanges);
    });

    document.getElementById('drawer-clear-followup')?.addEventListener('click', () => {
      store.updateLead(leadId, { nextFollowUp: null });
      renderApp();
    });

    document.querySelectorAll('[data-quick-followup]').forEach(btn => {
      btn.addEventListener('click', () => {
        const preset = btn.getAttribute('data-quick-followup');
        const d = new Date();
        if (preset === 'today3h') d.setHours(d.getHours() + 3);
        else if (preset === 'tomorrow10am') { d.setDate(d.getDate() + 1); d.setHours(10, 0, 0, 0); }
        else if (preset === 'in2days') { d.setDate(d.getDate() + 2); d.setHours(10, 30, 0, 0); }
        else if (preset === 'nextweek') { d.setDate(d.getDate() + 7); d.setHours(10, 30, 0, 0); }
        store.updateLead(leadId, { nextFollowUp: d.toISOString(), stage: 'Callback Scheduled' });
        showToast('Scheduled follow-up reminder');
        renderApp();
      });
    });

    document.getElementById('drawer-btn-mark-sample-sent')?.addEventListener('click', () => {
      const customUrl = document.getElementById('drawer-sample-url')?.value || '';
      const method = document.getElementById('drawer-sample-method')?.value || 'Text / SMS';
      store.markSampleSent(leadId, method, customUrl);
      showToast('Stamped Sample Site sent & moved to "Sample Sent" stage!');
      renderApp();
    });

    document.getElementById('drawer-btn-copy-demo')?.addEventListener('click', () => {
      const lead = store.getLeadById(leadId);
      if (lead) {
        const customUrl = document.getElementById('drawer-sample-url')?.value || lead.demoLink || lead.sampleSite?.url || '';
        navigator.clipboard?.writeText(customUrl);
        const method = document.getElementById('drawer-sample-method')?.value || 'Text / SMS';
        store.markSampleSent(leadId, method, customUrl);
        showToast(`Copied Demo Link & logged Sample Sent for ${lead.businessName}!`, '📋');
        renderApp();
      }
    });

    document.getElementById('drawer-btn-copy-shield')?.addEventListener('click', () => {
      const lead = store.getLeadById(leadId);
      if (lead) {
        navigator.clipboard?.writeText(buildPreviewProtectionSnippet(lead));
        showToast(`Copied Preview Protection Shield HTML for ${lead.businessName}!`, '🛡');
      }
    });

    document.getElementById('drawer-btn-add-note')?.addEventListener('click', () => {
      const inp = document.getElementById('drawer-new-note');
      if (inp && inp.value.trim()) {
        store.addNote(leadId, inp.value.trim());
        showToast('Added timestamped note');
        renderApp();
      }
    });
  }

  bindModalDialogEvents();
}

function bindModalDialogEvents() {
  // Quick SMS / Email Modal
  if (appState.messageModal) {
    const closeMsg = () => {
      appState.messageModal = null;
      renderApp();
    };
    document.getElementById('msg-modal-backdrop')?.addEventListener('click', closeMsg);
    document.getElementById('msg-modal-close')?.addEventListener('click', closeMsg);

    const lead = store.getLeadById(appState.messageModal.leadId);
    document.getElementById('msg-modal-tpl-select')?.addEventListener('change', e => {
      const tpl = store.state.templates.find(t => t.id === e.target.value);
      if (tpl && lead) {
        const subjEl = document.getElementById('msg-modal-subject');
        const bodyEl = document.getElementById('msg-modal-body');
        if (subjEl) subjEl.value = fillTemplatePlaceholders(tpl.subject || `Website Preview for ${lead.businessName}`, lead);
        if (bodyEl) bodyEl.value = fillTemplatePlaceholders(tpl.body || '', lead);
      }
    });

    document.getElementById('msg-modal-copy')?.addEventListener('click', () => {
      const body = document.getElementById('msg-modal-body')?.value || '';
      navigator.clipboard?.writeText(body);
      showToast('Copied prefilled message to clipboard!');
    });

    document.getElementById('msg-modal-open-sms')?.addEventListener('click', () => {
      const phone = document.getElementById('msg-modal-phone')?.value || '';
      const body = document.getElementById('msg-modal-body')?.value || '';
      window.location.href = `sms:${normalizePhone(phone)}?body=${encodeURIComponent(body)}`;
    });

    document.getElementById('msg-modal-open-email')?.addEventListener('click', () => {
      const email = document.getElementById('msg-modal-email')?.value || '';
      const subj = document.getElementById('msg-modal-subject')?.value || '';
      const body = document.getElementById('msg-modal-body')?.value || '';
      window.location.href = `mailto:${email}?subject=${encodeURIComponent(subj)}&body=${encodeURIComponent(body)}`;
    });
  }

  // Add Lead Modal
  if (appState.showAddLeadModal) {
    const closeAdd = () => {
      appState.showAddLeadModal = false;
      renderApp();
    };
    document.getElementById('add-lead-backdrop')?.addEventListener('click', closeAdd);
    document.getElementById('add-lead-close')?.addEventListener('click', closeAdd);
    document.getElementById('add-lead-cancel')?.addEventListener('click', closeAdd);

    document.getElementById('add-lead-form')?.addEventListener('submit', e => {
      e.preventDefault();
      const fd = new FormData(e.target);
      const created = store.addLead({
        businessName: fd.get('businessName'),
        category: fd.get('category'),
        phone: fd.get('phone'),
        ownerName: fd.get('ownerName'),
        address: fd.get('address'),
        city: fd.get('city'),
        rating: Number(fd.get('rating')) || 4.7,
        reviewCount: Number(fd.get('reviewCount')) || 35,
        websiteStatus: fd.get('websiteStatus'),
        weakPresenceDetail: fd.get('weakPresenceDetail'),
        notes: fd.get('initialNote')
          ? [{ id: `note-${Date.now()}`, createdAt: new Date().toISOString(), text: String(fd.get('initialNote')) }]
          : []
      });
      appState.showAddLeadModal = false;
      showToast(`Added "${created.businessName}" (Pitch Score: ${created.pitchScore}/100)`);
      renderApp();
    });
  }

  // Install App Modal
  if (appState.showInstallModal) {
    const closeInstall = () => {
      appState.showInstallModal = false;
      renderApp();
    };
    document.getElementById('install-app-backdrop')?.addEventListener('click', closeInstall);
    document.getElementById('install-app-close')?.addEventListener('click', closeInstall);
    document.getElementById('install-app-done')?.addEventListener('click', closeInstall);
    document.getElementById('btn-trigger-pwa-install')?.addEventListener('click', async () => {
      if (deferredInstallPrompt) {
        deferredInstallPrompt.prompt();
        await deferredInstallPrompt.userChoice;
        deferredInstallPrompt = null;
        closeInstall();
      }
    });
  }
}

// Bootstrap Application
window.addEventListener('DOMContentLoaded', () => {
  // Sidebar navigation
  document.querySelectorAll('[data-nav]').forEach(btn => {
    btn.addEventListener('click', () => {
      document.getElementById('sidebar')?.classList.remove('open');
      navigateTo(btn.getAttribute('data-nav'));
    });
  });

  // Start Calling & Install App CTA buttons
  document.getElementById('rail-btn-start-calling')?.addEventListener('click', () => navigateTo('callmode'));
  document.getElementById('top-btn-start-calling')?.addEventListener('click', () => navigateTo('callmode'));
  document.getElementById('top-btn-install-app')?.addEventListener('click', async () => {
    if (deferredInstallPrompt) {
      deferredInstallPrompt.prompt();
      const { outcome } = await deferredInstallPrompt.userChoice;
      if (outcome === 'accepted') {
        deferredInstallPrompt = null;
        showToast('Installed DevEloped LeadDesk!');
        return;
      }
    }
    appState.showInstallModal = true;
    renderApp();
  });
  document.getElementById('top-btn-add-lead')?.addEventListener('click', () => {
    appState.showAddLeadModal = true;
    renderApp();
  });

  // Mobile Menu Toggle & Close on View Tap
  document.getElementById('mobile-menu-toggle')?.addEventListener('click', e => {
    e.stopPropagation();
    document.getElementById('sidebar')?.classList.toggle('open');
  });
  document.getElementById('view-container')?.addEventListener('click', () => {
    document.getElementById('sidebar')?.classList.remove('open');
  });

  // Global Top Search Bar
  const globalSearch = document.getElementById('global-search-input');
  globalSearch?.addEventListener('input', e => {
    const val = e.target.value;
    appState.globalSearch = val;
    appState.directory.search = val;
    if (appState.currentView !== 'leads' && appState.currentView !== 'pipeline' && val.trim().length > 1) {
      appState.currentView = 'leads';
    }
    renderApp();
    globalSearch.focus();
  });

  // Keyboard shortcuts for Call Mode & Drawer Escape
  window.addEventListener('keydown', e => {
    if (e.key === 'Escape') {
      if (appState.messageModal || appState.showAddLeadModal || appState.selectedLeadId) {
        appState.messageModal = null;
        appState.showAddLeadModal = false;
        appState.selectedLeadId = null;
        renderApp();
      }
      return;
    }
    const tag = (e.target?.tagName || '').toLowerCase();
    if (tag === 'input' || tag === 'textarea' || tag === 'select') return;
    if (appState.currentView === 'callmode') {
      const map = {
        '1': 'Sold',
        '2': 'Interested',
        '3': 'Sample Requested',
        '4': 'Callback',
        '5': 'Owner Not There',
        '6': 'Not Interested',
        '7': 'Wrong Number',
        '8': 'Do Not Call'
      };
      if (map[e.key]) {
        e.preventDefault();
        handleLogOutcomeInDialer(map[e.key]);
      }
    }
  });

  renderApp();
});

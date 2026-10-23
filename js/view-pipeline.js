// ============================================================================
// DevEloped LeadDesk — Salesforce-Style 9-Stage Kanban & Follow-Ups Queue
// ============================================================================

import { store } from './store.js';
import { PIPELINE_STAGES } from './seed-data.js';
import {
  escapeHtml,
  renderPitchBadge,
  renderWebsiteBadge,
  renderTempPill,
  formatFollowUpBadge,
  renderCategoryBadge,
  renderStagePill
} from './ui-helpers.js';

export function renderPipelineKanbanView(searchQuery = '', categoryFilter = 'all') {
  const leads = store.getLeads().filter(l => {
    if (searchQuery) {
      const q = searchQuery.toLowerCase();
      if (!l.businessName.toLowerCase().includes(q) && !l.phone.toLowerCase().includes(q)) return false;
    }
    if (categoryFilter !== 'all' && !(l.category || '').toLowerCase().includes(categoryFilter.toLowerCase())) {
      return false;
    }
    return true;
  });

  const followUps = store.getFollowUpBuckets();
  const urgentCount = followUps.overdue.length + followUps.dueToday.length;

  return `
    <div class="pipeline-toolbar">
      <div style="display:flex;align-items:center;gap:10px;flex-wrap:wrap;">
        <button class="btn btn-primary btn-sm">📋 Kanban Board (9 Stages)</button>
        <button class="btn btn-sm ${urgentCount > 0 ? 'btn-amber' : ''}" data-nav-target="followups">
          ⏰ Follow-Ups Queue (${followUps.overdue.length} Overdue · ${followUps.dueToday.length} Due Today)
        </button>
        <span style="font-size:12px;color:var(--text-muted);margin-left:6px;">
          Drag & drop cards between stages or click any business to open full profile
        </span>
      </div>
      <div style="display:flex;align-items:center;gap:8px;">
        <select class="select" id="kanban-cat-filter" style="padding:5px 10px;font-size:12px;">
          <option value="all" ${categoryFilter === 'all' ? 'selected' : ''}>All Categories</option>
          <option value="Mexican" ${categoryFilter === 'Mexican' ? 'selected' : ''}>Mexican / Restaurants</option>
          <option value="food truck" ${categoryFilter === 'food truck' ? 'selected' : ''}>Food Trucks</option>
          <option value="bakery" ${categoryFilter === 'bakery' ? 'selected' : ''}>Bakeries</option>
          <option value="barber" ${categoryFilter === 'barber' ? 'selected' : ''}>Barbershops</option>
          <option value="nail" ${categoryFilter === 'nail' ? 'selected' : ''}>Nail Salons</option>
          <option value="beauty" ${categoryFilter === 'beauty' ? 'selected' : ''}>Beauty / PMU</option>
          <option value="tattoo" ${categoryFilter === 'tattoo' ? 'selected' : ''}>Tattoo Shops</option>
          <option value="auto" ${categoryFilter === 'auto' ? 'selected' : ''}>Auto Repair</option>
        </select>
        <button class="btn btn-sm btn-emerald" data-nav-target="callmode">📞 Start Calling Queue</button>
      </div>
    </div>

    <div class="kanban-board">
      ${PIPELINE_STAGES.map(stage => {
        const colLeads = leads
          .filter(l => l.stage === stage.id)
          .sort((a, b) => b.pitchScore - a.pitchScore);
        const stageVal = colLeads.reduce((s, l) => s + (Number(l.deal?.priceAgreed) || 850), 0);

        return `
          <div class="kanban-col" data-kanban-stage="${escapeHtml(stage.id)}">
            <div class="kanban-col-header">
              <div class="kanban-col-title">
                <span class="stage-dot" style="background:${stage.color}"></span>
                <span>${escapeHtml(stage.label)}</span>
              </div>
              <div style="display:flex;align-items:center;gap:6px;">
                <span class="mono" style="font-size:11px;color:var(--text-muted);">$${stageVal.toLocaleString()}</span>
                <span class="nav-badge">${colLeads.length}</span>
              </div>
            </div>
            <div class="kanban-cards" data-kanban-dropzone="${escapeHtml(stage.id)}">
              ${
                colLeads.length === 0
                  ? `<div style="padding:26px 10px;text-align:center;color:var(--text-muted);font-size:11.5px;border:1px dashed rgba(255,255,255,0.06);border-radius:8px;">
                      Drop leads into ${escapeHtml(stage.label)}
                     </div>`
                  : colLeads
                      .map(
                        l => `
                      <div class="kanban-card" draggable="true" data-lead-card="${l.id}">
                        <div class="kanban-card-top">
                          <div class="kanban-biz-name" data-open-lead="${l.id}">${escapeHtml(l.businessName)}</div>
                          ${renderPitchBadge(l.pitchScore)}
                        </div>
                        <div style="display:flex;align-items:center;justify-content:space-between;font-size:11.5px;color:var(--text-secondary);">
                          <span>${renderCategoryBadge(l.category)}</span>
                          <span class="mono">⭐ ${Number(l.rating).toFixed(1)} (${l.reviewCount})</span>
                        </div>
                        <div style="display:flex;align-items:center;gap:6px;flex-wrap:wrap;">
                          ${renderWebsiteBadge(l)}
                          ${renderTempPill(l.temperature)}
                        </div>
                        ${l.nextFollowUp ? `<div>${formatFollowUpBadge(l.nextFollowUp)}</div>` : ''}
                        <div style="display:flex;align-items:center;justify-content:space-between;padding-top:6px;border-top:1px solid var(--border-subtle);margin-top:2px;">
                          <span class="mono" style="font-size:11.5px;color:var(--text-secondary);">${escapeHtml(l.phone)}</span>
                          <div style="display:flex;gap:4px;">
                            <button class="btn btn-sm btn-emerald" style="padding:3px 8px;font-size:11px;" data-dial-lead="${l.id}">Dial</button>
                            <button class="btn btn-sm" style="padding:3px 8px;font-size:11px;" data-open-lead="${l.id}">Open</button>
                          </div>
                        </div>
                      </div>`
                      )
                      .join('')
              }
            </div>
          </div>
        `;
      }).join('')}
    </div>
  `;
}

export function renderFollowUpsQueueView() {
  const { overdue, dueToday, upcoming } = store.getFollowUpBuckets();

  const renderBucketCard = (title, subtitle, list, accentColor, isOverdue = false) => `
    <div class="card" style="margin-bottom:18px;border-color:${isOverdue && list.length > 0 ? 'rgba(244,63,94,0.5)' : 'var(--border-subtle)'};">
      <div class="card-header">
        <div>
          <div class="card-title" style="color:${accentColor};display:flex;align-items:center;gap:8px;">
            <span>${title} (${list.length})</span>
          </div>
          <div class="card-subtitle">${subtitle}</div>
        </div>
        ${
          list.length > 0
            ? `<button class="btn btn-sm btn-emerald" data-dial-lead="${list[0].id}">⚡ Dial First in Queue</button>`
            : ''
        }
      </div>

      ${
        list.length === 0
          ? `<div style="padding:20px;text-align:center;color:var(--text-muted);font-size:13px;">No leads in this bucket right now.</div>`
          : `<div class="table-wrap">
              <table class="data-table">
                <thead>
                  <tr>
                    <th>Scheduled Time</th>
                    <th>Score</th>
                    <th>Business & Owner</th>
                    <th>Stage & Temp</th>
                    <th>Phone & Best Time Hint</th>
                    <th>Actions</th>
                  </tr>
                </thead>
                <tbody>
                  ${list
                    .map(
                      l => `
                    <tr style="${isOverdue ? 'background:rgba(244,63,94,0.06);' : ''}">
                      <td>${formatFollowUpBadge(l.nextFollowUp)}</td>
                      <td>${renderPitchBadge(l.pitchScore)}</td>
                      <td>
                        <div style="font-weight:700;cursor:pointer;color:${isOverdue ? '#FDA4AF' : 'var(--text-primary)'};" data-open-lead="${l.id}">
                          ${escapeHtml(l.businessName)}
                        </div>
                        <div style="font-size:11.5px;color:var(--text-secondary);">
                          ${l.ownerName ? `👤 ${escapeHtml(l.ownerName)} · ` : ''}${renderCategoryBadge(l.category)}
                        </div>
                      </td>
                      <td>
                        <div style="display:flex;gap:6px;align-items:center;">
                          ${renderStagePill(l.stage)}
                          ${renderTempPill(l.temperature)}
                        </div>
                      </td>
                      <td>
                        <div class="mono" style="font-weight:600;">${escapeHtml(l.phone)}</div>
                        <div style="font-size:11px;color:var(--text-muted);">${escapeHtml(l.bestTimeToCall)}</div>
                      </td>
                      <td>
                        <div style="display:flex;gap:6px;">
                          <button class="btn btn-sm btn-emerald" data-dial-lead="${l.id}">📞 Call Now</button>
                          <button class="btn btn-sm" data-snooze-lead="${l.id}" title="Snooze +2 Days">+2d</button>
                          <button class="btn btn-sm" data-open-lead="${l.id}">Details</button>
                        </div>
                      </td>
                    </tr>`
                    )
                    .join('')}
                </tbody>
              </table>
            </div>`
      }
    </div>
  `;

  return `
    <div style="display:flex;align-items:center;justify-content:space-between;margin-bottom:16px;flex-wrap:wrap;gap:10px;">
      <div style="display:flex;align-items:center;gap:10px;">
        <button class="btn btn-sm" data-nav-target="pipeline">← Back to Kanban Board</button>
        <span style="font-size:13px;color:var(--text-secondary);">
          Sorted chronologically by callback time so no prospect ever falls through the cracks.
        </span>
      </div>
      <button class="btn btn-sm btn-emerald" data-nav-target="callmode">
        ⚡ Start Calling Queue
      </button>
    </div>

    ${renderBucketCard('🚨 Overdue Follow-Ups', 'Past scheduled callback time — call these prospects immediately', overdue, '#FB7185', true)}
    ${renderBucketCard('⏰ Due Today', 'Scheduled for today — sorted by time', dueToday, '#FBBF24', false)}
    ${renderBucketCard('📅 Upcoming Callbacks', 'Scheduled for future dates', upcoming, '#60A5FA', false)}
  `;
}

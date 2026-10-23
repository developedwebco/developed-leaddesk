// ============================================================================
// DevEloped LeadDesk — Call Mode (Full-Screen Power Dialer)
// ============================================================================

import { store, fillTemplatePlaceholders } from './store.js';
import {
  escapeHtml,
  renderPitchBadge,
  renderWebsiteBadge,
  renderStagePill,
  renderTempPill,
  formatFollowUpBadge,
  renderCategoryBadge,
  formatRelativeDateTime
} from './ui-helpers.js';

export function getDialerQueue(queueFilter = 'callable') {
  const all = store.getLeads();
  let list = [];

  if (queueFilter === 'new') {
    list = all.filter(l => l.stage === 'New Lead');
  } else if (queueFilter === 'followups') {
    const { overdue, dueToday, upcoming } = store.getFollowUpBuckets();
    return [...overdue, ...dueToday, ...upcoming];
  } else if (queueFilter === 'hot') {
    list = all.filter(l => l.temperature === 'Hot' && !['Sold', 'Do Not Call', 'Not Interested'].includes(l.stage));
  } else if (queueFilter === 'samples') {
    list = all.filter(l => l.stage === 'Sample Sent');
  } else {
    // Default 'callable': All active leads not in Sold / Not Interested / Do Not Call
    list = all.filter(l => !['Sold', 'Not Interested', 'Do Not Call'].includes(l.stage));
  }

  return list.sort((a, b) => b.pitchScore - a.pitchScore);
}

export function renderCallModeView(dialerState) {
  const queue = getDialerQueue(dialerState.queueFilter);
  let activeLead = store.getLeadById(dialerState.activeLeadId);

  if (!activeLead && queue.length > 0) {
    activeLead = queue[0];
    dialerState.activeLeadId = activeLead.id;
  }

  if (!activeLead) {
    return `
      <div class="card" style="padding:48px;text-align:center;max-width:600px;margin:40px auto;">
        <h2 style="font-family:var(--font-display);font-size:20px;margin-bottom:8px;">🎉 Queue Complete!</h2>
        <p style="color:var(--text-secondary);margin-bottom:18px;">No leads match the current dialer filter (${escapeHtml(dialerState.queueFilter)}).</p>
        <div style="display:flex;justify-content:center;gap:10px;">
          <button class="btn btn-primary" data-dialer-queue="callable">Load All Callable Leads</button>
          <button class="btn" data-nav-target="finder">🔍 Find More Leads</button>
        </div>
      </div>
    `;
  }

  const currentIdx = Math.max(0, queue.findIndex(l => l.id === activeLead.id));
  const timerMin = String(Math.floor(dialerState.timerSec / 60)).padStart(2, '0');
  const timerRem = String(dialerState.timerSec % 60).padStart(2, '0');

  // Default 2-day callback suggestion for "Owner Not There" or "Callback"
  const defCallbackDate = new Date();
  defCallbackDate.setDate(defCallbackDate.getDate() + 2);
  defCallbackDate.setHours(10, 30, 0, 0);
  const defCallbackIso = new Date(defCallbackDate.getTime() - defCallbackDate.getTimezoneOffset() * 60000)
    .toISOString()
    .slice(0, 16);

  return `
    <!-- Top Queue Bar -->
    <div style="display:flex;align-items:center;justify-content:space-between;gap:12px;margin-bottom:14px;flex-wrap:wrap;">
      <div style="display:flex;align-items:center;gap:10px;flex-wrap:wrap;">
        <span class="mono" style="font-size:12.5px;font-weight:700;padding:5px 10px;background:var(--bg-surface);border:1px solid var(--border-subtle);border-radius:8px;color:#60A5FA;">
          ⚡ POWER DIALER · Lead ${currentIdx + 1} of ${queue.length || 1}
        </span>
        <select class="select" id="dialer-queue-filter" style="padding:6px 10px;font-size:12.5px;">
          <option value="callable" ${dialerState.queueFilter === 'callable' ? 'selected' : ''}>Queue: All Callable (Highest Pitch Score First)</option>
          <option value="new" ${dialerState.queueFilter === 'new' ? 'selected' : ''}>Queue: New Leads Only</option>
          <option value="followups" ${dialerState.queueFilter === 'followups' ? 'selected' : ''}>Queue: Follow-Ups Due & Overdue</option>
          <option value="hot" ${dialerState.queueFilter === 'hot' ? 'selected' : ''}>Queue: 🔥 Hot Leads Only</option>
          <option value="samples" ${dialerState.queueFilter === 'samples' ? 'selected' : ''}>Queue: Sample Sent Follow-Ups</option>
        </select>
        <label style="display:flex;align-items:center;gap:6px;font-size:12px;color:var(--text-secondary);cursor:pointer;">
          <input type="checkbox" id="dialer-auto-advance" ${store.state.settings.autoAdvanceCallMode !== false ? 'checked' : ''} style="accent-color:#3B82F6;" />
          <span>Auto-load next lead on outcome</span>
        </label>
      </div>

      <div style="display:flex;align-items:center;gap:8px;">
        <button class="btn btn-sm" id="dialer-prev-lead">← Prev</button>
        <button class="btn btn-sm" id="dialer-next-lead">Skip / Next Lead →</button>
        <button class="btn btn-sm" data-open-lead="${activeLead.id}">Full Profile Drawer ↗</button>
      </div>
    </div>

    ${renderCallModeColumns(activeLead, dialerState, timerMin, timerRem, defCallbackIso)}
  `;
}

function renderCallModeColumns(activeLead, dialerState, timerMin, timerRem, defCallbackIso) {
  const scripts = store.state.scripts;
  const activeTab = dialerState.scriptTab || 'opener';

  let rawScriptText = '';
  if (activeTab === 'opener') rawScriptText = scripts.opener.content;
  else if (activeTab === 'gatekeeper') rawScriptText = scripts.gatekeeper.content;
  else if (activeTab === 'voicemail') rawScriptText = scripts.voicemail.content;
  else if (activeTab === 'sampleReveal') rawScriptText = scripts.sampleReveal.content;
  else if (activeTab === 'closing') rawScriptText = scripts.closing.content;

  const filledScript = escapeHtml(fillTemplatePlaceholders(rawScriptText, activeLead));

  return `
    <div class="dialer-layout">
      <!-- LEFT COLUMN: Lead Details, Tap-to-Call, Pitch Angle, Notes & 8 Outcome Buttons -->
      <div class="dialer-left">
        <div class="dialer-lead-header">
          <div style="display:flex;align-items:center;justify-content:space-between;gap:10px;flex-wrap:wrap;margin-bottom:8px;">
            <div style="display:flex;align-items:center;gap:8px;flex-wrap:wrap;">
              ${renderPitchBadge(activeLead.pitchScore, true)}
              ${renderWebsiteBadge(activeLead)}
              ${renderStagePill(activeLead.stage)}
              ${renderTempPill(activeLead.temperature)}
            </div>
            <span style="font-size:12px;color:#FBBF24;font-weight:600;">⏰ ${escapeHtml(activeLead.bestTimeToCall)}</span>
          </div>

          <div style="display:flex;align-items:baseline;justify-content:space-between;gap:12px;flex-wrap:wrap;">
            <h1 style="font-family:var(--font-display);font-size:24px;font-weight:800;letter-spacing:-0.02em;">
              ${escapeHtml(activeLead.businessName)}
            </h1>
            <a href="${escapeHtml(activeLead.googleMapsUrl)}" target="_blank" rel="noopener" style="font-size:12.5px;color:#60A5FA;text-decoration:none;font-weight:600;">
              📍 ${escapeHtml(activeLead.address)}, ${escapeHtml(activeLead.city)} · ⭐ ${Number(activeLead.rating).toFixed(1)} (${activeLead.reviewCount} reviews) ↗
            </a>
          </div>
        </div>

        <div class="dialer-body">
          <!-- Big Tap-to-Call Bar -->
          <div class="big-call-bar">
            <div style="display:flex;align-items:center;gap:14px;flex-wrap:wrap;">
              <a href="tel:${escapeHtml(activeLead.phone)}" class="btn-tap-to-call" id="dialer-btn-tap-call">
                <span>📞</span>
                <span>${escapeHtml(activeLead.phone)}</span>
              </a>
              <div>
                <div style="font-size:11px;color:var(--text-muted);text-transform:uppercase;font-weight:700;">Call Duration Timer</div>
                <div class="mono" style="font-size:20px;font-weight:700;color:${dialerState.timerRunning ? '#34D399' : 'var(--text-secondary)'};" id="dialer-timer-display">
                  ${timerMin}:${timerRem}
                </div>
              </div>
            </div>
            <div style="display:flex;gap:8px;flex-wrap:wrap;">
              <button class="btn btn-indigo" data-sms-lead="${activeLead.id}">💬 Text Sample</button>
              <button class="btn" data-email-lead="${activeLead.id}">✉️ Email Sample</button>
              <button class="btn btn-sm" data-copy-shield="${activeLead.id}" title="Copy HTML/JS Preview Protection Shield for this demo site" style="border-color:rgba(59,130,246,0.4);color:#93C5FD;">🛡 Copy Demo Lock Code</button>
            </div>
          </div>

          <!-- Highlighted Pitch Angle -->
          <div class="pitch-angle-box">
            <div style="font-size:10.5px;font-weight:700;text-transform:uppercase;letter-spacing:0.07em;color:#93C5FD;margin-bottom:2px;">
              🎯 Tailor-Made Pitch Angle
            </div>
            <div style="font-weight:600;font-size:13.5px;color:#F8FAFC;">"${escapeHtml(activeLead.pitchAngle)}"</div>
          </div>

          <!-- Inline Owner Name & Sample URL Capture -->
          <div style="display:grid;grid-template-columns:1fr 1fr 1.4fr;gap:10px;">
            <div class="form-group">
              <label class="form-label">Owner Name (fill in live)</label>
              <input type="text" class="input" id="dialer-owner-input" value="${escapeHtml(activeLead.ownerName)}" placeholder="e.g. Carlos" />
            </div>
            <div class="form-group">
              <label class="form-label">Owner Email</label>
              <input type="email" class="input" id="dialer-email-input" value="${escapeHtml(activeLead.email)}" placeholder="owner@email.com" />
            </div>
            <div class="form-group">
              <label class="form-label">Sample Site URL</label>
              <input type="url" class="input mono" id="dialer-sample-input" value="${escapeHtml(activeLead.sampleSite?.url || '')}" style="font-size:12px;" />
            </div>
          </div>

          <!-- Call Notes Box + Quick Chips -->
          <div class="form-group">
            <div style="display:flex;align-items:center;justify-content:space-between;flex-wrap:wrap;gap:6px;">
              <label class="form-label">Call Notes (logged automatically with outcome)</label>
              <div style="display:flex;gap:5px;flex-wrap:wrap;">
                ${['Spoke to gatekeeper', 'Owner in mornings', 'Left voicemail', 'Texted sample link', 'Wants $850 package']
                  .map(chip => `<button type="button" class="btn btn-sm" style="padding:2px 7px;font-size:11px;" data-note-chip="${escapeHtml(chip)}">+ ${escapeHtml(chip)}</button>`)
                  .join('')}
              </div>
            </div>
            <textarea class="textarea" id="dialer-notes-input" rows="2" placeholder="Jot down who you spoke to, what they said, or when the owner is in...">${escapeHtml(dialerState.draftNote || '')}</textarea>
          </div>

          <!-- Optional Callback Date/Time Picker & Deal Price Bar -->
          <div style="display:flex;align-items:center;justify-content:space-between;gap:12px;padding:10px 12px;background:var(--bg-canvas);border:1px solid var(--border-subtle);border-radius:8px;flex-wrap:wrap;">
            <div style="display:flex;align-items:center;gap:8px;">
              <span style="font-size:12px;color:var(--text-secondary);font-weight:600;">📅 Callback / Retry Time:</span>
              <input type="datetime-local" class="input mono" id="dialer-callback-dt" value="${defCallbackIso}" style="padding:4px 8px;font-size:12px;" />
            </div>
            <div style="display:flex;align-items:center;gap:8px;">
              <span style="font-size:12px;color:var(--text-secondary);font-weight:600;">💰 Package Quote ($):</span>
              <input type="number" step="25" class="input mono" id="dialer-deal-price" value="${activeLead.deal?.priceAgreed || 850}" style="width:90px;padding:4px 8px;font-size:12px;" />
            </div>
          </div>

          <!-- 8 ONE-TAP OUTCOME BUTTONS -->
          <div>
            <div style="font-size:11px;font-weight:700;text-transform:uppercase;letter-spacing:0.06em;color:var(--text-muted);margin-bottom:8px;">
              One-Tap Call Outcome (Logs call, moves stage & loads next lead)
            </div>
            <div class="outcome-grid">
              <button class="outcome-btn sold" data-log-outcome="Sold">
                <div class="outcome-title"><span>🎉 Sold!</span><span class="kbd-hint">1</span></div>
                <div class="outcome-sub">Moves to Sold + Revenue</div>
              </button>
              <button class="outcome-btn interested" data-log-outcome="Interested">
                <div class="outcome-title"><span>🔥 Interested</span><span class="kbd-hint">2</span></div>
                <div class="outcome-sub">Sets Hot + Next-day follow-up</div>
              </button>
              <button class="outcome-btn sample" data-log-outcome="Sample Requested">
                <div class="outcome-title"><span>🌐 Sample Requested</span><span class="kbd-hint">3</span></div>
                <div class="outcome-sub">Moves to Sample Sent + 2d</div>
              </button>
              <button class="outcome-btn callback" data-log-outcome="Callback">
                <div class="outcome-title"><span>📅 Callback</span><span class="kbd-hint">4</span></div>
                <div class="outcome-sub">Schedules picked date/time</div>
              </button>
              <button class="outcome-btn owner-out" data-log-outcome="Owner Not There">
                <div class="outcome-title"><span>🚪 Owner Not There</span><span class="kbd-hint">5</span></div>
                <div class="outcome-sub">Auto-schedules retry in 2 days</div>
              </button>
              <button class="outcome-btn" data-log-outcome="Not Interested">
                <div class="outcome-title"><span>👎 Not Interested</span><span class="kbd-hint">6</span></div>
                <div class="outcome-sub">Moves to Not Interested</div>
              </button>
              <button class="outcome-btn" data-log-outcome="Wrong Number">
                <div class="outcome-title"><span>⚠️ Wrong Number</span><span class="kbd-hint">7</span></div>
                <div class="outcome-sub">Flags number & archives</div>
              </button>
              <button class="outcome-btn dnc" data-log-outcome="Do Not Call">
                <div class="outcome-title"><span>🛑 Do Not Call</span><span class="kbd-hint">8</span></div>
                <div class="outcome-sub">Moves to DNC & removes</div>
              </button>
            </div>
          </div>
        </div>
      </div>

      <!-- RIGHT COLUMN: Interactive Call Script & Objection Handlers Side Panel -->
      ${renderDialerScriptSidePanel(activeLead, activeTab, filledScript, scripts)}
    </div>
  `;
}

function renderDialerScriptSidePanel(activeLead, activeTab, filledScript, scripts) {
  const objections = scripts.objections || {};

  return `
    <div class="dialer-right">
      <div class="script-tabs">
        <button class="script-tab ${activeTab === 'opener' ? 'active' : ''}" data-script-tab="opener">🎙 Opener</button>
        <button class="script-tab ${activeTab === 'gatekeeper' ? 'active' : ''}" data-script-tab="gatekeeper">🚪 Gatekeeper</button>
        <button class="script-tab ${activeTab === 'voicemail' ? 'active' : ''}" data-script-tab="voicemail">📟 Voicemail</button>
        <button class="script-tab ${activeTab === 'objections' ? 'active' : ''}" data-script-tab="objections">🛡 Objections (5)</button>
        <button class="script-tab ${activeTab === 'sampleReveal' ? 'active' : ''}" data-script-tab="sampleReveal">🌐 Sample Reveal</button>
        <button class="script-tab ${activeTab === 'closing' ? 'active' : ''}" data-script-tab="closing">🤝 Closing</button>
      </div>

      ${
        activeTab === 'objections'
          ? `
        <div style="padding:16px 20px;overflow-y:auto;flex:1;display:flex;flex-direction:column;gap:12px;">
          ${Object.entries(objections)
            .map(
              ([key, obj]) => `
            <div style="padding:12px 14px;background:var(--bg-canvas);border:1px solid var(--border-subtle);border-left:3px solid #F59E0B;border-radius:8px;">
              <div style="font-weight:700;font-size:13px;color:#FBBF24;margin-bottom:6px;">${escapeHtml(obj.title)}</div>
              <div style="font-size:13.5px;color:#E2E8F0;line-height:1.55;">
                ${escapeHtml(fillTemplatePlaceholders(obj.content, activeLead))}
              </div>
            </div>`
            )
            .join('')}
        </div>`
          : `<div class="script-reader">${filledScript}</div>`
      }

      <!-- Recent Call History Footer inside Dialer -->
      <div style="padding:12px 18px;border-top:1px solid var(--border-subtle);background:var(--bg-rail);max-height:150px;overflow-y:auto;">
        <div style="display:flex;align-items:center;justify-content:space-between;margin-bottom:6px;">
          <span style="font-size:11px;font-weight:700;text-transform:uppercase;color:var(--text-muted);">
            Previous Activity on ${escapeHtml(activeLead.businessName)} (${(activeLead.callLogs?.length || 0) + (activeLead.notes?.length || 0)})
          </span>
          <button class="btn btn-sm" style="padding:2px 8px;font-size:11px;" data-nav-target="scripts">Edit Scripts ✎</button>
        </div>
        ${
          (activeLead.callLogs?.length || 0) === 0 && (activeLead.notes?.length || 0) === 0
            ? `<div style="font-size:12px;color:var(--text-muted);">First touch — no prior calls logged yet.</div>`
            : `<div style="display:flex;flex-direction:column;gap:4px;">
                ${(activeLead.callLogs || [])
                  .slice(0, 3)
                  .map(
                    c => `
                  <div style="font-size:11.5px;color:var(--text-secondary);">
                    <strong style="color:#60A5FA;">${escapeHtml(c.outcome)}</strong> · ${formatRelativeDateTime(c.timestamp)} ${c.notes ? `— "${escapeHtml(c.notes)}"` : ''}
                  </div>`
                  )
                  .join('')}
                ${(activeLead.notes || [])
                  .slice(0, 2)
                  .map(
                    n => `
                  <div style="font-size:11.5px;color:var(--text-secondary);">
                    📌 ${escapeHtml(n.text)}
                  </div>`
                  )
                  .join('')}
               </div>`
        }
      </div>
    </div>
  `;
}

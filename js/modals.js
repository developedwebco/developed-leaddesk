// ============================================================================
// DevEloped LeadDesk — Lead Detail Drawer, Quick SMS/Email, CSV & Merge Modals
// ============================================================================

import { store, fillTemplatePlaceholders, slugifyBusinessName } from './store.js';
import { PIPELINE_STAGES, CATEGORY_CONFIG } from './seed-data.js';
import {
  escapeHtml,
  renderPitchBadge,
  renderWebsiteBadge,
  renderStagePill,
  renderTempPill,
  formatRelativeDateTime
} from './ui-helpers.js';

export function renderLeadDetailDrawer(leadId, onClose, onLaunchCallMode, onOpenMessageModal) {
  const lead = store.getLeadById(leadId);
  if (!lead) return '';

  const priceAgreed = Number(lead.deal?.priceAgreed) || 850;
  const depositPaid = lead.deal?.paidInFull ? priceAgreed : Number(lead.deal?.depositPaid) || 0;
  const balanceDue = Math.max(0, priceAgreed - depositPaid);

  const followUpLocalVal = lead.nextFollowUp
    ? new Date(new Date(lead.nextFollowUp).getTime() - new Date().getTimezoneOffset() * 60000)
        .toISOString()
        .slice(0, 16)
    : '';

  const sampleDateVal = lead.sampleSite?.dateSent
    ? new Date(lead.sampleSite.dateSent).toISOString().slice(0, 10)
    : '';

  return `
    <div class="drawer-backdrop" id="lead-drawer-backdrop">
      <div class="lead-drawer" onclick="event.stopPropagation()">
        <!-- Drawer Header -->
        <div class="drawer-header">
          <div style="display:flex;flex-direction:column;gap:6px;min-width:0;">
            <div style="display:flex;align-items:center;gap:8px;flex-wrap:wrap;">
              ${renderPitchBadge(lead.pitchScore, true)}
              ${renderWebsiteBadge(lead)}
              ${renderStagePill(lead.stage)}
              ${renderTempPill(lead.temperature)}
            </div>
            <h2 style="font-family:var(--font-display);font-size:20px;font-weight:800;color:var(--text-primary);margin-top:2px;">
              ${escapeHtml(lead.businessName)}
            </h2>
            <div style="font-size:12.5px;color:var(--text-secondary);display:flex;align-items:center;gap:10px;flex-wrap:wrap;">
              <span>📍 ${escapeHtml(lead.address)}, ${escapeHtml(lead.city)}</span>
              <span>·</span>
              <span class="mono">⭐ ${Number(lead.rating).toFixed(1)} (${lead.reviewCount} reviews)</span>
              <span>·</span>
              <a href="${escapeHtml(lead.googleMapsUrl)}" target="_blank" rel="noopener" style="color:#60A5FA;text-decoration:none;font-weight:600;">
                Open Google Listing ↗
              </a>
            </div>
          </div>
          <button class="btn btn-sm" id="btn-close-drawer" title="Close (Esc)">✕ Close</button>
        </div>

        <!-- Drawer Body -->
        <div class="drawer-body">
          <!-- Quick Actions Bar -->
          <div style="display:flex;align-items:center;gap:8px;flex-wrap:wrap;padding:12px;background:var(--bg-elevated);border:1px solid var(--border-subtle);border-radius:10px;">
            <a href="tel:${escapeHtml(lead.phone)}" class="btn btn-emerald" id="drawer-btn-call-tel">
              📞 Call ${escapeHtml(lead.phone)}
            </a>
            <button class="btn btn-primary" id="drawer-btn-dialer">
              ⚡ Open in Call Mode
            </button>
            <button class="btn btn-indigo" id="drawer-btn-sms">
              💬 Text Sample / Template
            </button>
            <button class="btn" id="drawer-btn-email">
              ✉️ Email Template
            </button>
            <button class="btn btn-danger btn-sm" id="drawer-btn-delete" style="margin-left:auto;">
              🗑 Delete
            </button>
          </div>

          <!-- Pitch Angle & Score Breakdown -->
          <div class="card" style="padding:14px 16px;">
            <div style="display:flex;align-items:center;justify-content:space-between;margin-bottom:8px;">
              <span style="font-size:11.5px;font-weight:700;text-transform:uppercase;letter-spacing:0.06em;color:#A5B4FC;">
                🎯 Custom Pitch Angle & Score Breakdown (${lead.pitchScore}/100)
              </span>
              <button class="btn btn-sm" id="drawer-btn-regen-angle" title="Regenerate from lead metrics">↻ Regenerate Angle</button>
            </div>
            <div class="pitch-angle-box" style="margin-bottom:10px;">
              <input type="text" class="input" id="drawer-pitch-angle" value="${escapeHtml(lead.pitchAngle)}" style="width:100%;background:transparent;border:none;padding:0;color:#F8FAFC;font-size:13px;" />
            </div>
            <div style="display:grid;grid-template-columns:repeat(5,1fr);gap:6px;font-size:11px;color:var(--text-secondary);" class="mono">
              <div style="background:var(--bg-canvas);padding:6px 8px;border-radius:6px;">Reviews: <strong>${lead.pitchBreakdown?.reviewPts ?? 18}/30</strong></div>
              <div style="background:var(--bg-canvas);padding:6px 8px;border-radius:6px;">Rating: <strong>${lead.pitchBreakdown?.ratingPts ?? 16}/20</strong></div>
              <div style="background:var(--bg-canvas);padding:6px 8px;border-radius:6px;">Web Lack: <strong>${lead.pitchBreakdown?.webPts ?? 22}/25</strong></div>
              <div style="background:var(--bg-canvas);padding:6px 8px;border-radius:6px;">Category: <strong>${lead.pitchBreakdown?.categoryPts ?? 15}/15</strong></div>
              <div style="background:var(--bg-canvas);padding:6px 8px;border-radius:6px;">Momentum: <strong>${lead.pitchBreakdown?.activityPts ?? 9}/10</strong></div>
            </div>
          </div>

          <!-- Pipeline Stage, Temperature & Follow-Up Controls -->
          <div class="card" style="padding:16px;">
            <div class="card-title" style="margin-bottom:12px;font-size:14px;">Pipeline & Follow-Up Schedule</div>
            <div style="display:grid;grid-template-columns:1fr 1fr 1.3fr;gap:12px;">
              <div class="form-group">
                <label class="form-label">Pipeline Stage</label>
                <select class="select" id="drawer-stage">
                  ${PIPELINE_STAGES.map(
                    s => `<option value="${escapeHtml(s.id)}" ${lead.stage === s.id ? 'selected' : ''}>${escapeHtml(s.label)}</option>`
                  ).join('')}
                </select>
              </div>
              <div class="form-group">
                <label class="form-label">Follow-Up Temperature</label>
                <select class="select" id="drawer-temp">
                  <option value="Hot" ${lead.temperature === 'Hot' ? 'selected' : ''}>🔥 Hot Lead</option>
                  <option value="Warm" ${lead.temperature === 'Warm' ? 'selected' : ''}>⚡ Warm Lead</option>
                  <option value="Cold" ${lead.temperature === 'Cold' ? 'selected' : ''}>❄️ Cold Lead</option>
                </select>
              </div>
              <div class="form-group">
                <label class="form-label">Next Follow-Up Date & Time</label>
                <div style="display:flex;gap:6px;">
                  <input type="datetime-local" class="input mono" id="drawer-followup" value="${followUpLocalVal}" style="flex:1;" />
                  <button class="btn btn-sm" id="drawer-clear-followup" title="Clear Follow-Up">Clear</button>
                </div>
              </div>
            </div>
            <div style="display:flex;align-items:center;gap:6px;margin-top:10px;flex-wrap:wrap;">
              <span style="font-size:11.5px;color:var(--text-muted);">Quick Schedule:</span>
              <button class="btn btn-sm" data-quick-followup="today3h">Today +3h</button>
              <button class="btn btn-sm" data-quick-followup="tomorrow10am">Tomorrow 10:00 AM</button>
              <button class="btn btn-sm" data-quick-followup="in2days">In 2 Days (Best Time)</button>
              <button class="btn btn-sm" data-quick-followup="nextweek">In 7 Days</button>
            </div>
          </div>

          <!-- Business & Owner Profile Form -->
          <div class="card" style="padding:16px;">
            <div style="display:flex;align-items:center;justify-content:space-between;margin-bottom:12px;">
              <span class="card-title" style="font-size:14px;">Business & Contact Profile</span>
              <span style="font-size:11.5px;color:#34D399;" id="drawer-save-indicator">Auto-saves on edit</span>
            </div>
            <div style="display:grid;grid-template-columns:1fr 1fr;gap:12px;">
              <div class="form-group">
                <label class="form-label">Business Name</label>
                <input type="text" class="input" id="drawer-biz-name" value="${escapeHtml(lead.businessName)}" />
              </div>
              <div class="form-group">
                <label class="form-label">Owner / Decision-Maker Name</label>
                <input type="text" class="input" id="drawer-owner-name" placeholder="Fill in as you learn it (e.g. Carlos)" value="${escapeHtml(lead.ownerName)}" />
              </div>
              <div class="form-group">
                <label class="form-label">Phone Number</label>
                <input type="text" class="input mono" id="drawer-phone" value="${escapeHtml(lead.phone)}" />
              </div>
              <div class="form-group">
                <label class="form-label">Email Address</label>
                <input type="email" class="input" id="drawer-email" placeholder="owner@business.com" value="${escapeHtml(lead.email)}" />
              </div>
              <div class="form-group">
                <label class="form-label">Category</label>
                <input type="text" class="input" id="drawer-category" value="${escapeHtml(lead.category)}" />
              </div>
              <div class="form-group">
                <label class="form-label">Best Time to Call</label>
                <input type="text" class="input" id="drawer-best-time" value="${escapeHtml(lead.bestTimeToCall)}" />
              </div>
              <div class="form-group">
                <label class="form-label">Street Address</label>
                <input type="text" class="input" id="drawer-address" value="${escapeHtml(lead.address)}" />
              </div>
              <div class="form-group">
                <label class="form-label">City / State</label>
                <input type="text" class="input" id="drawer-city" value="${escapeHtml(lead.city)}" />
              </div>
              <div class="form-group">
                <label class="form-label">Google Rating & Review Count</label>
                <div style="display:flex;gap:8px;">
                  <input type="number" step="0.1" min="1" max="5" class="input mono" id="drawer-rating" value="${lead.rating}" style="width:90px;" />
                  <input type="number" min="0" class="input mono" id="drawer-reviews" value="${lead.reviewCount}" style="flex:1;" placeholder="Reviews" />
                </div>
              </div>
              <div class="form-group">
                <label class="form-label">Website Status & Weak Presence Detail</label>
                <div style="display:flex;gap:8px;">
                  <select class="select" id="drawer-web-status" style="width:140px;">
                    <option value="None" ${lead.websiteStatus === 'None' ? 'selected' : ''}>None</option>
                    <option value="Weak Presence" ${lead.websiteStatus === 'Weak Presence' ? 'selected' : ''}>Weak Presence</option>
                  </select>
                  <input type="text" class="input" id="drawer-web-detail" value="${escapeHtml(lead.weakPresenceDetail)}" placeholder="e.g. Booksy only" style="flex:1;" />
                </div>
              </div>
            </div>
          </div>

          <!-- Sample Site & Revenue Tracker (2-Column Split) -->
          <div style="display:grid;grid-template-columns:1.15fr 1fr;gap:14px;">
            <!-- Sample Site Section -->
            <div class="card" style="padding:16px;border-color:rgba(99,102,241,0.35);">
              <div class="card-title" style="font-size:14px;margin-bottom:10px;color:#A5B4FC;">
                🌐 Sample Site Built for Prospect
              </div>
              <div class="form-group" style="margin-bottom:10px;">
                <label class="form-label">Demo Website URL</label>
                <div style="display:flex;gap:6px;">
                  <input type="url" class="input mono" id="drawer-sample-url" value="${escapeHtml(lead.sampleSite?.url || '')}" style="flex:1;font-size:12px;" />
                  <a href="${escapeHtml(lead.sampleSite?.url || '#')}" target="_blank" rel="noopener" class="btn btn-sm" title="Open Sample Link">↗</a>
                </div>
              </div>
              <div style="display:grid;grid-template-columns:1fr 1fr;gap:8px;margin-bottom:10px;">
                <div class="form-group">
                  <label class="form-label">Date Sent</label>
                  <input type="date" class="input mono" id="drawer-sample-date" value="${sampleDateVal}" />
                </div>
                <div class="form-group">
                  <label class="form-label">How Sent</label>
                  <select class="select" id="drawer-sample-method">
                    <option value="Text / SMS" ${lead.sampleSite?.method === 'Text / SMS' ? 'selected' : ''}>Text / SMS</option>
                    <option value="Email" ${lead.sampleSite?.method === 'Email' ? 'selected' : ''}>Email</option>
                    <option value="In Person" ${lead.sampleSite?.method === 'In Person' ? 'selected' : ''}>In Person</option>
                    <option value="Instagram DM" ${lead.sampleSite?.method === 'Instagram DM' ? 'selected' : ''}>Instagram DM</option>
                  </select>
                </div>
              </div>
              <button class="btn btn-indigo btn-sm" id="drawer-btn-mark-sample-sent" style="width:100%;">
                ✓ Stamp Sent Today & Move to "Sample Sent"
              </button>
            </div>

            <!-- Revenue Tracker Section -->
            <div class="card" style="padding:16px;border-color:rgba(16,185,129,0.35);">
              <div class="card-title" style="font-size:14px;margin-bottom:10px;color:#34D399;">
                💰 Deal & Revenue Tracker
              </div>
              <div style="display:grid;grid-template-columns:1fr 1fr;gap:8px;margin-bottom:10px;">
                <div class="form-group">
                  <label class="form-label">Price Agreed ($)</label>
                  <input type="number" step="25" min="0" class="input mono" id="drawer-deal-price" value="${priceAgreed}" />
                </div>
                <div class="form-group">
                  <label class="form-label">Deposit Paid ($)</label>
                  <input type="number" step="25" min="0" class="input mono" id="drawer-deal-deposit" value="${depositPaid}" />
                </div>
              </div>
              <div style="display:flex;align-items:center;justify-content:space-between;padding:8px 10px;background:var(--bg-canvas);border-radius:8px;margin-bottom:10px;">
                <span style="font-size:12px;color:var(--text-secondary);">Balance Due:</span>
                <span class="mono" style="font-size:14px;font-weight:700;color:${balanceDue === 0 ? '#34D399' : '#FBBF24'};" id="drawer-deal-balance">
                  $${balanceDue.toLocaleString()}
                </span>
              </div>
              <label style="display:flex;align-items:center;gap:8px;cursor:pointer;font-size:13px;font-weight:600;color:var(--text-primary);">
                <input type="checkbox" id="drawer-deal-paid-full" ${lead.deal?.paidInFull ? 'checked' : ''} style="width:16px;height:16px;accent-color:#10B981;" />
                <span>Paid in Full (100% Collected)</span>
              </label>
            </div>
          </div>

          <!-- Complete Call Log & Timestamped Notes Feed -->
          <div class="card" style="padding:16px;">
            <div class="card-title" style="font-size:14px;margin-bottom:10px;">
              📝 Call History & Timestamped Notes (${(lead.callLogs?.length || 0) + (lead.notes?.length || 0)})
            </div>
            <div style="display:flex;gap:8px;margin-bottom:14px;">
              <input type="text" class="input" id="drawer-new-note" placeholder="Add a timestamped note (e.g., Owner Maria comes in at 2 PM, interested in online menu)..." style="flex:1;" />
              <button class="btn btn-primary" id="drawer-btn-add-note">+ Add Note</button>
            </div>

            <div style="display:flex;flex-direction:column;gap:8px;max-height:300px;overflow-y:auto;">
              ${renderCombinedTimeline(lead)}
            </div>
          </div>
        </div>
      </div>
    </div>
  `;
}

function renderCombinedTimeline(lead) {
  const items = [];
  for (const c of lead.callLogs || []) {
    items.push({
      type: 'call',
      time: c.timestamp,
      outcome: c.outcome,
      durationSec: c.durationSec,
      text: c.notes
    });
  }
  for (const n of lead.notes || []) {
    // Avoid duplicating auto-generated call notes if identical timestamp
    if (n.text && n.text.startsWith('[Call:')) continue;
    items.push({
      type: 'note',
      time: n.createdAt,
      text: n.text
    });
  }

  items.sort((a, b) => new Date(b.time) - new Date(a.time));

  if (!items.length) {
    return `<div style="padding:18px;text-align:center;color:var(--text-muted);font-size:12.5px;">No calls or notes logged yet for ${escapeHtml(lead.businessName)}.</div>`;
  }

  return items
    .map(item => {
      if (item.type === 'call') {
        return `
          <div style="padding:10px 12px;background:var(--bg-canvas);border-left:3px solid #3B82F6;border-radius:0 8px 8px 0;display:flex;flex-direction:column;gap:4px;">
            <div style="display:flex;align-items:center;justify-content:space-between;font-size:11.5px;">
              <span style="font-weight:700;color:#60A5FA;">📞 Call Outcome: ${escapeHtml(item.outcome)} ${item.durationSec ? `(${item.durationSec}s)` : ''}</span>
              <span class="mono" style="color:var(--text-muted);">${formatRelativeDateTime(item.time)}</span>
            </div>
            ${item.text ? `<div style="font-size:13px;color:var(--text-primary);">${escapeHtml(item.text)}</div>` : ''}
          </div>
        `;
      }
      return `
        <div style="padding:10px 12px;background:var(--bg-canvas);border-left:3px solid #10B981;border-radius:0 8px 8px 0;display:flex;flex-direction:column;gap:4px;">
          <div style="display:flex;align-items:center;justify-content:space-between;font-size:11.5px;">
            <span style="font-weight:700;color:#34D399;">📌 Note</span>
            <span class="mono" style="color:var(--text-muted);">${formatRelativeDateTime(item.time)}</span>
          </div>
          <div style="font-size:13px;color:var(--text-primary);">${escapeHtml(item.text)}</div>
        </div>
      `;
    })
    .join('');
}

// Quick Send Text / Email Modal with Prefilled Templates
export function renderQuickMessageModal(leadId, defaultChannel = 'sms') {
  const lead = store.getLeadById(leadId);
  if (!lead) return '';
  const templates = store.state.templates || [];
  const matchingTemplates = templates.filter(t => (defaultChannel === 'email' ? t.channel === 'email' : true));
  const selectedTpl = matchingTemplates[0] || templates[0];

  const filledSubject = fillTemplatePlaceholders(selectedTpl?.subject || `Custom Website Preview for ${lead.businessName}`, lead);
  const filledBody = fillTemplatePlaceholders(selectedTpl?.body || '', lead);

  return `
    <div class="modal-backdrop" id="msg-modal-backdrop">
      <div class="modal-card" onclick="event.stopPropagation()">
        <div class="modal-header">
          <div class="card-title">
            ${defaultChannel === 'email' ? '✉️ Send Prefilled Email' : '💬 Send Prefilled Text (SMS)'} — ${escapeHtml(lead.businessName)}
          </div>
          <button class="btn btn-sm" id="msg-modal-close">✕</button>
        </div>
        <div class="modal-body">
          <div class="form-group">
            <label class="form-label">Select Message Template</label>
            <select class="select" id="msg-modal-tpl-select">
              ${templates
                .map(
                  t => `<option value="${escapeHtml(t.id)}" ${t.id === selectedTpl?.id ? 'selected' : ''}>${escapeHtml(t.name)} (${t.channel.toUpperCase()})</option>`
                )
                .join('')}
            </select>
          </div>
          <div style="display:grid;grid-template-columns:1fr 1fr;gap:10px;">
            <div class="form-group">
              <label class="form-label">Recipient Phone</label>
              <input type="text" class="input mono" id="msg-modal-phone" value="${escapeHtml(lead.phone)}" />
            </div>
            <div class="form-group">
              <label class="form-label">Recipient Email</label>
              <input type="email" class="input" id="msg-modal-email" value="${escapeHtml(lead.email)}" placeholder="owner@business.com" />
            </div>
          </div>
          <div class="form-group">
            <label class="form-label">Subject Line (for Email)</label>
            <input type="text" class="input" id="msg-modal-subject" value="${escapeHtml(filledSubject)}" />
          </div>
          <div class="form-group">
            <label class="form-label">Auto-Filled Message Body</label>
            <textarea class="textarea" id="msg-modal-body" rows="6">${escapeHtml(filledBody)}</textarea>
          </div>
        </div>
        <div class="modal-footer">
          <button class="btn" id="msg-modal-copy">📋 Copy Message</button>
          <button class="btn btn-indigo" id="msg-modal-open-sms">💬 Launch SMS App</button>
          <button class="btn btn-primary" id="msg-modal-open-email">✉️ Launch Email App</button>
        </div>
      </div>
    </div>
  `;
}

// Add New Lead Modal
export function renderAddLeadModal() {
  return `
    <div class="modal-backdrop" id="add-lead-backdrop">
      <div class="modal-card" onclick="event.stopPropagation()" style="width:100%;max-width:620px;">
        <div class="modal-header">
          <div class="card-title">+ Add Local Business Prospect</div>
          <button class="btn btn-sm" id="add-lead-close">✕</button>
        </div>
        <form id="add-lead-form">
          <div class="modal-body">
            <div style="display:grid;grid-template-columns:1.3fr 1fr;gap:12px;">
              <div class="form-group">
                <label class="form-label">Business Name *</label>
                <input type="text" required class="input" name="businessName" placeholder="e.g. Los Compadres Taqueria" />
              </div>
              <div class="form-group">
                <label class="form-label">Category *</label>
                <select class="select" name="category">
                  <option value="Mexican restaurant">Mexican Restaurant</option>
                  <option value="restaurants">Restaurant / Cafe</option>
                  <option value="food truck">Food Truck</option>
                  <option value="bakery">Bakery / Panaderia</option>
                  <option value="barber shop">Barber Shop</option>
                  <option value="nail salon">Nail Salon</option>
                  <option value="beauty">Beauty / PMU Studio</option>
                  <option value="tattoo shop">Tattoo Shop</option>
                  <option value="auto repair">Auto Repair</option>
                  <option value="other">Other Local Business</option>
                </select>
              </div>
              <div class="form-group">
                <label class="form-label">Phone Number *</label>
                <input type="text" required class="input mono" name="phone" placeholder="(505) 555-0199" />
              </div>
              <div class="form-group">
                <label class="form-label">Owner Name (optional)</label>
                <input type="text" class="input" name="ownerName" placeholder="e.g. Marco" />
              </div>
              <div class="form-group">
                <label class="form-label">Street Address</label>
                <input type="text" class="input" name="address" placeholder="4200 Central Ave SE" />
              </div>
              <div class="form-group">
                <label class="form-label">City, State</label>
                <input type="text" class="input" name="city" value="Albuquerque, NM" />
              </div>
              <div class="form-group">
                <label class="form-label">Google Rating (1.0 - 5.0)</label>
                <input type="number" step="0.1" min="1" max="5" class="input mono" name="rating" value="4.7" />
              </div>
              <div class="form-group">
                <label class="form-label">Google Review Count</label>
                <input type="number" min="0" class="input mono" name="reviewCount" value="45" />
              </div>
              <div class="form-group">
                <label class="form-label">Website Status</label>
                <select class="select" name="websiteStatus">
                  <option value="None">None (No website at all)</option>
                  <option value="Weak Presence">Weak Presence (Booksy / Square / Social only)</option>
                </select>
              </div>
              <div class="form-group">
                <label class="form-label">Weak Presence Detail (if applicable)</label>
                <input type="text" class="input" name="weakPresenceDetail" placeholder="e.g. Booksy only, Instagram only" />
              </div>
            </div>
            <div class="form-group">
              <label class="form-label">Initial Call Note</label>
              <input type="text" class="input" name="initialNote" placeholder="Optional note about their menu, signage, or Instagram..." />
            </div>
          </div>
          <div class="modal-footer">
            <button type="button" class="btn" id="add-lead-cancel">Cancel</button>
            <button type="submit" class="btn btn-primary">✓ Calculate Pitch Score & Save Lead</button>
          </div>
        </form>
      </div>
    </div>
  `;
}

// Install App on Desktop & Phone Modal
export function renderInstallAppModal(canTriggerNativeInstall = false) {
  return `
    <div class="modal-backdrop" id="install-app-backdrop">
      <div class="modal-card" onclick="event.stopPropagation()" style="width:100%;max-width:640px;">
        <div class="modal-header">
          <div class="card-title">📲 Install DevEloped LeadDesk (Desktop & Phone App)</div>
          <button class="btn btn-sm" id="install-app-close">✕</button>
        </div>
        <div class="modal-body" style="gap:16px;">
          ${
            canTriggerNativeInstall
              ? `<div style="padding:14px 16px;background:rgba(16,185,129,0.14);border:1px solid rgba(16,185,129,0.45);border-radius:10px;display:flex;align-items:center;justify-content:space-between;gap:12px;">
                  <div>
                    <div style="font-weight:700;color:#34D399;">⚡ One-Click App Install Ready</div>
                    <div style="font-size:12px;color:var(--text-secondary);">Click Install Now to add DevEloped LeadDesk directly to your device.</div>
                  </div>
                  <button class="btn btn-emerald" id="btn-trigger-pwa-install">📲 Install App Now</button>
                 </div>`
              : ''
          }

          <div style="padding:14px 16px;background:var(--bg-canvas);border:1px solid var(--border-subtle);border-radius:10px;">
            <div style="font-weight:700;font-size:14px;color:#60A5FA;margin-bottom:6px;">💻 1. Install on Your Windows Desktop</div>
            <ol style="padding-left:18px;font-size:13px;color:var(--text-primary);display:flex;flex-direction:column;gap:5px;">
              <li>Open <strong>http://localhost:3456</strong> in <strong>Chrome</strong> or <strong>Microsoft Edge</strong>.</li>
              <li>Look at the right side of the top address bar (next to the bookmark star ⭐) and click the <strong>Install icon (computer screen with down arrow ⊕)</strong>.</li>
              <li>Click <strong>Install</strong> — LeadDesk will open in its own dark-mode app window and add a shortcut icon right on your Windows Desktop and Taskbar!</li>
            </ol>
          </div>

          <div style="padding:14px 16px;background:var(--bg-canvas);border:1px solid var(--border-subtle);border-radius:10px;">
            <div style="font-weight:700;font-size:14px;color:#34D399;margin-bottom:6px;">📱 2. Install on Your Phone (iPhone or Android)</div>
            <ol style="padding-left:18px;font-size:13px;color:var(--text-primary);display:flex;flex-direction:column;gap:5px;">
              <li>Connect your phone to the same Wi-Fi as your computer and open <strong class="mono" style="color:#34D399;">http://10.0.0.125:3456</strong> (or your Cloudflare Pages <code class="mono">https://...pages.dev</code> link).</li>
              <li><strong>On iPhone (Safari):</strong> Tap the <strong>Share</strong> button at the bottom (square with up arrow) → scroll down and tap <strong>Add to Home Screen</strong> → tap <strong>Add</strong>.</li>
              <li><strong>On Android (Chrome):</strong> Tap the <strong>three dots ⋮</strong> menu (top right) → tap <strong>Install app</strong> (or <strong>Add to Home screen</strong>).</li>
            </ol>
          </div>
        </div>
        <div class="modal-footer">
          <button class="btn btn-primary" id="install-app-done">Got It</button>
        </div>
      </div>
    </div>
  `;
}

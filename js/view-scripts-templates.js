// ============================================================================
// DevEloped LeadDesk — Scripts Library, Message Templates & Data/Settings Views
// ============================================================================

import { store, fillTemplatePlaceholders, getOpenDemoUrl } from './store.js';
import { escapeHtml, renderPitchBadge, renderCategoryBadge, renderStagePill } from './ui-helpers.js';

export function renderScriptsLibraryView(previewLeadId = '') {
  const scripts = store.state.scripts;
  const leads = store.getLeads();
  const previewLead = store.getLeadById(previewLeadId) || leads[0] || {};

  const scriptSections = [
    { key: 'opener', label: scripts.opener.title, badge: 'Core Pitch', content: scripts.opener.content },
    { key: 'gatekeeper', label: scripts.gatekeeper.title, badge: 'Owner Not Available', content: scripts.gatekeeper.content },
    { key: 'voicemail', label: scripts.voicemail.title, badge: 'Voicemail', content: scripts.voicemail.content },
    { key: 'sampleReveal', label: scripts.sampleReveal.title, badge: 'Demo Walkthrough', content: scripts.sampleReveal.content },
    { key: 'closing', label: scripts.closing.title, badge: 'Close Deal', content: scripts.closing.content }
  ];

  const objections = scripts.objections || {};

  return `
    <div class="card" style="margin-bottom:16px;padding:14px 18px;display:flex;align-items:center;justify-content:space-between;flex-wrap:wrap;gap:12px;">
      <div>
        <div class="card-title">🎙 Cold Call Scripts Library & Objection Playbook</div>
        <div class="card-subtitle">Edit any script below — changes save automatically and appear live in Call Mode. Use placeholders: <code class="mono">{BusinessName}</code>, <code class="mono">{OwnerName}</code>, <code class="mono">{ReviewCount}</code>, <code class="mono">{Rating}</code>, <code class="mono">{Category}</code></div>
      </div>
      <div style="display:flex;align-items:center;gap:8px;">
        <span style="font-size:12px;color:var(--text-secondary);">Live Preview Lead:</span>
        <select class="select" id="scripts-preview-lead" style="padding:5px 10px;font-size:12.5px;">
          ${leads.map(l => `<option value="${l.id}" ${l.id === previewLead.id ? 'selected' : ''}>${escapeHtml(l.businessName)} (${l.reviewCount} reviews)</option>`).join('')}
        </select>
      </div>
    </div>

    <div style="display:grid;grid-template-columns:1fr 1fr;gap:16px;margin-bottom:20px;">
      ${scriptSections
        .map(
          sec => `
        <div class="card" style="display:flex;flex-direction:column;gap:10px;">
          <div style="display:flex;align-items:center;justify-content:space-between;">
            <span class="card-title" style="font-size:14.5px;">${escapeHtml(sec.label)}</span>
            <span class="web-badge demo-tag">${escapeHtml(sec.badge)}</span>
          </div>
          <textarea class="textarea" data-edit-script="${sec.key}" rows="6">${escapeHtml(sec.content)}</textarea>
          <div style="padding:10px 12px;background:var(--bg-canvas);border-left:3px solid #3B82F6;border-radius:0 8px 8px 0;font-size:12.5px;color:#CBD5E1;white-space:pre-wrap;">
            <div style="font-size:10.5px;font-weight:700;color:#60A5FA;text-transform:uppercase;margin-bottom:4px;">Live Auto-Filled Preview (${escapeHtml(previewLead.businessName)}):</div>${escapeHtml(fillTemplatePlaceholders(sec.content, previewLead))}
          </div>
        </div>`
        )
        .join('')}
    </div>

    <div class="card">
      <div class="card-header">
        <div>
          <div class="card-title">🛡 5 Battle-Tested Objection Handlers</div>
          <div class="card-subtitle">"Too expensive", "Already have someone", "Not interested", "Just send me info", "Call me later"</div>
        </div>
      </div>
      <div style="display:grid;grid-template-columns:1fr 1fr;gap:14px;">
        ${Object.entries(objections)
          .map(
            ([objKey, obj]) => `
          <div style="padding:14px;background:var(--bg-canvas);border:1px solid var(--border-subtle);border-radius:10px;display:flex;flex-direction:column;gap:8px;">
            <div style="font-weight:700;color:#FBBF24;font-size:13.5px;">${escapeHtml(obj.title)}</div>
            <textarea class="textarea" data-edit-objection="${objKey}" rows="4">${escapeHtml(obj.content)}</textarea>
          </div>`
          )
          .join('')}
      </div>
    </div>
  `;
}

export function renderTemplatesLibraryView(previewLeadId = '') {
  const templates = store.state.templates || [];
  const leads = store.getLeads();
  const previewLead = store.getLeadById(previewLeadId) || leads[0] || {};

  return `
    <div class="card" style="margin-bottom:16px;padding:14px 18px;display:flex;align-items:center;justify-content:space-between;flex-wrap:wrap;gap:12px;">
      <div>
        <div class="card-title">💬 SMS & Email Message Templates</div>
        <div class="card-subtitle">Auto-fills <code class="mono">{BusinessName}</code>, <code class="mono">{OwnerName}</code>, <code class="mono">{SampleLink}</code>, <code class="mono">{Rating}</code>, <code class="mono">{ReviewCount}</code> per lead</div>
      </div>
      <div style="display:flex;align-items:center;gap:8px;">
        <span style="font-size:12px;color:var(--text-secondary);">Test & Send to Lead:</span>
        <select class="select" id="tpl-preview-lead" style="padding:5px 10px;font-size:12.5px;">
          ${leads.map(l => `<option value="${l.id}" ${l.id === previewLead.id ? 'selected' : ''}>${escapeHtml(l.businessName)} (${escapeHtml(l.phone)})</option>`).join('')}
        </select>
      </div>
    </div>

    <div style="display:grid;grid-template-columns:1fr 1fr;gap:16px;">
      ${templates
        .map(
          (tpl, idx) => `
        <div class="card" style="display:flex;flex-direction:column;gap:10px;">
          <div style="display:flex;align-items:center;justify-content:space-between;">
            <span class="card-title" style="font-size:14.5px;">${escapeHtml(tpl.name)}</span>
            <span class="stage-pill" style="color:#60A5FA;">${tpl.channel.toUpperCase()}</span>
          </div>
          ${
            tpl.channel === 'email'
              ? `<div class="form-group">
                  <label class="form-label">Email Subject</label>
                  <input type="text" class="input" data-tpl-subject="${idx}" value="${escapeHtml(tpl.subject)}" />
                 </div>`
              : ''
          }
          <div class="form-group">
            <label class="form-label">Template Body</label>
            <textarea class="textarea" data-tpl-body="${idx}" rows="5">${escapeHtml(tpl.body)}</textarea>
          </div>
          <div style="padding:10px 12px;background:var(--bg-canvas);border-left:3px solid #10B981;border-radius:0 8px 8px 0;font-size:12.5px;color:#E2E8F0;white-space:pre-wrap;">${escapeHtml(fillTemplatePlaceholders(tpl.body, previewLead))}</div>
          <div style="display:flex;gap:8px;margin-top:auto;">
            <button class="btn btn-sm" data-copy-tpl="${idx}">📋 Copy Filled Text</button>
            <button class="btn btn-sm btn-indigo" data-send-tpl-sms="${idx}">💬 Send SMS to ${escapeHtml(previewLead.businessName)}</button>
            <button class="btn btn-sm btn-primary" data-send-tpl-email="${idx}">✉️ Send Email</button>
          </div>
        </div>`
        )
        .join('')}
    </div>

    <div class="card" style="margin-top:18px;">
      <div class="card-header">
        <div>
          <div class="card-title">🌐 Demo Links — All ${leads.length} Leads</div>
          <div class="card-subtitle">Shareable demo links with top lock banner & watermark · Copying a link logs Sample Sent automatically</div>
        </div>
      </div>
      <div class="table-wrap" style="max-height:460px;overflow-y:auto;">
        <table class="data-table">
          <thead>
            <tr>
              <th>Business</th>
              <th>Category</th>
              <th>Demo Link</th>
              <th>Stage</th>
              <th>Actions</th>
            </tr>
          </thead>
          <tbody>
            ${leads
              .map(
                l => `
              <tr>
                <td>
                  <div style="font-weight:700;cursor:pointer;" data-open-lead="${l.id}">${escapeHtml(l.businessName)}</div>
                  <div class="mono" style="font-size:11.5px;color:var(--text-muted);">${escapeHtml(l.phone)}</div>
                </td>
                <td>${renderCategoryBadge(l.category)}</td>
                <td>
                  <a href="${escapeHtml(getOpenDemoUrl(l))}" target="_blank" rel="noopener" class="mono" style="font-size:12px;color:#60A5FA;text-decoration:none;word-break:break-all;">
                    ${escapeHtml(l.demoLink || l.sampleSite?.url || '')}
                  </a>
                </td>
                <td>${renderStagePill(l.stage)}</td>
                <td>
                  <div style="display:flex;gap:6px;flex-wrap:wrap;">
                    <a href="${escapeHtml(getOpenDemoUrl(l))}" target="_blank" rel="noopener" class="btn btn-sm btn-emerald" style="text-decoration:none;">Open Demo</a>
                    <button type="button" class="btn btn-sm btn-primary" data-copy-demo-link="${l.id}">📋 Copy Demo Link</button>
                  </div>
                </td>
              </tr>`
              )
              .join('')}
          </tbody>
        </table>
      </div>
    </div>
  `;
}

export function renderSettingsAndDataView(csvState = null) {
  const s = store.state.settings;
  const dupGroups = store.findDuplicateGroups();

  return `
    <div class="dashboard-split">
      <!-- Left: Google Places API Key & CRM Preferences -->
      <div class="card">
        <div class="card-header">
          <div>
            <div class="card-title">⚙ Google Places API & DevEloped Web Co. Settings</div>
            <div class="card-subtitle">Configure live Google Maps Lead Finder key, default Albuquerque area & call goals</div>
          </div>
        </div>
        <form id="settings-form" style="display:flex;flex-direction:column;gap:12px;">
          <div class="form-group">
            <label class="form-label">Google Places API Key (Optional — enhances Live Map Scrubber)</label>
            <input type="password" class="input mono" id="set-api-key" value="${escapeHtml(s.googlePlacesApiKey || '')}" placeholder="AIzaSy... (Paste Google Places API key if desired)" />
            <span style="font-size:11.5px;color:var(--text-muted);">
              Lead Finder automatically queries the Live Map Index & Albuquerque Business Directory, and also uses Google Places API when a key is entered here.
            </span>
          </div>
          <div style="display:grid;grid-template-columns:1fr 1fr;gap:12px;">
            <div class="form-group">
              <label class="form-label">Default City / Market</label>
              <input type="text" class="input" id="set-default-city" value="${escapeHtml(s.defaultCity || 'Albuquerque, NM')}" />
            </div>
            <div class="form-group">
              <label class="form-label">Daily Outbound Call Goal</label>
              <input type="number" min="5" max="200" class="input mono" id="set-call-goal" value="${s.dailyCallGoal || 25}" />
            </div>
            <div class="form-group">
              <label class="form-label">Default Custom Site Price ($)</label>
              <input type="number" step="50" class="input mono" id="set-site-price" value="${s.defaultSitePrice || 850}" />
            </div>
            <div class="form-group">
              <label class="form-label">Operator Name</label>
              <input type="text" class="input" id="set-operator" value="${escapeHtml(s.operatorName || 'Dev')}" />
            </div>
          </div>
          <div style="display:flex;justify-content:flex-end;margin-top:4px;">
            <button type="submit" class="btn btn-primary">✓ Save Settings</button>
          </div>
        </form>
      </div>

      <!-- Right: Backup / Restore & CSV Import / Export -->
      <div class="card" style="display:flex;flex-direction:column;gap:14px;">
        <div>
          <div class="card-title">💾 Local Storage, CSV Import/Export & JSON Backup</div>
          <div class="card-subtitle">All data persists automatically in browser storage (${store.getLeads().length} leads active)</div>
        </div>

        <div style="padding:14px;background:var(--bg-canvas);border:1px solid var(--border-subtle);border-radius:10px;display:flex;flex-direction:column;gap:10px;">
          <div style="font-weight:700;font-size:13px;color:#60A5FA;">📥 CSV Import (with Column Mapper) & Export</div>
          <div style="display:flex;gap:8px;flex-wrap:wrap;align-items:center;">
            <label class="btn btn-primary btn-sm" style="cursor:pointer;">
              📂 Select CSV File to Import
              <input type="file" id="csv-file-input" accept=".csv,text/csv" style="display:none;" />
            </label>
            <button class="btn btn-sm" id="btn-download-sample-csv">⬇ Sample CSV Template</button>
            <button class="btn btn-sm btn-emerald" id="btn-export-all-csv">📤 Export All Leads to CSV</button>
          </div>
        </div>

        <div style="padding:14px;background:var(--bg-canvas);border:1px solid var(--border-subtle);border-radius:10px;display:flex;flex-direction:column;gap:10px;">
          <div style="font-weight:700;font-size:13px;color:#A5B4FC;">🛡 Full JSON CRM Backup & Restore</div>
          <div style="display:flex;gap:8px;flex-wrap:wrap;align-items:center;">
            <button class="btn btn-indigo btn-sm" id="btn-export-json">⬇ Download Full JSON Backup</button>
            <label class="btn btn-sm" style="cursor:pointer;">
              ⬆ Restore from JSON Backup
              <input type="file" id="json-restore-input" accept=".json,application/json" style="display:none;" />
            </label>
            <button class="btn btn-danger btn-sm" id="btn-factory-reset" style="margin-left:auto;">↺ Reset to 18 Seed Leads</button>
          </div>
        </div>
      </div>
    </div>

    <!-- Interactive CSV Column Mapper (Appears when CSV is selected) -->
    ${csvState && csvState.headers?.length ? renderCsvColumnMapperCard(csvState) : ''}

    <!-- Duplicate Detection & Merge Section -->
    <div class="card" style="margin-top:18px;">
      <div class="card-header">
        <div>
          <div class="card-title">🔍 Duplicate Lead Detector & Merger</div>
          <div class="card-subtitle">Automatically scans all records for matching phone numbers or business name + street address</div>
        </div>
      </div>
      ${
        dupGroups.length === 0
          ? `<div style="padding:16px;text-align:center;color:#34D399;font-size:13px;">✓ Zero duplicate leads detected across all ${store.getLeads().length} records.</div>`
          : `<div style="display:flex;flex-direction:column;gap:10px;">
              ${dupGroups
                .map(
                  (g, gIdx) => `
                <div style="padding:12px 16px;background:var(--bg-canvas);border:1px solid rgba(245,158,11,0.4);border-radius:10px;display:flex;align-items:center;justify-content:space-between;gap:12px;flex-wrap:wrap;">
                  <div>
                    <div style="font-size:12px;font-weight:700;color:#FBBF24;">Match Reason: ${escapeHtml(g.reason)}</div>
                    <div style="font-size:13.5px;font-weight:700;margin-top:2px;">
                      ${g.leads.map(l => `${escapeHtml(l.businessName)} (${escapeHtml(l.phone)} · ${l.reviewCount} rev)`).join('  ⟷  ')}
                    </div>
                  </div>
                  <button class="btn btn-sm btn-emerald" data-merge-group="${gIdx}">⚡ Merge Records & Keep History</button>
                </div>`
                )
                .join('')}
             </div>`
      }
    </div>
  `;
}

function renderCsvColumnMapperCard(csvState) {
  const cols = csvState.headers;
  const fields = [
    { key: 'businessName', label: 'Business Name *' },
    { key: 'phone', label: 'Phone Number *' },
    { key: 'category', label: 'Category' },
    { key: 'address', label: 'Street Address' },
    { key: 'city', label: 'City' },
    { key: 'rating', label: 'Google Rating' },
    { key: 'reviewCount', label: 'Review Count' },
    { key: 'websiteStatus', label: 'Website Status' }
  ];

  return `
    <div class="card" style="margin-top:18px;border-color:#3B82F6;">
      <div class="card-header">
        <div class="card-title">📥 Map CSV Columns (${csvState.rows.length} rows ready to import)</div>
        <button class="btn btn-sm btn-emerald" id="btn-confirm-csv-import">✓ Import ${csvState.rows.length} Leads Now</button>
      </div>
      <div style="display:grid;grid-template-columns:repeat(4,1fr);gap:10px;">
        ${fields
          .map(
            f => `
          <div class="form-group">
            <label class="form-label">${escapeHtml(f.label)}</label>
            <select class="select" data-csv-map="${f.key}">
              <option value="">-- Ignore / Default --</option>
              ${cols
                .map(
                  (c, idx) => `<option value="${idx}" ${csvState.mapping[f.key] === idx ? 'selected' : ''}>${escapeHtml(c)}</option>`
                )
                .join('')}
            </select>
          </div>`
          )
          .join('')}
      </div>
    </div>
  `;
}

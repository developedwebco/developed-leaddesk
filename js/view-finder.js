// ============================================================================
// DevEloped LeadDesk — Lead Finder View & Master Leads Directory View
// ============================================================================

import { store } from './store.js';
import { PIPELINE_STAGES } from './seed-data.js';
import {
  escapeHtml,
  renderPitchBadge,
  renderWebsiteBadge,
  renderStagePill,
  renderTempPill,
  formatFollowUpBadge,
  renderCategoryBadge
} from './ui-helpers.js';

export function renderLeadFinderView(finderState) {
  const hasApiKey = Boolean((store.state.settings.googlePlacesApiKey || '').trim());
  const results = finderState.results;

  return `
    <!-- Live Lead Scrubber Header Banner -->
    <div class="card" style="margin-bottom:16px;padding:14px 18px;border-color:rgba(16,185,129,0.4);background:var(--bg-elevated);">
      <div style="display:flex;align-items:center;justify-content:space-between;gap:12px;flex-wrap:wrap;">
        <div style="display:flex;align-items:center;gap:10px;">
          <span class="pitch-badge high" style="font-size:11px;padding:4px 9px;">
            ● LIVE PROSPECT SCRUBBER READY
          </span>
          <span style="font-size:13px;color:var(--text-secondary);">
            ${
              hasApiKey
                ? 'Connected to Google Places API + Local Business Directory. Automatically filters out businesses with custom websites or <10 reviews.'
                : 'Connected to Live Map Index & Albuquerque Business Directory (or paste your Google Places API key in Settings anytime).'
            }
          </span>
        </div>
        <div style="display:flex;gap:8px;">
          <button class="btn btn-sm" id="finder-btn-open-settings">⚙ Google API Key</button>
          <button class="btn btn-sm" id="finder-btn-open-csv">📥 Import CSV</button>
          <button class="btn btn-sm btn-primary" id="finder-btn-add-manual">+ Add Lead Manually</button>
        </div>
      </div>
    </div>

    <!-- Search Controls Card -->
    <div class="card" style="margin-bottom:18px;">
      <form id="lead-finder-form" style="display:grid;grid-template-columns:1.3fr 1.2fr 0.7fr auto;gap:12px;align-items:end;">
        <div class="form-group">
          <label class="form-label">Business Category</label>
          <select class="select" id="finder-category">
            <option value="all" ${finderState.category === 'all' ? 'selected' : ''}>All High-Demand Categories (Restaurants, Barbers, Salons, Auto...)</option>
            <option value="Mexican restaurant" ${finderState.category === 'Mexican restaurant' ? 'selected' : ''}>Mexican Restaurants & Taquerias</option>
            <option value="restaurants" ${finderState.category === 'restaurants' ? 'selected' : ''}>Restaurants & Cafes</option>
            <option value="food truck" ${finderState.category === 'food truck' ? 'selected' : ''}>Food Trucks</option>
            <option value="barber shop" ${finderState.category === 'barber shop' ? 'selected' : ''}>Barbershops</option>
            <option value="nail salon" ${finderState.category === 'nail salon' ? 'selected' : ''}>Nail Salons</option>
            <option value="bakery" ${finderState.category === 'bakery' ? 'selected' : ''}>Bakeries & Panaderias</option>
            <option value="tattoo shop" ${finderState.category === 'tattoo shop' ? 'selected' : ''}>Tattoo & Piercing Shops</option>
            <option value="auto repair" ${finderState.category === 'auto repair' ? 'selected' : ''}>Auto Repair & Mechanics</option>
            <option value="beauty" ${finderState.category === 'beauty' ? 'selected' : ''}>Beauty / Lash / PMU Studios</option>
          </select>
        </div>
        <div class="form-group">
          <label class="form-label">City / Area (US Businesses — Default Albuquerque, NM)</label>
          <input type="text" class="input" id="finder-city" value="${escapeHtml(finderState.city)}" placeholder="Albuquerque, NM" />
        </div>
        <div class="form-group">
          <label class="form-label">Search Radius</label>
          <select class="select" id="finder-radius">
            <option value="5" ${finderState.radius == 5 ? 'selected' : ''}>5 miles</option>
            <option value="10" ${finderState.radius == 10 ? 'selected' : ''}>10 miles</option>
            <option value="25" ${finderState.radius == 25 ? 'selected' : ''}>25 miles</option>
            <option value="50" ${finderState.radius == 50 ? 'selected' : ''}>50 miles</option>
          </select>
        </div>
        <button type="submit" class="btn btn-primary" style="height:37px;padding:0 18px;">
          🔍 Scrub Google Maps for Leads
        </button>
      </form>

      <div style="display:flex;align-items:center;justify-content:space-between;margin-top:12px;padding-top:10px;border-top:1px solid var(--border-subtle);flex-wrap:wrap;gap:8px;">
        <div style="display:flex;align-items:center;gap:6px;flex-wrap:wrap;">
          <span style="font-size:11.5px;color:var(--text-muted);">Quick Area Presets:</span>
          ${['Albuquerque, NM', 'Rio Rancho, NM', 'Santa Fe, NM', 'Los Lunas, NM', 'Las Cruces, NM', 'El Paso, TX', 'Phoenix, AZ']
            .map(c => `<button type="button" class="btn btn-sm" data-city-preset="${escapeHtml(c)}">${escapeHtml(c)}</button>`)
            .join('')}
        </div>
        <div style="font-size:11.5px;color:var(--text-secondary);">
          ✓ Filters applied: <strong>No real website</strong> (keeps None & Weak Presence) · <strong>10+ Google reviews</strong> · <strong>Phone listed</strong>
        </div>
      </div>
    </div>
  `;
}

export function renderLeadFinderResultsSection(finderState) {
  const results = finderState.results;
  if (!results) return '';

  const qualified = results.qualified || [];
  const filteredOut = results.filteredOut || [];
  const importableCount = qualified.filter(q => !q.alreadyInCrm).length;

  return `
    ${results.apiError ? `<div class="card" style="margin-bottom:14px;border-color:#F43F5E;color:#FDA4AF;padding:12px 16px;">${escapeHtml(results.apiError)}</div>` : ''}

    <div class="card" style="margin-bottom:18px;">
      <div class="card-header">
        <div>
          <div class="card-title" style="display:flex;align-items:center;gap:10px;">
            <span>Qualified Prospects Found (${qualified.length})</span>
            <span class="pitch-badge high">VERIFIED PROSPECTS</span>
          </div>
          <div class="card-subtitle">
            Scanned ${results.totalScanned} listings for <strong>${escapeHtml(results.query)}</strong> · Automatically filtered out ${filteredOut.length} businesses with real websites or &lt;10 reviews
          </div>
        </div>
        <div style="display:flex;gap:8px;">
          ${
            importableCount > 0
              ? `<button class="btn btn-emerald" id="finder-btn-import-all">📥 Import All ${importableCount} New Leads</button>`
              : `<span style="font-size:12px;color:#34D399;font-weight:600;">✓ All listed prospects imported</span>`
          }
        </div>
      </div>

      <div class="table-wrap">
        <table class="data-table">
          <thead>
            <tr>
              <th>Pitch Score</th>
              <th>Business & Category</th>
              <th>Rating / Reviews</th>
              <th>Website Status</th>
              <th>Auto-Generated Pitch Angle</th>
              <th>Phone & Maps</th>
              <th>Import</th>
            </tr>
          </thead>
          <tbody>
            ${qualified
              .map(
                (item, idx) => `
              <tr>
                <td>${renderPitchBadge(item.pitchScore, true)}</td>
                <td>
                  <div style="display:flex;align-items:center;gap:6px;flex-wrap:wrap;">
                    <span style="font-weight:700;color:var(--text-primary);">${escapeHtml(item.businessName)}</span>
                  </div>
                  <div style="font-size:11.5px;color:var(--text-muted);">${renderCategoryBadge(item.category)} · ${escapeHtml(item.address)}, ${escapeHtml(item.city)}</div>
                </td>
                <td class="mono">⭐ ${Number(item.rating).toFixed(1)} <span style="color:var(--text-muted);">(${item.reviewCount})</span></td>
                <td>${renderWebsiteBadge(item)}</td>
                <td style="max-width:300px;font-size:12px;color:#CBD5E1;">${escapeHtml(item.pitchAngle)}</td>
                <td>
                  <div class="mono" style="font-size:12.5px;font-weight:600;">${escapeHtml(item.phone)}</div>
                  <a href="${escapeHtml(item.googleMapsUrl)}" target="_blank" rel="noopener" style="font-size:11px;color:#60A5FA;text-decoration:none;">Google Listing ↗</a>
                </td>
                <td>
                  ${
                    item.alreadyInCrm
                      ? `<span style="font-size:11.5px;color:#34D399;font-weight:600;">✓ In CRM</span>`
                      : `<button class="btn btn-sm btn-primary" data-import-index="${idx}">+ Import Lead</button>`
                  }
                </td>
              </tr>`
              )
              .join('')}
          </tbody>
        </table>
      </div>
    </div>

    <!-- Transparent Filtered-Out Breakdown -->
    ${
      filteredOut.length > 0
        ? `
      <div class="card" style="opacity:0.85;">
        <div class="card-header" style="margin-bottom:8px;">
          <div class="card-title" style="font-size:13.5px;color:var(--text-secondary);">
            🛡 Filtered Out by LeadDesk Scrubbing Rules (${filteredOut.length} businesses excluded)
          </div>
        </div>
        <div style="display:flex;flex-wrap:wrap;gap:8px;">
          ${filteredOut
            .map(
              f => `
            <div style="padding:7px 11px;background:var(--bg-canvas);border:1px solid var(--border-subtle);border-radius:8px;font-size:12px;display:flex;align-items:center;gap:8px;">
              <span style="font-weight:600;color:var(--text-secondary);text-decoration:line-through;">${escapeHtml(f.businessName)}</span>
              <span style="color:#FB7185;font-size:11px;">(${escapeHtml(f.filterReasons.join(', '))})</span>
            </div>`
            )
            .join('')}
        </div>
      </div>`
        : ''
    }
  `;
}

export function renderLeadsDirectoryView(filterState) {
  const allLeads = store.getLeads();
  const dupGroups = store.findDuplicateGroups();

  // Filter leads
  let filtered = allLeads.filter(l => {
    if (filterState.search) {
      const q = filterState.search.toLowerCase();
      const match =
        l.businessName.toLowerCase().includes(q) ||
        l.phone.toLowerCase().includes(q) ||
        (l.ownerName || '').toLowerCase().includes(q) ||
        (l.address || '').toLowerCase().includes(q) ||
        (l.category || '').toLowerCase().includes(q) ||
        (l.city || '').toLowerCase().includes(q);
      if (!match) return false;
    }
    if (filterState.category !== 'all' && !(l.category || '').toLowerCase().includes(filterState.category.toLowerCase())) {
      return false;
    }
    if (filterState.stage !== 'all' && l.stage !== filterState.stage) {
      return false;
    }
    if (filterState.webStatus !== 'all' && l.websiteStatus !== filterState.webStatus) {
      return false;
    }
    if (filterState.temperature !== 'all' && l.temperature !== filterState.temperature) {
      return false;
    }
    if (filterState.minScore > 0 && l.pitchScore < filterState.minScore) {
      return false;
    }
    return true;
  });

  // Sort leads
  filtered.sort((a, b) => {
    if (filterState.sortBy === 'score') return b.pitchScore - a.pitchScore;
    if (filterState.sortBy === 'reviews') return (Number(b.reviewCount) || 0) - (Number(a.reviewCount) || 0);
    if (filterState.sortBy === 'rating') return (Number(b.rating) || 0) - (Number(a.rating) || 0);
    if (filterState.sortBy === 'name') return a.businessName.localeCompare(b.businessName);
    if (filterState.sortBy === 'followup') {
      const da = a.nextFollowUp ? new Date(a.nextFollowUp).getTime() : Infinity;
      const db = b.nextFollowUp ? new Date(b.nextFollowUp).getTime() : Infinity;
      return da - db;
    }
    return b.pitchScore - a.pitchScore;
  });

  return `
    ${
      dupGroups.length > 0
        ? `
      <div class="card" style="margin-bottom:14px;padding:12px 16px;border-color:#F59E0B;background:rgba(245,158,11,0.1);display:flex;align-items:center;justify-content:space-between;gap:12px;">
        <div style="font-size:13px;color:#FCD34D;">
          ⚠ <strong>${dupGroups.length} Duplicate Group(s) Detected</strong> (matching phone number or business name + address).
        </div>
        <button class="btn btn-sm btn-amber" id="btn-open-dup-merger">Review & Merge Duplicates</button>
      </div>`
        : ''
    }

    <div class="filter-bar">
      <input type="text" class="input" id="dir-search" placeholder="Search name, phone, owner, street..." value="${escapeHtml(filterState.search)}" style="width:220px;" />

      <select class="select" id="dir-category">
        <option value="all" ${filterState.category === 'all' ? 'selected' : ''}>All Categories</option>
        <option value="Mexican" ${filterState.category === 'Mexican' ? 'selected' : ''}>Mexican / Tacos</option>
        <option value="food truck" ${filterState.category === 'food truck' ? 'selected' : ''}>Food Trucks</option>
        <option value="bakery" ${filterState.category === 'bakery' ? 'selected' : ''}>Bakeries</option>
        <option value="barber" ${filterState.category === 'barber' ? 'selected' : ''}>Barbershops</option>
        <option value="nail" ${filterState.category === 'nail' ? 'selected' : ''}>Nail Salons</option>
        <option value="beauty" ${filterState.category === 'beauty' ? 'selected' : ''}>Beauty / PMU</option>
        <option value="tattoo" ${filterState.category === 'tattoo' ? 'selected' : ''}>Tattoo Shops</option>
        <option value="auto" ${filterState.category === 'auto' ? 'selected' : ''}>Auto Repair</option>
      </select>

      <select class="select" id="dir-stage">
        <option value="all" ${filterState.stage === 'all' ? 'selected' : ''}>All Stages</option>
        ${PIPELINE_STAGES.map(s => `<option value="${escapeHtml(s.id)}" ${filterState.stage === s.id ? 'selected' : ''}>${escapeHtml(s.label)}</option>`).join('')}
      </select>

      <select class="select" id="dir-web">
        <option value="all" ${filterState.webStatus === 'all' ? 'selected' : ''}>All Web Status</option>
        <option value="None" ${filterState.webStatus === 'None' ? 'selected' : ''}>✕ No Website</option>
        <option value="Weak Presence" ${filterState.webStatus === 'Weak Presence' ? 'selected' : ''}>⚠ Weak Presence</option>
      </select>

      <select class="select" id="dir-temp">
        <option value="all" ${filterState.temperature === 'all' ? 'selected' : ''}>All Temps</option>
        <option value="Hot" ${filterState.temperature === 'Hot' ? 'selected' : ''}>🔥 Hot</option>
        <option value="Warm" ${filterState.temperature === 'Warm' ? 'selected' : ''}>⚡ Warm</option>
        <option value="Cold" ${filterState.temperature === 'Cold' ? 'selected' : ''}>❄️ Cold</option>
      </select>

      <select class="select" id="dir-sort">
        <option value="score" ${filterState.sortBy === 'score' ? 'selected' : ''}>Sort: Pitch Score (High → Low)</option>
        <option value="reviews" ${filterState.sortBy === 'reviews' ? 'selected' : ''}>Sort: Review Count (High → Low)</option>
        <option value="rating" ${filterState.sortBy === 'rating' ? 'selected' : ''}>Sort: Google Rating</option>
        <option value="followup" ${filterState.sortBy === 'followup' ? 'selected' : ''}>Sort: Follow-Up Date</option>
        <option value="name" ${filterState.sortBy === 'name' ? 'selected' : ''}>Sort: Business Name (A → Z)</option>
      </select>

      <div style="margin-left:auto;display:flex;gap:8px;">
        <button class="btn btn-sm" id="dir-btn-export-csv">📤 Export CSV</button>
        <button class="btn btn-sm btn-primary" id="dir-btn-add-lead">+ Add Lead</button>
      </div>
    </div>

    <div class="card" style="padding:0;overflow:hidden;">
      <div class="table-wrap">
        <table class="data-table">
          <thead>
            <tr>
              <th>Pitch Score</th>
              <th>Business & Pitch Angle</th>
              <th>Phone & Owner</th>
              <th>Rating / Reviews</th>
              <th>Web Status</th>
              <th>Stage & Temp</th>
              <th>Next Follow-Up</th>
              <th>Quick Actions</th>
            </tr>
          </thead>
          <tbody>
            ${filtered
              .map(
                l => `
              <tr>
                <td>${renderPitchBadge(l.pitchScore, true)}</td>
                <td style="max-width:310px;">
                  <div style="display:flex;align-items:center;gap:6px;">
                    <span style="font-weight:700;font-size:13.5px;color:var(--text-primary);cursor:pointer;" data-open-lead="${l.id}">
                      ${escapeHtml(l.businessName)}
                    </span>
                  </div>
                  <div style="font-size:11.5px;color:var(--text-muted);margin-bottom:4px;">
                    ${renderCategoryBadge(l.category)} · ${escapeHtml(l.address)}, ${escapeHtml(l.city)}
                  </div>
                  <div style="font-size:11.5px;color:#93C5FD;line-height:1.35;">"${escapeHtml(l.pitchAngle)}"</div>
                </td>
                <td>
                  <div class="mono" style="font-weight:600;font-size:12.5px;">${escapeHtml(l.phone)}</div>
                  <div style="font-size:11.5px;color:var(--text-secondary);">${l.ownerName ? `👤 ${escapeHtml(l.ownerName)}` : '<span style="color:var(--text-muted)">Owner unknown</span>'}</div>
                  <div style="font-size:10.5px;color:var(--text-muted);margin-top:2px;">⏰ ${escapeHtml(l.bestTimeToCall)}</div>
                </td>
                <td class="mono">⭐ ${Number(l.rating).toFixed(1)} <span style="color:var(--text-muted);">(${l.reviewCount})</span></td>
                <td>${renderWebsiteBadge(l)}</td>
                <td>
                  <div style="display:flex;flex-direction:column;gap:5px;align-items:flex-start;">
                    ${renderStagePill(l.stage)}
                    ${renderTempPill(l.temperature)}
                  </div>
                </td>
                <td>${formatFollowUpBadge(l.nextFollowUp) || '<span style="color:var(--text-muted);font-size:11.5px;">—</span>'}</td>
                <td>
                  <div style="display:flex;gap:5px;">
                    <button class="btn btn-sm btn-emerald" data-dial-lead="${l.id}" title="Call in Power Dialer">📞 Dial</button>
                    <button class="btn btn-sm btn-indigo" data-sms-lead="${l.id}" title="Send Text Template">💬</button>
                    <button class="btn btn-sm" data-open-lead="${l.id}">Profile</button>
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

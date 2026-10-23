// ============================================================================
// DevEloped LeadDesk — UI Components, Badges, Icons & Chart Renderers
// ============================================================================

import { PIPELINE_STAGES, getCategoryMeta } from './seed-data.js';
import { getLocalDateKey } from './store.js';

export function escapeHtml(str = '') {
  return String(str ?? '')
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;');
}

export function renderPitchBadge(score = 0, showLabel = false) {
  const num = Number(score) || 0;
  let tier = 'low';
  let label = 'Prospect';
  if (num >= 80) {
    tier = 'high';
    label = 'Prime';
  } else if (num >= 60) {
    tier = 'med';
    label = 'Strong';
  }
  return `
    <span class="pitch-badge ${tier}" title="Pitch Score: ${num}/100 (${label} Opportunity)">
      <svg width="11" height="11" viewBox="0 0 24 24" fill="currentColor" stroke="none"><polygon points="13 2 3 14 12 14 11 22 21 10 12 10 13 2"></polygon></svg>
      <span>${num}</span>
      ${showLabel ? `<span style="font-weight:500;opacity:0.85;">· ${label}</span>` : ''}
    </span>
  `;
}

export function renderWebsiteBadge(lead) {
  const status = (lead.websiteStatus || 'None').toLowerCase();
  const detail = lead.weakPresenceDetail || '';
  if (status.includes('weak')) {
    return `
      <span class="web-badge weak" title="Weak Web Presence: ${escapeHtml(detail)}">
        <span>⚠ Weak Presence</span>
        ${detail ? `<span style="opacity:0.85;">(${escapeHtml(detail)})</span>` : ''}
      </span>
    `;
  }
  return `
    <span class="web-badge none" title="No Website Linked on Google Maps">
      <span>✕ No Website</span>
    </span>
  `;
}

export function renderStagePill(stageName = 'New Lead') {
  const st = PIPELINE_STAGES.find(s => s.id === stageName) || PIPELINE_STAGES[0];
  return `
    <span class="stage-pill" style="background:${st.bg};color:${st.color};border-color:${st.color}44;">
      <span class="stage-dot" style="background:${st.color};width:7px;height:7px;"></span>
      <span>${escapeHtml(st.label)}</span>
    </span>
  `;
}

export function renderTempPill(temp = 'Warm') {
  const icon = temp === 'Hot' ? '🔥' : temp === 'Warm' ? '⚡' : '❄️';
  return `<span class="temp-pill ${escapeHtml(temp)}">${icon} ${escapeHtml(temp)}</span>`;
}

export function formatFollowUpBadge(isoString) {
  if (!isoString) return '';
  const d = new Date(isoString);
  if (isNaN(d.getTime())) return '';

  const now = new Date();
  const todayKey = getLocalDateKey(now);
  const fKey = getLocalDateKey(d);
  const isOverdue = d < now;

  const timeStr = d.toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit' });
  const dateStr = fKey === todayKey
    ? `Today ${timeStr}`
    : d.toLocaleDateString('en-US', { month: 'short', day: 'numeric' }) + ` · ${timeStr}`;

  return `
    <span class="followup-banner ${isOverdue ? 'overdue' : ''}" title="Scheduled Follow-Up: ${d.toLocaleString()}">
      <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2"><circle cx="12" cy="12" r="10"/><polyline points="12 6 12 12 16 14"/></svg>
      <span>${isOverdue ? 'OVERDUE · ' : ''}${escapeHtml(dateStr)}</span>
    </span>
  `;
}

export function formatRelativeDateTime(isoString) {
  if (!isoString) return 'Never';
  const d = new Date(isoString);
  if (isNaN(d.getTime())) return isoString;
  return d.toLocaleString('en-US', {
    month: 'short',
    day: 'numeric',
    hour: 'numeric',
    minute: '2-digit'
  });
}

export function renderCategoryBadge(categoryRaw = '') {
  const meta = getCategoryMeta(categoryRaw);
  return `<span style="font-size:12px;color:var(--text-secondary);font-weight:500;">${escapeHtml(meta.label)}</span>`;
}

// Render 30-Day Activity & Sales SVG Chart
export function render30DayChartSVG(series = []) {
  if (!series.length) return '<div style="padding:30px;text-align:center;color:var(--text-muted)">No chart data</div>';

  const width = 760;
  const height = 220;
  const padLeft = 36;
  const padRight = 20;
  const padTop = 20;
  const padBottom = 34;

  const plotW = width - padLeft - padRight;
  const plotH = height - padTop - padBottom;

  const maxCalls = Math.max(25, ...series.map(d => d.calls));
  const stepX = plotW / Math.max(1, series.length - 1);

  // Build bar + line coordinates
  const pointsCalls = [];
  const pointsSamples = [];
  const barsSold = [];

  series.forEach((d, i) => {
    const x = padLeft + i * stepX;
    const yCalls = padTop + plotH - (d.calls / maxCalls) * plotH;
    const ySamples = padTop + plotH - (d.samples / maxCalls) * plotH;
    pointsCalls.push(`${x.toFixed(1)},${yCalls.toFixed(1)}`);
    pointsSamples.push(`${x.toFixed(1)},${ySamples.toFixed(1)}`);

    if (d.sold > 0) {
      barsSold.push({ x, yCalls, sold: d.sold, revenue: d.revenue, label: d.label });
    }
  });

  const areaPoints = `${padLeft},${padTop + plotH} ${pointsCalls.join(' ')} ${padLeft + (series.length - 1) * stepX},${padTop + plotH}`;

  // Y-axis grid lines
  const yTicks = [0, Math.round(maxCalls / 2), maxCalls];

  return `
    <div style="width:100%;overflow-x:auto;">
      <svg viewBox="0 0 ${width} ${height}" style="width:100%;height:auto;min-width:520px;display:block;">
        <defs>
          <linearGradient id="callsGrad" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stop-color="#3B82F6" stop-opacity="0.36"/>
            <stop offset="100%" stop-color="#3B82F6" stop-opacity="0.0"/>
          </linearGradient>
        </defs>

        <!-- Horizontal Grid Lines -->
        ${yTicks
          .map(val => {
            const y = (padTop + plotH - (val / maxCalls) * plotH).toFixed(1);
            return `
              <line x1="${padLeft}" y1="${y}" x2="${width - padRight}" y2="${y}" stroke="rgba(255,255,255,0.06)" stroke-dasharray="3 3"/>
              <text x="${padLeft - 8}" y="${Number(y) + 4}" text-anchor="end" fill="#64748B" font-family="JetBrains Mono" font-size="10">${val}</text>
            `;
          })
          .join('')}

        <!-- Area & Line for Calls -->
        <polygon points="${areaPoints}" fill="url(#callsGrad)" />
        <polyline fill="none" stroke="#3B82F6" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round" points="${pointsCalls.join(' ')}" />

        <!-- Line for Samples Sent -->
        <polyline fill="none" stroke="#A855F7" stroke-width="2" stroke-dasharray="4 3" points="${pointsSamples.join(' ')}" />

        <!-- Data points & Sold markers -->
        ${series
          .map((d, i) => {
            const x = (padLeft + i * stepX).toFixed(1);
            const y = (padTop + plotH - (d.calls / maxCalls) * plotH).toFixed(1);
            const showDate = i % 5 === 0 || i === series.length - 1;
            return `
              <g>
                <circle cx="${x}" cy="${y}" r="${d.calls > 0 ? 3.2 : 1.8}" fill="${d.calls > 0 ? '#60A5FA' : '#334155'}">
                  <title>${d.label}: ${d.calls} calls, ${d.samples} samples, ${d.sold} sites sold ($${d.revenue})</title>
                </circle>
                ${
                  d.sold > 0
                    ? `<circle cx="${x}" cy="${y}" r="6.5" fill="rgba(16,185,129,0.28)" stroke="#10B981" stroke-width="2">
                        <title>🎉 ${d.label}: ${d.sold} Site Sold ($${d.revenue})</title>
                      </circle>`
                    : ''
                }
                ${
                  showDate
                    ? `<text x="${x}" y="${height - 8}" text-anchor="middle" fill="#64748B" font-family="JetBrains Mono" font-size="10">${d.label}</text>`
                    : ''
                }
              </g>
            `;
          })
          .join('')}
      </svg>
    </div>
  `;
}

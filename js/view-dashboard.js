// ============================================================================
// DevEloped LeadDesk — Dashboard View (KPIs, 30-Day Chart, Follow-Ups & Deals)
// ============================================================================

import { store } from './store.js';
import {
  escapeHtml,
  renderPitchBadge,
  renderWebsiteBadge,
  renderStagePill,
  renderTempPill,
  formatFollowUpBadge,
  renderCategoryBadge,
  render30DayChartSVG
} from './ui-helpers.js';

export function renderDashboardView(chartDays = 30) {
  const m = store.getDashboardMetrics(chartDays);
  const followUps = store.getFollowUpBuckets();
  const urgentList = [...followUps.overdue, ...followUps.dueToday].slice(0, 6);

  const topProspects = [...store.getLeads()]
    .filter(l => l.stage === 'New Lead' || l.stage === 'Owner Not There')
    .sort((a, b) => b.pitchScore - a.pitchScore)
    .slice(0, 6);

  const soldLeads = store.getLeads().filter(l => l.stage === 'Sold');
  const goalPct = Math.min(100, Math.round((m.callsToday / m.dailyCallGoal) * 100));

  return `
    <!-- Row 1: Primary KPI Cards -->
    <div class="kpi-grid">
      <div class="kpi-card clickable" data-nav-target="callmode">
        <div class="kpi-label">
          <span>Calls Made Today</span>
          <span class="mono" style="color:#60A5FA;">Goal: ${m.callsToday}/${m.dailyCallGoal}</span>
        </div>
        <div class="kpi-value">${m.callsToday} <span style="font-size:14px;color:var(--text-muted);font-weight:500;">/ ${m.totalCalls} total</span></div>
        <div class="progress-track"><div class="progress-fill" style="width:${goalPct}%"></div></div>
        <div class="kpi-sub">
          <span>Contact Rate: <strong class="mono" style="color:#F8FAFC;">${m.contactRate}%</strong></span>
          <span style="color:#34D399;">Dial Now →</span>
        </div>
      </div>

      <div class="kpi-card clickable" data-nav-target="pipeline">
        <div class="kpi-label">
          <span>Samples Sent & Pipeline</span>
          <span style="color:#A5B4FC;">🌐 Demo Links</span>
        </div>
        <div class="kpi-value">${m.samplesSent} <span style="font-size:14px;color:var(--text-muted);font-weight:500;">samples sent</span></div>
        <div class="kpi-sub">
          <span>Active Pipeline Value:</span>
          <strong class="mono" style="color:#A5B4FC;">$${m.pipelineValue.toLocaleString()}</strong>
        </div>
      </div>

      <div class="kpi-card">
        <div class="kpi-label">
          <span>Sites Sold & Revenue</span>
          <span style="color:#34D399;">💰 Closed</span>
        </div>
        <div class="kpi-value" style="color:#34D399;">$${m.totalRevenueContracted.toLocaleString()}</div>
        <div class="kpi-sub">
          <span><strong>${m.sitesSold}</strong> Sold · Avg <strong class="mono">$${m.avgSalePrice}</strong></span>
          <span class="mono" style="color:#FBBF24;">Due: $${m.liveBalanceDue}</span>
        </div>
      </div>

      <div class="kpi-card clickable" data-nav-target="followups" style="border-color:${m.followUpsOverdueCount > 0 ? 'rgba(244,63,94,0.45)' : 'var(--border-subtle)'};">
        <div class="kpi-label">
          <span>Follow-Ups Due Today</span>
          ${m.followUpsOverdueCount > 0 ? `<span class="nav-badge urgent">${m.followUpsOverdueCount} Overdue</span>` : `<span style="color:#FBBF24;">⏰ Queue</span>`}
        </div>
        <div class="kpi-value" style="color:${m.followUpsOverdueCount > 0 ? '#FB7185' : '#FBBF24'};">
          ${m.followUpsTotalActionable}
        </div>
        <div class="kpi-sub">
          <span>${m.followUpsDueTodayCount} due today · ${m.followUpsOverdueCount} overdue</span>
          <span style="color:#60A5FA;">Open Queue →</span>
        </div>
      </div>
    </div>

    <!-- Row 2: 30-Day Activity Chart + Urgent Follow-Ups Queue -->
    <div class="dashboard-split">
      <div class="card">
        <div class="card-header">
          <div>
            <div class="card-title">Outbound Calls, Samples & Sites Sold (Last ${chartDays} Days)</div>
            <div class="card-subtitle">Real-time activity tracker for DevEloped Web Co.</div>
          </div>
          <div style="display:flex;align-items:center;gap:8px;">
            <span style="font-size:11.5px;color:#60A5FA;">● Calls</span>
            <span style="font-size:11.5px;color:#A855F7;">-- Samples</span>
            <span style="font-size:11.5px;color:#10B981;">◉ Sold</span>
            <button class="btn btn-sm" data-chart-days="${chartDays === 30 ? 14 : 30}">
              Show ${chartDays === 30 ? '14D' : '30D'}
            </button>
          </div>
        </div>
        ${render30DayChartSVG(m.series)}
      </div>

      <div class="card" style="display:flex;flex-direction:column;">
        <div class="card-header">
          <div>
            <div class="card-title">⏰ Priority Follow-Ups</div>
            <div class="card-subtitle">Callbacks due today or overdue</div>
          </div>
          <button class="btn btn-sm btn-primary" data-nav-target="followups">View All</button>
        </div>
        <div style="display:flex;flex-direction:column;gap:8px;flex:1;overflow-y:auto;">
          ${
            urgentList.length === 0
              ? `<div style="padding:26px 14px;text-align:center;color:var(--text-muted);font-size:13px;">
                  ✓ Zero overdue callbacks right now! Schedule callbacks in Call Mode to see them here.
                 </div>`
              : urgentList
                  .map(
                    l => `
                  <div style="padding:10px 12px;background:var(--bg-canvas);border:1px solid var(--border-subtle);border-radius:8px;display:flex;align-items:center;justify-content:space-between;gap:8px;">
                    <div style="min-width:0;">
                      <div style="font-weight:700;font-size:13px;cursor:pointer;color:var(--text-primary);" data-open-lead="${l.id}">
                        ${escapeHtml(l.businessName)}
                      </div>
                      <div style="margin-top:3px;">${formatFollowUpBadge(l.nextFollowUp)}</div>
                    </div>
                    <button class="btn btn-sm btn-emerald" data-dial-lead="${l.id}">📞 Dial</button>
                  </div>`
                  )
                  .join('')
          }
        </div>
      </div>
    </div>
  `;
}

export function renderDashboardBottomSection() {
  const topProspects = [...store.getLeads()]
    .filter(l => !['Sold', 'Not Interested', 'Do Not Call'].includes(l.stage))
    .sort((a, b) => b.pitchScore - a.pitchScore)
    .slice(0, 6);

  const soldLeads = store.getLeads().filter(l => l.stage === 'Sold');

  return `
    <!-- Row 3: Top Ranked Prospects by Pitch Score & Revenue Tracker -->
    <div class="dashboard-split">
      <div class="card">
        <div class="card-header">
          <div>
            <div class="card-title">🔥 Highest Pitch Score Prospects Ready to Dial</div>
            <div class="card-subtitle">Ranked automatically by reviews, rating, website gap & Albuquerque category demand</div>
          </div>
          <button class="btn btn-sm" data-nav-target="leads">All ${store.getLeads().length} Leads →</button>
        </div>
        <div class="table-wrap">
          <table class="data-table">
            <thead>
              <tr>
                <th>Score</th>
                <th>Business</th>
                <th>Rating / Reviews</th>
                <th>Web Status</th>
                <th>Best Time to Call</th>
                <th>Action</th>
              </tr>
            </thead>
            <tbody>
              ${topProspects
                .map(
                  l => `
                <tr>
                  <td>${renderPitchBadge(l.pitchScore)}</td>
                  <td>
                    <div style="font-weight:700;cursor:pointer;color:var(--text-primary);" data-open-lead="${l.id}">${escapeHtml(l.businessName)}</div>
                    <div style="font-size:11.5px;color:var(--text-muted);">${renderCategoryBadge(l.category)} · ${escapeHtml(l.phone)}</div>
                  </td>
                  <td class="mono" style="font-size:12.5px;">⭐ ${Number(l.rating).toFixed(1)} <span style="color:var(--text-muted);">(${l.reviewCount})</span></td>
                  <td>${renderWebsiteBadge(l)}</td>
                  <td style="font-size:11.5px;color:var(--text-secondary);max-width:190px;">${escapeHtml(l.bestTimeToCall)}</td>
                  <td>
                    <div style="display:flex;gap:6px;">
                      <button class="btn btn-sm btn-emerald" data-dial-lead="${l.id}">📞 Dial</button>
                      <button class="btn btn-sm" data-open-lead="${l.id}">View</button>
                    </div>
                  </td>
                </tr>`
                )
                .join('')}
            </tbody>
          </table>
        </div>
      </div>

      <div class="card">
        <div class="card-header">
          <div>
            <div class="card-title">💰 Sold Websites & Revenue Tracker</div>
            <div class="card-subtitle">Track agreed price, deposit paid, balance due & paid-in-full status</div>
          </div>
        </div>
        ${
          soldLeads.length === 0
            ? `<div style="padding:26px;text-align:center;color:var(--text-muted);font-size:13px;">
                0 sites sold yet. Mark any lead as <strong>Sold</strong> in Call Mode or Pipeline to track its deposit and balance here.
               </div>`
            : `<div class="table-wrap">
                <table class="data-table">
                  <thead>
                    <tr>
                      <th>Client</th>
                      <th>Agreed</th>
                      <th>Deposit</th>
                      <th>Balance</th>
                      <th>Paid Full</th>
                    </tr>
                  </thead>
                  <tbody>
                    ${soldLeads
                      .map(l => {
                        const agreed = Number(l.deal?.priceAgreed) || 850;
                        const dep = l.deal?.paidInFull ? agreed : Number(l.deal?.depositPaid) || 0;
                        const bal = Math.max(0, agreed - dep);
                        return `
                          <tr>
                            <td>
                              <div style="font-weight:700;cursor:pointer;" data-open-lead="${l.id}">${escapeHtml(l.businessName)}</div>
                            </td>
                            <td class="mono">$${agreed}</td>
                            <td class="mono" style="color:#34D399;">$${dep}</td>
                            <td class="mono" style="color:${bal === 0 ? '#34D399' : '#FBBF24'};">$${bal}</td>
                            <td>
                              <input type="checkbox" data-toggle-paid-full="${l.id}" ${l.deal?.paidInFull ? 'checked' : ''} style="width:16px;height:16px;accent-color:#10B981;cursor:pointer;" />
                            </td>
                          </tr>
                        `;
                      })
                      .join('')}
                  </tbody>
                </table>
               </div>`
        }
      </div>
    </div>
  `;
}

// ============================================================================
// DevEloped LeadDesk — State Store, Persistence, Analytics & Data Utilities
// ============================================================================

import {
  INITIAL_LEADS,
  DEFAULT_SCRIPTS,
  DEFAULT_TEMPLATES,
  calculatePitchScore,
  generatePitchAngle,
  getBestTimeToCall,
  classifyWebsiteUrl,
  getCategoryMeta
} from './seed-data.js';

const STORAGE_KEY = 'developed_leaddesk_crm_v1';

// Helper to format YYYY-MM-DD in local time
export function getLocalDateKey(dateInput = new Date()) {
  const d = dateInput instanceof Date ? dateInput : new Date(dateInput);
  if (isNaN(d.getTime())) return '';
  const year = d.getFullYear();
  const month = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
}

export function normalizePhone(phone = '') {
  return String(phone).replace(/\D/g, '').slice(-10);
}

export function formatPhoneDisplay(phone = '') {
  const digits = normalizePhone(phone);
  if (digits.length === 10) {
    return `(${digits.slice(0, 3)}) ${digits.slice(3, 6)}-${digits.slice(6)}`;
  }
  return phone || 'No Phone';
}

export function slugifyBusinessName(name = '') {
  return String(name)
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/(^-|-$)/g, '') || 'custom-preview';
}

export function fillTemplatePlaceholders(text = '', lead = {}) {
  if (!text) return '';
  const owner = (lead.ownerName || '').trim() || 'there';
  const biz = (lead.businessName || '').trim() || 'your business';
  const sampleLink = (lead.sampleSite?.url || '').trim() || `https://${slugifyBusinessName(biz)}.developedweb.co`;
  const rating = lead.rating ? Number(lead.rating).toFixed(1) : '4.8';
  const reviews = lead.reviewCount ? String(lead.reviewCount) : '40+';
  const city = (lead.city || 'Albuquerque').split(',')[0].trim();
  const category = getCategoryMeta(lead.category).label.toLowerCase();

  return text
    .replace(/\{BusinessName\}/gi, biz)
    .replace(/\{OwnerName\}/gi, owner)
    .replace(/\{SampleLink\}/gi, sampleLink)
    .replace(/\{Rating\}/gi, rating)
    .replace(/\{ReviewCount\}/gi, reviews)
    .replace(/\{City\}/gi, city)
    .replace(/\{Category\}/gi, category);
}

// Create initial state
function createDefaultState() {
  return {
    version: '1.0.0',
    settings: {
      companyName: 'DevEloped Web Co.',
      operatorName: 'Dev',
      defaultCity: 'Albuquerque, NM',
      defaultRadiusMiles: 10,
      dailyCallGoal: 25,
      defaultSitePrice: 850,
      googlePlacesApiKey: '',
      autoAdvanceCallMode: true
    },
    leads: structuredClone(INITIAL_LEADS),
    scripts: structuredClone(DEFAULT_SCRIPTS),
    templates: structuredClone(DEFAULT_TEMPLATES),
    // Historical daily activity log so the 30-day chart is immediately informative & interactive
    dailyHistory: generateBaseline30DayHistory()
  };
}

function generateBaseline30DayHistory() {
  const history = {};
  const now = new Date();
  // Seed modest past activity over the prior 28 days so the 30-day chart has rich visual context
  const sampleDays = [
    { daysAgo: 26, calls: 14, contacts: 6, samples: 3, sold: 0, revenue: 0 },
    { daysAgo: 24, calls: 19, contacts: 8, samples: 4, sold: 1, revenue: 850 },
    { daysAgo: 22, calls: 12, contacts: 5, samples: 2, sold: 0, revenue: 0 },
    { daysAgo: 19, calls: 22, contacts: 10, samples: 5, sold: 0, revenue: 0 },
    { daysAgo: 17, calls: 18, contacts: 7, samples: 3, sold: 1, revenue: 950 },
    { daysAgo: 14, calls: 25, contacts: 11, samples: 6, sold: 0, revenue: 0 },
    { daysAgo: 11, calls: 16, contacts: 7, samples: 4, sold: 1, revenue: 800 },
    { daysAgo: 8, calls: 21, contacts: 9, samples: 5, sold: 0, revenue: 0 },
    { daysAgo: 5, calls: 24, contacts: 12, samples: 6, sold: 1, revenue: 1100 },
    { daysAgo: 3, calls: 15, contacts: 6, samples: 3, sold: 0, revenue: 0 },
    { daysAgo: 1, calls: 18, contacts: 8, samples: 4, sold: 0, revenue: 0 }
  ];

  for (const item of sampleDays) {
    const d = new Date(now);
    d.setDate(d.getDate() - item.daysAgo);
    const key = getLocalDateKey(d);
    history[key] = {
      calls: item.calls,
      contacts: item.contacts,
      samples: item.samples,
      sold: item.sold,
      revenue: item.revenue
    };
  }
  return history;
}

class LeadDeskStore {
  constructor() {
    this.state = this.load();
    this.listeners = new Set();
  }

  load() {
    try {
      const raw = localStorage.getItem(STORAGE_KEY);
      if (!raw) {
        const fresh = createDefaultState();
        localStorage.setItem(STORAGE_KEY, JSON.stringify(fresh));
        return fresh;
      }
      const parsed = JSON.parse(raw);
      // Ensure all leads have up-to-date pitchScore & pitchAngle
      if (Array.isArray(parsed.leads)) {
        parsed.leads = parsed.leads.map(l => this.enrichLead(l));
      } else {
        parsed.leads = structuredClone(INITIAL_LEADS);
      }
      if (!parsed.scripts) parsed.scripts = structuredClone(DEFAULT_SCRIPTS);
      if (!parsed.templates) parsed.templates = structuredClone(DEFAULT_TEMPLATES);
      if (!parsed.settings) parsed.settings = createDefaultState().settings;
      if (!parsed.dailyHistory) parsed.dailyHistory = generateBaseline30DayHistory();
      return parsed;
    } catch (err) {
      console.error('Failed to load state from localStorage, using defaults:', err);
      return createDefaultState();
    }
  }

  save() {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(this.state));
      this.notify();
    } catch (err) {
      console.error('Failed to save state:', err);
    }
  }

  subscribe(fn) {
    this.listeners.add(fn);
    return () => this.listeners.delete(fn);
  }

  notify() {
    for (const fn of this.listeners) {
      fn(this.state);
    }
  }

  enrichLead(lead) {
    const scoreObj = calculatePitchScore(lead);
    const slug = slugifyBusinessName(lead.businessName);
    return {
      id: lead.id || `lead-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`,
      businessName: (lead.businessName || 'Unnamed Business').trim(),
      category: lead.category || 'other',
      phone: formatPhoneDisplay(lead.phone || ''),
      email: lead.email || '',
      ownerName: lead.ownerName || '',
      address: lead.address || '',
      city: lead.city || 'Albuquerque, NM',
      rating: Number(lead.rating) || 4.5,
      reviewCount: Number(lead.reviewCount) || 15,
      websiteStatus: lead.websiteStatus || 'None',
      weakPresenceDetail: lead.weakPresenceDetail || (lead.websiteStatus === 'Weak Presence' ? 'Booking / Social link only' : 'No website'),
      websiteUrl: lead.websiteUrl || '',
      googleMapsUrl: lead.googleMapsUrl || `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent((lead.businessName || '') + ' ' + (lead.address || '') + ' ' + (lead.city || 'Albuquerque NM'))}`,
      stage: lead.stage || 'New Lead',
      temperature: lead.temperature || (scoreObj.total >= 80 ? 'Hot' : 'Warm'),
      nextFollowUp: lead.nextFollowUp || null,
      bestTimeToCall: lead.bestTimeToCall || getBestTimeToCall(lead.category),
      pitchScore: scoreObj.total,
      pitchBreakdown: scoreObj.breakdown,
      pitchAngle: lead.pitchAngle || generatePitchAngle(lead),
      isSampleDemo: Boolean(lead.isSampleDemo),
      sampleSite: {
        url: lead.sampleSite?.url || `https://${slug}.developedweb.co`,
        dateSent: lead.sampleSite?.dateSent || '',
        method: lead.sampleSite?.method || 'Text / SMS'
      },
      deal: {
        priceAgreed: lead.deal?.priceAgreed !== undefined ? Number(lead.deal.priceAgreed) : getCategoryMeta(lead.category).avgPackage,
        depositPaid: Number(lead.deal?.depositPaid) || 0,
        paidInFull: Boolean(lead.deal?.paidInFull)
      },
      notes: Array.isArray(lead.notes) ? lead.notes : [],
      callLogs: Array.isArray(lead.callLogs) ? lead.callLogs : [],
      createdAt: lead.createdAt || new Date().toISOString()
    };
  }

  getLeads() {
    return this.state.leads;
  }

  getLeadById(id) {
    return this.state.leads.find(l => l.id === id) || null;
  }

  addLead(leadData) {
    const newLead = this.enrichLead({
      ...leadData,
      id: `lead-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`,
      createdAt: new Date().toISOString()
    });
    this.state.leads.unshift(newLead);
    this.save();
    return newLead;
  }

  updateLead(id, patch) {
    const idx = this.state.leads.findIndex(l => l.id === id);
    if (idx === -1) return null;
    const current = this.state.leads[idx];
    const merged = {
      ...current,
      ...patch,
      sampleSite: patch.sampleSite ? { ...current.sampleSite, ...patch.sampleSite } : current.sampleSite,
      deal: patch.deal ? { ...current.deal, ...patch.deal } : current.deal
    };
    // Recalculate pitch score if rating, reviews, category, or websiteStatus changed
    const scoreObj = calculatePitchScore(merged);
    merged.pitchScore = scoreObj.total;
    merged.pitchBreakdown = scoreObj.breakdown;
    if (patch.regeneratePitchAngle) {
      merged.pitchAngle = generatePitchAngle(merged);
      delete merged.regeneratePitchAngle;
    }
    this.state.leads[idx] = merged;
    this.save();
    return merged;
  }

  deleteLead(id) {
    this.state.leads = this.state.leads.filter(l => l.id !== id);
    this.save();
  }

  addNote(leadId, text) {
    const lead = this.getLeadById(leadId);
    if (!lead || !text.trim()) return null;
    const note = {
      id: `note-${Date.now()}-${Math.random().toString(36).slice(2, 5)}`,
      createdAt: new Date().toISOString(),
      text: text.trim()
    };
    lead.notes.unshift(note);
    this.save();
    return note;
  }

  // Log a call outcome and automatically transition pipeline stage & follow-up date
  logCallOutcome(leadId, { outcome, notes = '', durationSec = 0, customFollowUp = null, dealInfo = null, sampleUrl = '' }) {
    const lead = this.getLeadById(leadId);
    if (!lead) return null;

    const now = new Date();
    const callEntry = {
      id: `call-${Date.now()}-${Math.random().toString(36).slice(2, 5)}`,
      timestamp: now.toISOString(),
      outcome,
      durationSec: Number(durationSec) || 0,
      notes: notes.trim()
    };
    lead.callLogs.unshift(callEntry);

    if (notes.trim()) {
      lead.notes.unshift({
        id: `note-${Date.now()}`,
        createdAt: now.toISOString(),
        text: `[Call: ${outcome}] ${notes.trim()}`
      });
    }

    // Automatic Stage & Follow-Up & Temperature transitions
    switch (outcome) {
      case 'Sold': {
        lead.stage = 'Sold';
        lead.temperature = 'Hot';
        lead.nextFollowUp = null;
        if (dealInfo) {
          lead.deal = {
            priceAgreed: Number(dealInfo.priceAgreed) || lead.deal.priceAgreed || 850,
            depositPaid: Number(dealInfo.depositPaid) || 0,
            paidInFull: Boolean(dealInfo.paidInFull)
          };
          if (lead.deal.paidInFull) {
            lead.deal.depositPaid = lead.deal.priceAgreed;
          }
        } else if (!lead.deal.depositPaid) {
          lead.deal.depositPaid = Math.round((lead.deal.priceAgreed || 850) / 2);
        }
        break;
      }
      case 'Interested': {
        lead.stage = 'Interested';
        lead.temperature = 'Hot';
        if (customFollowUp) {
          lead.nextFollowUp = customFollowUp;
        } else {
          const tomorrow = new Date(now);
          tomorrow.setDate(tomorrow.getDate() + 1);
          tomorrow.setHours(10, 30, 0, 0);
          lead.nextFollowUp = tomorrow.toISOString();
        }
        break;
      }
      case 'Sample Requested': {
        lead.stage = 'Sample Sent';
        lead.temperature = 'Hot';
        lead.sampleSite = {
          url: sampleUrl || lead.sampleSite?.url || `https://${slugifyBusinessName(lead.businessName)}.developedweb.co`,
          dateSent: now.toISOString(),
          method: lead.sampleSite?.method || 'Text / SMS'
        };
        if (customFollowUp) {
          lead.nextFollowUp = customFollowUp;
        } else {
          const in2Days = new Date(now);
          in2Days.setDate(in2Days.getDate() + 2);
          in2Days.setHours(11, 0, 0, 0);
          lead.nextFollowUp = in2Days.toISOString();
        }
        break;
      }
      case 'Callback': {
        lead.stage = 'Callback Scheduled';
        lead.temperature = lead.temperature === 'Cold' ? 'Warm' : lead.temperature;
        if (customFollowUp) {
          lead.nextFollowUp = customFollowUp;
        } else {
          const tomorrow = new Date(now);
          tomorrow.setDate(tomorrow.getDate() + 1);
          tomorrow.setHours(14, 0, 0, 0);
          lead.nextFollowUp = tomorrow.toISOString();
        }
        break;
      }
      case 'Owner Not There': {
        lead.stage = 'Owner Not There';
        // Auto-suggest trying again in 2 days
        if (customFollowUp) {
          lead.nextFollowUp = customFollowUp;
        } else {
          const in2Days = new Date(now);
          in2Days.setDate(in2Days.getDate() + 2);
          // Pick optimal hour based on category
          const cat = (lead.category || '').toLowerCase();
          if (cat.includes('restaurant') || cat.includes('mexican') || cat.includes('taco') || cat.includes('truck')) {
            in2Days.setHours(14, 30, 0, 0); // 2:30 PM
          } else if (cat.includes('tattoo')) {
            in2Days.setHours(12, 30, 0, 0); // 12:30 PM
          } else {
            in2Days.setHours(10, 30, 0, 0); // 10:30 AM
          }
          lead.nextFollowUp = in2Days.toISOString();
        }
        break;
      }
      case 'Not Interested': {
        lead.stage = 'Not Interested';
        lead.temperature = 'Cold';
        lead.nextFollowUp = null;
        break;
      }
      case 'Wrong Number': {
        lead.stage = 'Not Interested';
        lead.temperature = 'Cold';
        lead.nextFollowUp = null;
        break;
      }
      case 'Do Not Call': {
        lead.stage = 'Do Not Call';
        lead.temperature = 'Cold';
        lead.nextFollowUp = null;
        break;
      }
      default: {
        lead.stage = 'Called';
      }
    }

    this.save();
    return lead;
  }

  // Follow-Ups Categorization (Overdue, Due Today, Upcoming)
  getFollowUpBuckets() {
    const now = new Date();
    const todayKey = getLocalDateKey(now);

    const overdue = [];
    const dueToday = [];
    const upcoming = [];

    for (const lead of this.state.leads) {
      if (!lead.nextFollowUp) continue;
      if (lead.stage === 'Sold' || lead.stage === 'Do Not Call' || lead.stage === 'Not Interested') continue;

      const fDate = new Date(lead.nextFollowUp);
      if (isNaN(fDate.getTime())) continue;
      const fKey = getLocalDateKey(fDate);

      if (fDate < now && fKey !== todayKey) {
        overdue.push(lead);
      } else if (fKey === todayKey) {
        if (fDate < now) {
          overdue.push(lead); // Earlier today and already past due time
        } else {
          dueToday.push(lead);
        }
      } else {
        upcoming.push(lead);
      }
    }

    const sortByTime = (a, b) => new Date(a.nextFollowUp) - new Date(b.nextFollowUp);
    overdue.sort(sortByTime);
    dueToday.sort(sortByTime);
    upcoming.sort(sortByTime);

    return { overdue, dueToday, upcoming };
  }

  // Duplicate Detection by normalized phone OR fuzzy Business Name + Address
  findDuplicateGroups() {
    const leads = this.state.leads;
    const groups = [];
    const visited = new Set();

    for (let i = 0; i < leads.length; i++) {
      if (visited.has(leads[i].id)) continue;
      const a = leads[i];
      const phoneA = normalizePhone(a.phone);
      const nameA = a.businessName.toLowerCase().replace(/[^a-z0-9]/g, '');
      const addrA = (a.address || '').toLowerCase().replace(/[^a-z0-9]/g, '').slice(0, 10);

      const matches = [a];
      for (let j = i + 1; j < leads.length; j++) {
        if (visited.has(leads[j].id)) continue;
        const b = leads[j];
        const phoneB = normalizePhone(b.phone);
        const nameB = b.businessName.toLowerCase().replace(/[^a-z0-9]/g, '');
        const addrB = (b.address || '').toLowerCase().replace(/[^a-z0-9]/g, '').slice(0, 10);

        const samePhone = phoneA.length === 10 && phoneA === phoneB;
        const sameNameAndAddr = nameA.length > 4 && (nameA === nameB || nameA.includes(nameB) || nameB.includes(nameA)) && addrA && addrA === addrB;

        if (samePhone || sameNameAndAddr) {
          matches.push(b);
          visited.add(b.id);
        }
      }

      if (matches.length > 1) {
        visited.add(a.id);
        groups.push({
          reason: normalizePhone(matches[0].phone) === normalizePhone(matches[1].phone) ? 'Identical Phone Number' : 'Matching Name & Address',
          leads: matches
        });
      }
    }
    return groups;
  }

  mergeDuplicateLeads(primaryId, duplicateIds = []) {
    const primary = this.getLeadById(primaryId);
    if (!primary) return null;

    for (const dupId of duplicateIds) {
      if (dupId === primaryId) continue;
      const dup = this.getLeadById(dupId);
      if (!dup) continue;

      if (!primary.ownerName && dup.ownerName) primary.ownerName = dup.ownerName;
      if (!primary.email && dup.email) primary.email = dup.email;
      if ((Number(dup.reviewCount) || 0) > (Number(primary.reviewCount) || 0)) {
        primary.reviewCount = dup.reviewCount;
      }
      if ((Number(dup.rating) || 0) > (Number(primary.rating) || 0)) {
        primary.rating = dup.rating;
      }
      if (!primary.sampleSite?.dateSent && dup.sampleSite?.dateSent) {
        primary.sampleSite = { ...dup.sampleSite };
      }
      // Combine notes & call logs chronologically
      primary.notes = [...primary.notes, ...dup.notes].sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
      primary.callLogs = [...primary.callLogs, ...dup.callLogs].sort((a, b) => new Date(b.timestamp) - new Date(a.timestamp));

      // Remove duplicate
      this.state.leads = this.state.leads.filter(l => l.id !== dupId);
    }

    this.updateLead(primaryId, primary);
    return primary;
  }

  // Dashboard Metrics & 30-Day Series
  getDashboardMetrics(daysRange = 30) {
    const now = new Date();
    const todayKey = getLocalDateKey(now);

    let liveCallsToday = 0;
    let liveTotalCalls = 0;
    let livePositiveContacts = 0;

    const liveByDay = {};

    for (const lead of this.state.leads) {
      for (const call of lead.callLogs || []) {
        liveTotalCalls++;
        const cKey = getLocalDateKey(call.timestamp);
        if (cKey === todayKey) liveCallsToday++;

        if (!liveByDay[cKey]) {
          liveByDay[cKey] = { calls: 0, contacts: 0, samples: 0, sold: 0, revenue: 0 };
        }
        liveByDay[cKey].calls++;

        const isContact = ['Sold', 'Interested', 'Sample Requested', 'Callback', 'Not Interested'].includes(call.outcome);
        if (isContact) {
          livePositiveContacts++;
          liveByDay[cKey].contacts++;
        }
        if (call.outcome === 'Sample Requested') {
          liveByDay[cKey].samples++;
        }
        if (call.outcome === 'Sold') {
          liveByDay[cKey].sold++;
          liveByDay[cKey].revenue += Number(lead.deal?.priceAgreed) || 850;
        }
      }
    }

    // Combine baseline 30-day history with live call logs
    const series = [];
    let historyCalls = 0;
    let historyContacts = 0;

    for (let i = daysRange - 1; i >= 0; i--) {
      const d = new Date(now);
      d.setDate(d.getDate() - i);
      const key = getLocalDateKey(d);
      const base = this.state.dailyHistory?.[key] || { calls: 0, contacts: 0, samples: 0, sold: 0, revenue: 0 };
      const live = liveByDay[key] || { calls: 0, contacts: 0, samples: 0, sold: 0, revenue: 0 };

      const dayCalls = base.calls + live.calls;
      const dayContacts = base.contacts + live.contacts;
      const daySamples = base.samples + live.samples;
      const daySold = base.sold + live.sold;
      const dayRev = base.revenue + live.revenue;

      historyCalls += base.calls;
      historyContacts += base.contacts;

      series.push({
        dateKey: key,
        label: d.toLocaleDateString('en-US', { month: 'short', day: 'numeric' }),
        calls: dayCalls,
        contacts: dayContacts,
        samples: daySamples,
        sold: daySold,
        revenue: dayRev
      });
    }

    const totalCallsAll = historyCalls + liveTotalCalls;
    const totalContactsAll = historyContacts + livePositiveContacts;
    const contactRate = totalCallsAll > 0 ? Math.round((totalContactsAll / totalCallsAll) * 100) : 0;

    const soldLeads = this.state.leads.filter(l => l.stage === 'Sold');
    const samplesSentLeads = this.state.leads.filter(
      l => l.stage === 'Sample Sent' || l.stage === 'Sold' || Boolean(l.sampleSite?.dateSent)
    );

    // Baseline historical sales + live sold leads
    const baselineSoldCount = Object.values(this.state.dailyHistory || {}).reduce((acc, d) => acc + (d.sold || 0), 0);
    const baselineRevenue = Object.values(this.state.dailyHistory || {}).reduce((acc, d) => acc + (d.revenue || 0), 0);
    const baselineSamplesCount = Object.values(this.state.dailyHistory || {}).reduce((acc, d) => acc + (d.samples || 0), 0);

    const liveSoldRevenueContracted = soldLeads.reduce((sum, l) => sum + (Number(l.deal?.priceAgreed) || 850), 0);
    const liveSoldRevenueCollected = soldLeads.reduce((sum, l) => {
      if (l.deal?.paidInFull) return sum + (Number(l.deal?.priceAgreed) || 850);
      return sum + (Number(l.deal?.depositPaid) || 0);
    }, 0);
    const liveBalanceDue = Math.max(0, liveSoldRevenueContracted - liveSoldRevenueCollected);

    const totalSitesSold = soldLeads.length + baselineSoldCount;
    const totalRevenueContracted = liveSoldRevenueContracted + baselineRevenue;
    const totalRevenueCollected = liveSoldRevenueCollected + baselineRevenue;
    const avgSalePrice = totalSitesSold > 0 ? Math.round(totalRevenueContracted / totalSitesSold) : 850;
    const totalSamplesSent = samplesSentLeads.length + baselineSamplesCount;

    // Active Pipeline Value (all active stages excluding Not Interested, Do Not Call, Sold)
    const activeLeads = this.state.leads.filter(
      l => !['Sold', 'Not Interested', 'Do Not Call'].includes(l.stage)
    );
    const pipelineValue = activeLeads.reduce((sum, l) => sum + (Number(l.deal?.priceAgreed) || 850), 0);

    const followUps = this.getFollowUpBuckets();

    return {
      callsToday: liveCallsToday,
      dailyCallGoal: this.state.settings.dailyCallGoal || 25,
      totalCalls: totalCallsAll,
      contactRate,
      samplesSent: totalSamplesSent,
      sitesSold: totalSitesSold,
      liveSoldCount: soldLeads.length,
      totalRevenueContracted,
      totalRevenueCollected,
      liveBalanceDue,
      avgSalePrice,
      pipelineValue,
      activePipelineCount: activeLeads.length,
      followUpsDueTodayCount: followUps.dueToday.length,
      followUpsOverdueCount: followUps.overdue.length,
      followUpsTotalActionable: followUps.dueToday.length + followUps.overdue.length,
      series
    };
  }

  // Export CSV
  exportToCSV() {
    const headers = [
      'Business Name',
      'Category',
      'Phone',
      'Owner Name',
      'Email',
      'Address',
      'City',
      'Rating',
      'Reviews',
      'Website Status',
      'Weak Presence Detail',
      'Pitch Score',
      'Stage',
      'Temperature',
      'Next Follow-Up',
      'Sample Site URL',
      'Deal Price Agreed',
      'Deposit Paid',
      'Paid In Full',
      'Google Maps URL',
      'Pitch Angle'
    ];

    const escapeCSV = val => {
      const str = String(val ?? '');
      if (str.includes(',') || str.includes('"') || str.includes('\n')) {
        return `"${str.replace(/"/g, '""')}"`;
      }
      return str;
    };

    const rows = this.state.leads.map(l => [
      l.businessName,
      l.category,
      l.phone,
      l.ownerName,
      l.email,
      l.address,
      l.city,
      l.rating,
      l.reviewCount,
      l.websiteStatus,
      l.weakPresenceDetail,
      l.pitchScore,
      l.stage,
      l.temperature,
      l.nextFollowUp || '',
      l.sampleSite?.url || '',
      l.deal?.priceAgreed || 0,
      l.deal?.depositPaid || 0,
      l.deal?.paidInFull ? 'Yes' : 'No',
      l.googleMapsUrl,
      l.pitchAngle
    ].map(escapeCSV).join(','));

    return [headers.join(','), ...rows].join('\n');
  }

  // Export Full JSON Backup
  exportFullBackupJSON() {
    return JSON.stringify(
      {
        exportedAt: new Date().toISOString(),
        app: 'DevEloped LeadDesk',
        company: 'DevEloped Web Co.',
        state: this.state
      },
      null,
      2
    );
  }

  // Restore Full JSON Backup
  restoreFromBackupJSON(jsonString) {
    const parsed = JSON.parse(jsonString);
    const nextState = parsed.state ? parsed.state : parsed;
    if (!Array.isArray(nextState.leads)) {
      throw new Error('Invalid backup file: missing leads array');
    }
    nextState.leads = nextState.leads.map(l => this.enrichLead(l));
    this.state = {
      ...createDefaultState(),
      ...nextState
    };
    this.save();
    return this.state;
  }

  resetToFactorySeed() {
    this.state = createDefaultState();
    this.save();
    return this.state;
  }
}

export const store = new LeadDeskStore();
